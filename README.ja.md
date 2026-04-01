[English](README.md) | [简体中文](README.zh-CN.md) | 日本語 | [한국어](README.ko.md)

# Airbox

ブラウザ上で動作する RSA 暗号化ツール。安全でない経路でも秘密を安全に受け渡せます。

**今すぐ使う：** https://sinlinli.github.io/airbox/

## 概要

短いテキスト（連絡先、パスワード、メモなど）を暗号化し、意図した相手だけが読めるようにします。すべてブラウザ内で動作し、サーバー不要、登録不要、インストール不要。

ページを開いて鍵を生成すれば、すぐに暗号化を始められます。

## 使い方

1. **受信者** が RSA 鍵ペアを生成し、**公開鍵** を送信者に共有する（公開鍵は公開しても安全）
2. **送信者** が公開鍵でメッセージを暗号化し、**暗号文** を返送する
3. **受信者** が秘密鍵で復号する

## 暗号技術

| コンポーネント | 選択 |
|--------------|------|
| アルゴリズム | RSA-OAEP |
| 鍵長 | 2048 bit |
| ハッシュ | SHA-256 |
| 実装 | Web Crypto API（ブラウザネイティブ） |
| 平文の上限 | 190 バイト |

## セキュリティ特性

- **盗聴防止** — 受動的な監視者は復号できない
- **永続化なし** — Cookie、localStorage、IndexedDB を一切使用しない
- **CSP 適用** — `default-src 'self' 'unsafe-inline'` で外部リクエストをすべてブロック
- **依存関係ゼロ** — 単一 HTML ファイル、外部依存なし

### 防御できない攻撃

- **能動的 MITM 攻撃** — メッセージを改竄できる攻撃者は公開鍵を差し替え可能
- **端末の侵害** — デバイス自体が侵害されている場合、暗号化は無意味

## デプロイ

任意の静的ファイルサーバーで `index.html` を配信：

```bash
# Python
python3 -m http.server 8080

# Docker
docker run -d -p 8080:80 -v $(pwd):/usr/share/nginx/html:ro nginx:alpine

# Node.js
npx serve .
```

## テスト

```bash
npm install
npx playwright install chromium
npm test
```

## ライセンス

MIT
