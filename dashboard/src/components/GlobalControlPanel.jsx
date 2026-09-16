import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService';

export default function GlobalControlPanel({
  schedulerData,
  killSwitchData,
  slots = [],
  onSwitchPreset,
  onUpdateTimetable,
  onSwitchMode,
  onSaveCurrentSlotsToPreset,
  onLoadPresetToSlots,
  onUpdateKillSwitch,
  isDevMode = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('SCHEDULER'); // 'SCHEDULER' | 'KILLSWITCH' | 'MODE'

  // 1. 스케줄러 시간표 로컬 상태
  const [timeTable, setTimeTable] = useState({
    MORNING_START: '08:50',
    AFTERNOON_START: '12:00',
    NIGHT_START: '21:00'
  });

  // 2. ⏰ [제안서 2부/3.5.0] 장세별 프리셋 드롭다운 매핑 (오전/오후/야간)
  const [scheduleMapping, setScheduleMapping] = useState({
    MORNING: 'PRESET_A',
    AFTERNOON: 'PRESET_B',
    NIGHT: 'PRESET_C'
  });

  // 3. 🔀 [제안서 1부/3.5.0] 사용자 정의 동적 전략 프리셋 (Preset A, B, C - 자동차 메모리 시트 방식 빈 템플릿)
  const [userPresets, setUserPresets] = useState({
    PRESET_A: {
      id: 'PRESET_A',
      name: 'A모드 (메모리 1번)',
      description: '대표님이 설정한 1~12번 슬롯 설정을 자유롭게 저장/불러오는 빈 템플릿입니다.',
      updatedAt: null,
      slots: []
    },
    PRESET_B: {
      id: 'PRESET_B',
      name: 'B모드 (메모리 2번)',
      description: '오후장 또는 특정 장세에 맞춘 1~12번 슬롯 커스텀 설정 보관 공간입니다.',
      updatedAt: null,
      slots: []
    },
    PRESET_C: {
      id: 'PRESET_C',
      name: 'C모드 (메모리 3번)',
      description: '야간장 또는 급변동 대응용 1~12번 슬롯 커스텀 설정 보관 공간입니다.',
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

  const [savingTime, setSavingTime] = useState(false);
  const [savingKill, setSavingKill] = useState(false);
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

  // 시간표 & 프리셋 매핑 저장
  const handleSaveTimetable = async () => {
    try {
      setSavingTime(true);
      if (onUpdateTimetable) {
        await onUpdateTimetable(timeTable, scheduleMapping);
      }
      soundService?.playClick?.();
      alert('⏰ 장세 시간표 및 시간대별 프리셋 매핑이 성공적으로 저장되었습니다!');
    } catch (e) {
      alert('시간표 저장 실패: ' + e.message);
    } finally {
      setSavingTime(false);
    }
  };

  // 킬스위치 설정 저장
  const handleSaveKillSwitch = async (overrides = {}) => {
    try {
      setSavingKill(true);
      const payload = { ...killSwitchConfig, ...overrides };
      if (onUpdateKillSwitch) {
        await onUpdateKillSwitch(payload);
      }
      soundService?.playClick?.();
      alert(`🛡️ 일일 킬 스위치 설정(최대 손실 -${payload.maxLossPct}%)이 안전하게 저장되었습니다!`);
    } catch (e) {
      alert('킬 스위치 설정 저장 실패: ' + e.message);
    } finally {
      setSavingKill(false);
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

  // 모든 슬롯 상태를 특정 프리셋(A, B, C)으로 저장 (Save)
  const handleSavePreset = async (presetKey) => {
    const presetName = userPresets[presetKey]?.name || presetKey;
    if (!window.confirm(`모든 슬롯(1~12번)의 파라미터 설정을 [${presetName}]에 덮어쓰기 저장하시겠습니까?`)) return;

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

  // 특정 프리셋(A, B, C)을 1~12번 슬롯에 적용하기 (Apply/Load)
  const handleLoadPreset = async (presetKey) => {
    const presetName = userPresets[presetKey]?.name || presetKey;
    if (!window.confirm(`[${presetName}] 설정을 1~12번 슬롯에 즉시 적용하시겠습니까?\n(코인을 이미 보유 중인 슬롯은 청산 시까지 기존 포지션이 안전하게 보호됩니다)`)) return;

    try {
      setActionLoadingKey(`LOAD_${presetKey}`);
      if (onLoadPresetToSlots) {
        await onLoadPresetToSlots(presetKey);
      }
      soundService?.playSuccess?.();
      alert(`📥 [${presetName}] 설정이 1~12번 슬롯에 성공적으로 적용되었습니다!`);
    } catch (e) {
      alert('프리셋 적용 실패: ' + e.message);
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

  // 장세 주기 정보
  const periodInfo = {
    MORNING: {
      label: '오전 경주마 돌파',
      defaultTime: '08:50',
      timeKey: 'MORNING_START',
      icon: '🌅',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      desc: '09:00 리셋 직후 활발한 수급과 당일 돌파 코인 집중 공략'
    },
    AFTERNOON: {
      label: '오후 횡보 방어',
      defaultTime: '12:00',
      timeKey: 'AFTERNOON_START',
      icon: '🌤️',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      desc: '거래량 감소 시간대 뇌동매매 방어 및 슬리피지/스윙 추세 집중'
    },
    NIGHT: {
      label: '야간 단기 트레일링',
      defaultTime: '21:00',
      timeKey: 'NIGHT_START',
      icon: '🌙',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      desc: '미 증시 개장 전후 급변동 대응, 방망이 단축 및 타이트 트레일링'
    }
  };

  const activePeriod = periodInfo[currentPeriod] || periodInfo.MORNING;

  return (
    <div className="w-full mb-6 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-indigo-950/85 border border-slate-700/80 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
      {/* 최상단 글로벌 요약 헤더바 */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-950/50">
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
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                제안서 1~3부 & 동적 프리셋 템플릿
              </span>
            </div>
            <p className="text-xs text-slate-400">
              3단계 장세 스케줄러(드롭다운 매핑) · A/B/C 프리셋 CRUD · 일일 킬스위치 · 10초 가짜윗꼬리 검증
            </p>
          </div>
        </div>

        {/* 실시간 주요 상태 뱃지 그룹 */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 장세 뱃지 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${activePeriod.badgeClass}`}>
            <span>{activePeriod.icon}</span>
            <span>{activePeriod.label} ({timeTable[activePeriod.timeKey] || activePeriod.defaultTime}~)</span>
          </div>

          {/* 현재 실행 중인 프리셋 뱃지 */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-950/80 text-indigo-200 border border-indigo-500/40 font-medium shadow-sm">
            <span>🔀</span>
            <span>현재 모드: {userPresets[currentPresetKey]?.name || currentPresetKey}</span>
          </div>

          {/* 킬스위치 상태 뱃지 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${
            isKillTriggered 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' 
              : (killSwitchConfig.enabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')
          }`}>
            <span>{isKillTriggered ? '🚨' : '🛡️'}</span>
            <span>{isKillTriggered ? '킬스위치 발동 (매수차단)' : (killSwitchConfig.enabled ? `킬스위치 ON (-${killSwitchConfig.maxLossPct}%)` : '킬스위치 OFF')}</span>
          </div>

          {/* 👑 Last Action Wins 최근 명령 표시 뱃지 */}
          {schedulerData?.lastAction && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/40 font-medium">
              <span>👑</span>
              <span>
                최근 작동: {
                  schedulerData.lastAction.source === 'AUTO_TIME_SCHEDULE' ? '⏰ 스케줄러 자동' :
                  schedulerData.lastAction.source === 'MANUAL_PERIOD_BUTTON' ? '⚡ 수동 장세 버튼' :
                  schedulerData.lastAction.source === 'MANUAL_USER' ? '📥 수동 모드 로드' : '초기화'
                }
              </span>
            </div>
          )}

          {/* 펼치기/접기 토글 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-1"
            title={isExpanded ? '접기' : '펼치기'}
          >
            <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 펼쳐졌을 때의 탭 및 세부 설정 영역 */}
      {isExpanded && (
        <div className="p-5">
          {/* 탭 네비게이션 */}
          <div className="flex items-center gap-2 mb-4 border-b border-slate-700/60 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('SCHEDULER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'SCHEDULER'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>⏰</span>
              <span>3단계 장세 스케줄러 & 타임테이블</span>
            </button>

            <button
              onClick={() => setActiveTab('MODE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'MODE'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>🔀</span>
              <span>A/B/C 전략 모드 프리셋 관리자 (동적 CRUD)</span>
            </button>

            <button
              onClick={() => setActiveTab('KILLSWITCH')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'KILLSWITCH'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>🛡️</span>
              <span>일일 킬 스위치 & 손실 리밋</span>
              {isKillTriggered && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>}
            </button>
          </div>

          {/* 탭 1: 3단계 장세 스케줄러 & 타임테이블 (프리셋 매핑 드롭다운 탑재) */}
          {activeTab === 'SCHEDULER' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Object.entries(periodInfo).map(([key, info]) => {
                  const isCurrent = currentPeriod === key;
                  const selectedPresetKey = scheduleMapping[key] || (key === 'MORNING' ? 'PRESET_A' : (key === 'AFTERNOON' ? 'PRESET_B' : 'PRESET_C'));

                  return (
                    <div
                      key={key}
                      className={`relative p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-500/10'
                          : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl">{info.icon}</span>
                          {isCurrent ? (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500 text-white shadow-md animate-pulse">
                              현재 시간대 가동 중
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-400 font-mono font-bold bg-slate-950/60 px-2.5 py-0.5 rounded-lg border border-slate-800">
                              시작: {timeTable[info.timeKey] || info.defaultTime}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-base sm:text-lg text-white mb-1.5">{info.label}</h4>
                        <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed mb-4 min-h-[40px]">{info.desc}</p>

                        {/* 🎯 [제안서 2부/3.5.0 요구사항] 해당 시간대 실행할 전략 프리셋 선택 드롭다운 */}
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-700/80 mb-4 shadow-inner">
                          <label className="text-xs font-bold text-indigo-300 block mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1">🎯 실행할 전략 프리셋:</span>
                            <span className="text-[11px] text-slate-400 font-normal">자동 주입 매핑</span>
                          </label>
                          <select
                            value={selectedPresetKey}
                            onChange={(e) => setScheduleMapping(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-slate-900 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="PRESET_A">🅰️ {userPresets.PRESET_A?.name || 'A모드 (메모리 1번)'}</option>
                            <option value="PRESET_B">🅱️ {userPresets.PRESET_B?.name || 'B모드 (메모리 2번)'}</option>
                            <option value="PRESET_C">🅲 {userPresets.PRESET_C?.name || 'C모드 (메모리 3번)'}</option>
                            <option value="NONE">⏸️ 변경 없음 (기존 슬롯 설정 유지)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => onSwitchPreset && onSwitchPreset(key)}
                        disabled={isCurrent}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                          isCurrent
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 cursor-default'
                            : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border border-slate-700 cursor-pointer active:scale-95'
                        }`}
                      >
                        {isCurrent ? '현재 시간대 실행 중' : '이 시간대 설정 즉시 가동'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 시간표 타임피커 & 매핑 저장 컨트롤 바 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">🌅 Morning 시작:</span>
                    <input
                      type="time"
                      value={timeTable.MORNING_START}
                      onChange={(e) => setTimeTable({ ...timeTable, MORNING_START: e.target.value })}
                      className="bg-slate-900 text-white text-xs sm:text-sm font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none shadow-inner"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">🌤️ Afternoon 시작:</span>
                    <input
                      type="time"
                      value={timeTable.AFTERNOON_START}
                      onChange={(e) => setTimeTable({ ...timeTable, AFTERNOON_START: e.target.value })}
                      className="bg-slate-900 text-white text-xs sm:text-sm font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none shadow-inner"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">🌙 Night 시작:</span>
                    <input
                      type="time"
                      value={timeTable.NIGHT_START}
                      onChange={(e) => setTimeTable({ ...timeTable, NIGHT_START: e.target.value })}
                      className="bg-slate-900 text-white text-xs sm:text-sm font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-medium hidden lg:inline bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    🛡️ 포지션 무결성: 보유 슬롯은 청산 시까지 기존 진입 룰 유지
                  </span>
                  <button
                    onClick={handleSaveTimetable}
                    disabled={savingTime}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {savingTime ? '저장 중...' : '시간표 & 프리셋 매핑 저장'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 탭 2: A/B/C 전략 모드 프리셋 관리자 (동적 CRUD - 하드코딩 텍스트 전면 교체) */}
          {activeTab === 'MODE' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none">🚗</span>
                    <div className="leading-relaxed">
                      <strong>자동차 메모리 시트 원리 (빈 템플릿):</strong><br />
                      고정된 세팅이 아닙니다! 대표님이 1~12번 슬롯을 입맛대로 설정한 후 <strong>[💾 모든 슬롯 설정을 이 모드로 저장]</strong>을 누르면 전체가 덮어씌워져 저장되고, 필요할 때 <strong>[📥 이 모드를 1~12번 슬롯에 적용하기]</strong> 버튼 한 번으로 즉시 반영됩니다.
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded shrink-0 self-start">
                    총 {slots.length || 12}개 슬롯 연동
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-purple-500/20 text-purple-300/90 text-[11px]">
                  <span>👑</span>
                  <span>
                    <strong>우선순위 (Last Action Wins):</strong> 스케줄러가 돌아가는 중이라도 수동으로 모드를 불러오면 즉시 해당 모드가 우선(Override) 가동되며, 다음 스케줄 시간(예: 21:00)에 도달하면 스케줄 세팅으로 자동 전환됩니다.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['PRESET_A', 'PRESET_B', 'PRESET_C'].map((presetKey) => {
                  const preset = userPresets[presetKey] || {};
                  const isCurrentActive = currentPresetKey === presetKey;
                  const hasSavedSlots = Array.isArray(preset.slots) && preset.slots.length > 0;
                  const isLoadingSave = actionLoadingKey === `SAVE_${presetKey}`;
                  const isLoadingLoad = actionLoadingKey === `LOAD_${presetKey}`;

                  const iconMap = { PRESET_A: '🅰️', PRESET_B: '🅱️', PRESET_C: '🅲' };
                  const colorClassMap = {
                    PRESET_A: 'border-indigo-500/60 hover:border-indigo-400',
                    PRESET_B: 'border-purple-500/60 hover:border-purple-400',
                    PRESET_C: 'border-emerald-500/60 hover:border-emerald-400'
                  };

                  return (
                    <div
                      key={presetKey}
                      className={`p-5 rounded-2xl border bg-slate-900/80 flex flex-col justify-between transition-all ${
                        isCurrentActive
                          ? 'ring-2 ring-purple-500/40 border-purple-500 bg-slate-800/90 shadow-xl shadow-purple-900/20'
                          : colorClassMap[presetKey]
                      }`}
                    >
                      <div>
                        {/* 카드 상단 헤더 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{iconMap[presetKey]}</span>
                            <h4 className="font-extrabold text-base sm:text-lg text-white">{preset.name || presetKey}</h4>
                          </div>
                          {isCurrentActive && (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500 text-white shadow-md animate-pulse">
                              현재 활성 ✓
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-[13px] text-slate-300 mb-4 min-h-[38px] leading-relaxed">
                          {preset.description || '사용자 커스텀 슬롯 전략 템플릿'}
                        </p>

                        {/* 프리셋 메타 정보 요약 */}
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-5 space-y-2 text-xs sm:text-[13px] shadow-inner">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>저장된 슬롯 데이터:</span>
                            <span className="font-extrabold text-slate-100">
                              {hasSavedSlots ? `${preset.slots.length}개 슬롯 구성` : '기본 권장 프리셋'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>최근 업데이트:</span>
                            <span className="font-mono text-xs text-slate-300 font-bold">
                              {preset.updatedAt ? new Date(preset.updatedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '초기 템플릿'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 그룹: 저장(Save) & 적용하기(Load) */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-800">
                        <button
                          onClick={() => handleSavePreset(presetKey)}
                          disabled={isLoadingSave}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                          <span>💾</span>
                          <span>{isLoadingSave ? '저장 중...' : `모든 슬롯 설정을 ${preset.name ? preset.name.split(' ')[0] : '이 모드'}로 저장`}</span>
                        </button>

                        <button
                          onClick={() => handleLoadPreset(presetKey)}
                          disabled={isLoadingLoad}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                          <span>📥</span>
                          <span>{isLoadingLoad ? '적용 중...' : `이 모드를 1~12번 슬롯에 적용하기`}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 탭 3: 일일 킬 스위치 & 손실 리밋 (Input Form 활성화) */}
          {activeTab === 'KILLSWITCH' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const newEnabled = !killSwitchConfig.enabled;
                        setKillSwitchConfig({ ...killSwitchConfig, enabled: newEnabled });
                        handleSaveKillSwitch({ enabled: newEnabled });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        killSwitchConfig.enabled ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          killSwitchConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        일일 킬 스위치 하드 블로킹
                        {killSwitchConfig.enabled ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            ON 활성화
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700 text-slate-400">
                            OFF 비활성
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        급락장에서 당일 누적 실현 손실이 기준치에 도달하면 익일 09:00(KST)까지 신규 매수를 완전 차단합니다.
                      </p>
                    </div>
                  </div>

                  {isKillTriggered && (
                    <button
                      onClick={handleResetKillTrigger}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 animate-pulse"
                    >
                      🔓 차단 긴급 해제 (매수 재개)
                    </button>
                  )}
                </div>

                {/* 손실 리밋 입력 폼 & 실시간 상태 게이지 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">최대 허용 손실폭 (%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rose-400">-</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="50"
                        value={killSwitchConfig.maxLossPct}
                        onChange={(e) => setKillSwitchConfig({ ...killSwitchConfig, maxLossPct: e.target.value })}
                        className="w-24 bg-slate-950 text-white text-sm font-bold px-2.5 py-1.5 rounded border border-slate-700 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">%</span>
                      <button
                        onClick={() => handleSaveKillSwitch()}
                        disabled={savingKill}
                        className="ml-auto px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
                      >
                        {savingKill ? '저장 중' : '저장'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">당일 누적 실현손익</span>
                    <div className="text-sm font-bold">
                      <span className={dailyProfitKrw >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {dailyProfitKrw >= 0 ? '+' : ''}{Math.round(dailyProfitKrw).toLocaleString()}원
                      </span>
                      <span className="text-xs text-slate-400 ml-2 font-normal">
                        ({currentLossPct >= 0 ? '+' : ''}{currentLossPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">킬스위치 상태</span>
                    <div className="text-sm font-bold">
                      {isKillTriggered ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          🚨 하드 차단 작동 중 (매수 불가)
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          ✅ 안전 (정상 매매 중)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
