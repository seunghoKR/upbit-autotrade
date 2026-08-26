<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$pdo = Database::getConnection();

try {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $slotId = isset($input['slot_id']) ? (int)$input['slot_id'] : null;

    if ($slotId !== null) {
        // 특정 슬롯 비상 청산 상태 변경
        $stmt = $pdo->prepare("
            UPDATE nurioh_slots 
            SET position_status = 'IDLE',
                entry_price = NULL,
                entry_volume = NULL,
                entry_amount_krw = NULL,
                highest_price = NULL,
                highest_profit_pct = 0.0,
                entered_at = NULL
            WHERE slot_id = :slot_id
        ");
        $stmt->execute([':slot_id' => $slotId]);

        // 로그 기록
        $logStmt = $pdo->prepare("
            INSERT INTO nurioh_trade_history (slot_id, market, side, trade_type, price, volume, amount_krw)
            VALUES (:slot_id, :market, 'SELL', 'PANIC_SELL_SLOT', 0, 0, 0)
        ");
        $logStmt->execute([
            ':slot_id' => $slotId,
            ':market' => $input['market'] ?? 'UNKNOWN'
        ]);

        echo json_encode([
            'success' => true,
            'message' => "슬롯 {$slotId} 긴급 청산 완료"
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // 전체 슬롯 일괄 초기화
        $pdo->query("
            UPDATE nurioh_slots 
            SET position_status = 'IDLE',
                entry_price = NULL,
                entry_volume = NULL,
                entry_amount_krw = NULL,
                highest_price = NULL,
                highest_profit_pct = 0.0,
                entered_at = NULL
        ");

        $logStmt = $pdo->prepare("
            INSERT INTO nurioh_trade_history (market, side, trade_type, price, volume, amount_krw)
            VALUES ('ALL', 'SELL', 'PANIC_SELL_ALL', 0, 0, 0)
        ");
        $logStmt->execute();

        echo json_encode([
            'success' => true,
            'message' => '모든 슬롯 및 자산 긴급 Panic Sell 완료'
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
