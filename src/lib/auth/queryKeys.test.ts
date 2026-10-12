import { describe, expect, it } from 'vitest';
import { profileKey, sessionKey } from './queryKeys';
import { profileKey as oldProfileKey, sessionKey as oldSessionKey } from '@/hooks/useAuth';
import { adminUsersKey, adminUsersPrefix } from '@/lib/admin/queryKeys';
import { adminUsersKey as oldAdminUsersKey } from '@/hooks/useAdmin';
import { aiChatKey, aiConfigurationKey } from '@/lib/ai/queryKeys';

describe('query key compatibility', () => {
  it('preserves auth identities and compatibility exports', () => {
    expect(sessionKey).toEqual(['auth', 'session']);
    expect(oldSessionKey).toBe(sessionKey);
    expect(oldProfileKey).toBe(profileKey);
    expect(profileKey('user-a')).toEqual(['profile', 'user-a']);
    expect(profileKey(null)).toEqual(['profile', null]);
  });
  it('preserves administrative invalidation prefix and page keys', () => {
    expect(oldAdminUsersKey).toBe(adminUsersKey);
    expect(adminUsersPrefix).toEqual(['admin', 'users']);
    expect(adminUsersKey(2)).toEqual(['admin', 'users', 2]);
  });
  it('keeps chat and configuration caches user scoped', () => {
    expect(aiChatKey('user-a')).toEqual(['ai_chat_history', 'user-a']);
    expect(aiConfigurationKey('user-a')).toEqual(['ai_config', 'configured', 'user-a']);
    expect(aiChatKey('user-a')).not.toEqual(aiChatKey('user-b'));
  });
});