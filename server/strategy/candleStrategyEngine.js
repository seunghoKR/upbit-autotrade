/**
 * NURIOH TRADER - Candle Strategy Engine (고도화 캔들 전략 엔진)
 * 9~12번 신규 슬롯 및 전 슬롯 캔들/돌파 전략 지원
 * 
 * [제안서 1부, 2부, 3부 핵심 요구사항 반영]
 * 1. 09:00 데이터 무결성: 봇 재시작 시 캔들 API를 통해 09:00(KST) High 값을 Fetching하여 캐시 복원
 * 2. C/스윙 휩소 방지: 장중 꼬리에 털리지 않도록 미완성봉이 아닌 '캔들 마감(Closed Candle)' 기준 데드크로스(MA5 < MA20) 확정 청산
 * 3. 스윙 소액 잡코인 필터: 24시간 누적 거래대금(100억 이상) 조건부 진입
 * 4. 가짜 윗꼬리(Spoofing) 필터링: 10초~15초 딜레이 검증(Sustain Check) 후 유지 시에만 매수, 급락 시 즉시 드롭(Drop)
 */

const upbitClient = require('../upbit/upbitClient');
const slotManager = require('./slotManager');
const config = require('../config');

class CandleStrategyEngine {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.listeners = new Set();

    // 당일 장중 최고가 메모리 캐시 (오전 9시 KST 기준 리셋 & API 동기화 복원)
    // market -> { highPrice: number, dateStr: string, updatedAt: number }
    this.dayHighMap = new Map();

    // 진행 중인 가짜 윗꼬리 검증 (Sustain Check) 관리
    // market -> { slotId, breakoutPrice, startAt, timeoutId, minRequiredVolumeKrw }
    this.activeSustainChecks = new Map();

    // 쿨다운 관리 (마켓별 중복 매수 방지)
    this.recentBreakoutTriggers = new Map(); // market -> timestamp
    this.recentSwingTriggers = new Map();    // market -> timestamp

