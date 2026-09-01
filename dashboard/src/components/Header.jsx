import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Power, 
  RefreshCw, 
  ShieldAlert, 
  BarChart3, 
  BookOpen, 
  Users, 
  User, 
  LogOut, 
  Sliders,
  Volume2,
  VolumeX
} from 'lucide-react';
import { soundService } from '../services/soundService';

export default function Header({ 
  user,
  hasApiKey = false,
  botRunning, 
  onToggleBot, 
  onOpen2FA, 
  is2FAActive, 
  onRefresh, 
  onOpenOperatorDashboard,
  onOpenAdmin,
  onOpenMyPage,
  onOpenManual,
  onLogout,
  marketCount = 134
}) {
  const role = user?.role || 'USER';
  const tier = user?.tier || 'FREE_TRIAL';
  const isPrivileged = (role === 'OPERATOR' || role === 'ADMIN' || role === 'DEVELOPER');
  const isAdmin = (role === 'ADMIN' || role === 'DEVELOPER');
  const isPending = user?.approvalStatus === 'PENDING' && !isAdmin;

  // 🔊 사운드 알림 활성화 상태 관리
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());

  useEffect(() => {
    const handleSoundToggle = (e) => {
      setSoundEnabled(e.detail.enabled);
    };
    window.addEventListener('nurioh_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('nurioh_sound_toggle', handleSoundToggle);
  }, []);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    soundService.setEnabled(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      soundService.playTone(880, 'sine', 0.1, 0, 0.1); // 켬 확인음
    }
  };

  // 닉네임 표시명 계산
  const displayName = (!user?.nickname || user?.nickname === '??') 
    ? (user?.name || (user?.email ? user.email.split('@')[0] : '누리오 마스터 대표님')) 
    : user.nickname;

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        
        {/* 좌측: 로고 & 👤 대표님 프로필 미니 위젯 (주황색 화살표 위치로 통합) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* 로고 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30 flex items-center justify-center bg-slate-950 shrink-0">
              <img 
                src="/assets/logos/nurioh_logo.png" 
                alt="NURIOH" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight whitespace-nowrap">NURIOH</h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  AI
                </span>
              </div>

              {/* 🟢 실시간 레이더 가동 중 라이브 뱃지 (초록불 깜빡임 + 전종목 개수 + 버전) */}
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-medium shadow-inner shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-300 font-bold whitespace-nowrap">레이더 가동 중</span>
                <span className="text-emerald-400/80 font-mono text-[10px] whitespace-nowrap">({marketCount || 134}개 전종목)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  v2.8.1
                </span>
              </div>
            </div>
          </div>

          {/* 세로 구분선 */}
          <div className="h-6 w-px bg-slate-800 hidden xs:block" />

          {/* 👤 프로필 미니 위젯 (상단 헤더 좌측에 슬림하게 안착) */}
          {user && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-2.5 py-1 sm:py-1.5 rounded-xl shadow-inner">
              <div className="relative shrink-0">
                <img
                  src={user.profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'}
                  alt=""
                  className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg border border-slate-700 object-cover"
                />
                {isAdmin && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[7px] font-bold shadow">
                    👑
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <span className="font-bold text-xs text-slate-100 whitespace-nowrap truncate max-w-[120px] sm:max-w-[160px]">
                    {displayName}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 whitespace-nowrap ${
                    user.role === 'DEVELOPER'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : (user.role === 'OPERATOR' || user.role === 'ADMIN')
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : user.tier === 'VIP'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : user.tier === 'PRO'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                  }`}>
                    {user.role === 'DEVELOPER' ? '👑 개발자' : (user.role === 'OPERATOR' || user.role === 'ADMIN' ? '📊 운영자' : (isPending ? '대기' : user.tier))}
                  </span>
                  {hasApiKey ? (
                    <span className="hidden md:flex text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold items-center gap-0.5 shrink-0 whitespace-nowrap">
                      <ShieldCheck className="w-2.5 h-2.5" /> API 연결됨
                    </span>
                  ) : (
                    <span className="hidden md:flex text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold items-center gap-0.5 shrink-0 whitespace-nowrap">
                      <ShieldAlert className="w-2.5 h-2.5" /> API 미등록
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.2 whitespace-nowrap">
                  <span>슬롯: <strong className="text-indigo-400">{user.maxSlots || 9}개</strong></span>
                  <span>•</span>
                  <span className="text-yellow-400 font-medium">
                    {isAdmin ? '평생 라이선스' : (isPending ? '승인 대기' : `D-${user.remainingDays}일`)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 우측: 대표님이 지정해 주신 핵심 메뉴 버튼 바 */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* 1. 👤 마이페이지 */}
          <button
            onClick={onOpenMyPage}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
            title="마이페이지 & API 설정"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>마이페이지</span>
          </button>

          {/* 2. 👑 회원관리 (운영자 / 개발자 / 관리자 전용) */}
          {isPrivileged && (
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
              title="회원 승인 및 등급 관리"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>회원관리</span>
            </button>
          )}

          {/* 3. 📊 전략관리 (운영자 / 개발자 / 관리자 전용 - 1개 전략 튜닝 & 제외코인) */}
          {isPrivileged && (
            <button
              onClick={onOpenOperatorDashboard}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
              title="전략 파라미터 및 제외코인 관리"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>전략관리</span>
            </button>
          )}

          {/* 📖 매뉴얼 버튼 */}
          <button
            onClick={onOpenManual}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
            title="매뉴얼 & 개선 의견"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">매뉴얼</span>
          </button>

          {/* 🔊 사운드 알림 토글 버튼 */}
          <button
            onClick={toggleSound}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              soundEnabled
                ? 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? '실시간 소리 알림 켜짐 (클릭하여 끄기)' : '실시간 소리 알림 꺼짐 (클릭하여 켜기)'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline text-[11px]">소리 ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline text-[11px]">무음</span>
              </>
            )}
          </button>

          {/* 새로고침 */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer shrink-0"
            title="새로고침"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* 로그아웃 버튼 */}
          {user && onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer shrink-0 ml-0.5"
              title="로그아웃"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

