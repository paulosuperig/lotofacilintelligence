# Guia de Refatoração Deep & Safe

Este documento define as prioridades e o roadmap para melhoria da qualidade do código sem comprometer a estabilidade do sistema.

## Resultado da rodada aprovada de 12/10/2026

### REF-001 a REF-007 implementados
- Workers curtos por pedido: conclusão, erro, timeout de 60 segundos e cancelamento encerram o worker e removem timers/listeners; resultados concorrentes permanecem isolados.
- Realtime: uma inscrição por shell, callbacks antes de subscribe, eventos agrupados em 300 ms e limpeza do canal. Reconexão pertence ao cliente Supabase, sem canais adicionais manuais.
- Assinatura canônica em `lib/lottery/gameSignature`; o motor conserva o reexport existente. Histórico, geração e bolão compartilham a mesma identidade sem mutação das dezenas.
- Chaves leves em `lib/auth/queryKeys`, `lib/admin/queryKeys` e `lib/ai/queryKeys`, preservando valores, isolamento por usuário e exports públicos anteriores.
- `aiChatService` contém leitura/inserção/exclusão; `useAiChat` mantém cache, mutações e feedback. Ordem ascendente, limite de 30 e contrato legado de exclusão preservados.
- `useConferidor` e `useBolaoDetail` concentram os controladores extraídos literalmente. Componentes mantêm a marcação, textos e estilos. `buildPool` concentra seleção de dezenas do fechamento sem alterar o algoritmo.
- `fetchWithRetry` e `lotteryResultMapper` isolam transporte e normalização; `lotteryService` conserva caches, TTLs, endpoints, fallback offline e análise.
- Restaurado `build:dev`, exigido pela compilação automática. Rigor global de TypeScript não foi introduzido; fronteiras novas receberam tipos e testes graduais.

### Evidências de validação
- **197 testes aprovados em 36 arquivos**; 26 regressões adicionadas ao baseline de 171.
- Testes cobrem isolamento/cancelamento/timeout/erro de workers, limpeza e coalescência Realtime, identidade e compatibilidade de chaves, payloads/falhas de chat, normalização dos dois formatos oficiais, seleção do pool, conferência de 15 acertos e rateio 100/200 de um prêmio de 300.
- Transporte mantém duas retentativas com intervalos de 400/800 ms e timeout padrão de 8 segundos; falhas preservam o mapeamento original.
- **ESLint: zero erros e 11 avisos preexistentes de Fast Refresh.**
- **Compilação automática: build OK em 12/10/2026, 19:50:06 UTC.** Nenhum build/typecheck manual foi executado.
- Navegador público: login, abertura da recuperação e página de nova senha renderizados; nenhum erro de página observado.
- Não verificados: fluxos autenticados completos no Supabase externo, chamadas pagas da IA, carga concorrente, cobertura percentual e Lighthouse. Não houve publicação, migration ou alteração de permissões.

### Relatório 10/10
**Padrão:** REFACTOR · **Stack:** React 18 + Vite + Supabase · **Wave de revisão:** dez especialistas em paralelo.

| Especialista | Modo da revisão | Resultado utilizado |
|---|---|---|
| UI | VERIFY | Extrações de conferidor, fechamento e bolão, sem mudança visual |
| Supabase | VERIFY | Persistência, limites e contratos mapeados; banco preservado |
| Auditor | VERIFY | Coesão e responsabilidades revisadas |
| Testing | VERIFY | Lacunas cobertas por novas regressões; suíte final aprovada |
| SEO | VERIFY | Rotas e metadados preservados |
| Deploy | VERIFY | Compilação automática acompanhada; nenhuma publicação |
| API | VERIFY | Transporte e normalização isolados sem novos payloads |
| Prompter | VERIFY | Plano e invariantes conservadores consolidados |
| Auth | VERIFY | Chaves desacopladas e apresentação pública verificada |
| State | VERIFY | Workers e Realtime estabilizados e testados |

**Gates:** regressões aprovadas, lint sem erros, compilação automática aprovada. Publicação não autorizada; validação autenticada bloqueada pela conexão externa sem sessão gerenciada. **Sem score numérico**, pois não há métricas completas.

A revisão de segurança utiliza apenas resultados do scanner: leitura pública de `heartbeat` e proteção contra senhas vazadas desativada. Sem resultado recente de análise profunda, recomenda-se executá-la pela aba Segurança; nenhuma afirmação de segurança integral.

As implementações são apenas dos IDs aprovados. Migração de armazenamento dos bolões/caches, paginação administrativa, revisão de schemas e atualizações de dependências permanecem fora desta autorização.

## Resultado da rodada de 10/10/2026

### Organização implementada
- `useLottery` mantém a interface pública e compõe `hooks/lottery/useLotteryLatest`, `useLotteryHistory` e `useLotteryGeneration`.
- `useLotteryRealtime` concentra a inscrição, amortecimento de eventos e limpeza do canal, sem inscrições adicionais.
- `useAiChat` concentra consultas, cache e persistência do chat; `lib/ai/prompts` contém o texto original e sua montagem pura.
- `aiRequestService` preserva as tentativas, intervalos e cancelamento do transporte da IA.
- `useGameGenerator` concentra os estados e ações antes misturados à apresentação; `GameGenerator` conserva a marcação original.
- `home/bolao/BolaoDetail` separa a vista detalhada da lista sem mudar cálculos, armazenamento ou seleção.
- `historyMapper` é compartilhado pelas leituras e confirmações de inserção.
- Tipos de filtros ficam em `types/lottery`; estratégias, rótulos e descrições em `lib/lottery/strategies`.

