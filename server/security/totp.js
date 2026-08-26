const { authenticator } = require('otplib');
const QRCode = require('qrcode');

// Microsoft Authenticator / Google Authenticator 표준 설정
authenticator.options = {
  step: 30,
  window: 1 // 시간 오차 ±30초 허용
};

/**
 * 새 2FA 시크릿 키 생성
 */
function generateSecret(userEmail = 'admin@nurioh.com') {
  const secret = authenticator.generateSecret();
  const serviceName = 'NURIOH Trader';
  const otpauth = authenticator.keyuri(userEmail, serviceName, secret);
  return { secret, otpauth };
}

/**
 * QR 코드 Data URL 생성
 */
async function generateQrCode(otpauthUrl) {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (err) {
    console.error('QR Code generation error:', err);
    throw err;
  }
}

/**
 * 사용자가 입력한 6자리 토큰 검증
 */
function verifyToken(token, secret) {
  try {
    return authenticator.check(token, secret);
  } catch (err) {
    console.error('2FA verification error:', err);
    return false;
  }
}

module.exports = {
  generateSecret,
  generateQrCode,
  verifyToken
};
