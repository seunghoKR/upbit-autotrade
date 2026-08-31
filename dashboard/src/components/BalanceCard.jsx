import React, { useState } from 'react';
import { Wallet, Coins, TrendingUp, TrendingDown, Info, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function BalanceCard({ 
  accounts = [], 
  livePriceMap = {}, 
  accountError = null, 
  serverIp = '115.68.168.243',
  onOpenApiModal,
  marketCount = 134
}) {
  const hasRealAccounts = Array.isArray(accounts) && accounts.length > 0 && accounts.some(a => parseFloat(a.balance || 0) > 0 || parseFloat(a.locked || 0) > 0);
  const [useMockSimulation, setUseMockSimulation] = useState(false);

  // 실제 업비트 계좌 데이터
  const realKrwAccount = accounts.find(a => a.currency === 'KRW') || { balance: '0', locked: '0' };
  const realKrwBalance = parseFloat(realKrwAccount.balance || 0) + parseFloat(realKrwAccount.locked || 0);
  const realCoinAccounts = accounts.filter(a => a.currency !== 'KRW' && (parseFloat(a.balance || 0) > 0 || parseFloat(a.locked || 0) > 0));

  // 로컬 개발/테스트용 모의 자산 샘플
  const mockCoinAccounts = [
    { currency: 'BTC', balance: 0.05, avg_buy_price: 130000000 },
    { currency: 'ETH', balance: 0.8, avg_buy_price: 4050000 },
    { currency: 'XRP', balance: 1200, avg_buy_price: 820 }
  ];

  const isMockActive = !hasRealAccounts && useMockSimulation;
  const activeKrwBalance = hasRealAccounts ? realKrwBalance : (isMockActive ? 5000000 : 0);
  const activeCoinAccounts = hasRealAccounts ? realCoinAccounts : (isMockActive ? mockCoinAccounts : []);

  let totalCoinBuyAmount = 0;
  let totalCoinEvalValue = 0;

  const processedCoins = activeCoinAccounts
    .map(coin => {
      const market = `KRW-${coin.currency}`;
      const liveTick = livePriceMap[market];
      const avgBuyPrice = parseFloat(coin.avg_buy_price || 0);
      const currentPrice = liveTick ? parseFloat(liveTick.trade_price || 0) : (avgBuyPrice > 0 ? avgBuyPrice : 0);
      const balance = parseFloat(coin.balance || 0) + parseFloat(coin.locked || 0);
      const evalAmount = balance * currentPrice;
      const buyAmount = balance * avgBuyPrice;
      const profitRate = buyAmount > 0 ? ((evalAmount - buyAmount) / buyAmount) * 100 : 0;

      return {
        ...coin,
        balance,
        currentPrice,
        evalAmount,
        buyAmount,
        profitRate
      };
    })
    .filter(coin => coin.evalAmount >= 100 && coin.currentPrice > 0); // 100원 미만 먼지 잔고 및 미상장 에어드랍 코인 제외

  processedCoins.forEach(coin => {
    totalCoinBuyAmount += coin.buyAmount;
    totalCoinEvalValue += coin.evalAmount;
  });

  const totalAssets = activeKrwBalance + totalCoinEvalValue;
  const totalProfitAmount = totalCoinEvalValue - totalCoinBuyAmount;
  const totalProfitRate = totalCoinBuyAmount > 0 ? (totalProfitAmount / totalCoinBuyAmount) * 100 : 0;
  const isPositive = totalProfitRate >= 0;

  return (
    <div className="space-y-2">
      {/* 1. 상단 실시간 레이더 & 실계좌 인증 상태 바 */}
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] flex-wrap gap-2 shadow-sm">
        <div className="flex items-center gap-3 text-emerald-300 font-medium flex-wrap">
          {/* 🟢 실시간 레이더 전종목 감시 상태 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white">실시간 레이더 가동 중</span>
            <span className="text-emerald-400/80 font-mono">({marketCount || 134}개 전종목 실시간 감시)</span>
          </div>

          {hasRealAccounts && (
            <>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 text-emerald-300 font-medium truncate shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">업비트 실계좌 <strong>{processedCoins.length}개 보유</strong> 실시간 동기화됨</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
          {serverIp && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              IP: {serverIp}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
            v2.7.0
          </span>
        </div>
      </div>

      {/* 2-A. 모바일 전용 초슬림 통합 자산 카드 (md:hidden) */}
      <div className="md:hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md shadow-lg space-y-3">
        {/* 상단 2분할 그리드: [총 평가 자산] | [주문 가능 원화] */}
        <div className="grid grid-cols-2 gap-2.5 divide-x divide-slate-800">
          {/* 총 평가 자산 */}
          <div className="pr-2 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>총 평가 자산</span>
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                isPositive ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {isPositive ? `+${totalProfitRate.toFixed(1)}%` : `${totalProfitRate.toFixed(1)}%`}
              </span>
            </div>
            <div className="text-lg font-black font-mono text-white tracking-tight">
              {Math.round(totalAssets).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">원</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              손익: <span className={isPositive ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold'}>
                {isPositive ? '+' : ''}{Math.round(totalProfitAmount).toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 주문 가능 원화 */}
          <div className="pl-2 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>주문 가능 원화</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                {totalAssets > 0 ? ((activeKrwBalance / totalAssets) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="text-lg font-black font-mono text-white tracking-tight">
              {Math.round(activeKrwBalance).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">원</span>
            </div>
            <div className="text-[10px] text-slate-400">
              보유 코인: <strong className="text-purple-400">{processedCoins.length}종목</strong>
            </div>
          </div>
        </div>

        {/* 하단 1줄: 보유 코인 가로 스크롤 미니 칩 */}
        {processedCoins.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] pb-0.5">
            <span className="text-slate-500 shrink-0">보유:</span>
            {processedCoins.map(coin => (
              <span key={coin.currency} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] flex items-center gap-1 shrink-0">
                <span className="font-bold text-slate-200">{coin.currency}</span>
                <span className={coin.profitRate >= 0 ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold'}>
                  {coin.profitRate >= 0 ? `+${coin.profitRate.toFixed(1)}%` : `${coin.profitRate.toFixed(1)}%`}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2-B. 데스크톱 3단 자산 카드 (hidden md:grid) */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {/* 1. 총 평가 자산 & 총 평가수익률 */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">총 평가 자산</span>
              {hasRealAccounts && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  실계좌 연동
                </span>
              )}
            </div>
            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono flex items-center gap-1 ${
              isPositive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? `+${totalProfitRate.toFixed(2)}%` : `${totalProfitRate.toFixed(2)}%`}</span>
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {totalAssets >= 1 ? Math.round(totalAssets).toLocaleString() : totalAssets.toFixed(2)} <span className="text-sm font-normal text-slate-400">KRW</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>총 평가손익:</span>
            <span className={`font-mono font-bold ${isPositive ? 'text-rose-400' : 'text-blue-400'}`}>
              {isPositive ? `+${Math.round(totalProfitAmount).toLocaleString()}` : Math.round(totalProfitAmount).toLocaleString()} KRW
            </span>
          </div>
        </div>

        {/* 2. 보유 원화 (KRW) */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">주문 가능 원화 (KRW)</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {activeKrwBalance >= 1 ? Math.round(activeKrwBalance).toLocaleString() : activeKrwBalance.toFixed(2)} <span className="text-sm font-normal text-slate-400">KRW</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>원화 비중:</span>
            <span className="font-mono text-cyan-400 font-bold">
              {totalAssets > 0 ? ((activeKrwBalance / totalAssets) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* 3. 코인 평가 자산 & 보유 코인 요약 */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">보유 코인 ({processedCoins.length}종목)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {totalCoinEvalValue >= 1 ? Math.round(totalCoinEvalValue).toLocaleString() : totalCoinEvalValue.toFixed(2)} <span className="text-sm font-normal text-slate-400">KRW</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {processedCoins.length === 0 ? (
              <span className="text-slate-500 text-xs">보유 중인 코인이 없습니다.</span>
            ) : (
              processedCoins.map(coin => (
                <span key={coin.currency} className="px-2 py-0.5 rounded-lg bg-dark-bg border border-dark-border font-mono text-[11px] flex items-center gap-1 shrink-0">
                  <span className="font-bold text-slate-200">{coin.currency}</span>
                  <span className={coin.profitRate >= 0 ? 'text-rose-400 font-semibold' : 'text-blue-400 font-semibold'}>
                    {coin.profitRate >= 0 ? `+${coin.profitRate.toFixed(1)}%` : `${coin.profitRate.toFixed(1)}%`}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
