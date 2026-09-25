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
  AlertTriangle
} from 'lucide-react';
import { PERIOD_METAS, DEFAULT_PERIOD_SLOTS } from '../constants/periodPresets';

export default function SlotTableEditor({
  targetPeriod = 'MORNING',
  initialSlots = [],
  periodSlotsMap = null,
  onSave,
  onCancel,
  onChangePeriod
}) {
  const [currentPeriod, setCurrentPeriod] = useState(targetPeriod);
  
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

  // 저장 및 감시모드 복귀
  const handleSaveAndReturn = () => {
    // 5,000원 최소 주문금액 검증
    for (const slot of tableSlots) {
      if (slot.tradeAmountKrw && slot.tradeAmountKrw < 5000) {
        alert(`[${slot.slotId}번 슬롯] 매수금액은 5,000원 이상이어야 합니다.`);
        return;
      }
    }

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
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="감시모드로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>감시모드</span>
          </button>

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

        {/* 상단 빠른 조작 액션 바: [취소] 및 [{periodMeta.name} 저장] */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onCancel}
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
                <th className="py-3.5 px-3 w-40">전략 모드</th>
                <th className="py-3.5 px-3 min-w-[240px]">수급 필터 (진입 기준)</th>
                <th className="py-3.5 px-3 w-52">1단 익절 (콜백)</th>
                <th className="py-3.5 px-3 w-60">2단 진입 (콜백)</th>
                <th className="py-3.5 px-3 w-36">고정 손절</th>
                <th className="py-3.5 px-3 w-36 text-right">1회 매수금</th>
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
                        className={`w-full py-1.5 px-2.5 rounded-lg text-sm font-bold border focus:outline-none cursor-pointer transition ${
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
                            <span className="text-slate-300 text-sm font-sans">순간</span>
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
                          <span className="px-2 py-1 rounded-lg bg-sky-950 text-sky-400 border border-sky-500/30 text-xs font-bold font-sans">
                            MA5&gt;20
                          </span>
                          <span className="text-slate-400 text-sm font-sans">/</span>
                          {/* 24시간 누적 거래대금(억) */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 text-sm font-sans">24h</span>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-emerald-400 text-sm font-bold">5초 1.5%</span>
                          <span className="text-slate-400 text-sm font-sans">/</span>
                          <span className="text-slate-200 text-sm font-bold">순간 1천만</span>
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
              onClick={onCancel}
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
    </div>
  );
}
