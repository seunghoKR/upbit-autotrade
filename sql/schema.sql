-- ====================================================================
-- 누리오 트레이더 (NURIOH TRADER) MariaDB 확장 스키마 (다중 회원 & 유료 SaaS)
-- 작성일: 2026-08-26
-- 설명: 다중 회원 계정, 암호화된 업비트 API 키, 유료 구독 등급 및 마스터 관리자 지원
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `nurioh_trader` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nurioh_trader`;

-- 1. 회원 정보 테이블
CREATE TABLE IF NOT EXISTS `nurioh_users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `kakao_id` VARCHAR(100) UNIQUE NOT NULL COMMENT '카카오 고유 회원번호',
    `nickname` VARCHAR(100) NOT NULL COMMENT '회원 닉네임',
    `email` VARCHAR(150) DEFAULT NULL COMMENT '이메일 주소',
    `profile_image` VARCHAR(500) DEFAULT NULL COMMENT '프로필 이미지 URL',
    `role` ENUM('USER', 'ADMIN') DEFAULT 'USER' COMMENT '회원 권한 (일반회원 / 마스터대표님)',
    `tier` ENUM('FREE_TRIAL', 'PRO', 'VIP') DEFAULT 'FREE_TRIAL' COMMENT '유료 구독 등급',
    `subscription_expires_at` DATETIME DEFAULT NULL COMMENT '구독 만료 일시',
    `max_slots` INT DEFAULT 1 COMMENT '이용 가능 슬롯 수 (FREE:1, PRO:3, VIP:5)',
    `telegram_chat_id` VARCHAR(50) DEFAULT NULL COMMENT '1:1 개인 텔레그램 Chat ID',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '계정 활성화 여부 (0: 정지, 1: 정상)',
    `agreed_terms` TINYINT(1) DEFAULT 1 COMMENT '투자 면책 약관 동의 여부',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_kakao_id` (`kakao_id`),
    INDEX `idx_tier_expires` (`tier`, `subscription_expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 회원별 암호화된 업비트 API 키 저장소 (비수탁형 철통 보안)
CREATE TABLE IF NOT EXISTS `nurioh_user_apikeys` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNIQUE NOT NULL COMMENT '회원 고유 ID (nurioh_users.id)',
    `access_key_enc` TEXT NOT NULL COMMENT 'AES-256 암호화된 Access Key',
    `secret_key_enc` TEXT NOT NULL COMMENT 'AES-256 암호화된 Secret Key',
    `ip_registered` TINYINT(1) DEFAULT 1 COMMENT '서버 IP 등록 확인 여부',
    `is_valid` TINYINT(1) DEFAULT 0 COMMENT 'API 키 연결 유효성 검증 성공 여부',
    `last_verified_at` DATETIME DEFAULT NULL COMMENT '최근 API 유효성 검증 일시',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `nurioh_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 전역 시스템 및 급등 감지 전략 설정 테이블
CREATE TABLE IF NOT EXISTS `nurioh_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bot_enabled` TINYINT(1) DEFAULT 0 COMMENT '자동매매 봇 활성화 여부',
    `surge_check_seconds` INT DEFAULT 5 COMMENT '급등 감지 기준 시간 (초)',
    `surge_rate_threshold` DECIMAL(5,2) DEFAULT 1.50 COMMENT '급등 감지 상승률 기준 (%)',
    `surge_min_volume_krw` BIGINT DEFAULT 10000000 COMMENT '급등 감지 시 최소 거래대금 필터 (원)',
    `trailing_target_profit_pct` DECIMAL(5,2) DEFAULT 3.00 COMMENT '트레일링 스탑 목표 수익률 (%)',
    `trailing_callback_pct` DECIMAL(5,2) DEFAULT 1.00 COMMENT '트레일링 스탑 고점 대비 하락 매도 폭 (%)',
    `stop_loss_pct` DECIMAL(5,2) DEFAULT 2.00 COMMENT '기본 손절률 (%)',
    `approval_timeout_seconds` INT DEFAULT 30 COMMENT '텔레그램 승인 대기 시간 (초)',
    `auto_execute_on_timeout` TINYINT(1) DEFAULT 0 COMMENT '타임아웃 시 자동 주문 실행 여부',
    `server_ip` VARCHAR(50) DEFAULT '49.171.41.10' COMMENT '업비트 API에 등록할 서버 공인 IP',
    `bank_info` VARCHAR(255) DEFAULT '국민은행 123-456-789012 (예금주: 누리오)' COMMENT '유료 구독 입금 안내 계좌',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 기본 설정
INSERT INTO `nurioh_settings` (`id`, `bot_enabled`, `surge_check_seconds`, `surge_rate_threshold`, `surge_min_volume_krw`, `trailing_target_profit_pct`, `trailing_callback_pct`, `stop_loss_pct`, `server_ip`)
VALUES (1, 0, 5, 1.50, 10000000, 3.00, 1.00, 2.00, '49.171.41.10')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

-- 4. 1~5번 독립 멀티 슬롯 관리 테이블 (회원별 확장 지원)
CREATE TABLE IF NOT EXISTS `nurioh_slots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT DEFAULT 1 COMMENT '회원 ID (1: 대표님 기본 계정)',
    `slot_id` INT NOT NULL COMMENT '슬롯 번호 (1 ~ 5)',
    `slot_name` VARCHAR(50) DEFAULT 'Slot' COMMENT '슬롯 별칭',
    `is_enabled` TINYINT(1) DEFAULT 1 COMMENT '슬롯 활성화 여부',
    `target_market` VARCHAR(20) NOT NULL DEFAULT 'KRW-BTC' COMMENT '대상 코인 마켓',
    `trade_amount_krw` DECIMAL(15,2) NOT NULL DEFAULT 50000.00 COMMENT '1회당 매수 금액',
    `position_status` ENUM('IDLE', 'HOLDING', 'TRAILING_ACTIVE') DEFAULT 'IDLE',
    `entry_price` DECIMAL(20,8) DEFAULT NULL,
    `entry_volume` DECIMAL(20,8) DEFAULT NULL,
    `entry_amount_krw` DECIMAL(15,2) DEFAULT NULL,
    `highest_price` DECIMAL(20,8) DEFAULT NULL,
    `highest_profit_pct` DECIMAL(8,4) DEFAULT 0.0000,
    `entered_at` DATETIME DEFAULT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_slot` (`user_id`, `slot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 매매 체결 및 트레일링 스탑 이력
CREATE TABLE IF NOT EXISTS `nurioh_trade_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT DEFAULT 1 COMMENT '회원 ID',
    `slot_id` INT DEFAULT NULL,
    `market` VARCHAR(20) NOT NULL,
    `side` ENUM('BUY', 'SELL') NOT NULL,
    `trade_type` VARCHAR(30) NOT NULL,
    `price` DECIMAL(20,8) NOT NULL,
    `volume` DECIMAL(20,8) NOT NULL,
    `amount_krw` DECIMAL(15,2) NOT NULL,
    `profit_rate_pct` DECIMAL(8,4) DEFAULT NULL,
    `profit_krw` DECIMAL(15,2) DEFAULT NULL,
    `highest_profit_pct` DECIMAL(8,4) DEFAULT NULL,
    `order_uuid` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_created` (`user_id`, `created_at`),
    INDEX `idx_market_created` (`market`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
