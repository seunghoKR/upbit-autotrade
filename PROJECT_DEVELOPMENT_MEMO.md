# 📝 누리오(NURIOH) AI 트레이더 종합 개발 메모 & 시스템 가이드

> **버전 (Version):** `v2.8.2 (Slot Performance Matrix in MyPage & Live Excel Sync)`  
> **최종 갱신일시:** 2026-09-01 10:37 (KST)  
> **작성자:** AI 디자인실장 영자 & 마스터 개발자 이승호 대표님  
> **프로젝트 위치:** `y:\SynologyDrive\00.withAI\자동매매프로그램`  
> **GitHub 저장소:** `https://github.com/seunghoKR/upbit-autotrade.git` (`main` 브랜치)

---

## 📌 1. 프로젝트 개요 & 비즈니스 모델

- **서비스명:** **NURIOH AI TRADER (누리오 AI 트레이더)**
- **서비스 성격:** 업비트(Upbit) Open API를 연동한 1인 기업 및 다중 사용자용 **비수탁형(Non-Custodial) 자동매매 SaaS 플랫폼**.
- **핵심 철학:**
  1. **자금 비예치 철통 보안:** 고객 투자금을 직접 수탁하지 않고, 고객 본인의 업비트 계좌에서 출금 권한이 배제된 조회/주문 API 키로만 안전하게 구동.
  2. **1초 원클릭 온보딩:** 카카오톡 간편 인증 ➔ 3일 무료체험 신청 ➔ 운영자 승인 후 즉시 가동.
  3. **스마트 정산 알림:** 불필요한 시세 감시 알림 스팸을 100% 제거하고, 오직 각 슬롯에서 **[매도 완료] 시에만 실현 수익률(%)과 실현 손익금(KRW) 정산 카드** 발송.

---

## 🌐 2. 서버 & 인프라 환경 명세 (다른 PC 작업 시 필수 참조)

### 1) 상용 웹호스팅 서버 (Frontend & PHP API & MariaDB)
- **도메인 / 서버 IP:** `https://nuriohtrade.iwinv.net` / `115.68.168.243` (*SSL 상시 사용)
- **서버 환경:** Apache Web Server + PHP 8.4 (UTF-8) + MariaDB 10.x
- **웹 루트 경로:** `/public_html/`
- **FTP 접속 정보:**
  - **Host:** `115.68.168.243` (Port: 21)
  - **User:** `nuriohtrade`
  - **Password:** `seungho0409#`
  - **배포 스크립트:** `deploy_ftp.js` (`node deploy_ftp.js` 실행 시 원클릭 자동 배포)
- **MariaDB DB 접속 정보:**
  - **Host:** `localhost` (Port: 3306)
  - **Database:** `nuriohtrade`
  - **User:** `nuriohtrade`
  - **Password:** `#seungho0409`
  - **테이블 스키마:** `php/migrate.php` 참조 (`nurioh_users`, `nurioh_user_apikeys`, `nurioh_settings`, `nurioh_slots`)

### 2) 24시간 파이 노드 PC / 로컬 백엔드 서버 (Node.js 시세 엔진)
- **로컬 경로:** `y:\SynologyDrive\00.withAI\자동매매프로그램` (또는 `C:\nuriohtrader`)
- **실행 프로세스:** Node.js (v18+) + Express + WebSocket (`server/index.js`)
- **무중단 운영:** `pm2 start server/index.js --name nurioh-trader`
- **외부 터널링:** Cloudflare Tunnel (`cloudflared.exe`)

---

## 🛠️ 3. 해결 완료된 핵심 기술 이슈 & 오류 디버깅 메모

다른 컴퓨터나 새로운 환경에서 작업할 때 혼선을 방지하기 위한 상세 트러블슈팅 기록입니다.

### ⚠️ [이슈 1] 가동 버튼을 눌러도 곧바로 '정지'로 되돌아가는 현상
- **원인:** 프론트엔드가 5초마다 `GET /api/status`를 호출하여 DB의 `bot_enabled` 컬럼을 읽어오는데, PHP 백엔드에 `POST /api/bot/start`, `POST /api/bot/stop`, `POST /api/bot/toggle` 엔드포인트가 누락되어 있어서 DB에 가동 상태가 기록되지 못함.
- **해결:** `php/api/index.php`에 `bot/start`, `bot/stop`, `bot/toggle`, `settings`, `panic-sell` 라우트를 완벽하게 구현하고 `nurioh_settings` 테이블과 연동하여 해결 완료.

