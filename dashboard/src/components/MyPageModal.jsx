import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  KeyRound, 
  Send, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Crown, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Clock,
  Gift,
  ArrowRight
} from 'lucide-react';
import { 
  registerApiKey, 
  linkTelegram, 
  saveAutoTradingSettings,
  requestUserProfileUpdate 
} from '../services/api';

// 📞 전화번호 자동 하이픈 포맷터 (숫자만 입력 시 010-1234-5678 자동 포맷)
const formatPhoneNumber = (value) => {
  if (!value) return '';
  const numbers = value.replace(/[^0-9]/g, '').slice(0, 11);
  
  if (numbers.length < 4) {
    return numbers;
  } else if (numbers.length < 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length < 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

export default function MyPageModal({ 
  isOpen, 
  onClose, 
  user, 
  hasApiKey = false,
  slots = [], 
  onUpdateSlot, 
  onOpenApiModal,
  onOpenPricing,
  onReloadUser,
  serverIp = '115.68.168.243'
}) {
  const isAdmin = user?.role === 'DEVELOPER' || user?.role === 'ADMIN';
  const isApproved = user?.approvalStatus === 'APPROVED' || isAdmin;

  // 승인 전이면 'APPLY', 승인 후면 'PROFILE'이 기본 탭
  const [activeTab, setActiveTab] = useState(isApproved ? 'PROFILE' : 'APPLY');
  
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
  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && user) {
      setName(user.name || user.nickname || '');
      setPhone(user.phone && user.phone !== '010-0000-0000' ? formatPhoneNumber(user.phone) : '');
      setEmail(user.email || '');
      setNickname(user.nickname || '');
      setTelegramId(user.telegramId || '');
      setProfileSuccessMsg('');
      setProfileErrorMsg('');

      if (!isApproved) {
        setActiveTab('APPLY');
      }

      if (user.autoTrading) {
        setIsAgreed(user.autoTrading.isAgreed ?? true);
        setMaxTotalLimitKrw(user.autoTrading.maxTotalLimitKrw ?? 1000000);
        setExecutionMode(user.autoTrading.executionMode || 'AUTO');
        if (user.autoTrading.slotLimits) {
          setSlotLimits(user.autoTrading.slotLimits);
        }
      } else if (slots && slots.length > 0) {
        const limits = {};
        slots.forEach(s => {
          limits[s.slotId] = s.tradeAmountKrw !== undefined ? s.tradeAmountKrw : 50000;
        });
        setSlotLimits(limits);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentTotalSlotAmount = Object.values(slotLimits).reduce((a, b) => Number(a) + Number(b), 0);
  const isLimitExceeded = maxTotalLimitKrw > 0 && currentTotalSlotAmount > maxTotalLimitKrw;

  // 🎁 무료 사용 승인 신청 / 회원 정보 수정 핸들러
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

      setProfileSuccessMsg(isApproved 
        ? '회원 정보가 성공적으로 수정되었습니다!' 
        : '🎉 3일 무료 사용 신청이 접수되었습니다! 운영자 확인 후 즉시 승인됩니다.');
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error || err.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // 텔레그램 연동 저장
  const handleTelegramSave = async (e) => {
    e.preventDefault();
    if (!telegramId.trim()) return;

    try {
      await linkTelegram(user?.id || 1, telegramId.trim());
      alert('스마트폰 텔레그램 ID가 성공적으로 연동되었습니다!');
      if (onReloadUser) onReloadUser();
    } catch (err) {
      alert('텔레그램 연동 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  // 자동매매 안전 설정 저장
  const handleSaveAutoSettings = async () => {
    setIsSaving(true);
    setIsSaved(false);

    try {
      await saveAutoTradingSettings({
        userId: user?.id || 1,
        isAgreed,
        maxTotalLimitKrw,
        executionMode,
        slotLimits
      });

      if (onUpdateSlot) {
        for (const [slotId, amount] of Object.entries(slotLimits)) {
          await onUpdateSlot(Number(slotId), { tradeAmountKrw: Number(amount) });
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('설정 저장 실패: ' + err.message);
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
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-center text-xl shrink-0">
              {isApproved ? '👤' : '🎁'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-black text-white">
                  {isApproved ? '마이페이지 & 자동매매 설정' : '3일 무료 사용 신청'}
                </h3>
                <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold border whitespace-nowrap ${
                  isApproved 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isApproved ? '승인 완료' : '승인 대기 (PENDING)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isApproved 
                  ? '회원 정보, 업비트 API 키, 텔레그램 알림 및 슬롯별 한도를 관리합니다.' 
                  : '운영자 확인을 위한 기본 정보를 입력하고 3일 무료체험을 신청하세요.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 탭 네비게이션 (모바일/PC 1줄 5분할 정돈) */}
        {isApproved ? (
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 border-b border-slate-800 pb-3">
            {/* 1) 👤 내 정보 */}
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap truncate text-xs sm:text-sm font-bold ${
                activeTab === 'PROFILE'
                  ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">내정보</span>
              <span className="hidden sm:inline">내 정보</span>
            </button>

            {/* 2) 🔑 API 키 */}
            <button
              onClick={() => setActiveTab('API_SECURITY')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap truncate text-xs sm:text-sm font-bold ${
                activeTab === 'API_SECURITY'
                  ? 'bg-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-400/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">API키</span>
              <span className="hidden sm:inline">API 키</span>
            </button>

            {/* 3) ✈️ 텔레그램 */}
            <button
              onClick={() => setActiveTab('TELEGRAM')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap truncate text-xs sm:text-sm font-bold ${
                activeTab === 'TELEGRAM'
                  ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">텔레</span>
              <span className="hidden sm:inline">텔레그램</span>
            </button>

            {/* 4) ⚡ 슬롯 설정 */}
            <button
              onClick={() => setActiveTab('AUTO_TRADING')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap truncate text-xs sm:text-sm font-bold ${
                activeTab === 'AUTO_TRADING'
                  ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">슬롯</span>
              <span className="hidden sm:inline">슬롯 설정</span>
            </button>

            {/* 5) 👑 플랜 */}
            <button
              onClick={() => setActiveTab('PRICING')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap truncate text-xs sm:text-sm font-bold ${
                activeTab === 'PRICING'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">플랜</span>
              <span className="hidden sm:inline">멤버십 플랜</span>
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
        {/* TAB: 👤 내 정보 수정 / 🎁 무료 사용 신청 */}
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
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="숫자만 입력 (예: 01012345678)"
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

            {/* 이용 약관 동의 */}
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-yellow-400 focus:ring-yellow-400 cursor-pointer shrink-0"
                />
                <span>[필수] 개인정보 수집 및 비수탁 자동매매 소프트웨어 이용약관에 동의합니다.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmittingProfile}
              className="w-full py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-400/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmittingProfile ? '처리 중...' : (isApproved ? '회원 정보 수정 저장' : '✨ 3일 무료 사용 승인 신청하기')}</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 1: 🔑 업비트 API 키 관리 (승인 회원 전용) */}
        {/* ========================================================= */}
        {activeTab === 'API_SECURITY' && isApproved && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-bold text-white text-sm">업비트 Open API 연동</h4>
                </div>
                {hasApiKey ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 정상 연결됨
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> 미등록 (연동 필요)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                출금 권한을 제외한 <strong>[자산조회 / 주문조회 / 원화주문]</strong> 권한만 허용하여 키를 발급해 주세요.
              </p>

              {/* 공인 IP 안내 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">업비트 허용 IP 주소:</span>
                <span className="font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  {serverIp}
                </span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenApiModal) onOpenApiModal();
                }}
                className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <KeyRound className="w-4 h-4" />
                <span>{user?.hasApiKey ? '🔑 API 키 재등록 / 변경' : '🔑 지금 바로 API 키 등록하기'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ✈️ 텔레그램 승인 알림 연동 (승인 회원 전용) */}
        {/* ========================================================= */}
        {activeTab === 'TELEGRAM' && isApproved && (
          <form onSubmit={handleTelegramSave} className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">스마트폰 텔레그램 1:1 알림 연동</h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                텔레그램 봇(<code>@nurioh_trade_bot</code>)을 통해 각 슬롯의 매도 손익 정산 알림을 받아보실 수 있습니다.
              </p>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">내 텔레그램 Chat ID</label>
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="예: 5618137472"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                <p><strong>💡 내 Chat ID 찾는 법:</strong></p>
                <p>1. 텔레그램에서 <code>@userinfobot</code>을 검색하여 대화를 시작하세요.</p>
                <p>2. 봇이 알려주는 <strong>Id 숫자</strong>를 복사하여 위 입력창에 넣으시면 됩니다.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Send className="w-4 h-4" />
                <span>텔레그램 연동 저장</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ⚡ 자동매매 슬롯별 한도 설정 (승인 회원 전용) */}
        {/* ========================================================= */}
        {activeTab === 'AUTO_TRADING' && isApproved && (
          <div className="space-y-4 animate-in fade-in text-sm text-slate-200">
            {/* 1. 슬롯별 1회 매수 한도 금액 설정 */}
            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  슬롯별 1회 매수 설정 금액 (KRW)
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  총 배정: <strong className="text-indigo-400 font-bold">{currentTotalSlotAmount.toLocaleString()}원</strong>
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.slice(0, user?.maxSlots || 9).map((slot) => {
                  const currentVal = slotLimits[slot.slotId] ?? (slot.tradeAmountKrw || 50000);
                  return (
                    <div key={slot.slotId} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-200 block truncate">
                          {slot.slotId}번 ({slot.targetMarket ? slot.targetMarket.replace('KRW-', '') : '슬롯'})
                        </span>
                        <span className="text-[10px] text-slate-400">1회 진입금액</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={currentVal}
                          onChange={(e) => handleSlotAmountChange(slot.slotId, e.target.value)}
                          className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-indigo-400"
                        />
                        <span className="text-xs text-slate-400">원</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {isSaved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> 설정이 안전하게 저장되었습니다!
                </span>
              )}
              <button
                onClick={handleSaveAutoSettings}
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <span>{isSaving ? '저장 중...' : '슬롯 한도 설정 저장'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: 👑 멤버십 플랜 안내 (승인 회원 전용) */}
        {/* ========================================================= */}
        {activeTab === 'PRICING' && isApproved && (
          <div className="space-y-4 animate-in fade-in text-sm text-slate-200">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300 font-bold">
                  현재 이용 플랜: <strong className="text-amber-400">{user?.role === 'DEVELOPER' ? '👑 개발자 최고권한' : user?.tier}</strong> ({user?.maxSlots || 9}슬롯)
                </span>
              </div>
              <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                {user?.role === 'DEVELOPER' || user?.role === 'ADMIN' ? '평생 무제한 라이선스' : `D-${user?.remainingDays || 30}일`}
              </span>
            </div>

            {/* 플랜 3종 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1) Free Trial */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">체험용</span>
                  <h5 className="font-extrabold text-white text-sm mt-1.5">무료 체험</h5>
                  <div className="text-lg font-black text-slate-100 mt-1">0원 <span className="text-xs font-normal text-slate-400">/ 3일</span></div>
                  <ul className="text-xs text-slate-400 space-y-1 mt-2.5">
                    <li>✓ 1개 독립 슬롯</li>
                    <li>✓ 검증 추천전략 자동 적용</li>
                    <li>✓ 텔레그램 실시간 매도 정산</li>
                  </ul>
                </div>
              </div>

              {/* 2) Pro */}
              <div className="bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-500/40 flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">인기 👍</span>
                  <h5 className="font-extrabold text-white text-sm mt-1.5">프로 (Pro Trader)</h5>
                  <div className="text-lg font-black text-indigo-300 mt-1">1,000,000원 <span className="text-xs font-normal text-slate-400">/ 월</span></div>
                  <ul className="text-xs text-slate-300 space-y-1 mt-2.5">
                    <li>✓ 3개 멀티 슬롯 동시 운영</li>
                    <li>✓ 실시간 전종목 급등 스캔</li>
                    <li>✓ 트레일링 스탑 자동 익절</li>
                  </ul>
                </div>
              </div>

              {/* 3) VIP */}
              <div className="bg-amber-950/30 p-3.5 rounded-2xl border border-amber-500/40 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">최고급 👑</span>
                  <h5 className="font-extrabold text-white text-sm mt-1.5">VIP 마스터</h5>
                  <div className="text-lg font-black text-amber-300 mt-1">2,000,000원 <span className="text-xs font-normal text-slate-400">/ 월</span></div>
                  <ul className="text-xs text-slate-300 space-y-1 mt-2.5">
                    <li>✓ 9개 슬롯 풀 가동 (3x3 분산)</li>
                    <li>✓ 초단타 스캘핑 & 긴급매도</li>
                    <li>✓ 1:1 전용 기술지원 배정</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 무통장 결제 안내 박스 */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-300">
                <span className="text-slate-400 block text-[10px]">입금 계좌 안내:</span>
                <strong>국민은행 123-456-789012 (예금주: 누리오)</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('국민은행 123-456-789012 (예금주: 누리오)');
                  alert('계좌번호가 복사되었습니다!');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>복사</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
