/**
 * NURIOH TRADER - Web Audio API 기반 초경량 실시간 사운드 효과음 엔진
 * 별도의 무거운 오디오 파일(mp3) 다운로드 없이 브라우저 내장 오실레이터 주파수 합성으로 0.001초 즉각 재생
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.storageKey = 'nurioh_sound_enabled';
  }

  // AudioContext 초기화 (사용자 인터랙션 후 활성화)
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // 사운드 활성화 여부 확인 (기본값: true)
  isEnabled() {
    return localStorage.getItem(this.storageKey) !== 'false';
  }

  // 사운드 활성화/비활성화 토글 및 저장
  setEnabled(enabled) {
    localStorage.setItem(this.storageKey, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('nurioh_sound_toggle', { detail: { enabled } }));
  }

  // 톤 생성 헬퍼 함수
  playTone(freq, type = 'sine', duration = 0.15, startTime = 0, gainLevel = 0.1) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, ctx.currentTime + startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration + 0.05);
    } catch (e) {
      console.warn('Audio tone play failed:', e);
    }
  }

  // 1. 급등 포착 경보음 (긴박하고 세련된 2단 비프음)
  playSurgeAlert() {
    if (!this.isEnabled()) return;
    this.playTone(880, 'sine', 0.12, 0, 0.12);
    this.playTone(1320, 'sine', 0.18, 0.1, 0.15);
  }

  // 2. 3초 카운트다운 째깍 비프음
  playCountdownBeep(count = 3) {
    if (!this.isEnabled()) return;
    const freq = count === 1 ? 1200 : 800;
    this.playTone(freq, 'triangle', 0.08, 0, 0.1);
  }

  // 3. 자동 매수 체결음 (경쾌한 3단 상승 차임)
  playBuyAlert() {
    if (!this.isEnabled()) return;
    this.playTone(523.25, 'sine', 0.1, 0, 0.1);
    this.playTone(659.25, 'sine', 0.1, 0.08, 0.12);
    this.playTone(783.99, 'sine', 0.22, 0.16, 0.15);
  }

  // 4. 익절 매도 승리 챠링 사운드 (도-미-솔-도 화려한 4단 아르페지오)
  playProfitAlert() {
    if (!this.isEnabled()) return;
    this.playTone(523.25, 'sine', 0.12, 0, 0.12);
    this.playTone(659.25, 'sine', 0.12, 0.09, 0.13);
    this.playTone(783.99, 'sine', 0.12, 0.18, 0.14);
    this.playTone(1046.50, 'sine', 0.35, 0.27, 0.18);
  }

  // 5. 손절 방어 매도 경보음 (차분한 2단 저음)
  playLossAlert() {
    if (!this.isEnabled()) return;
    this.playTone(440, 'triangle', 0.15, 0, 0.1);
    this.playTone(329.63, 'triangle', 0.25, 0.12, 0.12);
  }

  // 샘플 테스트 미리듣기
  testSound(type) {
    const prev = this.isEnabled();
    localStorage.setItem(this.storageKey, 'true');

    if (type === 'SURGE') this.playSurgeAlert();
    else if (type === 'BUY') this.playBuyAlert();
    else if (type === 'PROFIT') this.playProfitAlert();
    else if (type === 'LOSS') this.playLossAlert();
    else if (type === 'COUNTDOWN') this.playCountdownBeep(1);

    if (!prev) {
      setTimeout(() => localStorage.setItem(this.storageKey, 'false'), 500);
    }
  }
}

export const soundService = new SoundService();
export default soundService;
