const indicators = require('./indicators');
const upbitClient = require('../upbit/upbitClient');
const config = require('../config');
const slotManager = require('./slotManager');
const surgeDetector = require('./surgeDetector');

class StrategyEngine {
  constructor() {
    this.settings = { ...config.TRADING };
    this.isRunning = true; // 기본 가동 상태
    this.analysisInterval = null;
    this.pendingApproval = null;
    this.tradeHistory = [];
    this.signalListeners = new Set();
    this.lastSignalTime = 0;
    this.signalCooldownMs = 10000; // 동일 급등 10초 쿨다운

    // 🛡️ 비트코인 커플링 하락 방어 상태
    this.btcBuffer = []; // KRW-BTC 틱 버퍼 (5분)
    this.btcProtection = {
      active: false,
      dropRate: 0,
      currentPrice: 0,
      peakPrice: 0,
      reason: '정상',
      updatedAt: Date.now()
    };

    this.initSurgeAndSlots();
  }

  initSurgeAndSlots() {
    // 1. 급등 감지 이벤트 리스너 등록
    surgeDetector.onSurge(async (surge) => {
      if (!this.isRunning) return;

      // 🛡️ [타임 블록 필터] 위험 시간대 신규 매수 일시정지 체크 (다중 시간대 및 자정 초과 완벽 지원)
      if (Array.isArray(this.settings.BUY_TIME_BLOCKS) && this.settings.BUY_TIME_BLOCKS.length > 0) {
        const nowObj = new Date();
        const curTotalMin = nowObj.getHours() * 60 + nowObj.getMinutes();
        for (const block of this.settings.BUY_TIME_BLOCKS) {
          if (!block.enabled || !block.start || !block.end) continue;
          const [sH, sM] = block.start.split(':').map(Number);
          const [eH, eM] = block.end.split(':').map(Number);
          const startMin = sH * 60 + sM;
          const endMin = eH * 60 + eM;
          const isInRange = (startMin <= endMin)
            ? (curTotalMin >= startMin && curTotalMin <= endMin)
            : (curTotalMin >= startMin || curTotalMin <= endMin);
          if (isInRange) {
            console.log(`ℹ️ [다중 타임블록 매수 차단] ${block.label || ''} (${block.start}~${block.end}) 위험 시간대이므로 신규 매수를 건너뜁니다.`);
            return;
          }
        }
      } else if (this.settings.TIME_BLOCK_ENABLED) {
        const nowObj = new Date();
        const curTotalMin = nowObj.getHours() * 60 + nowObj.getMinutes();
        const [sH, sM] = (this.settings.TIME_BLOCK_START || '08:50').split(':').map(Number);
        const [eH, eM] = (this.settings.TIME_BLOCK_END || '09:30').split(':').map(Number);
        const startMin = sH * 60 + sM;
        const endMin = eH * 60 + eM;
        const isInRange = (startMin <= endMin)
          ? (curTotalMin >= startMin && curTotalMin <= endMin)
          : (curTotalMin >= startMin || curTotalMin <= endMin);
        if (isInRange) {
          console.log(`ℹ️ [타임블록 매수 차단] ${this.settings.TIME_BLOCK_START}~${this.settings.TIME_BLOCK_END} 위험 시간대이므로 신규 매수를 건너뜁니다.`);
          return;
        }
      }

      // 🚫 제외 코인(EXCLUDED_MARKETS) 이중 방어 체크
      if (Array.isArray(this.settings.EXCLUDED_MARKETS)) {
        const excluded = this.settings.EXCLUDED_MARKETS.map(m => String(m).trim().toUpperCase());
        const shortSym = (surge.market || '').replace('KRW-', '').toUpperCase();
        if (excluded.includes((surge.market || '').toUpperCase()) || excluded.includes(shortSym) || excluded.includes(`KRW-${shortSym}`)) {
          console.log(`ℹ️ [급등 감지 제외] ${surge.market}은(는) 제외 코인 목록에 등록되어 있어 매수를 건너뜁니다.`);
          return;
        }
      }

      // 🛡️ [알고리즘 2번] 비트코인 커플링 필터 (BTC 급락 중 알트코인 연쇄 폭락 방어)
      if (this.settings.BTC_PROTECTION_ENABLED !== false && this.btcProtection?.active && surge.market !== 'KRW-BTC') {
        console.log(`🛡️ [BTC 하락 매수 보호 가동] ${this.btcProtection.reason} -> 알트코인 [${surge.market}] 매수 진입을 안전하게 차단합니다.`);
        this.emitSignal({
          type: 'BTC_PROTECTION_BLOCKED',
          market: surge.market,
          reason: this.btcProtection.reason,
          message: `🛡️ [BTC 하락 방어] 비트코인 급락(${this.btcProtection.dropRate}%) 감지로 [${surge.market}] 매수를 안전하게 차단했습니다.`
        });
        return;
      }

      const availableSlot = slotManager.getAvailableSlot(surge.market);
      if (!availableSlot) {
        console.log(`ℹ️ [급등 감지됨] ${surge.market}이나 현재 비어있는 사용 가능 슬롯이 없습니다.`);
        return;
      }

      // 업비트 최소 주문 금액(5,000원) 보정
      let tradeAmount = Number(availableSlot.tradeAmountKrw || 50000);
      if (tradeAmount < 5000) {
        tradeAmount = 5000;
      }

      // ----------------------------------------------------
      // [1단계] 🚨 급등 코인 발견 알림 & 슬롯 예약 (3초 카운트다운 시작)
      // ----------------------------------------------------
      slotManager.reserveSurgeSlot(availableSlot.slotId, {
        market: surge.market,
        surgeInfo: surge,
        countdownSeconds: 3
      });

      this.emitSignal({
        type: 'SURGE_DISCOVERED',
        slotId: availableSlot.slotId,
        slotName: availableSlot.name,
        market: surge.market,
        surgeInfo: surge,
        countdown: 3,
        message: `🚨 [급등 포착] ${surge.market} ${surge.reason} ➔ 3초 후 슬롯 ${availableSlot.slotId}번에 자동 매수 진입합니다!`
      });

      // ----------------------------------------------------
      // [2단계] ⏱️ 발견 알림 후 정확히 3초 뒤 호가창 및 ATR 점검 후 시장가 매수 실행
      // ----------------------------------------------------
      setTimeout(async () => {
        // 3초 후 슬롯 상태 재확인 (엔진 정지 여부 체크)
        if (!this.isRunning) {
          slotManager.clearPosition(availableSlot.slotId);
          return;
        }

        // 🛡️ [알고리즘 1번] 호가창 불균형 필터 (가짜 펌핑 방어) & 호가 갭(스프레드) 검증
        if (this.settings.ORDERBOOK_FILTER_ENABLED !== false) {
          try {
            const obData = await upbitClient.getOrderbook(surge.market);
            if (Array.isArray(obData) && obData.length > 0) {
              const ob = obData[0];
              const totalBid = Number(ob.total_bid_size || 0);
              const totalAsk = Number(ob.total_ask_size || 0);
              const totalSize = totalBid + totalAsk;
              const bidRatio = totalSize > 0 ? (totalBid / totalSize) * 100 : 50;
              const minBidRatio = Number(this.settings.ORDERBOOK_MIN_BID_RATIO) || 35.0;

              if (bidRatio < minBidRatio) {
                console.warn(`🚫 [호가창 불균형 차단] ${surge.market} 매수잔량 비율 ${bidRatio.toFixed(1)}% < 기준 ${minBidRatio}% (가짜 펌핑/허매수 의심) -> 매수 취소`);
                slotManager.clearPosition(availableSlot.slotId);
                this.emitSignal({
                  type: 'ORDERBOOK_FILTER_BLOCKED',
                  slotId: availableSlot.slotId,
                  market: surge.market,
                  bidRatio: Number(bidRatio.toFixed(1)),
                  minBidRatio,
                  message: `🚫 [가짜 펌핑 방어] ${surge.market} 호가창 매수비율(${bidRatio.toFixed(1)}%) 부족으로 매수를 안전하게 취소했습니다.`
                });
                return;
              }

              // 🛡️ [호가 갭 방어] 최우선 매도호가와 매수호가 간격(스프레드) 상한 검증 (0.4% 초과 시 매수 차단)
              if (Array.isArray(ob.orderbook_units) && ob.orderbook_units.length > 0) {
                const topUnit = ob.orderbook_units[0];
                const askPrice = Number(topUnit.ask_price || 0);
                const bidPrice = Number(topUnit.bid_price || 0);
                if (bidPrice > 0 && askPrice > 0) {
                  const spreadPct = ((askPrice - bidPrice) / bidPrice) * 100;
                  const maxSpread = Number(this.settings.ORDERBOOK_MAX_SPREAD_PCT) || 0.40;
                  if (spreadPct > maxSpread) {
                    console.warn(`🚫 [호가 스프레드 과대 차단] ${surge.market} 호가 갭 ${spreadPct.toFixed(2)}% > 기준 ${maxSpread}% (슬리피지 손실 방어) -> 매수 취소`);
                    slotManager.clearPosition(availableSlot.slotId);
                    this.emitSignal({
                      type: 'SPREAD_FILTER_BLOCKED',
                      slotId: availableSlot.slotId,
                      market: surge.market,
                      spreadPct: Number(spreadPct.toFixed(2)),
                      maxSpread,
                      message: `🚫 [호가 갭 방어] ${surge.market} 호가 갭(${spreadPct.toFixed(2)}%)이 기준(${maxSpread}%)을 초과하여 매수를 안전하게 취소했습니다.`
                    });
                    return;
                  }
                  console.log(`✅ [호가 스프레드 검증 통과] ${surge.market} 스프레드: ${spreadPct.toFixed(2)}% (기준 ${maxSpread}% 이하 정상)`);
                }
              }

              console.log(`✅ [호가창 검증 통과] ${surge.market} 매수비율: ${bidRatio.toFixed(1)}% (기준 ${minBidRatio}% 이상 확보)`);
            }
          } catch (obErr) {
            console.warn(`⚠️ [호가창 검증 경고] ${surge.market} 호가 조회 지연: ${obErr.message}`);
          }
        }

        // 💰 [원화 고갈 방어 버퍼] 최소 비상 원화 잔고 (20,000원) 유지 확인
        try {
          const accounts = await upbitClient.getAccounts();
          const krwAcc = accounts.find(a => a.currency === 'KRW');
          const krwBalance = krwAcc ? Number(krwAcc.balance) : 0;
          const minReserve = Number(this.settings.MIN_KRW_RESERVE_BUFFER) || 20000;
          if (krwBalance - minReserve < tradeAmount) {
            console.warn(`⚠️ [원화 잔고 부족 차단] KRW 잔고(${krwBalance.toLocaleString()}원) - 비상버퍼(${minReserve.toLocaleString()}원) < 주문금액(${tradeAmount.toLocaleString()}원) -> 매수 취소`);
            slotManager.clearPosition(availableSlot.slotId);
            this.emitSignal({
              type: 'INSUFFICIENT_KRW_BUFFER_BLOCKED',
              slotId: availableSlot.slotId,
              market: surge.market,
              krwBalance,
              minReserve,
              tradeAmount,
              message: `⚠️ [원화 잔고 부족] 비상 안전버퍼(${minReserve.toLocaleString()}원) 유지를 위해 [${surge.market}] 매수를 보류했습니다.`
            });
            return;
          }
        } catch (accErr) {
          console.warn(`⚠️ [계좌 잔고 조회 경고] ${accErr.message}`);
        }

        // ⚙️ [알고리즘 4번] AI 동적 변동성 ATR 손절선 산출 (해당 슬롯이 ON 상태일 때)
        let dynamicStopLossPct = null;
        if (availableSlot.useAtrStopLoss) {
          try {
            const candles = await upbitClient.getMinuteCandles(surge.market, 1, 30);
            const atrResult = indicators.calculateATR(candles, Number(this.settings.ATR_PERIOD) || 14);
            if (atrResult && atrResult.atrPct) {
              const multiplier = Number(this.settings.ATR_MULTIPLIER) || 1.5;
              const minStop = Number(this.settings.ATR_MIN_STOP_PCT) || 1.2;
              const maxStop = Number(this.settings.ATR_MAX_STOP_PCT) || 4.5;
              const rawStop = atrResult.atrPct * multiplier;
              dynamicStopLossPct = Number(Math.min(Math.max(rawStop, minStop), maxStop).toFixed(2));
              console.log(`⚙️ [AI 동적 변동성 손절 산출] ${surge.market} ATR: ${atrResult.currentATR} (${atrResult.atrPct}%) -> 동적 손절선: -${dynamicStopLossPct}%`);
            }
          } catch (atrErr) {
            console.warn(`[ATR 계산 실패] ${surge.market}: ${atrErr.message}`);
          }
        }

        const buySignal = {
          id: `SIG-BUY-${Date.now()}`,
          type: 'BUY',
          slotId: availableSlot.slotId,
          slotName: availableSlot.name,
          market: surge.market,
          price: surge.currentPrice,
          amount: tradeAmount,
          dynamicStopLossPct,
          reason: `${availableSlot.name}: ${surge.reason}${dynamicStopLossPct ? ` [AI 동적 손절선: -${dynamicStopLossPct}%]` : ''}`,
          surgeInfo: surge,
          createdAt: new Date().toISOString()
        };

        console.log(`⚡ [3초 딜레이 만료] 슬롯 ${availableSlot.slotId}번 -> ${surge.market} (${tradeAmount.toLocaleString()}원) 시장가 매수 집행!`);

        try {
          await this.executeTrade(buySignal, 'AUTO_BUY_SURGE_3S_DELAY');
        } catch (err) {
          console.error(`❌ [매수 실행 실패] ${surge.market}:`, err.message);
          slotManager.clearPosition(availableSlot.slotId);
        }
      }, 3000);
    });

    // 2. 슬롯 이벤트 전파
    slotManager.onSlotEvent((event) => {
      this.emitSignal(event);
    });
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ Strategy settings updated:', this.settings);
  }

