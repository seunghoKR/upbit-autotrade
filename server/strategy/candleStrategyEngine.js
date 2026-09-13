/**
 * NURIOH TRADER - Candle Strategy Engine
 * 9~12번 신규 슬롯 전용 독립 백엔드 캔들 전략 엔진
 * 
 * - 모드 B: [당일 신고가 돌파] (9~10번 슬롯)
 *   * 09:00 KST 기준 당일 장중 최고가 추적 및 돌파(Breakout) 감시
 *   * 돌파 순간 1분봉/3분봉 거래대금(설정값 이상) 수급 필터
 * 
 * - 모드 C: [정배열 추세 스윙] (11~12번 슬롯)
 *   * 일봉(Day) / 4시간봉(240분) 캔들 기반 이동평균선(MA5, MA20) 추적
 *   * 정배열(단기선 > 장기선) 진입 & 데드크로스(추세 이탈) 시 즉시 시장가 청산
 * 
 * - 안전성 제약:
 *   * 타임락 (08:50 ~ 09:30 매수 금지) 전 슬롯 공통 강제 적용
 *   * API Rate Limit 방어 큐 및 60초~180초 여유 주기 스케줄링
 */

const upbitClient = require('../upbit/upbitClient');
const slotManager = require('./slotManager');
const config = require('../config');

class CandleStrategyEngine {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.listeners = new Set();

    // 당일 장중 최고가 메모리 캐시 (오전 9시 KST 기준 리셋)
    // market -> { highPrice: number, dateStr: string, updatedAt: number }
    this.dayHighMap = new Map();

    // 쿨다운 관리 (마켓별 중복 매수 방지)
    this.recentBreakoutTriggers = new Map(); // market -> timestamp
    this.recentSwingTriggers = new Map(); // market -> timestamp

