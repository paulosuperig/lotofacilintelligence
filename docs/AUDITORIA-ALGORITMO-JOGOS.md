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

## 7. Próximos passos sugeridos
- **Fechamentos/wheeling** matemáticos reais (hoje `fechamentos.ts` é apenas copy).
- Persistir a análise no **Supabase** (edge function) para reduzir chamadas à API pública.
- **Backtesting em massa**: medir o acerto médio do gerador data-driven vs. aleatório
  puro sobre N concursos passados, publicando a métrica de forma transparente.
- Conferência de um **jogo avulso** (o usuário digita 15 dezenas e confere na hora).
