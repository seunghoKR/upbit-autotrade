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

    // 전략 엔진의 신호 이벤트 구독
    this.strategyEngine.onSignal(async (event) => {
      if (event.type === 'TRADE_SIGNAL') {
        await this.sendApprovalRequest(event.signal);
      } else if (event.type === 'TRADE_EXECUTED') {
        await this.sendTradeExecuted(event.signal, event.orderResult);
      } else if (event.type === 'SIGNAL_CANCELLED') {
        await this.sendMessage(`⚠️ [주문 취소] 신호 ${event.signalId}가 취소되었습니다.\n사유: ${event.reason}`);
      }
    });

    // 텔레그램 폴링 시작 (대표님의 버튼 클릭 및 명령어를 실시간 감지)
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
   * 매매 승인 요청 메시지 발송 (인라인 키보드 버튼 포함)
   */
  async sendApprovalRequest(signal) {
    const isBuy = signal.type === 'BUY';
    const actionEmoji = isBuy ? '⚡ [업비트 전종목 실시간 급등 포착!]' : '💰 [트레일링 스탑 이익 실현 매도]';
    const amountText = isBuy 
      ? `<b>💵 주문 금액:</b> ${Number(signal.amount).toLocaleString()} KRW` 
      : `<b>📦 매도 수량:</b> ${signal.volume}`;

    const text = `
<b>${actionEmoji}</b>

<b>📌 암호화폐:</b> <code>${signal.market}</code>
<b>🎰 배정 슬롯:</b> <b>슬롯 ${signal.slotId}번</b>
<b>💰 현재 체결가:</b> ${Number(signal.price).toLocaleString()} KRW
<b>💡 포착 사유:</b> ${signal.reason}
${amountText}

⏱ <b>승인 대기:</b> ${signal.timeoutSeconds}초 이내에 결정해 주세요!
<i>(무응답 시 정책: ${this.strategyEngine.settings.AUTO_EXECUTE_ON_TIMEOUT ? '자동 주문 실행 ⚡' : '주문 자동 취소 ❌'})</i>
`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '✅ 즉시 승인 및 주문 실행', callback_data: `APPROVE:${signal.id}` },
          { text: '❌ 주문 반려/취소', callback_data: `REJECT:${signal.id}` }
        ]
      ]
    };

    await this.sendMessage(text, replyMarkup);
  }

  /**
   * 체결 완료 알림
   */
  async sendTradeExecuted(signal, orderResult) {
    const text = `
🎉 <b>[주문 체결 완료]</b>

<b>📌 마켓:</b> ${signal.market}
<b>⚡ 구분:</b> ${signal.type === 'BUY' ? '매수 (BID)' : '매도 (ASK)'}
<b>💰 기준 가격:</b> ${Number(signal.price).toLocaleString()} KRW
<b>🆔 주문 번호:</b> <code>${orderResult?.uuid || 'N/A'}</code>
<b>⏰ 체결 시각:</b> ${new Date().toLocaleTimeString()}

시스템이 안정적으로 포지션을 기록했습니다! ✨
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
    // 1. 대표님이 버튼을 눌렀을 때 (Callback Query)
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data;

      if (data.startsWith('APPROVE:')) {
        const signalId = data.split(':')[1];
        try {
          await this.strategyEngine.approveSignal(signalId);
          await this.answerCallbackQuery(cb.id, '✅ 매매 주문을 승인했습니다!');
          await this.sendMessage(`👍 대표님께서 신호 <b>${signalId}</b>의 주문을 <b>[승인]</b>하셨습니다.`);
        } catch (err) {
          await this.answerCallbackQuery(cb.id, `오류: ${err.message}`);
        }
      } else if (data.startsWith('REJECT:')) {
        const signalId = data.split(':')[1];
        this.strategyEngine.rejectSignal(signalId, '대표님 직접 취소');
        await this.answerCallbackQuery(cb.id, '❌ 주문을 취소했습니다.');
        await this.sendMessage(`🚫 대표님께서 신호 <b>${signalId}</b>의 주문을 <b>[취소]</b>하셨습니다.`);
      } else if (data === 'CHECK_BALANCE') {
        await this.handleBalanceCommand();
        await this.answerCallbackQuery(cb.id, '잔고 조회 완료!');
      }
      return;
    }

    // 2. 대표님이 채팅으로 명령어를 입력했을 때 (Message)
    if (update.message && update.message.text) {
      const text = update.message.text.trim();

      if (text === '/balance' || text === '잔고') {
        await this.handleBalanceCommand();
      } else if (text === '/status' || text === '상태') {
        await this.handleStatusCommand();
      } else if (text === '/start_bot') {
        this.strategyEngine.start();
        await this.sendMessage('🚀 <b>[영자 트레이딩 봇 가동]</b> 자동매매 모니터링이 시작되었습니다!');
      } else if (text === '/stop_bot') {
        this.strategyEngine.stop();
        await this.sendMessage('🛑 <b>[영자 트레이딩 봇 중지]</b> 자동매매 모니터링이 일시 정지되었습니다.');
      } else if (text === '/help' || text === '/start') {
        const helpText = `
👋 <b>안녕하세요 대표님! AI 비서 영자예요~</b> 💖

사용 가능한 명령어 목록:
• <code>/balance</code> : 업비트 원화 및 코인 잔고 조회
• <code>/status</code> : 현재 봇 가동 상태 및 최근 시세/지표
• <code>/start_bot</code> : 자동매매 실시간 감시 시작
• <code>/stop_bot</code> : 자동매매 실시간 감시 일시정지
`;
        await this.sendMessage(helpText);
      }
    }
  }

  async answerCallbackQuery(callbackQueryId, text) {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
      await axios.post(url, { callback_query_id: callbackQueryId, text });
    } catch (err) {
      console.error('answerCallbackQuery error:', err.message);
    }
  }

  async handleBalanceCommand() {
    try {
      const accounts = await upbitClient.getAccounts();
      if (!accounts || accounts.length === 0) {
        return await this.sendMessage('📊 잔고 정보가 비어있습니다.');
      }

      let balanceText = '<b>📊 [업비트 실시간 계좌 잔고]</b>\n\n';
      for (const acc of accounts) {
        const balance = Number(acc.balance).toLocaleString();
        const locked = Number(acc.locked).toLocaleString();
        const avgBuy = Number(acc.avg_buy_price).toLocaleString();

        balanceText += `• <b>${acc.currency}</b>: ${balance} (묶임: ${locked})\n`;
        if (acc.currency !== 'KRW' && Number(acc.avg_buy_price) > 0) {
          balanceText += `   평단가: ${avgBuy} KRW\n`;
        }
      }

      await this.sendMessage(balanceText);
    } catch (err) {
      await this.sendMessage(`⚠️ 잔고 조회 실패: ${err.error?.message || err.message}`);
    }
  }

  async handleStatusCommand() {
    const isRunning = this.strategyEngine.isRunning;
    const settings = this.strategyEngine.settings;

    const text = `
<b>🤖 [영자의 봇 실시간 상태]</b>

• <b>엔진 상태:</b> ${isRunning ? '🟢 정상 가동 중 (Running)' : '🔴 일시 중지 (Stopped)'}
• <b>감시 마켓:</b> ${settings.DEFAULT_MARKET}
• <b>1회 매수금액:</b> ${settings.DEFAULT_TRADE_AMOUNT.toLocaleString()} KRW
• <b>RSI 설정:</b> 과매도(${settings.RSI_BUY_THRESHOLD}) / 과매수(${settings.RSI_SELL_THRESHOLD})
• <b>손절/익절:</b> -${settings.STOP_LOSS_PCT}% / +${settings.TAKE_PROFIT_PCT}%
• <b>승인 대기시간:</b> ${settings.APPROVAL_TIMEOUT_SECONDS}초
`;
    await this.sendMessage(text);
  }
}

module.exports = new TelegramBotManager();
