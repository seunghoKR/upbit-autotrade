import React, { useState, useEffect } from 'react';
import { Shield, X, Check, Key } from 'lucide-react';
import { get2FASetup, verify2FA } from '../services/api';

export default function TwoFactorModal({ isOpen, onClose, onSuccess }) {
  const [setupData, setSetupData] = useState(null);
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSetup();
    }
  }, [isOpen]);

  const loadSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await get2FASetup();
      setSetupData(data);
    } catch (err) {
      setError('2FA 설정 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpToken.length !== 6) {
      return setError('6자리 숫자를 입력해 주세요.');
    }

    try {
      setLoading(true);
      setError('');
      const res = await verify2FA(otpToken);
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || '인증에 실패했습니다. 다시 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl bg-dark-bg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Microsoft Authenticator 연동</h2>
            <p className="text-xs text-slate-400">2단계 인증 (2FA) 보안 활성화</p>
          </div>
        </div>

        {loading && !setupData ? (
          <div className="py-12 text-center text-xs text-slate-400">보안 키 생성 중...</div>
        ) : (
          <div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              대표님 스마트폰의 <b>Microsoft Authenticator</b> 앱을 열고, 아래 QR 코드를 스캔해 주세요!
            </p>

            {/* QR 코드 */}
            {setupData?.qrCodeUrl && (
              <div className="flex justify-center my-4">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-40 h-40" />
                </div>
              </div>
            )}

            {/* 시크릿 키 텍스트 */}
            {setupData?.secret && (
              <div className="bg-dark-bg p-2.5 rounded-xl border border-dark-border mb-4 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">직접 입력 시크릿 키:</span>
                <code className="text-xs font-mono font-bold text-emerald-400 select-all">
                  {setupData.secret}
                </code>
              </div>
            )}

            {/* 6자리 OTP 입력 폼 */}
            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">앱에 표시된 6자리 인증 번호</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-xl tracking-widest font-mono font-bold bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {error && (
                <div className="text-xs text-rose-400 text-center font-medium">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || otpToken.length !== 6}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? '검증 중...' : '인증 완료 및 활성화'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
