import React, { useState } from 'react';
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
  ChevronDown,
  HelpCircle,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Gift,
  Activity,
  Server,
  Cpu,
  Check,
  AlertTriangle
} from 'lucide-react';
import { APP_VERSION } from '../version';

export default function LandingPage({ onOpenKakaoLogin, onLabDevLogin }) {
  // 🏛️ 2단계 환경 감지: 🧪 연구실(로컬) | 🟢 Any Life AI 실서버(Live)
  const isLocalLab = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    Boolean(import.meta.env?.DEV)
  );

  // ❓ 자주 묻는 질문(FAQ) 아코디언 상태
  const [openFaq, setOpenFaq] = useState(0);

  // 🎨 인터랙티브 장세 모드 미리보기 탭 (오전 / 오후 / 야간)
  const [activePreviewMode, setActivePreviewMode] = useState('MORNING');

  const faqList = [
    {
      q: '제 업비트 계좌의 원화나 코인을 시스템이 임의로 인출해갈 위험은 없나요?',
      a: '절대로 불가능합니다. Any Life AI는 [자금 비예치형(Non-Custodial)] 시스템입니다. 회원님의 API 키 등록 시 [출금 권한]을 원천적으로 제외한 [조회 및 주문 권한]만을 사용하며, 모든 자산은 회원님 명의의 안전한 업비트 지갑에 그대로 보관됩니다.'
    },
    {
      q: '컴퓨터나 스마트폰을 24시간 계속 켜두어야 하나요?',
      a: '전혀 켜두실 필요 없습니다. Any Life AI의 퀀트 매매 엔진은 365일 무중단으로 클라우드 보안 서버에서 안정적으로 가동됩니다. PC를 종료하시거나 여행 중이셔도 시스템은 실시간으로 시장을 감시합니다.'
    },
    {
      q: '3일 무료체험이 종료된 후 자동으로 유료 결제가 되나요?',
      a: '자동 결제는 절대 발생하지 않습니다. 무료체험 종료 후에도 자동으로 카드가 결제되는 번거로운 장치 없이, 회원님께서 직접 만족하시고 연장을 원하실 때에만 결제 안내를 도와드립니다. 안심하고 3일간의 모든 기능을 체험해 보세요.'
    },
    {
      q: '어떤 암호화폐(코인)들을 감시하고 매매하나요?',
      a: '업비트 원화(KRW) 마켓 전체를 대상으로 실시간 거래대금, 체결 강도, 변동성 지표를 종합 분석합니다. 허수 주문이나 거래량이 부족한 위험 종목을 자동으로 필터링하고, 검증된 모멘텀 우량 코인만을 안전하게 포착합니다.'
    },
    {
      q: '스마트폰 텔레그램 연동 시 어떤 알림이 오나요?',
      a: 'AI가 급등 종목을 감지하면 즉시 회원님의 1:1 텔레그램 봇으로 [매수 승인 요청] 메시지가 발송됩니다. 회원이 직접 [✅ 매수 승인] 버튼을 누를 때만 주문이 체결되는 수동 승인 모드와, 완전 자동 모드를 언제든 자유롭게 전환하실 수 있습니다.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 selection:bg-emerald-500 selection:text-black flex flex-col font-sans relative overflow-x-hidden">
      
      {/* 🌌 배경 럭셔리 앰비언트 글로우 & 그리드 메쉬 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/10 via-indigo-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/5 blur-[160px] rounded-full" />
        {/* 미세 테크 그리드 패턴 배경 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 🌟 1. 상단 프리미엄 네비게이션 헤더 */}
      <header className="border-b border-white/[0.08] bg-[#050811]/80 backdrop-blur-2xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          
          {/* 브랜드 로고 & 버전 태그 */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/20 flex items-center justify-center bg-[#090D1A] shrink-0 shadow-lg">
                <img 
                  src="/assets/logos/nurioh_logo.png" 
                  alt="Any Life AI" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">Any Life</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold tracking-wide">
                  AI QUANT
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono font-bold border border-slate-700">
                  v{APP_VERSION}
                </span>
                {isLocalLab ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 font-bold border border-purple-500/50 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    🧪 연구실 (로컬)
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    🟢 실서버 (anylifeai.kr)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">Smart Trading for Any Lifestyle</p>
            </div>
          </div>

          {/* 우측 네비게이션 액션 버튼 */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isLocalLab && (
              <button
                type="button"
                onClick={() => onLabDevLogin && onLabDevLogin('dev_admin')}
                className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
                title="연구실 빠른 테스트 입장"
              >
                <span>🧪</span>
                <span>연구실 즉시 입장</span>
              </button>
            )}

            <button
              onClick={() => onOpenKakaoLogin && onOpenKakaoLogin('login')}
              className="relative group px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(254,229,0,0.25)] hover:shadow-[0_0_25px_rgba(254,229,0,0.4)] flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="text-sm">💬</span>
              <span>카카오 로그인</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 2. 메인 럭셔리 히어로 섹션 */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-7">
          
          {/* 하이엔드 슬로건 뱃지 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.12] backdrop-blur-xl text-slate-300 text-xs sm:text-sm font-medium shadow-inner">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold">NEXT-GEN FINTECH</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-200">차세대 비수탁형 스마트 퀀트 트레이딩</span>
          </div>

          {/* 메인 헤드라인 */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.2] sm:leading-[1.12]">
              삶에 온전한 여유를 더하는 지능<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
                Any Life AI 스마트 자동매매
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light pt-2">
              24시간 잠들지 않는 변동성 암호화폐 시장, 불안해하지 마세요.<br className="hidden sm:inline" />
              자금 예치 없는 안전한 내 업비트 계좌에서 AI가 시장을 정밀 분석하고 운용하여<br className="hidden sm:inline" />
              대표님께 <span className="text-emerald-400 font-semibold underline decoration-emerald-500/50 underline-offset-4">시간의 자유</span>와 <span className="text-cyan-300 font-semibold underline decoration-cyan-500/50 underline-offset-4">평온한 일상</span>을 선물합니다.
            </p>
          </div>

          {/* CTA 버튼 & 무료체험 안내 카드 */}
          <div className="pt-2 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <button
                onClick={() => onOpenKakaoLogin && onOpenKakaoLogin('login')}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-base sm:text-lg transition-all shadow-[0_0_30px_rgba(254,229,0,0.3)] hover:shadow-[0_0_40px_rgba(254,229,0,0.5)] flex items-center justify-center gap-3 cursor-pointer transform hover:-translate-y-1 active:translate-y-0 group border border-yellow-300/40"
              >
                <span className="text-xl">💬</span>
                <span>카카오톡으로 1초 시작하기</span>
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1.5 transition-transform" />
              </button>

              {isLocalLab && (
                <button
                  type="button"
                  onClick={() => onLabDevLogin && onLabDevLogin('dev_admin')}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-purple-300 border border-purple-500/40 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>🧪</span>
                  <span>연구실 즉시 입장 (테스트)</span>
                </button>
              )}
            </div>

            {/* 3일 무료체험 보증 뱃지 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-300 backdrop-blur-md">
              <Gift className="w-4 h-4 text-yellow-400 shrink-0 animate-bounce" />
              <span>
                가입 즉시 <strong>3일 전 기능 무료 체험</strong>이 제공되며, 카드 자동 결제는 절대 발생하지 않습니다.
              </span>
            </div>
          </div>

          {/* 🌟 핀테크 관제탑 라이브 터미널 프리뷰 (신뢰도 극대화 위젯) */}
          <div className="pt-6 max-w-4xl mx-auto">
            <div className="relative rounded-3xl p-1 bg-gradient-to-b from-white/15 via-white/5 to-transparent shadow-2xl">
              <div className="bg-[#090D1A]/95 rounded-[22px] border border-white/[0.08] p-5 sm:p-7 backdrop-blur-2xl text-left space-y-4">
                
                {/* 터미널 탑바 */}
                <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-white/[0.08] gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono text-slate-400 pl-2">
                      ANY-LIFE-AI-CORE // QUANT ENGINE STATUS
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      UPBIT KRW MARKET 24H ONLINE
                    </span>
                    <span className="text-slate-400 hidden sm:inline">LATENCY 12ms</span>
                  </div>
                </div>

                {/* 실시간 시뮬레이션 슬롯 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  
                  {/* 슬롯 1 미리보기 */}
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-emerald-500/40 transition">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">SLOT 01 • BTC</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                        다단 익절 추적 중
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">현재 평가수익</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">+3.85% ▲</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>트레일링 스탑</span>
                      <span className="text-slate-300 font-mono">고점 대비 -1.2% 감시</span>
                    </div>
                  </div>

                  {/* 슬롯 2 미리보기 */}
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-cyan-500/40 transition">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">SLOT 02 • ETH</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold">
                        스마트 분할 매수
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">포지션 진입</span>
                      <span className="text-sm font-black text-cyan-400 font-mono">2차 차등 체결</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>위험도 가드</span>
                      <span className="text-slate-300 font-mono">칼손절선 -2.8% 세팅</span>
                    </div>
                  </div>

                  {/* 슬롯 3 미리보기 */}
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-indigo-500/40 transition">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">SLOT 03 • SOL</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold">
                        급등 포착 대기
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">모멘텀 스코어</span>
                      <span className="text-sm font-black text-indigo-300 font-mono">94.2점 (진입 감지)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>텔레그램 알림</span>
                      <span className="text-yellow-400 font-mono">스마트폰 승인 요청 대기</span>
                    </div>
                  </div>

                </div>

                {/* 하단 안심 보안 보증 스트립 */}
                <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-white/[0.06] gap-2">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span><strong>비수탁(Non-Custodial) 보안:</strong> 업비트 출금 권한 100% 배제 (조회/주문 전용)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AES-256 개인화 키 암호화 분리 보관</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 🌟 4대 핵심 신뢰 지표 바 */}
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-4 text-center backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">24H / 365D</div>
              <div className="text-xs text-slate-400 mt-1">무중단 실시간 마켓 스캔</div>
            </div>
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-4 text-center backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">0원 예치</div>
              <div className="text-xs text-slate-400 mt-1">출금 권한 없는 철저한 비수탁</div>
            </div>
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-4 text-center backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">12 SLOTS</div>
              <div className="text-xs text-slate-400 mt-1">독립 멀티 슬롯 분할 운용</div>
            </div>
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-4 text-center backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">1:1 TELEGRAM</div>
              <div className="text-xs text-slate-400 mt-1">스마트폰 즉시 승인 알림</div>
            </div>
          </div>

        </div>
      </section>

      {/* 🌟 3. 핵심 아키텍처 4대 기둥 (Luxury Bento Grid) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#080C17]/80 border-t border-b border-white/[0.06] relative z-10">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CORE PHILOSOPHY & SECURITY</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              왜 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Any Life AI</span>여야 할까요?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              신뢰할 수 없는 타인에게 투자금을 맡기는 시대는 끝났습니다.<br className="hidden sm:inline" />
              내 자산은 내 계좌에 두고, 지능적인 거래 실행만 AI에게 일임하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* 1. 비수탁형 자산 안전 */}
            <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-white/[0.08] hover:border-emerald-500/50 transition-all duration-300 shadow-xl group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-inner">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                0% 자금 예치 • 철저한 비수탁(Non-Custodial) 시스템
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed space-y-2">
                회원님의 투자금을 저희가 단 1원도 직접 받지 않습니다. 모든 원화와 코인은 회원님 본인 명의의 <strong>업비트 정식 계좌</strong>에만 안전하게 존재하며, <span className="text-emerald-300 font-bold">출금 권한을 배제한 조회/주문 전용 Open API</span>를 통해 안전하게 자산을 운용합니다.
              </p>
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>출금 권한 원천 차단으로 제3자 인출 사기 100% 원천 방지</span>
              </div>
            </div>

            {/* 2. 장세 맞춤형 시간대 스케줄러 & 멀티 슬롯 */}
            <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-white/[0.08] hover:border-indigo-500/50 transition-all duration-300 shadow-xl group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition" />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-inner">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                시간대별 맞춤 장세 모드 & 12개 멀티 슬롯 분할
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                한 종목에 몰빵하는 위험한 매매를 엄격히 금지합니다. <strong>최대 12개의 독립 멀티 슬롯</strong>으로 자금을 철저히 분산하며, <span className="text-indigo-300 font-bold">오전(09시 급등장), 오후(횡보 안정장), 야간(글로벌 변동장)</span>의 장세별 최적화 프리셋이 자동 전환됩니다.
              </p>
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-indigo-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>장세 흐름에 맞춰 오전/오후/야간 전략이 스스로 스위칭</span>
              </div>
            </div>

            {/* 3. 텔레그램 1:1 원클릭 승인 */}
            <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-white/[0.08] hover:border-cyan-500/50 transition-all duration-300 shadow-xl group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition" />
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-inner">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                스마트폰 텔레그램 1:1 실시간 승인 매매
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                AI가 유망한 매수 기회를 포착하면 대표님의 개인 스마트폰 텔레그램으로 즉시 알림이 발송됩니다. 회원이 직접 <strong>[✅ 즉시 승인]</strong> 버튼을 터치할 때만 주문이 체결되는 <strong>[안심 수동 승인 모드]</strong>를 완벽 지원합니다.
              </p>
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>자동 매매의 편리함과 사람이 직접 확인하는 안정성을 동시에 확보</span>
              </div>
            </div>

            {/* 4. 다단 트레일링 익절 & 기계적 칼손절 */}
            <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-white/[0.08] hover:border-amber-500/50 transition-all duration-300 shadow-xl group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-inner">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                다단 트레일링 익절 & 감정 없는 기계적 칼손절
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                상승 추세에서는 섣불리 매도하지 않고 고점을 끝까지 추적하여 수익을 극대화(Trailing Stop)합니다. 반대로 시장이 급변할 때는 주저함 없이 사전 설정된 손절 라인에서 기계적으로 탈출하여 <span className="text-amber-300 font-bold">소중한 원금을 철통같이 방어</span>합니다.
              </p>
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-amber-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>인간의 감정(탐욕·공포)을 완벽히 배제한 알고리즘 원칙 매매</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🌟 4. 신뢰 비교 매트릭스 (일반 대행 vs Any Life AI) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              왜 기존 방식과 근본부터 다를까요?
            </h2>
            <p className="text-sm text-slate-400">
              불투명한 유사투자자문이나 불법 리딩방과의 절대적 비교
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-3 bg-slate-950/80 p-4 border-b border-white/[0.08] text-xs sm:text-sm font-bold text-slate-400">
              <div>비교 항목</div>
              <div className="text-red-400/80">일반 리딩방 / 불법 대행</div>
              <div className="text-emerald-400 font-black">Any Life AI 스마트 퀀트</div>
            </div>

            <div className="divide-y divide-white/[0.04] text-xs sm:text-sm">
              <div className="grid grid-cols-3 p-4 items-center">
                <div className="font-bold text-slate-300">투자금 보관</div>
                <div className="text-slate-400">타인 통장/거래소에 입금 요구 (위험)</div>
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  본인 명의 업비트 지갑 (비예치)
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center bg-white/[0.01]">
                <div className="font-bold text-slate-300">출금 권한</div>
                <div className="text-slate-400">출금 제한 또는 가짜 사이트 사기</div>
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  출금 권한 원천 배제 (0% 불가능)
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center">
                <div className="font-bold text-slate-300">매매 최종 결정권</div>
                <div className="text-slate-400">운영자 독단 매매 / 사후 손실 통보</div>
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  스마트폰 텔레그램 본인 터치 승인
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center bg-white/[0.01]">
                <div className="font-bold text-slate-300">가동 환경</div>
                <div className="text-slate-400">개인 PC 24시간 켜두거나 오류 빈발</div>
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  클라우드 무중단 24시간 자동 감시
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center">
                <div className="font-bold text-slate-300">무료 체험 정책</div>
                <div className="text-slate-400">과도한 가입비 요구 및 자동 카드 결제</div>
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  3일 전 기능 무료 체험 (자동결제 X)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 5. 초간편 3단계 시작 가이드 (How it works) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#080C17]/60 border-t border-b border-white/[0.06] z-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              누구나 <span className="text-yellow-400">3단계</span>로 1분 만에 시작
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              복잡한 프로그램 설치 없이, 웹 브라우저에서 바로 연결됩니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="bg-slate-900/80 border border-white/[0.08] p-6 sm:p-7 rounded-3xl relative backdrop-blur-xl hover:border-yellow-400/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-yellow-500/20">
                01
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                카카오 1초 간편 로그인
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                번거로운 회원가입 절차 없이, 평소 사용하시는 카카오톡 계정으로 1초 만에 안전하게 입장하실 수 있습니다.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/80 border border-white/[0.08] p-6 sm:p-7 rounded-3xl relative backdrop-blur-xl hover:border-indigo-400/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                02
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                3일 무료 체험 신청
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                대시보드 상단의 [3일 무료 사용 신청] 버튼을 누르시면 카드 등록 없이 모든 프리미엄 기능이 즉시 개방됩니다.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/80 border border-white/[0.08] p-6 sm:p-7 rounded-3xl relative backdrop-blur-xl hover:border-emerald-400/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                03
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                업비트 API 연동 & 실시간 시작
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                업비트에서 발급받은 조회/주문 전용 API 키를 입력하고 스마트폰 텔레그램과 연동하면 24시간 자동 가동이 시작됩니다.
              </p>
            </div>

          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => onOpenKakaoLogin && onOpenKakaoLogin('login')}
              className="px-8 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.15] text-white font-bold text-sm transition inline-flex items-center gap-2 cursor-pointer"
            >
              <span>지금 바로 카카오톡으로 1분 만에 시작하기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* 🌟 6. 자주 묻는 질문 (FAQ Accordion) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 z-10">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center space-y-3 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              자주 묻는 질문
            </h2>
            <p className="text-sm text-slate-400">
              Any Life AI에 대해 궁금하신 점들을 명쾌하게 정리해 드립니다.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-white/[0.08] bg-slate-900/60 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-200 flex items-center gap-2.5">
                      <span className="text-emerald-400 font-mono text-sm">Q{idx + 1}.</span>
                      <span>{item.q}</span>
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 🌟 7. 하단 럭셔리 CTA 배너 */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative border-t border-white/[0.08] overflow-hidden text-center z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 via-slate-950 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto space-y-7 relative z-10">
          
          <div className="w-16 h-16 rounded-3xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 flex items-center justify-center mx-auto text-3xl shadow-xl shadow-yellow-500/10">
            💬
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            대표님의 일상에<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              진정한 시간의 자유
            </span>를 선물하세요
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            이제 번거로운 차트 감시는 Any Life AI에게 맡기시고,<br className="hidden sm:inline" />
            대표님께서는 사랑하는 사람들과 더 소중한 순간에 집중하세요.
          </p>

          <div className="pt-3 flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => onOpenKakaoLogin && onOpenKakaoLogin('login')}
              className="px-9 py-4.5 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-base sm:text-lg transition-all shadow-[0_0_30px_rgba(254,229,0,0.3)] hover:shadow-[0_0_40px_rgba(254,229,0,0.5)] inline-flex items-center justify-center gap-3 cursor-pointer transform hover:-translate-y-1 active:translate-y-0"
            >
              <span className="text-xl">💬</span>
              <span>카카오톡으로 무료 체험 시작하기</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
            <p className="text-xs text-slate-400">
              3일간 모든 기능 100% 무료 • 번거로운 카드 등록 없음
            </p>
          </div>

        </div>
      </section>

      {/* 🌟 8. 푸터 */}
      <footer className="border-t border-white/[0.06] bg-[#03050A] py-10 px-4 sm:px-6 text-center text-xs text-slate-500 space-y-3 relative z-10">
        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold">
          <span>Any Life AI</span>
          <span>•</span>
          <span>Smart Trading for Any Lifestyle</span>
          <span>•</span>
          <span className="font-mono text-emerald-400">v{APP_VERSION}</span>
        </div>
        <p className="text-[11px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
          [면책조항] 본 서비스는 암호화폐 투자 보조 소프트웨어 프로그램으로, 투자 일임이나 매매 권유 및 수익 보장을 제공하지 않습니다. 모든 매매 신호 및 최종 주문 집행에 따른 손익의 귀속과 책임은 이용자 본인에게 있습니다.
        </p>
        <p className="text-[10px] text-slate-600">
          © 2026 Any Life AI. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
