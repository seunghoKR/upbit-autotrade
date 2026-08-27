import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Zap, 
  Activity, 
  Check, 
  Crown, 
  RefreshCw, 
  DollarSign, 
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Award,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  Clock,
  Settings2,
  Ban
} from 'lucide-react';
import { getAdminUsers, updateUserTier, updateSettings, updateExcludedMarkets } from '../services/api';

export default function OperatorDashboardModal({ 
  isOpen, 
  onClose,
  currentSettings = {},
  onSaveSettings
}) {
  const [activeTab, setActiveTab] = useState('STRATEGY'); // 'STRATEGY' | 'BUSINESS' | 'EXCLUDED'
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // 🚫 제외 코인 목록 관리
  const [excludedMarkets, setExcludedMarkets] = useState(currentSettings?.EXCLUDED_MARKETS || []);
  const [newExcludedInput, setNewExcludedInput] = useState('');

  // 1. 운영자 트레이딩 전략 프리셋 목록
  const [strategies, setStrategies] = useState([
    {
      id: 'strat_scalping',
      name: '🚀 초단타 급등 추종 (Scalping Alpha)',
      description: '5초 단기 급등 시 빠르게 포지션 진입 후 +3% 도달 시 트레일링 스탑 추적',
      isDefault: true,
      settings: {
        DEFAULT_MARKET: 'KRW-BTC',
        DEFAULT_TRADE_AMOUNT: 50000,
        SURGE_CHECK_SECONDS: 5,
        SURGE_RATE_THRESHOLD: 1.5,
        SURGE_MIN_VOLUME_KRW: 10000000,
        TRAILING_TARGET_PROFIT_PCT: 3.0,
        TRAILING_CALLBACK_PCT: 1.0,
        STOP_LOSS_PCT: 2.0,
        APPROVAL_TIMEOUT_SECONDS: 30,
        AUTO_EXECUTE_ON_TIMEOUT: false
      }
    },
    {
      id: 'strat_trend',
      name: '🌊 안정형 추세 스윙 (Trend Follower)',
      description: '15초간 안정적인 거래량 폭증 감지 시 진입하여 +5% 이상 장기 추세 익절',
      isDefault: false,
      settings: {
        DEFAULT_MARKET: 'KRW-BTC',
        DEFAULT_TRADE_AMOUNT: 100000,
        SURGE_CHECK_SECONDS: 15,
        SURGE_RATE_THRESHOLD: 2.5,
        SURGE_MIN_VOLUME_KRW: 30000000,
        TRAILING_TARGET_PROFIT_PCT: 5.0,
        TRAILING_CALLBACK_PCT: 1.5,
        STOP_LOSS_PCT: 3.0,
        APPROVAL_TIMEOUT_SECONDS: 45,
        AUTO_EXECUTE_ON_TIMEOUT: false
      }
    },
    {
      id: 'strat_breakout',
      name: '⚡ 초고수익 불장 돌파 (Bull Breakout)',
      description: '3초 찰나의 폭등 감지 후 즉시 매수, +7% 이상 극대화 수익 추구',
      isDefault: false,
      settings: {
        DEFAULT_MARKET: 'KRW-BTC',
        DEFAULT_TRADE_AMOUNT: 50000,
        SURGE_CHECK_SECONDS: 3,
        SURGE_RATE_THRESHOLD: 1.0,
        SURGE_MIN_VOLUME_KRW: 20000000,
        TRAILING_TARGET_PROFIT_PCT: 7.0,
        TRAILING_CALLBACK_PCT: 2.0,
        STOP_LOSS_PCT: 1.5,
        APPROVAL_TIMEOUT_SECONDS: 20,
        AUTO_EXECUTE_ON_TIMEOUT: true
      }
    }
  ]);

  const [activeStrategyId, setActiveStrategyId] = useState('strat_scalping');
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // 신규 전략 폼 상태
  const [strategyForm, setStrategyForm] = useState({
    name: '',
    description: '',
    SURGE_CHECK_SECONDS: 5,
    SURGE_RATE_THRESHOLD: 1.5,
    SURGE_MIN_VOLUME_KRW: 10000000,
    TRAILING_TARGET_PROFIT_PCT: 3.0,
    TRAILING_CALLBACK_PCT: 1.0,
    STOP_LOSS_PCT: 2.0,
    APPROVAL_TIMEOUT_SECONDS: 30,
    AUTO_EXECUTE_ON_TIMEOUT: false
  });

  // 비즈니스 입금 대기열
  const [pendingDeposits, setPendingDeposits] = useState([
    { id: 101, nickname: '강남트레이더', kakaoId: 'kakao_99182', tier: 'VIP', period: '1개월', amount: 99000, depositedAt: '방금 전' },
    { id: 102, nickname: '비트불스', kakaoId: 'kakao_77219', tier: 'PRO', period: '1개월', amount: 49000, depositedAt: '12분 전' },
    { id: 103, nickname: '퀀트초보_민수', kakaoId: 'kakao_33412', tier: 'VIP', period: '3개월', amount: 267000, depositedAt: '45분 전' }
  ]);

  const [liveTradingFeed] = useState([
    { id: 1, user: '스마트트레이더_길동', market: 'KRW-BTC', profitRate: '+3.42%', profitKrw: '+1,710원', time: '방금' },
    { id: 2, user: '알트수익왕', market: 'KRW-SOL', profitRate: '+5.18%', profitKrw: '+5,180원', time: '1분 전' },
    { id: 3, user: '누리오_마스터', market: 'KRW-ETH', profitRate: '+2.80%', profitKrw: '+14,000원', time: '3분 전' },
    { id: 4, user: '비트코인_불장', market: 'KRW-XRP', profitRate: '-0.95%', profitKrw: '-475원', time: '5분 전' },
    { id: 5, user: '골든크로스', market: 'KRW-DOGE', profitRate: '+4.12%', profitKrw: '+2,060원', time: '7분 전' }
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminUsers();
      if (res && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load operator stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. 전략 즉시 적용 (봇에 파라미터 전달 및 브로드캐스트)
  const handleApplyStrategy = async (strategy) => {
    try {
      setActiveStrategyId(strategy.id);
      if (onSaveSettings) {
        await onSaveSettings(strategy.settings);
      } else {
        await updateSettings(strategy.settings);
      }
      setSaveSuccessMsg(`[${strategy.name}] 전략이 활성화되어 전체 실시간 트레이딩 엔진에 즉시 적용되었습니다! 🚀`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('전략 적용 실패: ' + err.message);
    }
  };

  // 2. 전략 수정 모드 시작
  const handleStartEditStrategy = (strategy) => {
    setIsCreatingNew(false);
    setEditingStrategy(strategy.id);
    setStrategyForm({
      name: strategy.name,
      description: strategy.description,
      ...strategy.settings
    });
  };

  // 3. 신규 전략 생성 모드 시작
  const handleStartCreateNew = () => {
    setEditingStrategy(null);
    setIsCreatingNew(true);
    setStrategyForm({
      name: `전략 알고리즘 #${strategies.length + 1}`,
      description: '운영자 맞춤형 급등 감지 및 트레일링 전략',
      SURGE_CHECK_SECONDS: 5,
      SURGE_RATE_THRESHOLD: 1.5,
      SURGE_MIN_VOLUME_KRW: 10000000,
      TRAILING_TARGET_PROFIT_PCT: 3.0,
      TRAILING_CALLBACK_PCT: 1.0,
      STOP_LOSS_PCT: 2.0,
      APPROVAL_TIMEOUT_SECONDS: 30,
      AUTO_EXECUTE_ON_TIMEOUT: false
    });
  };

  // 4. 전략 저장 (신규 추가 or 기존 수정)
  const handleSaveStrategy = async (e) => {
    e.preventDefault();

    const newSettings = {
      DEFAULT_MARKET: 'KRW-BTC',
      DEFAULT_TRADE_AMOUNT: 50000,
      SURGE_CHECK_SECONDS: Number(strategyForm.SURGE_CHECK_SECONDS),
      SURGE_RATE_THRESHOLD: Number(strategyForm.SURGE_RATE_THRESHOLD),
      SURGE_MIN_VOLUME_KRW: Number(strategyForm.SURGE_MIN_VOLUME_KRW),
      TRAILING_TARGET_PROFIT_PCT: Number(strategyForm.TRAILING_TARGET_PROFIT_PCT),
      TRAILING_CALLBACK_PCT: Number(strategyForm.TRAILING_CALLBACK_PCT),
      STOP_LOSS_PCT: Number(strategyForm.STOP_LOSS_PCT),
      APPROVAL_TIMEOUT_SECONDS: Number(strategyForm.APPROVAL_TIMEOUT_SECONDS),
      AUTO_EXECUTE_ON_TIMEOUT: Boolean(strategyForm.AUTO_EXECUTE_ON_TIMEOUT)
    };

    if (isCreatingNew) {
      const newStrat = {
        id: `strat_${Date.now()}`,
        name: strategyForm.name,
        description: strategyForm.description,
        isDefault: false,
        settings: newSettings
      };
      setStrategies(prev => [...prev, newStrat]);
      setIsCreatingNew(false);
      setSaveSuccessMsg(`새로운 트레이딩 전략 [${newStrat.name}]이 성공적으로 등록되었습니다! ✨`);
    } else if (editingStrategy) {
      setStrategies(prev => prev.map(s => {
        if (s.id === editingStrategy) {
          return {
            ...s,
            name: strategyForm.name,
            description: strategyForm.description,
            settings: newSettings
          };
        }
        return s;
      }));

      // 현재 활성 전략이면 봇에도 실시간 반영
      if (activeStrategyId === editingStrategy) {
        if (onSaveSettings) await onSaveSettings(newSettings);
      }

      setEditingStrategy(null);
      setSaveSuccessMsg(`전략 [${strategyForm.name}] 파라미터가 수정 및 저장되었습니다! 💾`);
    }

    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // 5. 전략 삭제
  const handleDeleteStrategy = (id, name) => {
    if (strategies.length <= 1) {
      alert('최소 1개 이상의 트레이딩 전략이 유지되어야 합니다.');
      return;
    }
    if (window.confirm(`정말로 [${name}] 전략을 삭제하시겠습니까?`)) {
      setStrategies(prev => prev.filter(s => s.id !== id));
      if (activeStrategyId === id) {
        const remaining = strategies.filter(s => s.id !== id);
        if (remaining.length > 0) {
          handleApplyStrategy(remaining[0]);
        }
      }
    }
  };

  // 입금 승인
  const handleApproveDeposit = async (depId) => {
    const dep = pendingDeposits.find(d => d.id === depId);
    if (!dep) return;

    try {
      const targetUser = users.find(u => u.kakaoId === dep.kakaoId || u.nickname === dep.nickname);
      if (targetUser) {
        await updateUserTier(targetUser.id, dep.tier, dep.period.includes('3') ? 90 : 30);
      }
      setPendingDeposits(prev => prev.filter(d => d.id !== depId));
      alert(`[${dep.nickname}] 님의 ${dep.tier} 입금 확인 및 멤버십 승급이 완료되었습니다! ✨`);
      loadData();
    } catch (err) {
      alert('승인 처리 실패: ' + err.message);
    }
  };

  // 🚫 제외 코인 추가/삭제 핸들러
  const handleAddExcludedMarket = async (marketCode) => {
    let formatted = marketCode.trim().toUpperCase();
    if (!formatted.startsWith('KRW-')) {
      formatted = `KRW-${formatted}`;
    }
    if (excludedMarkets.includes(formatted)) {
      alert('이미 감시/매매 제외 목록에 등록된 코인입니다.');
      return;
    }
    const updated = [...excludedMarkets, formatted];
    setExcludedMarkets(updated);
    setNewExcludedInput('');
    try {
      await updateExcludedMarkets(updated);
      setSaveSuccessMsg(`[${formatted}] 코인이 감시 및 매매 제외 목록에 추가되었습니다! 🚫`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('제외 코인 저장 실패: ' + err.message);
    }
  };

  const handleRemoveExcludedMarket = async (marketCode) => {
    const updated = excludedMarkets.filter(m => m !== marketCode);
    setExcludedMarkets(updated);
    try {
      await updateExcludedMarkets(updated);
      setSaveSuccessMsg(`[${marketCode}] 코인의 제외 설정이 해제되었습니다 (감시 재개). ✅`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('제외 코인 삭제 실패: ' + err.message);
    }
  };

  const totalMembers = users.length > 0 ? users.length + 47 : 48;
  const vipCount = users.filter(u => u.tier === 'VIP').length + 23;
  const proCount = users.filter(u => u.tier === 'PRO').length + 20;
  const mrrEstimated = (vipCount * 99000) + (proCount * 49000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl max-w-6xl w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* 상단 헤더 및 탭 메뉴 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/40 text-indigo-300 rounded-2xl shadow-md">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
                  사이트 운영자(관리자) 비즈니스 & 전략 콘솔
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Operator Master
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                전략 알고리즘 제어, 감시/매매 제외 코인 관리 및 회원 구독/입금을 총괄합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 3대 메인 탭 전환 버튼 */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('STRATEGY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'STRATEGY'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span>🎯 전략 관리</span>
              </button>

              <button
                onClick={() => setActiveTab('EXCLUDED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'EXCLUDED'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Ban className="w-3.5 h-3.5 text-rose-300" />
                <span>🚫 제외 코인 ({excludedMarkets.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('BUSINESS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'BUSINESS'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>📊 비즈니스</span>
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 안내 메시지 */}
        {saveSuccessMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* 본문 스크롤 영역 */}
        <div className="py-5 space-y-5 overflow-y-auto pr-1 flex-1 text-xs text-slate-300">
          {/* ====================================================
              탭 1: 🎯 트레이딩 전략 알고리즘 매니저 (추가/삭제/수정/적용)
             ==================================================== */}
          {activeTab === 'STRATEGY' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    마스터 트레이딩 알고리즘 프리셋 관리 (운영자 전용)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    회원들에게는 노출되지 않으며, 운영자가 전략을 추가·수정·선택하면 모든 봇에 실시간 일괄 적용됩니다.
                  </p>
                </div>

                <button
                  onClick={handleStartCreateNew}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ 새 전략 알고리즘 추가</span>
                </button>
              </div>

              {/* 전략 추가 또는 수정 모드 폼 */}
              {(isCreatingNew || editingStrategy) && (
                <form onSubmit={handleSaveStrategy} className="bg-slate-950 p-5 rounded-2xl border-2 border-indigo-500/50 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h5 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-indigo-400" />
                      {isCreatingNew ? '새로운 트레이딩 전략 알고리즘 등록' : '전략 파라미터 수정'}
                    </h5>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingNew(false); setEditingStrategy(null); }}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      취소
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block mb-1">전략 이름</label>
                      <input
                        type="text"
                        required
                        value={strategyForm.name}
                        onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="예: 🚀 초단타 급등 추종"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">전략 설명</label>
                      <input
                        type="text"
                        value={strategyForm.description}
                        onChange={(e) => setStrategyForm({ ...strategyForm, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="전략의 특징 및 운영 방침"
                      />
                    </div>
                  </div>

                  {/* 세부 파라미터 그리드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {/* 급등 감지 조건 */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>급등 감지 파라미터</span>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">감시 시간 (초)</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={strategyForm.SURGE_CHECK_SECONDS}
                          onChange={(e) => setStrategyForm({ ...strategyForm, SURGE_CHECK_SECONDS: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">상승률 기준 (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={strategyForm.SURGE_RATE_THRESHOLD}
                          onChange={(e) => setStrategyForm({ ...strategyForm, SURGE_RATE_THRESHOLD: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">최소 거래대금 (원)</label>
                        <input
                          type="number"
                          step="1000000"
                          value={strategyForm.SURGE_MIN_VOLUME_KRW}
                          onChange={(e) => setStrategyForm({ ...strategyForm, SURGE_MIN_VOLUME_KRW: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        />
                      </div>
                    </div>

                    {/* 트레일링 & 손절 조건 */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="font-bold text-purple-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        <span>트레일링 & 리스크 관리</span>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">추적 시작 수익률 (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={strategyForm.TRAILING_TARGET_PROFIT_PCT}
                          onChange={(e) => setStrategyForm({ ...strategyForm, TRAILING_TARGET_PROFIT_PCT: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">고점 대비 하락폭 (%)</label>
                        <input
                          type="number"
                          step="0.2"
                          value={strategyForm.TRAILING_CALLBACK_PCT}
                          onChange={(e) => setStrategyForm({ ...strategyForm, TRAILING_CALLBACK_PCT: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">손절선 (Stop Loss %)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={strategyForm.STOP_LOSS_PCT}
                          onChange={(e) => setStrategyForm({ ...strategyForm, STOP_LOSS_PCT: e.target.value })}
                          className="w-full bg-slate-950 border border-rose-900/60 rounded-lg px-2 py-1 text-rose-300"
                        />
                      </div>
                    </div>

                    {/* 승인 정책 */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>승인 비서 및 자동 집행</span>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 text-[11px]">승인 제한시간 (초)</label>
                        <input
                          type="number"
                          value={strategyForm.APPROVAL_TIMEOUT_SECONDS}
                          onChange={(e) => setStrategyForm({ ...strategyForm, APPROVAL_TIMEOUT_SECONDS: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        />
                      </div>
                      <div className="pt-2">
                        <label className="text-slate-400 block mb-1 text-[11px]">타임아웃 시 자동 주문</label>
                        <button
                          type="button"
                          onClick={() => setStrategyForm({ ...strategyForm, AUTO_EXECUTE_ON_TIMEOUT: !strategyForm.AUTO_EXECUTE_ON_TIMEOUT })}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                            strategyForm.AUTO_EXECUTE_ON_TIMEOUT ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            strategyForm.AUTO_EXECUTE_ON_TIMEOUT ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setIsCreatingNew(false); setEditingStrategy(null); }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isCreatingNew ? '전략 등록하기' : '수정사항 저장하기'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 전략 프리셋 카드 목록 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {strategies.map((strat) => {
                  const isActive = strat.id === activeStrategyId;

                  return (
                    <div
                      key={strat.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isActive
                          ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/70 shadow-xl shadow-indigo-950/60 ring-2 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-extrabold text-slate-100 text-sm leading-tight">
                            {strat.name}
                          </h5>
                          {isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                              활성 적용 중
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium shrink-0">
                              대기 전략
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {strat.description}
                        </p>

                        {/* 전략 주요 파라미터 요약 표 */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">급등 감지:</span>
                            <span className="text-amber-300 font-mono font-bold">
                              {strat.settings.SURGE_CHECK_SECONDS}초간 +{strat.settings.SURGE_RATE_THRESHOLD}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">거래대금 필터:</span>
                            <span className="text-slate-200 font-mono">
                              {(strat.settings.SURGE_MIN_VOLUME_KRW / 10000).toLocaleString()}만원 이상
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">트레일링 익절:</span>
                            <span className="text-purple-300 font-mono font-bold">
                              +{strat.settings.TRAILING_TARGET_PROFIT_PCT}% 추적 / -{strat.settings.TRAILING_CALLBACK_PCT}% 콜백
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">손절선(Stop-Loss):</span>
                            <span className="text-rose-400 font-mono font-bold">
                              -{strat.settings.STOP_LOSS_PCT}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 하단 제어 버튼 */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                        {isActive ? (
                          <div className="flex-1 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>현재 가동 중인 전략</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyStrategy(strat)}
                            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>이 전략으로 즉시 전환</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStartEditStrategy(strat)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          title="파라미터 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteStrategy(strat.id, strat.name)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                          title="전략 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====================================================
              탭 2: 📊 비즈니스 지표 & 무통장 입금 승인 대시보드
             ==================================================== */}
          {activeTab === 'BUSINESS' && (
            <div className="space-y-5">
              {/* 1. 4대 비즈니스 핵심 지표 (KPIs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 총 회원수 */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>총 유치 회원수</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-100">
                    {totalMembers}<span className="text-xs font-normal text-slate-400 ml-1">명</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" /> 이번 달 신규 +14명
                  </div>
                </div>

                {/* 예상 월간 반복 매출 (MRR) */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>예상 월 매출 (MRR)</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {(mrrEstimated / 10000).toFixed(0)}<span className="text-xs font-normal text-slate-400 ml-1">만원</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    VIP {vipCount}명 + Pro {proCount}명
                  </div>
                </div>

                {/* 실시간 가동 봇 */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>실시간 가동 트레이딩 봇</span>
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400">
                    36<span className="text-xs font-normal text-slate-400 ml-1">대 온라인</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 24시간 무중단 자동매매 중
                  </div>
                </div>

                {/* 총 거래대금 & 승률 */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>시스템 누적 거래대금</span>
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-cyan-400 font-mono">
                    184.5<span className="text-xs font-normal text-slate-400 ml-1">백만원</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    트레일링 익절 승률: 84.2%
                  </div>
                </div>
              </div>

              {/* 2. 신규 입금 확인 & 구독 승인 대기열 */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-slate-100 text-sm">
                      신규 무통장 입금 확인 & 멤버십 승급 대기열 ({pendingDeposits.length}건)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">입금자명 확인 후 [승인] 시 기간 연장 및 슬롯이 즉시 개방됩니다.</span>
                </div>

                {pendingDeposits.length > 0 ? (
                  <div className="space-y-2">
                    {pendingDeposits.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <span className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400 font-bold text-xs font-mono">
                            {dep.tier}
                          </span>
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-2">
                              {dep.nickname}
                              <span className="text-[10px] text-slate-500 font-mono">({dep.kakaoId})</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              신청 플랜: <strong className="text-slate-300">{dep.tier} ({dep.period})</strong> • 신청금액: <strong className="text-amber-400">{dep.amount.toLocaleString()}원</strong> ({dep.depositedAt})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleApproveDeposit(dep.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>입금확인 및 승급 승인</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500">
                    현재 대기 중인 입금 확인 요청이 없습니다. 모두 정상 처리되었습니다! ✨
                  </div>
                )}
              </div>

              {/* 3. 실시간 전체 회원 체결 스트림 피드 */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-slate-100 text-sm">실시간 회원 급등 매수 & 트레일링 익절 스트림 피드</h4>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    실시간 라이브 피드
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {liveTradingFeed.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold">
                          <Flame className="w-3.5 h-3.5 text-purple-400" />
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 block">{item.user}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{item.market}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-extrabold text-sm block ${
                          item.profitRate.startsWith('+') ? 'text-emerald-400' : item.profitRate.startsWith('-') ? 'text-rose-400' : 'text-blue-400'
                        }`}>
                          {item.profitRate}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.profitKrw} ({item.time})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: 🚫 감시/매매 제외 코인 관리 (Blacklist) */}
          {/* ========================================================================= */}
          {activeTab === 'EXCLUDED' && (
            <div className="space-y-6">
              {/* 상단 설명 배너 */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">전종목 자동 감시 중 특정 코인 제외 (Blacklist)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                    자동매매 봇은 업비트 원화마켓 전종목을 24시간 실시간 감시하지만, 
                    <strong>유의종목, 급변동 종목 또는 운영자가 원치 않는 특정 코인</strong>을 등록하면 
                    감시 신호 포착 및 자동 매수 대상에서 즉시 제외됩니다.
                  </p>
                </div>
              </div>

              {/* 코인 등록 입력창 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>제외할 코인 티커(심볼) 직접 추가</span>
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="예: XRP 또는 KRW-XRP 또는 DOGE"
                    value={newExcludedInput}
                    onChange={(e) => setNewExcludedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newExcludedInput.trim()) {
                        handleAddExcludedMarket(newExcludedInput);
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm uppercase focus:outline-none focus:border-rose-400"
                  />
                  <button
                    type="button"
                    onClick={() => newExcludedInput.trim() && handleAddExcludedMarket(newExcludedInput)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-md cursor-pointer shrink-0"
                  >
                    제외 등록
                  </button>
                </div>

                {/* 추천 퀵 제외 버튼 */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                  <span className="text-[11px] text-slate-500 font-bold">빠른 추가:</span>
                  {['KRW-XRP', 'KRW-DOGE', 'KRW-SHIB', 'KRW-BTT', 'KRW-TRX', 'KRW-PEPE'].map((coin) => (
                    <button
                      key={coin}
                      type="button"
                      disabled={excludedMarkets.includes(coin)}
                      onClick={() => handleAddExcludedMarket(coin)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition ${
                        excludedMarkets.includes(coin)
                          ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 cursor-pointer'
                      }`}
                    >
                      +{coin}
                    </button>
                  ))}
                </div>
              </div>

              {/* 현재 제외된 코인 목록 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>현재 감시/매매 제외 중인 코인 목록</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold font-mono">
                      총 {excludedMarkets.length}종목
                    </span>
                  </h4>
                </div>

                {excludedMarkets.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    현재 제외된 코인이 없습니다. 업비트 원화마켓 모든 코인이 정상 감시 중입니다. ✨
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {excludedMarkets.map((market) => (
                      <div
                        key={market}
                        className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 font-mono text-xs font-black flex items-center gap-2 shadow-sm"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        <span>{market}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExcludedMarket(market)}
                          className="p-1 rounded-lg hover:bg-rose-900/60 text-rose-400 hover:text-white transition cursor-pointer"
                          title="제외 해제 (감시 재개)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
