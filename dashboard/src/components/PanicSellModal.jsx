import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X, Flame, CheckCircle2 } from 'lucide-react';

export default function PanicSellModal({ isOpen, onClose, onConfirm, accounts = [], slots = [] }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  if (!isOpen) return null;

  // 매도 대상 코인 자산 추출 (원화 제외)
  const cryptoAssets = accounts.filter(acc => acc.currency !== 'KRW' && parseFloat(acc.balance) > 0);

  const handleExecute = async () => {
    setIsProcessing(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (err) {
      console.error('Panic sell execution failed:', err);
    } finally {
      setIsProcessing(false);
      setConfirmedCheck(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-rose-600/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-rose-950/60 relative overflow-hidden">
        {/* 상단 붉은 경고 헤더 */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-rose-300 flex items-center gap-2">
                🚨 전 슬롯 긴급 강제 매도
              </h3>
              <p className="text-xs text-rose-200/80 mt-0.5">
                위급 상황 시 모든 보유 암호화폐를 즉시 시장가로 강제 청산합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 안내 및 매도 대상 리스트 */}
        <div className="py-4 space-y-4 text-sm">
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-200 text-xs leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> 주의: 취소 불가능한 즉시 강제 집행 명령입니다!
            </p>
            <p>
              실행 즉시 업비트 계좌의 모든 코인이 <strong>시장가(Market Order)</strong>로 즉각 매도되며, 1~5번 슬롯의 모든 포지션이 초기화됩니다.
            </p>
          </div>

          {/* 청산 대상 코인 목록 */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              강제 청산 대상 자산 ({cryptoAssets.length}개 종목)
            </span>
            <div className="max-h-36 overflow-y-auto bg-slate-950/80 rounded-xl border border-slate-800 p-2 space-y-1.5 divide-y divide-slate-800/60">
              {cryptoAssets.length > 0 ? (
                cryptoAssets.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                    <span className="font-bold text-slate-200">{asset.currency}/KRW</span>
                    <span className="text-slate-400 font-mono">
                      보유수량: {parseFloat(asset.balance).toFixed(4)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-500 text-xs">
                  현재 보유 중인 코인 자산이 없습니다. (원화만 보유 중)
                </div>
              )}
            </div>
          </div>

          {/* 확인 체크박스 */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded bg-slate-800 border-slate-700 focus:ring-rose-500"
            />
            <span className="text-xs text-slate-300 font-medium">
              모든 자산이 시장가로 전량 강제 처분됨을 인지하였으며, 실행을 승인합니다.
            </span>
          </label>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
          >
            취소하고 돌아가기
          </button>
          <button
            disabled={!confirmedCheck || isProcessing}
            onClick={handleExecute}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              confirmedCheck && !isProcessing
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <span>전량 강제 청산 집행 중...</span>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                🚨 전량 즉시 시장가 강제 매도
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
