[English](README.md) | 简体中文 | [日本語](README.ja.md) | [한국어](README.ko.md)

# Airbox

浏览器端 RSA 加密工具，用于在不安全渠道传递秘密信息。

## 简介

加密短文本（联系方式、密码、备注等），只有指定接收方能解密。完全在浏览器中运行——无需服务器、无需注册、无需安装。

打开页面，生成密钥，即可开始加密。

## 使用方法

1. **接收方** 生成 RSA 密钥对，将 **公钥** 分享给发送方（公钥公开无风险）
2. **发送方** 用公钥加密消息，将 **密文** 发回
3. **接收方** 用私钥解密

## 密码学

| 组件 | 选型 |
|------|------|
| 算法 | RSA-OAEP |
| 密钥长度 | 2048 bit |
| 哈希 | SHA-256 |
| 实现 | Web Crypto API（浏览器原生） |
| 明文上限 | 190 字节 |

## 安全特性

- **防窃听** — 被动监听者无法解密
- **零持久化** — 不使用 Cookie、localStorage 或 IndexedDB
- **CSP 强制** — `default-src 'self' 'unsafe-inline'` 阻断所有外部请求
- **零依赖** — 单 HTML 文件，无外部依赖

### 无法防御

- **主动中间人攻击 (MITM)** — 能篡改消息的攻击者可以替换公钥
- **终端被入侵** — 设备本身被控制则加密无意义

## 部署

用任意静态文件服务器托管 `index.html`：

```bash
# Python
python3 -m http.server 8080

# Docker
docker run -d -p 8080:80 -v $(pwd):/usr/share/nginx/html:ro nginx:alpine

# Node.js
npx serve .
```

## 测试

```bash
npm install
npx playwright install chromium
npm test
```

## 许可证

MIT
