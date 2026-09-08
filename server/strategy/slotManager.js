/**
 * NURIOH TRADER - Multi-Slot Manager (1~9번 독립 멀티 슬롯 및 트레일링 스탑 관리자)
 * 업비트 전종목 실시간 급등 포착 시 빈 슬롯에 자동 탑승 및 트레일링 스탑 익절/손절 집행
 */

class SlotManager {
  constructor() {
    this.slots = [
      { slotId: 1, name: '1번 주력 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 50000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 2, name: '2번 알트 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 50000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 3, name: '3번 급등 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 30000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 4, name: '4번 리플 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 30000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 5, name: '5번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 6, name: '6번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 7, name: '7번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 8, name: '8번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 },
      { slotId: 9, name: '9번 보조 슬롯', isEnabled: true, targetMarket: null, tradeAmountKrw: 20000, positionStatus: 'IDLE', position: null, useAtrStopLoss: false, totalTrades: 0, winTrades: 0, totalRealizedProfitKrw: 0 }
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
      let netProfitRate = 0;
      let profitKrw = 0;
      let netProfitKrw = 0;
      let currentValuation = 0;
      const isReserved = slot.positionStatus === 'RESERVED_BUY';
      const hasPos = Boolean(slot.position && slot.position.entryPrice > 0 && slot.targetMarket);

      if (hasPos) {
        const liveTicker = livePriceMap[slot.targetMarket];
        currentPrice = liveTicker ? liveTicker.trade_price : slot.position.entryPrice;
        profitRate = ((currentPrice - slot.position.entryPrice) / slot.position.entryPrice) * 100;
        netProfitRate = profitRate - 0.10; // 수수료 0.1% 차감 순수익률
        currentValuation = (slot.position.entryVolume || 0) * currentPrice;
        const entryKrw = (slot.position.entryAmountKrw || (slot.position.entryPrice * slot.position.entryVolume));
        profitKrw = currentValuation - entryKrw;
        netProfitKrw = profitKrw - (entryKrw * 0.001); // 수수료 0.1% 차감
      } else if (isReserved) {
        const liveTicker = livePriceMap[slot.targetMarket];
        currentPrice = liveTicker ? liveTicker.trade_price : (slot.reservedSurge ? slot.reservedSurge.currentPrice : null);
      }

      return {
        ...slot,
        id: slot.slotId,
        slotName: slot.name || `${slot.slotId}번 슬롯`,
        positionStatus: isReserved ? 'RESERVED_BUY' : (hasPos ? (slot.positionStatus || 'IN_POSITION') : 'IDLE'),
        entryPrice: hasPos ? slot.position.entryPrice : null,
        entryVolume: hasPos ? slot.position.entryVolume : null,
        entryAmountKrw: hasPos ? slot.position.entryAmountKrw : null,
        enteredAt: hasPos ? slot.position.enteredAt : null,
        highestPrice: hasPos ? slot.position.highestPrice : null,
        highestProfitPct: hasPos ? (slot.position.highestProfitPct || 0) : 0,
        profitLockFloor: hasPos ? (slot.position.profitLockFloor || null) : null,
        timeoutStep: hasPos ? (slot.position.timeoutStep || 'NONE') : 'NONE',
        currentPrice,
        profitRate: Number(profitRate.toFixed(2)),
        netProfitRate: Number(netProfitRate.toFixed(2)),
        profitKrw: Math.round(profitKrw),
        netProfitKrw: Math.round(netProfitKrw),
        currentValuation: Math.round(currentValuation),
        reservedSurge: isReserved ? slot.reservedSurge : null,
        useAtrStopLoss: Boolean(slot.useAtrStopLoss),
        dynamicStopLossPct: hasPos ? (slot.position.dynamicStopLossPct || null) : null,
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
    if (updateData.useAtrStopLoss !== undefined) slot.useAtrStopLoss = Boolean(updateData.useAtrStopLoss);
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

  assignPosition(slotId, { market, entryPrice, entryVolume, entryAmountKrw, dynamicStopLossPct = null }) {
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
      dynamicStopLossPct: dynamicStopLossPct ? Number(dynamicStopLossPct) : null,
      trailingActivatedAt: null,
      profitLockFloor: null,       // 🔒 [수익 보존 락] 설정된 안전 방어선 (+0.5% 등)
      timeoutStep: 'NONE',         // ⏳ [정체 타임아웃] NONE | LIMIT_SUBMITTED | MARKET_CLOSED
      limitOrderUuid: null         // ⏳ 14분 차 본전 지정가 주문 UUID
    };

    const atrLog = (slot.useAtrStopLoss && dynamicStopLossPct) ? ` [AI 동적 손절선: -${Number(dynamicStopLossPct).toFixed(2)}%]` : '';
    console.log(`📌 [Slot ${slotId}] Position Assigned: ${market} @ ${Number(entryPrice).toLocaleString()} KRW (수량: ${entryVolume})${atrLog}`);
    this.emitSlotEvent({ type: 'SLOT_POSITION_ASSIGNED', slotId, slot });
  }

  /**
   * 🔄 실체결 평단가 및 수량 동기화 (운영자 1번 피드백: 슬리피지 방어 & 실제 체결가 덮어쓰기)
   */
  syncExecutedPosition(slotId, realPrice, realVolume, realAmountKrw = null) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot || !slot.position) return;

    const oldPrice = slot.position.entryPrice;
    slot.position.entryPrice = Number(realPrice);
    slot.position.entryVolume = Number(realVolume);
    slot.position.entryAmountKrw = Number(realAmountKrw) || (realPrice * realVolume);
    slot.position.highestPrice = Math.max(slot.position.highestPrice || 0, Number(realPrice));

    console.log(`🔄 [Slot ${slotId} 실체결 평단가 동기화] 이전 추정가: ${oldPrice.toLocaleString()}원 -> 실제 체결가: ${Number(realPrice).toLocaleString()}원 (수량: ${realVolume})`);
    this.emitSlotEvent({ type: 'SLOT_POSITION_SYNCED', slotId, slot });
  }

