/**
 * NURIOH TRADER - Dynamic Realtime Upbit WebSocket & Surge Engine
 * 브라우저에서 직접 업비트 공용 웹소켓(wss://api.upbit.com/websocket/v1)에 연결하여
 * 신규 상장 코인(ZKP 등)을 포함한 업비트 전체 원화(KRW) 마켓 전종목의 실시간 틱을 분석하고
 * 슬롯별 급등 감지 및 자동 매매를 완벽하게 집행합니다.
 */

// 🛡️ 기본 안전 마켓 폴백 목록 (네트워크 오류 시 비상용)
const FALLBACK_KRW_MARKETS = [
  'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE', 'KRW-ADA', 'KRW-AVAX', 'KRW-DOT',
  'KRW-NEAR', 'KRW-STX', 'KRW-SUI', 'KRW-SHIB', 'KRW-PEPE', 'KRW-LINK', 'KRW-ETC', 'KRW-BCH',
  'KRW-SEI', 'KRW-SAND', 'KRW-AXS', 'KRW-MANA', 'KRW-FLOW', 'KRW-EOS', 'KRW-TRX', 'KRW-XLM',
  'KRW-VET', 'KRW-NEO', 'KRW-GAS', 'KRW-QTUM', 'KRW-HBAR', 'KRW-ALGO', 'KRW-ICP', 'KRW-APT',
  'KRW-POL', 'KRW-WAVES', 'KRW-KNC', 'KRW-ZRX', 'KRW-CHZ', 'KRW-ENJ', 'KRW-BAT', 'KRW-STORJ',
  'KRW-SC', 'KRW-ANKR', 'KRW-GLM', 'KRW-WAXP', 'KRW-POWR', 'KRW-STRAX', 'KRW-MOC', 'KRW-TT',
  'KRW-IQ', 'KRW-CRE', 'KRW-MED', 'KRW-DKA', 'KRW-AHT', 'KRW-META', 'KRW-FCT2', 'KRW-CBK',
  'KRW-HUM', 'KRW-DVI', 'KRW-MILK', 'KRW-AERGO', 'KRW-BORA', 'KRW-AQT', 'KRW-MVL', 'KRW-TON',
  'KRW-STPT', 'KRW-CRO', 'KRW-T', 'KRW-PUNDIX', 'KRW-CELO', 'KRW-ELF', 'KRW-CVC', 'KRW-ARDR',
  'KRW-HIVE', 'KRW-KAVA', 'KRW-STMX', 'KRW-HUNT', 'KRW-ATOM', 'KRW-XTZ', 'KRW-ZIL', 'KRW-IOST',
  'KRW-ICX', 'KRW-THETA', 'KRW-TFUEL', 'KRW-MTL', 'KRW-UPP', 'KRW-BLUR', 'KRW-BIGTIME', 'KRW-ID',
  'KRW-CYBER', 'KRW-ARKM', 'KRW-PENDLE', 'KRW-ONDO', 'KRW-G', 'KRW-UXLINK', 'KRW-CARV', 'KRW-SAFE',
  'KRW-ZKP', 'KRW-ME', 'KRW-VIRTUAL', 'KRW-MOVE', 'KRW-ENA', 'KRW-W', 'KRW-DRIFT', 'KRW-TAO'
];

class ClientUpbitEngine {
  constructor() {
    this.ws = null;
    this.tickBuffers = new Map();
    this.lastSurgeTime = new Map();
    this.cooldownMs = 20000;
    this.isDestroyed = false;
    this.onTickCallback = null;
    this.onSurgeCallback = null;
    this.reconnectTimer = null;
    this.marketRefreshTimer = null;
    this.activeMarkets = [...FALLBACK_KRW_MARKETS];
  }

  init({ onTick, onSurge }) {
    this.onTickCallback = onTick;
    this.onSurgeCallback = onSurge;
    this.connect();

    // 🔄 10분마다 신규 상장 코인을 자동 감지하여 웹소켓 구독 목록 갱신
    this.marketRefreshTimer = setInterval(() => {
      this.refreshMarketList();
    }, 10 * 60 * 1000);
  }