  onSignal(listener) {
    this.signalListeners.add(listener);
    return () => this.signalListeners.delete(listener);
  }

  emitSignal(signalData) {
    for (const listener of this.signalListeners) {
      try {
        listener(signalData);
      } catch (err) {
        console.error('Error emitting signal:', err);
      }
    }
  }

  async start(intervalMs = 5000) {
    if (this.isRunning && this.analysisInterval) return;
    this.isRunning = true;
    console.log('🚀 Strategy Engine started. Analyzing market every', intervalMs / 1000, 'seconds.');

    this.analysisInterval = setInterval(() => {
      this.analyzeMarket().catch(err => console.error('Analysis error:', err.message));
    }, intervalMs);

    this.analyzeMarket().catch(err => console.error('Initial analysis error:', err.message));
  }

  stop() {
    this.isRunning = false;
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    console.log('🛑 Strategy Engine stopped.');
  }

  /**
   * 🛡️ [알고리즘 2번] 비트코인(KRW-BTC) 5분 롤링 윈도우 하락률 및 보호 상태 실시간 산출
   */
  updateBtcProtectionStatus(tick) {
    const price = Number(tick.trade_price);
    if (!price || isNaN(price)) return;
    const now = Date.now();

    this.btcBuffer.push({ price, timestamp: now });
    // 5분(300초) 롤링 윈도우 유지
    const windowMs = 5 * 60 * 1000;
    const cutoff = now - windowMs;
    while (this.btcBuffer.length > 0 && this.btcBuffer[0].timestamp < cutoff) {
      this.btcBuffer.shift();
    }

    if (this.btcBuffer.length < 2) return;

    // 윈도우 내 최고가 탐색
    let maxPrice = this.btcBuffer[0].price;
    for (let i = 0; i < this.btcBuffer.length; i++) {
      if (this.btcBuffer[i].price > maxPrice) maxPrice = this.btcBuffer[i].price;
    }

    const dropRate = ((price - maxPrice) / maxPrice) * 100;
    const threshold = Number(this.settings.BTC_DROP_THRESHOLD_PCT) || 0.7; // 기본 0.7% 이상 하락 시

    const isDropping = dropRate <= -threshold;
    const prevActive = this.btcProtection.active;

    this.btcProtection = {
      active: isDropping,
      dropRate: Number(dropRate.toFixed(2)),
      currentPrice: price,
      peakPrice: maxPrice,
      reason: isDropping ? `비트코인 5분 고점 대비 ${dropRate.toFixed(2)}% 급락 감지` : '정상',
      updatedAt: now
    };

    if (prevActive !== isDropping) {
      console.log(`🛡️ [BTC 매수 보호 상태 변경] active: ${isDropping} (5분 변동: ${dropRate.toFixed(2)}%)`);
      this.emitSignal({
        type: 'BTC_PROTECTION_STATUS',
        protection: this.btcProtection
      });
    }
  }

