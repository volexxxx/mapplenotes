import CryptoJS from 'crypto-js';

export const encryptData = (data: any, key: string): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

export const decryptData = (encryptedData: string, key: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Failed to decrypt data', error);
    return null;
  }
};

export const hashKey = (key: string): string => {
  return CryptoJS.SHA256(key).toString();
};
