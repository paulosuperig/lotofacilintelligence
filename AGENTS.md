# Architecture & Coding Rules

- Enforce account activity in restrictive database policies and privileged entry points; client session checks alone cannot revoke data access.
- Keep the asynchronous history save acknowledgement shared across the hook and panels; generated games must not be represented as saved before persistence succeeds.
- Last-active-administrator protection handles DELETE with OLD and rejects concurrent destructive administrator changes; profile removal must not bypass the lockout invariant.
- Keep the authenticated application and connected AI/admin panels behind dynamic imports so login never loads private tools or starts their queries.
- Execute lottery generation and backtesting in short-lived module workers using the existing pure algorithms; terminate workers on completion, cancellation and timeout.
- Own history Realtime once per authenticated shell and coalesce change events; only database-acknowledged rows enter the saved history cache.
- Keep query keys in lightweight domain modules with compatibility reexports; consumers must not import feature hooks to identify cached data.
- Compose the public lottery hook from latest-result, history and generation hooks; preserve its return values and callback contracts to avoid UI regressions.
- Keep AI prompt construction pure and chat persistence separate from request orchestration; this isolates concerns without changing prompts or transport behavior.
- Share one typed mapper for history reads and insert acknowledgements; both paths must produce identical saved-game representations.
- Keep generator, checker and pool-detail interaction state in controller hooks; presentation changes must not be coupled to data operations.

- Keep combination identity in a pure lightweight module shared by generation, history and pools; importing deduplication must not load the generation engine.
- Keep chat I/O in its service and cache orchestration in its hook; preserve selection, ordering, limits and error contracts during extraction.
- Keep official-result transport and mapping separate from cached orchestration; refactors must preserve retries, normalization and offline fallbacks.
- Keep wheel-pool composition in the pure lottery domain; presentation must not own number-selection algorithms.

## 1. Principles

- **Integrity**: Never promise "guaranteed wins". Use honest statistics (probabilities, trends).
- **Safe Deep Refactor**: Priority is code health without regressions. All logic changes must be covered by tests.
- **Separation of Concerns**:
  - `lib/`: Pure functions, mathematical logic, determinism. No Side Effects (mostly).
  - `services/`: Data fetching, API clients, Supabase interactions.
  - `hooks/`: Orchestration, React state, TanStack Query.
  - `components/`: UI, Presentation, Props-driven logic.

## 2. Refactoring Priorities (Safe)

1. **Hook Decomposition**: Break large hooks (like `useLottery`) into smaller, domain-specific hooks (`useHistory`, `useLatestResult`).
2. **Type Hardening**: Replace `any` or `unknown` with strict types. Use Zod schemas in services to validate external data.
3. **Logic Consolidation**: Ensure all lottery-related math is in `src/lib/lottery`. Services should not contain generation logic.
4. **Error Handling**: Use the `ErrorBoundary` and a consistent `try-catch` pattern in services, surfacing errors to hooks for toast notifications.

## 3. Verifiable Criteria

- **Test Coverage**: No PR should decrease the total number of tests. Business logic (`lib/`) should aim for high coverage.
- **Type Safety**: `npm run typecheck` must pass without errors.
- **Performance**: Heavy computations (backtesting, large wheel generation) must run in Workers or be optimized to not block the UI thread.
- **Real-world Parity**: Lottery results and probabilities must match official Caixa data exactly.

## 4. Consistent Patterns

- **Naming**: Use `camelCase` for variables/functions, `PascalCase` for components/types. Services end in `*Service.ts`, hooks start with `use*`.
- **Exports**: Use named exports. Avoid default exports except for components that might require them (like Lazy loading).
- **Data Fetching**: Use TanStack Query keys defined in `queryKeys.ts` to avoid string literals.
- **UI Components**: Follow Shadcn UI patterns. Keep components small.

## 5. Security & Persistence

- **RLS**: Database policies are the primary security layer.
- **Ack-Flow**: Save operations must be acknowledged by the server before the UI reflects the "Saved" state (except for optimistic updates where appropriate).
- **Privacy**: Dynamic imports for admin/private panels to prevent code leaking to unauthorized users.
