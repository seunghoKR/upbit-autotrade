import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BalanceCard from './components/BalanceCard';
import ChartView from './components/ChartView';
import SlotManager from './components/SlotManager';
import PanicSellModal from './components/PanicSellModal';
import TradeLogs from './components/TradeLogs';
import TwoFactorModal from './components/TwoFactorModal';
import GuideModal from './components/GuideModal';
import PwaInstallPrompt from './components/PwaInstallPrompt';

// 회원제 & SaaS 모달 컴포넌트
import SubscriptionCard from './components/SubscriptionCard';
import KakaoAuthModal from './components/KakaoAuthModal';
import UpbitGuideModal from './components/UpbitGuideModal';
import ApiRegistrationModal from './components/ApiRegistrationModal';
import PricingModal from './components/PricingModal';
import AdminUserManagement from './components/AdminUserManagement';

// 🛠️ 개발자 모드 스위처 & 📊 사이트 운영자 대시보드 & 🛠️ 개발자 시스템 대시보드
import DevModeSwitcher from './components/DevModeSwitcher';
import OperatorDashboardModal from './components/OperatorDashboardModal';
import DeveloperDashboardModal from './components/DeveloperDashboardModal';
import SettingsModal from './components/SettingsModal';
import MyPageModal from './components/MyPageModal';
import ManualModal from './components/ManualModal';

import {
  getBotStatus,
  getCandles,
  updateSettings,
  startBot,
  stopBot,
  triggerMockSurge,
  getSlots,
  updateSlotConfig,
  sellSlotPosition,
  panicSellAll,
  approveTrade,
  rejectTrade,
  getUserProfile,
  loginWithKakao,
  registerApiKey
} from './services/api';

