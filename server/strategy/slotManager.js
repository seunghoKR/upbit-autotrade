/**
 * NURIOH TRADER - Multi-Slot Manager (1~5번 슬롯 및 트레일링 스탑 관리자)
 * 업비트 120개 전종목 실시간 급등 포착 시 빈 슬롯에 자동 탑승 및 트레일링 스탑 집행
 */

class SlotManager {
  constructor() {
    this.slots = [
      {
        slotId: 1,
        name: '슬롯 1',
        isEnabled: true,
        targetMarket: null, // 급등 신호 포착 시 실시간 자동 배정
        tradeAmountKrw: 50000,
        positionStatus: 'IDLE',
        position: null
      },
      {
        slotId: 2,
        name: '슬롯 2',
        isEnabled: true,
        targetMarket: null,
        tradeAmountKrw: 50000,
        positionStatus: 'IDLE',
        position: null
      },
      {
        slotId: 3,
        name: '슬롯 3',
        isEnabled: true,
        targetMarket: null,
        tradeAmountKrw: 30000,
        positionStatus: 'IDLE',
        position: null
      },
      {
        slotId: 4,
        name: '슬롯 4',
        isEnabled: true,
        targetMarket: null,
        tradeAmountKrw: 30000,
        positionStatus: 'IDLE',
        position: null
      },
      {
        slotId: 5,
        name: '슬롯 5',
        isEnabled: true,
        targetMarket: null,
        tradeAmountKrw: 20000,
        positionStatus: 'IDLE',
        position: null
      }
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

      if (slot.position && slot.position.entryPrice > 0 && slot.targetMarket) {
        const liveTicker = livePriceMap[slot.targetMarket];
        currentPrice = liveTicker ? liveTicker.trade_price : slot.position.entryPrice;
        profitRate = ((currentPrice - slot.position.entryPrice) / slot.position.entryPrice) * 100;
        currentValuation = (slot.position.entryVolume || 0) * currentPrice;
        profitKrw = currentValuation - (slot.position.entryAmountKrw || (slot.position.entryPrice * slot.position.entryVolume));
      }

      return {
        ...slot,
        currentPrice,
        profitRate: Number(profitRate.toFixed(2)),
        profitKrw: Math.round(profitKrw),
        currentValuation: Math.round(currentValuation)
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

    this.emitSlotEvent({ type: 'SLOT_CONFIG_UPDATED', slotId: slot.slotId, slot });
    return slot;
  }

  getAvailableSlot(market) {
    // 1순위: 해당 마켓이 지정되어 있고 활성화된 IDLE 슬롯
    let slot = this.slots.find(s => s.isEnabled && s.targetMarket === market && s.positionStatus === 'IDLE');
    if (slot) return slot;

    // 2순위: 비어있는(targetMarket이 없거나 IDLE 상태인) 첫 번째 활성 슬롯
    slot = this.slots.find(s => s.isEnabled && s.positionStatus === 'IDLE');
    return slot || null;
  }

  getHoldingSlot(market) {
    return this.slots.find(s => s.targetMarket === market && s.positionStatus !== 'IDLE');
  }

  getSlotById(slotId) {
    return this.slots.find(s => s.slotId === Number(slotId));
  }

  assignPosition(slotId, { market, entryPrice, entryVolume, entryAmountKrw }) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot) return;

    slot.targetMarket = market;
    slot.positionStatus = 'HOLDING';
    slot.position = {
      entryPrice,
      entryVolume,
      entryAmountKrw: entryAmountKrw || (entryPrice * entryVolume),
      enteredAt: new Date().toISOString(),
      highestPrice: entryPrice,
      highestProfitPct: 0.0,
      trailingActivatedAt: null
    };

    console.log(`📌 [Slot ${slotId}] Position Assigned: ${market} @ ${entryPrice.toLocaleString()} KRW`);
    this.emitSlotEvent({ type: 'SLOT_POSITION_ASSIGNED', slotId, slot });
  }

  clearPosition(slotId) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot) return;

    slot.positionStatus = 'IDLE';
    slot.position = null;
    slot.targetMarket = null; // 포지션 청산 완료 시 다시 전종목 급등 포착 대기 상태로 복귀

    console.log(`🧹 [Slot ${slotId}] Position Cleared -> 급등 포착 대기 모드로 복귀.`);
    this.emitSlotEvent({ type: 'SLOT_POSITION_CLEARED', slotId, slot });
  }

  /**
   * 실시간 가격 수신 시 트레일링 스탑 및 손절 로직 평가
   */
  evaluatePrice(market, currentPrice, settings) {
    const targetProfitPct = settings.TRAILING_TARGET_PROFIT_PCT || 3.0; // 감시 익절 발동 기준 (%)
    const callbackPct = settings.TRAILING_CALLBACK_PCT || 1.0; // 고점 대비 하락 폭 (%)
    const stopLossPct = settings.STOP_LOSS_PCT || 2.0; // 기본 손절선 (%)

    for (const slot of this.slots) {
      if (!slot.isEnabled || slot.positionStatus === 'IDLE' || !slot.position) continue;
      if (slot.targetMarket !== market) continue;

      const pos = slot.position;
      const profitRate = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

      // 1. 고점 갱신
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
            currentPrice,
            volume: pos.entryVolume,
            profitRate,
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
          currentPrice,
          volume: pos.entryVolume,
          profitRate,
          highestProfitPct: pos.highestProfitPct,
          reason: `[손절매 실행] 손실률 ${profitRate.toFixed(2)}% (손절 기준: -${stopLossPct}%)`
        };
      }
    }

    return null;
  }
}

module.exports = new SlotManager();
