export const profilesKey = ['profile'] as const;
export const profileKey = (userId: string | null) => [...profilesKey, userId] as const;
export const sessionKey = ['auth', 'session'] as const;
