<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

// php/api/index.php를 직접 실행
$_SERVER['REQUEST_URI'] = '/api/auth/kakao';
$_SERVER['REQUEST_METHOD'] = 'POST';

$inputData = json_encode([
    'kakaoId' => 'kakao_5059461126',
    'name' => '이승호',
    'nickname' => '승호',
    'phone' => '01040692739',
    'email' => 'leeshkr@kakao.com',
    'birthyear' => '1972'
]);

// index.php require
require __DIR__ . '/api/index.php';