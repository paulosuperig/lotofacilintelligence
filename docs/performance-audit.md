# Relatório de otimização — 10/10/2026

## Resultado medido
- Login no Vite: 127 → 66 solicitações de recursos/módulos (48% menos). Não representa redução de bytes do bundle de produção.
- Nenhum módulo de AppShell, useLottery, useAiAssistant ou useAdmin foi solicitado antes do login após a separação.
- Lote real de 50 jogos, com fixas 05/10 e exclusão 23, validado no navegador. O temporizador da interface continuou executando durante o cálculo (163 ticks no último teste), com cancelamento AbortError validado.
- Prova Real executada no worker com 10 concursos; regressão compara o relatório integral ao algoritmo determinístico original.
- Login e recuperação de senha verificados em 1280px; login em 375px sem overflow horizontal. Sem erros de página nessas verificações.
- 165 testes aprovados em 24 arquivos; oito novas regressões para cache de requests, composição/algoritmos e confirmação de insert.
- Compilação automática: build OK. Lint de src sem erros, sete avisos existentes. Lint global tem três erros preexistentes de `any` em scripts/backtest.ts:14,28,56.

## Gargalos priorizados e ações
| Prioridade | Evidência | Impacto | Ação |
|---|---|---|---|
| Alta | Index importava hooks de IA/admin e dados mesmo sem sessão | Download/processamento de ferramentas privadas antes da entrada | Index agora é porta de autenticação; AppShell carregado só com perfil resolvido |
| Alta | IA/admin inicializados no pai de todas as abas | Consultas de chat/config/perfis desnecessárias e digitação atualizando o layout | Painéis conectados carregados sob demanda; entrada do chat local |
| Alta | GameGenerator e BacktestPanel executavam cálculo síncrono | Interface bloqueada, spinner congelado e navegação lenta | Workers de módulo com algoritmos existentes, sem reduzir candidatos ou alterar estatística |
| Alta | Gerador impunha 800ms antes de calcular | Atraso artificial em todos os pedidos | Atraso removido; estado ocupado liberado em finally e cálculo cancelado ao desmontar |
| Alta | useLottery montado em shell e gerador assinava o mesmo canal | Inscrições duplicadas e risco de callbacks após subscribe | Realtime exclusivo do shell, eventos agrupados em 300ms e cleanup do canal real |
| Alta | Salvamento fazia insert + leitura completa + invalidação | Tráfego e latência adicionais após cada lote | Insert retorna somente campos usados; cache recebe IDs reais após confirmação; Realtime reconcilia mudanças externas |
| Média | Análise e backtest baixavam o mesmo histórico externo | Repetição de payload com milhares de concursos | Cache em memória de 30 minutos com deduplicação de chamadas concorrentes; falhas não são cacheadas |
| Média | useSessionUser criava listeners próprios | Redundância de sessão em múltiplos consumidores | Sessão compartilhada via TanStack Query; listener no ponto de autenticação |
| Média | Queries/mutações importadas por consumidores de estatísticas | Acoplamento e processamento desnecessário | Chaves leves em módulo independente |
| Média | Chat markdown e navegação renderizavam novamente sem mudanças | Trabalho de renderização durante digitação/atualizações | Memoização de mensagens, cabeçalho, navegação e cards; transições React sem espera de animação de saída |
| Média | Ausência de carregamento durante resolução da sessão | Intervalo visual vazio | Indicador acessível e fallback com altura estável; MotionConfig respeita movimento reduzido |
| Baixa | Timers/URLs temporárias sem cleanup | Recursos retidos ao sair da tela ou exportar repetidamente | Cancelamento de workers/IA, cleanup de timer de copiar, revokeObjectURL na exportação |

## Análise sem mudança desnecessária
- Rotas já usam lazy/Suspense e os gráficos permanecem separados. `manualChunks` não foi reintroduzido.
- Assets públicos somam aproximadamente 446KB; nenhum hero fotográfico ou imagem LCP foi identificado na tela de entrada. PNGs de instalação e formatos/favicon foram preservados para compatibilidade.
- CSS/animações mantêm o design; não foi feita troca de cores, remoção de recursos nem migração para SSR.
- Políticas, grants e índices do banco não foram alterados. A otimização de consultas mantém filtro user_id e RLS. Paginação completa exige mudanças coordenadas com seleção/exportação e não foi reduzida silenciosamente a uma lista truncada.

## Relatório de execução dos especialistas
Padrão: OPTIMIZE · Stack: React 18 + Vite 5 · Dez análises concorrentes.

| Especialista | Modo | Resultado consolidado |
|---|---|---|
| UI | EXEC | Separação de telas, memoização, fluidez e loading |
| Supabase | VERIFY | Payloads, consultas, RLS e preservação do isolamento revisados; otimização de serviço implementada |
| Auditor | VERIFY | Main-thread blocking e riscos de lifecycle identificados; workers e limpeza implementados |
| Testing | EXEC | 165 testes e verificações Playwright; integração autenticada real indisponível |
| SEO | VERIFY | Fontes, assets, head e CWV revisados; sem medição Lighthouse |
| Deploy | VERIFY | Lazy loading e cache preservados; sem publicação e sem manualChunks |
| API | EXEC | Repetição de requests reduzida; cancelamento de IA na saída do painel |
| Prompter | VERIFY | Prioridades e restrições do pedido revisadas |
| Auth | EXEC | Sessão compartilhada e loading sequencial preservados |
| State | EXEC | Queries sob demanda, cache compartilhado e dono único de Realtime |

Gates: análise → implementação concluído; testes → compilação automática aprovado; publicação não executada.
Score: não atribuído — não há evidência para pontuação Lighthouse, cobertura percentual, segurança de produção ou certificação 100%.

## Limitações e próximos passos
1. Projeto Supabase externo não gerenciado: não foi possível testar login real → persistência real → chat real no navegador; testes do serviço usam respostas HTTP controladas, não certificam RLS.
2. Bundle comprimido/CWV/Lighthouse de produção não foram medidos. A contagem de módulos é exclusivamente do servidor Vite.
3. Serviços externos ainda dependem de disponibilidade/CORS; tempos de resposta de Supabase/DeepSeek não foram medidos com sessão real.
4. Caches locais de resultados e bolões preexistentes não foram migrados ao Supabase nesta otimização; este trabalho não certifica persistência 100% no banco.
5. Publicação/redeploy permanece dependente de pedido explícito e acesso ao ambiente de hospedagem.