### Contratos preservados
Loading do resultado oficial não passa a depender do histórico; loading da IA continua representando uma consulta em andamento. Callbacks públicos continuam assíncronos onde já eram, e falhas ao salvar a configuração mantêm o feedback sem novas rejeições para a interface. Mantidos os campos e limites das consultas, as chaves de cache, os algoritmos, o texto do prompt, o desenho, as rotas, as APIs e as regras de acesso.

### Validação executada
- Vitest: **171 testes aprovados em 26 arquivos**, incluindo regressões de deduplicação, identificação atribuída pelo banco, falha de inserção e mapeamento de campos opcionais.
- ESLint: **zero erros**, com **11 avisos** de Fast Refresh; quatro estão no módulo de opções de estratégia e sete nos controles existentes.
- Compilação automática: última entrada consultada em **19:02:39 UTC: build OK**.
- Navegador público: login renderizado e nenhum erro de página observado. Isso não prova os fluxos autenticados.
- Não executados: publicação, carga concorrente, Lighthouse, métricas de cobertura, chamadas pagas da IA ou testes autenticados contra o Supabase real. A conexão externa não oferece sessão de teste gerenciada.

### Relatório dos dez especialistas
Padrão: **REFACTOR**. Stack detectada: **React 18 + Vite 5 + TypeScript + TanStack Query + Supabase Edge Functions**. Dez tarefas iniciadas no mesmo lote; resultados agregados e alterações revisadas pelo orquestrador.

| Especialista | Modo | Resultado verificado |
|---|---|---|
| UI | VERIFY | Extração do controlador de geração e detalhe dos bolões; apresentação mantida. |
| Supabase | VERIFY | Duplicação do mapeamento removida; schema, grants e RLS não alterados. |
| Auditor | VERIFY | Acoplamento e arquivos grandes identificados; separação priorizada por responsabilidade. |
| Testing | VERIFY | Baseline de 165 testes; rodada final de 171 testes aprovados. |
| SEO | VERIFY | Metadados estáticos, arquivos públicos e rotas preservados. |
| Deploy | VERIFY | Configurações de Vercel, Vite e CI preservadas; publicação não executada. |
| API | VERIFY | Transporte e montagem do prompt separados, sem alterar endpoints ou payloads. |
| Prompter | VERIFY | Critérios de organização e contratos registrados neste guia e em AGENTS.md. |
| Auth | VERIFY | Fluxos públicos revisados; sessão e autorização não modificadas. |
| State | VERIFY | Queries, histórico, geração e Realtime separados em unidades menores. |

Gates locais: testes aprovados, lint sem erros e compilação automática aprovada. Gate de publicação: não solicitado e sem validação autenticada real. **Sem score numérico**: não foram medidos cobertura, Lighthouse ou segurança de infraestrutura nesta rodada.

### Prioridades não implementadas nesta rodada
Validação de payloads externos, migração do armazenamento legado dos bolões/caches, paginação administrativa e modificações de segurança alterariam contratos ou comportamento e não fazem parte desta refatoração conservadora. Não há afirmação de que toda a dívida técnica foi eliminada.

## 1. Prioridades de Curto Prazo (Seguras)

### 1.1 Decomposição do `useLottery`
O hook `useLottery` centraliza muitas responsabilidades (histórico, resultado, análise, geração).
- **Ação**: Dividir em `useLotteryLatest`, `useLotteryHistory`, `useLotteryGeneration`.
- **Critério**: O `useLottery` original deve ser mantido como um "facade" que importa os hooks menores para evitar quebra de contrato em componentes existentes.

### 1.2 Tipagem Estrita nas APIs
Algumas funções em `lotteryService.ts` e hooks utilizam `any` ou tipos genéricos.
- **Ação**: Criar schemas Zod para todas as respostas de API no `src/lib/security/schemas.ts`.
- **Critério**: Eliminar o uso de `as unknown as LotteryResult` através de validação real no `parse`.

### 1.3 Padronização de Erros
Atualmente, o tratamento de erro varia entre `console.error` e `toast`.
- **Ação**: Centralizar logs em um utilitário de log e garantir que todos os hooks tratem erros de Mutation via `onError`.

## 2. Padrões de Organização

### 2.1 Localização de Lógica de Domínio
Toda a matemática e regras da Lotofácil (somas, primos, filtros, geração) DEVE residir em `src/lib/lottery`.
- **Errado**: `useLottery` calculando médias ou gerando IDs.
- **Correto**: `useLottery` chamando `generateSmartGame` de `lib/lottery`.

### 2.2 Uso de Query Keys
Nunca use strings literais para `queryKey`.
- **Padrão**: Utilize o arquivo `src/lib/lottery/queryKeys.ts`.

## 3. Critérios Verificáveis (Checklist)

Para cada refatoração realizada:
1. [ ] **Vitest**: `npm test` passa 100%.
2. [ ] **Typecheck**: `npm run typecheck` não retorna erros.
3. [ ] **Retrocompatibilidade**: Componentes que consomem o serviço/hook não precisaram de alterações (salvo se a refatoração for explicitamente na interface).
4. [ ] **Performance**: Não há re-renders excessivos causados por novos hooks (verificar com React DevTools se necessário).

## 4. Estratégia de Execução "Safe"

1. **Test-First**: Se uma lógica não tem teste, escreva o teste ANTES de refatorar.
2. **Small Batches**: Refatore uma pequena parte, verifique, e siga para a próxima.
3. **Double-Run**: Em mudanças críticas de algoritmos, rode o algoritmo antigo e o novo em paralelo (em dev) e logue divergências.
