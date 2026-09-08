import React, { useState } from 'react';
import { COIN_NOTICES } from '../data/coinNotices';

export default function NoticeBoardModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedNoticeId, setSelectedNoticeId] = useState(COIN_NOTICES[0]?.id || null);

  if (!isOpen) return null;

  const filteredNotices = COIN_NOTICES.filter(notice => {
    if (activeTab === 'ALL') return true;
    return notice.type === activeTab;
  });

  const selectedNotice = COIN_NOTICES.find(n => n.id === selectedNoticeId) || filteredNotices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 flex flex-col max-h-[88vh] overflow-hidden text-slate-100">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xl flex items-center justify-center">
              📢
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                업비트 거래소 공지 & 종목 현황판
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  누리오 AI 실시간 감시
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                신규 상장 및 거래지원 종료(상폐) 코인을 감지하여 슬롯 엔진 및 레이더에 연동합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            전체 공지 ({COIN_NOTICES.length})
          </button>
          <button
            onClick={() => setActiveTab('LISTING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'LISTING'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            신규 상장 ({COIN_NOTICES.filter(n => n.type === 'LISTING').length})
          </button>
          <button
            onClick={() => setActiveTab('DELISTING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'DELISTING'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            거래지원 종료/폐지 ({COIN_NOTICES.filter(n => n.type === 'DELISTING').length})
          </button>
        </div>

        {/* 바디 (좌측 목록 + 우측 상세) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* 좌측 리스트 */}
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto max-h-[55vh] divide-y divide-slate-800/60">
            {filteredNotices.map((notice) => {
              const isSelected = selectedNotice?.id === notice.id;
              return (
                <div
                  key={notice.id}
                  onClick={() => setSelectedNoticeId(notice.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/50 border-l-4 border-l-cyan-400'
                      : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        notice.type === 'LISTING'
                          ? notice.isToday
                            ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {notice.isToday ? '🔥 오늘 상장' : notice.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {notice.date}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200 line-clamp-1">
                    {notice.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
                    <span className="font-mono text-cyan-300 font-semibold">{notice.market}</span>
                    <span>{notice.coinName}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 우측 상세 내용 */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[55vh] bg-slate-950/30 space-y-4">
            {selectedNotice ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        selectedNotice.type === 'LISTING'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {selectedNotice.type === 'LISTING' ? '신규 마켓 오픈' : '유의 및 폐지 안내'}
                    </span>
                    {selectedNotice.isToday && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 animate-pulse">
                        ⚡ TODAY
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono ml-auto">
                      공시일: {selectedNotice.date}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {selectedNotice.title}
                  </h3>
                  <p className="text-xs font-mono text-cyan-400">
                    심볼/마켓: {selectedNotice.coinName} ({selectedNotice.market})
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs md:text-sm leading-relaxed text-slate-300">
                  {selectedNotice.summary}
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    주요 정보 & 감시 상태
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedNotice.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-cyan-400 font-bold">▪</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold mb-1">
                    <span>🛡️ 누리오 AI 엔진 보호 로직</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-normal">
                    {selectedNotice.riskNotice}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                선택된 공지사항이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>업비트 전종목 웹소켓 틱 데이터 실시간 동기화 중</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
