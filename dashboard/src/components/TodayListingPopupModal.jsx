import React from 'react';

export default function TodayListingPopupModal({ isOpen, todayNotice, onClose, onOpenNoticeBoard }) {
  if (!isOpen || !todayNotice) return null;

  const handleDoNotShowAgain = () => {
    try {
      localStorage.setItem('hide_today_listing_popup_never', 'true');
      if (todayNotice?.id) {
        localStorage.setItem(`hide_listing_notice_${todayNotice.id}`, 'true');
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-400/50 rounded-2xl shadow-2xl shadow-cyan-500/30 overflow-hidden text-slate-100">
        
        {/* 상단 네온 바 & 불꽃 배너 */}
        <div className="h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 animate-pulse"></div>

        <div className="p-6">
          {/* 헤더 배지 & 타이틀 */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 tracking-wider">
                ⚡ TODAY NEW LISTING
              </span>
              <span className="text-xs text-cyan-300 font-mono font-semibold">
                업비트 원화마켓
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="text-center my-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl shadow-inner shadow-cyan-500/20">
              💎
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              오늘 신규 상장 코인 감지!
            </h3>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-300 mt-1">
              {todayNotice.coinName} ({todayNotice.symbol})
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              마켓: {todayNotice.market} | 상장일: {todayNotice.date}
            </p>
          </div>

          {/* 알림 카드 */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>0.01초 실시간 레이더:</strong> 업비트 웹소켓 전체 틱 수신 엔진에 즉시 등록되어 호가와 체결을 감시 중입니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>초기 3초 쉴드 필터:</strong> 상장 빔 급등락 시 호가 스프레드(0.4%) 및 3초 지속성을 검증하여 안전하게 기회를 포착합니다.</span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-5 space-y-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenNoticeBoard();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>📢 신규 상장 상세 정보 & 봇 전략 확인</span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-400">
              <button
                onClick={handleDoNotShowAgain}
                className="hover:text-slate-200 transition-colors underline underline-offset-4"
              >
                다시 열지 않기
              </button>
              <button
                onClick={onClose}
                className="hover:text-slate-200 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
