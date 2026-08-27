import React, { useState } from 'react';
import { Wrench, ChevronUp, ChevronDown, Check, Server } from 'lucide-react';

export default function DevModeSwitcher({ 
  currentTier = 'VIP', 
  currentRole = 'ADMIN', 
  onSwitchMode, 
  onOpenDevDashboard 
}) {
  // 모바일 화면에서는 기본 접힘 상태로 시작하여 슬롯을 가리지 않도록 처리
  const [isExpanded, setIsExpanded] = useState(false);

  const modes = [
    {
      tier: 'FREE_TRIAL',
      role: 'USER',
      name: '🆓 Free Trial',
      label: '무료체험 (1슬롯)',
      maxSlots: 1,
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30'
    },
    {
      tier: 'PRO',
      role: 'USER',
      name: '⚡ Pro 플랜',
      label: '프로회원 (3슬롯)',
      maxSlots: 3,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
    },
    {
      tier: 'VIP',
      role: 'USER',
      name: '💎 VIP 최고급',
      label: 'VIP회원 (9슬롯)',
      maxSlots: 9,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
    },
    {
      tier: 'VIP',
      role: 'ADMIN',
      name: '👑 마스터 개발자',
      label: '대표님 최고권한 (9슬롯)',
      maxSlots: 9,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
    }
  ];

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900/95 border border-indigo-500/50 rounded-xl sm:rounded-2xl p-2 sm:p-3 backdrop-blur-md shadow-2xl text-xs max-w-[95vw] sm:max-w-none">
        {/* 상단 타이틀 바 (접기/펼치기) */}
        <div className="flex items-center justify-between gap-2 px-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-left cursor-pointer"
          >
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Wrench className="w-3 h-3" />
            </span>
            <span className="font-extrabold text-slate-200 text-[10px] sm:text-[11px]">
              🛠️ DEV 모드 ({currentRole === 'ADMIN' ? '마스터' : currentTier})
            </span>
            {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronUp className="w-3 h-3 text-slate-400" />}
          </button>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={onOpenDevDashboard}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] transition cursor-pointer"
            >
              <Server className="w-2.5 h-2.5" />
              <span>대시보드</span>
            </button>
          </div>
        </div>

        {/* 등급 전환 버튼 목록 (펼쳤을 때만 표시) */}
        {isExpanded && (
          <div className="pt-2 mt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
            {modes.map((mode, idx) => {
              const isCurrent = (currentTier === mode.tier && currentRole === mode.role);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (onSwitchMode) onSwitchMode(mode.tier, mode.role, mode.maxSlots);
                    setIsExpanded(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${mode.badgeColor} ${
                    isCurrent ? 'ring-2 ring-white/60 shadow scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>{mode.name}</span>
                  {isCurrent && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
