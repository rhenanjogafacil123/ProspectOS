---
name: prospectar
description: Orquestra a esteira completa de prospecção do ProspectOS: busca no Google Maps, enriquecimento de CNPJ/Receita, auditoria de Tráfego e Pixels, checagem de Instagram e Bio, geração de prévias de site e roadmaps em HTML/PDF. Use quando disser "prospectar", "/prospectar", "nova rodada", "buscar empresas".
---

# Prospectar — Esteira Completa do ProspectOS

## Procedimento
1. **Scraping Inicial:** Coletar empresas no nicho e cidade pelo Scraper Google Maps.
2. **Validação & CNPJ:** Checar situação cadastral ativa, tempo de mercado e porte (excluindo MEI).
3. **Auditoria de Presença Digital:**
   - Tráfego no Google Ads e Meta Ads (ativo, já fez no passado, nunca fez).
   - Presença de site no Maps, busca na web ou Bio do Instagram.
   - Atividade do Instagram (ativo vs inativo pelas datas dos últimos posts).
   - Avaliações do Google (alerta se < 100) e contagem de avaliações sem resposta.
4. **Geração de Ativos:**
   - Montar prévias de site rápido (< 1.2s) em `previa/<slug>`.
   - Gerar Roadmaps de 3 páginas em HTML e PDF nativo em `roadmap-<slug>.html` e `.pdf`.
   - Montar roteiros de WhatsApp M1, M2, FU1, FU2 e ligação fria de 60s.
5. **Publicação:** Salvar no Git e realizar deploy na Vercel para links instantâneos.
