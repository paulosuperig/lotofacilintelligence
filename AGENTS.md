# Architecture rules

- Enforce account activity in restrictive database policies and privileged entry points; client session checks alone cannot revoke data access.
- Keep the asynchronous history save acknowledgement shared across the hook and panels; generated games must not be represented as saved before persistence succeeds.
- Last-active-administrator protection handles DELETE with OLD and rejects concurrent destructive administrator changes; profile removal must not bypass the lockout invariant.
- Keep the authenticated application and connected AI/admin panels behind dynamic imports so login never loads private tools or starts their queries.
- Execute lottery generation and backtesting in short-lived module workers using the existing pure algorithms; terminate workers on completion, cancellation and timeout.
- Own history Realtime once per authenticated shell and coalesce change events; only database-acknowledged rows enter the saved history cache.
- Keep lightweight query keys separate from feature hooks so statistics consumers do not import mutations or generation engines.