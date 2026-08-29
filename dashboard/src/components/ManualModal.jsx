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
  ArrowRight
} from 'lucide-react';

export default function ManualModal({ isOpen, onClose, user, onOpenSettings, onOpenMyPage }) {
  const [activeTab, setActiveTab] = useState('MANUAL'); // 'MANUAL' | 'OPERATOR_GUIDE' | 'FEEDBACK'
  
  // 의견 수렴 양식 상태
  const [feedbackCategory, setFeedbackCategory] = useState('기능 개선 제안');
  const [authorName, setAuthorName] = useState(user?.nickname || '누리오 마스터 대표님');
  const [contact, setContact] = useState(user?.phone || '010-9999-8888');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackList, setFeedbackList] = useState([
    {
      id: 1,
      category: 'UI/UX 개선',
      author: '누리오 마스터 대표님',
      content: '모바일 화면에서 텍스트를 줄이고 슬롯과 차트가 한눈에 들어오도록 컴팩트하게 정리 요청 완료.',
      createdAt: '2026-08-27 01:25',
      status: '반영 완료 ✅'
    },
    {
      id: 2,
      category: '전략 알고리즘',
      author: '누리오 마스터 대표님',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl shadow-black/90 relative space-y-6 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* 1. 상단 타이틀 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-100">
                  누리오 트레이더 (NURIOH TRADER) 통합 매뉴얼 & 의견 수렴 센터
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 hidden sm:inline">
                  v2.5 정식판
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                전종목 실시간 급등 레이더 스캘핑 매뉴얼 및 운영자 기능 개선 의견 제안 창구
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. 탭 네비게이션 */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5 text-sm font-bold flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
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
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'OPERATOR_GUIDE'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>💼 2. 운영자 Q&A & 커스텀 가이드</span>
          </button>

          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'FEEDBACK'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold shadow-md'
                : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>💬 3. 기능 개선 & 의견 수렴 창구</span>
          </button>
        </div>

        {/* 3. 탭별 상세 내용 */}

        {/* 탭 1: 핵심 자동매매 기능 매뉴얼 */}
        {activeTab === 'MANUAL' && (
          <div className="space-y-5 animate-in fade-in text-sm text-slate-200">
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

            {/* 2. 주요 제어 버튼 기능 안내 */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                2. 핵심 화면 제어 버튼 가이드
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs shrink-0">
                    [ 슬롯 원클릭 선택 ]
                  </span>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                    1~5번 슬롯 중 확인하고 싶은 슬롯을 콕 누르면, <strong>해당 코인의 실시간 원화(KRW) 전용 차트 그래프</strong>로 즉각 전환됩니다.
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
                  👉 화면 상단 헤더의 <strong>[⚙️ 설정]</strong> 버튼을 누르시면, <strong>급등 감지 초/상승률(%), 최소 거래대금 필터, 슬롯 개수(1~5개), 트레일링 스탑 목표치</strong>를 자유자재로 수정하고 바로 저장하실 수 있습니다.
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
                  👉 대표님의 서버 노드 고정 공인 IP인 <strong>`49.171.41.10`</strong>을 업비트 Open API 발급 페이지의 허용 IP란에 등록해 주시면 정상 승인됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: 기능 개선 & 운영자 의견 수렴 창구 (Interactive Feedback Form) */}
        {activeTab === 'FEEDBACK' && (
          <div className="space-y-4 animate-in fade-in text-sm">
            {/* 상단 안내 배너 */}
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-indigo-500/15 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-1.5">
              <h4 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                대표님 & 운영자님의 소중한 아이디어를 들려주세요! 💌
              </h4>
              <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                "이런 매매 지표를 추가하고 싶어요", "이 버튼의 위치를 바꾸고 싶어요", "새로운 전략 알고리즘을 넣고 싶어요" 등 어떤 의견이든 자유롭게 남겨주시면 누리오 트레이더 개발팀이 즉시 검토하여 시스템에 반영해 드립니다! ✨
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
                      <CheckCircle2 className="w-4 h-4" /> 소중한 의견이 영자에게 성공적으로 전달되었습니다! 💖
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

        {/* 4. 하단 닫기 바 */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span>빠른 이동:</span>
            <button
              onClick={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
            >
              [⚙️ 매매 조건 설정]
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
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            매뉴얼 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
