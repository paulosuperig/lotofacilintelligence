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

## Otimização de performance
- [x] Analisar carregamento, UI, queries, APIs, estado, assets e produção com dez especialistas.
- [x] Separar carregamento autenticado e carregar IA/admin somente quando necessários.
- [x] Retirar cálculos pesados da interface, reduzir atrasos artificiais e preservar os algoritmos.
- [x] Reduzir consultas repetidas e inscrições Realtime; manter confirmação de persistência.
- [x] Validar testes, carregamento desktop/mobile e registrar resultados e limitações em docs/performance-audit.md.
- [ ] Validar fluxos autenticados no Supabase real — bloqueado por conexão externa sem sessão de teste gerenciada.

## Refatoração estrutural
- [x] Revisar a base com dez especialistas e priorizar organização, duplicações e acoplamento.
- [x] Separar consultas, persistência, Realtime e geração mantendo o contrato de useLottery.
- [x] Extrair prompt, histórico e transporte da IA sem mudar conteúdo, payloads ou tentativas.
- [x] Centralizar mapeamento do histórico e separar lógica de geração e detalhe do bolão da apresentação.
- [x] Executar regressões, lint e verificação visual pública; limites registrados em docs/REFACTORING-GUIDE.md.

## Refatoração aprovada em 12/10/2026
- [x] REF-001/002: Restaurar isolamento dos workers e propriedade única do Realtime com regressões.
- [x] REF-003/006: Consolidar assinaturas e chaves leves por domínio com compatibilidade.
- [x] REF-004: Separar persistência do chat preservando consultas e falhas.
- [x] REF-005: Extrair pool e controladores do conferidor/bolão sem mudanças visuais.
- [x] REF-007: Separar transporte e normalização mantendo caches e tentativas.
- [x] Validar regressões, lint, compilação automática e apresentação pública; registrar limites autenticados.
