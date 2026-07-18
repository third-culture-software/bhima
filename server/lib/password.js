// lib/password.js
const crypto = require('node:crypto');
const argon2 = require('argon2');
const db = require('./db');
const debug = require('debug')('bhima:password');

// Legacy MYSQL5_PASSWORD() output looks like: *40HEXCHARS
const LEGACY_HASH_REGEX = /^\*[0-9A-F]{40}$/;

/**
 *
 * @param hash
 */
function isLegacyHash(hash) {
  return LEGACY_HASH_REGEX.test(hash);
}

/**
 *
 * @param password
 */
async function hashPassword(password) {
  return argon2.hash(password); // argon2id by default, sensible settings
}

/**
 * Verifies a password against a stored hash, transparently upgrading
 * legacy MySQL5-style hashes to argon2 on successful login.
 * @param username
 * @param password
 * @param storedHash
 */
async function verifyPassword(username, password, storedHash) {
  debug('Verifying password for user %s', username);

  if (isLegacyHash(storedHash)) {
    const legacyMatches = mysql5password(password) === storedHash;

    if (legacyMatches) {
      debug('Upgrading password for %s', username);
      // upgrade in the background — don't block the login on this
      const newHash = await hashPassword(password || '');
      await db.exec('UPDATE user SET password = ? WHERE username = ?;', [newHash, username])
    }

    return legacyMatches;
  }

  return argon2.verify(storedHash, password);
}

/**
 * @param  plainText
 * @function mysql5password
 * @description
 * Drop in replacement for MySQL 5 password hashing.  This is used to generate the
 * user passwords until we can replace them with argon2.
 */
function mysql5password(plainText = '') {
  // First SHA1 pass, as a hex string
  const stage1 = crypto.createHash('sha1').update(plainText, 'utf8').digest('hex');

  // UNHEX(stage1) -> raw bytes, then SHA1 again
  const stage2 = crypto
    .createHash('sha1')
    .update(Buffer.from(stage1, 'hex'))
    .digest('hex');

  return '*' + stage2.toUpperCase();
}

module.exports = { hashPassword, verifyPassword, isLegacyHash, mysql5password };
