# Any Life AI - 24시간 무중단 단독 클라우드 서버 통합 인프라 가이드

> **작성일자:** 2026년 10월 3일  
> **현재 버전:** `v5.5.0` (24/7 Cloud Engine Edition)  
> **운영 상태:** 24시간 365일 무중단 완전 가동 중 (Green)  
> **목적:** 다른 컴퓨터(노트북, 사무실 PC 등)에서 프로젝트를 이어받아 개발 및 운영할 때 누락이나 혼선이 없도록 모든 인프라 자산, 접속 정보, 배포 절차, 장애 조치 매뉴얼을 100% 완벽하게 기록함.

---

## 📌 1. 핵심 아키텍처 전환 배경 및 요약

### 1-1. 이전 구조의 한계 (구형 웹호스팅 + 브라우저 의존)
- **과거 문제점:** 각 회원의 웹 브라우저(크롬 탭 등)가 켜져 있을 때만 업비트 웹소켓을 받아 매매 로직을 실행하는 구조였음.
- **손실 및 중단 원인:** 스마트폰 화면이 꺼지거나, PC가 절전모드로 들어가면 브라우저 자바스크립트가 즉시 정지되어 매도/손절 타이밍을 놓침 (김태영 운영자 등 피드백의 근본 원인).
- **IP 파편화:** 웹호스팅 IP(`115.68.168.242`)와 각 클라이언트 IP가 섞여 업비트 API 등록이 복잡했음.

### 1-2. 현재 구조: 단독 클라우드 가상서버 1대 올인원 (`v5.5.0`)
- **단일 서버 올인원:** 웹호스팅(Nginx) + PHP API + MariaDB + **24시간 Node.js 백엔드 데몬(PM2)**을 가상서버 1대로 전격 통합.
- **단일 IP 체제:** 모든 업비트 API 호출(조회, 매수, 매도, 손절)이 서버 IP **`49.247.139.123`** 단 1개로 일원화됨.
- **365일 무중단 트레이딩:** 사용자가 브라우저를 끄거나 자고 있어도 서버 백엔드 데몬이 **업비트 291개 전종목 실시간 틱을 0.01초 단위로 감시**하여 목표 익절(+3% 트레일링) 및 손절(-2%)을 칼같이 자동 집행함.

---

## 🖥️ 2. 클라우드 서버 인프라 제원 및 접속 정보

| 항목 | 상세 내용 | 비고 |
| :--- | :--- | :--- |
| **호스팅 제공사** | iwinv (스마일서브) 클라우드 가상서버 | Zone: `KR1-Lite-Z01` |
| **운영체제 (OS)** | Ubuntu 22.04 LTS (64bit) | 최신 커널 |
| **고정 공인 IP** | **`49.247.139.123`** | 서버 단일 고정 IP |
| **서버 사양** | vCPU 1Core / RAM 1GB + **Swap 2GB** (총 3GB) / NVMe 25GB | 메모리 점유율 ~48%, 디스크 여유 19GB |
| **대표 도메인** | `https://anylifeai.kr` / `https://www.anylifeai.kr` | Let's Encrypt SSL 무료 자동 갱신 |
| **SSH 접속 포트** | `22` (기본 포트) | 키 기반 인증 |
| **SSH 접속 계정** | `root` | 무암호 키 로그인 |
| **SSH 비밀키 파일** | `~/.ssh/id_ed25519_anylife` (Windows: `%USERPROFILE%\.ssh\id_ed25519_anylife`) | Ed25519 고보안 키 |

### 🔑 SSH 접속 명령어
```bash
# 기본 접속
ssh -i ~/.ssh/id_ed25519_anylife root@49.247.139.123

# Windows PowerShell 접속 예시
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_anylife" root@49.247.139.123
```

> **⚠️ 다른 컴퓨터에서 접속할 때:**
> 현재 개발 데스크탑의 `C:\Users\leesh\.ssh\id_ed25519_anylife` 비밀키 파일을 새 컴퓨터의 `~/.ssh/` 디렉터리에 복사해두시면 즉시 무암호 자동 로그인이 가능합니다.

