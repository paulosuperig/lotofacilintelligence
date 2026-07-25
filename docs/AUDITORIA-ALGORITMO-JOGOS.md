# Auditoria do Algoritmo de Geração de Jogos — Lotofácil Intelligence

> Data: 2026-07-21 · Escopo: motor de geração de jogos, estatísticas e painéis de tendências.

## 1. Resumo executivo

O "Gerador Inteligente" original **não era inteligente**: sorteava 15 dezenas de
forma uniforme e as filtrava por faixas fixas, com um _fallback_ que aceitava
**qualquer** jogo após muitas tentativas. Não usava frequência histórica, atraso,
nem — o mais grave — as **dezenas repetidas do último concurso** (a regularidade
empírica mais forte da Lotofácil: em média ~9 das 15 se repetem). Vários painéis
exibiam estatísticas **fixas no código** (falsas), e os parâmetros estatísticos
estavam **espalhados e divergentes** entre gerador, IA, dicas e fechamentos.

Esta entrega reescreve o motor para ser **genuinamente data-driven**, centraliza
os parâmetros numa única fonte da verdade, liga os painéis a **dados reais** e
adiciona **cobertura de testes** (22 testes).

## 2. Achados da auditoria

| # | Severidade | Achado |
|---|-----------|--------|
| 1 | 🔴 Alta | `generateSmartGame` era aleatório puro + rejeição; ignorava histórico, atraso e repetidas do último concurso. |
| 2 | 🔴 Alta | _Fallback_ aceitava jogo **sem filtro algum** após 450 tentativas, ainda rotulado como "otimizado". |
| 3 | 🟠 Média | Parâmetros divergentes: gerador (soma 170–220, primos 5–6) ≠ IA (180–220, primos 4–6) ≠ dicas (180–210) ≠ fechamentos (175–215). |
| 4 | 🟠 Média | `TrendsCard` (marcado "Live") e `TipsPanel` ("Quentes 5 anos / 65% dos sorteios") exibiam números **hardcoded**, nunca calculados. |
| 5 | 🟠 Média | `getAllResults()` era **código morto** e retornava JSON não normalizado — o histórico existia mas não era usado. |
| 6 | 🟡 Baixa | Sem filtro de sequência no gerador; sem análise de atraso; filtro par/ímpar estreito demais (só 7–8 pares). |
| 7 | 🟡 Baixa | Alegações com aparência de garantia ("14 Pontos Garantidos", "72% dos ganhadores") — risco ético/publicitário. |

## 3. O que foi implementado

### 3.1 Fonte única de parâmetros — `src/lib/lottery/constants.ts`
Faixas estatísticas (`BANDS`) calibradas pelo histórico real, com limites
`aceitável` (min/max) e `ideal` (idealMin/idealMax) para soma, pares/ímpares,
primos, moldura/miolo, repetidas e sequência. Consumida por gerador, métricas,
prompt da IA e painéis — acabando com a divergência.

### 3.2 Métricas de jogo — `src/lib/lottery/metrics.ts`
`computeGameMetrics` (soma, pares, primos, moldura/miolo, múltiplos de 3,
Fibonacci, maior sequência, e **repetidas vs. concurso anterior**). Mantém
`calculateGameStats` retrocompatível.

### 3.3 Análise de histórico — `src/lib/lottery/analysis.ts`
`analyzeHistory` transforma os concursos em **frequência**, **percentual**,
**atraso atual** e **maior atraso** por dezena, além de listas de **quentes**,
**frias** e **atrasadas**. Base factual que antes não existia.

### 3.4 Gerador otimizado — `src/lib/lottery/generator.ts`
- **Ponderação** de cada dezena por frequência + atraso (equilíbrio quente/fria).
- **Âncora de repetidas**: quando há último concurso, garante 8–10 dezenas repetidas.
- **Seleção por aptidão**: gera N candidatos e escolhe o de **maior aderência**
  às faixas — nunca devolve um jogo fora de faixa por "desistência".
- **RNG injetável** (`seededRng`) → núcleo puro e **testável**; produção usa
  `crypto.getRandomValues`.
- Degradação graciosa: sem histórico/offline, opera em modo heurístico uniforme.

### 3.5 Serviço e integração
- `lotteryService.getHistoryAnalysis()` com **cache** (30 min, janela de 100 concursos).
- `useLottery` carrega a análise e a injeta no gerador; expõe `analysis`.
- Novo hook `useLotteryStats` alimenta os painéis com dados reais.

