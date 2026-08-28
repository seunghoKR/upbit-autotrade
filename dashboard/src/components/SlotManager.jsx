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
  Clock,
  BarChart3,
  AlertTriangle,
  Settings2,
  Check,
  X
} from 'lucide-react';

const DEFAULT_SLOTS = [
  { id: 1, slotId: 1, slotName: '1번 슬롯', isEnabled: true, targetMarket: 'KRW-BTC', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 2, slotId: 2, slotName: '2번 슬롯', isEnabled: true, targetMarket: 'KRW-ETH', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 3, slotId: 3, slotName: '3번 슬롯', isEnabled: true, targetMarket: 'KRW-SOL', tradeAmountKrw: 30000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 4, slotId: 4, slotName: '4번 슬롯', isEnabled: true, targetMarket: 'KRW-XRP', tradeAmountKrw: 30000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 5, slotId: 5, slotName: '5번 슬롯', isEnabled: true, targetMarket: 'KRW-DOGE', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 6, slotId: 6, slotName: '6번 슬롯', isEnabled: true, targetMarket: 'KRW-ADA', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 7, slotId: 7, slotName: '7번 슬롯', isEnabled: true, targetMarket: 'KRW-AVAX', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 8, slotId: 8, slotName: '8번 슬롯', isEnabled: true, targetMarket: 'KRW-DOT', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 9, slotId: 9, slotName: '9번 슬롯', isEnabled: true, targetMarket: 'KRW-NEAR', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, targetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
];

export default function SlotManager({ 
  slots = [], 
  onUpdateSlot, 
  onSellSlot, 
  livePriceMap = {},
  botRunning = false,
  onToggleBot,
  onTriggerMockSurge,
  pendingSurgeCountdown = null,
  selectedSlotId = 1,
  onSelectSlot,
  krwBalance = 1000000,
  currentUser = null
}) {
  // 어떤 상황에서도 슬롯이 화면에서 비어있지 않도록 보장
  const displaySlots = (Array.isArray(slots) && slots.length > 0) ? slots : DEFAULT_SLOTS;

  const [editingSlotId, setEditingSlotId] = useState(null);
  const [activeTabSlotId, setActiveTabSlotId] = useState(1);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedStatsSlot, setSelectedStatsSlot] = useState(null);

  // 편집 폼 상태 (추천전략 vs 셀프전략 지원, 기본값 0원)
  const [editForm, setEditForm] = useState({
    name: '',
    isEnabled: true,
    targetMarket: 'KRW-BTC',
    tradeAmountKrw: 0,
    strategyType: 'RECOMMENDED', // 'RECOMMENDED' | 'SELF'
    surgeWindowSeconds: 5,
    surgeRatePct: 1.5,
    surgeMinVolumeKrw: 10000000,
    targetProfitPct: 3.0,
    trailingCallbackPct: 1.0,
    stopLossPct: 2.0
  });

  const handleStartEdit = (e, slot) => {
    e.stopPropagation();
    setEditingSlotId(slot.slotId);
    setEditForm({
      name: slot.slotName || `슬롯 ${slot.slotId}`,
      isEnabled: slot.isEnabled,
      targetMarket: slot.targetMarket || 'KRW-BTC',
      tradeAmountKrw: slot.tradeAmountKrw !== undefined ? slot.tradeAmountKrw : 0,
      strategyType: slot.strategyType || 'RECOMMENDED',
      surgeWindowSeconds: slot.surgeWindowSeconds !== undefined ? slot.surgeWindowSeconds : 5,
      surgeRatePct: slot.surgeRatePct !== undefined ? slot.surgeRatePct : 1.5,
      surgeMinVolumeKrw: slot.surgeMinVolumeKrw !== undefined ? slot.surgeMinVolumeKrw : 10000000,
      targetProfitPct: slot.targetProfitPct || 3.0,
      trailingCallbackPct: slot.trailingCallbackPct || 1.0,
      stopLossPct: slot.stopLossPct || 2.0
    });
  };

  const handleSaveEdit = async (slotId) => {
    if (onUpdateSlot) {
      await onUpdateSlot(slotId, editForm);
    }
    setEditingSlotId(null);
  };

  const handleOpenStats = (e, slot) => {
    e.stopPropagation();
    setSelectedStatsSlot(slot);
    setIsStatsModalOpen(true);
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
      'ADA': '에이다 (ADA)',
      'AVAX': '아발란체 (AVAX)',
      'DOT': '폴카닷 (DOT)',
      'NEAR': '니어프로토콜 (NEAR)',
      'LINK': '체인링크 (LINK)',
      'STX': '스택스 (STX)',
      'SUI': '수이 (SUI)',
      'SHIB': '시바이누 (SHIB)',
      'PEPE': '페페 (PEPE)'
    };
    return names[coin] || `${coin} (${coin})`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl space-y-5">
      {/* 1. 상단 타이틀 & 봇 가동 제어 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight whitespace-nowrap">
                멀티 슬롯 자동매매 매니저
              </h2>
              <span className="text-[10px] sm:text-xs px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold whitespace-nowrap">
                {displaySlots.length}슬롯
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              100% 전자동 알고리즘으로 시세 급등을 감지하고, 완료 즉시 텔레그램으로 수익 결과를 전송합니다.
            </p>
          </div>
        </div>
      </div>

      {/* ⚡ 실시간 급등 감지 레이더 상단 실시간 3초 카운트다운 알림 바 */}
      {pendingSurgeCountdown && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border-2 border-amber-400 text-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl shadow-amber-500/20 animate-in fade-in">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 animate-bounce shadow">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tracking-wide">
                  급등 레이더 포착
                </span>
                <h3 className="font-extrabold text-white text-sm sm:text-base">
                  {formatMarketName(pendingSurgeCountdown.market)} 급등 포착!
                </h3>
              </div>
              <p className="text-xs text-amber-200 mt-0.5">
                <strong>{pendingSurgeCountdown.slotId}번 슬롯</strong>에 <strong>{pendingSurgeCountdown.secondsLeft}초 후 전자동 시장가 매수 주문</strong>이 실행됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <div className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-mono font-black text-sm flex items-center gap-1.5 shadow-lg animate-pulse">
              <Clock className="w-4 h-4" />
              <span>{pendingSurgeCountdown.secondsLeft}초 후 자동 매수...</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 슬롯 탭 바 (2개 이상 슬롯일 때만 표시, 모바일 가로 스크롤) */}
      {displaySlots.length > 1 && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-800/60">
          {displaySlots.map((slot) => {
            const isSelected = (selectedSlotId === slot.slotId);
            const hasPosition = slot.positionStatus === 'IN_POSITION';
            return (
              <button
                key={slot.slotId}
                onClick={() => onSelectSlot && onSelectSlot(slot.slotId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105'
                    : !slot.isEnabled
                      ? 'bg-slate-900/60 text-slate-500 border-slate-800'
                      : hasPosition
                      ? 'bg-slate-800/90 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{slot.slotId}번</span>
                <span className="text-[11px] font-normal truncate max-w-[80px]">
                  {!slot.isEnabled ? '정지' : (slot.targetMarket ? slot.targetMarket.replace('KRW-', '') : '대기')}
                </span>
                {!slot.isEnabled ? (
                  <span className="text-[10px] text-slate-500 font-mono">⏸️</span>
                ) : hasPosition ? (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. 슬롯 카드 그리드 (1개 슬롯은 화면 가운데 정렬, 멀티 슬롯은 PC 3열 그리드 배치) */}
      <div className={displaySlots.length === 1 ? "flex justify-center py-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"}>
        {displaySlots.map((slot) => {
          const isSelected = (selectedSlotId === slot.slotId);
          const isEditing = (editingSlotId === slot.slotId);
          const hasPosition = (slot.positionStatus === 'IN_POSITION');
          const isSurgeCounting = (pendingSurgeCountdown && pendingSurgeCountdown.slotId === slot.slotId);
          const marketData = livePriceMap[slot.targetMarket] || {};
          const currentPrice = marketData.trade_price || slot.entryPrice || 0;
          const profitPct = (slot.entryPrice && currentPrice) 
            ? (((currentPrice - slot.entryPrice) / slot.entryPrice) * 100)
            : (slot.highestProfitPct || 0);
          const isProfit = profitPct >= 0;

          // 잔고 초과 여부 확인 (0원일 때는 경고 미표시)
          const isOverBalance = (slot.tradeAmountKrw > 0 && slot.tradeAmountKrw > krwBalance);
          const isZeroAmount = (!slot.tradeAmountKrw || slot.tradeAmountKrw === 0);

          const isPendingApproval = (currentUser?.role !== 'DEVELOPER' && currentUser?.role !== 'OPERATOR' && currentUser?.approvalStatus === 'PENDING');
          const isSelfStrategy = (slot.strategyType === 'SELF');

          return (
            <div
              key={slot.slotId}
              onClick={() => onSelectSlot && onSelectSlot(slot.slotId)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[255px] select-none ${
                displaySlots.length === 1 ? 'max-w-xl w-full ' : ''
              }${
                !slot.isEnabled
                  ? 'bg-slate-950/90 border-slate-800/80 opacity-60 grayscale-[25%]'
                  : isSurgeCounting
                  ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400 shadow-2xl shadow-amber-500/30 animate-pulse'
                  : isSelfStrategy
                  ? (isSelected
                      ? 'bg-gradient-to-br from-purple-950/50 via-slate-900/95 to-slate-950 border-purple-400 shadow-xl shadow-purple-500/25 ring-1 ring-purple-400/50'
                      : 'bg-gradient-to-br from-purple-950/30 via-slate-900/90 to-slate-950 border-purple-500/60 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/15')
                  : (isSelected
                      ? 'bg-gradient-to-br from-emerald-950/50 via-slate-900/95 to-slate-950 border-emerald-400 shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                      : 'bg-gradient-to-br from-emerald-950/25 via-slate-900/90 to-slate-950 border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/15')
              }`}
            >
              {/* 🔒 [무료방문자 승인 대기] 락 오버레이 */}
              {isPendingApproval && (
                <div 
                  className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-5 text-center space-y-2.5 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg animate-pulse">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-sm flex items-center justify-center gap-1.5">
                      <span>🔒 운영자 이용 승인 대기 중</span>
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs mt-1">
                      현재 가입 승인 검토가 진행 중입니다.<br />
                      운영자의 승인 즉시 <strong>3일 무료 체험</strong>이 시작되며 1번 슬롯이 활성화됩니다! ✨
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    승인 상태: 대기 (PENDING)
                  </span>
                </div>
              )}

              {/* 1. 상단 슬롯 헤더 (일반/수정 공통 일관된 배치) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    !slot.isEnabled
                      ? 'bg-slate-800 text-slate-500 border border-slate-700'
                      : hasPosition 
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' 
                      : (isSelfStrategy 
                          ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40')
                  }`}>
                    {slot.slotId}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                      <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap truncate">
                        {slot.slotName || `${slot.slotId}번 슬롯`}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-extrabold tracking-tight border shadow-sm shrink-0 whitespace-nowrap ${
                        !slot.isEnabled
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : isSelfStrategy 
                          ? 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-purple-500/20' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20'
                      }`}>
                        <span className="sm:hidden">{!slot.isEnabled ? '정지' : (isSelfStrategy ? '셀프' : '추천')}</span>
                        <span className="hidden sm:inline">{!slot.isEnabled ? '⏸️ 정지' : (isSelfStrategy ? '🛠️ 셀프' : '🎯 추천')}</span>
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs text-slate-400 whitespace-nowrap truncate block">
                      {!slot.isEnabled ? (
                        <span className="text-slate-500 font-bold">⏸️ 슬롯 정지됨 (감시 중단)</span>
                      ) : isSurgeCounting ? (
                        <span className="text-amber-300 font-bold animate-pulse">⚡ 급등 포착: {formatMarketName(pendingSurgeCountdown.market)}</span>
                      ) : (
                        formatMarketName(slot.targetMarket)
                      )}
                    </span>
                  </div>
                </div>

                {/* 상태 뱃지 & 액션 버튼 */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* ⚡ 개별 슬롯 자동매매 ON/OFF 토글 스위치 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSlot && onUpdateSlot(slot.slotId, {
                        ...slot,
                        isEnabled: !slot.isEnabled
                      });
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 border transition shadow-sm cursor-pointer whitespace-nowrap ${
                      slot.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                    }`}
                    title={slot.isEnabled ? '슬롯 자동매매 일시정지' : '슬롯 자동매매 가동 시작'}
                  >
                    <Power className={`w-3 h-3 ${slot.isEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>{slot.isEnabled ? '가동' : '정지'}</span>
                  </button>

                  {isEditing ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSlotId(null);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
                      title="설정 닫기"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleOpenStats(e, slot)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                        title="통계"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleStartEdit(e, slot)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                        title="설정"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 2. 중앙 콘텐츠 영역 (정확히 동일한 여백과 높이 배분) */}
              {isSurgeCounting ? (
                /* ⚡ 급등 레이더 포착 상세 정보 & 3초 카운트다운 게이지 */
                <div className="flex-1 flex flex-col justify-center my-2 space-y-2 animate-in fade-in">
                  <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-400/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        <span className="text-[11px] font-black text-amber-300">🚨 실시간 급등 포착</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                        +{pendingSurgeCountdown.rate || '2.6'}% 급등
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-500/20 text-xs">
                      <div>
                        <span className="text-[10px] text-amber-200/70 block">포착 종목</span>
                        <span className="font-bold text-white text-xs truncate block">
                          {formatMarketName(pendingSurgeCountdown.market)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-amber-200/70 block">포착 현재가</span>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {Math.round(pendingSurgeCountdown.price || 0).toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2 py-1 rounded-lg border border-amber-500/20">
                      <span className="text-slate-400">주문 예정 금액</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {Math.round(pendingSurgeCountdown.amount || slot.tradeAmountKrw || 50000).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 3초 카운트다운 바 */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>3초 뒤 전자동 매수 체결</span>
                    </span>
                    <span className="font-mono text-sm font-extrabold">{pendingSurgeCountdown.secondsLeft}초</span>
                  </div>
                </div>
              ) : isEditing ? (
                /* ⚙️ 수정 모드 폼 */
                <div className="flex-1 flex flex-col justify-center my-1.5 space-y-2" onClick={(e) => e.stopPropagation()}>
                  {/* 전략 선택 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, strategyType: 'RECOMMENDED' }))}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                        editForm.strategyType === 'RECOMMENDED'
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>🎯 추천전략 (운영자)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, strategyType: 'SELF' }))}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                        editForm.strategyType === 'SELF'
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>🛠️ 셀프전략 (직접)</span>
                    </button>
                  </div>

                  {/* 1회 매수금액 설정 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <label className="text-slate-400 font-bold">1회 매수금액 (KRW)</label>
                      <span className="text-slate-500">주문가능: {Math.round(krwBalance).toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={editForm.tradeAmountKrw}
                        onChange={(e) => setEditForm(prev => ({ ...prev, tradeAmountKrw: Number(e.target.value) }))}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, tradeAmountKrw: Math.max(0, Math.floor(krwBalance)) }))}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold shrink-0 border border-slate-700"
                      >
                        최대
                      </button>
                    </div>
                  </div>

                  {/* 🛠️ 셀프전략 전용 상세 옵션 (급등 감지 기준 & 익절/손절) */}
                  {editForm.strategyType === 'SELF' ? (
                    <div className="space-y-1.5 p-2 rounded-xl bg-slate-950/90 border border-purple-500/30">
                      <div className="text-[10px] font-bold text-purple-300 flex items-center justify-between">
                        <span>⚡ 급등 감지 기준 (자동매수 조건)</span>
                        <span className="text-[9px] text-slate-400 font-normal">조건 만족 시 자동 매수</span>
                      </div>
                      
                      {/* 초 단위 감시 시간 & 상승률 & 거래대금 */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                          <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">감시 시간(초)</label>
                          <div className="flex items-center justify-center gap-0.5">
                            <input
                              type="number"
                              min="1"
                              max="300"
                              step="1"
                              value={editForm.surgeWindowSeconds}
                              onChange={(e) => setEditForm(prev => ({ ...prev, surgeWindowSeconds: Math.max(1, Number(e.target.value)) }))}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-amber-300 font-mono text-[11px] text-center font-bold"
                            />
                            <span className="text-[9px] text-slate-500">초</span>
                          </div>
                        </div>
                        <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                          <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">상승률(%)</label>
                          <div className="flex items-center justify-center gap-0.5">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={editForm.surgeRatePct}
                              onChange={(e) => setEditForm(prev => ({ ...prev, surgeRatePct: Number(e.target.value) }))}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-rose-300 font-mono text-[11px] text-center font-bold"
                            />
                            <span className="text-[9px] text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                          <label className="text-[9px] text-slate-400 block mb-0.5 font-bold whitespace-nowrap">최소거래대금(원)</label>
                          <input
                            type="number"
                            step="1000000"
                            min="100000"
                            value={editForm.surgeMinVolumeKrw}
                            onChange={(e) => setEditForm(prev => ({ ...prev, surgeMinVolumeKrw: Number(e.target.value) }))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-emerald-300 font-mono text-[10px] text-center font-bold truncate"
                            title={`${Math.round(editForm.surgeMinVolumeKrw).toLocaleString()}원`}
                          />
                        </div>
                      </div>

                      {/* 익절 / 콜백 / 손절 */}
                      <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t border-slate-800">
                        <div>
                          <label className="text-[9px] text-slate-400 block">목표익절(%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.targetProfitPct}
                            onChange={(e) => setEditForm(prev => ({ ...prev, targetProfitPct: Number(e.target.value) }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-emerald-300 font-mono text-[11px] text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">콜백(%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.trailingCallbackPct}
                            onChange={(e) => setEditForm(prev => ({ ...prev, trailingCallbackPct: Number(e.target.value) }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-cyan-300 font-mono text-[11px] text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">손절(%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.stopLossPct}
                            onChange={(e) => setEditForm(prev => ({ ...prev, stopLossPct: Number(e.target.value) }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-rose-300 font-mono text-[11px] text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 🎯 추천전략 프리셋 안내 */
                    <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[10px] text-slate-300 space-y-1">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>🎯 운영자 황금 추천 조건</span>
                        <span>자동 적용</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        • <strong>5초</strong> 동안 <strong>+1.5%</strong> 급등 &amp; <strong>1,000만원</strong> 수급 시 자동 매수<br />
                        • 익절 <strong>+3.0%</strong> | 트레일링 콜백 <strong>-1.0%</strong> | 손절 <strong>-2.0%</strong>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* 📊 일반 보기 모드 */
                <div className="flex-1 flex flex-col justify-center my-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-slate-400 font-bold">매수금액</span>
                        {/* ⏱️ 초 단위 급등감지 조건 뱃지 */}
                        {isSelfStrategy ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-extrabold border border-purple-500/30 whitespace-nowrap" title={`${slot.surgeWindowSeconds || 5}초 동안 +${slot.surgeRatePct || 1.5}% 상승 & ${Math.round((slot.surgeMinVolumeKrw || 10000000)/10000).toLocaleString()}만원 이상 거래대금 시 자동매수`}>
                            ⏱️ {slot.surgeWindowSeconds || 5}초 감시
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-extrabold border border-emerald-500/30 whitespace-nowrap" title="5초 동안 +1.5% 급등 & 1,000만원 거래대금 감지 시 자동매수">
                            🎯 5초 추천감시
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-black font-mono text-white flex items-center gap-1.5">
                        {Math.round(slot.tradeAmountKrw || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">원</span>
                        {isZeroAmount && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-amber-300 font-sans font-bold border border-amber-500/20">
                            미설정
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">실시간 수익률</span>
                      <span className={`text-sm font-black font-mono ${
                        hasPosition 
                          ? (isProfit ? 'text-rose-400' : 'text-blue-400')
                          : 'text-slate-500'
                      }`}>
                        {hasPosition ? `${isProfit ? '+' : ''}${profitPct.toFixed(2)}%` : '포지션 대기'}
                      </span>
                    </div>
                  </div>

                  {/* 잔고 초과 시 알림 뱃지 */}
                  {isOverBalance && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>매수금액이 잔고를 초과합니다</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(e, slot);
                        }}
                        className="underline font-bold text-amber-400 hover:text-amber-200"
                      >
                        조정
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. 하단 푸터 (일반/수정 모드에 맞춰 일정한 높이로 하단 고정) */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/60 shrink-0">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(slot.slotId)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-md"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>설정 저장하기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSlotId(null)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${!slot.isEnabled ? 'bg-slate-600' : hasPosition ? 'bg-emerald-400 animate-ping' : (isSurgeCounting ? 'bg-amber-400 animate-ping' : (isZeroAmount ? 'bg-amber-400' : 'bg-slate-500'))}`}></span>
                      <strong className={!slot.isEnabled ? 'text-slate-500' : hasPosition ? 'text-emerald-300' : (isSurgeCounting ? 'text-amber-300' : (isZeroAmount ? 'text-amber-400/90' : 'text-slate-400'))}>
                        {!slot.isEnabled ? '⏸️ 슬롯 가동 중지됨 (감시 중단)' : hasPosition ? '포지션 보유 (수익 추적)' : (isSurgeCounting ? '급등 포착! 자동 매수 대기' : (isZeroAmount ? '매수금액 설정 대기 (0원)' : '급등 신호 감시 중'))}
                      </strong>
                    </span>

                    {/* ⚡ 각 슬롯별 개별 '긴급 강제 매도' 상시 배치 버튼 */}
                    <button
                      type="button"
                      disabled={!hasPosition}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasPosition) {
                          alert('현재 해당 슬롯에 보유 중인 포지션(코인)이 없습니다.');
                          return;
                        }
                        if (window.confirm(`🚨 [긴급 강제 매도]\n${slot.slotId}번 슬롯의 ${slot.targetMarket} 포지션을 지금 즉시 업비트 시장가로 전량 매도 청산하시겠습니까?`)) {
                          onSellSlot && onSellSlot(slot.slotId);
                        }
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition-all shadow-md shrink-0 whitespace-nowrap ${
                        hasPosition
                          ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-rose-600/30 animate-pulse cursor-pointer'
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700/80 cursor-pointer hover:bg-slate-800'
                      }`}
                      title="업비트 시장가 즉시 전량 매도"
                    >
                      <Zap className={`w-3.5 h-3.5 ${hasPosition ? 'text-yellow-300 fill-yellow-300' : 'text-slate-400'}`} />
                      <span>⚡ 긴급 매도</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. 슬롯별 통계 상세 팝업 모달 */}
      {isStatsModalOpen && selectedStatsSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {selectedStatsSlot.slotId}번 슬롯 누적 매매 통계
                </h3>
              </div>
              <button onClick={() => setIsStatsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">총 거래 횟수</span>
                <span className="text-base font-bold font-mono text-white">
                  {selectedStatsSlot.totalTrades || 0}회
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">승률</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {selectedStatsSlot.totalTrades > 0 
                    ? `${Math.round(((selectedStatsSlot.winTrades || 0) / selectedStatsSlot.totalTrades) * 100)}%` 
                    : '-'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">실현 손익 합계</span>
                <span className={`text-base font-bold font-mono ${
                  (selectedStatsSlot.totalRealizedProfitKrw || 0) > 0 
                    ? 'text-rose-400' 
                    : (selectedStatsSlot.totalRealizedProfitKrw || 0) < 0 
                    ? 'text-blue-400' 
                    : 'text-slate-400'
                }`}>
                  {(selectedStatsSlot.totalRealizedProfitKrw || 0) > 0 ? '+' : ''}
                  {Math.round(selectedStatsSlot.totalRealizedProfitKrw || 0).toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex justify-between">
                <span>현재 대상 코인:</span>
                <strong className="text-white">{formatMarketName(selectedStatsSlot.targetMarket)}</strong>
              </div>
              <div className="flex justify-between">
                <span>1회 매수금액:</span>
                <strong className="text-white">{Math.round(selectedStatsSlot.tradeAmountKrw).toLocaleString()}원</strong>
              </div>
              <div className="flex justify-between">
                <span>운용 전략:</span>
                <strong className="text-emerald-400">{selectedStatsSlot.strategyType === 'SELF' ? '셀프 전략' : '운영자 추천전략'}</strong>
              </div>
            </div>

            <button
              onClick={() => setIsStatsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
