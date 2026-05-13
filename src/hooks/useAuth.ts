import { useState, useEffect, useCallback } from 'react';
import { cookieStorage } from '@/lib/security/cookieStorage';
import { UserSchema, type ValidatedUser } from '@/lib/security/schemas';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';

const SESSION_SECRET = import.meta.env.VITE_SESSION_ENCRYPTION_KEY || 'session-vault-secret-2024';
const SESSION_DURATION_MS = 1000 * 60 * 60; // 1 hour session

/**
 * Skill: Advanced Authentication & Token Management
 * Implements session expiration (IAT/EXP) and auto-logout logic.
 */
export const useAuth = () => {
  const [user, setUser] = useState<ValidatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  

  const logout = useCallback(() => {
    cookieStorage.removeItem('intelligence_session');
    setUser(null);
  }, []);

  // Verification: Ensure the session hasn't been tampered with and is not expired
  const verifySession = useCallback((userData: ValidatedUser): boolean => {
    if (!userData.token || !userData.exp) return false;
    
    try {
      // 1. Check Expiration
      const now = Date.now();
      if (now > userData.exp) {
        console.warn('[Security] Session expired');
        return false;
      }

      // 2. Cryptographic Signature Check
      const [payload, signature] = userData.token.split('.');
      const expectedSignature = CryptoJS.HmacSHA256(payload, 'session-secret').toString();
      return signature === expectedSignature;
    } catch (e) {
      return false;
    }
  }, []);

  useEffect(() => {
    const checkSession = () => {
      const encryptedData = cookieStorage.getItem('intelligence_session');
      
      if (encryptedData) {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedData, SESSION_SECRET);
          const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
          
          if (!decryptedData) throw new Error('Decryption failed');

          const rawData = JSON.parse(decryptedData);
          const result = UserSchema.safeParse(rawData);
          
          if (result.success && verifySession(result.data)) {
            setUser(result.data);
          } else {
            const wasLoggedIn = !!user;
            logout();
            if (wasLoggedIn) {
              toast.error("Sessão expirada", {
                description: "Sua sessão expirou por segurança. Faça login novamente.",
              });
            }
          }
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    checkSession();

    // Auto-check session every 30 seconds to catch expiration
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [verifySession, logout, toast, user]);

  const login = (email: string, role: 'admin' | 'demo') => {
    const now = Date.now();
    const exp = now + SESSION_DURATION_MS;
    
    const payload = btoa(JSON.stringify({ email, role, iat: now, exp }));
    const signature = CryptoJS.HmacSHA256(payload, 'session-secret').toString();
    const token = `${payload}.${signature}`;

    const userData: ValidatedUser = { email, role, token, iat: now, exp };
    const jsonString = JSON.stringify(userData);
    
    const encrypted = CryptoJS.AES.encrypt(jsonString, SESSION_SECRET).toString();
    
    // Cookie expires slightly after the token for grace period
    cookieStorage.setItem('intelligence_session', encrypted, 1 / 24); // 1 hour
    setUser(userData);
  };

  return { user, login, logout, loading, isAdmin: user?.role === 'admin' };
};
