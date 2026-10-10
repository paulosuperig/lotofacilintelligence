# Guia de Refatoração Deep & Safe

Este documento define as prioridades e o roadmap para melhoria da qualidade do código sem comprometer a estabilidade do sistema.

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
