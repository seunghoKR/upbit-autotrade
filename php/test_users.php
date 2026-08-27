<?php
require_once __DIR__ . '/config/database.php';
$pdo = Database::getConnection();

// leeshkr@kakao.com 유저를 ADMIN으로 업데이트
$pdo->exec("UPDATE nurioh_users SET role='ADMIN', tier='VIP', max_slots=5, subscription_expires_at='2099-12-31 23:59:59' WHERE email='leeshkr@kakao.com'");

// 회원 목록 확인
$stmt = $pdo->query("SELECT id, kakao_id, nickname, email, role, tier, max_slots, created_at FROM nurioh_users ORDER BY id DESC");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: application/json; charset=utf-8');
echo json_encode($users, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);