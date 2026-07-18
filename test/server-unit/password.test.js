// test/unit/lib/password.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const password = require('../../server/lib/password');

test('isLegacyHash() returns true for valid MySQL5 hashes', () => {
  assert.equal(
    password.isLegacyHash('*94BDCEBE19083CE2A1F959FD02F964C7AF4CFC29'),
    true,
  );
});

test('isLegacyHash() returns false for argon2 hashes', () => {
  assert.equal(
    password.isLegacyHash('$argon2id$v=19$m=65536,t=3,p=4$abc$xyz'),
    false,
  );
});

test('isLegacyHash() returns false for invalid hashes', () => {
  assert.equal(password.isLegacyHash(null), false);
  assert.equal(password.isLegacyHash(''), false);
  assert.equal(password.isLegacyHash('*1234'), false);
});

test('mysql5password() matches known MySQL PASSWORD() output', () => {
  assert.equal(
    password.mysql5password('test'),
    '*94BDCEBE19083CE2A1F959FD02F964C7AF4CFC29',
  );
});

test('mysql5password() handles empty string', () => {
  assert.equal(
    password.mysql5password(''),
    '*BE1BDEC0AA74B4DCB079943E70528096CCA985F8',
  );
});

test('hashPassword() hashes a password using argon2', async () => {
  const digest = await password.hashPassword('test123')
  assert.ok(digest.startsWith('$argon2id$'));
});
