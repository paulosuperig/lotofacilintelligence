# Reorganização final do código (sem mudar funcionamento)

O código já passou por três rodadas de reorganização (197+ testes). Esta rodada cobre o que ainda está fora do padrão, em etapas pequenas. Cada etapa deixa o app funcionando e só segue para a próxima depois dos testes passarem.

Nada muda na aparência, nos textos, nos cálculos, no salvamento, na IA ou no banco de dados.

## Etapas

1. **Remover peças visuais sem uso** — cerca de 30 componentes de interface prontos que nenhuma tela usa (barra lateral, carrossel, calendário, gráficos genéricos etc.). Cada um é conferido por busca antes de sair.
2. **Dividir o gerador de jogos** (maior arquivo de lógica, 446 linhas) em partes: sorteio aleatório, pesos, pontuação e geração em lote. O arquivo atual continua exportando tudo, então nenhuma tela muda.
3. **Unificar a chamada da IA** — hoje existem duas camadas seguidas para o mesmo envio. Vira uma só, com as mesmas tentativas, limites e mensagens de erro. O tipo de mensagem passa para a pasta de tipos.
4. **Dividir a tabela de usuários do admin** (254 linhas) em linha, ações e diálogos, mantendo a marcação igual.
5. **Separar o Meta Pixel** em carregamento e eventos, mantendo os mesmos nomes de evento e IDs.
6. **Arrumar pastas** — a tela de login vai para a pasta de autenticação; ajustes de importação em seguida.

## Como confirmo que nada quebrou

- Testes completos depois de cada etapa (nunca menos testes que antes).
- Testes novos para as partes divididas do gerador: mesma semente gera os mesmos jogos de antes.
- Lint e compilação sem erros.
- Abrir login e recuperação de senha no navegador para comparar.
- Não consigo testar as telas depois do login neste ambiente; isso fica registrado.

## Fora desta rodada

Mudanças no banco, paginação do admin, atualização de bibliotecas e publicação — só com autorização separada.

## Detalhes técnicos

- Etapa 1: excluir `src/components/ui/*` sem importadores (verificado com `rg` incluindo imports relativos entre arquivos de `ui/`).
- Etapa 2: `src/lib/lottery/generator/{rng,weights,scoring,batch}.ts`; `generator.ts` vira barrel de reexport; teste de paridade com `seededRng`.
- Etapa 3: incorporar `aiService.callAiGateway` em `aiRequestService`; `AiGatewayMessage` em `src/types/ai.ts` com reexport.
- Etapa 4: `src/components/admin/user-table/*`.
- Etapa 5: `src/lib/analytics/metaPixel/{loader,events}.ts` com reexport.
- Etapa 6: `src/components/Login.tsx` → `src/components/auth/Login.tsx`.
- Registrar regras novas em `AGENTS.md` e tarefas em `roadmap.md`.
