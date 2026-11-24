# ProspectOS — Regras de Operação do Assistente (Segundo Cérebro Autônomo)

> Sistema operacional independente de prospecção comercial B2B, inteligência de dados, prévias de alta conversão e geração de Roadmaps/Propostas da Teixo Performance.

---

## 1. Contexto e Gestão de Memória

- **Leitura Inicial Leve:** No início de toda conversa dentro do ProspectOS, ler **somente** `_memoria/resumo.md`. Não listar nem confirmar a leitura.
- **Leitura Sob Demanda:** Abrir `_memoria/empresa.md`, `_memoria/preferencias.md` ou `_memoria/estrategia.md` apenas se a tarefa específica exigir detalhes de planos, quebra de objeções, scripts ou identidade visual.
- **Isolamento de Dados:** O ProspectOS é 100% autônomo e não deve misturar regras globais de outros repositórios. Todas as saídas de prospecção pertencem a `saidas/prospeccao/<rodada>/`.

---

## 2. Regras Operacionais Inegociáveis

1. **Padrão Estrito de 3 Páginas A4 nos Roadmaps:** Todo roadmap gerado em HTML/PDF deve obrigatoriamente caber em **exatas 3 páginas A4**, sem quebras de página aleatórias nem páginas vazias (*zero spillover*). O motor de PDF deve sempre validar o número de páginas geradas.
2. **Identidade Visual Protege (GBR / Teixo):** Cabeçalho preto `#09090b`, listra zebrada de emergência (*hazard stripes*), tipografia *Bebas Neue* para títulos condensados de impacto, simulação realista do Google Maps e tabela comparativa *Sem ou Com o Rhenan*.
3. **Telefone e Contato Padrão:** O contato do especialista é sempre Rhenan: `(21) 97315-2056` (link WhatsApp: `https://wa.me/5521973152056`).
4. **Inteligência de Tráfego & Redes Sociais:**
   - Detectar se o cliente já fez tráfego no passado (pixel/histórico) ou nunca fez.
   - Detectar presença e atividade do Instagram (ativo vs inativo pelas últimas postagens).
   - Verificar link de site na Bio do Instagram caso o site não conste no Google Maps.
   - Auditar total de avaliações do GMB (< 100 é considerado alerta) e contagem de respostas pendentes (ex: 12/38 respondidas).
   - Plaquinha NFC de Balcão entregue presencialmente no Rio de Janeiro e via Sedex em outras regiões.
5. **Execução Síncrona e Rápida:** Comandos de terminal devem rodar de forma síncrona, liberando o prompt imediatamente sem travar a interface.
6. **Zero Screenshots Desnecessários:** Não acionar navegadores headless para prints a menos que solicitado ou necessário para a geração do PDF/print de entrega.
7. **Deploy Automático:** Ao concluir lotes de roadmaps ou melhorias na interface, efetuar commit e deploy na Vercel (`https://prospect-os-fawn.vercel.app`).
