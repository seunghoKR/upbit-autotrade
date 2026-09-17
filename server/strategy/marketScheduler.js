/**
 * NURIOH TRADER - Market Scheduler & Preset Engine (3단계 장세 스케줄러 및 포지션 무결성 엔진)
 * 
 * [제안서 2부 핵심 요구사항 반영]
 * 1. 3가지 장세 프리셋 자동 스위칭:
 *    ① Preset_Morning (09:00 ~ 12:00): 09:00 리셋 직후 오전 경주마/돌파 중심
 *    ② Preset_Afternoon (12:00 ~ 21:00): 거래량 감소 시간대 오후 횡보 방어/스윙 중심
 *    ③ Preset_Night (21:00 ~ 08:50): 미 증시 개장 전후 야간 단기 트레일링/방망이 단축
 * 2. 포지션 무결성 (State Preservation):
 *    - 대기 중(IDLE)인 슬롯은 즉시 새 프리셋 적용
 *    - 보유 중(ACTIVE/IN_POSITION)인 슬롯은 기존 진입 룰을 청산 시까지 100% 보호
 *    - 매도 완료 후 빈 슬롯이 되는 순간 현재 장세 프리셋으로 자동 갱신
 * 3. 24시간 누적 거래대금 (100억 이상) 스윙 필터 기본 활성화
 */

const slotManager = require('./slotManager');

