# Guia de Configuração: Instagram API com Instagram Login (Rhenan)

> Passo a passo definitivo para configurar a nova API do Instagram com Instagram Login (sem necessidade de Página no Facebook) e ativar a suíte completa de automações da Rhenan: **publicação de carrosséis**, **atendimento automático no Direct** e **gatilho de comentário para lead (ManyChat nativo)**.

---

## 1. Pré-Requisitos

1. **Conta Profissional no Instagram:**
   * No app do Instagram no celular: *Configurações e atividade* → *Tipo e ferramentas da conta* → Mudar para **Conta Profissional** (Criador de conteúdo ou Comercial).
2. **Conta no Meta for Developers:**
   * Acessar [developers.facebook.com](https://developers.facebook.com/) e entrar com sua conta.

---

## 2. Criando o Aplicativo na Meta

1. No Meta for Developers, clique em **Meus Aplicativos** → **Criar Aplicativo**.
2. **Tipo de Aplicativo:** Selecione **Outro** → Avançar.
3. **Caso de uso / Tipo de negócio:** Selecione **Empresarial** (ou **Consumidor / Criador**).
4. **Nome do Aplicativo:** Ex: `Rhenan Automation` ou `Rhenan`.
5. Coloque seu e-mail de contato e conclua a criação.

---

## 3. Adicionando o Produto "Instagram com Instagram Login"

1. No painel inicial do aplicativo recém-criado, role até **Adicionar produtos ao seu aplicativo**.
2. Localize **Instagram** (com a opção **Instagram Login**) e clique em **Configurar**.
3. No menu lateral esquerdo, em **Instagram** → **Configurações Básicas**:
   * Copie o **ID do Aplicativo do Instagram** (Instagram App ID).
   * Copie a **Chave Secreta do Aplicativo do Instagram** (Instagram App Secret).

---

## 4. Liberando os 4 Escopos Oficiais (Padrão 2025/2026)

Nas permissões do aplicativo, certifique-se de marcar os 4 novos escopos:

1. `instagram_business_basic` — Leitura de perfil e dados da conta.
2. `instagram_business_content_publish` — Publicação automática de fotos, carrosséis e Reels.
3. `instagram_business_manage_messages` — Recebimento e envio de DMs no Direct.
4. `instagram_business_manage_comments` — Leitura e resposta pública a comentários em posts.

*(Enquanto o app estiver em Modo de Desenvolvimento, sua conta de desenvolvedor e as contas adicionadas em "Funções" têm acesso imediato a todas essas permissões sem precisar passar por App Review da Meta).*

---

## 5. Gerando o Token de Longa Duração (60 Dias)

1. No painel do desenvolvedor, vá no **Gerador de Tokens** ou no **Graph API Explorer**.
2. Conecte sua conta do Instagram e selecione os 4 escopos acima.
3. Gere o token temporário (válido por 1 hora).
4. No terminal do Rhenan, rode o comando para converter no token oficial de 60 dias:
   ```bash
   node scripts/instagram/token.js --trocar --token <SEU_TOKEN_TEMPORARIO> --secret <SEU_APP_SECRET>
   ```
5. O script devolverá o `INSTAGRAM_ACCESS_TOKEN` definitivo válido por 60 dias.

---

## 6. Configurando as Variáveis no `.env`

Adicione as variáveis abaixo no arquivo `.env` na raiz do Rhenan:

```env
# ==========================================
# INSTAGRAM API (Instagram Login)
# ==========================================
INSTAGRAM_ACCESS_TOKEN=IGAA... (seu token de 60 dias)
INSTAGRAM_USER_ID=1784... (ID da sua conta do Instagram)
INSTAGRAM_APP_SECRET=seu_app_secret
INSTAGRAM_VERIFY_TOKEN=teixo_instagram_secret_token_2026

# URL pública do site/CDN para disponibilizar as imagens
SITE_URL=https://rhenan.com.br
```

---

## 7. Validando a Conexão

Execute o verificador de integridade:

```bash
node scripts/instagram/token.js --status
```

Se as credenciais estiverem corretas, você verá no terminal:
```text
================ CONEXÃO BEM-SUCEDIDA ================
ID da Conta:      178414...
Username:         @rhenan.ag
Nome:             Rhenan Growth & Operações
Tipo de Conta:    BUSINESS
Modo da API:      Instagram Login (graph.instagram.com)
======================================================
```

---

## 8. Como Usar as Automações no Dia a Dia

### 1. Publicação Automática de Carrosséis & Posts
* **Pela esteira da Rhenan (`/aprovar-post`):**
  Quando você roda `/aprovar-post <slug>`, o pipeline já empurra automaticamente o carrossel aprovado para o feed via:
  ```bash
  node scripts/postar-instagram.js marketing/conteudo/<slug>-<data>
  ```
* **Postar direto via CLI:**
  ```bash
  # Foto única
  node scripts/instagram/postar.js --imagem "https://site.com/foto.png" --legenda "Texto do post"

  # Carrossel direto
  node scripts/instagram/postar.js --slides "url1.png,url2.png,url3.png" --legenda "Legenda"
  ```

---

### 2. Atendimento Automático & Gatilho "QUERO" (ManyChat Nativo)
Configure as palavras-chave e respostas em `scripts/instagram/config-bot.json`.
Inicie o robô:
```bash
node scripts/instagram/bot-auto-dm.js
```
* **O que acontece quando alguém comenta "QUERO" no post:**
  1. O bot responde no post: *"Te mandei todos os detalhes agora no direct! 🚀"*
  2. Dispara uma mensagem instantânea no Direct do seguidor com a proposta, link do cardápio ou WhatsApp.
* **O que acontece quando alguém manda DM pedindo preço/cardápio:**
  1. Responde na hora com a resposta programada e link de fechamento.

---

### 3. Extração de Métricas & Relatório Executivo
Para ver a performance dos últimos posts sem precisar abrir o app:
```bash
node scripts/instagram/metricas.js --limite 10
```
O relatório consolidado é salvo em `saidas/metricas-instagram.json`.

---

### 4. Renovando o Token (A cada 50-55 dias)
O token da Meta dura 60 dias. Para renová-lo por mais 60 dias sem precisar refazer login:
```bash
node scripts/instagram/token.js --renovar
```
