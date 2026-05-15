## Problema
Ao pedir "Gere 10 jogos com soma acima de 210", a IA retorna só 1 jogo. Causas:

1. O system prompt em `src/hooks/useAiAssistant.ts` impõe **"Limite a 3 jogos por resposta, salvo pedido explícito de mais"** — mas o modelo está interpretando como teto rígido.
2. `max_tokens: 1500` é apertado para 10 jogos + análise + métricas (cada jogo ocupa ~80 tokens, métricas mais ~60 → ~1400 só em jogos, sem margem para Análise/Estratégia).
3. Não há detecção da **quantidade pedida** nem dos **filtros** (soma mínima/máxima, par/ímpar específico, repetidas etc.) para reforçar no prompt e validar a saída.
4. O sanitizer (`sanitizeAiGames`) corrige somas, mas não verifica se a quantidade entregue bate com a solicitada nem se os jogos atendem aos filtros — então a UI aceita silenciosamente uma resposta incompleta.

## Plano

### 1. `src/hooks/useAiAssistant.ts` — interpretar o pedido do usuário
- Criar `parseUserIntent(message)` que extrai:
  - `quantidade` (regex `/\b(\d{1,2})\s*jogos?\b/i`, fallback 3)
  - `somaMin` / `somaMax` (`soma\s*(acima|maior|>=?|abaixo|menor|<=?|entre)\s*(\d+)`)
  - `paridade` ("mais pares", "mais ímpares")
  - `repetidasMin` (ex.: "com pelo menos 9 repetidas")
- Injetar bloco `PEDIDO_DO_USUARIO` no system prompt com esses requisitos resolvidos, e instrução: **"Gere EXATAMENTE {quantidade} jogos. Cada jogo DEVE satisfazer: soma {operador} {valor}, ..."**.
- Remover a regra fixa "Limite a 3 jogos" — substituir por "Gere a quantidade pedida pelo usuário; se não especificar, 3."
- Ajustar parâmetros do modelo dinamicamente:
  - `max_tokens = Math.min(4096, 400 + quantidade * 130)`
  - manter `temperature 0.3`.

### 2. `src/lib/ai/sanitizeGames.ts` — validar contra a intenção
- Estender assinatura: `sanitizeAiGames(text, intent?)`.
- Após sanitizar, contar jogos válidos. Se `count < intent.quantidade` ou algum jogo violar `somaMin/Max`, anexar nota no final do texto: `> ⚠️ Resposta incompleta: foram entregues X de Y jogos solicitados. Use "Regenerar" para completar.` (não tenta inventar jogos — apenas sinaliza).
- Filtrar/marcar jogos que não cumpram filtros declarados (ex.: soma fora do intervalo) com aviso inline.

### 3. Retry inteligente quando incompleto
- Em `useAiAssistant.sendMessage`: se a resposta sanitizada tiver menos jogos que `intent.quantidade`, fazer **uma** tentativa automática de continuação enviando mensagem assistant + nova mensagem `user`: `"Faltaram N jogos. Continue a partir do jogo K, mantendo todos os filtros."` Concatenar respostas antes de exibir.

### 4. UX
- Em `src/components/ai/AiAssistant.tsx` (ajuste mínimo): se a mensagem assistant terminar com o marcador `⚠️ Resposta incompleta`, renderizar botão "Regenerar resposta completa" que reenviar a última mensagem do usuário.

## Arquivos afetados
- `src/hooks/useAiAssistant.ts` (parseUserIntent, prompt dinâmico, max_tokens, retry de continuação)
- `src/lib/ai/sanitizeGames.ts` (validação contra intent)
- `src/components/ai/AiAssistant.tsx` (botão Regenerar quando incompleto)

Sem mudanças em backend/Supabase. Skill aplicada: `@skillslovable` (chatbot AI: interpretação de intenção, prompt dinâmico, validação de saída, retry de continuação).
