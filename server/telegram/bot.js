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

    // 전략 엔진의 신호 이벤트 구독:
    // 📢 대표님 요청: 매매 활동 전체를 알리지 않고, 오직 각 슬롯에서 '매도' 완료 후 수익/손실율 및 금액만 알림!
    this.strategyEngine.onSignal(async (event) => {
      if (event.type === 'TRADE_EXECUTED' && event.signal?.type === 'SELL') {
        await this.sendSellSettlementAlert(event.signal, event.orderResult);
      }
    });

    // 텔레그램 폴링 시작 (명령어 조회 지원: /balance, /status 등)
    this.startPolling();
  }

  async sendMessage(text, replyMarkup = null) {
    if (!this.botToken || !this.chatId) return;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const body = {
        chat_id: this.chatId,
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
   * 💰 슬롯별 매도 완료 및 수익/손실 정산 전용 알림
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
`;

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
    // 2. 명령어 메시지 처리 (/balance, /status 등)
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;

      if (text === '/balance') {
        try {
          const accounts = await upbitClient.getAccounts();
          let balanceMsg = '<b>📊 실시간 업비트 잔고 현황</b>\n\n';
          accounts.forEach(acc => {
            if (Number(acc.balance) > 0 || Number(acc.locked) > 0) {
              balanceMsg += `• <b>${acc.currency}:</b> ${Number(acc.balance).toLocaleString()} (잠김: ${Number(acc.locked).toLocaleString()})\n`;
            }
          });
          await this.sendMessage(balanceMsg);
        } catch (err) {
          await this.sendMessage(`❌ 잔고 조회 실패: ${err.message}`);
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
        await this.sendMessage(msg);
      }
    }
  }
}

module.exports = new TelegramBotManager();
