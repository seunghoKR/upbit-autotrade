/**
 * NURIOH TRADER - Client Realtime Upbit WebSocket & Surge Engine
 * 브라우저에서 직접 업비트 공용 웹소켓(wss://api.upbit.com/websocket/v1)에 연결하여
 * 120여 개 전종목의 실시간 틱을 분석하고 슬롯별 급등 감지 및 자동 매매를 완벽하게 집행합니다.
 */

const DEFAULT_KRW_MARKETS = [
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
  'KRW-CYBER', 'KRW-ARKM', 'KRW-PENDLE', 'KRW-ONDO', 'KRW-G', 'KRW-UXLINK', 'KRW-CARV', 'KRW-SAFE'
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
  }

  init({ onTick, onSurge }) {
    this.onTickCallback = onTick;
    this.onSurgeCallback = onSurge;
    this.connect();
  }

  connect() {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');

      this.ws.onopen = () => {
        console.log('⚡ [Upbit WS] Realtime Market Stream Connected!');
        const subMsg = JSON.stringify([
          { ticket: `NURIOH_${Date.now()}` },
          { type: 'ticker', codes: DEFAULT_KRW_MARKETS },
          { format: 'DEFAULT' }
        ]);
        this.ws.send(subMsg);
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const upbitClientEngine = new ClientUpbitEngine();
