/**
 * Any Life AI - 24/7 Cloud Background Trading Daemon
 * 
 * 🏢 기능:
 * 1. 24시간 365일 브라우저/PC 화면 꺼짐과 무관하게 iwinv 클라우드 서버에서 백그라운드 상시 구동.
 * 2. 업비트 전체 원화마켓(KRW) 실시간 웹소켓 틱을 중앙 1개 파이프라인으로 초고속 감시.
 * 3. https://anylifeai.kr 의 활성 슬롯 및 회원 설정을 주기적 동기화.
 * 4. 목표 익절(+3.0% 트레일링 스탑) 및 원금 손절(-2.0%) 발생 시 0.01초 만에 즉시 실서버 매도 API 트리거.
 * 5. 급등 거래량 및 당일 고가 돌파 신호 발생 시 실서버 매수 API 트리거.
 */

const WebSocket = require('ws');
const axios = require('axios');

// 실서버 API 베이스 URL
const API_BASE_URL = process.env.API_BASE_URL || 'https://anylifeai.kr/api';

// 로깅 헬퍼
function log(msg, ...args) {
  const kstTime = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${kstTime} KST] [AnyLife-24H] ${msg}`, ...args);
}

function warn(msg, ...args) {
  const kstTime = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  console.warn(`[${kstTime} KST] ⚠️ [AnyLife-24H] ${msg}`, ...args);
}

function error(msg, ...args) {
  const kstTime = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  console.error(`[${kstTime} KST] 🚨 [AnyLife-24H] ${msg}`, ...args);
}

class CloudTradingDaemon {
  constructor() {
    this.ws = null;
    this.isWsConnected = false;
    this.reconnectTimer = null;
    this.syncTimer = null;
    
    // 캐시 상태
    this.markets = [];
    this.slots = [];
    this.botEnabled = true;
    this.livePriceMap = {};
    
    // 비트코인 하락 방어 버퍼 (KRW-BTC 최근 3분)
    this.btcBuffer = [];
    
    // 급등 코인 쿨다운 (동일 마켓 중복 매수 방지)
    this.lastBuyTimes = new Map();
    this.buyCooldownMs = 30000; // 30초 쿨다운
    
    // 처리 중 락 (중복 주문 방지)
    this.processingSlots = new Set();
  }

  async start() {
    log('🚀 Any Life AI 24시간 무중단 클라우드 트레이딩 데몬을 가동합니다...');
    
    // 1. 전체 마켓 목록 로드
    await this.loadMarkets();
    
    // 2. 초기 슬롯 상태 동기화
    await this.syncSlotsFromCloud();
    
    // 3. 업비트 웹소켓 연결
    this.connectUpbitWs();
    
    // 4. 슬롯 상태 주기적 동기화 (15초마다)
    this.syncTimer = setInterval(() => {
      this.syncSlotsFromCloud().catch(err => warn('슬롯 동기화 일시 오류:', err.message));
    }, 15000);
    
    // 5. 마켓 목록 갱신 (1시간마다)
    setInterval(() => {
      this.loadMarkets().catch(err => warn('마켓 목록 갱신 일시 오류:', err.message));
    }, 3600000);
    
    log('✅ Any Life AI 24시간 백엔드 데몬 가동 완료! (365일 상시 감시 중)');
  }

  /**
   * 1. 업비트 전체 원화(KRW) 마켓 목록 조회
   */
  async loadMarkets() {
    try {
      const res = await axios.get('https://api.upbit.com/v1/market/all?isDetails=false', { timeout: 8000 });
      if (Array.isArray(res.data)) {
        this.markets = res.data
          .filter(m => m.market && m.market.startsWith('KRW-'))
          .map(m => m.market);
        log(`📊 업비트 KRW 마켓 총 ${this.markets.length}개 종목 로드 완료`);
      }
    } catch (err) {
      warn('마켓 목록 조회 실패 (기본 메이저 마켓으로 대체):', err.message);
      if (this.markets.length === 0) {
        this.markets = [
          'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE', 'KRW-ADA',
          'KRW-AVAX', 'KRW-DOT', 'KRW-NEAR', 'KRW-STX', 'KRW-SUI', 'KRW-SHIB'
        ];
      }
    }
  }

  /**
   * 2. 실서버(anylifeai.kr)로부터 슬롯 설정 및 가동 상태 동기화
   */
  async syncSlotsFromCloud() {
    try {
      const statusRes = await axios.get(`${API_BASE_URL}/status`, { timeout: 7000 });
      if (statusRes.data) {
        this.botEnabled = statusRes.data.botRunning !== false;
        if (Array.isArray(statusRes.data.slots)) {
          this.slots = statusRes.data.slots;
        }
      }
    } catch (err) {
      // 일시적 네트워크 지연 시 기존 메모리 캐시 유지
      warn('실서버 슬롯 상태 동기화 지연:', err.message);
    }
  }

  /**
   * 3. 업비트 실시간 웹소켓 스트림 연결
   */
  connectUpbitWs() {
    if (this.ws) {
      try { this.ws.terminate(); } catch (e) {}
    }

    if (this.markets.length === 0) {
      setTimeout(() => this.connectUpbitWs(), 3000);
      return;
    }

    log(`🌐 업비트 웹소켓 연결 시도 중... (${this.markets.length}개 전종목 구독)`);
    this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');

    this.ws.on('open', () => {
      this.isWsConnected = true;
      log('⚡ 업비트 웹소켓 실시간 연결 성공! 24시간 시세 스트림 감시 시작');

      // 구독 페이로드 전송
      const payload = [
        { ticket: `anylife-daemon-${Date.now()}` },
        { type: 'ticker', codes: this.markets, isOnlyRealtime: true }
      ];
      this.ws.send(JSON.stringify(payload));
    });

    this.ws.on('message', (data) => {
      try {
        const text = data.toString('utf8');
        const tick = JSON.parse(text);
        if (tick && tick.code && tick.trade_price) {
          this.processRealtimeTick(tick);
        }
      } catch (err) {
        // 파싱 오류 무시
      }
    });

    this.ws.on('close', (code, reason) => {
      this.isWsConnected = false;
      warn(`업비트 웹소켓 연결 종료 (코드: ${code}). 3초 후 자동 재연결합니다.`);
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connectUpbitWs(), 3000);
    });

    this.ws.on('error', (err) => {
      error('업비트 웹소켓 오류 발생:', err.message);
    });
  }

  /**
   * 4. 실시간 틱 처리 & 매수/매도 트리거 평가
   */
  processRealtimeTick(tick) {
    const market = tick.code;
    const price = tick.trade_price;
    const now = Date.now();

    // 현재가 맵 갱신
    this.livePriceMap[market] = tick;

    // 🪙 비트코인(KRW-BTC) 틱 버퍼 갱신 (최근 3분)
    if (market === 'KRW-BTC') {
      this.btcBuffer.push({ price, timestamp: now });
      const cutoff = now - 180000;
      while (this.btcBuffer.length > 0 && this.btcBuffer[0].timestamp < cutoff) {
        this.btcBuffer.shift();
      }
    }

    // 🛡️ [BTC 급락 쉴드 점검]
    let isBtcDumping = false;
    if (this.btcBuffer.length >= 2) {
      const btcOldest = this.btcBuffer[0].price;
      const btcLatest = this.btcBuffer[this.btcBuffer.length - 1].price;
      const btcDropPct = ((btcLatest - btcOldest) / btcOldest) * 100;
      if (btcDropPct <= -0.5) {
        isBtcDumping = true; // 비트코인 급락 중 -> 알트코인 신규 매수 차단
      }
    }

    // 봇 마스터가 꺼져있으면 매매 평가 중단
    if (!this.botEnabled) return;

    // A. [보유 포지션 슬롯 익절/손절 실시간 평가]
    for (const slot of this.slots) {
      if (!slot.isEnabled) continue;
      if (slot.positionStatus !== 'IN_POSITION' || !slot.targetMarket) continue;
      if (slot.targetMarket !== market) continue;

      this.evaluatePositionExit(slot, price);
    }

    // B. [대기 중(IDLE) 슬롯 신규 매수 조건 평가]
    if (!isBtcDumping) {
      this.evaluateNewEntry(tick);
    }
  }

  /**
   * 5. 포지션 청산(익절/손절/트레일링 스탑) 평가
   */
  async evaluatePositionExit(slot, currentPrice) {
    const slotId = slot.slotId || slot.id;
    if (this.processingSlots.has(slotId)) return;

    const entryPrice = Number(slot.entryPrice) || (slot.position && Number(slot.position.entryPrice)) || 0;
    if (entryPrice <= 0) return;

    // 수익률 계산
    const profitRatePct = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    // 최고가 갱신
    if (!slot.highestPrice || currentPrice > slot.highestPrice) {
      slot.highestPrice = currentPrice;
      slot.highestProfitPct = Math.max(slot.highestProfitPct || 0, profitRatePct);
    }

    const highestProfit = slot.highestProfitPct || profitRatePct;
    const stopLossPct = Number(slot.stopLossPct) || 2.0;

    // 1) 🛑 원금 손절선 터치 (-2.0% 등)
    if (profitRatePct <= -Math.abs(stopLossPct)) {
      await this.triggerSellOrder(slotId, currentPrice, `손절선 도달 (${profitRatePct.toFixed(2)}% <= -${stopLossPct}%)`);
      return;
    }

    // 2) 🎯 트레일링 스탑 익절선 평가
    const tier1Target = Number(slot.trailingTier1TargetProfitPct) || 3.0;
    const tier1Callback = Number(slot.trailingTier1CallbackPct) || 0.5;
    const tier2Hurdle = Number(slot.trailingTier2HurdlePct) || 10.0;
    const tier2Callback = Number(slot.trailingTier2CallbackPct) || 2.0;

    // 2차 허들(+10%) 돌파 후 되돌림
    if (highestProfit >= tier2Hurdle) {
      const hurdleDrop = highestProfit - profitRatePct;
      if (hurdleDrop >= tier2Callback) {
        await this.triggerSellOrder(slotId, currentPrice, `2차 트레일링 익절 (최고 +${highestProfit.toFixed(2)}% ➔ 되돌림 -${hurdleDrop.toFixed(2)}%)`);
        return;
      }
    }
    // 1차 허들(+3%) 돌파 후 되돌림
    else if (highestProfit >= tier1Target) {
      const hurdleDrop = highestProfit - profitRatePct;
      if (hurdleDrop >= tier1Callback) {
        await this.triggerSellOrder(slotId, currentPrice, `1차 트레일링 익절 (최고 +${highestProfit.toFixed(2)}% ➔ 되돌림 -${hurdleDrop.toFixed(2)}%)`);
        return;
      }
    }
  }

  /**
   * 6. 실서버 매도 API 호출
   */
  async triggerSellOrder(slotId, currentPrice, reason) {
    this.processingSlots.add(slotId);
    log(`🚨 [자동 매도 트리거] 슬롯 #${slotId} 청산 집행 사유: ${reason}, 현재가: ${currentPrice}`);

    try {
      const res = await axios.post(`${API_BASE_URL}/slots/${slotId}/sell`, {
        currentPrice,
        reason
      }, { timeout: 10000 });

      log(`✅ [매도 완료 응답] 슬롯 #${slotId}:`, res.data?.message || '성공');
      // 로컬 슬롯 상태 즉시 IDLE 전환
      const target = this.slots.find(s => (s.slotId || s.id) === slotId);
      if (target) {
        target.positionStatus = 'IDLE';
        target.targetMarket = null;
        target.entryPrice = 0;
      }
    } catch (err) {
      error(`매도 주문 실패 슬롯 #${slotId}:`, err.response?.data?.error || err.message);
    } finally {
      setTimeout(() => this.processingSlots.delete(slotId), 5000);
    }
  }

  /**
   * 7. 신규 진입(돌파/급등) 조건 평가
   */
  async evaluateNewEntry(tick) {
    const market = tick.code;
    const price = tick.trade_price;
    const accTradePrice24h = Number(tick.acc_trade_price_24h) || 0;
    const changeRate = (Number(tick.signed_change_rate) || 0) * 100;

    // 쿨다운 체크
    const lastBuy = this.lastBuyTimes.get(market) || 0;
    if (Date.now() - lastBuy < this.buyCooldownMs) return;

    // 기본 안전 필터: 24시간 누적 거래대금 50억 이상 & 상승률 +1.5% 이상
    if (accTradePrice24h < 5000000000 || changeRate < 1.5) return;

    // 가용한 IDLE 슬롯 탐색
    const idleSlot = this.slots.find(s => 
      s.isEnabled && 
      s.positionStatus === 'IDLE' && 
      !this.processingSlots.has(s.slotId || s.id)
    );

    if (!idleSlot) return; // 빈 슬롯 없음

    const slotId = idleSlot.slotId || idleSlot.id;
    await this.triggerBuyOrder(slotId, market, price, idleSlot.tradeAmountKrw || 50000);
  }

  /**
   * 8. 실서버 매수 API 호출
   */
  async triggerBuyOrder(slotId, market, currentPrice, amountKrw) {
    this.processingSlots.add(slotId);
    this.lastBuyTimes.set(market, Date.now());

    log(`🎯 [자동 매수 트리거] 슬롯 #${slotId} ➔ ${market} (금액: ${amountKrw.toLocaleString()}원, 진입가: ${currentPrice})`);

    try {
      const res = await axios.post(`${API_BASE_URL}/slots/${slotId}/buy`, {
        market,
        currentPrice,
        amountKrw
      }, { timeout: 10000 });

      log(`✅ [매수 완료 응답] 슬롯 #${slotId}:`, res.data?.message || '성공');
      // 로컬 슬롯 상태 즉시 IN_POSITION 전환
      const target = this.slots.find(s => (s.slotId || s.id) === slotId);
      if (target) {
        target.positionStatus = 'IN_POSITION';
        target.targetMarket = market;
        target.entryPrice = currentPrice;
      }
    } catch (err) {
      error(`매수 주문 실패 슬롯 #${slotId}:`, err.response?.data?.error || err.message);
    } finally {
      setTimeout(() => this.processingSlots.delete(slotId), 5000);
    }
  }
}

// 프로세스 실행
const daemon = new CloudTradingDaemon();
daemon.start().catch(err => {
  error('치명적 데몬 오류:', err);
  process.exit(1);
});
