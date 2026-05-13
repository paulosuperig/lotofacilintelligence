import CryptoJS from 'crypto-js';

// In a real production environment, this secret should be injected via environment variables
const STORAGE_SECRET = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || 'lotofacil-secure-vault-2024';

/**
 * Skill: Cryptography & Data Protection
 * Implements AES-256 encryption for non-session data.
 * 
 * WARNING: Do not use for session tokens or authentication data. 
 * Use cookieStorage for sessions to mitigate bypass attacks.
 */
export const secureStorage = {
  setItem: (key: string, value: any) => {
    try {
      const jsonValue = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonValue, STORAGE_SECRET).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`[Security] Failed to encrypt data for key: ${key}`, error);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const bytes = CryptoJS.AES.decrypt(encrypted, STORAGE_SECRET);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) return null;
      return JSON.parse(decryptedData) as T;
    } catch (error) {
      console.error(`[Security] Failed to decrypt data for key: ${key}`, error);
      return null;
    }
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  }
};
