import { describe, it, expect } from 'vitest';
import { sanitizeString, validateEmail, maskSensitiveData } from './utils';

/**
 * P1 — Utilitários de segurança usados na renderização e no mascaramento de
 * dados sensíveis. sanitizeString é a primeira linha contra XSS refletido.
 */
describe('sanitizeString', () => {
  it('escapa caracteres perigosos de HTML', () => {
    expect(sanitizeString('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('escapa aspas e ampersand', () => {
    expect(sanitizeString(`"a"&'b'`)).toBe('&quot;a&quot;&amp;&#039;b&#039;');
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('validateEmail', () => {
  it('aceita email válido', () => {
    expect(validateEmail('paulo@example.com')).toBe(true);
  });

  it('rejeita email sem @', () => {
    expect(validateEmail('paulo.example.com')).toBe(false);
  });

  it('rejeita email sem domínio', () => {
    expect(validateEmail('paulo@')).toBe(false);
  });
});

describe('maskSensitiveData', () => {
  it('mascara o miolo mantendo as pontas', () => {
    const masked = maskSensitiveData('sk-1234567890abcdef', 4);
    expect(masked.startsWith('sk-1')).toBe(true);
    expect(masked).toContain('****');
    expect(masked.endsWith('cdef')).toBe(true);
  });

  it('mascara totalmente strings curtas', () => {
    expect(maskSensitiveData('ab', 4)).toBe('****');
  });
});
