import React from 'react';
import { History, BellRing, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function TradeLogs({ pendingApproval, tradeHistory = [], onApprove, onReject }) {
  return (
    <div className="space-y-4">
      {/* 1. 승인 대기 중인 신호가 있을 때 표시되는 인터랙티브 배너 */}
      {pendingApproval && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border-2 border-amber-500/50 rounded-2xl p-5 relative overflow-hidden animate-pulse">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 mt-1 md:mt-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-black">
                    승인 대기 중
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    [{pendingApproval.market}] {pendingApproval.type === 'BUY' ? '🟢 매수 신호' : '🔴 매도 신호'}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  사유: <span className="text-amber-300 font-semibold">{pendingApproval.reason}</span>
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                  <span>현재가: {Number(pendingApproval.price).toLocaleString()} KRW</span>
                  <span>주문금액: {Number(pendingApproval.amount || 0).toLocaleString()} KRW</span>
                  <span>RSI: {pendingApproval.rsi || '-'}</span>
                </div>
              </div>
            </div>

            {/* 웹 승인 / 취소 버튼 */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => onApprove(pendingApproval.id)}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                <span>승인 및 체결</span>
              </button>
              <button
                onClick={() => onReject(pendingApproval.id, '웹에서 취소')}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-dark-bg hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>주문 취소</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 체결 및 신호 히스토리 목록 */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">체결 및 매매 신호 내역</h2>
            <p className="text-xs text-slate-400">시스템의 최근 거래 동작 기록</p>
          </div>
        </div>

        {tradeHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            아직 기록된 매매 신호 내역이 없습니다. (자동매매 엔진이 시세를 감시 중입니다)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-dark-border text-slate-400">
                  <th className="pb-2">시각</th>
                  <th className="pb-2">구분</th>
                  <th className="pb-2">마켓</th>
                  <th className="pb-2">가격</th>
                  <th className="pb-2">금액/수량</th>
                  <th className="pb-2">사유</th>
                  <th className="pb-2">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/50 font-mono">
                {tradeHistory.map((trade, idx) => (
                  <tr key={trade.id || idx} className="hover:bg-dark-hover/50 transition-colors">
                    <td className="py-2.5 text-slate-400">
                      {trade.executedAt ? new Date(trade.executedAt).toLocaleTimeString() : trade.createdAt ? new Date(trade.createdAt).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {trade.type === 'BUY' ? '매수' : '매도'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200 font-bold">{trade.market}</td>
                    <td className="py-2.5 text-slate-300">{Number(trade.price).toLocaleString()} 원</td>
                    <td className="py-2.5 text-slate-400">{trade.amount ? `${Number(trade.amount).toLocaleString()} 원` : trade.volume || '-'}</td>
                    <td className="py-2.5 text-slate-400 font-sans">{trade.reason}</td>
                    <td className="py-2.5">
                      <span className="text-emerald-400 font-semibold">{trade.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
