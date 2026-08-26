const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Master Key로부터 32바이트 암호화 키 유도
function getKey(salt) {
  return crypto.pbkdf2Sync(config.SECURITY.MASTER_KEY, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * AES-256-GCM 암호화
 * @param {string} text 평문
 * @returns {string} base64 인코딩된 암호문
 */
function encrypt(text) {
  if (!text) return '';
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/**
 * AES-256-GCM 복호화
 * @param {string} encryptedData base64 인코딩된 암호문
 * @returns {string} 복호화된 평문
 */
function decrypt(encryptedData) {
  if (!encryptedData) return '';
  const buffer = Buffer.from(encryptedData, 'base64');

  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = getKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
