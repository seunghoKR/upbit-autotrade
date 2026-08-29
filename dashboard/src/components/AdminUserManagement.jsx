import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Crown, 
  Calendar, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Power, 
  UserCheck, 
  Search,
  Sparkles,
  Phone,
  Mail,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  UserCog,
  Send,
  Plus
} from 'lucide-react';
import { getAdminUsers, updateAdminUser, sendTelegramTestMessage, confirmUserDeposit } from '../services/api';

export default function AdminUserManagement({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL | OPERATOR | VIP | PRO | FREE | PENDING
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [testingTelegramUserId, setTestingTelegramUserId] = useState(null);

  const isDeveloper = currentUser?.role === 'DEVELOPER' || currentUser?.role === 'ADMIN';

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminUsers(currentUser?.role || 'DEVELOPER');
      if (res && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 플랜/역할/승인 통합 변경 핸들러
  const handleUpdateUser = async (userId, updatePayload, successMsg) => {
    try {
      await updateAdminUser(userId, updatePayload);
      setActionSuccess(successMsg || `회원 #${userId} 정보가 성공적으로 변경되었습니다.`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadUsers();
    } catch (err) {
      alert('회원 정보 변경 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  // ✈️ 텔레그램 알림 테스트 메시지 전송 핸들러
  const handleTestTelegram = async (userId, userName) => {
    setTestingTelegramUserId(userId);
    try {
      const res = await sendTelegramTestMessage(userId);
      setActionSuccess(res?.message || `[${userName}] 님에게 텔레그램 테스트 메시지가 성공적으로 전송되었습니다! 🚀`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert('텔레그램 테스트 발송 실패: ' + (err.response?.data?.error || err.message));
    } finally {
      setTestingTelegramUserId(null);
    }
  };

  // 💰 회비 입금 확인 및 1개월(+30일) 연장 승인 핸들러
  const handleConfirmDeposit = async (userId, userName) => {
    if (!window.confirm(`[${userName}] 회원의 회비 입금을 확인하고, 구독 기간을 1개월(+30일) 연장 승인하시겠습니까?`)) {
      return;
    }
    try {
      const res = await confirmUserDeposit(userId, {
        amountKrw: 50000,
        paymentType: 'BANK_TRANSFER'
      });
      setActionSuccess(res?.message || `[${userName}] 회원의 입금이 확인되어 1개월(+30일) 연장되었습니다! ✨`);
      setTimeout(() => setActionSuccess(''), 4000);
      loadUsers();
    } catch (err) {
      alert('입금 확인 연장 처리 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  // 필터링된 유저 목록
  const filteredUsers = users.filter(u => {
    const matchSearch = 
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.nickname && u.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.kakaoId && u.kakaoId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (selectedFilter === 'OPERATOR') return u.role === 'OPERATOR';
    if (selectedFilter === 'VIP') return u.tier === 'VIP' && u.role !== 'OPERATOR';
    if (selectedFilter === 'PRO') return u.tier === 'PRO' && u.role !== 'OPERATOR';
    if (selectedFilter === 'FREE') return u.tier === 'FREE_TRIAL' && u.role !== 'OPERATOR';
    if (selectedFilter === 'PENDING') return u.approvalStatus === 'PENDING';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-[1360px] w-full p-4 sm:p-6 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-amber-400 rounded-xl">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                👑 {isDeveloper ? '개발자 마스터 회원 관리 센터' : '운영자 전용 회원 관리 센터'}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isDeveloper 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {isDeveloper ? 'Developer Admin' : 'Operator'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isDeveloper 
                  ? '👑 개발자 권한: [무료 | PRO 플랜 | VIP 플랜 | 운영자 지정] 모든 등급과 권한을 총괄 관리합니다.' 
                  : '📊 운영자 권한: [무료 | PRO 플랜 | VIP 플랜] 회원들의 등급 지정 및 이용 기간을 관리합니다.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 안내 및 검색 & 필터 바 */}
        <div className="py-3 space-y-3 shrink-0">
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* 🏷️ 등급/상태별 필터 탭 */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 text-xs">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedFilter === 'ALL'
                    ? 'bg-slate-200 text-slate-900 shadow'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                전체 ({users.length})
              </button>

              <button
                onClick={() => setSelectedFilter('OPERATOR')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'OPERATOR'
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-950 text-purple-400 border border-slate-800 hover:bg-purple-950/30'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>운영자 ({users.filter(u => u.role === 'OPERATOR').length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('VIP')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'VIP'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-slate-950 text-amber-400 border border-slate-800 hover:bg-amber-950/30'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>VIP 플랜 ({users.filter(u => u.tier === 'VIP' && u.role !== 'OPERATOR').length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('PRO')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'PRO'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-950 text-indigo-400 border border-slate-800 hover:bg-indigo-950/30'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>PRO 플랜 ({users.filter(u => u.tier === 'PRO' && u.role !== 'OPERATOR').length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('FREE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedFilter === 'FREE'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 text-emerald-400 border border-slate-800 hover:bg-emerald-950/30'
                }`}
              >
                무료방문자 ({users.filter(u => u.tier === 'FREE_TRIAL' && u.role !== 'OPERATOR').length})
              </button>

              <button
                onClick={() => setSelectedFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  selectedFilter === 'PENDING'
                    ? 'bg-rose-600 text-white shadow animate-pulse'
                    : 'bg-slate-950 text-rose-400 border border-slate-800 hover:bg-rose-950/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>승인 대기 ({users.filter(u => u.approvalStatus === 'PENDING').length})</span>
              </button>
            </div>

            {/* 검색창 */}
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="이메일, 실명, 닉네임, 연락처 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 회원 테이블 영역 */}
        <div className="overflow-y-auto overflow-x-auto flex-1 rounded-xl border border-slate-800 bg-slate-950/60 custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/95 text-[11px] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800 z-10">
              <tr className="whitespace-nowrap">
                <th className="py-3.5 px-4 font-semibold">회원 실명 / 닉네임</th>
                <th className="py-3.5 px-3 font-semibold">연락처 / 이메일 (계정)</th>
                <th className="py-3.5 px-3 font-semibold">텔레그램 연동 상태</th>
                <th className="py-3.5 px-3 font-semibold text-center">승인 상태</th>
                <th className="py-3.5 px-3 font-semibold text-center">구독 만료일</th>
                <th className="py-3.5 px-4 font-semibold text-right">알림 & 플랜 변경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    해당 조건에 일치하는 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isOperator = user.role === 'OPERATOR';
                  const isVip = user.tier === 'VIP';
                  const isPro = user.tier === 'PRO';
                  const isPending = user.approvalStatus === 'PENDING';
                  const isExpired = user.approvalStatus === 'EXPIRED' || (!isOperator && user.role !== 'DEVELOPER' && user.remainingDays <= 0 && Boolean(user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()));

                  return (
                    <tr key={user.id} className="hover:bg-slate-900/60 transition whitespace-nowrap">
                      {/* 회원 실명 / 닉네임 & 역할·등급 뱃지 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'}
                            alt=""
                            className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
                              <span>{user.name || user.nickname}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({user.nickname})</span>
                              
                              {/* 이름 옆 역할/등급 & 슬롯 뱃지 */}
                              {isOperator ? (
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded-md font-extrabold whitespace-nowrap flex items-center gap-1">
                                  <Shield className="w-2.5 h-2.5 text-purple-400" />
                                  <span>운영자 (9슬롯)</span>
                                </span>
                              ) : isVip ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                                  <span>VIP (9슬롯)</span>
                                </span>
                              ) : isPro ? (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5 text-indigo-400" />
                                  <span>PRO (3슬롯)</span>
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">
                                  무료 (1슬롯)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap block">
                              {user.kakaoId} ({user.birthyear || '1990'}년생)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 연락처 / 이메일 */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-200 block text-xs flex items-center gap-1 whitespace-nowrap">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{user.phone || '010-0000-0000'}</span>
                          </span>
                          <span className="text-[11px] font-mono text-indigo-300 font-semibold truncate block max-w-[180px] flex items-center gap-1 whitespace-nowrap">
                            <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span>{user.email || '미등록'}</span>
                          </span>
                        </div>
                      </td>

                      {/* 텔레그램 연동 상태 */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {user.hasTelegram ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 inline-flex shadow-sm whitespace-nowrap">
                              <Send className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>ID: {user.telegramId}</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                              <span>알림 수신 가능</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg font-medium inline-block whitespace-nowrap">
                            ⚪ 텔레그램 미등록
                          </span>
                        )}
                      </td>

                      {/* 승인 상태 & 입금 확인/연장 */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isPending ? (
                          <button
                            onClick={() => handleUpdateUser(user.id, { approvalStatus: 'APPROVED', addDays: 3 }, `회원 #${user.id}님의 이용이 승인되었습니다 (3일 무료체험 시작)!`)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-extrabold text-[10px] inline-flex items-center gap-1 transition cursor-pointer animate-pulse whitespace-nowrap"
                            title="클릭하여 무료 이용을 승인합니다"
                          >
                            <Clock className="w-3 h-3" />
                            <span>승인 대기 (클릭 승인)</span>
                          </button>
                        ) : isExpired ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-rose-400 font-bold inline-flex items-center gap-1 text-[10px] bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>미승인 (입금 만료)</span>
                            </span>
                            <button
                              onClick={() => handleConfirmDeposit(user.id, user.name || user.nickname)}
                              className="text-[10px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-bold transition flex items-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                              title="회비 입금 확인 후 1개월 연장 및 즉시 승인"
                            >
                              <Plus className="w-2.5 h-2.5 text-emerald-400" />
                              <span>+1개월 입금확인</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-emerald-400 font-bold inline-flex items-center gap-1 text-[11px] whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>승인 완료</span>
                            </span>
                            {!isOperator && (
                              <button
                                onClick={() => handleConfirmDeposit(user.id, user.name || user.nickname)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-200 hover:underline transition flex items-center gap-0.5 cursor-pointer mt-0.5 font-medium"
                                title="회비 입금 확인 시 1개월(+30일) 추가 연장"
                              >
                                <span>[+1개월 연장]</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 만료일 */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div>
                          <span className="font-mono text-slate-200 block text-xs whitespace-nowrap">
                            {user.subscriptionExpiresAt ? user.subscriptionExpiresAt.slice(0, 10) : '-'}
                          </span>
                          <span className={`text-[10px] font-bold block whitespace-nowrap ${isExpired ? 'text-rose-400 font-extrabold' : user.remainingDays <= 3 ? 'text-rose-400' : 'text-yellow-400'}`}>
                            {user.role === 'OPERATOR' ? '무제한 (운영자)' : isExpired ? '만료됨 (미승인)' : `D-${user.remainingDays}일 남음`}
                          </span>
                        </div>
                      </td>

                      {/* 텔레그램 알림 테스트 & 플랜 변경 펼침 메뉴 */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
                          {/* ✈️ 텔레그램 알림 테스트 버튼 */}
                          <button
                            disabled={!user.hasTelegram || testingTelegramUserId === user.id}
                            onClick={() => handleTestTelegram(user.id, user.name || user.nickname)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                              user.hasTelegram
                                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/80 hover:text-white shadow-md shadow-cyan-500/20 active:scale-95'
                                : 'bg-slate-900/40 text-slate-600 border-slate-800/80 cursor-not-allowed opacity-60'
                            }`}
                            title={user.hasTelegram ? `${user.name || user.nickname} 회원에게 텔레그램 테스트 메시지를 즉시 전송합니다` : '회원이 아직 텔레그램 ID를 등록하지 않았습니다'}
                          >
                            {testingTelegramUserId === user.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                            ) : (
                              <Send className={`w-3 h-3 ${user.hasTelegram ? 'text-cyan-400' : 'text-slate-600'}`} />
                            )}
                            <span>{testingTelegramUserId === user.id ? '발송 중...' : '알림 테스트'}</span>
                          </button>

                          {/* 🔽 플랜 변경 펼침 메뉴 (Dropdown Select) */}
                          <div className="relative inline-block">
                            <select
                              value={isOperator ? 'OPERATOR' : user.tier || 'FREE_TRIAL'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'FREE_TRIAL') {
                                  handleUpdateUser(
                                    user.id, 
                                    { tier: 'FREE_TRIAL', role: 'USER', approvalStatus: 'APPROVED', addDays: 30 }, 
                                    `회원 #${user.id} (${user.name || user.nickname})님이 [무료 플랜 (1슬롯)]으로 변경되었습니다.`
                                  );
                                } else if (val === 'PRO') {
                                  handleUpdateUser(
                                    user.id, 
                                    { tier: 'PRO', role: 'USER', approvalStatus: 'APPROVED', addDays: 30 }, 
                                    `회원 #${user.id} (${user.name || user.nickname})님이 [PRO 플랜 (3슬롯, +30일)]으로 변경되었습니다.`
                                  );
                                } else if (val === 'VIP') {
                                  handleUpdateUser(
                                    user.id, 
                                    { tier: 'VIP', role: 'USER', approvalStatus: 'APPROVED', addDays: 30 }, 
                                    `회원 #${user.id} (${user.name || user.nickname})님이 [VIP 플랜 (9슬롯, +30일)]으로 변경되었습니다.`
                                  );
                                } else if (val === 'OPERATOR') {
                                  handleUpdateUser(
                                    user.id, 
                                    { 
                                      role: 'OPERATOR', 
                                      tier: 'VIP', 
                                      approvalStatus: 'APPROVED',
                                      addDays: 9999
                                    },
                                    `회원 #${user.id} (${user.name || user.nickname})님이 [운영자 (9슬롯, 마스터 권한)]으로 임명되었습니다.`
                                  );
                                } else if (val === 'USER') {
                                  handleUpdateUser(
                                    user.id, 
                                    { 
                                      role: 'USER', 
                                      tier: 'PRO', 
                                      approvalStatus: 'APPROVED',
                                      addDays: 30
                                    },
                                    `회원 #${user.id} (${user.name || user.nickname})님의 운영자 권한이 해제되어 [일반회원]으로 변경되었습니다.`
                                  );
                                }
                              }}
                              className={`rounded-xl px-2.5 py-1.5 text-xs font-bold border focus:outline-none cursor-pointer transition shadow-sm bg-slate-900 ${
                                isOperator 
                                  ? 'border-purple-500/60 text-purple-300 bg-purple-950/60'
                                  : isVip 
                                  ? 'border-amber-500/60 text-amber-300 bg-amber-950/60'
                                  : isPro 
                                  ? 'border-indigo-500/60 text-indigo-300 bg-indigo-950/60'
                                  : 'border-slate-700 text-slate-300 bg-slate-900'
                              }`}
                            >
                              <option value="FREE_TRIAL" className="bg-slate-900 text-slate-200">🟢 무료 (1슬롯)</option>
                              <option value="PRO" className="bg-slate-900 text-indigo-300">🔵 PRO 플랜 (3슬롯)</option>
                              <option value="VIP" className="bg-slate-900 text-amber-300">🟡 VIP 플랜 (9슬롯)</option>
                              {isDeveloper && (
                                <option value="OPERATOR" className="bg-slate-900 text-purple-300">👑 운영자 (9슬롯)</option>
                              )}
                              {isDeveloper && isOperator && (
                                <option value="USER" className="bg-slate-900 text-slate-400">⚪ 일반회원으로 전환</option>
                              )}
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

