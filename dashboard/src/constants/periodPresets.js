/**
 * Any Life AI 트레이더 - 장세별(오전/오후/야간) 12개 슬롯 공식 표준 디폴트 설정
 * (대표님 제안서 및 전략표 100% 반영)
 */

export const PERIOD_METAS = {
  MORNING: {
    key: 'MORNING',
    name: '오전 모드',
    icon: '☀️',
    badge: '08:50 ~ 12:00',
    title: '☀️ 오전 모드 (08:50 ~ 12:00)',
    tagText: '09:00 리셋 직후 당일 돌파 & 대형주 스윙',
    desc: '09:00 업비트 일봉 리셋 직후 당일 신고가 돌파 및 거래대금 폭발 코인 집중 진입'
  },
  AFTERNOON: {
    key: 'AFTERNOON',
    name: '오후 모드',
    icon: '🌤️',
    badge: '12:00 ~ 21:00',
    title: '🌤️ 오후 모드 (12:00 ~ 21:00)',
    tagText: '거래량 감소 시간대 횡보 방어 & 수급 집중',
    desc: '점심 이후 거래량 감소 시간대 휩쏘 방어 및 검증된 수급 상위 코인 선별 공략'
  },
  NIGHT: {
    key: 'NIGHT',
    name: '야간 모드',
    icon: '🌙',
    badge: '21:00 ~ 08:50',
    title: '🌙 야간 모드 (21:00 ~ 08:50)',
    tagText: '미 증시 개장 전후 야간 단기 청산 & 허수 트릭 방어',
    desc: '미국 증시 개장 전후 고변동성 장세 대응 및 30% 허수 트릭 단기 익절 방어'
  }
};

export const DEFAULT_PERIOD_SLOTS = {
  // ☀️ 오전장 (1~4번 돌파, 5~8번 스윙, 9~10번 돌파, 11~12번 스윙)
  MORNING: [
    { slotId: 1, name: '1번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 100, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 2, name: '2번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 150, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 3, name: '3번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 300, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 30000 },
    { slotId: 4, name: '4번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 400, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 30000 },
    { slotId: 5, name: '5번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 1000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 6, name: '6번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 1000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 7, name: '7번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 8, name: '8번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 9, name: '9번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 160, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 10, name: '10번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 500, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 11, name: '11번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 1000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 100000 },
    { slotId: 12, name: '12번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 100000 }
  ],

  // 🌤️ 오후장 (1~4번 돌파, 5~8번 스윙, 9~10번 돌파, 11~12번 스윙)
  AFTERNOON: [
    { slotId: 1, name: '1번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 160, trailingTier1TargetProfitPct: 4.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 2, name: '2번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 200, trailingTier1TargetProfitPct: 4.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 3, name: '3번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 400, trailingTier1TargetProfitPct: 4.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 30000 },
    { slotId: 4, name: '4번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 500, trailingTier1TargetProfitPct: 4.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 30000 },
    { slotId: 5, name: '5번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 1000, trailingTier1TargetProfitPct: 4.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.5, tradeAmountKrw: 50000 },
    { slotId: 6, name: '6번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 1000, trailingTier1TargetProfitPct: 4.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.5, tradeAmountKrw: 50000 },
    { slotId: 7, name: '7번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 8, name: '8번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 9, name: '9번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 200, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 10, name: '10번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 600, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 11, name: '11번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 100000 },
    { slotId: 12, name: '12번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 100000 }
  ],

  // 🌙 야간장 (1~4번 돌파, 5~8번 스윙, 9~10번 돌파+30% 허수 트릭, 11~12번 스윙)
  NIGHT: [
    { slotId: 1, name: '1번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 200, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 2, name: '2번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 250, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 3, name: '3번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 500, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 30000 },
    { slotId: 4, name: '4번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 600, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 2.0, tradeAmountKrw: 30000 },
    { slotId: 5, name: '5번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 1000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 6, name: '6번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 1000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 7, name: '7번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 8, name: '8번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 50000 },
    { slotId: 9, name: '9번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 1, breakoutMinVolumeKrwEok: 250, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 30.0, trailingTier2CallbackPct: 3.0, isHesuTrick: true, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 10, name: '10번 슬롯', strategyMode: 'BREAKOUT_DAY_HIGH', breakoutCandleUnit: 3, breakoutMinVolumeKrwEok: 700, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 0.5, trailingTier2HurdlePct: 30.0, trailingTier2CallbackPct: 3.0, isHesuTrick: true, stopLossPct: 2.0, tradeAmountKrw: 50000 },
    { slotId: 11, name: '11번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'minutes/240', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 100000 },
    { slotId: 12, name: '12번 슬롯', strategyMode: 'TREND_SWING', swingCandleUnit: 'days', swingShortMa: 5, swingLongMa: 20, swingMinTradePrice24hEok: 2000, trailingTier1TargetProfitPct: 5.0, trailingTier1CallbackPct: 1.0, trailingTier2HurdlePct: 15.0, trailingTier2CallbackPct: 3.0, stopLossPct: 3.0, tradeAmountKrw: 100000 }
  ]
};