    // 감시 대상 마켓 목록 캐시
    this.monitoredMarkets = [
      'KRW-BTC', 'KRW-ETH', 'KRW-SOL', 'KRW-XRP', 'KRW-DOGE',
      'KRW-ADA', 'KRW-AVAX', 'KRW-DOT', 'KRW-NEAR', 'KRW-SUI',
      'KRW-SHIB', 'KRW-STX', 'KRW-LINK', 'KRW-ETC'
    ];
  }

  /**
   * 이벤트 리스너 등록
   */
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
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🕯️ [CandleStrategyEngine] 캔들 전용 전략 엔진 가동 (9~12번 슬롯 지원)');

    // 60초마다 주기적 검사 (API Rate Limit 보호를 위해 60초 주기 실행)
    this.checkInterval = setInterval(() => {
      this.executeStrategyLoop().catch(err => {
        console.error('🕯️ [CandleStrategyEngine] 루프 실행 중 오류:', err.message);
      });
    }, 60000);

    // 최초 1회 즉시 실행 (5초 후)
    setTimeout(() => {
      this.executeStrategyLoop().catch(err => {
        console.error('🕯️ [CandleStrategyEngine] 초기 실행 오류:', err.message);
      });
    }, 5000);
  }

  /**
   * 엔진 정지
   */
  stop() {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🕯️ [CandleStrategyEngine] 캔들 전략 엔진 정지');
  }

  /**
   * 🛡️ 08:50 ~ 09:30 타임락 점검
   */
  isTimeLocked() {
    const now = new Date();
    // KST 기준 분 계산
    const curTotalMin = now.getHours() * 60 + now.getMinutes();
    const startMin = 8 * 60 + 50; // 08:50
    const endMin = 9 * 60 + 30;   // 09:30

    return curTotalMin >= startMin && curTotalMin <= endMin;
  }

  /**
   * 당일 KST 날짜 문자열 반환 (09:00 기준 날짜)
   */
  getKstTradingDate() {
    const now = new Date();
    // 오전 9시 이전이면 전날 장으로 취급
    const kstHour = now.getHours();
    const adjusted = new Date(now);
    if (kstHour < 9) {
      adjusted.setDate(adjusted.getDate() - 1);
    }
    return adjusted.toISOString().slice(0, 10);
  }

  /**
   * 주기적 메인 전략 평가 루프
   */
  async executeStrategyLoop() {
    if (!this.isRunning) return;

    try {
      // 1. 슬롯 상태 확인
      const slots = slotManager.slots;
      const breakoutSlots = slots.filter(s => s.isEnabled && s.strategyMode === 'BREAKOUT_DAY_HIGH');
      const swingSlots = slots.filter(s => s.isEnabled && s.strategyMode === 'TREND_SWING');

      // 활성화된 B, C 모드 슬롯이 없으면 대기
      if (breakoutSlots.length === 0 && swingSlots.length === 0) return;

      // 2. 모드 C: [정배열 추세 스윙] 보유 포지션 데드크로스 매도 감시
      await this.checkSwingExits(swingSlots);

      // 3. 타임락 체크 (08:50 ~ 09:30 에는 신규 매수 차단)
      if (this.isTimeLocked()) {
        console.log('🔒 [CandleStrategyEngine] 타임락 가동 중 (08:50~09:30) -> 신규 매수 감시 일시 정지');
        return;
      }

      // 4. 모드 B: [당일 신고가 돌파] 매수 기회 탐색 (빈 슬롯이 있을 때만)
      const availableBreakoutSlot = slotManager.getAvailableSlot(null, 'BREAKOUT_DAY_HIGH');
      if (availableBreakoutSlot) {
        await this.checkBreakoutEntries(availableBreakoutSlot);
      }

      // 5. 모드 C: [정배열 추세 스윙] 매수 기회 탐색 (빈 슬롯이 있을 때만)
      const availableSwingSlot = slotManager.getAvailableSlot(null, 'TREND_SWING');
      if (availableSwingSlot) {
        await this.checkSwingEntries(availableSwingSlot);
      }
    } catch (err) {
      console.error('🕯️ [CandleStrategyEngine] 전략 평가 중 오류:', err.message);
    }
  }

  /**
   * 🚀 모드 B: 당일 신고가 돌파 매수 평가
   */
  async checkBreakoutEntries(slot) {
    const tradingDate = this.getKstTradingDate();

    // 감시 대상 마켓 선정 (슬롯에 targetMarket이 지정되어 있으면 해당 마켓, 없으면 주요 마켓들)
    const targetMarkets = slot.targetMarket 
      ? [slot.targetMarket]
      : this.monitoredMarkets.slice(0, 8);

    for (const market of targetMarkets) {
      try {
        // 중복 매수 쿨다운 확인 (5분 이내 동일 종목 트리거 방지)
        const lastTrigger = this.recentBreakoutTriggers.get(market) || 0;
        if (Date.now() - lastTrigger < 300000) continue;

        // Rate Limit 보호를 위한 150ms 지연
        await new Promise(r => setTimeout(r, 150));

        // 1. 현재 일봉 데이터로 당일 고가 및 현재가 파악
        const dayCandles = await upbitClient.getDayCandles(market, 2);
        if (!dayCandles || dayCandles.length === 0) continue;

        const todayCandle = dayCandles[0];
        const currentPrice = todayCandle.trade_price;
        const dayHigh = todayCandle.high_price;
        const openingPrice = todayCandle.opening_price;

        // 고가 갱신 상태 추적
        let cached = this.dayHighMap.get(market);
        if (!cached || cached.dateStr !== tradingDate) {
          cached = { highPrice: dayHigh, dateStr: tradingDate, prevPeak: dayHigh };
          this.dayHighMap.set(market, cached);
        }

        // 신고가 돌파 조건:
        // 현재가가 당일 고가 이상이고, 당일 시가 대비 최소 +1.5% 이상 상승한 활성 종목
        const gainFromOpen = ((currentPrice - openingPrice) / openingPrice) * 100;
        const isBreakingHigh = currentPrice >= cached.highPrice && gainFromOpen >= 1.5;

        if (isBreakingHigh && slot.breakoutHighEnabled !== false) {
          // 2. 수급 필터 검증 (1분봉 또는 3분봉 거래대금 X억 원 이상)
          const unit = Number(slot.breakoutCandleUnit) === 3 ? 3 : 1;
          const minuteCandles = await upbitClient.getMinuteCandles(market, unit, 2);
          if (minuteCandles && minuteCandles.length > 0) {
            const recentMinute = minuteCandles[0];
            const recentVolumeKrw = Number(recentMinute.candle_acc_trade_price || 0);
            const minRequiredVolumeKrw = (Number(slot.breakoutMinVolumeKrwEok) || 5) * 100000000; // 억 원 단위

            console.log(`🚀 [신고가 돌파 감지] ${market} 현재가: ${currentPrice.toLocaleString()}원 (당일고가: ${dayHigh.toLocaleString()}원) | 최근 ${unit}분봉 거래대금: ${(recentVolumeKrw / 100000000).toFixed(2)}억 (필터: ${slot.breakoutMinVolumeKrwEok || 5}억)`);

            if (recentVolumeKrw >= minRequiredVolumeKrw) {
              this.recentBreakoutTriggers.set(market, Date.now());
              cached.highPrice = currentPrice; // 고가 상향 갱신

              this.emitEvent({
                type: 'BREAKOUT_BUY_SIGNAL',
                slotId: slot.slotId,
                slotName: slot.name,
                market,
                currentPrice,
                dayHigh,
                volumeKrw: recentVolumeKrw,
                reason: `[당일 신고가 돌파] ${market} 고가(${dayHigh.toLocaleString()}원) 돌파 및 ${unit}분봉 거래대금 ${(recentVolumeKrw / 100000000).toFixed(2)}억 달성`
              });
              break; // 한 번에 한 개 슬롯 매수
            }
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
   * 🌊 모드 C: 정배열 추세 스윙 매수 평가
   */
  async checkSwingEntries(slot) {
    const targetMarkets = slot.targetMarket 
      ? [slot.targetMarket]
      : ['KRW-BTC', 'KRW-ETH', 'KRW-SOL', 'KRW-XRP', 'KRW-AVAX'];

    const candleUnit = slot.swingCandleUnit || 'days';
    const shortMaPeriod = Number(slot.swingShortMa) || 5;
    const longMaPeriod = Number(slot.swingLongMa) || 20;

    for (const market of targetMarkets) {
      try {
        const lastTrigger = this.recentSwingTriggers.get(market) || 0;
        if (Date.now() - lastTrigger < 600000) continue; // 10분 쿨다운

        await new Promise(r => setTimeout(r, 200));

        let candles = [];
        if (candleUnit === 'days') {
          candles = await upbitClient.getDayCandles(market, Math.max(longMaPeriod + 5, 30));
        } else {
          candles = await upbitClient.getMinuteCandles(market, 240, Math.max(longMaPeriod + 5, 30));
        }

        if (!candles || candles.length < longMaPeriod + 2) continue;

        // 이동평균선 계산 (0번 캔들이 가장 최신)
        const currentPrices = candles.map(c => c.trade_price);
        const shortMa = this.calculateSma(currentPrices.slice(0, shortMaPeriod));
        const longMa = this.calculateSma(currentPrices.slice(0, longMaPeriod));

        // 1봉 전 이동평균선
        const prevShortMa = this.calculateSma(currentPrices.slice(1, shortMaPeriod + 1));
        const prevLongMa = this.calculateSma(currentPrices.slice(1, longMaPeriod + 1));

        // 정배열 확인: 단기 > 장기 (골든크로스 또는 정배열 유지)
        // 역배열(단기 <= 장기)이면 철저히 매수 차단
        const isGoldenOrAligned = shortMa > longMa;
        const isJustCrossed = prevShortMa <= prevLongMa && shortMa > longMa;

        if (isGoldenOrAligned) {
          const currentPrice = candles[0].trade_price;
          console.log(`🌊 [스윙 정배열 감지] ${market} (${candleUnit}) MA${shortMaPeriod}: ${shortMa.toFixed(1)} > MA${longMaPeriod}: ${longMa.toFixed(1)} ${isJustCrossed ? '(골든크로스 발생!)' : '(정배열 상승 지속)'}`);

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
            reason: `[정배열 스윙 매수] ${market} (${candleUnit}) MA${shortMaPeriod}(${shortMa.toFixed(1)}) > MA${longMaPeriod}(${longMa.toFixed(1)}) 정배열 탑승`
          });
          break; // 한 번에 한 개 슬롯 진입
        }
      } catch (err) {
        console.error(`🕯️ [Swing] ${market} 진입 평가 실패:`, err.message);
      }
    }
  }

  /**
   * 🌊 모드 C: [정배열 추세 스윙] 보유 중 데드크로스(추세 이탈) 시장가 청산 감시
   */
  async checkSwingExits(swingSlots) {
    const activeSwingSlots = swingSlots.filter(s => s.positionStatus !== 'IDLE' && s.position && s.targetMarket);

    for (const slot of activeSwingSlots) {
      try {
        const market = slot.targetMarket;
        const candleUnit = slot.swingCandleUnit || 'days';
        const shortMaPeriod = Number(slot.swingShortMa) || 5;
        const longMaPeriod = Number(slot.swingLongMa) || 20;

        await new Promise(r => setTimeout(r, 200));

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

        // 데드크로스 감지: 단기선이 장기선 아래로 추락 (단기 < 장기)
        if (shortMa < longMa) {
          const currentPrice = candles[0].trade_price;
          const pos = slot.position;
          const rawProfitRate = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

          console.log(`🚨 [스윙 추세 이탈 데드크로스!] Slot ${slot.slotId} [${market}] MA${shortMaPeriod}(${shortMa.toFixed(1)}) < MA${longMaPeriod}(${longMa.toFixed(1)}) -> 즉시 추세 이탈 시장가 청산 실행!`);

          this.emitEvent({
            type: 'SWING_EXIT_SIGNAL',
            slotId: slot.slotId,
            market,
            currentPrice,
            shortMa,
            longMa,
            profitRate: rawProfitRate,
            reason: `[스윙 추세 이탈 안전장치] MA${shortMaPeriod}(${shortMa.toFixed(1)})가 MA${longMaPeriod}(${longMa.toFixed(1)})를 하향 이탈(데드크로스)하여 즉시 시장가 청산`
          });
        }
      } catch (err) {
        console.error(`🕯️ [Swing Exit] Slot ${slot.slotId} 데드크로스 감시 실패:`, err.message);
      }
    }
  }

  /**
   * 단순 이동평균(SMA) 계산
   */
  calculateSma(prices) {
    if (!prices || prices.length === 0) return 0;
    const sum = prices.reduce((acc, p) => acc + Number(p), 0);
    return sum / prices.length;
  }
}

module.exports = new CandleStrategyEngine();
