<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM nurioh_settings WHERE id = 1");
        $settings = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'settings' => $settings ?: []
        ], JSON_UNESCAPED_UNICODE);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        $stmt = $pdo->prepare("
            UPDATE nurioh_settings
            SET surge_check_seconds = :surge_check_seconds,
                surge_rate_threshold = :surge_rate_threshold,
                surge_min_volume_krw = :surge_min_volume_krw,
                trailing_target_profit_pct = :trailing_target_profit_pct,
                trailing_callback_pct = :trailing_callback_pct,
                stop_loss_pct = :stop_loss_pct,
                approval_timeout_seconds = :approval_timeout_seconds,
                auto_execute_on_timeout = :auto_execute_on_timeout
            WHERE id = 1
        ");

        $stmt->execute([
            ':surge_check_seconds' => (int)($input['surge_check_seconds'] ?? 5),
            ':surge_rate_threshold' => (float)($input['surge_rate_threshold'] ?? 1.5),
            ':surge_min_volume_krw' => (int)($input['surge_min_volume_krw'] ?? 10000000),
            ':trailing_target_profit_pct' => (float)($input['trailing_target_profit_pct'] ?? 3.0),
            ':trailing_callback_pct' => (float)($input['trailing_callback_pct'] ?? 1.0),
            ':stop_loss_pct' => (float)($input['stop_loss_pct'] ?? 2.0),
            ':approval_timeout_seconds' => (int)($input['approval_timeout_seconds'] ?? 30),
            ':auto_execute_on_timeout' => isset($input['auto_execute_on_timeout']) ? (int)$input['auto_execute_on_timeout'] : 0,
        ]);

        echo json_encode([
            'success' => true,
            'message' => '전략 및 급등 감지 설정이 업데이트되었습니다.'
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
