---
name: carrossel
description: >
  Cria carrosséis e posts visuais pra Instagram com a identidade visual da marca no Padrão Estúdio (Nível Absurdo).
  Gera HTML estilizado + renderiza em PNG 1080x1350 via Playwright, com legenda pronta no final.
  Garante 50% texto / 50% não-verbal, zero vazio preto, hero visual monumental e zero @arroba nos slides.
  Use quando o usuário pedir "carrossel", "post", "conteúdo pro instagram", "criar imagem",
  "gerar foto", "post educativo", ou /carrossel.
---

# /carrossel — Carrossel e Posts Visuais (Padrão Estúdio / Nível Absurdo)

Skill central de criação de conteúdo visual. Pega um tema → entrega HTML estilizado no padrão estúdio cinematográfico + PNGs 1080x1350 renderizados + legenda no padrão da marca.

## Dependências

- **Identidade visual:** `identidade/design-guide.md` — LER ANTES de criar qualquer visual
- **Contexto do negócio:** `_memoria/empresa.md`
- **Tom de voz & regras:** `_memoria/preferencias.md`
- **Playwright / Bun:** pra renderizar HTML em PNG (`bun render.js` com Playwright)
- **OpenAI API / Subagente image-generator:** pra gerar fotos realistas de alta densidade
- **Outputs vão em:** `marketing/conteudo/carrossel - <tema> - versao estudio/` (zero underline)

---

## As 5 Leis Inegociáveis do Padrão Estúdio ("Nível Absurdo")

1. **ZERO Vazio Preto ("Zero VAZIO"):**
   - É expressamente proibido deixar cards ou blocos pequenos flutuando com vácuos pretos em cima ou embaixo. A tela de 1080x1350 precisa ser 100% preenchida e conectada do topo ao rodapé.

2. **A Regra dos 50% Texto / 50% Não-Verbal:**
   - Metade da força do slide vem da mensagem monumental afiada.
   - A outra metade vem de objetos e cenas reais de estúdio: smartphones detalhados com interfaces operacionais ativas, comandas térmicas, post-its com fita adesiva, pranchetas kraft com binder clips, tesouras cortando linhas de calote e fotos de alta densidade (cozinha a mil, forno a lenha, chapa fumegando).

3. **1 Tópico por Slide (Tematização Total):**
   - Proibido listar tópicos como itens de PowerPoint. Cada slide aprofunda **um único problema ou conceito**, permitindo que a tela inteira seja cenograficamente tematizada em torno dele.

4. **REGRA ZERO ARROBA (`@`):**
   - **Expressamente proibido colocar arroba (`@rhenan.ai` ou qualquer outro) nos slides.** O Instagram da agência pode mudar e o visual precisa ser limpo e definitivo.

5. **Fontes Encorpadas e Legíveis no Mobile:**
   - Proibido usar fontes de 14px a 18px em textos explicativos ou cards. O empresário lê no feed do celular sem dar zoom.

---

## Estrutura Vertical de Cada Slide (Proporção 20% / 65% / 15%)

```
+-------------------------------------------------------------+  [ 01/06 ] Top-right
| TOP (20%): Título Monumental ANTON (90px-110px)             |
|            + Caixa Neon Inclinada (#C6F135 ou #EF4444)      |
|            + Subtítulo Manuscrito CAVEAT (34px-40px)        |
+-------------------------------------------------------------+
|                                                             |
| CENTER (60% a 65%): HERO VISUAL GIGANTE (~700px de altura)  |
|                     - Smartphone com tela ativa/alerta      |
|                     - Linha de corte pontilhada + Tesoura   |
|                     - Post-it amarelo gigante com fita      |
|                     - Prancheta kraft com binder clip       |
|                     - Foto real de cozinha / forno a vapor  |
|                                                             |
+-------------------------------------------------------------+
| BOTTOM (15%): Banner Escuro com Borda Translúcida           |
|               - Título do Takeaway em Anton (30px-34px)     |
|               - Conclusão em Plus Jakarta Sans (22px-25px)  |
+-------------------------------------------------------------+
| FOOTER: [Salvar para revisar]          [É aqui que a Rhenan entra. →]|
+-------------------------------------------------------------+
```

---

## Tipografia Oficial