### 3.6 UI honesta e data-driven
- `TrendsCard`: quentes/atrasadas **reais**; selo "Live" só quando há dados.
- `TipsPanel`: números quentes reais + textos sem alegações falsas; faixas lidas
  de `BANDS`; aviso de que filtros **não garantem prêmios**.
- Prompt da IA lê as faixas de `BANDS` (consistência garantida).

## 4. Referências de mercado adotadas
- **Repetição do concurso anterior** (~9 dezenas) — usada por praticamente todas as
  ferramentas do nicho e destacada nas estatísticas da própria Caixa.
- **Quentes / frias / atrasadas** por frequência e atraso — padrão de mercado.
- **Filtros de equilíbrio** (soma, par/ímpar, primos, moldura/miolo, sequência)
  calibrados por distribuição histórica.

## 5. Testes
22 testes cobrindo métricas, análise de histórico e gerador (validade estrutural,
determinismo por semente, aderência às faixas, âncora de repetidas, deduplicação e
ponderação por frequência). Rodar com `npm test`.

## 6. Robustez e assertividade (2ª rodada)

Melhorias adicionais para tornar o sistema mais robusto e "assertivo" (mensurável),
seguindo padrões de mercado — inclusive o conferidor da própria Caixa:

### 6.1 Conferidor oficial — `src/lib/lottery/checker.ts` + `prizes.ts`
`checkGame` mede os **acertos reais** (0–15) de qualquer jogo contra um resultado
sorteado, identifica a **faixa de premiação** (11–15) e as dezenas certas/erradas.
`checkGames` agrega um resumo (melhor acerto, nº de premiados, distribuição).
Ligado à UI: no **Meu Histórico**, cada jogo salvo é conferido automaticamente
contra o último concurso — selo de acertos, dezenas certas em destaque e um
resumo no topo (melhor pontuação e total de premiados).

### 6.2 Geração em lote diversificada — `generateBatch`
Ferramentas profissionais nunca entregam uma linha só. `generateBatch` produz um
conjunto de jogos otimizados em que nenhum par repete mais que `maxOverlap`
dezenas (relaxado automaticamente se necessário), **maximizando a cobertura**.
Exposto no gerador via botão "Lote de 5".

### 6.3 Robustez da camada de dados
- `fetchWithRetry`: **timeout + retry com backoff exponencial** (a API primária é
  um herokuapp instável), com fallback para a API oficial da Caixa.
- **Persistência em `localStorage`** da análise de histórico (carga instantânea e
  funcionamento **offline** após o primeiro acesso).
- Degradação graciosa: em falha de rede, usa o último dado conhecido.

### 6.4 Cobertura de testes
32 testes no total (métricas, análise, gerador, **lote** e **conferidor**).

## 7. Backtesting em massa (walk-forward)

`src/lib/lottery/backtest.ts` + `scripts/backtest.ts` implementam um backtest
**walk-forward** (sem vazamento de futuro): para cada concurso de teste, usa apenas
o histórico anterior para gerar K jogos e os confere contra o resultado real,
comparando com um baseline **aleatório uniforme**.

### Como rodar com dados reais
```bash
bun run scripts/backtest.ts 400 3   # últimos 400 concursos, 3 jogos cada
```
> O script baixa o histórico da API pública da Caixa. Rode-o na sua máquina/CI —
> o ambiente de sandbox desta entrega não tem acesso de rede a essa API.

### Resultado (simulação uniforme de larga escala — 1.500 concursos, 5 jogos/concurso)

| Estratégia | Média de acertos | Taxa de prêmio (≥11) | Melhor |
|-----------|-----------------:|---------------------:|-------:|
| Gerador inteligente | 8,989 | 10,44% | 13 |
| Aleatório puro | 9,003 | 10,89% | 13 |
| **Diferença** | **−0,014** | **−0,45 p.p.** | — |

### Interpretação honesta (princípio de integridade)
O sorteio da Lotofácil é **essencialmente uniforme**, então o valor **esperado**
de acertos é `15 × 15/25 = 9` para **qualquer** conjunto de 15 dezenas — e
**nenhuma estratégia altera a probabilidade de prêmio**. O backtest confirma isso:
inteligente ≈ aleatório, dentro do ruído estatístico.

