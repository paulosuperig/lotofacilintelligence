# Lotofácil Intelligence

Aplicação web (SPA) de inteligência para a Lotofácil: consulta o último resultado
oficial, gera jogos com filtros estatísticos, oferece fechamentos, um assistente de
IA (DeepSeek) e um painel administrativo de usuários. Autenticação, persistência e
funções privilegiadas rodam sobre Supabase.

## Stack

- **Frontend:** Vite + React 18 + TypeScript (strict) + Tailwind + shadcn/ui + framer-motion
- **Estado servidor:** TanStack Query (client provisionado) + Supabase JS
- **Backend:** Supabase (Auth, Postgres com RLS, Edge Functions em Deno, Realtime)
- **Analytics:** Meta Pixel + Conversions API (CAPI) com hashing de PII
- **Deploy:** Vercel (SPA rewrite + headers de segurança/CSP em `vercel.json`)

## Rodando localmente

```bash
npm install            # instala deps (postinstall gera o .env via setup:supabase)
npm run dev            # servidor de desenvolvimento (Vite)
```

Se o `.env` não for gerado automaticamente:

```bash
npm run setup:supabase   # grava .env a partir das chaves públicas do projeto
```

## Variáveis de ambiente

Copie `.env.example` para `.env`. Apenas chaves **públicas** do client vivem aqui —
a `service_role` nunca entra no frontend; ela mora como secret nas Edge Functions.

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anônima/publishable (role `anon`) |

Secrets das Edge Functions (definidos no painel do Supabase, nunca no repositório):
`SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY` (opcional — também pode vir de
`system_configs`), e os tokens do Meta CAPI.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (roda `validate:supabase` no prebuild) |
| `npm run lint` | ESLint |
| `npm run test` | Testes (Vitest) |
| `npm run test:watch` | Testes em watch mode |
| `npm run setup:supabase` | Gera o `.env` com as chaves públicas |
| `npm run validate:supabase` | Valida conectividade/chaves do Supabase |

## Estrutura

```
src/
  components/   UI por domínio (admin, ai, history, home, lottery, layout, ui)
  hooks/        useAuth, useLottery, useAiAssistant, useAdmin, useAiGameSaver
  services/     acesso a dados (lottery, user, history, ai, aiConfig)
  lib/          lógica pura (lottery, ai, analytics, security)
  integrations/ cliente Supabase + tipos gerados
  pages/        Index, ResetPassword, NotFound
supabase/
  migrations/   schema + RLS + policies + funções
  functions/    Edge Functions (intelligence-ai, admin-reset-password,
                admin-delete-user, meta-capi) + _shared/security.ts
```

## Segurança

- **RLS ativo em 100% das tabelas** com dados de usuário; policies por `auth.uid()`
  e `has_role()` (SECURITY DEFINER com `search_path` fixo).
- Operações privilegiadas (reset e exclusão de usuário) passam por Edge Functions
  que revalidam o papel de admin antes de usar a `service_role`.
- CORS por allowlist de origin, rate limit e hashing de PII nas Edge Functions.
- CSP e headers de segurança configurados no `vercel.json`.

## Deploy

Deploy contínuo na Vercel a partir da branch de produção. O `prebuild` valida o
Supabase; o build falha cedo se as chaves estiverem ausentes em modo estrito.
