import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  RotateCcw, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Flame, 
  Zap, 
  Save,
  ArrowLeft,
  Coins,
  AlertTriangle,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { PERIOD_METAS, DEFAULT_PERIOD_SLOTS } from '../constants/periodPresets';

// 💡 직관적인 마우스 호버/터치 툴팁 컴포넌트 (방법 A)
function HelpTooltip({ text, width = 'w-64' }) {
  return (
    <span className="relative inline-flex items-center group cursor-help select-none align-middle ml-1">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition-colors" />
      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block ${width} p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-normal normal-case shadow-2xl z-50 pointer-events-none animate-in fade-in`}>
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  );
}

export default function SlotTableEditor({
  targetPeriod = 'MORNING',
  initialSlots = [],
  periodSlotsMap = null,
  importedTimestamp = null,
  showBackButton = true,
  onSave,
  onCancel,
  onChangePeriod
}) {
  const [currentPeriod, setCurrentPeriod] = useState(targetPeriod);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  
  // 3개 장세(오전/오후/야간)의 전체 12개 슬롯 상태를 일원화 관리
  const [allSlotsMap, setAllSlotsMap] = useState(() => {
    const base = periodSlotsMap ? JSON.parse(JSON.stringify(periodSlotsMap)) : {};
    return {
      MORNING: base.MORNING || (Array.isArray(initialSlots) && initialSlots.length === 12 && targetPeriod === 'MORNING' ? JSON.parse(JSON.stringify(initialSlots)) : DEFAULT_PERIOD_SLOTS.MORNING),
      AFTERNOON: base.AFTERNOON || (Array.isArray(initialSlots) && initialSlots.length === 12 && targetPeriod === 'AFTERNOON' ? JSON.parse(JSON.stringify(initialSlots)) : DEFAULT_PERIOD_SLOTS.AFTERNOON),
      NIGHT: base.NIGHT || (Array.isArray(initialSlots) && initialSlots.length === 12 && targetPeriod === 'NIGHT' ? JSON.parse(JSON.stringify(initialSlots)) : DEFAULT_PERIOD_SLOTS.NIGHT),
    };
  });

  const [dirtyPeriods, setDirtyPeriods] = useState({});

  // targetPeriod prop 변경 시 동기화
  useEffect(() => {
    if (targetPeriod && targetPeriod !== currentPeriod) {
      setCurrentPeriod(targetPeriod);
    }
  }, [targetPeriod]);

  // 부모의 periodSlotsMap이 새로 들어왔을 때 초기화
  useEffect(() => {
    if (periodSlotsMap) {
      setAllSlotsMap(prev => ({
        MORNING: periodSlotsMap.MORNING ? JSON.parse(JSON.stringify(periodSlotsMap.MORNING)) : prev.MORNING,
        AFTERNOON: periodSlotsMap.AFTERNOON ? JSON.parse(JSON.stringify(periodSlotsMap.AFTERNOON)) : prev.AFTERNOON,
        NIGHT: periodSlotsMap.NIGHT ? JSON.parse(JSON.stringify(periodSlotsMap.NIGHT)) : prev.NIGHT,
      }));
    }
  }, [periodSlotsMap]);

  // 외부에서 셀프전략 일괄 가져오기(Import) 실행 시 dirty 상태 동기화
  useEffect(() => {
    if (importedTimestamp) {
      setDirtyPeriods({
        MORNING: true,
        AFTERNOON: true,
        NIGHT: true
      });
      window.__HAS_UNSAVED_CHANGES__ = true;
    }
  }, [importedTimestamp]);

  // 현재 선택된 장세의 슬롯 목록
  const tableSlots = allSlotsMap[currentPeriod] || DEFAULT_PERIOD_SLOTS[currentPeriod] || DEFAULT_PERIOD_SLOTS.MORNING;

  // 현재 선택된 장세 메타
  const periodMeta = PERIOD_METAS[currentPeriod] || PERIOD_METAS.MORNING;

  // 장세 탭 전환 핸들러 (자유로운 모드 간 이동 및 데이터 보존)
  const handlePeriodTabClick = (periodKey) => {
    setCurrentPeriod(periodKey);
    if (onChangePeriod) {
      onChangePeriod(periodKey);
    }
  };

  // 특정 슬롯 필드 값 변경
  const handleFieldChange = (slotId, field, value) => {
    setAllSlotsMap(prevMap => {
      const currentList = prevMap[currentPeriod] || DEFAULT_PERIOD_SLOTS[currentPeriod];
      const updatedList = currentList.map(s => {
        if (s.slotId === slotId) {
          return { ...s, [field]: value };
        }
        return s;
      });
      return {
        ...prevMap,
        [currentPeriod]: updatedList
      };
    });
    setDirtyPeriods(prev => ({ ...prev, [currentPeriod]: true }));
  };

  // 전략 모드 변경 시 해당 전략에 맞는 합리적 디폴트값 보정
  const handleStrategyModeChange = (slotId, newMode) => {
    setAllSlotsMap(prevMap => {
      const currentList = prevMap[currentPeriod] || DEFAULT_PERIOD_SLOTS[currentPeriod];
      const updatedList = currentList.map(s => {
        if (s.slotId === slotId) {
          const updated = { ...s, strategyMode: newMode };
          if (newMode === 'BREAKOUT_DAY_HIGH') {
            updated.breakoutCandleUnit = updated.breakoutCandleUnit || 1;
            updated.breakoutMinVolumeKrwEok = updated.breakoutMinVolumeKrwEok || 150;
          } else if (newMode === 'TREND_SWING') {
            updated.swingCandleUnit = updated.swingCandleUnit || 'minutes/240';
            updated.swingShortMa = updated.swingShortMa || 5;
            updated.swingLongMa = updated.swingLongMa || 20;
            updated.swingMinTradePrice24hEok = updated.swingMinTradePrice24hEok || 1000;
          } else if (newMode === 'SCALPING') {
            updated.surgeWindowSeconds = updated.surgeWindowSeconds || 5;
            updated.surgeRatePct = updated.surgeRatePct !== undefined ? updated.surgeRatePct : 1.5;
            updated.surgeMinVolumeManwon = updated.surgeMinVolumeManwon || 1000;
            updated.surgeMinVolumeKrw = updated.surgeMinVolumeKrw || 10000000;
          }
          return updated;
        }
        return s;
      });
      return {
        ...prevMap,
        [currentPeriod]: updatedList
      };
    });
    setDirtyPeriods(prev => ({ ...prev, [currentPeriod]: true }));
  };

  // 기본 추천값으로 복원
  const handleResetToDefault = () => {
    if (window.confirm(`[${periodMeta.name}]의 12개 슬롯 설정을 AI 공식 표준 추천값으로 초기화하시겠습니까?`)) {
      const defaults = DEFAULT_PERIOD_SLOTS[currentPeriod] || DEFAULT_PERIOD_SLOTS.MORNING;
      setAllSlotsMap(prevMap => ({
        ...prevMap,
        [currentPeriod]: JSON.parse(JSON.stringify(defaults))
      }));
      setDirtyPeriods(prev => ({ ...prev, [currentPeriod]: true }));
    }
  };

  // 🛡️ 미저장 변경사항 존재 여부 계산
  const hasUnsavedChanges = Object.values(dirtyPeriods).some(Boolean);

  // 🛡️ 브라우저 닫기/새로고침 시 경고 이벤트 등록 및 전역 플래그 동기화
  useEffect(() => {
    window.__HAS_UNSAVED_CHANGES__ = hasUnsavedChanges;
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '수정 중인 설정 내용이 아직 저장되지 않았습니다.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.__HAS_UNSAVED_CHANGES__ = false;
    };
  }, [hasUnsavedChanges]);

  // 🛡️ 안전 취소 및 화면 이탈 핸들러
  const handleCancelSafe = () => {
    if (hasUnsavedChanges) {
      const ok = window.confirm("⚠️ 수정 중인 설정 내용이 아직 저장되지 않았습니다!\n\n저장하지 않고 이동하시겠습니까?");
      if (!ok) return;
    }
    window.__HAS_UNSAVED_CHANGES__ = false;
    if (onCancel) {
      onCancel();
    }
  };

  // 저장 및 감시모드 복귀
  const handleSaveAndReturn = () => {
    // 5,000원 최소 주문금액 검증
    for (const slot of tableSlots) {
      if (slot.tradeAmountKrw && slot.tradeAmountKrw < 5000) {
        alert(`[${slot.slotId}번 슬롯] 매수금액은 5,000원 이상이어야 합니다.`);
        return;
      }
    }

    setDirtyPeriods({});
    window.__HAS_UNSAVED_CHANGES__ = false;

    if (onSave) {
      onSave(currentPeriod, tableSlots, allSlotsMap);
    }
  };

  return (
    <div className="space-y-4 max-w-full min-w-0 animate-in fade-in duration-300 px-[5%]">
      {/* 1. 상단 컨트롤 헤더 바 */}
      <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border transition-all duration-300 ${
        currentPeriod === 'MORNING'
          ? 'bg-gradient-to-r from-slate-900/95 via-amber-950/25 to-slate-900/95 border-amber-500/40'
          : currentPeriod === 'AFTERNOON'
          ? 'bg-gradient-to-r from-slate-900/95 via-sky-950/25 to-slate-900/95 border-sky-500/40'
          : 'bg-gradient-to-r from-slate-900/95 via-indigo-950/25 to-slate-900/95 border-indigo-500/40'
      }`}>
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={handleCancelSafe}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 hover:border-slate-500 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-sm"
              title="감시모드로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>감시모드 복귀</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{periodMeta.icon}</span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {periodMeta.title} 12개 슬롯 전략 수정모드
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentPeriod === 'MORNING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : currentPeriod === 'AFTERNOON'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}>
                수정 모드
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {periodMeta.desc}
            </p>
          </div>
        </div>

        {/* 상단 빠른 조작 액션 바: [📖 전략 용어 가이드], [취소] 및 [{periodMeta.name} 저장] */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsGlossaryOpen(true)}
            className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 hover:text-white border border-purple-500/40 hover:border-purple-400 transition cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
            title="초보자를 위한 알기 쉬운 전략 용어 사전"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-300" />
            <span>전략 용어 가이드</span>
          </button>

          <button
            type="button"
            onClick={handleCancelSafe}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs font-bold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveAndReturn}
            className={`px-4 py-2 rounded-xl text-black font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 ${
              currentPeriod === 'MORNING'
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/25'
                : currentPeriod === 'AFTERNOON'
                ? 'bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-300 hover:to-blue-300 shadow-sky-500/25'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25'
            }`}
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{periodMeta.name} 저장</span>
          </button>
        </div>
      </div>

      {/* 2. 12개 슬롯 통합 테이블 (스프레드시트 뷰) */}
      <div className="rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/90 text-slate-200 font-extrabold border-b border-slate-800 text-sm">
                <th className="py-3.5 px-3 w-16 text-center">슬롯</th>
                <th className="py-3.5 px-3 min-w-[175px] w-48">
                  <div className="flex items-center">
                    <span>전략 모드</span>
                    <HelpTooltip text="AI 매매 알고리즘입니다. 당일 돌파(신고가 돌파), 추세 스윙(골든크로스 대형주), 초단타 스캘핑(초단위 틱 급등 포착) 중 선택할 수 있습니다." />
                  </div>
                </th>
                <th className="py-3.5 px-3 min-w-[280px]">
                  <div className="flex items-center">
                    <span>수급 필터 (진입 기준)</span>
                    <HelpTooltip text="진입 시 검증할 최소 거래대금 기준입니다. 1분봉/5초 등 찰나에 터진 '순간 거래대금' 또는 '24시간 누적 대금'을 판별합니다." />
                  </div>
                </th>
                <th className="py-3.5 px-3 w-52">
                  <div className="flex items-center">
                    <span>1단 익절 (콜백)</span>
                    <HelpTooltip text="1차 목표 수익률 도달 후, 최고점에서 몇 % 하락 시 수익을 확정 지을지 정하는 스마트 트레일링 스탑입니다." />
                  </div>
                </th>
                <th className="py-3.5 px-3 w-60">
                  <div className="flex items-center">
                    <span>2단 진입 (콜백)</span>
                    <HelpTooltip text="초대박 급등(Hurdle) 돌파 시 더 큰 수익을 길게 추세 추종하기 위한 2단계 익절 기준입니다." />
                  </div>
                </th>
                <th className="py-3.5 px-3 w-36">
                  <div className="flex items-center">
                    <span>고정 손절</span>
                    <HelpTooltip text="진입가 대비 해당 % 하락 시 칼같이 전량 손절하여 원금을 지키는 안전장치입니다." width="w-56" />
                  </div>
                </th>
                <th className="py-3.5 px-3 w-36 text-right">
                  <div className="flex items-center justify-end">
                    <span>1회 매수금</span>
                    <HelpTooltip text="해당 슬롯이 매수 신호를 포착했을 때 1회 주문에 투입할 원화(KRW) 금액입니다." width="w-56" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-sm">
              {tableSlots.map((slot, idx) => {
                const isBreakout = slot.strategyMode === 'BREAKOUT_DAY_HIGH';
                const isSwing = slot.strategyMode === 'TREND_SWING';
                const isScalping = slot.strategyMode === 'SCALPING';

                return (
                  <tr 
                    key={slot.slotId} 
                    className={`transition-colors hover:bg-slate-800/50 ${
                      idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/60'
                    }`}
                  >
                    {/* 1. 슬롯 번호 (숫자만 표기) */}
                    <td className="py-3 px-3 text-center">
                      <span className="w-8 h-8 rounded-lg bg-slate-800 text-slate-100 font-black text-sm border border-slate-700 inline-flex items-center justify-center shadow-sm">
                        {slot.slotId}
                      </span>
                    </td>

                    {/* 2. 전략 모드 선택 (당일 돌파 / 추세 스윙 / 초단타 스캘핑) */}
                    <td className="py-3 px-3">
                      <select
                        value={slot.strategyMode}
                        onChange={(e) => handleStrategyModeChange(slot.slotId, e.target.value)}
                        className={`w-full min-w-[155px] py-1.5 pl-2.5 pr-6 rounded-lg text-xs sm:text-sm font-bold border focus:outline-none cursor-pointer transition whitespace-nowrap ${
                          isBreakout 
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/50 focus:border-amber-400'
                            : isSwing
                            ? 'bg-sky-950/40 text-sky-300 border-sky-500/50 focus:border-sky-400'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50 focus:border-emerald-400'
                        }`}
                      >
                        <option value="BREAKOUT_DAY_HIGH">🚀 당일 돌파</option>
                        <option value="TREND_SWING">🌊 추세 스윙</option>
                        <option value="SCALPING">⚡ 초단타 스캘핑</option>
                      </select>
                    </td>

                    {/* 3. 수급 필터 (모드별 분기) */}
                    <td className="py-3 px-3">
                      {isBreakout && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 기준봉 선택 */}
                          <select
                            value={slot.breakoutCandleUnit || 1}
                            onChange={(e) => handleFieldChange(slot.slotId, 'breakoutCandleUnit', Number(e.target.value))}
                            className="py-1.5 px-2 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-bold text-sm focus:outline-none"
                          >
                            <option value={1}>1분봉</option>
                            <option value={3}>3분봉</option>
                            <option value={5}>5분봉</option>
                          </select>
                          <span className="text-slate-400 text-sm font-sans">/</span>
                          {/* 순간 거래대금(억) */}
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="text-slate-200 text-sm font-sans cursor-help select-none inline-flex items-center"
                              title="24시간 누적이 아닌, 기준봉 캔들(1분/3분/5분) 1개 동안 체결된 순간 매수 거래대금입니다."
                            >
                              <span>순간</span>
                              <span className="text-amber-400 font-black text-xs ml-0.5">*</span>
                            </span>
                            <input
                              type="number"
                              value={slot.breakoutMinVolumeKrwEok !== undefined ? slot.breakoutMinVolumeKrwEok : 100}
                              onChange={(e) => handleFieldChange(slot.slotId, 'breakoutMinVolumeKrwEok', Number(e.target.value))}
                              className="w-20 py-1.5 px-2 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 text-center font-bold text-sm focus:border-amber-400 focus:outline-none"
                            />
                            <span className="text-amber-400 text-sm font-bold font-sans">억</span>
                          </div>
                        </div>
                      )}

                      {isSwing && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 캔들 주기 */}
                          <select
                            value={slot.swingCandleUnit || 'minutes/240'}
                            onChange={(e) => handleFieldChange(slot.slotId, 'swingCandleUnit', e.target.value)}
                            className="py-1.5 px-2 rounded-lg bg-slate-950 border border-sky-500/40 text-sky-300 font-bold text-sm focus:outline-none"
                          >
                            <option value="minutes/240">4h</option>
                            <option value="days">1D</option>
                          </select>
                          <span 
                            className="px-2 py-1 rounded-lg bg-sky-950 text-sky-400 border border-sky-500/30 text-xs font-bold font-sans cursor-help"
                            title="5일 이동평균선이 20일 이동평균선을 골든크로스(상향 돌파)한 상승 추세 상태"
                          >
                            MA5&gt;20
                          </span>
                          <span className="text-slate-400 text-sm font-sans">/</span>
                          {/* 24시간 누적 거래대금(억) */}
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="text-slate-200 text-sm font-sans cursor-help select-none inline-flex items-center"
                              title="최근 24시간 동안 업비트에 누적된 총 거래대금입니다. 대형 우량 코인 판별 기준입니다."
                            >
                              <span>24h</span>
                              <span className="text-sky-400 font-black text-xs ml-0.5">*</span>
                            </span>
                            <input
                              type="number"
                              value={slot.swingMinTradePrice24hEok !== undefined ? slot.swingMinTradePrice24hEok : 1000}
                              onChange={(e) => handleFieldChange(slot.slotId, 'swingMinTradePrice24hEok', Number(e.target.value))}
                              className="w-20 py-1.5 px-2 rounded-lg bg-slate-950 border border-sky-500/40 text-sky-300 text-center font-bold text-sm focus:border-sky-400 focus:outline-none"
                            />
                            <span className="text-sky-400 text-sm font-bold font-sans">억</span>
                          </div>
                        </div>
                      )}

                      {isScalping && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 감시 초 선택 (3초, 5초, 10초) */}
                          <select
                            value={slot.surgeWindowSeconds || 5}
                            onChange={(e) => handleFieldChange(slot.slotId, 'surgeWindowSeconds', Number(e.target.value))}
                            className="py-1.5 px-2 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm focus:outline-none"
                            title="초단타 급등 감시 주기(초)"
                          >
                            <option value={3}>3초</option>
                            <option value={5}>5초</option>
                            <option value={10}>10초</option>
                          </select>

                          {/* 상승률 인풋 */}
                          <div className="flex items-center gap-0.5">
                            <span className="text-emerald-400 font-bold text-xs sm:text-sm">+</span>
                            <input
                              type="number"
                              step="0.1"
                              value={slot.surgeRatePct !== undefined ? slot.surgeRatePct : 1.5}
                              onChange={(e) => handleFieldChange(slot.slotId, 'surgeRatePct', parseFloat(e.target.value) || 0)}
                              className="w-14 py-1.5 px-1 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 text-center font-bold text-xs sm:text-sm focus:border-emerald-400 focus:outline-none"
                              title="감시 시간 동안의 최소 급등 상승률(%)"
                            />
                            <span className="text-emerald-400 font-bold text-xs sm:text-sm">%</span>
                          </div>

                          <span className="text-slate-400 text-sm font-sans">/</span>

                          {/* 순간 거래대금(만원) 인풋 */}
                          <div className="flex items-center gap-1">
                            <span 
                              className="text-slate-200 text-xs sm:text-sm font-sans cursor-help select-none inline-flex items-center"
                              title="하루 종일이 아닌, 지정된 감시 시간(5초 등) 찰나의 짧은 순간 동안 체결된 매수 거래대금입니다."
                            >
                              <span>순간</span>
                              <span className="text-emerald-400 font-black text-xs ml-0.5">*</span>
                            </span>
                            <input
                              type="number"
                              step="100"
                              value={slot.surgeMinVolumeManwon !== undefined ? slot.surgeMinVolumeManwon : (slot.surgeMinVolumeKrw ? Math.round(slot.surgeMinVolumeKrw / 10000) : 1000)}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                handleFieldChange(slot.slotId, 'surgeMinVolumeManwon', val);
                                handleFieldChange(slot.slotId, 'surgeMinVolumeKrw', val * 10000);
                              }}
                              className="w-16 py-1.5 px-1 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 text-center font-bold text-xs sm:text-sm focus:border-emerald-400 focus:outline-none"
                              title="감시 시간 동안 순간적으로 터져야 하는 최소 매수 거래대금(만원)"
                            />
                            <span className="text-emerald-400 text-xs sm:text-sm font-bold font-sans">만</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 4. 1단 익절 (콜백) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-rose-400 text-sm font-bold">+</span>
                          <input
                            type="number"
                            step="0.1"
                            value={slot.trailingTier1TargetProfitPct !== undefined ? slot.trailingTier1TargetProfitPct : 5.0}
                            onChange={(e) => handleFieldChange(slot.slotId, 'trailingTier1TargetProfitPct', parseFloat(e.target.value))}
                            className="w-16 py-1.5 px-1.5 rounded-lg bg-slate-950 border border-rose-500/40 text-rose-400 text-center font-bold text-sm focus:border-rose-400 focus:outline-none"
                          />
                          <span className="text-rose-400 text-sm font-bold">%</span>
                        </div>
                        <span className="text-slate-400 text-sm font-bold">(</span>
                        <div className="flex items-center gap-1">
                          <span className="text-blue-400 text-sm font-bold">-</span>
                          <input
                            type="number"
                            step="0.1"
                            value={slot.trailingTier1CallbackPct !== undefined ? slot.trailingTier1CallbackPct : 0.5}
                            onChange={(e) => handleFieldChange(slot.slotId, 'trailingTier1CallbackPct', parseFloat(e.target.value))}
                            className="w-16 py-1.5 px-1.5 rounded-lg bg-slate-950 border border-blue-500/40 text-blue-400 text-center font-bold text-sm focus:border-blue-400 focus:outline-none"
                          />
                          <span className="text-blue-400 text-sm font-bold">%</span>
                        </div>
                        <span className="text-slate-400 text-sm font-bold">)</span>
                      </div>
                    </td>

                    {/* 5. 2단 진입 (콜백) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400 text-sm font-bold">+</span>
                          <input
                            type="number"
                            step="0.1"
                            value={slot.trailingTier2HurdlePct !== undefined ? slot.trailingTier2HurdlePct : 15.0}
                            onChange={(e) => handleFieldChange(slot.slotId, 'trailingTier2HurdlePct', parseFloat(e.target.value))}
                            className="w-16 py-1.5 px-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-400 text-center font-bold text-sm focus:border-amber-400 focus:outline-none"
                          />
                          <span className="text-amber-400 text-sm font-bold">%</span>
                        </div>

                        {/* 허수 트릭 표기 (+30%일 경우) */}
                        {slot.trailingTier2HurdlePct >= 30 ? (
                          <span className="px-2 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/30 text-xs font-bold font-sans">
                            허수 트릭
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-sm font-bold">(</span>
                            <span className="text-purple-400 text-sm font-bold">-</span>
                            <input
                              type="number"
                              step="0.1"
                              value={slot.trailingTier2CallbackPct !== undefined ? slot.trailingTier2CallbackPct : 3.0}
                              onChange={(e) => handleFieldChange(slot.slotId, 'trailingTier2CallbackPct', parseFloat(e.target.value))}
                              className="w-16 py-1.5 px-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-purple-400 text-center font-bold text-sm focus:border-purple-400 focus:outline-none"
                            />
                            <span className="text-purple-400 text-sm font-bold">%</span>
                            <span className="text-slate-400 text-sm font-bold">)</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 6. 고정 손절선 */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400 text-sm font-bold">-</span>
                        <input
                          type="number"
                          step="0.1"
                          value={slot.stopLossPct !== undefined ? slot.stopLossPct : 2.0}
                          onChange={(e) => handleFieldChange(slot.slotId, 'stopLossPct', parseFloat(e.target.value))}
                          className="w-16 py-1.5 px-1.5 rounded-lg bg-slate-950 border border-blue-500/40 text-blue-400 text-center font-bold text-sm focus:border-blue-400 focus:outline-none"
                        />
                        <span className="text-blue-400 text-sm font-bold">%</span>
                      </div>
                    </td>

                    {/* 7. 1회 매수금 (KRW) */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          step="10000"
                          value={slot.tradeAmountKrw !== undefined ? slot.tradeAmountKrw : 50000}
                          onChange={(e) => handleFieldChange(slot.slotId, 'tradeAmountKrw', Number(e.target.value))}
                          className="w-24 py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 text-right font-bold text-sm focus:border-emerald-400 focus:outline-none"
                        />
                        <span className="text-slate-300 text-sm font-sans font-bold">원</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 3. 하단 액션 바 */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold w-full sm:w-auto justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>AI 공식 추천값으로 초기화</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancelSafe}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs font-bold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSaveAndReturn}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-black font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 ${
                currentPeriod === 'MORNING'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/25'
                  : currentPeriod === 'AFTERNOON'
                  ? 'bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-300 hover:to-blue-300 shadow-sky-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25'
              }`}
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{periodMeta.name} 저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📖 전략 용어 가이드 팝업 모달 (방법 B) */}
      {isGlossaryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl shadow-purple-950/80 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">📖 Any Life AI 실전 전략 용어 가이드</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    초보자도 1분 만에 이해하는 핵심 매매 기준 및 알고리즘 해설 사전
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 용어 카드 6종 */}
            <div className="space-y-3">
              {/* 1. 순간 거래대금 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-400 font-black text-sm">⚡ 순간 (순간 거래대금)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">진입 수급 기준</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  하루 24시간 동안 쌓인 누적 거래량이 아니라, <strong className="text-amber-300">선택한 기준봉(1분봉/5초 등)이라는 찰나의 짧은 '순간' 동안</strong> 쏟아져 들어온 매수 거래대금을 뜻합니다. 
                  진짜 세력의 강력한 수급 폭발을 실시간으로 포착하기 위한 핵심 진입 기준입니다.
                </p>
              </div>

              {/* 2. 콜백(Callback) & 트레일링 스탑 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-rose-400 font-black text-sm">🎯 콜백 (Callback) &amp; 트레일링 스탑</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">스마트 익절 기법</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  단순히 정해진 가격에 일찍 팔아버리는 것이 아니라, <strong className="text-rose-300">코인이 계속 치솟으면 목표가를 함께 끌어올리다가(Trailing)</strong>, 최고점에서 설정한 비율(콜백%)만큼 꺾여 내려올 때 차익을 확정 짓는 지능형 익절 기술입니다.
                </p>
              </div>

              {/* 3. 1단 익절 vs 2단 진입 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-400 font-black text-sm">🚀 1단 익절 vs 2단 진입 (Hurdle)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">2단계 분할 추세추종</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ● <strong className="text-indigo-300">1단 익절</strong>: 일반적인 목표치(+5%) 도달 시 안정적으로 1차 익절을 준비합니다.<br/>
                  ● <strong className="text-indigo-300">2단 진입</strong>: 초대박 폭등(+15% 이상 허들) 돌파 시, 상승 추세를 최대한 끝까지 길게 발라먹기 위해 2단계 레벨업 익절을 가동합니다.
                </p>
              </div>

              {/* 4. 전략 모드 3종 비교 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sky-400 font-black text-sm">🌊 전략 모드 3종 비교</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">🚀 당일 돌파</span>
                    <span className="text-slate-400 text-[11px] block">09시 리셋 직후 당일 최고가를 돌파하는 거래대금 폭발 코인 진입</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-sky-400 font-bold block mb-1">🌊 추세 스윙</span>
                    <span className="text-slate-400 text-[11px] block">4시간/일봉 기준 5일선이 20일선을 골든크로스한 우량 대형 코인 매매</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">⚡ 초단타 스캘핑</span>
                    <span className="text-slate-400 text-[11px] block">5초/10초 단위로 틱 체결이 급증하는 찰나의 순간 불기둥 진입</span>
                  </div>
                </div>
              </div>

              {/* 5. 이동평균선 & 킬 스위치 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-sky-400 font-bold text-xs block mb-1">📈 MA 5 &gt; 20 (골든크로스)</span>
                  <p className="text-[11px] text-slate-300">
                    최근 5일간의 단기선이 20일간의 중기선을 상향 돌파한 전형적인 우상향 상승 추세 신호입니다.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-rose-400 font-bold text-xs block mb-1">🛡️ 일일 킬 스위치 (Kill Switch)</span>
                  <p className="text-[11px] text-slate-300">
                    당일 누적 손실이 설정한 한도(-10%)에 도달하면, 추가 손실을 막기 위해 봇의 신규 매수를 당일 자정까지 전면 자동 차단하는 비상 안전벨트입니다.
                  </p>
                </div>
              </div>

            </div>

            {/* 하단 닫기 버튼 */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-purple-950/50"
              >
                확인 완료
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
