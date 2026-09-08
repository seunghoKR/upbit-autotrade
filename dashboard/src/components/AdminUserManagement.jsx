import React, { useState, useEffect, useMemo } from 'react';
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
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  SlidersHorizontal,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { getAdminUsers, updateAdminUser, sendTelegramTestMessage, confirmUserDeposit } from '../services/api';

// ⚡ 초고속 체감 로딩을 위한 모듈 레벨 메모리 캐시
let cachedAdminUsers = [];

export default function AdminUserManagement({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState(cachedAdminUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState('ALL'); // ALL | NAME | PHONE | EMAIL | TELEGRAM | KAKAO
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL | OPERATOR | VIP | PRO | FREE | PENDING | EXPIRED
  const [telegramFilter, setTelegramFilter] = useState('ALL'); // ALL | LINKED | UNLINKED
  const [sortBy, setSortBy] = useState('LATEST'); // LATEST | NAME_ASC | EXPIRY_ASC | EXPIRY_DESC | ID_ASC
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(cachedAdminUsers.length === 0);
  const [actionSuccess, setActionSuccess] = useState('');
  const [testingTelegramUserId, setTestingTelegramUserId] = useState(null);

  const isDeveloper = currentUser?.role === 'DEVELOPER' || currentUser?.role === 'ADMIN';

  const loadUsers = async (silent = false) => {
    if (!silent && (!users || users.length === 0)) {
      setIsLoading(true);
    }
    try {
      const res = await getAdminUsers(currentUser?.role || 'DEVELOPER');
      if (res && Array.isArray(res.users)) {
        setUsers(res.users);
        cachedAdminUsers = res.users;
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers(false);
    }
  }, [isOpen]);

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

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchTarget('ALL');
    setSelectedFilter('ALL');
    setTelegramFilter('ALL');
    setSortBy('LATEST');
    setCurrentPage(1);
  };

  // 1. 다각도 검색 및 상태 필터링
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const isOperator = u.role === 'OPERATOR';
      const isExpired = u.approvalStatus === 'EXPIRED' || (!isOperator && u.role !== 'DEVELOPER' && u.remainingDays <= 0 && Boolean(u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) < new Date()));

      // 등급/상태 탭 필터
      if (selectedFilter === 'OPERATOR' && !isOperator) return false;
      if (selectedFilter === 'VIP' && (u.tier !== 'VIP' || isOperator)) return false;
      if (selectedFilter === 'PRO' && (u.tier !== 'PRO' || isOperator)) return false;
      if (selectedFilter === 'FREE' && (u.tier !== 'FREE_TRIAL' || isOperator)) return false;
      if (selectedFilter === 'PENDING' && u.approvalStatus !== 'PENDING') return false;
      if (selectedFilter === 'EXPIRED' && !isExpired) return false;

      // 텔레그램 연동 필터
      if (telegramFilter === 'LINKED' && !u.hasTelegram) return false;
      if (telegramFilter === 'UNLINKED' && u.hasTelegram) return false;

      // 다각도 검색 필터
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        if (searchTarget === 'NAME') {
          const nameMatch = (u.name && u.name.toLowerCase().includes(term)) || (u.nickname && u.nickname.toLowerCase().includes(term));
          if (!nameMatch) return false;
        } else if (searchTarget === 'PHONE') {
          if (!u.phone || !u.phone.includes(term)) return false;
        } else if (searchTarget === 'EMAIL') {
          if (!u.email || !u.email.toLowerCase().includes(term)) return false;
        } else if (searchTarget === 'TELEGRAM') {
          if (!u.telegramId || !String(u.telegramId).toLowerCase().includes(term)) return false;
        } else if (searchTarget === 'KAKAO') {
          if (!u.kakaoId || !String(u.kakaoId).toLowerCase().includes(term)) return false;
        } else {
          // 통합 검색 (ALL)
          const match = 
            (u.name && u.name.toLowerCase().includes(term)) ||
            (u.nickname && u.nickname.toLowerCase().includes(term)) ||
            (u.phone && u.phone.includes(term)) ||
            (u.email && u.email.toLowerCase().includes(term)) ||
            (u.kakaoId && String(u.kakaoId).toLowerCase().includes(term)) ||
            (u.telegramId && String(u.telegramId).toLowerCase().includes(term));
          if (!match) return false;
        }
      }

      return true;
    });
  }, [users, selectedFilter, telegramFilter, searchTerm, searchTarget]);

  // 2. 다각도 정렬
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (sortBy === 'NAME_ASC') {
        const nameA = a.name || a.nickname || '';
        const nameB = b.name || b.nickname || '';
        return nameA.localeCompare(nameB, 'ko');
      }
      if (sortBy === 'EXPIRY_ASC') {
        const expA = a.subscriptionExpiresAt ? new Date(a.subscriptionExpiresAt).getTime() : 9999999999999;
        const expB = b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt).getTime() : 9999999999999;
        return expA - expB;
      }
      if (sortBy === 'EXPIRY_DESC') {
        const expA = a.subscriptionExpiresAt ? new Date(a.subscriptionExpiresAt).getTime() : 0;
        const expB = b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt).getTime() : 0;
        return expB - expA;
      }
      if (sortBy === 'ID_ASC') {
        return a.id - b.id;
      }
      // 기본: LATEST (최신 등록 / ID 역순)
      return b.id - a.id;
    });
  }, [filteredUsers, sortBy]);

  // 3. 페이지네이션 계산
  const totalItems = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // 페이지 번호 배열 생성 (최대 5개)
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, validCurrentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const isFilterActive = searchTerm.trim() !== '' || searchTarget !== 'ALL' || selectedFilter !== 'ALL' || telegramFilter !== 'ALL' || sortBy !== 'LATEST';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-[1400px] w-full p-4 sm:p-6 shadow-2xl relative overflow-hidden max-h-[94vh] flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
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
              onClick={() => loadUsers(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 알림 배너 */}
        {actionSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* 1행: 등급 / 상태별 필터 탭 */}
        <div className="pt-3 pb-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0 border-b border-slate-800/60 custom-scrollbar text-xs">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              onClick={() => { setSelectedFilter('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-200 text-slate-900 shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              전체 ({users.length})
            </button>

            <button
              onClick={() => { setSelectedFilter('OPERATOR'); setCurrentPage(1); }}
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
              onClick={() => { setSelectedFilter('VIP'); setCurrentPage(1); }}
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
              onClick={() => { setSelectedFilter('PRO'); setCurrentPage(1); }}
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
              onClick={() => { setSelectedFilter('FREE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                selectedFilter === 'FREE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-950 text-emerald-400 border border-slate-800 hover:bg-emerald-950/30'
              }`}
            >
              무료회원 ({users.filter(u => u.tier === 'FREE_TRIAL' && u.role !== 'OPERATOR').length})
            </button>

            <button
              onClick={() => { setSelectedFilter('PENDING'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'PENDING'
                  ? 'bg-rose-600 text-white shadow animate-pulse'
                  : 'bg-slate-950 text-rose-400 border border-slate-800 hover:bg-rose-950/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>승인 대기 ({users.filter(u => u.approvalStatus === 'PENDING').length})</span>
            </button>

            <button
              onClick={() => { setSelectedFilter('EXPIRED'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'EXPIRED'
                  ? 'bg-rose-900 text-rose-200 shadow border border-rose-600'
                  : 'bg-slate-950 text-rose-300/80 border border-slate-800 hover:bg-rose-950/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>만료 ({users.filter(u => u.approvalStatus === 'EXPIRED' || (u.role !== 'OPERATOR' && u.role !== 'DEVELOPER' && u.remainingDays <= 0 && Boolean(u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) < new Date()))).length})</span>
            </button>
          </div>

          {/* 초기화 버튼 */}
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 border border-slate-700"
              title="검색 및 필터 조건 초기화"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>초기화</span>
            </button>
          )}
        </div>

        {/* 2행: 다각도 검색 및 상세 옵션 바 */}
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          {/* 다각도 검색 컨트롤 */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[280px]">
            {/* 검색 대상 선택 드롭다운 */}
            <div className="relative shrink-0">
              <select
                value={searchTarget}
                onChange={(e) => { setSearchTarget(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">🔍 통합 검색</option>
                <option value="NAME">👤 실명 / 닉네임</option>
                <option value="PHONE">📱 연락처</option>
                <option value="EMAIL">✉️ 이메일</option>
                <option value="TELEGRAM">✈️ 텔레그램 ID</option>
                <option value="KAKAO">💬 카카오 계정</option>
              </select>
            </div>

            {/* 검색어 인풋 */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  searchTarget === 'NAME' ? '회원 실명 또는 닉네임 입력...' :
                  searchTarget === 'PHONE' ? '전화번호 검색 (예: 010)...' :
                  searchTarget === 'EMAIL' ? '이메일 주소 검색...' :
                  searchTarget === 'TELEGRAM' ? '텔레그램 Chat ID 검색...' :
                  searchTarget === 'KAKAO' ? '카카오 식별자 검색...' :
                  '실명, 닉네임, 연락처, 이메일, 텔레그램 통합 검색...'
                }
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium placeholder:text-slate-600"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 우측 옵션: 텔레그램 연동 여부 / 정렬 / 페이지당 건수 */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* 텔레그램 연동 필터 */}
            <select
              value={telegramFilter}
              onChange={(e) => { setTelegramFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950 border border-slate-800 text-slate-300 font-medium rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">✈️ 텔레그램 전체</option>
              <option value="LINKED">🟢 텔레그램 연동 회원</option>
              <option value="UNLINKED">⚪ 텔레그램 미연동</option>
            </select>

            {/* 정렬 드롭다운 */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-0.5">
              <ArrowUpDown className="w-3 h-3 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-300 font-medium py-1 text-xs focus:outline-none cursor-pointer border-0"
              >
                <option value="LATEST" className="bg-slate-900">최신 등록순</option>
                <option value="NAME_ASC" className="bg-slate-900">이름 가나다순</option>
                <option value="EXPIRY_ASC" className="bg-slate-900">만료 임박순</option>
                <option value="EXPIRY_DESC" className="bg-slate-900">만료 여유순</option>
                <option value="ID_ASC" className="bg-slate-900">회원 번호순</option>
              </select>
            </div>

            {/* 페이지당 보기 건수 */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-0.5">
              <span className="text-slate-500 text-[11px]">보기:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-slate-300 font-bold py-1 text-xs focus:outline-none cursor-pointer border-0"
              >
                <option value="10" className="bg-slate-900">10명씩</option>
                <option value="20" className="bg-slate-900">20명씩</option>
                <option value="50" className="bg-slate-900">50명씩</option>
              </select>
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
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Search className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-400">조건에 일치하는 회원이 없습니다.</p>
                      <p className="text-xs text-slate-600">검색어나 선택된 필터 조건을 확인해보세요.</p>
                      {isFilterActive && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>검색 및 필터 초기화</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
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
                                  <span>운영자</span>
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

                          {/* 🔽 플랜/역할 관리 메뉴 */}
                          <div className="relative inline-block">
                            {isOperator && !isDeveloper ? (
                              /* 🔒 운영자 모드에서는 운영자 등급 변경 불가 (고정 뱃지 표시) */
                              <div 
                                className="px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/50 text-purple-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
                                title="운영자 등급은 개발자만 관리할 수 있습니다"
                              >
                                <Crown className="w-3.5 h-3.5 text-purple-400" />
                                <span>👑 운영자</span>
                              </div>
                            ) : (
                              /* 🔽 플랜 변경 펼침 메뉴 (Dropdown Select) */
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
                                      `회원 #${user.id} (${user.name || user.nickname})님이 [운영자]로 임명되었습니다.`
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
                                {isOperator && (
                                  <option value="OPERATOR" className="bg-slate-900 text-purple-300">👑 운영자</option>
                                )}
                                {isDeveloper && !isOperator && (
                                  <option value="OPERATOR" className="bg-slate-900 text-purple-300">👑 운영자로 임명</option>
                                )}
                                {isDeveloper && isOperator && (
                                  <option value="USER" className="bg-slate-900 text-slate-400">⚪ 일반회원으로 전환</option>
                                )}
                              </select>
                            )}
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

        {/* 하단 페이지네이션 컨트롤 바 */}
        <div className="pt-3 mt-1 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 shrink-0 text-xs text-slate-400">
          {/* 좌측: 총 건수 및 현재 표시 범위 */}
          <div className="flex items-center gap-2">
            <span>
              총 <strong className="text-slate-200 font-bold">{totalItems}</strong>명 중{' '}
              {totalItems > 0 ? (
                <>
                  <span className="text-indigo-400 font-bold">{startIndex + 1}</span>
                  {' ~ '}
                  <span className="text-indigo-400 font-bold">{endIndex}</span>명 표시
                </>
              ) : (
                '0명'
              )}
            </span>
            {isFilterActive && (
              <span className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                (필터 적용 중)
              </span>
            )}
          </div>

          {/* 중앙: 페이지 번호 이동 버튼들 */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* 맨 처음 페이지 */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className={`p-1.5 rounded-lg border transition ${
                  validCurrentPage === 1
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                }`}
                title="맨 처음 페이지"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* 이전 페이지 */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className={`p-1.5 rounded-lg border transition ${
                  validCurrentPage === 1
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                }`}
                title="이전 페이지"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* 페이지 번호 목록 */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-[30px] rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      pageNum === validCurrentPage
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* 다음 페이지 */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className={`p-1.5 rounded-lg border transition ${
                  validCurrentPage === totalPages
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                }`}
                title="다음 페이지"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* 맨 마지막 페이지 */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className={`p-1.5 rounded-lg border transition ${
                  validCurrentPage === totalPages
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                }`}
                title="맨 마지막 페이지"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 우측: 현재 페이지 / 전체 페이지 안내 */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              페이지 <strong className="text-slate-200 font-bold">{validCurrentPage}</strong> / {totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

