# Refatoração estrutural conservadora

## Objetivo
Melhorar organização, reutilização e manutenção sem alterar funcionalidades, aparência, mensagens, algoritmos, rotas ou regras de acesso. A revisão inicial contou com dez especialistas; suas conclusões foram confrontadas com o código, sem aceitar declarações de sucesso sem evidência.

## Arquitetura identificada
React 18 + Vite + TypeScript + React Router + TanStack Query + Supabase Auth/Postgres/Realtime/Edge Functions.

Fluxos principais:
- Sessão → perfil → aplicação autenticada → painéis carregados sob demanda.
- Gerador → algoritmos em worker → gravação no Supabase → confirmação → histórico.
- Chat → construção do prompt → transporte com tentativas → Edge Function → pós-processamento → persistência.
- Conferidor/bolão → consulta de concurso → conferência matemática → apresentação de resultados e rateio.

## Achados e prioridades
| ID | Local | Problema confirmado | Impacto | Prioridade |
|---|---|---|---|---|
| REF-001 | `src/lib/lottery/runTask.ts:5-49,64-79` | Worker persistente contraria a regra de workers curtos; cancelamento remove a tarefa da fila sem encerrar o cálculo, e a resposta seguinte é vinculada por posição. | Pode atribuir resultado ao pedido errado e deixar cálculo ativo após cancelamento. | Alta |
| REF-002 | `src/hooks/useLotteryRealtime.ts:36-78` | Reconexões criam canais adicionais, mas a limpeza remove apenas o canal inicial; timers de reconexão não são guardados. | Inscrições e recursos podem sobreviver à troca de painel/sessão. | Alta |
| REF-003 | `src/hooks/lottery/useLotteryHistory.ts:13`, `src/lib/lottery/generator.ts:136`, `src/components/home/bolao/BolaoDetail.tsx:47-57` | Assinatura canônica de jogos repetida; consumidores leves dependem do motor para usá-la. | Mudanças de deduplicação exigem manutenção em vários locais. | Média |
| REF-004 | `src/hooks/useAiChat.ts:15-26,39-46,56-62` | Consultas, inserções e exclusões do chat estão dentro do hook. | Persistência fica acoplada ao estado React e mais difícil de testar. | Média |
| REF-005 | `src/components/home/FechamentosPanel.tsx:26-42`, `src/components/home/ConferidorPanel.tsx:35-83`, `src/components/home/bolao/BolaoDetail.tsx:28-73` | Seleção matemática, consultas e manipulação de estado estão misturadas à apresentação. | Componentes exigem contexto excessivo para manutenção e regressão. | Média |
| REF-006 | `src/hooks/useAuth.ts:11-12`, `src/hooks/useSessionUser.ts:3`, `src/hooks/useAdmin.ts`, `src/hooks/useAiChat.ts:6` | Chaves de consultas distribuídas entre hooks e importadas pelos consumidores. | Acoplamento desnecessário e risco de divergência de cache. | Média |
| REF-007 | `src/services/lotteryService.ts:27-101,186-208` | Transporte, normalização, cache e análise concentrados no mesmo serviço. | Alterações pequenas exigem compreender responsabilidades independentes. | Média |

## Execução recomendada
1. **Estabilizar os contratos REF-001 e REF-002.** Cobrir conclusão, cancelamento, timeout, concorrência e desmontagem antes de mudanças. Restaurar workers curtos conforme a regra existente e manter somente uma inscrição Realtime. Não introduzir fila persistente, novo backoff ou novos limites.
2. **Consolidar REF-003 e REF-006.** Criar módulos leves por domínio para assinaturas e chaves de consultas; manter reexports compatíveis. Comparar deduplicação e identidades das chaves antes/depois.
3. **Separar persistência REF-004.** Extrair serviço do chat sem mudar seleção, ordem, limite de 30, mensagens, tratamento de falhas ou estratégia de cache. Testar payloads e resultados através da interface pública.
4. **Extrair lógica REF-005.** Isolar composição do pool e controladores do conferidor/bolão, preservando sequência de atualizações, cálculos, callback de salvamento e toda a marcação visual. Testar dados reais representativos e entradas vazias.
5. **Dividir responsabilidades REF-007.** Extrair transporte e normalização, mantendo endpoints, tentativas, intervalos, caches, TTLs e comportamento offline. Não unificar caches com funções diferentes nem endurecer schemas nesta etapa.
6. **Documentar e validar cada lote.** Atualizar regras arquiteturais e guia para refletir apenas o implementado. Executar regressões e lint; acompanhar compilação automática. Validar visualmente páginas públicas e os fluxos autenticados somente quando houver sessão apropriada.

Cada etapa deve deixar o sistema funcionando e ser verificada antes da seguinte. Não executar uma reescrita geral.

## Limites e itens fora desta autorização
- Não alterar schema, RLS, permissões, credenciais, modelos da IA, prompts, valores, limites ou publicação.
- Não migrar armazenamento dos bolões/caches nem mudar paginação administrativa nesta refatoração: essas mudanças alteram comportamento e precisam de autorização própria.
- Não remover dependências por ausência de import direto: gráficos e calendário podem exigir dependências transitivas.
- Não ativar rigor global do TypeScript em lote; tipar fronteiras gradualmente com regressões.
- Não afirmar cobertura, desempenho sob carga, responsividade em nove larguras ou funcionamento autenticado sem medição.
- O scanner consultado registra leitura pública de `heartbeat` e proteção contra senhas vazadas desativada. Não há resultado recente de análise profunda: executar pela aba Segurança antes de concluir sobre segurança. Nenhuma correção de segurança está incluída.

## Relatório dos dez especialistas
**Padrão:** REFACTOR · **Wave:** uma revisão paralela, 10 tarefas · **Modos:** todos VERIFY nesta revisão.

| Especialista | Evidência consolidada |
|---|---|
| UI | Lógica em conferidor, fechamento e detalhe de bolão; extrações priorizadas sem alterações visuais. |
| Supabase | Serviços, tipos e limites de histórico mapeados; sem alterações no banco. |
| Auditor | Arquitetura e separação de responsabilidades revisadas. |
| Testing | Boa base de testes matemáticos; lacunas em workers, Realtime, sessão e transporte. |
| SEO | Rotas e metadados preservados; mudanças de SEO fora do escopo. |
| Deploy | Configurações e dependências revisadas; declarações de sucesso não usadas como validação. |
| API | Fluxo de IA, cancelamento e tentativas mapeados. |
| Prompter | Invariantes e sequência conservadora consolidados. |
| Auth | Sessão, perfil, ações e recuperação revisados; validação autenticada pendente. |
| State | Workers, cache, deduplicação e limpeza Realtime revisados. |

**Gate de implementação:** aguardando aprovação do plano. **Gate de publicação:** bloqueado, não solicitado. **Score:** não atribuído sem medições.

A aprovação autoriza somente REF-001 a REF-007 e as regressões/documentação necessárias, na ordem acima.