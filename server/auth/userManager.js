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
    const defaultUsers = [
      {
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
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2099-12-31T23:59:59Z',
        maxSlots: 9,
        telegramChatId: '5618137472',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-08-01T00:00:00Z'
      },
      {
        id: 2,
        kakaoId: 'kakao_direct_leeshkr_gmail_com',
        name: '이승호',
        nickname: 'leeshkr',
        phone: '010-8888-0000',
        email: 'leeshkr@gmail.com',
        birthyear: '1990',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'VIP',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-10-15T00:00:00Z',
        maxSlots: 9,
        telegramChatId: '5948452939',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-08-10T09:30:00Z'
      },
      {
        id: 3,
        kakaoId: 'kakao_operator_kim',
        name: '김철수',
        nickname: '황금독수리',
        phone: '010-2345-6789',
        email: 'chulsoo.kim@naver.com',
        birthyear: '1982',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'OPERATOR',
        tier: 'VIP',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2099-12-31T23:59:59Z',
        maxSlots: 9,
        telegramChatId: '6123456789',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-08-12T14:20:00Z'
      },
      {
        id: 4,
        kakaoId: 'kakao_park_yh',
        name: '박영희',
        nickname: '코인요정',
        phone: '010-3456-7890',
        email: 'younghee_park@kakao.com',
        birthyear: '1993',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'PRO',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-10-02T00:00:00Z',
        maxSlots: 3,
        telegramChatId: '6234567890',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-08-15T11:10:00Z'
      },
      {
        id: 5,
        kakaoId: 'kakao_jung_ws',
        name: '정우성',
        nickname: '비트매니아',
        phone: '010-4567-8901',
        email: 'ws_jung@gmail.com',
        birthyear: '1987',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'PRO',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-09-26T00:00:00Z',
        maxSlots: 3,
        telegramChatId: null,
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-08-18T16:45:00Z'
      },
      {
        id: 6,
        kakaoId: 'kakao_kang_dw',
        name: '강동원',
        nickname: '단타장인',
        phone: '010-5678-9012',
        email: 'dw.kang@daum.net',
        birthyear: '1989',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'VIP',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-10-06T00:00:00Z',
        maxSlots: 9,
        telegramChatId: '6345678901',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-08-20T10:15:00Z'
      },
      {
        id: 7,
        kakaoId: 'kakao_han_jm',
        name: '한지민',
        nickname: '스마트인베스터',
        phone: '010-6789-0123',
        email: 'jimin.han@naver.com',
        birthyear: '1992',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'FREE_TRIAL',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-09-11T00:00:00Z',
        maxSlots: 1,
        telegramChatId: null,
        isActive: true,
        hasApiKey: false,
        createdAt: '2026-08-22T13:00:00Z'
      },
      {
        id: 8,
        kakaoId: 'kakao_song_jk',
        name: '송중기',
        nickname: '알트사냥꾼',
        phone: '010-7890-1234',
        email: 'jk.song@gmail.com',
        birthyear: '1988',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'FREE_TRIAL',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-09-13T00:00:00Z',
        maxSlots: 1,
        telegramChatId: '6456789012',
        isActive: true,
        hasApiKey: false,
        createdAt: '2026-08-25T08:30:00Z'
      },
      {
        id: 9,
        kakaoId: 'kakao_lee_bh',
        name: '이병헌',
        nickname: '누리오탑건',
        phone: '010-8901-2345',
        email: 'bh.lee@kakao.com',
        birthyear: '1980',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'PRO',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-09-22T00:00:00Z',
        maxSlots: 3,
        telegramChatId: '6567890123',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-08-27T15:20:00Z'
      },
      {
        id: 10,
        kakaoId: 'kakao_son_yj',
        name: '손예진',
        nickname: '새벽매매러',
        phone: '010-9012-3456',
        email: 'yj.son@naver.com',
        birthyear: '1991',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'FREE_TRIAL',
        approvalStatus: 'PENDING',
        subscriptionExpiresAt: '2026-09-15T00:00:00Z',
        maxSlots: 1,
        telegramChatId: null,
        isActive: true,
        hasApiKey: false,
        createdAt: '2026-09-01T07:10:00Z'
      },
      {
        id: 11,
        kakaoId: 'kakao_cho_is',
        name: '조인성',
        nickname: '크립토불스',
        phone: '010-1234-5678',
        email: 'is.cho@gmail.com',
        birthyear: '1986',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'FREE_TRIAL',
        approvalStatus: 'PENDING',
        subscriptionExpiresAt: '2026-09-15T00:00:00Z',
        maxSlots: 1,
        telegramChatId: '6678901234',
        isActive: true,
        hasApiKey: false,
        createdAt: '2026-09-02T18:40:00Z'
      },
      {
        id: 12,
        kakaoId: 'kakao_yoo_js',
        name: '유재석',
        nickname: '국민트레이더',
        phone: '010-2345-8765',
        email: 'js.yoo@kakao.com',
        birthyear: '1981',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'VIP',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-10-08T00:00:00Z',
        maxSlots: 9,
        telegramChatId: '6789012345',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-09-03T12:00:00Z'
      },
      {
        id: 13,
        kakaoId: 'kakao_shin_dy',
        name: '신동엽',
        nickname: '호가창마스터',
        phone: '010-3456-9876',
        email: 'dy.shin@naver.com',
        birthyear: '1984',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'PRO',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-09-17T00:00:00Z',
        maxSlots: 3,
        telegramChatId: null,
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-09-04T14:15:00Z'
      },
      {
        id: 14,
        kakaoId: 'kakao_kang_hd',
        name: '강호동',
        nickname: '천하장사코인',
        phone: '010-4567-0987',
        email: 'hd.kang@daum.net',
        birthyear: '1983',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'FREE_TRIAL',
        approvalStatus: 'PENDING',
        subscriptionExpiresAt: '2026-09-15T00:00:00Z',
        maxSlots: 1,
        telegramChatId: null,
        isActive: true,
        hasApiKey: false,
        createdAt: '2026-09-05T09:50:00Z'
      },
      {
        id: 15,
        kakaoId: 'kakao_lee_iu',
        name: '이지은',
        nickname: '보랏빛향기',
        phone: '010-5678-1098',
        email: 'iu.lee@gmail.com',
        birthyear: '1993',
        profileImage: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
        role: 'USER',
        tier: 'VIP',
        approvalStatus: 'APPROVED',
        subscriptionExpiresAt: '2026-10-05T00:00:00Z',
        maxSlots: 9,
        telegramChatId: '6890123456',
        isActive: true,
        hasApiKey: true,
        createdAt: '2026-09-06T17:30:00Z'
      }
    ];

    defaultUsers.forEach(u => {
      this.users.set(u.id, u);
    });
  }

  /**
   * 카카오 간편 로그인 / 회원가입 처리 (실명, 연락처, 출생연도 포함)
   */
  async loginOrRegisterKakao({ kakaoId, name, nickname, phone, email, birthyear, profileImage }) {
    let user = Array.from(this.users.values()).find(u => u.kakaoId === kakaoId || (email && u.email === email));

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
    } else {
      // 🛡️ 기존 회원이 로그인할 때, 사용자가 마이페이지에서 수정한 실명과 연락처를 덮어쓰지 않고 보존
      if (!user.name || user.name === '회원' || user.name === '누리오 회원') {
        user.name = name || user.name;
      }
      if (!user.phone || user.phone === '010-0000-0000') {
        user.phone = phone || user.phone;
      }
      if (profileImage) user.profileImage = profileImage;
    }

    return this.getUserProfile(user.id);
  }

  /**
   * 마이페이지: 실명, 닉네임, 연락처, 이메일, 텔레그램 연동 수정 저장
   */
  updateUserProfile(userId, { name, nickname, phone, email, telegramChatId, birthyear }) {
    const user = this.users.get(Number(userId));
    if (!user) throw new Error('해당 회원을 찾을 수 없습니다.');

    if (name) user.name = name.trim();
    if (nickname) user.nickname = nickname.trim();
    if (phone) user.phone = phone.trim();
    if (email) user.email = email.trim();
    if (telegramChatId !== undefined) user.telegramChatId = telegramChatId ? telegramChatId.trim() : user.telegramChatId;
    if (birthyear) user.birthyear = birthyear;

    console.log(`👤 [User ${userId}] 마이페이지 회원 정보 수정 완료: ${user.name} (${user.nickname}), 연락처: ${user.phone}`);
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
