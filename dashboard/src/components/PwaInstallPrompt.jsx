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
    const handleOpenGuide = () => {
      setIsGuideOpen(true);
    };
    const handleTriggerPrompt = () => {
      if (window.deferredPwaPrompt) {
        window.deferredPwaPrompt.prompt();
      } else {
        setIsGuideOpen(true);
      }
    };

    window.addEventListener('open_pwa_install_guide', handleOpenGuide);
    window.addEventListener('trigger_pwa_install', handleTriggerPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open_pwa_install_guide', handleOpenGuide);
      window.removeEventListener('trigger_pwa_install', handleTriggerPrompt);
    };
  }, []);

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
        setIsGuideOpen(true);
      }
    } else {
      // 브라우저 직접 프롬프트가 지원되지 않는 경우(iOS 사파리, PC 등) 친절한 안내 모달 열기
      const ua = navigator.userAgent || '';
      if (!/iPhone|iPad|iPod|Android/i.test(ua)) {
        setActiveTab('pc');
      }
      setIsGuideOpen(true);
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
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">원클릭 설치 버튼 누르기</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        아래 [지금 바로 설치] 버튼을 누르면 브라우저 하단에 설치 확인 창이 뜹니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">버튼이 반응하지 않을 때 (수동 설치)</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Chrome 브라우저 우측 상단 <b>메뉴(⋮)</b> 클릭 ➔ <b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b>를 선택해 주세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">바탕화면에서 즉시 실행</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        스마트폰 바탕화면에 Any Life AI 앱 아이콘이 생성되며, 클릭 시 전체화면으로 열립니다!
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>안드로이드 앱 설치 시도하기</span>
                </button>
              </div>
            )}

            {/* 탭 2: 아이폰 (iOS Safari) 설치 방법 */}
            {activeTab === 'ios' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">1. 사파리(Safari) 하단 [공유] 버튼 클릭</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Safari 브라우저 화면 맨 하단 중앙의 <b>[공유(Share)]</b> 아이콘(네모 상자 위 화살표)을 눌러주세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">2. [홈 화면에 추가] 선택</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        공유 메뉴 목록을 아래로 스크롤하여 <b>[홈 화면에 추가]</b> 메뉴를 터치합니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">3. 우측 상단 [추가] 터치 완료!</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        우측 상단의 <b>[추가]</b>를 누르면 아이폰 홈 화면에 Any Life AI 앱이 완성됩니다! 💖
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300">
                  ⚠️ <b>안내:</b> 네이버앱, 카카오톡 인앱 브라우저에서는 홈 화면 추가가 지원되지 않습니다. 반드시 <b>Safari(사파리)</b>로 열어주세요!
                </div>
              </div>
            )}

            {/* 탭 3: PC (Chrome / Edge) 설치 방법 */}
            {activeTab === 'pc' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  
                  {/* 1단계: 메뉴 진입 */}
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">크롬 메뉴(⋮) ➔ [캐스팅, 저장, 공유]</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Chrome 브라우저 우측 상단 <b>메뉴(⋮)</b> 클릭 후 <b>[캐스팅, 저장, 공유]</b> 메뉴로 마우스를 올립니다.
                      </p>
                    </div>
                  </div>

                  {/* 2단계: 설치 또는 열기 */}
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white">상태에 따라 메뉴 선택:</h4>
                      
                      {/* 이미 설치된 경우 (대표님 스크린샷 상황) */}
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-300 mb-1">
                          <span>✅</span>
                          <span>[Any Life AI에서 열기(O)] 가 보일 때:</span>
                        </div>
                        이미 대표님 PC에 앱이 설치된 상태입니다! 이 메뉴를 클릭하시면 주소창 없는 <b>독립 전용 데스크톱 앱</b>으로 즉시 열립니다! 🚀
                      </div>

                      {/* 설치 전인 경우 */}
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 leading-relaxed">
                        <div className="font-semibold text-slate-200 mb-0.5">
                          📥 <b>[Any Life AI 설치...]</b> 가 보일 때:
                        </div>
                        클릭하시면 바탕화면 및 시작메뉴에 즉시 앱이 설치됩니다.
                      </div>

                      {/* 바로가기 만들기 */}
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 leading-relaxed">
                        <div className="font-semibold text-slate-200 mb-0.5">
                          📌 <b>[바로가기 만들기...]</b> 를 누를 때:
                        </div>
                        팝업에서 <b>'창으로 열기'</b>를 체크하고 [만들기]를 누르시면 완벽한 독립 창 앱으로 등록됩니다.
                      </div>
                    </div>
                  </div>

                  {/* 3단계: 주소창 설치 아이콘 안내 */}
                  <div className="p-3.5 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200 leading-relaxed">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                      <span>💡</span>
                      <span>주소창 끝에 설치 아이콘이 안 보이는 이유!</span>
                    </div>
                    Chrome 브라우저는 <b>이미 컴퓨터에 앱이 설치되어 있으면 주소창 끝의 설치 아이콘을 자동으로 숨깁니다.</b><br />
                    위 2번처럼 <b>[Any Life AI에서 열기]</b>가 보인다면 이미 정상 설치된 것이니 안심하고 바로 실행해 보세요~ 💖
                  </div>

                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>PC 앱 설치 또는 바로 실행하기</span>
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
