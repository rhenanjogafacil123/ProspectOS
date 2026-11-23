---
name: prospect-os
version: 1.0.0
description: >
  Sistema Operacional de Prospecção B2B de Alta Conversão. Executa varredura profunda no Google Maps,
  identifica presença ou ausência de tráfego pago (Google Ads e Meta Ads), consulta Receita Federal com
  Quadro de Sócios (QSA), gera sites de prévia com fotos reais e entrega um Cockpit Interativo com modo
  WhatsApp, modo Ligação (Cold Call) e Roadmap de Implantação 360º.
---

# /prospect-os · Máquina de Prospecção B2B & Fechamento de Alto Ticket

O **ProspectOS** é o motor de crescimento comercial para prestadores de serviço, agências e consultorias B2B.

## O que a skill faz automaticamente:

1. **Varredura no Google Maps:** Coleta telefone, nota, avaliações, fotos de fachada e endereço.
2. **Detector de Tráfego:** Audita se a empresa roda anúncios no Google Ads ou Meta Ads (Instagram/Facebook) ou se possui Pixel.
3. **Validação Fiscal & Sócios (QSA):** Identifica tempo de mercado, capital social e os **nomes dos sócios/decisores** na Receita Federal para uma abordagem direta com o dono.
4. **Cavalo de Tróia Visual:** Gera sites de demonstração locais com as fotos reais e avaliações do Google.
5. **Cockpit da Rodada (index.html):** Painel Dark Mode com:
   - **Modo WhatsApp:** M1 com gancho real, M2 com link do Roadmap e scripts de follow-up.
   - **Modo Ligação (Cold Call):** Roteiro falado de 60 segundos com os dados do sócio e gargalos na tela.
   - **CRM Embutido:** Status salvo no navegador (Novo, M1 Enviada, Ligado, Em Conversa, Fechado).
6. **Roadmap de Implantação 360º:** Diagnóstico visual completo do que falta na empresa + Cronograma em 3 Fases + Proposta One-Pager ancorada.

---

## Como acionar:

- *"prospecta [N] [nicho] em [cidade]"* (ex: *prospecta 5 oficinas mecanicas em campinas*)
- *"/prospect-os --nicho 'clínicas odontológicas' --cidade 'Curitiba' --quantidade 10"*

---

## Comandos Operacionais:

Para rodar uma rodada completa via terminal:

```bash
node core/orquestrador.js --nicho "oficinas mecanicas" --cidade "Campinas" --quantidade 5
```

Para rodar passos individuais:
- **Abrir Scraper:** `node core/scraper.js abrir`
- **Buscar no Maps:** `node core/scraper.js buscar --nicho "..." --cidade "..." --saida saidas/prospeccao/.../final.csv`
- **Qualificar:** `node core/qualifica.js <final.csv> <candidatos.json>`
- **Validar Sócios:** `node core/valida.js <candidatos.json> <validados.json> --cidade "..."`
- **Detector de Tráfego:** `node core/detector-trafego.js <validados.json> <com-trafego.json>`
- **Gerar Roadmaps:** `node core/gera-roadmap.js <rodada.json> <pasta-rodada>`
- **Montar Painel:** `node core/monta-painel.js <rodada.json> <pasta-rodada>`
