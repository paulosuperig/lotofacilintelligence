# Architecture & Coding Rules

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
