import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Sliders, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Sun,
  Sunrise,
  Moon,
  TrendingUp,
  DollarSign,
  Layers,
  Settings2,
  Ban,
  Check,
  ChevronRight,
  Flame,
  Power,
  ChevronUp,
  ChevronDown,
  Download,
  Sparkles,
  X
} from 'lucide-react';
import { DEFAULT_PERIOD_SLOTS, PERIOD_METAS } from '../constants/periodPresets';
import SlotTableEditor from './SlotTableEditor';
import { updateSchedulerTimetable, updateKillSwitchConfig, updateSettings } from '../services/api';

export default function OperatorStrategyStudio({
  onClose,
  currentSettings = {},
  onSaveSettings,
  excludedMarkets = [],
  userSelfSlotsMap = null
}) {
  // 현재 선택되어 수정 중인 장세 모드 ('MORNING' | 'AFTERNOON' | 'NIGHT')
  const [editingPeriod, setEditingPeriod] = useState('MORNING');
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);

  // 1. 장세별 1~12번 슬롯 데이터 (로컬 스토리지 연동)
  const [periodSlotsMap, setPeriodSlotsMap] = useState(() => {
    try {
      const saved = localStorage.getItem('nurioh_recommended_period_slots_map');
      if (saved) return JSON.parse(saved);
      const userCached = localStorage.getItem('nurioh_period_slots_map');
      if (userCached) return JSON.parse(userCached);
    } catch (e) {}
    return DEFAULT_PERIOD_SLOTS;
  });

  // 2. 스케줄 시간표 설정
  const [timeTable, setTimeTable] = useState(() => {
    try {
      const saved = localStorage.getItem('nurioh_recommended_timetable');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      MORNING_START: '08:50',
      AFTERNOON_START: '12:00',
      NIGHT_START: '21:00'
    };
  });

  // 3. 일일 킬 스위치 설정
  const [killSwitchConfig, setKillSwitchConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('nurioh_recommended_killswitch');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      maxLossPct: 10.0,
      totalCapitalKrw: 1000000
    };
  });

    const [isScheduleDirty, setIsScheduleDirty] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedTimestamp, setImportedTimestamp] = useState(null);

  // 📥 운영자 셀프전략 원클릭 가져오기 핸들러
  const handleImportSelfStrategy = (mode = 'ALL') => {
    let selfSource = userSelfSlotsMap;
    if (!selfSource) {
      try {
        const cached = localStorage.getItem('nurioh_period_slots_map');
        if (cached) selfSource = JSON.parse(cached);
      } catch (e) {}
    }
    if (!selfSource) {
      selfSource = DEFAULT_PERIOD_SLOTS;
    }

    if (mode === 'CURRENT') {
      const targetSlots = selfSource[editingPeriod] || DEFAULT_PERIOD_SLOTS[editingPeriod];
      const newMap = {
        ...periodSlotsMap,
        [editingPeriod]: JSON.parse(JSON.stringify(targetSlots))
      };
      setPeriodSlotsMap(newMap);
      setImportedTimestamp(Date.now());
      setIsScheduleDirty(true);
      window.__HAS_UNSAVED_CHANGES__ = true;
      setIsImportModalOpen(false);
      setToastMsg(`📥 운영자님의 [${PERIOD_METAS[editingPeriod]?.name || editingPeriod}] 셀프전략 12슬롯을 가져왔습니다! ✨ 검토 후 하단 [저장하기]를 눌러 배포하세요.`);
      setTimeout(() => setToastMsg(''), 5000);
    } else {
      const newMap = {
        MORNING: JSON.parse(JSON.stringify(selfSource.MORNING || DEFAULT_PERIOD_SLOTS.MORNING)),
        AFTERNOON: JSON.parse(JSON.stringify(selfSource.AFTERNOON || DEFAULT_PERIOD_SLOTS.AFTERNOON)),
        NIGHT: JSON.parse(JSON.stringify(selfSource.NIGHT || DEFAULT_PERIOD_SLOTS.NIGHT))
      };
      setPeriodSlotsMap(newMap);
      setImportedTimestamp(Date.now());
      setIsScheduleDirty(true);
      window.__HAS_UNSAVED_CHANGES__ = true;
      setIsImportModalOpen(false);
      setToastMsg('📥 운영자님의 [오전/오후/야간 전체] 셀프전략 36개 슬롯을 성공적으로 가져왔습니다! ✨ 검토 후 [저장하기]를 눌러 배포하세요.');
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  // 🛡️ 미저장 변경사항 여부 통합 계산 (시간표/킬스위치 dirty 또는 하단 슬롯 테이블 dirty)
  const hasAnyUnsaved = isScheduleDirty || Boolean(window.__HAS_UNSAVED_CHANGES__);

  // 🛡️ 브라우저 닫기/새로고침 시 경고 이벤트 등록
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isScheduleDirty || window.__HAS_UNSAVED_CHANGES__) {
        e.preventDefault();
        e.returnValue = '수정 중인 설정 내용이 아직 저장되지 않았습니다.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isScheduleDirty]);

  // 🛡️ 안전 대시보드 복귀 핸들러
  const handleCloseSafe = () => {
    if (isScheduleDirty || window.__HAS_UNSAVED_CHANGES__) {
      const ok = window.confirm("⚠️ 수정 중인 추천전략 내용이 아직 저장되지 않았습니다!\n\n저장하지 않고 대시보드로 돌아가시겠습니까?");
      if (!ok) return;
    }
    window.__HAS_UNSAVED_CHANGES__ = false;
    if (onClose) onClose();
  };

  // 💾 슬롯 저장 핸들러 (SlotTableEditor의 onSave 연동)
  const handleSavePeriodSlots = async (periodKey, updatedSlots, allSlotsMap = null) => {
    try {
      const newMap = allSlotsMap ? { ...allSlotsMap, [periodKey]: updatedSlots } : { ...periodSlotsMap, [periodKey]: updatedSlots };
      setPeriodSlotsMap(newMap);

      localStorage.setItem('nurioh_recommended_period_slots_map', JSON.stringify(newMap));
      localStorage.setItem('nurioh_period_slots_map', JSON.stringify(newMap));
      localStorage.setItem(`nurioh_preset_${periodKey}`, JSON.stringify(updatedSlots));

      try {
        await updateSettings({
          RECOMMENDED_PERIOD_SLOTS: newMap,
          DEFAULT_TRADE_AMOUNT: updatedSlots[0]?.tradeAmountKrw || 50000
        });
      } catch (apiErr) {
        console.warn('API sync warning:', apiErr);
      }

      window.__HAS_UNSAVED_CHANGES__ = false;
      setToastMsg(`🎉 [${PERIOD_METAS[periodKey]?.name || periodKey}] 공식 추천전략 12개 슬롯이 성공적으로 저장 및 실시간 배포되었습니다! ✨`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      alert('저장 실패: ' + err.message);
    }
  };

  // 💾 스케줄 시간표 & 일일 킬스위치 설정 저장
  const handleSaveScheduleAndKillSwitch = async () => {
    try {
      localStorage.setItem('nurioh_recommended_timetable', JSON.stringify(timeTable));
      localStorage.setItem('nurioh_recommended_killswitch', JSON.stringify(killSwitchConfig));

      try {
        await updateSchedulerTimetable(timeTable);
        await updateKillSwitchConfig(killSwitchConfig);
      } catch (e) {
        console.warn('Backend sync:', e);
      }

      setIsScheduleDirty(false);
      window.__HAS_UNSAVED_CHANGES__ = false;
      setToastMsg('💾 스케줄 시간표 및 일일 킬 스위치 공식 설정이 성공적으로 저장되었습니다! ✅');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      alert('스케줄 저장 실패: ' + err.message);
    }
  };

  return (
    <div className="w-full space-y-6 min-w-0 animate-in fade-in pb-12">
      
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-500/90 text-white font-black text-xs shadow-2xl flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 🌟 1. 상단 글로벌 제어 센터: '추천전략 관리센터' (GlobalControlPanel과 동일한 w-full 너비) */}
      <div className="w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-950/20 backdrop-blur-md transition-all">
        
        {/* 타이틀 헤더 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shadow-md">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  추천전략 관리센터
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  운영자 공식 추천 모드
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                오전 / 오후 / 야간 장세 설정 & 12개 슬롯 통합 표준 수정 · 모드 전환 시간표 · 일일 킬 스위치
              </p>
            </div>
          </div>

          {/* 우측 상단 액션: 대시보드로 복귀 버튼, 내 셀프전략 가져오기 & 상태 인디케이터 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCloseSafe}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-400 text-amber-200 hover:text-slate-950 border border-amber-400/60 hover:border-amber-300 transition-all duration-200 flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95 shadow-md shadow-amber-950/40 hover:shadow-amber-500/30"
              title="대시보드로 복귀"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>대시보드로 복귀</span>
            </button>

            {/* 📥 운영자 셀프전략 가져오기 버튼 */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 hover:from-purple-600 hover:to-indigo-600 text-purple-200 hover:text-white border border-purple-400/50 hover:border-purple-300 transition-all duration-200 flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95 shadow-md shadow-purple-950/50 hover:shadow-purple-500/30"
              title="운영자가 직접 설정한 셀프전략(오전/오후/야간)을 추천전략으로 한 번에 가져오기"
            >
              <Download className="w-4 h-4 text-purple-300 stroke-[2.5]" />
              <span>내 셀프전략 가져오기</span>
            </button>

            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-amber-300 font-bold text-[11px]">
                {editingPeriod === 'MORNING' ? '오전 모드 편집 중' : editingPeriod === 'AFTERNOON' ? '오후 모드 편집 중' : '야간 모드 편집 중'}
              </span>
            </div>
          </div>
        </div>

        {/* 3가지 장세 모드 카드 (오전 / 오후 / 야간) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
          
          {/* 1. 오전 모드 카드 */}
          <div className={`p-4 rounded-xl border transition-all ${
            editingPeriod === 'MORNING'
              ? 'bg-amber-950/30 border-amber-500/80 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">☀️</span>
                <div>
                  <h3 className="font-black text-sm text-slate-100">오전 모드</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    시간대: {timeTable.MORNING_START} ~ {timeTable.AFTERNOON_START}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {editingPeriod === 'MORNING' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    편집 활성
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingPeriod('MORNING')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>수정</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                09:00 당일 돌파 & 대형주 스윙
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                09:00 리셋 직후 당일 돌파(100~500억) 및 우량주 스윙(1~2천억) 중심의 1~12번 공식 추천 포지션
              </p>
            </div>
          </div>

          {/* 2. 오후 모드 카드 */}
          <div className={`p-4 rounded-xl border transition-all ${
            editingPeriod === 'AFTERNOON'
              ? 'bg-sky-950/30 border-sky-500/80 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/50'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌤️</span>
                <div>
                  <h3 className="font-black text-sm text-slate-100">오후 모드</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    시간대: {timeTable.AFTERNOON_START} ~ {timeTable.NIGHT_START}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {editingPeriod === 'AFTERNOON' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                    편집 활성
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingPeriod('AFTERNOON')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-sky-400" />
                  <span>수정</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="inline-block px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">
                거래량 감소 시간대 횡보 방어
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                오후 횡보장 휩쏘 방어 및 검증된 수급 상위 코인 선별 공략 표준 설정
              </p>
            </div>
          </div>

          {/* 3. 야간 모드 카드 */}
          <div className={`p-4 rounded-xl border transition-all ${
            editingPeriod === 'NIGHT'
              ? 'bg-purple-950/30 border-purple-500/80 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌙</span>
                <div>
                  <h3 className="font-black text-sm text-slate-100">야간 모드</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    시간대: {timeTable.NIGHT_START} ~ {timeTable.MORNING_START}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {editingPeriod === 'NIGHT' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                    편집 활성
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingPeriod('NIGHT')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-purple-400" />
                  <span>수정</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="inline-block px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                미 증시 개장 변동성 & 허수 트릭 방어
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                미 증시 개장 전후 변동성 대응 및 9~10번 슬롯 30% 허수 트릭 방어 표준 설정
              </p>
            </div>
          </div>

        </div>

        {/* 스케줄 시간표 및 일일 킬 스위치 통합 설정 (접고 펼치기 지원) */}
        <div className="border border-slate-800/80 rounded-xl bg-slate-950/70 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-3">
            <div 
              onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <Settings2 className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-200">
                스케줄 시간표 및 일일 킬 스위치 통합 설정
              </h4>
              <span className="text-[10px] text-slate-500 hidden sm:inline">(모든 모드와 슬롯에 즉시 일괄 적용됩니다)</span>
              {isScheduleExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>

            {isScheduleExpanded && (
              <button
                type="button"
                onClick={handleSaveScheduleAndKillSwitch}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md self-end sm:self-auto"
              >
                <Save className="w-3 h-3 text-emerald-200" />
                <span>변경된 시간표 &amp; 킬스위치 설정 저장하기</span>
              </button>
            )}
          </div>

          {isScheduleExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in">
              {/* 1. 모드 자동전환 기준 시간표 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <span>⏰ 모드 자동전환 기준 시간표 (KST 한국 표준시)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">● 오전 모드 시작</span>
                    <input
                      type="time"
                      value={timeTable.MORNING_START}
                      onChange={(e) => {
                        setIsScheduleDirty(true);
                        window.__HAS_UNSAVED_CHANGES__ = true;
                        setTimeTable(prev => ({ ...prev, MORNING_START: e.target.value }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-slate-200"
                    />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
                    <span className="text-[10px] text-sky-400 font-bold block mb-1">● 오후 모드 시작</span>
                    <input
                      type="time"
                      value={timeTable.AFTERNOON_START}
                      onChange={(e) => {
                        setIsScheduleDirty(true);
                        window.__HAS_UNSAVED_CHANGES__ = true;
                        setTimeTable(prev => ({ ...prev, AFTERNOON_START: e.target.value }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-slate-200"
                    />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
                    <span className="text-[10px] text-purple-400 font-bold block mb-1">● 야간 모드 시작</span>
                    <input
                      type="time"
                      value={timeTable.NIGHT_START}
                      onChange={(e) => {
                        setIsScheduleDirty(true);
                        window.__HAS_UNSAVED_CHANGES__ = true;
                        setTimeTable(prev => ({ ...prev, NIGHT_START: e.target.value }));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* 2. 일일 킬 스위치 */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>일일 킬 스위치 (당일 최대 손실 차단)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* ON/OFF 스위치 (GlobalControlPanel과 100% 동일) */}
                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">작동 스위치</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduleDirty(true);
                          window.__HAS_UNSAVED_CHANGES__ = true;
                          setKillSwitchConfig(prev => ({ ...prev, enabled: !prev.enabled }));
                        }}
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

                  {/* 손실폭 설정 (GlobalControlPanel과 100% 동일) */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 block font-bold mb-1">최대 손실폭 (%)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-rose-400">-</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="50"
                        value={killSwitchConfig.maxLossPct}
                        onChange={(e) => {
                          setIsScheduleDirty(true);
                          window.__HAS_UNSAVED_CHANGES__ = true;
                          setKillSwitchConfig(prev => ({ ...prev, maxLossPct: Number(e.target.value) }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-rose-400 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 🌟 2. 하단 12개 슬롯 전략 수정모드 (셀프전략의 SlotTableEditor 컴포넌트 100% 동일 직접 렌더링!) */}
      <div className="w-full min-w-0">
        <SlotTableEditor
          targetPeriod={editingPeriod}
          periodSlotsMap={periodSlotsMap}
          importedTimestamp={importedTimestamp}
          showBackButton={false}
          initialSlots={periodSlotsMap?.[editingPeriod] || DEFAULT_PERIOD_SLOTS[editingPeriod]}
          onSave={(period, updatedSlots, allSlotsMap) => {
            handleSavePeriodSlots(period, updatedSlots, allSlotsMap);
          }}
          onCancel={onClose}
          onChangePeriod={(period) => {
            setEditingPeriod(period);
          }}
        />
      </div>

      {/* 📥 운영자 셀프전략 원클릭 가져오기 모달 */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-purple-950/80 space-y-4">
            
            {/* 모달 상단 헤더 */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Download className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">운영자 셀프전략 한 번에 가져오기</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      운영자 전용
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    운영자님께서 직접 설정하신 [셀프전략]의 슬롯 세팅을 추천전략 작업대로 그대로 복사합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 가져오기 옵션 선택 카드 2종 */}
            <div className="space-y-3 pt-1">
              {/* 옵션 1: 현재 모드만 가져오기 */}
              <button
                type="button"
                onClick={() => handleImportSelfStrategy('CURRENT')}
                className="w-full text-left p-3.5 rounded-xl bg-slate-950/70 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/60 transition group cursor-pointer relative"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {editingPeriod === 'MORNING' ? '☀️' : editingPeriod === 'AFTERNOON' ? '🌤️' : '🌙'}
                    </span>
                    <span className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition">
                      현재 모드 [{PERIOD_METAS[editingPeriod]?.name || editingPeriod}] 12슬롯만 가져오기
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    현재 편집 탭
                  </span>
                </div>
                <p className="text-xs text-slate-400 pl-7">
                  현재 보고 계신 12개 슬롯만 운영자님의 최신 셀프전략으로 교체합니다. 다른 모드는 그대로 유지됩니다.
                </p>
              </button>

              {/* 옵션 2: 오전/오후/야간 전체 모드 가져오기 */}
              <button
                type="button"
                onClick={() => handleImportSelfStrategy('ALL')}
                className="w-full text-left p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-950/70 hover:from-purple-900/50 hover:to-indigo-900/40 border border-purple-500/50 hover:border-purple-400 transition group cursor-pointer relative shadow-lg shadow-purple-950/30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <span className="text-sm font-black text-purple-200 group-hover:text-white transition">
                      오전 + 오후 + 야간 (총 36개 슬롯) 전체 한 번에 가져오기
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 font-black animate-pulse">
                    ⚡ 추천 (원클릭 동기화)
                  </span>
                </div>
                <p className="text-xs text-slate-300/80 pl-7">
                  오전, 오후, 야간 3개 장세의 모든 슬롯(총 36개)을 운영자님의 셀프전략으로 통째로 한 번에 동기화합니다.
                </p>
              </button>
            </div>

            {/* 하단 안내 및 취소 버튼 */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                가져온 후에는 슬롯 표에서 내용을 검토하신 뒤, 하단의 <strong className="text-emerald-400 font-bold">[저장하기]</strong> 버튼을 누르셔야 공식 추천전략으로 최종 저장 및 배포됩니다.
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
