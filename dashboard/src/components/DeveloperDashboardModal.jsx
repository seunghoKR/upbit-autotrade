import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Server, 
  ShieldCheck, 
  Users, 
  Crown, 
  RefreshCw, 
  Check, 
  Copy, 
  Cpu, 
  HardDrive, 
  Radio, 
  Zap, 
  AlertTriangle,
  UserCheck,
  UserX,
  Search
} from 'lucide-react';
import { getAdminUsers, updateUserRole, getSystemStatus } from '../services/api';

export default function DeveloperDashboardModal({ isOpen, onClose, serverIp = '49.171.41.10' }) {
  const [users, setUsers] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statusRes] = await Promise.all([
        getAdminUsers().catch(() => ({ users: [] })),
        getSystemStatus().catch(() => null)
      ]);

      if (usersRes && usersRes.users) {
        setUsers(usersRes.users);
      }
      if (statusRes && statusRes.infrastructure) {
        setSysStatus(statusRes.infrastructure);
      }
    } catch (err) {
      console.error('Failed to load developer dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 개발자가 회원을 운영자(ADMIN)로 지정하거나 해제
  const handleToggleRole = async (userId, currentRole, userName) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionText = newRole === 'ADMIN' ? '운영자(ADMIN)로 승격' : '운영자 권한 해제(일반회원)';

    if (!window.confirm(`[${userName}] 님을 ${actionText} 하시겠습니까?`)) {
      return;
    }

    try {
      await updateUserRole(userId, newRole);
      setActionSuccess(`회원 #${userId} [${userName}] 님이 ${newRole === 'ADMIN' ? '👑 사이트 운영자(ADMIN)' : '일반 회원'}로 지정되었습니다.`);
      setTimeout(() => setActionSuccess(''), 4000);
      loadData();
    } catch (err) {
      alert('권한 변경 실패: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.nickname && u.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phone && u.phone.includes(searchTerm)) ||
    (u.kakaoId && u.kakaoId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/70 rounded-2xl max-w-6xl w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 rounded-2xl shadow-md">
              <Wrench className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
                  🛠️ 개발자 전용 시스템 & 운영자 지정 콘솔
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold font-mono">
                  DEVELOPER ROOT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                서버 인프라, 네트워크 지연 모니터링 및 <strong>사이트 운영자(관리자) 권한 임명/해제</strong>를 총괄 제어합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
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

        {/* 본문 스크롤 영역 */}
        <div className="py-5 space-y-5 overflow-y-auto pr-1 flex-1 text-xs text-slate-300">
          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* 1. 서버 인프라 & 네트워크 상태 (개발자용으로 이전) */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-indigo-500/40 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-slate-100 text-sm">서버 인프라 & 네트워크 상태 (Host Environment)</h4>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                SYSTEM HEALTHY ✅
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[11px]">파이 노드 PC 전용 서버</span>
                <span className="font-mono text-emerald-400 font-bold block text-sm">
                  {sysStatus?.pm2Status || 'PM2 Online (무중단 가동중)'}
                </span>
                <span className="text-[10px] text-slate-500">Node {sysStatus?.nodeVersion || process.version}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-[11px]">업비트 등록 공인 IP</span>
                  <button
                    onClick={handleCopyIp}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '복사됨' : '복사'}</span>
                  </button>
                </div>
                <span className="font-mono text-blue-300 font-bold block text-sm">{serverIp}</span>
                <span className="text-[10px] text-slate-500">Fixed Static WAN IP</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[11px]">업비트 WebSocket 실시간 지연</span>
                <span className="font-mono text-cyan-300 font-bold block text-sm">
                  {sysStatus?.upbitLatencyMs || 14}ms (초고속 반응)
                </span>
                <span className="text-[10px] text-slate-500">밀리초 틱 스트리밍</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[11px]">Cloudflare Tunnel 연결</span>
                <span className="font-mono text-emerald-400 font-bold block text-sm">
                  {sysStatus?.cloudflareTunnel || 'QUIC Incheon(ICN06) 활성'}
                </span>
                <span className="text-[10px] text-slate-500">WSS 보안 터널링</span>
              </div>
            </div>
          </div>

          {/* 2. 👑 개발자 권한: 사이트 운영자(관리자) 지정 및 관리 패널 */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    사이트 운영자(관리자) 권한 지정 및 임명 관리
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    개발자가 지정한 회원은 <strong>[👑 운영자 비즈니스 대시보드]</strong>에 접근하여 입금 승인 및 회원을 관리할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="회원 이름 또는 연락처 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* 회원 목록 및 운영자 지정 테이블 */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">회원 실명 / 닉네임</th>
                    <th className="py-3 px-3">연락처</th>
                    <th className="py-3 px-3">현재 역할(Role)</th>
                    <th className="py-3 px-3">멤버십 등급</th>
                    <th className="py-3 px-3">슬롯 권한</th>
                    <th className="py-3 px-4 text-right">운영자(관리자) 지정 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => {
                    const isAdmin = user.role === 'ADMIN';

                    return (
                      <tr key={user.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={user.profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'}
                              alt=""
                              className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                {user.name || user.nickname}
                                <span className="text-[10px] text-slate-400 font-normal">({user.nickname})</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{user.kakaoId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-300 text-xs">
                          {user.phone || '010-0000-0000'}
                        </td>

                        <td className="py-3 px-3">
                          {isAdmin ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 w-fit">
                              <Crown className="w-3 h-3 text-amber-400" />
                              사이트 운영자 (ADMIN)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-medium w-fit">
                              일반 사용자 (USER)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-xs text-indigo-300">
                            {user.tier}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-300">
                          {user.maxSlots}개 슬롯
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => handleToggleRole(user.id, user.role, user.name || user.nickname)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1 ml-auto cursor-pointer"
                              title="운영자 권한을 회수하고 일반 회원으로 전환합니다"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>운영자 해제</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleRole(user.id, user.role, user.name || user.nickname)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-md cursor-pointer"
                              title="이 회원을 사이트 운영자(관리자)로 임명합니다"
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span>👑 운영자로 지정</span>
                            </button>
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
      </div>
    </div>
  );
}
