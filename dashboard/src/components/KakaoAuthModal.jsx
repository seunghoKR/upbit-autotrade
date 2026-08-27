import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Gift
} from 'lucide-react';

const KAKAO_JAVASCRIPT_KEY = '7fcb09e57eb4033e66e3edebf52c2c72';

export default function KakaoAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isDirectInputMode, setIsDirectInputMode] = useState(false);
  const [directEmail, setDirectEmail] = useState('');
  const [directName, setDirectName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsDirectInputMode(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
      } catch (err) {
        console.warn('Kakao init warning:', err);
      }
    }
  }, []);

  if (!isOpen) return null;

  const executeAuthSuccess = async (realData, defaultNickname) => {
    setIsSubmitting(true);
    try {
      const payload = {
        kakaoId: realData.kakaoId || `kakao_${Date.now()}`,
        name: realData.name || defaultNickname || '누리오 회원',
        nickname: defaultNickname || realData.name || '누리오 회원',
        phone: realData.phone || '010-0000-0000',
        email: realData.email || '',
        birthyear: realData.birthyear || '1990',
        profileImage: realData.profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
      };

      if (onLoginSuccess) {
        await onLoginSuccess(payload, rememberMe);
      }
      onClose();
    } catch (err) {
      setError(err.message || '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoSdkLogin = () => {
    setError('');
    setIsSubmitting(true);

    if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Auth) {
      try {
        window.Kakao.Auth.login({
          success: function(authObj) {
            window.Kakao.API.request({
              url: '/v2/user/me',
              success: function(res) {
                const kakaoAccount = res.kakao_account || {};
                const profile = kakaoAccount.profile || {};
                
                const realData = {
                  kakaoId: `kakao_${res.id}`,
                  name: kakaoAccount.name || profile.nickname || '누리오 회원',
                  phone: kakaoAccount.phone_number || '010-0000-0000',
                  email: kakaoAccount.email || '',
                  birthyear: kakaoAccount.birthyear || '1990',
                  profileImage: profile.profile_image_url || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
                };
                
                executeAuthSuccess(realData, profile.nickname || `회원_${res.id.toString().slice(-4)}`);
              },
              fail: function(err) {
                console.warn('Kakao user info fetch failed:', err);
                setIsSubmitting(false);
                setIsDirectInputMode(true);
                setError('카카오 정보를 불러오지 못했습니다. 아래 직접 로그인창을 이용해 주세요.');
              }
            });
          },
          fail: function(err) {
            console.warn('Kakao popup closed or blocked:', err);
            setIsSubmitting(false);
            setIsDirectInputMode(true);
            setError('카카오 팝업이 차단되었습니다. 아래 직접 로그인창으로 진행해 보세요!');
          }
        });
        return;
      } catch (err) {
        console.warn('Kakao login exception:', err);
      }
    }

    setIsSubmitting(false);
    setIsDirectInputMode(true);
  };

  const handleDirectAuthSubmit = async (e) => {
    e.preventDefault();
    if (!directEmail.trim() && !directName.trim()) {
      setError('이메일 또는 이름을 입력해 주세요.');
      return;
    }

    const emailVal = directEmail.trim();
    const nameVal = directName.trim() || (emailVal ? emailVal.split('@')[0] : '누리오 회원');
    const safeKakaoId = `kakao_direct_${emailVal.replace(/[^a-zA-Z0-9]/g, '_') || Date.now()}`;

    const userData = {
      kakaoId: safeKakaoId,
      name: nameVal,
      nickname: nameVal,
      phone: '010-0000-0000',
      email: emailVal,
      birthyear: '1990',
      profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
    };

    await executeAuthSuccess(userData, nameVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col backdrop-blur-xl space-y-5 text-center">
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 심플 헤더 */}
        <div className="pt-2 space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-lg shadow-yellow-500/20 text-[#191919] font-black text-2xl transform hover:scale-105 transition">
            💬
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            카카오 로그인
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            카카오 계정 인증으로 1초 만에 안전하게 로그인합니다.
          </p>
        </div>

        {/* 🎁 무료체험 신청 안내 배너 (로그인 후 마이페이지에서 신청 안내) */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-2">
          <Gift className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>3일 무료체험 안내:</strong> 로그인 후 대시보드 상단 <strong>[3일 무료 사용 신청]</strong>에서 간편하게 신청하실 수 있습니다.
          </span>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 💬 메인 원클릭 카카오 로그인 버튼 */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleKakaoSdkLogin}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-base transition duration-200 shadow-xl shadow-yellow-500/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-95 group"
          >
            <span className="text-xl">💬</span>
            <span>{isSubmitting ? '로그인 인증 중...' : '카카오톡으로 로그인'}</span>
            <ArrowRight className="w-5 h-5 text-slate-900 group-hover:translate-x-1 transition" />
          </button>

          {/* 간편 직접 로그인 토글 */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsDirectInputMode(!isDirectInputMode)}
              className="text-xs text-slate-400 hover:text-yellow-400 underline transition cursor-pointer"
            >
              {isDirectInputMode ? '▲ 직접 입력 닫기' : '▼ 이메일 / 아이디로 직접 로그인'}
            </button>
          </div>
        </div>

        {/* 직접 입력 폼 */}
        {isDirectInputMode && (
          <form onSubmit={handleDirectAuthSubmit} className="p-4 rounded-2xl bg-slate-950/90 border border-yellow-400/30 space-y-3 text-left animate-in slide-in-from-top-2">
            <div>
              <label className="text-slate-400 block text-xs mb-1 font-semibold">이메일 또는 아이디 <span className="text-yellow-400">*</span></label>
              <input
                type="text"
                required
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                placeholder="예: trader@kakao.com 또는 아이디"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block text-xs mb-1 font-semibold">이름 / 닉네임</label>
              <input
                type="text"
                value={directName}
                onChange={(e) => setDirectName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-yellow-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>대시보드 바로 입장</span>
            </button>
          </form>
        )}

        {/* 자동 로그인 유지 */}
        <div className="flex items-center justify-center pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
            />
            <span>자동 로그인 유지</span>
          </label>
        </div>

      </div>
    </div>
  );
}
