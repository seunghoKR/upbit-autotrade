/**
 * ⏰ 누리오(NURIOH) 한국 표준시(KST, UTC+9) 기반 신규 매수 제한 시간대 판별 서비스
 * 
 * 기능:
 * 1. 24시간제(00:00 ~ 23:59) 기반 다중 시간대(최대 3개) 관리
 * 2. 자정 초과 시간대(예: 23:00 ~ 02:00) 완벽 지원
 * 3. 개별 슬롯 ON/OFF 스위치 지원
 * 4. 활성화 시간대에는 신규 매수(Buy)만 일절 차단, 기존 보유 코인 매도(Sell)는 100% 정상 가동
 */

export const DEFAULT_BUY_TIME_BLOCKS = [
  { id: 1, enabled: true, label: '아침 장 시작 급락 방어 (추천)', start: '08:50', end: '09:30' },
  { id: 2, enabled: false, label: '야간 미증시 개장 변동성 방어', start: '22:30', end: '23:30' },
  { id: 3, enabled: false, label: '심야 거래량 급감 노이즈 방어', start: '02:00', end: '05:00' }
];

/**
 * 브라우저 로컬 시각에 구애받지 않고 항상 정확한 한국 표준시(KST, UTC+9) Date 객체 및 정보 반환
 */
export function getKoreaTime() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  
  const h = kst.getHours();
  const m = kst.getMinutes();
  const s = kst.getSeconds();

  const pad = (n) => String(n).padStart(2, '0');

  return {
    date: kst,
    hours: h,
    minutes: m,
    seconds: s,
    totalMinutes: h * 60 + m,
    timeString: `${pad(h)}:${pad(m)}:${pad(s)}`,
    hmString: `${pad(h)}:${pad(m)}`
  };
}

/**
 * 특정 시간 블록(HH:mm ~ HH:mm)이 현재 KST 시각에 해당하는지 검사 (자정 넘는 시간대 지원)
 */
export function isBlockActive(block, curMinutes) {
  if (!block || !block.enabled || !block.start || !block.end) return false;
  
  const [sH, sM] = String(block.start).split(':').map(Number);
  const [eH, eM] = String(block.end).split(':').map(Number);

  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return false;

  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;

  if (startMin <= endMin) {
    // 일반 주간 시간대 (예: 08:50 ~ 09:30)
    return curMinutes >= startMin && curMinutes <= endMin;
  } else {
    // 자정을 넘어가는 야간/심야 시간대 (예: 23:00 ~ 01:30)
    return curMinutes >= startMin || curMinutes <= endMin;
  }
}

/**
 * 전체 시간 블록 목록을 평가하여 현재 신규 매수가 제한되는지 여부 반환
 * @param {Array} blocks 
 * @returns {{ isRestricted: boolean, activeBlock: Object|null, kstTimeStr: string }}
 */
export function checkBuyRestricted(blocks) {
  const targetBlocks = Array.isArray(blocks) && blocks.length > 0 ? blocks : DEFAULT_BUY_TIME_BLOCKS;
  const kstInfo = getKoreaTime();

  for (const block of targetBlocks) {
    if (isBlockActive(block, kstInfo.totalMinutes)) {
      return {
        isRestricted: true,
        activeBlock: block,
        kstTimeStr: kstInfo.timeString
      };
    }
  }

  return {
    isRestricted: false,
    activeBlock: null,
    kstTimeStr: kstInfo.timeString
  };
}
