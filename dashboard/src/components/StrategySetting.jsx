import React, { useState, useEffect } from 'react';
import { Sliders, Save, ShieldAlert, Zap, Flame, Clock, RefreshCw } from 'lucide-react';

export default function StrategySetting({ settings, onSaveSettings }) {
  const [form, setForm] = useState({
    DEFAULT_TRADE_AMOUNT: 50000,
    SURGE_CHECK_SECONDS: 5,
    SURGE_RATE_THRESHOLD: 1.5,
    SURGE_MIN_VOLUME_KRW: 10000000,
    TRAILING_TARGET_PROFIT_PCT: 3.0,
    TRAILING_CALLBACK_PCT: 1.0,
    STOP_LOSS_PCT: 2.0,
    TAKE_PROFIT_PCT: 3.5,
    APPROVAL_TIMEOUT_SECONDS: 30,
    AUTO_EXECUTE_ON_TIMEOUT: false,
    RSI_PERIOD: 14,
    RSI_BUY_THRESHOLD: 30,
    RSI_SELL_THRESHOLD: 70
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">고급 트레이딩 전략 설정</h2>
              <p className="text-xs text-slate-400">급등 감지, 트레일링 스탑, 리스크 제어 파라미터</p>
            </div>
          </div>
        </div>

        <form id="strategyForm" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. 급등 감지 파라미터 섹션 */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>실시간 급등 감지 (Surge Engine)</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-400 block mb-1">감시 시간 (초)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.SURGE_CHECK_SECONDS || 5}
                  onChange={(e) => handleChange('SURGE_CHECK_SECONDS', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">상승률 기준 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={form.SURGE_RATE_THRESHOLD || 1.5}
                  onChange={(e) => handleChange('SURGE_RATE_THRESHOLD', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">최소 거래대금 필터 (원)</label>
              <input
                type="number"
                step="1000000"
                value={form.SURGE_MIN_VOLUME_KRW || 10000000}
                onChange={(e) => handleChange('SURGE_MIN_VOLUME_KRW', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {(Number(form.SURGE_MIN_VOLUME_KRW || 10000000) / 10000).toLocaleString()}만원 이상 발생 시 유효
              </span>
            </div>
          </div>

          {/* 2. 트레일링 스탑 & 손절매 섹션 */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <Flame className="w-3.5 h-3.5" />
              <span>트레일링 스탑 & 리스크 관리</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-400 block mb-1">감시 시작 수익률 (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.TRAILING_TARGET_PROFIT_PCT || 3.0}
                  onChange={(e) => handleChange('TRAILING_TARGET_PROFIT_PCT', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">이후 최고가 추적</span>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">고점 대비 하락 폭 (%)</label>
                <input
                  type="number"
                  step="0.2"
                  value={form.TRAILING_CALLBACK_PCT || 1.0}
                  onChange={(e) => handleChange('TRAILING_CALLBACK_PCT', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">하락 시 익절 매도</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">기본 손절선 (Stop-Loss, %)</label>
              <input
                type="number"
                step="0.5"
                value={form.STOP_LOSS_PCT || 2.0}
                onChange={(e) => handleChange('STOP_LOSS_PCT', Number(e.target.value))}
                className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-2.5 py-1.5 text-rose-300 focus:outline-none focus:border-rose-500"
              />
              <span className="text-[10px] text-rose-400/80 block mt-0.5">
                -{form.STOP_LOSS_PCT}% 도달 시 즉각 손절매
              </span>
            </div>
          </div>

          {/* 3. 100% 완전 자동 매매 안내 */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-indigo-900/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>100% 완전 자동 매매 집행</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              설정된 감시 조건에 부합하면 수동 승인 대기 없이 <b className="text-emerald-400">0.1초 즉시 시장가 매수 및 트레일링 익절/손절</b>이 자동으로 실행됩니다.
            </p>
          </div>
        </form>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-800">
        <button
          type="submit"
          form="strategyForm"
          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
            isSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
          }`}
        >
          <Save className="w-4 h-4" />
          {isSaved ? '설정 저장 완료! ✨' : '전략 파라미터 저장하기'}
        </button>
      </div>
    </div>
  );
}