  /**
   * 실시간 WebSocket 틱 데이터 수신 시 처리
   */
  async processRealtimeTick(tick) {
    if (!this.isRunning) return;

    // 🛡️ [알고리즘 2번] 비트코인 틱 감시 및 하락 커플링 보호 상태 실시간 업데이트
    if (tick.code === 'KRW-BTC') {
      this.updateBtcProtectionStatus(tick);
    }

    // 1. 급등 감지기 틱 피딩
    surgeDetector.processTick(tick, this.settings);

    // 2. 트레일링 스탑, 수익 보존 락, 타임아웃 & 손절매 실시간 평가
    const exitSignal = slotManager.evaluatePrice(tick.code, tick.trade_price, this.settings);
    if (exitSignal) {
      await this.handleExitSignal(exitSignal, 'REALTIME_TICK_TRIGGER');
    }
  }

  async analyzeMarket() {
    if (!this.isRunning) return;

    const holdingSlots = slotManager.slots.filter(s => s.isEnabled && s.positionStatus !== 'IDLE' && s.targetMarket);
    if (holdingSlots.length === 0) return;

    for (const slot of holdingSlots) {
      const market = slot.targetMarket;
      try {
        const ticker = await upbitClient.getTicker(market);
        if (!ticker || !ticker[0]) continue;

        const currentPrice = ticker[0].trade_price;
        const exitSignal = slotManager.evaluatePrice(market, currentPrice, this.settings);

        if (exitSignal) {
          await this.handleExitSignal(exitSignal, 'POLLING_EXIT_TRIGGER');
        }
      } catch (err) {
        // Quiet
      }
    }
  }

