import React, { useState, useEffect } from 'react';
import { Download, X, Check } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowFor7Days, setDontShowFor7Days] = useState(false);

  useEffect(() => {
    // 1. 이미 PWA / 독립형 앱(Standalone)으로 실행 중인지 검사
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://');

    // 이미 앱으로 열린 상태라면 팝업을 절대 띄우지 않음!
    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // 2. 사용자가 7일 동안 숨기기를 선택했는지 확인
    const dismissedUntil = localStorage.getItem('nurioh_pwa_dismissed_7days');
    if (dismissedUntil && new Date().getTime() < Number(dismissedUntil)) {
      setIsVisible(false);
      return;
    }

    // 3. beforeinstallprompt 이벤트 감지
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. 앱 설치 완료 이벤트 감지 시 즉시 닫기
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    // 브라우저 접속 시 1초 후 표시
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('스마트폰 화면 하단의 [공유] 또는 상단 [메뉴(⋮)]를 누른 후 \n"홈 화면에 추가"를 선택하시면 앱이 설치됩니다! ✨');
    }
  };

  const handleClose = () => {
    if (dontShowFor7Days) {
      // 7일(7 * 24시간) 동안 숨김 저장
      const expireTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('nurioh_pwa_dismissed_7days', expireTime.toString());
    }
    setIsVisible(false);
  };

  const handleDismiss7DaysDirect = () => {
    const expireTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('nurioh_pwa_dismissed_7days', expireTime.toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-sm animate-slide-up">
      <div className="bg-dark-card/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-3xl p-5 shadow-2xl shadow-emerald-500/25 text-white relative">
        
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-dark-bg transition-colors"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 헤더 & 로고 */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center font-bold text-black text-xl shrink-0 shadow-lg shadow-emerald-500/30">
            N
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">NURIOH 앱 설치</h3>
            <p className="text-xs text-slate-400">스마트폰 홈 화면에 바로가기 앱 추가</p>
          </div>
        </div>

        {/* 원클릭 설치 버튼 */}
        <button
          onClick={handleInstallClick}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 glow-green active:scale-95 mb-3"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>지금 바로 앱 설치하기</span>
        </button>

        {/* 7일 동안 보지 않기 체크 & 닫기 옵션 */}
        <div className="flex items-center justify-between pt-2 border-t border-dark-border/60 text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={dontShowFor7Days}
              onChange={(e) => setDontShowFor7Days(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-dark-bg border-dark-border"
            />
            <span className="text-[11px]">7일 동안 보지 않기</span>
          </label>

          <button
            onClick={handleDismiss7DaysDirect}
            className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            7일간 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
