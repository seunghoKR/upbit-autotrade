/**
 * NURIOH TRADER - Asynchronous Order Queue (비동기 스마트 주문 큐)
 * 
 * [제안서 1부 핵심 요구사항 반영]
 * 1. 업비트 주문 API Rate Limit (초당 8회) 완벽 우회 및 보호
 * 2. 다발적 매수/매도 신호 발생 시 병목(Blocking) 없이 비동기 FIFO 및 우선순위 큐 처리
 * 3. 긴급 청산 / 손절 주문은 최우선순위(High Priority)로 즉각 승격 처리
 */

const upbitClient = require('../upbit/upbitClient');

class OrderQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.minIntervalMs = 130; // 초당 최대 약 7.6회로 제한 (업비트 주문 초당 8회 안전 마진)
    this.lastProcessedTime = 0;
    this.listeners = new Set();
  }

  onOrderEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('OrderQueue listener error:', err);
      }
    }
  }

  /**
   * 주문 큐에 신규 주문 삽입
   * @param {Object} orderTask - { type: 'BUY'|'SELL', slotId, market, price, volume, amount, reason, priority: 'HIGH'|'NORMAL' }
   */
  enqueue(orderTask) {
    return new Promise((resolve, reject) => {
      const taskWrapper = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        task: orderTask,
        priority: orderTask.priority || (orderTask.type === 'SELL' ? 'HIGH' : 'NORMAL'),
        enqueuedAt: Date.now(),
        resolve,
        reject
      };

      // 긴급 매도/손절(HIGH)은 큐 앞단(우선순위)에 삽입, 일반 매수는 후단에 삽입
      if (taskWrapper.priority === 'HIGH') {
        const firstNormalIndex = this.queue.findIndex(item => item.priority !== 'HIGH');
        if (firstNormalIndex === -1) {
          this.queue.push(taskWrapper);
        } else {
          this.queue.splice(firstNormalIndex, 0, taskWrapper);
        }
      } else {
        this.queue.push(taskWrapper);
      }

      console.log(`📥 [OrderQueue] 주문 접수 [${taskWrapper.priority}] Slot ${orderTask.slotId} ${orderTask.type} ${orderTask.market} (대기열: ${this.queue.length}건)`);
      this.emit({ type: 'ORDER_ENQUEUED', taskWrapper, queueLength: this.queue.length });

      this.processNext();
    });
  }

  /**
   * 큐 순차 처리 엔진
   */
  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const item = this.queue.shift();
    if (!item) {
      this.isProcessing = false;
      return;
    }

    // Rate Limit 대기 시간 계산
    const now = Date.now();
    const elapsed = now - this.lastProcessedTime;
    const waitTime = Math.max(0, this.minIntervalMs - elapsed);

    if (waitTime > 0) {
      await new Promise(r => setTimeout(r, waitTime));
    }

    try {
      this.lastProcessedTime = Date.now();
      const { task } = item;
      console.log(`⚡ [OrderQueue 집행 시작] Slot ${task.slotId} ${task.type} ${task.market} | 사유: ${task.reason}`);

      let result;
      if (task.type === 'BUY') {
        // 시장가 매수
        const amountKrw = Math.max(Number(task.amount || task.tradeAmountKrw || 5000), 5000);
        result = await upbitClient.order(task.market, 'bid', null, amountKrw, 'price');
      } else if (task.type === 'SELL') {
        // 시장가 매도
        result = await upbitClient.order(task.market, 'ask', task.volume, null, 'market');
      } else {
        throw new Error(`알 수 없는 주문 유형: ${task.type}`);
      }

      console.log(`✅ [OrderQueue 집행 완료] Slot ${task.slotId} ${task.type} ${task.market} | 주문ID: ${result?.uuid || 'LOCAL'}`);
      this.emit({ type: 'ORDER_SUCCESS', task, result, queueLength: this.queue.length });
      item.resolve(result);
    } catch (err) {
      console.error(`❌ [OrderQueue 집행 실패] Slot ${item.task.slotId} ${item.task.market}:`, err.message);
      this.emit({ type: 'ORDER_FAILED', task: item.task, error: err.message, queueLength: this.queue.length });
      item.reject(err);
    } finally {
      this.isProcessing = false;
      // 다음 대기 주문이 있으면 비동기 루프로 연속 처리
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  /**
   * 특정 마켓이나 슬롯의 대기 주문 취소 (예: Sustain Check 실패로 드롭할 때)
   */
  dropPendingOrder(predicate) {
    const dropped = [];
    this.queue = this.queue.filter(item => {
      const match = predicate(item.task);
      if (match) {
        dropped.push(item);
        item.reject(new Error('Sustain Check 검증 실패 또는 주문 취소로 큐에서 드롭됨'));
      }
      return !match;
    });

    if (dropped.length > 0) {
      console.log(`🗑️ [OrderQueue] 주문 ${dropped.length}건 드롭 완료 (남은 대기열: ${this.queue.length}건)`);
    }
    return dropped.length;
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      pendingTasks: this.queue.map(q => ({
        id: q.id,
        slotId: q.task.slotId,
        type: q.task.type,
        market: q.task.market,
        priority: q.priority,
        enqueuedAt: q.enqueuedAt
      }))
    };
  }
}

module.exports = new OrderQueue();