  // 🌐 업비트 원화(KRW) 전체 마켓 목록 실시간 동적 조회
  async fetchAllKrwMarkets() {
    try {
      let markets = [];

      // 1차: 업비트 공식 Public API 직접 조회 (CORS 허용)
      try {
        const res = await fetch('https://api.upbit.com/v1/market/all?isDetails=false');
        if (res.ok) {
          const list = await res.json();
          markets = list.filter(m => m.market && m.market.startsWith('KRW-')).map(m => m.market);
        }
      } catch (err) {
        // 업비트 직접 호출 실패 시 백엔드 API 프록시로 2차 시도
      }

      // 2차: 백엔드 /api/markets 프록시 조회
      if (!markets || markets.length === 0) {
        try {
          const res = await fetch('/api/markets');
          if (res.ok) {
            const data = await res.json();
            if (data.markets && Array.isArray(data.markets)) {
              markets = data.markets;
            }
          }
        } catch (err) {}
      }

      if (markets && markets.length > 50) {
        this.activeMarkets = markets;
        console.log(`🌐 [Upbit WS] 업비트 전체 원화마켓 ${markets.length}개 실시간 동적 로드 완료! (신규 상장 코인 포함)`);
        return markets;
      }
    } catch (e) {
      console.warn('⚠️ [Upbit WS] 마켓 목록 조회 실패, 기본 목록 사용:', e);
    }
    return this.activeMarkets;
  }

  async refreshMarketList() {
    if (this.isDestroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const prevCount = this.activeMarkets.length;
    const newMarkets = await this.fetchAllKrwMarkets();
    if (newMarkets.length !== prevCount) {
      console.log(`⚡ [Upbit WS] 신규 마켓 감지! 구독 목록을 ${newMarkets.length}개로 자동 갱신합니다.`);
      this.sendSubscription();
    }
  }

  sendSubscription() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const subMsg = JSON.stringify([
      { ticket: `NURIOH_${Date.now()}` },
      { type: 'ticker', codes: this.activeMarkets },
      { format: 'DEFAULT' }
    ]);
    this.ws.send(subMsg);
  }

  async connect() {
    if (this.isDestroyed) return;

    // 연결 전 최신 원화 마켓 전체 목록 동적 확보
    await this.fetchAllKrwMarkets();

    try {
      this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');

      this.ws.onopen = () => {
        console.log(`⚡ [Upbit WS] Connected! Subscribing to ${this.activeMarkets.length} KRW markets.`);
        this.sendSubscription();
      };

      this.ws.onmessage = async (event) => {
        try {
          let text = '';
          if (event.data instanceof Blob) {
            text = await event.data.text();
          } else if (typeof event.data === 'string') {
            text = event.data;
          }
          if (!text) return;

          const tick = JSON.parse(text);
          if (!tick.code || !tick.trade_price) return;

          if (this.onTickCallback) {
            this.onTickCallback(tick);
          }

          this.processTick(tick);
        } catch (e) {
          // ignore
        }
      };

      this.ws.onerror = (err) => {
        console.warn('⚠️ [Upbit WS] Error:', err);
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };
    } catch (e) {
      console.warn('WebSocket connection failed:', e);
    }
  }

  processTick(tick) {
    const market = tick.code;
    const price = tick.trade_price;
    const volume = tick.trade_volume || 0;
    const amount = price * volume;
    const now = Date.now();

    if (!this.tickBuffers.has(market)) {
      this.tickBuffers.set(market, []);
    }

    const buffer = this.tickBuffers.get(market);
    buffer.push({ price, volume, amount, timestamp: now });

    const maxCutoff = now - 300000;
    while (buffer.length > 0 && buffer[0].timestamp < maxCutoff) {
      buffer.shift();
    }

    if (this.onSurgeCallback) {
      this.onSurgeCallback(tick, buffer);
    }
  }

  destroy() {
    this.isDestroyed = true;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.marketRefreshTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const upbitClientEngine = new ClientUpbitEngine();
