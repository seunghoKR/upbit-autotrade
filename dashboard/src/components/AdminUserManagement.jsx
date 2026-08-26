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
  PlusCircle, 
  Search,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';
import { getAdminUsers, updateUserTier, toggleUserActive } from '../services/api';

export default function AdminUserManagement({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminUsers();
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

  const handleTierChange = async (userId, newTier, addDays = 30) => {
    try {
      await updateUserTier(userId, newTier, addDays);
      setActionSuccess(`회원 #${userId}님의 등급이 ${newTier}(+${addDays}일)로 변경되었습니다.`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadUsers();
    } catch (err) {
      alert('등급 변경 실패: ' + err.message);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await toggleUserActive(userId);
      loadUsers();
    } catch (err) {
      alert('상태 변경 실패: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.nickname && u.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phone && u.phone.includes(searchTerm)) ||
    (u.kakaoId && u.kakaoId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-6xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-indigo-500/30 text-amber-400 rounded-xl">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                👑 마스터 대표님 전용 회원 관리 센터
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">
                  Super Admin
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                인증 회원 실명, 연락처, 출생연도, 유료 등급 승급(Free/Pro/VIP), 구독 기간 연장 및 API 상태를 총괄 제어합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 상단 통계 & 검색 바 */}
        <div className="py-4 space-y-3 shrink-0">
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* 통계 요약 */}
            <div className="flex gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 mr-1.5">총 인증 회원:</span>
                <span className="font-bold text-slate-200">{users.length}명</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 mr-1.5">유료 VIP/Pro:</span>
                <span className="font-bold text-amber-400">
                  {users.filter(u => u.tier === 'VIP' || u.tier === 'PRO').length}명
                </span>
              </div>
            </div>

            {/* 검색창 */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="실명, 닉네임, 연락처, 카카오 ID 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 회원 테이블 영역 */}
        <div className="overflow-y-auto overflow-x-auto flex-1 rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">회원 실명 / 닉네임</th>
                <th className="py-3 px-3">연락처 / 이메일</th>
                <th className="py-3 px-3">현재 등급</th>
                <th className="py-3 px-3">슬롯</th>
                <th className="py-3 px-3">구독 만료일</th>
                <th className="py-3 px-3">API 키</th>
                <th className="py-3 px-3">상태</th>
                <th className="py-3 px-4 text-right">등급 승급 & 연장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => {
                const isVip = user.tier === 'VIP';
                const isPro = user.tier === 'PRO';

                return (
                  <tr key={user.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'}
                          alt=""
                          className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            {user.name || user.nickname}
                            <span className="text-[10px] text-slate-400 font-normal">({user.nickname})</span>
                            {user.role === 'ADMIN' && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                                마스터
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{user.kakaoId} ({user.birthyear || '1990'}년생)</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-200 block text-xs flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {user.phone || '010-0000-0000'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block max-w-[140px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {user.email || '-'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        isVip 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : isPro
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {user.tier}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-300">
                      {user.maxSlots}개 슬롯
                    </td>

                    <td className="py-3 px-3">
                      {user.role === 'ADMIN' ? (
                        <span className="text-emerald-400 font-bold">무제한 평생</span>
                      ) : (
                        <div>
                          <span className="font-mono text-slate-200 block">
                            {user.subscriptionExpiresAt ? user.subscriptionExpiresAt.slice(0, 10) : '-'}
                          </span>
                          <span className="text-[10px] text-yellow-400 font-bold">
                            D-{user.remainingDays}일 남음
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {user.hasApiKey ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> 연동완료
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">미등록</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        disabled={user.role === 'ADMIN'}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                          user.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        }`}
                      >
                        {user.isActive ? '정상 활성' : '정지됨'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {user.role !== 'ADMIN' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleTierChange(user.id, 'PRO', 30)}
                            className="px-2 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold transition"
                            title="Pro 승급 (+30일)"
                          >
                            Pro +30일
                          </button>
                          <button
                            onClick={() => handleTierChange(user.id, 'VIP', 30)}
                            className="px-2 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white text-[11px] font-semibold transition"
                            title="VIP 승급 (+30일)"
                          >
                            VIP +30일
                          </button>
                          <button
                            onClick={() => handleTierChange(user.id, user.tier, 90)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                            title="기간만 90일 연장"
                          >
                            +90일
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
