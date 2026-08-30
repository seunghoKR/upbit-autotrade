<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 👑 개발자 마스터 이메일
$developerEmails = ['leeshkr@kakao.com', 'ceo@nurioh.com'];

function base64UrlEncode(string $data): string {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function generateUpbitJwt(string $accessKey, string $secretKey, ?string $queryString = null): string {
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $payloadData = [
        'access_key' => $accessKey,
        'nonce' => bin2hex(random_bytes(16))
    ];

    if ($queryString) {
        $queryHash = hash('sha512', $queryString);
        $payloadData['query_hash'] = $queryHash;
        $payloadData['query_hash_alg'] = 'SHA512';
    }

    $payload = json_encode($payloadData);
    $encodedHeader = base64UrlEncode($header);
    $encodedPayload = base64UrlEncode($payload);

    $signature = hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", $secretKey, true);
    $encodedSignature = base64UrlEncode($signature);

    return "Bearer {$encodedHeader}.{$encodedPayload}.{$encodedSignature}";
}

function getTelegramBotToken(): string {
    static $cached = null;
    if ($cached !== null) return $cached;
    try {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT telegram_bot_token FROM nurioh_settings WHERE id = 1");
        if ($stmt) {
            $row = $stmt->fetch();
            if (!empty($row['telegram_bot_token'])) {
                $cached = trim((string)$row['telegram_bot_token']);
                return $cached;
            }
        }
    } catch (Exception $e) {}
    $cached = getenv('TELEGRAM_BOT_TOKEN') ?: '8801000924:AAGspDXeDkHyGI0CHuSxFvyq_f5vmoezU';
    return $cached;
}

function sendTelegramDirectMessage(string $text, ?string $targetChatId = null): array {
    $botToken = getTelegramBotToken();
    $targetId = trim((string)$targetChatId);
    if (!$botToken || !$targetId) {
        return ['success' => false, 'error' => '텔레그램 봇 토큰 또는 수신자 Chat ID가 설정되지 않았습니다.'];
    }

    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'chat_id' => $targetId,
        'text' => $text,
        'parse_mode' => 'HTML'
    ]));
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($res === false) {
        return ['success' => false, 'error' => "cURL 통신 실패: {$curlErr}"];
    }
    $json = json_decode($res, true);
    if (isset($json['ok']) && $json['ok'] === true) {
        return ['success' => true, 'data' => $json];
    }
    $desc = $json['description'] ?? "HTTP {$httpCode} 전송 오류";
    return ['success' => false, 'error' => $desc, 'httpCode' => $httpCode];
}

function sendTelegramAdminAlert(string $text): bool {
    $defaultAdminChatId = getenv('TELEGRAM_CHAT_ID') ?: '5618137472';

    $targetChatIds = [];
    if ($defaultAdminChatId) $targetChatIds[] = $defaultAdminChatId;

    // 👑 시스템 관리용(회비입금 등): DB에 등록된 운영자/개발자의 텔레그램으로만 공지
    try {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT telegram_chat_id FROM nurioh_users WHERE role IN ('ADMIN', 'OPERATOR', 'DEVELOPER') AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ''");
        while ($row = $stmt->fetch()) {
            $tId = trim((string)$row['telegram_chat_id']);
            if ($tId && !in_array($tId, $targetChatIds, true)) {
                $targetChatIds[] = $tId;
            }
        }
    } catch (Exception $e) {}

    $allSuccess = true;
    foreach ($targetChatIds as $targetId) {
        $res = sendTelegramDirectMessage($text, $targetId);
        if (!$res['success']) {
            $allSuccess = false;
        }
    }
    return $allSuccess;
}

function autoCheckAndExpireUsers(PDO $pdo): void {
    // 🛡️ 입금일(만료일 자정 23:59:59)이 지난 일반 회원의 경우 approval_status를 'EXPIRED'(미승인)로 자동 전환
    try {
        $now = date('Y-m-d H:i:s');
        $pdo->prepare("UPDATE nurioh_users 
            SET approval_status = 'EXPIRED' 
            WHERE role NOT IN ('ADMIN', 'OPERATOR', 'DEVELOPER') 
              AND subscription_expires_at IS NOT NULL 
              AND subscription_expires_at < ? 
              AND approval_status = 'APPROVED'")
            ->execute([$now]);
    } catch (Exception $e) {}
}

function fetchUpbitDeposits(string $accessKey, string $secretKey, string $currency = 'KRW'): array {
    $queryString = "currency={$currency}&state=ACCEPTED";
    $authHeader = generateUpbitJwt($accessKey, $secretKey, $queryString);
    $url = "https://api.upbit.com/v1/deposits?" . $queryString;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: {$authHeader}",
        "Accept: application/json"
    ]);
    $res = curl_exec($ch);
    curl_close($ch);

    return $res ? (json_decode($res, true) ?: []) : [];
}

function getOutboundServerIp(): string {
    static $cachedIp = null;
    if ($cachedIp !== null) return $cachedIp;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.ipify.org');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $ip = curl_exec($ch);
    curl_close($ch);
    $cachedIp = ($ip && filter_var(trim($ip), FILTER_VALIDATE_IP)) ? trim($ip) : ($_SERVER['SERVER_ADDR'] ?? '115.68.168.243');
    return $cachedIp;
}

function fetchUpbitAccounts(string $accessKey, string $secretKey, ?string &$errorMsg = null): array {
    $jwt = generateUpbitJwt($accessKey, $secretKey);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.upbit.com/v1/accounts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: {$jwt}",
        "Accept: application/json",
        "User-Agent: NURIOH-TRADER"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        $errorMsg = "cURL 네트워크 연결 오류: {$curlErr}";
        return [];
    }

    if ($response) {
        $data = json_decode($response, true);
        if ($httpCode === 200 && is_array($data)) {
            return $data;
        }
        if (isset($data['error']['message'])) {
            $errorMsg = "업비트 응답 오류 [{$data['error']['name']}]: {$data['error']['message']}";
        } else {
            $errorMsg = "업비트 HTTP {$httpCode} 응답: {$response}";
        }
    } else {
        $errorMsg = "업비트 서버 응답 없음 (HTTP {$httpCode})";
    }

    return [];
}

function executeUpbitOrder(string $accessKey, string $secretKey, array $params, ?string &$errorMsg = null): ?array {
    $queryString = http_build_query($params);
    $jwt = generateUpbitJwt($accessKey, $secretKey, $queryString);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.upbit.com/v1/orders');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: {$jwt}",
        "Content-Type: application/json",
        "Accept: application/json",
        "User-Agent: NURIOH-TRADER"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        $errorMsg = "cURL 주문 전송 오류: {$curlErr}";
        return null;
    }

    if ($response) {
        $data = json_decode($response, true);
        if ($httpCode >= 200 && $httpCode < 300 && is_array($data)) {
            return $data;
        }
        if (isset($data['error']['message'])) {
            $errorMsg = "업비트 주문 실패 [{$data['error']['name']}]: {$data['error']['message']}";
        } else {
            $errorMsg = "업비트 주문 오류 (HTTP {$httpCode}): {$response}";
        }
    } else {
        $errorMsg = "업비트 주문 서버 응답 없음 (HTTP {$httpCode})";
    }

    return null;
}

function fetchUpbitOrderChance(string $accessKey, string $secretKey, string $market = 'KRW-BTC', ?string &$errorMsg = null): ?array {
    $queryString = http_build_query(['market' => $market]);
    $jwt = generateUpbitJwt($accessKey, $secretKey, $queryString);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.upbit.com/v1/orders/chance?{$queryString}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: {$jwt}",
        "Accept: application/json",
        "User-Agent: NURIOH-TRADER"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        $errorMsg = "cURL 네트워크 연결 오류: {$curlErr}";
        return null;
    }

    if ($response) {
        $data = json_decode($response, true);
        if ($httpCode === 200 && is_array($data)) {
            return $data;
        }
        if (isset($data['error']['message'])) {
            $errorMsg = "업비트 주문 권한 검증 오류 [{$data['error']['name']}]: {$data['error']['message']}";
        } else {
            $errorMsg = "업비트 HTTP {$httpCode} 응답: {$response}";
        }
    } else {
        $errorMsg = "업비트 서버 응답 없음 (HTTP {$httpCode})";
    }

    return null;
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url($requestUri, PHP_URL_PATH);
$path = preg_replace('#^/api/#', '', $path);
$path = trim($path, '/');

$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    $pdo = Database::getConnection();
    $pdo->exec("SET NAMES utf8mb4");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB Connection failed: ' . $e->getMessage()]);
    exit;
}