export default function App() {
  const [botRunning, setBotRunning] = useState(false);
  const [serverIp, setServerIp] = useState('49.171.41.10');
  
  // 모달 상태 관리
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPanicSellOpen, setIsPanicSellOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState(false);
  const [isUpbitGuideOpen, setIsUpbitGuideOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [isOperatorDashboardOpen, setIsOperatorDashboardOpen] = useState(false);
  const [isDevDashboardOpen, setIsDevDashboardOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [is2FAActive, setIs2FAActive] = useState(false);

  // 🛠️ 선택된 슬롯 ID (차트 연동용, 기본 1번 슬롯)
  const [selectedSlotId, setSelectedSlotId] = useState(1);

  // 🛠️ 대표님이 직접 선택한 DEV 모드 유지 상태 (자동 리셋 방지)
  const [devModeOverride, setDevModeOverride] = useState(null);
  const devModeRef = useRef(devModeOverride);
  devModeRef.current = devModeOverride;

  // 회원 상태 (기본 대표님 계정)
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    kakaoId: 'admin_nurioh_ceo',
    name: '누리오 마스터',
    nickname: '누리오 마스터 대표님',
    role: 'ADMIN',
    tier: 'VIP',
    maxSlots: 5,
    remainingDays: 9999,
    hasApiKey: true,
    profileImage: 'https://raw.githubusercontent.com/wonseokjung/solopreneur-ai-agents/main/agents/youngja/assets/youngja_thumbsup.png'
  });

  // 트레이딩 설정 및 데이터 상태
  const [settings, setSettings] = useState({
    DEFAULT_MARKET: 'KRW-BTC',
    DEFAULT_TRADE_AMOUNT: 50000,
    SURGE_CHECK_SECONDS: 5,
    SURGE_RATE_THRESHOLD: 1.5,
    SURGE_MIN_VOLUME_KRW: 10000000,
    TRAILING_TARGET_PROFIT_PCT: 3.0,
    TRAILING_CALLBACK_PCT: 1.0,
    AUTO_EXECUTE_ON_TIMEOUT: false,
    APPROVAL_TIMEOUT_SECONDS: 30,
    STOP_LOSS_PCT: 2.0,
    TAKE_PROFIT_PCT: 3.5,
    RSI_PERIOD: 14,
    RSI_BUY_THRESHOLD: 30,
    RSI_SELL_THRESHOLD: 70
  });

  const [accounts, setAccounts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [candles, setCandles] = useState([]);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [livePriceMap, setLivePriceMap] = useState({});
  const [currentRsi, setCurrentRsi] = useState(50);
  const [currentBb, setCurrentBb] = useState(null);

  // 회원 등급에 따른 슬롯 개수 제한 적용 (Free: 1개, Pro: 3개, VIP: 5개)
  const maxSlotsAllowed = currentUser?.maxSlots || 5;
  const visibleSlots = slots.slice(0, maxSlotsAllowed);

  // 현재 선택된 슬롯 및 대상 마켓
  const selectedSlot = visibleSlots.find(s => s.slotId === selectedSlotId) || visibleSlots[0] || slots[0];
  const activeMarket = selectedSlot?.targetMarket || settings.DEFAULT_MARKET || 'KRW-BTC';

  // 1. 초기 데이터 및 회원 프로필 로드 (선택된 모드 유지)
  const loadData = async () => {
    try {
      const savedUserId = localStorage.getItem('nurioh_user_id') || 1;
      const userRes = await getUserProfile(savedUserId).catch(() => null);
      if (userRes && userRes.user) {
        setCurrentUser(prev => {
          const override = devModeRef.current;
          if (override) {
            return {
              ...userRes.user,
              tier: override.tier,
              role: override.role,
              maxSlots: override.maxSlots,
              remainingDays: override.remainingDays
            };
          }
          return userRes.user;
        });
      }

      const status = await getBotStatus(savedUserId);
      if (status) {
        setBotRunning(status.botRunning);
        if (status.serverIp) setServerIp(status.serverIp);
        if (status.settings) setSettings(status.settings);
        if (status.accounts) setAccounts(status.accounts);
        if (status.slots) setSlots(status.slots);
        if (status.pendingApproval) setPendingApproval(status.pendingApproval);
        if (status.tradeHistory) setTradeHistory(status.tradeHistory);
      }

      const candleData = await getCandles(activeMarket, 1, 60);
      if (candleData && Array.isArray(candleData)) {
        setCandles(candleData);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  // 선택된 슬롯 또는 마켓 변경 시 캔들 로드
  useEffect(() => {
    if (activeMarket) {
      getCandles(activeMarket, 1, 60).then(res => {
        if (Array.isArray(res)) setCandles(res);
      }).catch(() => {});
    }
  }, [activeMarket, selectedSlotId]);

  useEffect(() => {
    loadData();

    // 2. 백엔드 WebSocket 연결
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'INIT') {
          setBotRunning(msg.botRunning);
          if (msg.settings) setSettings(msg.settings);
          if (msg.slots) setSlots(msg.slots);
          if (msg.pendingApproval) setPendingApproval(msg.pendingApproval);
        } else if (msg.type === 'TICKER_REALTIME') {
          setLivePrice(msg.data);
          setLivePriceMap(prev => ({ ...prev, [msg.data.code]: msg.data }));
        } else if (msg.type === 'TICK') {
          setCurrentRsi(msg.data.rsi);
          setCurrentBb(msg.data.bb);
        } else if (msg.type === 'SLOTS_UPDATED') {
          setSlots(msg.slots);
        } else if (msg.type === 'TRADE_SIGNAL') {
          setPendingApproval(msg.signal);
          if (msg.signal && msg.signal.slotId) {
            setSelectedSlotId(msg.signal.slotId);
          }
        } else if (msg.type === 'TRADE_EXECUTED') {
          setPendingApproval(null);
          setTradeHistory(prev => [msg.signal, ...prev]);
          loadData();
        } else if (msg.type === 'SIGNAL_CANCELLED') {
          setPendingApproval(null);
        } else if (msg.type === 'BOT_STATE') {
          setBotRunning(msg.isRunning);
        } else if (msg.type === 'SETTINGS_UPDATED') {
          setSettings(msg.settings);
        } else if (msg.type === 'PANIC_SELL_COMPLETED') {
          loadData();
        }
      } catch (e) {
        console.error('WS Parse Error:', e);
      }
    };

    const interval = setInterval(loadData, 10000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  // 개발자용 등급 모드 수동 전환 (자동 변경 없이 대표님이 선택한 상태 영구 유지)
  const handleSwitchDevMode = (tier, role, maxSlots) => {
    const remainingDays = role === 'ADMIN' ? 9999 : (tier === 'FREE_TRIAL' ? 7 : 30);
    const override = { tier, role, maxSlots, remainingDays };
    setDevModeOverride(override);
    devModeRef.current = override;

    setCurrentUser(prev => ({
      ...(prev || { id: 1, nickname: '누리오 회원' }),
      ...override
    }));
  };

  // 카카오 로그인 핸들러
  const handleKakaoLoginSuccess = async (kakaoPayload) => {
    const res = await loginWithKakao(kakaoPayload);
    if (res && res.user) {
      setDevModeOverride(null);
      devModeRef.current = null;
      setCurrentUser(res.user);
      localStorage.setItem('nurioh_user_id', res.user.id);
      if (!res.user.hasApiKey) {
        setIsApiModalOpen(true);
      }
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setDevModeOverride(null);
    devModeRef.current = null;
    localStorage.removeItem('nurioh_user_id');
    setCurrentUser(null);
  };

  // API 키 등록 핸들러
  const handleRegisterApiKey = async (accessKey, secretKey) => {
    const userId = currentUser?.id || 1;
    const res = await registerApiKey(userId, accessKey, secretKey);
    loadData();
    return res;
  };

  // 봇 가동 토글
  const handleToggleBot = async () => {
    if (botRunning) {
      await stopBot();
      setBotRunning(false);
    } else {
      await startBot();
      setBotRunning(true);
    }
  };

  // 전략 설정 저장
  const handleSaveSettings = async (newSettings) => {
    await updateSettings(newSettings);
    setSettings(newSettings);
  };

  // 슬롯 설정 수정
  const handleUpdateSlot = async (slotId, slotData) => {
    await updateSlotConfig(slotId, slotData);
    const res = await getSlots();
    if (res && res.slots) setSlots(res.slots);
  };

  // 슬롯 개별 매도
  const handleSellSlot = async (slotId) => {
    await sellSlotPosition(slotId);
    loadData();
  };

  // 🚨 Panic Sell 전량 매도
  const handlePanicSellAll = async () => {
    await panicSellAll();
    loadData();
  };

  // 수동 승인
  const handleApprove = async (signalId) => {
    await approveTrade(signalId);
    setPendingApproval(null);
    loadData();
  };

  // 수동 취소
  const handleReject = async (signalId, reason) => {
    await rejectTrade(signalId, reason);
    setPendingApproval(null);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col pb-20">
      {/* 상단 헤더 (Panic Sell, 운영자 대시보드 버튼 포함) */}
      <Header
        botRunning={botRunning}
        onToggleBot={handleToggleBot}
        onOpen2FA={() => setIs2FAModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenPanicSell={() => setIsPanicSellOpen(true)}
        onOpenOperatorDashboard={() => setIsOperatorDashboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        is2FAActive={is2FAActive}
        onRefresh={loadData}
        livePrice={livePrice}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* 🟡 유료 회원 구독 상태 & 카카오 온보딩 바 */}
        <SubscriptionCard
          user={currentUser}
          onOpenMyPage={() => setIsMyPageOpen(true)}
          onOpenApiModal={() => setIsApiModalOpen(true)}
          onOpenPricing={() => setIsPricingOpen(true)}
          onOpenAdmin={() => setIsAdminUsersOpen(true)}
          onOpenKakaoLogin={() => setIsKakaoModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* 계좌 잔고 요약 카드 */}
        <BalanceCard accounts={accounts} livePriceMap={livePriceMap} />

        {/* 🎛️ 1~5번 독립 멀티 슬롯 분산 트레이딩 매니저 (원클릭 차트 선택 연동) */}
        <SlotManager
          slots={visibleSlots}
          onUpdateSlot={handleUpdateSlot}
          onSellSlot={handleSellSlot}
          livePriceMap={livePriceMap}
          botRunning={botRunning}
          onToggleBot={handleToggleBot}
          onTriggerMockSurge={triggerMockSurge}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
          pendingApproval={pendingApproval}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {/* 📈 메인 실시간 단독 원화(KRW) 가격 차트 (선택된 슬롯 코인 전용 색상 그래프) */}
        <div className="w-full">
          <ChartView
            candles={candles}
            selectedSlot={selectedSlot}
            market={activeMarket}
            livePriceMap={livePriceMap}
            rsi={currentRsi}
            bb={currentBb}
            pendingApproval={pendingApproval}
          />
        </div>

        {/* 승인 대기 알림 & 체결 내역 */}
        <TradeLogs
          pendingApproval={pendingApproval}
          tradeHistory={tradeHistory}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </main>

      {/* 🛠️ 개발자용 등급별 원클릭 모드 전환 스위처 & 개발자 대시보드 진입점 */}
      <DevModeSwitcher
        currentTier={currentUser?.tier || 'VIP'}
        currentRole={currentUser?.role || 'ADMIN'}
        onSwitchMode={handleSwitchDevMode}
        onOpenDevDashboard={() => setIsDevDashboardOpen(true)}
      />

      {/* 📊 사이트 운영자(관리자) 비즈니스 & 전략 마스터 대시보드 모달 (전략 추가/수정/삭제/적용) */}
      <OperatorDashboardModal
        isOpen={isOperatorDashboardOpen}
        onClose={() => setIsOperatorDashboardOpen(false)}
        currentSettings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* 🛠️ 개발자 전용 시스템 & 운영자 지정 콘솔 모달 */}
      <DeveloperDashboardModal
        isOpen={isDevDashboardOpen}
        onClose={() => setIsDevDashboardOpen(false)}
        serverIp={serverIp}
      />

      {/* 🟡 카카오톡 간편 로그인 모달 */}
      <KakaoAuthModal
        isOpen={isKakaoModalOpen}
        onClose={() => setIsKakaoModalOpen(false)}
        onLoginSuccess={handleKakaoLoginSuccess}
      />

      {/* 🔑 업비트 API 키 등록 모달 */}
      <ApiRegistrationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onOpenGuide={() => setIsUpbitGuideOpen(true)}
        onRegisterSuccess={handleRegisterApiKey}
        userId={currentUser?.id || 1}
        serverIp={serverIp}
      />

      {/* 📖 업비트 API 발급방법 상세 가이드 모달 */}
      <UpbitGuideModal
        isOpen={isUpbitGuideOpen}
        onClose={() => setIsUpbitGuideOpen(false)}
        serverIp={serverIp}
      />

      {/* 💎 유료 회원제 등급 & 요금제 모달 */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentTier={currentUser?.tier || 'FREE_TRIAL'}
        remainingDays={currentUser?.remainingDays || 7}
      />

      {/* 👑 마스터 대표님 전용 회원 관리 패널 */}
      <AdminUserManagement
        isOpen={isAdminUsersOpen}
        onClose={() => setIsAdminUsersOpen(false)}
      />

      {/* 🚨 Panic Sell 비상 전량 매도 모달 */}
      <PanicSellModal
        isOpen={isPanicSellOpen}
        onClose={() => setIsPanicSellOpen(false)}
        onConfirm={handlePanicSellAll}
        accounts={accounts}
        slots={slots}
      />

      {/* ⚙️ 초단타 매매 & 트레일링 스탑 상세 설정 모달 (참고 이미지 완벽 구현) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        slots={slots}
        botRunning={botRunning}
        onToggleBot={handleToggleBot}
        onSaveSettings={handleSaveSettings}
        onUpdateSlot={handleUpdateSlot}
        onSellSlot={handleSellSlot}
        onOpenPanicSell={() => {
          setIsSettingsOpen(false);
          setIsPanicSellOpen(true);
        }}
      />

      {/* 👤 회원 마이페이지 & 자동매매 안전 관리 센터 모달 */}
      <MyPageModal
        isOpen={isMyPageOpen}
        onClose={() => setIsMyPageOpen(false)}
        user={currentUser}
        slots={slots}
        onUpdateSlot={handleUpdateSlot}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onReloadUser={loadData}
      />

      {/* 📖 서비스 통합 매뉴얼 & 운영자 의견 수렴 모달 */}
      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        user={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMyPage={() => setIsMyPageOpen(true)}
      />

      {/* 2FA OTP 인증 모달 */}
      <TwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onSuccess={() => setIs2FAActive(true)}
      />

      {/* 시스템 사용 안내 모달 */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* PWA 앱 설치 안내 */}
      <PwaInstallPrompt />
    </div>
  );
}
