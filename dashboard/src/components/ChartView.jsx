import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Flame, 
  Zap, 
  Sparkles, 
  Radio,
  Layers,
  Crown
} from 'lucide-react';
import { getCandles } from '../services/api';

// 암호화폐별 고유 브랜드 색상 정의
export const COIN_PALETTE = {
  'KRW-BTC': { name: '비트코인 (BTC)', short: 'BTC', color: '#F59E0B', lightColor: '#FDE68A', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  'KRW-ETH': { name: '이더리움 (ETH)', short: 'ETH', color: '#6366F1', lightColor: '#C7D2FE', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  'KRW-XRP': { name: '리플 (XRP)', short: 'XRP', color: '#06B6D4', lightColor: '#A5F3FC', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  'KRW-SOL': { name: '솔라나 (SOL)', short: 'SOL', color: '#A855F7', lightColor: '#E9D5FF', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  'KRW-DOGE': { name: '도지코인 (DOGE)', short: 'DOGE', color: '#F97316', lightColor: '#FFEDD5', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  'KRW-SUI': { name: '수이 (SUI)', short: 'SUI', color: '#38BDF8', lightColor: '#BAE6FD', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  'KRW-STX': { name: '스택스 (STX)', short: 'STX', color: '#EC4899', lightColor: '#FBCFE8', bg: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  'KRW-NEAR': { name: '니어프로토콜 (NEAR)', short: 'NEAR', color: '#10B981', lightColor: '#A7F3D0', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  'KRW-ONT': { name: '온톨로지 (ONT)', short: 'ONT', color: '#0284C7', lightColor: '#BAE6FD', bg: 'bg-sky-600/20 text-sky-300 border-sky-600/40' },
  'KRW-ONG': { name: '온톨로지가스 (ONG)', short: 'ONG', color: '#0D9488', lightColor: '#99F6E4', bg: 'bg-teal-600/20 text-teal-300 border-teal-600/40' },
  'KRW-ADA': { name: '에이다 (ADA)', short: 'ADA', color: '#3B82F6', lightColor: '#BFDBFE', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  'KRW-AVAX': { name: '아발란체 (AVAX)', short: 'AVAX', color: '#EF4444', lightColor: '#FECACA', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  'KRW-SEI': { name: '세이 (SEI)', short: 'SEI', color: '#E11D48', lightColor: '#FFE4E6', bg: 'bg-rose-600/20 text-rose-300 border-rose-600/40' },
  'KRW-SHIB': { name: '시바이누 (SHIB)', short: 'SHIB', color: '#F59E0B', lightColor: '#FEF3C7', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
};

const getCoinMeta = (market) => {
  if (!market) return { name: '선택 코인', short: 'COIN', color: '#06B6D4', lightColor: '#A5F3FC', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
  if (COIN_PALETTE[market]) return COIN_PALETTE[market];
  const short = market.replace('KRW-', '');
  return { 
    name: `${short} (${short})`, 
    short, 
    color: '#06B6D4', 
    lightColor: '#A5F3FC', 
    bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
  };
};

export default function ChartView({ 
  candles: initialCandles = [], 
  selectedSlot = null,
  market = 'KRW-BTC',
  livePriceMap = {},
  rsi = 50, 
  bb = null,
  pendingApproval = null
}) {
  // 슬롯이 비어있을 때 보여줄 추천 코인 모드: 'TOP_VOLUME' (거래대금 1위), 'TOP_GAINER' (등락률 1위), 'BTC' (비트코인)
  const [idleMode, setIdleMode] = useState('TOP_VOLUME');
  const [localCandles, setLocalCandles] = useState(initialCandles);

  // 실시간 틱 데이터에서 당일 거래대금 최고 / 최고 급등률 코인 산출
  const krwTickers = Object.values(livePriceMap).filter(t => t.code && t.code.startsWith('KRW-'));
  
  // 1. 거래대금 1위 코인
  const topVolumeTicker = krwTickers.length > 0 
    ? [...krwTickers].sort((a, b) => (b.acc_trade_price_24h || 0) - (a.acc_trade_price_24h || 0))[0]
    : null;
  const topVolumeMarket = topVolumeTicker?.code || 'KRW-XRP';

  // 2. 당일 최고 급등률 1위 코인
  const topGainerTicker = krwTickers.length > 0
    ? [...krwTickers].sort((a, b) => (b.signed_change_rate || 0) - (a.signed_change_rate || 0))[0]
    : null;
  const topGainerMarket = topGainerTicker?.code || 'KRW-DOGE';

  // 🎯 1. 선택된 슬롯이 포지션을 보유 중인지 여부
  const isSlotHolding = Boolean(selectedSlot && selectedSlot.positionStatus !== 'IDLE' && selectedSlot.targetMarket);

  // 🎯 2. 선택된 슬롯에 현재 승인 대기 중인 신호가 있는지 여부
  const isSlotPending = Boolean(pendingApproval && selectedSlot && pendingApproval.slotId === selectedSlot.slotId);

  // 🎯 3. 슬롯이 활성 코인을 가지고 있는지 여부
  const hasActiveSlotCoin = isSlotHolding || isSlotPending;

  // 실제 차트에 표시할 마켓 결정 (슬롯에 신호나 포지션이 있으면 100% 슬롯 코인 최우선 표시!)
  const activeMarket = isSlotPending 
    ? pendingApproval.market 
    : isSlotHolding 
    ? selectedSlot.targetMarket 
    : (idleMode === 'TOP_VOLUME' ? topVolumeMarket : (idleMode === 'TOP_GAINER' ? topGainerMarket : 'KRW-BTC'));

  const coinMeta = getCoinMeta(activeMarket);
  const currentTicker = livePriceMap[activeMarket];

  // 활성 마켓 변경 시 캔들 차트 데이터 불러오기
  useEffect(() => {
    let isMounted = true;
    if (activeMarket) {
      getCandles(activeMarket, 1, 60).then(res => {
        if (isMounted && Array.isArray(res) && res.length > 0) {
          setLocalCandles(res);
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [activeMarket]);

  // 실시간 틱 데이터 누적 히스토리 (최근 40개 타임포인트)
  const [tickHistory, setTickHistory] = useState([]);
  const historyRef = useRef([]);

  const defaultBasePrice = activeMarket === 'KRW-BTC' ? 135000000 
    : activeMarket === 'KRW-ETH' ? 4200000 
    : activeMarket === 'KRW-XRP' ? 850 
    : activeMarket === 'KRW-SOL' ? 240000 
    : activeMarket === 'KRW-DOGE' ? 220 
    : 1000;

  const currentPrice = currentTicker?.trade_price || (localCandles.length > 0 ? localCandles[0].trade_price : defaultBasePrice);
  const changeRate = currentTicker?.signed_change_rate != null ? (currentTicker.signed_change_rate * 100) : 0;
  const isPositive = changeRate >= 0;
  const high24h = currentTicker?.high_price || currentPrice * 1.015;
  const low24h = currentTicker?.low_price || currentPrice * 0.985;
  const accTradeVolume24h = currentTicker?.acc_trade_price_24h || 50000000000;

  // 실시간 틱 누적
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newPoint = {
      time: timeStr,
      price: currentPrice
    };

    historyRef.current = [...historyRef.current.slice(-39), newPoint];
    setTickHistory([...historyRef.current]);
  }, [currentPrice, activeMarket]);

  // 마켓 변경 시 히스토리 초기화
  useEffect(() => {
    historyRef.current = [];
    setTickHistory([]);
  }, [activeMarket]);

  // 차트 데이터 구성 (캔들 데이터 우선, 없으면 실시간 틱)
  let chartData = [];
  if (localCandles.length > 0) {
    chartData = [...localCandles].reverse().map(c => ({
      time: new Date(c.candle_date_time_kst || c.candle_date_time_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: c.trade_price,
      high: c.high_price,
      low: c.low_price
    }));
  } else if (tickHistory.length > 0) {
    chartData = tickHistory;
  }

  // 데이터가 적을 때 완만한 곡선 보장
  if (chartData.length < 5) {
    chartData = Array.from({ length: 20 }, (_, i) => ({
      time: `${i + 1}분전`,
      price: Math.round(currentPrice * (1 + (Math.sin(i / 3) * 0.002)))
    }));
  }

  const prices = chartData.map(d => d.price).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) * 0.9985 : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.0015 : 100;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl flex flex-col space-y-4">
      {/* 1. 상단 타이틀 & 슬롯 상태 / 추천 주도주 탭 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 sm:p-3 rounded-2xl border shadow-md flex items-center justify-center transition-all shrink-0"
            style={{ 
              backgroundColor: `${coinMeta.color}20`,
              borderColor: `${coinMeta.color}40`,
              color: coinMeta.color
            }}
          >
            <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 슬롯 상태 배지 */}
              {isSlotPending ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-xs flex items-center gap-1 shadow animate-bounce">
                  <Sparkles className="w-3 h-3 text-black" />
                  슬롯 {selectedSlot.slotId} 급등 포착 신호 (승인 대기)
                </span>
              ) : isSlotHolding ? (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 text-indigo-300" />
                  슬롯 {selectedSlot.slotId} 포지션 보유 중
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1">
                  <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                  슬롯 {selectedSlot?.slotId || 1} 대기 중 (실시간 추천 차트)
                </span>
              )}

              <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                {coinMeta.name} 실시간 가격 차트
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                실시간 틱 감시 중
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {isSlotPending 
                ? `슬롯 ${selectedSlot.slotId}번에 포착된 ${coinMeta.name}의 실시간 급등 호가 및 체결 추세를 확인합니다.`
                : isSlotHolding 
                ? `슬롯 ${selectedSlot.slotId}번에 탑승된 ${coinMeta.short} 코인의 실시간 원화 체결가와 트레일링 스탑을 추적합니다.` 
                : '선택한 슬롯이 대기 중일 때는 업비트 당일 최고 거래대금 / 최고 급등률 주도주 차트를 실시간 제공합니다.'}
            </p>
          </div>
        </div>

        {/* 오른쪽: 슬롯이 비어있을 때 원클릭 추천 주도주 탭 & 현재 체결가 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* 슬롯에 신호/포지션이 없을 때만 추천 코인 선택 탭 표시 */}
          {!hasActiveSlotCoin && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              {/* 거래대금 1위 버튼 */}
              <button
                onClick={() => setIdleMode('TOP_VOLUME')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  idleMode === 'TOP_VOLUME'
                    ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/50 text-amber-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="업비트 당일 거래대금이 가장 많은 시장 주도 코인을 표시합니다."
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>🔥 거래대금 1위 ({getCoinMeta(topVolumeMarket).short})</span>
              </button>

              {/* 급등률 1위 버튼 */}
              <button
                onClick={() => setIdleMode('TOP_GAINER')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  idleMode === 'TOP_GAINER'
                    ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="업비트 당일 상승률이 가장 높은 급등 코인을 표시합니다."
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>🚀 급등률 1위 ({getCoinMeta(topGainerMarket).short})</span>
              </button>

              {/* 비트코인 기준 버튼 */}
              <button
                onClick={() => setIdleMode('BTC')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  idleMode === 'BTC'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>BTC</span>
              </button>
            </div>
          )}

          {/* 현재 체결가 및 24H 변동률 */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">현재 체결가</span>
              <div 
                className="text-xl sm:text-2xl font-black font-mono tracking-tight"
                style={{ color: coinMeta.color }}
              >
                {Math.round(currentPrice).toLocaleString()} <span className="text-xs font-normal text-slate-400">KRW</span>
              </div>
            </div>

            <div className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-extrabold font-mono flex items-center gap-1 ${
              isPositive 
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? `+${changeRate.toFixed(2)}%` : `${changeRate.toFixed(2)}%`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 24시간 최고가/최저가 & 보조 지표 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] mr-1.5">24H 최고:</span>
            <span className="font-mono text-rose-400 font-bold">{Math.round(high24h).toLocaleString()}원</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] mr-1.5">24H 최저:</span>
            <span className="font-mono text-blue-400 font-bold">{Math.round(low24h).toLocaleString()}원</span>
          </div>
          <div className="hidden md:block">
            <span className="text-slate-500 text-[11px] mr-1.5">24H 거래대금:</span>
            <span className="font-mono text-slate-300">{(accTradeVolume24h / 100000000).toFixed(1)}억원</span>
          </div>
        </div>

        {/* RSI & 볼린저 밴드 */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">RSI(14):</span>
            <span className={`font-bold font-mono text-[11px] ${
              rsi <= 30 ? 'text-emerald-400' : rsi >= 70 ? 'text-rose-400' : 'text-cyan-400'
            }`}>
              {rsi || 50}
            </span>
          </div>

          {bb && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-400">BB:</span>
              <span className="text-blue-400">L: {Math.round(bb.lower).toLocaleString()}</span>
              <span className="text-slate-600">|</span>
              <span className="text-rose-400">U: {Math.round(bb.upper).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. 고유 색상 원화 가격 차트 렌더링 (높이 360px 보장) */}
      <div className="w-full h-[360px] pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient_${activeMarket}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={coinMeta.color} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={coinMeta.color} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              orientation="right"
              stroke="#64748b" 
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${Number(v).toLocaleString()}원`}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={(value) => [`${Number(value).toLocaleString()} KRW`, coinMeta.name]}
            />

            {bb && activeMarket === market && (
              <>
                <ReferenceLine y={bb.upper} stroke="#F84960" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'BB 상단', fill: '#F84960', fontSize: 10 }} />
                <ReferenceLine y={bb.lower} stroke="#1261C4" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'BB 하단', fill: '#1261C4', fontSize: 10 }} />
              </>
            )}

            {/* 고유 색상 그라데이션 면적 */}
            <Area
              type="monotone"
              dataKey="price"
              stroke={coinMeta.color}
              fill={`url(#gradient_${activeMarket})`}
              strokeWidth={0}
            />

            {/* 고유 색상 가격 추세선 */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={coinMeta.color} 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: coinMeta.color, stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
