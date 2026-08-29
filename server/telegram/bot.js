const axios = require('axios');
const config = require('../config');
const upbitClient = require('../upbit/upbitClient');

class TelegramBotManager {
  constructor() {
    this.botToken = config.TELEGRAM.BOT_TOKEN;
    this.chatId = config.TELEGRAM.CHAT_ID;
    this.lastUpdateId = 0;
    this.pollingInterval = null;
    this.strategyEngine = null;
  }

  init(strategyEngine) {
    this.strategyEngine = strategyEngine;

    // 📢 3단계 실시간 텔레그램 알림 시스템:
    // 1단계: 🚨 급등 발견 알림 (3초 후 매수 예고)
    // 2단계: ✅ 3초 후 매수 체결 알림
    // 3단계: 🎉 익절/손절 조건 만족 시 매도 체결 및 정산 알림
    this.strategyEngine.onSignal(async (event) => {
      if (event.type === 'SURGE_DISCOVERED') {
        const surge = event.surgeInfo || {};
        const text = `
<b>🚨 [누리오 트레이더] 급등 코인 포착 알림</b>

🎰 <b>배정 슬롯:</b> <b>${event.slotId}번 슬롯</b>
📌 <b>암호화폐:</b> <code>${event.market}</code>
⚡ <b>포착 사유:</b> ${surge.reason || '급등 조건 도달'}
💵 <b>현재가:</b> ${Number(surge.currentPrice || 0).toLocaleString()} KRW
⏳ <b>진행:</b> <b>3초 후 시장가 자동 매수가 집행됩니다!</b>

🚀 <i>누리오 AI 트레이더 급등 레이더</i>
`;
        await this.sendMessage(text);
      } else if (event.type === 'TRADE_EXECUTED' && event.signal?.type === 'BUY') {
        const sig = event.signal;
        const text = `
<b>✅ [누리오 트레이더] 매수 체결 완료</b>

🎰 <b>배정 슬롯:</b> <b>${sig.slotId || 1}번 슬롯 (${sig.slotName || '자동매매'})</b>
📌 <b>암호화폐:</b> <code>${sig.market}</code>
💵 <b>체결 단가:</b> ${Number(sig.price || 0).toLocaleString()} KRW
💰 <b>매수 총액:</b> ${Number(sig.amount || 0).toLocaleString()} KRW
🎯 <b>감시 모드:</b> <b>실시간 트레일링 스탑 익절 가동 시작 🟢</b>

🚀 <i>누리오 트레이더(NURIOH TRADER)</i>
`;
        await this.sendMessage(text);
      } else if (event.type === 'TRADE_EXECUTED' && event.signal?.type === 'SELL') {
        await this.sendSellSettlementAlert(event.signal, event.orderResult);
      }
    });

    // 텔레그램 폴링 시작 (명령어 조회 지원: /balance, /status 등)
    this.startPolling();
  }

