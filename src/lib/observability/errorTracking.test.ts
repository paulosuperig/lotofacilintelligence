import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  captureException,
  captureMessage,
  registerForwarder,
  setUser,
  clearUser,
} from './errorTracking';

/**
 * P1 (privacidade) — a observabilidade jamais pode vazar PII. O forwarder
 * recebe o payload já sanitizado; email/senha/token devem sair como [redacted].
 */
describe('errorTracking', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clearUser();
    registerForwarder(() => {});
  });

  it('redige chaves de PII no contexto antes de encaminhar', () => {
    const received: unknown[] = [];
    registerForwarder((p) => received.push(p));
    captureException(new Error('boom'), {
      scope: 'test',
      extra: { email: 'a@b.com', password: '123', keepMe: 'ok' },
    });
    const payload = received[0] as { extra: Record<string, unknown>; message: string };
    expect(payload.message).toBe('boom');
    expect(payload.extra.email).toBe('[redacted]');
    expect(payload.extra.password).toBe('[redacted]');
    expect(payload.extra.keepMe).toBe('ok');
  });

  it('redige PII aninhada em um nível', () => {
    const received: { extra: Record<string, unknown> }[] = [];
    registerForwarder((p) => received.push(p as { extra: Record<string, unknown> }));
    captureMessage('ctx', 'warning', { extra: { user: { token: 'secret', id: 'uuid-1' } } });
    const nested = received[0].extra.user as Record<string, unknown>;
    expect(nested.token).toBe('[redacted]');
    expect(nested.id).toBe('uuid-1');
  });

  it('anexa o userId associado (UUID, não PII)', () => {
    const received: { userId?: string }[] = [];
    registerForwarder((p) => received.push(p as { userId?: string }));
    setUser('uuid-123');
    captureMessage('hi', 'info');
    expect(received[0].userId).toBe('uuid-123');
  });

  it('converte valores não-Error em Error', () => {
    const received: { message: string }[] = [];
    registerForwarder((p) => received.push(p as { message: string }));
    captureException('string error');
    expect(received[0].message).toBe('string error');
  });

  it('um forwarder que lança não derruba a captura', () => {
    registerForwarder(() => {
      throw new Error('forwarder broke');
    });
    expect(() => captureException(new Error('x'))).not.toThrow();
  });
});
