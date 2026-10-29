# Lotofácil Sistema Inteligente

Plataforma inteligente para análise e geração de jogos da Lotofácil baseada em dados reais e transparência estatística.

## 🚀 Tecnologias

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion.
- **Estado & Dados**: TanStack Query (React Query), Supabase (Auth & Database).
- **Análise**: Motores de geração ponderada, backtesting walk-forward e teoria de cobertura (wheeling).
- **IA**: Integração com LLMs para geração guiada por intenção e conferência automática.

## 🛠️ Organização do Projeto

O projeto segue uma estrutura baseada em camadas de responsabilidade:

- `src/lib/lottery`: Núcleo puro do motor estatístico, geradores e conferidores. Altamente testado.
- `src/services`: Camada de comunicação com APIs externas e Supabase.
- `src/hooks`: Hooks de orquestração e estado global/local.
- `src/components`: UI modularizada.
- `docs/`: Documentação detalhada sobre algoritmos, auditorias e padrões.

## 📈 Funcionalidades Principais

- **Gerador Inteligente**: Geração baseada em frequência, atraso e âncora de repetidas.
- **Fechamentos Reais**: Motor de wheeling com garantia matemática verificada.
- **Análise de Tendências**: Gráficos reais de frequência, atraso e co-ocorrência.
- **Intelligence AI**: Assistente que entende pedidos em linguagem natural e gera jogos validados.
- **Backtesting**: Ferramenta para validar estratégias contra o histórico real.

## 🧪 Testes

O projeto prioriza a robustez do motor matemático.
```bash
npm test          # Executa todos os testes
npm run typecheck # Validação de tipos TypeScript
```

## 📖 Documentação Adicional

- [Auditoria do Algoritmo](docs/AUDITORIA-ALGORITMO-JOGOS.md)
- [Regras de Arquitetura](AGENTS.md)
- [Guia de Refatoração e Padrões](docs/REFACTORING-GUIDE.md) (Novo)

---

Desenvolvido com foco em integridade e jogo responsável.
