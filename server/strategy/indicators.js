const { RSI, BollingerBands, MACD, SMA, EMA, ATR } = require('technicalindicators');

/**
 * 캔들 배열로부터 RSI 계산
 * @param {Array} candles 업비트 캔들 배열 (최신순 또는 과거순)
 * @param {number} period RSI 기간 (기본 14)
 */
function calculateRSI(candles, period = 14) {
  // 업비트 캔들은 최신순으로 오므로 시간순(과거->최신)으로 뒤집음
  const sorted = [...candles].sort((a, b) => new Date(a.candle_date_time_utc) - new Date(b.candle_date_time_utc));
  const closePrices = sorted.map(c => c.trade_price);

  const rsiValues = RSI.calculate({
    values: closePrices,
    period: period
  });

  return {
    currentRSI: rsiValues.length > 0 ? Number(rsiValues[rsiValues.length - 1].toFixed(2)) : null,
    history: rsiValues
  };
}

/**
 * 볼린저 밴드 계산
 * @param {Array} candles 
 * @param {number} period 기간 (기본 20)
 * @param {number} stdDev 표준편차 (기본 2)
 */
function calculateBollingerBands(candles, period = 20, stdDev = 2) {
  const sorted = [...candles].sort((a, b) => new Date(a.candle_date_time_utc) - new Date(b.candle_date_time_utc));
  const closePrices = sorted.map(c => c.trade_price);

  const bbValues = BollingerBands.calculate({
    period: period,
    values: closePrices,
    stdDev: stdDev
  });

  const latest = bbValues.length > 0 ? bbValues[bbValues.length - 1] : null;
  return {
    latest: latest ? {
      upper: Number(latest.upper.toFixed(2)),
      middle: Number(latest.middle.toFixed(2)),
      lower: Number(latest.lower.toFixed(2)),
      pb: latest.pb ? Number(latest.pb.toFixed(4)) : null
    } : null,
    history: bbValues
  };
}

/**
 * MACD 계산
 */
function calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const sorted = [...candles].sort((a, b) => new Date(a.candle_date_time_utc) - new Date(b.candle_date_time_utc));
  const closePrices = sorted.map(c => c.trade_price);

  const macdValues = MACD.calculate({
    values: closePrices,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });

  const latest = macdValues.length > 0 ? macdValues[macdValues.length - 1] : null;
  return {
    latest: latest ? {
      MACD: Number(latest.MACD?.toFixed(2)),
      signal: Number(latest.signal?.toFixed(2)),
      histogram: Number(latest.histogram?.toFixed(2))
    } : null,
    history: macdValues
  };
}

/**
 * 캔들 배열로부터 ATR(Average True Range, 평균 실질 변동폭) 계산
 * @param {Array} candles 업비트 캔들 배열
 * @param {number} period 기간 (기본 14)
 */
function calculateATR(candles, period = 14) {
  if (!Array.isArray(candles) || candles.length < period) {
    return { currentATR: null, atrPct: null, history: [] };
  }
  const sorted = [...candles].sort((a, b) => new Date(a.candle_date_time_utc) - new Date(b.candle_date_time_utc));
  const high = sorted.map(c => Number(c.high_price));
  const low = sorted.map(c => Number(c.low_price));
  const close = sorted.map(c => Number(c.trade_price));

  const atrValues = ATR.calculate({
    high,
    low,
    close,
    period
  });

  const latestATR = atrValues.length > 0 ? atrValues[atrValues.length - 1] : null;
  const currentPrice = close[close.length - 1];
  const atrPct = (latestATR && currentPrice) ? Number(((latestATR / currentPrice) * 100).toFixed(2)) : null;

  return {
    currentATR: latestATR ? Number(latestATR.toFixed(4)) : null,
    atrPct,
    history: atrValues
  };
}

module.exports = {
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
  calculateATR
};
