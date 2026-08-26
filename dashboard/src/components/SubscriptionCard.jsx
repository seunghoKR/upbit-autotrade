import React from 'react';
import { Crown, KeyRound, ShieldCheck, ShieldAlert, LogOut, User } from 'lucide-react';

export default function SubscriptionCard({ 
  user, 
  onOpenMyPage,
  onOpenApiModal, 
  onOpenPricing, 
  onOpenAdmin, 
  onOpenKakaoLogin, 
  onLogout 
}) {
  if (!user) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-lg shrink-0">
            💬
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
              카카오 1초 로그인 무료체험
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 font-bold">
                FREE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">업비트 API 연동 후 실시간 자동매매 시작</p>
          </div>
        </div>

        <button
          onClick={onOpenKakaoLogin}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>💬 카카오 1초 로그인</span>
        </button>
      </div>
    );
  }

  const isVip = user.tier === 'VIP';
  const isPro = user.tier === 'PRO';
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-md shadow-lg">
      {/* 좌측: 유저 프로필 & 등급 뱃지 (모바일 가로 1열) */}
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img
              src={user.profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'}
              alt=""
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-700 object-cover"
            />
            {isAdmin && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[8px] font-bold shadow">
                👑
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-100">{user.nickname}</span>
              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                isAdmin
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : isVip
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : isPro
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
              }`}>
                {isAdmin ? '마스터' : user.tier}
              </span>
              {user.hasApiKey ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> API
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-0.5 animate-pulse">
                  <ShieldAlert className="w-2.5 h-2.5" /> 미등록
                </span>
              )}
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>슬롯: <strong className="text-indigo-400">{user.maxSlots}개</strong></span>
              <span>•</span>
              <span className="text-yellow-400 font-medium">
                {isAdmin ? '평생 라이선스' : `D-${user.remainingDays}일`}
              </span>
            </div>
          </div>
        </div>

        {/* 모바일 우측 끝 로그아웃 버튼 */}
        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 transition md:hidden cursor-pointer shrink-0"
          title="로그아웃"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 우측: 액션 버튼들 (마이페이지 버튼 추가) */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
        {/* 👤 마이페이지 버튼 (핵심 자동매매 동의/한도 설정 진입) */}
        <button
          onClick={onOpenMyPage}
          className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-indigo-600/25"
        >
          <User className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span>마이페이지</span>
        </button>

        {/* API 키 관리 */}
        <button
          onClick={onOpenApiModal}
          className={`flex-1 md:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            user.hasApiKey
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-md'
          }`}
        >
          <KeyRound className="w-3 h-3 shrink-0" />
          <span>API키</span>
        </button>

        {/* 멤버십 플랜 */}
        <button
          onClick={onOpenPricing}
          className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
        >
          <Crown className="w-3 h-3 text-amber-300 shrink-0" />
          <span>플랜</span>
        </button>

        {/* 마스터 관리자 (ADMIN 전용) */}
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-extrabold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>👑 회원관리</span>
          </button>
        )}

        {/* 데스크톱 로그아웃 */}
        <button
          onClick={onLogout}
          className="hidden md:flex p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="로그아웃"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
