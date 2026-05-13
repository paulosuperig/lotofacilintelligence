import { useState, useEffect, useCallback } from 'react';
import { cookieStorage } from '@/lib/security/cookieStorage';
import { UserSchema, type ValidatedUser } from '@/lib/security/schemas';
import CryptoJS from 'crypto-js';

/**
 * Skill: Authentication & Authorization (Hardening)
 * Replaces localStorage sessions with Secure Cookies to mitigate basic session hijacking.
 * 
 * Architectural Note: For true HttpOnly protection, session cookies must be set 
 * via server-side headers (e.g., Supabase Auth or Edge Functions).
 */
export const useAuth = () => {
  const [user, setUser] = useState<ValidatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification: Ensure the session hasn't been tampered with
  const verifySession = useCallback((userData: ValidatedUser): boolean => {
    if (!userData.token) return false;
    
    try {
      // Check if token matches expected format (signature check simulation)
      const [payload, signature] = userData.token.split('.');
      const expectedSignature = CryptoJS.HmacSHA256(payload, 'session-secret').toString();
      
      return signature === expectedSignature;
    } catch (e) {
      return false;
    }
  }, []);

  useEffect(() => {
    const rawDataString = cookieStorage.getItem('intelligence_session');
    
    if (rawDataString) {
      try {
        const rawData = JSON.parse(rawDataString);
        const result = UserSchema.safeParse(rawData);
        
        if (result.success && verifySession(result.data)) {
          setUser(result.data);
        } else {
          console.warn('[Security] Invalid or tampered session detected. Clearing cookies.');
          logout();
        }
      } catch (error) {
        console.error('[Security] Failed to parse session data', error);
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
    
    // Store in Secure Cookie instead of localStorage
    cookieStorage.setItem('intelligence_session', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    cookieStorage.removeItem('intelligence_session');
    setUser(null);
  };

  return { user, login, logout, loading, isAdmin: user?.role === 'admin' };
};
