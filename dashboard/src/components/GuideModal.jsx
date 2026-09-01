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
            <Zap className="w-4 h-4" /> 1. 100% 완전 자동 매매 프로세스
          </h3>
          <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <b>24시간 시세 감시:</b> 마스터 엔진이 업비트 전종목 실시간 틱 데이터, 1분봉 캔들, RSI 및 볼린저 밴드 지표를 상시 분석합니다.
            </p>
            <p>
              • <b>100% 즉시 자동 주문:</b> 설정된 전략 조건(급등 포착 또는 지표 충족)이 감지되면 사용자 승인 대기 없이 <b>0.1초 만에 즉시 시장가 자동 매수</b>가 집행됩니다.
            </p>
            <p>
              • <b>트레일링 익절 & 손절:</b> 목표 수익률 도달 후 최고점 대비 하락 시(트레일링 스탑) 또는 최대 손절선 도달 시 알아서 전량 매도하여 수익을 실현합니다.
            </p>
          </div>
        </div>

        {/* 2. 원할 때만 알림 켜기 / 끄기 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <Bell className="w-4 h-4" /> 2. 슬롯별 자동매매 제어 & 스마트 정산 알림
          </h3>
          <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <b>사용자 슬롯 제어:</b> 대시보드 <b>[멀티 슬롯 매니저]</b>에서 각 슬롯의 <b>[ON/OFF 스위치]</b>를 켜거나 꺼서 언제든 원하는 슬롯만 자유롭게 자동매매를 가동할 수 있습니다.
            </p>
            <p>
              • <b>1:1 스마트 정산 알림:</b> 불필요한 시세 감시 스팸 알림을 배제하고, 오직 <b>[매도(익절/손절) 완료 시]</b> 실현 수익률(%)과 실현 손익금(KRW) 정산 카드가 텔레그램으로 1:1 발송됩니다.
            </p>
          </div>
        </div>

        {/* 3. 전략 파라미터 튜닝 안내 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> 3. 전략 설정 가이드
          </h3>
          <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>• <b>1회 매수 금액:</b> 업비트 최소 주문 금액인 5,000원 이상으로 설정 (연습 시 5,000원~10,000원 권장)</p>
            <p>• <b>급등 감시 / 상승률:</b> 최근 5초~30초간 일정 상승률 이상 돌파 시 즉시 추격 매수 진입</p>
            <p>• <b>손절선 / 목표 익절선:</b> -2.0% 도달 시 즉시 손절, +3.0% 이상 도달 시 트레일링 익절 추적 시작</p>
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
