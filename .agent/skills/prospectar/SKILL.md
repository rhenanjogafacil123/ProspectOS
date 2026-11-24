---
name: prospectar
description: Orquestra a esteira completa de prospecção do ProspectOS: busca no Google Maps, enriquecimento de CNPJ/Receita, auditoria de Tráfego e Pixels, checagem de Instagram e Bio, geração de prévias de site e roadmaps em HTML/PDF. Use quando disser "prospectar", "/prospectar", "nova rodada", "buscar empresas".
---

# Prospectar — Esteira Completa do ProspectOS

> **Axioma Central:** Nem sempre todas as informações da empresa estarão no Google Maps. O Maps é apenas o ponto de entrada. O ProspectOS deve investigar ativamente na internet, nas redes e na Receita Federal para mapear o diagnóstico 360º.

## Procedimento
1. **Scraping Inicial no Google Maps:** Coletar as empresas do nicho e cidade.
2. **Varredura Ativa Além do Maps:**
   - **Site & Bio do Instagram:** Se o Maps não tiver site, buscar o Instagram da empresa e checar o link na Bio e na busca web.
   - **Atividade no Instagram:** Checar as datas dos últimos 4 a 5 posts para marcar `Ativo` ou `Inativo`.
   - **Avaliações do GMB:** Contar total de reviews (< 100 é alerta) e verificar quantas avaliações estão sem resposta.
   - **Tráfego no Meta e Google:** Verificar se a empresa já rodou anúncios no passado (pixel/histórico) ou se está ativa.
   - **Validação de CNPJ:** Buscar dados oficiais da Receita Federal (data de fundação, sócios, capital social, excluindo MEI).
3. **Geração de Ativos:**
   - Montar prévias de site rápido (< 1.2s) em `previa/<slug>`.
   - Gerar Roadmaps de 3 páginas em HTML e PDF nativo em `roadmap-<slug>.html` e `.pdf`.
   - Montar roteiros de WhatsApp M1, M2, FU1, FU2 e ligação fria de 60s.
5. **Publicação:** Salvar no Git e realizar deploy na Vercel para links instantâneos.
