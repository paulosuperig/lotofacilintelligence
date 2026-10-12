export const adminUsersPrefix = ['admin', 'users'] as const;
export const adminUsersKey = (page: number) => [...adminUsersPrefix, page] as const;
