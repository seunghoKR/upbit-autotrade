import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService';

export default function GlobalControlPanel({
  schedulerData,
  killSwitchData,
  onSwitchPreset,
  onUpdateTimetable,
  onSwitchMode,
  onUpdateKillSwitch,
  isDevMode = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('SCHEDULER'); // 'SCHEDULER' | 'KILLSWITCH' | 'MODE'

  // 스케줄러 시간표 로컬 상태
  const [timeTable, setTimeTable] = useState({
    MORNING_START: '08:50',
    AFTERNOON_START: '12:00',
    NIGHT_START: '21:00'
  });

  // 킬 스위치 로컬 상태
  const [killSwitchConfig, setKillSwitchConfig] = useState({
    enabled: true,
    maxLossPct: 10.0,
    totalCapitalKrw: 1000000
  });

  const [savingTime, setSavingTime] = useState(false);
  const [savingKill, setSavingKill] = useState(false);

  useEffect(() => {
    if (schedulerData?.timeTable) {
      setTimeTable(schedulerData.timeTable);
    }
  }, [schedulerData?.timeTable]);

  useEffect(() => {
    if (killSwitchData) {
      setKillSwitchConfig({
        enabled: killSwitchData.enabled !== undefined ? killSwitchData.enabled : true,
        maxLossPct: killSwitchData.maxLossPct || 10.0,
        totalCapitalKrw: killSwitchData.totalCapitalKrw || 1000000
      });
    }
  }, [killSwitchData]);

  // 시간표 저장
  const handleSaveTimetable = async () => {
    try {
      setSavingTime(true);
      if (onUpdateTimetable) {
        await onUpdateTimetable(timeTable);
      }
      soundService?.playClick?.();
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

  const currentPresetKey = schedulerData?.currentPresetKey || 'MORNING';
  const currentMode = schedulerData?.globalStrategyMode || 'MODE_A';
  const isKillTriggered = killSwitchData?.isTriggered || false;
  const dailyProfitKrw = killSwitchData?.dailyRealizedProfitKrw || 0;
  const capital = killSwitchData?.totalCapitalKrw || 1000000;
  const currentLossPct = ((dailyProfitKrw / capital) * 100);

  const presetInfo = {
    MORNING: {
      label: '오전 경주마 돌파 (09:00~)',
      icon: '🌅',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      desc: '09:00 리셋 직후 활발한 수급과 당일 돌파 코인 집중 공략'
    },
    AFTERNOON: {
      label: '오후 횡보 방어 (12:00~)',
      icon: '🌤️',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      desc: '거래량 감소 시간대 뇌동매매 방어 및 슬리피지/스윙 추세 집중'
    },
    NIGHT: {
      label: '야간 단기 트레일링 (21:00~)',
      icon: '🌙',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      desc: '미 증시 개장 전후 급변동 대응, 방망이 단축 및 타이트 트레일링'
    }
  };

  const activePreset = presetInfo[currentPresetKey] || presetInfo.MORNING;

  return (
    <div className="w-full mb-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-indigo-950/80 border border-slate-700/80 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300">
      {/* 최상단 요약 헤더바 */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-950/40">
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
                제안서 1~3부 실전 탑재
              </span>
            </div>
            <p className="text-xs text-slate-400">
              3단계 장세 스케줄러 · 일일 킬스위치 · 가짜윗꼬리 10초 검증(Sustain Check) · 비동기 주문큐
            </p>
          </div>
        </div>

        {/* 실시간 주요 상태 뱃지 그룹 */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 장세 뱃지 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${activePreset.badgeClass}`}>
            <span>{activePreset.icon}</span>
            <span>{activePreset.label.split(' ')[0]} {activePreset.label.split(' ')[1]}</span>
          </div>

          {/* 전략 모드 뱃지 */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700 font-medium">
            <span>⚙️</span>
            <span>{currentMode === 'MODE_A' ? 'A모드 (하이브리드)' : 'B모드 (방망이 분할)'}</span>
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
          <div className="flex items-center gap-2 mb-4 border-b border-slate-700/60 pb-3">
            <button
              onClick={() => setActiveTab('SCHEDULER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'SCHEDULER'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>⏰</span>
              <span>3단계 장세 스케줄러 & 타임테이블</span>
            </button>

            <button
              onClick={() => setActiveTab('KILLSWITCH')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'KILLSWITCH'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>🛡️</span>
              <span>일일 킬 스위치 & 손실 리밋</span>
              {isKillTriggered && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>}
            </button>

            <button
              onClick={() => setActiveTab('MODE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'MODE'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>🔀</span>
              <span>A/B 전략 모드 스위처</span>
            </button>
          </div>

          {/* 탭 1: 장세 스케줄러 & 타임테이블 */}
          {activeTab === 'SCHEDULER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(presetInfo).map(([key, info]) => {
                  const isCurrent = currentPresetKey === key;
                  return (
                    <div
                      key={key}
                      className={`relative p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-900/60 border-slate-700/60 opacity-85 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{info.icon}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500 text-white shadow">
                            현재 활성
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1">{info.label}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3 min-h-[32px]">{info.desc}</p>
                      
                      <button
                        onClick={() => onSwitchPreset && onSwitchPreset(key)}
                        disabled={isCurrent}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 cursor-default'
                            : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isCurrent ? '가동 중' : '즉시 전환 (수동)'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 시간표 타임피커 입력 카드 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">🌅 Morning 시작:</span>
                    <input
                      type="time"
                      value={timeTable.MORNING_START}
                      onChange={(e) => setTimeTable({ ...timeTable, MORNING_START: e.target.value })}
                      className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">🌤️ Afternoon 시작:</span>
                    <input
                      type="time"
                      value={timeTable.AFTERNOON_START}
                      onChange={(e) => setTimeTable({ ...timeTable, AFTERNOON_START: e.target.value })}
                      className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">🌙 Night 시작:</span>
                    <input
                      type="time"
                      value={timeTable.NIGHT_START}
                      onChange={(e) => setTimeTable({ ...timeTable, NIGHT_START: e.target.value })}
                      className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-medium">
                    🛡️ 포지션 무결성 보장: 코인 보유 슬롯은 청산 시까지 기존 룰 보호
                  </span>
                  <button
                    onClick={handleSaveTimetable}
                    disabled={savingTime}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {savingTime ? '저장 중...' : '시간표 저장'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 탭 2: 일일 킬 스위치 & 손실 리밋 */}
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

                {/* 손실 리밋 입력 & 현재 실시간 상태 게이지 */}
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
                        className="w-24 bg-slate-950 text-white text-sm font-bold px-2 py-1 rounded border border-slate-700 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">%</span>
                      <button
                        onClick={() => handleSaveKillSwitch()}
                        disabled={savingKill}
                        className="ml-auto px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        저장
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

          {/* 탭 3: A/B 전략 모드 스위처 */}
          {activeTab === 'MODE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => onSwitchMode && onSwitchMode('MODE_A')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  currentMode === 'MODE_A'
                    ? 'bg-slate-800/90 border-purple-500 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    전략 1
                  </span>
                  {currentMode === 'MODE_A' && (
                    <span className="text-xs font-bold text-purple-400">선택됨 ✓</span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white mb-1">A모드 (하이브리드 전략)</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  • 1~8번 슬롯: 10~90초 단위 초단타 스캘핑 (웹소켓 속도 생명)<br />
                  • 9~10번 슬롯: 당일 신고가 돌파 (10초 가짜윗꼬리 검증)<br />
                  • 11~12번 슬롯: 정배열(MA5&gt;MA20) 마감봉 스윙 추종 (24H 거래대금 100억↑)
                </p>
                <div className="text-xs font-semibold text-indigo-400">
                  권장: 장세 변동성을 골고루 공략하는 표준 추천 구성
                </div>
              </div>

              <div
                onClick={() => onSwitchMode && onSwitchMode('MODE_B')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  currentMode === 'MODE_B'
                    ? 'bg-slate-800/90 border-purple-500 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    전략 2
                  </span>
                  {currentMode === 'MODE_B' && (
                    <span className="text-xs font-bold text-purple-400">선택됨 ✓</span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white mb-1">B모드 (방망이 분할 전략)</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  • 전 슬롯(1~12번): 당일 돌파 및 스윙으로 통일 구성<br />
                  • 1~8번 슬롯: 단기 타겟 (1단 5% 익절 후 즉시 청산, 2단 진입 차단)<br />
                  • 9~12번 슬롯: 10~20% 장기 타겟 와이드 트레일링
                </p>
                <div className="text-xs font-semibold text-purple-400">
                  권장: 대세 상승장이나 강력한 추세장에서 극대화된 수익 추구
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
