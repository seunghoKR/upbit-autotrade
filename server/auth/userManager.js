/**
 * NURIOH TRADER - Multi-Tenant User & Membership Manager
 * 카카오 회원 인증, AES-256 API 키 보안 관리, 유료 회원 등급 및 마스터 관리자 제어기
 */

const { v4: uuidv4 } = require('uuid');
const cipher = require('../security/cipher');
const upbitClient = require('../upbit/upbitClient');

class UserManager {
  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    
    this.initDefaultAdmin();
  }

  initDefaultAdmin() {
    const adminUser = {
      id: 1,
      kakaoId: 'admin_nurioh_ceo',
      name: '누리오 마스터',
      nickname: '누리오 마스터 대표님',
      phone: '010-9999-8888',
      email: 'ceo@nurioh.com',
      birthyear: '1985',
      profileImage: 'https://raw.githubusercontent.com/wonseokjung/solopreneur-ai-agents/main/agents/youngja/assets/youngja_thumbsup.png',
      role: 'ADMIN',
      tier: 'VIP',
      subscriptionExpiresAt: '2099-12-31T23:59:59Z',
      maxSlots: 5,
      telegramChatId: '5618137472',
      isActive: true,
      hasApiKey: true,
      autoTrading: {
        isAgreed: true, // 자동매매 서비스 이용 동의 여부
        agreedAt: '2026-08-01T00:00:00Z',
        maxTotalLimitKrw: 1000000, // 자동매매 총 운용 한도 금액 (원)
        executionMode: 'AUTO', // 'AUTO' (전자동 체결) vs 'MANUAL' (안전 수동 승인)
        slotLimits: {
          1: 50000,
          2: 50000,
          3: 30000,
          4: 30000,
          5: 20000
        }
      },
      createdAt: '2026-08-01T00:00:00Z'
    };

    this.users.set(adminUser.id, adminUser);
  }

  /**
   * 카카오 간편 로그인 / 회원가입 처리 (실명, 연락처, 출생연도 포함)
   */
  async loginOrRegisterKakao({ kakaoId, name, nickname, phone, email, birthyear, profileImage }) {
    let user = Array.from(this.users.values()).find(u => u.kakaoId === kakaoId);

    if (!user) {
      const newId = this.users.size + 1;
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 7); // 7일 무료체험

      user = {
        id: newId,
        kakaoId: kakaoId || `kakao_${Date.now()}`,
        name: name || '회원',
        nickname: nickname || name || `누리오 회원 ${newId}호`,
        phone: phone || '010-0000-0000',
        email: email || '',
        birthyear: birthyear || '1990',
        profileImage: profileImage || 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'FREE_TRIAL',
        subscriptionExpiresAt: trialExpiry.toISOString(),
        maxSlots: 1, // 무료체험: 슬롯 1개
        telegramChatId: null,
        isActive: true,
        hasApiKey: false,
        createdAt: new Date().toISOString()
      };

      this.users.set(user.id, user);
      console.log(`🎉 신규 인증 회원 가입: [${user.name} (${user.nickname}), 연락처: ${user.phone}] (등급: FREE_TRIAL 7일)`);
    }

    return this.getUserProfile(user.id);
  }

  /**
   * 회원 프로필 및 구독 정보 조회 (API 키 정보는 마스킹 처리)
   */
  getUserProfile(userId) {
    const user = this.users.get(Number(userId));
    if (!user) return null;

    const apiKeyInfo = this.apiKeys.get(Number(userId));
    const isApiKeyConfigured = Boolean(apiKeyInfo && apiKeyInfo.isValid) || user.role === 'ADMIN';

    // 구독 잔여 일수 계산
    const now = new Date();
    const expiryDate = new Date(user.subscriptionExpiresAt);
    const diffMs = expiryDate - now;
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = remainingDays <= 0 && user.role !== 'ADMIN';

    return {
      ...user,
      hasApiKey: isApiKeyConfigured,
      apiKeyValid: apiKeyInfo?.isValid || (user.role === 'ADMIN'),
      remainingDays: user.role === 'ADMIN' ? 9999 : remainingDays,
      isExpired
    };
  }

  /**
   * 업비트 API 키 연결 테스트 및 안전 등록 (AES-256)
   */
  async registerAndTestApiKey(userId, accessKey, secretKey) {
    const user = this.users.get(Number(userId));
    if (!user) throw new Error('존재하지 않는 회원입니다.');

    // 1. 업비트 실시간 연결 검증 테스트
    const testResult = await upbitClient.validateCustomKeys(accessKey, secretKey);
    if (!testResult.isValid) {
      throw new Error(`업비트 API 연결 실패: ${testResult.error || '인증 오류'}. IP 등록 및 키를 확인해 주세요.`);
    }

    // 2. AES-256 암호화 저장
    const accessKeyEnc = cipher.encrypt(accessKey);
    const secretKeyEnc = cipher.encrypt(secretKey);

    this.apiKeys.set(Number(userId), {
      accessKeyEnc,
      secretKeyEnc,
      isValid: true,
      lastVerifiedAt: new Date().toISOString()
    });

    user.hasApiKey = true;
    console.log(`🔐 [User ${userId}] 업비트 API 키 검증 완료 및 AES-256 암호화 저장 완료!`);

    return {
      success: true,
      message: '업비트 API 키가 성공적으로 연결되었습니다!',
      accountsCount: testResult.accountsCount
    };
  }

  /**
   * 주문 및 자산 조회를 위한 복호화된 API 키 가져오기 (메모리 전용)
   */
  getDecryptedKeys(userId) {
    const apiKeyInfo = this.apiKeys.get(Number(userId));
    if (!apiKeyInfo || !apiKeyInfo.isValid) return null;

    try {
      return {
        accessKey: cipher.decrypt(apiKeyInfo.accessKeyEnc),
        secretKey: cipher.decrypt(apiKeyInfo.secretKeyEnc)
      };
    } catch (e) {
      console.error('API 키 복호화 실패:', e.message);
      return null;
    }
  }

  /**
   * 1:1 개인 텔레그램 Chat ID 연동
   */
  linkTelegramChatId(userId, chatId) {
    const user = this.users.get(Number(userId));
    if (!user) return false;
    user.telegramChatId = chatId;
    return true;
  }

  /**
   * 전체 회원 목록 및 상태 조회
   */
  getAllUsers() {
    return Array.from(this.users.values()).map(user => {
      const apiKeyInfo = this.apiKeys.get(user.id);
      const now = new Date();
      const expiryDate = new Date(user.subscriptionExpiresAt);
      const remainingDays = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));

      return {
        ...user,
        hasApiKey: Boolean(apiKeyInfo && apiKeyInfo.isValid) || user.role === 'ADMIN',
        remainingDays: user.role === 'ADMIN' ? 9999 : remainingDays
      };
    });
  }

  /**
   * 마스터 관리자(대표님): 회원 유료 등급 변경 (FREE_TRIAL / PRO / VIP)
   */
  updateUserTier(userId, newTier, addDays = 30) {
    const user = this.users.get(Number(userId));
    if (!user) throw new Error('해당 회원을 찾을 수 없습니다.');

    user.tier = newTier;
    if (newTier === 'PRO') {
      user.maxSlots = 3;
    } else if (newTier === 'VIP') {
      user.maxSlots = 5;
    } else {
      user.maxSlots = 1;
    }

    // 만료일 연장
    const currentExpiry = new Date(user.subscriptionExpiresAt > new Date().toISOString() ? user.subscriptionExpiresAt : new Date());
    currentExpiry.setDate(currentExpiry.getDate() + Number(addDays));
    user.subscriptionExpiresAt = currentExpiry.toISOString();

    console.log(`👑 [Admin] 회원 ${user.name}(${user.nickname})님 등급 변경: ${newTier} (슬롯 ${user.maxSlots}개, 만료일: ${user.subscriptionExpiresAt})`);
    return this.getUserProfile(user.id);
  }

  /**
   * 🛠️ 개발자 전용: 운영자(ADMIN) 권한 지정 / 해제
   */
  updateUserRole(userId, newRole) {
    const user = this.users.get(Number(userId));
    if (!user) throw new Error('해당 회원을 찾을 수 없습니다.');

    user.role = newRole;
    if (newRole === 'ADMIN') {
      user.tier = 'VIP';
      user.maxSlots = 5;
      user.subscriptionExpiresAt = '2099-12-31T23:59:59Z';
    } else {
      user.role = 'USER';
      user.tier = 'VIP'; // 일반 VIP로 전환
    }

    console.log(`🛠️ [Developer] 회원 #${user.id} (${user.name}) 권한 변경 -> ${newRole}`);
    return this.getUserProfile(user.id);
  }

  /**
   * 마이페이지: 자동매매 동의, 총 운용 한도, 슬롯별 허용 금액 설정 업데이트
   */
  updateAutoTradingSettings(userId, newSettings) {
    const user = this.users.get(Number(userId));
    if (!user) throw new Error('해당 회원을 찾을 수 없습니다.');

    user.autoTrading = {
      ...user.autoTrading,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };

    console.log(`⚙️ [User ${userId}] 자동매매 동의/한도 설정 업데이트 완료:`, user.autoTrading);
    return this.getUserProfile(user.id);
  }

  /**
   * 회원 계정 활성화/정지 토글
   */
  toggleUserActive(userId) {
    const user = this.users.get(Number(userId));
    if (!user) throw new Error('해당 회원을 찾을 수 없습니다.');
    user.isActive = !user.isActive;
    return user;
  }
}

module.exports = new UserManager();
