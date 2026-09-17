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
import { formatCoinWithKo, getCoinNameKo } from '../services/coinNames';

const DEFAULT_SLOTS = [
  // 1~8번: 초단타 스캘핑 (모드 A)
  { id: 1, slotId: 1, slotName: '1번 주력 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-BTC', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 2, slotId: 2, slotName: '2번 알트 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-ETH', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 3, slotId: 3, slotName: '3번 급등 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-SOL', tradeAmountKrw: 30000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 4, slotId: 4, slotName: '4번 리플 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-XRP', tradeAmountKrw: 30000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 5, slotId: 5, slotName: '5번 보조 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-DOGE', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 6, slotId: 6, slotName: '6번 보조 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-ADA', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 7, slotId: 7, slotName: '7번 보조 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-AVAX', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 8, slotId: 8, slotName: '8번 보조 슬롯', strategyMode: 'SCALPING', isEnabled: true, targetMarket: 'KRW-DOT', tradeAmountKrw: 20000, strategyType: 'RECOMMENDED', surgeWindowSeconds: 5, surgeRatePct: 1.5, surgeMinVolumeKrw: 10000000, useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },

  // 9~10번: 당일 신고가 돌파 (모드 B)
  { id: 9, slotId: 9, slotName: '9번 돌파 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutHighEnabled: true, breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 5, isEnabled: true, targetMarket: 'KRW-NEAR', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },
  { id: 10, slotId: 10, slotName: '10번 돌파 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutHighEnabled: true, breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 5, isEnabled: true, targetMarket: 'KRW-SUI', tradeAmountKrw: 50000, strategyType: 'RECOMMENDED', useWideTrailing: true, trailingTier1TargetProfitPct: 3.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 10.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, positionStatus: 'IDLE' },

  // 11~12번: 정배열 추세 스윙 (모드 C)
  { id: 11, slotId: 11, slotName: '11번 스윙 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 100, isEnabled: true, targetMarket: 'KRW-BTC', tradeAmountKrw: 100000, strategyType: 'RECOMMENDED', useWideTrailing: true, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 12.0, trailingTier2CallbackPct: 3.5, stopLossPct: 3.0, positionStatus: 'IDLE' },
  { id: 12, slotId: 12, slotName: '12번 스윙 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 100, isEnabled: true, targetMarket: 'KRW-ETH', tradeAmountKrw: 100000, strategyType: 'RECOMMENDED', useWideTrailing: true, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 12.0, trailingTier2CallbackPct: 3.5, stopLossPct: 3.0, positionStatus: 'IDLE' },
];

const formatPrice = (p) => {
  if (!p || p <= 0) return '0원';
  const num = Number(p);
  if (num < 1) return `${num.toFixed(4)}원`;
  if (num < 10) return `${num.toFixed(2)}원`;
  if (num < 100) return `${num.toFixed(1)}원`;
  return `${Math.round(num).toLocaleString()}원`;
};

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
  currentUser = null,
  strategyViewMode = 'RECOMMENDED'
}) {
  const displaySlots = (Array.isArray(slots) && slots.length > 0) ? slots : DEFAULT_SLOTS;

  const [editingSlotId, setEditingSlotId] = useState(null);
  const [activeTabSlotId, setActiveTabSlotId] = useState(1);
  const [expandedSpecSlots, setExpandedSpecSlots] = useState({});

  const toggleSpecExpand = (slotId) => {
    setExpandedSpecSlots(prev => ({
      ...prev,
      [slotId]: !prev[slotId]
    }));
  };
  const [editForm, setEditForm] = useState({
    tradeAmountKrw: 50000,
    strategyMode: 'SCALPING',
    strategyType: 'RECOMMENDED',
    surgeWindowSeconds: 5,
    surgeRatePct: 1.5,
    surgeMinVolumeKrw: 10000000,
    surgeVolumeMode: 'RATE',
    surgeMinVolumeRatePct: 0.05,
    useReverseAlignmentFilter: true,
    useWhaleTickFilter: true,
    whaleMinAmountKrw: 10000000,
    useOrderbookFilter: true,
    surgeBaseMode: 'VWAP',
    breakoutHighEnabled: true,
    breakoutCandleUnit: 1,
    breakoutMinVolumeKrwEok: 5,
    swingCandleUnit: 'days',
    swingShortMa: 5,
    swingLongMa: 20,
    swingMinTradePrice24hEok: 100,
    useWideTrailing: true,
    trailingTier1TargetProfitPct: 3.0,
    trailingTier1CallbackPct: 0.5,
    trailingTier2HurdlePct: 10.0,
    trailingTier2CallbackPct: 3.0,
    trailingTargetProfitPct: 3.0,
    trailingCallbackPct: 0.5,
    stopLossPct: 2.0,
    useAtrStopLoss: false
  });

  const [selectedStatsSlot, setSelectedStatsSlot] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const [selectedImportSlot, setSelectedImportSlot] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleOpenImport = (e, slot) => {
    e.stopPropagation();
    setSelectedImportSlot(slot);
    setIsImportModalOpen(true);
  };

  // 🎯 1~12번 슬롯 탭 클릭 시 해당 슬롯 카드로 화면 부드럽게 스크롤 이동
  const handleSlotNavClick = (slotId) => {
    if (onSelectSlot) {
      onSelectSlot(slotId);
    }
    setTimeout(() => {
      const cardElement = document.getElementById(`slot-card-${slotId}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleStartEdit = (e, slot) => {
    e.stopPropagation();
    setEditingSlotId(slot.slotId);
    const targetProfit = (slot.trailingTier1TargetProfitPct !== undefined && slot.trailingTier1TargetProfitPct !== null && slot.trailingTier1TargetProfitPct !== '')
      ? slot.trailingTier1TargetProfitPct
      : ((slot.targetProfitPct !== undefined && slot.targetProfitPct !== null && slot.targetProfitPct !== '') 
          ? slot.targetProfitPct 
          : (slot.trailingTargetProfitPct !== undefined && slot.trailingTargetProfitPct !== null && slot.trailingTargetProfitPct !== '' ? slot.trailingTargetProfitPct : 3.0));

    const callback = (slot.trailingTier1CallbackPct !== undefined && slot.trailingTier1CallbackPct !== null && slot.trailingTier1CallbackPct !== '')
      ? slot.trailingTier1CallbackPct
      : ((slot.trailingCallbackPct !== undefined && slot.trailingCallbackPct !== null && slot.trailingCallbackPct !== '') ? slot.trailingCallbackPct : 0.5);

    const stopLoss = (slot.stopLossPct !== undefined && slot.stopLossPct !== null && slot.stopLossPct !== '') ? slot.stopLossPct : 2.0;

    const inferredMode = slot.strategyMode || (slot.slotId >= 11 ? 'TREND_SWING' : (slot.slotId >= 9 ? 'BREAKOUT_DAY_HIGH' : 'SCALPING'));

    setEditForm({
      tradeAmountKrw: slot.tradeAmountKrw !== undefined ? slot.tradeAmountKrw : 50000,
      targetMarket: slot.targetMarket || '',
      strategyMode: inferredMode,
      strategyType: slot.strategyType || 'RECOMMENDED',
      surgeWindowSeconds: slot.surgeWindowSeconds !== undefined ? slot.surgeWindowSeconds : 5,
      surgeRatePct: slot.surgeRatePct !== undefined ? slot.surgeRatePct : 1.5,
      surgeMinVolumeKrw: slot.surgeMinVolumeKrw !== undefined ? slot.surgeMinVolumeKrw : 10000000,
      surgeVolumeMode: slot.surgeVolumeMode || 'RATE',
      surgeMinVolumeRatePct: slot.surgeMinVolumeRatePct !== undefined ? slot.surgeMinVolumeRatePct : 0.05,
      useReverseAlignmentFilter: slot.useReverseAlignmentFilter !== undefined ? Boolean(slot.useReverseAlignmentFilter) : true,
      useWhaleTickFilter: slot.useWhaleTickFilter !== undefined ? Boolean(slot.useWhaleTickFilter) : true,
      whaleMinAmountKrw: slot.whaleMinAmountKrw !== undefined ? slot.whaleMinAmountKrw : 10000000,
      useOrderbookFilter: slot.useOrderbookFilter !== undefined ? Boolean(slot.useOrderbookFilter) : true,
      surgeBaseMode: slot.surgeBaseMode || 'VWAP',
      breakoutHighEnabled: slot.breakoutHighEnabled !== undefined ? Boolean(slot.breakoutHighEnabled) : true,
      breakoutCandleUnit: slot.breakoutCandleUnit || 1,
      breakoutMinVolumeKrwEok: slot.breakoutMinVolumeKrwEok !== undefined ? slot.breakoutMinVolumeKrwEok : 5,
      swingCandleUnit: slot.swingCandleUnit || 'days',
      swingShortMa: slot.swingShortMa || 5,
      swingLongMa: slot.swingLongMa || 20,
      swingMinTradePrice24hEok: slot.swingMinTradePrice24hEok !== undefined ? slot.swingMinTradePrice24hEok : (slot.min24hAccTradePriceKrw ? Math.round(Number(slot.min24hAccTradePriceKrw) / 100000000) : 100),
      useWideTrailing: slot.useWideTrailing !== undefined ? Boolean(slot.useWideTrailing) : true,
      trailingTier1TargetProfitPct: targetProfit,
      trailingTier1CallbackPct: callback,
      trailingTier2HurdlePct: slot.trailingTier2HurdlePct !== undefined ? slot.trailingTier2HurdlePct : 10.0,
      trailingTier2CallbackPct: slot.trailingTier2CallbackPct !== undefined ? slot.trailingTier2CallbackPct : 3.0,
      targetProfitPct: targetProfit,
      trailingTargetProfitPct: targetProfit,
      trailingCallbackPct: callback,
      stopLossPct: stopLoss,
      useAtrStopLoss: Boolean(slot.useAtrStopLoss)
    });
  };

  const handleSaveEdit = (slotId) => {
    if (editForm.tradeAmountKrw > 0 && editForm.tradeAmountKrw < 5000) {
      alert('업비트 원화 마켓의 최소 주문 가능 금액은 5,000원입니다.\n매수금액을 5,000원 이상으로 설정해 주세요!');
      return;
    }

    if (onUpdateSlot) {
      const targetProfit = (editForm.targetProfitPct !== undefined && editForm.targetProfitPct !== '')
        ? Number(editForm.targetProfitPct)
        : ((editForm.trailingTier1TargetProfitPct !== undefined && editForm.trailingTier1TargetProfitPct !== '') 
            ? Number(editForm.trailingTier1TargetProfitPct) 
            : 3.0);

      const stopLoss = (editForm.stopLossPct !== undefined && editForm.stopLossPct !== '')
        ? parseFloat(editForm.stopLossPct)
        : 2.0;

      const currentSlot = slots.find(s => (s.id === slotId || s.slotId === slotId));
      const swingEok = Number(editForm.swingMinTradePrice24hEok) > 0 ? Number(editForm.swingMinTradePrice24hEok) : 100;

      onUpdateSlot(slotId, {
        isEnabled: currentSlot ? currentSlot.isEnabled : true,
        tradeAmountKrw: editForm.tradeAmountKrw,
        targetMarket: editForm.targetMarket !== undefined ? editForm.targetMarket : (currentSlot?.targetMarket || 'KRW-BTC'),
        strategyMode: editForm.strategyMode,
        strategyType: editForm.strategyType,
        surgeWindowSeconds: editForm.surgeWindowSeconds,
        surgeRatePct: editForm.surgeRatePct,
        surgeMinVolumeKrw: editForm.surgeMinVolumeKrw,
        surgeVolumeMode: editForm.surgeVolumeMode || 'RATE',
        surgeMinVolumeRatePct: parseFloat(editForm.surgeMinVolumeRatePct) || 0.05,
        useReverseAlignmentFilter: Boolean(editForm.useReverseAlignmentFilter),
        useWhaleTickFilter: Boolean(editForm.useWhaleTickFilter),
        whaleMinAmountKrw: parseFloat(editForm.whaleMinAmountKrw) || 10000000,
        useOrderbookFilter: Boolean(editForm.useOrderbookFilter),
        surgeBaseMode: editForm.surgeBaseMode || 'VWAP',
        breakoutHighEnabled: Boolean(editForm.breakoutHighEnabled),
        breakoutCandleUnit: Number(editForm.breakoutCandleUnit) || 1,
        breakoutMinVolumeKrwEok: Number(editForm.breakoutMinVolumeKrwEok) || 5,
        swingCandleUnit: editForm.swingCandleUnit || 'days',
        swingShortMa: Number(editForm.swingShortMa) || 5,
        swingLongMa: Number(editForm.swingLongMa) || 20,
        swingMinTradePrice24hEok: swingEok,
        min24hAccTradePriceKrw: swingEok * 100000000,
        useWideTrailing: Boolean(editForm.useWideTrailing),
        trailingTier1TargetProfitPct: targetProfit,
        trailingTier1CallbackPct: parseFloat(editForm.trailingTier1CallbackPct) || 0.5,
        trailingTier2HurdlePct: parseFloat(editForm.trailingTier2HurdlePct) || 10.0,
        trailingTier2CallbackPct: parseFloat(editForm.trailingTier2CallbackPct) || 3.0,
        targetProfitPct: targetProfit,
        trailingTargetProfitPct: targetProfit,
        trailingCallbackPct: parseFloat(editForm.trailingTier1CallbackPct) || 0.5,
        stopLossPct: stopLoss,
        useAtrStopLoss: Boolean(editForm.useAtrStopLoss)
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
    <div className="space-y-4 max-w-full min-w-0">
      {/* 1. 상단 슬롯 헤더 & 1~12번 슬롯 탭 네비게이션 통합 바 (1줄 콤팩트 디자인) */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border shadow-xl backdrop-blur-md max-w-full min-w-0 transition-all ${
        strategyViewMode === 'RECOMMENDED' 
          ? 'border-emerald-500/30 shadow-emerald-950/20' 
          : 'border-indigo-500/35 shadow-indigo-950/30'
      }`}>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`p-1.5 sm:p-2 rounded-xl border ${
            strategyViewMode === 'RECOMMENDED'
              ? 'bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-indigo-500/20 border-indigo-500/40 text-indigo-400'
          }`}>
            <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-100 text-xs sm:text-sm tracking-tight whitespace-nowrap">
              {strategyViewMode === 'RECOMMENDED' ? '🌿 누리오 AI 추천전략 멀티 슬롯' : '⚡ 멀티 슬롯 커스텀 전략'}
            </h3>
            <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold border whitespace-nowrap ${
              strategyViewMode === 'RECOMMENDED'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
            }`}>
              {displaySlots.filter(s => s.isEnabled).length}/{displaySlots.length} 가동
            </span>
          </div>
        </div>

        {/* 2. 1~12번 슬롯 탭 버튼 바 (모바일: 슬롯번호만 2줄 그리드 표시, 가로 슬라이딩 제거 / 데스크탑: 1줄 상세 표시) */}
        {displaySlots.length > 1 && (
          <div className={`grid ${displaySlots.length <= 4 ? 'grid-cols-4' : (displaySlots.length <= 8 ? 'grid-cols-4' : 'grid-cols-6')} sm:flex sm:items-center sm:flex-wrap lg:flex-nowrap gap-1 sm:gap-1.5 w-full lg:w-auto`}>
            {displaySlots.map((slot) => {
              const isSelected = (selectedSlotId === slot.slotId);
              const hasPosition = (slot.positionStatus === 'IN_POSITION' || slot.positionStatus === 'HOLDING' || slot.positionStatus === 'TRAILING_ACTIVE') || Boolean(slot.entryPrice && slot.entryPrice > 0);
              const isBreakout = slot.strategyMode === 'BREAKOUT_DAY_HIGH';
              const isSwing = slot.strategyMode === 'TREND_SWING';

              const tabColorClass = isSelected
                ? (strategyViewMode === 'RECOMMENDED'
                    ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow-md shadow-emerald-500/30 scale-105 ring-1 ring-emerald-300 relative z-10'
                    : isSwing 
                    ? 'bg-sky-400 text-black border-sky-300 font-black shadow-md shadow-sky-500/30 scale-105 ring-1 ring-sky-300 relative z-10' 
                    : isBreakout 
                    ? 'bg-amber-400 text-black border-amber-300 font-black shadow-md shadow-amber-500/30 scale-105 ring-1 ring-amber-300 relative z-10' 
                    : 'bg-indigo-500 text-white border-indigo-400 font-black shadow-md shadow-indigo-500/30 scale-105 ring-1 ring-indigo-300 relative z-10')
                : !slot.isEnabled
                  ? 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-400'
                  : hasPosition
                  ? 'bg-slate-800/90 text-rose-300 border-rose-500/40 hover:bg-slate-800 shadow-sm shadow-rose-950/50'
                  : strategyViewMode === 'RECOMMENDED'
                  ? 'bg-slate-950/90 text-emerald-400 border-emerald-500/30 hover:text-white hover:bg-emerald-950/50 hover:border-emerald-400'
                  : isSwing
                  ? 'bg-slate-950/90 text-sky-400 border-sky-500/30 hover:text-white hover:bg-sky-950/50 hover:border-sky-400'
                  : isBreakout
                  ? 'bg-slate-950/90 text-amber-400 border-amber-500/30 hover:text-white hover:bg-amber-950/50 hover:border-amber-400'
                  : 'bg-slate-950/90 text-indigo-400 border-indigo-500/30 hover:text-white hover:bg-indigo-950/50 hover:border-indigo-400';

              return (
                <button
                  key={slot.slotId}
                  onClick={() => handleSlotNavClick(slot.slotId)}
                  className={`flex items-center justify-center gap-1 px-1 sm:px-2.5 py-1.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold w-full sm:w-auto transition-all border cursor-pointer whitespace-nowrap active:scale-95 ${tabColorClass}`}
                  title={`${slot.slotId}번 슬롯으로 화면 이동`}
                >
                  {/* 모바일: 슬롯번호만 표시 (예: 1번, 2번...) */}
                  <span>{slot.slotId}번</span>

                  {/* 데스크탑(sm 이상): 코인명/전략 모드 상세 텍스트 */}
                  <span className="hidden sm:inline font-normal truncate max-w-[48px] sm:max-w-[60px]">
                    {!slot.isEnabled ? '정지' : (hasPosition && slot.targetMarket ? slot.targetMarket.replace('KRW-', '') : (strategyViewMode === 'RECOMMENDED' ? '추천' : (isSwing ? '스윙' : (isBreakout ? '돌파' : '스캘핑'))))}
                  </span>

                  {/* 상태 아이콘: 모바일에서는 포지션 보유 시 펄스 점만 표시, 데스크탑에서는 풀 아이콘 표시 */}
                  {!slot.isEnabled ? (
                    <span className="hidden sm:inline text-[9px] text-slate-500 font-mono">⏸️</span>
                  ) : hasPosition ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0"></span>
                  ) : strategyViewMode === 'RECOMMENDED' ? (
                    <span className="hidden sm:inline text-[9px] text-emerald-400" title="누리오 AI 추천">🌿</span>
                  ) : isSwing ? (
                    <span className="hidden sm:inline text-[9px] text-sky-400" title="정배열 추세 스윙">🌊</span>
                  ) : isBreakout ? (
                    <span className="hidden sm:inline text-[9px] text-amber-400" title="당일 신고가 돌파">🚀</span>
                  ) : (
                    <span className="hidden sm:inline text-[9px] text-indigo-400" title="초단타 스캘핑">⚡</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. 슬롯 카드 그리드 (PC 와이드 4열 x 3행: 1,2,3,4 / 5,6,7,8 / 9,10,11,12 완벽 배치) */}
      <div className={displaySlots.length === 1 ? "flex justify-center py-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5"}>
        {displaySlots.map((slot) => {
          const isSelected = (selectedSlotId === slot.slotId);
          const isEditing = (editingSlotId === slot.slotId);
          const rawSymbol = (slot.targetMarket || '').replace('KRW-', '');
          const matchedAcc = Array.isArray(accounts) 
            ? accounts.find(a => a.currency === rawSymbol || `KRW-${a.currency}` === slot.targetMarket)
            : null;
          const isDbInPosition = (slot.positionStatus === 'IN_POSITION' || slot.positionStatus === 'HOLDING' || slot.positionStatus === 'TRAILING_ACTIVE');
          // 🛡️ [버그 완벽 차단] 실제 슬롯 상태가 IN_POSITION일 때만 포지션 보유로 판정! IDLE 슬롯이 계좌 잔고를 가상으로 중복 가로채는 현상 원천 방지
          const hasPosition = isDbInPosition && (Boolean(slot.entryPrice && slot.entryPrice > 0) || Boolean(matchedAcc && parseFloat(matchedAcc.balance || 0) > 0.0000001));
          
          // ⚡ 각 슬롯별 독립적인 카운트다운 상태 매핑
          const slotCountdown = (pendingSurgeCountdowns && pendingSurgeCountdowns[slot.slotId]) || 
            (pendingSurgeCountdown && pendingSurgeCountdown.slotId === slot.slotId ? pendingSurgeCountdown : null);
          const isSurgeCounting = Boolean(slotCountdown);

          const liveAvgBuyPrice = matchedAcc && parseFloat(matchedAcc.avg_buy_price) > 0 
            ? parseFloat(matchedAcc.avg_buy_price) 
            : null;
          const effectiveEntryPrice = liveAvgBuyPrice || slot.entryPrice || 0;
          const targetMkt = slot.targetMarket || '';
          const cleanSym = targetMkt.replace('KRW-', '').toUpperCase();
          const marketData = (livePriceMap && typeof livePriceMap === 'object')
            ? (livePriceMap[targetMkt] || livePriceMap[`KRW-${cleanSym}`] || livePriceMap[cleanSym] || livePriceMap[targetMkt.toLowerCase()] || livePriceMap[cleanSym.toLowerCase()])
            : null;
          const hasLivePrice = Boolean(marketData?.trade_price && marketData.trade_price > 0);
          const currentPrice = hasLivePrice ? marketData.trade_price : (effectiveEntryPrice || 0);
          const profitPct = (effectiveEntryPrice > 0 && hasLivePrice) 
            ? (((currentPrice - effectiveEntryPrice) / effectiveEntryPrice) * 100)
            : (slot.highestProfitPct || 0);
          const isProfit = profitPct >= 0;

          // 잔고 초과 여부 확인 (이미 코인을 보유 중인 슬롯이나 0원일 때는 경고 미표시)
          const isOverBalance = !hasPosition && slot.isEnabled && (slot.tradeAmountKrw > 0 && slot.tradeAmountKrw > krwBalance);
          const isZeroAmount = (!slot.tradeAmountKrw || slot.tradeAmountKrw === 0);

          const isPendingApproval = (currentUser?.role !== 'DEVELOPER' && currentUser?.role !== 'OPERATOR' && currentUser?.approvalStatus === 'PENDING');
          const isSelfStrategy = (slot.strategyType === 'SELF');
          const isBreakout = (slot.strategyMode === 'BREAKOUT_DAY_HIGH');
          const isSwing = (slot.strategyMode === 'TREND_SWING');

          return (
            <div
              key={slot.slotId}
              id={`slot-card-${slot.slotId}`}
              onClick={() => handleSlotNavClick(slot.slotId)}
              className={`rounded-2xl p-3.5 sm:p-4 pt-4 sm:pt-4.5 border transition-all duration-300 scroll-mt-24 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[300px] select-none max-w-full min-w-0 ${
                displaySlots.length === 1 ? 'max-w-xl w-full ' : ''
              }${
                !slot.isEnabled
                  ? (isSelected ? 'bg-slate-950 border-slate-700 ring-2 ring-slate-500 shadow-xl' : 'bg-slate-950/90 border-slate-800/80 opacity-60 grayscale-[25%]')
                  : isSurgeCounting
                  ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400 shadow-2xl shadow-amber-500/30 animate-pulse'
                  : strategyViewMode === 'RECOMMENDED'
                  ? (isSelected
                      ? 'bg-gradient-to-b from-emerald-950/60 via-slate-900/95 to-slate-950 border-emerald-400 shadow-2xl shadow-emerald-500/30 ring-2 ring-emerald-400/80 scale-[1.01]'
                      : 'bg-gradient-to-b from-emerald-950/25 via-slate-900/90 to-slate-950 border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/15')
                  : isSwing
                  ? (isSelected
                      ? 'bg-gradient-to-b from-sky-950/60 via-slate-900/95 to-slate-950 border-sky-400 ring-2 ring-sky-400/80 shadow-2xl shadow-sky-500/30 scale-[1.01]'
                      : 'bg-gradient-to-b from-sky-950/30 via-slate-900/90 to-slate-950 border-sky-500/50 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/20')
                  : isBreakout
                  ? (isSelected
                      ? 'bg-gradient-to-b from-amber-950/60 via-slate-900/95 to-slate-950 border-amber-400 ring-2 ring-amber-400/80 shadow-2xl shadow-amber-500/30 scale-[1.01]'
                      : 'bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20')
                  : (isSelected
                      ? 'bg-gradient-to-b from-indigo-950/60 via-slate-900/95 to-slate-950 border-indigo-400 shadow-2xl shadow-indigo-500/30 ring-2 ring-indigo-400 scale-[1.01]'
                      : 'bg-gradient-to-b from-indigo-950/30 via-slate-900/90 to-slate-950 border-indigo-500/60 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/15')
              }`}
            >
              {/* 🌟 전략 모드별 상단 컬러 악센트 라인 (카드 상단 가로 줄) */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 sm:h-2 shrink-0 ${
                !slot.isEnabled
                  ? 'bg-slate-700'
                  : strategyViewMode === 'RECOMMENDED'
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500 shadow-md shadow-emerald-500/50'
                  : isSwing
                  ? 'bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-500 shadow-md shadow-sky-500/50'
                  : isBreakout
                  ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 shadow-md shadow-amber-500/50'
                  : 'bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-500 shadow-md shadow-indigo-500/50'
              }`} />

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

              {/* 1. 상단 슬롯 헤더 (| 1번 슬롯 | 전략모드 |    | [Power] ON | [통계] | [수정] |) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* 슬롯 번호 버튼형 뱃지 */}
                  <div className={`px-3 py-1 rounded-xl text-sm sm:text-base font-black flex items-center justify-center border shadow-sm shrink-0 whitespace-nowrap ${
                    !slot.isEnabled
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : strategyViewMode === 'RECOMMENDED'
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-emerald-500/20'
                      : isSwing
                      ? 'bg-sky-500/25 text-sky-300 border-sky-400/60 shadow-sky-500/20'
                      : isBreakout
                      ? 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-amber-500/20'
                      : 'bg-indigo-500/25 text-indigo-200 border-indigo-400/60 shadow-indigo-500/20'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {hasPosition && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />}
                      <span>{slot.slotId}번 슬롯</span>
                    </span>
                  </div>

                  {/* 전략 모드 뱃지 (스캘핑 / 신고가 돌파 / 추세 스윙 / 추천) */}
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-black tracking-tight border shadow-sm shrink-0 whitespace-nowrap ${
                    !slot.isEnabled
                      ? 'bg-slate-900 text-slate-500 border-slate-800'
                      : strategyViewMode === 'RECOMMENDED'
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50 shadow-sm shadow-emerald-500/20'
                      : isSwing
                      ? 'bg-sky-500/20 text-sky-200 border-sky-400/50 shadow-sm shadow-sky-500/20'
                      : isBreakout
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 shadow-sm shadow-amber-500/20'
                      : 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50 shadow-sm shadow-indigo-500/20'
                  }`}>
                    {strategyViewMode === 'RECOMMENDED'
                      ? '🌿 AI 추천'
                      : (isSwing ? '🌊 모드 C (스윙)' : (isBreakout ? '🚀 모드 B (돌파)' : '⚡ 모드 A (스캘핑)'))}
                  </span>

                  {/* 🚀 와이드 트레일링 2단계 대시세 진입 뱃지 */}
                  {hasPosition && slot.trailingStage === 2 && (
                    <span className="text-xs px-2.5 py-1 rounded-lg font-black tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400 shadow-md shadow-purple-500/30 animate-pulse whitespace-nowrap">
                      🚀 와이드 2단계
                    </span>
                  )}
                </div>

                {/* 우측 액션 메뉴: | [Power] ON | [통계 아이콘] | [수정 아이콘] | */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* ⚡ ON / OFF 스위치 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpdateSlot) {
                        const currentEnabled = slot.isEnabled === true || slot.isEnabled === 1 || slot.isEnabled === '1';
                        const nextEnabled = !currentEnabled;
                        onUpdateSlot(slot.slotId, {
                          ...slot,
                          isEnabled: nextEnabled
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-black flex items-center gap-1.5 border transition shadow-sm cursor-pointer whitespace-nowrap ${
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

              {/* 2. 중앙 콘텐츠 영역 (정사각형 밸런스 + 전략 스펙 미니 표 탑재) */}
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
                <div className="flex-1 flex flex-col justify-center my-1.5 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                  {strategyViewMode === 'RECOMMENDED' ? (
                    /* 🌿 [추천전략 모드] 슬롯 수정창: 핵심 4가지 설정(매수금액, 목표익절, 원금손절, 대상코인)만 심플하게 제공 */
                    <div className="space-y-2.5">
                      {/* 헤더 배지 */}
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌿</span>
                          <div>
                            <span className="text-xs font-black text-emerald-300 block">{slot.slotId}번 슬롯 AI 추천전략 설정</span>
                            <span className="text-[10px] text-slate-300 font-medium">
                              {editForm.targetMarket ? formatMarketName(editForm.targetMarket) : '⚡ 전종목 AI 실시간 급등 포착'}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                          자동 최적화
                        </span>
                      </div>

                      {/* 💰 1. 1회 매수금액 (KRW) */}
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-200 font-bold flex items-center gap-1">
                            <span>💰 1회 매수금액</span>
                            <span className="text-[10px] text-slate-400 font-normal">(주문 1회당 투입금)</span>
                          </label>
                          <span className="text-[11px] text-slate-400 font-mono">
                            가능: <strong className="text-emerald-400">{Math.round(krwBalance).toLocaleString()}</strong>원
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editForm.tradeAmountKrw !== undefined ? editForm.tradeAmountKrw : 50000}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setEditForm(prev => ({ ...prev, tradeAmountKrw: val === '' ? '' : Number(val) }));
                            }}
                            placeholder="50000"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right text-emerald-300 font-mono text-sm font-bold focus:outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, tradeAmountKrw: Math.max(0, Math.floor(krwBalance)) }))}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 cursor-pointer active:scale-95 transition-all"
                          >
                            최대
                          </button>
                        </div>
                        {editForm.tradeAmountKrw > 0 && editForm.tradeAmountKrw < 5000 && (
                          <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 pt-0.5">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>업비트 최소 주문금액은 5,000원 이상이어야 합니다.</span>
                          </p>
                        )}
                      </div>

                      {/* 🎯 2. 목표 익절선 (+%) + 원클릭 프리셋 */}
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30 space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-200 font-bold flex items-center gap-1">
                            <span>🎯 목표 익절선 (+%)</span>
                            <span className="text-[10px] text-slate-400 font-normal">(다단 트레일링 자동 익절)</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-rose-400">+</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.targetProfitPct !== undefined ? editForm.targetProfitPct : 3.0}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ 
                                  ...prev, 
                                  targetProfitPct: val, 
                                  trailingTier1TargetProfitPct: val 
                                }));
                              }}
                              className="w-14 bg-slate-900 border border-rose-500/40 rounded-lg py-1 text-center font-mono text-xs font-bold text-rose-400 focus:border-rose-400 focus:outline-none"
                            />
                            <span className="text-xs font-bold text-rose-400">%</span>
                          </div>
                        </div>
                        {/* 원클릭 익절 프리셋 버튼 */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, targetProfitPct: 3.0, trailingTier1TargetProfitPct: 3.0 }))}
                            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              Number(editForm.targetProfitPct) === 3.0
                                ? 'bg-rose-500/30 text-rose-300 border-rose-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            안정형 (+3%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, targetProfitPct: 5.0, trailingTier1TargetProfitPct: 5.0 }))}
                            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              Number(editForm.targetProfitPct) === 5.0
                                ? 'bg-rose-500/30 text-rose-300 border-rose-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            수익형 (+5%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, targetProfitPct: 10.0, trailingTier1TargetProfitPct: 10.0 }))}
                            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              Number(editForm.targetProfitPct) === 10.0
                                ? 'bg-rose-500/30 text-rose-300 border-rose-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            대시세 (+10%)
                          </button>
                        </div>
                      </div>

                      {/* 🛡️ 3. 원금 손절선 (-%) + 원클릭 프리셋 */}
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30 space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-200 font-bold flex items-center gap-1">
                            <span>🛡️ 원금 손절선 (-%)</span>
                            <span className="text-[10px] text-slate-400 font-normal">(시장가 원금 방어)</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-blue-400">-</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.stopLossPct !== undefined ? editForm.stopLossPct : 2.0}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, stopLossPct: val }));
                              }}
                              className="w-14 bg-slate-900 border border-blue-500/40 rounded-lg py-1 text-center font-mono text-xs font-bold text-blue-400 focus:border-blue-400 focus:outline-none"
                            />
                            <span className="text-xs font-bold text-blue-400">%</span>
                          </div>
                        </div>
                        {/* 원클릭 손절 프리셋 버튼 */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, stopLossPct: 1.5 }))}
                            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              Number(editForm.stopLossPct) === 1.5
                                ? 'bg-blue-500/30 text-blue-300 border-blue-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            타이트 (-1.5%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, stopLossPct: 2.0 }))}
                            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              Number(editForm.stopLossPct) === 2.0
                                ? 'bg-blue-500/30 text-blue-300 border-blue-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            표준 (-2.0%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, stopLossPct: 3.0 }))}
                            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              Number(editForm.stopLossPct) === 3.0
                                ? 'bg-blue-500/30 text-blue-300 border-blue-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            여유 (-3.0%)
                          </button>
                        </div>
                      </div>

                      {/* 🪙 4. 매매 대상 코인 선택 */}
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-200 font-bold flex items-center gap-1">
                            <span>🪙 매매 대상 코인</span>
                          </label>
                          <span className="text-[10px] text-emerald-400 font-medium">
                            {editForm.targetMarket ? formatMarketName(editForm.targetMarket) : '전종목 실시간 감시'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, targetMarket: '' }))}
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer col-span-3 ${
                              !editForm.targetMarket
                                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            ⚡ 전종목 실시간 급등 자동 포착 (AI 추천)
                          </button>
                          {['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE'].map((mkt) => {
                            const sym = mkt.replace('KRW-', '');
                            const isChosen = (editForm.targetMarket === mkt);
                            return (
                              <button
                                key={mkt}
                                type="button"
                                onClick={() => setEditForm(prev => ({ ...prev, targetMarket: mkt }))}
                                className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                  isChosen
                                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-sm font-black'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                              >
                                {sym}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              const custom = window.prompt('감시할 업비트 원화 마켓 코인 심볼을 입력해 주세요 (예: ADA, AVAX, SUI)', (editForm.targetMarket || '').replace('KRW-', ''));
                              if (custom) {
                                const clean = custom.trim().toUpperCase().replace('KRW-', '');
                                setEditForm(prev => ({ ...prev, targetMarket: `KRW-${clean}` }));
                              }
                            }}
                            className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              editForm.targetMarket && !['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE'].includes(editForm.targetMarket)
                                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-sm font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            직접입력
                          </button>
                        </div>
                      </div>

                      {/* 🛡️ 5. AI 자동 안전 운용 안내 카드 */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <span>🛡️</span>
                          <span>AI 전자동 안전 관리 가동 중</span>
                        </div>
                        <p className="text-slate-400 text-[10px] leading-normal">
                          복잡한 수급 분석, 분봉 거래대금 필터링, 다단 트레일링 스탑은 누리오 AI가 장세에 맞춰 24시간 가장 안전하게 자동 운용합니다.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* ⚡ [셀프전략 모드] 슬롯 수정창: A / B / C 전략 모드 선택 복원 및 전체 파라미터 튜닝 */
                    <>
                      {/* 🎛️ 전략 모드 A/B/C 선택 복원 */}
                      <div className="p-2 rounded-xl bg-indigo-950/50 border border-indigo-500/40 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between text-xs font-bold px-1">
                          <span className="flex items-center gap-1.5 text-indigo-300">
                            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                            <span>전략 모드 선택 (A / B / C)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">
                            {editForm.strategyMode === 'SCALPING' ? '1~8번 권장' : (editForm.strategyMode === 'BREAKOUT_DAY_HIGH' ? '9~10번 권장' : '11~12번 권장')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, strategyMode: 'SCALPING' }))}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                              editForm.strategyMode === 'SCALPING'
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-1">⚡ <span>모드 A</span></span>
                            <span className="text-[10px] font-semibold opacity-90">초단타 스캘핑</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, strategyMode: 'BREAKOUT_DAY_HIGH', breakoutHighEnabled: true }))}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                              editForm.strategyMode === 'BREAKOUT_DAY_HIGH'
                                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-1">🚀 <span>모드 B</span></span>
                            <span className="text-[10px] font-semibold opacity-90">신고가 돌파</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, strategyMode: 'TREND_SWING' }))}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                              editForm.strategyMode === 'TREND_SWING'
                                ? 'bg-sky-500 text-black border-sky-400 shadow-md shadow-sky-500/30 ring-2 ring-sky-400'
                                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-1">🌊 <span>모드 C</span></span>
                            <span className="text-[10px] font-semibold opacity-90">추세 스윙</span>
                          </button>
                        </div>
                      </div>

                  {/* 💰 2. 매수금액(KRW) - 1줄 컴팩트 레이아웃 */}
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

                  {/* ⚡ [모드 A] 초단타 스캘핑 조건창 (기존 v3.2) */}
                  {editForm.strategyMode === 'SCALPING' && (
                    <div className="space-y-2">
                      {/* 💡 기본 추천값 원클릭 채우기 */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/40 border border-purple-500/30">
                        <div className="flex items-center gap-1.5 text-xs text-purple-200 font-bold">
                          <span>💡</span>
                          <span>기본 추천값 불러오기</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm(prev => ({
                              ...prev,
                              surgeWindowSeconds: 5,
                              surgeRatePct: 1.5,
                              surgeMinVolumeKrw: 10000000,
                              surgeMinVolumeManwon: 1000,
                              surgeBaseMode: 'VWAP',
                              useReverseAlignmentFilter: true,
                              useWhaleTickFilter: true
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow transition cursor-pointer active:scale-95"
                          title="5초 +1.5% 1000만원 VWAP 기본 추천값 적용"
                        >
                          황금값 자동 채우기
                        </button>
                      </div>

                      <div className="space-y-2">
                          {/* 1. 자동 매수 조건 */}
                          <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                            <div className="text-xs text-amber-300 flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                ⚡ 1. 초단타 급등 포착
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-center items-center">
                              <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                                <label className="text-[10px] text-slate-300 block mb-0.5">감시 시간(초)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editForm.surgeWindowSeconds}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setEditForm(prev => ({ ...prev, surgeWindowSeconds: val === '' ? '' : Math.max(1, Number(val)) }));
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1 text-center font-mono text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                              <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                                <label className="text-[10px] text-slate-300 block mb-0.5">상승률(+%)</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={editForm.surgeRatePct}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setEditForm(prev => ({ ...prev, surgeRatePct: val }));
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1 text-center font-mono text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                                />
                              </div>
                              <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                                <label className="text-[10px] text-slate-300 block mb-0.5">최소대금(만)</label>
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
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1 text-center font-mono text-xs font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* 돌파 기준가 모드 (단기 평균가 VWAP vs 최저가 MIN) */}
                            <div className="space-y-1 pt-1 border-t border-amber-500/20">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] text-amber-200/80 block font-bold">돌파 기준가 산출 방식</label>
                                <span className="text-[9px] text-slate-400">급등 시작 기준선</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditForm(prev => ({ ...prev, surgeBaseMode: 'VWAP' }))}
                                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                    (editForm.surgeBaseMode || 'VWAP') === 'VWAP'
                                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                                >
                                  <span>📊 단기 평균가 (VWAP)</span>
                                  {(editForm.surgeBaseMode || 'VWAP') === 'VWAP' && (
                                    <Check className="w-3 h-3 text-indigo-400" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditForm(prev => ({ ...prev, surgeBaseMode: 'MIN' }))}
                                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                    editForm.surgeBaseMode === 'MIN'
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                                >
                                  <span>📉 최저가 (MIN)</span>
                                  {editForm.surgeBaseMode === 'MIN' && (
                                    <Check className="w-3 h-3 text-cyan-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 3중 안심 필터 */}
                          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                            <label className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/70 border border-slate-800 cursor-pointer">
                              <span className="text-[11px] font-bold text-slate-300">역배열 하락 추세 차단 (5선 &lt; 20선)</span>
                              <input
                                type="checkbox"
                                checked={editForm.useReverseAlignmentFilter !== false}
                                onChange={(e) => setEditForm(prev => ({ ...prev, useReverseAlignmentFilter: e.target.checked }))}
                                className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-800 border-slate-700"
                              />
                            </label>
                            <label className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/70 border border-slate-800 cursor-pointer">
                              <span className="text-[11px] font-bold text-slate-300">고래 단일 틱(1,000만원+) 검증</span>
                              <input
                                type="checkbox"
                                checked={editForm.useWhaleTickFilter !== false}
                                onChange={(e) => setEditForm(prev => ({ ...prev, useWhaleTickFilter: e.target.checked }))}
                                className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-800 border-slate-700"
                              />
                            </label>
                          </div>
                        </div>
                    </div>
                  )}

                  {/* 🚀 [모드 B] 당일 신고가 돌파 조건창 (9~10번 슬롯용) */}
                  {editForm.strategyMode === 'BREAKOUT_DAY_HIGH' && (
                    <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                      <div className="text-xs text-amber-300 flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          🚀 당일 신고가 돌파 매수 로직 (9~10번 슬롯)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-normal">
                          대장주 돌파
                        </span>
                      </div>

                      {/* 감시 ON/OFF 토글 & 돌파 감시 봉 */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* 당일 최고가 돌파 감시 스위치 */}
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-200 block">신고가 감시</span>
                            <span className="text-[9px] text-slate-400 block">09:00 고가 돌파</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, breakoutHighEnabled: !prev.breakoutHighEnabled }))}
                            className={`px-2 py-0.8 rounded text-[11px] font-black border transition cursor-pointer ${
                              editForm.breakoutHighEnabled !== false
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {editForm.breakoutHighEnabled !== false ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {/* 돌파 감시 봉 (1분봉 / 3분봉) */}
                        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-200 block">수급 기준 봉</span>
                            <span className="text-[9px] text-slate-400 block">거래대금 측정</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, breakoutCandleUnit: 1 }))}
                              className={`px-2 py-0.8 rounded text-[10px] font-bold border transition cursor-pointer ${
                                (editForm.breakoutCandleUnit || 1) === 1
                                  ? 'bg-amber-500 text-black border-amber-400 font-black'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              1분봉
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, breakoutCandleUnit: 3 }))}
                              className={`px-2 py-0.8 rounded text-[10px] font-bold border transition cursor-pointer ${
                                editForm.breakoutCandleUnit === 3
                                  ? 'bg-amber-500 text-black border-amber-400 font-black'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              3분봉
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 순간 최소 거래대금(억) 필터 */}
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-200 block">순간 최소 거래대금</label>
                          <span className="text-[9px] text-slate-400 block">가짜 펌핑 방지 (돌파 봉 거래대금)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editForm.breakoutMinVolumeKrwEok !== undefined ? editForm.breakoutMinVolumeKrwEok : 5}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setEditForm(prev => ({ ...prev, breakoutMinVolumeKrwEok: val === '' ? '' : Number(val) }));
                            }}
                            className="w-16 bg-slate-950 border border-amber-500/50 rounded-lg py-1 px-2 text-right font-mono text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                          />
                          <span className="text-xs font-bold text-amber-400">억원 이상</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-amber-300/80 bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/20 leading-tight">
                        💡 매일 09:00 KST부터의 당일 최고가를 돌파하는 순간, 순간 {editForm.breakoutCandleUnit || 1}분봉 대금이 {editForm.breakoutMinVolumeKrwEok || 5}억원 이상 터질 때만 진짜 상승으로 보고 매수합니다.
                      </p>
                    </div>
                  )}

                  {/* 🌊 [모드 C] 정배열 추세 스윙 조건창 (11~12번 슬롯용) */}
                  {editForm.strategyMode === 'TREND_SWING' && (
                    <div className="p-2.5 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-2.5">
                      <div className="text-xs text-sky-300 flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                          🌊 정배열 추세 스윙 로직 (11~12번 슬롯)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-200 font-normal">
                          중기 추세 매매
                        </span>
                      </div>

                      {/* 기준 봉 선택 (1일봉 / 4시간봉) */}
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-slate-200 block">기준 캔들 봉</span>
                          <span className="text-[9px] text-slate-400 block">이평선 계산 주기</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, swingCandleUnit: 'days' }))}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                              (editForm.swingCandleUnit || 'days') === 'days'
                                ? 'bg-sky-500 text-black border-sky-400 font-black'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            1일봉 (기본)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, swingCandleUnit: 'minutes/240' }))}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                              editForm.swingCandleUnit === 'minutes/240'
                                ? 'bg-sky-500 text-black border-sky-400 font-black'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            4시간봉 (240분)
                          </button>
                        </div>
                      </div>

                      {/* 단기 및 장기 이동평균선(MA) 입력 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                          <label className="text-[10px] text-sky-300 block mb-1 font-bold">단기 이평선 (Short MA)</label>
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editForm.swingShortMa !== undefined ? editForm.swingShortMa : 5}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setEditForm(prev => ({ ...prev, swingShortMa: val === '' ? '' : Number(val) }));
                              }}
                              className="w-14 bg-slate-950 border border-sky-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-sky-300 focus:border-sky-400 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">선</span>
                          </div>
                        </div>

                        <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
                          <label className="text-[10px] text-indigo-300 block mb-1 font-bold">장기 이평선 (Long MA)</label>
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editForm.swingLongMa !== undefined ? editForm.swingLongMa : 20}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setEditForm(prev => ({ ...prev, swingLongMa: val === '' ? '' : Number(val) }));
                              }}
                              className="w-14 bg-slate-950 border border-indigo-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-indigo-300 focus:border-indigo-400 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">선</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-500/20 text-[10px] text-sky-200/90 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>정배열 매수 &amp; 데드크로스 즉시 청산 안전장치</span>
                        </p>
                        <p className="text-slate-400 leading-tight">
                          단기({editForm.swingShortMa || 5})선이 장기({editForm.swingLongMa || 20})선 위에 있는 상승 추세에만 탑승하며, 보유 중 단기선이 장기선을 하향 돌파(데드크로스)하면 즉시 시장가로 전량 청산합니다.
                        </p>
                      </div>

                      {/* 🌊 [C모드 전용 방어막] 24시간 누적 거래대금 필터 (제안서 100% 반영) */}
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-sky-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-sky-200 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-sky-400" />
                            24시간 누적 거래대금 필터
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            거래대금 미달 잡코인 진입 원천 차단 (주도주·대장주 한정)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editForm.swingMinTradePrice24hEok !== undefined ? editForm.swingMinTradePrice24hEok : 100}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setEditForm(prev => ({ ...prev, swingMinTradePrice24hEok: val === '' ? '' : Number(val) }));
                            }}
                            className="w-16 bg-slate-950 border border-sky-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-sky-300 focus:border-sky-400 focus:outline-none"
                            placeholder="100"
                          />
                          <span className="text-xs text-slate-300 font-bold whitespace-nowrap">억 원 이상</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🎯 [공통] 4. 다단(와이드) 트레일링 스탑 & 리스크 제어 (제안 4번) */}
                  <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                    <div className="text-xs text-purple-300 flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                        🎯 다단(와이드) 트레일링 스탑 시스템
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 font-normal">
                        수익 극대화
                      </span>
                    </div>

                    {/* 1단계 (타이트 방어) & 2단계 (대시세 와이드 방어) 그리드 */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 1단계: +10% 미만 잔파도 구간 */}
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 border-b border-slate-800 pb-1">
                          <span>1단계 (잔파도 방어)</span>
                          <span className="text-[9px] text-slate-400">수익 10% 미만</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-center">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">감시익절(+%)</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.trailingTier1TargetProfitPct !== undefined ? editForm.trailingTier1TargetProfitPct : 3.0}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, trailingTier1TargetProfitPct: val }));
                              }}
                              className="w-full bg-slate-950 border border-rose-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-rose-400 focus:border-rose-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">콜백(-%)</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.trailingTier1CallbackPct !== undefined ? editForm.trailingTier1CallbackPct : 0.5}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, trailingTier1CallbackPct: val }));
                              }}
                              className="w-full bg-slate-950 border border-blue-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-blue-400 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2단계: +10% 이상 대시세 와이드 홀딩 */}
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 border-b border-slate-800 pb-1">
                          <span>2단계 (대시세 와이드)</span>
                          <span className="text-[9px] text-amber-400 font-black">대박 코인 홀딩</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-center">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">진입 허들(+%)</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.trailingTier2HurdlePct !== undefined ? editForm.trailingTier2HurdlePct : 10.0}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, trailingTier2HurdlePct: val }));
                              }}
                              className="w-full bg-slate-950 border border-amber-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">와이드 콜백(-%)</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editForm.trailingTier2CallbackPct !== undefined ? editForm.trailingTier2CallbackPct : 3.0}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setEditForm(prev => ({ ...prev, trailingTier2CallbackPct: val }));
                              }}
                              className="w-full bg-slate-950 border border-purple-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-purple-300 focus:border-purple-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 고정 손절선(-%) 인풋 바 */}
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <label className="text-[11px] font-bold text-slate-200 block">원금 손절선 (Stop-Loss)</label>
                        <span className="text-[9px] text-slate-400 block">손실 제한 즉시 시장가 청산</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-blue-400">-</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editForm.stopLossPct !== undefined ? editForm.stopLossPct : 2.0}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setEditForm(prev => ({ ...prev, stopLossPct: val }));
                          }}
                          className="w-16 bg-slate-950 border border-blue-500/50 rounded-lg py-1 text-center font-mono text-xs font-bold text-blue-400 focus:border-blue-400 focus:outline-none"
                        />
                        <span className="text-xs font-bold text-blue-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* ⚙️ [알고리즘 4번] AI 동적 변동성 손절 모드 ON/OFF 토글 카드 */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 shadow-inner">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 whitespace-nowrap">⚙️ AI 동적 변동성 손절 모드</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          editForm.useAtrStopLoss ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {editForm.useAtrStopLoss ? '가동 중' : '고정 손절'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {editForm.useAtrStopLoss 
                          ? '종목별 1분봉 ATR 변동성에 맞춰 손절선(1.2%~4.5%)을 자동 산출합니다.' 
                          : '사용자가 지정한 고정 손절선(-2.0%)으로 엄격하게 청산합니다.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, useAtrStopLoss: !prev.useAtrStopLoss }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editForm.useAtrStopLoss ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                      title="AI 동적 변동성 손절 모드 토글"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editForm.useAtrStopLoss ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
                </div>
              ) : (
                /* 📊 일반 보기 모드 */
                <div className="flex-1 flex flex-col justify-between my-2 space-y-2.5">
                  {/* 상단: 상태 및 주문 금액 / 보유 포지션 요약 */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 items-center">
                    <div>
                      {/* 미보유 상태 시: 매수금액 헤더 */}
                      {!hasPosition ? (
                        <div>
                          <span className="text-xs text-slate-400 font-bold block mb-1">
                            1회 매수금액
                          </span>
                          <span className="text-base sm:text-lg font-black font-mono text-white flex items-center gap-1">
                            {Math.round(slot.tradeAmountKrw || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">원</span>
                            {isZeroAmount && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-300 font-sans font-bold border border-amber-500/20">
                                미설정
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        /* 보유 상태 시: 코인명 + 진입단가 & 수량 */
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/25 text-amber-300 font-black text-xs sm:text-sm font-mono border border-amber-500/40 shadow-sm flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate max-w-[120px] sm:max-w-[140px]">{formatCoinWithKo(slot.targetMarket)}</span>
                            </span>
                          </div>

                          <div className="text-xs font-mono text-slate-300 flex items-center gap-1">
                            <span className="text-slate-400 text-xs">진입:</span>
                            <span className="text-white font-extrabold">{formatPrice(effectiveEntryPrice || currentPrice)}</span>
                          </div>

                          <div className="text-xs font-mono text-slate-400 truncate" title={`수량: ${slot.entryVolume ? slot.entryVolume.toFixed(6) : ''}`}>
                            <span className="text-slate-500">수량:</span> <strong className="text-slate-200">{slot.entryVolume ? slot.entryVolume.toFixed(4) : (slot.entryAmountKrw / currentPrice).toFixed(4)}</strong> {(slot.targetMarket || '').replace('KRW-', '')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex flex-col justify-between py-0.5">
                      <div>
                        <span className="text-xs text-slate-400 font-bold block mb-1">
                          {hasPosition ? '실시간 수익률' : '현재 상태'}
                        </span>
                        <span className={`text-base sm:text-lg font-black font-mono block ${
                          hasPosition 
                            ? (!hasLivePrice ? 'text-slate-400 animate-pulse text-sm' : (isProfit ? 'text-rose-400' : 'text-blue-400'))
                            : 'text-emerald-400/90 text-sm sm:text-base'
                        }`}>
                          {hasPosition 
                            ? (!hasLivePrice ? '⏳ 시세 동기화' : `${isProfit ? '+' : ''}${profitPct.toFixed(2)}%`) 
                            : '🟢 포지션 대기'}
                        </span>
                      </div>
                      {hasPosition ? (
                        <div className="space-y-0.5 mt-1">
                          <div className="text-xs font-mono flex items-center justify-end gap-1">
                            <span className="text-slate-400">현재:</span>
                            <span className="font-extrabold text-amber-300 drop-shadow-sm">
                              {hasLivePrice ? formatPrice(currentPrice) : '...'}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block" title={`최고 기록 수익률: +${Math.max(profitPct, slot.highestProfitPct || 0).toFixed(2)}%`}>
                            최고: <strong className="text-rose-300 font-bold">+{Math.max(profitPct, slot.highestProfitPct || 0).toFixed(2)}%</strong>
                          </span>
                        </div>
                      ) : (
                        <span className={`text-[11px] sm:text-xs font-mono font-bold block mt-1 whitespace-nowrap ${
                          strategyViewMode === 'RECOMMENDED'
                            ? 'text-emerald-400/90'
                            : (isBreakout ? 'text-amber-400/90' : (isSwing ? 'text-sky-400/90' : 'text-emerald-400/90'))
                        }`}>
                          {strategyViewMode === 'RECOMMENDED'
                            ? '🌿 AI 추천 상시 감시'
                            : (isBreakout ? '🚀 모드 B (신고가) 상시 감시' : (isSwing ? '🌊 모드 C (스윙) 상시 감시' : '⚡ 모드 A (스캘핑) 상시 감시'))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 🌿 [추천전략 모드] 깔끔하고 직관적인 AI 추천 운용 요약 카드 */}
                  {strategyViewMode === 'RECOMMENDED' ? (
                    <div className="rounded-xl bg-slate-950/70 border border-emerald-500/30 p-2.5 space-y-2 text-xs font-mono shadow-inner shadow-emerald-950/20">
                      <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20 font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-300 font-sans">
                          <span>🌿</span>
                          <span>누리오 AI 스마트 운용 스펙</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans">
                          24시간 전자동
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                          <span className="text-slate-400 font-sans text-[10px]">목표 익절</span>
                          <span className="font-extrabold text-rose-400 text-xs sm:text-[13px] mt-0.5">
                            +{slot.targetProfitPct || slot.trailingTier1TargetProfitPct || 3.0}%
                            <span className="text-[9px] text-slate-400 font-normal ml-1">(트레일링)</span>
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                          <span className="text-slate-400 font-sans text-[10px]">원금 손절</span>
                          <span className="font-extrabold text-blue-400 text-xs sm:text-[13px] mt-0.5">
                            -{slot.stopLossPct || 2.0}%
                            <span className="text-[9px] text-slate-400 font-normal ml-1">(시장가)</span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-sans text-[10px]">매매 대상</span>
                        <span className="font-bold text-slate-200 text-xs truncate max-w-[170px]">
                          {slot.targetMarket ? formatMarketName(slot.targetMarket) : '⚡ 전종목 실시간 급등 포착'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* 📊 [셀프전략 모드] 전략 파라미터 미니 스펙 표 (PRO 트레이더용) */
                    (() => {
                      const isBreakout = (slot.strategyMode === 'BREAKOUT_DAY_HIGH');
                      const isSwing = (slot.strategyMode === 'TREND_SWING');
                      const isSelf = true;

                      if (isBreakout) {
                      const candleUnit = slot.breakoutCandleUnit || 1;
                      const minVolEok = slot.breakoutMinVolumeKrwEok || 5;
                      const t1Target = slot.trailingTier1TargetProfitPct !== undefined ? slot.trailingTier1TargetProfitPct : 3.0;
                      const t1Cb = slot.trailingTier1CallbackPct !== undefined ? slot.trailingTier1CallbackPct : 0.5;
                      const t2Hurdle = slot.trailingTier2HurdlePct !== undefined ? slot.trailingTier2HurdlePct : 10.0;
                      const t2Cb = slot.trailingTier2CallbackPct !== undefined ? slot.trailingTier2CallbackPct : 3.0;
                      const stopLoss = slot.stopLossPct !== undefined ? slot.stopLossPct : 2.0;

                      return (
                        <div className="rounded-xl bg-slate-950/80 border border-amber-500/40 overflow-hidden text-xs sm:text-[13px] font-mono shadow-inner shadow-amber-950/30">
                          {/* 표 헤더 */}
                          <div className="grid grid-cols-2 bg-slate-900/90 border-b border-amber-500/20 text-xs sm:text-[13px] font-extrabold">
                            <div className="px-2.5 py-1.5 flex items-center justify-between border-r border-slate-800/80 text-amber-300">
                              <span className="flex items-center gap-1">🚀 모드 B (신고가 돌파)</span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between text-orange-300">
                              <span className="flex items-center gap-1">🎯 와이드 트레일링</span>
                            </div>
                          </div>

                          {/* 표 1행: 돌파 기준 vs 1단계 익절 */}
                          <div className="grid grid-cols-2 border-b border-slate-800/50">
                            <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">돌파기준</span>
                              <span className="font-black text-xs sm:text-[13px] text-amber-300">09:00 장중 최고가</span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">1단익절</span>
                              <span className="font-black text-xs sm:text-[13px] text-rose-400">+{t1Target}% (-{t1Cb}%)</span>
                            </div>
                          </div>

                          {/* 표 2행: 순간 수급 vs 2단계 와이드 */}
                          <div className="grid grid-cols-2 border-b border-slate-800/50">
                            <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/20">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">순간수급</span>
                              <span className="font-black text-xs sm:text-[13px] text-amber-200">{candleUnit}분봉 ≥ {minVolEok}억원</span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/20">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">2단와이드</span>
                              <span className="font-black text-xs sm:text-[13px] text-orange-300">+{t2Hurdle}% (-{t2Cb}%)</span>
                            </div>
                          </div>

                          {/* 표 3행: 시간 잠금 vs 손절선 */}
                          <div className="grid grid-cols-2">
                            <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">시간잠금</span>
                              <span className="font-black text-xs sm:text-[13px] text-amber-300">08:50~09:30 락</span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">손실제한</span>
                              <span className="font-black text-xs sm:text-[13px] text-blue-400">-{stopLoss}% 시장가</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isSwing) {
                      const candleUnitLabel = slot.swingCandleUnit === 'days' ? '1일봉 (1D)' : (slot.swingCandleUnit === 'minutes/240' ? '4시간봉 (240m)' : '60분봉');
                      const shortMa = slot.swingShortMa || 5;
                      const longMa = slot.swingLongMa || 20;
                      const t1Target = slot.trailingTier1TargetProfitPct !== undefined ? slot.trailingTier1TargetProfitPct : 5.0;
                      const t1Cb = slot.trailingTier1CallbackPct !== undefined ? slot.trailingTier1CallbackPct : 1.0;
                      const t2Hurdle = slot.trailingTier2HurdlePct !== undefined ? slot.trailingTier2HurdlePct : 12.0;
                      const t2Cb = slot.trailingTier2CallbackPct !== undefined ? slot.trailingTier2CallbackPct : 3.5;
                      const stopLoss = slot.stopLossPct !== undefined ? slot.stopLossPct : 3.0;

                      return (
                        <div className="rounded-xl bg-slate-950/80 border border-sky-500/40 overflow-hidden text-xs sm:text-[13px] font-mono shadow-inner shadow-sky-950/30">
                          {/* 표 헤더 */}
                          <div className="grid grid-cols-2 bg-slate-900/90 border-b border-sky-500/20 text-xs sm:text-[13px] font-extrabold">
                            <div className="px-2.5 py-1.5 flex items-center justify-between border-r border-slate-800/80 text-sky-300">
                              <span className="flex items-center gap-1">🌊 모드 C (추세 스윙)</span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between text-indigo-300">
                              <span className="flex items-center gap-1">🎯 스윙 익절 / 청산</span>
                            </div>
                          </div>

                          {/* 표 1행: 정배열 vs 1단계 익절 */}
                          <div className="grid grid-cols-2 border-b border-slate-800/50">
                            <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">이평선</span>
                              <span className="font-black text-xs sm:text-[13px] text-sky-300">MA{shortMa} &gt; MA{longMa}</span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">1단익절</span>
                              <span className="font-black text-xs sm:text-[13px] text-rose-400">+{t1Target}% (-{t1Cb}%)</span>
                            </div>
                          </div>

                          {/* 표 2행: 기준봉 vs 2단계 와이드 */}
                          <div className="grid grid-cols-2 border-b border-slate-800/50">
                            <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/20">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">기준봉</span>
                              <span className="font-black text-xs sm:text-[13px] text-sky-200">
                                {candleUnitLabel}
                                <span className="text-[10px] text-sky-400 font-normal ml-1">({slot.swingMinTradePrice24hEok || (slot.min24hAccTradePriceKrw ? Math.round(slot.min24hAccTradePriceKrw / 100000000) : 100)}억↑)</span>
                              </span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/20">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">2단와이드</span>
                              <span className="font-black text-xs sm:text-[13px] text-indigo-300">+{t2Hurdle}% (-{t2Cb}%)</span>
                            </div>
                          </div>

                          {/* 표 3행: 안전 청산 vs 손절선 */}
                          <div className="grid grid-cols-2">
                            <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">안전청산</span>
                              <span className="font-black text-xs sm:text-[13px] text-rose-400">데드크로스 즉시</span>
                            </div>
                            <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/40">
                              <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">손실제한</span>
                              <span className="font-black text-xs sm:text-[13px] text-blue-400">-{stopLoss}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Default: Mode A (초단타 스캘핑)
                    const surgeWindow = isSelf ? (slot.surgeWindowSeconds || 5) : 5;
                    const surgeRate = isSelf ? (slot.surgeRatePct !== undefined ? slot.surgeRatePct : 1.5) : 1.5;
                    const minVolKrw = isSelf ? (slot.surgeMinVolumeKrw !== undefined ? slot.surgeMinVolumeKrw : 10000000) : 10000000;
                    const minVolText = minVolKrw >= 100000000 
                      ? `${(minVolKrw / 100000000).toFixed(1)}억원` 
                      : `${Math.round(minVolKrw / 10000).toLocaleString()}만원`;
                    const baseMode = isSelf ? (slot.surgeBaseMode || 'VWAP') : 'VWAP';
                    const targetProfit = isSelf 
                      ? (slot.trailingTier1TargetProfitPct !== undefined ? slot.trailingTier1TargetProfitPct : (slot.targetProfitPct !== undefined ? slot.targetProfitPct : 3.0)) 
                      : 3.0;
                    const callback = isSelf 
                      ? (slot.trailingTier1CallbackPct !== undefined ? slot.trailingTier1CallbackPct : (slot.trailingCallbackPct !== undefined ? slot.trailingCallbackPct : 0.5)) 
                      : 0.5;
                    const stopLoss = isSelf ? (slot.stopLossPct !== undefined ? slot.stopLossPct : 2.0) : 2.0;
                    const hurdle = slot.trailingTier2HurdlePct !== undefined ? slot.trailingTier2HurdlePct : 10.0;
                    const wideCb = slot.trailingTier2CallbackPct !== undefined ? slot.trailingTier2CallbackPct : 3.0;

                    return (
                      <div className="rounded-xl bg-slate-950/80 border border-emerald-500/40 overflow-hidden text-xs sm:text-[13px] font-mono shadow-inner shadow-emerald-950/30">
                        {/* 표 헤더 */}
                        <div className="grid grid-cols-2 bg-slate-900/90 border-b border-emerald-500/20 text-xs sm:text-[13px] font-extrabold">
                          <div className="px-2.5 py-1.5 flex items-center justify-between border-r border-slate-800/80 text-emerald-400">
                            <span className="flex items-center gap-1">⚡ 모드 A (초단타 스캘핑)</span>
                          </div>
                          <div className="px-2.5 py-1.5 flex items-center justify-between text-teal-300">
                            <span className="flex items-center gap-1">🎯 다단 트레일링 익절</span>
                          </div>
                        </div>

                        {/* 표 1행: 감시/상승률 vs 1단계 익절 */}
                        <div className="grid grid-cols-2 border-b border-slate-800/50">
                          <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/40">
                            <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">감시/급등</span>
                            <span className="font-black text-xs sm:text-[13px] text-emerald-300">{surgeWindow}초 / +{surgeRate}%</span>
                          </div>
                          <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/40">
                            <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">1단익절</span>
                            <span className="font-black text-xs sm:text-[13px] text-rose-400">+{targetProfit}% (-{callback}%)</span>
                          </div>
                        </div>

                        {/* 표 2행: 최소수급 vs 2단계 와이드 */}
                        <div className="grid grid-cols-2 border-b border-slate-800/50">
                          <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/20">
                            <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">최소수급</span>
                            <span className="font-black text-xs sm:text-[13px] text-emerald-300">{minVolText}</span>
                          </div>
                          <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/20">
                            <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">2단와이드</span>
                            <span className="font-black text-xs sm:text-[13px] text-purple-300">+{hurdle}% (-{wideCb}%)</span>
                          </div>
                        </div>

                        {/* 표 3행: 기준가 모드 vs 손절선 */}
                        <div className="grid grid-cols-2">
                          <div className="px-2.5 py-1.5 border-r border-slate-800/50 flex items-center justify-between bg-slate-950/40">
                            <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">돌파기준</span>
                            <span className="font-black text-xs sm:text-[13px] text-teal-300">{baseMode}</span>
                          </div>
                          <div className="px-2.5 py-1.5 flex items-center justify-between bg-slate-950/40">
                            <span className="text-slate-400 font-sans text-[11px] sm:text-xs font-semibold">손실제한</span>
                            {slot.useAtrStopLoss ? (
                              <span className="font-black text-amber-300 text-xs sm:text-[13px] flex items-center gap-0.5" title="AI ATR 동적 변동성 손절 모드 가동 중 (1.2%~4.5% 맞춤 손절)">
                                ⚡ AI ATR (동적)
                              </span>
                            ) : (
                              <span className="font-black text-xs sm:text-[13px] text-blue-400">-{stopLoss}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })())}

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
                    <span className="text-xs sm:text-[13px] text-slate-300 flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden font-bold">
                      {!slot.isEnabled ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0"></span>
                          <strong className="text-slate-400 truncate">⏸️ 슬롯 가동 중지됨</strong>
                        </>
                      ) : hasPosition ? (
                        <>
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <strong className="text-emerald-300 truncate">🎯 실시간 수익 추적 중</strong>
                        </>
                      ) : isSurgeCounting ? (
                        <>
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <strong className="text-amber-300 animate-pulse truncate">⚡ 급등 포착! 자동 매수 대기</strong>
                        </>
                      ) : isZeroAmount ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                          <strong className="text-amber-400/90 truncate">매수금액 설정 대기 (0원)</strong>
                        </>
                      ) : (
                        <>
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              isBreakout ? 'bg-amber-400' : (isSwing ? 'bg-sky-400' : 'bg-emerald-400')
                            }`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                              isBreakout ? 'bg-amber-400' : (isSwing ? 'bg-sky-400' : 'bg-emerald-400')
                            }`}></span>
                          </span>
                          <strong className={`truncate ${
                            isBreakout ? 'text-amber-300' : (isSwing ? 'text-sky-300' : 'text-emerald-300')
                          }`}>
                            {isBreakout ? '🚀 신고가 돌파 감시 중' : (isSwing ? '🌊 추세스윙 감시 중' : '⚡ 스캘핑 감시 중')}
                          </strong>
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
                        onSellSlot && onSellSlot(slot.slotId);
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