**O que a "inteligência" entrega de fato** não é maior chance de ganhar, e sim
**qualidade de construção**: jogos equilibrados (soma, paridade, primos,
moldura/miolo), ancorados na regularidade das repetidas, diversificados no lote e
livres de combinações estatisticamente absurdas. É assim que as melhores
ferramentas do mercado agregam valor — e comunicá-lo com transparência é um
diferencial de confiança, não uma fraqueza.

> Observação: a simulação acima usa um modelo uniforme (fiel à natureza do sorteio).
> Sobre o histórico **real**, pequenos vieses de frequência podem produzir uma
> diferença marginal — que o `scripts/backtest.ts` mede objetivamente. A recomendação
> é publicar sempre o número real, sem promessas de ganho.

## 8. Fechamentos reais + CI (rodada de robustez)

### 8.1 Motor de fechamento (wheeling) verificado — `src/lib/lottery/wheel.ts`
Substitui a farsa anterior (`Math.random()` gerando 1 jogo, com selo
"14 Pontos Garantidos" **falso**) por um motor real de teoria de cobertura:
- Reduz um pool de N dezenas (16–20) a um conjunto menor de jogos.
- A **garantia é calculada e verificada exaustivamente** (todas as C(N,15)
  formas de as 15 caírem dentro do pool) — nunca exibimos garantia não verificada.
- Construção gulosa maximin em espaço de bitmask; orçamento de candidatos
  adaptativo mantém o cálculo abaixo de ~0,5 s no navegador.
- UI honesta: "garante G pontos **se** as 15 saírem entre as N escolhidas —
  isto não garante prêmio". Pool montado a partir de quentes + atrasadas.
- 7 testes cobrindo a matemática da garantia (ex.: N=16 ⇒ garantia 14; todos os
  jogos ⇒ 15; garantia verificada = garantia reportada).

### 8.2 Integração Contínua — `.github/workflows/ci.yml`
Antes não havia CI de qualidade (só deploy Vercel). Agora todo push/PR roda:
- **Typecheck (`tsc`)** e **testes (`vitest`)** como **gate bloqueante**;
- **lint** informativo (o projeto ainda carrega avisos legados nos componentes
  shadcn gerados, então não bloqueia — mas fica visível).

## 9. Confiabilidade, transparência e robustez de dados (rodada de qualificação)

Melhorias para elevar o produto ao padrão de integridade da Caixa e blindar o
núcleo contra dados ruins.

### 9.1 Probabilidades oficiais — `src/lib/lottery/probabilities.ts`
Chances calculadas por combinatória exata (hipergeométrica) e **conferidas contra
os valores oficiais da Caixa** (15 → 1 em 3.268.760; 14 → 1 em 21.792; 13 → 692;
12 → 60; 11 → 11). 11 testes, incluindo a verificação de que a soma de todas as
probabilidades é 1.

### 9.2 Transparência + jogo responsável — `ResponsibleGaming.tsx`
Componente exibido ao gerar jogos e ao montar fechamentos: mostra a **chance real**
(contextualizada pelo nº de jogos no fechamento) e reforça, no padrão da Caixa,
que se trata de um **jogo de azar** (nenhuma estratégia altera a probabilidade),
com aviso **+18** e apelo ao jogo responsável. Remove qualquer indução a
expectativa de ganho.

### 9.3 Robustez de dados (defensive programming)
`analyzeHistory` agora só considera concursos **válidos** (exatamente 15 dezenas
únicas em 1..25) e reporta quantos foram **descartados** — sorteios malformados
vindos da API não distorcem mais frequências e atrasos. Coberto por teste.

## 10. Painel de estatísticas + IA data-grounded (rodada de profundidade)

### 10.1 Painel de Estatísticas — `src/components/home/StatsPanel.tsx`
Painel rico com **recharts** (lazy-loaded), acessível pelo card "Tendências":
- **Frequência por dezena** (barras, quentes destacadas).
- **Atraso atual** (barras, atrasadas destacadas).
- **Mapa de calor** no volante 5x5 (intensidade sequencial de uma matiz = frequência).
- **Co-ocorrência**: pares de dezenas que mais saem juntos.
- Segue a metodologia de dataviz (matiz única para magnitude, eixos recessivos,
  tooltips, dark mode) e traz aviso de que são estatísticas descritivas, não previsão.
- Suporte: `analyzeHistory` passou a computar **co-ocorrência** (`topPairs`).