try {

    // 🛠️ DB 테이블 컬럼 마이그레이션
    try {
        $pdo->exec("ALTER TABLE nurioh_users ADD COLUMN name VARCHAR(100) DEFAULT NULL AFTER kakao_id");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_users ADD COLUMN phone VARCHAR(50) DEFAULT NULL AFTER email");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_users ADD COLUMN birthyear VARCHAR(10) DEFAULT '1990' AFTER phone");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_users ADD COLUMN auto_trading TEXT DEFAULT NULL AFTER agreed_terms");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_users ADD COLUMN approval_status VARCHAR(32) DEFAULT 'APPROVED' AFTER is_active");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_users MODIFY COLUMN role VARCHAR(32) DEFAULT 'USER'");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_settings ADD COLUMN excluded_markets TEXT DEFAULT NULL AFTER surge_min_volume_krw");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_settings ADD COLUMN telegram_bot_token VARCHAR(255) DEFAULT NULL AFTER excluded_markets");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_slots MODIFY COLUMN position_status VARCHAR(32) DEFAULT 'IDLE'");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_slots ADD COLUMN entry_amount_krw DECIMAL(15,2) DEFAULT NULL");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_slots ADD COLUMN entered_at DATETIME DEFAULT NULL");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_slots ADD COLUMN highest_profit_pct DECIMAL(8,4) DEFAULT 0.0000");
    } catch (Exception $e) {}

    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `nurioh_payment_logs` (
            `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
            `user_id` BIGINT NOT NULL,
            `amount_krw` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
            `payment_type` VARCHAR(50) DEFAULT 'BANK_TRANSFER',
            `depositor_name` VARCHAR(100) DEFAULT NULL,
            `tx_id` VARCHAR(150) DEFAULT NULL,
            `status` VARCHAR(32) DEFAULT 'CONFIRMED',
            `previous_expires_at` DATETIME DEFAULT NULL,
            `extended_expires_at` DATETIME NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_pay` (`user_id`, `created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) {}

    // 🛡️ 입금일(만료일) 경과 회원 자동 미승인(EXPIRED) 검사 실행
    autoCheckAndExpireUsers($pdo);

    // 🧹 더미 테스트 계정 정리 및 대표님 단일 계정 확정
    $pdo->exec("DELETE FROM nurioh_users WHERE kakao_id = 'kakao_test_12345'");
    $pdo->exec("UPDATE nurioh_users SET role='DEVELOPER', tier='VIP', max_slots=9, approval_status='APPROVED', subscription_expires_at='2099-12-31 23:59:59' WHERE email='leeshkr@kakao.com' OR id=1");

    // 1. POST auth/kakao : 로그인 / 회원가입
    if ($path === 'auth/kakao' && $method === 'POST') {
        $kakaoId = (string)($input['kakaoId'] ?? '');
        $name = trim((string)($input['name'] ?? ''));
        $nickname = trim((string)($input['nickname'] ?? ''));
        $phone = (string)($input['phone'] ?? '');
        $email = trim((string)($input['email'] ?? ''));
        $birthyear = (string)($input['birthyear'] ?? '1990');
        $telegramId = $input['telegramId'] ?? null;
        $profileImage = trim((string)($input['profileImage'] ?? ''));

        if (!$nickname || $nickname === '??') {
            $nickname = $name ?: ($email ? explode('@', $email)[0] : '누리오 회원');
        }

        $isDeveloper = in_array(strtolower($email), $developerEmails, true) || $kakaoId === 'admin_nurioh_ceo' || str_contains($kakaoId, '5059461126') || $email === 'leeshkr@kakao.com';
        $assignedRole = $isDeveloper ? 'DEVELOPER' : 'USER';
        $assignedTier = $isDeveloper ? 'VIP' : 'FREE_TRIAL';
        $assignedSlots = $isDeveloper ? 9 : 1;
        $assignedApproval = $isDeveloper ? 'APPROVED' : 'PENDING';
        $assignedExpires = $isDeveloper ? '2099-12-31 23:59:59' : date('Y-m-d H:i:s', strtotime('+3 days'));

        $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE kakao_id = ?");
        $stmt->execute([$kakaoId]);
        $user = $stmt->fetch();

        if (!$user && $email !== '') {
            $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE email = ? ORDER BY id DESC LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
        }

        if (!$user) {
            $insert = $pdo->prepare("INSERT INTO nurioh_users 
                (kakao_id, name, nickname, email, phone, birthyear, profile_image, role, tier, subscription_expires_at, max_slots, approval_status, telegram_chat_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $insert->execute([$kakaoId, $name ?: $nickname, $nickname, $email, $phone, $birthyear, $profileImage, $assignedRole, $assignedTier, $assignedExpires, $assignedSlots, $assignedApproval, $telegramId]);
            $userId = (int)$pdo->lastInsertId();

            $markets = [
                1 => 'KRW-BTC', 2 => 'KRW-ETH', 3 => 'KRW-SOL',
                4 => 'KRW-XRP', 5 => 'KRW-DOGE', 6 => 'KRW-ADA',
                7 => 'KRW-AVAX', 8 => 'KRW-DOT', 9 => 'KRW-NEAR'
            ];
            for ($s = 1; $s <= 9; $s++) {
                $m = $markets[$s] ?? 'KRW-BTC';
                $isEnabled = ($s <= $assignedSlots) ? 1 : 0;
                $slotStmt = $pdo->prepare("INSERT INTO nurioh_slots (user_id, slot_id, slot_name, is_enabled, target_market, trade_amount_krw, strategy_type) 
                    VALUES (?, ?, ?, ?, ?, 0, 'RECOMMENDED') ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled)");
                $slotStmt->execute([$userId, $s, "{$s}번 슬롯", $isEnabled, $m]);
            }

            $stmt->execute([$kakaoId]);
            $user = $stmt->fetch();
        } else {
            $newNick = ($user['nickname'] === '??' || !$user['nickname']) ? $nickname : $user['nickname'];
            $newImg = $profileImage ?: $user['profile_image'];
            // 🛡️ 사용자가 마이페이지에서 수정한 실명(name)과 연락처(phone)는 카카오 재로그인 시 덮어쓰지 않고 영구 보존!
            $newName = (!empty($user['name']) && $user['name'] !== '누리오 회원' && $user['name'] !== '??') ? $user['name'] : ($name ?: $newNick);
            $newPhone = (!empty($user['phone']) && $user['phone'] !== '010-0000-0000') ? $user['phone'] : ($phone ?: '');
            
            $upd = $pdo->prepare("UPDATE nurioh_users SET 
                kakao_id = ?,
                name = ?,
                nickname = ?, 
                phone = ?,
                profile_image = ?, 
                role = ?, 
                tier = ?, 
                max_slots = ?, 
                approval_status = ?,
                subscription_expires_at = ? 
                WHERE id = ?");
            $upd->execute([
                $kakaoId ?: $user['kakao_id'],
                $newName,
                $newNick,
                $newPhone,
                $newImg,
                $isDeveloper ? 'DEVELOPER' : ($user['role'] ?: 'USER'),
                $isDeveloper ? 'VIP' : ($user['tier'] ?: 'FREE_TRIAL'),
                $isDeveloper ? 9 : ($user['max_slots'] ?: 1),
                $isDeveloper ? 'APPROVED' : ($user['approval_status'] ?: 'PENDING'),
                $isDeveloper ? '2099-12-31 23:59:59' : $user['subscription_expires_at'],
                $user['id']
            ]);

            $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $user = $stmt->fetch();
        }

        $expires = strtotime($user['subscription_expires_at'] ?? date('Y-m-d'));
        $remainingDays = max(0, (int)ceil(($expires - time()) / 86400));
        if ($isDeveloper || $user['role'] === 'DEVELOPER') $remainingDays = 9999;

        $keyStmt = $pdo->prepare("SELECT is_valid FROM nurioh_user_apikeys WHERE user_id = ?");
        $keyStmt->execute([$user['id']]);
        $keyInfo = $keyStmt->fetch();
        $hasApiKey = (bool)($keyInfo['is_valid'] ?? false) || ($isDeveloper || $user['role'] === 'DEVELOPER');

        $autoTrading = !empty($user['auto_trading']) ? json_decode($user['auto_trading'], true) : null;

        $userProfile = [
            'id' => (int)$user['id'],
            'kakaoId' => $user['kakao_id'],
            'name' => $user['name'] ?: $user['nickname'],
            'nickname' => $user['nickname'],
            'phone' => $user['phone'] ?: '',
            'email' => $user['email'],
            'birthyear' => $user['birthyear'] ?: '1990',
            'telegramId' => $user['telegram_chat_id'] ?: '',
            'role' => $isDeveloper ? 'DEVELOPER' : $user['role'],
            'tier' => $isDeveloper ? 'VIP' : $user['tier'],
            'approvalStatus' => $isDeveloper ? 'APPROVED' : ($user['approval_status'] ?? 'PENDING'),
            'maxSlots' => $isDeveloper ? 9 : (int)$user['max_slots'],
            'remainingDays' => $remainingDays,
            'hasApiKey' => $hasApiKey,
            'autoTrading' => $autoTrading,
            'profileImage' => $user['profile_image'] ?: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
        ];

        echo json_encode([
            'success' => true,
            'user' => $userProfile
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 1-B. POST user/profile-request : 마이페이지 정보 업데이트 & 무료 사용 승인 요청
    if ($path === 'user/profile-request' && $method === 'POST') {
        $userId = (int)($input['userId'] ?? 1);
        $name = trim((string)($input['name'] ?? ''));
        $phone = trim((string)($input['phone'] ?? ''));
        $email = trim((string)($input['email'] ?? ''));
        $nickname = trim((string)($input['nickname'] ?? ''));
        $telegramId = trim((string)($input['telegramId'] ?? ''));
        $birthyear = (string)($input['birthyear'] ?? '1990');

        $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit;
        }

        $isDev = in_array(strtolower($email ?: $user['email']), $developerEmails, true) || $user['role'] === 'DEVELOPER' || $user['email'] === 'leeshkr@kakao.com' || $userId === 1;
        $newRole = $isDev ? 'DEVELOPER' : ($user['role'] ?: 'USER');
        $newTier = $isDev ? 'VIP' : ($user['tier'] ?: 'FREE_TRIAL');
        $newSlots = $isDev ? 9 : ($user['max_slots'] ?: 1);
        $newApproval = $isDev ? 'APPROVED' : ($user['approval_status'] === 'APPROVED' ? 'APPROVED' : 'PENDING');
        $newExpires = $isDev ? '2099-12-31 23:59:59' : $user['subscription_expires_at'];

        $upd = $pdo->prepare("UPDATE nurioh_users SET 
            name = ?,
            nickname = ?, 
            phone = ?,
            email = ?, 
            telegram_chat_id = ?,
            role = ?,
            tier = ?,
            max_slots = ?,
            approval_status = ?,
            subscription_expires_at = ?
            WHERE id = ?");
        $upd->execute([
            $name !== '' ? $name : ($user['name'] ?: $nickname),
            $nickname !== '' ? $nickname : $user['nickname'],
            $phone !== '' ? $phone : ($user['phone'] ?: ''),
            $email !== '' ? $email : $user['email'],
            $telegramId !== '' ? $telegramId : ($user['telegram_chat_id'] ?: null),
            $newRole,
            $newTier,
            $newSlots,
            $newApproval,
            $newExpires,
            $userId
        ]);

        // 업데이트된 유저 반환
        $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch();

        $autoTrading = !empty($updatedUser['auto_trading']) ? json_decode($updatedUser['auto_trading'], true) : null;

        echo json_encode([
            'success' => true,
            'message' => '회원 정보가 성공적으로 수정되었습니다!',
            'user' => [
                'id' => (int)$updatedUser['id'],
                'kakaoId' => $updatedUser['kakao_id'],
                'name' => $updatedUser['name'] ?: $updatedUser['nickname'],
                'nickname' => $updatedUser['nickname'],
                'phone' => $updatedUser['phone'] ?: '',
                'email' => $updatedUser['email'],
                'birthyear' => $updatedUser['birthyear'] ?: '1990',
                'telegramId' => $updatedUser['telegram_chat_id'] ?: '',
                'role' => $updatedUser['role'],
                'tier' => $updatedUser['tier'],
                'approvalStatus' => $updatedUser['approval_status'] ?? 'APPROVED',
                'maxSlots' => (int)$updatedUser['max_slots'],
                'remainingDays' => $isDev ? 9999 : 30,
                'hasApiKey' => true,
                'autoTrading' => $autoTrading,
                'profileImage' => $updatedUser['profile_image'] ?: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 1-C. POST user/auto-trading : 마이페이지 슬롯 한도 및 자동매매 설정 저장
    if ($path === 'user/auto-trading' && $method === 'POST') {
        $userId = (int)($input['userId'] ?? 1);
        $isAgreed = isset($input['isAgreed']) ? (int)$input['isAgreed'] : 1;
        $maxTotalLimitKrw = (float)($input['maxTotalLimitKrw'] ?? 1000000);
        $executionMode = (string)($input['executionMode'] ?? 'AUTO');
        $slotLimits = $input['slotLimits'] ?? [];

        $autoData = json_encode([
            'isAgreed' => (bool)$isAgreed,
            'maxTotalLimitKrw' => $maxTotalLimitKrw,
            'executionMode' => $executionMode,
            'slotLimits' => $slotLimits
        ], JSON_UNESCAPED_UNICODE);

        $pdo->prepare("UPDATE nurioh_users SET auto_trading = ? WHERE id = ?")->execute([$autoData, $userId]);

        // 슬롯별 금액 업데이트
        if (is_array($slotLimits)) {
            foreach ($slotLimits as $sId => $amount) {
                $slotNum = (int)$sId;
                $slotAmt = (float)$amount;
                $pdo->prepare("UPDATE nurioh_slots SET trade_amount_krw = ? WHERE user_id = ? AND slot_id = ?")
                    ->execute([$slotAmt, $userId, $slotNum]);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => '자동매매 한도 및 슬롯 설정이 안전하게 저장되었습니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. GET auth/me
    if ($path === 'auth/me' && $method === 'GET') {
        $userId = (int)($_GET['userId'] ?? 1);
        $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            exit;
        }

        $isDeveloper = in_array(strtolower($user['email'] ?? ''), $developerEmails, true) || ($user['email'] ?? '') === 'leeshkr@kakao.com' || ($user['role'] ?? '') === 'DEVELOPER' || $userId === 1;
        if ($isDeveloper && ($user['role'] !== 'DEVELOPER' || (int)$user['max_slots'] !== 9 || $user['approval_status'] !== 'APPROVED')) {
            $realNick = ($user['nickname'] === '??') ? '이승호 대표님' : $user['nickname'];
            $pdo->prepare("UPDATE nurioh_users SET nickname = ?, role='DEVELOPER', tier='VIP', max_slots=9, approval_status='APPROVED', subscription_expires_at='2099-12-31 23:59:59' WHERE id = ?")
                ->execute([$realNick, $user['id']]);
            $user['nickname'] = $realNick;
            $user['role'] = 'DEVELOPER';
            $user['tier'] = 'VIP';
            $user['max_slots'] = 9;
            $user['approval_status'] = 'APPROVED';
        }

        $expires = strtotime($user['subscription_expires_at'] ?? date('Y-m-d'));
        $remainingDays = max(0, (int)ceil(($expires - time()) / 86400));
        if ($isDeveloper) $remainingDays = 9999;

        $keyStmt = $pdo->prepare("SELECT is_valid FROM nurioh_user_apikeys WHERE user_id = ?");
        $keyStmt->execute([$user['id']]);
        $keyInfo = $keyStmt->fetch();
        $hasApiKey = (bool)($keyInfo['is_valid'] ?? false) || $isDeveloper;

        $autoTrading = !empty($user['auto_trading']) ? json_decode($user['auto_trading'], true) : null;

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => (int)$user['id'],
                'kakaoId' => $user['kakao_id'],
                'name' => $user['name'] ?: $user['nickname'],
                'nickname' => $user['nickname'],
                'phone' => $user['phone'] ?: '',
                'email' => $user['email'],
                'birthyear' => $user['birthyear'] ?: '1990',
                'telegramId' => $user['telegram_chat_id'] ?: '',
                'role' => $isDeveloper ? 'DEVELOPER' : $user['role'],
                'tier' => $isDeveloper ? 'VIP' : $user['tier'],
                'approvalStatus' => $isDeveloper ? 'APPROVED' : ($user['approval_status'] ?? 'PENDING'),
                'maxSlots' => $isDeveloper ? 9 : (int)$user['max_slots'],
                'remainingDays' => $remainingDays,
                'hasApiKey' => $hasApiKey,
                'autoTrading' => $autoTrading,
                'profileImage' => $user['profile_image'] ?: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 3. GET status : 슬롯 & 잔고 & 제외 코인 목록
    if ($path === 'status' && $method === 'GET') {
        $userId = (int)($_GET['userId'] ?? 1);

        $setStmt = $pdo->query("SELECT * FROM nurioh_settings WHERE id = 1");
        $settings = $setStmt->fetch() ?: [];

        $keyStmt = $pdo->prepare("SELECT access_key_enc, secret_key_enc, is_valid FROM nurioh_user_apikeys WHERE user_id = ?");
        $keyStmt->execute([$userId]);
        $keyInfo = $keyStmt->fetch();

        $accounts = [];
        $accountError = null;
        if ($keyInfo && $keyInfo['access_key_enc'] && $keyInfo['secret_key_enc']) {
            $accessKey = base64_decode($keyInfo['access_key_enc']);
            $secretKey = base64_decode($keyInfo['secret_key_enc']);
            $accounts = fetchUpbitAccounts($accessKey, $secretKey, $accountError);
        } else {
            $accountError = 'API 키가 등록되지 않았습니다.';
        }

        if (empty($accounts)) {
            $accounts = [
                ['currency' => 'KRW', 'balance' => '0', 'locked' => '0', 'avg_buy_price' => '0', 'unit_currency' => 'KRW']
            ];
        }

        $slotStmt = $pdo->prepare("SELECT * FROM nurioh_slots WHERE user_id = ? AND slot_id <= 9 ORDER BY slot_id ASC");
        $slotStmt->execute([$userId]);
        $slots = $slotStmt->fetchAll() ?: [];

        // 🛡️ 슬롯이 비어있는 경우 1~9번 슬롯 즉시 자동 생성 (Self-Healing)
        if (empty($slots)) {
            $defaultMarkets = [
                1 => 'KRW-BTC', 2 => 'KRW-ETH', 3 => 'KRW-SOL',
                4 => 'KRW-XRP', 5 => 'KRW-DOGE', 6 => 'KRW-ADA',
                7 => 'KRW-AVAX', 8 => 'KRW-DOT', 9 => 'KRW-NEAR'
            ];
            $userRole = 'USER';
            $userTier = 'FREE_TRIAL';
            $maxSlots = 9; // 기본 9개 지원

            $uStmt = $pdo->prepare("SELECT role, tier, max_slots FROM nurioh_users WHERE id = ?");
            $uStmt->execute([$userId]);
            $uData = $uStmt->fetch();
            if ($uData) {
                $maxSlots = max(1, (int)($uData['max_slots'] ?? 9));
            }

            for ($s = 1; $s <= 9; $s++) {
                $m = $defaultMarkets[$s] ?? 'KRW-BTC';
                $isEnabled = ($s <= $maxSlots) ? 1 : 0;
                $slotInsert = $pdo->prepare("INSERT INTO nurioh_slots 
                    (user_id, slot_id, slot_name, is_enabled, target_market, trade_amount_krw, strategy_type, target_profit_pct, trailing_callback_pct, stop_loss_pct, position_status) 
                    VALUES (?, ?, ?, ?, ?, 0, 'RECOMMENDED', 3.0, 1.0, 2.0, 'IDLE')
                    ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled)");
                $slotInsert->execute([$userId, $s, "{$s}번 슬롯", $isEnabled, $m]);
            }

            $slotStmt->execute([$userId]);
            $slots = $slotStmt->fetchAll() ?: [];
        }

        // 🛡️ 실계좌 업비트 보유 코인(DKA, BORA 등) 맵 구성
        $heldCoins = [];
        if (!empty($accounts) && is_array($accounts)) {
            foreach ($accounts as $acc) {
                $curr = strtoupper($acc['currency'] ?? '');
                if ($curr === 'KRW' || empty($curr)) continue;
                $bal = (float)($acc['balance'] ?? 0) + (float)($acc['locked'] ?? 0);
                $avgPrice = (float)($acc['avg_buy_price'] ?? 0);
                $evalAmount = $bal * $avgPrice;
                // 실제 유의미한 보유 코인(평가금액 5,000원 이상)만 맵에 보관
                if ($bal > 0 && $evalAmount >= 5000) {
                    $mktKey = "KRW-{$curr}";
                    $heldCoins[$mktKey] = [
                        'market' => $mktKey,
                        'currency' => $curr,
                        'balance' => $bal,
                        'avgBuyPrice' => $avgPrice,
                        'evalAmount' => $evalAmount
                    ];
                }
            }
        }

        $formattedSlots = array_map(function($s) use ($pdo, $accounts, $heldCoins) {
            $realizedProfit = (float)($s['total_realized_profit_krw'] ?? 0);
            if ($realizedProfit > 50000000 || $realizedProfit < -50000000) {
                // 비정상적인 천문학적 더미/오류 데이터 0원으로 자동 정화
                $pdo->prepare("UPDATE nurioh_slots SET total_realized_profit_krw = 0 WHERE id = ?")->execute([$s['id']]);
                $realizedProfit = 0;
            }

            // 🛡️ 1) 수량이 0이거나 평가금액이 5,000원 미만인 먼지/더미 잔고는 깨끗한 빈 슬롯(IDLE)으로 초기화
            $vol = (float)($s['entry_volume'] ?? 0);
            $entryP = (float)($s['entry_price'] ?? 0);
            $amount = (float)($s['entry_amount_krw'] ?? ($vol * $entryP));
            $slotMkt = strtoupper($s['target_market'] ?? '');

            if ($s['position_status'] === 'IN_POSITION') {
                $isDustOrZero = ($vol <= 0.00001 || $amount < 4000 || $entryP <= 0);
                $isSoldOutOnUpbit = (!empty($accounts) && is_array($accounts) && count($accounts) > 0 && !isset($heldCoins[$slotMkt]));

                if ($isDustOrZero || $isSoldOutOnUpbit) {
                    $pdo->prepare("UPDATE nurioh_slots SET position_status = 'IDLE', entry_price = NULL, entry_volume = NULL, entry_amount_krw = NULL, highest_price = NULL, highest_profit_pct = 0 WHERE id = ?")
                        ->execute([$s['id']]);
                    $s['position_status'] = 'IDLE';
                    $s['entry_price'] = null;
                    $s['entry_volume'] = null;
                    $s['entry_amount_krw'] = null;
                    $s['highest_price'] = null;
                    $s['highest_profit_pct'] = 0;
                } else if (isset($heldCoins[$slotMkt])) {
                    // 실제 매수된 정상 포지션의 경우 최신 업비트 단가/수량 동기화
                    $s['entry_price'] = $heldCoins[$slotMkt]['avgBuyPrice'];
                    $s['entry_volume'] = $heldCoins[$slotMkt]['balance'];
                    $s['entry_amount_krw'] = $heldCoins[$slotMkt]['evalAmount'];
                }
            }

            return [
                'id' => (int)$s['id'],
                'slotId' => (int)$s['slot_id'],
                'slotName' => $s['slot_name'],
                'isEnabled' => (bool)$s['is_enabled'],
                'targetMarket' => $s['target_market'],
                'tradeAmountKrw' => (float)$s['trade_amount_krw'],
                'strategyType' => $s['strategy_type'] ?: 'RECOMMENDED',
                'surgeWindowSeconds' => (int)($s['surge_window_seconds'] ?? 5),
                'surgeRatePct' => (float)($s['surge_rate_pct'] ?? 1.5),
                'surgeMinVolumeKrw' => (float)($s['surge_min_volume_krw'] ?? 10000000),
                'targetProfitPct' => (float)($s['target_profit_pct'] ?? 3.0),
                'trailingCallbackPct' => (float)($s['trailing_callback_pct'] ?? 1.0),
                'stopLossPct' => (float)($s['stop_loss_pct'] ?? 2.0),
                'positionStatus' => $s['position_status'],
                'entryPrice' => $s['entry_price'] ? (float)$s['entry_price'] : null,
                'entryVolume' => $s['entry_volume'] ? (float)$s['entry_volume'] : null,
                'highestPrice' => $s['highest_price'] ? (float)$s['highest_price'] : null,
                'highestProfitPct' => (float)($s['highest_profit_pct'] ?? 0),
                'totalTrades' => (int)($s['total_trades'] ?? 0),
                'winTrades' => (int)($s['win_trades'] ?? 0),
                'totalRealizedProfitKrw' => $realizedProfit
            ];
        }, $slots);

        // 제외 코인 목록 파싱
        $excludedMarkets = [];
        if (!empty($settings['excluded_markets'])) {
            $excludedMarkets = json_decode($settings['excluded_markets'], true) ?: [];
        }

        echo json_encode([
            'botRunning' => (bool)($settings['bot_enabled'] ?? false),
            'serverIp' => getOutboundServerIp(),
            'accountError' => $accountError,
            'settings' => [
                'DEFAULT_MARKET' => 'KRW-BTC',
                'DEFAULT_TRADE_AMOUNT' => 0,
                'SURGE_CHECK_SECONDS' => (int)($settings['surge_check_seconds'] ?? 5),
                'SURGE_RATE_THRESHOLD' => (float)($settings['surge_rate_threshold'] ?? 1.5),
                'SURGE_MIN_VOLUME_KRW' => (int)($settings['surge_min_volume_krw'] ?? 10000000),
                'TRAILING_TARGET_PROFIT_PCT' => (float)($settings['trailing_target_profit_pct'] ?? 3.0),
                'TRAILING_CALLBACK_PCT' => (float)($settings['trailing_callback_pct'] ?? 1.0),
                'STOP_LOSS_PCT' => (float)($settings['stop_loss_pct'] ?? 2.0),
                'APPROVAL_TIMEOUT_SECONDS' => 0,
                'AUTO_EXECUTE_ON_TIMEOUT' => true,
                'EXCLUDED_MARKETS' => $excludedMarkets
            ],
            'accounts' => $accounts,
            'slots' => $formattedSlots,
            'pendingApproval' => null,
            'tradeHistory' => []
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 4. GET admin/users : 회원 목록 (개발자는 목록에서 제외!)
    if ($path === 'admin/users' && $method === 'GET') {
        $viewerRole = $_GET['viewerRole'] ?? 'DEVELOPER'; // DEVELOPER | OPERATOR

        // 👑 개발자 계정은 목록에 표시되지 않아야 함!
        $stmt = $pdo->query("SELECT id, kakao_id, name, nickname, email, phone, birthyear, profile_image, role, tier, approval_status, subscription_expires_at, max_slots, is_active, telegram_chat_id, created_at 
            FROM nurioh_users 
            WHERE role != 'DEVELOPER' AND email != 'leeshkr@kakao.com'
            ORDER BY id DESC");
        $users = $stmt->fetchAll() ?: [];

        $result = array_map(function($u) {
            $expires = strtotime($u['subscription_expires_at'] ?? date('Y-m-d'));
            $remainingDays = max(0, (int)ceil(($expires - time()) / 86400));
            if ($u['role'] === 'OPERATOR' || $u['role'] === 'DEVELOPER') {
                $remainingDays = 9999;
            }

            return [
                'id' => (int)$u['id'],
                'kakaoId' => $u['kakao_id'],
                'name' => $u['name'] ?: $u['nickname'],
                'nickname' => $u['nickname'],
                'email' => $u['email'],
                'phone' => $u['phone'] ?: '',
                'telegramId' => $u['telegram_chat_id'] ?: '',
                'hasTelegram' => !empty($u['telegram_chat_id']),
                'birthyear' => $u['birthyear'] ?: '1990',
                'profileImage' => $u['profile_image'] ?: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png',
                'role' => $u['role'] ?: 'USER', // OPERATOR | USER
                'tier' => $u['tier'] ?: 'FREE_TRIAL', // VIP | PRO | FREE_TRIAL
                'approvalStatus' => $u['approval_status'] ?: 'PENDING', // APPROVED | PENDING
                'maxSlots' => (int)$u['max_slots'],
                'remainingDays' => $remainingDays,
                'isActive' => (bool)$u['is_active'],
                'hasApiKey' => true,
                'createdAt' => $u['created_at']
            ];
        }, $users);

        echo json_encode(['users' => $result], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 4-B. GET/POST admin/telegram-config : 텔레그램 봇 토큰 조회 및 업데이트/검증
    if ($path === 'admin/telegram-config') {
        if ($method === 'GET') {
            $curToken = getTelegramBotToken();
            $maskedToken = strlen($curToken) > 10 ? substr($curToken, 0, 6) . '...' . substr($curToken, -4) : $curToken;
            
            // Telegram getMe 호출하여 토큰 검증
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://api.telegram.org/bot{$curToken}/getMe");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $res = curl_exec($ch);
            curl_close($ch);
            $botInfo = json_decode($res, true) ?: ['ok' => false];

            echo json_encode([
                'success' => true,
                'botToken' => $curToken,
                'maskedToken' => $maskedToken,
                'isValid' => !empty($botInfo['ok']),
                'botInfo' => $botInfo['result'] ?? null,
                'error' => !empty($botInfo['ok']) ? null : ($botInfo['description'] ?? '토큰 인증 실패')
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } else if ($method === 'POST') {
            $newToken = trim((string)($input['botToken'] ?? ''));
            if (!$newToken) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => '봇 토큰을 입력해 주세요.']);
                exit;
            }

            // Telegram getMe로 검증
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://api.telegram.org/bot{$newToken}/getMe");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 4);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $res = curl_exec($ch);
            curl_close($ch);
            $botInfo = json_decode($res, true);

            if (empty($botInfo['ok'])) {
                http_response_code(400);
                $errDesc = $botInfo['description'] ?? '텔레그램 API 인증 실패 (토큰 확인 필요)';
                echo json_encode(['success' => false, 'error' => "유효하지 않은 봇 토큰입니다: {$errDesc}"]);
                exit;
            }

            // DB 저장
            $pdo->exec("INSERT INTO nurioh_settings (id, telegram_bot_token) VALUES (1, " . $pdo->quote($newToken) . ") ON DUPLICATE KEY UPDATE telegram_bot_token = " . $pdo->quote($newToken));

            $botUser = $botInfo['result']['username'] ?? '알 수 없음';
            echo json_encode([
                'success' => true,
                'message' => "텔레그램 봇(@{$botUser}) 토큰이 성공적으로 등록 및 검증되었습니다! 🚀",
                'bot' => $botInfo['result']
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // 4-C. POST admin/users/{id}/test-telegram : 회원 대상 텔레그램 테스트 메시지 전송
    if (preg_match('#^admin/users/([0-9]+)/test-telegram$#', $path, $matches) && $method === 'POST') {
        $targetUserId = (int)$matches[1];
        $stmt = $pdo->prepare("SELECT name, nickname, telegram_chat_id FROM nurioh_users WHERE id = ?");
        $stmt->execute([$targetUserId]);
        $targetUser = $stmt->fetch();

        if (!$targetUser) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => '회원을 찾을 수 없습니다.']);
            exit;
        }

        $chatId = trim((string)($targetUser['telegram_chat_id'] ?? ''));
        if (!$chatId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => '해당 회원은 텔레그램 ID를 아직 등록하지 않았습니다.']);
            exit;
        }

        $userName = $targetUser['name'] ?: $targetUser['nickname'];
        $timeStr = date('Y-m-d H:i:s');
        $testMsg = "🔔 <b>[NURIOH 트레이더 텔레그램 알림 테스트]</b>\n\n" .
                   "안녕하세요, <b>{$userName}</b>님!\n" .
                   "운영자가 회원님의 텔레그램 알림 통신을 성공적으로 테스트하였습니다.\n" .
                   "현재 <b>실시간 급등 매수 및 매도(익절/손절) 신호</b>가 정상 발송 대기 중입니다! 🚀\n\n" .
                   "⏱ 테스트 시각: {$timeStr}";

        $res = sendTelegramDirectMessage($testMsg, $chatId);
        if ($res['success']) {
            echo json_encode([
                'success' => true,
                'message' => "[{$userName}] 님의 텔레그램(ID: {$chatId})으로 테스트 메시지가 성공적으로 발송되었습니다! 🚀"
            ], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => '텔레그램 봇 메시지 전송에 실패했습니다: ' . ($res['error'] ?? '알 수 없는 오류')]);
        }
        exit;
    }

    // 5. POST admin/users/{id}/update : 회원 권한/플랜/승인상태 통합 변경
    if (preg_match('#^admin/users/([0-9]+)/update$#', $path, $matches) && $method === 'POST') {
        $targetUserId = (int)$matches[1];
        $role = $input['role'] ?? 'USER'; // OPERATOR | USER
        $tier = $input['tier'] ?? 'FREE_TRIAL'; // VIP | PRO | FREE_TRIAL
        $approvalStatus = $input['approvalStatus'] ?? 'APPROVED'; // APPROVED | PENDING
        $addDays = (int)($input['addDays'] ?? 30);

        // 슬롯 수 및 만료일 계산
        if ($role === 'OPERATOR') {
            $slots = 9;
            $tier = 'VIP';
            $expires = '2099-12-31 23:59:59';
        } else if ($tier === 'VIP') {
            $slots = 9;
            $expires = date('Y-m-d H:i:s', strtotime("+{$addDays} days"));
        } else if ($tier === 'PRO') {
            $slots = 3;
            $expires = date('Y-m-d H:i:s', strtotime("+{$addDays} days"));
        } else {
            $slots = 1;
            $tier = 'FREE_TRIAL';
            $expires = date('Y-m-d H:i:s', strtotime("+{$addDays} days"));
        }

        $stmt = $pdo->prepare("UPDATE nurioh_users SET role = ?, tier = ?, max_slots = ?, approval_status = ?, subscription_expires_at = ? WHERE id = ?");
        $stmt->execute([$role, $tier, $slots, $approvalStatus, $expires, $targetUserId]);

        // 🔄 회원의 슬롯 활성화 상태(is_enabled)도 즉시 동기화
        for ($s = 1; $s <= 9; $s++) {
            $isEnabled = ($s <= $slots) ? 1 : 0;
            $slotUpd = $pdo->prepare("UPDATE nurioh_slots SET is_enabled = ? WHERE user_id = ? AND slot_id = ?");
            $slotUpd->execute([$isEnabled, $targetUserId, $s]);
        }

        echo json_encode([
            'success' => true,
            'message' => "회원 #{$targetUserId} 등급({$tier}/{$role}, 슬롯 {$slots}개)이 성공적으로 변경되었습니다.",
            'updated' => [
                'userId' => $targetUserId,
                'role' => $role,
                'tier' => $tier,
                'maxSlots' => $slots,
                'approvalStatus' => $approvalStatus,
                'expires' => $expires
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 5-B. POST admin/users/:userId/confirm-deposit : 회비 입금 확인 및 구독 1개월 연장 처리
    if (preg_match('#^admin/users/([0-9]+)/confirm-deposit$#', $path, $matches) && $method === 'POST') {
        $targetUserId = (int)$matches[1];
        $amountKrw = (float)($input['amountKrw'] ?? 50000);
        $depositorName = trim((string)($input['depositorName'] ?? ''));
        $paymentType = (string)($input['paymentType'] ?? 'BANK_TRANSFER');
        $txId = (string)($input['txId'] ?? '');

        $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE id = ?");
        $stmt->execute([$targetUserId]);
        $targetUser = $stmt->fetch();

        if (!$targetUser) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => '회원을 찾을 수 없습니다.']);
            exit;
        }

        $now = time();
        $currExpires = !empty($targetUser['subscription_expires_at']) ? strtotime($targetUser['subscription_expires_at']) : 0;
        
        // 📅 입금일(만료일) 이전에 입금 확인 시 -> 기존 만료일에서 +1개월(+30일) 연장
        // 만약 이미 만료(EXPIRED)된 상태라면 -> 현재 시점에서 +1개월(+30일) 부여
        $baseTime = ($currExpires > $now) ? $currExpires : $now;
        $newExpiresTime = strtotime('+30 days', $baseTime);
        $newExpiresDate = date('Y-m-d 23:59:59', $newExpiresTime);

        // 회원 상태를 APPROVED(승인 완료)로 전환 및 만료일 갱신
        $upd = $pdo->prepare("UPDATE nurioh_users SET 
            approval_status = 'APPROVED', 
            subscription_expires_at = ?,
            tier = CASE WHEN tier = 'FREE_TRIAL' THEN 'PRO' ELSE tier END
            WHERE id = ?");
        $upd->execute([$newExpiresDate, $targetUserId]);

        // 입금 로그 기록
        try {
            $logStmt = $pdo->prepare("INSERT INTO nurioh_payment_logs 
                (user_id, amount_krw, payment_type, depositor_name, tx_id, status, previous_expires_at, extended_expires_at) 
                VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)");
            $logStmt->execute([
                $targetUserId,
                $amountKrw,
                $paymentType,
                $depositorName ?: ($targetUser['name'] ?: $targetUser['nickname']),
                $txId ?: ('DEP_' . date('YmdHis') . '_' . $targetUserId),
                $targetUser['subscription_expires_at'],
                $newExpiresDate
            ]);
        } catch (Exception $e) {}

        // 🔔 운영진 및 회원에게 텔레그램 입금 승인 알림 발송
        $userName = $targetUser['name'] ?: $targetUser['nickname'];
        $userChatId = $targetUser['telegram_chat_id'] ?: null;
        $alertMsg = "<b>💰 [누리오 트레이더] 회비 입금 확인 및 1개월 연장 완료</b>\n\n"
            . "✨ <b>{$userName}</b>님의 회비 입금이 확인되어 <b>1개월(+30일) 이용 연장</b>이 완료되었습니다!\n\n"
            . "━━━━━━━━━━━━━━━━━━━\n"
            . "👤 <b>회원명:</b> {$userName} (연락처: {$targetUser['phone']})\n"
            . "💵 <b>입금액:</b> " . number_format($amountKrw) . " KRW\n"
            . "💳 <b>구분:</b> {$paymentType}\n"
            . "📅 <b>연장된 만료일:</b> {$newExpiresDate}\n"
            . "⚡ <b>이용 상태:</b> 승인 완료 (정상 가동 🟢)\n"
            . "━━━━━━━━━━━━━━━━━━━\n\n"
            . "🚀 <i>누리오 AI 트레이더가 24시간 실시간 감시를 이어갑니다.</i>";

        sendTelegramAdminAlert($alertMsg);
        if ($userChatId) {
            sendTelegramDirectMessage($alertMsg, $userChatId);
        }

        echo json_encode([
            'success' => true,
            'message' => "{$userName}님의 입금이 확인되어 1개월(+30일) 연장 승인되었습니다! (만료일: {$newExpiresDate})",
            'subscriptionExpiresAt' => $newExpiresDate,
            'approvalStatus' => 'APPROVED'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 5-C. GET payment/upbit-deposits : 개발자 업비트 API 입금 내역 조회 (자동 입금 감지용)
    if ($path === 'payment/upbit-deposits' && $method === 'GET') {
        $accessKey = getenv('UPBIT_ACCESS_KEY') ?: '';
        $secretKey = getenv('UPBIT_SECRET_KEY') ?: '';

        if (!$accessKey || !$secretKey) {
            echo json_encode(['success' => false, 'error' => '업비트 API 키가 설정되지 않았습니다.', 'deposits' => []]);
            exit;
        }

        $deposits = fetchUpbitDeposits($accessKey, $secretKey, 'KRW');
        echo json_encode([
            'success' => true,
            'count' => count($deposits),
            'deposits' => $deposits
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 6. POST admin/excluded-markets : 감시/매매 제외 코인 목록 저장
    if ($path === 'admin/excluded-markets' && $method === 'POST') {
        $markets = $input['markets'] ?? [];
        $encoded = json_encode($markets, JSON_UNESCAPED_UNICODE);

        $pdo->prepare("UPDATE nurioh_settings SET excluded_markets = ? WHERE id = 1")->execute([$encoded]);

        echo json_encode([
            'success' => true,
            'message' => '제외 코인 목록이 성공적으로 업데이트되었습니다.',
            'excludedMarkets' => $markets
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 6-1. GET/POST admin/sync-warning-markets : 업비트 유의/주의(상폐위험) 종목 실시간 자동 감지 & 동기화
    if ($path === 'admin/sync-warning-markets') {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.upbit.com/v1/market/all?isDetails=true');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json', 'User-Agent: NURIOH-TRADER']);
        $rawRes = curl_exec($ch);
        curl_close($ch);

        $warningCoins = [];
        if ($rawRes) {
            $allMarkets = json_decode($rawRes, true) ?: [];
            foreach ($allMarkets as $m) {
                if (!str_starts_with($m['market'] ?? '', 'KRW-')) continue;
                $isWarning = !empty($m['market_event']['warning']) || ($m['market_warning'] ?? '') === 'WARNING' || ($m['market_warning'] ?? '') === 'CAUTION';
                if ($isWarning) {
                    $warningCoins[] = [
                        'market' => $m['market'],
                        'nameKo' => $m['korean_name'] ?? '',
                        'nameEn' => $m['english_name'] ?? '',
                        'warning' => true,
                        'caution' => $m['market_event']['caution'] ?? []
                    ];
                }
            }
        }

        // DB에 저장된 기존 제외 코인 가져오기
        $setStmt = $pdo->query("SELECT excluded_markets FROM nurioh_settings WHERE id = 1");
        $curSettings = $setStmt->fetch() ?: [];
        $existingExcluded = !empty($curSettings['excluded_markets']) ? json_decode($curSettings['excluded_markets'], true) : [];
        if (!is_array($existingExcluded)) $existingExcluded = [];

        // 유의 코인 자동 병합
        $newWarningMarkets = array_column($warningCoins, 'market');
        $merged = array_values(array_unique(array_merge($existingExcluded, $newWarningMarkets)));

        if ($method === 'POST') {
            $encoded = json_encode($merged, JSON_UNESCAPED_UNICODE);
            $pdo->prepare("UPDATE nurioh_settings SET excluded_markets = ? WHERE id = 1")->execute([$encoded]);
        }

        echo json_encode([
            'success' => true,
            'warningCount' => count($warningCoins),
            'warningCoins' => $warningCoins,
            'mergedExcludedMarkets' => $merged
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 7. POST slots/{id} : 개별 슬롯 설정 저장
    if (preg_match('#^slots/([0-9]+)$#', $path, $matches) && $method === 'POST') {
        $slotId = (int)$matches[1];
        $userId = (int)($input['userId'] ?? 1);
        $targetMarket = $input['targetMarket'] ?? 'KRW-BTC';
        $tradeAmount = (float)($input['tradeAmountKrw'] ?? 0);
        $isEnabled = isset($input['isEnabled']) ? (int)$input['isEnabled'] : 1;
        $strategyType = $input['strategyType'] ?? 'RECOMMENDED';
        $surgeWindowSeconds = max(1, abs((int)($input['surgeWindowSeconds'] ?? 5)));
        $surgeRatePct = abs((float)($input['surgeRatePct'] ?? 1.5));
        $surgeMinVolumeKrw = abs((float)($input['surgeMinVolumeKrw'] ?? 10000000));
        $targetProfitPct = abs((float)($input['targetProfitPct'] ?? 3.0));
        $trailingCallbackPct = abs((float)($input['trailingCallbackPct'] ?? 1.0));
        $stopLossPct = abs((float)($input['stopLossPct'] ?? 2.0));

        $stmt = $pdo->prepare("UPDATE nurioh_slots SET 
            target_market = ?, 
            trade_amount_krw = ?, 
            is_enabled = ?,
            strategy_type = ?,
            surge_window_seconds = ?,
            surge_rate_pct = ?,
            surge_min_volume_krw = ?,
            target_profit_pct = ?,
            trailing_callback_pct = ?,
            stop_loss_pct = ?
            WHERE user_id = ? AND slot_id = ?");
        $stmt->execute([
            $targetMarket, 
            $tradeAmount, 
            $isEnabled, 
            $strategyType,
            $surgeWindowSeconds,
            $surgeRatePct,
            $surgeMinVolumeKrw,
            $targetProfitPct,
            $trailingCallbackPct,
            $stopLossPct,
            $userId, 
            $slotId
        ]);

        echo json_encode([
            'success' => true,
            'message' => "슬롯 {$slotId}번 ({$strategyType}) 설정이 저장되었습니다."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 7.1 POST slots/{id}/buy : 슬롯 급등 포착 시 업비트 시장가 자동 매수 집행
    if (preg_match('#^slots/([0-9]+)/buy$#', $path, $matches) && $method === 'POST') {
        $slotId = (int)$matches[1];
        $userId = (int)($input['userId'] ?? 1);
        $market = trim((string)($input['market'] ?? 'KRW-BTC'));
        $tradeAmount = (float)($input['amountKrw'] ?? 0);
        $currentPrice = (float)($input['currentPrice'] ?? 0);

        if ($tradeAmount < 5000) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => '최소 매수 금액은 5,000원 이상이어야 합니다.']);
            exit;
        }

        // 사용자 API 키 조회
        $keyStmt = $pdo->prepare("SELECT access_key_enc, secret_key_enc FROM nurioh_user_apikeys WHERE user_id = ? AND is_valid = 1");
        $keyStmt->execute([$userId]);
        $keyInfo = $keyStmt->fetch();

        $orderRes = null;
        if ($keyInfo && $keyInfo['access_key_enc'] && $keyInfo['secret_key_enc']) {
            $accessKey = base64_decode($keyInfo['access_key_enc']);
            $secretKey = base64_decode($keyInfo['secret_key_enc']);

            // 🛡️ 1차 잔고 검증: 업비트 실계좌 잔고 조회
            $accErr = null;
            $accounts = fetchUpbitAccounts($accessKey, $secretKey, $accErr);
            $krwAccount = null;
            foreach ($accounts as $acc) {
                if ($acc['currency'] === 'KRW') {
                    $krwAccount = $acc;
                    break;
                }
            }
            $availableKrw = (float)($krwAccount['balance'] ?? 0);
            if ($availableKrw < $tradeAmount) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => "업비트 원화 잔고가 부족합니다 (보유: " . number_format((int)$availableKrw) . "원 / 필요: " . number_format((int)$tradeAmount) . "원).",
                    'availableKrw' => $availableKrw,
                    'requiredKrw' => $tradeAmount
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // 🚀 업비트 시장가 매수 주문 (side: bid, ord_type: price, price: 매수원화금액)
            $orderParams = [
                'market' => $market,
                'side' => 'bid',
                'price' => (string)$tradeAmount,
                'ord_type' => 'price'
            ];
            $orderRes = executeUpbitOrder($accessKey, $secretKey, $orderParams, $orderErr);

            // ❌ 실제 주문 실패(업비트 거부, 잔고 부족 등) 시 체결 알림 발송 차단 및 에러 반환!
            if (!empty($orderErr) || empty($orderRes['uuid'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => "업비트 매수 주문 실패: " . ($orderErr ?: ($orderRes['error']['message'] ?? '주문이 거부되었습니다.')),
                    'details' => $orderRes
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        $calcPrice = $currentPrice > 0 ? $currentPrice : 1;
        $calcVolume = $tradeAmount / $calcPrice;

        // 슬롯 상태를 IN_POSITION으로 업데이트 (실제 체결 성공 시에만 반영!)
        $stmt = $pdo->prepare("UPDATE nurioh_slots SET 
            position_status = 'IN_POSITION',
            target_market = ?,
            entry_price = ?,
            entry_volume = ?,
            entry_amount_krw = ?,
            highest_price = ?,
            highest_profit_pct = 0,
            entered_at = NOW()
            WHERE user_id = ? AND slot_id = ?");
        $stmt->execute([
            $market,
            $calcPrice,
            $calcVolume,
            $tradeAmount,
            $calcPrice,
            $userId,
            $slotId
        ]);

        // 텔레그램 매수 체결 알림 (해당 슬롯 소유자 본인에게만 1:1 발송!)
        $uStmt = $pdo->prepare("SELECT telegram_chat_id FROM nurioh_users WHERE id = ?");
        $uStmt->execute([$userId]);
        $uRow = $uStmt->fetch();
        $userChatId = $uRow['telegram_chat_id'] ?? null;

        $timeStr = date('Y-m-d H:i:s');
        $buyAlertMsg = "<b>✅ [누리오 트레이더] 매수 체결 완료</b>\n\n" .
                       "🎰 <b>배정 슬롯:</b> <b>{$slotId}번 슬롯</b>\n" .
                       "📌 <b>매수 코인:</b> <code>{$market}</code>\n" .
                       "💵 <b>매수 금액:</b> " . number_format((int)$tradeAmount) . " KRW\n" .
                       "📊 <b>진입 단가:</b> " . number_format($calcPrice) . " KRW\n" .
                       "⏱ <b>체결 시각:</b> {$timeStr}\n\n" .
                       "🎯 <i>실시간 트레일링 스탑 익절 감시가 시작되었습니다.</i>";
        if ($userChatId) {
            sendTelegramDirectMessage($buyAlertMsg, $userChatId);
        } else {
            sendTelegramAdminAlert($buyAlertMsg);
        }

        echo json_encode([
            'success' => true,
            'message' => "{$slotId}번 슬롯 {$market} " . number_format((int)$tradeAmount) . "원 시장가 매수 체결 완료!",
            'order' => $orderRes,
            'entryPrice' => $calcPrice,
            'entryVolume' => $calcVolume,
            'market' => $market
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 8. POST slots/{id}/sell : 슬롯 개별 긴급 시장가 매도 및 텔레그램 정산 알림
    if (preg_match('#^slots/([0-9]+)/sell$#', $path, $matches) && $method === 'POST') {
        $slotId = (int)$matches[1];
        $userId = (int)($input['userId'] ?? 1);
        $currentPrice = (float)($input['currentPrice'] ?? 0);

        $slotStmt = $pdo->prepare("SELECT * FROM nurioh_slots WHERE user_id = ? AND slot_id = ?");
        $slotStmt->execute([$userId, $slotId]);
        $slot = $slotStmt->fetch();

        // 사용자 API 키 조회
        $keyStmt = $pdo->prepare("SELECT access_key_enc, secret_key_enc FROM nurioh_user_apikeys WHERE user_id = ? AND is_valid = 1");
        $keyStmt->execute([$userId]);
        $keyInfo = $keyStmt->fetch();

        $mkt = $slot['target_market'] ?? 'KRW-BTC';
        $coinCurrency = str_replace('KRW-', '', $mkt);
        $orderRes = null;
        $orderErr = null;

        if ($keyInfo && $keyInfo['access_key_enc'] && $keyInfo['secret_key_enc']) {
            $accessKey = base64_decode($keyInfo['access_key_enc']);
            $secretKey = base64_decode($keyInfo['secret_key_enc']);

            // 업비트 잔고에서 해당 코인 실제 보유 수량 조회
            $accErr = null;
            $accounts = fetchUpbitAccounts($accessKey, $secretKey, $accErr);
            $coinAcc = null;
            foreach ($accounts as $acc) {
                if ($acc['currency'] === $coinCurrency) {
                    $coinAcc = $acc;
                    break;
                }
            }

            $coinBalance = (float)($coinAcc['balance'] ?? ($slot['entry_volume'] ?? 0));
            if ($coinBalance > 0) {
                // 부동소수점 지수 표기 방지 (최대 소수점 8자리)
                $formattedVolume = rtrim(rtrim(sprintf('%.8f', $coinBalance), '0'), '.');
                $orderParams = [
                    'market' => $mkt,
                    'side' => 'ask',
                    'volume' => $formattedVolume,
                    'ord_type' => 'market'
                ];
                $orderRes = executeUpbitOrder($accessKey, $secretKey, $orderParams, $orderErr);
            } else {
                $orderErr = "업비트 계좌에 [{$coinCurrency}] 보유 잔고가 0이어서 거래소 주문은 생략되었습니다. ({$accErr})";
            }
        } else {
            $orderErr = "등록된 업비트 API 키가 없거나 비활성화 상태입니다.";
        }

        $entryPrice = (float)($slot['entry_price'] ?? 0);
        $amountKrw = (float)($slot['entry_amount_krw'] ?? ($slot['trade_amount_krw'] ?? 5000));
        $exitPrice = $currentPrice > 0 ? $currentPrice : (float)($slot['highest_price'] ?? $entryPrice);
        
        $profitPct = 0;
        $profitKrw = 0;
        if ($entryPrice > 0 && $exitPrice > 0) {
            $rawPct = (($exitPrice - $entryPrice) / $entryPrice) * 100;
            // 코인 단가 불일치 등으로 인한 비정상적 수치 방지 (-99% ~ +500% 제한)
            if ($rawPct >= -99.0 && $rawPct <= 500.0) {
                $profitPct = $rawPct;
                $profitKrw = $amountKrw * ($profitPct / 100);
            }
        }
        $isProfit = $profitPct >= 0;

        // 슬롯 초기화 및 실현 손익 통계 누적
        $pdo->prepare("UPDATE nurioh_slots SET 
            position_status = 'IDLE', 
            entry_price = NULL, 
            entry_volume = NULL, 
            entry_amount_krw = NULL,
            highest_price = NULL, 
            highest_profit_pct = 0,
            total_trades = total_trades + 1,
            win_trades = win_trades + ?,
            total_realized_profit_krw = total_realized_profit_krw + ?
            WHERE user_id = ? AND slot_id = ?")
            ->execute([$isProfit ? 1 : 0, $profitKrw, $userId, $slotId]);

        // 📢 텔레그램 실현 손익 정산 알림 발송
        $slotName = $slot['slot_name'] ?? "{$slotId}번 슬롯";
        $emoji = $isProfit ? '🟢 [수익 실현 매도 완료]' : '🔴 [손실 제한 매도 완료]';
        $sign = $isProfit ? '+' : '';
        $pctStr = "{$sign}" . number_format($profitPct, 2) . "%";
        $krwStr = "{$sign}" . number_format((int)$profitKrw) . " KRW";
        $timeStr = date('Y-m-d H:i:s');

        $upbitOrderInfo = $orderRes ? "주문번호: {$orderRes['uuid']}" : ($orderErr ?: "모의 정산");
        $alertMsg = "<b>{$emoji}</b>\n\n" .
                    "🎰 <b>배정 슬롯:</b> <b>{$slotId}번 슬롯 ({$slotName})</b>\n" .
                    "📌 <b>암호화폐:</b> <code>{$mkt}</code>\n" .
                    "📈 <b>실현 수익률:</b> <b>{$pctStr}</b>\n" .
                    "💵 <b>실현 손익금:</b> <b>{$krwStr}</b>\n" .
                    "⚡ <b>업비트 주문:</b> {$upbitOrderInfo}\n" .
                    "⏱ <b>청산 시각:</b> {$timeStr}\n";

        $uStmt = $pdo->prepare("SELECT telegram_chat_id FROM nurioh_users WHERE id = ?");
        $uStmt->execute([$userId]);
        $uRow = $uStmt->fetch();
        $userChatId = $uRow['telegram_chat_id'] ?? null;
        if ($userChatId) {
            sendTelegramDirectMessage($alertMsg, $userChatId);
        } else {
            sendTelegramAdminAlert($alertMsg);
        }

        echo json_encode([
            'success' => true,
            'message' => "슬롯 {$slotId}번 ({$mkt}) 긴급 매도 처리 완료! 실현수익률: {$pctStr} ({$krwStr})",
            'profitPct' => $profitPct,
            'profitKrw' => $profitKrw,
            'isProfit' => $isProfit,
            'order' => $orderRes,
            'upbitError' => $orderErr
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 8.1 POST slots/{id}/reset-stats : 슬롯 개별 누적 통계 초기화
    if (preg_match('#^slots/([0-9]+)/reset-stats$#', $path, $matches) && $method === 'POST') {
        $slotId = (int)$matches[1];
        $userId = (int)($input['userId'] ?? 1);
        $pdo->prepare("UPDATE nurioh_slots SET total_trades = 0, win_trades = 0, total_realized_profit_krw = 0 WHERE user_id = ? AND slot_id = ?")
            ->execute([$userId, $slotId]);
        echo json_encode([
            'success' => true, 
            'message' => "{$slotId}번 슬롯 누적 통계가 0으로 초기화되었습니다."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 9. POST auth/apikey : 업비트 API 키 등록
    if ($path === 'auth/apikey' && $method === 'POST') {
        $userId = (int)($input['userId'] ?? 1);
        $accessKey = trim((string)($input['accessKey'] ?? ''));
        $secretKey = trim((string)($input['secretKey'] ?? ''));

        if (!$accessKey || !$secretKey) {
            http_response_code(400);
            echo json_encode(['error' => 'API Keys required']);
            exit;
        }

        $testError = null;
        $testAccounts = fetchUpbitAccounts($accessKey, $secretKey, $testError);
        if (empty($testAccounts)) {
            http_response_code(400);
            $outboundIp = getOutboundServerIp();
            echo json_encode([
                'success' => false,
                'error' => "업비트 연결 실패: " . ($testError ?: '인증 오류') . " (서버 공인 IP: {$outboundIp} 가 업비트 API에 등록되었는지 확인해 주세요)"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $accEnc = base64_encode($accessKey);
        $secEnc = base64_encode($secretKey);

        $stmt = $pdo->prepare("INSERT INTO nurioh_user_apikeys (user_id, access_key_enc, secret_key_enc, is_valid, last_verified_at)
            VALUES (?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE access_key_enc=?, secret_key_enc=?, is_valid=1, last_verified_at=NOW()");
        $stmt->execute([$userId, $accEnc, $secEnc, $accEnc, $secEnc]);

        echo json_encode([
            'success' => true,
            'message' => '업비트 API 키가 성공적으로 연결되었습니다!',
            'accountsCount' => count($testAccounts)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 9-1. GET upbit/diagnostic : 업비트 API 4단계 통신 정밀 진단 (IP, 조회, 주문, 시세)
    if ($path === 'upbit/diagnostic' && $method === 'GET') {
        $userId = (int)($_GET['userId'] ?? 1);
        $serverIp = getOutboundServerIp();

        $keyStmt = $pdo->prepare("SELECT access_key_enc, secret_key_enc FROM nurioh_user_apikeys WHERE user_id = ? AND is_valid = 1");
        $keyStmt->execute([$userId]);
        $keyInfo = $keyStmt->fetch();

        $hasKeys = (bool)($keyInfo && $keyInfo['access_key_enc'] && $keyInfo['secret_key_enc']);
        $readOk = false;
        $orderOk = false;
        $publicFeedOk = false;
        $accountsCount = 0;
        $krwBalance = 0;
        $readError = null;
        $orderError = null;

        // 1. 공용 시세 API 통신 검사
        $tickerCh = curl_init();
        curl_setopt($tickerCh, CURLOPT_URL, 'https://api.upbit.com/v1/ticker?markets=KRW-BTC');
        curl_setopt($tickerCh, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($tickerCh, CURLOPT_TIMEOUT, 3);
        curl_setopt($tickerCh, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($tickerCh, CURLOPT_SSL_VERIFYHOST, false);
        $tickerRes = curl_exec($tickerCh);
        $tickerHttpCode = curl_getinfo($tickerCh, CURLINFO_HTTP_CODE);
        curl_close($tickerCh);
        $publicFeedOk = ($tickerHttpCode === 200 && $tickerRes);

        // 2. Private API 키 검증 (조회 & 주문 권한)
        if ($hasKeys) {
            $accessKey = base64_decode($keyInfo['access_key_enc']);
            $secretKey = base64_decode($keyInfo['secret_key_enc']);

            // 자산 조회 권한 검사
            $accounts = fetchUpbitAccounts($accessKey, $secretKey, $readError);
            if (!empty($accounts)) {
                $readOk = true;
                $accountsCount = count($accounts);
                foreach ($accounts as $acc) {
                    if (($acc['currency'] ?? '') === 'KRW') {
                        $krwBalance = (float)($acc['balance'] ?? 0);
                        break;
                    }
                }
            }

            // 주문 권한 검사 (주문 찬스 API)
            $chance = fetchUpbitOrderChance($accessKey, $secretKey, 'KRW-BTC', $orderError);
            if ($chance && isset($chance['bid_fee'])) {
                $orderOk = true;
            }
        }

        echo json_encode([
            'success' => true,
            'serverIp' => $serverIp,
            'hasKeys' => $hasKeys,
            'diagnostic' => [
                'hostingIp' => [
                    'status' => 'OK',
                    'ip' => $serverIp,
                    'message' => "호스팅 서버 공인 IP [{$serverIp}] 정상 작동 중"
                ],
                'publicMarketFeed' => [
                    'status' => $publicFeedOk ? 'SUCCESS' : 'FAILED',
                    'message' => $publicFeedOk ? '업비트 실시간 시세 감시 신호 정상 통신' : '시세 서버 응답 지연'
                ],
                'accountRead' => [
                    'status' => $readOk ? 'SUCCESS' : 'FAILED',
                    'accountsCount' => $accountsCount,
                    'krwBalance' => $krwBalance,
                    'message' => $readOk ? "계좌 잔고 조회 권한 정상 (보유 자산 {$accountsCount}개 종목)" : ($hasKeys ? "조회 실패: {$readError}" : "API 키 미등록")
                ],
                'orderExecution' => [
                    'status' => $orderOk ? 'SUCCESS' : 'FAILED',
                    'message' => $orderOk ? "업비트 매수/매도 주문 권한 완벽 승인됨 (즉시 체결 가능)" : ($hasKeys ? "주문 권한 확인 실패: {$orderError}" : "API 키 미등록")
                ]
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 9-2. POST auth/telegram : 텔레그램 연동 및 실시간 매수/매도 알림 설정
    if ($path === 'auth/telegram' && $method === 'POST') {
        $userId = (int)($input['userId'] ?? 1);
        $chatId = trim((string)($input['chatId'] ?? $input['telegramId'] ?? ''));

        $stmt = $pdo->prepare("UPDATE nurioh_users SET telegram_chat_id = ? WHERE id = ?");
        $stmt->execute([$chatId ?: null, $userId]);

        if ($chatId) {
            sendTelegramDirectMessage("🎉 <b>[NURIOH 트레이더 텔레그램 연동 완료]</b>\n\n회원님의 계정과 텔레그램 알림이 성공적으로 연결되었습니다!\n현재 시험운영 모드로 <b>실시간 급등 매수 및 매도(익절/손절) 신호</b>가 모두 전송됩니다. 🚀", $chatId);
        }

        echo json_encode([
            'success' => true,
            'message' => '텔레그램 연동이 완료되었습니다! 확인 메시지가 텔레그램으로 전송되었습니다.',
            'telegramId' => $chatId
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 10. POST bot/start : 봇 가동 시작
    if ($path === 'bot/start' && $method === 'POST') {
        $pdo->exec("INSERT INTO nurioh_settings (id, bot_enabled) VALUES (1, 1) ON DUPLICATE KEY UPDATE bot_enabled = 1");
        echo json_encode([
            'success' => true,
            'botRunning' => true,
            'message' => '자동매매 급등 감시가 정상 가동되었습니다! 🚀'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 11. POST bot/stop : 봇 가동 정지
    if ($path === 'bot/stop' && $method === 'POST') {
        $pdo->exec("INSERT INTO nurioh_settings (id, bot_enabled) VALUES (1, 0) ON DUPLICATE KEY UPDATE bot_enabled = 0");
        echo json_encode([
            'success' => true,
            'botRunning' => false,
            'message' => '자동매매 감시가 일시 정지되었습니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 12. POST bot/toggle : 봇 가동 토글
    if ($path === 'bot/toggle' && $method === 'POST') {
        $stmt = $pdo->query("SELECT bot_enabled FROM nurioh_settings WHERE id = 1");
        $curr = $stmt->fetch();
        $newVal = ($curr && (int)$curr['bot_enabled'] === 1) ? 0 : 1;
        $pdo->exec("INSERT INTO nurioh_settings (id, bot_enabled) VALUES (1, {$newVal}) ON DUPLICATE KEY UPDATE bot_enabled = {$newVal}");
        echo json_encode([
            'success' => true,
            'botRunning' => (bool)$newVal,
            'message' => $newVal ? '자동매매 급등 감시가 정상 가동되었습니다! 🚀' : '자동매매 감시가 일시 정지되었습니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 13. POST settings : 매매 조건 설정 저장
    if ($path === 'settings' && $method === 'POST') {
        $surgeSec = (int)($input['SURGE_CHECK_SECONDS'] ?? $input['surge_check_seconds'] ?? 5);
        $surgeRate = (float)($input['SURGE_RATE_THRESHOLD'] ?? $input['surge_rate_threshold'] ?? 1.5);
        $surgeVol = (int)($input['SURGE_MIN_VOLUME_KRW'] ?? $input['surge_min_volume_krw'] ?? 10000000);
        $trailingProfit = (float)($input['TRAILING_TARGET_PROFIT_PCT'] ?? $input['trailing_target_profit_pct'] ?? 3.0);
        $trailingCallback = (float)($input['TRAILING_CALLBACK_PCT'] ?? $input['trailing_callback_pct'] ?? 1.0);
        $stopLoss = (float)($input['STOP_LOSS_PCT'] ?? $input['stop_loss_pct'] ?? 2.0);

        $stmt = $pdo->prepare("INSERT INTO nurioh_settings 
            (id, surge_check_seconds, surge_rate_threshold, surge_min_volume_krw, trailing_target_profit_pct, trailing_callback_pct, stop_loss_pct)
            VALUES (1, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            surge_check_seconds = VALUES(surge_check_seconds),
            surge_rate_threshold = VALUES(surge_rate_threshold),
            surge_min_volume_krw = VALUES(surge_min_volume_krw),
            trailing_target_profit_pct = VALUES(trailing_target_profit_pct),
            trailing_callback_pct = VALUES(trailing_callback_pct),
            stop_loss_pct = VALUES(stop_loss_pct)");
        $stmt->execute([$surgeSec, $surgeRate, $surgeVol, $trailingProfit, $trailingCallback, $stopLoss]);

        echo json_encode([
            'success' => true,
            'message' => '매매 조건 설정이 안전하게 저장되었습니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 14. POST panic-sell : 전량 긴급 매도 (전체 코인 업비트 시장가 즉시 매도)
    if ($path === 'panic-sell' && $method === 'POST') {
        $userId = (int)($input['userId'] ?? 1);

        // 사용자 API 키 조회
        $keyStmt = $pdo->prepare("SELECT access_key_enc, secret_key_enc FROM nurioh_user_apikeys WHERE user_id = ? AND is_valid = 1");
        $keyStmt->execute([$userId]);
        $keyInfo = $keyStmt->fetch();

        $sellOrders = [];
        $orderErrors = [];

        if ($keyInfo && $keyInfo['access_key_enc'] && $keyInfo['secret_key_enc']) {
            $accessKey = base64_decode($keyInfo['access_key_enc']);
            $secretKey = base64_decode($keyInfo['secret_key_enc']);

            $accErr = null;
            $accounts = fetchUpbitAccounts($accessKey, $secretKey, $accErr);

            foreach ($accounts as $acc) {
                if (($acc['currency'] ?? '') === 'KRW') continue;
                $bal = (float)($acc['balance'] ?? 0);
                if ($bal <= 0) continue;

                $mkt = "KRW-{$acc['currency']}";
                $formattedVolume = rtrim(rtrim(sprintf('%.8f', $bal), '0'), '.');
                $orderParams = [
                    'market' => $mkt,
                    'side' => 'ask',
                    'volume' => $formattedVolume,
                    'ord_type' => 'market'
                ];
                $orderErr = null;
                $orderRes = executeUpbitOrder($accessKey, $secretKey, $orderParams, $orderErr);
                if ($orderRes) {
                    $sellOrders[] = ['market' => $mkt, 'volume' => $formattedVolume, 'order' => $orderRes];
                } else {
                    $orderErrors[] = "{$mkt}: {$orderErr}";
                }
            }
        }

        // 전체 슬롯 초기화
        $pdo->prepare("UPDATE nurioh_slots SET position_status = 'IDLE', entry_price = NULL, entry_volume = NULL, entry_amount_krw = NULL, highest_price = NULL, highest_profit_pct = 0 WHERE user_id = ?")
            ->execute([$userId]);

        // 📢 텔레그램 긴급 매도 알림 발송 (해당 회원 본인에게만 발송!)
        $uStmt = $pdo->prepare("SELECT telegram_chat_id FROM nurioh_users WHERE id = ?");
        $uStmt->execute([$userId]);
        $uRow = $uStmt->fetch();
        $userChatId = $uRow['telegram_chat_id'] ?? null;

        $orderSummary = count($sellOrders) > 0 
            ? "총 " . count($sellOrders) . "개 코인 시장가 매도 접수 완료"
            : (count($orderErrors) > 0 ? "매도 실패 (" . implode(', ', $orderErrors) . ")" : "보유 코인 없음 (슬롯 초기화)");
        if ($userChatId) {
            sendTelegramDirectMessage("🚨 <b>[전 슬롯 긴급 매도 (Panic Sell) 집행]</b>\n\n• 회원 ID: {$userId}\n• 상태: {$orderSummary}\n• 시각: " . date('Y-m-d H:i:s'), $userChatId);
        }

        echo json_encode([
            'success' => true,
            'message' => count($sellOrders) > 0 
                ? '보유 중인 모든 암호화폐에 대해 업비트 시장가 즉시 매도 주문이 접수되었습니다.' 
                : '모든 슬롯이 초기화되었습니다.' . (count($orderErrors) > 0 ? ' (' . implode(' / ', $orderErrors) . ')' : ''),
            'orders' => $sellOrders,
            'errors' => $orderErrors
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 15. POST test/surge-signal : 모의 급등 신호 발생 & 100% 전자동 즉시 매수 체결
    if ($path === 'test/surge-signal' && $method === 'POST') {
        $userId = (int)($input['userId'] ?? 1);
        $candidateMarkets = ['KRW-STX', 'KRW-SUI', 'KRW-NEAR', 'KRW-SOL', 'KRW-DOGE', 'KRW-ADA', 'KRW-AVAX', 'KRW-XRP'];
        $market = $input['market'] ?? 'RANDOM';
        if ($market === 'RANDOM' || empty($market)) {
            $market = $candidateMarkets[array_rand($candidateMarkets)];
        }

        // 빈 슬롯 찾기
        $stmt = $pdo->prepare("SELECT * FROM nurioh_slots WHERE user_id = ? AND is_enabled = 1 AND position_status = 'IDLE' ORDER BY slot_id ASC LIMIT 1");
        $stmt->execute([$userId]);
        $slot = $stmt->fetch();

        if (!$slot) {
            $stmt = $pdo->prepare("SELECT * FROM nurioh_slots WHERE user_id = ? ORDER BY slot_id ASC LIMIT 1");
            $stmt->execute([$userId]);
            $slot = $stmt->fetch();
        }

        $slotId = $slot ? (int)$slot['slot_id'] : 1;
        $tradeAmount = $slot ? (float)$slot['trade_amount_krw'] : 50000;
        if ($tradeAmount <= 0) $tradeAmount = 50000;

        $basePrices = [
            'KRW-BTC' => 135000000,
            'KRW-ETH' => 4200000,
            'KRW-SOL' => 245000,
            'KRW-STX' => 2890,
            'KRW-SUI' => 4250,
            'KRW-NEAR' => 7600,
            'KRW-DOGE' => 285,
            'KRW-XRP' => 880,
            'KRW-ADA' => 820,
            'KRW-AVAX' => 38000
        ];
        $price = (float)($input['price'] ?? $basePrices[$market] ?? 2500);
        $volume = ($price > 0) ? ($tradeAmount / $price) : 1;

        // 🚀 즉시 전자동 슬롯 포지션 체결!
        $stmt = $pdo->prepare("UPDATE nurioh_slots SET 
            target_market = ?, 
            position_status = 'IN_POSITION', 
            entry_price = ?, 
            entry_volume = ?, 
            highest_price = ?, 
            highest_profit_pct = 0 
            WHERE user_id = ? AND slot_id = ?");
        $stmt->execute([$market, $price, $volume, $price, $userId, $slotId]);

        // 📢 텔레그램 매수 알림 발송 (해당 유저에게만 발송!)
        $uStmt = $pdo->prepare("SELECT telegram_chat_id FROM nurioh_users WHERE id = ?");
        $uStmt->execute([$userId]);
        $uRow = $uStmt->fetch();
        $userChatId = $uRow['telegram_chat_id'] ?? null;

        $timeStr = date('Y-m-d H:i:s');
        $surgeAlertMsg = "<b>⚡ [실시간 급등 감지 매수 체결]</b>\n\n" .
                         "🎰 <b>배정 슬롯:</b> <b>{$slotId}번 슬롯</b>\n" .
                         "📌 <b>매수 코인:</b> <code>{$market}</code>\n" .
                         "💵 <b>매수 금액:</b> " . number_format((int)$tradeAmount) . " KRW\n" .
                         "📊 <b>진입 단가:</b> " . number_format($price) . " KRW\n" .
                         "⏱ <b>체결 시각:</b> {$timeStr}\n";
        if ($userChatId) {
            sendTelegramDirectMessage($surgeAlertMsg, $userChatId);
        }

        echo json_encode([
            'success' => true,
            'message' => "[{$market}] 급등 감지 즉시 {$slotId}번 슬롯에 자동 매수 체결되었습니다! 🚀",
            'executedTrade' => [
                'id' => 'SIG-' . round(microtime(true) * 1000),
                'type' => 'BUY',
                'slotId' => $slotId,
                'market' => $market,
                'price' => $price,
                'volume' => $volume,
                'amount' => $tradeAmount,
                'reason' => "[실시간 급등 레이더 포착] {$market} 5초간 +2.6% 급등 (전자동 시장가 매수 체결)",
                'status' => 'EXECUTED',
                'executedAt' => date('c')
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 16. POST trade/approve : 매수 승인 및 슬롯 포지션 할당
    if ($path === 'trade/approve' && $method === 'POST') {
        $userId = (int)($input['userId'] ?? 1);
        $slotId = (int)($input['slotId'] ?? 1);
        $market = $input['market'] ?? 'KRW-BTC';
        $price = (float)($input['price'] ?? 50000);
        $amount = (float)($input['amount'] ?? 50000);
        $volume = ($price > 0) ? ($amount / $price) : 1;

        $stmt = $pdo->prepare("UPDATE nurioh_slots SET 
            target_market = ?, 
            position_status = 'IN_POSITION', 
            entry_price = ?, 
            entry_volume = ?, 
            highest_price = ?, 
            highest_profit_pct = 0 
            WHERE user_id = ? AND slot_id = ?");
        $stmt->execute([$market, $price, $volume, $price, $userId, $slotId]);

        echo json_encode([
            'success' => true,
            'message' => "{$slotId}번 슬롯에 [{$market}] 포지션이 체결되었습니다."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 17. POST trade/reject : 매수 신호 취소
    if ($path === 'trade/reject' && $method === 'POST') {
        echo json_encode(['success' => true, 'message' => '매수 신호가 취소되었습니다.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'NURIOH PHP REST API Handler',
        'path' => $path
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
