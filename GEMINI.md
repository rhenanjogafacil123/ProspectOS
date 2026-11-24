# Rhenan — Regras de Operação do Assistente (Segundo Cérebro Autônomo)

> Sistema operacional independente de prospecção comercial B2B, inteligência de dados, prévias de alta conversão e geração de Roadmaps/Propostas do Rhenan.

---

## 1. Contexto e Gestão de Memória

- **Leitura Inicial Leve:** No início de toda conversa dentro do workspace, ler **somente** `_memoria/resumo.md`. Não listar nem confirmar a leitura.
- **Leitura Sob Demanda:** Abrir `_memoria/empresa.md`, `_memoria/preferencias.md` ou `_memoria/estrategia.md` apenas se a tarefa específica exigir detalhes de planos, quebra de objeções, scripts ou identidade visual.
- **Isolamento de Dados:** O sistema é 100% autônomo e não deve misturar regras globais de outros repositórios. Todas as saídas de prospecção pertencem a `saidas/prospeccao/<rodada>/`.

---

## 2. Regras Operacionais Inegociáveis

1. **Axioma da Varredura Multi-Fonte (Nunca Confiar Apenas no Google Maps):** O Google Maps é apenas o ponto de partida (a semente inicial), nunca a verdade absoluta sobre a empresa. Se o Maps diz "sem site", "sem telefone" ou "sem rede social", é obrigatório investigar além:
   - Buscar o Instagram da empresa na internet e checar se o site ou WhatsApp está na **Bio**.
   - Analisar as últimas 4 a 5 postagens do Instagram para diagnosticar se está ativo ou inativo.
   - Buscar o CNPJ na base pública da Receita Federal pelo nome + cidade para identificar sócios reais, tempo de mercado e capital social.
   - Auditar o histórico de tráfego (Meta Ad Library, tags e pixels legados) para saber se a empresa já rodou tráfego no passado e pausou.
   - Auditar as avaliações do GMB para contar quantas estão sem resposta e se está abaixo do limiar de 100 avaliações.
2. **Padrão Estrito de 3 Páginas A4 nos Roadmaps:** Todo roadmap gerado em HTML/PDF deve obrigatoriamente caber em **exatas 3 páginas A4**, sem quebras de página aleatórias nem páginas vazias (*zero spillover*). O motor de PDF deve sempre validar o número de páginas geradas.
3. **Identidade Visual Protege (GBR / Protege):** Cabeçalho preto `#09090b`, listra zebrada de emergência (*hazard stripes*), tipografia *Bebas Neue* para títulos condensados de impacto, simulação realista do Google Maps e tabela comparativa *Sem ou Com o Rhenan*.
4. **Telefone e Contato Padrão:** O contato do especialista é sempre Rhenan: `(21) 97315-2056` (link WhatsApp: `https://wa.me/5521973152056`).
5. **Inteligência de Tráfego & Redes Sociais:**
   - Detectar se o cliente já fez tráfego no passado (pixel/histórico) ou nunca fez.
   - Detectar presença e atividade do Instagram (ativo vs inativo pelas últimas postagens).
   - Verificar link de site na Bio do Instagram caso o site não conste no Google Maps.
   - Auditar total de avaliações do GMB (< 100 é considerado alerta) e contagem de respostas pendentes (ex: 12/38 respondidas).
   - Plaquinha NFC de Balcão entregue presencialmente no Rio de Janeiro e via Sedex em outras regiões.
6. **Padrão de Fechamento & Propostas (Método One-Pager / 3-Page A4):** Seguir rigorosamente `propostas/PADRAO_PROPOSTAS_E_ROADMAPS.md` (ancoragem, reason why, escassez real 48h-72h, entrada + parcelas, CTA 1-clique WhatsApp e fine print de blindagem).
7. **Isolamento de Clientes Fechados:** Ao fechar um novo cliente, usar `/novo-projeto` para criar pasta isolada em `clientes/<Nome>/` (mantendo `_memoria/` leve e exclusiva para regras globais).
8. **Vigilância Contábil e Fiscal Ativa:** Ao tratar de recebimentos, PIX, notas fiscais ou contratos, atuar preventivamente como `/contador` (combate à confusão patrimonial CPF vs CNPJ, teto MEI, E-Financeira, NFS-e).
9. **Execução Síncrona e Rápida:** Comandos de terminal devem rodar de forma síncrona, liberando o prompt imediatamente sem travar a interface.
10. **Zero Screenshots Desnecessários:** Não acionar navegadores headless para prints a menos que solicitado ou necessário para a geração do PDF/print de entrega.
11. **Deploy Automático:** Ao concluir lotes de roadmaps ou melhorias na interface, efetuar commit e deploy na Vercel (`https://prospect-os-fawn.vercel.app`).

---

## 3. Aprendizado Contínuo e Manutenção do Contexto

- **Aprender com Correções:** Quando o usuário der instrução duradoura ("sempre...", "prefiro assim...", "não faça mais isso..."), perguntar: *"Quer que eu salve isso pra não precisar repetir?"*. Se sim, salvar uma linha clara no arquivo correto (`_memoria/empresa.md`, `_memoria/preferencias.md`, `_memoria/estrategia.md` ou neste `GEMINI.md`).
- **Manter Contexto Atualizado:** Ao concluir tarefa com impacto duradouro, perguntar se atualiza a memória ou rodar `/atualizar` para regenerar `_memoria/resumo.md`.
- **Criação de Novas Skills:** Se concluir tarefa repetível sem skill existente, perguntar: *"Isso pode virar uma skill pra próxima vez. Quer que eu crie?"*.
