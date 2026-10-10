# Architecture rules

- Enforce account activity in restrictive database policies and privileged entry points; client session checks alone cannot revoke data access.
- Keep the asynchronous history save acknowledgement shared across the hook and panels; generated games must not be represented as saved before persistence succeeds.
- Last-active-administrator protection handles DELETE with OLD and rejects concurrent destructive administrator changes; profile removal must not bypass the lockout invariant.