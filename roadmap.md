# Vercel release roadmap

- [x] Auditar build, UI, Supabase, APIs, autenticação, estado, SEO e release.
- [x] Tornar a instalação determinística com `npm ci`.
- [x] Corrigir cache do HTML, assets versionados e arquivos públicos.
- [x] Fortalecer a inicialização e eliminar a asserção insegura do elemento raiz.
- [x] Corrigir metadados, canonical, sitemap e robots.
- [x] Validar tipos, lint, 150 testes e build de produção.
- [x] Validar desktop, mobile e atualização direta de rota.
- [x] Corrigir a instalação do CI/Vercel e sincronizar dependências compatíveis.
- [x] Unificar a conexão Supabase para restaurar a persistência do histórico em ambientes sem variáveis de build.
- [ ] Publicar a nova versão — aguardando ação explícita do usuário.

## Correções autorizadas em 10/10/2026
- [x] AUD-001: Impedir acesso de contas bloqueadas no banco e nas funções protegidas.
- [x] AUD-002: Corrigir exclusão de perfis mantendo a proteção do último administrador ativo.
- [x] AUD-004: Confirmar persistência antes de anunciar jogos de fechamento salvos.
- [x] Validar as três regras com testes e revisão dos dez especialistas; 157 testes passaram, regressões SQL com rollback passaram e funções protegidas foram implantadas.