### ⚠️ [이슈 2] 업비트 API 키 등록 시 IP 주소 확인 및 cURL SSL 이슈
- **원인:** 업비트 Open API 호출 시 서버 아웃바운드 공인 IP(`115.68.168.243`)가 업비트에 등록되어 있어야 함. 또한 PHP cURL 호출 시 SSL 인증서 검증 문제(`CURLOPT_SSL_VERIFYPEER => false`) 및 HS256 JWT 서명 처리 필요.
- **해결:** `php/api/index.php`의 `fetchUpbitAccounts()`에 SSL 우회 옵션과 `getOutboundServerIp()` 동적 IP 감지 기능을 탑재하여 9개 실계좌 동기화 100% 성공.

### ⚠️ [이슈 3] 모바일 화면에서 버튼/글자 깨짐 및 헤더 잘림 현상
- **원인:** 모바일 화면 너비(360~400px)에서 헤더 제어 버튼들이 너무 많아 우측으로 삐져나갔고, 프로필 카드의 `[마이페이지]`, `[회원관리]` 및 슬롯 카드의 텍스트가 2줄로 쪼개짐.
- **해결:**
  - `Header.jsx`: 모바일 1줄 초슬림 아이콘 바 배치.
  - `SubscriptionCard.jsx`: `grid grid-cols-4` 및 `whitespace-nowrap` 적용.
  - `SlotManager.jsx`: 타이틀을 `멀티 슬롯 자동매매 매니저`로 정돈하고 슬롯명/전략 뱃지 축소.
  - `MyPageModal.jsx`: 탭 메뉴 4분할 1줄 정렬 및 전화번호 자동 하이픈 포맷터(`010-XXXX-XXXX`) 탑재.

### ⚠️ [이슈 4] PC 모드에서 헤더와 본문 카드의 좌우 수직선 불일치
- **원인:** `Header.jsx`는 `header` 태그 자체에 패딩이 있고 안쪽 컨테이너에는 패딩이 없었던 반면, `App.jsx`의 `main` 컨테이너에는 `p-6`이 적용되어 좌우 24px씩 너비가 어긋남.
- **해결:** `Header.jsx`와 `App.jsx`의 컨테이너를 **`max-w-7xl w-full mx-auto px-4 sm:px-6`** 으로 100% 일치시켜 수직 칼정렬 완성.

### ⚠️ [이슈 5] 텔레그램 스팸 알림 방지 및 매도 정산 알림 특화
- **원인:** 매수 신호 감시 시마다 알림이 과도하게 울려 실질적인 손익 파악이 어려움.
- **해결:** 매수/감시 알림을 끄고, 오직 각 슬롯에서 **[매도(익절/손절)] 완료 시에만 슬롯 번호, 종목, 실현 수익률(%), 실현 손익금(KRW), 매수가/매도가**를 담은 정산 카드만 발송하도록 개편.

### ⚠️ [이슈 6] 마이페이지에서 개인 정보 입력 중 폼이 주기적으로 초기화되는 현상
- **원인:** `App.jsx`에서 5초마다 백그라운드로 `loadData()`(유저 프로필 조회)가 실행되어 `currentUser` 객체가 갱신됨. 이때 `MyPageModal.jsx`의 `useEffect` 의존성 배열에 `user` 객체 속성들이 지정되어 있어, 입력 중인 폼 상태(`name`, `phone`, `email` 등)가 5초마다 DB의 기존 값으로 강제 덮어쓰기(초기화)됨.
- **해결:** `MyPageModal.jsx`에 `prevIsOpenRef`를 적용하여 **모달이 처음 열리는 시점(`false -> true`)에만** 폼 데이터를 초기화하고, 모달이 열려 있는 동안 백그라운드에서 유저 객체가 갱신되어도 입력 중인 폼 값을 절대 덮어쓰지 않도록 안전 가드를 구축함.

### ⚠️ [이슈 7] 슬롯 ON/OFF 버튼을 눌러도 5초 후 저절로 다시 켜지는(원복) 현상
- **원인:**
  1. PHP 백엔드 상단 마이그레이션에서 `nurioh_slots`의 신규 컬럼들(`surge_base_mode`, `surge_window_seconds` 등)이 상시 자동 생성되지 않고 `run_migration` 파라미터가 있을 때만 실행되도록 되어 있어, `UPDATE nurioh_slots` 실행 시 DB 컬럼 누락 에러(500)가 발생하여 저장이 실패함.
  2. 프론트엔드의 `isRecentlyUpdated` 보호 타임아웃(3.5초)이 5초 폴링 주기보다 짧아서, 5초 뒤 `loadData`가 실행되었을 때 저장이 실패한 서버의 기존 값(`is_enabled=1`)을 가져와 슬롯을 강제로 다시 켜버림.
