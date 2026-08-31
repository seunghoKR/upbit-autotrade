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
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [candles, setCandles] = useState([]);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [livePriceMap, setLivePriceMap] = useState({});
  const [currentRsi, setCurrentRsi] = useState(50);
  const [currentBb, setCurrentBb] = useState(null);

  // ⚡ 각 슬롯별 독립적인 실시간 급등 감지 3초 카운트다운 상태 ({ [slotId]: countdownData })
  const [pendingSurgeCountdowns, setPendingSurgeCountdowns] = useState({});
  const countdownTimersRef = useRef({});
  const activeSurgeCoinsRef = useRef(new Set());

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
        if (status.accountError) setAccountError(status.accountError);
        else setAccountError(null);
        if (status.slots && Array.isArray(status.slots) && status.slots.length > 0) {
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

            return {
              ...s,
              id: s.id || s.slotId,
              slotId: s.slotId,
              slotName: s.slotName || s.name || `${s.slotId}번 슬롯`,
              positionStatus: hasPosition ? 'IN_POSITION' : 'IDLE',
              entryPrice: entryPrice,
              entryVolume: hasPosition ? (rawEntryVolume > 0 ? rawEntryVolume : (entryPrice > 0 ? rawAmount / entryPrice : null)) : null,
              entryAmountKrw: hasPosition ? (rawAmount > 0 ? rawAmount : (entryPrice && rawEntryVolume ? entryPrice * rawEntryVolume : null)) : null,
              highestPrice: highestPrice,
              highestProfitPct: highestProfitPct,
              targetMarket: s.targetMarket || 'KRW-BTC',
              targetProfitPct: parseFloat(s.targetProfitPct !== undefined ? s.targetProfitPct : (s.target_profit_pct !== undefined ? s.target_profit_pct : (s.trailingTargetProfitPct !== undefined ? s.trailingTargetProfitPct : 3.0))),
              trailingTargetProfitPct: parseFloat(s.trailingTargetProfitPct !== undefined ? s.trailingTargetProfitPct : (s.trailing_target_profit_pct !== undefined ? s.trailing_target_profit_pct : (s.targetProfitPct !== undefined ? s.targetProfitPct : 3.0))),
              trailingCallbackPct: parseFloat(s.trailingCallbackPct !== undefined ? s.trailingCallbackPct : (s.trailing_callback_pct !== undefined ? s.trailing_callback_pct : 1.0)),
              stopLossPct: parseFloat(s.stopLossPct !== undefined ? s.stopLossPct : (s.stop_loss_pct !== undefined ? s.stop_loss_pct : 2.0))
            };
          });
          setSlots(normalizedSlots);
        }
        if (status.pendingApproval) setPendingApproval(status.pendingApproval);
        if (status.tradeHistory) setTradeHistory(status.tradeHistory);

        // ⚡ [0.01초 즉시 동기화] 슬롯 대상 코인 및 보유 코인의 실시간 현재가를 REST API로 즉시 조회하여 livePriceMap에 주입!
        const relevantMarkets = Array.from(new Set([
          ...(status.slots || []).map(s => s.targetMarket).filter(Boolean),
          ...(status.accounts || []).map(a => `KRW-${a.currency}`).filter(Boolean),
          'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE', 'KRW-SAND', 'KRW-QTUM'
        ])).filter(m => m.startsWith('KRW-'));

        if (relevantMarkets.length > 0) {
          fetch(`https://api.upbit.com/v1/ticker?markets=${relevantMarkets.join(',')}`)
            .then(res => res.json())
            .then(tickers => {
              if (Array.isArray(tickers)) {
                const batch = {};
                tickers.forEach(t => {
                  if (t.market && t.trade_price) {
                    batch[t.market] = {
                      code: t.market,
                      trade_price: t.trade_price,
                      change: t.change,
                      change_rate: t.change_rate,
                      signed_change_rate: t.signed_change_rate,
                      trade_volume: t.trade_volume
                    };
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
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    // ⚡ [0.01초 초광속 초기화] 컴포넌트 마운트 즉시 주요 마켓 실시간 현재가 즉시 REST 선조회
    const instantMarkets = [
      'KRW-SAND', 'KRW-GRVT', 'KRW-DOGE', 'KRW-QTUM', 'KRW-BTC', 'KRW-ETH', 'KRW-XRP',
      'KRW-SOL', 'KRW-ADA', 'KRW-AVAX', 'KRW-DOT', 'KRW-NEAR', 'KRW-STX', 'KRW-SUI'
    ];
    fetch(`https://api.upbit.com/v1/ticker?markets=${instantMarkets.join(',')}`)
      .then(res => res.ok ? res.json() : [])
      .then(tickers => {
        if (Array.isArray(tickers) && tickers.length > 0) {
          const batch = {};
          tickers.forEach(t => {
            if (t.market && t.trade_price) {
              batch[t.market] = {
                code: t.market,
                trade_price: t.trade_price,
                change_rate: t.change_rate,
                signed_change_rate: t.signed_change_rate
              };
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

      if (!tickPrice || !tickCode) return;

      for (const slot of currentSlots) {
        // 개별 슬롯이 ON이고 포지션 보유 중인 경우 무조건 손절/익절 감시 실행!
        if (!slot.isEnabled || slot.positionStatus !== 'IN_POSITION') continue;
        if (slot.targetMarket !== tickCode) continue;

        // 진입가 대비 현재 수익률 계산 (진입가가 0 이하이거나 유효하지 않은 가상 상태는 방어)
        const entryPrice = Number(slot.entryPrice || 0);
        if (!entryPrice || entryPrice <= 0) continue;
        const currentProfitPct = ((tickPrice - entryPrice) / entryPrice) * 100;
        if (Math.abs(currentProfitPct) > 1000) continue;

        // 🛡️ Live slotTrackersRef를 통해 최고가/최고수익률 실시간 보존
        if (!slotTrackersRef.current[slot.slotId]) {
          slotTrackersRef.current[slot.slotId] = {
            entryPrice,
            highestPrice: slot.highestPrice || entryPrice,
            highestProfitPct: slot.highestProfitPct || 0,
            targetMarket: tickCode
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
        const highestPrice = tracker.highestPrice;

        // 🎯 추천전략 vs 셀프전략 분기
        const isSelf = (slot.strategyType === 'SELF');
        const targetProfitPct = isSelf 
          ? (parseFloat(slot.trailingTargetProfitPct !== undefined ? slot.trailingTargetProfitPct : (slot.targetProfitPct || 3.0))) 
          : (parseFloat(currentSettings.TRAILING_TARGET_PROFIT_PCT) || 3.0);
        const callbackPct = isSelf 
          ? (parseFloat(slot.trailingCallbackPct) || 1.0) 
          : (parseFloat(currentSettings.TRAILING_CALLBACK_PCT) || 1.0);
        const stopLossPct = isSelf 
          ? (parseFloat(slot.stopLossPct) || 2.0) 
          : (parseFloat(currentSettings.STOP_LOSS_PCT) || 2.0);

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
            : `손절 매도 (-${stopLossPct}% 손절 기준선 도달)`;

          console.log(`🚨 [Auto Sell Trigger] 슬롯 ${slot.slotId} (${slot.targetMarket}): ${reason} [현재수익률: ${currentProfitPct.toFixed(2)}%]`);

          // 즉시 슬롯 매도 실행 API 호출
          sellSlotPosition(slot.slotId, {
            userId: activeUser?.id || 1,
            currentPrice: tickPrice,
            reason: reason
          })
            .then(async (res) => {
              console.log('✅ [Auto Sell Success]', res);
              if (isTrailingProfitHit || currentProfitPct >= 0) {
                soundService.playProfitAlert();
              } else {
                soundService.playLossAlert();
                // 🧊 손절 발생 시 해당 코인 쿨다운 자동 등록 (연쇄 손절 방지)
                const cooldownMinutes = currentSettings.STOPLOSS_COOLDOWN_MINUTES !== undefined ? currentSettings.STOPLOSS_COOLDOWN_MINUTES : 15;
                if (cooldownMinutes > 0 && slot.targetMarket) {
                  const unblockTime = Date.now() + (cooldownMinutes * 60 * 1000);
                  stopLossCooldownsRef.current[slot.targetMarket] = unblockTime;
                  console.log(`🧊 [StopLoss Cool-down] ${slot.targetMarket} 손절 발생 -> ${cooldownMinutes}분간 재진입 차단 (${new Date(unblockTime).toLocaleTimeString()})`);
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

    // ⚡ 2초마다 슬롯에 배정된 코인들의 REST 현재가를 백그라운드에서 안전하게 최신화 & 손절/익절 감시
    const syncTimer = setInterval(() => {
      const activeCoins = Array.from(new Set(
        (slotsRef.current || [])
          .map(s => s.targetMarket)
          .filter(m => m && m.startsWith('KRW-'))
      ));
      if (activeCoins.length === 0) return;
      fetch(`https://api.upbit.com/v1/ticker?markets=${activeCoins.join(',')}`)
        .then(r => r.ok ? r.json() : [])
        .then(tickers => {
          if (Array.isArray(tickers) && tickers.length > 0) {
            const batch = {};
            tickers.forEach(t => {
              if (t.market && t.trade_price) {
                batch[t.market] = {
                  code: t.market,
                  trade_price: t.trade_price,
                  change_rate: t.change_rate,
                  signed_change_rate: t.signed_change_rate
                };
                evaluateSlotRisk(t.market, t.trade_price);
              }
            });
            setLivePriceMap(prev => ({ ...prev, ...batch }));
          }
        })
        .catch(() => {});
    }, 2000);

    loadData();

    // ⚡ 1. 브라우저 직접 업비트 실시간 웹소켓 & 급등 감지기 가동
    upbitClientEngine.init({
      onMarketsLoaded: (count) => {
        if (count && count >= 200) {
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
        if (tick.code === activeMarket) {
          setLivePrice(tick);
        }
        evaluateSlotRisk(tick.code, tick.trade_price);
      },
      onSurge: (tick, buffer) => {
        const activeUser = currentUserRef.current;
        // 🛡️ 비로그인 상태에서는 급등 감시 및 자동 매수 전면 차단
        if (!activeUser || !activeUser.id) return;

        const marketCode = tick.code.toUpperCase();
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
          const minVolumeKrw = isSelf 
            ? (slot.surgeMinVolumeKrw || 10000000) 
            : (currentSettings.SURGE_MIN_VOLUME_KRW || 10000000);
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

          // 🛡️ [쉴드 3] 단기 평균 체결가(VWAP) vs 최저가 기준 돌파 필터 (1틱 튐 노이즈 왜곡 방지)
          let basePrice = recentTicks[0].price;
          if (baseMode === 'VWAP') {
            const totalVol = recentTicks.reduce((sum, t) => sum + (t.volume || 0), 0);
            const totalAmt = recentTicks.reduce((sum, t) => sum + (t.amount || (t.price * (t.volume || 0))), 0);
            basePrice = (totalVol > 0 && totalAmt > 0) ? (totalAmt / totalVol) : recentTicks[0].price;
          } else {
            let minPrice = recentTicks[0].price;
            for (let i = 0; i < recentTicks.length; i++) {
              if (recentTicks[i].price < minPrice) minPrice = recentTicks[i].price;
            }
            basePrice = minPrice;
          }

          const currentPrice = recentTicks[recentTicks.length - 1].price;
          const priceDiffRate = ((currentPrice - basePrice) / basePrice) * 100;
          const totalVolumeKrw = recentTicks.reduce((sum, item) => sum + item.amount, 0);

          // 🛡️ [쉴드 4] 급등 지지 확인 시간 (Sustain Time Delay: 1초 윗꼬리 설거지 방어)
          const isSurgeConditionMet = (priceDiffRate >= rateThreshold && totalVolumeKrw >= minVolumeKrw);

          if (pendingSustainRef.current[marketCode]) {
            const sustainItem = pendingSustainRef.current[marketCode];
            // 1) 1초 만에 가격이 돌파 기준가 대비 -0.5% 이하로 꺾였으면 가짜 윗꼬리(설거지)로 판정하여 즉시 취소!
            if (currentPrice < sustainItem.baseBreakPrice * 0.995) {
              console.log(`🚫 [Sustain Cancelled] ${marketCode}: 1초 윗꼬리 하락 감지 (${currentPrice} < ${sustainItem.baseBreakPrice}) -> 가짜 펌핑 설거지 회피!`);
              delete pendingSustainRef.current[marketCode];
              activeSurgeCoinsRef.current.delete(marketCode);
              return;
            }

            // 2) 지지 유지 시간 검사
            const elapsedSec = (now - sustainItem.firstTriggerTime) / 1000;
            if (elapsedSec < sustainSeconds) {
              // 지지 검증 진행 중... (아직 매수하지 않고 대기)
              return;
            }

            // 🎉 3) N초간 가격을 단단하게 지켜냈음 -> 진짜 급등 확인! 즉시 매수 실행!
            console.log(`✨ [Sustain Verified] ${marketCode}: ${sustainSeconds}초간 가격 지지 성공 (+${priceDiffRate.toFixed(2)}%)! 진짜 급등주 매수 집행!`);
            delete pendingSustainRef.current[marketCode];
          } else {
            if (isSurgeConditionMet) {
              if (sustainSeconds > 0) {
                // ⏱️ 최초 돌파 포착 시 즉시 사지 않고 타이머 시작!
                console.log(`⏱️ [Sustain Wait] ${marketCode} 급등 포착 (+${priceDiffRate.toFixed(2)}%) -> ${sustainSeconds}초간 윗꼬리 방어 지지 검증 시작...`);
                activeSurgeCoinsRef.current.add(marketCode);
                pendingSustainRef.current[marketCode] = {
                  firstTriggerTime: now,
                  baseBreakPrice: currentPrice,
                  slotId: slot.slotId,
                  tradeAmount: slot.tradeAmountKrw || 50000,
                  currentPrice,
                  priceDiffRate,
                  windowSeconds,
                  totalVolumeKrw
                };
                return;
              }
            } else {
              return;
            }
          }

          // ⚡ 안전 쉴드 4단계를 모두 통과한 진짜 급등주 시장가 매수 집행!
          const assignedSlotId = slot.slotId;
          const tradeAmount = slot.tradeAmountKrw || 50000;
          console.log(`🚨 [Client Surge Verified Trigger] ${assignedSlotId}번 슬롯 안전 매수: ${marketCode} +${priceDiffRate.toFixed(2)}% (${windowSeconds}초 내 ${Math.round(totalVolumeKrw).toLocaleString()}원)`);

          // 코인 중복 진입 락 및 매수 실행 플래그 등록
          activeSurgeCoinsRef.current.add(marketCode);
          isExecutingBuyRef.current[assignedSlotId] = true;

          (async () => {
            try {
              // 1. 실제 업비트 시장가 매수 주문 먼저 전송 (체결 성공 여부 확인 후 UI 반영)
              const buyRes = await buySlotPosition(assignedSlotId, {
                userId: activeUser?.id || 1,
                market: marketCode,
                amountKrw: tradeAmount,
                currentPrice: currentPrice
              });

              if (buyRes && buyRes.success !== false && !buyRes.error) {
                console.log(`✅ [Auto Buy Success Slot ${assignedSlotId}]`, buyRes);
                soundService.playBuyAlert();
                setSelectedSlotId(assignedSlotId);

                // 2. 실제 체결 성공 시에만 슬롯 상태를 IN_POSITION으로 업데이트
                setSlots(prevSlots => prevSlots.map(s => {
                  if (s.slotId === assignedSlotId) {
                    return {
                      ...s,
                      positionStatus: 'IN_POSITION',
                      targetMarket: marketCode,
                      entryPrice: currentPrice,
                      entryVolume: tradeAmount / currentPrice,
                      entryAmountKrw: tradeAmount,
                      highestPrice: currentPrice,
                      highestProfitPct: 0
                    };
                  }
                  return s;
                }));

                // 3. 브라우저 푸시 알림
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('⚡ [안전 검증 급등 코인 매수 체결]', {
                    body: `${assignedSlotId}번 슬롯: ${marketCode} (+${priceDiffRate.toFixed(2)}%) ${Math.round(tradeAmount).toLocaleString()}원 체결! (트레일링 익절 가동)`,
                    icon: '/favicon.png'
                  });
                }

                await loadData();
              } else {
                console.warn(`⚠️ [Auto Buy Skipped/Failed Slot ${assignedSlotId}]`, buyRes?.error || '체결 불발');
                // 체결 불발 시 슬롯 상태를 절대 변경하지 않음 (즉시 깨끗한 빈 슬롯 유지)
              }
            } catch (buyErr) {
              console.error(`❌ [Auto Buy Failed Slot ${assignedSlotId}]`, buyErr);
              // 체결 실패 시 즉시 빈 슬롯 유지
            } finally {
              setTimeout(() => {
                activeSurgeCoinsRef.current.delete(marketCode);
                delete pendingSustainRef.current[marketCode];
                if (isExecutingBuyRef.current && typeof isExecutingBuyRef.current === 'object') {
                  delete isExecutingBuyRef.current[assignedSlotId];
                }
              }, 5000);
            }
          })();

          break; // 한 번에 한 슬롯만 트리거
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
    // ⚡ 1. 프론트엔드 상태를 0.001초 만에 즉시 업데이트하여 버튼 및 UI가 딜레이 없이 즉각 전환!
    setSlots(prevSlots => prevSlots.map(s => {
      if (s.slotId === slotId) {
        return { ...s, ...slotData };
      }
      return s;
    }));

    // ⚡ 2. 백그라운드에서 백엔드 DB 저장 동기화
    try {
      const userId = currentUser?.id || 1;
      await updateSlotConfig(slotId, { ...slotData, userId });
    } catch (err) {
      console.error('Slot update error:', err);
      await loadData();
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
        alert(`✅ ${res?.message || '슬롯 연동이 정상적으로 해제되었습니다.'}`);
      } catch (err) {
        alert('연동 해제 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
      }
      await loadData();
      return;
    }

    try {
      const res = await sellSlotPosition(slotId, { userId, currentPrice });
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

        // 프론트엔드 슬롯 상태 즉시 IN_POSITION으로 업데이트
        setSlots(prevSlots => {
          const next = prevSlots.map(s => {
            if (s.slotId === slotId) {
              return {
                ...s,
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
      <div className="min-h-screen bg-dark-bg text-slate-100 selection:bg-emerald-500 selection:text-black">
        <LandingPage 
          onOpenKakaoLogin={(mode = 'login') => {
            setAuthModalMode(mode);
            setIsKakaoModalOpen(true);
          }} 
        />

        {/* 🟡 카카오톡 간편 로그인 / 회원가입 모달 */}
        <KakaoAuthModal
          isOpen={isKakaoModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsKakaoModalOpen(false)}
          onLoginSuccess={handleKakaoLoginSuccess}
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
        onLogout={handleLogout}
        onRefresh={loadData}
        marketCount={marketCount}
      />

      {/* 메인 콘텐츠 영역 (상단 헤더와 좌우 라인 100% 일치) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* 계좌 잔고 요약 카드 */}
        <BalanceCard 
          accounts={accounts} 
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
