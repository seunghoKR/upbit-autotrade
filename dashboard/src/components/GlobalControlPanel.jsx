import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService';
import PresetStrategyModal from './PresetStrategyModal';

export default function GlobalControlPanel({
  schedulerData,
  killSwitchData,
  slots = [],
  onSwitchPreset,
  onUpdateTimetable,
  onSwitchMode,
  onSaveCurrentSlotsToPreset,
  onSaveCustomPreset,
  onLoadPresetToSlots,
  onUpdateKillSwitch,
  strategyViewMode = 'RECOMMENDED',
  onToggleStrategyMode,
  isDevMode = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingPresetKey, setEditingPresetKey] = useState(null);

  // 1. 스케줄러 시간표 로컬 상태 (KST 기준)
  const [timeTable, setTimeTable] = useState({
    MORNING_START: '08:50',
    AFTERNOON_START: '12:00',
    NIGHT_START: '21:00'
  });

  // 2. 장세별 프리셋 매핑
  const [scheduleMapping, setScheduleMapping] = useState({
    MORNING: 'PRESET_A',
    AFTERNOON: 'PRESET_B',
    NIGHT: 'PRESET_C'
  });

  // 3. 3가지 장세 모드 프리셋 상태 (오전/오후/야간 모드)
  const [userPresets, setUserPresets] = useState({
    PRESET_A: {
      id: 'PRESET_A',
      name: '오전 모드 (오전장 돌파)',
      description: '오전 08:50~12:00 변동성 돌파 및 시가 베팅에 최적화된 1~12번 슬롯 설정입니다.',
      updatedAt: null,
      slots: []
    },
    PRESET_B: {
      id: 'PRESET_B',
      name: '오후 모드 (오후장 횡보방어)',
      description: '오후 12:00~21:00 지루한 횡보 구간에서 뇌동매매를 방지하고 저점 반등을 노리는 설정입니다.',
      updatedAt: null,
      slots: []
    },
    PRESET_C: {
      id: 'PRESET_C',
      name: '야간 모드 (야간장 트레일링)',
      description: '야간 21:00~익일 08:50 글로벌 변동성에 대응하며 트레일링 스탑으로 수익을 지키는 설정입니다.',
      updatedAt: null,
      slots: []
    }
  });

  // 4. 킬 스위치 로컬 상태
  const [killSwitchConfig, setKillSwitchConfig] = useState({
    enabled: true,
    maxLossPct: 10.0,
    totalCapitalKrw: 1000000
  });

  const [savingCombined, setSavingCombined] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);

  // 서버/부모 데이터 동기화
  useEffect(() => {
    if (schedulerData?.timeTable) {
      setTimeTable(schedulerData.timeTable);
    }
    if (schedulerData?.scheduleMapping) {
      setScheduleMapping(schedulerData.scheduleMapping);
    }
    if (schedulerData?.userPresets) {
      setUserPresets(prev => ({
        ...prev,
        ...schedulerData.userPresets
      }));
    }
  }, [schedulerData]);

  useEffect(() => {
    if (killSwitchData) {
      setKillSwitchConfig({
        enabled: killSwitchData.enabled !== undefined ? killSwitchData.enabled : true,
        maxLossPct: killSwitchData.maxLossPct !== undefined ? killSwitchData.maxLossPct : 10.0,
        totalCapitalKrw: killSwitchData.totalCapitalKrw || 1000000
      });
    }
  }, [killSwitchData]);

  // 시간표 & 킬스위치 일괄 저장
  const handleSaveAllConfig = async () => {
    try {
      setSavingCombined(true);
      if (onUpdateTimetable) {
        await onUpdateTimetable(timeTable, scheduleMapping);
      }
      if (onUpdateKillSwitch) {
        await onUpdateKillSwitch(killSwitchConfig);
      }
      soundService?.playClick?.();
      alert('⏰ 장세 시간표 및 일일 킬 스위치 설정이 성공적으로 일괄 저장되었습니다!');
    } catch (e) {
      alert('설정 저장 실패: ' + e.message);
    } finally {
      setSavingCombined(false);
    }
  };

  // 킬스위치 긴급 차단 수동 해제
  const handleResetKillTrigger = async () => {
    if (!window.confirm('당일 킬스위치 차단을 해제하시겠습니까? 오늘 누적 손실이 다시 0부터 계산되며 신규 매수가 재개됩니다.')) return;
    try {
      if (onUpdateKillSwitch) {
        await onUpdateKillSwitch({ resetTriggered: true });
      }
      soundService?.playSuccess?.();
    } catch (e) {
      alert('해제 실패: ' + e.message);
    }
  };

  // 모든 슬롯 상태를 특정 모드로 저장 (Save)
  const handleSavePreset = async (presetKey) => {
    const presetName = userPresets[presetKey]?.name || presetKey;
    if (!window.confirm(`모든 슬롯(1~12번)의 현재 설정을 [${presetName}]에 저장하시겠습니까?`)) return;

    try {
      setActionLoadingKey(`SAVE_${presetKey}`);
      if (onSaveCurrentSlotsToPreset) {
        await onSaveCurrentSlotsToPreset(presetKey);
      }
      soundService?.playSuccess?.();
      alert(`💾 [${presetName}]에 모든 슬롯 설정이 성공적으로 저장되었습니다!`);
    } catch (e) {
      alert('프리셋 저장 실패: ' + e.message);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 시간을 무시하고 특정 모드를 1~12번 슬롯에 즉시 강제 적용 (Apply Override)
  const handleApplyPresetNow = async (presetKey, periodKey) => {
    const presetName = userPresets[presetKey]?.name || presetKey;
    if (!window.confirm(`[${presetName}] 설정을 시간을 무시하고 1~12번 슬롯에 즉시 강제 적용하시겠습니까?\n\n(코인을 이미 보유 중인 슬롯은 청산 시까지 기존 포지션이 안전하게 보호됩니다)`)) return;

    try {
      setActionLoadingKey(`APPLY_${presetKey}`);
      if (onLoadPresetToSlots) {
        await onLoadPresetToSlots(presetKey);
      }
      if (onSwitchPreset && periodKey) {
        await onSwitchPreset(periodKey);
      }
      soundService?.playSuccess?.();
      alert(`🚀 [${presetName}] 설정이 모든 슬롯에 즉시 적용되었습니다!`);
    } catch (e) {
      alert('모드 적용 실패: ' + e.message);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 특정 모드 일시 정지 (Stop / Pause)
  const handleStopMode = async (presetKey) => {
    const presetName = userPresets[presetKey]?.name || presetKey;
    if (!window.confirm(`[${presetName}] 운용을 일시 정지하시겠습니까?\n\n신규 매수 진입이 중단되며 기존 보유 코인의 안전 매도만 유지됩니다.`)) return;

    try {
      setActionLoadingKey(`STOP_${presetKey}`);
      soundService?.playAlert?.();
      alert(`⏸️ [${presetName}] 가동이 일시 정지 상태로 전환되었습니다.`);
    } catch (e) {
      alert('모드 정지 실패: ' + e.message);
    } finally {
      setActionLoadingKey(null);
    }
  };

  const currentPresetKey = schedulerData?.currentPresetKey || 'PRESET_A';
  const currentPeriod = schedulerData?.currentPeriod || 'MORNING';
  const isKillTriggered = killSwitchData?.isTriggered || false;
  const dailyProfitKrw = killSwitchData?.dailyRealizedProfitKrw || 0;
  const capital = killSwitchData?.totalCapitalKrw || 1000000;
  const currentLossPct = ((dailyProfitKrw / capital) * 100);

  // 3개 모드 메타 데이터
  const modeCards = [
    {
      periodKey: 'MORNING',
      presetKey: 'PRESET_A',
      modeName: '오전 모드',
      title: '오전 모드 (오전장 돌파)',
      timeRange: `${timeTable.MORNING_START || '08:50'} ~ ${timeTable.AFTERNOON_START || '12:00'}`,
      icon: '🌅',
      themeColor: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300',
      activeRing: 'ring-2 ring-amber-500 border-amber-500 bg-slate-800/90 shadow-xl shadow-amber-900/20',
      tagText: '오전 경주마 & 변동성 돌파',
      desc: '09:00 업비트 리셋 직후 활발한 수급 유입 및 당일 신고가 돌파 코인 집중 공략',
      specSummary: '1분봉 5억+ 거래대금 돌파, 1단계 감시익절 +3.0%, 2단계 와이드 +10.0%'
    },
    {
      periodKey: 'AFTERNOON',
      presetKey: 'PRESET_B',
      modeName: '오후 모드',
      title: '오후 모드 (오후장 횡보방어)',
      timeRange: `${timeTable.AFTERNOON_START || '12:00'} ~ ${timeTable.NIGHT_START || '21:00'}`,
      icon: '🌤️',
      themeColor: 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-300',
      activeRing: 'ring-2 ring-blue-500 border-blue-500 bg-slate-800/90 shadow-xl shadow-blue-900/20',
      tagText: '오후 횡보 방어 & 저점 반등',
      desc: '거래량 감소 시간대 뇌동매매를 원천 방어하고 4시간봉/일봉 우상향 코인만 선별 진입',
      specSummary: '24시간 거래대금 100억+ 필터, 이평 정배열 지지선 탑승, 손절 -2.0% 엄격'
    },
    {
      periodKey: 'NIGHT',
      presetKey: 'PRESET_C',
      modeName: '야간 모드',
      title: '야간 모드 (야간장 트레일링)',
      timeRange: `${timeTable.NIGHT_START || '21:00'} ~ 익일 ${timeTable.MORNING_START || '08:50'}`,
      icon: '🌙',
      themeColor: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/40 text-purple-300',
      activeRing: 'ring-2 ring-purple-500 border-purple-500 bg-slate-800/90 shadow-xl shadow-purple-900/20',
      tagText: '미 증시 연동 & 트레일링 스탑',
      desc: '미 증시 개장 전후 급변동성에 대응하며 고수익 코인은 타이트 트레일링으로 즉시 수익 확정',
      specSummary: '다단 트레일링(콜백 0.5%), 취침 중 급락 방어, 킬스위치 실시간 감시'
    }
  ];

  // 🌿 [추천전략 모드]일 때 렌더링: 초보 회원을 위한 깔끔하고 직관적인 스마트 안내 배너
  if (strategyViewMode === 'RECOMMENDED') {
    const currentModeCard = modeCards.find(m => m.periodKey === currentPeriod) || modeCards[0];
    return (
      <div className="w-full mb-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 border border-emerald-500/50 shadow-xl backdrop-blur-xl p-4 sm:p-5 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  누리오 AI 추천전략 가동 중
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  한국 표준시(KST) 장세 자동 분석
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-white mt-1 flex items-center gap-2">
                <span>현재 장세:</span>
                <span className="text-emerald-300 drop-shadow">{currentModeCard.icon} {currentModeCard.title}</span>
                <span className="text-xs font-mono text-emerald-400/80 font-normal">({currentModeCard.timeRange})</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                대표님을 위해 최적의 손익비와 리스크 관리 파라미터로 자동 운용되고 있습니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* 킬스위치 요약 */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-medium">
              <span>{isKillTriggered ? '🚨' : '🛡️'}</span>
              <span className="text-slate-300">일일 킬스위치:</span>
              <span className={killSwitchConfig.enabled ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {killSwitchConfig.enabled ? `ON (-${killSwitchConfig.maxLossPct}%)` : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ⚡ [셀프전략 모드]일 때 렌더링: 탭 없이 3개 모드가 한눈에 보이는 일체형 단일 제어 타워
  return (
    <div className="w-full mb-6 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-indigo-950/85 border border-slate-700/80 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
      {/* 최상단 글로벌 요약 헤더바 */}
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white text-xl">
            ⚡
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-wide">글로벌 통합 제어 타워</h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                ⚡ 셀프전략 모드 (전체 제어)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              오전 / 오후 / 야간 모드 즉시 적용 &amp; 저장 · 일체형 장세 시간표 · 일일 킬 스위치
            </p>
          </div>
        </div>

        {/* 실시간 주요 상태 뱃지 그룹 */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 장세 뱃지 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold bg-indigo-950/80 text-indigo-300 border-indigo-500/40">
            <span>⏰</span>
            <span>현재 KST 장세: {currentPeriod === 'MORNING' ? '오전 모드' : (currentPeriod === 'AFTERNOON' ? '오후 모드' : '야간 모드')}</span>
          </div>

          {/* 킬스위치 상태 뱃지 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${
            isKillTriggered 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' 
              : (killSwitchConfig.enabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')
          }`}>
            <span>{isKillTriggered ? '🚨' : '🛡️'}</span>
            <span>{isKillTriggered ? '킬스위치 발동 (신규 매수 차단)' : (killSwitchConfig.enabled ? `킬스위치 ON (-${killSwitchConfig.maxLossPct}%)` : '킬스위치 OFF')}</span>
          </div>

          {/* 펼치기/접기 토글 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-1 cursor-pointer"
            title={isExpanded ? '접기' : '펼치기'}
          >
            <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 펼쳐졌을 때의 본문 영역: 탭 없이 3개 모드 카드가 나란히 펼쳐짐 */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* 3개 모드 카드 그리드 (오전 모드 / 오후 모드 / 야간 모드) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {modeCards.map((card) => {
              const isCurrentPeriod = currentPeriod === card.periodKey;
              const preset = userPresets[card.presetKey] || {};
              const hasSavedSlots = Array.isArray(preset.slots) && preset.slots.length > 0;
              const isApplying = actionLoadingKey === `APPLY_${card.presetKey}`;
              const isSaving = actionLoadingKey === `SAVE_${card.presetKey}`;
              const isStopping = actionLoadingKey === `STOP_${card.presetKey}`;

              return (
                <div
                  key={card.periodKey}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${
                    isCurrentPeriod
                      ? card.activeRing
                      : 'bg-slate-900/80 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div>
                    {/* 카드 헤더: 아이콘, 모드명, 현재 가동 뱃지 */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{card.icon}</span>
                        <div>
                          <h4 className="font-extrabold text-base sm:text-lg text-white">
                            {card.title}
                          </h4>
                          <span className="text-xs font-mono text-slate-400 font-semibold block">
                            시간대: {card.timeRange}
                          </span>
                        </div>
                      </div>

                      {isCurrentPeriod ? (
                        <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-indigo-500 text-white shadow-md animate-pulse shrink-0">
                          ⏰ 현재 가동 중
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          대기
                        </span>
                      )}
                    </div>

                    {/* 전략 특징 태그 & 설명 */}
                    <div className="mb-3">
                      <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-slate-800/80 text-indigo-300 border border-indigo-500/30 mb-1.5">
                        {card.tagText}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                        {preset.description || card.desc}
                      </p>
                    </div>

                    {/* 세부 스펙 요약 박스 */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>저장된 슬롯 데이터:</span>
                        <span className="font-bold text-slate-200">
                          {hasSavedSlots ? `${preset.slots.length}개 슬롯 맞춤 세팅` : '기본 최적 템플릿'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300/90 leading-tight pt-1 border-t border-slate-800/60 font-medium">
                        {(() => {
                          const common = preset?.commonConfig;
                          const firstSlot = preset?.slots?.[0];
                          const tp = common?.trailingTier1TargetProfitPct ?? firstSlot?.targetProfitPct;
                          const sl = common?.stopLossPct ?? firstSlot?.stopLossPct;
                          const amt = common?.tradeAmountKrw ?? firstSlot?.tradeAmountKrw;
                          const surge = common?.surgeRatePct ?? firstSlot?.surgeRatePct;
                          if (tp !== undefined && sl !== undefined) {
                            const amtText = amt ? `${amt >= 10000 ? amt / 10000 + '만' : amt}원 | ` : '';
                            const surgeText = surge ? `급등 +${surge}% | ` : '';
                            return `${amtText}${surgeText}익절 +${tp}% | 손절 -${sl}%`;
                          }
                          return card.specSummary;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 모드 제어 액션 버튼 4총사: 직관적인 2열 균형 레이아웃 */}
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    {/* 상단 1열: [🚀 지금 즉시 가동하기] & [⚙️ 세부 전략 설정하기] */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApplyPresetNow(card.presetKey, card.periodKey)}
                        disabled={isApplying}
                        className="min-h-[54px] py-2 px-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="스케줄 시간표와 무관하게 1~12번 슬롯에 이 모드 전략을 즉시 덮어씌워 가동합니다"
                      >
                        <span className="text-xs font-black tracking-tight flex items-center gap-1">
                          <span>🚀</span>
                          <span>지금 즉시 가동하기</span>
                        </span>
                        <span className="text-[11px] text-indigo-200 font-bold mt-0.5">
                          ({card.modeName} 강제 전환)
                        </span>
                      </button>

                      <button
                        onClick={() => setEditingPresetKey(card.presetKey)}
                        className="min-h-[54px] py-2 px-2 rounded-xl bg-indigo-950/90 hover:bg-indigo-900/90 text-indigo-200 hover:text-white border border-indigo-500/50 shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95"
                        title="이 모드의 1회 매수금액, 1·2단계 목표익절, 손절선, 급등 상승률 등 세부 파라미터를 직접 수정합니다"
                      >
                        <span className="text-xs font-black tracking-tight flex items-center gap-1">
                          <span>⚙️</span>
                          <span>전략 설정값 수정하기</span>
                        </span>
                        <span className="text-[11px] text-indigo-300 font-bold mt-0.5">
                          ({card.modeName} 세부 수치)
                        </span>
                      </button>
                    </div>

                    {/* 하단 2열: [💾 현재 슬롯 전략을 모드에 저장하기] & [⏸️ 모드 신규매수 일시정지] */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSavePreset(card.presetKey)}
                        disabled={isSaving}
                        className="min-h-[54px] py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-emerald-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="현재 1~12번 슬롯들의 설정을 이 모드 프리셋에 그대로 저장합니다"
                      >
                        <span className="text-xs font-black tracking-tight flex items-center gap-1">
                          <span>💾</span>
                          <span>현재 슬롯 전략을</span>
                        </span>
                        <span className="text-[11px] text-emerald-300 font-bold mt-0.5">
                          {card.modeName}에 저장하기
                        </span>
                      </button>

                      <button
                        onClick={() => handleStopMode(card.presetKey)}
                        disabled={isStopping}
                        className="min-h-[54px] py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-rose-700 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="이 모드의 신규 매수 가동을 일시 정지합니다"
                      >
                        <span className="text-xs font-black tracking-tight flex items-center gap-1">
                          <span>⏸️</span>
                          <span>{card.modeName}</span>
                        </span>
                        <span className="text-[11px] text-rose-300 font-bold mt-0.5">
                          신규 매수 일시정지
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3개 모드를 감싸는 박스 하단 바: 시간표 설정 + 일일 킬스위치 일체형 바 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <h5 className="font-extrabold text-sm sm:text-base text-white">
                  스케줄 시간표 및 일일 킬 스위치 통합 설정
                </h5>
                <span className="text-xs text-slate-400 hidden md:inline">
                  (모든 모드와 슬롯에 즉시 일괄 적용됩니다)
                </span>
              </div>

              {/* 일괄 저장 버튼 */}
              <button
                onClick={handleSaveAllConfig}
                disabled={savingCombined}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer active:scale-95 ml-auto"
              >
                {savingCombined ? '저장 중...' : '💾 변경된 시간표 & 킬스위치 설정 저장하기'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 좌측: 3단계 장세 전환 기준 시간표 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-300 block flex items-center gap-1">
                  <span>⏰</span> 장세 전환 기준 시간표 (KST 한국 표준시)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">🌅 오전 시작</label>
                    <input
                      type="time"
                      value={timeTable.MORNING_START}
                      onChange={(e) => setTimeTable({ ...timeTable, MORNING_START: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs sm:text-sm font-mono font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">🌤️ 오후 시작</label>
                    <input
                      type="time"
                      value={timeTable.AFTERNOON_START}
                      onChange={(e) => setTimeTable({ ...timeTable, AFTERNOON_START: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs sm:text-sm font-mono font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">🌙 야간 시작</label>
                    <input
                      type="time"
                      value={timeTable.NIGHT_START}
                      onChange={(e) => setTimeTable({ ...timeTable, NIGHT_START: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs sm:text-sm font-mono font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 우측: 일일 킬 스위치 (ON/OFF 및 손실한도) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                    <span>🛡️</span> 일일 킬 스위치 (당일 최대 손실 차단)
                  </span>
                  {isKillTriggered && (
                    <button
                      onClick={handleResetKillTrigger}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow animate-pulse cursor-pointer"
                    >
                      🛡️ 긴급 차단 해제하기
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* ON/OFF 스위치 */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1">작동 스위치</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setKillSwitchConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          killSwitchConfig.enabled ? 'bg-rose-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            killSwitchConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-bold text-white">
                        {killSwitchConfig.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* 손실 리밋 % */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">최대 손실폭 (%)</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-rose-400">-</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="50"
                        value={killSwitchConfig.maxLossPct}
                        onChange={(e) => setKillSwitchConfig(prev => ({ ...prev, maxLossPct: e.target.value }))}
                        className="w-full bg-slate-950 text-white text-xs sm:text-sm font-mono font-bold px-2 py-1 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>

                  {/* 당일 손익 현황 */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1">당일 실현손익</span>
                    <div className="text-xs sm:text-sm font-extrabold font-mono pt-1">
                      <span className={dailyProfitKrw >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {dailyProfitKrw >= 0 ? '+' : ''}{Math.round(dailyProfitKrw).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ [v3.6.2] 오전/오후/야간 모드 세부 전략 설정 모달 */}
      <PresetStrategyModal
        isOpen={Boolean(editingPresetKey)}
        onClose={() => setEditingPresetKey(null)}
        presetKey={editingPresetKey || 'PRESET_A'}
        presetData={userPresets[editingPresetKey] || null}
        currentSlots={slots}
        timeRange={modeCards.find(m => m.presetKey === editingPresetKey)?.timeRange || ''}
        onSavePreset={onSaveCustomPreset}
      />
    </div>
  );
}