### 10.2 Intelligence AI mais dinâmico e assertivo
Antes, o prompt mandava a IA "identificar quentes/frias" **sem dado algum** — ela
chutava. Agora:
- `formatAnalysisForPrompt` injeta os **dados reais** (quentes com %, frias,
  atrasadas com atraso, pares fortes) no prompt.
- **Estratégias dinâmicas** detectadas na mensagem (`quentes`, `atrasadas`,
  `equilibrada`, `agressiva`) geram diretrizes de composição específicas.
- Lógica de intenção extraída para `src/lib/ai/intent.ts` (pura e **testada**).
- Reforço de transparência no prompt (chance de 15 acertos = 1 em 3.268.760).
- 66 testes no total (novos: intent, co-ocorrência, formatação da análise).

### 10.3 Auditoria do fluxo Intelligence AI — robustez (rodada atual)
Auditoria ponta a ponta do fluxo `parseUserIntent → buildSystemPrompt → edge
function → sanitizeAiGamesDetailed → render`. Correções aplicadas:
- **Fonte única de parâmetros no prompt** — os critérios de composição do system
  prompt passam a ser derivados de `BANDS` via `formatCriteriaForPrompt()`.
  Eliminado o *drift* que fixava "soma 180-220" enquanto o resto do app usa
  180-210 (o fallback sem stats também foi alinhado).
- **Conferência automática do sistema** — `sanitizeAiGamesDetailed` agora calcula
  as métricas REAIS de cada jogo (`computeGameMetrics`) e anexa uma tabela
  autoritativa (soma, P/Í, primos, moldura, miolo, sequência e **repetidas** vs.
  o último concurso), marcando ⚠️ o que sai da faixa. Antes só a soma era checada
  e a "validação" era auto-relatada pelo modelo (não verificada). O prompt deixou
  de pedir a tabela ao modelo — o sistema é a fonte da verdade.
- **Sem fabricação de dezenas** — removida a lógica que completava linhas
  incompletas com 1,2,3…, que podia exibir um jogo que o modelo nunca gerou.
- **Blindagem anti prompt-injection** — o prompt passa a ignorar instruções do
  usuário que tentem revelar/alterar/ignorar as diretrizes ou o system prompt.
- **Clamp de quantidade** (`MAX_JOGOS = 12`) — evita truncamento garantido da
  resposta quando o usuário pede dezenas de jogos.
- **Resiliência da edge function** — `AbortController` com timeout de 55s no fetch
  ao DeepSeek e validação de `messages`, evitando funções penduradas e payloads
  malformados.
- Cobertura: novos testes em `sanitizeGames.test.ts` e clamp em `intent.test.ts`
  (93 testes no total, verdes).

### 10.4 Prompt de geração — mais opções e otimização honesta do lote
Segunda rodada sobre o prompt de geração de jogos. Premissa mantida com
honestidade: **nenhum filtro altera a probabilidade de uma combinação ser
sorteada**; o que se otimiza é a qualidade do LOTE. Mudanças:
- **Novas estratégias**: `repetidas` (âncora em 9-10 repetidas do último
  concurso — a regularidade empírica mais forte) e `ciclo` (fechamento de ciclo:
  todas as ausentes distribuídas pelo lote), somando-se a quentes/atrasadas/
  equilibrada/agressiva.
- **Dezenas fixas e excluídas**: `parseUserIntent` entende "fixando 05 e 10",
  "sem a dezena 23" etc. (fixas têm precedência em conflito; tetos MAX_FIXAS=12
  e MAX_EXCLUIDAS=10). O prompt as trata como restrição prioritária e a
  conferência automática valida cada jogo contra elas.
- **Seção QUALIDADE DO LOTE no prompt**: cobertura (diversificação amplia
  faixas 11-13), rateio (evitar combinações populares — sequências óbvias,
  padrões geométricos, só "datas" — que dividiriam o prêmio de 14/15) e
  dispersão (5 linhas do volante, 2-4 dezenas por linha).
- **Racional por jogo**: uma linha curta explicando o perfil de cada jogo
  (transparência do critério, não promessa de acerto).
