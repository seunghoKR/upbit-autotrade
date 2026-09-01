const axios = require('axios');
const config = require('../config');
const upbitClient = require('../upbit/upbitClient');
const userManager = require('../auth/userManager');

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

    // 📢 실시간 텔레그램 알림 시스템:
    // 거래 알림은 오직 [매도(익절/손절)] 체결 완료 시 해당 본인에게만 1:1로 발송됩니다.
    this.strategyEngine.onSignal(async (event) => {
      if (event.type === 'TRADE_EXECUTED' && event.signal?.type === 'SELL') {
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
   * 💰 슬롯별 매도 완료 및 수익/손실 정산 전용 알림 (해당 거래 본인에게만 1:1 전송)
   */
  async sendSellSettlementAlert(signal, orderResult) {
    const profitPct = Number(signal.profitPct || 0);
    const profitKrw = Number(signal.profitKrw || 0);
    const isProfit = profitPct >= 0;
    const profitEmoji = isProfit ? '🟢 [수익 실현 익절 완료]' : '🔴 [손실 제한 손절 완료]';
    const sign = isProfit ? '+' : '';
    const profitPctText = `${sign}${profitPct.toFixed(2)}%`;
    const profitKrwText = `${sign}${Math.round(profitKrw).toLocaleString()} KRW`;

    const userId = signal.userId || 1;
    const user = userManager.getUserProfile(userId);
    const userName = user?.name || user?.nickname || `회원 #${userId}`;

    const text = `
<b>${profitEmoji}</b>

👤 <b>계정:</b> <b>${userName}</b> (ID: ${userId})
🎰 <b>배정 슬롯:</b> <b>${signal.slotId || 1}번 슬롯 (${signal.slotName || '자동매매'})</b>
📌 <b>암호화폐:</b> <code>${signal.market}</code>
📈 <b>실현 수익률:</b> <b>${profitPctText}</b>
💵 <b>실현 손익금:</b> <b>${profitKrwText}</b>
🏷 <b>매수가 / 매도가:</b> ${Number(signal.entryPrice || 0).toLocaleString()}원 ➔ ${Number(signal.price || 0).toLocaleString()}원
⏱ <b>청산 시각:</b> ${new Date().toLocaleString('ko-KR')}

🚀 <i>누리오 트레이더(NURIOH TRADER) 실시간 정산 카드</i>
`;

    // 🎯 모든 거래 알림은 본인에게만 전송 (해당 유저의 telegramChatId 조회)
    const targetChatId = signal.telegramChatId || user?.telegramChatId;

    if (targetChatId) {
      await this.sendMessage(text, null, targetChatId);
    }
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

      // 텔레그램은 순수 알림 수신 채널로 동작: 사용자가 말을 걸면 Chat ID 연동 안내만 깔끔하게 제공
      const welcomeMsg = `
<b>🔔 누리오 트레이더 실시간 알림 채널</b>

안녕하세요, <b>${firstName}</b>님! 🚀
이 봇은 회원님의 <b>[매도 익절/손절 정산 카드]</b>를 1:1로 실시간 전달해 드리는 알림 전용 채널입니다.

📌 <b>회원님의 텔레그램 Chat ID:</b>
👉 <code>${chatId}</code> <i>(터치하여 복사)</i>

━━━━━━━━━━━━━━━━━━━
💡 <b>실시간 정산 알림 연동 방법:</b>
1. 위 Chat ID 번호(<code>${chatId}</code>)를 복사합니다.
2. 누리오 웹 대시보드 ➔ <b>[마이페이지] ➔ [텔레그램]</b> 탭에 붙여넣고 <b>[저장]</b>을 눌러주세요!

🎯 연동이 완료되면 회원님 계좌의 거래 정산 알림이 이곳으로 자동 발송됩니다.
`;
      await this.sendMessage(welcomeMsg, null, chatId);
    }
  }
}

module.exports = new TelegramBotManager();
