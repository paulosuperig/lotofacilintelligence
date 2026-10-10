# Guia de Refatoração Deep & Safe

Este documento define as prioridades e o roadmap para melhoria da qualidade do código sem comprometer a estabilidade do sistema.

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
