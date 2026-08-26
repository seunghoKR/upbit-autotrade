const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const querystring = require('querystring');
const config = require('../config');

class UpbitClient {
  constructor(accessKey = config.UPBIT.ACCESS_KEY, secretKey = config.UPBIT.SECRET_KEY) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.serverUrl = config.UPBIT.SERVER_URL;
  }

  /**
   * 업비트 API 인증용 JWT 토큰 생성 (SHA-512 Query Hash 지원)
   */
  getAuthToken(queryParams = null, customAccessKey = null, customSecretKey = null) {
    const accessKey = customAccessKey || this.accessKey;
    const secretKey = customSecretKey || this.secretKey;

    const payload = {
      access_key: accessKey,
      nonce: uuidv4()
    };

    if (queryParams && Object.keys(queryParams).length > 0) {
      const query = querystring.stringify(queryParams);
      const hash = crypto.createHash('sha512');
      const queryHash = hash.update(query, 'utf-8').digest('hex');

      payload.query_hash = queryHash;
      payload.query_hash_alg = 'SHA512';
    }

    return `Bearer ${jwt.sign(payload, secretKey)}`;
  }

  /**
   * 사용자 정의 API 키 유효성 검증 테스트 (자산 조회 테스트)
   */
  async validateCustomKeys(accessKey, secretKey) {
    try {
      const token = this.getAuthToken(null, accessKey, secretKey);
      const response = await axios.get(`${this.serverUrl}/accounts`, {
        headers: { Authorization: token },
        timeout: 5000
      });
      return {
        isValid: true,
        accountsCount: response.data?.length || 0,
        accounts: response.data
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      return {
        isValid: false,
        error: errorMsg
      };
    }
  }

  /**
   * 전체 계좌 잔고 조회
   */
  async getAccounts() {
    try {
      const token = this.getAuthToken();
      const response = await axios.get(`${this.serverUrl}/accounts`, {
        headers: { Authorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Upbit getAccounts Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * 업비트 KRW 전체 마켓 목록 조회 (약 120개 전종목)
   */
  async getAllKrwMarkets() {
    try {
      const response = await axios.get(`${this.serverUrl}/market/all?isDetails=false`);
      const krwMarkets = response.data
        .filter(m => m.market.startsWith('KRW-'))
        .map(m => m.market);
      console.log(`🌐 업비트 원화(KRW) 전체 마켓 ${krwMarkets.length}개 로드 완료!`);
      return krwMarkets;
    } catch (error) {
      console.error('Upbit getAllKrwMarkets Error:', error.message);
      return [
        'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-SOL', 'KRW-DOGE', 
        'KRW-ADA', 'KRW-AVAX', 'KRW-DOT', 'KRW-NEAR', 'KRW-SUI', 
        'KRW-SHIB', 'KRW-PEPE', 'KRW-STX', 'KRW-LINK', 'KRW-ETC'
      ];
    }
  }

  /**
   * 현재가 정보 조회 (여러 마켓 가능)
   * @param {string} markets 예: 'KRW-BTC,KRW-ETH'
   */
  async getTicker(markets = 'KRW-BTC') {
    try {
      const response = await axios.get(`${this.serverUrl}/ticker?markets=${markets}`);
      return response.data;
    } catch (error) {
      console.error('Upbit getTicker Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * 분봉 캔들 조회
   * @param {string} market 예: 'KRW-BTC'
   * @param {number} unit 분 단위 (1, 3, 5, 15, 30, 60, 240)
   * @param {number} count 캔들 개수 (최대 200)
   */
  async getMinuteCandles(market = 'KRW-BTC', unit = 1, count = 100) {
    try {
      const response = await axios.get(
        `${this.serverUrl}/candles/minutes/${unit}?market=${market}&count=${count}`
      );
      return response.data;
    } catch (error) {
      console.error('Upbit getMinuteCandles Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * 주문 가능 정보 조회 (마켓별 최소 주문 금액, 수수료 등)
   */
  async getOrderChance(market = 'KRW-BTC') {
    try {
      const params = { market };
      const token = this.getAuthToken(params);
      const response = await axios.get(`${this.serverUrl}/orders/chance`, {
        params,
        headers: { Authorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Upbit getOrderChance Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * 주문 실행 (매수 / 매도)
   */
  async createOrder({ market, side, volume, price, ord_type }) {
    try {
      const body = { market, side, ord_type };
      if (volume) body.volume = volume.toString();
      if (price) body.price = price.toString();

      const token = this.getAuthToken(body);
      const response = await axios.post(`${this.serverUrl}/orders`, body, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upbit createOrder Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * 개별 주문 취소
   */
  async cancelOrder(uuid) {
    try {
      const params = { uuid };
      const token = this.getAuthToken(params);
      const response = await axios.delete(`${this.serverUrl}/order`, {
        params,
        headers: { Authorization: token }
      });
      return response.data;
    } catch (error) {
      console.error('Upbit cancelOrder Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
}

module.exports = new UpbitClient();