  async sendMessage(text, replyMarkup = null, targetChatId = null) {
    const destChatId = targetChatId || this.chatId;
    if (!this.botToken || !destChatId) return;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const body = {
        chat_id: destChatId,
        text,
        parse_mode: 'HTML'
      };
      if (replyMarkup) body.reply_markup = replyMarkup;

      const res = await axios.post(url, body);
      return res.data;
    } catch (err) {
      console.error('Telegram sendMessage error:', err.response?.data || err.message);
    }
  }

  /**
   * 💰 슬롯별 매도 완료 및 수익/손실 정산 전용 알림 (운영자/관리자 전송)
   */
  async sendSellSettlementAlert(signal, orderResult) {
    const profitPct = Number(signal.profitPct || 0);
    const profitKrw = Number(signal.profitKrw || 0);
    const isProfit = profitPct >= 0;
    const profitEmoji = isProfit ? '🟢 [수익 실현 익절 완료]' : '🔴 [손실 제한 손절 완료]';
    const sign = isProfit ? '+' : '';
    const profitPctText = `${sign}${profitPct.toFixed(2)}%`;
    const profitKrwText = `${sign}${Math.round(profitKrw).toLocaleString()} KRW`;

    const text = `
<b>${profitEmoji}</b>

🎰 <b>배정 슬롯:</b> <b>${signal.slotId || 1}번 슬롯 (${signal.slotName || '자동매매'})</b>
📌 <b>암호화폐:</b> <code>${signal.market}</code>
📈 <b>실현 수익률:</b> <b>${profitPctText}</b>
💵 <b>실현 손익금:</b> <b>${profitKrwText}</b>
🏷 <b>매수가 / 매도가:</b> ${Number(signal.entryPrice || 0).toLocaleString()}원 ➔ ${Number(signal.price || 0).toLocaleString()}원
⏱ <b>청산 시각:</b> ${new Date().toLocaleString('ko-KR')}

🚀 <i>누리오 트레이더(NURIOH TRADER) 실시간 정산 카드</i>
`;

    // 기본 관리자 및 등록된 운영자들에게 정산 카드 발송
    await this.sendMessage(text);
  }

  /**
   * 텔레그램 실시간 폴링 (Callback Query & Commands)
   */
  startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=5`;
        const res = await axios.get(url, { timeout: 10000 });

        if (res.data?.ok && res.data.result.length > 0) {
          for (const update of res.data.result) {
            this.lastUpdateId = update.update_id;
            await this.handleUpdate(update);
          }
        }
      } catch (err) {
        // Network timeout is normal in long polling
      }
    }, 2000);
  }

  async handleUpdate(update) {
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;
      const firstName = update.message.from?.first_name || '회원';

      if (text.startsWith('/start') || text === '/help' || text === '/chatid' || text.toLowerCase() === '@userinfobot' || text.toLowerCase() === 'u') {
        const welcomeMsg = `
<b>🤖 누리오 매매비서 (@nurioh_trade_bot)</b>

안녕하세요, <b>${firstName}</b>님! 🚀
누리오 트레이더(NURIOH TRADER) 자동매매 봇입니다.

📌 <b>회원님의 텔레그램 Chat ID:</b>
👉 <code>${chatId}</code> <i>(터치하여 복사)</i>

━━━━━━━━━━━━━━━━━━━
💡 <b>대시보드 연동 방법:</b>
1. 위 Chat ID 번호(<code>${chatId}</code>)를 복사합니다.
2. 누리오 AI 트레이더 웹 대시보드에 접속합니다.
3. 상단 <b>[마이페이지] ➔ [텔레그램]</b> 탭에서 붙여넣고 <b>[저장]</b>을 눌러주세요!

📊 <b>지원 명령어:</b>
• <code>/status</code> - 24시간 실시간 감시 봇 상태 조회
• <code>/balance</code> - 업비트 실계좌 잔고 조회
• <code>/start</code> - 내 Chat ID 및 도움말 확인
━━━━━━━━━━━━━━━━━━━
`;
        await this.sendMessage(welcomeMsg, null, chatId);
      } else if (text === '/balance') {
        try {
          const accounts = await upbitClient.getAccounts();
          let balanceMsg = '<b>📊 실시간 업비트 잔고 현황</b>\n\n';
          accounts.forEach(acc => {
            if (Number(acc.balance) > 0 || Number(acc.locked) > 0) {
              balanceMsg += `• <b>${acc.currency}:</b> ${Number(acc.balance).toLocaleString()} (잠김: ${Number(acc.locked).toLocaleString()})\n`;
            }
          });
          await this.sendMessage(balanceMsg, null, chatId);
        } catch (err) {
          await this.sendMessage(`❌ 잔고 조회 실패: ${err.message}`, null, chatId);
        }
      } else if (text === '/status') {
        const isRunning = this.strategyEngine ? this.strategyEngine.isRunning : false;
        const msg = `
<b>🤖 NURIOH 자동매매 봇 상태</b>

• <b>상태:</b> ${isRunning ? '🟢 24시간 실시간 감시 중' : '🔴 일시 정지'}
• <b>알림 모드:</b> 🎯 매도 정산 알림만 발송 (스팸 방지)
• <b>급등 감시 주기:</b> ${this.strategyEngine?.settings?.SURGE_CHECK_SECONDS || 5}초
• <b>목표 익절선:</b> +${this.strategyEngine?.settings?.TRAILING_TARGET_PROFIT_PCT || 3.0}%
• <b>최대 손절선:</b> -${this.strategyEngine?.settings?.STOP_LOSS_PCT || 2.0}%
`;
        await this.sendMessage(msg, null, chatId);
      }
    }
  }
}

module.exports = new TelegramBotManager();
