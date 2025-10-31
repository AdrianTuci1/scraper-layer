const crypto = require('crypto');

const encALG = 'aes-256-cbc'; // Encryption algo name

function symmetricEncrypt(data) {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('Encryption key not found');
  }

  const iv = crypto.randomBytes(16); // initialization-vector lets u generate unique encryption form same data each time

  const cipher = crypto.createCipheriv(encALG, Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function symmetricDecrypt(encrypted) {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('Encryption key not found');
  }

  const textParts = encrypted.split(':');

  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');

  const decipher = crypto.createDecipheriv(encALG, Buffer.from(key, 'hex'), iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

module.exports = {
  symmetricEncrypt,
  symmetricDecrypt,
};

