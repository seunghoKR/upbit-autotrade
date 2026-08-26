# 🚀 영자의 업비트 자동매매 & 실시간 승인 트레이딩 시스템

> **Design & Built with Youngja 🎨✨**  
> 업비트 Open API를 연동하여 실시간 시세를 분석하고, 텔레그램 메신저로 승인 요청을 보내 대표님의 최종 결정으로 주문을 체결하는 스마트 트레이딩 솔루션입니다.

---

## 🌟 주요 기능
1. **업비트 Open API 연동:** 실시간 캔들/호가 조회 및 JWT 기반 안전한 시장가/지정가 주문 집행
2. **기술적 지표 전략 엔진:** RSI(14) 과매도/과매수 포착 및 볼린저 밴드(Bollinger Bands) 하단 지지 반등 감지
3. **텔레그램 인터랙티브 승인 비서 (`@nurioh_trade_bot`):**
   - 매매 신호 포착 시 스마트폰으로 즉시 알림 전송
   - `[✅ 즉시 승인 및 주문]` / `[❌ 주문 취소]` 원클릭 버튼 제공
   - 타임아웃(기본 30초) 정책 적용 (자동 취소 또는 자동 실행)
   - `/balance`(잔고), `/status`(상태), `/start_bot`, `/stop_bot` 원격 제어 지원
4. **강력한 2단계 보안:** 
   - 업비트 Secret Key `AES-256-GCM` 암호화
   - **Microsoft Authenticator** 표준 TOTP 2FA 지원
5. **React + Vite 실시간 모던 대시보드:**
   - 다크 테마 & 네온 액센트 디자인
   - 실시간 계좌 자산, 보유 코인 평가손익 카드
   - 실시간 차트 & 보조지표 시각화
   - 전략 파라미터(손절률, 익절률, 1회 주문금액 등) 실시간 튜닝

---

## 🚀 실행 방법

### 1. 사전 준비 (업비트 IP 등록)
- 업비트 웹사이트 > **[마이페이지] > [Open API 관리]**에 접속하여 대표님 현재 공인 IP를 등록해 주세요:
  - **등록할 IP:** `49.171.41.10`
  - **권한:** `자산조회`, `주문조회`, `주문하기` (출금하기 제외)

### 2. 프로그램 실행 (원클릭 실행)
```bash
# 전체 시스템(백엔드 서버 + 대시보드 웹) 동시 가동
npm run dev
```

- **백엔드 API 서버:** `http://localhost:4000`
- **React 웹 대시보드:** `http://localhost:3000`

---

## 📁 프로젝트 구조
```
자동매매프로그램/
├── .env                       # API 키 및 환경 변수
├── server/                    # 백엔드 엔진 & 텔레그램 봇
│   ├── config.js              # 환경 설정
│   ├── security/              # AES-256 암호화 & Microsoft OTP 2FA
│   ├── upbit/                 # 업비트 REST / WebSocket 클라이언트
│   ├── strategy/              # RSI, 볼린저 밴드 & 매매 신호 엔진
│   ├── telegram/              # 텔레그램 승인 봇 매니저
│   └── index.js               # Express & WebSocket 서버
├── dashboard/                 # React + Vite 모던 웹 대시보드
│   ├── src/
│   │   ├── components/        # Header, BalanceCard, ChartView, StrategySetting 등
│   │   └── App.jsx            # 메인 트레이딩 터미널 화면
└── UPBIT_AUTO_TRADING_PLAN.md # 프로젝트 상세 기획서
```
