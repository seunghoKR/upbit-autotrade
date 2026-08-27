import React from 'react';
import { ShieldCheck, Power, RefreshCw, ShieldAlert, BarChart3, Settings, BookOpen, Zap } from 'lucide-react';

export default function Header({ 
  botRunning, 
  onToggleBot, 
  onOpen2FA, 
  is2FAActive, 
  onRefresh, 
  livePrice, 
  onOpenGuide,
  onOpenPanicSell,
  onOpenOperatorDashboard,
  onOpenSettings,
  onOpenManual
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* 좌측: 로고 & 브랜드명 (본문 카드와 시작선 100% 일치) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30 flex items-center justify-center bg-slate-950 shrink-0">
            <img 
              src="/assets/logos/nurioh_logo.png" 
              alt="NURIOH" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight whitespace-nowrap">NURIOH</h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              AI
            </span>
          </div>
        </div>

        {/* 데스크톱 전용 실시간 현재가 티커 */}
        {livePrice && (
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-400">{livePrice.code || 'KRW-BTC'}</span>
            <span className={`font-bold font-mono ${livePrice.change === 'FALL' ? 'text-blue-400' : 'text-rose-400'}`}>
              {Number(livePrice.trade_price || 0).toLocaleString()} KRW
            </span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded font-mono font-semibold ${
              livePrice.change === 'FALL' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {(livePrice.signed_change_rate ? (livePrice.signed_change_rate * 100).toFixed(2) : '0.00')}%
            </span>
          </div>
        )}

        {/* 우측: 제어 버튼 바 (본문 카드와 끝선 100% 일치) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 📖 매뉴얼 버튼 */}
          <button
            onClick={onOpenManual}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
            title="매뉴얼 & 개선 의견"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">매뉴얼</span>
          </button>

          {/* ⚙️ 설정 버튼 */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
            title="상세 매매 설정"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">설정</span>
          </button>

          {/* 📊 운영자 대시보드 */}
          <button
            onClick={onOpenOperatorDashboard}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            title="운영 콘솔"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">운영</span>
          </button>

          {/* 2FA 상태 (PC에서 표시) */}
          <button
            onClick={onOpen2FA}
            className={`hidden sm:flex p-1.5 rounded-xl text-xs font-medium border transition items-center gap-1 cursor-pointer shrink-0 ${
              is2FAActive 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title="2FA 보안"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>

          {/* 새로고침 */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer shrink-0"
            title="새로고침"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* 봇 가동/정지 토글 */}
          <button
            onClick={onToggleBot}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              botRunning
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${botRunning ? 'bg-black animate-ping' : 'bg-rose-400'}`}></span>
            <span>{botRunning ? '가동중' : '정지'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
