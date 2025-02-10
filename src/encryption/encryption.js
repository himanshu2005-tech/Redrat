import crypto from 'react-native-crypto';

export const encryptUUID = (uuid) => {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32); 
    const iv = crypto.randomBytes(16); 

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(uuid, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    setEncryptedText(encrypted);
    return { encrypted, key, iv };
  };


export const decryptUUID = (encryptedData, key, iv) => {
    const algorithm = 'aes-256-cbc';

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    setDecryptedText(decrypted);
  };

