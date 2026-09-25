import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../services/soundService';

// 각 장세 모드별 Any Life AI 기본 추천 표준값 (디폴트 템플릿)
export const DEFAULT_MODE_PRESETS = {
  PRESET_A: {
    id: 'PRESET_A',
    name: '오전 모드 (09:00 당일 돌파 & 대형주 스윙)',
    icon: '⚡',
    periodKey: 'MORNING',
    tagText: '초단타 급등 & VWAP 돌파',
    description: '09:00 리셋 직후 당일 돌파(100~500억) 및 우량주 스윙(1~2천억)',
    common: {
      tradeAmountKrw: 50000,
      trailingTier1TargetProfitPct: 3.5,
      trailingTier1CallbackPct: 0.5,
      trailingTier2HurdlePct: 8.0,
      trailingTier2CallbackPct: 2.0,
      stopLossPct: 2.0,
      useAtrStopLoss: false,
      surgeRatePct: 1.8,
      surgeMinVolumeKrw: 15000000,
      breakoutCandleUnit: 1,
      breakoutMinVolumeKrwEok: 5,
      swingMinTradePrice24hEok: 100
    }
  },
  PRESET_B: {
    id: 'PRESET_B',
    name: '오후 모드 (횡보 방어 & 수급 집중)',
    icon: '🚀',
    periodKey: 'AFTERNOON',
    tagText: '당일 신고가 & 돌파 매수',
    description: '오후 횡보장 휩쏘 방어 및 검증된 수급 상위 코인 선별 공략',
    common: {
      tradeAmountKrw: 50000,
      trailingTier1TargetProfitPct: 2.0,
      trailingTier1CallbackPct: 0.4,
      trailingTier2HurdlePct: 6.0,
      trailingTier2CallbackPct: 1.5,
      stopLossPct: 1.5,
      useAtrStopLoss: false,
      surgeRatePct: 2.5,
      surgeMinVolumeKrw: 20000000,
      breakoutCandleUnit: 3,
      breakoutMinVolumeKrwEok: 10,
      swingMinTradePrice24hEok: 150
    }
  },
  PRESET_C: {
    id: 'PRESET_C',
    name: '야간 모드 (야간 단기 청산 & 허수 트릭 방어)',
    icon: '🌊',
    periodKey: 'NIGHT',
    tagText: '이평 정배열 & 트레일링 스탑',
    description: '미 증시 개장 전후 변동성 대응 및 9~10번 슬롯 30% 허수 트릭 방어',
    common: {
      tradeAmountKrw: 50000,
      trailingTier1TargetProfitPct: 2.0,
      trailingTier1CallbackPct: 0.3,
      trailingTier2HurdlePct: 5.0,
      trailingTier2CallbackPct: 1.2,
      stopLossPct: 1.8,
      useAtrStopLoss: false,
      surgeRatePct: 2.0,
      surgeMinVolumeKrw: 25000000,
      breakoutCandleUnit: 1,
      breakoutMinVolumeKrwEok: 8,
      swingMinTradePrice24hEok: 200
    }
  }
};

