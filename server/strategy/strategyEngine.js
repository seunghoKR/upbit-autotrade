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

    this.initSurgeAndSlots();
  }

  initSurgeAndSlots() {
    // 1. 급등 감지 이벤트 리스너 등록
    surgeDetector.onSurge(async (surge) => {
      if (!this.isRunning) return;

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

      const buySignal = {
        id: `SIG-BUY-${Date.now()}`,
        type: 'BUY',
        slotId: availableSlot.slotId,
        slotName: availableSlot.name,
        market: surge.market,
        price: surge.currentPrice,
        amount: tradeAmount,
        reason: `${availableSlot.name}: ${surge.reason}`,
        surgeInfo: surge,
        createdAt: new Date().toISOString()
      };

      console.log(`⚡ [급등 매수 트리거] 슬롯 ${availableSlot.slotId}번 -> ${surge.market} (${tradeAmount.toLocaleString()}원) 매수 실행!`);

      // 0.1초 즉시 전자동 매수 실행
      if (this.settings.AUTO_EXECUTE_ON_TIMEOUT !== false) {
        try {
          await this.executeTrade(buySignal, 'AUTO_BUY_SURGE');
        } catch (err) {
          console.error(`❌ [매수 실패] ${surge.market}:`, err.message);
        }
      } else {
        this.triggerSignal(buySignal);
      }
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
   * 실시간 WebSocket 틱 데이터 수신 시 처리
   */
  async processRealtimeTick(tick) {
    if (!this.isRunning) return;

    // 1. 급등 감지기 틱 피딩
    surgeDetector.processTick(tick, this.settings);

    // 2. 트레일링 스탑 & 손절매 실시간 평가
    const exitSignal = slotManager.evaluatePrice(tick.code, tick.trade_price, this.settings);
    if (exitSignal) {
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

      console.log(`🚨 [매도 트리거 발생] 슬롯 ${exitSignal.slotId}번 ${exitSignal.market} (수익률: ${exitSignal.profitRate.toFixed(2)}%) -> 즉시 전량 매도 실행!`);
      
      // 익절/손절은 승인 대기 없이 0.1초 만에 즉시 시장가 매도 실행!
      try {
        await this.executeTrade(sellSignal, 'AUTO_EXIT_TRIGGER');
      } catch (err) {
        console.error(`❌ [매도 실패] ${exitSignal.market}:`, err.message);
      }
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
          const sellSignal = {
            id: `SIG-SELL-${Date.now()}`,
            type: 'SELL',
            slotId: exitSignal.slotId,
            slotName: `${exitSignal.slotId}번 슬롯`,
            market: exitSignal.market,
            entryPrice: exitSignal.entryPrice,
            price: currentPrice,
            volume: exitSignal.volume,
            profitPct: exitSignal.profitRate,
            profitKrw: exitSignal.profitKrw,
            highestProfitPct: exitSignal.highestProfitPct,
            reason: exitSignal.reason,
            createdAt: new Date().toISOString()
          };

          await this.executeTrade(sellSignal, 'POLLING_EXIT_TRIGGER');
        }
      } catch (err) {
        // Quiet
      }
    }
  }

  triggerSignal(signal) {
    const now = Date.now();
    if (now - this.lastSignalTime < this.signalCooldownMs) return;
    if (this.pendingApproval) return;

    this.lastSignalTime = now;
    const signalId = `SIG-${now}`;
    const fullSignal = {
      id: signalId,
      ...signal,
      createdAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      timeoutSeconds: this.settings.APPROVAL_TIMEOUT_SECONDS || 30
    };

    this.pendingApproval = fullSignal;
    this.emitSignal({ type: 'TRADE_SIGNAL', signal: fullSignal });
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
          entryAmountKrw: signal.amount
        });

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

  async panicSell(targetSlotId = null) {
    console.log(`🚨🚨🚨 PANIC SELL INITIATED: ${targetSlotId ? `Slot ${targetSlotId}` : 'ALL ASSETS'} 🚨🚨🚨`);
    const results = [];

    try {
      if (targetSlotId !== null) {
        const slot = slotManager.getSlotById(targetSlotId);
        if (slot && slot.position && slot.position.entryVolume > 0) {
          const res = await upbitClient.createOrder({
            market: slot.targetMarket,
            side: 'ask',
            volume: slot.position.entryVolume,
            ord_type: 'market'
          }).catch(err => ({ error: err.message }));

          slotManager.clearPosition(targetSlotId);
          results.push({ slotId: targetSlotId, result: res });
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
          }).catch(err => ({ error: err.message }));

          results.push({ market, result: res });
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
