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
  UserCog
} from 'lucide-react';
import { getAdminUsers, updateAdminUser } from '../services/api';

export default function AdminUserManagement({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL | OPERATOR | VIP | PRO | FREE | PENDING
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
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
        <div className="overflow-y-auto overflow-x-auto flex-1 rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="py-3 px-4">회원 실명 / 닉네임</th>
                <th className="py-3 px-3">연락처 / 이메일 (계정)</th>
                <th className="py-3 px-3">역할 / 등급</th>
                <th className="py-3 px-3">슬롯</th>
                <th className="py-3 px-3">승인 상태</th>
                <th className="py-3 px-3">구독 만료일</th>
                <th className="py-3 px-4 text-right">플랜 및 권한 변경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    해당 조건에 일치하는 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isOperator = user.role === 'OPERATOR';
                  const isVip = user.tier === 'VIP';
                  const isPro = user.tier === 'PRO';
                  const isPending = user.approvalStatus === 'PENDING';

                  return (
                    <tr key={user.id} className="hover:bg-slate-900/50 transition">
                      {/* 회원 실명 / 닉네임 */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'}
                            alt=""
                            className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{user.name || user.nickname}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({user.nickname})</span>
                              {isOperator && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold">
                                  운영자
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {user.kakaoId} ({user.birthyear || '1990'}년생)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 연락처 / 이메일 */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-200 block text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {user.phone || '010-0000-0000'}
                          </span>
                          <span className="text-[11px] font-mono text-indigo-300 font-semibold truncate block max-w-[170px] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-indigo-400" />
                            {user.email || '미등록'}
                          </span>
                        </div>
                      </td>

                      {/* 현재 등급 */}
                      <td className="py-3.5 px-3">
                        {isOperator ? (
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>운영자</span>
                          </span>
                        ) : (
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                            isVip 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : isPro
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {isVip && <Crown className="w-3 h-3" />}
                            {isPro && <Zap className="w-3 h-3" />}
                            <span>{isVip ? 'VIP 플랜' : isPro ? 'PRO 플랜' : '무료방문자'}</span>
                          </span>
                        )}
                      </td>

                      {/* 슬롯 개수 */}
                      <td className="py-3.5 px-3 font-semibold text-slate-300">
                        {user.maxSlots || (isVip ? 9 : isPro ? 3 : 1)}개 슬롯
                      </td>

                      {/* 승인 상태 */}
                      <td className="py-3.5 px-3">
                        {isPending ? (
                          <button
                            onClick={() => handleUpdateUser(user.id, { approvalStatus: 'APPROVED', addDays: 3 }, `회원 #${user.id}님의 이용이 승인되었습니다 (3일 무료체험 시작)!`)}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer animate-pulse"
                            title="클릭하여 무료 이용을 승인합니다"
                          >
                            <Clock className="w-3 h-3" />
                            <span>승인 대기 (클릭 승인)</span>
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>승인 완료</span>
                          </span>
                        )}
                      </td>

                      {/* 만료일 */}
                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-mono text-slate-200 block text-xs">
                            {user.subscriptionExpiresAt ? user.subscriptionExpiresAt.slice(0, 10) : '-'}
                          </span>
                          <span className={`text-[10px] font-bold ${user.remainingDays <= 1 ? 'text-rose-400' : 'text-yellow-400'}`}>
                            D-{user.remainingDays}일 남음
                          </span>
                        </div>
                      </td>

                      {/* 플랜 및 권한 변경 액션 */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 🟢 무료 전환/지정 버튼 */}
                          <button
                            onClick={() => handleUpdateUser(
                              user.id, 
                              { tier: 'FREE_TRIAL', role: 'USER', approvalStatus: 'APPROVED', addDays: 30 }, 
                              `회원 #${user.id} (${user.name || user.nickname})님이 [무료 플랜 (1슬롯)]으로 변경되었습니다.`
                            )}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              (!isOperator && user.tier === 'FREE_TRIAL')
                                ? 'bg-slate-700 text-white border-slate-500 ring-2 ring-slate-400 shadow-md font-black'
                                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                            }`}
                            title="무료 플랜 지정 (1슬롯, 30일)"
                          >
                            {(!isOperator && user.tier === 'FREE_TRIAL') && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                            <span>무료 (1슬롯)</span>
                          </button>

                          {/* 🔵 PRO 플랜 지정 버튼 */}
                          <button
                            onClick={() => handleUpdateUser(
                              user.id, 
                              { tier: 'PRO', role: 'USER', approvalStatus: 'APPROVED', addDays: 30 }, 
                              `회원 #${user.id} (${user.name || user.nickname})님이 [PRO 플랜 (3슬롯, +30일)]으로 변경되었습니다.`
                            )}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              (!isOperator && isPro)
                                ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/20 font-black'
                                : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/60 hover:text-white'
                            }`}
                            title="PRO 플랜 지정 (3슬롯, +30일)"
                          >
                            {(!isOperator && isPro) ? (
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            ) : (
                              <Zap className="w-3 h-3 text-indigo-400" />
                            )}
                            <span>PRO (3슬롯)</span>
                          </button>

                          {/* 🟡 VIP 플랜 지정 버튼 */}
                          <button
                            onClick={() => handleUpdateUser(
                              user.id, 
                              { tier: 'VIP', role: 'USER', approvalStatus: 'APPROVED', addDays: 30 }, 
                              `회원 #${user.id} (${user.name || user.nickname})님이 [VIP 플랜 (9슬롯, +30일)]으로 변경되었습니다.`
                            )}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              (!isOperator && isVip)
                                ? 'bg-amber-500 text-black border-amber-300 ring-2 ring-amber-400 shadow-lg shadow-amber-500/25 font-black'
                                : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/60 hover:text-amber-100'
                            }`}
                            title="VIP 플랜 지정 (9슬롯, +30일)"
                          >
                            {(!isOperator && isVip) ? (
                              <Check className="w-3 h-3 text-black stroke-[3]" />
                            ) : (
                              <Crown className="w-3 h-3 text-amber-400" />
                            )}
                            <span>VIP (9슬롯)</span>
                          </button>

                          {/* 🟣 운영자 지정/해제 버튼 (개발자 전용 권한) */}
                          {isDeveloper && (
                            <button
                              onClick={() => handleUpdateUser(
                                user.id, 
                                { 
                                  role: isOperator ? 'USER' : 'OPERATOR', 
                                  tier: isOperator ? 'PRO' : 'VIP', 
                                  approvalStatus: 'APPROVED',
                                  addDays: isOperator ? 30 : 9999
                                },
                                `회원 #${user.id} (${user.name || user.nickname})님의 권한이 [${isOperator ? '일반회원' : '운영자 (9슬롯, 마스터 권한)'}]으로 변경되었습니다.`
                              )}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                                isOperator
                                  ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400 shadow-lg shadow-purple-500/30 font-black'
                                  : 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:bg-purple-900/60 hover:text-white'
                              }`}
                              title={isOperator ? '운영자 권한 해제' : '운영자로 임명 (9슬롯, 전략 및 회원관리 권한 부여)'}
                            >
                              {isOperator ? (
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              ) : (
                                <Shield className="w-3 h-3 text-purple-400" />
                              )}
                              <span>{isOperator ? '운영자' : '운영자 지정'}</span>
                            </button>
                          )}
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

