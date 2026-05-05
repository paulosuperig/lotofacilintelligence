/**
 * Security utilities inspired by Zero Trust and Platform Engineering standards.
 */

/**
 * Sanitizes a string for safe display, preventing basic XSS.
 */
export const sanitizeString = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Validates if an email is in a proper format.
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Securely hashes a string (client-side mock for sensitive operations that should be server-side).
 * Using SHA-256 via SubtleCrypto.
 */
export const hashData = async (data: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generates a cryptographically strong UUID.
 */
export const generateSecureId = (): string => {
  return window.crypto.randomUUID();
};

/**
 * Mask sensitive data like emails or keys.
 */
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) return '****';
  return data.substring(0, visibleChars) + '****' + data.substring(data.length - visibleChars);
};
