import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, AlertCircle, KeyRound, Server } from 'lucide-react';

export default function UpbitGuideModal({ isOpen, onClose, serverIp = '49.171.41.10' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">업비트 Open API 발급 완벽 가이드</h3>
              <p className="text-sm text-slate-400 mt-0.5">3분 만에 안전하게 발급받고 자동매매를 시작하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 (폰트 +2pt 확대) */}
        <div className="py-4 space-y-4 overflow-y-auto text-sm text-slate-300 pr-1 flex-1">
          {/* 서버 IP 복사 박스 */}
          <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 p-4 rounded-xl border border-blue-500/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">업비트에 등록할 누리오 전용 서버 IP</span>
                <span className="font-mono font-bold text-base text-blue-300">{serverIp}</span>
              </div>
            </div>
            <button
              onClick={handleCopyIp}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shrink-0 shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사됨!' : 'IP 복사'}</span>
            </button>
          </div>

          {/* 스텝 1 */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">1</span>
              <span>업비트 PC 웹사이트 접속 및 로그인</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed pl-8">
              스마트폰 앱에서는 API 발급이 지원되지 않으므로, <strong>PC 브라우저</strong>로 업비트 홈페이지에 접속하여 로그인합니다.
            </p>
            <div className="pl-8 pt-1">
              <a
                href="https://upbit.com/mypage/open_api_management"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-bold text-xs sm:text-[13px]"
              >
                업비트 Open API 관리 페이지 바로가기 <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 스텝 2 (보안 권한 선택) */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">2</span>
              <span>권한 선택 (★ 가장 중요: 출금권한 절대 금지!)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-8 text-xs sm:text-[13px]">
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> ✅ 자산조회 (필수)
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> ✅ 주문조회 (필수)
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> ✅ 주문하기 (필수)
              </div>
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 font-extrabold flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400" /> 🚫 출금하기 (체크 금지!)
              </div>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-400 pl-8 leading-relaxed">
              💡 <strong>출금 권한을 제외</strong>하여 누리오 시스템은 오직 매매 주문만 집행하며, 회원의 자금을 외부로 출금할 수 없어 100% 안전합니다.
            </p>
          </div>

          {/* 스텝 3 (IP 등록) */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">3</span>
              <span>특정 IP 등록 및 2차 인증</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed pl-8">
              [특정 IP에서만 호출 허용] 옵션에 상단의 서버 IP (<code>{serverIp}</code>)를 붙여넣고, 카카오페이 2차 인증을 완료합니다.
            </p>
          </div>

          {/* 스텝 4 */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">4</span>
              <span>키 복사 후 등록 폼에 입력</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed pl-8">
              발급된 <strong>Access Key</strong>와 <strong>Secret Key</strong>를 복사하여 누리오 등록창에 입력하고 [연결 테스트]를 진행합니다.
            </p>
          </div>
        </div>

        {/* 하단 확인 버튼 */}
        <div className="pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/20"
          >
            가이드 확인 완료 (등록창으로 돌아가기)
          </button>
        </div>
      </div>
    </div>
  );
}
