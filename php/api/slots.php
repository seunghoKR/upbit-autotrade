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
        // 슬롯 1~5 목록 및 현재 상태 조회
        $stmt = $pdo->query("SELECT * FROM nurioh_slots ORDER BY slot_id ASC");
        $slots = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'slots' => $slots
        ], JSON_UNESCAPED_UNICODE);
    } elseif ($method === 'POST') {
        // 슬롯 설정 업데이트
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['slot_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'slot_id가 필요합니다.']);
            exit;
        }

        $slotId = (int)$input['slot_id'];
        $slotName = $input['slot_name'] ?? "Slot {$slotId}";
        $isEnabled = isset($input['is_enabled']) ? (int)$input['is_enabled'] : 1;
        $targetMarket = $input['target_market'] ?? 'KRW-BTC';
        $tradeAmountKrw = (float)($input['trade_amount_krw'] ?? 50000.0);

        $stmt = $pdo->prepare("
            UPDATE nurioh_slots 
            SET slot_name = :slot_name,
                is_enabled = :is_enabled,
                target_market = :target_market,
                trade_amount_krw = :trade_amount_krw
            WHERE slot_id = :slot_id
        ");

        $stmt->execute([
            ':slot_name' => $slotName,
            ':is_enabled' => $isEnabled,
            ':target_market' => $targetMarket,
            ':trade_amount_krw' => $tradeAmountKrw,
            ':slot_id' => $slotId
        ]);

        echo json_encode([
            'success' => true,
            'message' => "슬롯 {$slotId} 설정이 저장되었습니다."
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