class MarketScheduler {
  constructor() {
    this.isEnabled = true;
    this.currentPresetKey = 'MORNING'; // MORNING | AFTERNOON | NIGHT | CUSTOM
    this.timer = null;
    this.listeners = new Set();

    // 사용자가 대시보드에서 커스텀 변경 가능한 시간표 (KST 기준)
    this.timeTable = {
      MORNING_START: '08:50',   // 08:50~12:00
      AFTERNOON_START: '12:00', // 12:00~21:00
      NIGHT_START: '21:00'      // 21:00~익일 08:50
    };

    // ⏰ [제안서 2부/3.5.0] 장세별 프리셋 매핑 (오전/오후/야간)
    this.scheduleMapping = {
      MORNING: 'PRESET_A',
      AFTERNOON: 'PRESET_B',
      NIGHT: 'PRESET_C'
    };

    // 🔀 사용자 정의 동적 프리셋 템플릿 (A/B/C 모드)
    this.userPresets = {
      PRESET_A: {
        id: 'PRESET_A',
        name: 'A 모드 (초단타 스캘핑)',
        description: '급등 포착 및 단기 수급 코인에 최적화된 1~12번 슬롯 설정입니다.',
        updatedAt: new Date().toISOString(),
        slots: []
      },
      PRESET_B: {
        id: 'PRESET_B',
        name: 'B 모드 (신고가 돌파)',
        description: '당일 고가 돌파 및 거래대금 상위 코인을 선별 진입하는 설정입니다.',
        updatedAt: new Date().toISOString(),
        slots: []
      },
      PRESET_C: {
        id: 'PRESET_C',
        name: 'C 모드 (추세 스윙)',
        description: '이평선 정배열 추세 추종 및 다단 트레일링 스탑으로 수익을 지키는 설정입니다.',
        updatedAt: new Date().toISOString(),
        slots: []
      }
    };

    const initialPeriod = this.determineCurrentPresetKey();
    this.currentPeriod = initialPeriod;
    this.currentPresetKey = this.scheduleMapping[initialPeriod] || initialPeriod;

    // 👑 [Last Action Wins 우선순위 추적] 자동 스케줄러와 수동 전환 간 가장 마지막 명령 우선
    this.lastScheduledPeriod = initialPeriod;
    this.lastAction = {
      source: 'SYSTEM_INIT',
      period: initialPeriod,
      presetKey: this.currentPresetKey,
      timestamp: new Date().toISOString()
    };

    // 글로벌 모드: 'MODE_A' (하이브리드: 1~8 스캘핑, 9~12 스윙) | 'MODE_B' (방망이 분할: 전슬롯 돌파/스윙)
    this.globalStrategyMode = 'MODE_A';

    // 3가지 모드 기본 프리셋 템플릿
    this.presets = {
      // ① Preset A (초단타 스캘핑)
      MORNING: {
        name: 'A 모드 (초단타 스캘핑)',
        description: '급등 포착 및 단기 수급 코인 집중 공략',
        // 1~8번 슬롯 세팅
        scalping: {
          useWideTrailing: true,
          trailingTier1TargetProfitPct: 3.5,
          trailingTier1CallbackPct: 0.5,
          trailingTier2HurdlePct: 8.0,
          trailingTier2CallbackPct: 2.0,
          stopLossPct: 2.0,
          surgeRatePct: 1.8,
          surgeMinVolumeKrw: 15000000
        },
        // 9~10번 돌파 슬롯 세팅
        breakout: {
          breakoutHighEnabled: true,
          breakoutCandleUnit: 1,
          breakoutMinVolumeKrwEok: 5, // 1분봉 5억 이상
          trailingTier1TargetProfitPct: 4.0,
          trailingTier1CallbackPct: 0.8,
          trailingTier2HurdlePct: 10.0,
          trailingTier2CallbackPct: 2.5,
          stopLossPct: 2.5
        },
        // 11~12번 스윙 슬롯 세팅
        swing: {
          swingCandleUnit: 'days',
          swingShortMa: 5,
          swingLongMa: 20,
          min24hAccTradePriceKrw: 10000000000, // 24시간 100억 이상
          trailingTier1TargetProfitPct: 7.0,
          trailingTier1CallbackPct: 1.5,
          trailingTier2HurdlePct: 15.0,
          trailingTier2CallbackPct: 4.0,
          stopLossPct: 3.5
        }
      },

      // ② Preset B (신고가 돌파)
      AFTERNOON: {
        name: 'B 모드 (신고가 돌파)',
        description: '당일 고가 돌파 및 거래대금 상위 코인 선별 진입',
        scalping: {
          useWideTrailing: true,
          trailingTier1TargetProfitPct: 2.0,
          trailingTier1CallbackPct: 0.4,
          trailingTier2HurdlePct: 6.0,
          trailingTier2CallbackPct: 1.5,
          stopLossPct: 1.5,
          surgeRatePct: 2.5, // 진입 허들 상향
          surgeMinVolumeKrw: 20000000
        },
        breakout: {
          breakoutHighEnabled: true,
          breakoutCandleUnit: 3, // 3분봉으로 안정성 강화
          breakoutMinVolumeKrwEok: 10, // 3분봉 10억 이상
          trailingTier1TargetProfitPct: 3.0,
          trailingTier1CallbackPct: 0.6,
          trailingTier2HurdlePct: 8.0,
          trailingTier2CallbackPct: 2.0,
          stopLossPct: 2.0
        },
        swing: {
          swingCandleUnit: 'minutes/240', // 4시간봉
          swingShortMa: 5,
          swingLongMa: 20,
          min24hAccTradePriceKrw: 15000000000, // 24시간 150억 이상 메이저 중심
          trailingTier1TargetProfitPct: 5.0,
          trailingTier1CallbackPct: 1.0,
          trailingTier2HurdlePct: 12.0,
          trailingTier2CallbackPct: 3.0,
          stopLossPct: 2.5
        }
      },

      // ③ Preset C (추세 스윙)
      NIGHT: {
        name: 'C 모드 (추세 스윙)',
        description: '중장기 이평선 정배열 추세 추종 및 다단 트레일링 스탑으로 수익 보존',
        scalping: {
          useWideTrailing: true,
          trailingTier1TargetProfitPct: 2.0,
          trailingTier1CallbackPct: 0.3, // 타이트 콜백
          trailingTier2HurdlePct: 5.0,
          trailingTier2CallbackPct: 1.2,
          stopLossPct: 1.8,
          surgeRatePct: 2.0,
          surgeMinVolumeKrw: 25000000
        },
        breakout: {
          breakoutHighEnabled: true,
          breakoutCandleUnit: 1,
          breakoutMinVolumeKrwEok: 8,
          trailingTier1TargetProfitPct: 2.5,
          trailingTier1CallbackPct: 0.5,
          trailingTier2HurdlePct: 7.0,
          trailingTier2CallbackPct: 1.8,
          stopLossPct: 2.0
        },
        swing: {
          swingCandleUnit: 'minutes/240',
          swingShortMa: 5,
          swingLongMa: 20,
          min24hAccTradePriceKrw: 20000000000, // 200억 이상 고유동성
          trailingTier1TargetProfitPct: 4.5,
          trailingTier1CallbackPct: 0.8,
          trailingTier2HurdlePct: 10.0,
          trailingTier2CallbackPct: 2.5,
          stopLossPct: 2.5
        }
      }
    };
  }

