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
  isDevMode = false,
  onOpenTableEdit,
  activePeriodOverride = null
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
      name: '오전 모드 (09:00 당일 돌파 & 대형주 스윙)',
      description: '급등 포착 및 단기 수급 코인에 최적화된 1~12번 슬롯 설정입니다.',
      updatedAt: null,
      slots: []
    },
    PRESET_B: {
      id: 'PRESET_B',
      name: '오후 모드 (횡보 방어 & 수급 집중)',
      description: '당일 고가 돌파 및 거래대금 상위 코인을 선별 진입하는 설정입니다.',
      updatedAt: null,
      slots: []
    },
    PRESET_C: {
      id: 'PRESET_C',
      name: '야간 모드 (야간 단기 청산 & 허수 트릭 방어)',
      description: '이평선 정배열 추세 추종 및 다단 트레일링 스탑으로 수익을 지키는 설정입니다.',
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
  const [toast, setToast] = useState(null); // { id: number, message: string, type: 'success' | 'error' | 'info' }

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

  // ⚡ 3초 자동 소멸 감각적 토스트 알림 트리거
  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

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
      showToast('⏰ 장세 시간표 및 일일 킬 스위치 설정이 성공적으로 일괄 저장되었습니다!', 'success');
    } catch (e) {
      showToast('설정 저장 실패: ' + e.message, 'error');
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
      showToast('🛡️ 킬스위치 긴급 차단이 성공적으로 해제되었습니다.', 'success');
    } catch (e) {
      showToast('해제 실패: ' + e.message, 'error');
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
      showToast(`💾 [${presetName}]에 모든 슬롯 설정이 성공적으로 저장되었습니다!`, 'success');
    } catch (e) {
      showToast('프리셋 저장 실패: ' + e.message, 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 시간을 무시하고 특정 모드를 1~12번 슬롯에 즉시 강제 적용 (Apply Override)
  const handleApplyPresetNow = async (presetKey, periodKey, modeTitle = null) => {
    const displayName = modeTitle || userPresets[presetKey]?.name || presetKey;
    if (!window.confirm(`[${displayName}] 설정을 시간을 무시하고 1~12번 슬롯에 즉시 강제 적용하시겠습니까?\n\n(코인을 이미 보유 중인 슬롯은 청산 시까지 기존 포지션이 안전하게 보호됩니다)`)) return;

    // ⚡ [0초 즉시 반응] 확인 클릭 즉시 3초 자동 소멸 팝업 토스트 띄움!
    soundService?.playSuccess?.();
    showToast(`🚀 [${displayName}] 설정이 모든 슬롯에 즉시 적용되었습니다!`, 'success');

    try {
      setActionLoadingKey(`APPLY_${presetKey}`);
      // 비동기 저장 및 모드 전환 백그라운드 병렬 처리
      const loadPromise = onLoadPresetToSlots ? onLoadPresetToSlots(presetKey, periodKey) : Promise.resolve();
      const switchPromise = (onSwitchPreset && periodKey) ? onSwitchPreset(periodKey) : Promise.resolve();
      await Promise.all([loadPromise, switchPromise]);
    } catch (e) {
      console.error('모드 적용 중 오류:', e);
      showToast('⚠️ 모드 적용 중 오류가 발생했습니다: ' + (e?.message || e), 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 특정 모드 일시 정지 (Stop / Pause)
  const handleStopMode = async (presetKey, modeTitle = null) => {
    const displayName = modeTitle || userPresets[presetKey]?.name || presetKey;
    if (!window.confirm(`[${displayName}] 운용을 일시 정지하시겠습니까?\n\n신규 매수 진입이 중단되며 기존 보유 코인의 안전 매도만 유지됩니다.`)) return;

    soundService?.playAlert?.();
    showToast(`⏸️ [${displayName}] 가동이 일시 정지 상태로 전환되었습니다.`, 'info');

    try {
      setActionLoadingKey(`STOP_${presetKey}`);
    } catch (e) {
      showToast('모드 정지 실패: ' + e.message, 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // KST 기준 현재 시간 계산 (서버 응답 지연 또는 schedulerData 부재 시 대비 백업 계산)
  const getFallbackPeriod = () => {
    try {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const kst = new Date(utc + (9 * 60 * 60000));
      const curMin = kst.getHours() * 60 + kst.getMinutes();

      const [mH, mM] = (timeTable?.MORNING_START || '08:50').split(':').map(Number);
      const [aH, aM] = (timeTable?.AFTERNOON_START || '12:00').split(':').map(Number);
      const [nH, nM] = (timeTable?.NIGHT_START || '21:00').split(':').map(Number);

      const mMin = mH * 60 + mM;
      const aMin = aH * 60 + aM;
      const nMin = nH * 60 + nM;

      if (curMin >= mMin && curMin < aMin) return 'MORNING';
      if (curMin >= aMin && curMin < nMin) return 'AFTERNOON';
      return 'NIGHT';
    } catch {
      return 'NIGHT';
    }
  };

  const currentPeriod = activePeriodOverride || schedulerData?.currentPeriod || getFallbackPeriod();
  const currentPresetKey = schedulerData?.currentPresetKey || (
    currentPeriod === 'MORNING' ? 'PRESET_A' : (currentPeriod === 'AFTERNOON' ? 'PRESET_B' : 'PRESET_C')
  );
  const isKillTriggered = killSwitchData?.isTriggered || false;
  const dailyProfitKrw = killSwitchData?.dailyRealizedProfitKrw || 0;
  const capital = killSwitchData?.totalCapitalKrw || 1000000;
  const currentLossPct = ((dailyProfitKrw / capital) * 100);

  // 3개 모드 메타 데이터 (오전/오후/야간 장세)
  const modeCards = [
    {
      periodKey: 'MORNING',
      presetKey: 'PRESET_A',
      modeName: '오전 모드',
      title: '오전 모드',
      timeRange: `${timeTable.MORNING_START || '08:50'} ~ ${timeTable.AFTERNOON_START || '12:00'}`,
      icon: '☀️',
      activeCardClass: 'bg-gradient-to-b from-[#381a04]/90 via-[#220f02]/95 to-[#160901] border-2 border-amber-400 shadow-2xl shadow-amber-500/35 ring-2 ring-amber-400/50',
      activeBadgeClass: 'bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black shadow-lg shadow-amber-500/40',
      activeTagClass: 'bg-amber-950/90 text-amber-300 border-amber-500/50',
      btnApplyClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black shadow-lg shadow-amber-500/35',
      tagText: '09:00 당일 돌파 & 대형주 스윙',
      desc: '09:00 리셋 직후 당일 돌파(100~500억) 및 우량주 스윙(1~2천억)',
      specSummary: '돌파 1~4·9~10번(100~500억), 스윙 5~8·11~12번(1~2천억)'
    },
    {
      periodKey: 'AFTERNOON',
      presetKey: 'PRESET_B',
      modeName: '오후 모드',
      title: '오후 모드',
      timeRange: `${timeTable.AFTERNOON_START || '12:00'} ~ ${timeTable.NIGHT_START || '21:00'}`,
      icon: '🌤️',
      activeCardClass: 'bg-gradient-to-b from-[#033b5c]/90 via-[#022438]/95 to-[#011724] border-2 border-cyan-400 shadow-2xl shadow-cyan-400/35 ring-2 ring-cyan-400/50',
      activeBadgeClass: 'bg-gradient-to-r from-cyan-400 to-sky-400 text-black font-black shadow-lg shadow-cyan-400/40',
      activeTagClass: 'bg-cyan-950/90 text-cyan-200 border-cyan-400/50',
      btnApplyClass: 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-black font-black shadow-lg shadow-cyan-400/35',
      tagText: '거래량 감소 시간대 횡보 방어',
      desc: '오후 횡보장 휩쏘 방어 및 검증된 수급 상위 코인 선별 공략',
      specSummary: '돌파 1~4·9~10번(160~600억), 스윙 5~8·11~12번(1~2천억)'
    },
    {
      periodKey: 'NIGHT',
      presetKey: 'PRESET_C',
      modeName: '야간 모드',
      title: '야간 모드',
      timeRange: `${timeTable.NIGHT_START || '21:00'} ~ ${timeTable.MORNING_START || '08:50'}`,
      icon: '🌙',
      activeCardClass: 'bg-gradient-to-b from-[#3f0b70]/90 via-[#270646]/95 to-[#19022e] border-2 border-purple-400 shadow-2xl shadow-purple-500/40 ring-2 ring-purple-400/50',
      activeBadgeClass: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-black shadow-lg shadow-purple-500/40',
      activeTagClass: 'bg-purple-950/90 text-purple-200 border-purple-400/50',
      btnApplyClass: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black shadow-lg shadow-purple-600/40',
      tagText: '야간 단기 청산 & 허수 트릭 방어',
      desc: '미 증시 개장 전후 변동성 대응 및 9~10번 슬롯 30% 허수 트릭 방어',
      specSummary: '돌파 1~4·9~10번(200~700억), 9~10번 허수트릭(+30%), 스윙 2천억'
    }
  ];

  // 🌟 [대표님 피드백 반영] 글로벌 제어타워 섹션의 시그니처 바탕색 과감하게 차별화!
  // 오전: 황금빛 앰버 오렌지 | 오후: 선명한 청록빛 시안 | 야간: 고혹적인 로열 바이올렛 퍼플
  const getPanelThemeClasses = () => {
    if (currentPeriod === 'MORNING') {
      return {
        // ☀️ 오전 모드: 따뜻한 아침 햇살 골든 앰버 톤 (선명한 골드/오렌지)
        container: 'bg-gradient-to-br from-[#2e1503] via-[#1a0a01] to-[#220d00] border-2 border-amber-500 shadow-2xl shadow-amber-500/25 ring-1 ring-amber-500/30',
        headerBar: 'border-b border-amber-500/40 bg-gradient-to-r from-amber-950/95 via-[#2a1302] to-amber-950/95',
        badge: 'bg-amber-500/30 text-amber-200 border-amber-400/60 font-black',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/50 text-white',
        recBg: 'bg-gradient-to-r from-[#2e1503] via-[#1a0a01] to-[#220d00] border-2 border-amber-500 shadow-xl'
      };
    } else if (currentPeriod === 'AFTERNOON') {
      return {
        // 🌤️ 오후 모드: 청명하고 시원한 한낮의 청록빛 시안 톤 (선명한 시안/스카이)
        container: 'bg-gradient-to-br from-[#02314d] via-[#011c2e] to-[#01263d] border-2 border-cyan-400 shadow-2xl shadow-cyan-400/30 ring-1 ring-cyan-400/30',
        headerBar: 'border-b border-cyan-400/40 bg-gradient-to-r from-cyan-950/95 via-[#02283e] to-cyan-950/95',
        badge: 'bg-cyan-500/30 text-cyan-100 border-cyan-400/60 font-black',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-400/50 text-white',
        recBg: 'bg-gradient-to-r from-[#02314d] via-[#011c2e] to-[#01263d] border-2 border-cyan-400 shadow-xl'
      };
    } else {
      return {
        // 🌙 야간 모드: 고혹적이고 깊은 밤하늘의 로열 바이올렛/퍼플 톤 (선명한 퍼플/마젠타)
        container: 'bg-gradient-to-br from-[#360961] via-[#1c0336] to-[#2b064d] border-2 border-purple-500 shadow-2xl shadow-purple-500/35 ring-1 ring-purple-500/30',
        headerBar: 'border-b border-purple-500/40 bg-gradient-to-r from-purple-950/95 via-[#2c0750] to-purple-950/95',
        badge: 'bg-purple-500/30 text-purple-100 border-purple-400/60 font-black',
        iconBg: 'bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-purple-500/50 text-white',
        recBg: 'bg-gradient-to-r from-[#360961] via-[#1c0336] to-[#2b064d] border-2 border-purple-500 shadow-xl'
      };
    }
  };

  const panelTheme = getPanelThemeClasses();

  // 🌿 [추천전략 모드]일 때 렌더링: 초보 회원을 위한 깔끔하고 직관적인 스마트 안내 배너
  if (strategyViewMode === 'RECOMMENDED') {
    const currentModeCard = modeCards.find(m => m.periodKey === currentPeriod) || modeCards[0];
    return (
      <div className={`w-full mb-4 sm:mb-6 rounded-2xl ${panelTheme.recBg} border shadow-xl backdrop-blur-xl p-3.5 sm:p-5 transition-all duration-500`}>
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          {/* 좌측 싱그러운 추천전략 아이콘 */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-emerald-500/20 shrink-0 mt-0.5 sm:mt-0">
            🌿
          </div>

          {/* 중앙 및 우측 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {/* 상단 뱃지 & 킬스위치 행 */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI 추천전략 가동 중
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium hidden md:inline">
                  한국 표준시(KST) 장세 자동 분석
                </span>
              </div>

              {/* 킬스위치 상태 요약 뱃지 */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] sm:text-xs font-medium shrink-0">
                <span>{isKillTriggered ? '🚨' : '🛡️'}</span>
                <span className="text-slate-400 hidden sm:inline">일일 킬스위치:</span>
                <span className="text-slate-400 sm:hidden">킬스위치:</span>
                <span className={killSwitchConfig.enabled ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {killSwitchConfig.enabled ? `ON (-${killSwitchConfig.maxLossPct}%)` : 'OFF'}
                </span>
              </div>
            </div>

            {/* 메인 장세 타이틀 및 운영 시간표 ("현재 장세:" 제거 & 모바일 줄바꿈 최적화) */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <h3 className="font-extrabold text-base sm:text-lg text-emerald-300 drop-shadow flex items-center gap-1.5 break-keep">
                <span>{currentModeCard.icon}</span>
                <span>{currentModeCard.title}</span>
              </h3>
              <span className="text-[11px] sm:text-xs font-mono text-emerald-400/90 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold whitespace-nowrap">
                {currentModeCard.timeRange}
              </span>
            </div>

            {/* 안내 문구 */}
            <p className="text-[11px] sm:text-xs text-slate-300/90 mt-1 leading-snug break-keep">
              대표님을 위해 최적의 손익비와 리스크 관리 파라미터로 자동 운용되고 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ⚡ [셀프전략 모드]일 때 렌더링: 탭 없이 3개 모드가 한눈에 보이는 일체형 단일 제어 타워
  const currentModeCard = modeCards.find(m => m.periodKey === currentPeriod) || modeCards[0];
  const currentPreset = userPresets[currentModeCard.presetKey] || {};

  return (
    <div className={`w-full mb-6 rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-500 ${panelTheme.container}`}>
      {/* 최상단 글로벌 요약 헤더바 */}
      <div className={`px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b transition-all ${
        !isExpanded ? 'border-transparent bg-slate-950/75' : panelTheme.headerBar
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl shadow-lg text-white text-xl shrink-0 transition-transform duration-300 ${panelTheme.iconBg} scale-105`}>
            {!isExpanded ? currentModeCard.icon : '⚡'}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-white tracking-wide truncate">
                글로벌 통합 제어 타워
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                ⚡ 셀프전략 모드
              </span>
              {!isExpanded && (
                <span className={`px-2.5 py-0.5 text-xs font-black rounded-full border flex items-center gap-1 shadow-sm shrink-0 animate-pulse ${
                  currentPeriod === 'MORNING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : currentPeriod === 'AFTERNOON'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                }`}>
                  <span>{currentModeCard.icon}</span>
                  <span>현재 가동: {currentModeCard.title}</span>
                </span>
              )}
            </div>
            {!isExpanded ? (
              <p className="text-xs text-slate-300 flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="font-semibold text-slate-400">운영 시간:</span>
                <span className="font-mono font-bold text-amber-300 bg-slate-900/90 px-1.5 py-0.2 rounded border border-slate-700/80">
                  {currentModeCard.timeRange}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-300 font-medium truncate">
                  {currentModeCard.tagText}
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                오전 / 오후 / 야간 장세 설정 &amp; 12개 슬롯 통합 표 수정 · 모드 전환 시간표 · 일일 킬 스위치
              </p>
            )}
          </div>
        </div>

        {/* 실시간 주요 상태 뱃지 그룹 */}
        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          {/* 장세 뱃지 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-md font-bold ${panelTheme.badge}`}>
            <span>{currentModeCard.icon}</span>
            <span>{currentModeCard.title} ({currentModeCard.timeRange})</span>
          </div>

          {/* 킬스위치 상태 뱃지 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${
            isKillTriggered 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' 
              : (killSwitchConfig.enabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')
          }`}>
            <span>{isKillTriggered ? '🚨' : '🛡️'}</span>
            <span>{isKillTriggered ? '킬스위치 발동' : (killSwitchConfig.enabled ? `킬스위치 ON (-${killSwitchConfig.maxLossPct}%)` : '킬스위치 OFF')}</span>
          </div>

          {/* 접혀있을 때 빠른 수정 버튼 제공 */}
          {!isExpanded && (
            <button
              onClick={() => {
                if (onOpenTableEdit) {
                  onOpenTableEdit(currentPeriod);
                } else {
                  setEditingPresetKey(currentModeCard.presetKey);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/60 shadow-sm flex items-center gap-1 text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
              title="현재 가동 중인 모드의 12개 슬롯 표 수정 화면으로 이동"
            >
              <span>⚙️</span>
              <span>슬롯 수정</span>
            </button>
          )}

          {/* 펼치기/접기 토글 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all ml-1 cursor-pointer font-bold border border-slate-700 active:scale-95"
            title={isExpanded ? '설정창 접기' : '3개 모드 설정창 펼치기'}
          >
            <span className="text-[11px] hidden sm:inline">{isExpanded ? '접기' : '설정 펼치기'}</span>
            <svg className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              const isApplying = actionLoadingKey === `APPLY_${card.presetKey}`;
              const isSaving = actionLoadingKey === `SAVE_${card.presetKey}`;
              const isStopping = actionLoadingKey === `STOP_${card.presetKey}`;

              return (
                <div
                  key={card.periodKey}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative ${
                    isCurrentPeriod
                      ? card.activeCardClass
                      : 'bg-black/40 border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700'
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

                      {/* 상태 배지 & ⚙️ 12개 슬롯 수정 버튼 */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCurrentPeriod ? (
                          <span className={`px-2.5 py-1 text-xs font-black rounded-full shadow-md animate-pulse shrink-0 ${card.activeBadgeClass}`}>
                            ⏰ 현재 가동 중
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800/80 text-slate-400 border border-slate-700 shrink-0">
                            대기
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenTableEdit) {
                              onOpenTableEdit(card.periodKey);
                            } else {
                              setEditingPresetKey(card.presetKey);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 shadow-sm flex items-center gap-1 text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
                          title={`${card.modeName} 12개 슬롯 표 수정 화면으로 전환`}
                        >
                          <span>⚙️</span>
                          <span>수정</span>
                        </button>
                      </div>
                    </div>

                    {/* 전략 특징 태그 & 설명 */}
                    <div className="mb-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border mb-2 ${
                        isCurrentPeriod ? card.activeTagClass : 'bg-slate-800/90 text-slate-400 border-slate-700/60'
                      }`}>
                        {card.tagText}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[38px]">
                        {preset.description || card.desc}
                      </p>
                    </div>
                  </div>

                  {/* 모드 제어 액션: [🚀 지금 즉시 가동] | [⏸️ 신규 매수 중지] 2개 버튼 */}
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApplyPresetNow(card.presetKey, card.periodKey, card.title)}
                      disabled={isApplying}
                      className={`min-h-[50px] py-2 px-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                        isCurrentPeriod
                          ? card.btnApplyClass
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white'
                      }`}
                      title="스케줄 시간표와 무관하게 1~12번 슬롯에 이 모드 전략을 즉시 덮어씌워 가동합니다"
                    >
                      <span className="text-xs font-black tracking-tight flex items-center gap-1">
                        <span>🚀</span>
                        <span>지금 즉시 가동</span>
                      </span>
                      <span className="text-[11px] opacity-85 font-bold mt-0.5">
                        ({card.modeName} 전환)
                      </span>
                    </button>

                    <button
                      onClick={() => handleStopMode(card.presetKey, card.title)}
                      disabled={isStopping}
                      className="min-h-[50px] py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-rose-700 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      title="이 모드의 신규 매수 가동을 일시 정지합니다 (기존 보유 포지션 매도는 정상 유지)"
                    >
                      <span className="text-xs font-black tracking-tight flex items-center gap-1">
                        <span>⏸️</span>
                        <span>신규 매수 중지</span>
                      </span>
                      <span className="text-[11px] text-rose-300 font-bold mt-0.5">
                        ({card.modeName} 일시정지)
                      </span>
                    </button>
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
              {/* 좌측: 3단계 모드 전환 기준 시간표 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-300 block flex items-center gap-1">
                  <span>⏰</span> 모드 자동전환 기준 시간표 (KST 한국 표준시)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">☀️ 오전 모드 시작</label>
                    <input
                      type="time"
                      value={timeTable.MORNING_START}
                      onChange={(e) => setTimeTable({ ...timeTable, MORNING_START: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs sm:text-sm font-mono font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">🌤️ 오후 모드 시작</label>
                    <input
                      type="time"
                      value={timeTable.AFTERNOON_START}
                      onChange={(e) => setTimeTable({ ...timeTable, AFTERNOON_START: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs sm:text-sm font-mono font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">🌙 야간 모드 시작</label>
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

      {/* ⚙️ [v3.6.2] A/B/C 모드 세부 전략 설정 모달 */}
      <PresetStrategyModal
        isOpen={Boolean(editingPresetKey)}
        onClose={() => setEditingPresetKey(null)}
        presetKey={editingPresetKey || 'PRESET_A'}
        presetData={userPresets[editingPresetKey] || null}
        currentSlots={slots}
        timeRange={modeCards.find(m => m.presetKey === editingPresetKey)?.timeRange || ''}
        onSavePreset={onSaveCustomPreset}
      />

      {/* 🚀 3초 자동 소멸 감각적 토스트 알림 팝업 */}
      {toast && (
        <>
          <style>{`
            @keyframes toastSlideDown {
              from {
                opacity: 0;
                transform: translate(-50%, -24px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translate(-50%, 0) scale(1);
              }
            }
            @keyframes toastProgress {
              from { width: 100%; }
              to { width: 0%; }
            }
            .animate-toast-pop {
              animation: toastSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div
            role="alert"
            className={`fixed top-8 left-1/2 z-[99999] max-w-md w-[92vw] sm:w-auto px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-toast-pop ${
              toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/60 ring-1 ring-rose-500/40'
                : toast.type === 'info'
                ? 'bg-slate-900/95 border-indigo-500/80 text-indigo-100 shadow-indigo-950/60 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/60 ring-1 ring-emerald-500/40'
            }`}
          >
            <div className="text-2xl shrink-0">
              {toast.type === 'error' ? '🚨' : toast.type === 'info' ? 'ℹ️' : '🚀'}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-black tracking-tight leading-snug">
                {toast.message}
              </p>
              {/* 3초 카운트다운 프로그레스 바 */}
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    toast.type === 'error'
                      ? 'bg-rose-500'
                      : toast.type === 'info'
                      ? 'bg-indigo-400'
                      : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400'
                  }`}
                  style={{
                    animation: 'toastProgress 3s linear forwards'
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold shrink-0 cursor-pointer"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
