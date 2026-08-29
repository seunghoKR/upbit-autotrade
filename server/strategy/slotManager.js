/**
 * NURIOH TRADER - Multi-Slot Manager (1~9번 독립 멀티 슬롯 및 트레일링 스탑 관리자)
 * 업비트 전종목 실시간 급등 포착 시 빈 슬롯에 자동 탑승 및 트레일링 스탑 익절/손절 집행
 */

class SlotManager {
  constructor() {
    this.slots = [
      { slotId: 1, name: '1번 주력 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 50000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 2, name: '2번 알트 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 50000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 3, name: '3번 급등 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 30000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 4, name: '4번 리플 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 30000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 5, name: '5번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 6, name: '6번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 7, name: '7번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 8, name: '8번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 9, name: '9번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 }
    ];

    this.listeners = new Set();
  }

  onSlotEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitSlotEvent(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in slot event listener:', err);
      }
    }
  }

  getSlots(livePriceMap = {}) {
    return this.slots.map(slot => {
      let currentPrice = null;
      let profitRate = 0;
      let profitKrw = 0;
      let currentValuation = 0;
      const isReserved = slot.positionStatus === 'RESERVED_BUY';
      const hasPos = Boolean(slot.position && slot.position.entryPrice > 0 && slot.targetMarket);

      if (hasPos) {
        const liveTicker = livePriceMap[slot.targetMarket];
        currentPrice = liveTicker ? liveTicker.trade_price : slot.position.entryPrice;
        profitRate = ((currentPrice - slot.position.entryPrice) / slot.position.entryPrice) * 100;
        currentValuation = (slot.position.entryVolume || 0) * currentPrice;
        profitKrw = currentValuation - (slot.position.entryAmountKrw || (slot.position.entryPrice * slot.position.entryVolume));
      } else if (isReserved) {
        const liveTicker = livePriceMap[slot.targetMarket];
        currentPrice = liveTicker ? liveTicker.trade_price : (slot.reservedSurge ? slot.reservedSurge.currentPrice : null);
      }

      return {
        ...slot,
        id: slot.slotId,
        slotName: slot.name || `${slot.slotId}번 슬롯`,
        positionStatus: isReserved ? 'RESERVED_BUY' : (hasPos ? 'IN_POSITION' : 'IDLE'),
        entryPrice: hasPos ? slot.position.entryPrice : null,
        entryVolume: hasPos ? slot.position.entryVolume : null,
        entryAmountKrw: hasPos ? slot.position.entryAmountKrw : null,
        highestPrice: hasPos ? slot.position.highestPrice : null,
        highestProfitPct: hasPos ? (slot.position.highestProfitPct || 0) : 0,
        currentPrice,
        profitRate: Number(profitRate.toFixed(2)),
        profitKrw: Math.round(profitKrw),
        currentValuation: Math.round(currentValuation),
        reservedSurge: isReserved ? slot.reservedSurge : null,
        totalTrades: slot.totalTrades || 0,
        winTrades: slot.winTrades || 0,
        totalRealizedProfitKrw: slot.totalRealizedProfitKrw || 0
      };
    });
  }

  updateSlot(slotId, updateData) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot) return null;

    if (updateData.name !== undefined) slot.name = updateData.name;
    if (updateData.isEnabled !== undefined) slot.isEnabled = Boolean(updateData.isEnabled);
    if (updateData.targetMarket !== undefined) slot.targetMarket = updateData.targetMarket;
    if (updateData.tradeAmountKrw !== undefined) slot.tradeAmountKrw = Number(updateData.tradeAmountKrw);
    if (updateData.totalTrades !== undefined) slot.totalTrades = Number(updateData.totalTrades);
    if (updateData.winTrades !== undefined) slot.winTrades = Number(updateData.winTrades);
    if (updateData.totalRealizedProfitKrw !== undefined) slot.totalRealizedProfitKrw = Number(updateData.totalRealizedProfitKrw);

    this.emitSlotEvent({ type: 'SLOT_CONFIG_UPDATED', slotId: slot.slotId, slot });
    return slot;
  }

  getAvailableSlot(market) {
    // 1순위: 해당 마켓이 명시적으로 지정되어 있고 활성화된 IDLE 슬롯
    let slot = this.slots.find(s => s.isEnabled && s.targetMarket === market && s.positionStatus === 'IDLE');
    if (slot) return slot;

    // 2순위: 비어있는(targetMarket이 없거나 IDLE 상태인) 첫 번째 활성 슬롯 (RESERVED_BUY나 HOLDING 제외)
    slot = this.slots.find(s => s.isEnabled && s.positionStatus === 'IDLE');
    return slot || null;
  }

  getHoldingSlot(market) {
    return this.slots.find(s => s.targetMarket === market && s.positionStatus !== 'IDLE');
  }

  getSlotById(slotId) {
    return this.slots.find(s => s.slotId === Number(slotId));
  }

  /**
   * ⚡ 급등 발견 시 3초 매수 대기 예약 상태 지정
   */
  reserveSurgeSlot(slotId, { market, surgeInfo, countdownSeconds = 3 }) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot) return;

    slot.targetMarket = market;
    slot.positionStatus = 'RESERVED_BUY';
    slot.reservedSurge = {
      ...surgeInfo,
      countdownSeconds,
      reservedAt: Date.now(),
      executeAt: Date.now() + (countdownSeconds * 1000)
    };

    console.log(`⏳ [Slot ${slotId}] ⚡ 급등 발견 예약: ${market} (+${surgeInfo.priceDiffRate}%), ${countdownSeconds}초 후 매수 진입 대기`);
    this.emitSlotEvent({ type: 'SLOT_RESERVED', slotId, slot, surgeInfo });
  }

  assignPosition(slotId, { market, entryPrice, entryVolume, entryAmountKrw }) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot) return;

    slot.targetMarket = market;
    slot.positionStatus = 'HOLDING';
    slot.reservedSurge = null;
    slot.position = {
      entryPrice: Number(entryPrice),
      entryVolume: Number(entryVolume),
      entryAmountKrw: Number(entryAmountKrw) || (entryPrice * entryVolume),
      enteredAt: new Date().toISOString(),
      highestPrice: Number(entryPrice),
      highestProfitPct: 0.0,
      trailingActivatedAt: null
    };

    console.log(`📌 [Slot ${slotId}] Position Assigned: ${market} @ ${Number(entryPrice).toLocaleString()} KRW (수량: ${entryVolume})`);
    this.emitSlotEvent({ type: 'SLOT_POSITION_ASSIGNED', slotId, slot });
  }

  clearPosition(slotId) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot) return;

    slot.positionStatus = 'IDLE';
    slot.position = null;
    slot.reservedSurge = null;
    slot.targetMarket = null; // 포지션 청산 완료 시 다시 전종목 급등 포착 대기 상태로 복귀

    console.log(`🧹 [Slot ${slotId}] Position Cleared -> 전종목 급등 포착 대기 모드로 복귀.`);
    this.emitSlotEvent({ type: 'SLOT_POSITION_CLEARED', slotId, slot });
  }

  /**
   * 📊 매도 청산 시 슬롯 통계 실시간 누적 기록
   */
  recordTrade(slotId, isProfit, profitKrw) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot) return;

    slot.totalTrades = (slot.totalTrades || 0) + 1;
    if (isProfit) {
      slot.winTrades = (slot.winTrades || 0) + 1;
    }
    slot.totalRealizedProfitKrw = (slot.totalRealizedProfitKrw || 0) + Math.round(Number(profitKrw) || 0);

    console.log(`📊 [Slot ${slotId} 통계 갱신] 총 거래: ${slot.totalTrades}회 (승: ${slot.winTrades}회) | 실현 손익: ${slot.totalRealizedProfitKrw.toLocaleString()}원`);
    this.emitSlotEvent({ type: 'SLOT_STATS_UPDATED', slotId, slot });
  }

  /**
   * 실시간 가격 수신 시 트레일링 스탑 및 손절 로직 평가
   */
  evaluatePrice(market, currentPrice, settings) {
    const targetProfitPct = settings.TRAILING_TARGET_PROFIT_PCT || 2.0; // 감시 익절 발동 기준 (%)
    const callbackPct = settings.TRAILING_CALLBACK_PCT || 1.0; // 고점 대비 하락 폭 (%)
    const stopLossPct = settings.STOP_LOSS_PCT || 1.0; // 기본 손절선 (%)

    for (const slot of this.slots) {
      if (!slot.isEnabled || slot.positionStatus === 'IDLE' || !slot.position) continue;
      if (slot.targetMarket !== market) continue;

      const pos = slot.position;
      const profitRate = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

      // 1. 최고가 갱신
      if (currentPrice > pos.highestPrice) {
        pos.highestPrice = currentPrice;
        pos.highestProfitPct = profitRate;
      }

      // 2. 트레일링 스탑 감시 모드 활성화 검사 (수익률 >= 목표 수익률)
      if (slot.positionStatus === 'HOLDING' && profitRate >= targetProfitPct) {
        slot.positionStatus = 'TRAILING_ACTIVE';
        pos.trailingActivatedAt = new Date().toISOString();
        console.log(`🎯 [Slot ${slot.slotId}] Trailing Stop Activated! Current: +${profitRate.toFixed(2)}% (Target: +${targetProfitPct}%)`);
        this.emitSlotEvent({
          type: 'TRAILING_ACTIVATED',
          slotId: slot.slotId,
          market,
          profitRate,
          highestProfitPct: pos.highestProfitPct
        });
      }

      // 3. 트레일링 스탑 하락 매도 트리거 검사 (고점 대비 하락폭 도달)
      if (slot.positionStatus === 'TRAILING_ACTIVE') {
        const dropFromPeak = pos.highestProfitPct - profitRate;
        if (dropFromPeak >= callbackPct) {
          console.log(`💰 [Slot ${slot.slotId}] Trailing Stop Triggered! Peak: +${pos.highestProfitPct.toFixed(2)}%, Drop: -${dropFromPeak.toFixed(2)}% >= -${callbackPct}%`);
          return {
            action: 'TRAILING_STOP_SELL',
            slotId: slot.slotId,
            market,
            entryPrice: pos.entryPrice,
            currentPrice,
            volume: pos.entryVolume,
            profitRate,
            profitKrw: ((currentPrice - pos.entryPrice) * pos.entryVolume),
            highestProfitPct: pos.highestProfitPct,
            reason: `[트레일링 스탑 익절] 최고수익률 +${pos.highestProfitPct.toFixed(2)}% 달성 후 고점대비 -${dropFromPeak.toFixed(2)}% 하락 시점 이익 실현`
          };
        }
      }

      // 4. 기본 손절선 검사 (손실률 <= -손절선)
      if (profitRate <= -stopLossPct) {
        console.log(`⚠️ [Slot ${slot.slotId}] Stop-Loss Triggered! Loss: ${profitRate.toFixed(2)}% <= -${stopLossPct}%`);
        return {
          action: 'STOP_LOSS_SELL',
          slotId: slot.slotId,
          market,
          entryPrice: pos.entryPrice,
          currentPrice,
          volume: pos.entryVolume,
          profitRate,
          profitKrw: ((currentPrice - pos.entryPrice) * pos.entryVolume),
          highestProfitPct: pos.highestProfitPct,
          reason: `[손절매 실행] 손실률 ${profitRate.toFixed(2)}% (손절 기준: -${stopLossPct}%)`
        };
      }
    }

    return null;
  }
}

module.exports = new SlotManager();