  /**
   * 🚨 종합 청산 신호 처리기 (수익보존락 / 트레일링스탑 / ATR손절 / 2단계 타임아웃)
   */
  async handleExitSignal(exitSignal, triggerSource = 'REALTIME_TICK_TRIGGER') {
    if (!exitSignal) return;

    // ⏳ 1단계: 14분 정체 코인 본전 최우선 지정가 매도 주문 접수 (운영자 피드백 3번)
    if (exitSignal.action === 'TIMEOUT_LIMIT_EXIT') {
      try {
        console.log(`⏳ [정체 코인 1단계 본전 매도 주문 접수] 슬롯 ${exitSignal.slotId}번 ${exitSignal.market} @ ${exitSignal.entryPrice.toLocaleString()} KRW (수량: ${exitSignal.volume})`);
        const limitOrder = await upbitClient.createOrder({
          market: exitSignal.market,
          side: 'ask',
          volume: exitSignal.volume,
          price: exitSignal.entryPrice,
          ord_type: 'limit'
        });
        slotManager.updateTimeoutStep(exitSignal.slotId, 'LIMIT_SUBMITTED', limitOrder?.uuid || null);
        this.emitSignal({
          type: 'TIMEOUT_LIMIT_ORDER_SUBMITTED',
          slotId: exitSignal.slotId,
          market: exitSignal.market,
          orderUuid: limitOrder?.uuid,
          entryPrice: exitSignal.entryPrice,
          message: `⏳ [14분 타임아웃 1단계] ${exitSignal.market} 본전(${exitSignal.entryPrice.toLocaleString()}원) 지정가 매도를 접수했습니다. (1분간 체결 대기)`
        });
      } catch (limitErr) {
        console.warn(`⚠️ [1단계 지정가 주문 실패 -> 시장가 준비]: ${limitErr.message}`);
        slotManager.updateTimeoutStep(exitSignal.slotId, 'LIMIT_SUBMITTED', null);
      }
      return;
    }

    // ⏳ 2단계: 15분 정체 타임아웃 만료 시 1단계 미체결 지정가 취소 후 시장가 즉시 청산
    if (exitSignal.action === 'TIMEOUT_MARKET_EXIT') {
      if (exitSignal.limitOrderUuid) {
        try {
          console.log(`⏳ [정체 코인 2단계] 1단계 미체결 지정가 주문(${exitSignal.limitOrderUuid}) 취소 접수...`);
          await upbitClient.cancelOrder(exitSignal.limitOrderUuid);
        } catch (cancelErr) {
          // 이미 체결되었거나 취소된 경우 무시
        }
      }
      slotManager.updateTimeoutStep(exitSignal.slotId, 'MARKET_CLOSED');
    }

    // 🚨 일반 시장가 매도 신호 생성 및 집행 (수익보존락, 트레일링스탑, ATR손절, 2단계 타임아웃)
    const sellSignal = {
      id: `SIG-SELL-${Date.now()}`,
      type: 'SELL',
      slotId: exitSignal.slotId,
      slotName: `${exitSignal.slotId}번 슬롯`,
      market: exitSignal.market,
      entryPrice: exitSignal.entryPrice,
      price: exitSignal.currentPrice,
      volume: exitSignal.volume,
      profitPct: exitSignal.profitRate,
      profitKrw: exitSignal.profitKrw,
      highestProfitPct: exitSignal.highestProfitPct,
      reason: exitSignal.reason,
      createdAt: new Date().toISOString()
    };

    console.log(`🚨 [매도 실행: ${exitSignal.action}] 슬롯 ${exitSignal.slotId}번 ${exitSignal.market} (순수익률: ${exitSignal.profitRate.toFixed(2)}%) -> 시장가 매도 집행!`);

    try {
      await this.executeTrade(sellSignal, triggerSource);
    } catch (err) {
      console.error(`❌ [매도 실행 실패] ${exitSignal.market}:`, err.message);
    }
  }

