require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  UPBIT: {
    ACCESS_KEY: process.env.UPBIT_ACCESS_KEY || '',
    SECRET_KEY: process.env.UPBIT_SECRET_KEY || '',
    SERVER_URL: 'https://api.upbit.com/v1',
    WS_URL: 'wss://api.upbit.com/websocket/v1'
  },
  TELEGRAM: {
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
    CHAT_ID: process.env.TELEGRAM_CHAT_ID || ''
  },
  SECURITY: {
    MASTER_KEY: process.env.ENCRYPTION_MASTER_KEY || 'youngja_secure_trading_secret_key_2026!'
  },
  DATABASE: {
    HOST: process.env.DB_HOST || '127.0.0.1',
    PORT: process.env.DB_PORT || 3306,
    NAME: process.env.DB_NAME || 'nurioh_trader',
    USER: process.env.DB_USER || 'root',
    PASS: process.env.DB_PASS || ''
  },
  TRADING: {
    DEFAULT_MARKET: 'KRW-BTC',
    MULTI_MARKETS: ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE'],
    DEFAULT_TRADE_AMOUNT: 50000, // 1회 주문 기본 금액 (원)
    AUTO_EXECUTE_ON_TIMEOUT: false, // 타임아웃 시 자동 실행 여부
    APPROVAL_TIMEOUT_SECONDS: 30, // 승인 대기 시간 (초)
    STOP_LOSS_PCT: 2.0, // 기본 손절률 (%)
    TAKE_PROFIT_PCT: 3.5, // 기본 익절률 (%)
    
    // 급등 감지 파라미터 (민감도 상향 조정)
    SURGE_CHECK_SECONDS: 5, // 급등 감지 시간 (5초)
    SURGE_RATE_THRESHOLD: 0.8, // 5초간 +0.8% 이상 순간 급등 감지
    SURGE_MIN_VOLUME_KRW: 5000000, // 5초간 순간 거래대금 500만원 이상 필터
    
    // 트레일링 스탑 파라미터
    TRAILING_TARGET_PROFIT_PCT: 3.0, // 트레일링 감시 시작 목표 수익률 (%)
    TRAILING_CALLBACK_PCT: 1.0, // 최고점 대비 하락 폭 이익실현 매도 (%)

    // RSI 지표
    RSI_PERIOD: 14,
    RSI_BUY_THRESHOLD: 30, // 과매도 기준
    RSI_SELL_THRESHOLD: 70 // 과매수 기준
  }
};