// 1~12번 슬롯 기본 생성 헬퍼
export const generateDefaultSlotsForPreset = (commonConfig) => {
  const result = [];
  for (let id = 1; id <= 12; id++) {
    let mode = 'SCALPING';
    if (id >= 9 && id <= 10) mode = 'BREAKOUT';
    else if (id >= 11 && id <= 12) mode = 'SWING';

    result.push({
      slotId: id,
      name: `${id}번 슬롯`,
      strategyMode: mode,
      tradeAmountKrw: commonConfig.tradeAmountKrw || 50000,
      targetProfitPct: commonConfig.trailingTier1TargetProfitPct || 3.0,
      trailingTargetProfitPct: commonConfig.trailingTier1TargetProfitPct || 3.0,
      trailingCallbackPct: commonConfig.trailingTier1CallbackPct || 0.5,
      trailingTier1TargetProfitPct: commonConfig.trailingTier1TargetProfitPct || 3.0,
      trailingTier1CallbackPct: commonConfig.trailingTier1CallbackPct || 0.5,
      trailingTier2HurdlePct: commonConfig.trailingTier2HurdlePct || 8.0,
      trailingTier2CallbackPct: commonConfig.trailingTier2CallbackPct || 2.0,
      stopLossPct: commonConfig.stopLossPct || 2.0,
      useWideTrailing: true,
      useAtrStopLoss: commonConfig.useAtrStopLoss || false,
      surgeRatePct: commonConfig.surgeRatePct || 2.0,
      surgeMinVolumeKrw: commonConfig.surgeMinVolumeKrw || 20000000,
      breakoutHighEnabled: mode === 'BREAKOUT',
      breakoutCandleUnit: commonConfig.breakoutCandleUnit || 1,
      breakoutMinVolumeKrwEok: commonConfig.breakoutMinVolumeKrwEok || 5,
      swingCandleUnit: 'days',
      swingShortMa: 5,
      swingLongMa: 20,
      swingMinTradePrice24hEok: commonConfig.swingMinTradePrice24hEok || 100,
      min24hAccTradePriceKrw: (commonConfig.swingMinTradePrice24hEok || 100) * 100000000
    });
  }
  return result;
};

