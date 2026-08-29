/**
 * NURIOH TRADER - Realtime Surge Detector (급등 감지기)
 * WebSocket 실시간 체결 및 틱 데이터를 롤링 윈도우로 분석하여
 * [ X초 동안 Y% 이상 급등 & N원 이상 거래대금 발생 ] 시 신호 포착
 */

class SurgeDetector {
  constructor() {
    this.tickBuffers = new Map(); // market -> Array<{ price, volume, amount, timestamp }>
    this.lastSurgeTime = new Map(); // market -> timestamp (쿨다운용)
    this.cooldownMs = 15000; // 동일 종목 급등 재감지 쿨다운 (15초)
    this.listeners = new Set();
  }

  onSurge(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitSurge(surgeData) {
    for (const listener of this.listeners) {
      try {
        listener(surgeData);
      } catch (err) {
        console.error('Error in surge listener:', err);
      }
    }
  }

  /**
   * 실시간 체결/틱 데이터 유입 처리
   * @param {Object} tick { code: 'KRW-BTC', trade_price, trade_volume, prev_closing_price, timestamp }
   * @param {Object} settings { SURGE_CHECK_SECONDS: 5, SURGE_RATE_THRESHOLD: 0.8, SURGE_MIN_VOLUME_KRW: 1000000 }
   */
  processTick(tick, settings = {}) {
    const market = tick.code;
    const price = Number(tick.trade_price);
    const volume = Number(tick.trade_volume || 0);
    const amount = price * volume;
    const now = Date.now();

    if (!market || !price || isNaN(price)) return;

    // 🚫 제외 코인(EXCLUDED_MARKETS)은 급등 감지기에서 100% 즉시 제외
    if (Array.isArray(settings.EXCLUDED_MARKETS)) {
      const excluded = settings.EXCLUDED_MARKETS.map(m => String(m).trim().toUpperCase());
      const shortSym = market.replace('KRW-', '').toUpperCase();
      if (excluded.includes(market.toUpperCase()) || excluded.includes(shortSym) || excluded.includes(`KRW-${shortSym}`)) {
        return;
      }
    }

    if (!this.tickBuffers.has(market)) {
      this.tickBuffers.set(market, []);
    }

    const buffer = this.tickBuffers.get(market);
    buffer.push({ price, volume, amount, timestamp: now });

    // 설정된 감시 시간(초) 이전 데이터 정리 (기본 5초)
    const windowSeconds = Number(settings.SURGE_CHECK_SECONDS) || 5;
    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;
    while (buffer.length > 0 && buffer[0].timestamp < cutoff) {
      buffer.shift();
    }

    if (buffer.length < 2) return;

    // 윈도우 내 최저가 및 최신가 비교
    let minPrice = buffer[0].price;
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i].price < minPrice) minPrice = buffer[i].price;
    }
    const currentPrice = buffer[buffer.length - 1].price;
    const priceDiffRate = ((currentPrice - minPrice) / minPrice) * 100;

    // 윈도우 내 총 누적 거래대금 (KRW)
    const totalVolumeKrw = buffer.reduce((sum, item) => sum + item.amount, 0);

    const thresholdRate = Number(settings.SURGE_RATE_THRESHOLD !== undefined ? settings.SURGE_RATE_THRESHOLD : 0.8);
    const minVolumeKrw = Number(settings.SURGE_MIN_VOLUME_KRW !== undefined ? settings.SURGE_MIN_VOLUME_KRW : 1000000);

    // 쿨다운 검사
    const lastSurge = this.lastSurgeTime.get(market) || 0;
    if (now - lastSurge < this.cooldownMs) {
      return;
    }

    // 급등 조건 충족 검사: 상승률 >= Y% AND 누적거래대금 >= N원
    if (priceDiffRate >= thresholdRate && (minVolumeKrw === 0 || totalVolumeKrw >= minVolumeKrw)) {
      this.lastSurgeTime.set(market, now);

      const surgeInfo = {
        market,
        basePrice: minPrice,
        currentPrice,
        priceDiffRate: Number(priceDiffRate.toFixed(2)),
        totalVolumeKrw: Math.round(totalVolumeKrw),
        durationSeconds: windowSeconds,
        detectedAt: new Date().toISOString(),
        reason: `[급등 감지] ${windowSeconds}초간 +${priceDiffRate.toFixed(2)}% 상승 (거래대금: ${Math.round(totalVolumeKrw).toLocaleString()}원)`
      };

      console.log(`🚨 [SURGE DETECTED] ${market} +${priceDiffRate.toFixed(2)}% in ${windowSeconds}s (거래대금: ${Math.round(totalVolumeKrw).toLocaleString()}원)`);
      this.emitSurge(surgeInfo);
    }
  }
}

module.exports = new SurgeDetector();