- **Títulos de Choque:** `Anton` (Google Fonts), **90px a 110px**, line-height `0.92` a `0.98`, uppercase, letter-spacing `0.5px`.
- **Subtítulos Manuscritos:** `Caveat` (Google Fonts), **34px a 40px**, weight 600/700, cursive, tom humano e tático.
- **Corpo e Cards:** `Plus Jakarta Sans`, **22px a 26px**, line-height `1.45` a `1.50`, weight 500 a 700.
- **Dígitos Gigantes / Valores:** `Anton`, **90px a 110px** (ex: `R$ 148,90`, `1, 2, 3 OU 4?`).

---

## Cores Oficiais do Feed (Clean Estilo iPhone)

- **Fundo Base:** `#F8FAFC` a `#FFFFFF` (off-white / cinza ultra claro Apple, acabamento estúdio nítido).
- **Tipografia Principal:** `#0F172A` / `#1E293B` (preto azulado nítido para títulos e leitura).
- **Cards e Notificações:** Fundo branco puro `#FFFFFF` com bordas sutis `1px solid #E2E8F0` e sombra difusa Apple (`box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06)`).
- **Verde Neon Rhenan:** `#C6F135` (pílulas de destaque e grifos contrastantes).
- **Vermelho Alerta iOS:** Fundo `#FEE2E2` com texto e borda `#DC2626`.
- **Amarelo Post-it Táctil:** `#FEF08A` (com fita adesiva translúcida e texto manuscrito em `Caveat` escuro).
- **Folha Kraft / Prancheta Clean:** `#F1EFEA` com binder clip metálico escuro.

---

## Rodapé Padrão Oficial

Todos os slides terminam com uma barra minimalista elegante sobre linha fina translúcida (`border-top: 1.5px solid rgba(255, 255, 255, 0.18)`):
- **Canto Esquerdo:** Ícone SVG de bookmark + *"Salve para revisar com sua equipe."* (ou *"Salve para consultar antes de abrir."*).
- **Canto Direito:** *"É aqui que a "* + `<span style="color: #C6F135; font-weight: 900;">Rhenan</span>` + *" entra. →"*.
- **ZERO @arroba:** Nunca colocar `@rhenan.ai`, `@usuario` ou qualquer link de rede social.

---

## Workflow de Produção

### Passo 1 — Roteiro Estratégico (Texto)
1. Definir a Dor Operacional e o Ângulo do post.
2. Dividir em 5 a 7 slides, garantindo **1 tema/tópico por slide**.
3. Rascunhar títulos monumentais (máx 6-8 palavras) com grifo de palavra-chave.
4. Escrever o takeaway de cada slide (parágrafos curtos de 2 a 3 linhas em 22px-25px).
5. **CHECKPOINT:** Validar texto antes de abrir o HTML.

### Passo 2 — Hero Visual & Cenografia Não-Verbal
1. Definir o Hero Visual (~700px de altura) de cada slide.
2. Se exigir fotografia de comida/cozinha: gerar frame de alta densidade ou usar fotografias reais de alta resolução da pasta de clientes/referências.
3. Se exigir interface: estilizar a tela do smartphone com status bar realista, dados concretos e alertas visuais.
4. Se exigir checklist: utilizar prancheta kraft com binder clip e checkboxes limpos.

### Passo 3 — Montagem do HTML Único
1. Criar `carrossel.html` com dimensões `1080 x 1350 px` por `.slide`.
2. Incluir Google Fonts: `Anton`, `Caveat`, `Plus Jakarta Sans`, `Space Mono`.
3. Aplicar a proporção 20% Topo / 65% Hero / 15% Base + Rodapé minimalista.
4. Testar o preenchimento total vertical para garantir **zero espaço vazio**.

### Passo 4 — Renderização de Alta Densidade (Playwright)
1. Criar `render.js` usando Playwright (canal msedge ou chromium).
2. Renderizar cada slide em `instagram/slide-01.png` até `slide-NN.png`.
3. Validar visualmente as imagens geradas usando `view_file` para certificar que nada vazou ou ficou desalinhado.

### Passo 5 — Legenda Automática
1. Gerar `legenda.md` na mesma pasta do carrossel pronta para copiar e colar no Instagram:
   - Hook nos primeiros 3 segundos.
   - Contexto da dor do sábado à noite.
   - Chamada para salvar na bandeirinha.
   - Assinatura Rhenan e hashtags táticas.

---

## Regras de Nomenclatura e Limpeza

- Zero underline (`_`): usar exclusivamente hífens e espaços em pastas e arquivos.
- Exemplo: `marketing/conteudo/carrossel - o golpe do pix - versao estudio/`.
- Limpar rascunhos e manter apenas a versão final renderizada.