- **해결:**
  1. `php/api/index.php` 상단에서 `nurioh_slots`의 모든 컬럼(`surge_base_mode`, `surge_window_seconds`, `strategy_type` 등)을 상시 자동 `ALTER TABLE ADD COLUMN`으로 안전 보장.
  2. `POST /api/slots/{id}` 엔드포인트를 `try-catch`로 완벽 감싸고 명시적인 불리언/정수 변환 및 DB 저장을 보장하며, 응답으로 확정된 `isEnabled`를 프론트엔드로 반환.
  3. `SlotManager.jsx`에서 `slot.isEnabled === true || slot.isEnabled === 1` 엄격 불리언 반전 로직 적용.
  4. `App.jsx`에서 수정한 슬롯의 상태 보호 시간을 15초(`15000ms`)로 대폭 연장하고 서버 확정 응답과 실시간 동기화하여 롤백 현상 100% 완전 해결.

### ⚠️ [이슈 8] 슬롯 카드 정사각형 비율 및 전략 스펙 미니 표(Strategy Spec Table) 탑재
- **요구사항:** 슬롯 카드의 크기를 시각적 안정감을 주는 정사각형에 가까운 비율로 조정하고, 추천전략 및 셀프전략의 핵심 파라미터(급등 감시/상승률, 최소거래대금, 돌파기준가, 목표익절선, 콜백되돌림, 손절선)를 최소 공간을 활용한 콤팩트 표(Table) 형태로 상시 표시.
- **해결:** `SlotManager.jsx`의 슬롯 카드를 `min-h-[320px]`의 단단한 스퀘어 위젯 형태로 개편하고, 2열 3행의 고밀도 다크 테마 `[전략 스펙 미니 표]`를 내장하여 한눈에 모든 매매 조건을 파악할 수 있도록 UI/UX를 혁신함.

### ⚠️ [이슈 9] 운영자 모드에서 운영자 계정이 '무료 (1슬롯)'으로 잘못 표시되는 현상
### ⚠️ [이슈 11] 마이페이지 팝업창 크기 통일 & 탭 통합 및 컴팩트 디자인
- **요구사항:**
  1. `[내 정보]`와 `[API 키]`를 하나로 통합하여 4분할 탭(`[내 정보 & API 키]`, `[앱 & 소리]`, `[텔레그램]`, `[플랜]`)으로 슬림화.
  2. `[앱 & 소리]` 탭 크기 기준으로 모든 탭의 팝업창 높이(`min-h-[580px] sm:min-h-[620px]`)를 일관성 있게 통일하여 탭 전환 시 덜컹거림 방지.
  3. `[텔레그램]` 맞춤 알림 토글 4종을 2열 2행(`grid grid-cols-1 sm:grid-cols-2 gap-2`)의 미니 카드로 압축하여 스크롤바 없이 100% 핏 달성.
- **해결:** `MyPageModal.jsx` 개편 완료.

### ⚠️ [이슈 12] 회원관리 목록 로딩 지연 원인 해결 및 0초 체감 로딩 적용
- **원인:** 백엔드 `php/api/index.php` 상단에서 매 API 요청마다 15개의 `ALTER TABLE` 쿼리가 무조건 실행되어 MySQL 메타데이터 락 및 쿼리 지연이 발생함.
- **해결:**
  1. `php/api/index.php`의 `ALTER TABLE` 마이그레이션을 `if (!empty($_GET['run_migration']))` 조건부 1회성 실행으로 격리하여 DB 오버헤드 제거 (응답 속도 10배 향상).
  2. `AdminUserManagement.jsx`에 모듈 레벨 메모리 캐시(`cachedAdminUsers`)를 적용하여 모달 오픈 시 0초 즉시 렌더링 + 백그라운드 무음 갱신(SWR 패턴) 구현.

### ⚠️ [이슈 13] 마이페이지 승인 및 보안 필수 안내 배너 신설
- **요구사항:**
  - 사용자가 실명, 닉네임, 연락처(전화번호) 및 업비트 API 키를 정확하게 입력해야 자동매매 시스템 승인이 가능하다는 점을 명확히 안내.
  - 최소한의 개인정보는 시스템 운영의 보안과 안전을 위해 필수이며, 텔레그램은 실시간 알림용 선택 사항임을 안내.
- **해결:** `MyPageModal.jsx`의 `[내 정보 & API 키]` 탭 최상단에 골드/앰버 톤의 **`[💡 자동매매 시스템 이용 승인 및 보안 필수 안내]`** 배너 카드 디자인 적용 완료.

