import React, { useState } from 'react';
import { Wrench, ChevronUp, ChevronDown, Check, Server } from 'lucide-react';

export default function DevModeSwitcher({ 
  currentTier = 'VIP', 
  currentRole = 'ADMIN', 
  onSwitchMode, 
  onOpenDevDashboard 
}) {
  // 기본 접힘 상태
  const [isExpanded, setIsExpanded] = useState(false);

  const modes = [
    {
      tier: 'FREE_TRIAL',
      role: 'USER',
      name: '🆓 Free',
      label: '무료체험 (1슬롯)',
      maxSlots: 1,
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30'
    },
    {
      tier: 'PRO',
      role: 'USER',
      name: '⚡ Pro',
      label: '프로회원 (3슬롯)',
      maxSlots: 3,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
    },
    {
      tier: 'VIP',
      role: 'OPERATOR',
      name: '📊 운영자',
      label: '사이트 운영자 (9슬롯)',
      maxSlots: 9,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
    },
    {
      tier: 'VIP',
      role: 'DEVELOPER',
      name: '👑 개발자',
      label: '대표님 최고 개발자 권한 (9슬롯)',
      maxSlots: 9,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
    }
  ];

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-1.5 sm:p-2.5 backdrop-blur-md shadow-2xl text-xs max-w-[92vw] sm:max-w-none">
        {/* 상단 타이틀 바 (접기/펼치기) */}
        <div className="flex items-center justify-between gap-1.5">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-left cursor-pointer whitespace-nowrap"
          >
            <span className="p-0.5 rounded bg-indigo-500/20 text-indigo-400">
              <Wrench className="w-2.5 h-2.5" />
            </span>
            <span className="font-extrabold text-slate-300 text-[10px]">
              DEV ({currentRole === 'DEVELOPER' ? '개발자' : (currentRole === 'OPERATOR' || currentRole === 'ADMIN' ? '운영자' : currentTier)})
            </span>
            {isExpanded ? <ChevronDown className="w-2.5 h-2.5 text-slate-400" /> : <ChevronUp className="w-2.5 h-2.5 text-slate-400" />}
          </button>

          <button
            onClick={onOpenDevDashboard}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-[9px] transition cursor-pointer whitespace-nowrap"
          >
            <Server className="w-2.5 h-2.5" />
            <span>콘솔</span>
          </button>
        </div>

        {/* 등급 전환 버튼 목록 (펼쳤을 때만 표시) */}
        {isExpanded && (
          <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex flex-wrap items-center gap-1">
            {modes.map((mode, idx) => {
              const isCurrent = (currentTier === mode.tier && currentRole === mode.role);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (onSwitchMode) onSwitchMode(mode.tier, mode.role, mode.maxSlots);
                    setIsExpanded(false);
                  }}
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer whitespace-nowrap ${mode.badgeColor} ${
                    isCurrent ? 'ring-1 ring-white/60 shadow scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>{mode.name}</span>
                  {isCurrent && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
