import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BalanceCard from './components/BalanceCard';
import ChartView from './components/ChartView';
import SlotManager from './components/SlotManager';
import PanicSellModal from './components/PanicSellModal';
import BrandShowcaseBanner from './components/BrandShowcaseBanner';
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
import NoticeBoardModal from './components/NoticeBoardModal';
import TodayListingPopupModal from './components/TodayListingPopupModal';
import { COIN_NOTICES } from './data/coinNotices';
import { soundService } from './services/soundService';

import {
  getBotStatus,
  getCandles,
  updateSettings,
  startBot,
  stopBot,
  triggerMockSurge,
  getSlots,
  updateSlotConfig,
  buySlotPosition,
  importSlotPosition,
  sellSlotPosition,
  resetSlotStats,
  panicSellAll,
  approveTrade,
  rejectTrade,
  getUserProfile,
  loginWithKakao,
  registerApiKey
} from './services/api';
import { upbitClientEngine } from './services/upbitWsService';

import LandingPage from './components/LandingPage';

// 🛠️ 기본 1~9번 분산 트레이딩 슬롯 템플릿 (어떤 상황에서도 슬롯이 비어있지 않도록 보장)
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

// 🧪 연구실(LAB) 기본 최고 개발자 마스터 계정 템플릿
const LAB_DEV_USER = {
  id: 1,
  kakaoId: 'lab_dev_master',
  name: '누리오 마스터',
  nickname: '누리오 마스터 대표님',
  phone: '010-9999-8888',
  email: 'ceo@nurioh.com',
  birthyear: '1985',
  profileImage: 'https://raw.githubusercontent.com/wonseokjung/solopreneur-ai-agents/main/agents/youngja/assets/youngja_thumbsup.png',
  role: 'DEVELOPER',
  tier: 'VIP',
  subscriptionExpiresAt: '2099-12-31T23:59:59Z',
  maxSlots: 9,
  telegramChatId: '5618137472',
  isActive: true,
  hasApiKey: true,
  approvalStatus: 'APPROVED'
};

// 🏛️ 3단계 환경 감지 플래그: 🧪 연구실(로컬) | 🔬 실험실(호스팅 Staging) | 🏛️ 실서버(상용 Live)
const isLocalLab = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  Boolean(import.meta.env?.DEV)
);
const isStagingLab = typeof window !== 'undefined' && (
  window.location.pathname.startsWith('/lab') ||
  window.location.hostname.includes('lab')
);
const isLabEnvironment = isLocalLab || isStagingLab;

