@echo off
chcp 65001 > nul
title [NURIOH LAB] 누리오 자동매매 연구실 (C 드라이브 고속 모드)
set "PATH=C:\Users\leesh\AppData\Local\Programs\nodejs;%PATH%"

echo ========================================================
echo   🧪 누리오 자동매매 비밀 연구실 LAB 실행기 (C: 드라이브 고속 모드)
echo ========================================================
echo.

:: 1. C:\nuriohtrader 로컬 고속 실행 디렉토리 확인 및 시놀로지 실시간 동기화
if not exist "C:\nuriohtrader" mkdir "C:\nuriohtrader"
echo [1/4] 시놀로지 드라이브 코드를 C:\nuriohtrader 로 고속 동기화 중...
robocopy "%~dp0." "C:\nuriohtrader" /E /XD node_modules .git /XF *.log /NDL /NFL /NJH /NJS >nul 2>nul

cd /d "C:\nuriohtrader"

:: 2. Node.js 점검
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 🚨 [안내] 이 컴퓨터에 Node.js가 설치되어 있지 않습니다.
    echo   👉 https://nodejs.org/ko 에서 LTS 버전을 설치해 주세요.
    echo ========================================================
    pause
    exit /b
)

:: 3. 패키지 점검
echo [2/4] C 드라이브 필수 패키지 점검 중...
if not exist "node_modules" (
    echo 루트 패키지 설치 중...
    call npm.cmd install
)
if not exist "dashboard\node_modules" (
    echo 대시보드 패키지 설치 중...
    cd dashboard
    call npm.cmd install
    cd ..
)

:: 4. 브라우저 오픈
echo.
echo [3/4] 연구실 대시보드 브라우저 자동 오픈 (3초 후 http://localhost:3000)...
start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

:: 5. C 드라이브에서 초고속 구동
echo.
echo [4/4] 연구실 백엔드(4000) ^& 대시보드(3000) C 드라이브 구동 시작!
echo ========================================================
echo   ✨ 연구실 접속 주소: http://localhost:3000
echo   ✨ 시놀로지 디스크 부하 없이 C: 드라이브 로컬 초고속 모드로 구동됩니다!
echo   ✨ 연구실을 닫으시려면 이 창에서 Ctrl+C 를 누르세요.
echo ========================================================
echo.

call npm.cmd run dev
if %errorlevel% neq 0 (
    echo.
    echo 🚨 구동 중 오류가 발생했습니다.
    pause
)