- UI: dois novos atalhos de sugestão ("Repetidas do último", "Fixar & excluir
  dezenas"). Teto de tokens por jogo ajustado (220) para caber o racional.
- Cobertura: 100 testes verdes (novos: fixas/excluídas, estratégias novas,
  validação na conferência).

### 10.5 Gerador determinístico — estratégias, restrições e alvo de soma
O gerador "inteligente" (`generator.ts`) passou a oferecer as MESMAS opções do
Intelligence AI, no motor puro/testável usado pelo botão "Gerador Inteligente":
- **6 estratégias** (`equilibrada`, `quentes`, `atrasadas`, `repetidas`,
  `ciclo`, `agressiva`) que enviesam os pesos de amostragem (frequência/atraso)
  e o alvo de dezenas repetidas do último concurso (viés high/mid/low).
- **Dezenas fixas e excluídas**: `generateOptimizedGame`/`generateBatch` aceitam
  `fixed`/`excluded`. A geração é feita por construção (nunca fabrica repetição,
  nunca inclui excluída, sempre inclui fixa); excluídas são limitadas a 10 para
  manter pool ≥ 15, e fixas têm precedência em conflito.
- **Alvo de soma** (`sumMin`/`sumMax`): penalidade soft no ranking dos
  candidatos, sem descartar jogos válidos.
- **UI**: seletor de estratégia (6 chips acessíveis, `radiogroup`) no
  `GameGenerator`, com dica contextual; o rótulo do jogo salvo reflete a
  estratégia usada.
- Limpeza: 2 `any` legados de `useLottery` tipados (RealtimeChannel, CustomEvent).
- Cobertura: 107 testes verdes (7 novos no gerador: fixas, excluídas,
  precedência, clamp, viés de repetidas, penalidade de soma).

### 10.6 Gerador — volante de fixar/excluir e lote configurável
Completa a UI do gerador com as opções que o motor já suportava:
- **Volante 5x5 (`NumberBoard`)**: um toque cicla a dezena neutra → fixa (verde)
  → excluída (vermelho) → neutra. Lógica pura e testada em
  `lib/lottery/selection.ts` (limites: 14 fixas, 10 excluídas, para o pool nunca
  ficar < 15; quando as excluídas enchem, tocar numa fixa a mantém — não perde a
  seleção). Acessível (`aria-pressed`, foco visível).
- **Quantidade do lote configurável** (3/5/10/15), substituindo o valor fixo.
- Fixas/excluídas fluem para `generateSmartGame`/`generateSmartBatch` e são
  respeitadas por construção pelo gerador.
- Cobertura: 113 testes verdes (6 novos em `selection`).

### 10.7 Benchmark do nicho + filtros avançados de geração
Comparação com os líderes do nicho (apps/sites de Lotofácil). **Onde já
lideramos**: estatística honesta (a maioria vende "número quente garantido"),
fechamentos com **garantia verificada** (não selo falso), gerador data-driven
com estratégias e âncora de repetidas, IA com conferência automática. **Maior
gap fechado nesta rodada**: filtros configuráveis de geração — recurso central
dos apps premium — que tínhamos no motor (bandas) mas não expúnhamos.
- **Filtros avançados** (soma, paridade, primos) como **restrições soft**: o
  gerador prioriza no ranking os jogos dentro das faixas pedidas, sem descartar
  jogos válidos nem alterar a probabilidade do sorteio. `generateOptimizedGame`
  ganhou `paresMin/Max` e `primosMin/Max` (soma já existia), com penalidade
  proporcional (`rangePenalty`).
- **Presets** (`generationPresets.ts`, puro/testável): Soma (Baixa/Ideal/Alta),
  Paridade (Equilíbrio/+Pares/+Ímpares), Primos (Ideal 4–6) → mapeados para as
  faixas soft. UI `GenerationFilters` com chips acessíveis (`radiogroup`).
- Cobertura: 121 testes verdes (novos: penalidade de paridade/primos no gerador
  e mapeamento dos presets).

### 10.8 Assertividade visível + filtro de sequência
Auditoria do fluxo de geração vs. mercado. O motor já calculava um **score de
aderência (0–1)** por jogo, mas a UI o descartava. Tornamos essa assertividade
**visível e honesta**, e adicionamos mais uma opção de filtro:
- **Selo de qualidade** por jogo gerado: "Excelente/Ótima/Boa/Moderada aderência
  · NN%", com nota explícita de que é **aderência às faixas estatísticas** (não
  chance de ganhar — a probabilidade do sorteio é fixa). O `score` do gerador
  passa a fluir por `SavedGame.quality` até a UI. O lote reporta a **aderência
  média** no toast.
- **Filtro de Sequência** (soft): Curta (≤3) / Média (≤5) → `seqMax` no gerador
  (`rangePenalty` sobre a maior sequência consecutiva). Mais uma dimensão de
  controle, junto de soma/paridade/primos.
