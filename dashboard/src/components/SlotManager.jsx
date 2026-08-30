import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Download,
  Coins
} from 'lucide-react';
import ImportCoinModal from './ImportCoinModal';

const DEFAULT_SLOTS = [
  { id: 1, slotId: 1, slotName: '1번 슬롯', isEnabled: true, targetMarket: 'KRW-BTC', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 2, slotId: 2, slotName: '2번 슬롯', isEnabled: true, targetMarket: 'KRW-ETH', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 3, slotId: 3, slotName: '3번 슬롯', isEnabled: true, targetMarket: 'KRW-SOL', tradeAmountKrw: 30000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 4, slotId: 4, slotName: '4번 슬롯', isEnabled: true, targetMarket: 'KRW-XRP', tradeAmountKrw: 30000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 5, slotId: 5, slotName: '5번 슬롯', isEnabled: true, targetMarket: 'KRW-DOGE', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 6, slotId: 6, slotName: '6번 슬롯', isEnabled: true, targetMarket: 'KRW-ADA', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 7, slotId: 7, slotName: '7번 슬롯', isEnabled: true, targetMarket: 'KRW-AVAX', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 8, slotId: 8, slotName: '8번 슬롯', isEnabled: true, targetMarket: 'KRW-DOT', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 9, slotId: 9, slotName: '9번 슬롯', isEnabled: true, targetMarket: 'KRW-NEAR', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, trailingTargetProfitPct: 3.0, trailingCallbackPct: 1.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
];

export default function SlotManager({ 
  slots = [], 
  onUpdateSlot, 
  onSellSlot, 
  onResetSlotStats,
  onImportCoin,
  accounts = [],
  livePriceMap = {},
  botRunning = false,
  onToggleBot,
  onTriggerMockSurge,
  pendingSurgeCountdown = null,
  pendingSurgeCountdowns = {},
  selectedSlotId = 1,
  onSelectSlot,
  krwBalance = 1000000,
  currentUser = null
}) {
  const displaySlots = (Array.isArray(slots) && slots.length > 0) ? slots : DEFAULT_SLOTS;

  const [editingSlotId, setEditingSlotId] = useState(null);
  const [activeTabSlotId, setActiveTabSlotId] = useState(1);
  const [editForm, setEditForm] = useState({
    tradeAmountKrw: 50000,
    strategyType: 'RECOMMENDED',
    surgeWindowSeconds: 5,
    surgeRatePct: 1.5,
    surgeMinVolumeKrw: 10000000,
    trailingTargetProfitPct: 3.0,
    trailingCallbackPct: 1.0,
    stopLossPct: 2.0
  });

  const [selectedStatsSlot, setSelectedStatsSlot] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const [selectedImportSlot, setSelectedImportSlot] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [localPriceMap, setLocalPriceMap] = useState({});

  // ⚡ 슬롯에 배정된 코인들의 실시간 가격을 1.5초 주기로 즉시 다이렉트 REST 조회 (웹소켓 거래 체결 대기 지연 0초화!)
  useEffect(() => {
    const activeMarkets = Array.from(new Set(
      displaySlots
        .map(s => s.targetMarket)
        .filter(m => m && m.startsWith('KRW-'))
    ));

    if (activeMarkets.length === 0) return;

    const syncPrices = () => {
      fetch(`https://api.upbit.com/v1/ticker?markets=${activeMarkets.join(',')}`)
        .then(r => r.ok ? r.json() : [])
        .then(tickers => {
          if (Array.isArray(tickers) && tickers.length > 0) {
            const batch = {};
            tickers.forEach(t => {
              if (t.market && t.trade_price) {
                batch[t.market] = {
                  code: t.market,
                  trade_price: t.trade_price,
                  change: t.change,
                  change_rate: t.change_rate,
                  signed_change_rate: t.signed_change_rate
                };
              }
            });
            setLocalPriceMap(prev => ({ ...prev, ...batch }));
          }
        })
        .catch(() => {});
    };

    syncPrices(); // 슬롯 배정 즉시 0.05초 만에 1회 실행!
    const timer = setInterval(syncPrices, 1500); // 1.5초마다 갱신
    return () => clearInterval(timer);
  }, [displaySlots.map(s => `${s.slotId}:${s.targetMarket}:${s.positionStatus}`).join('|')]);

  const handleOpenImport = (e, slot) => {
    e.stopPropagation();
    setSelectedImportSlot(slot);
    setIsImportModalOpen(true);
  };

  const handleStartEdit = (e, slot) => {
    e.stopPropagation();
    setEditingSlotId(slot.slotId);
    const targetProfit = (slot.targetProfitPct !== undefined && slot.targetProfitPct !== null && slot.targetProfitPct !== '') 
      ? slot.targetProfitPct 
      : (slot.trailingTargetProfitPct !== undefined && slot.trailingTargetProfitPct !== null && slot.trailingTargetProfitPct !== '' ? slot.trailingTargetProfitPct : 3.0);
    const callback = (slot.trailingCallbackPct !== undefined && slot.trailingCallbackPct !== null && slot.trailingCallbackPct !== '') ? slot.trailingCallbackPct : 1.0;
    const stopLoss = (slot.stopLossPct !== undefined && slot.stopLossPct !== null && slot.stopLossPct !== '') ? slot.stopLossPct : 2.0;

    setEditForm({
      tradeAmountKrw: slot.tradeAmountKrw !== undefined ? slot.tradeAmountKrw : 50000,
      strategyType: slot.strategyType || 'RECOMMENDED',
      surgeWindowSeconds: slot.surgeWindowSeconds !== undefined ? slot.surgeWindowSeconds : 5,
      surgeRatePct: slot.surgeRatePct !== undefined ? slot.surgeRatePct : 1.5,
      surgeMinVolumeKrw: slot.surgeMinVolumeKrw !== undefined ? slot.surgeMinVolumeKrw : 10000000,
      targetProfitPct: targetProfit,
      trailingTargetProfitPct: targetProfit,
      trailingCallbackPct: callback,
      stopLossPct: stopLoss
    });
  };

  const handleSaveEdit = (slotId) => {
    if (editForm.tradeAmountKrw > 0 && editForm.tradeAmountKrw < 5000) {
      alert('업비트 원화 마켓의 최소 주문 가능 금액은 5,000원입니다.\n매수금액을 5,000원 이상으로 설정해 주세요!');
      return;
    }

    if (onUpdateSlot) {
      const targetProfit = (editForm.targetProfitPct !== undefined && editForm.targetProfitPct !== '') 
        ? editForm.targetProfitPct 
        : (editForm.trailingTargetProfitPct !== undefined && editForm.trailingTargetProfitPct !== '' ? editForm.trailingTargetProfitPct : 3.0);

      onUpdateSlot(slotId, {
        tradeAmountKrw: editForm.tradeAmountKrw,
        strategyType: editForm.strategyType,
        surgeWindowSeconds: editForm.surgeWindowSeconds,
        surgeRatePct: editForm.surgeRatePct,
        surgeMinVolumeKrw: editForm.surgeMinVolumeKrw,
        targetProfitPct: targetProfit,
        trailingTargetProfitPct: targetProfit,
        trailingCallbackPct: editForm.trailingCallbackPct,
        stopLossPct: editForm.stopLossPct
      });
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
    <div className="space-y-4">
      {/* 1. 상단 슬롯 헤더 & 1~9번 슬롯 탭 네비게이션 통합 바 (1줄 콤팩트 디자인) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
            <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-100 text-xs sm:text-sm tracking-tight whitespace-nowrap">
              멀티 슬롯 실시간 자동매매
            </h3>
            <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap">
              {displaySlots.filter(s => s.isEnabled).length}/{displaySlots.length} 가동
            </span>
          </div>
        </div>

        {/* 2. 1~9번 슬롯 탭 버튼 바 (9개 슬롯 모두 짤림 없이 1줄 핏) */}
        {displaySlots.length > 1 && (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 lg:pb-0 scrollbar-none">
            {displaySlots.map((slot) => {
              const isSelected = (selectedSlotId === slot.slotId);
              const hasPosition = (slot.positionStatus === 'IN_POSITION' || slot.positionStatus === 'HOLDING' || slot.positionStatus === 'TRAILING_ACTIVE') || Boolean(slot.entryPrice && slot.entryPrice > 0);
              return (
                <button
                  key={slot.slotId}
                  onClick={() => onSelectSlot && onSelectSlot(slot.slotId)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold shrink-0 transition-colors border cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-sm'
                      : !slot.isEnabled
                        ? 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-400'
                        : hasPosition
                        ? 'bg-slate-800/90 text-emerald-300 border-emerald-500/30 hover:bg-slate-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{slot.slotId}번</span>
                  <span className="font-normal truncate max-w-[48px] sm:max-w-[60px]">
                    {!slot.isEnabled ? '정지' : (hasPosition && slot.targetMarket ? slot.targetMarket.replace('KRW-', '') : '대기')}
                  </span>
                  {!slot.isEnabled ? (
                    <span className="text-[9px] text-slate-500 font-mono">⏸️</span>
                  ) : hasPosition ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                  ) : (
                    <span className="text-[9px] text-emerald-400">⚡</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. 슬롯 카드 그리드 (1개 슬롯은 화면 가운데 정렬, 멀티 슬롯은 PC 3열 그리드 배치) */}
      <div className={displaySlots.length === 1 ? "flex justify-center py-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"}>
        {displaySlots.map((slot) => {
          const isSelected = (selectedSlotId === slot.slotId);
          const isEditing = (editingSlotId === slot.slotId);
          const hasPosition = (slot.positionStatus === 'IN_POSITION' || slot.positionStatus === 'HOLDING' || slot.positionStatus === 'TRAILING_ACTIVE') || Boolean(slot.entryPrice && slot.entryPrice > 0);
          
          // ⚡ 각 슬롯별 독립적인 카운트다운 상태 매핑
          const slotCountdown = (pendingSurgeCountdowns && pendingSurgeCountdowns[slot.slotId]) || 
            (pendingSurgeCountdown && pendingSurgeCountdown.slotId === slot.slotId ? pendingSurgeCountdown : null);
          const isSurgeCounting = Boolean(slotCountdown);

          const combinedLiveMap = { ...localPriceMap, ...livePriceMap };
          const marketData = combinedLiveMap[slot.targetMarket];
          const hasLivePrice = Boolean(marketData?.trade_price);
          const currentPrice = hasLivePrice ? marketData.trade_price : (slot.entryPrice || 0);
          const profitPct = (slot.entryPrice && hasLivePrice) 
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

              {/* 1. 상단 슬롯 헤더 (| 1번 슬롯 | 추천전략 |    | [Power] ON | [통계] | [수정] |) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* 슬롯 번호 버튼형 뱃지 */}
                  <div className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center border shadow-sm shrink-0 whitespace-nowrap ${
                    !slot.isEnabled
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : hasPosition 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/10' 
                      : (isSelfStrategy 
                          ? 'bg-purple-500/20 text-purple-200 border-purple-400/40 shadow-purple-500/10' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-500/10')
                  }`}>
                    {slot.slotId}번 슬롯
                  </div>

                  {/* 전략 뱃지 */}
                  <span className={`text-[10px] px-2 py-0.8 rounded-lg font-extrabold tracking-tight border shadow-sm shrink-0 whitespace-nowrap ${
                    !slot.isEnabled
                      ? 'bg-slate-900 text-slate-500 border-slate-800'
                      : isSelfStrategy 
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40' 
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {isSelfStrategy ? '셀프전략' : '추천전략'}
                  </span>
                </div>

                {/* 우측 액션 메뉴: | [Power] ON | [통계 아이콘] | [수정 아이콘] | */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* ⚡ ON / OFF 스위치 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSlot && onUpdateSlot(slot.slotId, {
                        ...slot,
                        isEnabled: !slot.isEnabled
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 border transition shadow-sm cursor-pointer whitespace-nowrap ${
                      slot.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                    }`}
                    title={slot.isEnabled ? '슬롯 자동매매 OFF (일시정지)' : '슬롯 자동매매 ON (가동 시작)'}
                  >
                    <Power className={`w-3.5 h-3.5 ${slot.isEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>{slot.isEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* 📥 가져오기(아이콘) 버튼: ON 버튼과 통계버튼 사이에 배치 */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenImport(e, slot)}
                    className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-400 border border-slate-700/80 hover:border-emerald-500/50 transition cursor-pointer"
                    title="업비트 보유 코인 이 슬롯으로 가져오기"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {isEditing ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSlotId(null);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                      title="수정 닫기"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      {/* 통계(아이콘) 버튼 */}
                      <button
                        onClick={(e) => handleOpenStats(e, slot)}
                        className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700/80 transition cursor-pointer"
                        title="통계 보기"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      {/* 수정(아이콘) 버튼 */}
                      <button
                        onClick={(e) => handleStartEdit(e, slot)}
                        className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700/80 transition cursor-pointer"
                        title="슬롯 설정 수정"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 2. 중앙 콘텐츠 영역 (정확히 동일한 여백과 높이 배분) */}
              {isSurgeCounting && slotCountdown ? (
                /* ⚡ 급등 레이더 포착 상세 정보 & 3초 카운트다운 게이지 */
                <div className="flex-1 flex flex-col justify-center my-2 space-y-2 animate-in fade-in">
                  <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-400/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        <span className="text-[11px] font-black text-amber-300">🚨 실시간 급등 포착</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                        +{slotCountdown.rate || '2.6'}% 급등
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-500/20 text-xs">
                      <div>
                        <span className="text-[10px] text-amber-200/70 block">포착 종목</span>
                        <span className="font-bold text-white text-xs truncate block">
                          {formatMarketName(slotCountdown.market)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-amber-200/70 block">포착 현재가</span>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {Math.round(slotCountdown.price || 0).toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2 py-1 rounded-lg border border-amber-500/20">
                      <span className="text-slate-400">주문 예정 금액</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {Math.round(slotCountdown.amount || slot.tradeAmountKrw || 50000).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 3초 카운트다운 바 */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>3초 뒤 전자동 매수 체결</span>
                    </span>
                    <span className="font-mono text-sm font-extrabold">{slotCountdown.secondsLeft}초</span>
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

                  {/* 매수금액(KRW) - 1줄 컴팩트 레이아웃 */}
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="text-xs text-slate-300 font-bold whitespace-nowrap">매수금액(KRW)</label>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 justify-end max-w-[260px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.tradeAmountKrw !== undefined ? editForm.tradeAmountKrw : 5000}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setEditForm(prev => ({ ...prev, tradeAmountKrw: val === '' ? '' : Number(val) }));
                          }}
                          placeholder="5000"
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-emerald-300 font-mono text-xs font-bold focus:outline-none focus:border-emerald-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, tradeAmountKrw: Math.max(0, Math.floor(krwBalance)) }))}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-bold shrink-0 border border-slate-700 cursor-pointer active:scale-95 transition-all"
                          title="주문 가능 전액 입력"
                        >
                          최대
                        </button>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap hidden sm:inline" title="현재 업비트 보유 원화 잔고">
                          (가능: {Math.round(krwBalance).toLocaleString()}원)
                        </span>
                      </div>
                    </div>
                    {editForm.tradeAmountKrw > 0 && editForm.tradeAmountKrw < 5000 && (
                      <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 pt-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>업비트 최소 주문금액은 5,000원 이상이어야 합니다.</span>
                      </p>
                    )}
                  </div>

                  {/* 🛠️ 셀프전략 전용 상세 옵션 (1. 매수 조건 & 2. 매도 조건 분리) */}
                  {editForm.strategyType === 'SELF' ? (
                    <div className="space-y-2.5">
                      {/* ⚡ 1. 자동 매수 조건 (급등 포착 기준) */}
                      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                        <div className="text-xs text-amber-300 flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            ⚡ 1. 자동 매수 조건 (급등 포착)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-normal">
                            조건 만족 시 자동 매수
                          </span>
                        </div>
                        
                        {/* 초 단위 감시 시간 & 상승률 & 최소거래대금 (스피너 없는 순수 텍스트 인풋) */}
                        <div className="grid grid-cols-3 gap-1.5 text-center items-center">
                          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                            <label className="text-[11px] text-slate-300 block mb-1 font-medium whitespace-nowrap text-center" title="지정한 시간 동안의 가격 급등을 추적합니다">
                              감시 시간(초)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editForm.surgeWindowSeconds}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setEditForm(prev => ({ ...prev, surgeWindowSeconds: val === '' ? '' : Math.max(1, Number(val)) }));
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 text-center font-mono text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                            <label className="text-[11px] text-slate-300 block mb-1 font-medium whitespace-nowrap text-center" title="감시 시간 내 최저가 대비 상승해야 하는 목표 비율">
                              상승률(+%)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.surgeRatePct}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, surgeRatePct: val }));
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 text-center font-mono text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                            <label className="text-[11px] text-slate-300 block mb-1 font-medium whitespace-nowrap text-center" title="동반되어야 할 최소 거래대금 (1,000 = 1,000만원)">
                              최소대금(만원)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editForm.surgeMinVolumeManwon !== undefined ? editForm.surgeMinVolumeManwon : Math.round((editForm.surgeMinVolumeKrw || 10000000) / 10000)}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setEditForm(prev => ({
                                  ...prev,
                                  surgeMinVolumeManwon: val,
                                  surgeMinVolumeKrw: (Number(val) || 0) * 10000
                                }));
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 text-center font-mono text-xs font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none transition-colors"
                              title={`실제 적용: ${Math.round(editForm.surgeMinVolumeKrw || 10000000).toLocaleString()}원`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 🎯 2. 자동 매도 조건 (트레일링 익절 & 손절) */}
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 space-y-2">
                        <div className="text-xs text-slate-200 flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            🎯 2. 자동 매도 조건 (익절 &amp; 손절)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
                            조건 도달 시 즉시 매도
                          </span>
                        </div>

                        {/* 감시익절 (빨간색) / 콜백 (파란색) / 손절 (파란색) - 스피너 없는 순수 텍스트 인풋 */}
                        <div className="grid grid-cols-3 gap-1.5 text-center items-center">
                          {/* 감시익절 - 빨간색 (수익/상승) */}
                          <div className="bg-rose-950/25 p-1.5 rounded-lg border border-rose-500/40 text-center">
                            <label className="text-[11px] text-rose-300 block mb-1 font-bold whitespace-nowrap text-center" title="이 수익률 도달 시 최고점 추적(트레일링)을 시작합니다">
                              감시익절(+%)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.targetProfitPct !== undefined ? editForm.targetProfitPct : (editForm.trailingTargetProfitPct !== undefined ? editForm.trailingTargetProfitPct : 3.0)}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, targetProfitPct: val, trailingTargetProfitPct: val }));
                              }}
                              className="w-full bg-slate-950 border border-rose-500/50 rounded-lg py-1.5 text-center font-mono text-xs font-bold text-rose-400 focus:border-rose-400 focus:outline-none transition-colors"
                            />
                          </div>

                          {/* 콜백 - 파란색 (하락/되돌림) */}
                          <div className="bg-blue-950/25 p-1.5 rounded-lg border border-blue-500/40 text-center">
                            <label className="text-[11px] text-blue-300 block mb-1 font-bold whitespace-nowrap text-center" title="최고점 도달 후 이만큼 하락 시 수익 확정 매도합니다">
                              콜백(-%)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.trailingCallbackPct}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, trailingCallbackPct: val }));
                              }}
                              className="w-full bg-slate-950 border border-blue-500/50 rounded-lg py-1.5 text-center font-mono text-xs font-bold text-blue-400 focus:border-blue-400 focus:outline-none transition-colors"
                            />
                          </div>

                          {/* 손절 - 파란색 (하락/손실제한) */}
                          <div className="bg-blue-950/25 p-1.5 rounded-lg border border-blue-500/40 text-center">
                            <label className="text-[11px] text-blue-300 block mb-1 font-bold whitespace-nowrap text-center" title="원금 손실 방지를 위해 즉시 시장가 매도합니다">
                              손절(-%)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.stopLossPct}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, stopLossPct: val }));
                              }}
                              className="w-full bg-slate-950 border border-blue-500/50 rounded-lg py-1.5 text-center font-mono text-xs font-bold text-blue-400 focus:border-blue-400 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 🎯 추천전략 프리셋 안내 */
                    <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>🎯 운영자 황금 추천 조건</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">자동 적용</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                        • <strong>5초</strong> 동안 <strong>+1.5%</strong> 급등 &amp; <strong>1,000만원</strong> 수급 시 자동 매수<br />
                        • 감시익절 <strong className="text-rose-400">+3.0%</strong> 추적 시작 | 콜백 <strong className="text-blue-400">-1.0%</strong> | 손절 <strong className="text-blue-400">-2.0%</strong>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* 📊 일반 보기 모드 */
                <div className="flex-1 flex flex-col justify-center my-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 items-center">
                    <div>
                      {/* 미보유 상태 시: 매수금액 헤더 & 감시 뱃지 */}
                      {!hasPosition && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] text-slate-400 font-bold">
                            매수금액
                          </span>
                          {/* ⏱️ 초 단위 급등감지 조건 뱃지 (미보유 시에만 표시) */}
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
                      )}

                      {/* 보유 상태 시: 깔끔한 3단 라인 구조 (| 코인 | -> 진입단가: xx원 -> 수량: xx 코인) */}
                      {hasPosition ? (
                        <div className="space-y-1">
                          {/* 1. | 🪙 SAND | */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/25 text-amber-300 font-black text-sm font-mono border border-amber-500/40 shadow-sm flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              {(slot.targetMarket || '').replace('KRW-', '')}
                            </span>
                          </div>

                          {/* 2. 진입단가: 50원 */}
                          <div className="text-xs font-mono text-slate-300 flex items-center gap-1">
                            <span className="text-slate-400">진입단가:</span>
                            <span className="text-white font-extrabold">{Math.round(slot.entryPrice || currentPrice).toLocaleString()}원</span>
                          </div>

                          {/* 3. 수량: 100.8065 SAND */}
                          <div className="text-[11px] font-mono text-slate-400 truncate" title={`수량: ${slot.entryVolume ? slot.entryVolume.toFixed(6) : ''}`}>
                            <span className="text-slate-400">수량:</span> <strong className="text-slate-200">{slot.entryVolume ? slot.entryVolume.toFixed(4) : (slot.entryAmountKrw / currentPrice).toFixed(4)}</strong> {(slot.targetMarket || '').replace('KRW-', '')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-black font-mono text-white flex items-center gap-1.5">
                          {Math.round(slot.tradeAmountKrw || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">원</span>
                          {isZeroAmount && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-amber-300 font-sans font-bold border border-amber-500/20">
                              미설정
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex flex-col justify-between py-0.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {hasPosition ? '실시간 수익률' : '상태'}
                        </span>
                        <span className={`text-base sm:text-lg font-black font-mono block ${
                          hasPosition 
                            ? (isProfit ? 'text-rose-400' : 'text-blue-400')
                            : 'text-slate-500'
                        }`}>
                          {hasPosition ? `${isProfit ? '+' : ''}${profitPct.toFixed(2)}%` : '포지션 대기'}
                        </span>
                      </div>
                      {hasPosition && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5" title={`최고 기록 수익률: +${Math.max(profitPct, slot.highestProfitPct || 0).toFixed(2)}%`}>
                          최고: <strong className="text-rose-300 font-bold">+{Math.max(profitPct, slot.highestProfitPct || 0).toFixed(2)}%</strong>
                        </span>
                      )}
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
                      {!slot.isEnabled ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                          <strong className="text-slate-500">⏸️ 슬롯 가동 중지됨 (감시 중단)</strong>
                        </>
                      ) : hasPosition ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <strong className="text-emerald-300">🎯 실시간 수익 추적 중</strong>
                        </>
                      ) : isSurgeCounting ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <strong className="text-amber-300 animate-pulse">⚡ 급등 포착! 자동 매수 대기</strong>
                        </>
                      ) : isZeroAmount ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <strong className="text-amber-400/90">매수금액 설정 대기 (0원)</strong>
                        </>
                      ) : (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                          </span>
                          <strong className="text-cyan-300">🟢 실시간 레이더 감시 중</strong>
                        </>
                      )}
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

      {/* 4. 슬롯별 통계 상세 팝업 모달 (createPortal로 document.body에 직접 마운트하여 화면 정중앙 고정) */}
      {isStatsModalOpen && selectedStatsSlot && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsStatsModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{selectedStatsSlot.slotId}번 슬롯 누적 매매 통계</span>
                    <span className="text-xs text-slate-400 font-normal">({selectedStatsSlot.slotName || `${selectedStatsSlot.slotId}번 슬롯`})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-normal">실시간 자동매매 실적 및 승률 리포트</span>
                </div>
              </div>
              <button 
                onClick={() => setIsStatsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 주요 지표 3단 그리드 */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">총 거래 횟수</span>
                <span className="text-base font-black font-mono text-white">
                  {selectedStatsSlot.totalTrades || 0}회
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">승률</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {selectedStatsSlot.totalTrades > 0 
                    ? `${Math.round(((selectedStatsSlot.winTrades || 0) / selectedStatsSlot.totalTrades) * 100)}%` 
                    : '-'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">실현 손익 합계</span>
                <span className={`text-base font-black font-mono ${
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

            {/* 세부 설정 정보 요약 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex justify-between items-center">
                <span>현재 대상 코인:</span>
                <strong className="text-white font-bold">{formatMarketName(selectedStatsSlot.targetMarket)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>1회 매수금액:</span>
                <strong className="text-amber-300 font-bold">{Math.round(selectedStatsSlot.tradeAmountKrw).toLocaleString()} KRW</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>운용 전략:</span>
                <strong className="text-emerald-400 font-bold">{selectedStatsSlot.strategyType === 'SELF' ? '셀프 맞춤 전략' : '운영자 추천전략'}</strong>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/80 text-[11px]">
                <span>현재 포지션 상태:</span>
                <span className={`font-bold ${selectedStatsSlot.positionStatus === 'IN_POSITION' ? 'text-amber-400' : 'text-slate-400'}`}>
                  {selectedStatsSlot.positionStatus === 'IN_POSITION' ? '● 포지션 보유 중 (감시/트레일링)' : '○ 진입 대기 (IDLE)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`${selectedStatsSlot.slotId}번 슬롯의 누적 통계를 초기화하시겠습니까?`)) {
                    if (onResetSlotStats) {
                      await onResetSlotStats(selectedStatsSlot.slotId);
                    }
                    setIsStatsModalOpen(false);
                  }
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition cursor-pointer"
              >
                통계 초기화
              </button>
              <button
                type="button"
                onClick={() => setIsStatsModalOpen(false)}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition cursor-pointer shadow-md"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 📥 업비트 계정 보유 코인 슬롯 가져오기 모달 */}
      <ImportCoinModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        slot={selectedImportSlot}
        slots={slots}
        accounts={accounts}
        livePriceMap={livePriceMap}
        onImportCoin={onImportCoin}
        userId={currentUser?.id || 1}
      />
    </div>
  );
}
