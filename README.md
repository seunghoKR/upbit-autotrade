# 🚀 NURIOH AI TRADER | 업비트 비수탁형 멀티 슬롯 자동매매 플랫폼

> **Version:** `v2.1.0 (Production Release)`  
> **Live Service:** [https://nuriohtrade.iwinv.net](https://nuriohtrade.iwinv.net)  
> **Server IP:** `115.68.168.243`  
> **Design & Built by:** AI 디자인실장 영자 🎨✨ & 마스터 개발자 이승호 대표님 👑

---

## 🌟 1. 서비스 핵심 특장점

1. **비수탁형(Non-Custodial) 철통 보안:**
   - 회원의 투자금을 절대 직접 수탁하지 않습니다. 오직 본인 명의의 업비트 계좌에서 **출금 권한이 배제된 [조회/주문] Open API 키**로만 안전하게 구동됩니다.
2. **1초 카카오톡 원스톱 온보딩:**
   - 복잡한 가입 절차 없이 카카오톡 간편 인증 ➔ 3일 무료체험 신청 ➔ 운영자 승인 후 즉시 봇 가동!
3. **1~9번 독립 멀티 슬롯 분산 트레이딩:**
   - 종목별 독립적인 슬롯(BTC, ETH, SOL, XRP 등) 배정 및 1회 주문 금액 개별 설정 지원.
4. **텔레그램 매도 손익 정산 알림 (`@nurioh_trade_bot`):**
   - 불필요한 시세 감시 스팸 알림을 100% 차단하고, 오직 **[매도(익절/손절) 완료 시]**에만 슬롯 번호, 코인 종목, 실현 수익률(%), 실현 손익금(KRW) 정산 카드 1장 발송!
5. **모바일 & PC 반응형 엔터프라이즈 UI:**
   - 모바일 화면 줄바꿈 방지, 1줄 4분할 탭 메뉴, 전화번호 자동 하이픈 포맷터 탑재.

---

## 🌐 2. 서버 & 배포 인프라 환경

- **상용 웹서버:** iwinv Apache Web Hosting (PHP 8.4 UTF-8 + MariaDB 10.x)
- **도메인:** `https://nuriohtrade.iwinv.net` (IP: `115.68.168.243`)
- **원클릭 자동 배포:** `node deploy_ftp.js` (프론트엔드 빌드 및 PHP 백엔드 `/public_html` 자동 업로드)
- **시세 수집 엔진:** 24시간 파이 노드 PC (Node.js Express + WebSocket)

---

## 🚀 3. 빠른 시작 및 명령어 가이드

### 1) 프론트엔드 빌드 & 호스팅 서버 배포
```bash
# 1. 프론트엔드 프로덕션 빌드
cd dashboard
npm run build

# 2. iwinv 상용 호스팅 서버로 원클릭 FTP 배포
cd ..
node deploy_ftp.js
```

### 2) 로컬 개발 환경 실행
```bash
# Node 백엔드 (포트 4000) & Vite 프론트엔드 (포트 3000) 동시 실행
npm run dev
```

---

## 📂 4. 시스템 아키텍처

- **상세 개발 메모 및 트러블슈팅:** [`PROJECT_DEVELOPMENT_MEMO.md`](./PROJECT_DEVELOPMENT_MEMO.md)
- **다중 사용자 확장 기획서:** [`NURIOH_MULTI_USER_EXPANSION_PLAN.md`](./NURIOH_MULTI_USER_EXPANSION_PLAN.md)
- **파이 노드 PC 가이드:** [`PI_NODE_SERVER_SETUP_GUIDE.md`](./PI_NODE_SERVER_SETUP_GUIDE.md)

---
*© 2026 NURIOH TRADER. All rights reserved. Created with Youngja 💖*
