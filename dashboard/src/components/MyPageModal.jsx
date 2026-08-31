import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  KeyRound, 
  Send, 
  Crown, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  AlertTriangle,
  Sparkles,
  Clock,
  CheckCircle2,
  BellRing,
  Download,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Play,
  Save,
  Lock
} from 'lucide-react';
import { requestUserProfileUpdate, linkTelegram, updateTelegramNotifySettings, getTelegramConfig, updateTelegramBotToken, sendTelegramTestMessage } from '../services/api';
import { soundService } from '../services/soundService';

export default function MyPageModal({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser,
  onOpenApiModal,
  onReloadUser,
  serverIp = '115.68.168.243' 
}) {
  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE (내 정보 & API 키) | APP_SOUND | TELEGRAM | PRICING
  
  // 폼 상태
  const [name, setName] = useState(user?.name || user?.nickname || '');
  const [phone, setPhone] = useState(user?.phone && user?.phone !== '010-0000-0000' ? user.phone : '');
  const [email, setEmail] = useState(user?.email || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [telegramId, setTelegramId] = useState(user?.telegramId || '');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // 🔔 텔레그램 세부 맞춤 알림 상태 (기본값 ON)
  const [notifySettings, setNotifySettings] = useState({
    notifyProfit: true,
    notifyStoploss: true,
    notifyBuy: false,
    notifyPanic: true,
    notifyMembership: true
  });
  const [isSavingNotifySettings, setIsSavingNotifySettings] = useState(false);
  const [notifySettingsMsg, setNotifySettingsMsg] = useState('');

  // ✈️ 텔레그램 내 알림 즉시 테스트 상태
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestMsg, setTelegramTestMsg] = useState('');

  // 🤖 텔레그램 봇 토큰 설정 상태 (개발자 최고권한 전용)
  const [botConfig, setBotConfig] = useState(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [isSavingBotToken, setIsSavingBotToken] = useState(false);
  const [botTokenMsg, setBotTokenMsg] = useState('');

  // 🔊 사운드(소리 알림) 상태
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [soundTestSuccess, setSoundTestSuccess] = useState('');

  // 📱 PWA 앱 설치 상태
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // 로딩 및 메시지
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  const isApproved = user?.isApproved !== false && user?.approvalStatus !== 'PENDING';
  const hasApiKey = Boolean(user?.hasApiKey);

  // 휴대폰 번호 자동 하이픈 포맷터
  const formatPhoneNumber = (val) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
  };

  const prevIsOpenRef = useRef(false);

  // PWA 설치 이벤트 리스너 감지
  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(Boolean(checkStandalone));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    soundService.setEnabled(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      soundService.playTone(880, 'sine', 0.1, 0, 0.1);
    }
  };

  const handleTestSound = (type, label) => {
    soundService.testSound(type);
    setSoundTestSuccess(`🔊 [${label}] 효과음이 재생되었습니다.`);
    setTimeout(() => setSoundTestSuccess(''), 2500);
  };

  const handleInstallApp = async () => {
    const promptEvent = pwaPrompt || window.deferredPwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        window.deferredPwaPrompt = null;
        setPwaPrompt(null);
      }
    } else {
      alert('💡 PC/모바일 브라우저 주소창 우측의 [앱 설치] 아이콘 또는\n스마트폰 하단 [공유] > "홈 화면에 추가"를 선택하시면 즉시 전용 앱으로 설치됩니다! ✨');
    }
  };

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && user) {
      setName(user.name || user.nickname || '');
      setPhone(user.phone && user.phone !== '010-0000-0000' ? formatPhoneNumber(user.phone) : '');
      setEmail(user.email || '');
      setNickname(user.nickname || '');
      setTelegramId(user.telegramId || '');
      setProfileSuccessMsg('');
      setProfileErrorMsg('');

      const defaultNotify = {
        notifyProfit: true,
        notifyStoploss: true,
        notifyBuy: false,
        notifyPanic: true,
        notifyMembership: true
      };
      setNotifySettings(user.telegramNotifySettings ? { ...defaultNotify, ...user.telegramNotifySettings } : defaultNotify);
      setNotifySettingsMsg('');

      if (!isApproved) {
        setActiveTab('APPLY');
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, user, isApproved]);

  const loadBotConfig = async () => {
    try {
      const res = await getTelegramConfig();
      if (res && res.success) {
        setBotConfig(res);
        if (res.botToken) {
          setBotTokenInput(res.botToken);
        }
      }
    } catch (err) {
      console.error('Failed to load telegram config:', err);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'TELEGRAM') {
      loadBotConfig();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // 📝 무료 사용 승인 신청 / 회원 정보 수정 핸들러
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
      const res = await requestUserProfileUpdate({
        userId: user?.id || 1,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        nickname: nickname.trim(),
        telegramId: telegramId.trim()
      });

      const updatedUserData = res?.user || {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        nickname: nickname.trim(),
        telegramId: telegramId.trim()
      };

      if (localStorage.getItem('nurioh_remember_me') === 'true') {
        localStorage.setItem('nurioh_user_profile', JSON.stringify(updatedUserData));
      } else {
        sessionStorage.setItem('nurioh_user_profile', JSON.stringify(updatedUserData));
      }

      if (onUpdateUser) {
        onUpdateUser(updatedUserData);
      }

      if (onReloadUser) {
        await onReloadUser();
      }

      setProfileSuccessMsg(isApproved 
        ? '회원 정보가 성공적으로 수정되었습니다.' 
        : '✨ 3일 무료 사용 신청이 접수되었습니다! 운영자 확인 후 즉시 승인됩니다.');
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error || err.message || '신청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // 텔레그램 연동 저장
  const handleTelegramSave = async (e) => {
    if (e) e.preventDefault();
    if (!telegramId.trim()) return;

    try {
      await linkTelegram(user?.id || 1, telegramId.trim(), notifySettings);
      alert('스마트폰 텔레그램 ID 및 맞춤 알림 설정이 성공적으로 저장되었습니다!');
      if (onReloadUser) onReloadUser();
    } catch (err) {
      alert('텔레그램 연동 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  // 🔔 텔레그램 맞춤 알림 토글 & 즉시 저장 핸들러
  const toggleNotifySetting = (key) => {
    setNotifySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveNotifySettings = async () => {
    setIsSavingNotifySettings(true);
    setNotifySettingsMsg('');
    try {
      const res = await updateTelegramNotifySettings(user?.id || 1, notifySettings);
      setNotifySettingsMsg('✅ ' + (res?.message || '맞춤 알림 설정이 성공적으로 저장되었습니다!'));
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          telegramNotifySettings: notifySettings
        });
      }
      if (onReloadUser) onReloadUser();
    } catch (err) {
      setNotifySettingsMsg('❌ 저장 실패: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingNotifySettings(false);
    }
  };

  // ✈️ 텔레그램 테스트 알림 즉시 발송
  const handleTestMyTelegram = async () => {
    if (!telegramId.trim()) {
      alert('먼저 텔레그램 Chat ID를 입력하고 저장해 주세요.');
      return;
    }
    setIsTestingTelegram(true);
    setTelegramTestMsg('');
    try {
      const res = await sendTelegramTestMessage(user?.id || 1);
      setTelegramTestMsg('✅ ' + (res?.message || '텔레그램 테스트 메시지가 전송되었습니다! 텔레그램 앱을 확인해 보세요.'));
    } catch (err) {
      setTelegramTestMsg('❌ 전송 실패: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // 🤖 운영자/개발자 전용: 텔레그램 봇 토큰 저장 및 검증
  const handleSaveBotToken = async (e) => {
    if (e) e.preventDefault();
    if (!botTokenInput.trim()) {
      alert('봇 토큰을 입력해 주세요.');
      return;
    }
    setIsSavingBotToken(true);
    setBotTokenMsg('');
    try {
      const res = await updateTelegramBotToken(botTokenInput.trim());
      setBotTokenMsg('✅ ' + (res?.message || '봇 토큰이 검증 및 저장되었습니다!'));
      loadBotConfig();
    } catch (err) {
      setBotTokenMsg('❌ 저장 실패: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingBotToken(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl shadow-black/80 relative space-y-4 my-auto max-h-[95vh] overflow-y-auto flex flex-col justify-between min-h-[580px] sm:min-h-[620px]">
        
        {/* 1. 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-center text-lg sm:text-xl shrink-0">
              {isApproved ? '👤' : '🎁'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
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

        {/* 2. 탭 네비게이션 (4분할로 깔끔하게 정리!) */}
        {isApproved ? (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 border-b border-slate-800 pb-3 shrink-0">
            {/* 1) 👤 내 정보 & API 키 */}
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-xs font-bold ${
                activeTab === 'PROFILE' || activeTab === 'API_SECURITY'
                  ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>내 정보 &amp; API 키</span>
            </button>

            {/* 2) 📲 앱 & 소리 */}
            <button
              onClick={() => setActiveTab('APP_SOUND')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-xs font-bold ${
                activeTab === 'APP_SOUND'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                  : 'bg-slate-950 text-emerald-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>앱 &amp; 소리</span>
            </button>

            {/* 3) ✈️ 텔레그램 */}
            <button
              onClick={() => setActiveTab('TELEGRAM')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-xs font-bold ${
                activeTab === 'TELEGRAM'
                  ? 'bg-cyan-600 text-white font-black shadow-md shadow-cyan-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>텔레그램</span>
            </button>

            {/* 4) 👑 플랜 */}
            <button
              onClick={() => setActiveTab('PRICING')}
              className={`py-2 px-1 sm:px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-xs font-bold ${
                activeTab === 'PRICING'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span>플랜</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>운영자 승인이 완료된 후 <strong>API 키 등록 및 텔레그램 연동</strong>이 활성화됩니다.</span>
            </span>
          </div>
        )}

        {/* 3. 탭별 상세 콘텐츠 (모든 탭 동일한 높이 밸런스 유지) */}
        <div className="flex-1 flex flex-col justify-between">

          {/* ========================================================= */}
          {/* TAB 1: 👤 내 정보 & 🔑 API 키 통합 관리 */}
          {/* ========================================================= */}
          {(activeTab === 'APPLY' || activeTab === 'PROFILE' || activeTab === 'API_SECURITY') && (
            <div className="space-y-3 animate-in fade-in text-sm text-slate-200">
              
              {/* 💡 [신규] 시스템 사용 권한 승인 및 보안 필수 안내 배너 */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-indigo-950/30 to-slate-950 border border-amber-500/40 space-y-1.5 shadow-md">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <h5 className="font-bold text-xs sm:text-sm text-amber-300">
                    💡 자동매매 시스템 이용 승인 및 보안 필수 안내
                  </h5>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  NURIOH 자동매매 시스템의 안전한 운영과 계정 보안을 위해 
                  <strong className="text-amber-300"> 실명, 활동 닉네임, 연락처(전화번호)</strong> 및 
                  <strong className="text-yellow-400"> 업비트 Open API 키</strong>를 정확히 입력해 주셔야 <strong>정상 사용 권한이 승인</strong>됩니다.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-slate-400 border-t border-slate-800/80">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Lock className="w-3 h-3" />
                    <span>최소한의 개인정보는 안전한 계정 식별 및 시스템 보안을 위해 필수로 수집됩니다.</span>
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Send className="w-3 h-3" />
                    <span>텔레그램은 실시간 매매 알림용으로 선택 사항입니다.</span>
                  </span>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}
              {profileErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              {/* 1. 회원 정보 폼 */}
              <form onSubmit={handleProfileSubmit} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{isApproved ? '내 회원 정보' : '무료 사용 신청자 정보'}</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">필수 항목(*)을 확인하세요</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      이름 (실명) <span className="text-yellow-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 홍길동"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-bold text-xs focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      활동 닉네임 <span className="text-yellow-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="예: 스마트트레이더"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-bold text-xs focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      연락처 (휴대폰 번호) <span className="text-yellow-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      placeholder="숫자만 입력 (예: 01012345678)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      카카오 이메일
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="예: trader@kakao.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-yellow-400 focus:ring-yellow-400 cursor-pointer shrink-0"
                    />
                    <span>[필수] 개인정보 수집 및 자동매매 이용약관 동의</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSubmittingProfile ? '저장 중...' : (isApproved ? '회원 정보 수정 저장' : '✨ 3일 무료 사용 신청')}</span>
                  </button>
                </div>
              </form>

              {/* 2. 🔑 업비트 Open API 연동 카드 (승인 회원용) */}
              {isApproved && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-yellow-400" />
                      <h4 className="font-bold text-white text-xs">업비트 Open API 연동</h4>
                    </div>
                    {hasApiKey ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> 정상 연결됨
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> 미등록 (연동 필요)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span>업비트 허용 IP 주소:</span>
                      <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                        {serverIp}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenApiModal) onOpenApiModal();
                      }}
                      className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{user?.hasApiKey ? 'API 키 재등록 / 변경' : '지금 바로 API 키 등록하기'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: 📲 앱 설치 & 🔊 실시간 소리 알림 (기준 사이즈) */}
          {/* ========================================================= */}
          {activeTab === 'APP_SOUND' && isApproved && (
            <div className="space-y-3.5 animate-in fade-in text-sm text-slate-200">
              {/* 1. 📱 PC & 모바일 전용 앱(PWA) 원클릭 설치 안내 카드 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/40 space-y-2.5 shadow-md shadow-emerald-500/10">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm border border-emerald-500/30">
                      📲
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">PC &amp; 모바일 전용 앱(PWA) 설치 안내</h4>
                      <p className="text-[10px] text-slate-400">앱스토어 다운로드 없이 바탕화면 &amp; 홈 화면에 바로 설치</p>
                    </div>
                  </div>
                  {isStandalone ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 앱 실행 중
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/40">
                      브라우저 모드
                    </span>
                  )}
                </div>

                {/* 혜택 3종 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-0.5">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-0.5">
                    <div className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                      <Smartphone className="w-3.5 h-3.5" /> 원클릭 바로가기
                    </div>
                    <p className="text-[10px] text-slate-400">바탕화면/홈에 NURIOH 생성</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-0.5">
                    <div className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                      <Monitor className="w-3.5 h-3.5" /> 풀스크린 대시보드
                    </div>
                    <p className="text-[10px] text-slate-400">주소창 없는 단독 앱 창</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-0.5">
                    <div className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                      <Volume2 className="w-3.5 h-3.5" /> 백그라운드 알림
                    </div>
                    <p className="text-[10px] text-slate-400">창을 내려도 사운드 수신</p>
                  </div>
                </div>

                {/* 원클릭 설치 버튼 */}
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/25 active:scale-98"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isStandalone ? '전용 앱 재설치 / 바로가기 확인' : '📲 지금 바로 PC / 모바일에 전용 앱 설치하기'}</span>
                </button>
              </div>

              {/* 2. 🔊 실시간 트레이딩 사운드(소리) 효과음 알림 카드 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/40 space-y-2.5 shadow-md shadow-indigo-500/10">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm border border-amber-500/30">
                      🔊
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">실시간 사운드(소리) 효과음 알림</h4>
                      <p className="text-[10px] text-slate-400">급등 포착, 매수 체결, 익절/손절 시 0.001초 즉각 사운드</p>
                    </div>
                  </div>

                  {/* 소리 마스터 토글 스위치 */}
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      soundEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title={soundEnabled ? '클릭하여 무음으로 전환' : '클릭하여 소리 알림 켜기'}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>소리 켜짐 (ON)</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                        <span>무음 (OFF)</span>
                      </>
                    )}
                  </button>
                </div>

                {soundTestSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{soundTestSuccess}</span>
                  </div>
                )}

                {/* 4종 사운드 미리듣기 버튼 그리드 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-200 block">🚨 급등 포착 경보</span>
                      <span className="text-[9px] text-slate-400">2단 레이더음</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestSound('SURGE', '급등 포착 경보음')}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>듣기</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-200 block">⚡ 매수 체결음</span>
                      <span className="text-[9px] text-slate-400">3단 상승 차임</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestSound('BUY', '매수 체결음')}
                      className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400" />
                      <span>듣기</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-200 block">🎉 익절 매도 승리음</span>
                      <span className="text-[9px] text-slate-400">도-미-솔-도 카칭!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestSound('PROFIT', '익절 매도 승리음')}
                      className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                      <span>듣기</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-200 block">🛡️ 손절 방어 경보음</span>
                      <span className="text-[9px] text-slate-400">2단 저음 방어</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestSound('LOSS', '손절 방어 경보음')}
                      className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-blue-400 text-blue-400" />
                      <span>듣기</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ✈️ 텔레그램 승인 알림 연동 (컴팩트 2열 그리드 디자인) */}
          {/* ========================================================= */}
          {activeTab === 'TELEGRAM' && isApproved && (
            <div className="space-y-3 animate-in fade-in text-sm text-slate-200">
              {/* 1. 회원 본인의 1:1 텔레그램 Chat ID 연동 & 2단계 가이드 카드 */}
              <form onSubmit={handleTelegramSave} className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-xs sm:text-sm">스마트폰 텔레그램 1:1 알림 연동</h4>
                  </div>
                  {user?.telegramId ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      연동 완료 (ID: {user.telegramId})
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      미연동
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="내 Chat ID 입력 (예: 5948452939)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow whitespace-nowrap"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>저장</span>
                  </button>
                  <button
                    type="button"
                    disabled={isTestingTelegram || !telegramId.trim()}
                    onClick={handleTestMyTelegram}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer border border-cyan-500/30 whitespace-nowrap"
                    title="입력된 Chat ID로 텔레그램 테스트 메시지를 발송합니다"
                  >
                    <Send className={`w-3 h-3 ${isTestingTelegram ? 'animate-spin' : ''}`} />
                    <span>{isTestingTelegram ? '발송 중...' : '테스트 발송'}</span>
                  </button>
                </div>

                {/* 2단계 간편 가이드 (컴팩트 가로 정렬) */}
                <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span>봇과 대화 시작 (필수):</span>
                    <a 
                      href="https://t.me/nurioh_trade_bot" 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition"
                    >
                      <span>@nurioh_trade_bot [시작]</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span>Chat ID 확인:</span>
                    <a 
                      href="https://t.me/userinfobot" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-cyan-400 underline font-bold text-[10px]"
                    >
                      @userinfobot (ID 확인)
                    </a>
                  </div>
                </div>

                {telegramTestMsg && (
                  <div className={`p-2 rounded-xl text-xs font-medium border ${
                    telegramTestMsg.startsWith('✅')
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                  }`}>
                    {telegramTestMsg}
                  </div>
                )}
              </form>

              {/* 2. 🔔 맞춤 텔레그램 알림 수신 설정 (2열 2행 미니 카드) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <BellRing className="w-4 h-4 text-yellow-400" />
                    <h4 className="font-bold text-white text-xs sm:text-sm">🔔 맞춤 텔레그램 알림 수신 설정</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveNotifySettings}
                    disabled={isSavingNotifySettings}
                    className="px-3 py-1 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSavingNotifySettings ? '저장 중...' : '설정 저장'}</span>
                  </button>
                </div>

                {/* 2열 2행 컴팩트 알림 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1. 익절 매도 정산 알림 */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎉</span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">익절 매도 정산</span>
                        <span className="text-[10px] text-slate-400">트레일링 익절 완료 시</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotifySetting('notifyProfit')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${notifySettings.notifyProfit ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                    >
                      <span className="bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 2. 손절 방어 매도 알림 */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🛡️</span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">손절 방어 매도</span>
                        <span className="text-[10px] text-slate-400">손실 제한 안전 방어 시</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotifySetting('notifyStoploss')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${notifySettings.notifyStoploss ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                    >
                      <span className="bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 3. 급등 포착 & 매수 체결 */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">급등 매수 체결</span>
                        <span className="text-[10px] text-slate-400">자동 매수 체결 시</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotifySetting('notifyBuy')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${notifySettings.notifyBuy ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                    >
                      <span className="bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 4. 멤버십 및 입금 승인 알림 */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💳</span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">멤버십 &amp; 연장</span>
                        <span className="text-[10px] text-slate-400">입금 확인 및 만료 안내</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotifySetting('notifyMembership')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${notifySettings.notifyMembership ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                    >
                      <span className="bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform" />
                    </button>
                  </div>
                </div>

                {notifySettingsMsg && (
                  <div className={`p-2 rounded-xl text-xs font-medium border ${
                    notifySettingsMsg.startsWith('✅')
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                  }`}>
                    {notifySettingsMsg}
                  </div>
                )}
              </div>

              {/* 3. 👑 최고 개발자 전용: 텔레그램 봇 토큰(BotFather Token) 관리 */}
              {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
                <form onSubmit={handleSaveBotToken} className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-amber-500/40 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-white text-xs sm:text-sm">🤖 봇 토큰 관리 (개발자 전용)</h4>
                    </div>
                    {botConfig?.isValid ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        ✅ @{botConfig.botInfo?.username || '봇'} 정상
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 animate-pulse">
                        ⚠️ 토큰 확인 필요
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={botTokenInput}
                      onChange={(e) => setBotTokenInput(e.target.value)}
                      placeholder="텔레그램 BotFather 발급 토큰"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="submit"
                      disabled={isSavingBotToken}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow whitespace-nowrap"
                    >
                      <Check className="w-3 h-3" />
                      <span>{isSavingBotToken ? '검증 중...' : '저장'}</span>
                    </button>
                  </div>

                  {botTokenMsg && (
                    <div className={`p-2 rounded-xl text-xs font-medium border ${
                      botTokenMsg.startsWith('✅')
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                    }`}>
                      {botTokenMsg}
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: 👑 멤버십 플랜 안내 (승인 회원 전용) */}
          {/* ========================================================= */}
          {activeTab === 'PRICING' && isApproved && (
            <div className="space-y-3.5 animate-in fade-in text-sm text-slate-200">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1) Free Trial */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">체험용</span>
                    <h5 className="font-extrabold text-white text-sm mt-1">무료 체험</h5>
                    <div className="text-base sm:text-lg font-black text-slate-100 mt-0.5">0원 <span className="text-xs font-normal text-slate-400">/ 3일</span></div>
                    <ul className="text-[11px] text-slate-400 space-y-1 mt-2">
                      <li>✓ 1개 독립 슬롯</li>
                      <li>✓ 추천전략 자동 적용</li>
                      <li>✓ 텔레그램 매도 정산</li>
                    </ul>
                  </div>
                </div>

                {/* 2) Pro */}
                <div className="bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-500/40 flex flex-col justify-between space-y-2.5 relative overflow-hidden">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">인기 👍</span>
                    <h5 className="font-extrabold text-white text-sm mt-1">프로 (Pro)</h5>
                    <div className="text-base sm:text-lg font-black text-indigo-300 mt-0.5">1,000,000원 <span className="text-xs font-normal text-slate-400">/ 월</span></div>
                    <ul className="text-[11px] text-slate-300 space-y-1 mt-2">
                      <li>✓ 3개 멀티 슬롯 운영</li>
                      <li>✓ 전종목 실시간 스캔</li>
                      <li>✓ 트레일링 스탑 익절</li>
                    </ul>
                  </div>
                </div>

                {/* 3) VIP */}
                <div className="bg-amber-950/30 p-3.5 rounded-2xl border border-amber-500/40 flex flex-col justify-between space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">최고급 👑</span>
                    <h5 className="font-extrabold text-white text-sm mt-1">VIP 마스터</h5>
                    <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5">2,000,000원 <span className="text-xs font-normal text-slate-400">/ 월</span></div>
                    <ul className="text-[11px] text-slate-300 space-y-1 mt-2">
                      <li>✓ 9개 슬롯 풀 가동</li>
                      <li>✓ 초단타 &amp; 긴급매도</li>
                      <li>✓ 1:1 전용 기술지원</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 무통장 결제 안내 박스 */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
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
    </div>
  );
}
