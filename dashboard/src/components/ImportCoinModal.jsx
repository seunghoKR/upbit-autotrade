import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Wallet, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { formatCoinWithKo } from '../services/coinNames';

export default function ImportCoinModal({
  isOpen,
  onClose,
  slot,
  slots = [],
  accounts = [],
  livePriceMap = {},
  onImportCoin,
  userId = 1
}) {
  const [submittingCoin, setSubmittingCoin] = useState(null);
  const [fetchedPrices, setFetchedPrices] = useState({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // 🔄 모달이 열릴 때 업비트 공개 API로 보유 코인들의 최신 현재가 즉시 일괄 조회!
  useEffect(() => {
    if (!isOpen || !accounts || accounts.length === 0) return;

    const candidateMarkets = accounts
      .filter(acc => {
        const curr = (acc.currency || '').toUpperCase();
        return curr && curr !== 'KRW';
      })
      .map(acc => `KRW-${acc.currency.toUpperCase()}`);

    if (candidateMarkets.length === 0) return;

    let isMounted = true;
    setIsLoadingPrices(true);

    // 업비트 공개 Ticker API 호출 (쉼표로 구분하여 일괄 조회)
    const marketsParam = candidateMarkets.join(',');
    axios.get(`https://api.upbit.com/v1/ticker?markets=${marketsParam}`)
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          const priceMap = {};
          res.data.forEach(item => {
            priceMap[item.market] = parseFloat(item.trade_price || 0);
          });
          setFetchedPrices(priceMap);
        }
      })
      .catch(err => {
        console.warn('⚠️ 업비트 보유 코인 실시간 시세 조회 실패 (평단가로 대체):', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPrices(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, accounts]);

  if (!isOpen || !slot) return null;

  // 🚫 이미 어떤 슬롯에서든 관리/보유 중인 코인 마켓 목록 추출 (단, 현재 선택된 슬롯의 코인은 재연동 가능하도록 허용)
  const occupiedMarkets = new Set(
    (slots || [])
      .filter(s => s.slotId !== slot.slotId && s.positionStatus === 'IN_POSITION' && s.targetMarket)
      .map(s => s.targetMarket.toUpperCase())
  );

  // 🛡️ 업비트 실계좌 보유 코인 필터링 및 현재가 매핑
  const heldCoins = (accounts || [])
    .filter(acc => {
      const curr = (acc.currency || '').toUpperCase();
      if (!curr || curr === 'KRW') return false;
      const market = `KRW-${curr}`;
      // 🚫 다른 슬롯이 이미 보유 중인 코인은 제외
      if (occupiedMarkets.has(market)) return false;
      const bal = parseFloat(acc.balance || 0) + parseFloat(acc.locked || 0);
      return bal > 0.0000001;
    })
    .map(acc => {
      const curr = acc.currency.toUpperCase();
      const market = `KRW-${curr}`;
      const balance = parseFloat(acc.balance || 0) + parseFloat(acc.locked || 0);
      const avgBuyPrice = parseFloat(acc.avg_buy_price || 0);
      
      // 최신 실시간 현재가 우선순위: 1) 일괄조회 시세 2) 웹소켓 시세 3) 평단가
      const liveTick = livePriceMap[market];
      const liveWsPrice = liveTick ? parseFloat(liveTick.trade_price || 0) : 0;
      const liveApiPrice = fetchedPrices[market] || 0;

      const currentPrice = liveApiPrice > 0 ? liveApiPrice : (liveWsPrice > 0 ? liveWsPrice : avgBuyPrice);
      const evalPrice = currentPrice > 0 ? currentPrice : avgBuyPrice;
      const evalAmount = balance * (evalPrice > 0 ? evalPrice : 1);
      
      const profitPct = (avgBuyPrice > 0 && currentPrice > 0) 
        ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 
        : 0;

      const isTradeable = evalAmount >= 5000;

      return {
        currency: curr,
        market,
        balance,
        avgBuyPrice,
        currentPrice,
        evalAmount,
        profitPct,
        isTradeable
      };
    })
    // ⚡ 1,000원 이상이거나 업비트 마켓 시세가 존재하는 코인 모두 노출!
    .filter(coin => (coin.evalAmount >= 1000 || coin.avgBuyPrice > 0) && coin.currentPrice > 0)
    .sort((a, b) => b.evalAmount - a.evalAmount); // 평가금액 높은 순 정렬

  const handleSelectCoin = async (coin) => {
    try {
      setSubmittingCoin(coin.market);
      const entryPrice = coin.avgBuyPrice > 0 ? coin.avgBuyPrice : coin.currentPrice;
      const entryAmountKrw = coin.balance * (coin.currentPrice || entryPrice);

      await onImportCoin(slot.slotId, {
        userId,
        market: coin.market,
        entryPrice: entryPrice || coin.currentPrice || 1,
        entryVolume: coin.balance,
        entryAmountKrw: entryAmountKrw || (coin.balance * entryPrice),
        currentPrice: coin.currentPrice || entryPrice
      });

      onClose();
    } catch (err) {
      alert('코인 가져오기 중 오류가 발생했습니다: ' + (err.message || err));
    } finally {
      setSubmittingCoin(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {slot.slotName || `${slot.slotId}번 슬롯`}으로 업비트 코인 가져오기
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {slot.strategyType === 'SELF' ? '셀프전략' : '추천전략'}
                </span>
                {isLoadingPrices && (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                업비트 실계좌에 보유 중인 코인을 이 슬롯에 연동하여 실시간 익절/손절 감시를 가동합니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 슬롯 적용 예정 설정 정보 배너 */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>등록 시 즉시 가동될 슬롯 설정:</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-400 font-bold">
              감시익절: +{(slot.strategyType === 'SELF' ? slot.trailingTargetProfitPct : slot.targetProfitPct) || 3.0}%
            </span>
            <span className="text-cyan-400 font-bold">
              콜백: {(slot.strategyType === 'SELF' ? slot.trailingCallbackPct : slot.trailingCallbackPct) || 1.0}%
            </span>
            <span className="text-rose-400 font-bold">
              손절선: -{(slot.strategyType === 'SELF' ? slot.stopLossPct : slot.stopLossPct) || 2.0}%
            </span>
          </div>
        </div>

        {/* ℹ️ 안내 배너 */}
        <div className="px-5 py-2 bg-slate-900/90 border-b border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>코인을 슬롯에 등록하면 슬롯이 <strong>자동으로 활성화(ON)</strong>되며 실시간 트레일링 익절이 시작됩니다.</span>
        </div>

        {/* 보유 코인 목록 */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-800/40">
          {heldCoins.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-300">
                  {occupiedMarkets.size > 0 
                    ? '가져올 수 있는 추가 보유 코인이 없습니다.' 
                    : '업비트 계좌에 보유 중인 코인이 없습니다.'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {occupiedMarkets.size > 0 
                    ? '이미 보유 중인 코인이 다른 슬롯에 모두 배정되어 있습니다.' 
                    : '업비트에서 코인을 매수하거나 API 키 연결 상태를 확인해주세요.'}
                </p>
              </div>
            </div>
          ) : (
            heldCoins.map((coin) => {
              const isSubmitting = submittingCoin === coin.market;
              const isPositive = coin.profitPct > 0;
              const isNegative = coin.profitPct < 0;

              return (
                <div 
                  key={coin.market}
                  className="pt-3 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition border border-transparent hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-xs shrink-0 shadow-inner">
                      {coin.currency.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-sm tracking-tight">{formatCoinWithKo(coin.market)}</span>
                        {coin.avgBuyPrice > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono flex items-center gap-0.5 ${
                            isPositive 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : isNegative 
                              ? 'bg-rose-500/20 text-rose-300' 
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : isNegative ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                            {isPositive ? '+' : ''}{coin.profitPct.toFixed(2)}%
                          </span>
                        )}
                        {coin.isTradeable ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            주문가능
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30" title="업비트 최소 주문 금액(5,000원) 미만입니다. 가져온 후 추가 매수 시 정상 주문 가능합니다.">
                            5,000원 미만
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span>수량: <strong className="text-slate-200 font-mono">{coin.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
                        <span>평단가: <strong className="text-slate-200 font-mono">{coin.avgBuyPrice > 0 ? `${coin.avgBuyPrice.toLocaleString()}원` : '시세진입'}</strong></span>
                        <span>현재가: <strong className="text-cyan-300 font-mono">{coin.currentPrice > 0 ? `${coin.currentPrice.toLocaleString()}원` : '-'}</strong></span>
                        <span>평가액: <strong className="text-amber-300 font-mono font-bold">약 {Math.round(coin.evalAmount).toLocaleString()}원</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectCoin(coin)}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition shrink-0 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <span>등록 중...</span>
                    ) : (
                      <>
                        <span>슬롯에 등록</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            등록 시 해당 슬롯이 ON 상태로 전환되며 실시간 익절/손절 관리가 시작됩니다.
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
