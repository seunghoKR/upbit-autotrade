const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const upbitClient = require('./upbitClient');

class UpbitWebSocket {
  constructor(markets = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE']) {
    this.markets = Array.isArray(markets) ? markets : [markets];
    this.ws = null;
    this.listeners = new Set();
    this.reconnectTimer = null;
    this.isClosedManually = false;
  }

  async connect(allMarkets = true) {
    this.isClosedManually = false;

    // 업비트 KRW 전체 마켓(약 120개 전종목) 자동 로드
    if (allMarkets) {
      try {
        const fullKrwList = await upbitClient.getAllKrwMarkets();
        if (fullKrwList && fullKrwList.length > 0) {
          this.markets = fullKrwList;
        }
      } catch (e) {
        console.warn('전체 마켓 로드 실패, 기본 마켓으로 폴백:', e.message);
      }
    }

    try {
      this.ws = new WebSocket(config.UPBIT.WS_URL);

      this.ws.on('open', () => {
        console.log(`📡 Upbit WebSocket Connected (원화 마켓 ${this.markets.length}개 전종목 실시간 감시 시작!)`);
        this.subscribe();
      });

      this.ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this.emit(parsed);
        } catch (err) {
          // Binary or ping pong
        }
      });

      this.ws.on('error', (err) => {
        console.error('⚠️ Upbit WebSocket Error:', err.message);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`🔌 Upbit WebSocket Closed (${code}). Reconnecting in 3s...`);
        if (!this.isClosedManually) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(allMarkets), 3000);
        }
      });
    } catch (e) {
      console.error('WebSocket Init Error:', e);
      this.reconnectTimer = setTimeout(() => this.connect(allMarkets), 5000);
    }
  }

  subscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const payload = [
      { ticket: uuidv4() },
      { type: 'ticker', codes: this.markets },
      { type: 'trade', codes: this.markets },
      { format: 'DEFAULT' }
    ];

    this.ws.send(JSON.stringify(payload));
  }

  updateMarkets(markets) {
    this.markets = Array.isArray(markets) ? markets : [markets];
    this.subscribe();
  }

  onPrice(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(data) {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in WS price listener:', err);
      }
    }
  }

  close() {
    this.isClosedManually = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    }
  }
}

module.exports = new UpbitWebSocket();