export default function PresetStrategyModal({
  isOpen,
  onClose,
  presetKey = 'PRESET_A',
  presetData = null,
  currentSlots = [],
  onSavePreset,
  timeRange = ''
}) {
  const defaultMeta = DEFAULT_MODE_PRESETS[presetKey] || DEFAULT_MODE_PRESETS.PRESET_A;

  // 1. 활성 서브 탭: 'COMMON' (핵심 전략 & 장세 특화) | 'SLOTS' (1~12번 슬롯별 상세 분배)
  const [activeTab, setActiveTab] = useState('COMMON');

  // 2. 모드 메타 상태
  const [name, setName] = useState(defaultMeta.name);
  const [description, setDescription] = useState(defaultMeta.description);

  // 3. 핵심 공통 파라미터 상태
  const [commonConfig, setCommonConfig] = useState({ ...defaultMeta.common });

  // 4. 1~12번 슬롯 개별 파라미터 상태
  const [slotConfigs, setSlotConfigs] = useState([]);

  // 5. 저장 진행 상태
  const [saving, setSaving] = useState(false);

  // 🛡️ 백그라운드 5초 폴링 시 모달 상태 및 탭(activeTab) 강제 리셋 방지 가드
  const prevIsOpenRef = useRef(false);

  // 모달이 처음 열릴 때(false -> true)에만 초기 데이터 로드
  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen) {
      const baseMeta = DEFAULT_MODE_PRESETS[presetKey] || DEFAULT_MODE_PRESETS.PRESET_A;
      setName(presetData?.name || baseMeta.name);
      setDescription(presetData?.description || baseMeta.description);

      const mergedCommon = {
        ...baseMeta.common,
        ...(presetData?.commonConfig || {})
      };

      if (presetData?.slots && Array.isArray(presetData.slots) && presetData.slots.length > 0) {
        const first = presetData.slots[0];
        if (first.tradeAmountKrw) mergedCommon.tradeAmountKrw = first.tradeAmountKrw;
        if (first.trailingTier1TargetProfitPct) mergedCommon.trailingTier1TargetProfitPct = first.trailingTier1TargetProfitPct;
        if (first.trailingTier1CallbackPct) mergedCommon.trailingTier1CallbackPct = first.trailingTier1CallbackPct;
        if (first.stopLossPct) mergedCommon.stopLossPct = first.stopLossPct;
        if (first.useAtrStopLoss !== undefined) mergedCommon.useAtrStopLoss = first.useAtrStopLoss;
        setSlotConfigs(JSON.parse(JSON.stringify(presetData.slots)));
      } else if (currentSlots && currentSlots.length > 0) {
        const generated = currentSlots.map(s => ({
          slotId: s.slotId || s.id,
          name: s.slotName || s.name || `${s.slotId || s.id}번 슬롯`,
          strategyMode: s.strategyMode?.includes('BREAKOUT') ? 'BREAKOUT' : (s.strategyMode?.includes('SWING') ? 'SWING' : 'SCALPING'),
          tradeAmountKrw: s.tradeAmountKrw || mergedCommon.tradeAmountKrw,
          targetProfitPct: s.targetProfitPct !== undefined ? s.targetProfitPct : mergedCommon.trailingTier1TargetProfitPct,
          trailingTargetProfitPct: s.trailingTargetProfitPct !== undefined ? s.trailingTargetProfitPct : mergedCommon.trailingTier1TargetProfitPct,
          trailingCallbackPct: s.trailingCallbackPct !== undefined ? s.trailingCallbackPct : mergedCommon.trailingTier1CallbackPct,
          trailingTier1TargetProfitPct: s.trailingTier1TargetProfitPct !== undefined ? s.trailingTier1TargetProfitPct : mergedCommon.trailingTier1TargetProfitPct,
          trailingTier1CallbackPct: s.trailingTier1CallbackPct !== undefined ? s.trailingTier1CallbackPct : mergedCommon.trailingTier1CallbackPct,
          trailingTier2HurdlePct: s.trailingTier2HurdlePct !== undefined ? s.trailingTier2HurdlePct : mergedCommon.trailingTier2HurdlePct,
          trailingTier2CallbackPct: s.trailingTier2CallbackPct !== undefined ? s.trailingTier2CallbackPct : mergedCommon.trailingTier2CallbackPct,
          stopLossPct: s.stopLossPct !== undefined ? s.stopLossPct : mergedCommon.stopLossPct,
          useWideTrailing: s.useWideTrailing !== undefined ? s.useWideTrailing : true,
          useAtrStopLoss: s.useAtrStopLoss !== undefined ? s.useAtrStopLoss : mergedCommon.useAtrStopLoss,
          surgeRatePct: s.surgeRatePct || mergedCommon.surgeRatePct,
          surgeMinVolumeKrw: s.surgeMinVolumeKrw || mergedCommon.surgeMinVolumeKrw,
          breakoutHighEnabled: s.breakoutHighEnabled !== undefined ? s.breakoutHighEnabled : (s.slotId >= 9 && s.slotId <= 10),
          breakoutCandleUnit: s.breakoutCandleUnit || mergedCommon.breakoutCandleUnit,
          breakoutMinVolumeKrwEok: s.breakoutMinVolumeKrwEok || mergedCommon.breakoutMinVolumeKrwEok,
          swingCandleUnit: s.swingCandleUnit || 'days',
          swingShortMa: s.swingShortMa || 5,
          swingLongMa: s.swingLongMa || 20,
          swingMinTradePrice24hEok: s.swingMinTradePrice24hEok || mergedCommon.swingMinTradePrice24hEok,
          min24hAccTradePriceKrw: (s.swingMinTradePrice24hEok || mergedCommon.swingMinTradePrice24hEok) * 100000000
        }));
        setSlotConfigs(generated);
      } else {
        setSlotConfigs(generateDefaultSlotsForPreset(mergedCommon));
      }

      setCommonConfig(mergedCommon);
      setActiveTab('COMMON');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, presetKey]);

  if (!isOpen) return null;

  const handleCommonChange = (field, value) => {
    setCommonConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyCommonToAllSlots = () => {
    soundService?.playClick?.();
    setSlotConfigs(prev => prev.map(s => ({
      ...s,
      tradeAmountKrw: Number(commonConfig.tradeAmountKrw) || s.tradeAmountKrw,
      targetProfitPct: Number(commonConfig.trailingTier1TargetProfitPct) || s.targetProfitPct,
      trailingTargetProfitPct: Number(commonConfig.trailingTier1TargetProfitPct) || s.trailingTargetProfitPct,
      trailingTier1TargetProfitPct: Number(commonConfig.trailingTier1TargetProfitPct) || s.trailingTier1TargetProfitPct,
      trailingCallbackPct: Number(commonConfig.trailingTier1CallbackPct) || s.trailingCallbackPct,
      trailingTier1CallbackPct: Number(commonConfig.trailingTier1CallbackPct) || s.trailingTier1CallbackPct,
      trailingTier2HurdlePct: Number(commonConfig.trailingTier2HurdlePct) || s.trailingTier2HurdlePct,
      trailingTier2CallbackPct: Number(commonConfig.trailingTier2CallbackPct) || s.trailingTier2CallbackPct,
      stopLossPct: Number(commonConfig.stopLossPct) || s.stopLossPct,
      useAtrStopLoss: Boolean(commonConfig.useAtrStopLoss),
      surgeRatePct: Number(commonConfig.surgeRatePct) || s.surgeRatePct,
      surgeMinVolumeKrw: Number(commonConfig.surgeMinVolumeKrw) || s.surgeMinVolumeKrw,
      breakoutCandleUnit: Number(commonConfig.breakoutCandleUnit) || s.breakoutCandleUnit,
      breakoutMinVolumeKrwEok: Number(commonConfig.breakoutMinVolumeKrwEok) || s.breakoutMinVolumeKrwEok,
      swingMinTradePrice24hEok: Number(commonConfig.swingMinTradePrice24hEok) || s.swingMinTradePrice24hEok,
      min24hAccTradePriceKrw: (Number(commonConfig.swingMinTradePrice24hEok) || 100) * 100000000
    })));
    alert('✨ 핵심 설정값이 1~12번 슬롯 전체에 일괄 동기화되었습니다!');
  };

  const handleSlotFieldChange = (slotId, field, value) => {
    setSlotConfigs(prev => prev.map(s => {
      if (s.slotId === slotId) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        id: presetKey,
        name: name.trim() || defaultMeta.name,
        description: description.trim() || defaultMeta.description,
        updatedAt: new Date().toISOString(),
        commonConfig: { ...commonConfig },
        slots: slotConfigs.map(s => ({
          ...s,
          tradeAmountKrw: Number(s.tradeAmountKrw) || 50000,
          targetProfitPct: Number(s.targetProfitPct) || 3.0,
          trailingTargetProfitPct: Number(s.trailingTargetProfitPct || s.targetProfitPct) || 3.0,
          trailingCallbackPct: Number(s.trailingCallbackPct) || 0.5,
          trailingTier1TargetProfitPct: Number(s.trailingTier1TargetProfitPct || s.targetProfitPct) || 3.0,
          trailingTier1CallbackPct: Number(s.trailingTier1CallbackPct || s.trailingCallbackPct) || 0.5,
          trailingTier2HurdlePct: Number(s.trailingTier2HurdlePct) || 8.0,
          trailingTier2CallbackPct: Number(s.trailingTier2CallbackPct) || 2.0,
          stopLossPct: Number(s.stopLossPct) || 2.0,
          useWideTrailing: s.useWideTrailing !== undefined ? s.useWideTrailing : true,
          useAtrStopLoss: Boolean(s.useAtrStopLoss),
          surgeRatePct: Number(s.surgeRatePct) || 2.0,
          surgeMinVolumeKrw: Number(s.surgeMinVolumeKrw) || 20000000,
          breakoutCandleUnit: Number(s.breakoutCandleUnit) || 1,
          breakoutMinVolumeKrwEok: Number(s.breakoutMinVolumeKrwEok) || 5,
          swingMinTradePrice24hEok: Number(s.swingMinTradePrice24hEok) || 100,
          min24hAccTradePriceKrw: (Number(s.swingMinTradePrice24hEok) || 100) * 100000000
        }))
      };

      if (onSavePreset) {
        await onSavePreset(presetKey, payload, false);
      }

      soundService?.playSuccess?.();
      onClose();
    } catch (e) {
      alert('설정 저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* 상하 스크롤/슬라이딩 없이 한 화면에 단단하게 고정되는 와이드 고정 박스 (탭 전환 시에도 크기 100% 불변) */}
      <div className="relative w-full max-w-5xl lg:max-w-6xl h-[580px] max-h-[92vh] bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* 1. 상단 헤더바 */}
        <div className="flex-shrink-0 px-6 py-3.5 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-purple-950/80 border-b border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{defaultMeta.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                  <span>{name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 font-bold">
                    세부 전략 튜닝
                  </span>
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                시간대: {timeRange || '스케줄 연동'} · 포지션 무결성 보장
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* 2. 탭 네비게이션 (높이 52px 고정으로 버튼 출현 시에도 흔들림 방지) */}
        <div className="flex-shrink-0 px-6 h-[52px] bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('COMMON')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'COMMON'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡</span>
              <span>핵심 전략 &amp; 알고리즘 필터</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SLOTS')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'SLOTS'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎛️</span>
              <span>1~12번 슬롯별 개별 분배 ({slotConfigs.length}개)</span>
            </button>
          </div>

          {activeTab === 'SLOTS' && (
            <button
              type="button"
              onClick={handleApplyCommonToAllSlots}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="탭1(핵심 전략)의 매수금액·익절선·손절선 설정을 1~12번 슬롯 전체에 그대로 복사합니다"
            >
              <span>🔄</span>
              <span>탭1 공통 설정을 1~12번 슬롯에 일괄 복사하기</span>
            </button>
          )}
        </div>

        {/* 3. 본문 영역: 탭 간 전환 시에도 높이가 100% 동일하게 고정 */}
        <div className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto flex flex-col justify-center">

          {/* 탭 1: 핵심 전략 & 장세 특화 필터 설정 (좌우 2열 배치) */}
          {activeTab === 'COMMON' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              
              {/* 좌측 카드: 자금 & 익절/손절 기본 파라미터 */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    <span>자금 관리 &amp; 익절/손절 파라미터</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">기본 공통 룰</span>
                </div>

                {/* 1회 매수금액 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-200">1회 매수금액 (KRW)</label>
                    <div className="flex items-center gap-1.5">
                      {[30000, 50000, 100000, 200000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleCommonChange('tradeAmountKrw', amt)}
                          className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                            commonConfig.tradeAmountKrw === amt 
                              ? 'bg-indigo-600 text-white font-bold' 
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {amt >= 10000 ? `${amt / 10000}만` : amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="5000"
                      step="10000"
                      value={commonConfig.tradeAmountKrw || ''}
                      onChange={(e) => handleCommonChange('tradeAmountKrw', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">원</span>
                  </div>
                </div>

                {/* 1단계 익절 & 콜백 */}
                <div className="space-y-1.5">
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 block">1단계 감시익절 &amp; 콜백 되돌림</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={commonConfig.trailingTier1TargetProfitPct || ''}
                        onChange={(e) => handleCommonChange('trailingTier1TargetProfitPct', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-sm font-bold focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">익절(+%)</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={commonConfig.trailingTier1CallbackPct || ''}
                        onChange={(e) => handleCommonChange('trailingTier1CallbackPct', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm font-bold focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">콜백(%)</span>
                    </div>
                  </div>
                </div>

                {/* 2단계 와이드 익절 & 콜백 */}
                <div className="space-y-1.5">
                  <span className="text-xs sm:text-sm font-bold text-purple-400 block">2단계 와이드 대시세 익절 허들</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={commonConfig.trailingTier2HurdlePct || ''}
                        onChange={(e) => handleCommonChange('trailingTier2HurdlePct', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-purple-300 font-mono text-sm font-bold focus:border-purple-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">허들(+%)</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={commonConfig.trailingTier2CallbackPct || ''}
                        onChange={(e) => handleCommonChange('trailingTier2CallbackPct', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm font-bold focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">콜백(%)</span>
                    </div>
                  </div>
                </div>

                {/* 원금 손절선 & ATR 토글 */}
                <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-slate-800/80">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-rose-400 block mb-1">원금 손절선 (-%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={commonConfig.stopLossPct || ''}
                      onChange={(e) => handleCommonChange('stopLossPct', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-rose-300 font-mono text-sm font-bold focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-indigo-500/50">
                      <span className="text-xs sm:text-sm font-bold text-indigo-300">AI ATR 손절</span>
                      <input
                        type="checkbox"
                        checked={Boolean(commonConfig.useAtrStopLoss)}
                        onChange={(e) => handleCommonChange('useAtrStopLoss', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 우측 카드: 모드별 특화 수급 및 진입 알고리즘 필터 */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                      <span>모드별 특화 수급 &amp; 진입 필터</span>
                    </h4>
                    <span className="text-xs text-indigo-300 font-bold">{defaultMeta.tagText}</span>
                  </div>

                  {/* 운용 한 줄 안내 */}
                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 mb-3.5 leading-relaxed">
                    💡 {defaultMeta.description}
                  </div>

                  {/* 급등 감시 기준 상승률 */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-amber-300">급등 감시 기준 상승률 (%)</label>
                      <span className="text-xs text-slate-400">초 단위 포착 허들</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={commonConfig.surgeRatePct || ''}
                        onChange={(e) => handleCommonChange('surgeRatePct', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono text-sm font-bold focus:border-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 급등 감시 최소 거래대금 */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-200">급등 최소 틱 거래대금 (KRW)</label>
                      <span className="text-xs text-slate-300 font-mono font-bold text-indigo-300">
                        {((commonConfig.surgeMinVolumeKrw || 0) / 10000).toLocaleString()}만원 이상
                      </span>
                    </div>
                    <input
                      type="number"
                      step="1000000"
                      value={commonConfig.surgeMinVolumeKrw || ''}
                      onChange={(e) => handleCommonChange('surgeMinVolumeKrw', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* 24시간 최소 거래대금 스윙 필터 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-teal-300">24시간 최소 거래대금 (억원)</label>
                      <span className="text-xs text-slate-400">스윙 11~12번 슬롯 연동</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="10"
                        value={commonConfig.swingMinTradePrice24hEok || ''}
                        onChange={(e) => handleCommonChange('swingMinTradePrice24hEok', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-teal-300 font-mono text-sm font-bold focus:border-teal-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">억원</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>안전 방어:</span>
                  <span className="font-bold text-slate-300">포지션 보유 중인 슬롯은 청산 시까지 기존 룰 보호</span>
                </div>
              </div>

            </div>
          )}

          {/* 탭 2: 1~12번 슬롯별 상세 분배 (시원시원한 4열 그리드 & 큰 글씨) */}
          {activeTab === 'SLOTS' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {slotConfigs.map((slot) => (
                  <div
                    key={slot.slotId}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30">
                        #{slot.slotId}
                      </span>
                      <select
                        value={
                          slot.strategyMode?.includes('BREAKOUT') ? 'BREAKOUT' :
                          slot.strategyMode?.includes('SWING') ? 'SWING' : 'SCALPING'
                        }
                        onChange={(e) => handleSlotFieldChange(slot.slotId, 'strategyMode', e.target.value)}
                        className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="SCALPING">⚡ 스캘핑</option>
                        <option value="BREAKOUT">🚀 돌파</option>
                        <option value="SWING">📊 스윙</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <div>
                        <span className="text-xs font-bold text-slate-300 block mb-0.5 truncate">매수금</span>
                        <input
                          type="number"
                          step="10000"
                          value={slot.tradeAmountKrw || ''}
                          onChange={(e) => handleSlotFieldChange(slot.slotId, 'tradeAmountKrw', Number(e.target.value))}
                          className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block mb-0.5 truncate">익절%</span>
                        <input
                          type="number"
                          step="0.1"
                          value={slot.targetProfitPct || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleSlotFieldChange(slot.slotId, 'targetProfitPct', val);
                            handleSlotFieldChange(slot.slotId, 'trailingTier1TargetProfitPct', val);
                          }}
                          className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-rose-400 block mb-0.5 truncate">손절%</span>
                        <input
                          type="number"
                          step="0.1"
                          value={slot.stopLossPct || ''}
                          onChange={(e) => handleSlotFieldChange(slot.slotId, 'stopLossPct', Number(e.target.value))}
                          className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-rose-300 font-mono font-bold text-xs focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. 하단 푸터 액션 바: 오직 2개 버튼 [취소] | [설정 저장] */}
        <div className="flex-shrink-0 px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            ✕ 닫기 (취소)
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '💾 이 모드 세부설정 저장하기'}
          </button>
        </div>

      </div>
    </div>
  );
}
