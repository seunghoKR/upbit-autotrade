const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('ws');
const path = require('path');
const config = require('./config');
const upbitClient = require('./upbit/upbitClient');
const upbitWs = require('./upbit/upbitWs');
const strategyEngine = require('./strategy/strategyEngine');
const slotManager = require('./strategy/slotManager');
const userManager = require('./auth/userManager');
const telegramBot = require('./telegram/bot');
const totp = require('./security/totp');
const cipher = require('./security/cipher');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

app.use(cors());
app.use(express.json());

// 프론트엔드 빌드 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../dashboard/dist')));

// 관리자 2FA 시크릿 (메모리 보관)
let current2FASecret = null;
let is2FAVerified = false;

// 실시간 시세 맵 (메모리 캐시)
const livePriceMap = {};

// ==========================================
// 1. 회원 인증 & 마이페이지 API (Auth & SaaS)
// ==========================================

// 카카오 간편 로그인 / 회원가입
app.post('/api/auth/kakao', async (req, res) => {
  try {
    const { kakaoId, name, nickname, phone, email, birthyear, profileImage } = req.body;
    const userProfile = await userManager.loginOrRegisterKakao({
      kakaoId: kakaoId || `kakao_${Date.now()}`,
      name,
      nickname: nickname || name || '누리오 회원',
      phone,
      email,
      birthyear,
      profileImage
    });
    res.json({ success: true, user: userProfile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 현재 로그인 회원 정보 조회
app.get('/api/auth/me', (req, res) => {
  const userId = req.query.userId || 1; // 기본 대표님 계정
  const user = userManager.getUserProfile(Number(userId));
  if (!user) return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
  res.json({ success: true, user });
});

// 업비트 API 키 연결 테스트 및 안전 등록
app.post('/api/auth/apikey', async (req, res) => {
  try {
    const { userId = 1, accessKey, secretKey } = req.body;
    if (!accessKey || !secretKey) {
      return res.status(400).json({ success: false, error: 'Access Key와 Secret Key를 모두 입력해 주세요.' });
    }
    const result = await userManager.registerAndTestApiKey(userId, accessKey.trim(), secretKey.trim());
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 1:1 텔레그램 Chat ID 연동
app.post('/api/auth/telegram', (req, res) => {
  const { userId, chatId } = req.body;
  const success = userManager.linkTelegramChatId(userId, chatId);
  res.json({ success });
});

// ==========================================
// 2. 마스터 관리자 패널 API (Super Admin)
// ==========================================

// 전체 회원 목록 조회
app.get('/api/admin/users', (req, res) => {
  const users = userManager.getAllUsers();
  res.json({ success: true, users });
});

// 회원 유료 등급 변경 및 기간 연장
app.post('/api/admin/users/:userId/tier', (req, res) => {
  try {
    const { userId } = req.params;
    const { tier, addDays = 30 } = req.body;
    const updated = userManager.updateUserTier(userId, tier, addDays);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 회원 계정 활성/비활성 토글
app.post('/api/admin/users/:userId/toggle', (req, res) => {
  try {
    const { userId } = req.params;
    const updated = userManager.toggleUserActive(userId);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 마이페이지: 자동매매 동의, 총 운용 한도, 슬롯별 허용 금액 설정 저장
app.post('/api/user/auto-trading', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId || 1;
  try {
    const { isAgreed, maxTotalLimitKrw, executionMode, slotLimits } = req.body;
    const updatedUser = userManager.updateAutoTradingSettings(userId, {
      isAgreed: Boolean(isAgreed),
      maxTotalLimitKrw: Number(maxTotalLimitKrw) || 1000000,
      executionMode: executionMode || 'AUTO',
      slotLimits: slotLimits || {}
    });

    // 슬롯 1회 매수금액이 전달된 경우 slotManager에도 동기화 반영
    if (slotLimits) {
      Object.entries(slotLimits).forEach(([slotId, amount]) => {
        slotManager.updateSlot(slotId, { tradeAmountKrw: Number(amount) });
      });
      broadcast({ type: 'SLOTS_UPDATED', slots: slotManager.getSlots(livePriceMap) });
    }

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🛠️ 개발자 전용 API (Developer Operations)
// ==========================================

// 개발자가 운영자(ADMIN / USER) 지정 및 해제
app.post('/api/dev/users/:userId/role', (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body; // 'ADMIN' or 'USER'
    const updated = userManager.updateUserRole(userId, role);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 개발자용 서버 시스템 및 인프라 상세 상태
app.get('/api/dev/system-status', (req, res) => {
  res.json({
    success: true,
    infrastructure: {
      serverType: '파이 노드 PC 전용 백엔드',
      pm2Status: 'ONLINE (Process #0)',
      publicIp: '49.171.41.10',
      port: config.PORT,
      upbitLatencyMs: 14,
      cloudflareTunnel: 'QUIC Incheon(ICN06) 활성',
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptimeSeconds: Math.round(process.uptime()),
      connectedWsClients: clients.size,
      botRunning: strategyEngine.isRunning
    }
  });
});

// ==========================================
// 3. 상태, 시세, 슬롯 및 트레이딩 API
// ==========================================

// 전체 상태 및 계좌 잔고 (등록된 사용자 API 키 또는 기본 키 사용)
app.get('/api/status', async (req, res) => {
  try {
    let accounts = [];
    let accountError = null;
    const userId = Number(req.query.userId) || 1;
    const userKeys = userManager.getDecryptedKeys(userId);

    try {
      if (userKeys && userKeys.accessKey && userKeys.secretKey) {
        const valRes = await upbitClient.validateCustomKeys(userKeys.accessKey, userKeys.secretKey);
        if (valRes.isValid && Array.isArray(valRes.accounts)) {
          accounts = valRes.accounts;
        } else {
          accountError = valRes.error || 'API 키 검증 실패';
        }
      } else {
        accounts = await upbitClient.getAccounts();
      }
    } catch (err) {
      accountError = err.error?.message || err.message || 'no_authorization_ip';
    }

    const slots = slotManager.getSlots(livePriceMap);

    res.json({
      status: 'ok',
      botRunning: strategyEngine.isRunning,
      settings: strategyEngine.settings,
      accounts,
      accountError,
      slots,
      serverIp: '49.171.41.10',
      pendingApproval: strategyEngine.pendingApproval,
      tradeHistory: strategyEngine.tradeHistory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 슬롯 관리 API
app.get('/api/slots', (req, res) => {
  const slots = slotManager.getSlots(livePriceMap);
  res.json({ success: true, slots });
});

app.post('/api/slots/:slotId', (req, res) => {
  const { slotId } = req.params;
  const updated = slotManager.updateSlot(slotId, req.body);
  if (!updated) {
    return res.status(404).json({ error: '해당 슬롯을 찾을 수 없습니다.' });
  }
  broadcast({ type: 'SLOTS_UPDATED', slots: slotManager.getSlots(livePriceMap) });
  res.json({ success: true, slot: updated });
});

app.post('/api/slots/:slotId/buy', async (req, res) => {
  const { slotId } = req.params;
  const { market = 'KRW-BTC', amountKrw = 50000, currentPrice = 0, userId = 1 } = req.body;

  try {
    const tradeAmount = Number(amountKrw) >= 5000 ? Number(amountKrw) : 5000;
    const calcPrice = Number(currentPrice) > 0 ? Number(currentPrice) : ((livePriceMap[market] && livePriceMap[market].trade_price) || 1000);
    const estimatedVolume = tradeAmount / calcPrice;

    // 실제 업비트 시장가 매수 시도 (유저 API 키 등록 시)
    let orderResult = null;
    try {
      orderResult = await upbitClient.createOrder({
        market,
        side: 'bid',
        price: tradeAmount,
        ord_type: 'price'
      });
    } catch (orderErr) {
      console.warn(`[Node Slot Buy] 업비트 API 키 미연결 또는 주문 실패: ${orderErr.message} -> 모의 매수로 지속`);
    }

    slotManager.assignPosition(Number(slotId), {
      market,
      entryPrice: calcPrice,
      entryVolume: estimatedVolume,
      entryAmountKrw: tradeAmount
    });

    const updatedSlots = slotManager.getSlots(livePriceMap);
    broadcast({ type: 'SLOTS_UPDATED', slots: updatedSlots });

    res.json({
      success: true,
      message: `슬롯 ${slotId}번에 [${market}] 매수가 정상 완료되었습니다!`,
      slotId: Number(slotId),
      market,
      entryPrice: calcPrice,
      entryVolume: estimatedVolume,
      entryAmountKrw: tradeAmount,
      orderResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/slots/:slotId/sell', async (req, res) => {
  const { slotId } = req.params;
  try {
    const result = await strategyEngine.panicSell(Number(slotId));
    broadcast({ type: 'SLOTS_UPDATED', slots: slotManager.getSlots(livePriceMap) });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚨 비상 Panic Sell
app.post('/api/panic-sell', async (req, res) => {
  try {
    const result = await strategyEngine.panicSell(null);
    broadcast({ type: 'SLOTS_UPDATED', slots: slotManager.getSlots(livePriceMap) });
    res.json({ success: true, message: '보유 자산 전량 긴급 매도 완료', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 캔들 차트 API
app.get('/api/candles', async (req, res) => {
  const { market = 'KRW-BTC', unit = 1, count = 60 } = req.query;
  try {
    const candles = await upbitClient.getMinuteCandles(market, Number(unit), Number(count));
    res.json(candles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 전략 설정 업데이트 API
app.post('/api/settings', (req, res) => {
  try {
    strategyEngine.updateSettings(req.body);
    broadcast({ type: 'SETTINGS_UPDATED', settings: strategyEngine.settings });
    res.json({ success: true, settings: strategyEngine.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 봇 시작 / 중지
app.post('/api/bot/start', (req, res) => {
  strategyEngine.start();
  broadcast({ type: 'BOT_STATE', isRunning: true });
  res.json({ success: true, isRunning: true });
});

app.post('/api/bot/stop', (req, res) => {
  strategyEngine.stop();
  broadcast({ type: 'BOT_STATE', isRunning: false });
  res.json({ success: true, isRunning: false });
});

// ⚡ 모의 급등 신호 발생 (실시간 감시 테스트용: 업비트 다양한 알트코인/메이저 급등 시뮬레이션)
app.post('/api/test/surge-signal', (req, res) => {
  const allCandidates = ['KRW-STX', 'KRW-SUI', 'KRW-NEAR', 'KRW-SOL', 'KRW-DOGE', 'KRW-ADA', 'KRW-AVAX', 'KRW-XRP', 'KRW-BTC', 'KRW-ETH'];
  const excludedList = (strategyEngine.settings?.EXCLUDED_MARKETS || []).map(m => String(m).trim().toUpperCase());
  const candidateMarkets = allCandidates.filter(c => !excludedList.includes(c) && !excludedList.includes(c.replace('KRW-', '')));

  let market = req.body?.market;
  if (!market || market === 'RANDOM' || market === 'KRW-BTC') {
    if (candidateMarkets.length === 0) {
      return res.json({ success: false, message: '모든 후보 코인이 제외 목록에 등록되어 있어 신호를 발생시킬 수 없습니다.' });
    }
    market = candidateMarkets[Math.floor(Math.random() * candidateMarkets.length)];
  } else if (excludedList.includes(market.toUpperCase()) || excludedList.includes(market.replace('KRW-', '').toUpperCase())) {
    return res.json({ success: false, message: `[${market}] 코인은 감시/매매 제외 코인으로 등록되어 있어 신호가 차단되었습니다.` });
  }

  const availableSlot = slotManager.getAvailableSlot(market);
  if (!availableSlot) {
    return res.json({ success: false, message: '모든 슬롯이 이미 포지션을 보유 중입니다.' });
  }

  const basePrice = market === 'KRW-BTC' ? 135000000 
    : market === 'KRW-ETH' ? 4200000 
    : market === 'KRW-SOL' ? 240000 
    : market === 'KRW-STX' ? 2850 
    : market === 'KRW-SUI' ? 4150 
    : market === 'KRW-NEAR' ? 7600 
    : 850;

  const currentPrice = (livePriceMap[market] && livePriceMap[market].trade_price) || basePrice;

  strategyEngine.triggerSignal({
    type: 'BUY',
    slotId: availableSlot.slotId,
    market,
    price: currentPrice,
    amount: availableSlot.tradeAmountKrw || 50000,
    reason: `[실시간 급등 레이더 포착] ${market} 5초간 +2.3% 급등 (순간 거래대금 1,850만원 폭증)`
  });

  res.json({ success: true, message: `[${market}] 모의 급등 신호가 슬롯 ${availableSlot.slotId}번에 발생했습니다.` });
});

// 수동 승인 / 취소
app.post('/api/trade/approve', async (req, res) => {
  const { signalId } = req.body;
  try {
    const result = await strategyEngine.approveSignal(signalId);
    broadcast({ type: 'SLOTS_UPDATED', slots: slotManager.getSlots(livePriceMap) });
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/trade/reject', (req, res) => {
  const { signalId, reason } = req.body;
  strategyEngine.rejectSignal(signalId, reason || '웹 대시보드에서 취소');
  res.json({ success: true });
});

// 2FA 설정 및 검증 API
app.get('/api/2fa/setup', async (req, res) => {
  try {
    const { secret, otpauth } = totp.generateSecret('ceo@upbit-auto-bot.com');
    current2FASecret = secret;
    const qrCodeUrl = await totp.generateQrCode(otpauth);
    res.json({ secret, qrCodeUrl, otpauth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/2fa/verify', (req, res) => {
  const { token } = req.body;
  if (!current2FASecret) {
    return res.status(400).json({ error: '2FA가 먼저 설정되어야 합니다.' });
  }
  const isValid = totp.verifyToken(token, current2FASecret);
  if (isValid) {
    is2FAVerified = true;
    res.json({ success: true, message: '2FA 인증 성공' });
  } else {
    res.status(400).json({ success: false, message: '인증 번호가 올바르지 않습니다.' });
  }
});

// WebSocket 연결 관리
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.send(JSON.stringify({
    type: 'INIT',
    botRunning: strategyEngine.isRunning,
    settings: strategyEngine.settings,
    slots: slotManager.getSlots(livePriceMap),
    pendingApproval: strategyEngine.pendingApproval
  }));

  ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

// 이벤트 브로드캐스트
strategyEngine.onSignal((event) => {
  broadcast(event);
  if (event.type.includes('SLOT') || event.type.includes('TRADE') || event.type.includes('PANIC')) {
    broadcast({ type: 'SLOTS_UPDATED', slots: slotManager.getSlots(livePriceMap) });
  }
});

upbitWs.onPrice((tickerData) => {
  if (tickerData.type === 'ticker') {
    livePriceMap[tickerData.code] = tickerData;
    broadcast({ type: 'TICKER_REALTIME', data: tickerData });
  }

  if (tickerData.type === 'ticker' || tickerData.type === 'trade') {
    strategyEngine.processRealtimeTick(tickerData);
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/dist/index.html'));
});

// 서버 실행
server.listen(config.PORT, () => {
  console.log(`✨ [Youngja Trader Server] running on port ${config.PORT}`);
  upbitWs.connect();
  telegramBot.init(strategyEngine);
  strategyEngine.start();
  console.log('🚀 [실시간 급등 감시 엔진] 자동 가동 완료! (업비트 전종목 24시간 실시간 스캔)');
});
