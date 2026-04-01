[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | 한국어

# Airbox

브라우저 기반 RSA 암호화 도구. 안전하지 않은 경로에서도 비밀을 안전하게 전달합니다.

**지금 사용하기:** https://sinlinli.github.io/airbox/

## 개요

짧은 텍스트(연락처, 비밀번호, 메모 등)를 암호화하여 지정된 수신자만 읽을 수 있도록 합니다. 브라우저에서 완전히 작동하며, 서버 불필요, 가입 불필요, 설치 불필요.

페이지를 열고 키를 생성하면 바로 암호화를 시작할 수 있습니다.

## 사용 방법

1. **수신자**가 RSA 키 쌍을 생성하고 **공개 키**를 발신자에게 공유 (공개 키는 노출되어도 안전)
2. **발신자**가 공개 키로 메시지를 암호화하고 **암호문**을 전송
3. **수신자**가 개인 키로 복호화

## 암호화 기술

| 구성 요소 | 선택 |
|----------|------|
| 알고리즘 | RSA-OAEP |
| 키 길이 | 2048 bit |
| 해시 | SHA-256 |
| 구현 | Web Crypto API (브라우저 네이티브) |
| 최대 평문 | 190 바이트 |

## 보안 특성

- **도청 방지** — 수동적 감시자는 복호화 불가
- **영구 저장 없음** — Cookie, localStorage, IndexedDB 미사용
- **CSP 적용** — `default-src 'self' 'unsafe-inline'`으로 모든 외부 요청 차단
- **의존성 제로** — 단일 HTML 파일, 외부 의존성 없음

### 방어할 수 없는 공격

- **능동적 MITM 공격** — 메시지를 변조할 수 있는 공격자는 공개 키를 대체 가능
- **단말 침해** — 기기 자체가 침해된 경우 암호화는 무의미

## 배포

`index.html`을 정적 파일 서버로 제공:

```bash
# Python
python3 -m http.server 8080

# Docker
docker run -d -p 8080:80 -v $(pwd):/usr/share/nginx/html:ro nginx:alpine

# Node.js
npx serve .
```

## 테스트

```bash
npm install
npx playwright install chromium
npm test
```

## 라이선스

MIT
