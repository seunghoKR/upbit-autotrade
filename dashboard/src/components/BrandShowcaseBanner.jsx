import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Layers, 
  BellRing, 
  TrendingUp, 
  Lock, 
  Cpu, 
  Smartphone, 
  Sparkles, 
  Award, 
  ChevronRight,
  Activity,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function BrandShowcaseBanner({ marketCount = 288 }) {
  return (
    <div className="bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
      {/* 배경 은은한 네온 글로우 효과 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      {/* 1. 상단 메인 브랜드 소개 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 border-b border-slate-800/80 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>NEXT-GEN QUANT TRADING SYSTEM</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              <span>업비트 전종목 {marketCount}개 실시간 초광속 감시 중</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            대한민국 0.001초 초광속 업비트 자동매매 <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">NURIOH TRADER</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            잠자는 동안에도 시장의 세력 수급을 0.001초 만에 감지하고, <strong>4중 리스크 쉴드</strong>로 가짜 윗꼬리를 걸러내며, <strong>트레일링 스탑</strong>으로 최고점 익절을 실현합니다.
          </p>
        </div>

        {/* 퀵 뱃지 & 실시간 현황 */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-bold block">반응 속도</span>
            <span className="text-base font-black text-amber-400 font-mono">0.001초</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-bold block">독립 슬롯</span>
            <span className="text-base font-black text-indigo-400 font-mono">최대 9개</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-bold block">보안 수준</span>
            <span className="text-base font-black text-emerald-400 font-mono">E2E 암호화</span>
          </div>
        </div>
      </div>

      {/* 2. 4대 핵심 혁신 기술 카드 (4 Pillars of Excellence) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* 카드 1 : 0.001초 초광속 WebSocket 엔진 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-white text-sm mb-1 flex items-center justify-between">
            <span>0.001초 초광속 레이더</span>
            <span className="text-[10px] text-indigo-400 font-mono font-bold">Latency 0</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            업비트 공식 웹소켓과 1:1 직결되어 신규 상장 코인을 포함한 288개 전종목의 수급 폭발을 0% 지연으로 즉각 포착합니다.
          </p>
        </div>

        {/* 카드 2 : 4중 리스크 방어 쉴드 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-white text-sm mb-1 flex items-center justify-between">
            <span>4중 리스크 쉴드</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">Anti-Dump</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            1초 윗꼬리 설거지 방지 지지시간, VWAP 평균가 필터, 손절 쿨다운, 9시 타임블록으로 세력의 덤핑 함정을 완벽 회피합니다.
          </p>
        </div>

        {/* 카드 3 : 1~9개 독립 멀티 슬롯 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-white text-sm mb-1 flex items-center justify-between">
            <span>독립 멀티 슬롯 분산</span>
            <span className="text-[10px] text-purple-400 font-mono font-bold">Multi-Slot</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            슬롯마다 독립적인 목표 익절선과 트레일링 스탑, 손절선을 배정하여 계좌 리스크를 철저히 분산하고 안전성을 극대화합니다.
          </p>
        </div>

        {/* 카드 4 : PWA 전용앱 & 실시간 사운드 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-white text-sm mb-1 flex items-center justify-between">
            <span>전용 앱 &amp; 사운드 알림</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">App &amp; Sound</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            PC/모바일 바탕화면 원클릭 앱 실행, Web Audio 무지연 사운드 효과음, 텔레그램 실시간 체결 브리핑을 지원합니다.
          </p>
        </div>

      </div>

      {/* 3. 하단 신뢰 및 보안 인증 풋터 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400 relative z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span><strong>업비트 출금 권한 미요구:</strong> 오직 안전한 조회 및 주문 권한만 사용 (자산 100% 안전 보장)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">Powered by</span>
          <span className="font-extrabold text-slate-300 tracking-wider font-mono">NURIOH AI QUANT LAB</span>
        </div>
      </div>
    </div>
  );
}
