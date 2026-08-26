import React from 'react';
import { BookOpen, X, CheckCircle, Smartphone, Shield, Zap, Bell, HelpCircle } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl space-y-6">
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl bg-dark-bg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 타이틀 */}
        <div className="flex items-center gap-3 border-b border-dark-border pb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">누리오(NURIOH) 자동매매 시스템 사용 가이드</h2>
            <p className="text-xs text-slate-400">비즈니스 파트너를 위한 쉽고 안전한 트레이딩 솔루션</p>
          </div>
        </div>

        {/* 1. 기본 작동 메커니즘 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> 1. 자동 매매 & 승인 프로세스
          </h3>
          <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <b>시세 감시:</b> 프로그램이 업비트 1분봉 캔들과 RSI(과매도 30/과매수 70), 볼린저 밴드 지표를 실시간 분석합니다.
            </p>
            <p>
              • <b>신호 포착 & 알림:</b> 매수/매도 타이밍이 오면 대표님의 스마트폰 텔레그램으로 즉시 알림이 발송됩니다.
            </p>
            <p>
              • <b>대표님 최종 승인:</b> 텔레그램 또는 대시보드에서 <b>[✅ 승인]</b> 버튼을 누르셔야만 실제 업비트 주문이 실행됩니다. (대표님이 승인하지 않으면 절대 멋대로 주문되지 않아요!)
            </p>
          </div>
        </div>

        {/* 2. 원할 때만 알림 켜기 / 끄기 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <Bell className="w-4 h-4" /> 2. 알림 및 자동매매 시작 / 일시정지
          </h3>
          <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <b>대시보드에서 제어:</b> 상단 우측의 <b>[자동매매 가동 중 / 중지됨]</b> 스위치 버튼을 클릭하여 언제든 켜고 끌 수 있습니다.
            </p>
            <p>
              • <b>스마트폰 텔레그램에서 제어:</b> 텔레그램 채팅방(<code>@nurioh_trade_bot</code>)에 아래 명령어를 입력하세요:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-dark-card border border-dark-border">
                <span className="text-emerald-400 font-bold block">/start_bot</span>
                <span className="text-slate-400">자동매매 감시 시작</span>
              </div>
              <div className="p-2 rounded-xl bg-dark-card border border-dark-border">
                <span className="text-rose-400 font-bold block">/stop_bot</span>
                <span className="text-slate-400">감시 일시 정지 (알림 멈춤)</span>
              </div>
              <div className="p-2 rounded-xl bg-dark-card border border-dark-border">
                <span className="text-cyan-400 font-bold block">/balance</span>
                <span className="text-slate-400">업비트 실시간 잔고 조회</span>
              </div>
              <div className="p-2 rounded-xl bg-dark-card border border-dark-border">
                <span className="text-purple-400 font-bold block">/status</span>
                <span className="text-slate-400">현재 봇 설정 & 상태 확인</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 전략 파라미터 튜닝 안내 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> 3. 전략 설정 가이드
          </h3>
          <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>• <b>1회 매수 금액:</b> 업비트 최소 주문 금액인 5,000원 이상으로 설정 (연습 시 5,000원~10,000원 권장)</p>
            <p>• <b>RSI 기준치:</b> 매수(30 이하 권장, 과매도 구간 반등 노림), 매도(70 이상 권장, 과열 구간 익절)</p>
            <p>• <b>손절선 / 익절선:</b> -2.0% 도달 시 즉시 손절, +3.5% 도달 시 목표 익절 실행</p>
            <p>• <b>무응답 시 정책:</b> 텔레그램 승인 대기시간(30초) 초과 시 안전하게 취소하거나 자동 실행할지 선택</p>
          </div>
        </div>

        {/* 4. 철통 보안 2FA */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Shield className="w-4 h-4" /> 4. 보안 및 IP 화이트리스트
          </h3>
          <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>• 업비트 API 키는 <b>출금 권한이 전혀 없는</b> 안전한 조회/주문 전용 키를 사용합니다.</p>
            <p>• 스마트폰의 <b>Microsoft Authenticator</b> 앱으로 2FA를 활성화하면 관리자 보안이 완벽해집니다.</p>
          </div>
        </div>

        {/* 확인 완료 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
        >
          가이드 확인 완료 ✨
        </button>

      </div>
    </div>
  );
}