  /**
   * ⏳ 타임아웃 청산 단계 업데이트 (1단계 지정가 접수 / 2단계 시장가 청산)
   */
  updateTimeoutStep(slotId, step, limitOrderUuid = null) {
    const slot = this.slots.find(s => s.slotId === Number(slotId));
    if (!slot || !slot.position) return;

    slot.position.timeoutStep = step;
    if (limitOrderUuid) slot.position.limitOrderUuid = limitOrderUuid;
    if (step === 'LIMIT_SUBMITTED') {
      slot.positionStatus = 'TIMEOUT_LIMIT_PENDING';
    }
    this.emitSlotEvent({ type: 'SLOT_TIMEOUT_UPDATED', slotId, slot, step });
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
   * 실시간 가격 수신 시 트레일링 스탑, 수익 보존 락, 타임아웃 및 손절 로직 종합 평가
   */
  evaluatePrice(market, currentPrice, settings) {
    const feePct = settings.FEE_RATE_TOTAL_PCT !== undefined ? Number(settings.FEE_RATE_TOTAL_PCT) : 0.10;
    const targetProfitPct = Number(settings.TRAILING_TARGET_PROFIT_PCT) || 3.0; // 감시 익절 발동 기준 (%)
    const callbackPct = Number(settings.TRAILING_CALLBACK_PCT) || 1.0; // 고점 대비 하락 폭 (%)
    const stopLossPct = Number(settings.STOP_LOSS_PCT) || 2.0; // 기본 손절선 (%)

    for (const slot of this.slots) {
      if (!slot.isEnabled || slot.positionStatus === 'IDLE' || !slot.position) continue;
      if (slot.targetMarket !== market) continue;

      const pos = slot.position;
      const rawProfitRate = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
      const netProfitRate = Number((rawProfitRate - feePct).toFixed(2));
      const totalProfitKrw = (currentPrice - pos.entryPrice) * pos.entryVolume;
      const entryKrw = pos.entryAmountKrw || (pos.entryPrice * pos.entryVolume);
      const netProfitKrw = totalProfitKrw - (entryKrw * (feePct / 100));

      // 1. 최고가 및 최고 순수익률 갱신
      if (currentPrice > pos.highestPrice) {
        pos.highestPrice = currentPrice;
      }
      if (netProfitRate > (pos.highestProfitPct || 0)) {
        pos.highestProfitPct = netProfitRate;
      }

      // -----------------------------------------------------------
      // ⏳ [2단계 타임아웃 청산] 자금 묶임 방지 및 손실 없는 본전 회수 (운영자 피드백 3번)
      // -----------------------------------------------------------
      if (settings.TIMEOUT_STAGNANT_ENABLED !== false && pos.enteredAt) {
        const elapsedMinutes = (Date.now() - new Date(pos.enteredAt).getTime()) / (1000 * 60);
        const limitTimeoutMin = Number(settings.TIMEOUT_LIMIT_MINUTES) || 14;
        const marketTimeoutMin = Number(settings.TIMEOUT_MARKET_MINUTES) || 15;

        // 1단계 (14분 차): 본전 가격에 최우선 지정가 매도 주문 접수
        if (elapsedMinutes >= limitTimeoutMin && elapsedMinutes < marketTimeoutMin && (!pos.timeoutStep || pos.timeoutStep === 'NONE')) {
          console.log(`⏳ [Slot ${slot.slotId}] 14분 정체 코인 감지 -> 1단계: 본전(${pos.entryPrice.toLocaleString()}원) 최우선 지정가 매도 접수 트리거`);
          return {
            action: 'TIMEOUT_LIMIT_EXIT',
            slotId: slot.slotId,
            market,
            entryPrice: pos.entryPrice,
            currentPrice,
            volume: pos.entryVolume,
            profitRate: netProfitRate,
            profitKrw: netProfitKrw,
            reason: `[정체 타임아웃 1단계] 14분 경과 -> 본전(${pos.entryPrice.toLocaleString()}원) 지정가 매도 1분 대기`
          };
        }

        // 2단계 (15분 차): 미체결 지정가 취소 후 시장가 즉시 청산
        if (elapsedMinutes >= marketTimeoutMin && pos.timeoutStep !== 'MARKET_CLOSED') {
          console.log(`⏳ [Slot ${slot.slotId}] 15분 정체 코인 만료 -> 2단계: 미체결 지정가 취소 후 시장가 즉시 청산 트리거`);
          return {
            action: 'TIMEOUT_MARKET_EXIT',
            slotId: slot.slotId,
            market,
            entryPrice: pos.entryPrice,
            currentPrice,
            volume: pos.entryVolume,
            profitRate: netProfitRate,
            profitKrw: netProfitKrw,
            limitOrderUuid: pos.limitOrderUuid,
            reason: `[정체 타임아웃 2단계] 15분 경과 -> 미체결 취소 후 시장가 전량 청산`
          };
        }
      }

      // -----------------------------------------------------------
      // 🔒 [수익 보존 락 (Trailing Profit Lock)] 단계별 안전 방어선 (운영자 피드백 2번)
      // -----------------------------------------------------------
      if (settings.PROFIT_LOCK_ENABLED !== false) {
        const tier1Trigger = Number(settings.PROFIT_LOCK_TIER1_TRIGGER) || 1.2;
        const tier1Floor = Number(settings.PROFIT_LOCK_TIER1_FLOOR) || 0.5;
        const tier2Trigger = Number(settings.PROFIT_LOCK_TIER2_TRIGGER) || 2.2;
        const tier2Floor = Number(settings.PROFIT_LOCK_TIER2_FLOOR) || 1.2;

        // 1단계 방어선 활성화 (+1.2% 도달 시 +0.5% 안전핀 확보)
        if (netProfitRate >= tier1Trigger) {
          if (!pos.profitLockFloor || pos.profitLockFloor < tier1Floor) {
            pos.profitLockFloor = tier1Floor;
            console.log(`🛡️ [Slot ${slot.slotId}] 수익 보존 락 1단계 가동! (순수익 +${netProfitRate}% >= +${tier1Trigger}% -> 안전선 +${tier1Floor}% 확보)`);
            this.emitSlotEvent({ type: 'PROFIT_LOCK_ACTIVATED', slotId: slot.slotId, market, floorPct: tier1Floor, netProfitRate });
          }
        }

        // 2단계 방어선 상향 (+2.2% 도달 시 +1.2% 안전핀 확보)
        if (netProfitRate >= tier2Trigger) {
          if (!pos.profitLockFloor || pos.profitLockFloor < tier2Floor) {
            pos.profitLockFloor = tier2Floor;
            console.log(`🛡️ [Slot ${slot.slotId}] 수익 보존 락 2단계 상향! (순수익 +${netProfitRate}% >= +${tier2Trigger}% -> 안전선 +${tier2Floor}% 확보)`);
            this.emitSlotEvent({ type: 'PROFIT_LOCK_ACTIVATED', slotId: slot.slotId, market, floorPct: tier2Floor, netProfitRate });
          }
        }

        // 안전 방어선 이하로 하락 시 무손실 익절 매도 집행
        if (pos.profitLockFloor !== null && netProfitRate <= pos.profitLockFloor) {
          console.log(`💰 [Slot ${slot.slotId}] 수익 보존 락 트리거! 순수익 +${netProfitRate}% <= 안전방어선 +${pos.profitLockFloor}% (무손실 안전 탈출)`);
          return {
            action: 'PROFIT_LOCK_SELL',
            slotId: slot.slotId,
            market,
            entryPrice: pos.entryPrice,
            currentPrice,
            volume: pos.entryVolume,
            profitRate: netProfitRate,
            profitKrw: netProfitKrw,
            highestProfitPct: pos.highestProfitPct,
            reason: `[수익 보존 락] 최고순수익 +${pos.highestProfitPct.toFixed(2)}% 달성 후 +${pos.profitLockFloor}% 방어선 하향 돌파 시 이익 보존 청산`
          };
        }
      }

      // -----------------------------------------------------------
      // 🎯 [트레일링 스탑] 고점 대비 하락 콜백 청산
      // -----------------------------------------------------------
      if (slot.positionStatus === 'HOLDING' && netProfitRate >= targetProfitPct) {
        slot.positionStatus = 'TRAILING_ACTIVE';
        pos.trailingActivatedAt = new Date().toISOString();
        console.log(`🎯 [Slot ${slot.slotId}] Trailing Stop Activated! Net Profit: +${netProfitRate.toFixed(2)}% (Target: +${targetProfitPct}%)`);
        this.emitSlotEvent({
          type: 'TRAILING_ACTIVATED',
          slotId: slot.slotId,
          market,
          profitRate: netProfitRate,
          highestProfitPct: pos.highestProfitPct
        });
      }

      if (slot.positionStatus === 'TRAILING_ACTIVE') {
        const dropFromPeak = pos.highestProfitPct - netProfitRate;
        if (dropFromPeak >= callbackPct) {
          console.log(`💰 [Slot ${slot.slotId}] Trailing Stop Triggered! Peak: +${pos.highestProfitPct.toFixed(2)}%, Drop: -${dropFromPeak.toFixed(2)}% >= -${callbackPct}%`);
          return {
            action: 'TRAILING_STOP_SELL',
            slotId: slot.slotId,
            market,
            entryPrice: pos.entryPrice,
            currentPrice,
            volume: pos.entryVolume,
            profitRate: netProfitRate,
            profitKrw: netProfitKrw,
            highestProfitPct: pos.highestProfitPct,
            reason: `[트레일링 스탑 익절] 최고순수익 +${pos.highestProfitPct.toFixed(2)}% 달성 후 고점대비 -${dropFromPeak.toFixed(2)}% 하락 시점 이익 실현`
          };
        }
      }

      // -----------------------------------------------------------
      // ⚠️ [손절매] AI 동적 변동성 ATR 손절 또는 기본 고정 손절선
      // -----------------------------------------------------------
      const isDynamicAtr = Boolean(slot.useAtrStopLoss && pos.dynamicStopLossPct);
      const effectiveStopLossPct = isDynamicAtr ? Number(pos.dynamicStopLossPct) : stopLossPct;

      if (netProfitRate <= -effectiveStopLossPct) {
        const modeLabel = isDynamicAtr ? `[AI 동적 변동성 ATR 손절]` : `[손절매 실행]`;
        console.log(`⚠️ [Slot ${slot.slotId}] ${modeLabel} Triggered! Net Loss: ${netProfitRate.toFixed(2)}% <= -${effectiveStopLossPct.toFixed(2)}%`);
        return {
          action: 'STOP_LOSS_SELL',
          slotId: slot.slotId,
          market,
          entryPrice: pos.entryPrice,
          currentPrice,
          volume: pos.entryVolume,
          profitRate: netProfitRate,
          profitKrw: netProfitKrw,
          highestProfitPct: pos.highestProfitPct,
          reason: `${modeLabel} 순손실률 ${netProfitRate.toFixed(2)}% (손절 기준: -${effectiveStopLossPct.toFixed(2)}%)`
        };
      }
    }

    return null;
  }
}

module.exports = new SlotManager();
