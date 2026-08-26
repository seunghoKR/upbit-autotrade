const indicators = require('./indicators');
const upbitClient = require('../upbit/upbitClient');
const config = require('../config');
const slotManager = require('./slotManager');
const surgeDetector = require('./surgeDetector');

class StrategyEngine {
  constructor() {
    this.settings = { ...config.TRADING };
    this.isRunning = false; // 대표님이 켤 때까지 기본 대기 상태
    this.analysisInterval = null;
    this.pendingApproval = null;
    this.tradeHistory = [];
    this.signalListeners = new Set();
    this.lastSignalTime = 0; // 신호 알림 쿨다운 (중복 알림 방지)
    this.signalCooldownMs = 15000; // 15초 쿨다운

    this.initSurgeAndSlots();
  }

  initSurgeAndSlots() {
    // 1. 급등 감지 이벤트 리스너 등록
    surgeDetector.onSurge((surge) => {
      if (!this.isRunning) return;

      const availableSlot = slotManager.getAvailableSlot(surge.market);
      if (!availableSlot) {
        console.log(`ℹ️ [급등 감지됨] ${surge.market}이나 사용 가능한 빈 슬롯이 없습니다.`);
        return;
      }

      this.triggerSignal({
        type: 'BUY',
        slotId: availableSlot.slotId,
        market: surge.market,
        price: surge.currentPrice,
        amount: availableSlot.tradeAmountKrw,
        reason: `${availableSlot.name}: ${surge.reason}`,
        surgeInfo: surge
      });
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

  async start(intervalMs = 10000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀 Strategy Engine started. Analyzing market every', intervalMs / 1000, 'seconds.');

    this.analysisInterval = setInterval(() => {
      this.analyzeMarket().catch(err => console.error('Analysis error:', err.message));
    }, intervalMs);

    // 즉시 1회 실행
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
   * 실시간 WebSocket 틱 데이터 수신 시 처리
   */
  processRealtimeTick(tick) {
    if (!this.isRunning) return;

    // 1. 급등 감지기 처리
    surgeDetector.processTick(tick, this.settings);

    // 2. 트레일링 스탑 & 손절매 실시간 평가
    const exitSignal = slotManager.evaluatePrice(tick.code, tick.trade_price, this.settings);
    if (exitSignal) {
      this.triggerSignal({
        type: 'SELL',
        slotId: exitSignal.slotId,
        market: exitSignal.market,
        price: exitSignal.currentPrice,
        volume: exitSignal.volume,
        returnRate: exitSignal.profitRate,
        reason: exitSignal.reason
      });
    }
  }

  async analyzeMarket() {
    if (!this.isRunning) return;

    // 현재 포지션을 보유 중인 슬롯들의 마켓 목록 추출
    const holdingSlots = slotManager.slots.filter(s => s.isEnabled && s.positionStatus !== 'IDLE' && s.targetMarket);
    const activeMarkets = holdingSlots.length > 0 ? Array.from(new Set(holdingSlots.map(s => s.targetMarket))) : ['KRW-BTC'];

    for (const market of activeMarkets) {
      try {
        const candles = await upbitClient.getMinuteCandles(market, 1, 60);
        if (!candles || candles.length < 30) continue;

        const currentPrice = candles[0].trade_price;
        const rsiResult = indicators.calculateRSI(candles, this.settings.RSI_PERIOD || 14);
        const bbResult = indicators.calculateBollingerBands(candles, 20, 2);

        const rsi = rsiResult.currentRSI;
        const bb = bbResult.latest;

        const analysisData = {
          market,
          currentPrice,
          rsi,
          bb,
          timestamp: new Date().toISOString()
        };

        // 슬롯 보유 중인 코인의 트레일링 스탑/손절 실시간 체크
        const holdingSlot = slotManager.getHoldingSlot(market);
        if (holdingSlot && holdingSlot.position) {
          const exitSignal = slotManager.evaluatePrice(market, currentPrice, this.settings);
          if (exitSignal) {
            this.triggerSignal({
              type: 'SELL',
              slotId: exitSignal.slotId,
              market: exitSignal.market,
              price: currentPrice,
              volume: exitSignal.volume,
              returnRate: exitSignal.profitRate,
              rsi,
              reason: exitSignal.reason
            });
          }
        }

        this.emitSignal({ type: 'TICK', data: analysisData });
      } catch (error) {
        // Market candle error
      }
    }
  }

  triggerSignal(signal) {
    if (!this.isRunning) return;

    const now = Date.now();
    if (now - this.lastSignalTime < this.signalCooldownMs) {
      return;
    }

    if (this.pendingApproval) {
      return;
    }

    this.lastSignalTime = now;
    const signalId = `SIG-${now}`;
    const fullSignal = {
      id: signalId,
      ...signal,
      createdAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      timeoutSeconds: this.settings.APPROVAL_TIMEOUT_SECONDS || 30
    };

    // 타임아웃 타이머 등록
    this.signalTimers = this.signalTimers || new Map();
    const timer = setTimeout(() => {
      this.handleSignalTimeout(signalId);
    }, (this.settings.APPROVAL_TIMEOUT_SECONDS || 30) * 1000);
    this.signalTimers.set(signalId, timer);

    this.pendingApproval = fullSignal;
    this.emitSignal({ type: 'TRADE_SIGNAL', signal: fullSignal });
  }

  async handleSignalTimeout(signalId) {
    if (!this.pendingApproval || this.pendingApproval.id !== signalId) return;

    const signal = this.pendingApproval;
    console.log(`⏰ Signal ${signalId} timed out after ${signal.timeoutSeconds}s.`);

    if (this.settings.AUTO_EXECUTE_ON_TIMEOUT) {
      console.log('⚡ Policy: Auto-executing on timeout...');
      await this.executeTrade(signal, 'TIMEOUT_AUTO_EXECUTE');
    } else {
      console.log('🚫 Policy: Skipping trade on timeout.');
      signal.status = 'TIMED_OUT_SKIPPED';
      this.pendingApproval = null;
      this.emitSignal({ type: 'SIGNAL_CANCELLED', signalId, reason: '승인 시간 초과 (자동 취소)' });
    }
  }

  async approveSignal(signalId) {
    if (!this.pendingApproval || this.pendingApproval.id !== signalId) {
      throw new Error('유효하지 않거나 이미 처리된 신호입니다.');
    }

    const signal = this.pendingApproval;
    if (this.signalTimers && this.signalTimers.has(signalId)) {
      clearTimeout(this.signalTimers.get(signalId));
      this.signalTimers.delete(signalId);
    }
    return await this.executeTrade(signal, 'USER_APPROVED');
  }

  rejectSignal(signalId, reason = '대표님 직접 취소') {
    if (!this.pendingApproval || this.pendingApproval.id !== signalId) return;

    if (this.signalTimers && this.signalTimers.has(signalId)) {
      clearTimeout(this.signalTimers.get(signalId));
      this.signalTimers.delete(signalId);
    }
    const signal = this.pendingApproval;
    signal.status = 'REJECTED';
    this.pendingApproval = null;
    this.emitSignal({ type: 'SIGNAL_CANCELLED', signalId, reason });
  }

  async executeTrade(signal, triggerType) {
    try {
      console.log(`🚀 Executing Trade [${signal.type}] for ${signal.market} (${signal.slotId ? `Slot ${signal.slotId}` : 'No Slot'}) triggered by ${triggerType}`);
      let orderResult = null;

      if (signal.type === 'BUY') {
        // 시장가 매수 (지정된 금액만큼)
        orderResult = await upbitClient.createOrder({
          market: signal.market,
          side: 'bid',
          price: signal.amount,
          ord_type: 'price'
        });

        // 슬롯 포지션 할당
        const targetSlotId = signal.slotId || (slotManager.getAvailableSlot(signal.market) || {}).slotId || 1;
        const estimatedVolume = signal.amount / signal.price;
        slotManager.assignPosition(targetSlotId, {
          market: signal.market,
          entryPrice: signal.price,
          entryVolume: estimatedVolume,
          entryAmountKrw: signal.amount
        });
      } else if (signal.type === 'SELL') {
        // 시장가 매도 (보유 수량 전량)
        orderResult = await upbitClient.createOrder({
          market: signal.market,
          side: 'ask',
          volume: signal.volume,
          ord_type: 'market'
        });

        // 슬롯 포지션 정리
        if (signal.slotId) {
          slotManager.clearPosition(signal.slotId);
        } else {
          const holding = slotManager.getHoldingSlot(signal.market);
          if (holding) slotManager.clearPosition(holding.slotId);
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
   * 🚨 비상 Panic Sell (전량 즉시 청산)
   * @param {number|null} targetSlotId null이면 전체 계좌 잔고 일괄 청산, 숫자면 특정 슬롯만 청산
   */
  async panicSell(targetSlotId = null) {
    console.log(`🚨🚨🚨 PANIC SELL INITIATED: ${targetSlotId ? `Slot ${targetSlotId}` : 'ALL ASSETS'} 🚨🚨🚨`);
    const results = [];

    try {
      if (targetSlotId !== null) {
        // 특정 슬롯 청산
        const slot = slotManager.getSlotById(targetSlotId);
        if (slot && slot.position && slot.position.entryVolume > 0) {
          const res = await upbitClient.createOrder({
            market: slot.targetMarket,
            side: 'ask',
            volume: slot.position.entryVolume,
            ord_type: 'market'
          }).catch(err => ({ error: err.message }));

          slotManager.clearPosition(targetSlotId);
          results.push({ slotId: targetSlotId, market: slot.targetMarket, result: res });
        }
      } else {
        // 전체 계좌 잔고 조회 후 KRW를 제외한 모든 암호화폐 일괄 시장가 매도
        const accounts = await upbitClient.getAccounts().catch(() => []);
        for (const acc of accounts) {
          if (acc.currency !== 'KRW' && parseFloat(acc.balance) > 0) {
            const market = `KRW-${acc.currency}`;
            try {
              const res = await upbitClient.createOrder({
                market,
                side: 'ask',
                volume: acc.balance,
                ord_type: 'market'
              });
              results.push({ market, volume: acc.balance, result: res });
            } catch (err) {
              console.error(`Panic sell failed for ${market}:`, err.message);
              results.push({ market, volume: acc.balance, error: err.message });
            }
          }
        }

        // 1~5번 슬롯 전체 초기화
        for (let i = 1; i <= 5; i++) {
          slotManager.clearPosition(i);
        }
      }

      this.emitSignal({ type: 'PANIC_SELL_COMPLETED', targetSlotId, results, timestamp: new Date().toISOString() });
      return { success: true, results };
    } catch (err) {
      console.error('Panic Sell Error:', err);
      throw err;
    }
  }
}

module.exports = new StrategyEngine();