  start() {
    if (this.timer) clearInterval(this.timer);

    console.log('⏰ [MarketScheduler] 3단계 장세 자동 스케줄러 가동');
    // 1분마다 KST 시간 점검 및 스위칭
    this.timer = setInterval(() => this.checkSchedule(), 60000);
    // 가동 즉시 현재 시간에 맞는 프리셋 확인 및 적용
    this.checkSchedule();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('⏰ [MarketScheduler] 장세 스케줄러 정지');
  }

  onSchedulerEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('MarketScheduler listener error:', err);
      }
    }
  }

  /**
   * 현재 KST 시각에 해당하는 프리셋 키 반환
   */
  determineCurrentPresetKey() {
    // 한국 표준시(KST, UTC+9) 기준 시간 계산
    const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = kstFormatter.formatToParts(new Date());
    let kstHour = 0;
    let kstMinute = 0;
    for (const part of parts) {
      if (part.type === 'hour') kstHour = parseInt(part.value, 10);
      if (part.type === 'minute') kstMinute = parseInt(part.value, 10);
    }
    if (kstHour === 24) kstHour = 0;
    const curMin = kstHour * 60 + kstMinute;

    const [mH, mM] = this.timeTable.MORNING_START.split(':').map(Number);
    const [aH, aM] = this.timeTable.AFTERNOON_START.split(':').map(Number);
    const [nH, nM] = this.timeTable.NIGHT_START.split(':').map(Number);

    const mMin = mH * 60 + mM;
    const aMin = aH * 60 + aM;
    const nMin = nH * 60 + nM;

    // 08:50 ~ 12:00 -> MORNING
    // 12:00 ~ 21:00 -> AFTERNOON
    // 21:00 ~ 08:50 -> NIGHT
    if (curMin >= mMin && curMin < aMin) {
      return 'MORNING';
    } else if (curMin >= aMin && curMin < nMin) {
      return 'AFTERNOON';
    } else {
      return 'NIGHT';
    }
  }

  /**
   * 스케줄 체크 및 필요 시 프리셋 자동 전환 (Last Action Wins 보장)
   */
  checkSchedule() {
    if (!this.isEnabled) return;

    const targetPeriod = this.determineCurrentPresetKey(); // 'MORNING' | 'AFTERNOON' | 'NIGHT'

    // 👑 [Last Action Wins 핵심 원칙]
    // 정규 시간대 경계(예: 08:50, 12:00, 21:00)를 새로 통과할 때만 스케줄러가 자동 개입!
    // 그 사이 사용자가 수동으로 A모드를 켜두었더라도 1분마다 취소되지 않고 안전하게 유지됩니다.
    // 하지만 지정된 다음 시간대(예: 21:00)가 되면 스케줄러가 기존 수동 설정을 덮어쓰고(Override) 정상 전환됩니다.
    if (targetPeriod !== this.lastScheduledPeriod) {
      console.log(`⏰ [MarketScheduler/자동 스케줄 발동] 정규 시간대 진입: ${this.lastScheduledPeriod || 'START'} ➔ ${targetPeriod}`);
      this.lastScheduledPeriod = targetPeriod;
      this.applyPeriodPreset(targetPeriod, 'AUTO_TIME_SCHEDULE');
    }
  }

  /**
   * 장세별 프리셋 적용 (수동 즉시 전환 버튼 or 정규 스케줄러 자동 도달 시 공통 호출)
   */
  applyPeriodPreset(periodKey, triggerSource = 'MANUAL_PERIOD_BUTTON') {
    const period = (periodKey || 'MORNING').toUpperCase();
    this.currentPeriod = period;
    const mappedPresetKey = this.scheduleMapping ? this.scheduleMapping[period] : period;

    this.lastAction = {
      source: triggerSource,
      period,
      presetKey: mappedPresetKey,
      timestamp: new Date().toISOString()
    };

    console.log(`🎯 [MarketScheduler] 장세 전환 (${period}) ➔ 매핑 프리셋 [${mappedPresetKey}] (사유: ${triggerSource})`);

    if (mappedPresetKey && mappedPresetKey !== 'NONE') {
      const userPreset = this.userPresets ? this.userPresets[mappedPresetKey] : null;
      if (userPreset && Array.isArray(userPreset.slots) && userPreset.slots.length > 0) {
        return this.applyUserPreset(mappedPresetKey, triggerSource);
      } else {
        return this.applyPreset(period, triggerSource);
      }
    }
    return true;
  }

  /**
   * 사용자 정의 프리셋 저장 (현재 슬롯 세팅 스냅샷 CRUD)
   */
  saveUserPreset(presetKey, presetData = {}) {
    const key = (presetKey || 'PRESET_A').toUpperCase();
    if (!this.userPresets[key]) {
      this.userPresets[key] = {
        id: key,
        name: presetData.name || `${key} 프리셋`,
        description: presetData.description || '사용자 커스텀 슬롯 전략 세팅',
        updatedAt: new Date().toISOString(),
        slots: []
      };
    }
    if (presetData.name) this.userPresets[key].name = presetData.name;
    if (presetData.description) this.userPresets[key].description = presetData.description;
    if (presetData.slots && Array.isArray(presetData.slots)) {
      this.userPresets[key].slots = presetData.slots;
    }
    this.userPresets[key].updatedAt = new Date().toISOString();

    console.log(`💾 [MarketScheduler] 프리셋 [${key} - ${this.userPresets[key].name}] 저장 완료 (${this.userPresets[key].slots.length}개 슬롯)`);

    this.emit({
      type: 'PRESET_SAVED',
      presetKey: key,
      preset: this.userPresets[key],
      timestamp: new Date().toISOString()
    });

    return this.userPresets[key];
  }

  /**
   * 사용자 정의 프리셋을 1~12번 슬롯에 불러오기 (포지션 무결성 보장)
   */
  applyUserPreset(presetKey, triggerSource = 'MANUAL_USER') {
    const key = (presetKey || 'PRESET_A').toUpperCase();
    const userPreset = this.userPresets[key];
    this.currentPresetKey = key;

    this.lastAction = {
      source: triggerSource,
      period: this.currentPeriod,
      presetKey: key,
      timestamp: new Date().toISOString()
    };

    let immediateUpdatedCount = 0;
    let preservedCount = 0;

    if (userPreset && Array.isArray(userPreset.slots) && userPreset.slots.length > 0) {
      console.log(`🎯 [MarketScheduler] 동적 프리셋 [${userPreset.name}] 1~12번 슬롯 주입 시작 (사유: ${triggerSource})`);
      for (const slot of slotManager.slots) {
        const savedSlotConfig = userPreset.slots.find(s => s.slotId === slot.slotId);
        if (!savedSlotConfig) continue;

        const hasActivePosition = slot.positionStatus !== 'IDLE' && slot.position && slot.position.entryPrice > 0;
        if (hasActivePosition) {
          slot.pendingPreset = {
            presetKey: key,
            presetName: userPreset.name,
            params: savedSlotConfig,
            registeredAt: new Date().toISOString()
          };
          preservedCount++;
          console.log(`🛡️ [포지션 무결성 보호] Slot ${slot.slotId} (${slot.name}) 코인 보유 중 -> 청산 시까지 기존 룰 유지 (대기 프리셋 등록)`);
        } else {
          this.updateSlotParams(slot, savedSlotConfig);
          slot.pendingPreset = null;
          immediateUpdatedCount++;
        }
      }

      this.emit({
        type: 'PRESET_APPLIED',
        presetKey: key,
        presetName: userPreset.name,
        triggerSource,
        immediateUpdatedCount,
        preservedCount,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [MarketScheduler] 프리셋 [${key}] 적용 완료: 즉시 적용 ${immediateUpdatedCount}개 / 보유 포지션 보호 대기 ${preservedCount}개`);
      return true;
    } else {
      // 템플릿 기본 fallback
      const fallbackKey = key === 'PRESET_B' ? 'AFTERNOON' : (key === 'PRESET_C' ? 'NIGHT' : 'MORNING');
      return this.applyPreset(fallbackKey, triggerSource);
    }
  }

  /**
   * 프리셋 적용 (포지션 무결성 State Preservation 100% 준수)
   * @param {string} presetKey - 'MORNING' | 'AFTERNOON' | 'NIGHT'
   * @param {string} triggerSource - 'AUTO_TIME_SCHEDULE' | 'MANUAL_USER'
   */
  applyPreset(presetKey, triggerSource = 'MANUAL_USER') {
    const preset = this.presets[presetKey];
    if (!preset) return false;

    this.currentPresetKey = presetKey;
    this.lastAction = {
      source: triggerSource,
      period: this.currentPeriod,
      presetKey,
      timestamp: new Date().toISOString()
    };
    console.log(`🎯 [MarketScheduler] 프리셋 [${preset.name}] 적용 시작 (사유: ${triggerSource})`);

    let immediateUpdatedCount = 0;
    let preservedCount = 0;

    // 1~12번 슬롯 순회
    for (const slot of slotManager.slots) {
      // 🛡️ 포지션 무결성 검증:
      // 이미 매수 완료(IN_POSITION)이거나 주문 대기 중(RESERVED_BUY)인 슬롯은
      // 기존 진입 룰을 유지하여 끝까지 보호하고, 다음 매도 완료 시 적용되도록 대기(pendingPreset) 등록
      const hasActivePosition = slot.positionStatus !== 'IDLE' && slot.position && slot.position.entryPrice > 0;

      const targetParams = this.extractParamsForSlot(slot.slotId, slot.strategyMode, preset);

      if (hasActivePosition) {
        slot.pendingPreset = {
          presetKey,
          presetName: preset.name,
          params: targetParams,
          registeredAt: new Date().toISOString()
        };
        preservedCount++;
        console.log(`🛡️ [포지션 무결성 보호] Slot ${slot.slotId} (${slot.name}) 코인 보유 중(${slot.targetMarket}) -> 청산 시까지 기존 룰 유지 (대기 프리셋 등록됨)`);
      } else {
        // 대기 중(IDLE)인 슬롯은 즉시 갱신
        this.updateSlotParams(slot, targetParams);
        slot.pendingPreset = null;
        immediateUpdatedCount++;
      }
    }

    this.emit({
      type: 'PRESET_APPLIED',
      presetKey,
      presetName: preset.name,
      triggerSource,
      immediateUpdatedCount,
      preservedCount,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [MarketScheduler] 프리셋 전환 완료: 즉시 적용 ${immediateUpdatedCount}개 / 기존 포지션 보호 대기 ${preservedCount}개`);
    return true;
  }

  /**
   * 슬롯 타입 및 ID에 맞춘 파라미터 추출 (A모드 / B모드 분기 반영)
   */
  extractParamsForSlot(slotId, strategyMode, preset) {
    // B모드(방망이 분할 모드)일 경우
    if (this.globalStrategyMode === 'MODE_B') {
      if (slotId <= 8) {
        // 1~8번: 돌파 단기 타겟 (1단 5% 익절 후 즉시 청산, 2단 진입 방지 트릭)
        return {
          strategyMode: 'BREAKOUT_DAY_HIGH',
          breakoutHighEnabled: true,
          breakoutCandleUnit: 1,
          breakoutMinVolumeKrwEok: 5,
          useWideTrailing: false, // 2단 진입 방지 단일 익절
          targetProfitPct: 5.0,
          trailingTier1TargetProfitPct: 5.0,
          trailingTier1CallbackPct: 0.5,
          trailingTier2HurdlePct: 999.0, // 2단 차단
          trailingTier2CallbackPct: 99.0,
          stopLossPct: 2.0
        };
      } else {
        // 9~12번: 10~20% 장기 타겟 와이드 트레일링
        return {
          strategyMode: slotId <= 10 ? 'BREAKOUT_DAY_HIGH' : 'TREND_SWING',
          breakoutHighEnabled: true,
          breakoutCandleUnit: 3,
          breakoutMinVolumeKrwEok: 8,
          swingCandleUnit: 'days',
          swingShortMa: 5,
          swingLongMa: 20,
          min24hAccTradePriceKrw: 10000000000,
          useWideTrailing: true,
          trailingTier1TargetProfitPct: 10.0,
          trailingTier1CallbackPct: 2.0,
          trailingTier2HurdlePct: 20.0,
          trailingTier2CallbackPct: 5.0,
          stopLossPct: 3.5
        };
      }
    }

    // A모드 (하이브리드: 1~8 스캘핑, 9~10 돌파, 11~12 스윙)
    if (slotId <= 8) {
      return {
        strategyMode: 'SCALPING',
        ...preset.scalping
      };
    } else if (slotId <= 10) {
      return {
        strategyMode: 'BREAKOUT_DAY_HIGH',
        ...preset.breakout
      };
    } else {
      return {
        strategyMode: 'TREND_SWING',
        ...preset.swing
      };
    }
  }

  updateSlotParams(slot, params) {
    if (!params) return;
    Object.keys(params).forEach(k => {
      slot[k] = params[k];
    });
  }

  /**
   * 글로벌 전략 모드 전환 (A모드 하이브리드 vs B모드 방망이 분할)
   */
  setGlobalStrategyMode(mode) {
    if (mode !== 'MODE_A' && mode !== 'MODE_B') return false;
    this.globalStrategyMode = mode;
    console.log(`🔀 [전략 모드 변경] ${mode === 'MODE_A' ? 'A모드 (하이브리드: 1~8 스캘핑 + 9~12 돌파/스윙)' : 'B모드 (방망이 분할: 전슬롯 돌파/스윙)'} 선택됨`);
    // 즉시 현재 시간대 프리셋 재적용
    this.applyPreset(this.currentPresetKey, 'STRATEGY_MODE_SWITCH');
    return true;
  }

  /**
   * 시간표 및 프리셋 매핑 업데이트
   */
  updateTimeTable(newTable = {}, newMapping = {}) {
    if (newTable.MORNING_START) this.timeTable.MORNING_START = newTable.MORNING_START;
    if (newTable.AFTERNOON_START) this.timeTable.AFTERNOON_START = newTable.AFTERNOON_START;
    if (newTable.NIGHT_START) this.timeTable.NIGHT_START = newTable.NIGHT_START;

    if (newMapping.MORNING) this.scheduleMapping.MORNING = newMapping.MORNING;
    if (newMapping.AFTERNOON) this.scheduleMapping.AFTERNOON = newMapping.AFTERNOON;
    if (newMapping.NIGHT) this.scheduleMapping.NIGHT = newMapping.NIGHT;

    console.log('⏰ [MarketScheduler] 시간표 및 매핑 갱신:', this.timeTable, this.scheduleMapping);
    this.checkSchedule();
  }

  getStatus() {
    const currentName = (this.userPresets && this.userPresets[this.currentPresetKey])
      ? this.userPresets[this.currentPresetKey].name
      : (this.presets[this.currentPresetKey]?.name || this.currentPresetKey);

    return {
      isEnabled: this.isEnabled,
      currentPeriod: this.currentPeriod || this.determineCurrentPresetKey(),
      currentPresetKey: this.currentPresetKey,
      currentPresetName: currentName,
      globalStrategyMode: this.globalStrategyMode,
      timeTable: this.timeTable,
      scheduleMapping: this.scheduleMapping,
      userPresets: this.userPresets,
      presets: this.presets,
      lastAction: this.lastAction,
      lastScheduledPeriod: this.lastScheduledPeriod
    };
  }
}

module.exports = new MarketScheduler();
