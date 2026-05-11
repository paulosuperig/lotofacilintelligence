import { useState, useEffect, useCallback } from 'react';
import { secureStorage } from '@/lib/security/secureStorage';
import { UserSchema, type ValidatedUser } from '@/lib/security/schemas';
import CryptoJS from 'crypto-js';

/**
 * Skill: Authentication & Authorization (Hardening)
 * Replaces fragile localStorage checks with a validated session hook.
 */
export const useAuth = () => {
  const [user, setUser] = useState<ValidatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification: Ensure the session hasn't been tampered with
  const verifySession = useCallback((userData: ValidatedUser): boolean => {
    if (!userData.token) return false;
    
    // Check if token matches expected format (signature check simulation)
    const [payload, signature] = userData.token.split('.');
    const expectedSignature = CryptoJS.HmacSHA256(payload, 'session-secret').toString();
    
    return signature === expectedSignature;
  }, []);

  useEffect(() => {
    const rawData = secureStorage.getItem<any>('intelligence_user');
    
    if (rawData) {
      const result = UserSchema.safeParse(rawData);
      if (result.success && verifySession(result.data)) {
        setUser(result.data);
      } else {
        // Tampering detected or invalid schema
        console.warn('[Security] Invalid session detected. Logging out.');
        logout();
      }
    }
    setLoading(false);
  }, [verifySession]);

  const login = (email: string, role: 'admin' | 'demo') => {
    // Generate a secure session token
    const payload = btoa(JSON.stringify({ email, role, iat: Date.now() }));
    const signature = CryptoJS.HmacSHA256(payload, 'session-secret').toString();
    const token = `${payload}.${signature}`;

    const userData: ValidatedUser = { email, role, token };
    secureStorage.setItem('intelligence_user', userData);
    setUser(userData);
  };

  const logout = () => {
    secureStorage.removeItem('intelligence_user');
    setUser(null);
  };

  return { user, login, logout, loading, isAdmin: user?.role === 'admin' };
};
