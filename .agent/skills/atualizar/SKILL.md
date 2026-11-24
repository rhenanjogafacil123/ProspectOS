---
name: atualizar
description: >
  Varre o projeto e atualiza os arquivos de contexto (`_memoria/empresa.md`, `preferencias.md`,
  `estrategia.md`, `CLAUDE.md`, `GEMINI.md`) que ficaram desatualizados em relação
  ao estado real do workspace, mantendo a memória enxuta e regenerando o resumo.md.
  Use quando o usuário disser "atualiza", "/atualizar", "varre o projeto", ou pedir uma reconciliação geral.
---

# /atualizar — Varredura, Reconciliação e Otimização de Memória

Compara o estado real do workspace com os arquivos de contexto, aplica as mudanças de forma cirúrgica e regenera o `_memoria/resumo.md` para manter a operação sempre ultrarrápida.

## Workflow

### Passo 1 — Levantamento
- Pastas ativas na raiz e em `clientes/`
- Skills ativas em `.agent/skills/` e `.claude/skills/`
- Matrizes e entregas recentes

### Passo 2 — Comparação e Reconciliação Cirúrgica
- **Regra de Isolamento de Clientes:** Detalhes individuais pertencem a `clientes/<Nome>/`. A memória global (`empresa.md`) só guarda diretrizes gerais e padrões de entrega.
- **Em `_memoria/empresa.md`:** modelos e infraestrutura ativos.
- **Em `_memoria/estrategia.md`:** foco atual e prioridades ativas (sem acumular checklists antigos concluídos).
- **Em `CLAUDE.md` e `GEMINI.md`:** regras operacionais enxutas e alinhadas.

### Passo 3 — Aplicação Automática e Regeneração do Resumo
- Aplicar atualizações de forma cirúrgica e direta, sem travar o prompt.
- **Obrigatório:** Regenerar `_memoria/resumo.md` em versão compacta (~1.500 tokens), garantindo que as próximas sessões continuem instantâneas.

### Passo 4 — Resumo Executivo
Mostrar apenas o diff executivo das atualizações aplicadas.
