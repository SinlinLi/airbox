English | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

# Airbox

Browser-side RSA encryption for passing secrets through insecure channels.

**Try it now:** https://sinlinli.github.io/airbox/

## What it does

Encrypt short text (contacts, passwords, notes) so only the intended recipient can read them. Works entirely in the browser — no server, no signup, no installation.

Just open the page, generate keys, and start encrypting.

## How it works

1. **Receiver** generates an RSA-2048 key pair and shares the **public key** (safe to expose)
2. **Sender** encrypts a message with the public key and sends the **ciphertext** back
3. **Receiver** decrypts with the private key

## Cryptography

| Component | Choice |
|-----------|--------|
| Algorithm | RSA-OAEP |
| Key size | 2048 bit |
| Hash | SHA-256 |
| Implementation | Web Crypto API (browser-native) |
| Max plaintext | 190 bytes |

## Security properties

- **Confidentiality against passive eavesdroppers** — anyone reading the chat cannot decrypt
- **No persistent storage** — no cookies, localStorage, or IndexedDB
- **CSP enforced** — `default-src 'self' 'unsafe-inline'` blocks all external requests
- **Zero dependencies** — single HTML file, no external dependencies

### Not protected against

- **Active MITM** — an attacker who can modify messages in transit could substitute the public key
- **Endpoint compromise** — if either device is compromised, encryption doesn't help

## Deployment

Serve the single `index.html` file with any static file server:

```bash
# Python
python3 -m http.server 8080

# Docker
docker run -d -p 8080:80 -v $(pwd):/usr/share/nginx/html:ro nginx:alpine

# Node.js
npx serve .
```

## Testing

```bash
npm install
npx playwright install chromium
npm test
```

## License

MIT
