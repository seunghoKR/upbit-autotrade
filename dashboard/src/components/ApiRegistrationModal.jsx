import React, { useState } from 'react';
import { X, KeyRound, Copy, Check, ExternalLink, ShieldCheck, Zap, AlertTriangle, BookOpen, Lock } from 'lucide-react';

export default function ApiRegistrationModal({ 
  isOpen, 
  onClose, 
  onOpenGuide, 
  onRegisterSuccess,
  userId = 1,
  serverIp = '49.171.41.10' 
}) {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [copiedIp, setCopiedIp] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    if (!accessKey.trim() || !secretKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Access Key와 Secret Key를 모두 입력해 주세요.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      if (onRegisterSuccess) {
        await onRegisterSuccess(accessKey.trim(), secretKey.trim());
      }
      setStatusMessage({ type: 'success', text: '🎉 업비트 API 연동 성공! 계좌 자산 조회가 정상 확인되었습니다.' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.error || err.message || 'API 키 인증에 실패했습니다. 키와 서버 IP 등록을 확인해 주세요.' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* 상단 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              업비트 Open API 키 등록
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> AES-256 암호화
              </span>
            </h3>
            <p className="text-xs text-slate-400">회원님의 업비트 계좌에서 자동 주문을 집행하기 위한 키를 등록합니다.</p>
          </div>
        </div>

        {/* 안내 툴바 (IP 복사 & 발급 가이드 버튼) */}
        <div className="py-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* 발급 방법 안내 버튼 */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>📖 업비트 API 발급방법 가이드</span>
            </button>

            {/* 서버 IP 복사 버튼 */}
            <button
              type="button"
              onClick={handleCopyIp}
              className="py-2 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>서버 IP ({serverIp}) 복사</span>
            </button>
          </div>

          {/* 상태 메시지 알림 */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* API 입력 폼 */}
          <form onSubmit={handleTestAndSave} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Access Key <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="업비트에서 발급받은 Access Key 입력"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Secret Key <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                placeholder="업비트에서 발급받은 Secret Key 입력"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1 text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 안심 보안 약속
              </p>
              <p>• 출금 권한이 없는 키만 등록되므로 자금 인출이 원천 차단됩니다.</p>
              <p>• 회원의 모든 키는 서버 내 `AES-256-GCM`으로 최고 수준 암호화 보관됩니다.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isTesting}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  isTesting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{isTesting ? '업비트 통신 검증 테스트 중...' : '⚡ API 연결 테스트 및 안전 등록하기'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
