interface AccountLookup {
  data: { status: string } | null;
  error: unknown;
}

/** Fail closed on blocked/missing accounts and failed status lookups. */
export async function hasActiveAccount(lookup: () => PromiseLike<AccountLookup>): Promise<boolean> {
  try {
    const { data, error } = await lookup();
    return !error && data?.status === 'active';
  } catch {
    return false;
  }
}