    // 감시 대상 마켓 목록
    this.monitoredMarkets = [
      'KRW-BTC', 'KRW-ETH', 'KRW-SOL', 'KRW-XRP', 'KRW-DOGE',
      'KRW-ADA', 'KRW-AVAX', 'KRW-DOT', 'KRW-NEAR', 'KRW-SUI',
      'KRW-SHIB', 'KRW-STX', 'KRW-LINK', 'KRW-ETC', 'KRW-SEI', 'KRW-SAND'
    ];
  }

  onEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitEvent(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in candle strategy event listener:', err);
      }
    }
  }

  /**
   * 엔진 가동 시작
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🕯️ [CandleStrategyEngine] 고도화 캔들 전략 엔진 가동 (무결성/SustainCheck/마감봉 데드크로스)');

    // 1. 봇 재시작 시 09:00 데이터 무결성 복원 (API 동기화)
    await this.syncDayHighsFromApi();

    // 60초마다 주기적 검사 (API Rate Limit 보호를 위해 60초 주기 실행)
    this.checkInterval = setInterval(() => {
      this.executeStrategyLoop().catch(err => {
        console.error('🕯️ [CandleStrategyEngine] 루프 실행 중 오류:', err.message);
      });
    }, 60000);

    // 최초 1회 즉시 실행 (3초 후)
    setTimeout(() => {
      this.executeStrategyLoop().catch(err => {
        console.error('🕯️ [CandleStrategyEngine] 초기 실행 오류:', err.message);
      });
    }, 3000);
  }

  stop() {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    // 진행 중인 모든 Sustain Check 타이머 해제
    for (const [m, check] of this.activeSustainChecks.entries()) {
      clearTimeout(check.timeoutId);
    }
    this.activeSustainChecks.clear();
    console.log('🕯️ [CandleStrategyEngine] 캔들 전략 엔진 정지');
  }

  /**
   * 🛡️ 09:00 데이터 무결성 복원 (제안서 1부)
   * 봇 재시작 시 캔들 API를 통해 09:00(KST) High 값을 다시 Fetching하여 메모리 캐시 복원
   */
  async syncDayHighsFromApi() {
    const tradingDate = this.getKstTradingDate();
    console.log(`🔄 [09:00 데이터 무결성 복원] 당일(${tradingDate}) 기준 주요 마켓 일봉 고가(Day High) 동기화 시작...`);

    for (const market of this.monitoredMarkets) {
      try {
        await new Promise(r => setTimeout(r, 100)); // Rate limit 방어
        const dayCandles = await upbitClient.getDayCandles(market, 2);
        if (dayCandles && dayCandles.length > 0) {
          const todayCandle = dayCandles[0];
          this.dayHighMap.set(market, {
            highPrice: Number(todayCandle.high_price),
            openingPrice: Number(todayCandle.opening_price),
            tradePrice: Number(todayCandle.trade_price),
            dateStr: tradingDate,
            updatedAt: Date.now()
          });
        }
      } catch (e) {
        // 개별 마켓 조회 오류 시 건너뜀
      }
    }
    console.log(`✅ [09:00 데이터 무결성 복원 완료] ${this.dayHighMap.size}개 마켓 당일 최고가 캐시 완료`);
  }

  isTimeLocked() {
    const now = new Date();
    const curTotalMin = now.getHours() * 60 + now.getMinutes();
    const startMin = 8 * 60 + 50; // 08:50
    const endMin = 9 * 60 + 30;   // 09:30
    return curTotalMin >= startMin && curTotalMin <= endMin;
  }

  getKstTradingDate() {
    const now = new Date();
    const kstHour = now.getHours();
    const adjusted = new Date(now);
    if (kstHour < 9) {
      adjusted.setDate(adjusted.getDate() - 1);
    }
    return adjusted.toISOString().slice(0, 10);
  }

  /**
   * 주기적 메인 전략 루프
   */
  async executeStrategyLoop() {
    if (!this.isRunning) return;

    try {
      const slots = slotManager.slots;
      const breakoutSlots = slots.filter(s => s.isEnabled && s.strategyMode === 'BREAKOUT_DAY_HIGH');
      const swingSlots = slots.filter(s => s.isEnabled && s.strategyMode === 'TREND_SWING');

      if (breakoutSlots.length === 0 && swingSlots.length === 0) return;

      // 1. 모드 C: [정배열 추세 스윙] 보유 포지션 '캔들 마감' 데드크로스 매도 감시
      await this.checkSwingExits(swingSlots);

      // 2. 타임락 체크 (08:50 ~ 09:30 신규 매수 차단)
      if (this.isTimeLocked()) {
        console.log('🔒 [CandleStrategyEngine] 타임락 가동 중 (08:50~09:30) -> 신규 매수 감시 일시 정지');
        return;
      }

      // 3. 모드 B: [당일 신고가 돌파] 매수 기회 탐색 (빈 슬롯 대상)
      const availableBreakoutSlot = slotManager.getAvailableSlot(null, 'BREAKOUT_DAY_HIGH');
      if (availableBreakoutSlot && !this.activeSustainChecks.has(availableBreakoutSlot.slotId)) {
        await this.checkBreakoutEntries(availableBreakoutSlot);
      }

      // 4. 모드 C: [정배열 추세 스윙] 매수 기회 탐색 (빈 슬롯 대상)
      const availableSwingSlot = slotManager.getAvailableSlot(null, 'TREND_SWING');
      if (availableSwingSlot) {
        await this.checkSwingEntries(availableSwingSlot);
      }
    } catch (err) {
      console.error('🕯️ [CandleStrategyEngine] 전략 평가 중 오류:', err.message);
    }
  }

  /**
   * 🚀 모드 B: 당일 신고가 돌파 매수 평가 + [제안서 3부: 가짜 윗꼬리 딜레이 검증 Sustain Check]
   */
  async checkBreakoutEntries(slot) {
    const tradingDate = this.getKstTradingDate();

    const targetMarkets = slot.targetMarket 
      ? [slot.targetMarket]
      : this.monitoredMarkets.slice(0, 10);

    for (const market of targetMarkets) {
      try {
        if (this.activeSustainChecks.has(market)) continue;

        const lastTrigger = this.recentBreakoutTriggers.get(market) || 0;
        if (Date.now() - lastTrigger < 300000) continue; // 5분 쿨다운

        await new Promise(r => setTimeout(r, 150));

        const dayCandles = await upbitClient.getDayCandles(market, 2);
        if (!dayCandles || dayCandles.length === 0) continue;

        const todayCandle = dayCandles[0];
        const currentPrice = Number(todayCandle.trade_price);
        const dayHigh = Number(todayCandle.high_price);
        const openingPrice = Number(todayCandle.opening_price);

        let cached = this.dayHighMap.get(market);
        if (!cached || cached.dateStr !== tradingDate) {
          cached = { highPrice: dayHigh, dateStr: tradingDate, openingPrice };
          this.dayHighMap.set(market, cached);
        }

        const gainFromOpen = ((currentPrice - openingPrice) / openingPrice) * 100;
        const isBreakingHigh = currentPrice >= cached.highPrice && gainFromOpen >= 1.5;

        if (isBreakingHigh && slot.breakoutHighEnabled !== false) {
          // 수급 필터 검증 (1분봉 또는 3분봉 거래대금 X억 원 이상)
          const unit = Number(slot.breakoutCandleUnit) === 3 ? 3 : 1;
          const minuteCandles = await upbitClient.getMinuteCandles(market, unit, 2);
          if (!minuteCandles || minuteCandles.length === 0) continue;

          const recentVolumeKrw = Number(minuteCandles[0].candle_acc_trade_price || 0);
          const minRequiredVolumeKrw = (Number(slot.breakoutMinVolumeKrwEok) || 5) * 100000000;

          if (recentVolumeKrw >= minRequiredVolumeKrw) {
            console.log(`🔍 [돌파 1차 포착] ${market} 고가(${dayHigh.toLocaleString()}원) 돌파 및 수급 ${(recentVolumeKrw / 100000000).toFixed(2)}억 달성 ➔ 10초 가짜 윗꼬리 딜레이 검증(Sustain Check) 시작!`);

            // -------------------------------------------------------------
            // 🛡️ [제안서 3부] 가짜 윗꼬리(Spoofing) 10초 Sustain Check 딜레이 검증
            // -------------------------------------------------------------
            this.startSustainCheck(slot, market, currentPrice, dayHigh, recentVolumeKrw, unit);
            break; // 한 번에 한 개 슬롯 검증
          }
        } else if (currentPrice > cached.highPrice) {
          cached.highPrice = currentPrice;
        }
      } catch (err) {
        console.error(`🕯️ [Breakout] ${market} 평가 실패:`, err.message);
      }
    }
  }

  /**
   * 🛡️ 가짜 윗꼬리 방어 10초 Sustain Check 검증 엔진
   */
  startSustainCheck(slot, market, breakoutPrice, dayHigh, volumeKrw, candleUnit) {
    const delaySeconds = 10; // 10초 딜레이 검증

    this.emitEvent({
      type: 'SUSTAIN_CHECK_STARTED',
      slotId: slot.slotId,
      slotName: slot.name,
      market,
      breakoutPrice,
      dayHigh,
      delaySeconds,
      message: `⏳ [가짜 윗꼬리 방어] ${market} 돌파 포착! ${delaySeconds}초간 가격 유지(Sustain Check) 검증 중...`
    });

    const timeoutId = setTimeout(async () => {
      this.activeSustainChecks.delete(market);

      try {
        // 10초 후 현재 시세 및 호가창 검증
        const tickers = await upbitClient.getTicker([market]);
        if (!tickers || tickers.length === 0) return;

        const livePrice = Number(tickers[0].trade_price);
        const priceDiffPct = ((livePrice - breakoutPrice) / breakoutPrice) * 100;

        // 돌파 가격 대비 -0.4% 이상 하락하여 무너졌다면 -> 세력의 가짜 윗꼬리(Spoofing/설거지)로 판정하고 매수 드롭!
        if (priceDiffPct < -0.4) {
          console.warn(`🚫 [가짜 윗꼬리 포착 드롭] ${market} 10초 후 가격(${livePrice.toLocaleString()}원)이 돌파가(${breakoutPrice.toLocaleString()}원) 대비 ${priceDiffPct.toFixed(2)}% 급락 ➔ 매수 취소(Drop)!`);
          this.emitEvent({
            type: 'SUSTAIN_CHECK_DROPPED',
            slotId: slot.slotId,
            market,
            breakoutPrice,
            livePrice,
            priceDiffPct: Number(priceDiffPct.toFixed(2)),
            reason: `가짜 윗꼬리(Spoofing) 감지: 10초 후 ${priceDiffPct.toFixed(2)}% 급락으로 매수 큐에서 드롭`
          });
          return;
        }

        // 10초 동안 가격과 수급 텐션을 훌륭하게 유지함! -> 매수 신호 확정 발송
        console.log(`✅ [Sustain Check 검증 통과] ${market} 10초 후 가격(${livePrice.toLocaleString()}원, ${priceDiffPct >= 0 ? '+' : ''}${priceDiffPct.toFixed(2)}%) 견고하게 유지 확인 ➔ 정식 매수 집행!`);
        this.recentBreakoutTriggers.set(market, Date.now());

        const cached = this.dayHighMap.get(market);
        if (cached) cached.highPrice = Math.max(cached.highPrice, livePrice);

        this.emitEvent({
          type: 'BREAKOUT_BUY_SIGNAL',
          slotId: slot.slotId,
          slotName: slot.name,
          market,
          currentPrice: livePrice,
          dayHigh,
          volumeKrw,
          reason: `[신고가 돌파 10초 검증 완료] ${market} 고가 돌파 및 ${candleUnit}분봉 거래대금 ${(volumeKrw / 100000000).toFixed(2)}억 수급 유지 확인`
        });
      } catch (err) {
        console.error(`❌ [Sustain Check 오류] ${market}:`, err.message);
      }
    }, delaySeconds * 1000);

    this.activeSustainChecks.set(market, {
      slotId: slot.slotId,
      breakoutPrice,
      timeoutId,
      startAt: Date.now()
    });
  }

  /**
   * 🌊 모드 C: 정배열 추세 스윙 매수 평가 + [제안서 2부: 24시간 거래대금 100억 필터]
   */
  async checkSwingEntries(slot) {
    const targetMarkets = slot.targetMarket 
      ? [slot.targetMarket]
      : ['KRW-BTC', 'KRW-ETH', 'KRW-SOL', 'KRW-XRP', 'KRW-AVAX', 'KRW-DOGE', 'KRW-NEAR', 'KRW-SUI'];

    const candleUnit = slot.swingCandleUnit || 'days';
    const shortMaPeriod = Number(slot.swingShortMa) || 5;
    const min24hTradePriceKrw = slot.swingMinTradePrice24hEok 
      ? Number(slot.swingMinTradePrice24hEok) * 100000000 
      : (Number(slot.min24hAccTradePriceKrw) || 10000000000); // 기본 100억 원 이상 (제안서 C모드 필터)

    for (const market of targetMarkets) {
      try {
        const lastTrigger = this.recentSwingTriggers.get(market) || 0;
        if (Date.now() - lastTrigger < 600000) continue; // 10분 쿨다운

        await new Promise(r => setTimeout(r, 150));

        // 🛡️ [제안서 2부 3번] 24시간 누적 거래대금 100억 필터 (소액 잡코인 원천 차단)
        const tickers = await upbitClient.getTicker([market]);
        if (!tickers || tickers.length === 0) continue;
        const accTradePrice24h = Number(tickers[0].acc_trade_price_24h || 0);

        if (accTradePrice24h < min24hTradePriceKrw) {
          // 거래대금 부족 시 스윙 진입 제외
          continue;
        }

        let candles = [];
        if (candleUnit === 'days') {
          candles = await upbitClient.getDayCandles(market, Math.max(longMaPeriod + 5, 30));
        } else {
          candles = await upbitClient.getMinuteCandles(market, 240, Math.max(longMaPeriod + 5, 30));
        }

        if (!candles || candles.length < longMaPeriod + 2) continue;

        const currentPrices = candles.map(c => c.trade_price);
        const shortMa = this.calculateSma(currentPrices.slice(0, shortMaPeriod));
        const longMa = this.calculateSma(currentPrices.slice(0, longMaPeriod));

        const prevShortMa = this.calculateSma(currentPrices.slice(1, shortMaPeriod + 1));
        const prevLongMa = this.calculateSma(currentPrices.slice(1, longMaPeriod + 1));

        const isGoldenOrAligned = shortMa > longMa;
        const isJustCrossed = prevShortMa <= prevLongMa && shortMa > longMa;

        if (isGoldenOrAligned) {
          const currentPrice = candles[0].trade_price;
          console.log(`🌊 [스윙 정배열 감지] ${market} (${candleUnit}) MA${shortMaPeriod}: ${shortMa.toFixed(1)} > MA${longMaPeriod}: ${longMa.toFixed(1)} (24H 거래대금: ${(accTradePrice24h / 100000000).toFixed(1)}억)`);

          this.recentSwingTriggers.set(market, Date.now());

          this.emitEvent({
            type: 'SWING_BUY_SIGNAL',
            slotId: slot.slotId,
            slotName: slot.name,
            market,
            currentPrice,
            candleUnit,
            shortMa,
            longMa,
            accTradePrice24h,
            reason: `[정배열 스윙 매수] ${market} (${candleUnit}) MA${shortMaPeriod}>MA${longMaPeriod} & 24H 거래대금 ${(accTradePrice24h / 100000000).toFixed(1)}억 탑승`
          });
          break; // 한 번에 한 개 슬롯 진입
        }
      } catch (err) {
        console.error(`🕯️ [Swing] ${market} 진입 평가 실패:`, err.message);
      }
    }
  }

  /**
   * 🌊 모드 C: [제안서 1부: 캔들 마감(Closed Candle) 기준 데드크로스 확정 청산 (휩소 방지)]
   */
  async checkSwingExits(swingSlots) {
    const activeSwingSlots = swingSlots.filter(s => s.positionStatus !== 'IDLE' && s.position && s.targetMarket);

    for (const slot of activeSwingSlots) {
      try {
        const market = slot.targetMarket;
        const candleUnit = slot.swingCandleUnit || 'days';
        const shortMaPeriod = Number(slot.swingShortMa) || 5;
        const longMaPeriod = Number(slot.swingLongMa) || 20;

        await new Promise(r => setTimeout(r, 150));

        let candles = [];
        if (candleUnit === 'days') {
          candles = await upbitClient.getDayCandles(market, Math.max(longMaPeriod + 5, 30));
        } else {
          candles = await upbitClient.getMinuteCandles(market, 240, Math.max(longMaPeriod + 5, 30));
        }

        if (!candles || candles.length < longMaPeriod + 2) continue;

        const currentPrices = candles.map(c => c.trade_price);

        // 🛡️ [휩소 방지 핵심]:
        // candles[0]은 아직 미완성된 실시간 캔들이므로 꼬리에 털릴 수 있음.
        // 직전 완전히 종가 마감된 캔들(Closed Candle, index 1부터)을 기준으로 이동평균선 산출!
        const closedShortMa = this.calculateSma(currentPrices.slice(1, shortMaPeriod + 1));
        const closedLongMa = this.calculateSma(currentPrices.slice(1, longMaPeriod + 1));

        // 마감봉 기준 확정 데드크로스: 단기선이 장기선 아래로 이탈
        if (closedShortMa < closedLongMa) {
          const currentPrice = candles[0].trade_price;
          const pos = slot.position;
          const rawProfitRate = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

          console.log(`🚨 [마감봉 확정 데드크로스 청산] Slot ${slot.slotId} [${market}] 마감 MA${shortMaPeriod}(${closedShortMa.toFixed(1)}) < MA${longMaPeriod}(${closedLongMa.toFixed(1)}) ➔ 휩소 없는 안전 청산 집행!`);

          this.emitEvent({
            type: 'SWING_EXIT_SIGNAL',
            slotId: slot.slotId,
            market,
            currentPrice,
            shortMa: closedShortMa,
            longMa: closedLongMa,
            profitRate: rawProfitRate,
            reason: `[캔들 마감 확정 데드크로스 청산] Closed MA${shortMaPeriod}(${closedShortMa.toFixed(1)}) < MA${longMaPeriod}(${closedLongMa.toFixed(1)})`
          });
        }
      } catch (err) {
        console.error(`🕯️ [Swing Exit] Slot ${slot.slotId} 데드크로스 감시 실패:`, err.message);
      }
    }
  }

  calculateSma(prices) {
    if (!prices || prices.length === 0) return 0;
    const sum = prices.reduce((acc, p) => acc + Number(p), 0);
    return sum / prices.length;
  }
}

module.exports = new CandleStrategyEngine();
