import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  Send,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check
} from 'lucide-react';

export default function KakaoAuthModal({ isOpen, onClose, onLoginSuccess }) {
  // 1: 동의 및 인증 단계, 2: 카카오 가져온 정보 확인 & 닉네임/텔레그램 입력 단계
  const [step, setStep] = useState(1);

  // 약관 동의 상태
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRisk, setAgreedRisk] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(true);

  // 카카오에서 연동된 회원 정보
  const [kakaoUserData, setKakaoUserData] = useState({
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'trader.hong@kakao.com',
    birthyear: '1990'
  });

  // 사용자가 2단계에서 설정할 닉네임 및 선택 텔레그램 ID
  const [nickname, setNickname] = useState('스마트트레이더_길동');
  const [telegramId, setTelegramId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const userAge = currentYear - parseInt(kakaoUserData.birthyear || '1990');

  // 1단계 -> 2단계 이동 (카카오 인증 시뮬레이션 및 동의 확인)
  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    if (!agreedPrivacy || !agreedTerms || !agreedRisk) {
      setError('모든 필수 약관 및 개인정보 수집 목적에 동의해 주세요.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(2);
    }, 500);
  };

  // 2단계 -> 가입 완료
  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('사이트 내에서 사용할 활동 닉네임을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const kakaoId = `kakao_${Date.now()}`;
      const payload = {
        kakaoId,
        name: kakaoUserData.name,
        nickname: nickname.trim(),
        phone: kakaoUserData.phone,
        email: kakaoUserData.email,
        birthyear: kakaoUserData.birthyear,
        telegramId: telegramId.trim() || null,
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
      };

      if (onLoginSuccess) {
        await onLoginSuccess(payload);
      }
      onClose();
      setStep(1);
    } catch (err) {
      setError(err.message || '가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden max-h-[94vh] flex flex-col">
        {/* 상단 닫기 */}
        <button
          onClick={() => {
            setStep(1);
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 헤더 & 스텝 인디케이터 */}
        <div className="text-center pb-4 border-b border-slate-800 shrink-0">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-lg shadow-yellow-500/20 text-[#191919] font-extrabold text-3xl mb-2.5">
            💬
          </div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
            카카오 인증 기반 신규 회원 가입
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold">
              7일 무료체험
            </span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            안전한 자동매매 운영을 위해 카카오 본인확인 정보를 연동합니다.
          </p>
          
          {/* 2단계 진행 인디케이터 바 */}
          <div className="flex items-center justify-center gap-3 pt-3.5">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              step === 1 ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20 scale-105' : 'bg-slate-800 text-slate-400'
            }`}>
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">1</span>
              <span>약관 & 활용동의</span>
            </div>
            <span className="text-slate-500 font-bold">→</span>
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              step === 2 ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20 scale-105' : 'bg-slate-800 text-slate-400'
            }`}>
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">2</span>
              <span>정보확인 & 닉네임</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: 카톡인증을 통한 개인정보 활용 동의 요청 및 이유 안내 */}
        {/* ========================================================= */}
        {step === 1 && (
          <form onSubmit={handleProceedToStep2} className="py-4 space-y-4 overflow-y-auto pr-1 flex-1 text-sm text-slate-300">
            {/* 💡 [왜 이 정보를 요청하나요?] 안내 박스 (폰트 확대 +2pt) */}
            <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 overflow-hidden shadow-lg">
              <button
                type="button"
                onClick={() => setIsWhyOpen(!isWhyOpen)}
                className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-indigo-300 hover:text-indigo-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="text-sm font-bold">💡 개인정보(실명/연락처/출생연도) 수집 목적 안내</span>
                </div>
                {isWhyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isWhyOpen && (
                <div className="px-4 pb-4 pt-1 space-y-2.5 text-xs sm:text-[13px] text-slate-200 border-t border-indigo-500/20 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-amber-400 shrink-0">1. 실명 확인:</span>
                    <span>비수탁형 매매 특성상 업비트 실명 계좌와의 예금주 일치 확인 및 1:1 VIP 케어를 위해 수집합니다.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-amber-400 shrink-0">2. 비상 알림 (휴대폰):</span>
                    <span>급격한 시세 변동, 텔레그램 연동 단절 등 비상 시 긴급 알림톡/문자 발송에만 사용됩니다 (스팸 일체 없음).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-amber-400 shrink-0">3. 만 19세 성인 인증:</span>
                    <span>암호화폐 투자자 보호 법령을 준수하여 미성년자의 가입을 사전에 방지합니다.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-amber-400 shrink-0">4. 1인 1계정 보장:</span>
                    <span>무분별한 다계정 무료체험 악용을 차단하여 정직한 회원분들께 최상의 서버 환경을 제공합니다.</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3대 필수 약관 동의 체크박스 (폰트 확대 +2pt) */}
            <div className="p-4 sm:p-5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3.5">
              <div className="text-xs font-bold text-slate-400 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                <span>필수 약관 동의</span>
                <span className="text-rose-400 text-xs font-semibold">* 모두 동의 필요</span>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPrivacy}
                  onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-800 border-slate-700 text-yellow-500 focus:ring-yellow-400 shrink-0"
                />
                <span className="text-slate-200 leading-normal text-xs sm:text-[13px]">
                  <strong className="text-white font-bold block text-sm mb-0.5">[필수] 개인정보 수집 및 비상 연락망 이용 동의</strong>
                  <span className="text-slate-400 block text-xs">
                    카카오 인증을 통한 실명, 전화번호, 이메일, 출생연도 수집 및 비상 연락망 이용에 동의합니다.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2.5 border-t border-slate-800/80">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-800 border-slate-700 text-yellow-500 focus:ring-yellow-400 shrink-0"
                />
                <span className="text-slate-200 leading-normal text-xs sm:text-[13px]">
                  <strong className="text-white font-bold block text-sm mb-0.5">[필수] 비수탁형 자동매매 소프트웨어 이용약관 동의</strong>
                  <span className="text-slate-400 block text-xs">
                    본 프로그램은 자금을 예치받지 않으며, 회원의 개인 API 키를 이용하는 보조 소프트웨어 툴입니다.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2.5 border-t border-slate-800/80">
                <input
                  type="checkbox"
                  checked={agreedRisk}
                  onChange={(e) => setAgreedRisk(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-800 border-slate-700 text-yellow-500 focus:ring-yellow-400 shrink-0"
                />
                <span className="text-slate-200 leading-normal text-xs sm:text-[13px]">
                  <strong className="text-white font-bold block text-sm mb-0.5">[필수] 암호화폐 투자 유의사항 및 자기책임 동의</strong>
                  <span className="text-slate-400 block text-xs">
                    가상자산 시장은 변동성이 크며, 모든 매매 집행의 최종 결정 및 손익 책임은 회원 본인에게 있습니다.
                  </span>
                </span>
              </label>
            </div>

            {/* 1단계 동의 및 다음 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-base transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>💬</span>
                <span>{isSubmitting ? '카카오 본인인증 확인 중...' : '동의하고 카카오 인증 정보 가져오기 (다음)'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 2: 카톡에서 가져온 정보 확인 & 닉네임 + 텔레그램(선택) 입력 */}
        {/* ========================================================= */}
        {step === 2 && (
          <form onSubmit={handleCompleteSignup} className="py-4 space-y-4 overflow-y-auto pr-1 flex-1 text-sm text-slate-300">
            {/* 1. 카카오에서 연동된 정보 확인 카드 (폰트 확대 +2pt) */}
            <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-emerald-500/40 space-y-3 shadow-lg">
              <div className="flex justify-between items-center text-slate-200 font-bold border-b border-slate-800 pb-2.5">
                <span className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  카카오 본인인증 연동 완료
                </span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold">
                  VERIFIED ✅
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-[13px] pt-1">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-xs mb-0.5">인증 실명</span>
                  <span className="font-bold text-slate-100 text-sm">{kakaoUserData.name}</span>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-xs mb-0.5">인증 휴대폰</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{kakaoUserData.phone}</span>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-xs mb-0.5">카카오 이메일</span>
                  <span className="font-mono text-slate-200 truncate block text-xs sm:text-[13px]">{kakaoUserData.email}</span>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-xs mb-0.5">출생연도 / 성인여부</span>
                  <span className="font-bold text-emerald-400 text-xs sm:text-[13px]">{kakaoUserData.birthyear}년 (만 {userAge}세 성인 ✅)</span>
                </div>
              </div>
            </div>

            {/* 2. 사이트 내 활동용 닉네임 입력 (필수) */}
            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-100 font-bold block text-sm">
                사이트 내 활동용 닉네임 <span className="text-yellow-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 누리오_수익왕"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-yellow-400"
                />
              </div>
              <p className="text-xs text-slate-400">대시보드와 수익률 랭킹에서 표시될 대표 이름입니다.</p>
            </div>

            {/* 3. 텔레그램 알림 서비스 항목 (선택 사항) */}
            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-100 font-bold flex items-center gap-2 text-sm">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>[선택] 개인 텔레그램 알림 ID 연동</span>
                </label>
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full font-semibold">
                  선택 사항
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="예: @username 또는 텔레그램 Chat ID"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                💡 입력해 두시면 매매 신호 포착 시 스마트폰 텔레그램(<code>@nurioh_trade_bot</code>)으로 <strong>[즉시 승인/취소]</strong> 버튼이 전송됩니다. (가입 후 설정에서도 등록 가능)
              </p>
            </div>

            {/* 이전 및 가입완료 버튼 */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-base transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>{isSubmitting ? '가입 완료 처리 중...' : '가입 완료하고 7일 무료체험 시작! 🎉'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
