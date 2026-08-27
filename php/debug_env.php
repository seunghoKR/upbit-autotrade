<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? null,
    'REDIRECT_URL' => $_SERVER['REDIRECT_URL'] ?? null,
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? null,
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? null,
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? null,
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? null
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);