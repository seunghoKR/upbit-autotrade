import React, { useState } from 'react';
import { X, Crown, Check, Zap, Sparkles, Flame, Copy, CheckCheck, Send } from 'lucide-react';

export default function PricingModal({ isOpen, onClose, currentTier = 'FREE_TRIAL', remainingDays = 7 }) {
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const bankAccount = '국민은행 123-456-789012 (예금주: 누리오)';

  const handleCopyBank = () => {
    navigator.clipboard.writeText(bankAccount);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const plans = [
    {
      id: 'FREE_TRIAL',
      name: '무료 체험 (Free Trial)',
      price: '0원',
      period: '3일간 무료',
      description: '누리오 자동매매 엔진을 직접 경험해 보세요',
      slots: '1개 주력 슬롯',
      badge: '기본 제공',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      features: [
        '1개 단일 슬롯 (BTC 등 자유 선택)',
        '운영자 검증 추천전략 자동 적용',
        '텔레그램 실시간 매매 결과 알림',
        '웹 대시보드 실시간 잔고 연동'
      ],
      isPopular: false
    },
    {
      id: 'PRO',
      name: '프로 (Pro Trader)',
      price: '1,000,000원',
      period: '월 구독',
      description: '3개 슬롯 분산 투자와 트레일링 스탑으로 안정적 수익 극대화',
      slots: '3개 독립 슬롯 분산 가동',
      badge: '가장 인기 👍',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      features: [
        '3개 멀티 슬롯 동시 운영 (BTC/ETH/SOL 등)',
        '실시간 전종목 급등 스캔 엔진',
        '셀프 커스텀 전략 (익절/손절/콜백 조절)',
        '개별 슬롯 즉시 시장가 매도 기능',
        '슬롯별 누적 거래 통계 리포트'
      ],
      isPopular: true
    },
    {
      id: 'VIP',
      name: '최고급 마스터 (VIP Elite)',
      price: '2,000,000원',
      period: '월 구독',
      description: '9개 슬롯(3x3 풀그리드) 전체 개방으로 압도적 분산 수익 실현',
      slots: '9개 슬롯 풀 가동 (3x3 완벽분산)',
      badge: '최고급 플랜 👑',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      features: [
        '9개 슬롯 전체 풀 가동 (대형/알트/급등 3x3 분산)',
        '초단타 급등 스캘핑 엔진 풀가동',
        '셀프 & 추천 전략 하이브리드 운용',
        '원클릭 Panic Sell & 개별 슬롯 긴급 매도',
        '1:1 전용 기술지원 & VIP 전용 서버 배정'
      ],
      isPopular: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* 상단 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="text-center pb-4 border-b border-slate-800 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> 누리오 트레이더 멤버십 플랜
          </div>
          <h3 className="text-xl font-bold text-slate-100">
            더 많은 슬롯과 고성능 알고리즘으로 수익을 확장하세요
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            현재 회원님의 이용 상태: <strong className="text-yellow-400">{currentTier}</strong> (잔여: <strong>{remainingDays}일</strong>)
          </p>
        </div>

        {/* 플랜 3종 카드 그리드 */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-1 flex-1">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-950/50'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* 상단 뱃지 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        현재 이용중
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-100">{plan.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{plan.description}</p>
                  </div>

                  <div className="pt-2">
                    <div className="text-2xl font-extrabold text-white">
                      {plan.price}
                      <span className="text-xs font-normal text-slate-400 ml-1.5">/ {plan.period}</span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-400 mt-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{plan.slots}</span>
                    </div>
                  </div>

                  {/* 기능 목록 */}
                  <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 하단 신청 영역 */}
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <button
                    onClick={handleCopyBank}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      plan.isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>{plan.id === 'FREE_TRIAL' ? '기본 이용' : `${plan.name} 신청 및 연장`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 입금 및 결제 안내 푸터 */}
        <div className="pt-4 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-slate-400 block text-[11px]">구독 신청 및 입금 계좌 안내:</span>
            <span className="font-bold text-slate-200 font-mono text-sm">{bankAccount}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyBank}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1.5"
            >
              {copiedBank ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedBank ? '계좌 복사됨!' : '계좌번호 복사'}</span>
            </button>
            <a
              href="https://t.me/nurioh_trade_bot"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>텔레그램 입금 확인</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
