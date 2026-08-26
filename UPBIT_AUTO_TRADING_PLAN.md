# 🚀 업비트 자동매매 프로그램 개발 상세 계획서 (최종)

---

## 1. 프로젝트 개요 및 아키텍처 방향
- **목적:** 업비트(Upbit) Open API를 연동하여 실시간 시세 모니터링, 기술적 지표 기반 매매 신호 생성, 사용자 승인 기반 주문 실행 자동화.
- **핵심 철학:** **안정성(Stability)**, **보안(Security)**, **위험관리(Risk Management)**, **비수탁형(Non-Custodial)** 구조.
- **오픈소스 벤치마크:** 
  - **Freqtrade:** 파이썬 기반 전략 커스터마이징, 백테스팅 엔진, 알림 연동 구조 차용
  - **Hummingbot / OctoBot:** 이벤트 기반 주문 체결 핸들링 및 다중 지표 모듈화 참조

```mermaid
flowchart TB
    subgraph MarketData [시세 수집 & 분석 계층]
        UPBIT_WS[Upbit WebSocket / REST] --> Collector[실시간 데이터 수집기]
        Collector --> Indicator[기술적 지표 계산 엔진\n(RSI, MACD, BB, 볼륨 등)]
    end

    subgraph StrategyCore [전략 & 신호 엔진]
        Indicator --> SignalGen[매매 신호 발생기]
        SignalGen --> RiskManager[위험 관리 & 포지션 사이징]
    end

    subgraph ApprovalLayer [알림 & 승인 계층]
        RiskManager --> Notifier[카카오 알림톡 / 텔레그램 발송]
        Notifier --> UserApproval{사용자 승인 대기\n(설정 시간 초과 시 정책 적용)}
    end

    subgraph ExecutionLayer [주문 & 체결 계층]
        UserApproval -->|승인 또는 타임아웃 자동실행| OrderEngine[업비트 주문 엔진\n(AES-256 복호화)]
        OrderEngine --> UPBIT_ORDER[Upbit REST API 주문]
        UPBIT_ORDER --> Logger[(DB & 체결 로깅)]
    end
```

---

## 2. 상세 시스템 모듈 구성

### 2.1 시세 및 거래 데이터 조회 (Market Data Engine)
- **REST Quota API:** 계좌 잔고, 과거 캔들 데이터, 분봉/일봉 차트 조회 (요청 제한 초당 분당 쿼터 자동 조절 - Rate Limiter 적용).
- **WebSocket Feed:** 현재가(Ticker), 체결(Trade), 호가(Orderbook) 실시간 스트리밍 수신 및 연결 끊김 시 지수 백오프(Exponential Backoff) 재접속.

### 2.2 기술적 지표 & 전략 엔진 (Strategy Engine)
- **지표 모듈:** `TA-Lib` 또는 `pandas-ta` 기반 (이동평균선, RSI, 볼린저 밴드, 스토캐스틱, 거래량 가중 지표 등).
- **전략 커스텀:** JSON/YAML 설정 또는 파이썬 클래스 상속 방식의 유연한 전략 플러그인 구조.
- **백테스팅 엔진:** 과거 데이터를 활용한 시뮬레이션 및 샤프 지수, MDD(최대 낙폭) 산출.

### 2.3 알림 & 사용자 승인 시스템 (Approval & Notification)
- **다채널 알림 지원:** 
  - **카카오 알림톡 / 비즈니스 카카오톡:** 승인/반려 인터랙티브 버튼 지원
  - **텔레그램 봇 (대체/보조):** 인라인 키보드로 즉시 [매수 승인], [주문 취소], [긴급 정지] 가능
- **타임아웃 정책 (Fail-Safe):** 
  - 기본 N초(예: 30초) 내 무응답 시 사용자 사전 설정에 따라 `[자동 주문 실행]` 또는 `[주문 취소/스킵]` 모드 전환.

### 2.4 강력한 보안 아키텍처 (Security Engine)
- **비밀번호 & 2FA:** PBKDF2/Bcrypt 해시 + Google Authenticator / MS Authenticator (TOTP 표준 RFC 6238).
- **API Key 관리:** 
  - 데이터베이스에는 **AES-256-GCM** 암호화되어 저장 (서버 환경변수 기반 마스터 키 분리).
  - 업비트 API 키 발급 시 **[출금 권한] 완전 제외** (조회 및 주문 권한만 부여).
  - **IP 화이트리스트:** 서버 고정 IP만 업비트 API 접근 가능하도록 바인딩.
- **통신 보안:** 모든 엔드포인트 HTTPS/WSS 강제 적용 및 TLS 1.3 암호화.

### 2.5 안정성 & 위험 관리 (Risk Management)
- **포지션 사이징:** 계좌 총 평가액의 설정 비율(예: 종목당 최대 5~10%)만 진입하도록 분할 매수.
- **손절매(Stop-loss) & 익절(Take-profit):** 진입 시점 대비 -X% 도달 시 시장가 즉시 손절, 트레일링 스톱(Trailing Stop) 지원.
- **서킷 브레이커:** 연속 N회 손실 또는 일일 손실 한도(-Y%) 도달 시 당일 자동 매매 강제 정지.
- **상세 로깅:** Loguru/ELK 기반으로 주문 전송, API 왕복 지연시간, 체결 결과, 에러 스택트레이스를 일 단위 롤링 저장.

---

## 3. 개발 로드맵 (단계별 일정)

| 단계 | 주요 작업 내용 | 산출물 |
| :--- | :--- | :--- |
| **Phase 1: 기반 구축 및 API 연동** | • 업비트 REST/WebSocket 클라이언트 구현<br>• Rate Limiter 및 자동 재접속 모듈 구축 | Upbit API SDK, 시세 수집기 |
| **Phase 2: 전략 엔진 & 보안 모듈** | • 기술적 지표 계산 모듈 (`pandas-ta`)<br>• AES-256 키 암호화 및 TOTP 2FA 모듈 구현 | 전략 프레임워크, 암호화 유틸리티 |
| **Phase 3: 알림/승인 & 주문 집행** | • 텔레그램/카카오 알림 연동 및 승인 인터페이스<br>• 주문 실행기 및 위험관리(손절/사이징) 로직 | 알림 승인 봇, 주문 실행 엔진 |
| **Phase 4: 대시보드 UI & 백테스트** | • React + Vite 기반 트레이딩 대시보드 (Stitch 디자인 적용)<br>• 과거 데이터 백테스트 시뮬레이터 | 통합 웹 대시보드, 백테스터 |
| **Phase 5: 모의 테스트 및 실전 배포** | • 소액(페이퍼 트레이딩/실거래) 검증<br>• 고정 IP 클라우드 서버 배포 및 모니터링 세팅 | 프로덕션 봇 시스템, 운영 매뉴얼 |

---

## 4. 법적 고지 및 비즈니스 면책 사항 (Compliance)
- **비수탁형 설계:** 사용자 자금을 직접 보관하거나 입출금 권한을 갖지 않음.
- **투자자문/일임업 검토:** 프로그램 단순 판매/제공 형태인지, 전략 자동 생성인지에 따라 자본시장법상 유사투자자문업 신고 필요 여부 사전 확인.
- **면책 조항:** "본 프로그램은 투자 판단을 보조하는 도구이며, 최종 투자 판단과 손실에 대한 책임은 사용자 본인에게 있습니다" 약관 명시.