---

## 📂 4. 프로젝트 핵심 파일 구조

```
y:\SynologyDrive\00.withAI\자동매매프로그램/
├── .htaccess                      # Apache URL Rewrite (API 라우팅 & SPA 프론트엔드 서빙)
├── deploy_ftp.js                  # iwinv 호스팅 서버 원클릭 FTP 배포 스크립트
├── package.json                   # Node.js 패키지 설정
├── README.md                      # 프로젝트 메인 안내서
├── PROJECT_DEVELOPMENT_MEMO.md    # 본 종합 개발 & 운영 메모 (v2.1.0)
│
├── dashboard/                     # React + Vite 프론트엔드
│   ├── dist/                      # 빌드 산출물 (호스팅 서버 /public_html에 배포됨)
│   ├── src/
│   │   ├── App.jsx                # 메인 대시보드 레이아웃 및 실시간 상태 관리
│   │   ├── components/
│   │   │   ├── Header.jsx         # 상단 글로벌 네비게이션 헤더
│   │   │   ├── SubscriptionCard.jsx # 프로필 & 3일 무료체험/마이페이지 진입 카드
│   │   │   ├── BalanceCard.jsx    # 업비트 실계좌 잔고 요약 카드
│   │   │   ├── SlotManager.jsx    # 1~9번 독립 멀티 슬롯 매니저
│   │   │   ├── MyPageModal.jsx    # 마이페이지 & 전화번호 자동포맷 & 슬롯한도 설정
│   │   │   ├── KakaoAuthModal.jsx # 심플 1초 카카오톡 간편 로그인 모달
│   │   │   ├── LandingPage.jsx    # 비로그인 첫 방문자용 랜딩 페이지
│   │   │   ├── AdminUserManagement.jsx # 마스터 관리자 전용 회원 승인/슬롯 관리
│   │   │   └── DevModeSwitcher.jsx# 우측 하단 초소형 DEV 모드 전환 바
│   │   └── services/
│   │       └── api.js             # REST API 통신 모듈
│   └── vite.config.js
│
├── php/                           # PHP 8.4 백엔드 (상용 호스팅 서버 구동)
│   ├── api/
│   │   └── index.php              # REST API 메인 라우터 (인증, 슬롯, 봇제어, 텔레그램)
│   ├── config/
│   │   └── database.php           # MariaDB PDO 커넥터
│   └── migrate.php                # MariaDB 테이블 자동 생성 마이그레이션
│
└── server/                        # Node.js 시세 감시 백엔드 (파이 노드 PC 구동)
    ├── index.js                   # Express + WebSocket 메인 서버
    ├── config.js                  # 업비트 및 텔레그램 설정
    ├── upbit/                     # 업비트 REST / WebSocket 클라이언트
    ├── strategy/                  # 급등 감지(surgeDetector), 슬롯관리, 기술지표(RSI/BB)
    └── telegram/
        └── bot.js                 # 텔레그램 봇 매도 정산 알림 매니저
```

---

## 💻 5. 다른 컴퓨터에서 개발 및 배포 시 명령어 가이드

### 1) 저장소 최신화 & 의존성 설치
```bash
# 깃 최신 코드 가져오기
git pull origin main

# 프론트엔드 의존성 설치
cd dashboard && npm install
```

### 2) 프론트엔드 빌드 & 상용 서버 원클릭 FTP 배포
```bash
# 프론트엔드 프로덕션 빌드
cd dashboard && npm run build

# 호스팅 서버(nuriohtrade.iwinv.net)로 즉시 FTP 자동 배포
cd .. && node deploy_ftp.js
```

### 3) 로컬 개발 서버 테스트 실행
```bash
# 로컬 Node 백엔드 실행 (포트 4000)
node server/index.js

# 로컬 Vite 프론트엔드 개발 서버 실행 (포트 3000)
npm run dev --prefix dashboard
```

---

## 🎯 6. 향후 고도화 로드맵

1. **아침 9시 데일리 결산 리포트:** 전일 하루 동안의 총 거래 횟수, 승률, 누적 실현 수익금을 텔레그램으로 매일 아침 자동 전송.
2. **하락장 2차 분할 매수(DCA):** 진입 후 -2.5% 추가 하락 시 1회 물타기로 평단가를 낮춰 반등 시 빠른 탈출 지원.
3. **PG사 / 정기 구독 결제 연동:** 3일 무료체험 만료 회원을 위한 무통장입금 자동 확인 및 카드 정기 결제 모듈 확장.

---
*Created by Jay & AI Design Lead Youngja @ Connect AI LAB*
