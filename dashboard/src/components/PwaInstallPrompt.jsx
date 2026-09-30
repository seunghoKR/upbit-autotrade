import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, HelpCircle, ArrowRight, CheckCircle2, Share2, PlusSquare, ExternalLink } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [dontShowFor7Days, setDontShowFor7Days] = useState(false);
  const [activeTab, setActiveTab] = useState('android'); // 'android' | 'ios' | 'pc'
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches || 
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.navigator.standalone === true || 
      document.referrer.includes('android-app://')
    );
  });

  useEffect(() => {
    // 0. 이미 PWA / 독립형 앱(Standalone)으로 실행 중인지 검사
    const checkStandalone = () => {
      const standalone = Boolean(
        window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.navigator.standalone === true || 
        document.referrer.includes('android-app://')
      );
      setIsStandalone(standalone);
      if (standalone) {
        setIsVisible(false);
      }
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkStandalone);
    }

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // 1. 현재 OS / 브라우저 자동 감지하여 기본 탭 설정
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setActiveTab('ios');
    } else if (/Android/i.test(ua)) {
      setActiveTab('android');
    } else {
      setActiveTab('pc');
    }

    // 3. 사용자가 7일 동안 숨기기를 선택했는지 확인
    const dismissedUntil = localStorage.getItem('anylife_pwa_dismissed_7days');
    if (dismissedUntil && new Date().getTime() < Number(dismissedUntil)) {
      setIsVisible(false);
    } else {
      // 1.5초 후 부드럽게 팝업 표시
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // 4. beforeinstallprompt 이벤트 감지
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
      setDeferredPrompt(e);
      if (!dismissedUntil || new Date().getTime() >= Number(dismissedUntil)) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. 앱 설치 완료 이벤트 감지 시 즉시 닫기
    const handleAppInstalled = () => {
      setIsVisible(false);
      setIsGuideOpen(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. 외부(헤더 등)에서 가이드 모달 또는 설치 프롬프트 직접 호출 이벤트 수신
    const detectDeviceTab = () => {
      const ua = navigator.userAgent || '';
      if (/iPhone|iPad|iPod/i.test(ua)) {
        setActiveTab('ios');
      } else if (/Android/i.test(ua)) {
        setActiveTab('android');
      } else {
        setActiveTab('pc');
      }
    };

    const handleOpenGuide = () => {
      detectDeviceTab();
      setIsGuideOpen(true);
    };

    const handleTriggerPrompt = async () => {
      detectDeviceTab();
      const promptEvent = window.deferredPwaPrompt || deferredPrompt;
      if (promptEvent) {
        try {
          promptEvent.prompt();
          const { outcome } = await promptEvent.userChoice;
          if (outcome === 'accepted') {
            setIsVisible(false);
            setIsGuideOpen(false);
          }
          window.deferredPwaPrompt = null;
          setDeferredPrompt(null);
          return;
        } catch (err) {
          console.warn('Install prompt error:', err);
        }
      }
      // 직접 프롬프트가 안 뜰 때는 직관적인 간편 가이드 모달 즉시 표시
      setIsGuideOpen(true);
    };

    window.addEventListener('open_pwa_install_guide', handleOpenGuide);
    window.addEventListener('trigger_pwa_install', handleTriggerPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open_pwa_install_guide', handleOpenGuide);
      window.removeEventListener('trigger_pwa_install', handleTriggerPrompt);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPwaPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsVisible(false);
          setIsGuideOpen(false);
        }
        setDeferredPrompt(null);
        window.deferredPwaPrompt = null;
      } catch (err) {
        console.warn('Install prompt error:', err);
        alert('💡 브라우저 주소창 맨 오른쪽의 [🖥️ 앱 설치] 아이콘 또는\n우측 상단 메뉴(⋮) > [Any Life AI 설치]를 클릭해 주세요! ✨');
      }
    } else {
      const ua = navigator.userAgent || '';
      if (/iPhone|iPad|iPod/i.test(ua)) {
        alert('💡 Safari 브라우저 하단의 [공유(↑)] 버튼을 누른 후 [홈 화면에 추가]를 선택해 주세요! 📲');
      } else if (/Android/i.test(ua)) {
        alert('💡 Chrome 브라우저 우측 상단 메뉴(⋮)를 누른 후 [앱 설치] 또는 [홈 화면에 추가]를 선택해 주세요! 📲');
      } else {
        alert('💡 Chrome 브라우저 주소창(URL) 맨 오른쪽의 [🖥️ 앱 설치] 아이콘 또는\n우측 상단 메뉴(⋮) > [Any Life AI 설치]를 클릭해 주세요! 💻');
      }
    }
  };

  const handleClose = () => {
    if (dontShowFor7Days) {
      const expireTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('anylife_pwa_dismissed_7days', expireTime.toString());
    }
    setIsVisible(false);
  };

  const handleDismiss7DaysDirect = () => {
    const expireTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('anylife_pwa_dismissed_7days', expireTime.toString());
    setIsVisible(false);
  };

  if (isStandalone) return null;

  return (
    <>
      {/* 📱 PWA 플로팅 설치 알림 배너 (화면 우측 하단 / 모바일 하단) */}
      {isVisible && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm animate-slide-up">
          <div className="bg-[#0b1320]/95 backdrop-blur-xl border-2 border-emerald-500/60 rounded-3xl p-5 shadow-2xl shadow-emerald-500/25 text-white relative">
            
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 헤더 & 로고 */}
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center font-black text-black text-xl shrink-0 shadow-lg shadow-emerald-500/30">
                A
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight">Any Life AI 앱 설치</h3>
                  <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-bold">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-slate-400">홈 화면 / 바탕화면에 바로가기 앱 추가</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              💡 앱으로 설치하시면 주소창 없이 전체화면으로 더욱 빠르고 쾌적하게 트레이딩하실 수 있어요!
            </p>

            {/* 원클릭 설치 버튼 및 가이드 버튼 */}
            <div className="space-y-2 mb-3">
              <button
                onClick={handleInstallClick}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>지금 바로 앱 설치하기</span>
              </button>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>기기별(아이폰/안드로이드/PC) 설치 방법 보기</span>
              </button>
            </div>

            {/* 7일 동안 보지 않기 체크 & 닫기 옵션 */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={dontShowFor7Days}
                  onChange={(e) => setDontShowFor7Days(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                />
                <span className="text-[11px]">7일 동안 보지 않기</span>
              </label>

              <button
                onClick={handleDismiss7DaysDirect}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors cursor-pointer"
              >
                7일간 닫기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📖 [기기별 앱 설치 친절 가이드 모달] */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1320] border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
            
            {/* 모달 닫기 */}
            <button
              onClick={() => setIsGuideOpen(false)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 타이틀 */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-black font-bold text-lg shrink-0">
                📱
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Any Life AI 앱 설치 가이드</h3>
                <p className="text-xs text-slate-400">기기 환경에 맞는 초간단 3초 설치 방법</p>
              </div>
            </div>

            {/* 디바이스 탭 (안드로이드 / 아이폰 / PC) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-2xl mb-5 border border-slate-800">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>안드로이드</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>아이폰 (iOS)</span>
              </button>
              <button
                onClick={() => setActiveTab('pc')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'pc'
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC 브라우저</span>
              </button>
            </div>

            {/* 탭 1: 안드로이드 설치 방법 */}
            {activeTab === 'android' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>크롬 우측 상단 메뉴</span>
                        <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">⋮</code>
                        <span>터치</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Android 스마트폰 Chrome 브라우저 우측 상단의 점 세 개(⋮) 메뉴를 누릅니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">
                        [앱 설치] 또는 [홈 화면에 추가] 터치!
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        메뉴 목록에서 <b>[앱 설치]</b>를 누르시면 바탕화면에 전용 앱 아이콘이 즉시 생성됩니다. 🚀
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>지금 바로 안드로이드 앱 설치하기</span>
                </button>
              </div>
            )}

            {/* 탭 2: 아이폰 (iOS Safari) 설치 방법 */}
            {activeTab === 'ios' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">1. Safari 화면 맨 아래 [공유 ↑] 터치</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Safari 브라우저 하단 중앙의 네모 상자 위 화살표 아이콘을 누릅니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">2. [홈 화면에 추가] ➔ [추가] 터치!</h4>
                      <p className="text-xs text-slate-300 mt-1">
                        공유 목록에서 <b>[홈 화면에 추가]</b>를 누르고 우측 상단 <b>[추가]</b>를 누르면 아이폰 앱이 완성됩니다! 💖
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
                  <span>💡</span>
                  <span>네이버앱, 카카오톡에서는 지원되지 않으니 반드시 <b>Safari(사파리)</b>로 열어주세요!</span>
                </div>
              </div>
            )}

            {/* 탭 3: PC (Chrome / Edge) 설치 방법 */}
            {activeTab === 'pc' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                  
                  {/* 방법 1: 주소창 초간단 원클릭 (가장 추천) */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                        🌟 초간단 1초 컷 (가장 추천)
                      </span>
                      <span className="text-xs text-emerald-400 font-mono">주소창(URL) 우측 끝</span>
                    </div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>주소창 오른쪽 끝의</span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-emerald-500/60 text-emerald-300 font-mono text-xs flex items-center gap-1">
                        🖥️ 앱 설치
                      </span>
                      <span>아이콘 클릭!</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Chrome 브라우저 맨 위 주소창 끝에 있는 모니터 모양(🖥️) 또는 다운로드(⊕) 아이콘을 누르시면, <b>바탕화면 전용 데스크톱 앱</b>으로 즉시 설치됩니다!
                    </p>
                  </div>

                  {/* 방법 2: 크롬 메뉴 클릭 */}
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <span>대안 방법:</span>
                      <span className="text-white">크롬 우측 상단 메뉴(⋮) ➔ <b>[Any Life AI 설치...]</b></span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      메뉴에 <b>[Any Life AI에서 열기]</b>가 보인다면 이미 PC에 설치 완료된 상태입니다. 클릭하시면 주소창 없는 독립 창으로 즉시 열립니다! 🚀
                    </p>
                  </div>

                </div>

                {/* 설치 시도 버튼 */}
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-500/30 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>🚀 지금 PC에 앱 설치하기 (원클릭)</span>
                </button>
              </div>
            )}

            {/* 닫기 버튼 */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                확인 및 닫기
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
