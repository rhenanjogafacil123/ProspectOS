---
name: gerar-roadmap
description: Gera roadmaps e propostas comerciais em HTML e PDF nativo estrito de 3 páginas A4 no padrão visual Protege (GBR) com simulação do Google Maps, Aluguel Digital, comparativo Sem vs Com Rhenan, planos Básico vs Premium e CTA WhatsApp. Use quando pedir "gerar roadmap", "atualizar roadmaps", "pdf do roadmap", "/gerar-roadmap".
---

# Gerar Roadmap — Padrão Protege GBR (3 Páginas A4)

## Procedimento
1. Executar o gerador com a rodada e pasta de saída:
   ```bash
   node core/gera-roadmap.js saidas/prospeccao/<rodada>/rodada.json saidas/prospeccao/<rodada>
   ```
2. O script compila o HTML com a folha `.folha-a4` calibrada e dispara o headless Chrome para gerar simultaneamente o arquivo `.pdf` de exatas 3 páginas A4.
3. Verificar a integridade dos arquivos gerados em HTML e PDF.
4. Disponibilizar os links locais e na Vercel para o usuário enviar diretamente pelo WhatsApp.
