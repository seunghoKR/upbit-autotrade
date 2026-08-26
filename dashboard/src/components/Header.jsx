import React from 'react';
import { ShieldCheck, Power, RefreshCw, ShieldAlert, BarChart3, Settings, BookOpen } from 'lucide-react';

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
    <header className="border-b border-dark-border bg-dark-card/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* 좌측: 로고 & 브랜드명 (모바일 최적화) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30 flex items-center justify-center bg-slate-950 shrink-0">
            <img 
              src="/assets/logos/nurioh_logo.png" 
              alt="NURIOH" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">NURIOH</h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold hidden xs:inline">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">실시간 급등 감시 & 멀티 슬롯 트레이딩</p>
          </div>
        </div>

        {/* 데스크톱 전용 실시간 현재가 티커 */}
        {livePrice && (
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-dark-bg/60 border border-dark-border text-xs">
            <span className="font-semibold text-slate-400">{livePrice.code || 'KRW-BTC'}</span>
            <span className={`font-bold font-mono ${livePrice.change === 'FALL' ? 'text-upbit-blue' : 'text-upbit-red'}`}>
              {Number(livePrice.trade_price || 0).toLocaleString()} KRW
            </span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded font-mono font-semibold ${
              livePrice.change === 'FALL' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {(livePrice.signed_change_rate ? (livePrice.signed_change_rate * 100).toFixed(2) : '0.00')}%
            </span>
          </div>
        )}

        {/* 우측: 제어 버튼 바 (📖 매뉴얼/의견, ⚙️ 설정, 📊 운영, 🚨 긴급 강제 매도 등) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
          {/* 📖 매뉴얼 & 의견 수렴 창구 버튼 */}
          <button
            onClick={onOpenManual}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition cursor-pointer shadow-sm"
            title="서비스 핵심 매뉴얼 및 기능 개선 의견 제안"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xs:inline">매뉴얼/의견</span>
            <span className="xs:hidden">매뉴얼</span>
          </button>

          {/* ⚙️ 매매 조건 설정 버튼 */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer shadow-sm"
            title="초단타 급등 매수/매도 상세 설정"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xs:inline">설정</span>
          </button>

          {/* 📊 운영자 대시보드 */}
          <button
            onClick={onOpenOperatorDashboard}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="운영자 대시보드"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">운영</span>
          </button>

          {/* 🚨 긴급 강제 매도 (한글화) */}
          <button
            onClick={onOpenPanicSell}
            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] sm:text-xs font-extrabold shadow-md shadow-rose-900/40 border border-rose-500/50 transition flex items-center gap-1 cursor-pointer animate-pulse"
            title="보유 코인 전량 긴급 강제 매도"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">긴급 강제 매도</span>
            <span className="sm:hidden">강제 매도</span>
          </button>

          {/* 2FA 상태 */}
          <button
            onClick={onOpen2FA}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1 cursor-pointer ${
              is2FAActive 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title="2FA 보안 설정"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{is2FAActive ? '2FA' : '2FA'}</span>
          </button>

          {/* 새로고침 */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-dark-bg hover:bg-dark-hover border border-dark-border text-slate-300 transition cursor-pointer"
            title="새로고침"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* 봇 가동/정지 토글 */}
          <button
            onClick={onToggleBot}
            className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition shadow-md flex items-center gap-1.5 cursor-pointer ${
              botRunning
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{botRunning ? '가동중' : '정지'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