- Cobertura: 123 testes verdes (novos: penalidade de sequência e preset).

### 10.9 Painel "Prova Real" — backtest exposto na UI
O backtest walk-forward (`runBacktest`) existia na lib + script CLI, mas nunca
tinha sido exposto ao usuário. Agora há um **painel dedicado** (`BacktestPanel`):
- **Rodar sob demanda**: busca os concursos em ordem cronológica
  (`lotteryService.getChronologicalDraws`) e roda o backtest com parâmetros
  conservadores (100 concursos, 3 jogos/concurso, janela 60, 18 candidatos) para
  manter o cálculo no navegador em ~1-2s, com estado de carregamento.
- **Compara** gerador inteligente vs. aleatório puro (média de acertos, taxa de
  prêmio ≥11, melhor acerto, nº de jogos) + as diferenças.
- **Interpretação honesta**: reforça que o sorteio é uniforme (valor esperado = 9
  para qualquer jogo) e que nenhuma estratégia altera a probabilidade de prêmio —
  a "inteligência" entrega qualidade de construção e diversificação, não mais
  chance de ganhar. É a maior peça de transparência do app.
- Acessível por um card no `BentoGrid` (`provareal`); painel lazy-loaded (chunk
  próprio). Limpeza: `normalizeResult` do serviço tipado (removido `any` legado).

### 10.10 Conferidor contra qualquer concurso + valor do prêmio
Antes só era possível conferir os jogos salvos contra o ÚLTIMO concurso. Agora há
um **Conferidor** dedicado:
- **Qualquer concurso**: `lotteryService.getResultByConcurso(n)` busca o resultado
  específico (com `premiacoes`). O `LotteryResultSchema` passou a **preservar
  `premiacoes`** (antes o zod as descartava).
- **Valor do prêmio**: `prizeValue.ts` (puro/testado) deduz a faixa de acertos
  de cada premiação (por `descricao` "15 acertos" ou por `faixa` 1..5) e retorna
  valor + ganhadores; `formatBRL` exibe em reais.
- **UI** (`ConferidorPanel`, lazy): seletor de 15 dezenas (jogo avulso) ou
  preenchimento a partir de um jogo salvo, campo de concurso (default = último),
  e resultado com acertos, dezenas certas/erradas, faixa premiada e **valor do
  prêmio + ganhadores**. Acessível por card no `BentoGrid` (rota `conferidor`).
- Cobertura: 131 testes verdes (8 novos em `prizeValue`).

### 10.11 Bolão — gestão de grupo
Fecha o último grande item do benchmark. Ferramenta de gestão do organizador:
- **Lib pura/testada** (`bolao.ts`): custo total, custo por cota, custo por
  cotista; **rateio por maior resto em centavos** (a soma dos rateios é exatamente
  o total, sem perder centavos); `conferirBolao` soma o prêmio de todos os jogos
  contra um concurso e rateia por cota.
- **Persistência local** (`bolaoService`, localStorage) + hook `useBoloes` (CRUD).
- **UI** (`BolaoPanel`, lazy): criar bolões; por bolão, adicionar **cotistas**
  (nome + cotas) e **jogos** (dos salvos ou avulso no volante), ver o **rateio de
  custo** e **conferir contra um concurso** exibindo o prêmio total, jogos
  premiados e o **rateio do prêmio por cotista**. Acesso por card no `BentoGrid`
  (rota `bolao`).
- Cobertura: 141 testes verdes (10 novos em `bolao`).

## 11. Próximos passos sugeridos
- **Fechamentos personalizados** (pool no volante + garantia-alvo) e presets
  21/22 via covering designs pré-computados.
- **Prova Real no app**: expor o backtest (inteligente vs aleatório) num painel.
- **Conferidor avançado**: qualquer concurso + valor real do prêmio + jogo avulso.
- **Persistir histórico** de concursos no Supabase (proxy + cache).
- **Fonte oficial da Caixa** via edge function (proxy + cache) e **persistência do
  histórico no Supabase** — maior ganho restante de confiabilidade (requer o
  ambiente Supabase para testar/deployar).
- Conferência de **jogo avulso** e contra **qualquer concurso**, exibindo o
  **valor real do prêmio** (a API já traz `premiacoes`).
- Fechamentos com pools 22/25 via **covering designs** pré-computados.
- Zerar os avisos de lint legados para tornar o lint um gate bloqueante.
