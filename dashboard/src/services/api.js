import axios from 'axios';

const API_BASE = '/api';

// ==========================================
// 회원 인증 & SaaS API
// ==========================================

export const loginWithKakao = async (kakaoData) => {
  const res = await axios.post(`${API_BASE}/auth/kakao`, kakaoData);
  return res.data;
};

export const getUserProfile = async (userId = 1) => {
  const res = await axios.get(`${API_BASE}/auth/me`, { params: { userId } });
  return res.data;
};

export const registerApiKey = async (userId, accessKey, secretKey) => {
  const res = await axios.post(`${API_BASE}/auth/apikey`, { userId, accessKey, secretKey });
  return res.data;
};

export const linkTelegram = async (userId, chatId) => {
  const res = await axios.post(`${API_BASE}/auth/telegram`, { userId, chatId });
  return res.data;
};

export const saveAutoTradingSettings = async (settingsData) => {
  const res = await axios.post(`${API_BASE}/user/auto-trading`, settingsData);
  return res.data;
};

// ==========================================
// 🛠️ 개발자 전용 API (Developer Operations)
// ==========================================

export const updateUserRole = async (userId, role) => {
  const res = await axios.post(`${API_BASE}/dev/users/${userId}/role`, { role });
  return res.data;
};

export const getSystemStatus = async () => {
  const res = await axios.get(`${API_BASE}/dev/system-status`);
  return res.data;
};

// ==========================================
// 마스터 관리자 패널 API
// ==========================================

export const getAdminUsers = async () => {
  const res = await axios.get(`${API_BASE}/admin/users`);
  return res.data;
};

export const updateUserTier = async (userId, tier, addDays = 30) => {
  const res = await axios.post(`${API_BASE}/admin/users/${userId}/tier`, { tier, addDays });
  return res.data;
};

export const toggleUserActive = async (userId) => {
  const res = await axios.post(`${API_BASE}/admin/users/${userId}/toggle`);
  return res.data;
};

// ==========================================
// 트레이딩 & 봇 제어 API
// ==========================================

export const getBotStatus = async (userId = 1) => {
  const res = await axios.get(`${API_BASE}/status`, { params: { userId } });
  return res.data;
};

export const getCandles = async (market = 'KRW-BTC', unit = 1, count = 60) => {
  const res = await axios.get(`${API_BASE}/candles`, {
    params: { market, unit, count }
  });
  return res.data;
};

export const updateSettings = async (settings) => {
  const res = await axios.post(`${API_BASE}/settings`, settings);
  return res.data;
};

export const startBot = async () => {
  const res = await axios.post(`${API_BASE}/bot/start`);
  return res.data;
};

export const stopBot = async () => {
  const res = await axios.post(`${API_BASE}/bot/stop`);
  return res.data;
};

// ⚡ 모의 급등 신호 발생 (실시간 감시 테스트)
export const triggerMockSurge = async (market = 'KRW-BTC') => {
  const res = await axios.post(`${API_BASE}/test/surge-signal`, { market });
  return res.data;
};

// 멀티 슬롯 관련 API
export const getSlots = async () => {
  const res = await axios.get(`${API_BASE}/slots`);
  return res.data;
};

export const updateSlotConfig = async (slotId, slotData) => {
  const res = await axios.post(`${API_BASE}/slots/${slotId}`, slotData);
  return res.data;
};

export const sellSlotPosition = async (slotId) => {
  const res = await axios.post(`${API_BASE}/slots/${slotId}/sell`);
  return res.data;
};

// 비상 Panic Sell (전량 즉시 시장가 매도)
export const panicSellAll = async () => {
  const res = await axios.post(`${API_BASE}/panic-sell`);
  return res.data;
};

export const approveTrade = async (signalId) => {
  const res = await axios.post(`${API_BASE}/trade/approve`, { signalId });
  return res.data;
};

export const rejectTrade = async (signalId, reason) => {
  const res = await axios.post(`${API_BASE}/trade/reject`, { signalId, reason });
  return res.data;
};

export const get2FASetup = async () => {
  const res = await axios.get(`${API_BASE}/2fa/setup`);
  return res.data;
};

export const verify2FA = async (token) => {
  const res = await axios.post(`${API_BASE}/2fa/verify`, { token });
  return res.data;
};
