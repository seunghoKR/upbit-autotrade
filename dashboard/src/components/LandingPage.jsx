import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Send, 
  TrendingUp, 
  Lock, 
  BarChart3, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  HelpCircle,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Gift
} from 'lucide-react';

export default function LandingPage({ onOpenKakaoLogin, onLabDevLogin }) {
  // 🏛️ 3단계 환경 감지: 🧪 연구실(로컬) | 🔬 실험실(호스팅 Staging) | 🏛️ 실서버(상용 Live)
  const isLocalLab = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    Boolean(import.meta.env?.DEV)
  );
  const isStagingLab = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/lab') ||
    window.location.hostname.includes('lab')
  );

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-purple-500 selection:text-white flex flex-col font-sans">
      
      {/* 🌟 1. 상단 네비게이션 헤더 */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-500/20 border border-purple-500/30 flex items-center justify-center bg-slate-950 shrink-0">
              <img 
                src="/assets/logos/nurioh_logo.png" 
                alt="NURIOH" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">NURIOH</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                  AI TRADER
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  {(isLocalLab || isStagingLab) ? 'v3.0.1' : 'v3.0.0'}
                </span>
                {isLocalLab ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 font-bold border border-purple-500/50 animate-pulse">
                    🧪 연구실 (로컬)
                  </span>
                ) : isStagingLab ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 font-bold border border-amber-500/60 animate-pulse">
                    🔬 실험실 (Staging)
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* 🧪 연구실 전용: 개발자 즉시 입장 버튼 */}
            {isLabMode && (
              <button
                onClick={() => onLabDevLogin && onLabDevLogin()}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm transition shadow-md shadow-purple-900/50 border border-purple-400/50 flex items-center gap-1.5 cursor-pointer"
                title="연구실에서는 카카오 로그인 없이 대표님 개발자 최고 권한으로 즉시 입장합니다."
              >
                <span>👑</span>
                <span>개발자 즉시 입장</span>
              </button>
            )}

            <button
              onClick={() => onOpenKakaoLogin && onOpenKakaoLogin()}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-xs sm:text-sm transition shadow-md shadow-yellow-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>💬</span>
              <span>카카오 로그인</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 2. 메인 히어로 섹션 */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* 배경 네온 블러 효과 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-emerald-500/15 to-purple-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* 상단 뱃지 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>비수탁형 철통 보안 & 텔레그램 실시간 승인 트레이딩</span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.2] sm:leading-[1.15]">
            잠자는 동안에도 내 계좌를 지키는<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
              업비트 AI 스마트 자동매매
            </span>
          </h1>

          {/* 서브 설명 */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            원화 마켓 287개 전종목 실시간 시세 스캔부터 기술적 보조지표(RSI/볼린저 밴드) 분석까지.<br className="hidden sm:inline" />
            내 스마트폰 텔레그램으로 승인 신호를 받아 원클릭으로 안전하게 거래하세요.
          </p>

          {/* 메인 CTA 버튼 영역 */}
          <div className="pt-4 flex flex-col items-center justify-center gap-3">
            {/* 🧪 연구실 모드일 때 개발자 즉시 접속 메인 배너 버튼 */}
            {isLabMode && (
              <button
                onClick={() => onLabDevLogin && onLabDevLogin()}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg transition shadow-2xl shadow-purple-900/60 border border-purple-400/50 flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xl">🧪</span>
                <span>연구실 개발자(대표님) 즉시 접속</span>
                <ArrowRight className="w-5 h-5 text-purple-200" />
              </button>
            )}

            <button
              onClick={() => onOpenKakaoLogin && onOpenKakaoLogin()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-sm sm:text-base transition shadow-xl shadow-yellow-500/25 flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <span className="text-lg">💬</span>
              <span>카카오톡으로 로그인</span>
              <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition" />
            </button>

            {/* 무료체험 신청 안내 */}
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <Gift className="w-3.5 h-3.5 text-yellow-400" />
              <span>3일 무료체험 신청은 <strong>로그인 후 대시보드</strong>에서 간편하게 진행하실 수 있습니다.</span>
            </p>
          </div>

          {/* 신뢰 포인트 3종 */}
          <div className="pt-6 flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>자금 비예치 (출금권한 불필요)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AES-256 철통 암호화</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>텔레그램 1:1 승인 알림</span>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 3. 핵심 특장점 3대 기둥 (Features) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-950/60 border-t border-b border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              왜 <span className="text-emerald-400">누리오 트레이더</span>인가요?
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              투자자의 자산 안전을 최우선으로 설계된 3가지 핵심 보안 원칙
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* 카드 1: 비수탁형 자산 안전 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                자금 예치 없는 비수탁형 시스템
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                회원님의 투자금을 절대 직접 받지 않습니다. 오직 본인 명의의 업비트 계좌에서만 거래되며, <strong className="text-emerald-300">출금 권한을 제외한 조회/주문 키</strong>만으로 안전하게 작동합니다.
              </p>
            </div>

            {/* 카드 2: 24시간 실시간 급등 엔진 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                24시간 287개 전종목 실시간 스캔
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                업비트 원화 마켓 전체를 1초 단위로 감시합니다. RSI 과매도 구간 및 볼린저 밴드 하단 지지 반등 시점을 포착하여 급등 초입부를 놓치지 않고 포착합니다.
              </p>
            </div>

            {/* 카드 3: 스마트폰 텔레그램 승인 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                텔레그램 원클릭 매매 승인
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                매매 신호가 감지되면 스마트폰 텔레그램(<code>@nurioh_trade_bot</code>)으로 <strong>[✅ 즉시 승인]</strong> 버튼이 전송됩니다. 회원의 최종 터치 승인이 있어야만 주문이 체결됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 4. 쉬운 시작 3단계 (How it works) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              누구나 <span className="text-yellow-400">3단계</span>로 1분 만에 시작
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              복잡한 프로그램 설치 없이 웹 브라우저에서 바로 연결됩니다
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Step 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 sm:p-6 rounded-2xl flex items-start gap-4 sm:gap-6 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black font-black text-base flex items-center justify-center shrink-0 shadow-md">
                1
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  카카오 1초 간편 로그인
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  별도의 회원가입 없이 카카오 계정으로 안전하게 로그인하고 대시보드로 입장하세요.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 sm:p-6 rounded-2xl flex items-start gap-4 sm:gap-6 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md">
                2
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  3일 무료 사용 신청 및 승인
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  대시보드 상단 [3일 무료 사용 신청]에서 기본 정보를 입력하시면 운영자 확인 후 즉시 승인됩니다.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 sm:p-6 rounded-2xl flex items-start gap-4 sm:gap-6 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black font-black text-base flex items-center justify-center shrink-0 shadow-md">
                3
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  내 업비트 API 키 등록 & 매매 가동
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  승인 완료 후 업비트 Open API 키를 등록하고 스마트폰 텔레그램 연동으로 실시간 자동매매를 시작하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 5. 하단 CTA 배너 */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-950 to-[#07090E] border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 flex items-center justify-center mx-auto text-2xl shadow-xl">
            💬
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            지금 바로 시작해 보세요
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            카카오톡 로그인 후 3일 동안 모든 프리미엄 기능을 자유롭게 체험하실 수 있습니다.
          </p>
          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={() => onOpenKakaoLogin && onOpenKakaoLogin()}
              className="px-8 py-4 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-base sm:text-lg transition shadow-xl shadow-yellow-500/25 inline-flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>💬</span>
              <span>카카오톡으로 로그인</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 🌟 6. 푸터 */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 NURIOH TRADER. All rights reserved.</p>
        <p className="text-[11px] text-slate-600 max-w-xl mx-auto leading-normal">
          본 서비스는 암호화폐 투자 보조 소프트웨어 툴이며 투자 일임이나 자문을 제공하지 않습니다. 모든 매매 주문의 최종 집행 책임은 회원 본인에게 있습니다.
        </p>
      </footer>

    </div>
  );
}
