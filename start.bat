@echo off
chcp 65001 > nul
title 업비트 자동매매 & 대시보드 시스템

echo ========================================================
echo   🚀 영자의 업비트 자동매매 & 실시간 대시보드 시스템
echo ========================================================
echo.
echo [1/3] 필수 의존성 패키지 확인 중...
cd /d "%~dp0"

if not exist "node_modules" (
    echo 루트 패키지 설치 중...
    call npm install
)

if not exist "dashboard\node_modules" (
    echo 대시보드 패키지 설치 중...
    cd dashboard
    call npm install
    cd ..
)

echo.
echo [2/3] 브라우저 자동 오픈 준비 (3초 후 http://localhost:3000 열림)...
start /b cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

echo.
echo [3/3] 백엔드 서버(포트 4000) 및 React 대시보드(포트 3000) 가동 중...
echo ========================================================
echo   - 대시보드: http://localhost:3000
echo   - API 서버: http://localhost:4000
echo   - 종료하려면 이 창에서 Ctrl + C 를 누르세요.
echo ========================================================
echo.

npm run dev
pause
