# Rhenan — Sistema Operacional de Prospecção B2B de Alta Conversão

> Máquina autônoma de prospecção, auditoria de tráfego, abordagem multicanal e fechamento de novos clientes com Roadmaps de Implantação 360º.

---

## O que o sistema faz na prática:

1. **Varredura Profunda no Google Maps:** Coleta telefone, nota, avaliações, fotos de fachada e endereço sem depender de APIs pagas do Google.
2. **Detector de Tráfego Pago:** Identifica se a empresa já investe ou não em **Google Ads** ou **Meta Ads** (Instagram/Facebook) e se possui Pixel ativo.
3. **Validação Fiscal & Sócios (QSA):** Identifica tempo de mercado, capital social e os **nomes dos sócios/decisores** na Receita Federal para uma abordagem direta com o dono.
4. **Cavalo de Tróia Visual:** Gera sites de demonstração locais com fotos reais e avaliações do Google.
5. **Cockpit da Rodada (`index.html`):** Painel Dark Mode com:
   - **Modo WhatsApp:** M1 com gancho real, M2 com link do Roadmap e scripts de follow-up.
   - **Modo Ligação (Cold Call):** Roteiro falado de 60 segundos com os dados do sócio e gargalos na tela.
   - **CRM Embutido:** Status salvo no navegador (Novo, M1 Enviada, Ligado, Em Conversa, Fechado).
6. **Roadmap de Implantação 360º:** Diagnóstico visual completo do que falta na empresa + Cronograma em 3 Fases + Proposta One-Pager ancorada.

---

## Estrutura de Arquivos

```text
Rhenan/
├── core/
│   ├── scraper.js           # Engine de extração do Google Maps
│   ├── qualifica.js         # Funil de nota, avaliações, celular e site
│   ├── valida.js            # Consulta Receita Federal & Sócios (QSA)
│   ├── detector-trafego.js  # Auditoria de Google Ads e Meta Ads
│   ├── gera-sites.js        # Geração de sites de prévia com fotos reais
│   ├── gera-roadmap.js      # Geração dos Roadmaps de Implantação 360º
│   ├── monta-painel.js      # Geração do Cockpit HTML da Rodada
│   └── orquestrador.js      # Pipeline mestre ponta a ponta
├── templates/
│   ├── sites/               # Templates de prévias responsivas
│   ├── painel/              # Template do Cockpit da Rodada
│   └── roadmap/             # Template do Roadmap Visual & Proposta
├── skills/
│   └── prospect-os/         # Skill para Claude Code / Antigravity
├── _memoria/                # Configurações de remetente, preços e critérios
└── saidas/                  # Onde caem as rodadas geradas
    └── prospeccao/
```

---

## Como Rodar uma Rodada Completa

No terminal dentro de `c:\Users\rhena\Downloads\Rhenan`:

```bash
node core/orquestrador.js --nicho "oficinas mecanicas" --cidade "Campinas" --quantidade 5
```

Ao finalizar, ele abre o Cockpit Interativo com o site de demonstração de cada empresa, os dados dos sócios e os Roadmaps de Implantação prontos para envio.
