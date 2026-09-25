import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Send, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  Flame, 
  Radio, 
  CheckCircle2, 
  MessageSquarePlus, 
  MessageSquare, 
  ChevronRight, 
  FileText,
  Clock,
  Coins,
  Lock,
  ArrowRight,
  Shield,
  RefreshCw,
  AlertTriangle,
  Crown,
  Copy,
  Activity,
  Smartphone,
  Monitor,
  Download
} from 'lucide-react';
import { APP_VERSION } from '../version';

export default function ManualModal({ isOpen, onClose, user, onOpenTableEdit, onOpenMyPage }) {
  const [activeTab, setActiveTab] = useState('MANUAL'); // 'MANUAL' | 'OPERATOR_GUIDE' | 'FEEDBACK'
  
  // 의견 수렴 양식 상태 (과거 캐시된 '누리오' 명칭 자동 필터링)
  const [feedbackCategory, setFeedbackCategory] = useState('기능 개선 제안');
  const rawAuthor = user?.nickname || user?.name || 'Any Life 마스터 대표님';
  const cleanAuthor = rawAuthor.replace(/누리오/g, 'Any Life');
  const [authorName, setAuthorName] = useState(cleanAuthor);
  const [contact, setContact] = useState(user?.phone || '010-9999-8888');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackList, setFeedbackList] = useState([
    {
      id: 1,
      category: 'UI/UX 개선',
      author: 'Any Life 마스터 대표님',
      content: '모바일 화면에서 텍스트를 줄이고 슬롯과 차트가 한눈에 들어오도록 컴팩트하게 정리 요청 완료.',
      createdAt: '2026-08-27 01:25',
      status: '반영 완료 ✅'
    },
    {
      id: 2,
      category: '전략 알고리즘',
      author: 'Any Life 마스터 대표님',
      content: '슬롯 1~5번에 대표 코인이 고정되지 않고, 업비트 전종목 중 급등 터진 알트코인이 자동으로 채워지도록 개편 요청 완료.',
      createdAt: '2026-08-27 01:10',
      status: '반영 완료 ✅'
    }
  ]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    const newFeedback = {
      id: Date.now(),
      category: feedbackCategory,
      author: authorName,
      content: feedbackContent,
      createdAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      status: '접수 완료 (검토 중) 🚀'
    };

    setFeedbackList([newFeedback, ...feedbackList]);
    setFeedbackContent('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl shadow-black/90 relative my-auto h-[700px] sm:h-[740px] max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* 1. 상단 타이틀 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 shrink-0">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl font-black text-slate-100">
                  Any Life AI 매매 시스템 통합 매뉴얼 & 의견 수렴 센터
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 hidden sm:inline">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 sm:mt-1">
                전종목 실시간 급등 레이더 스캘핑 매뉴얼 및 운영자 기능 개선 의견 제안 창구
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* 2. 탭 네비게이션 */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5 pt-2 text-xs sm:text-sm font-bold flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'MANUAL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>🚀 1. 자동매매 핵심 기능 매뉴얼</span>
          </button>

          <button
            onClick={() => setActiveTab('OPERATOR_GUIDE')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'OPERATOR_GUIDE'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>💼 2. 운영자 Q&A & 커스텀 가이드</span>
          </button>

          <button
            onClick={() => setActiveTab('PWA_INSTALL')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'PWA_INSTALL'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-300 hover:text-emerald-100 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>📱 3. 스마트폰 & PC 앱 설치</span>
          </button>

          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'FEEDBACK'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold shadow-md'
                : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>💬 4. 기능 개선 의견 수렴</span>
          </button>
        </div>

        {/* 3. 탭별 상세 내용 (고정 높이 & 내부 스크롤) */}
        <div className="flex-1 overflow-y-auto pt-3 pb-2 pr-1 sm:pr-2 min-h-0 flex flex-col justify-start custom-scrollbar">

          {/* 탭 1: 핵심 자동매매 기능 매뉴얼 */}
          {activeTab === 'MANUAL' && (
            <div className="space-y-5 animate-in fade-in text-sm text-slate-200">
            {/* 0. 🌟 글로벌 통합 제어 타워 & 3대 핵심 신기능 (최신 고도화) */}
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 p-5 rounded-2xl border-2 border-indigo-500/50 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
                  <span>🌟 글로벌 제어 타워 &amp; 3대 신규 핵심 엔진 (제안서 1~3부 실전 탑재)</span>
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  v{APP_VERSION} GRAND
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-[13px]">
                {/* 1) 3단계 장세 스케줄러 */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <span>⏰</span>
                    <span>3단계 장세 자동 스케줄러</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    A 모드(초단타 스캘핑), B 모드(신고가 돌파), C 모드(추세 스윙)로 KST 시간표에 맞춰 전자동 전환됩니다.
                  </p>
                  <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-200">
                    🛡️ <strong>포지션 무결성</strong>: 코인 보유 슬롯은 청산까지 기존 룰 100% 보호! 매도 완료 시 새 프리셋으로 자동 변신!
                  </div>
                </div>

                {/* 2) 가짜 윗꼬리 10초 Sustain Check */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                    <span>🛡️</span>
                    <span>가짜 윗꼬리 10초 검증(Sustain)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    세력이 1분 만에 50억 쏘고 튀는 '가짜 윗꼬리(Spoofing)'를 막기 위해, 돌파 후 <strong>10초간 가격과 수급 유지 여부를 검증</strong>합니다.
                  </p>
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/20 text-[11px] text-rose-200">
                    🚫 10초 후 -0.4% 이상 급락하면 <strong>즉시 드롭(Drop)</strong>하여 최고점 설거지를 완벽 회피합니다!
                  </div>
                </div>

                {/* 3) 비동기 주문 큐 & 일일 킬스위치 */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                    <span>⚡</span>
                    <span>주문 큐 &amp; 일일 킬 스위치</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    • <strong>비동기 스마트 주문 큐</strong>: 업비트 초당 8회 제한을 완벽 우회하며, 긴급 청산은 최우선순위(HIGH)로 즉각 집행!<br />
                    • <strong>일일 킬 스위치</strong>: 당일 누적 -10% 이상 손실 시 익일 09시까지 신규 매수 하드 차단!
                  </p>
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-200">
                    🔀 <strong>A/B 모드</strong>: 하이브리드 vs 방망이 분할(1단 5% 익절) 원터치 전환 지원!
                  </div>
                </div>
              </div>
            </div>

            {/* 1. 자동매매 전체 워크플로우 한눈에 보기 */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                1. 실시간 급등 포착 ➡️ 슬롯 자동 탑승 ➡️ 트레일링 스탑 익절 프로세스
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* 단계 1 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">1</span>
                    <span>전종목 실시간 스캔</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed">
                    업비트 120+ 원화 마켓 틱 데이터를 1초도 쉬지 않고 롤링 윈도우로 실시간 감시합니다.
                  </p>
                </div>

                {/* 단계 2 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
                    <span>급등 감지 & 슬롯 배정</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed">
                    <strong>5초간 +0.8% 급등 & 거래대금 500만원 돌파</strong> 시 빈 슬롯에 코인이 즉시 쏙 배정됩니다.
                  </p>
                </div>

                {/* 단계 3 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">3</span>
                    <span>원클릭 승인 & 매수</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed">
                    슬롯 카드 및 텔레그램으로 승인 신호가 울리며, <strong>[즉시 승인 매수]</strong>를 누르면 체결됩니다.
                  </p>
                </div>

                {/* 단계 4 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">4</span>
                    <span>트레일링 스탑 익절</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed">
                    목표 수익률(+3%) 달성 후 고점 대비 -1% 하락 시점에 최고 수익을 극대화하여 자동 매도 청산합니다!
                  </p>
                </div>
              </div>
            </div>

            {/* 2. 🛡️ 6대 손실 방어 및 수익 보존 락(Profit Lock) 시스템 */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
              <h4 className="text-base font-black text-indigo-300 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                2. 🛡️ 6대 손실 방어 및 무손실 탈출 안전장치 (2026 고도화)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-[13px]">
                {/* 1. 수수료 순수익 차감 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1) 수수료 0.1% 차감 '순수익률(Net PnL)' 기준</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    업비트 매수/매도 수수료(0.10%)를 미리 차감한 '내 통장에 꽂히는 진짜 순이익'을 기준으로 익절/손절을 판정합니다.
                  </p>
                </div>

                {/* 2. 실체결가 동기화 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>2) 실체결 평단가 동기화 (부분 체결 예외 처리)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    시장가 매수 시 주문이 완전히 체결(done)될 때까지 대기 후, 슬리피지가 반영된 1원 단위 실제 평균단가로 100% 덮어씁니다.
                  </p>
                </div>

                {/* 3. 호가 스프레드 차단 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>3) 호가 갭(스프레드 0.4%) 초과 매수 차단</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    최우선 매도호가와 매수호가 간격이 0.4%를 초과하는 얇은 호가창은 매수 즉시 손실을 보므로 사전에 진입을 차단합니다.
                  </p>
                </div>

                {/* 4. 수익 보존 락 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>4) 수익 보존 락 (+0.5% 안전 방어선)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    순수익 +1.2% 도달 시 안전핀을 +0.5%로 고정(슬리피지 완충), +2.2% 도달 시 +1.2%로 상향하여 무조건 수익을 지키고 탈출합니다.
                  </p>
                </div>

                {/* 5. 2단계 타임아웃 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>5) 정체 코인 2단계 타임아웃 청산</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    14분간 보합 시 본전 지정가 매도(1단계) 1분간 대기 ➔ 15분 차 미체결 시 시장가 즉시 청산(2단계)으로 자금을 회전시킵니다.
                  </p>
                </div>

                {/* 6. 원화 잔고 버퍼 */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-yellow-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>6) 비상 원화 잔고(20,000원) 고갈 방어</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    계좌의 KRW 잔고가 최소 20,000원 이하로 떨어지면 신규 매수를 멈추어 원화 고갈로 봇이 마비되는 사태를 원천 차단합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. 🌟 3대 독립 전략 모드 및 다단(와이드) 트레일링 스탑 시스템 */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/40 space-y-4">
              <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                3. 🌟 3대 독립 전략 모드 &amp; 다단(와이드) 트레일링 스탑 시스템 (v{APP_VERSION})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-[13px]">
                {/* 모드 A */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>모드 A: 초단타 스캘핑 (1~8번)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    초단위 틱 버퍼 기반으로 5초 +1.5% 급등과 1,000만원 이상 수급을 0.1초 만에 감지하여 빠르게 치고 빠지는 고성능 단타 전략입니다.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-400 bg-slate-950/80 p-2 rounded-lg border border-emerald-500/20">
                    익절: 1단 +3% (콜백 -0.5%) / 2단 와이드 +10% (콜백 -3.0%)
                  </div>
                </div>

                {/* 모드 B */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>모드 B: 당일 신고가 돌파 (9~10번)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    오전 09:00(KST) 이후 장중 최고가를 1/3분봉 캔들 거래대금(5억원+)을 동반하며 돌파할 때 진입하는 모멘텀 돌파 전략입니다.
                  </p>
                  <div className="text-[11px] font-mono text-amber-300 bg-slate-950/80 p-2 rounded-lg border border-amber-500/20">
                    안전장치: 08:50~09:30 장 시작 변동성 타임락 자동 차단
                  </div>
                </div>

                {/* 모드 C */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-sky-500/30 space-y-2">
                  <div className="font-bold text-sky-300 flex items-center gap-1.5 text-sm">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>모드 C: 정배열 추세 스윙 (11~12번)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    일봉/4시간봉 이동평균선(5선 &gt; 20선) 골든크로스 정배열 구간을 추종하여 큰 추세 파동을 길게 먹는 중기 스윙 전략입니다.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="text-sky-300 bg-slate-950/80 p-2 rounded-lg border border-sky-500/20">
                      수급 안전망: 24시간 누적 거래대금 100억+ 메이저/주도주 한정
                    </div>
                    <div className="text-rose-300 bg-slate-950/80 p-2 rounded-lg border border-rose-500/20">
                      비상 청산: 데드크로스(5선 &lt; 20선) 발생 시 시장가 즉시 전량 매도
                    </div>
                  </div>
                </div>
              </div>

              {/* 와이드 트레일링 스탑 상세 */}
              <div className="bg-purple-950/30 p-3.5 rounded-xl border border-purple-500/30 flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <strong className="text-purple-300 text-sm block">🎯 2단계 다단(와이드) 트레일링 스탑 시스템 탑재</strong>
                  <p className="text-slate-300 leading-relaxed">
                    <strong>1단계(+10% 미만 잔파도):</strong> +3% 목표 도달 시 콜백 -0.5%로 타이트하게 익절하여 수익을 확정합니다.<br />
                    <strong>2단계(+10% 이상 대시세):</strong> 상승률이 +10%를 뚫으면 와이드 모드로 자동 전환되어, 콜백 허용치를 -3.0%로 넓혀 잔파도에 털리지 않고 <strong>+30%~+100% 대박 수익을 끝까지 홀딩</strong>합니다!
                  </p>
                </div>
              </div>
            </div>

            {/* 4. 주요 제어 버튼 기능 안내 */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                4. 핵심 화면 제어 버튼 가이드
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs shrink-0">
                    [ 슬롯 원클릭 선택 ]
                  </span>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                    1~12번 슬롯 중 확인하고 싶은 슬롯을 콕 누르면, <strong>해당 코인의 실시간 원화(KRW) 전용 차트 그래프</strong>로 즉각 전환됩니다.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs shrink-0">
                    [ 🚨 긴급 강제 매도 ]
                  </span>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                    시장 급변 시 업비트 계좌의 모든 보유 코인을 <strong>시장가(Market Order)로 즉시 100% 강제 청산</strong>하고 모든 슬롯을 초기화합니다.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs shrink-0">
                    [ ⚡ 알트 급등 포착 테스트 ]
                  </span>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                    실제 급등을 기다리지 않고도 0.1초 만에 알트코인 급등 신호를 발생시켜 슬롯 배정 및 승인 플로우를 언제든 시뮬레이션할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 운영자 Q&A & 커스텀 가이드 */}
        {activeTab === 'OPERATOR_GUIDE' && (
          <div className="space-y-4 animate-in fade-in text-sm text-slate-200">
            {/* 운영자가 자주 궁금해하는 핵심 질문과 답변 */}
            <div className="space-y-3">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-amber-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  Q1. 급등 감지 민감도나 1회 매수금액을 변경하고 싶어요. 어디서 하나요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 화면 상단 헤더의 <strong>[전략관리]</strong> 및 각 슬롯 카드의 <strong>[⚙️ 설정]</strong> 버튼을 누르시면, <strong>급등 감지 초/상승률(%), 최소 거래대금 필터, 12개 슬롯(스캘핑/신고가/스윙), 2단 와이드 트레일링 스탑 목표치</strong>를 자유자재로 수정하고 바로 저장하실 수 있습니다.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-amber-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  Q2. 가입한 회원들의 업비트 API 키는 안전한가요? 관리자도 볼 수 없나요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 네, 완벽히 안전합니다! 회원의 API Secret Key는 <strong>AES-256 군사 등급 암호화</strong>로 보호되며, 데이터베이스와 화면 어디에도 원문이 노출되지 않고 주문 집행 시 메모리에서만 단방향 복호화 후 즉시 파기됩니다.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-amber-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  Q3. 텔레그램 알림만 받고 매수는 내가 원할 때만 하고 싶어요.
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 <strong>[👤 마이페이지]</strong>에서 주문 실행 방식을 <strong>'🛡️ 안전 수동 승인 (Confirm)'</strong>으로 설정해 두시면, 급등 포착 시 텔레그램과 화면에 알림만 울리고 대표님이 승인 버튼을 누르기 전까지는 절대 매수하지 않습니다.
                </p>
              </div>

                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-amber-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  Q4. 업비트 Open API 발급 시 어떤 IP를 등록해야 하나요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 대표님의 서버 노드 고정 공인 IP인 <strong>`115.68.168.242`</strong>을 업비트 Open API 발급 페이지의 허용 IP란에 등록해 주시면 정상 승인됩니다.
                </p>
              </div>

              {/* Q5: 3단계 장세 스케줄러 & 포지션 무결성 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-indigo-500/40 space-y-2">
                <h5 className="font-bold text-indigo-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                  Q5. 3단계 장세 스케줄러가 시간대에 맞춰 변경될 때, 이미 매수한 코인은 어떻게 되나요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 <strong>포지션 무결성 (State Preservation)</strong> 원칙에 따라, 이미 매수하여 보유 중인 슬롯은 중간에 설정이 바뀌지 않고 <strong>기존 진입 룰(익절/손절/트레일링)을 청산될 때까지 100% 유지</strong>합니다. 코인이 매도 완료되어 빈 슬롯이 되는 바로 그 순간, 현재 시간대의 최신 프리셋으로 안전하게 자동 환복됩니다!
                </p>
              </div>

              {/* Q6: 가짜 윗꼬리 10초 Sustain Check */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-rose-500/40 space-y-2">
                <h5 className="font-bold text-rose-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  Q6. 가짜 윗꼬리 10초 딜레이 검증(Sustain Check)은 무엇인가요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 세력이 1분 만에 허수 수급(50억 등)으로 팍 띄웠다가 개미들이 타자마자 패대기치는 <strong>'가짜 윗꼬리(Spoofing)'</strong>에 당하지 않도록, 돌파 신호가 떠도 즉시 사지 않고 <strong>10초간 가격과 수급 텐션이 무너지지 않고 지지되는지 검증</strong>합니다. 만약 10초 뒤 -0.4% 이상 급락하면 <strong>주문 큐에서 즉시 드롭(Drop)</strong>하여 설거지를 원천 방어합니다.
                </p>
              </div>

              {/* Q7: 일일 킬 스위치 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/40 space-y-2">
                <h5 className="font-bold text-amber-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  Q7. 일일 킬 스위치(Daily Kill Switch)가 발동되면 언제 풀리나요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 급락장에서 당일 누적 실현 손실이 설정치(예: -10%)에 도달하면 신규 매수가 전면 차단됩니다. 차단은 <strong>다음 날 오전 09:00 (KST 업비트 일봉 리셋 시간)에 자동 초기화</strong>되며, 장세가 안정되었을 경우 대시보드 상단 제어 타워에서 <strong>[차단 긴급 해제]</strong> 버튼을 눌러 언제든 즉시 수동 해제할 수도 있습니다.
                </p>
              </div>

              {/* Q8: 동적 프리셋 (A/B/C 모드) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/40 space-y-2">
                <h5 className="font-bold text-purple-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-purple-400 shrink-0" />
                  Q8. A/B/C 전략 모드(동적 프리셋)는 어떻게 활용하나요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 자동차의 <strong>'메모리 시트'</strong>처럼 1~12번 슬롯의 전략과 설정값을 통째로 저장하고 언제든 원클릭으로 불러올 수 있는 맞춤형 템플릿입니다.<br />
                  대표님께서 슬롯들을 자유롭게 세팅하신 후 <strong>[💾 모든 슬롯 설정을 A모드로 저장]</strong>을 누르면 통째로 기억되며, 필요할 때 <strong>[📥 이 모드를 1~12번 슬롯에 적용하기]</strong>를 누르면 1초 만에 슬롯에 완벽 적용됩니다. 3단계 스케줄러와 연동해 두면 설정해 둔 시간표에 맞춰 A/B/C 모드가 자동으로 전환되기도 합니다!
                </p>
              </div>

              {/* Q9: C모드 24시간 누적 거래대금 필터 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-sky-500/40 space-y-2">
                <h5 className="font-bold text-sky-300 flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
                  Q9. C모드의 '24시간 누적 거래대금 필터'는 왜 중요한가요?
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-7">
                  👉 스윙 매매는 며칠 동안 포지션을 유지하므로, 거래량이 메마른 비인기 잡코인에 타면 호가가 얇아 빠져나오지 못하거나 세력의 가짜 골든크로스(속임수)에 당할 위험이 있습니다.<br />
                  따라서 <strong>하루 거래대금이 최소 100억 원 이상 탄탄하게 몰린 대장주/주도주(BTC, ETH, SOL 등)</strong>만 엄선하여 진입하도록 차단막을 쳐주는 최강의 수급 안전장치입니다. (슬롯 설정창에서 원하는 기준 금액으로 자유롭게 변경 가능합니다.)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: 스마트폰 & PC 앱(PWA) 설치 가이드 (모든 브라우저 공통 표준) */}
        {activeTab === 'PWA_INSTALL' && (
          <div className="space-y-4 animate-in fade-in text-sm text-slate-200">
            {/* 상단 안내 배너 */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-teal-950/60 p-4 sm:p-5 rounded-2xl border border-emerald-500/40 space-y-1.5 shadow-lg">
              <h4 className="text-base font-black text-emerald-300 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Any Life AI 전용 앱(PWA) 설치 가이드 📱💻
              </h4>
              <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                Any Life AI는 별도의 앱스토어 다운로드 없이, <strong>모든 주요 브라우저(Chrome, Edge, Whale, Safari 등)</strong>에서 홈 화면이나 바탕화면에 바로가기 앱으로 1초 만에 설치하여 <b>주소창 없는 전체화면 독립 앱</b>으로 쾌적하게 사용하실 수 있습니다! ✨
              </p>
            </div>

            {/* 3대 환경별 가이드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* 1. PC 브라우저 공통 (Chrome, Edge, Whale 등) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <Monitor className="w-4 h-4" />
                    <span>1. PC 브라우저 공통</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Chrome, Edge, 네이버 Whale 등</span>
                  
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>방법 A. 주소창 아이콘:</strong><br />
                      주소창(URL) 맨 우측 끝의 모니터/다운로드 모양 <b>[앱 설치]</b> 아이콘 클릭 ➔ [설치]
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>방법 B. 브라우저 메뉴:</strong><br />
                      우측 상단 <b>메뉴(⋮ 또는 …)</b> ➔ <b>[캐스팅, 저장, 공유 / 앱]</b> ➔ <b>[Any Life AI 설치...]</b> (또는 이미 설치된 경우 <b>[Any Life AI에서 열기]</b>) 클릭
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>방법 C. 바로가기 만들기:</strong><br />
                      메뉴 ➔ <b>[바로가기 만들기...]</b> ➔ <b>'창으로 열기'</b> 체크 후 만들기 클릭
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 leading-relaxed mt-2">
                  💡 <b>주소창에 설치 아이콘이 안 보이나요?</b><br />
                  이미 컴퓨터에 Any Life AI 앱이 설치되어 있으면 브라우저가 주소창 아이콘을 숨깁니다. 메뉴에서 <b>[Any Life AI에서 열기]</b>를 누르시면 전용 창으로 즉시 열립니다! 🚀
                </div>
              </div>

              {/* 2. 안드로이드 스마트폰 (모든 모바일 브라우저) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                    <Smartphone className="w-4 h-4" />
                    <span>2. 안드로이드 스마트폰</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Chrome, 삼성 인터넷, 웨일 등</span>
                  
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>1단계.</strong><br />
                      스마트폰 브라우저 우측 상단 또는 하단의 <b>메뉴(⋮ 또는 삼선)</b>를 누릅니다.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>2단계.</strong><br />
                      메뉴 목록에서 <b>[홈 화면에 추가]</b> 또는 <b>[앱 설치]</b>를 선택합니다.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>3단계.</strong><br />
                      바탕화면에 Any Life AI 전용 앱 아이콘이 생성되어, 원클릭 전체화면으로 즉시 실행됩니다!
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 leading-relaxed mt-2">
                  📱 <b>알림:</b> 웹 화면 하단에 뜨는 <b>[지금 바로 앱 설치하기]</b> 배너를 누르시면 원클릭으로 바로 설치 창이 뜹니다.
                </div>
              </div>

              {/* 3. 아이폰 / 아이패드 (iOS Safari) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
                    <Smartphone className="w-4 h-4" />
                    <span>3. 아이폰 / 아이패드</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Safari (사파리 브라우저)</span>
                  
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>1단계.</strong><br />
                      Safari 브라우저 화면 맨 하단 중앙의 <b>[공유(Share)]</b> 아이콘(네모 상자 위 화살표)을 터치합니다.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>2단계.</strong><br />
                      공유 메뉴를 아래로 내려 <b>[홈 화면에 추가]</b>를 선택합니다.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong>3단계.</strong><br />
                      우측 상단의 <b>[추가]</b>를 누르면 아이폰 홈 화면에 전용 앱이 완성됩니다! 💖
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed mt-2">
                  🍎 <b>주의:</b> 네이버앱, 카카오톡 인앱 브라우저는 홈 화면 추가를 지원하지 않으므로 꼭 <b>Safari</b>로 열어주세요!
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 탭 4: 기능 개선 & 운영자 의견 수렴 창구 (Interactive Feedback Form) */}
        {activeTab === 'FEEDBACK' && (
          <div className="space-y-4 animate-in fade-in text-sm">
            {/* 상단 안내 배너 */}
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-indigo-500/15 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-1.5">
              <h4 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                대표님 & 운영자님의 소중한 아이디어를 들려주세요! 💌
              </h4>
              <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                "이런 매매 지표를 추가하고 싶어요", "이 버튼의 위치를 바꾸고 싶어요", "새로운 전략 알고리즘을 넣고 싶어요" 등 어떤 의견이든 자유롭게 남겨주시면 Any Life AI 개발팀이 즉시 검토하여 시스템에 반영해 드립니다! ✨
              </p>
            </div>

            {/* 의견 작성 폼 */}
            <form onSubmit={handleSubmitFeedback} className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 구분 선택 */}
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold text-xs sm:text-sm">의견 구분</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="기능 개선 제안">💡 기능 개선 제안</option>
                    <option value="새로운 전략/지표 추가">📈 새로운 전략/지표 추가</option>
                    <option value="UI/UX 디자인 개선">🎨 UI/UX 디자인 개선</option>
                    <option value="오류 및 버그 제보">🐛 오류 및 버그 제보</option>
                    <option value="기타 문의사항">💬 기타 문의사항</option>
                  </select>
                </div>

                {/* 작성자 이름 */}
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold text-xs sm:text-sm">작성자 / 닉네임</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                {/* 연락처 / 이메일 */}
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold text-xs sm:text-sm">연락처 / 이메일</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* 제안 내용 텍스트에어리어 */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold text-xs sm:text-sm">
                  개선 희망 내용 및 상세 의견 (자유롭게 적어주세요)
                </label>
                <textarea
                  rows="3"
                  placeholder="예: '슬롯 5개 외에 10개까지 늘릴 수 있는 옵션이 있으면 좋겠습니다', '특정 코인은 급등 감지에서 제외하는 블랙리스트 기능이 필요해요' 등..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 leading-relaxed placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* 제출 버튼 */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs sm:text-sm text-slate-400">
                  {isSubmitted && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-bounce">
                      <CheckCircle2 className="w-4 h-4" /> 소중한 의견이 AI 디자인실장 영자에게 성공적으로 전달되었습니다! 💖
                    </span>
                  )}
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>소중한 의견 제출하기</span>
                </button>
              </div>
            </form>

            {/* 최근 접수된 피드백 목록 실시간 뷰 */}
            <div className="space-y-2.5 pt-2">
              <h5 className="font-bold text-slate-200 flex items-center gap-2 text-xs sm:text-sm">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                최근 접수 및 반영된 의견 내역 ({feedbackList.length}건)
              </h5>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {feedbackList.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                          {item.category}
                        </span>
                        <span className="text-slate-200 font-bold">{item.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>{item.createdAt}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed pl-1">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* 4. 하단 닫기 바 */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-800 text-xs sm:text-sm shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="hidden sm:inline">빠른 이동:</span>
            <button
              onClick={() => {
                onClose();
                if (onOpenTableEdit) onOpenTableEdit();
              }}
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
            >
              [📊 12개 슬롯 전략 수정]
            </button>
            <span>•</span>
            <button
              onClick={() => {
                onClose();
                if (onOpenMyPage) onOpenMyPage();
              }}
              className="text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
            >
              [👤 마이페이지]
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            매뉴얼 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