export default function App() {
  const [botRunning, setBotRunning] = useState(false);
  const [serverIp, setServerIp] = useState('115.68.168.243');
  
  // 모달 상태 관리
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPanicSellOpen, setIsPanicSellOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'
  const [isUpbitGuideOpen, setIsUpbitGuideOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState(false);
  const [isOperatorDashboardOpen, setIsOperatorDashboardOpen] = useState(false);
  const [isDevDashboardOpen, setIsDevDashboardOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isTodayPopupOpen, setIsTodayPopupOpen] = useState(false);

  // 🛠️ 선택된 슬롯 ID (차트 연동용, 기본 1번 슬롯)
  const [selectedSlotId, setSelectedSlotId] = useState(1);

  // 🛠️ 대표님이 직접 선택한 DEV 모드 유지 상태 (자동 리셋 방지)
  const [devModeOverride, setDevModeOverride] = useState(null);
  const devModeRef = useRef(devModeOverride);
  devModeRef.current = devModeOverride;

  // 🔒 로그인 세션 보안 정책 (로그인 유지를 체크하더라도 12시간 경과 후 카카오 재인증 요구)
  const SESSION_MAX_HOURS = 12;
  const SESSION_MAX_AGE_MS = SESSION_MAX_HOURS * 60 * 60 * 1000;

  // 회원 상태 (sessionStorage 우선 -> 자동로그인 체크된 localStorage 확인 + 12시간 세션 만료 검증)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // 1. 현재 브라우저 탭 세션 확인
      const sessionProfile = sessionStorage.getItem('nurioh_user_profile');
      const sessionUserId = sessionStorage.getItem('nurioh_user_id');
      if (sessionProfile && sessionUserId) {
        return JSON.parse(sessionProfile);
      }

      // 2. 사용자가 로그인 시 '자동 로그인'을 명시적으로 체크한 경우에만 로컬 스토리지 허용
      const isRemembered = localStorage.getItem('nurioh_remember_me') === 'true';
      if (isRemembered) {
        const loginTimestamp = localStorage.getItem('nurioh_login_timestamp');
        if (loginTimestamp) {
          const elapsed = Date.now() - Number(loginTimestamp);
          if (elapsed > SESSION_MAX_AGE_MS) {
            // 🛡️ 12시간 경과로 세션 만료: 보안을 위해 토큰 자동 파기 후 재인증 요구
            localStorage.removeItem('nurioh_user_id');
            localStorage.removeItem('nurioh_user_profile');
            localStorage.removeItem('nurioh_remember_me');
            localStorage.removeItem('nurioh_login_timestamp');
            return null;
          }
        }
        const localProfile = localStorage.getItem('nurioh_user_profile');
        if (localProfile) return JSON.parse(localProfile);
      } else {
        // 자동 로그인이 체크되어 있지 않다면 남아있는 로컬 잔여 데이터 완전 삭제 (다른 브라우저/새 창 보안 강화)
        localStorage.removeItem('nurioh_user_id');
        localStorage.removeItem('nurioh_user_profile');
        localStorage.removeItem('nurioh_remember_me');
        localStorage.removeItem('nurioh_login_timestamp');
      }

      // 🧪 3. 연구실(localhost) 환경이고 사용자가 명시적으로 로그아웃한 상태가 아니라면 기본으로 개발자 마스터 계정 자동 로그인!
      if (isLabEnvironment && sessionStorage.getItem('nurioh_lab_explicit_logout') !== 'true') {
        sessionStorage.setItem('nurioh_user_id', String(LAB_DEV_USER.id));
        sessionStorage.setItem('nurioh_user_profile', JSON.stringify(LAB_DEV_USER));
        return LAB_DEV_USER;
      }
    } catch (e) {}
    return null;
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
  const [accountError, setAccountError] = useState(null);
  const hasRealAccounts = Array.isArray(accounts) && accounts.length > 0 && accounts.some(a => parseFloat(a.balance || 0) > 0 || parseFloat(a.locked || 0) > 0);
  const isApiConnected = !accountError && hasRealAccounts;
  const [slots, setSlots] = useState(() => {
    try {
      const cached = localStorage.getItem('nurioh_cached_slots');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SLOTS;
  });
  const [candles, setCandles] = useState([]);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [livePriceMap, setLivePriceMap] = useState({});
  const [currentRsi, setCurrentRsi] = useState(50);
  const [currentBb, setCurrentBb] = useState(null);

  // 🛡️ [알고리즘 2번] 비트코인 커플링 매수 보호 실시간 상태 ({ active: boolean, dropRate: number, reason: string })
  const [btcProtection, setBtcProtection] = useState(null);

  // ⚡ 각 슬롯별 독립적인 실시간 급등 감지 3초 카운트다운 상태 ({ [slotId]: countdownData })
  const [pendingSurgeCountdowns, setPendingSurgeCountdowns] = useState({});
  const countdownTimersRef = useRef({});
  const activeSurgeCoinsRef = useRef(new Set());
  // 🔒 [운영자 퀀트 필터] 동일 코인 서킷 브레이커 & BTC 실시간 틱 추적
  const circuitBreakersRef = useRef({}); // { [market]: { lossHistory: [], lockedUntil: number } }
  const btcTicksRef = useRef([]); // [{ timestamp, price }]
  const btcProtectionRef = useRef(null);

  // 🌐 업비트 원화 마켓 감시 개수 (기본 288개, 캐싱으로 새로고침 시 깜빡임 완전 방지)
  const [marketCount, setMarketCount] = useState(() => {
    try {
      const cached = localStorage.getItem('nurioh_market_count');
      if (cached && Number(cached) >= 200) return Number(cached);
    } catch (e) {}
    return 288;
  });

  // 회원 등급에 따른 슬롯 개수 제한 적용 (Free: 1개, Pro: 3개, VIP/운영자/개발자: 9개)
  const isPrivileged = (currentUser?.role === 'OPERATOR' || currentUser?.role === 'DEVELOPER' || currentUser?.role === 'ADMIN' || currentUser?.tier === 'VIP');
  const maxSlotsAllowed = isPrivileged ? 9 : (currentUser?.tier === 'PRO' ? 3 : 1);
  const effectiveSlots = (slots && slots.length > 0) ? slots : DEFAULT_SLOTS;
  const visibleSlots = effectiveSlots.slice(0, maxSlotsAllowed);

  // 현재 선택된 슬롯 및 대상 마켓
  const selectedSlot = visibleSlots.find(s => s.slotId === selectedSlotId) || visibleSlots[0] || effectiveSlots[0];
  const activeMarket = selectedSlot?.targetMarket || settings.DEFAULT_MARKET || 'KRW-BTC';

  // 📱 PWA 전용 앱 설치 이벤트 전역 캡처 (마이페이지 및 설치 팝업 연동)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 🛡️ 실시간 유효 로그인 ID 검증 헬퍼 (스토리지에 인증 정보가 없을 때 절대 ID를 반환하지 않음)
  const getValidAuthUserId = () => {
    try {
      const isRemembered = localStorage.getItem('nurioh_remember_me') === 'true';
      const sessionUserId = sessionStorage.getItem('nurioh_user_id');
      if (sessionUserId) return sessionUserId;
      if (isRemembered) {
        const localUserId = localStorage.getItem('nurioh_user_id');
        if (localUserId) return localUserId;
      }
      // 🧪 연구실(LAB) 모드일 때는 기본 1번(대표님 마스터 계정) 허용!
      if (isLabEnvironment && sessionStorage.getItem('nurioh_lab_explicit_logout') !== 'true') {
        return '1';
      }
    } catch (e) {}
    return null;
  };

  // 1. 초기 데이터 및 회원 프로필 로드 (선택된 모드 유지)
  const loadData = async () => {
    try {
      // 🛡️ 보안 강화: 사용자가 유효하게 로그인된 상태일 때만 프로필과 봇 데이터를 로드함 (비인가 자동 로그인 원천 차단)
      const validUserId = getValidAuthUserId();
      if (!validUserId) {
        return;
      }

      const userRes = await getUserProfile(validUserId).catch(() => null);
      if (!getValidAuthUserId()) {
        return;
      }

      if (userRes && userRes.user) {
        const isRemembered = localStorage.getItem('nurioh_remember_me') === 'true';
        if (isRemembered) {
          localStorage.setItem('nurioh_user_profile', JSON.stringify(userRes.user));
          localStorage.setItem('nurioh_user_id', String(userRes.user.id));
        } else {
          sessionStorage.setItem('nurioh_user_profile', JSON.stringify(userRes.user));
          sessionStorage.setItem('nurioh_user_id', String(userRes.user.id));
        }

        setCurrentUser(prev => {
          if (!getValidAuthUserId()) return null;
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

      const status = await getBotStatus(validUserId);
      if (!getValidAuthUserId()) {
        return;
      }
      if (status) {
        setBotRunning(status.botRunning);
        if (status.serverIp) setServerIp(status.serverIp);
        if (status.settings) setSettings(status.settings);
        if (status.accounts) setAccounts(status.accounts);
        if (status.btcProtection) setBtcProtection(status.btcProtection);
        if (status.accountError) setAccountError(status.accountError);
        else setAccountError(null);
        if (status.slots && Array.isArray(status.slots) && status.slots.length > 0) {
          const now = Date.now();
          const normalizedSlots = status.slots.map(s => {
            const rawEntryPrice = parseFloat(s.entryPrice || s.position?.entryPrice || 0);
            const rawEntryVolume = parseFloat(s.entryVolume || s.position?.entryVolume || 0);
            const rawAmount = parseFloat(s.entryAmountKrw || (rawEntryPrice * rawEntryVolume) || 0);
            const hasPosition = (s.positionStatus === 'IN_POSITION') && (rawEntryPrice > 0);
            const tracker = slotTrackersRef.current[s.slotId];
            
            const entryPrice = hasPosition ? rawEntryPrice : null;
            let highestPrice = hasPosition ? (s.highestPrice || s.position?.highestPrice || entryPrice) : null;
            let highestProfitPct = hasPosition ? (s.highestProfitPct || s.position?.highestProfitPct || 0) : 0;

            if (hasPosition && tracker && tracker.targetMarket === s.targetMarket) {
              if (tracker.highestPrice > (highestPrice || 0)) {
                highestPrice = tracker.highestPrice;
                highestProfitPct = tracker.highestProfitPct;
              }
            } else if (hasPosition && (!tracker || tracker.targetMarket !== s.targetMarket) && entryPrice) {
              slotTrackersRef.current[s.slotId] = {
                entryPrice,
                highestPrice: highestPrice || entryPrice,
                highestProfitPct: highestProfitPct || 0,
                targetMarket: s.targetMarket
              };
            } else if (!hasPosition) {
              delete slotTrackersRef.current[s.slotId];
            }

            // 🛡️ 최근 15초 이내에 사용자가 수정한 슬롯(ON/OFF 등)은 로컬 낙관적 상태를 최우선 보존하여 폴링 롤백 방지!
            const lastUpdated = lastSlotUpdatesRef.current[s.slotId] || 0;
            const currentLocalSlot = (slotsRef.current || []).find(ls => ls.slotId === s.slotId);
            const isRecentlyUpdated = (now - lastUpdated) < 15000;
            const isEnabled = (isRecentlyUpdated && currentLocalSlot && currentLocalSlot.isEnabled !== undefined) 
              ? Boolean(currentLocalSlot.isEnabled) 
              : Boolean(s.isEnabled);

            return {
              ...s,
              id: s.id || s.slotId,
              slotId: s.slotId,
              slotName: s.slotName || s.name || `${s.slotId}번 슬롯`,
              isEnabled: isEnabled,
              strategyType: (isRecentlyUpdated && currentLocalSlot?.strategyType)
                ? currentLocalSlot.strategyType
                : (s.strategyType || s.strategy_type || 'RECOMMENDED'),
              tradeAmountKrw: (isRecentlyUpdated && currentLocalSlot?.tradeAmountKrw)
                ? currentLocalSlot.tradeAmountKrw
                : (s.tradeAmountKrw || s.trade_amount_krw || 50000),
              useAtrStopLoss: (isRecentlyUpdated && currentLocalSlot?.useAtrStopLoss !== undefined)
                ? Boolean(currentLocalSlot.useAtrStopLoss)
                : Boolean(s.useAtrStopLoss || s.use_atr_stop_loss),
              positionStatus: hasPosition ? 'IN_POSITION' : 'IDLE',
              entryPrice: entryPrice,
              entryVolume: hasPosition ? (rawEntryVolume > 0 ? rawEntryVolume : (entryPrice > 0 ? rawAmount / entryPrice : null)) : null,
              entryAmountKrw: hasPosition ? (rawAmount > 0 ? rawAmount : (entryPrice && rawEntryVolume ? entryPrice * rawEntryVolume : null)) : null,
              highestPrice: highestPrice,
              highestProfitPct: highestProfitPct,
              targetMarket: (isRecentlyUpdated && currentLocalSlot?.targetMarket) ? currentLocalSlot.targetMarket : (s.targetMarket || 'KRW-BTC'),
              targetProfitPct: parseFloat(s.targetProfitPct !== undefined ? s.targetProfitPct : (s.target_profit_pct !== undefined ? s.target_profit_pct : (s.trailingTargetProfitPct !== undefined ? s.trailingTargetProfitPct : 3.0))),
              trailingTargetProfitPct: parseFloat(s.trailingTargetProfitPct !== undefined ? s.trailingTargetProfitPct : (s.trailing_target_profit_pct !== undefined ? s.trailing_target_profit_pct : (s.targetProfitPct !== undefined ? s.targetProfitPct : 3.0))),
              trailingCallbackPct: parseFloat(s.trailingCallbackPct !== undefined ? s.trailingCallbackPct : (s.trailing_callback_pct !== undefined ? s.trailing_callback_pct : 1.0)),
              stopLossPct: parseFloat(s.stopLossPct !== undefined ? s.stopLossPct : (s.stop_loss_pct !== undefined ? s.stop_loss_pct : 2.0))
            };
          });
          setSlots(normalizedSlots);
          try {
            localStorage.setItem('nurioh_cached_slots', JSON.stringify(normalizedSlots));
          } catch (e) {}
        }
        if (status.pendingApproval) setPendingApproval(status.pendingApproval);
        if (status.tradeHistory) setTradeHistory(status.tradeHistory);

        // ⚡ [서버 직통 0초 즉시 시세 주입] 백엔드 /api/status 에서 함께 동봉된 실시간 현재가 즉시 반영!
        if (status.tickers && Array.isArray(status.tickers) && status.tickers.length > 0) {
          const serverBatch = {};
          status.tickers.forEach(t => {
            if (t.market && t.trade_price) {
              const tickObj = {
                code: t.market,
                trade_price: t.trade_price,
                change: t.change,
                change_rate: t.change_rate,
                signed_change_rate: t.signed_change_rate,
                trade_volume: t.trade_volume
              };
              const rawSymbol = t.market.replace('KRW-', '');
              serverBatch[t.market] = tickObj;
              serverBatch[rawSymbol] = tickObj;
              serverBatch[t.market.toLowerCase()] = tickObj;
              serverBatch[rawSymbol.toLowerCase()] = tickObj;
            }
          });
          setLivePriceMap(prev => ({ ...prev, ...serverBatch }));
        }

        // ⚡ [0.01초 즉시 동기화] 슬롯 대상 코인 및 보유 코인의 실시간 현재가를 REST API로 즉시 조회하여 livePriceMap에 주입!
        const relevantMarkets = Array.from(new Set([
          ...(status.slots || []).map(s => s.targetMarket).filter(Boolean),
          ...(status.accounts || []).map(a => `KRW-${a.currency}`).filter(Boolean),
          'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE', 'KRW-CRV', 'KRW-AUCTION', 'KRW-QTUM', 'KRW-FIL', 'KRW-BTT'
        ])).filter(m => m.startsWith('KRW-'));

        if (relevantMarkets.length > 0) {
          upbitClientEngine.setTargetMarkets(relevantMarkets);
          const tickerQuery = relevantMarkets.join(',');
          fetch(`https://api.upbit.com/v1/ticker?markets=${tickerQuery}`)
            .then(res => res.ok ? res.json() : fetch(`/api/tickers?markets=${tickerQuery}`).then(r => r.json()))
            .catch(() => fetch(`/api/tickers?markets=${tickerQuery}`).then(r => r.json()).catch(() => []))
            .then(tickers => {
              if (Array.isArray(tickers) && tickers.length > 0) {
                const batch = {};
                tickers.forEach(t => {
                  if (t.market && t.trade_price) {
                    const tickObj = {
                      code: t.market,
                      trade_price: t.trade_price,
                      change: t.change,
                      change_rate: t.change_rate,
                      signed_change_rate: t.signed_change_rate,
                      trade_volume: t.trade_volume
                    };
                    const rawSymbol = t.market.replace('KRW-', '');
                    batch[t.market] = tickObj;
                    batch[rawSymbol] = tickObj;
                    batch[t.market.toLowerCase()] = tickObj;
                    batch[rawSymbol.toLowerCase()] = tickObj;
                  }
                });
                setLivePriceMap(prev => ({ ...prev, ...batch }));
              }
            })
            .catch(() => {});
        }
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

  // 📢 당일 상장 코인 감지 시 로그인 사용자에게 팝업 ('다시 열지 않기' 설정 시 영구 미노출, 세션당 1회만 트리거)
  const hasTriggeredTodayPopupRef = useRef(false);

  useEffect(() => {
    if (currentUser && !hasTriggeredTodayPopupRef.current) {
      const todayNotice = COIN_NOTICES.find(n => n.isToday);
      if (todayNotice) {
        const isHiddenPermanently = localStorage.getItem('hide_today_listing_popup_never') === 'true';
        const isNoticeHidden = todayNotice.id && localStorage.getItem(`hide_listing_notice_${todayNotice.id}`) === 'true';
        if (!isHiddenPermanently && !isNoticeHidden) {
          hasTriggeredTodayPopupRef.current = true;
          const timer = setTimeout(() => {
            const checkPermanent = localStorage.getItem('hide_today_listing_popup_never') === 'true';
            const checkNotice = todayNotice.id && localStorage.getItem(`hide_listing_notice_${todayNotice.id}`) === 'true';
            if (!checkPermanent && !checkNotice) {
              setIsTodayPopupOpen(true);
            }
          }, 1200);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentUser]);

  // ⚡ 실시간 업비트 웹소켓 및 급등 감지 연동 레퍼런스
  const slotsRef = useRef(slots);
  const currentUserRef = useRef(currentUser);
  const accountsRef = useRef(accounts);
  const botRunningRef = useRef(botRunning);
  const slotTrackersRef = useRef({});
  const isExecutingBuyRef = useRef({});
  const isExecutingSellRef = useRef({});
  const stopLossCooldownsRef = useRef({}); // 🧊 { 'KRW-XRP': unblockTimestamp } (손절 종목 재진입 방지)
  const pendingSustainRef = useRef({}); // ⏱️ { 'KRW-XRP': { firstTriggerTime, baseBreakPrice, slotId, ... } } (1초 윗꼬리 설거지 방지)
  const lastSlotUpdatesRef = useRef({}); // 🛡️ { [slotId]: timestamp } (최근 슬롯 수정 후 5초 폴링 롤백 방어)
  const livePriceMapRef = useRef(livePriceMap);

  const settingsRef = useRef(settings);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  useEffect(() => {
    botRunningRef.current = botRunning;
  }, [botRunning]);

  useEffect(() => {
    livePriceMapRef.current = livePriceMap;
  }, [livePriceMap]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    // ⚡ [0.01초 초광속 초기화] 캐시된 슬롯 코인 + 주요 코인을 브라우저에서 업비트 직접 조회!
    const cachedSlotMarkets = (() => {
      try {
        const cached = JSON.parse(localStorage.getItem('nurioh_cached_slots') || '[]');
        return cached.map(s => s.targetMarket).filter(m => m && m.startsWith('KRW-'));
      } catch (e) { return []; }
    })();
    const instantMarkets = Array.from(new Set([
      ...cachedSlotMarkets,
      'KRW-PROM', 'KRW-FIL', 'KRW-QTUM', 'KRW-AUCTION',
      'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE',
      'KRW-ADA', 'KRW-AVAX', 'KRW-DOT', 'KRW-NEAR', 'KRW-STX', 'KRW-SUI'
    ]));
    // 업비트 직접 조회 (브라우저 → 업비트, 서버 프록시 불필요)
    fetch(`https://api.upbit.com/v1/ticker?markets=${instantMarkets.join(',')}`)
      .then(res => res.ok ? res.json() : [])
      .then(tickers => {
        if (Array.isArray(tickers) && tickers.length > 0) {
          const batch = {};
          tickers.forEach(t => {
            if (t.market && t.trade_price) {
              const tick = {
                code: t.market,
                trade_price: t.trade_price,
                change_rate: t.change_rate,
                signed_change_rate: t.signed_change_rate
              };
              batch[t.market] = tick;
              batch[t.market.replace('KRW-', '')] = tick;
            }
          });
          setLivePriceMap(prev => ({ ...prev, ...batch }));
        }
      })
      .catch(() => {});

    // 🎯 각 슬롯별 보유 포지션 실시간 트레일링 스탑 & 손절 조건 감시 및 즉각 집행 (슬롯 개별 ON 스위치 기준)
    const evaluateSlotRisk = (tickCode, tickPrice) => {
      const activeUser = currentUserRef.current;
      // 🛡️ 비로그인 상태이거나 유저 정보가 없으면 슬롯 리스크 감시/매도 실행 전면 차단!
      if (!activeUser || !activeUser.id) return;

      const currentSlots = slotsRef.current || [];
      const currentSettings = settingsRef.current || {};

      if (!tickPrice || tickPrice <= 0 || !tickCode) return;

      for (const slot of currentSlots) {
        if (!slot.isEnabled) continue;

        // 이미 매도 진행 중인 슬롯은 스킵
        if (isExecutingSellRef.current[slot.slotId]) continue;

        // 🛡️ 마켓 코드 대소문자 및 KRW- 접두사 유연 매칭
        const slotMarket = (slot.targetMarket || '').trim().toUpperCase();
        const incomingTick = (tickCode || '').trim().toUpperCase();
        const slotSymbol = slotMarket.replace('KRW-', '');
        const tickSymbol = incomingTick.replace('KRW-', '');
        const isMarketMatched = slotSymbol === tickSymbol;
        
        if (!isMarketMatched) continue;

        // 🛡️ 업비트 실계좌 매수평균가(avg_buy_price) 및 잔고와 100% 동기화
        const currentAccounts = accountsRef.current || [];
        const matchedAcc = Array.isArray(currentAccounts)
          ? currentAccounts.find(a => a.currency === slotSymbol)
          : null;
        const accBalance = matchedAcc ? parseFloat(matchedAcc.balance || 0) : 0;
        const hasRealBalance = accBalance > 0.0000001;

        // hasPosition: 슬롯 상태가 IN_POSITION이고, 진입가 또는 실계좌 잔고가 실제로 존재할 때만 감시!
        const slotEntryPrice = Number(slot.entryPrice || 0);
        const isDbInPosition = (slot.positionStatus === 'IN_POSITION' || slot.positionStatus === 'HOLDING' || slot.positionStatus === 'TRAILING_ACTIVE');
        const hasPosition = isDbInPosition && (slotEntryPrice > 0 || hasRealBalance);

        // 포지션이 실제로 없으면 감시 즉시 스킵
        if (!hasPosition) continue;

        // 🛡️ 업비트 최소 주문 가능 금액(5,000원) 미만 잔여 자투리(Dust) 코인은 자동 감시/손절 트리거에서 즉시 제외!
        const totalPositionKrw = Math.max(
          Number(slot.entryAmountKrw || 0),
          (accBalance * (tickPrice || slotEntryPrice)),
          Number(slot.entryVolume || 0) * (tickPrice || slotEntryPrice)
        );
        if (totalPositionKrw < 5000) continue;

        // 진입가: 실계좌 평균단가 → 슬롯 DB 진입가 순으로 폴백
        const accAvgBuyPrice = matchedAcc ? parseFloat(matchedAcc.avg_buy_price || 0) : 0;
        const entryPrice = (accAvgBuyPrice > 0) ? accAvgBuyPrice : slotEntryPrice;

        if (!entryPrice || entryPrice <= 0) continue;
        const currentProfitPct = ((tickPrice - entryPrice) / entryPrice) * 100;
        // 비정상 수익률 방어 (1000% 이상이면 데이터 오류)
        if (Math.abs(currentProfitPct) > 500) continue;

        // 🛡️ Live slotTrackersRef를 통해 최고가/최고수익률 실시간 보존
        if (!slotTrackersRef.current[slot.slotId]) {
          slotTrackersRef.current[slot.slotId] = {
            entryPrice,
            highestPrice: slot.highestPrice || entryPrice,
            highestProfitPct: Math.max(slot.highestProfitPct || 0, currentProfitPct),
            targetMarket: slotMarket
          };
        }

        const tracker = slotTrackersRef.current[slot.slotId];
        if (tickPrice > tracker.highestPrice) {
          tracker.highestPrice = tickPrice;
          tracker.highestProfitPct = Math.max(tracker.highestProfitPct, currentProfitPct);
          slotTrackersRef.current[slot.slotId] = tracker;

          // 슬롯 UI 상태에도 비동기 업데이트
          setSlots(prevSlots => prevSlots.map(s => {
            if (s.slotId === slot.slotId) {
              return { ...s, highestPrice: tracker.highestPrice, highestProfitPct: tracker.highestProfitPct };
            }
            return s;
          }));
        }

        const highestProfitPct = tracker.highestProfitPct;

        // 🎯 손절/익절 파라미터: 셀프전략은 슬롯 설정값, 추천전략은 슬롯 설정값 (모두 슬롯별 개별 설정 우선!)
        const stopLossPct = parseFloat(slot.stopLossPct) > 0 ? parseFloat(slot.stopLossPct) : 2.0;
        const targetProfitPct = parseFloat(slot.targetProfitPct || slot.trailingTargetProfitPct) > 0 
          ? parseFloat(slot.targetProfitPct || slot.trailingTargetProfitPct) 
          : 3.0;
        const callbackPct = parseFloat(slot.trailingCallbackPct) > 0 ? parseFloat(slot.trailingCallbackPct) : 1.0;

        // 1) 트레일링 익절 매도 조건: 목표 수익률 도달 후 최고점 대비 callbackPct 이상 하락 시
        const isTargetReached = (highestProfitPct >= targetProfitPct);
        const dropFromPeak = highestProfitPct - currentProfitPct;
        const isTrailingProfitHit = isTargetReached && (dropFromPeak >= callbackPct);

        // 2) 고정 손절 매도 조건: 손절선(-stopLossPct) 이하로 하락 시
        const isStopLossHit = (currentProfitPct <= -stopLossPct);

        if ((isTrailingProfitHit || isStopLossHit) && !isExecutingSellRef.current[slot.slotId]) {
          isExecutingSellRef.current[slot.slotId] = true;
          delete slotTrackersRef.current[slot.slotId];

          const reason = isTrailingProfitHit 
            ? `트레일링 익절 매도 (최고 +${highestProfitPct.toFixed(2)}% 달성 후 -${dropFromPeak.toFixed(2)}% 콜백 하락 감지)`
            : `손절 매도 (-${stopLossPct}% 손절 기준선 도달, 현재 ${currentProfitPct.toFixed(2)}%)`;

          console.log(`🚨 [Auto Sell Trigger] 슬롯 ${slot.slotId} (${slot.targetMarket}): ${reason}`);

          // 즉시 슬롯 매도 실행 API 호출
          sellSlotPosition(slot.slotId, {
            userId: activeUser?.id || 1,
            currentPrice: tickPrice,
            reason: reason
          })
            .then(async (res) => {
              console.log('✅ [Auto Sell Success]', res);

              // ⚡ 1. 프론트엔드 슬롯 상태 0초 즉각 비우기 (Optimistic Instant Clear)
              setSlots(prev => {
                const updated = prev.map(s => s.slotId === slot.slotId ? {
                  ...s,
                  positionStatus: 'IDLE',
                  entryPrice: null,
                  entryVolume: null,
                  entryAmountKrw: null,
                  highestPrice: null,
                  highestProfitPct: 0
                } : s);
                try { localStorage.setItem('nurioh_cached_slots', JSON.stringify(updated)); } catch (e) {}
                return updated;
              });

              delete slotTrackersRef.current[slot.slotId];
              lastSlotUpdatesRef.current[slot.slotId] = Date.now();

              if (isTrailingProfitHit || currentProfitPct >= 0) {
                soundService.playProfitAlert();
              } else {
                soundService.playLossAlert();
                // 🧊 손절 발생 시 해당 코인 쿨다운 자동 등록 (연쇄 손절 방지)
                const cooldownMinutes = currentSettings.STOPLOSS_COOLDOWN_MINUTES !== undefined ? currentSettings.STOPLOSS_COOLDOWN_MINUTES : 15;
                if (cooldownMinutes > 0 && slot.targetMarket) {
                  const unblockTime = Date.now() + (cooldownMinutes * 60 * 1000);
                  stopLossCooldownsRef.current[slot.targetMarket] = unblockTime;
                  console.log(`🧊 [StopLoss Cool-down] ${slot.targetMarket} 손절 발생 -> ${cooldownMinutes}분간 재진입 차단`);
                }

                // 🔒 [동일 코인 서킷 브레이커] 1시간 내 2연속 손절 시 2시간 강력 락(Lock)
                const mktKey = slot.targetMarket;
                const nowMs = Date.now();
                if (mktKey) {
                  if (!circuitBreakersRef.current[mktKey]) {
                    circuitBreakersRef.current[mktKey] = { lossHistory: [], lockedUntil: 0 };
                  }
                  const cb = circuitBreakersRef.current[mktKey];
                  cb.lossHistory = (cb.lossHistory || []).filter(t => (nowMs - t) < 3600000);
                  cb.lossHistory.push(nowMs);
                  if (cb.lossHistory.length >= 2) {
                    cb.lockedUntil = nowMs + (2 * 60 * 60 * 1000); // 2시간 락
                    console.warn(`🔒 [서킷 브레이커 발동] ${mktKey}: 1시간 내 2연속 손절 감지 -> 2시간 동안 신규 매수 전면 락!`);
                  }
                }
              }
              await loadData();
            })
            .catch(err => {
              console.error('❌ [Auto Sell Failed]', err);
            })
            .finally(() => {
              setTimeout(() => {
                delete isExecutingSellRef.current[slot.slotId];
              }, 5000);
            });
        }
      }
    };

    // ⚡ 슬롯에 배정된 코인들의 REST 현재가를 0초 즉시 및 2초 주기로 백그라운드 최신화
    const fetchActiveSlotPrices = () => {
      const slotCoins = (Array.isArray(slotsRef.current) ? slotsRef.current : [])
        .map(s => s?.targetMarket)
        .filter(m => m && typeof m === 'string' && m.startsWith('KRW-'));
      const accCoins = (Array.isArray(accountsRef.current) ? accountsRef.current : [])
        .filter(a => a && a.currency && a.currency !== 'KRW')
        .map(a => `KRW-${a.currency}`);
      let activeCoins = Array.from(new Set([...slotCoins, ...accCoins]));

      if (activeCoins.length === 0) {
        try {
          const cached = JSON.parse(localStorage.getItem('nurioh_cached_slots') || '[]');
          activeCoins = Array.from(new Set(
            cached.map(s => s.targetMarket).filter(m => m && m.startsWith('KRW-'))
          ));
        } catch (e) {}
      }
      if (activeCoins.length === 0) return;

      upbitClientEngine.setTargetMarkets(activeCoins);

      // ⚡ 업비트 직접 조회 (브라우저 → 업비트 Public API, 실패 시 백엔드 프록시로 폴백)
      const q = activeCoins.join(',');
      fetch(`https://api.upbit.com/v1/ticker?markets=${q}`)
        .then(r => r.ok ? r.json() : fetch(`/api/tickers?markets=${q}`).then(r2 => r2.json()))
        .catch(() => fetch(`/api/tickers?markets=${q}`).then(r2 => r2.json()).catch(() => []))
        .then(tickers => {
          if (Array.isArray(tickers) && tickers.length > 0) {
            const batch = {};
            tickers.forEach(t => {
              if (t.market && t.trade_price) {
                const tickObj = {
                  code: t.market,
                  trade_price: t.trade_price,
                  change: t.change,
                  change_rate: t.change_rate,
                  signed_change_rate: t.signed_change_rate
                };
                const rawSym = t.market.replace('KRW-', '');
                batch[t.market] = tickObj;
                batch[rawSym] = tickObj;
                batch[t.market.toLowerCase()] = tickObj;
                batch[rawSym.toLowerCase()] = tickObj;
                evaluateSlotRisk(t.market, t.trade_price);
              }
            });
            setLivePriceMap(prev => ({ ...prev, ...batch }));
          }
        })
        .catch(() => {});
    };

    // 마운트 즉시 0초에 한 번 바로 호출!
    fetchActiveSlotPrices();
    const syncTimer = setInterval(fetchActiveSlotPrices, 2000);

    loadData();

    // ⚡ 1. 브라우저 직접 업비트 실시간 웹소켓 & 급등 감지기 가동
    upbitClientEngine.init({
      onMarketsLoaded: (count) => {
        if (count && count >= 50) {
          setMarketCount(count);
          try { localStorage.setItem('nurioh_market_count', String(count)); } catch (e) {}
        }
      },
      onBatchTicks: (batchMap) => {
        setLivePriceMap(prev => ({ ...prev, ...batchMap }));
        Object.values(batchMap).forEach(tick => {
          if (tick.code && tick.trade_price) {
            evaluateSlotRisk(tick.code, tick.trade_price);
          }
        });
      },
      onTick: (tick) => {
        setLivePriceMap(prev => ({ ...prev, [tick.code]: tick }));
        if (tick.code === 'KRW-BTC') {
          const nowMs = Date.now();
          btcTicksRef.current.push({ price: tick.trade_price, timestamp: nowMs });
          const btcCutoff = nowMs - 180000;
          while (btcTicksRef.current.length > 0 && btcTicksRef.current[0].timestamp < btcCutoff) {
            btcTicksRef.current.shift();
          }
        }
        if (tick.code === activeMarket) {
          setLivePrice(tick);
        }
        evaluateSlotRisk(tick.code, tick.trade_price);
      },
      onSurge: (tick, buffer) => {
        const activeUser = currentUserRef.current;
        // 🛡️ 비로그인 상태에서는 급등 감시 및 자동 매수 전면 차단
        if (!activeUser || !activeUser.id) return;

        const now = Date.now();
        const marketCode = tick.code.toUpperCase();

        // 🪙 BTC 틱 실시간 기록 (최근 3분 버퍼 유지)
        if (marketCode === 'KRW-BTC') {
          btcTicksRef.current.push({ price: tick.trade_price, timestamp: now });
          const btcCutoff = now - 180000;
          while (btcTicksRef.current.length > 0 && btcTicksRef.current[0].timestamp < btcCutoff) {
            btcTicksRef.current.shift();
          }
        }

        // 🛡️ [대장주 BTC 하락 커플링 셧다운] BTC가 최근 3분 내 -0.5% 이상 급락 시 알트코인 매수 일시 정지!
        if (marketCode !== 'KRW-BTC' && btcTicksRef.current.length >= 2) {
          const btcFirst = btcTicksRef.current[0].price;
          const btcLast = btcTicksRef.current[btcTicksRef.current.length - 1].price;
          const timeSpanMs = btcTicksRef.current[btcTicksRef.current.length - 1].timestamp - btcTicksRef.current[0].timestamp;
          if (timeSpanMs >= 10000 && btcFirst > 0) {
            const btcChangePct = ((btcLast - btcFirst) / btcFirst) * 100;
            if (btcChangePct <= -0.5) {
              return; // BTC 급락 중 -> 알트코인 신규 매수 전면 차단
            }
          }
        }

        const currentSettings = settingsRef.current || {};
        const excludedList = (currentSettings.EXCLUDED_MARKETS || []).map(m => String(m).trim().toUpperCase());

        // 🛡️ [쉴드 1] 특정 시간대 매수 일시정지 (Time Block Filter: 08:50 ~ 09:30 등 가짜 펌핑 시간대 매수 차단)
        if (currentSettings.TIME_BLOCK_ENABLED) {
          const nowObj = new Date();
          const curH = nowObj.getHours();
          const curM = nowObj.getMinutes();
          const curTotalMin = curH * 60 + curM;

          const [sH, sM] = (currentSettings.TIME_BLOCK_START || '08:50').split(':').map(Number);
          const [eH, eM] = (currentSettings.TIME_BLOCK_END || '09:30').split(':').map(Number);
          const startTotalMin = sH * 60 + sM;
          const endTotalMin = eH * 60 + eM;

          if (curTotalMin >= startTotalMin && curTotalMin <= endTotalMin) {
            // 타임 블록 시간대: 신규 매수만 자동 일시정지 (기존 코인 트레일링 익절/손절 매도는 100% 정상 작동)
            return;
          }
        }

        // 🚫 1. 매매 제외 코인(Blacklist)은 급등 레이더 감시 및 자동 매수에서 즉시 제외!
        const shortSymbol = marketCode.replace('KRW-', '');
        if (excludedList.includes(marketCode) || excludedList.includes(shortSymbol) || excludedList.includes(`KRW-${shortSymbol}`)) {
          return;
        }

        // 🛡️ [쉴드 2] 손절 발생 종목 쿨다운 검사 (Stop-Loss Cool-down Filter: 연쇄 손절 방지)
        const cooldownUntil = stopLossCooldownsRef.current[marketCode];
        if (cooldownUntil) {
          if (now < cooldownUntil) {
            return; // 쿨다운 잔여 중 -> 매수 스킵
          } else {
            delete stopLossCooldownsRef.current[marketCode]; // 만료 시 쿨다운 해제
          }
        }

        // 🔒 [동일 코인 서킷 브레이커] 1시간 내 2연속 손절 발생 코인은 2시간 동안 매수 전면 락(Lock)
        const cbState = circuitBreakersRef.current[marketCode];
        if (cbState && cbState.lockedUntil) {
          if (now < cbState.lockedUntil) {
            return; // 2시간 락 진행 중 -> 매수 스킵
          } else {
            delete circuitBreakersRef.current[marketCode]; // 만료 시 해제
          }
        }

        // 🚫 이미 매수 실행 중이거나 이미 매수 보유 중인 코인은 중복 진입 방지!
        if (activeSurgeCoinsRef.current.has(marketCode) && !pendingSustainRef.current[marketCode]) {
          return;
        }

        const currentSlots = slotsRef.current || [];
        const isAlreadyHeld = currentSlots.some(s => 
          s.targetMarket === marketCode && 
          (s.positionStatus === 'IN_POSITION' || s.positionStatus === 'HOLDING' || s.positionStatus === 'TRAILING_ACTIVE')
        );
        if (isAlreadyHeld) {
          return;
        }

        // 🛡️ 실제 주문 가능 원화 잔고 실시간 확인 (accountsRef live 동기화)
        const currentAccounts = accountsRef.current || [];
        const hasLiveRealAccounts = Array.isArray(currentAccounts) && currentAccounts.length > 0 && currentAccounts.some(a => parseFloat(a.balance || 0) > 0 || parseFloat(a.locked || 0) > 0);
        const krwAccount = currentAccounts.find(a => a.currency === 'KRW');
        const availableKrw = parseFloat(krwAccount?.balance || 0);

        // 🎯 3. 현재 가동 중(isEnabled)이고 비어있는(IDLE) 슬롯 중 현재 매수 중이 아닌 슬롯 탐색!
        for (const slot of currentSlots) {
          if (!slot.isEnabled || slot.positionStatus === 'IN_POSITION' || slot.positionStatus === 'HOLDING' || (slot.tradeAmountKrw || 0) < 5000) {
            continue;
          }

          // 이미 매수 주문 처리 중이면 패스 (다른 비어있는 슬롯으로 탐색!)
          if (isExecutingBuyRef.current[slot.slotId]) {
            continue;
          }

          // 🛡️ 잔고 확인: 잔고 부족 시 아예 슬롯에 진입하지 않고 패스!
          if (hasLiveRealAccounts && availableKrw < (slot.tradeAmountKrw || 5000)) {
            continue;
          }

          // 🎯 추천전략 vs 셀프전략 파라미터 분기
          const isSelf = (slot.strategyType === 'SELF');
          const windowSeconds = isSelf 
            ? (slot.surgeWindowSeconds || 5) 
            : (currentSettings.SURGE_CHECK_SECONDS || 5);
          const rateThreshold = isSelf 
            ? (slot.surgeRatePct || 1.5) 
            : (currentSettings.SURGE_RATE_THRESHOLD || 1.5);
          let minVolumeKrw = isSelf 
            ? (slot.surgeMinVolumeKrw || 10000000) 
            : (currentSettings.SURGE_MIN_VOLUME_KRW || 10000000);

          // 📊 [운영자 퀀트 필터 1] 거래대금 상대비율(%) 모드 지원
          const volumeMode = slot.surgeVolumeMode || 'AMOUNT';
          if (volumeMode === 'RATE') {
            const acc24h = tick.acc_trade_price_24h || livePriceMapRef.current?.[marketCode]?.acc_trade_price_24h || 0;
            const ratePct = slot.surgeMinVolumeRatePct !== undefined ? slot.surgeMinVolumeRatePct : 0.05;
            if (acc24h > 0) {
              minVolumeKrw = acc24h * (ratePct / 100);
            }
          }

          const baseMode = isSelf
            ? (slot.surgeBaseMode || 'VWAP')
            : (currentSettings.SURGE_BASE_MODE || 'VWAP');
          const sustainSeconds = isSelf
            ? (slot.surgeSustainSeconds !== undefined ? slot.surgeSustainSeconds : 1.5)
            : (currentSettings.SURGE_SUSTAIN_SECONDS !== undefined ? currentSettings.SURGE_SUSTAIN_SECONDS : 1.5);

          const windowMs = windowSeconds * 1000;
          const cutoff = now - windowMs;
          const recentTicks = buffer.filter(t => t.timestamp >= cutoff);
          if (recentTicks.length < 2) continue;

          // 🐋 [운영자 퀀트 필터 5] 고래 단일 틱 식별 엔진 (지정 금액 이상의 단일 체결 틱 존재 여부)
          if (slot.useWhaleTickFilter) {
            const whaleMin = slot.whaleMinAmountKrw || 10000000;
            const hasWhale = recentTicks.some(t => (t.amount || 0) >= whaleMin);
            if (!hasWhale) {
              continue; // 고래 단일 체결 부재 (자전거래/개미 소액 노이즈) -> 스킵
            }
          }

          const executeAutoBuy = async (assignedSlotId, targetMarketCode, tradeAmount, targetPrice, diffRate, winSecs, totVolKrw) => {
            if (isExecutingBuyRef.current[assignedSlotId]) return;
            activeSurgeCoinsRef.current.add(targetMarketCode);
            isExecutingBuyRef.current[assignedSlotId] = true;

            try {
              console.log(`🚨 [Client Surge Verified Trigger] ${assignedSlotId}번 슬롯 안전 매수: ${targetMarketCode} +${diffRate.toFixed(2)}% (${winSecs}초 내 ${Math.round(totVolKrw).toLocaleString()}원)`);

              // 🛡️ [운영자 퀀트 필터 2] 3분봉 역배열(데드캣 바운스) 진입 차단
              const targetSlot = (slotsRef.current || []).find(s => s.slotId === assignedSlotId) || slot;
              if (targetSlot?.useReverseAlignmentFilter) {
                try {
                  const controller = new AbortController();
                  const timer = setTimeout(() => controller.abort(), 2500);
                  const candleRes = await fetch(`https://api.upbit.com/v1/candles/minutes/3?market=${targetMarketCode}&count=20`, { signal: controller.signal });
                  clearTimeout(timer);
                  if (candleRes.ok) {
                    const candles = await candleRes.json();
                    if (Array.isArray(candles) && candles.length >= 20) {
                      const ma5 = candles.slice(0, 5).reduce((sum, c) => sum + (c.trade_price || 0), 0) / 5;
                      const ma20 = candles.slice(0, 20).reduce((sum, c) => sum + (c.trade_price || 0), 0) / 20;
                      if (ma5 < ma20) {
                        console.warn(`🛡️ [역배열 필터 차단] ${targetMarketCode}: 3분봉 MA5(${ma5.toFixed(2)}) < MA20(${ma20.toFixed(2)}) 역배열(데드캣) 상태 -> 매수 전면 차단!`);
                        activeSurgeCoinsRef.current.delete(targetMarketCode);
                        delete pendingSustainRef.current[targetMarketCode];
                        delete isExecutingBuyRef.current[assignedSlotId];
                        return;
                      }
                    }
                  }
                } catch (candleErr) {
                  console.warn('⚠️ 3분봉 역배열 체크 타임아웃/오류:', candleErr.message);
                }
              }

              // 🛡️ [운영자 퀀트 필터 4] 호가창 스프레드 공백(0.4%+) 차단
              if (targetSlot?.useOrderbookFilter) {
                try {
                  const controller = new AbortController();
                  const timer = setTimeout(() => controller.abort(), 2500);
                  const obRes = await fetch(`https://api.upbit.com/v1/orderbook?markets=${targetMarketCode}`, { signal: controller.signal });
                  clearTimeout(timer);
                  if (obRes.ok) {
                    const obData = await obRes.json();
                    const topUnit = obData?.[0]?.orderbook_units?.[0];
                    if (topUnit && topUnit.ask_price && topUnit.bid_price && topUnit.bid_price > 0) {
                      const spreadPct = ((topUnit.ask_price - topUnit.bid_price) / topUnit.bid_price) * 100;
                      if (spreadPct >= 0.4) {
                        console.warn(`🛡️ [호가창 스프레드 차단] ${targetMarketCode}: 매도1-매수1 스프레드 ${spreadPct.toFixed(3)}% >= 0.4% (텅 빈 호가창 덤핑 위험) -> 매수 차단!`);
                        activeSurgeCoinsRef.current.delete(targetMarketCode);
                        delete pendingSustainRef.current[targetMarketCode];
                        delete isExecutingBuyRef.current[assignedSlotId];
                        return;
                      }
                    }
                  }
                } catch (obErr) {
                  console.warn('⚠️ 호가창 스프레드 체크 타임아웃/오류:', obErr.message);
                }
              }

              // 1. 실제 업비트 시장가 매수 주문 먼저 전송 (체결 성공 여부 확인 후 UI 반영)
              const buyRes = await buySlotPosition(assignedSlotId, {
                userId: activeUser?.id || 1,
                market: targetMarketCode,
                amountKrw: tradeAmount,
                currentPrice: targetPrice
              });

              if (buyRes && buyRes.success !== false && !buyRes.error) {
                console.log(`✅ [Auto Buy Success Slot ${assignedSlotId}]`, buyRes);
                soundService.playBuyAlert();
                setSelectedSlotId(assignedSlotId);

                // 2. 실제 체결 성공 시에만 슬롯 상태를 IN_POSITION으로 업데이트 및 최근 변경 보호
                lastSlotUpdatesRef.current[assignedSlotId] = Date.now();
                setSlots(prevSlots => {
                  const updated = prevSlots.map(s => {
                    if (s.slotId === assignedSlotId) {
                      return {
                        ...s,
                        isEnabled: true,
                        positionStatus: 'IN_POSITION',
                        targetMarket: targetMarketCode,
                        entryPrice: targetPrice,
                        entryVolume: tradeAmount / targetPrice,
                        entryAmountKrw: tradeAmount,
                        highestPrice: targetPrice,
                        highestProfitPct: 0
                      };
                    }
                    return s;
                  });
                  slotsRef.current = updated;
                  return updated;
                });

                // 3. 브라우저 푸시 알림
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('⚡ [안전 검증 급등 코인 매수 체결]', {
                    body: `${assignedSlotId}번 슬롯: ${targetMarketCode} (+${diffRate.toFixed(2)}%) ${Math.round(tradeAmount).toLocaleString()}원 체결! (트레일링 익절 가동)`,
                    icon: '/favicon.png'
                  });
                }

                await loadData();
              } else {
                console.warn(`⚠️ [Auto Buy Skipped/Failed Slot ${assignedSlotId}]`, buyRes?.error || '체결 불발');
              }
            } catch (buyErr) {
              console.error(`❌ [Auto Buy Failed Slot ${assignedSlotId}]`, buyErr);
            } finally {
              setTimeout(() => {
                activeSurgeCoinsRef.current.delete(targetMarketCode);
                delete pendingSustainRef.current[targetMarketCode];
                if (isExecutingBuyRef.current && typeof isExecutingBuyRef.current === 'object') {
                  delete isExecutingBuyRef.current[assignedSlotId];
                }
              }, 5000);
            }
          };

          // 🛡️ [쉴드 3] 단기 윈도우 기준가 산출 (피크 직전 최저가 또는 VWAP 기준)
          let minPrice = recentTicks[0].price;
          for (let i = 0; i < recentTicks.length; i++) {
            if (recentTicks[i].price < minPrice) minPrice = recentTicks[i].price;
          }

          let basePrice = minPrice;
          if (baseMode === 'VWAP' && recentTicks.length > 2) {
            // 피크 틱을 제외한 직전 틱들의 거래량 가중 평균가로 기준가 왜곡 방지
            const baseTicks = recentTicks.slice(0, recentTicks.length - 1);
            const totalVol = baseTicks.reduce((sum, t) => sum + (t.volume || 0), 0);
            const totalAmt = baseTicks.reduce((sum, t) => sum + (t.amount || (t.price * (t.volume || 0))), 0);
            basePrice = (totalVol > 0 && totalAmt > 0) ? (totalAmt / totalVol) : minPrice;
          }

          const currentPrice = recentTicks[recentTicks.length - 1].price;
          const priceDiffRate = ((currentPrice - basePrice) / basePrice) * 100;
          
          // 📊 윈도우 기간 내 실제 실시간 체결 대금 정밀 계산 (누적 거래대금 차분 또는 틱 합산 중 최댓값)
          let totalVolumeKrw = recentTicks.reduce((sum, item) => sum + (item.amount || 0), 0);
          if (recentTicks.length >= 2) {
            const lastAcc = recentTicks[recentTicks.length - 1].accTradePrice || 0;
            const firstAcc = recentTicks[0].accTradePrice || 0;
            if (lastAcc > 0 && firstAcc > 0 && lastAcc >= firstAcc) {
              totalVolumeKrw = Math.max(totalVolumeKrw, lastAcc - firstAcc);
            }
          }

          // 🛡️ [쉴드 4] 급등 지지 확인 시간 (Sustain Time Delay: 윗꼬리 설거지 방어)
          const isSurgeConditionMet = (priceDiffRate >= rateThreshold && totalVolumeKrw >= minVolumeKrw);

          if (!pendingSustainRef.current[marketCode]) {
            if (isSurgeConditionMet) {
              const assignedSlotId = slot.slotId;
              const tradeAmount = slot.tradeAmountKrw || 50000;

              if (sustainSeconds > 0) {
                console.log(`⏱️ [Sustain Wait] ${marketCode} 급등 포착 (+${priceDiffRate.toFixed(2)}%) -> ${sustainSeconds}초간 윗꼬리 방어 지지 검증 타이머 시작...`);
                activeSurgeCoinsRef.current.add(marketCode);
                const baseBreakPrice = currentPrice;

                // ⏱️ 액티브 타이머 가동: 다음 틱 수신 지연과 무관하게 지정 초 후 지지 검증 및 매수 집행
                const timerId = setTimeout(() => {
                  const item = pendingSustainRef.current[marketCode];
                  if (!item) return;
                  delete pendingSustainRef.current[marketCode];

                  const liveLatest = livePriceMapRef.current?.[marketCode]?.trade_price || baseBreakPrice;
                  if (liveLatest < baseBreakPrice * 0.985) {
                    console.log(`🚫 [Sustain Timer Cancelled] ${marketCode}: 윗꼬리 급락 감지 (${liveLatest} < ${baseBreakPrice * 0.985}) -> 가짜 펌핑 설거지 회피!`);
                    activeSurgeCoinsRef.current.delete(marketCode);
                    return;
                  }

                  console.log(`✨ [Sustain Verified by Timer] ${marketCode}: ${sustainSeconds}초간 가격 지지 성공 (+${priceDiffRate.toFixed(2)}%)! 진짜 급등주 매수 집행!`);
                  executeAutoBuy(assignedSlotId, marketCode, tradeAmount, liveLatest, priceDiffRate, windowSeconds, totalVolumeKrw);
                }, Math.round(sustainSeconds * 1000));

                pendingSustainRef.current[marketCode] = {
                  firstTriggerTime: now,
                  baseBreakPrice,
                  slotId: assignedSlotId,
                  tradeAmount,
                  currentPrice,
                  priceDiffRate,
                  windowSeconds,
                  totalVolumeKrw,
                  timerId
                };
                return;
              } else {
                // 지지 대기 시간이 없으면 즉시 매수
                executeAutoBuy(assignedSlotId, marketCode, tradeAmount, currentPrice, priceDiffRate, windowSeconds, totalVolumeKrw);
                break;
              }
            } else {
              continue;
            }
          } else {
            // 이미 타이머 가동 중인 경우: 틱 단위로 혹시 1.5% 급락하면 타이머 조기 취소하여 빠른 방어
            const sustainItem = pendingSustainRef.current[marketCode];
            if (currentPrice < sustainItem.baseBreakPrice * 0.985) {
              console.log(`🚫 [Sustain Fast Cancelled] ${marketCode}: 틱 단위 윗꼬리 급락 감지 (${currentPrice} < ${sustainItem.baseBreakPrice * 0.985}) -> 타이머 조기 취소`);
              if (sustainItem.timerId) clearTimeout(sustainItem.timerId);
              delete pendingSustainRef.current[marketCode];
              activeSurgeCoinsRef.current.delete(marketCode);
            }
            return;
          }
        }
      }
    });

    // 2. 백엔드 WebSocket 연결 (로컬 환경 지원, 실패 시 조용히 무시)
    let ws = null;
    try {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        ws = new WebSocket(wsUrl);
      }
    } catch (e) {}

    const interval = setInterval(loadData, 5000);

    return () => {
      upbitClientEngine.destroy();
      if (syncTimer) clearInterval(syncTimer);
      if (ws) ws.close();
      if (countdownTimersRef.current) {
        Object.values(countdownTimersRef.current).forEach(timer => clearInterval(timer));
      }
      clearInterval(interval);
    };
  }, []);

  // 개발자용 등급 모드 수동 전환 (자동 변경 없이 대표님이 선택한 상태 영구 유지)
  const handleSwitchDevMode = (tier, role, maxSlots) => {
    const remainingDays = (role === 'DEVELOPER' || role === 'ADMIN') ? 9999 : (tier === 'FREE_TRIAL' ? 7 : 30);
    const override = { tier, role, maxSlots, remainingDays };
    setDevModeOverride(override);
    devModeRef.current = override;

    setCurrentUser(prev => ({
      ...(prev || { id: 1, nickname: '이승호 대표님' }),
      ...override
    }));
  };

  // 카카오 로그인 핸들러 (rememberMe 분기)
  const handleKakaoLoginSuccess = async (kakaoPayload, rememberMe = false) => {
    try {
      const res = await loginWithKakao(kakaoPayload);
      if (res && res.user) {
        setDevModeOverride(null);
        devModeRef.current = null;
        setCurrentUser(res.user);

        if (rememberMe) {
          // 🔒 자동 로그인 체크(ON) 시: localStorage에 저장 (브라우저 닫아도 유지, 12시간 세션 타이머 가동)
          localStorage.setItem('nurioh_user_id', String(res.user.id));
          localStorage.setItem('nurioh_user_profile', JSON.stringify(res.user));
          localStorage.setItem('nurioh_remember_me', 'true');
          localStorage.setItem('nurioh_login_timestamp', String(Date.now()));
          sessionStorage.removeItem('nurioh_user_id');
          sessionStorage.removeItem('nurioh_user_profile');
          sessionStorage.removeItem('nurioh_login_timestamp');
        } else {
          // 🚪 자동 로그인 해제(OFF - 기본값) 시: sessionStorage에만 저장 (브라우저 닫으면 즉시 로그아웃)
          sessionStorage.setItem('nurioh_user_id', String(res.user.id));
          sessionStorage.setItem('nurioh_user_profile', JSON.stringify(res.user));
          sessionStorage.setItem('nurioh_login_timestamp', String(Date.now()));
          localStorage.removeItem('nurioh_user_id');
          localStorage.removeItem('nurioh_user_profile');
          localStorage.removeItem('nurioh_remember_me');
          localStorage.removeItem('nurioh_login_timestamp');
        }

        setIsKakaoModalOpen(false);
        if (!res.user.hasApiKey) {
          setIsApiModalOpen(true);
        }
        await loadData();
      }
    } catch (err) {
      console.error('Kakao login failed:', err);
      alert('로그인 처리 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
  };

  // 회원 프로필 정보 실시간 동기화 및 스토리지 영구 반영
  const handleUpdateUser = (updatedUser) => {
    if (!updatedUser) return;
    setCurrentUser(prev => ({
      ...prev,
      ...updatedUser
    }));
    if (localStorage.getItem('nurioh_remember_me') === 'true') {
      localStorage.setItem('nurioh_user_profile', JSON.stringify(updatedUser));
      localStorage.setItem('nurioh_user_id', String(updatedUser.id));
    } else {
      sessionStorage.setItem('nurioh_user_profile', JSON.stringify(updatedUser));
      sessionStorage.setItem('nurioh_user_id', String(updatedUser.id));
    }
  };

  // 🧪 연구실(LAB) 원클릭 최고 개발자 로그인 핸들러
  const handleLabDevLogin = () => {
    try {
      sessionStorage.removeItem('nurioh_lab_explicit_logout');
      sessionStorage.setItem('nurioh_user_id', '1');
      sessionStorage.setItem('nurioh_user_profile', JSON.stringify(LAB_DEV_USER));
    } catch (e) {}
    setCurrentUser(LAB_DEV_USER);
    setDevModeOverride({ tier: 'VIP', role: 'DEVELOPER', maxSlots: 9 });
    devModeRef.current = { tier: 'VIP', role: 'DEVELOPER', maxSlots: 9 };
    setIsKakaoModalOpen(false);
    loadData();
  };

  // 🚪 철저한 보안 로그아웃: 모든 스토리지 데이터 및 타이머 파기 후 안전하게 메인 랜딩으로 리셋
  const handleLogout = () => {
    setDevModeOverride(null);
    devModeRef.current = null;
    try {
      localStorage.removeItem('nurioh_user_id');
      localStorage.removeItem('nurioh_user_profile');
      localStorage.removeItem('nurioh_remember_me');
      localStorage.removeItem('nurioh_login_timestamp');
      sessionStorage.removeItem('nurioh_user_id');
      sessionStorage.removeItem('nurioh_user_profile');
      sessionStorage.removeItem('nurioh_login_timestamp');
      sessionStorage.clear();
      // 🧪 연구실에서 명시적 로그아웃 시 랜딩페이지를 볼 수 있도록 플래그 설정
      if (isLabEnvironment) {
        sessionStorage.setItem('nurioh_lab_explicit_logout', 'true');
      }
    } catch (e) {}
    setCurrentUser(null);
    // ⚡ 브라우저 페이지 전체 리셋으로 메모리 잔여 데이터 및 웹소켓 완전 종료
    window.location.replace('/');
  };

  // API 키 등록 핸들러
  const handleRegisterApiKey = async (accessKey, secretKey) => {
    const userId = currentUser?.id || 1;
    const res = await registerApiKey(userId, accessKey, secretKey);
    loadData();
    return res;
  };

  // 봇 가동 토글 (즉각적인 Optimistic UI 반응)
  const handleToggleBot = async () => {
    const nextRunning = !botRunning;
    setBotRunning(nextRunning); // ⚡ 0.001초 즉시 반응!
    try {
      if (nextRunning) {
        await startBot();
      } else {
        await stopBot();
      }
    } catch (err) {
      console.error('Bot toggle error:', err);
      setBotRunning(!nextRunning);
    }
  };

  // 전략 설정 저장
  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  // 슬롯 설정 수정 (즉각적인 Optimistic UI 반영)
  const handleUpdateSlot = async (slotId, slotData) => {
    // 🛡️ 수정 시점 타임스탬프 기록 (최근 15초간 백그라운드 폴링 롤백 방어)
    lastSlotUpdatesRef.current[slotId] = Date.now();

    // ⚡ 1. 프론트엔드 상태를 0.001초 만에 즉시 업데이트하여 버튼 및 UI가 딜레이 없이 즉각 전환!
    setSlots(prevSlots => prevSlots.map(s => {
      if (s.slotId === slotId) {
        return { ...s, ...slotData };
      }
      return s;
    }));

    // ⚡ 2. 백그라운드에서 백엔드 DB 저장 동기화
    try {
      const validUserId = getValidAuthUserId();
      const userId = currentUser?.id || validUserId || 1;
      const res = await updateSlotConfig(slotId, { ...slotData, userId });
      if (res && res.success && res.isEnabled !== undefined) {
        setSlots(prevSlots => prevSlots.map(s => {
          if (s.slotId === slotId) {
            return { ...s, isEnabled: res.isEnabled };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('Slot update error:', err);
    }
  };

  // 슬롯 개별 긴급 매도
  const handleSellSlot = async (slotId) => {
    const slot = slots.find(s => s.slotId === slotId);
    const targetMkt = slot?.targetMarket || 'KRW-BTC';
    const currentPrice = livePriceMap[targetMkt]?.trade_price || slot?.entryPrice || 0;
    const userId = currentUser?.id || 1;
    const volume = parseFloat(slot?.entryVolume || 0);
    const evalAmount = (volume > 0 && currentPrice > 0) ? (volume * currentPrice) : (slot?.entryAmountKrw || 0);

    // 🛡️ 5,000원 미만 사전 검증 및 안전 분기
    if (evalAmount > 0 && evalAmount < 5000) {
      const confirmUnlink = window.confirm(
        `⚠️ [업비트 최소 주문 규정 안내]\n\n현재 ${targetMkt}의 총 평가금액은 약 ${Math.round(evalAmount).toLocaleString()}원으로, 업비트 최소 매도 가능 금액(5,000원) 미만입니다.\n\n업비트에서는 5,000원 미만 매도가 불가능하므로, 거래소 주문 없이 슬롯 연동만 해제(비우기)하시겠습니까?`
      );
      if (!confirmUnlink) return;

      try {
        const res = await sellSlotPosition(slotId, { userId, currentPrice, unlinkOnly: true });

        // ⚡ 슬롯 0초 즉각 비우기 및 기본 코인 재설정 (Optimistic Instant Clear)
        const defaultMarkets = { 1: 'KRW-BTC', 2: 'KRW-ETH', 3: 'KRW-SOL', 4: 'KRW-XRP', 5: 'KRW-DOGE', 6: 'KRW-ADA', 7: 'KRW-AVAX', 8: 'KRW-DOT', 9: 'KRW-NEAR' };
        setSlots(prev => {
          const updated = prev.map(s => s.slotId === slotId ? {
            ...s,
            positionStatus: 'IDLE',
            targetMarket: defaultMarkets[slotId] || 'KRW-BTC',
            entryPrice: null,
            entryVolume: null,
            entryAmountKrw: null,
            highestPrice: null,
            highestProfitPct: 0
          } : s);
          try { localStorage.setItem('nurioh_cached_slots', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });

        delete slotTrackersRef.current[slotId];
        lastSlotUpdatesRef.current[slotId] = Date.now();

        alert(`✅ ${res?.message || '슬롯 연동이 정상적으로 해제되었습니다.'}`);
      } catch (err) {
        alert('연동 해제 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
      }
      await loadData();
      return;
    }

    try {
      const res = await sellSlotPosition(slotId, { userId, currentPrice });

      // ⚡ 슬롯 0초 즉각 비우기 (Optimistic Instant Clear)
      setSlots(prev => {
        const updated = prev.map(s => s.slotId === slotId ? {
          ...s,
          positionStatus: 'IDLE',
          entryPrice: null,
          entryVolume: null,
          entryAmountKrw: null,
          highestPrice: null,
          highestProfitPct: 0
        } : s);
        try { localStorage.setItem('nurioh_cached_slots', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      delete slotTrackersRef.current[slotId];
      lastSlotUpdatesRef.current[slotId] = Date.now();

      const profitPct = res?.profitPct ?? (((currentPrice - (slot?.entryPrice || currentPrice)) / (slot?.entryPrice || 1)) * 100);
      if (profitPct >= 0) {
        soundService.playProfitAlert();
      } else {
        soundService.playLossAlert();
        // 🧊 손절 시 쿨다운 등록
        const cooldownMinutes = settingsRef.current?.STOPLOSS_COOLDOWN_MINUTES !== undefined ? settingsRef.current.STOPLOSS_COOLDOWN_MINUTES : 15;
        if (cooldownMinutes > 0 && targetMkt) {
          const unblockTime = Date.now() + (cooldownMinutes * 60 * 1000);
          stopLossCooldownsRef.current[targetMkt] = unblockTime;
          console.log(`🧊 [Manual StopLoss Cool-down] ${targetMkt} 손절 발생 -> ${cooldownMinutes}분간 재진입 차단`);
        }
      }

      if (res?.order?.uuid) {
        alert(`⚡ [업비트 실주문 접수 완료]\n${res.message}\n\n• 거래소 주문번호: ${res.order.uuid}\n• 매도 수량: ${res.order.volume}`);
      } else {
        alert(`✅ ${res?.message || '슬롯이 매도 청산되었습니다.'}`);
      }
    } catch (err) {
      console.error('Sell slot error:', err);
      const errMsg = err.response?.data?.error || err.message;
      alert(`⚠️ [매도 실패 - 슬롯 정보 보존]\n${errMsg}\n\n슬롯 코인 정보가 안전하게 그대로 유지됩니다.`);
    }
    await loadData();
  };

  // 📥 업비트 실보유 코인 특정 슬롯에 수동 연동 (Import)
  const handleImportCoin = async (slotId, coinData) => {
    const userId = currentUser?.id || 1;
    try {
      const res = await importSlotPosition(slotId, { ...coinData, userId });
      if (res && res.success) {
        const livePrice = coinData.currentPrice || coinData.entryPrice || 0;
        const initialProfitPct = (coinData.entryPrice && livePrice)
          ? (((livePrice - coinData.entryPrice) / coinData.entryPrice) * 100)
          : 0;

        // ⚡ 즉시 livePriceMap에 현재가 주입 (0.001초 만에 실시간 수익률 표시!)
        if (coinData.market && livePrice > 0) {
          setLivePriceMap(prev => ({
            ...prev,
            [coinData.market]: { code: coinData.market, trade_price: livePrice }
          }));
        }

        // 프론트엔드 슬롯 상태 즉시 IN_POSITION 및 활성화로 업데이트
        lastSlotUpdatesRef.current[slotId] = Date.now();
        setSlots(prevSlots => {
          const next = prevSlots.map(s => {
            if (s.slotId === slotId) {
              return {
                ...s,
                isEnabled: true,
                positionStatus: 'IN_POSITION',
                targetMarket: coinData.market,
                entryPrice: coinData.entryPrice,
                entryVolume: coinData.entryVolume,
                entryAmountKrw: coinData.entryAmountKrw,
                highestPrice: livePrice,
                highestProfitPct: Math.max(0, initialProfitPct)
              };
            }
            return s;
          });
          slotsRef.current = next;
          return next;
        });

        // Live Tracker 초기화
        slotTrackersRef.current[slotId] = {
          entryPrice: coinData.entryPrice,
          highestPrice: livePrice,
          highestProfitPct: Math.max(0, initialProfitPct),
          targetMarket: coinData.market
        };

        alert(`✅ [연동 완료] ${slotId}번 슬롯에 ${coinData.market} 코인이 성공적으로 등록되었습니다!\n실시간 트레일링 익절 & 손절 감시가 가동됩니다.`);
        await loadData();
      }
    } catch (err) {
      console.error('Import coin error:', err);
      alert('코인 연동 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
      throw err;
    }
  };

  // 📊 슬롯 개별 누적 통계 초기화
  const handleResetSlotStats = async (slotId) => {
    const userId = currentUser?.id || 1;
    try {
      await resetSlotStats(slotId, { userId });
      await loadData();
    } catch (err) {
      console.error('Reset slot stats error:', err);
    }
  };

  // 🚨 Panic Sell 전량 매도
  const handlePanicSellAll = async () => {
    const userId = currentUser?.id || 1;
    try {
      const res = await panicSellAll({ userId });
      alert(`🚨 [전 슬롯 긴급 매도]\n${res?.message || '모든 슬롯의 매도 청산이 완료되었습니다.'}`);
    } catch (err) {
      alert('전량 매도 오류: ' + (err.response?.data?.error || err.message));
    }
    loadData();
  };

  // ⚡ 모의 급등 신호 테스트 핸들러 (비어있는 슬롯을 찾아 0초 즉시 모의 매수 집행)
  const handleTriggerMockSurge = (targetMarket = 'RANDOM') => {
    try {
      const candidateMarkets = ['KRW-STX', 'KRW-SUI', 'KRW-NEAR', 'KRW-SOL', 'KRW-DOGE', 'KRW-ADA', 'KRW-AVAX', 'KRW-XRP'];
      const chosenMarket = (targetMarket === 'RANDOM' || !targetMarket)
        ? candidateMarkets[Math.floor(Math.random() * candidateMarkets.length)]
        : targetMarket;

      // 비어있는(IDLE) 슬롯 탐색
      const availableSlot = slots.find(s => s.isEnabled && s.positionStatus !== 'IN_POSITION') || slots[0];
      const slotId = availableSlot ? availableSlot.slotId : 1;
      const tradeAmount = (availableSlot && availableSlot.tradeAmountKrw > 0) ? availableSlot.tradeAmountKrw : 50000;

      const currentPrice = livePriceMap[chosenMarket]?.trade_price || 
        (chosenMarket === 'KRW-SOL' ? 245000 : (chosenMarket === 'KRW-SUI' ? 4250 : (chosenMarket === 'KRW-STX' ? 2890 : 850)));

      setSelectedSlotId(slotId);
      soundService.playBuyAlert();

      // 프론트엔드 슬롯 상태 즉시 IN_POSITION으로 업데이트
      setSlots(prevSlots => prevSlots.map(s => {
        if (s.slotId === slotId) {
          return {
            ...s,
            targetMarket: chosenMarket,
            positionStatus: 'IN_POSITION',
            entryPrice: currentPrice,
            entryVolume: tradeAmount / currentPrice,
            entryAmountKrw: tradeAmount,
            highestPrice: currentPrice,
            highestProfitPct: 0
          };
        }
        return s;
      }));

      // 체결 이력에 기록
      const executedSignal = {
        id: `SIG-${Date.now()}`,
        type: 'BUY',
        slotId: slotId,
        market: chosenMarket,
        price: currentPrice,
        amount: tradeAmount,
        reason: '실시간 급등 레이더 포착 (+2.6% 돌파)',
        status: 'EXECUTED',
        timestamp: new Date().toLocaleTimeString('ko-KR')
      };

      setTradeHistory(prev => [executedSignal, ...prev.slice(0, 49)]);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚡ [급등 매수 체결 완료]', {
          body: `${slotId}번 슬롯: ${chosenMarket} ${tradeAmount.toLocaleString()}원 즉시 체결 완료!`,
          icon: '/favicon.png'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 수동 승인
  const handleApprove = async (signalId) => {
    const signal = pendingApproval;
    const userId = currentUser?.id || 1;
    await approveTrade({
      signalId,
      userId,
      slotId: signal?.slotId || 1,
      market: signal?.market || 'KRW-BTC',
      price: signal?.price || 50000,
      amount: signal?.amount || 50000
    });
    setPendingApproval(null);
    await loadData();
  };

  // 수동 취소
  const handleReject = async (signalId, reason) => {
    await rejectTrade(signalId, reason);
    setPendingApproval(null);
  };

  // 🌟 로그인 전: 서비스 소개 랜딩페이지 표출
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-100 selection:bg-purple-500 selection:text-white">
        <LandingPage 
          onOpenKakaoLogin={(mode = 'login') => {
            setAuthModalMode(mode);
            setIsKakaoModalOpen(true);
          }} 
          onLabDevLogin={handleLabDevLogin}
        />

        {/* 🟡 카카오톡 간편 로그인 / 회원가입 모달 */}
        <KakaoAuthModal
          isOpen={isKakaoModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsKakaoModalOpen(false)}
          onLoginSuccess={handleKakaoLoginSuccess}
          onLabDevLogin={handleLabDevLogin}
        />

        {/* 📖 업비트 API 발급방법 가이드 모달 */}
        <UpbitGuideModal
          isOpen={isUpbitGuideOpen}
          onClose={() => setIsUpbitGuideOpen(false)}
          serverIp={serverIp}
        />

        {/* PWA 앱 설치 안내 */}
        <PwaInstallPrompt />
      </div>
    );
  }

  // 🎨 플랜별 차별화된 테마 바탕색 스타일
  const getThemeBgClass = () => {
    const tier = currentUser?.tier || 'FREE_TRIAL';
    if (tier === 'VIP' || currentUser?.role === 'ADMIN') {
      // 💎 VIP / 마스터: 럭셔리 딥 퍼플 & 로열 골드 테마
      return 'bg-[#0a0514] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/40 via-[#0a0514] to-[#040208]';
    }
    if (tier === 'PRO') {
      // ⚡ PRO 플랜: 세련된 딥 인디고 & 사이버 블루 테마
      return 'bg-[#060c1c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-[#060c1c] to-[#03060e]';
    }
    // 🆓 무료 체험: 모던하고 깔끔한 딥 슬레이트 & 차콜 테마
    return 'bg-[#090d16] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#090d16] to-[#04060b]';
  };

  // 🔄 강력 새로고침 (PWA 캐시 스토리지 초기화 & 최신 빌드 버전 강제 리로드)
  const handleHardRefresh = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.update();
        }
      }
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.href = url.toString();
  };

  return (
    <div className={`min-h-screen ${getThemeBgClass()} text-slate-100 selection:bg-emerald-500 selection:text-black flex flex-col font-sans pb-12 transition-colors duration-500`}>
      {/* 글로벌 네비게이션 헤더 */}
      <Header
        user={currentUser}
        hasApiKey={!accountError && hasRealAccounts}
        botRunning={botRunning}
        onToggleBot={handleToggleBot}
        onOpen2FA={() => setIs2FAModalOpen(true)}
        is2FAActive={is2FAActive}
        onOpenOperatorDashboard={() => setIsOperatorDashboardOpen(true)}
        onOpenAdmin={() => setIsAdminUsersOpen(true)}
        onOpenMyPage={() => setIsMyPageOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        onOpenNotice={() => setIsNoticeModalOpen(true)}
        onLogout={handleLogout}
        onRefresh={handleHardRefresh}
        marketCount={marketCount}
        btcProtection={btcProtection}
      />

      {/* 🔬 [실험실 전용 상단 띠 배너] 운영자/개발자 사전 체험 전용 안내 */}
      {isStagingLab && (
        <div className="bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-amber-700/90 text-white px-4 py-2 border-b border-amber-400/50 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="text-base animate-bounce">🔬</span>
              <span>[실험실 v3.1.0] 운영자 전용 사전 검증 공간입니다.</span>
              <span className="hidden md:inline text-amber-100/90 font-normal text-xs">
                (실서버 적용 전 신규 기능과 UI를 직접 테스트해 보세요. 개발자/운영자 승인 후 실서버로 배포됩니다.)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-black/30 text-amber-200 text-[11px] font-mono border border-amber-300/40 shrink-0">
              STAGING LAB
            </span>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 (상단 헤더와 좌우 라인 100% 일치) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* 계좌 잔고 요약 카드 */}
        <BalanceCard 
          accounts={accounts} 
          slots={visibleSlots}
          livePriceMap={livePriceMap} 
          serverIp={serverIp} 
          accountError={accountError}
          onOpenApiModal={() => setIsApiModalOpen(true)}
          marketCount={marketCount}
        />

        {/* 🎛️ 1~9번 독립 멀티 슬롯 분산 트레이딩 매니저 */}
        <SlotManager
          slots={visibleSlots}
          onUpdateSlot={handleUpdateSlot}
          onSellSlot={handleSellSlot}
          onResetSlotStats={handleResetSlotStats}
          onImportCoin={handleImportCoin}
          accounts={accounts}
          livePriceMap={livePriceMap}
          botRunning={botRunning}
          onToggleBot={handleToggleBot}
          onTriggerMockSurge={handleTriggerMockSurge}
          pendingSurgeCountdowns={pendingSurgeCountdowns}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
          krwBalance={parseFloat(accounts.find(a => a.currency === 'KRW')?.balance || '0')}
          currentUser={currentUser}
        />

        {/* 🌟 NURIOH TRADER 브랜드 소개 및 핵심 기능 자랑 쇼케이스 배너 */}
        <BrandShowcaseBanner marketCount={marketCount} />
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
        onLabDevLogin={handleLabDevLogin}
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

      {/* 👑 마스터 대표님 / 운영자 전용 회원 관리 패널 */}
      <AdminUserManagement
        isOpen={isAdminUsersOpen}
        onClose={() => setIsAdminUsersOpen(false)}
        currentUser={currentUser}
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
        hasApiKey={!accountError && hasRealAccounts}
        slots={slots}
        onUpdateSlot={handleUpdateSlot}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onReloadUser={loadData}
        onUpdateUser={handleUpdateUser}
        serverIp={serverIp}
      />

      {/* 📖 서비스 통합 매뉴얼 & 운영자 의견 수렴 모달 */}
      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        user={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMyPage={() => setIsMyPageOpen(true)}
      />

      {/* 📢 업비트 거래소 공지 & 신규 상장/상폐 현황판 모달 */}
      <NoticeBoardModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
      />

      {/* ⚡ 오늘 신규 상장 감지 팝업 모달 */}
      <TodayListingPopupModal
        isOpen={isTodayPopupOpen}
        todayNotice={COIN_NOTICES.find(n => n.isToday)}
        onClose={() => setIsTodayPopupOpen(false)}
        onOpenNoticeBoard={() => {
          setIsTodayPopupOpen(false);
          setIsNoticeModalOpen(true);
        }}
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
