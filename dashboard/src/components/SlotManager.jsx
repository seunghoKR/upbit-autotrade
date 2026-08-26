import React, { useState } from 'react';
import { 
  Layers, 
  Flame, 
  TrendingUp, 
  Zap, 
  Sliders, 
  Power, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  Radio,
  LineChart,
  Radar,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export default function SlotManager({ 
  slots = [], 
  onUpdateSlot, 
  onSellSlot, 
  livePriceMap = {},
  botRunning = false,
  onToggleBot,
  onTriggerMockSurge,
  selectedSlotId = 1,
  onSelectSlot,
  pendingApproval = null,
  onApprove,
  onReject
}) {
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    isEnabled: true,
    tradeAmountKrw: 50000
  });

  const handleStartEdit = (e, slot) => {
    e.stopPropagation();
    setEditingSlotId(slot.slotId);
    setEditForm({
      name: slot.name || `슬롯 ${slot.slotId}`,
      isEnabled: slot.isEnabled,
      tradeAmountKrw: slot.tradeAmountKrw
    });
  };

  const handleSaveEdit = async (slotId) => {
    if (onUpdateSlot) {
      await onUpdateSlot(slotId, editForm);
    }
    setEditingSlotId(null);
  };

  const handleMockSurge = async () => {
    setIsSimulating(true);
    try {
      if (!botRunning && onToggleBot) {
        await onToggleBot();
      }
      if (onTriggerMockSurge) {
        await onTriggerMockSurge('RANDOM');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSimulating(false), 1000);
    }
  };

  const formatMarketName = (marketCode) => {
    if (!marketCode) return '전종목 급등 포착 대기';
    const coin = marketCode.replace('KRW-', '');
    const names = {
      'BTC': '비트코인 (BTC)',
      'ETH': '이더리움 (ETH)',
      'XRP': '리플 (XRP)',
      'SOL': '솔라나 (SOL)',
      'DOGE': '도지코인 (DOGE)',
      'STX': '스택스 (STX)',
      'SUI': '수이 (SUI)',
      'NEAR': '니어프로토콜 (NEAR)',
      'ADA': '에이다 (ADA)',
      'AVAX': '아발란체 (AVAX)',
      'SEI': '세이 (SEI)',
      'SHIB': '시바이누 (SHIB)',
      'PEPE': '페페 (PEPE)',
      'ONG': '온톨로지가스 (ONG)',
      'BTT': '비트토렌트 (BTT)',
      'WIN': '윙클링크 (WIN)'
    };
    return names[coin] || `${coin} (${coin})`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl space-y-4 sm:space-y-5">
      {/* 타이틀 및 실시간 감시 상태 제어 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              업비트 전종목 초단타 급등 슬롯 매니저
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-normal hidden sm:inline">
                {slots.length}개 독립 슬롯
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              업비트 120개 코인을 실시간 감시하다가 <strong>급등이 터지는 코인을 빈 슬롯에 자동 배정</strong>하여 트레일링 스탑을 집행합니다.
            </p>
          </div>
        </div>

        {/* 우측 액션 버튼들 */}
        <div className="flex items-center gap-2 text-xs flex-wrap self-end sm:self-auto">
          {/* ⚡ 실시간 급등 감지 모의 테스트 버튼 */}
          <button
            onClick={handleMockSurge}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold transition shadow-sm cursor-pointer"
            title="업비트 알트코인/메이저 중 급등 신호를 발생시켜 슬롯에 배정합니다."
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? '급등 포착 중...' : '⚡ 알트 급등 포착 테스트'}</span>
          </button>

          {/* 실시간 감시 ON/OFF 상태 버튼 */}
          <button
            onClick={onToggleBot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition shadow-md cursor-pointer ${
              botRunning
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
            }`}
          >
            {botRunning ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>업비트 전종목 실시간 감시 가동 중</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>감시 중지됨</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1~5번 슬롯 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {slots.map((slot) => {
          const isHolding = slot.positionStatus !== 'IDLE' && slot.position && slot.targetMarket;
          const isTrailing = slot.positionStatus === 'TRAILING_ACTIVE';
          const isEditing = editingSlotId === slot.slotId;
          const isSelected = selectedSlotId === slot.slotId;
          const profitRate = slot.profitRate || 0;
          const isProfit = profitRate >= 0;

          // 해당 슬롯에 현재 승인 대기 중인 급등 신호가 있는지 확인
          const isPending = pendingApproval && pendingApproval.slotId === slot.slotId;

          return (
            <div
              key={slot.slotId}
              onClick={() => onSelectSlot && onSelectSlot(slot.slotId)}
              className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between p-3.5 sm:p-4 cursor-pointer select-none ${
                isPending
                  ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-900 border-amber-400 shadow-2xl shadow-amber-950/80 ring-2 ring-amber-400/80 scale-[1.02] animate-pulse'
                  : isSelected
                  ? 'bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-900 border-indigo-400 shadow-2xl shadow-indigo-950/80 ring-2 ring-indigo-400/80 scale-[1.02]'
                  : !slot.isEnabled || !botRunning
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-70 hover:opacity-100 hover:border-slate-700'
                  : isTrailing
                  ? 'bg-gradient-to-b from-purple-950/50 via-slate-900/90 to-slate-900/90 border-purple-500/60 shadow-lg shadow-purple-500/10 hover:border-purple-400'
                  : isHolding
                  ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-900/90 border-indigo-500/50 hover:border-indigo-400'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              <div className="space-y-2.5 sm:space-y-3">
                {/* 1. 상단: 슬롯 탭 & 상태 */}
                <div className="flex items-center justify-between pb-0.5">
                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-bold text-xs shadow-sm ${
                    isPending
                      ? 'bg-amber-600 border-amber-400 text-white'
                      : isSelected 
                      ? 'bg-indigo-600 border-indigo-400 text-white' 
                      : 'bg-slate-800/90 border-slate-700 text-slate-200'
                  }`}>
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-extrabold">
                      {slot.slotId}
                    </span>
                    <span>슬롯 {slot.slotId}</span>
                  </div>

                  {isPending ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-extrabold border border-amber-500/50 flex items-center gap-1 animate-bounce">
                      <Clock className="w-3 h-3 text-amber-400" />
                      매수 승인 대기
                    </span>
                  ) : isSelected ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40 flex items-center gap-1">
                      <LineChart className="w-3 h-3 text-indigo-300" />
                      차트 선택됨
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {slot.isEnabled ? 'ON' : 'OFF'}
                    </span>
                  )}
                </div>

                {/* 2. 코인 상태 헤더 */}
                <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
                  isPending
                    ? 'bg-amber-950/60 border-amber-500/40'
                    : 'bg-slate-950/80 border-slate-800/80'
                }`}>
                  <div className="truncate flex items-center gap-1.5">
                    {isPending ? (
                      <span className="text-xs font-black text-amber-300 block truncate">
                        ⚡ {formatMarketName(pendingApproval.market)}
                      </span>
                    ) : isHolding ? (
                      <span className="text-xs font-extrabold text-amber-300 block truncate">
                        {formatMarketName(slot.targetMarket)}
                      </span>
                    ) : (
                      <>
                        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-slate-300 block truncate">
                          급등 포착 대기
                        </span>
                      </>
                    )}
                  </div>

                  {/* 상태 배지 */}
                  <div className="shrink-0">
                    {isPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-black shadow">
                        신호 포착!
                      </span>
                    ) : isTrailing ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 animate-pulse whitespace-nowrap">
                        <Flame className="w-3 h-3 text-purple-400" />
                        트레일링
                      </span>
                    ) : isHolding ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 whitespace-nowrap">
                        <Zap className="w-3 h-3 text-indigo-400" />
                        보유중
                      </span>
                    ) : botRunning ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 whitespace-nowrap flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        감시중
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                        대기중
                      </span>
                    )}
                  </div>
                </div>

                {/* 슬롯 내부 정보 영역 */}
                {isPending ? (
                  /* ⚡ 매수 승인 대기 중 상태 뷰 */
                  <div className="space-y-2 pt-1 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30" onClick={e => e.stopPropagation()}>
                    <div className="text-xs">
                      <div className="flex justify-between text-slate-300 text-[11px]">
                        <span>포착 체결가:</span>
                        <span className="font-bold text-amber-300 font-mono">
                          {Number(pendingApproval.price).toLocaleString()} KRW
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300 text-[11px] mt-0.5">
                        <span>주문 예정금:</span>
                        <span className="font-bold text-slate-100 font-mono">
                          {Number(pendingApproval.amount).toLocaleString()}원
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-200/80 mt-1 truncate">
                        {pendingApproval.reason}
                      </p>
                    </div>

                    {/* 슬롯 내부 즉시 승인 / 취소 버튼 */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => onApprove && onApprove(pendingApproval.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>즉시 승인 매수</span>
                      </button>
                      <button
                        onClick={() => onReject && onReject(pendingApproval.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                        title="주문 취소"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : isEditing ? (
                  /* 설정 수정 폼 */
                  <div className="space-y-2 pt-1 border-t border-slate-800 text-xs" onClick={e => e.stopPropagation()}>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">1회 매수금액 (원)</label>
                      <input
                        type="number"
                        step="5000"
                        value={editForm.tradeAmountKrw}
                        onChange={(e) => setEditForm({ ...editForm, tradeAmountKrw: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="text-[10px] text-slate-400">슬롯 활성화</label>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, isEnabled: !editForm.isEnabled })}
                        className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${
                          editForm.isEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                          editForm.isEnabled ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <div className="flex gap-1 pt-1.5">
                      <button
                        onClick={() => handleSaveEdit(slot.slotId)}
                        className="flex-1 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingSlotId(null)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 일반 슬롯 뷰 */
                  <div className="space-y-2 pt-0.5">
                    <div className="flex items-center justify-between text-xs bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                      <span className="text-slate-400 text-[11px]">1회 진입금액</span>
                      <span className="font-bold text-slate-200 font-mono text-xs">
                        {Number(slot.tradeAmountKrw).toLocaleString()}원
                      </span>
                    </div>

                    {isHolding ? (
                      /* 보유 중일 때 실시간 손익 & 트레일링 바 */
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-end justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-[9px] text-slate-400 block">실시간 수익률</span>
                            <div className={`text-sm font-black flex items-center ${
                              isProfit ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {isProfit ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                              {isProfit ? '+' : ''}{profitRate.toFixed(2)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block">손익금</span>
                            <span className={`text-[11px] font-bold ${
                              isProfit ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {isProfit ? '+' : ''}{Number(slot.profitKrw || 0).toLocaleString()}원
                            </span>
                          </div>
                        </div>

                        {/* 트레일링 스탑 게이지 */}
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80 space-y-0.5">
                          <div className="flex justify-between text-[9px] text-slate-400">
                            <span>최고 달성</span>
                            <span className="text-purple-400 font-bold">
                              +{Number(slot.position.highestProfitPct || 0).toFixed(2)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(10, (slot.position.highestProfitPct || 0) * 20))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 대기 상태 배너 */
                      <div className="py-2.5 px-2 text-center rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-0.5">
                        <div className="flex items-center justify-center gap-1 text-[11px] text-indigo-300 font-bold">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>업비트 120+ 전종목 스캔</span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          급등(+0.8%) 발생 시 자동 탑승
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 하단: 액션 버튼들 */}
              {!isEditing && !isPending && (
                <div className="flex gap-1.5 pt-2.5 mt-2.5 border-t border-slate-800/80" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleStartEdit(e, slot)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>금액 설정</span>
                  </button>

                  {isHolding && (
                    <button
                      onClick={() => onSellSlot && onSellSlot(slot.slotId)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition cursor-pointer"
                    >
                      즉시 매도
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
