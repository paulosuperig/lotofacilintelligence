## Otimização Robusta da Inteligência Artificial (Lotofácil Intelligence)

### Objetivo
Tornar as respostas da IA mais precisas, contextuais (com dados reais da Lotofácil), padronizadas e resilientes a falhas de rede/API.

### 1. Contexto estatístico real injetado no prompt (precisão)
Hoje a IA "alucina" frequências porque não recebe os dados reais. Vou:
- Ler do hook `useLottery` o último resultado, os últimos 25 concursos e calcular:
  - Frequência (quentes/frias) das 25 dezenas
  - Atrasos (gap desde a última aparição)
  - Pares/ímpares, primos, moldura/centro, soma média, repetidas do concurso anterior
- Injetar essas estatísticas como bloco JSON no `system` prompt a cada chamada, para que a IA fundamente toda sugestão em dados reais e não em achismo.

### 2. Prompt engineering reforçado
- Estrutura de resposta padronizada (Análise → Estratégia → Jogos → Métricas) em Markdown.
- Regra rígida: cada jogo deve ter exatamente 15 dezenas únicas (1–25), ordenadas, no formato detectado pelo `GameLine` renderer (`01) 03, 05, ...  (soma 187)`).
- Auto-validação: a IA deve recontar antes de responder e refazer se algum jogo violar a regra.
- Temperatura baixa (0.3) + `top_p` 0.9 para reduzir variabilidade/erros.
- Limite `max_tokens` adequado (1500) para evitar respostas truncadas.

### 3. Resiliência e UX
- `AbortController` com timeout de 45s.
- Retry exponencial (até 2 tentativas) em erros 5xx/429/network.
- Mensagens de erro específicas: 401 (chave inválida), 402 (créditos), 429 (limite), 5xx (servidor).
- Truncar histórico enviado para no máximo as últimas 12 mensagens (evita estouro de contexto e custo).
- Validação client-side: se a resposta contiver jogos inválidos, exibe aviso e oferece "Regenerar".

### 4. Pós-processamento (garantia matemática)
Após receber a resposta, um sanitizer:
- Detecta cada linha de jogo, valida 15 dezenas únicas em [1,25], ordena, recalcula a soma correta e substitui no texto.
- Corrige somas erradas declaradas pela IA.
- Garante que `GameLine` no chat renderize sempre cards corretos.

### Arquivos afetados
- `src/hooks/useAiAssistant.ts` — injeção de contexto, prompt reforçado, retry, abort, sanitizer, parâmetros do modelo.
- `src/pages/Index.tsx` — passar estatísticas/contexto (último concurso + histórico) ao hook.
- `src/lib/ai/lotteryStats.ts` (novo) — utilitários de cálculo (frequência, atraso, pares/ímpares, primos, moldura).
- `src/lib/ai/sanitizeGames.ts` (novo) — pós-processamento e validação dos jogos no texto.

### Skill utilizada
`@skillslovable` — boas práticas de chatbot AI (contexto completo, prompt engineering robusto, tratamento de erros 429/402, validação de saída).

Sem alterações de backend/Supabase. Mantém DeepSeek como provedor (chave do usuário); nenhum segredo é exposto.