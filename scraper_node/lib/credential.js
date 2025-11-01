const crypto = require('crypto');

const encALG = 'aes-256-cbc'; // Encryption algo name

function symmetricEncrypt(data) {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('Encryption key not found. Please set ENCRYPTION_KEY environment variable.');
  }

  // Validate key format - must be 64 hex characters (32 bytes for AES-256)
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('Encryption key must be exactly 64 hexadecimal characters (32 bytes). Current length: ' + key.length);
  }

  const iv = crypto.randomBytes(16); // initialization-vector lets u generate unique encryption form same data each time

  let keyBuffer;
  try {
    keyBuffer = Buffer.from(key, 'hex');
  } catch (error) {
    throw new Error('Invalid encryption key format. Must be a valid hexadecimal string.');
  }

  const cipher = crypto.createCipheriv(encALG, keyBuffer, iv);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function symmetricDecrypt(encrypted) {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('Encryption key not found. Please set ENCRYPTION_KEY environment variable.');
  }

  // Validate key format - must be 64 hex characters (32 bytes for AES-256)
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('Encryption key must be exactly 64 hexadecimal characters (32 bytes). Current length: ' + key.length);
  }

  const textParts = encrypted.split(':');

  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');

  let keyBuffer;
  try {
    keyBuffer = Buffer.from(key, 'hex');
  } catch (error) {
    throw new Error('Invalid encryption key format. Must be a valid hexadecimal string.');
  }

  const decipher = crypto.createDecipheriv(encALG, keyBuffer, iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

module.exports = {
  symmetricEncrypt,
  symmetricDecrypt,
};

