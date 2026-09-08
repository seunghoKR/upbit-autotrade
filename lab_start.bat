@echo off
chcp 65001 > nul
title [NURIOH LAB] 누리오 자동매매 연구실
cd /d "%~dp0"

echo ========================================================
echo   🧪 누리오(NURIOH) 자동매매 비밀 연구실 (LAB) 실행기
echo ========================================================
echo.
echo [1/4] 연구실(dev) 최신 코드 가져오는 중...
git checkout dev
git pull origin dev

echo.
echo [2/4] 필수 패키지 점검 중...
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
echo [3/4] 연구실 대시보드 브라우저 자동 오픈 (3초 후 http://localhost:3000)...
start /b cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

echo.
echo [4/4] 연구실 백엔드(4000) & 대시보드(3000) 구동 시작!
echo ========================================================
echo   ✨ 연구실 접속 주소: http://localhost:3000
echo   ✨ 헤더 상단에 [🧪 LAB 연구실] 보라색 뱃지가 뜹니다!
echo   ✨ 실서버 운영자들의 거래와 100% 분리된 안전 실험실입니다.
echo   ✨ 연구실을 닫으시려면 이 검은 창에서 [Ctrl + C] 를 누르세요.
echo ========================================================
echo.

npm run dev
pause