---

## 🗄️ 3. 데이터베이스 (MariaDB 10.6) 정보

- **DB 종류:** MariaDB 10.6.23
- **데이터베이스명:** `aitrade` (호환성용 DB: `nuriohtrade` 동시 구성)
- **DB 접속 사용자:** `aitrade`
- **DB 비밀번호:** `#seungho0409`
- **로컬 연결 포트:** `127.0.0.1:3306`

### 콘솔 접속 명령어
```bash
mysql -u aitrade -p'#seungho0409' aitrade
```

### 주요 테이블 및 상태
1. **`nurioh_users`**: 대표님(id:3, role:DEVELOPER, tier:VIP, max_slots:12) 및 정식 회원 전원(6명) 100% 무손실 복원 완료.
2. **`nurioh_slots`**: 96개 슬롯의 전략, 매수금액, 장세 모드 설정 보존.
3. **`nurioh_user_apikeys`**: 회원별 업비트 Access/Secret Key 암호화 보관.
4. **`nurioh_settings`**: 시스템 전역 설정.  
   *(중요: `server_ip` 컬럼 값이 반드시 `'49.247.139.123'`으로 유지되어야 함)*
5. **`nurioh_payment_logs`**: 이용료 입금 및 연장 승인 이력.

---

## 🌐 4. 웹서버 (Nginx) 및 PHP-FPM 환경

- **Nginx 버전:** 1.18.0
- **PHP 버전:** PHP 8.1 FPM (`/run/php/php8.1-fpm.sock`)
- **웹루트 경로:** `/var/www/anylifeai.kr`
- **API 스크립트 경로:** `/var/www/anylifeai.kr/api/index.php`
- **Nginx 가상호스트 설정 파일:** `/etc/nginx/sites-available/anylifeai.kr`
  *(활성화 심볼릭 링크: `/etc/nginx/sites-enabled/anylifeai.kr`)*

### 🔒 SPA 캐시 방지 핵심 정책
사용자가 브라우저를 켤 때 항상 최신 리액트 빌드(`v5.5.0` 이상)를 즉시 수신하도록 아래 설정이 적용되어 있습니다:
```nginx
# index.html은 절대 브라우저에 캐시하지 않음
location = /index.html {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
}
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
}
```

---

## 🤖 5. 24시간 무중단 트레이딩 데몬 (PM2)

- **프로세스명:** `anylife-24h-daemon`
- **엔진 코드 경로:** `/root/anylife-engine/cloudDaemon.js`
- **프로세스 관리도구:** PM2 v7.0.4 (서버 재부팅 시 `systemd` 자동 재기동 등록 완료)

### 주요 관리 명령어
```bash
# 데몬 가동 상태 확인
pm2 status

# 실시간 틱 감시 및 매매 로그 확인 (최근 50줄)
pm2 logs anylife-24h-daemon --lines 50

# 데몬 코드 수정 후 재시작
pm2 restart anylife-24h-daemon

# 데몬 중지 / 시작
pm2 stop anylife-24h-daemon
pm2 start anylife-24h-daemon
```

### 데몬 주요 로직 (`cloudDaemon.js`)
1. 업비트 KRW 마켓 291개 전체 종목 실시간 웹소켓 구독.
2. 15초 주기로 실서버 DB의 활성 슬롯 파라미터 및 회원 설정 동기화.
3. 보유 코인의 실시간 수익률 계산:
   - 목표 익절선 도달 시 트레일링 스탑 추적 활성화.
   - 트레일링 콜백(-0.5% ~ -1.5%) 발생 또는 원금 손절선(-2.0%) 도달 시 즉시 실서버 매도 API 트리거.
4. 급등 거래량 및 당일 고가 돌파 감지 시 빈 슬롯에 자동 매수 API 트리거.

---

## 📋 6. 업비트 Open API 허용 IP 등록 정책

