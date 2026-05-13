import { useState, useEffect, useCallback } from 'react';
import { cookieStorage } from '@/lib/security/cookieStorage';
import { UserSchema, type ValidatedUser } from '@/lib/security/schemas';
import CryptoJS from 'crypto-js';

const SESSION_SECRET = import.meta.env.VITE_SESSION_ENCRYPTION_KEY || 'session-vault-secret-2024';

/**
 * Skill: Authentication & Authorization (Hardening)
 * Replaces localStorage sessions with Encrypted Secure Cookies.
 */
export const useAuth = () => {
  const [user, setUser] = useState<ValidatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification: Ensure the session hasn't been tampered with
  const verifySession = useCallback((userData: ValidatedUser): boolean => {
    if (!userData.token) return false;
    
    try {
      const [payload, signature] = userData.token.split('.');
      const expectedSignature = CryptoJS.HmacSHA256(payload, 'session-secret').toString();
      return signature === expectedSignature;
    } catch (e) {
      return false;
    }
  }, []);

  useEffect(() => {
    const encryptedData = cookieStorage.getItem('intelligence_session');
    
    if (encryptedData) {
      try {
        // Decrypt session data from cookie
        const bytes = CryptoJS.AES.decrypt(encryptedData, SESSION_SECRET);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedData) throw new Error('Decryption failed');

        const rawData = JSON.parse(decryptedData);
        const result = UserSchema.safeParse(rawData);
        
        if (result.success && verifySession(result.data)) {
          setUser(result.data);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  }, [verifySession]);

  const login = (email: string, role: 'admin' | 'demo') => {
    const payload = btoa(JSON.stringify({ email, role, iat: Date.now() }));
    const signature = CryptoJS.HmacSHA256(payload, 'session-secret').toString();
    const token = `${payload}.${signature}`;

    const userData: ValidatedUser = { email, role, token };
    const jsonString = JSON.stringify(userData);
    
    // Encrypt before storing in cookie
    const encrypted = CryptoJS.AES.encrypt(jsonString, SESSION_SECRET).toString();
    
    cookieStorage.setItem('intelligence_session', encrypted);
    setUser(userData);
  };

  const logout = () => {
    cookieStorage.removeItem('intelligence_session');
    setUser(null);
  };

  return { user, login, logout, loading, isAdmin: user?.role === 'admin' };
};
