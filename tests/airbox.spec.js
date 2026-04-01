const { test, expect } = require('@playwright/test');

const PAGE_URL = 'file://' + require('path').resolve(__dirname, '../index.html');

// --- Helper: generate keys and return { publicKey, privateKey } ---
async function generateKeyPair(page) {
  await page.click('[data-tab="generate"]');
  // Clear previous keys so we can detect when new ones arrive
  await page.locator('#pub-key').evaluate(el => el.value = '');
  await page.click('#btn-generate');
  // Wait for button to return to idle state (generation complete)
  await expect(page.locator('#btn-generate')).toHaveText('Generate Key Pair', { timeout: 10000 });
  await expect(page.locator('#keys-output')).toBeVisible({ timeout: 10000 });
  const publicKey = await page.locator('#pub-key').inputValue();
  const privateKey = await page.locator('#priv-key').inputValue();
  return { publicKey, privateKey };
}

// --- Helper: encrypt a message with a public key ---
async function encrypt(page, publicKey, message) {
  await page.click('[data-tab="encrypt"]');
  await page.fill('#enc-pubkey', publicKey);
  await page.fill('#enc-plaintext', message);
  await page.click('#btn-encrypt');
  await expect(page.locator('#enc-output')).toBeVisible({ timeout: 5000 });
  return await page.locator('#enc-ciphertext').inputValue();
}

// --- Helper: decrypt a ciphertext with a private key ---
async function decrypt(page, ciphertext, privateKey) {
  await page.click('[data-tab="decrypt"]');
  await page.fill('#dec-ciphertext', ciphertext);
  await page.fill('#dec-privkey', privateKey);
  await page.click('#btn-decrypt');
  await expect(page.locator('#dec-output')).toBeVisible({ timeout: 5000 });
  return await page.locator('#dec-plaintext').inputValue();
}

// =============================================================
// Tests
// =============================================================

test.describe('Tab navigation', () => {
  test('default tab is Generate Keys', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#panel-generate')).toBeVisible();
    await expect(page.locator('#panel-encrypt')).toBeHidden();
    await expect(page.locator('#panel-decrypt')).toBeHidden();
  });

  test('clicking tabs switches panels', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="encrypt"]');
    await expect(page.locator('#panel-encrypt')).toBeVisible();
    await expect(page.locator('#panel-generate')).toBeHidden();

    await page.click('[data-tab="decrypt"]');
    await expect(page.locator('#panel-decrypt')).toBeVisible();
    await expect(page.locator('#panel-encrypt')).toBeHidden();
  });
});

test.describe('Key generation', () => {
  test('generates valid RSA key pair', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey, privateKey } = await generateKeyPair(page);

    // SPKI public key for RSA-2048 is ~392 Base64 chars
    expect(publicKey.length).toBeGreaterThan(300);
    expect(publicKey.length).toBeLessThan(500);

    // PKCS8 private key for RSA-2048 is ~1700 Base64 chars
    expect(privateKey.length).toBeGreaterThan(1500);
    expect(privateKey.length).toBeLessThan(2000);

    // Valid Base64
    expect(publicKey).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(privateKey).toMatch(/^[A-Za-z0-9+/=]+$/);

    // Success status shown
    await expect(page.locator('#status-generate')).toContainText('generated');
  });

  test('auto-fills private key to decrypt tab', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { privateKey } = await generateKeyPair(page);
    await page.click('[data-tab="decrypt"]');
    const filled = await page.locator('#dec-privkey').inputValue();
    expect(filled).toBe(privateKey);
  });

  test('does not auto-fill public key to encrypt tab', async ({ page }) => {
    await page.goto(PAGE_URL);
    await generateKeyPair(page);
    await page.click('[data-tab="encrypt"]');
    const filled = await page.locator('#enc-pubkey').inputValue();
    expect(filled).toBe('');
  });

  test('generates different keys each time', async ({ page }) => {
    await page.goto(PAGE_URL);
    const first = await generateKeyPair(page);
    const second = await generateKeyPair(page);
    expect(first.publicKey).not.toBe(second.publicKey);
    expect(first.privateKey).not.toBe(second.privateKey);
  });
});