  async triggerSignal(signal) {
    const now = Date.now();
    if (now - this.lastSignalTime < this.signalCooldownMs) return;

    this.lastSignalTime = now;
    const signalId = `SIG-${now}`;
    const fullSignal = {
      id: signalId,
      ...signal,
      createdAt: new Date().toISOString(),
      status: 'AUTO_EXECUTING'
    };

    this.emitSignal({ type: 'TRADE_SIGNAL', signal: fullSignal });

    // ⚡ 100% 완전 자동 매매: 승인 대기 없이 즉각 시장가 매수/매도 집행
    try {
      await this.executeTrade(fullSignal, 'AUTO_SIGNAL_TRIGGER');
    } catch (err) {
      console.error(`❌ [자동 매매 집행 실패] ${fullSignal.market}:`, err.message);
    }
  }

  async executeTrade(signal, triggerType) {
    try {
      console.log(`🚀 Executing Trade [${signal.type}] for ${signal.market} (${signal.slotId ? `Slot ${signal.slotId}` : 'No Slot'}) triggered by ${triggerType}`);
      let orderResult = null;

      if (signal.type === 'BUY') {
        // 시장가 매수 (원화 금액 기준)
        orderResult = await upbitClient.createOrder({
          market: signal.market,
          side: 'bid',
          price: signal.amount,
          ord_type: 'price'
        });

        const targetSlotId = signal.slotId || (slotManager.getAvailableSlot(signal.market) || {}).slotId || 1;
        const estimatedVolume = signal.amount / signal.price;

        slotManager.assignPosition(targetSlotId, {
          market: signal.market,
          entryPrice: signal.price,
          entryVolume: estimatedVolume,
          entryAmountKrw: signal.amount,
          dynamicStopLossPct: signal.dynamicStopLossPct || null
        });

        // 🔄 [운영자 피드백 1번] 주문 완료('done') 대기 후 실제 체결 평균단가/수량 비동기 동기화 (부분 체결 예외 처리)
        if (orderResult && orderResult.uuid) {
          this.syncRealOrderAveragePrice(targetSlotId, signal.market, orderResult.uuid, signal.price, estimatedVolume, signal.amount);
        }

      } else if (signal.type === 'SELL') {
        // 시장가 매도 (보유 수량 전량)
        // 실제 업비트 계좌의 잔고를 한번 더 확인하여 정확한 수량으로 매도
        let sellVolume = signal.volume;
        try {
          const accounts = await upbitClient.getAccounts();
          const currency = signal.market.replace('KRW-', '');
          const coinAcc = accounts.find(a => a.currency === currency);
          if (coinAcc && Number(coinAcc.balance) > 0) {
            sellVolume = Number(coinAcc.balance);
          }
        } catch (e) {
          // Fallback to estimated volume
        }

        orderResult = await upbitClient.createOrder({
          market: signal.market,
          side: 'ask',
          volume: sellVolume,
          ord_type: 'market'
        });

        // 손익 계산 및 통계 누적
        const isProfit = (Number(signal.profitPct) || 0) >= 0;
        const profitKrw = Number(signal.profitKrw) || 0;
        
        if (signal.slotId) {
          slotManager.recordTrade(signal.slotId, isProfit, profitKrw);
          slotManager.clearPosition(signal.slotId);
        } else {
          const holding = slotManager.getHoldingSlot(signal.market);
          if (holding) {
            slotManager.recordTrade(holding.slotId, isProfit, profitKrw);
            slotManager.clearPosition(holding.slotId);
          }
        }
      }

      signal.status = 'EXECUTED';
      signal.orderResult = orderResult;
      signal.executedAt = new Date().toISOString();
      this.tradeHistory.unshift(signal);
      this.pendingApproval = null;

      this.emitSignal({ type: 'TRADE_EXECUTED', signal, orderResult });
      return orderResult;
    } catch (err) {
      signal.status = 'FAILED';
      signal.error = err.message || err;
      this.pendingApproval = null;
      this.emitSignal({ type: 'TRADE_FAILED', signal, error: signal.error });
      throw err;
    }
  }

