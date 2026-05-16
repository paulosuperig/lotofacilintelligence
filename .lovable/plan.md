## Diagnóstico

Após uma auditoria completa do banco, da camada de auth e dos hooks, identifiquei a causa raiz do travamento:

1. **Não existe trigger `on_auth_user_created` em `auth.users`.** Quando um usuário se cadastra (ou já existe sem profile), nenhum perfil é criado automaticamente. O `useAuth` tenta criar via `INSERT` no cliente, mas em muitos casos isso falha silenciosamente (conflito de PK / RLS), deixando o app em estado inconsistente.
2. **`useAuth` pode ficar com `loading=true`** se `fetchProfile` lançar exceção dentro do callback de `onAuthStateChange` (o `.finally` é alcançado, mas o React não re-renderiza se a função de fallback também falhar antes do `setUser`).
3. **`useAdmin` é montado antes do guard de auth** em `Index.tsx`, disparando queries com token anônimo (retornando `[]`) — não causa o branco, mas adiciona ruído.
4. RLS e permissões do `app_private.has_role` estão **corretas** (verificado via `has_function_privilege`). Policies de `profiles`, `user_roles` e `system_configs` estão consistentes.
5. O usuário `admin@admin.com.br` existe em `profiles` e `user_roles` com role `admin`.

A combinação (1) + (2) é o que produz a tela branca / loading infinito para usuários novos ou cujo perfil foi deletado em testes anteriores.

## Plano

### 1. Migração SQL — criar trigger de auto-provisionamento de perfil
Arquivo: `supabase/migrations/<timestamp>_handle_new_user.sql`

- `CREATE OR REPLACE FUNCTION public.handle_new_user()` (SECURITY DEFINER, `search_path = public`)  
  Insere em `public.profiles` (id, email, full_name, whatsapp, role='demo', status='active') e em `public.user_roles` (user_id, role='demo'), com `ON CONFLICT DO NOTHING`.
- `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
- Backfill: para todo `auth.users` sem linha em `profiles`, inserir registro `demo/active` (garante que usuários antigos parem de quebrar).

### 2. Refatorar `src/hooks/useAuth.ts` para nunca travar
- Garantir `setLoading(false)` num `try/finally` global em `initializeAuth` **e** em todo branch de `onAuthStateChange` (incluindo erros).
- Remover o `INSERT` defensivo do cliente (agora desnecessário com o trigger). Se `profile` vier `null` após 1 retry curto, deslogar e mostrar erro claro em vez de loop.
- Resolver a race do `onAuthStateChange` + `getSession` usando uma flag `initialized` para evitar dupla chamada de `fetchProfile`.
- Manter `setTimeout(..., 0)` para deferir chamadas Supabase dentro do callback (boa prática Supabase v2).

### 3. Ajuste cirúrgico em `src/pages/Index.tsx`
- Mover a chamada de `useAdmin()` para dentro de um componente filho renderizado apenas quando `user.role === 'admin'` e `activeTab === 'ajustes'`. Evita queries inúteis durante loading/anon e elimina o ruído de rede.

### 4. Verificação
- Rodar `supabase--linter` após a migração.
- Confirmar via `read_query` que todo `auth.users.id` tem linha correspondente em `profiles` e `user_roles`.
- Abrir o preview no browser tool, validar fluxo de login com `admin@admin.com.br` e checar que a Home carrega.

## Detalhes técnicos

```sql
-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, whatsapp, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    'demo',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'demo')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- backfill
INSERT INTO public.profiles (id, email, role, status)
SELECT u.id, u.email, 'demo', 'active'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'demo'
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
```

`useAuth.ts` ficará com um único caminho de loading: inicialização → `fetchProfile` (com 1 retry) → `setLoading(false)` garantido em `finally`. Sem fallback silencioso que mascara erros.

## Arquivos afetados
- `supabase/migrations/<novo>.sql` (criar)
- `src/hooks/useAuth.ts` (refatorar)
- `src/pages/Index.tsx` (mover `useAdmin` para `AdminPanel` ou wrapper condicional)

Aprovando, eu implemento em uma única rodada.