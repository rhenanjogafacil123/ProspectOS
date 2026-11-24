# ProspectOS — Diretrizes de Operação do Assistente

> Sistema operacional independente de prospecção comercial B2B, inteligência de dados e geração de Roadmaps/Propostas da Teixo Performance.

---

## Inicialização Rápida
- Ao iniciar a sessão, ler apenas `_memoria/resumo.md`.
- Contato oficial: Rhenan · `(21) 97315-2056` · Rio de Janeiro / RJ.
- Padrão de Roadmaps: Exatas 3 páginas A4, estilo GBR/Protege, HTML e PDF integrados.

## Comandos Principais
- Gerar Roadmaps (HTML + PDF): `node core/gera-roadmap.js <rodada.json> <pasta-da-rodada>`
- Auditoria de Tráfego: `node core/detector-trafego.js <validados.json> <com-trafego.json>`
- Montar Rodada Completa: `node core/monta-rodada.js <pasta-da-rodada>`
- Deploy Vercel: `vercel --prod --yes`
