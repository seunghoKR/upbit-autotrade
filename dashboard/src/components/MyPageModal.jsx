import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  KeyRound, 
  Crown, 
  Coins, 
  Save, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  Radio, 
  Send, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  Lock,
  Smartphone,
  Info
} from 'lucide-react';
import { saveAutoTradingSettings } from '../services/api';

export default function MyPageModal({ 
  isOpen, 
  onClose, 
  user, 
  slots = [], 
  onUpdateSlot, 
  onOpenApiModal,
  onOpenPricing,
  onReloadUser
}) {
  const [activeTab, setActiveTab] = useState('AUTO_TRADING'); // 'AUTO_TRADING' | 'API_SECURITY' | 'MEMBERSHIP'
  
  // 마이페이지 자동매매 핵심 설정 상태
  const [isAgreed, setIsAgreed] = useState(true);
  const [maxTotalLimitKrw, setMaxTotalLimitKrw] = useState(1000000);
  const [executionMode, setExecutionMode] = useState('AUTO'); // 'AUTO' | 'MANUAL'
  const [slotLimits, setSlotLimits] = useState({
    1: 50000,
    2: 50000,
    3: 30000,
    4: 30000,
    5: 20000
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user && user.autoTrading) {
      setIsAgreed(user.autoTrading.isAgreed ?? true);
      setMaxTotalLimitKrw(user.autoTrading.maxTotalLimitKrw ?? 1000000);
      setExecutionMode(user.autoTrading.executionMode || 'AUTO');
      if (user.autoTrading.slotLimits) {
        setSlotLimits(prev => ({ ...prev, ...user.autoTrading.slotLimits }));
      }
    } else if (slots && slots.length > 0) {
      const limits = {};
      slots.forEach(s => {
        limits[s.slotId] = s.tradeAmountKrw || 50000;
      });
      setSlotLimits(limits);
    }
  }, [user, slots, isOpen]);

  if (!isOpen) return null;

  const currentTotalSlotAmount = Object.values(slotLimits).reduce((a, b) => Number(a) + Number(b), 0);
  const isLimitExceeded = maxTotalLimitKrw > 0 && currentTotalSlotAmount > maxTotalLimitKrw;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAutoTradingSettings({
        userId: user?.id || 1,
        isAgreed,
        maxTotalLimitKrw,
        executionMode,
        slotLimits
      });

      if (onReloadUser) {
        await onReloadUser();
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save mypage auto trading settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSlotAmountChange = (slotId, amount) => {
    setSlotLimits(prev => ({
      ...prev,
      [slotId]: Number(amount)
    }));
  };

  const setQuickTotalLimit = (amount) => {
    setMaxTotalLimitKrw(amount);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl shadow-black/80 relative space-y-6 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* 1. 상단 프로필 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={user?.profileImage || 'https://raw.githubusercontent.com/wonseokjung/solopreneur-ai-agents/main/agents/youngja/assets/youngja_thumbsup.png'}
                alt=""
                className="w-13 h-13 rounded-2xl border-2 border-indigo-500/40 object-cover"
              />
              {isAdmin && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black shadow">
                  👑
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-100">
                  {user?.nickname || '누리오 마스터 대표님'}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                  {isAdmin ? '마스터 관리자' : user?.tier}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  IP: 49.171.41.10
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                누리오 자동매매 안전 관리 센터 & 개인 맞춤 한도 설정
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. 탭 네비게이션 */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5 text-sm font-bold flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('AUTO_TRADING')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'AUTO_TRADING'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>⚡ 자동매매 동의/한도 설정</span>
          </button>

          <button
            onClick={() => setActiveTab('API_SECURITY')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'API_SECURITY'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>🔑 API 보안</span>
          </button>

          <button
            onClick={() => setActiveTab('MEMBERSHIP')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'MEMBERSHIP'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>💎 멤버십</span>
          </button>
        </div>

        {/* 3. 탭별 상세 콘텐츠 */}

        {/* TAB 1: ⚡ 자동매매 핵심 안전 동의 & 총 운용 한도 설정 */}
        {activeTab === 'AUTO_TRADING' && (
          <div className="space-y-5 animate-in fade-in text-sm text-slate-200">
            {/* 1. 자동매매 서비스 이용 동의 카드 */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isAgreed 
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30' 
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl border shrink-0 ${
                    isAgreed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}>
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-100">
                        알고리즘 자동매매 실행 동의
                      </h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        isAgreed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {isAgreed ? '동의 완료 (ON)' : '미동의 (자동주문 차단됨)'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">
                      업비트 계좌에서 <strong>초단타 급등 신호 포착 및 트레일링 스탑에 의해 자동으로 주문이 집행</strong>되는 것에 동의합니다.
                    </p>
                    {!isAgreed && (
                      <p className="text-xs text-rose-400 font-bold mt-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> 미동의 상태에서는 모든 자동 매수가 차단되며 수동 승인만 가능합니다.
                      </p>
                    )}
                  </div>
                </div>

                {/* 동의 스위치 토글 */}
                <button
                  type="button"
                  onClick={() => setIsAgreed(!isAgreed)}
                  className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer self-end sm:self-center shrink-0 ${
                    isAgreed ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isAgreed ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* 2. 자동매매 총 운용 한도 금액 설정 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-cyan-400" />
                    자동매매 총 운용 한도 금액
                  </h4>
                  <p className="text-sm text-slate-300 mt-0.5">
                    모든 슬롯의 1회 진입금액 합계가 이 총 한도를 초과하지 않도록 안전하게 제한합니다.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <input
                    type="number"
                    step="50000"
                    min="10000"
                    value={maxTotalLimitKrw}
                    onChange={(e) => setMaxTotalLimitKrw(Number(e.target.value))}
                    className="w-36 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-right text-cyan-300 font-mono font-black text-base focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-sm text-slate-300 font-bold">원</span>
                </div>
              </div>

              {/* 퀵 한도 설정 버튼들 */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xs text-slate-400 mr-1 font-semibold">빠른 설정:</span>
                {[300000, 500000, 1000000, 2000000, 5000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickTotalLimit(amt)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs sm:text-sm transition cursor-pointer ${
                      maxTotalLimitKrw === amt
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-black'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {(amt / 10000).toLocaleString()}만원
                  </button>
                ))}
              </div>

              {/* 한도 대비 현재 슬롯 합계 게이지 바 */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-300">슬롯 설정 합계: <strong className="text-white font-mono">{currentTotalSlotAmount.toLocaleString()}원</strong></span>
                  <span className={`font-bold font-mono ${isLimitExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                    한도: {maxTotalLimitKrw.toLocaleString()}원 {isLimitExceeded ? '(한도 초과 ⚠️)' : '(안전 ✅)'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isLimitExceeded 
                        ? 'bg-rose-500' 
                        : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (currentTotalSlotAmount / (maxTotalLimitKrw || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3. 슬롯별 자동매매 허용 금액 설정 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    슬롯별 자동매매 허용 금액 설정
                  </h4>
                  <p className="text-sm text-slate-300 mt-0.5">
                    급등 신호 포착 시 각 슬롯에 배정될 1회 진입금액을 개별 설정합니다.
                  </p>
                </div>
                <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-black">
                  합계: {currentTotalSlotAmount.toLocaleString()}원
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {[1, 2, 3, 4, 5].map((slotId) => {
                  const currentSlot = slots.find(s => s.slotId === slotId);
                  const isEnabled = currentSlot?.isEnabled ?? true;
                  const amount = slotLimits[slotId] || 50000;

                  return (
                    <div key={slotId} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                          <span className="font-bold text-slate-100 text-sm">슬롯 {slotId}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {isEnabled ? '활성' : '비활성'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="5000"
                          min="5000"
                          value={amount}
                          onChange={(e) => handleSlotAmountChange(slotId, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-right text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-slate-300 text-xs shrink-0 font-medium">원</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. 주문 실행 승인 모드 선택 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                급등 포착 시 주문 실행 방식
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                <button
                  type="button"
                  onClick={() => setExecutionMode('AUTO')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    executionMode === 'AUTO'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md ring-1 ring-indigo-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-slate-100 mb-1.5">
                    <span className="flex items-center gap-1.5 text-indigo-300 text-sm sm:text-base">
                      ⚡ 전자동 즉시 체결 (Auto)
                    </span>
                    {executionMode === 'AUTO' && <Check className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    급등 신호 포착 즉시 0.1초 만에 슬롯에 자동 탑승하고 시장가 매수를 집행합니다.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExecutionMode('MANUAL')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    executionMode === 'MANUAL'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-slate-100 mb-1.5">
                    <span className="flex items-center gap-1.5 text-amber-300 text-sm sm:text-base">
                      🛡️ 안전 수동 승인 (Confirm)
                    </span>
                    {executionMode === 'MANUAL' && <Check className="w-5 h-5 text-amber-400" />}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    급등 포착 시 텔레그램 및 화면에 승인 알림을 띄우며, 승인 버튼 클릭 시에만 매수합니다.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 🔑 API 키 및 보안 */}
        {activeTab === 'API_SECURITY' && (
          <div className="space-y-5 animate-in fade-in text-sm text-slate-200">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                  <div>
                    <h4 className="text-base font-black text-slate-100">업비트 Open API 연동 현황</h4>
                    <p className="text-slate-300 text-xs sm:text-sm">AES-256 군사 등급 암호화 보관 중</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4" /> 정상 연결됨
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">등록된 승인 IP:</span>
                  <span className="font-mono text-slate-100 font-black">49.171.41.10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">API 권한:</span>
                  <span className="text-emerald-400 font-bold">자산조회, 주문조회, 주문하기 (출금 불가 안전)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenApiModal) onOpenApiModal();
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>API 키 재등록 / 변경</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: 💎 멤버십 및 이용권 */}
        {activeTab === 'MEMBERSHIP' && (
          <div className="space-y-5 animate-in fade-in text-sm text-slate-200">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-amber-400" />
                  <div>
                    <h4 className="text-base font-black text-slate-100">현재 이용 중인 플랜</h4>
                    <p className="text-slate-300 text-xs sm:text-sm">{user?.role === 'ADMIN' ? '마스터 관리자 영구 라이선스' : user?.tier}</p>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-black text-xs sm:text-sm">
                  {user?.maxSlots || 5}슬롯 무제한
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">동시 가동 슬롯 수:</span>
                  <span className="font-bold text-indigo-400 font-mono">{user?.maxSlots || 5}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">구독 잔여 기간:</span>
                  <span className="font-bold text-yellow-400">{user?.role === 'ADMIN' ? '무제한 평생' : `D-${user?.remainingDays}일`}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenPricing) onOpenPricing();
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>멤버십 플랜 업그레이드</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. 하단 액션 바 */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs sm:text-sm">
          <div className="text-slate-300">
            {isLimitExceeded ? (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> 슬롯 합계가 총 한도를 초과했습니다.
              </span>
            ) : (
              <span>설정 저장 시 슬롯 매니저와 백엔드에 즉시 반영됩니다.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm transition cursor-pointer"
            >
              닫기
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? '저장 완료!' : isSaving ? '저장 중...' : '마이페이지 설정 저장'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
