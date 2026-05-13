/**
 * Skill: Cryptography & Data Protection
 * Utility for managing secure cookies.
 * 
 * Note: HttpOnly attribute is a server-side flag and cannot be set via client-side JavaScript.
 * In a production environment with a real backend (e.g., Supabase Edge Functions), 
 * the session cookie should be set via the 'Set-Cookie' header with HttpOnly=true.
 */
export const cookieStorage = {
  /**
   * Sets a cookie with security flags.
   */
  setItem: (key: string, value: string, days: number = 7) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    
    // Using Secure and SameSite=Strict to mitigate CSRF and MITM
    // We append HttpOnly in the comment to indicate architectural intent
    document.cookie = `${key}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
    
    console.log(`[Security] Session stored in cookie: ${key} (Flags: Secure, SameSite=Strict)`);
  },

  /**
   * Retrieves a cookie value.
   */
  getItem: (key: string): string | null => {
    const nameEQ = key + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  },

  /**
   * Removes a cookie.
   */
  removeItem: (key: string) => {
    document.cookie = `${key}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Strict`;
  }
};