  /**
   * 🔄 [운영자 피드백 1번] 주문 완전 체결('done') 대기 후 실제 평단가/수량 동기화 (부분 체결 예외 처리 완비)
   */
  async syncRealOrderAveragePrice(slotId, market, orderUuid, fallbackPrice, fallbackVolume, orderAmountKrw) {
    if (!orderUuid) return;

    const maxAttempts = 10;
    const intervalMs = 500;
    let attempts = 0;

    const pollTimer = setInterval(async () => {
      attempts++;
      try {
        const orderData = await upbitClient.getOrder(orderUuid);
        if (orderData) {
          // 주문 완료(done) 또는 부분체결 후 취소(cancel) 시 최종 체결가 확정
          if (orderData.state === 'done' || orderData.state === 'cancel') {
            clearInterval(pollTimer);

            const executedVolume = Number(orderData.executed_volume || 0);
            let realAvgPrice = fallbackPrice;
            let realTotalKrw = orderAmountKrw;

            if (Array.isArray(orderData.trades) && orderData.trades.length > 0) {
              const totalFunds = orderData.trades.reduce((acc, t) => acc + Number(t.funds || (Number(t.price) * Number(t.volume))), 0);
              if (executedVolume > 0 && totalFunds > 0) {
                realAvgPrice = Math.round((totalFunds / executedVolume) * 100) / 100;
                realTotalKrw = totalFunds;
              }
            } else if (executedVolume > 0 && orderAmountKrw > 0) {
              realAvgPrice = Math.round((orderAmountKrw / executedVolume) * 100) / 100;
            }

            // 업비트 계좌 avg_buy_price가 유효하면 우선 교차 검증
            try {
              const accounts = await upbitClient.getAccounts();
              const currency = market.replace('KRW-', '');
              const coinAcc = accounts.find(a => a.currency === currency);
              if (coinAcc && Number(coinAcc.avg_buy_price) > 0) {
                realAvgPrice = Number(coinAcc.avg_buy_price);
              }
            } catch (accErr) {
              // Ignore
            }

            slotManager.syncExecutedPosition(slotId, realAvgPrice, executedVolume || fallbackVolume, realTotalKrw);
            console.log(`✅ [Slot ${slotId} 체결 완료] 주문(${orderUuid}) state: ${orderData.state} -> 실제 체결가 ${realAvgPrice.toLocaleString()}원, 체결수량 ${executedVolume || fallbackVolume} 동기화 완료!`);
            return;
          }

          // 아직 wait(부분 체결 진행 중) 상태일 때는 에러를 발생시키지 않고 다음 주기에 계속 확인
          if (orderData.state === 'wait') {
            // 조용히 다음 폴링 대기
          }
        }
      } catch (err) {
        // 순간 네트워크 오류 시 무시하고 다음 폴링 지속
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollTimer);
        // 타임아웃(5초) 도달 시 계좌 잔고 기반으로 최종 보정
        try {
          const accounts = await upbitClient.getAccounts();
          const currency = market.replace('KRW-', '');
          const coinAcc = accounts.find(a => a.currency === currency);
          if (coinAcc && Number(coinAcc.avg_buy_price) > 0) {
            const realAvgPrice = Number(coinAcc.avg_buy_price);
            const realVolume = Number(coinAcc.balance);
            slotManager.syncExecutedPosition(slotId, realAvgPrice, realVolume, realAvgPrice * realVolume);
            console.log(`⏱️ [Slot ${slotId} 5초 타임아웃 보정] 계좌 잔고 기준 평단가 ${realAvgPrice.toLocaleString()}원 동기화 완료.`);
          }
        } catch (e) {
          // Fallback 유지
        }
      }
    }, intervalMs);
  }

  async panicSell(targetSlotId = null) {
    console.log(`🚨🚨🚨 PANIC SELL INITIATED: ${targetSlotId ? `Slot ${targetSlotId}` : 'ALL ASSETS'} 🚨🚨🚨`);
    const results = [];

    try {
      if (targetSlotId !== null) {
        const slot = slotManager.getSlotById(targetSlotId);
        if (slot && (slot.positionStatus !== 'IDLE' || (slot.position && slot.position.entryVolume > 0))) {
          const targetMarket = slot.targetMarket || 'KRW-BTC';
          let sellVolume = slot.position?.entryVolume || 0;

          // 실제 업비트 계좌의 잔고를 조회하여 정확한 실보유 수량으로 매도
          try {
            const accounts = await upbitClient.getAccounts();
            const currency = targetMarket.replace('KRW-', '');
            const coinAcc = accounts.find(a => a.currency === currency);
            if (coinAcc && Number(coinAcc.balance) > 0) {
              sellVolume = Number(coinAcc.balance);
            }
          } catch (accErr) {
            console.warn(`[PanicSell Slot ${targetSlotId}] 잔고 조회 실패, 슬롯 기록 수량 사용:`, accErr.message);
          }

          let res = null;
          if (sellVolume > 0) {
            res = await upbitClient.createOrder({
              market: targetMarket,
              side: 'ask',
              volume: sellVolume,
              ord_type: 'market'
            }).catch(err => ({ error: err.message || err }));
          }

          slotManager.clearPosition(targetSlotId);
          results.push({ slotId: targetSlotId, market: targetMarket, volume: sellVolume, result: res });
        }
      } else {
        const accounts = await upbitClient.getAccounts();
        for (const acc of accounts) {
          if (acc.currency === 'KRW' || Number(acc.balance) <= 0) continue;
          const market = `KRW-${acc.currency}`;
          const res = await upbitClient.createOrder({
            market,
            side: 'ask',
            volume: acc.balance,
            ord_type: 'market'
          }).catch(err => ({ error: err.message || err }));

          results.push({ market, volume: acc.balance, result: res });
        }

        for (const slot of slotManager.slots) {
          slotManager.clearPosition(slot.slotId);
        }
      }

      this.emitSignal({ type: 'PANIC_SELL_COMPLETED', results });
      return results;
    } catch (err) {
      console.error('Panic Sell Error:', err);
      throw err;
    }
  }
}

module.exports = new StrategyEngine();
