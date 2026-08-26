import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sliders, 
  Settings, 
  TrendingUp, 
  Zap, 
  ShieldAlert, 
  Save, 
  Check, 
  Power,
  RotateCcw,
  Layers,
  Flame,
  Radio
} from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings = {}, 
  slots = [], 
  botRunning = false,
  onToggleBot,
  onSaveSettings, 
  onUpdateSlot,
  onSellSlot,
  onOpenPanicSell 
}) {
  const [form, setForm] = useState({
    SURGE_CHECK_SECONDS: 5,
    SURGE_RATE_THRESHOLD: 1.0,
    SURGE_MIN_VOLUME_KRW: 5000000,
    DEFAULT_TRADE_AMOUNT: 50000,
    TRAILING_TARGET_PROFIT_PCT: 3.0,
    TRAILING_CALLBACK_PCT: 1.0,
    STOP_LOSS_PCT: 2.0
  });

  const [activeSlots, setActiveSlots] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        SURGE_CHECK_SECONDS: settings.SURGE_CHECK_SECONDS ?? 5,
        SURGE_RATE_THRESHOLD: settings.SURGE_RATE_THRESHOLD ?? 1.0,
        SURGE_MIN_VOLUME_KRW: settings.SURGE_MIN_VOLUME_KRW ?? 5000000,
        DEFAULT_TRADE_AMOUNT: settings.DEFAULT_TRADE_AMOUNT ?? 50000,
        TRAILING_TARGET_PROFIT_PCT: settings.TRAILING_TARGET_PROFIT_PCT ?? 3.0,
        TRAILING_CALLBACK_PCT: settings.TRAILING_CALLBACK_PCT ?? 1.0,
        STOP_LOSS_PCT: settings.STOP_LOSS_PCT ?? 2.0
      });
    }

    if (slots && slots.length > 0) {
      const slotMap = {};
      slots.forEach(s => {
        slotMap[s.slotId] = s.isEnabled;
      });
      setActiveSlots(slotMap);
    }
  }, [settings, slots, isOpen]);

  if (!isOpen) return null;

  const handleToggleSlot = async (slotId) => {
    const newState = !activeSlots[slotId];
    setActiveSlots(prev => ({ ...prev, [slotId]: newState }));
    if (onUpdateSlot) {
      await onUpdateSlot(slotId, { isEnabled: newState });
    }
  };

  const handleSave = async () => {
    if (onSaveSettings) {
      await onSaveSettings(form);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl shadow-black/80 relative space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                업비트 자동 매매 프로그램 - 설정
              </h3>
              <p className="text-xs text-slate-400">초단타 급등 포착 매수 및 트레일링 스탑 매도 상세 조건</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. 매수 조건 설정 박스 */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            1. 매수 조건 설정
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* 급등 감지 기준 */}
            <div className="space-y-1.5 sm:col-span-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-300 font-semibold">급등 감지 기준</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.SURGE_CHECK_SECONDS}
                  onChange={(e) => setForm({ ...form, SURGE_CHECK_SECONDS: Number(e.target.value) })}
                  className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-amber-300 font-mono font-bold"
                />
                <span className="text-slate-400">초 동안</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={form.SURGE_RATE_THRESHOLD}
                  onChange={(e) => setForm({ ...form, SURGE_RATE_THRESHOLD: Number(e.target.value) })}
                  className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-emerald-400 font-mono font-bold"
                />
                <span className="text-slate-400">% 상승 시 자동 매수</span>
              </div>
            </div>

            {/* 매수 금액 설정 */}
            <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">1회 기본 매수금액</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="5000"
                  value={form.DEFAULT_TRADE_AMOUNT}
                  onChange={(e) => setForm({ ...form, DEFAULT_TRADE_AMOUNT: Number(e.target.value) })}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono font-bold"
                />
                <span className="text-slate-400 text-[11px]">KRW</span>
              </div>
            </div>

            {/* 최소 거래대금 설정 */}
            <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">5초 최소 거래대금</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="1000000"
                  value={form.SURGE_MIN_VOLUME_KRW}
                  onChange={(e) => setForm({ ...form, SURGE_MIN_VOLUME_KRW: Number(e.target.value) })}
                  className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-cyan-300 font-mono font-bold"
                />
                <span className="text-slate-400 text-[11px]">원 이상</span>
              </div>
            </div>

            {/* 동시 매수 슬롯 설정 (1-5) */}
            <div className="sm:col-span-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-slate-300 font-semibold block">동시 매수 슬롯 설정</span>
                <span className="text-[11px] text-slate-500">초록색으로 켜진 슬롯에만 급등 코인이 배정됩니다</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isActive = activeSlots[num];
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleToggleSlot(num)}
                      className={`w-9 h-9 rounded-xl font-black text-xs transition-all shadow cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-black border-2 border-emerald-400 shadow-emerald-500/30 scale-105'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. 매도 조건 설정 (매수 후) 박스 */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            2. 매도 조건 설정 (매수 후 트레일링 스탑)
          </h4>

          <div className="space-y-3 text-xs">
            {/* 트레일링 스탑 감시 시작 기준 (목표 수익률) */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">
                  트레일링 스탑(감시 익절) 시작 기준 (목표 수익률):
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={form.TRAILING_TARGET_PROFIT_PCT}
                    onChange={(e) => setForm({ ...form, TRAILING_TARGET_PROFIT_PCT: Number(e.target.value) })}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-center text-purple-400 font-mono font-bold"
                  />
                  <span className="text-slate-400">% 도달 시</span>
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={form.TRAILING_TARGET_PROFIT_PCT}
                onChange={(e) => setForm({ ...form, TRAILING_TARGET_PROFIT_PCT: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* 고점 대비 하락 폭 & 기본 손절 비율 (2열) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 고점 대비 하락 폭 */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">고점 대비 하락 폭:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={form.TRAILING_CALLBACK_PCT}
                    onChange={(e) => setForm({ ...form, TRAILING_CALLBACK_PCT: Number(e.target.value) })}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-center text-amber-400 font-mono font-bold"
                  />
                  <span className="text-slate-400">% 하락 시 매도</span>
                </div>
              </div>

              {/* 기본 손절 비율 */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">기본 손절 비율:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="20"
                    value={form.STOP_LOSS_PCT}
                    onChange={(e) => setForm({ ...form, STOP_LOSS_PCT: Number(e.target.value) })}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-center text-rose-400 font-mono font-bold"
                  />
                  <span className="text-slate-400">% 하락 시 매도</span>
                </div>
              </div>
            </div>

            {/* 활성화된 매수 슬롯 현황 리스트 (참고 이미지 완벽 재현) */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-300 font-semibold block">활성화된 매수 슬롯 현황:</span>
              <div className="space-y-1.5">
                {slots.map(slot => {
                  const isHolding = slot.positionStatus !== 'IDLE' && slot.targetMarket;
                  return (
                    <div key={slot.slotId} className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${slot.isEnabled ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                        <span className="font-mono text-slate-300">Slot {slot.slotId}:</span>
                        <span className={`font-bold font-mono ${isHolding ? 'text-amber-300' : 'text-slate-500'}`}>
                          [ {slot.targetMarket ? slot.targetMarket.replace('KRW-', '') : '-'} ]
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isHolding ? `(수익률: ${slot.profitRate || 0}%)` : (slot.isEnabled ? '급등 포착 대기' : '비활성화')}
                        </span>
                      </div>

                      {isHolding ? (
                        <button
                          type="button"
                          onClick={() => onSellSlot && onSellSlot(slot.slotId)}
                          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow flex items-center gap-1 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          🔴 즉시 시장가 매도
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-mono">EMPTY</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 통합 액션 바 (참고 이미지 완벽 일치: 긴급 강제 매도 / 저장 / 취소 / 감시 토글) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          {/* 좌측: 🚨 전 슬롯 긴급 강제 매도 버튼 */}
          <button
            type="button"
            onClick={onOpenPanicSell}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-lg shadow-rose-900/40 border border-rose-500/50 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🚨 전 슬롯 긴급 강제 시장가 매도</span>
          </button>

          {/* 우측: 취소 / 저장 / 프로그램 감시 토글 */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? '저장 완료!' : '설정 저장'}</span>
            </button>

            {/* 실시간 감시 프로그램 시작/중지 스위치 */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-xs font-semibold text-slate-300 hidden xs:inline">
                {botRunning ? '감시 가동' : '감시 중지'}
              </span>
              <button
                type="button"
                onClick={onToggleBot}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  botRunning ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                title="프로그램 실시간 감시 시작/중지"
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  botRunning ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
