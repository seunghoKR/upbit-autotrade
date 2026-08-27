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
  Info,
  Clock,
  Phone,
  Mail,
  FileText,
  Gift
} from 'lucide-react';
import { saveAutoTradingSettings, requestUserProfileUpdate } from '../services/api';

export default function MyPageModal({ 
  isOpen, 
  onClose, 
  user, 
  slots = [], 
  onUpdateSlot, 
  onOpenApiModal,
  onOpenPricing,
  onReloadUser,
  serverIp = '115.68.168.243'
}) {
  const isAdmin = user?.role === 'DEVELOPER' || user?.role === 'ADMIN';
  const isApproved = user?.approvalStatus === 'APPROVED' || isAdmin;

  // 승인 전이면 기본 탭을 'APPLY', 승인 후면 'API_SECURITY'
  const [activeTab, setActiveTab] = useState(isApproved ? 'API_SECURITY' : 'APPLY');
  
  // 1. 프로필 & 무료체험 신청 폼 상태
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // 2. 자동매매 핵심 설정 상태
  const [isAgreed, setIsAgreed] = useState(true);
  const [maxTotalLimitKrw, setMaxTotalLimitKrw] = useState(1000000);
  const [executionMode, setExecutionMode] = useState('AUTO'); // 'AUTO' | 'MANUAL'
  const [slotLimits, setSlotLimits] = useState({
    1: 50000, 2: 50000, 3: 30000, 4: 30000, 5: 20000
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || user.nickname || '');
      setPhone(user.phone && user.phone !== '010-0000-0000' ? user.phone : '');
      setEmail(user.email || '');
      setNickname(user.nickname || '');
      setTelegramId(user.telegramId || '');

      if (!isApproved) {
        setActiveTab('APPLY');
      }

      if (user.autoTrading) {
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
    }
  }, [user, slots, isOpen, isApproved]);

  if (!isOpen) return null;

  const currentTotalSlotAmount = Object.values(slotLimits).reduce((a, b) => Number(a) + Number(b), 0);
  const isLimitExceeded = maxTotalLimitKrw > 0 && currentTotalSlotAmount > maxTotalLimitKrw;

  // 🎁 무료 사용 승인 신청 핸들러
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setProfileErrorMsg('활동 닉네임을 입력해 주세요.');
      return;
    }
    if (!name.trim()) {
      setProfileErrorMsg('실명(이름)을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      setProfileErrorMsg('연락처(휴대폰 번호)를 입력해 주세요.');
      return;
    }
    if (!agreedTerms) {
      setProfileErrorMsg('서비스 이용 약관에 동의해 주세요.');
      return;
    }

    setIsSubmittingProfile(true);
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    try {
      await requestUserProfileUpdate({
        userId: user?.id || 1,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        nickname: nickname.trim(),
        telegramId: telegramId.trim()
      });

      if (onReloadUser) {
        await onReloadUser();
      }

      setProfileSuccessMsg('🎉 운영자에게 무료 사용 승인 요청이 성공적으로 접수되었습니다! 운영자 승인 즉시 3일 무료체험이 활성화됩니다.');
      setTimeout(() => {
        setProfileSuccessMsg('');
      }, 5000);
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error || err.message || '신청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // ⚡ 자동매매 한도 저장 핸들러
  const handleAutoTradingSave = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl shadow-black/80 relative space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* 1. 상단 헤더 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-center text-xl shrink-0">
              {isApproved ? '👤' : '🎁'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {isApproved ? '마이페이지 & 자동매매 설정' : '3일 무료 사용 신청'}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  isApproved 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isApproved ? '승인 완료' : '승인 대기 (PENDING)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isApproved 
                  ? '업비트 API 키 등록, 텔레그램 연동 및 슬롯별 매매 한도를 관리합니다.' 
                  : '운영자 확인을 위한 기본 정보를 입력하고 3일 무료체험을 신청하세요.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. 탭 네비게이션 */}
        {isApproved ? (
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs sm:text-sm font-bold flex-wrap">
            <button
              onClick={() => setActiveTab('API_SECURITY')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'API_SECURITY'
                  ? 'bg-yellow-400 text-slate-950 font-black shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>🔑 API 키 등록</span>
            </button>

            <button
              onClick={() => setActiveTab('TELEGRAM')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'TELEGRAM'
                  ? 'bg-indigo-600 text-white font-black shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>✈️ 텔레그램 알림</span>
            </button>

            <button
              onClick={() => setActiveTab('AUTO_TRADING')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'AUTO_TRADING'
                  ? 'bg-indigo-600 text-white font-black shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>⚡ 한도/슬롯 설정</span>
            </button>

            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PROFILE'
                  ? 'bg-indigo-600 text-white font-black shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>👤 내 정보 수정</span>
            </button>
          </div>
        ) : (
          /* 승인 전에는 무료 사용 신청 탭만 안내 */
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>운영자 승인이 완료된 후 <strong>API 키 등록 및 텔레그램 연동</strong>이 활성화됩니다.</span>
            </span>
          </div>
        )}

        {/* 3. 탭별 상세 콘텐츠 */}

        {/* ========================================================= */}
        {/* TAB: 🎁 무료 사용 신청 (승인 전 기본) / 👤 내 정보 수정 (승인 후) */}
        {/* ========================================================= */}
        {(activeTab === 'APPLY' || activeTab === 'PROFILE') && (
          <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in fade-in text-sm text-slate-200">
            {profileSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-black text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-yellow-400" />
                {isApproved ? '내 회원 정보' : '무료 사용 신청자 정보'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    이름 (실명) <span className="text-yellow-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    활동 닉네임 <span className="text-yellow-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="예: 스마트트레이더"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    연락처 (휴대폰 번호) <span className="text-yellow-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예: 010-1234-5678"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    카카오 이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="예: trader@kakao.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-yellow-400 focus:ring-yellow-400 cursor-pointer"
                />
                <span>[필수] 개인정보 수집 및 비수탁 자동매매 소프트웨어 이용약관에 동의합니다.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmittingProfile}
              className="w-full py-3.5 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-sm transition shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>
                {isSubmittingProfile 
                  ? '접수 처리 중...' 
                  : (isApproved ? '회원 정보 수정 저장' : '✨ 3일 무료 사용 승인 신청하기')}
              </span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB: 🔑 업비트 API 키 등록 & 보안 (승인 완료 후) */}
        {/* ========================================================= */}
        {isApproved && activeTab === 'API_SECURITY' && (
          <div className="space-y-4 animate-in fade-in text-sm text-slate-200">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                  <div>
                    <h4 className="text-base font-black text-slate-100">업비트 Open API 연동</h4>
                    <p className="text-slate-400 text-xs">AES-256 군사 등급 암호화 보관 중</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4" /> 승인 서버 IP: {serverIp}
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">업비트 등록 IP:</span>
                  <span className="font-mono text-cyan-300 font-bold">{serverIp}</span>
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
                className="w-full py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-400/20"
              >
                <KeyRound className="w-4 h-4" />
                <span>🔑 업비트 API 키 등록 / 변경하기</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: ✈️ 텔레그램 알림 연동 (승인 완료 후) */}
        {/* ========================================================= */}
        {isApproved && activeTab === 'TELEGRAM' && (
          <div className="space-y-4 animate-in fade-in text-sm text-slate-200">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Send className="w-6 h-6 text-sky-400" />
                <div>
                  <h4 className="text-base font-black text-slate-100">텔레그램 실시간 급등/수익 알림</h4>
                  <p className="text-slate-400 text-xs">급등 포착 및 매도 익절 결과를 스마트폰으로 즉시 전송합니다.</p>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">텔레그램 사용자 ID (@아이디)</label>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="예: nurioh_trader"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <p className="text-slate-400 leading-relaxed">
                  💡 텔레그램에서 <strong>@nurioh_trade_bot</strong>을 검색하여 <code>/start</code>를 누르시면 실시간 알림이 시작됩니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleProfileSubmit}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Save className="w-4 h-4" />
                <span>텔레그램 ID 저장</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: ⚡ 자동매매 한도/슬롯 설정 (승인 완료 후) */}
        {/* ========================================================= */}
        {isApproved && activeTab === 'AUTO_TRADING' && (
          <div className="space-y-4 animate-in fade-in text-sm text-slate-200">
            {/* 총 한도 */}
            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-cyan-400" />
                    자동매매 총 운용 한도 금액
                  </h4>
                  <p className="text-xs text-slate-400">모든 슬롯의 1회 진입금액 합계 한도입니다.</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <input
                    type="number"
                    step="50000"
                    min="10000"
                    value={maxTotalLimitKrw}
                    onChange={(e) => setMaxTotalLimitKrw(Number(e.target.value))}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right text-cyan-300 font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">원</span>
                </div>
              </div>
            </div>

            {/* 슬롯별 금액 */}
            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  슬롯별 1회 매수 배정 금액
                </h4>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  합계: {currentTotalSlotAmount.toLocaleString()}원
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((slotId) => {
                  const amount = slotLimits[slotId] || 50000;
                  return (
                    <div key={slotId} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-slate-300 text-xs">슬롯 {slotId}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="5000"
                          value={amount}
                          onChange={(e) => handleSlotAmountChange(slotId, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono font-bold text-xs"
                        />
                        <span className="text-slate-400 text-[10px]">원</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleAutoTradingSave}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? '저장 완료!' : isSaving ? '저장 중...' : '한도 및 슬롯 설정 저장'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
