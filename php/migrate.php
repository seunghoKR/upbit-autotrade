<?php
declare(strict_types=1);
require_once __DIR__ . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = Database::getConnection();

    // 1. nurioh_users
    $pdo->exec("CREATE TABLE IF NOT EXISTS `nurioh_users` (
        `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
        `kakao_id` VARCHAR(100) UNIQUE NOT NULL,
        `name` VARCHAR(100) DEFAULT NULL,
        `nickname` VARCHAR(100) NOT NULL,
        `email` VARCHAR(150) DEFAULT NULL,
        `phone` VARCHAR(50) DEFAULT NULL,
        `birthyear` VARCHAR(10) DEFAULT '1990',
        `profile_image` VARCHAR(500) DEFAULT NULL,
        `role` VARCHAR(32) DEFAULT 'USER',
        `tier` ENUM('FREE_TRIAL', 'PRO', 'VIP') DEFAULT 'FREE_TRIAL',
        `approval_status` VARCHAR(32) DEFAULT 'APPROVED',
        `subscription_expires_at` DATETIME DEFAULT NULL,
        `max_slots` INT DEFAULT 12,
        `telegram_chat_id` VARCHAR(50) DEFAULT NULL,
        `is_active` TINYINT(1) DEFAULT 1,
        `agreed_terms` TINYINT(1) DEFAULT 1,
        `auto_trading` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_kakao_id` (`kakao_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 컬럼 누락 방지 ALTER TABLE
    try { $pdo->exec("ALTER TABLE `nurioh_users` ADD COLUMN `name` VARCHAR(100) DEFAULT NULL AFTER `kakao_id`"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE `nurioh_users` ADD COLUMN `phone` VARCHAR(50) DEFAULT NULL AFTER `email`"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE `nurioh_users` ADD COLUMN `birthyear` VARCHAR(10) DEFAULT '1990' AFTER `phone`"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE `nurioh_users` ADD COLUMN `approval_status` VARCHAR(32) DEFAULT 'APPROVED' AFTER `is_active`"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE `nurioh_users` ADD COLUMN `auto_trading` TEXT DEFAULT NULL AFTER `agreed_terms`"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE `nurioh_users` MODIFY COLUMN `role` VARCHAR(32) DEFAULT 'USER'"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE `nurioh_users` MODIFY COLUMN `max_slots` INT DEFAULT 12"); } catch (Exception $e) {}

    // 2. nurioh_user_apikeys
    $pdo->exec("CREATE TABLE IF NOT EXISTS `nurioh_user_apikeys` (
        `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
        `user_id` BIGINT UNIQUE NOT NULL,
        `access_key_enc` TEXT NOT NULL,
        `secret_key_enc` TEXT NOT NULL,
        `ip_registered` TINYINT(1) DEFAULT 1,
        `is_valid` TINYINT(1) DEFAULT 0,
        `last_verified_at` DATETIME DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `nurioh_users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 3. nurioh_settings
    $pdo->exec("CREATE TABLE IF NOT EXISTS `nurioh_settings` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `bot_enabled` TINYINT(1) DEFAULT 0,
        `surge_check_seconds` INT DEFAULT 5,
        `surge_rate_threshold` DECIMAL(5,2) DEFAULT 1.50,
        `surge_min_volume_krw` BIGINT DEFAULT 10000000,
        `trailing_target_profit_pct` DECIMAL(5,2) DEFAULT 3.00,
        `trailing_callback_pct` DECIMAL(5,2) DEFAULT 1.00,
        `stop_loss_pct` DECIMAL(5,2) DEFAULT 2.00,
        `approval_timeout_seconds` INT DEFAULT 30,
        `auto_execute_on_timeout` TINYINT(1) DEFAULT 0,
        `server_ip` VARCHAR(50) DEFAULT '115.68.168.243',
        `bank_info` VARCHAR(255) DEFAULT '국민은행 123-456-789012 (예금주: 누리오)',
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 4. nurioh_slots
    $pdo->exec("CREATE TABLE IF NOT EXISTS `nurioh_slots` (
        `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
        `user_id` BIGINT DEFAULT 1,
        `slot_id` INT NOT NULL,
        `slot_name` VARCHAR(50) DEFAULT 'Slot',
        `is_enabled` TINYINT(1) DEFAULT 1,
        `target_market` VARCHAR(20) NOT NULL DEFAULT 'KRW-BTC',
        `trade_amount_krw` DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
        `position_status` ENUM('IDLE', 'HOLDING', 'TRAILING_ACTIVE') DEFAULT 'IDLE',
        `entry_price` DECIMAL(20,8) DEFAULT NULL,
        `entry_volume` DECIMAL(20,8) DEFAULT NULL,
        `entry_amount_krw` DECIMAL(15,2) DEFAULT NULL,
        `highest_price` DECIMAL(20,8) DEFAULT NULL,
        `highest_profit_pct` DECIMAL(8,4) DEFAULT 0.0000,
        `entered_at` DATETIME DEFAULT NULL,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `uk_user_slot` (`user_id`, `slot_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 기본 관리자 계정 생성 (id=1)
    $pdo->exec("INSERT INTO `nurioh_users` (`id`, `kakao_id`, `nickname`, `email`, `role`, `tier`, `subscription_expires_at`, `max_slots`)
        VALUES (1, 'admin_nurioh_ceo', '누리오 마스터 대표님', 'ceo@nurioh.com', 'ADMIN', 'VIP', '2099-12-31 23:59:59', 5)
        ON DUPLICATE KEY UPDATE `role` = 'ADMIN', `tier` = 'VIP'");

    // 5. 테스트 기록 초기화 (0회, 0%, 0원) 및 급등감지 파라미터 컬럼 추가
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `total_trades` INT DEFAULT 0");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `win_trades` INT DEFAULT 0");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `total_realized_profit_krw` DECIMAL(15,2) DEFAULT 0.00");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `strategy_type` VARCHAR(20) DEFAULT 'RECOMMENDED'");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `target_profit_pct` DECIMAL(5,2) DEFAULT 3.00");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `trailing_callback_pct` DECIMAL(5,2) DEFAULT 1.00");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `stop_loss_pct` DECIMAL(5,2) DEFAULT 2.00");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `surge_window_seconds` INT DEFAULT 5");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `surge_rate_pct` DECIMAL(5,2) DEFAULT 1.50");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `surge_min_volume_krw` BIGINT DEFAULT 10000000");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `surge_volume_mode` VARCHAR(10) DEFAULT 'RATE'");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `surge_min_volume_rate_pct` DECIMAL(6,4) DEFAULT 0.0500");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `use_reverse_alignment_filter` TINYINT(1) DEFAULT 1");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `use_whale_tick_filter` TINYINT(1) DEFAULT 1");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `whale_min_amount_krw` BIGINT DEFAULT 10000000");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `use_orderbook_filter` TINYINT(1) DEFAULT 1");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_settings` ADD COLUMN `scheduler_data` LONGTEXT NULL");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_settings` ADD COLUMN `killswitch_data` LONGTEXT NULL");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_settings` ADD COLUMN `telegram_bot_token` VARCHAR(255) DEFAULT NULL");
    } catch (Exception $ex) {}
    try {
        $pdo->exec("ALTER TABLE `nurioh_settings` ADD COLUMN `excluded_markets` TEXT DEFAULT NULL");
    } catch (Exception $ex) {}

    // 🛡️ nurioh_settings 기본 레코드 (id=1) 보장
    $pdo->exec("INSERT INTO `nurioh_settings` (`id`, `bot_enabled`, `server_ip`, `bank_info`)
        VALUES (1, 0, '115.68.168.242', '국민은행 123-456-789012 (예금주: Any Life AI)')
        ON DUPLICATE KEY UPDATE `server_ip` = '115.68.168.242'");

    // 🛡️ nurioh_slots 신규 전략 컬럼 누락 방지
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `strategy_mode` VARCHAR(30) DEFAULT 'SCALPING'"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `use_wide_trailing` TINYINT(1) DEFAULT 1"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `trailing_tier1_target_profit_pct` DECIMAL(5,2) DEFAULT 5.00"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `trailing_tier1_callback_pct` DECIMAL(5,2) DEFAULT 0.50"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `trailing_tier2_hurdle_pct` DECIMAL(5,2) DEFAULT 15.00"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `trailing_tier2_callback_pct` DECIMAL(5,2) DEFAULT 3.00"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `use_atr_stop_loss` TINYINT(1) DEFAULT 0"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `breakout_high_enabled` TINYINT(1) DEFAULT 1"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `breakout_candle_unit` INT DEFAULT 1"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `breakout_min_volume_krw_eok` INT DEFAULT 150"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `swing_candle_unit` VARCHAR(20) DEFAULT 'minutes/240'"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `swing_short_ma` INT DEFAULT 5"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `swing_long_ma` INT DEFAULT 20"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `swing_min_trade_price_24h_eok` INT DEFAULT 1000"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `min24h_acc_trade_price_krw` BIGINT DEFAULT 100000000000"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` ADD COLUMN `surge_base_mode` VARCHAR(10) DEFAULT 'VWAP'"); } catch (Exception $ex) {}
    try { $pdo->exec("ALTER TABLE `nurioh_slots` MODIFY COLUMN `position_status` VARCHAR(32) DEFAULT 'IDLE'"); } catch (Exception $ex) {}

    // 🛡️ 1~12번 슬롯 기본 레코드 자동 생성 (id=1 유저)
    $defaultMarkets = [
        1 => 'KRW-BTC', 2 => 'KRW-ETH', 3 => 'KRW-SOL',
        4 => 'KRW-XRP', 5 => 'KRW-DOGE', 6 => 'KRW-ADA',
        7 => 'KRW-AVAX', 8 => 'KRW-DOT', 9 => 'KRW-NEAR',
        10 => 'KRW-LINK', 11 => 'KRW-STX', 12 => 'KRW-SUI'
    ];
    for ($sId = 1; $sId <= 12; $sId++) {
        $mkt = $defaultMarkets[$sId] ?? 'KRW-BTC';
        $pdo->exec("INSERT INTO `nurioh_slots` (`user_id`, `slot_id`, `slot_name`, `is_enabled`, `target_market`, `trade_amount_krw`, `strategy_mode`)
            VALUES (1, {$sId}, '{$sId}번 슬롯', 1, '{$mkt}', 50000.00, 'SCALPING')
            ON DUPLICATE KEY UPDATE `slot_name` = '{$sId}번 슬롯'");
    }

    $pdo->exec("UPDATE `nurioh_slots` SET 
        `position_status` = 'IDLE',
        `entry_price` = NULL,
        `entry_volume` = NULL,
        `entry_amount_krw` = NULL,
        `highest_price` = NULL,
        `highest_profit_pct` = 0,
        `total_trades` = 0,
        `win_trades` = 0,
        `total_realized_profit_krw` = 0");

    echo json_encode([
        'success' => true,
        'message' => 'MariaDB Tables updated and all test records reset cleanly to 0!'
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}