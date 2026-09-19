# Preparação completa para Vercel

## Objetivo
Refatorar a configuração de produção e os pontos de carregamento do Lotofácil Intelligence para uma publicação Vercel previsível, rápida e sem tela branca, preservando as funcionalidades atuais.

## Implementação
1. **Build e dependências**
   - Revisar os scripts de instalação/build e remover comportamentos que mascaram falhas ou tornam o resultado não determinístico.
   - Manter o empacotamento seguro do React, evitando divisão manual que possa recriar ciclos ou `createContext` indefinido.
   - Garantir que apenas variáveis públicas sejam incorporadas ao navegador.

2. **Vercel e cache**
   - Consolidar `vercel.json` com rewrite correto para SPA, cache imutável somente para arquivos versionados e revalidação do HTML.
   - Revisar cabeçalhos de segurança e CSP sem bloquear Supabase, Realtime, fontes, Meta Pixel ou APIs necessárias.
   - Remover configurações de cache/build sem efeito ou que prejudiquem builds incrementais.

3. **Inicialização e resiliência**
   - Simplificar o carregamento inicial para evitar watchdogs ou scripts inline frágeis.
   - Preservar uma resposta visual acessível durante a inicialização e um erro recuperável quando o JavaScript não carregar.
   - Confirmar lazy loading das áreas pesadas e ausência de imports que causem bundle circular.

4. **Metadados e PWA**
   - Corrigir URLs/metadados para o domínio publicado real.
   - Validar manifest, ícones, robots e arquivos públicos usados pela Vercel.

5. **Validação final**
   - Executar verificação de tipos, lint, testes e build de produção.
   - Servir a saída gerada e realizar smoke tests desktop/mobile, incluindo login inicial, rotas SPA, console e rede.
   - Conferir os registros finais e documentar riscos externos que dependam do painel Vercel/Supabase.

## Critérios de conclusão
- Build de produção reproduzível e sem erros.
- Página inicial e rota interna renderizam após refresh direto.
- Nenhum erro crítico no console ou carregamento de assets.
- HTML não fica preso em cache; assets com hash usam cache longo.
- Integrações atuais continuam permitidas pela política de segurança.
- Typecheck, testes e smoke test aprovados.
