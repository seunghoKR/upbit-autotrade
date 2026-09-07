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
    
    // 🐋 [알고리즘 3번] 고래 단일 틱 1,000만원 필터 (Single Whale Tick)
    WHALE_TICK_FILTER_ENABLED: true, // 고래 단일 틱 필터 활성화 여부
    WHALE_SINGLE_TICK_MIN_KRW: 10000000, // 단일 체결액 최소 1,000만원 이상

    // 🛡️ [알고리즘 1번] 호가창 불균형 필터 (Orderbook Imbalance)
    ORDERBOOK_FILTER_ENABLED: true, // 가짜 펌핑 방지 호가창 필터 활성화 여부
    ORDERBOOK_MIN_BID_RATIO: 35.0, // 매수 총잔량 최소 35% 이상 확보 (매수벽 지지력 검증)

    // 🛡️ [알고리즘 2번] 비트코인 커플링 필터 (BTC Coupling Guard)
    BTC_PROTECTION_ENABLED: true, // BTC 하락 시 알트코인 매수 보호 가동 여부
    BTC_DROP_THRESHOLD_PCT: 0.7, // BTC 5분 변동률 -0.7% 이하 시 하락 경보 발동

    // ⚙️ [알고리즘 4번] AI 동적 변동성 ATR 손절 (Dynamic ATR Stop-Loss)
    AI_ATR_STOPLOSS_DEFAULT: false, // AI 동적 변동성 손절 모드 기본 OFF (선택형 옵션)
    ATR_PERIOD: 14, // ATR 캔들 기간 (1분봉 14개)
    ATR_MULTIPLIER: 1.5, // ATR 배수 (손절선 = ATR% * 1.5)
    ATR_MIN_STOP_PCT: 1.2, // ATR 동적 손절 최소선 (1.2%)
    ATR_MAX_STOP_PCT: 4.5, // ATR 동적 손절 최대선 (4.5%)

    // 트레일링 스탑 파라미터
    TRAILING_TARGET_PROFIT_PCT: 3.0, // 트레일링 감시 시작 목표 수익률 (%)
    TRAILING_CALLBACK_PCT: 1.0, // 최고점 대비 하락 폭 이익실현 매도 (%)

    // RSI 지표
    RSI_PERIOD: 14,
    RSI_BUY_THRESHOLD: 30, // 과매도 기준
    RSI_SELL_THRESHOLD: 70 // 과매수 기준
  }
};
