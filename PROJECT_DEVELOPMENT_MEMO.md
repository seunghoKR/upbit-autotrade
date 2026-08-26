# 📝 누리오(NURIOH) 트레이더 개발 기획 & 전체 작업 종합 메모

---

## 📌 1. 프로젝트 기본 정보
- **브랜드/서비스명:** **NURIOH TRADER (누리오 트레이더)**
- **목적:** 업비트(Upbit) Open API를 연동한 실시간 시세 감시, 기술적 지표(RSI/볼린저밴드) 기반 매매 신호 포착, 스마트폰 텔레그램 실시간 승인 및 원클릭 주문 집행, 모던 React 트레이딩 대시보드 구축.
- **운영 형태:** 24시간 파이 노드(Pi Node) 전용 PC 무중단 가동 + 비수탁형(Non-Custodial) 안전 구조.

---

## 🛠️ 2. 오늘 완료된 핵심 작업 내역

### 1) 백엔드 엔진 & 업비트 API 연동
- **JWT SHA-512 인증:** 업비트 REST API 및 실시간 WebSocket 시세 수집기 구현 (`server/upbit/`).
- **키 검증 완료:** 폰트 오탈자(대문자 I/소문자 l) 정밀 교정으로 **9개 보유 자산 실시간 조회 100% 성공**.
- **안전한 보안:** API 키 `AES-256-GCM` 암호화 및 **Microsoft Authenticator** 표준 TOTP 2단계 인증 탑재 (`server/security/`).

### 2) 기술적 분석 & 리스크 관리 전략
- **보조 지표:** RSI(14) 과매도/과매수 및 볼린저 밴드(Bollinger Bands) 하단 반등 포착 (`server/strategy/`).
- **리스크 관리:** 손절선(-2.0%), 익절선(+3.5%), 분할 매수 사이징, 신호 쿨다운(60초) 안전장치.
- **대기 모드:** 대표님이 원할 때만 감시를 시작할 수 있도록 기본 일시정지 상태 지원.

### 3) 스마트폰 텔레그램 인터랙티브 승인 비서
- **봇 계정:** `@nurioh_trade_bot` (Chat ID: `5618137472`)
- **승인 시스템:** 매매 신호 포착 시 스마트폰으로 `[✅ 즉시 승인 및 주문]` / `[❌ 주문 취소]` 인라인 버튼 발송.
- **원격 제어 명령어:** `/start_bot`, `/stop_bot`, `/balance`, `/status`.

### 4) React + Vite 모던 트레이딩 대시보드 (`dashboard/`)
- **NURIOH 브랜딩:** 다크 글래스모피즘 & 네온 액센트 엔터프라이즈 디자인.
- **실시간 자산 카드:** 총 평가 자산, 실시간 총 평가수익률(예: `+209.86%`), 총 평가손익(KRW), 원화 비중.
- **1분봉 차트 & 지표:** Recharts 기반 실시간 캔들 차트, RSI, 볼린저 밴드 시각화.
- **사용 안내 모달:** 대시보드 상단 `[📖 사용 안내]` 버튼 탑재.
- **PWA 앱 설치 지원:** 스마트폰 브라우저 접속 시 원클릭 `[📲 지금 바로 앱 설치하기]` 팝업 및 `[☑ 7일 동안 보지 않기]` 옵션.

### 5) 24시간 파이 노드 PC 전용 서버 이전 완료
- **테스트 및 노드 컴퓨터 IP:** `49.171.41.10` (업비트 등록 IP)
- **경로:** `C:\nuriohtrader`
- **프로세스:** `PM2` 무중단 백그라운드 서비스 등록 완료 (`status: online`).
- **외부 접속:** Cloudflare Tunnel로 전 세계 어디서든 스마트폰 접속 가능.

---

## 📂 3. 생성된 문서 & 계획서 목록

| 파일명 | 내용 설명 |
| :--- | :--- |
| **[`README.md`](./README.md)** | 프로젝트 전체 소개 및 원클릭 실행 매뉴얼 |
| **[`UPBIT_AUTO_TRADING_PLAN.md`](./UPBIT_AUTO_TRADING_PLAN.md)** | 업비트 자동매매 프로그램 개발 상세 계획서 (최종) |
| **[`NURIOH_MULTI_USER_EXPANSION_PLAN.md`](./NURIOH_MULTI_USER_EXPANSION_PLAN.md)** | 지인/회원들과 함께 쓰는 다중 사용자 SaaS 확장 계획서 |
| **[`PI_NODE_SERVER_SETUP_GUIDE.md`](./PI_NODE_SERVER_SETUP_GUIDE.md)** | 24시간 파이 노드 PC 서버 구축 및 PM2 설정 가이드 |
| **[`PROJECT_DEVELOPMENT_MEMO.md`](./PROJECT_DEVELOPMENT_MEMO.md)** | 본 개발 및 작업 종합 메모 파일 |

---

## 💻 4. 핵심 명령어 요약

### 1) 텔레그램 메신저 명령어
- `/start_bot` : 자동매매 실시간 감시 시작 (알림 켜기)
- `/stop_bot` : 자동매매 감시 일시 정지 (알림 끄기)
- `/balance` : 업비트 원화 및 코인 실시간 잔고 조회
- `/status` : 봇 현재 상태 및 지표 파라미터 확인

### 2) 파이 노드 PC 서버 관리 명령어
```bash
# 상태 확인
pm2 status

# 서버 로그 실시간 확인
pm2 logs nurioh-trader

# 서버 재시작
pm2 restart nurioh-trader

# 서버 일시 중지 / 재시작
pm2 stop nurioh-trader
pm2 start nurioh-trader
```