test.describe('Encrypt and decrypt roundtrip', () => {
  test('ASCII text', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey, privateKey } = await generateKeyPair(page);
    const message = 'telegram: @alice_secure';
    const ciphertext = await encrypt(page, publicKey, message);

    // Ciphertext should be Base64, ~344 chars for RSA-2048
    expect(ciphertext.length).toBeGreaterThan(300);
    expect(ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/);

    const decrypted = await decrypt(page, ciphertext, privateKey);
    expect(decrypted).toBe(message);
  });

  test('Chinese text (UTF-8 multibyte)', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey, privateKey } = await generateKeyPair(page);
    const message = '我的Signal号码是+86-13800138000';
    const ciphertext = await encrypt(page, publicKey, message);
    const decrypted = await decrypt(page, ciphertext, privateKey);
    expect(decrypted).toBe(message);
  });

  test('emoji (4-byte UTF-8)', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey, privateKey } = await generateKeyPair(page);
    const message = 'Signal: alice 🔐🚀';
    const ciphertext = await encrypt(page, publicKey, message);
    const decrypted = await decrypt(page, ciphertext, privateKey);
    expect(decrypted).toBe(message);
  });

  test('max length (190 bytes ASCII)', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey, privateKey } = await generateKeyPair(page);
    const message = 'A'.repeat(190);
    const ciphertext = await encrypt(page, publicKey, message);
    const decrypted = await decrypt(page, ciphertext, privateKey);
    expect(decrypted).toBe(message);
  });

  test('same plaintext produces different ciphertext each time', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey } = await generateKeyPair(page);
    const message = 'hello';
    const ct1 = await encrypt(page, publicKey, message);
    const ct2 = await encrypt(page, publicKey, message);
    expect(ct1).not.toBe(ct2); // RSA-OAEP uses random padding
  });
});

test.describe('Error handling', () => {
  test('rejects message over 190 bytes', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey } = await generateKeyPair(page);
    await page.click('[data-tab="encrypt"]');
    await page.fill('#enc-pubkey', publicKey);
    await page.fill('#enc-plaintext', 'A'.repeat(191));
    await page.click('#btn-encrypt');
    await expect(page.locator('#status-encrypt')).toContainText('too long');
    await expect(page.locator('#enc-output')).toBeHidden();
  });

  test('rejects empty public key', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="encrypt"]');
    await page.fill('#enc-plaintext', 'hello');
    await page.click('#btn-encrypt');
    await expect(page.locator('#status-encrypt')).toContainText('public key');
  });

  test('rejects empty message', async ({ page }) => {
    await page.goto(PAGE_URL);
    const { publicKey } = await generateKeyPair(page);
    await page.click('[data-tab="encrypt"]');
    await page.fill('#enc-pubkey', publicKey);
    await page.click('#btn-encrypt');
    await expect(page.locator('#status-encrypt')).toContainText('message');
  });

  test('rejects wrong private key for decryption', async ({ page }) => {
    await page.goto(PAGE_URL);
    const keys1 = await generateKeyPair(page);
    const keys2 = await generateKeyPair(page);

    const ciphertext = await encrypt(page, keys1.publicKey, 'secret info');

    await page.click('[data-tab="decrypt"]');
    await page.fill('#dec-ciphertext', ciphertext);
    await page.fill('#dec-privkey', keys2.privateKey); // wrong key
    await page.click('#btn-decrypt');
    await expect(page.locator('#status-decrypt')).toContainText('failed');
    await expect(page.locator('#dec-output')).toBeHidden();
  });

  test('rejects invalid Base64 as public key', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="encrypt"]');
    await page.fill('#enc-pubkey', 'not-valid-base64!!!');
    await page.fill('#enc-plaintext', 'hello');
    await page.click('#btn-encrypt');
    await expect(page.locator('#status-encrypt')).toContainText('Error');
  });

  test('rejects empty ciphertext', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="decrypt"]');
    await page.fill('#dec-privkey', 'some-key');
    await page.click('#btn-decrypt');
    await expect(page.locator('#status-decrypt')).toContainText('ciphertext');
  });

  test('rejects empty private key', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="decrypt"]');
    await page.fill('#dec-ciphertext', 'some-cipher');
    await page.click('#btn-decrypt');
    await expect(page.locator('#status-decrypt')).toContainText('private key');
  });
});

test.describe('Byte counter', () => {
  test('counts ASCII bytes correctly', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="encrypt"]');
    await page.fill('#enc-plaintext', 'hello'); // 5 bytes
    await expect(page.locator('#byte-count')).toContainText('5 / 190');
  });

  test('counts UTF-8 multibyte correctly', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="encrypt"]');
    await page.fill('#enc-plaintext', '你好'); // 6 bytes (3 per char)
    await expect(page.locator('#byte-count')).toContainText('6 / 190');
  });

  test('shows warning when over limit', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.click('[data-tab="encrypt"]');
    await page.fill('#enc-plaintext', 'A'.repeat(191));
    await expect(page.locator('#byte-count')).toHaveClass(/over/);
  });
});

test.describe('How-to section', () => {
  test('toggles howto content', async ({ page }) => {
    await page.goto(PAGE_URL);
    const content = page.locator('.howto-content');
    await expect(content).toBeHidden();

    await page.click('.howto-toggle');
    await expect(content).toBeVisible();

    await page.click('.howto-toggle');
    await expect(content).toBeHidden();
  });
});

test.describe('CSP', () => {
  test('has Content-Security-Policy meta tag', async ({ page }) => {
    await page.goto(PAGE_URL);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'self'");
  });
});
