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
  buySlotPosition,
  sellSlotPosition,
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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const loginTimestamp = localStorage.getItem('nurioh_login_timestamp') || sessionStorage.getItem('nurioh_login_timestamp');
      if (loginTimestamp) {
        const elapsed = Date.now() - Number(loginTimestamp);
        if (elapsed > SESSION_MAX_AGE_MS) {
          // 🛡️ 12시간 경과로 세션 만료: 보안을 위해 토큰 자동 파기 후 재인증 요구
          localStorage.removeItem('nurioh_user_id');
          localStorage.removeItem('nurioh_user_profile');
          localStorage.removeItem('nurioh_remember_me');
          localStorage.removeItem('nurioh_login_timestamp');
          sessionStorage.removeItem('nurioh_user_id');
          sessionStorage.removeItem('nurioh_user_profile');
          sessionStorage.removeItem('nurioh_login_timestamp');
          return null;
        }
      }

      const sessionProfile = sessionStorage.getItem('nurioh_user_profile');
      if (sessionProfile) return JSON.parse(sessionProfile);

      const isRemembered = localStorage.getItem('nurioh_remember_me') === 'true';
      if (isRemembered) {
        const localProfile = localStorage.getItem('nurioh_user_profile');
        if (localProfile) return JSON.parse(localProfile);
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

  // ⚡ 실시간 급등 감지 3초 카운트다운 상태
  const [pendingSurgeCountdown, setPendingSurgeCountdown] = useState(null);
  const countdownTimerRef = useRef(null);

  // 회원 등급에 따른 슬롯 개수 제한 적용 (Free: 1개, Pro: 3개, VIP/운영자/개발자: 9개)
  const isPrivileged = (currentUser?.role === 'OPERATOR' || currentUser?.role === 'DEVELOPER' || currentUser?.role === 'ADMIN' || currentUser?.tier === 'VIP');
  const maxSlotsAllowed = isPrivileged ? 9 : (currentUser?.tier === 'PRO' ? 3 : 1);
  const effectiveSlots = (slots && slots.length > 0) ? slots : DEFAULT_SLOTS;
  const visibleSlots = effectiveSlots.slice(0, maxSlotsAllowed);

  // 현재 선택된 슬롯 및 대상 마켓
  const selectedSlot = visibleSlots.find(s => s.slotId === selectedSlotId) || visibleSlots[0] || effectiveSlots[0];
  const activeMarket = selectedSlot?.targetMarket || settings.DEFAULT_MARKET || 'KRW-BTC';

  // 1. 초기 데이터 및 회원 프로필 로드 (선택된 모드 유지)
  const loadData = async () => {
    try {
      const savedUserId = sessionStorage.getItem('nurioh_user_id') || localStorage.getItem('nurioh_user_id') || currentUser?.id;
      if (!savedUserId) {
        return;
      }

      const userRes = await getUserProfile(savedUserId).catch(() => null);
      if (userRes && userRes.user) {
        if (localStorage.getItem('nurioh_remember_me') === 'true') {
          localStorage.setItem('nurioh_user_profile', JSON.stringify(userRes.user));
        } else {
          sessionStorage.setItem('nurioh_user_profile', JSON.stringify(userRes.user));
        }

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
        if (status.accountError) setAccountError(status.accountError);
        else setAccountError(null);
        if (status.slots && Array.isArray(status.slots) && status.slots.length > 0) {
          const normalizedSlots = status.slots.map(s => {
            const hasPosition = (s.positionStatus === 'IN_POSITION' || s.positionStatus === 'HOLDING' || s.positionStatus === 'TRAILING_ACTIVE') || Boolean(s.entryPrice && s.entryPrice > 0);
            return {
              ...s,
              id: s.id || s.slotId,
              slotId: s.slotId,
              slotName: s.slotName || s.name || `${s.slotId}번 슬롯`,
              positionStatus: hasPosition ? 'IN_POSITION' : 'IDLE',
              entryPrice: hasPosition ? (s.entryPrice || s.position?.entryPrice) : null,
              entryVolume: hasPosition ? (s.entryVolume || s.position?.entryVolume) : null,
              entryAmountKrw: hasPosition ? (s.entryAmountKrw || s.position?.entryAmountKrw || (s.entryPrice * s.entryVolume)) : null,
              highestPrice: hasPosition ? (s.highestPrice || s.position?.highestPrice || s.entryPrice) : null,
              highestProfitPct: hasPosition ? (s.highestProfitPct || s.position?.highestProfitPct || 0) : 0,
              targetMarket: s.targetMarket || 'KRW-BTC'
            };
          });
          setSlots(normalizedSlots);
        }
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

  // ⚡ 실시간 업비트 웹소켓 및 급등 감지 연동 레퍼런스
  const slotsRef = useRef(slots);
  const currentUserRef = useRef(currentUser);
  const isExecutingBuyRef = useRef(false);
  const isExecutingSellRef = useRef({});

  const settingsRef = useRef(settings);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    loadData();

    // ⚡ 1. 브라우저 직접 업비트 실시간 웹소켓 & 급등 감지기 가동
    upbitClientEngine.init({
      onTick: (tick) => {
        setLivePriceMap(prev => ({ ...prev, [tick.code]: tick }));
        if (tick.code === activeMarket) {
          setLivePrice(tick);
        }

        // 🎯 1.1 보유 중인 슬롯의 실시간 트레일링 익절 & 손절 자동 검사
        const currentSlots = slotsRef.current || [];
        const activeUser = currentUserRef.current;
        const currentSettings = settingsRef.current || {};

        for (const slot of currentSlots) {
          if (!slot.isEnabled || slot.positionStatus !== 'IN_POSITION' || slot.targetMarket !== tick.code) {
            continue;
          }

          const entryPrice = slot.entryPrice || tick.trade_price;
          if (!entryPrice || entryPrice <= 0) continue;

          const currentPrice = tick.trade_price;
          const profitPct = ((currentPrice - entryPrice) / entryPrice) * 100;
          const highestPrice = Math.max(slot.highestPrice || entryPrice, currentPrice);
          const highestProfitPct = Math.max(slot.highestProfitPct || 0, profitPct);

          // 🎯 추천전략 슬롯 vs 셀프전략 슬롯 파라미터 분기
          const isSelf = (slot.strategyType === 'SELF');
          const targetProfit = isSelf 
            ? (slot.targetProfitPct || 3.0) 
            : (currentSettings.TRAILING_TARGET_PROFIT_PCT || 3.0);
          const callback = isSelf 
            ? (slot.trailingCallbackPct || 1.0) 
            : (currentSettings.TRAILING_CALLBACK_PCT || 1.0);
          const stopLoss = isSelf 
            ? -(slot.stopLossPct || 2.0) 
            : -(currentSettings.STOP_LOSS_PCT || 2.0);

          // 익절 조건 (최고점 찍고 콜백 또는 목표달성) 또는 손절 조건
          const isTakeProfit = (highestProfitPct >= targetProfit && (highestProfitPct - profitPct) >= callback);
          const isStopLoss = (profitPct <= stopLoss);

          if ((isTakeProfit || isStopLoss) && !isExecutingSellRef.current[slot.slotId]) {
            isExecutingSellRef.current[slot.slotId] = true;
            console.log(`🚨 [Auto Sell Triggered] ${slot.slotId}번 슬롯: 수익률 ${profitPct.toFixed(2)}% (익절:${isTakeProfit}, 손절:${isStopLoss})`);
            
            sellSlotPosition(slot.slotId, { currentPrice })
              .then((res) => {
                // 브라우저 웹 푸시 알림 발송
                if ('Notification' in window && Notification.permission === 'granted') {
                  const isWin = profitPct >= 0;
                  new Notification(isWin ? '🟢 [수익 실현 익절 완료]' : '🔴 [손실 제한 손절 완료]', {
                    body: `${slot.slotId}번 슬롯 (${slot.targetMarket}): 실현수익률 ${isWin ? '+' : ''}${profitPct.toFixed(2)}%`,
                    icon: '/favicon.png'
                  });
                }
                loadData();
              })
              .catch(err => {
                console.error('Auto Sell Error:', err);
              })
              .finally(() => {
                setTimeout(() => {
                  delete isExecutingSellRef.current[slot.slotId];
                }, 10000);
              });
          }
        }
      },
      onSurge: (tick, buffer) => {
        if (isExecutingBuyRef.current || pendingSurgeCountdown) return;

        const currentSettings = settingsRef.current || {};
        const excludedList = (currentSettings.EXCLUDED_MARKETS || []).map(m => String(m).trim().toUpperCase());

        // 🚫 1. 매매 제외 코인(Blacklist)은 급등 레이더 감시 및 자동 매수에서 즉시 100% 제외!
        const marketCode = tick.code.toUpperCase();
        const shortSymbol = marketCode.replace('KRW-', '');
        if (excludedList.includes(marketCode) || excludedList.includes(shortSymbol) || excludedList.includes(`KRW-${shortSymbol}`)) {
          return;
        }

        const currentSlots = slotsRef.current || [];
        const activeUser = currentUserRef.current;
        const now = Date.now();

        // 🛡️ 실제 주문 가능 원화 잔고 확인 (잔고 부족 시 매수 시도 원천 차단)
        const krwAccount = (accounts || []).find(a => a.currency === 'KRW');
        const availableKrw = parseFloat(krwAccount?.balance || 0);

        // 🎯 1.2 감시 대기 중(IDLE & isEnabled & tradeAmountKrw >= 5000)인 슬롯 찾기
        for (const slot of currentSlots) {
          if (!slot.isEnabled || slot.positionStatus === 'IN_POSITION' || (slot.tradeAmountKrw || 0) < 5000) {
            continue;
          }

          // 🛡️ 원화 잔고가 슬롯 1회 매수 설정액보다 부족하면 감시 및 매수 진행 금지!
          if (hasRealAccounts && availableKrw < (slot.tradeAmountKrw || 5000)) {
            continue;
          }

          // 🎯 추천전략 슬롯 vs 셀프전략 슬롯 급등 감지 파라미터 분기
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

          const windowMs = windowSeconds * 1000;
          const cutoff = now - windowMs;
          const recentTicks = buffer.filter(t => t.timestamp >= cutoff);
          if (recentTicks.length < 2) continue;

          // 10초 감시 설정 시 10초 이내라도(1초, 2초, 4초 만에라도) 윈도우 내 최저가 대비 목표 상승률에 도달하면 즉시 포착!
          let minPrice = recentTicks[0].price;
          for (let i = 0; i < recentTicks.length; i++) {
            if (recentTicks[i].price < minPrice) minPrice = recentTicks[i].price;
          }
          const currentPrice = recentTicks[recentTicks.length - 1].price;
          const priceDiffRate = ((currentPrice - minPrice) / minPrice) * 100;
          const totalVolumeKrw = recentTicks.reduce((sum, item) => sum + item.amount, 0);

          // 급등 조건 충족 시: [1단계] 발견 알림 ➔ [2단계] 3초 카운트다운 후 매수 체결 ➔ [3단계] 익절/손절 매도 체결
          if (priceDiffRate >= rateThreshold && totalVolumeKrw >= minVolumeKrw) {
            console.log(`🚨 [Client Surge Trigger] 포착! ${slot.slotId}번 슬롯 (${isSelf ? '셀프전략' : '추천전략'}): ${tick.code} +${priceDiffRate.toFixed(2)}% (${windowSeconds}초 윈도우 내 ${Math.round(totalVolumeKrw).toLocaleString()}원)`);

            // [1단계] 🚨 발견 알림 발송 & 슬롯 화면 카운트다운 표시
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🚨 [급등 코인 포착! 3초 후 매수]', {
                body: `${slot.slotId}번 슬롯: ${tick.code} +${priceDiffRate.toFixed(2)}% 급등 감지 (3초 후 시장가 매수 집행)`,
                icon: '/favicon.png'
              });
            }

            setSelectedSlotId(slot.slotId);
            setPendingSurgeCountdown({
              slotId: slot.slotId,
              market: tick.code,
              price: currentPrice,
              amount: slot.tradeAmountKrw,
              rate: priceDiffRate.toFixed(2),
              secondsLeft: 3
            });

            let secondsLeft = 3;
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

            countdownTimerRef.current = setInterval(async () => {
              secondsLeft -= 1;
              if (secondsLeft > 0) {
                setPendingSurgeCountdown(prev => prev ? { ...prev, secondsLeft } : null);
              } else {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
                setPendingSurgeCountdown(null);
                isExecutingBuyRef.current = true;

                try {
                  // [2단계] ⏱️ 3초 후 시장가 매수 집행
                  setSlots(prevSlots => prevSlots.map(s => {
                    if (s.slotId === slot.slotId) {
                      return {
                        ...s,
                        positionStatus: 'IN_POSITION',
                        targetMarket: tick.code,
                        entryPrice: currentPrice,
                        entryVolume: slot.tradeAmountKrw / currentPrice,
                        entryAmountKrw: slot.tradeAmountKrw,
                        highestPrice: currentPrice,
                        highestProfitPct: 0
                      };
                    }
                    return s;
                  }));

                  const buyRes = await buySlotPosition(slot.slotId, {
                    userId: activeUser?.id || 1,
                    market: tick.code,
                    amountKrw: slot.tradeAmountKrw,
                    currentPrice: currentPrice
                  });
                  console.log('✅ [Auto Buy Success]', buyRes);

                  // [2단계 체결 알림] ✅ 매수 체결 완료 푸시
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('✅ [급등 코인 매수 체결 완료]', {
                      body: `${slot.slotId}번 슬롯: ${tick.code} ${Math.round(slot.tradeAmountKrw).toLocaleString()}원 매수 체결 (트레일링 익절 감시 시작)`,
                      icon: '/favicon.png'
                    });
                  }

                  await loadData();
                } catch (buyErr) {
                  console.error('❌ [Auto Buy Failed]', buyErr);
                } finally {
                  setTimeout(() => {
                    isExecutingBuyRef.current = false;
                  }, 15000); // 15초 쿨다운
                }
              }
            }, 1000);

            break; // 한 번에 한 슬롯만 트리거
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
      if (ws) ws.close();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
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

  // 로그아웃
  const handleLogout = () => {
    setDevModeOverride(null);
    devModeRef.current = null;
    localStorage.removeItem('nurioh_user_id');
    localStorage.removeItem('nurioh_user_profile');
    localStorage.removeItem('nurioh_remember_me');
    localStorage.removeItem('nurioh_login_timestamp');
    sessionStorage.removeItem('nurioh_user_id');
    sessionStorage.removeItem('nurioh_user_profile');
    sessionStorage.removeItem('nurioh_login_timestamp');
    setCurrentUser(null);
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
    
    // 낙관적 즉시 IDLE 전환
    setSlots(prevSlots => prevSlots.map(s => {
      if (s.slotId === slotId) {
        return {
          ...s,
          positionStatus: 'IDLE',
          entryPrice: null,
          entryVolume: null,
          highestPrice: null,
          highestProfitPct: 0
        };
      }
      return s;
    }));

    try {
      const res = await sellSlotPosition(slotId, { userId, currentPrice });
      if (res?.order?.uuid) {
        alert(`⚡ [업비트 실주문 접수 완료]\n${res.message}\n\n• 거래소 주문번호: ${res.order.uuid}\n• 매도 수량: ${res.order.volume}`);
      } else if (res?.upbitError) {
        alert(`⚠️ [업비트 주문 전송 결과]\n${res.upbitError}\n\n(${res.message})`);
      } else {
        alert(`✅ ${res?.message || '슬롯이 매도 청산되었습니다.'}`);
      }
    } catch (err) {
      console.error('Sell slot error:', err);
      alert('매도 처리 중 오류가 발생했습니다: ' + (err.response?.data?.error || err.message));
    }
    await loadData();
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

  // ⚡ 모의 급등 신호 테스트 핸들러 (급등 감지 신호 발생 후 3초 카운트다운 ➔ 자동 매수 주문 실행)
  const handleTriggerMockSurge = (targetMarket = 'RANDOM') => {
    try {
      const candidateMarkets = ['KRW-STX', 'KRW-SUI', 'KRW-NEAR', 'KRW-SOL', 'KRW-DOGE', 'KRW-ADA', 'KRW-AVAX', 'KRW-XRP'];
      const chosenMarket = (targetMarket === 'RANDOM' || !targetMarket)
        ? candidateMarkets[Math.floor(Math.random() * candidateMarkets.length)]
        : targetMarket;

      const availableSlot = slots.find(s => s.isEnabled && s.positionStatus !== 'IN_POSITION') || slots[0];
      const slotId = availableSlot ? availableSlot.slotId : 1;
      const tradeAmount = (availableSlot && availableSlot.tradeAmountKrw > 0) ? availableSlot.tradeAmountKrw : 50000;

      const currentPrice = livePriceMap[chosenMarket]?.trade_price || 
        (chosenMarket === 'KRW-SOL' ? 245000 : (chosenMarket === 'KRW-SUI' ? 4250 : (chosenMarket === 'KRW-STX' ? 2890 : 850)));

      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      // 1. 해당 슬롯 선택 및 3초 카운트다운 알림 신호 시작!
      setSelectedSlotId(slotId);
      let secondsLeft = 3;
      setPendingSurgeCountdown({
        slotId,
        market: chosenMarket,
        price: currentPrice,
        amount: tradeAmount,
        rate: '2.6',
        secondsLeft: 3
      });

      countdownTimerRef.current = setInterval(async () => {
        secondsLeft -= 1;
        if (secondsLeft > 0) {
          setPendingSurgeCountdown(prev => prev ? { ...prev, secondsLeft } : null);
        } else {
          // 2. 3초 종료 시점: 즉시 전자동 매수 체결!
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setPendingSurgeCountdown(null);

          // 프론트엔드 슬롯 상태 IN_POSITION으로 업데이트
          setSlots(prevSlots => prevSlots.map(s => {
            if (s.slotId === slotId) {
              return {
                ...s,
                targetMarket: chosenMarket,
                positionStatus: 'IN_POSITION',
                entryPrice: currentPrice,
                entryVolume: tradeAmount / currentPrice,
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
            reason: `[실시간 급등 감시 레이더] ${chosenMarket} +2.6% 급등 포착 (3초 알림 후 전자동 매수 체결)`,
            status: 'EXECUTED',
            executedAt: new Date().toISOString()
          };
          setTradeHistory(prev => [executedSignal, ...prev]);

          // 백엔드 API 호출하여 DB 동기화
          try {
            await buySlotPosition(slotId, {
              userId: currentUser?.id || 1,
              market: chosenMarket,
              amountKrw: tradeAmount,
              currentPrice: currentPrice
            });
          } catch (e) {
            console.log('백엔드 매수 체결 동기화:', e.message);
          }

          await loadData();
        }
      }, 1000);

    } catch (err) {
      console.error('Mock surge countdown error:', err);
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
      />

      {/* 메인 콘텐츠 영역 (상단 헤더와 좌우 라인 100% 일치) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* 계좌 잔고 요약 카드 */}

        {/* 계좌 잔고 요약 카드 */}
        <BalanceCard 
          accounts={accounts} 
          livePriceMap={livePriceMap} 
          serverIp={serverIp} 
          accountError={accountError}
          onOpenApiModal={() => setIsApiModalOpen(true)}
        />

        {/* 🎛️ 1~9번 독립 멀티 슬롯 분산 트레이딩 매니저 */}
        <SlotManager
          slots={visibleSlots}
          onUpdateSlot={handleUpdateSlot}
          onSellSlot={handleSellSlot}
          livePriceMap={livePriceMap}
          botRunning={botRunning}
          onToggleBot={handleToggleBot}
          onTriggerMockSurge={handleTriggerMockSurge}
          pendingSurgeCountdown={pendingSurgeCountdown}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
          krwBalance={parseFloat(accounts.find(a => a.currency === 'KRW')?.balance || '0')}
          currentUser={currentUser}
        />

        {/* 실시간 체결 로그 & 텔레그램 알림 이력 */}
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