| 구분 | IP 주소 | 설명 |
| :--- | :--- | :--- |
| **실서버 운영용 (필수)** | **`49.247.139.123`** | **Any Life AI 클라우드 서버의 고정 공인 IP.** 일반 웹사이트 접속자 및 24시간 봇의 모든 매매 통신이 이 IP로 나감. |
| **로컬 연구실 개발용** | **`49.171.41.10`** | **대표님 현재 PC(집/사무실)의 인터넷 공인 IP.** `localhost:3000` 로컬 환경에서 테스트할 때 업비트가 검증하는 IP. |

> **💡 업비트 등록 권장 형식:**
> 업비트 Open API 관리 페이지의 [허용 IP 주소]에 아래와 같이 쉼표로 2개를 함께 등록해두시면 실서버 24시간 자동매매와 로컬 연구실 개발이 모두 완벽하게 작동합니다:
> ```text
> 49.247.139.123, 49.171.41.10
> ```

---

## 🚀 7. 다른 컴퓨터에서 프로젝트 작업 & 실서버 원클릭 배포 가이드

### 7-1. 새 컴퓨터 로컬 환경 준비
```bash
# 1. 깃 레포지토리 클론
git clone https://github.com/seunghoKR/upbit-autotrade.git
cd upbit-autotrade
git checkout dev

# 2. 대시보드 종속성 설치
cd dashboard
npm install

# 3. 로컬 연구실 실행
npm run dev
# -> http://localhost:3000 접속 확인
```

### 7-2. 코드 수정 후 실서버 원클릭 빌드 & 배포
프론트엔드(`dashboard/src`)나 백엔드(`php/api` 또는 `server/cloudDaemon.js`)를 수정한 후 실서버에 배포하는 표준 절차입니다:

```powershell
# [Windows PowerShell 기준]

# 1. 프론트엔드 최신 빌드
cd dashboard
npm run build
cd ..

# 2. 프론트엔드 정적 파일 실서버 배포
tar -czf dist.tar.gz -C dashboard/dist .
scp -i "$env:USERPROFILE\.ssh\id_ed25519_anylife" dist.tar.gz root@49.247.139.123:/tmp/
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_anylife" root@49.247.139.123 "tar -xzf /tmp/dist.tar.gz -C /var/www/anylifeai.kr && chown -R www-data:www-data /var/www/anylifeai.kr"
Remove-Item dist.tar.gz

# 3. PHP API 수정 시 배포
scp -i "$env:USERPROFILE\.ssh\id_ed25519_anylife" php/api/index.php root@49.247.139.123:/var/www/anylifeai.kr/api/index.php

# 4. 24시간 트레이딩 데몬 수정 시 배포 & PM2 재시작
scp -i "$env:USERPROFILE\.ssh\id_ed25519_anylife" server/cloudDaemon.js root@49.247.139.123:/root/anylife-engine/cloudDaemon.js
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_anylife" root@49.247.139.123 "pm2 restart anylife-24h-daemon"

# 5. Git 커밋 & 푸시
git add .
git commit -m "feat: 업데이트 내용 요약"
git push origin dev
```

---

## 🛡️ 8. 장애 발생 시 긴급 점검 체크리스트 (1분 진단)

1. **웹사이트 접속 불가 시:**
   - Nginx 상태 확인: `ssh ... "systemctl status nginx"`
   - 도메인 DNS 확인: `nslookup anylifeai.kr` (응답 IP가 `49.247.139.123`인지 확인)
2. **업비트 조회/주문 에러 (`no_authorization_ip` 등) 발생 시:**
   - 업비트 Open API 허용 IP에 `49.247.139.123`이 등록되어 있는지 확인.
   - DB 설정값 확인: `mysql -u aitrade -p'#seungho0409' aitrade -e "SELECT server_ip FROM nurioh_settings;"` -> `49.247.139.123`이어야 함.
3. **24시간 자동매매가 멈춘 것 같을 때:**
   - PM2 상태 확인: `ssh ... "pm2 status"`
   - 실시간 로그 확인: `ssh ... "pm2 logs anylife-24h-daemon --lines 30"`
   - 데몬 재시작: `ssh ... "pm2 restart anylife-24h-daemon"`

---
**Created by AI Design & Infra Director Youngja (영자) for Any Life AI**
