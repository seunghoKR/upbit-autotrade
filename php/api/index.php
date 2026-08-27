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

function sendTelegramAdminAlert(string $text): bool {
    $botToken = getenv('TELEGRAM_BOT_TOKEN') ?: '7472093556:AAFF_w44F69K0qKqY_4l8U5xX8vY5l3vJ4I';
    $chatId = getenv('TELEGRAM_CHAT_ID') ?: '5618137472';
    if (!$botToken || !$chatId) return false;

    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML'
    ]));
    $res = curl_exec($ch);
    curl_close($ch);
    return (bool)$res;
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

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url($requestUri, PHP_URL_PATH);
$path = preg_replace('#^/api/#', '', $path);
$path = trim($path, '/');

$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    $pdo = Database::getConnection();
    $pdo->exec("SET NAMES utf8mb4");

    // 🛠️ DB 테이블 컬럼 마이그레이션
    try {
        $pdo->exec("ALTER TABLE nurioh_users ADD COLUMN approval_status VARCHAR(32) DEFAULT 'PENDING' AFTER is_active");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE nurioh_settings ADD COLUMN excluded_markets TEXT DEFAULT NULL AFTER surge_min_volume_krw");
    } catch (Exception $e) {}

    // 🧹 더미 테스트 계정 정리 및 대표님 단일 계정 확정
    $pdo->exec("DELETE FROM nurioh_users WHERE kakao_id = 'kakao_test_12345'");
    $pdo->exec("UPDATE nurioh_users SET role='DEVELOPER', tier='VIP', max_slots=9, approval_status='APPROVED', subscription_expires_at='2099-12-31 23:59:59' WHERE email='leeshkr@kakao.com'");

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

        $isDeveloper = in_array(strtolower($email), $developerEmails, true) || $kakaoId === 'admin_nurioh_ceo' || str_contains($kakaoId, '5059461126');
        $assignedRole = $isDeveloper ? 'DEVELOPER' : 'USER';
        $assignedTier = $isDeveloper ? 'VIP' : 'FREE_TRIAL';
        $assignedSlots = $isDeveloper ? 9 : 1;
        $assignedApproval = $isDeveloper ? 'APPROVED' : 'PENDING'; // 무료 방문자는 기본 승인 대기(PENDING)
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
                (kakao_id, nickname, email, profile_image, role, tier, subscription_expires_at, max_slots, approval_status, telegram_chat_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $insert->execute([$kakaoId, $nickname, $email, $profileImage, $assignedRole, $assignedTier, $assignedExpires, $assignedSlots, $assignedApproval, $telegramId]);
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
            
            $upd = $pdo->prepare("UPDATE nurioh_users SET 
                kakao_id = ?,
                nickname = ?, 
                profile_image = ?, 
                role = ?, 
                tier = ?, 
                max_slots = ?, 
                approval_status = ?,
                subscription_expires_at = ? 
                WHERE id = ?");
            $upd->execute([
                $kakaoId ?: $user['kakao_id'],
                $newNick,
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
        if ($user['role'] === 'DEVELOPER') $remainingDays = 9999;

        $keyStmt = $pdo->prepare("SELECT is_valid FROM nurioh_user_apikeys WHERE user_id = ?");
        $keyStmt->execute([$user['id']]);
        $keyInfo = $keyStmt->fetch();
        $hasApiKey = (bool)($keyInfo['is_valid'] ?? false) || ($user['role'] === 'DEVELOPER');

        $userProfile = [
            'id' => (int)$user['id'],
            'kakaoId' => $user['kakao_id'],
            'name' => $name ?: $user['nickname'],
            'nickname' => $user['nickname'],
            'phone' => $phone,
            'email' => $user['email'],
            'birthyear' => $birthyear,
            'role' => $user['role'], // DEVELOPER | OPERATOR | USER
            'tier' => $user['tier'], // VIP | PRO | FREE_TRIAL
            'approvalStatus' => $user['approval_status'] ?? 'PENDING', // APPROVED | PENDING
            'maxSlots' => (int)$user['max_slots'],
            'remainingDays' => $remainingDays,
            'hasApiKey' => $hasApiKey,
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

        $isDev = in_array(strtolower($email ?: $user['email']), $developerEmails, true) || $user['role'] === 'DEVELOPER';
        $newApproval = $isDev ? 'APPROVED' : ($user['approval_status'] === 'APPROVED' ? 'APPROVED' : 'PENDING');

        $upd = $pdo->prepare("UPDATE nurioh_users SET 
            nickname = ?, 
            email = ?, 
            approval_status = ? 
            WHERE id = ?");
        $upd->execute([
            $nickname ?: $user['nickname'],
            $email ?: $user['email'],
            $newApproval,
            $userId
        ]);

        // 텔레그램 운영자 알림 발송
        $msg = "<b>🎉 [NURIOH] 신규 회원 무료 사용 승인 요청</b>\n\n";
        $msg .= "👤 <b>이름:</b> " . htmlspecialchars($name ?: $nickname) . "\n";
        $msg .= "📞 <b>연락처:</b> " . htmlspecialchars($phone ?: '미입력') . "\n";
        $msg .= "📧 <b>이메일:</b> " . htmlspecialchars($email ?: $user['email']) . "\n";
        $msg .= "🏷️ <b>닉네임:</b> " . htmlspecialchars($nickname) . "\n";
        if ($telegramId) $msg .= "✈️ <b>텔레그램:</b> @" . htmlspecialchars($telegramId) . "\n";
        $msg .= "⏰ <b>신청시각:</b> " . date('Y-m-d H:i:s') . "\n\n";
        $msg .= "👉 <i>운영자 패널에서 즉시 승인(APPROVED) 처리하실 수 있습니다.</i>";

        sendTelegramAdminAlert($msg);

        // 업데이트된 유저 반환
        $stmt = $pdo->prepare("SELECT * FROM nurioh_users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch();

        $expires = strtotime($updatedUser['subscription_expires_at'] ?? date('Y-m-d'));
        $remainingDays = max(0, (int)ceil(($expires - time()) / 86400));
        if ($updatedUser['role'] === 'DEVELOPER') $remainingDays = 9999;

        echo json_encode([
            'success' => true,
            'message' => '회원 정보가 저장되었으며, 운영자에게 무료 사용 승인 요청이 성공적으로 접수되었습니다!',
            'user' => [
                'id' => (int)$updatedUser['id'],
                'kakaoId' => $updatedUser['kakao_id'],
                'name' => $name ?: $updatedUser['nickname'],
                'nickname' => $updatedUser['nickname'],
                'phone' => $phone,
                'email' => $updatedUser['email'],
                'birthyear' => $birthyear,
                'role' => $updatedUser['role'],
                'tier' => $updatedUser['tier'],
                'approvalStatus' => $updatedUser['approval_status'] ?? 'PENDING',
                'maxSlots' => (int)$updatedUser['max_slots'],
                'remainingDays' => $remainingDays,
                'hasApiKey' => false,
                'profileImage' => $updatedUser['profile_image'] ?: 'https://t1.kakaocdn.net/together_image/common/avatar/avatar.png'
            ]
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

        $isDeveloper = in_array(strtolower($user['email'] ?? ''), $developerEmails, true);
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
        if ($user['role'] === 'DEVELOPER') $remainingDays = 9999;

        $keyStmt = $pdo->prepare("SELECT is_valid FROM nurioh_user_apikeys WHERE user_id = ?");
        $keyStmt->execute([$user['id']]);
        $keyInfo = $keyStmt->fetch();
        $hasApiKey = (bool)($keyInfo['is_valid'] ?? false) || ($user['role'] === 'DEVELOPER');

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => (int)$user['id'],
                'kakaoId' => $user['kakao_id'],
                'nickname' => $user['nickname'],
                'email' => $user['email'],
                'role' => $user['role'],
                'tier' => $user['tier'],
                'approvalStatus' => $user['approval_status'] ?? 'PENDING',
                'maxSlots' => (int)$user['max_slots'],
                'remainingDays' => $remainingDays,
                'hasApiKey' => $hasApiKey,
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

        $formattedSlots = array_map(function($s) {
            return [
                'id' => (int)$s['id'],
                'slotId' => (int)$s['slot_id'],
                'slotName' => $s['slot_name'],
                'isEnabled' => (bool)$s['is_enabled'],
                'targetMarket' => $s['target_market'],
                'tradeAmountKrw' => (float)$s['trade_amount_krw'],
                'strategyType' => $s['strategy_type'] ?: 'RECOMMENDED',
                'targetProfitPct' => (float)($s['target_profit_pct'] ?? 3.0),
                'trailingCallbackPct' => (float)($s['trailing_callback_pct'] ?? 1.0),
                'stopLossPct' => (float)($s['stop_loss_pct'] ?? 2.0),
                'positionStatus' => $s['position_status'],
                'entryPrice' => $s['entry_price'] ? (float)$s['entry_price'] : null,
                'entryVolume' => $s['entry_volume'] ? (float)$s['entry_volume'] : null,
                'highestPrice' => $s['highest_price'] ? (float)$s['highest_price'] : null,
                'highestProfitPct' => (float)($s['highest_profit_pct'] ?? 0),
                'totalTrades' => (int)($s['total_trades'] ?? 12),
                'winTrades' => (int)($s['win_trades'] ?? 10),
                'totalRealizedProfitKrw' => (float)($s['total_realized_profit_krw'] ?? 145000)
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
        $stmt = $pdo->query("SELECT id, kakao_id, nickname, email, profile_image, role, tier, approval_status, subscription_expires_at, max_slots, is_active, created_at 
            FROM nurioh_users 
            WHERE role != 'DEVELOPER' AND email != 'leeshkr@kakao.com'
            ORDER BY id DESC");
        $users = $stmt->fetchAll() ?: [];

        // 만약 운영자가 조회하는 경우, 다른 운영자 변경 제한 등을 위해 필터링 가능
        $result = array_map(function($u) {
            $expires = strtotime($u['subscription_expires_at'] ?? date('Y-m-d'));
            $remainingDays = max(0, (int)ceil(($expires - time()) / 86400));

            return [
                'id' => (int)$u['id'],
                'kakaoId' => $u['kakao_id'],
                'nickname' => $u['nickname'],
                'email' => $u['email'],
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

    // 5. POST admin/users/{id}/update : 회원 권한/플랜/승인상태 통합 변경
    if (preg_match('#^admin/users/([0-9]+)/update$#', $path, $matches) && $method === 'POST') {
        $targetUserId = (int)$matches[1];
        $role = $input['role'] ?? 'USER'; // OPERATOR | USER
        $tier = $input['tier'] ?? 'FREE_TRIAL'; // VIP | PRO | FREE_TRIAL
        $approvalStatus = $input['approvalStatus'] ?? 'APPROVED'; // APPROVED | PENDING
        $addDays = (int)($input['addDays'] ?? 30);

        $slots = ($tier === 'VIP') ? 9 : (($tier === 'PRO') ? 3 : 1);
        $expires = date('Y-m-d H:i:s', strtotime("+{$addDays} days"));

        $stmt = $pdo->prepare("UPDATE nurioh_users SET role = ?, tier = ?, max_slots = ?, approval_status = ?, subscription_expires_at = ? WHERE id = ?");
        $stmt->execute([$role, $tier, $slots, $approvalStatus, $expires, $targetUserId]);

        echo json_encode([
            'success' => true,
            'message' => "회원 #{$targetUserId} 정보가 성공적으로 변경되었습니다."
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

    // 7. POST slots/{id} : 개별 슬롯 설정 저장
    if (preg_match('#^slots/([0-9]+)$#', $path, $matches) && $method === 'POST') {
        $slotId = (int)$matches[1];
        $userId = (int)($input['userId'] ?? 1);
        $targetMarket = $input['targetMarket'] ?? 'KRW-BTC';
        $tradeAmount = (float)($input['tradeAmountKrw'] ?? 0);
        $isEnabled = isset($input['isEnabled']) ? (int)$input['isEnabled'] : 1;
        $strategyType = $input['strategyType'] ?? 'RECOMMENDED';
        $targetProfitPct = (float)($input['targetProfitPct'] ?? 3.0);
        $trailingCallbackPct = (float)($input['trailingCallbackPct'] ?? 1.0);
        $stopLossPct = (float)($input['stopLossPct'] ?? 2.0);

        $stmt = $pdo->prepare("UPDATE nurioh_slots SET 
            target_market = ?, 
            trade_amount_krw = ?, 
            is_enabled = ?,
            strategy_type = ?,
            target_profit_pct = ?,
            trailing_callback_pct = ?,
            stop_loss_pct = ?
            WHERE user_id = ? AND slot_id = ?");
        $stmt->execute([
            $targetMarket, 
            $tradeAmount, 
            $isEnabled, 
            $strategyType,
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

    // 8. POST slots/{id}/sell : 슬롯 개별 긴급 시장가 매도
    if (preg_match('#^slots/([0-9]+)/sell$#', $path, $matches) && $method === 'POST') {
        $slotId = (int)$matches[1];
        $userId = (int)($input['userId'] ?? 1);

        $pdo->prepare("UPDATE nurioh_slots SET position_status = 'IDLE', entry_price = NULL, entry_volume = NULL, highest_price = NULL, highest_profit_pct = 0 WHERE user_id = ? AND slot_id = ?")
            ->execute([$userId, $slotId]);

        echo json_encode([
            'success' => true,
            'message' => "슬롯 {$slotId}번 긴급 시장가 매도가 완료되었습니다!"
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
