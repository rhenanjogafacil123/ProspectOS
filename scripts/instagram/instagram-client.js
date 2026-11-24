/**
 * Rhenan — Cliente Oficial da API do Instagram
 * Suporte completo para:
 * 1. Instagram API with Instagram Login (graph.instagram.com)
 * 2. Instagram Graph API legado via Facebook Page (graph.facebook.com)
 * 
 * Recursos:
 * - Publicação de Fotos, Carrosséis e Reels/Vídeos
 * - Automação de Direct (DMs)
 * - Resposta a Comentários
 * - Métricas & Insights
 * - Gestão e Renovação de Tokens de Longa Duração (60 dias)
 */

const fs = require('fs');
const path = require('path');

// Carrega .env da raiz do projeto automaticamente se não estiver carregado
function carregarEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  }
}
carregarEnv();

class InstagramClient {
  constructor(options = {}) {
    this.accessToken = options.accessToken || 
      process.env.INSTAGRAM_ACCESS_TOKEN || 
      process.env.META_PAGE_ACCESS_TOKEN;
    
    this.userId = options.userId || 
      process.env.INSTAGRAM_USER_ID || 
      process.env.META_IG_USER_ID;

    this.appSecret = options.appSecret || 
      process.env.INSTAGRAM_APP_SECRET;

    // Detecta se está usando a API direta do Instagram ou a do Facebook
    // Se o token começar com IGA ou se configurado explicitamente, usa graph.instagram.com
    this.isInstagramLogin = options.isInstagramLogin !== undefined 
      ? options.isInstagramLogin 
      : Boolean(process.env.INSTAGRAM_ACCESS_TOKEN || (this.accessToken && this.accessToken.startsWith('IGA')));

    this.apiVersion = options.apiVersion || 'v21.0';
    this.baseUrl = this.isInstagramLogin 
      ? `https://graph.instagram.com/${this.apiVersion}`
      : `https://graph.facebook.com/${this.apiVersion}`;
  }

  validarCredenciais() {
    if (!this.accessToken) {
      throw new Error(
        'Token de acesso não encontrado. Configure INSTAGRAM_ACCESS_TOKEN ou META_PAGE_ACCESS_TOKEN no .env'
      );
    }
    if (!this.userId) {
      throw new Error(
        'ID da conta do Instagram não encontrado. Configure INSTAGRAM_USER_ID ou META_IG_USER_ID no .env'
      );
    }
  }

  async _request(endpoint, { method = 'GET', params = {}, body = null } = {}) {
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const urlObj = new URL(url);

    // Adiciona access_token e parâmetros na query
    urlObj.searchParams.set('access_token', this.accessToken);
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        urlObj.searchParams.set(key, val);
      }
    }

    const options = { method, headers: {} };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(urlObj.toString(), options);
    const data = await response.json();

    if (!response.ok || data.error) {
      const err = data.error || {};
      const mensagem = err.message || `Erro HTTP ${response.status}`;
      const code = err.code || response.status;
      const subcode = err.error_subcode ? ` (subcode: ${err.error_subcode})` : '';
      throw new Error(`[Instagram API Error ${code}${subcode}] ${mensagem}`);
    }

    return data;
  }

  // ==========================================
  // PERFIL & CONTA
  // ==========================================

  async getProfile() {
    if (!this.accessToken) this.validarCredenciais();
    const endpoint = this.isInstagramLogin ? '/me' : `/${this.userId}`;
    const fields = this.isInstagramLogin
      ? 'user_id,username,name,account_type,profile_picture_url'
      : 'id,username,name,profile_picture_url,biography,followers_count';
    return await this._request(endpoint, {
      params: { fields }
    });
  }

  // ==========================================
  // PUBLICAÇÃO DE CONTEÚDO (CONTAINER PIPELINE)
  // ==========================================

  /**
   * Cria um container de mídia no Instagram
   */
  async createContainer({
    imageUrl,
    videoUrl,
    caption,
    isCarouselItem = false,
    mediaType = null,
    children = null
  }) {
    this.validarCredenciais();
    const params = {};

    if (imageUrl) params.image_url = imageUrl;
    if (videoUrl) {
      params.video_url = videoUrl;
      params.media_type = 'REELS';
    }
    if (caption && !isCarouselItem) params.caption = caption;
    if (isCarouselItem) params.is_carousel_item = 'true';
    if (mediaType === 'CAROUSEL') {
      params.media_type = 'CAROUSEL';
      if (Array.isArray(children)) {
        params.children = children.join(',');
      } else {
        params.children = children;
      }
    }

    const res = await this._request(`/${this.userId}/media`, {
      method: 'POST',
      params
    });

    return res.id;
  }

  /**
   * Aguarda processamento de um container (necessário para carrossel e vídeos)
   */
  async waitForContainer(containerId, maxTentativas = 20, delayMs = 2500) {
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      const res = await this._request(`/${containerId}`, {
        params: { fields: 'status_code,status' }
      });

      const statusCode = res.status_code || res.status;
      if (statusCode === 'FINISHED') {
        return true;
      }

      if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
        throw new Error(`Falha no processamento do container ${containerId}: status=${statusCode}`);
      }

      // Espera antes da próxima tentativa
      await new Promise(r => setTimeout(r, delayMs));
    }

    throw new Error(`Timeout: container ${containerId} não terminou processamento em tempo hábil.`);
  }

  /**
   * Publica o container no feed
   */
  async publishContainer(creationId) {
    this.validarCredenciais();
    const res = await this._request(`/${this.userId}/media_publish`, {
      method: 'POST',
      params: { creation_id: creationId }
    });
    return res.id; // Retorna o ID da publicação oficial
  }

  /**
   * Publica uma foto única
   */
  async publishPhoto({ imageUrl, caption }) {
    if (!imageUrl) throw new Error('imageUrl é obrigatória para postar foto');
    console.log(`[Instagram] Criando container para foto: ${imageUrl}`);
    const containerId = await this.createContainer({ imageUrl, caption });
    
    console.log(`[Instagram] Verificando status do container: ${containerId}`);
    await this.waitForContainer(containerId);

    console.log(`[Instagram] Publicando no feed...`);
    const mediaId = await this.publishContainer(containerId);
    console.log(`[Instagram] Publicado com sucesso! ID: ${mediaId}`);
    return { mediaId, containerId };
  }

  /**
   * Publica um carrossel completo (2 a 10 slides)
   */
  async publishCarousel({ imageUrls, caption }) {
    if (!Array.isArray(imageUrls) || imageUrls.length < 2 || imageUrls.length > 10) {
      throw new Error(`Carrossel exige entre 2 e 10 imagens. Fornecidas: ${imageUrls ? imageUrls.length : 0}`);
    }

    console.log(`[Instagram] Criando containers para ${imageUrls.length} slides do carrossel...`);
    const itemIds = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      console.log(`  - Slide ${i + 1}/${imageUrls.length}: ${url}`);
      const itemId = await this.createContainer({ imageUrl: url, isCarouselItem: true });
      itemIds.push(itemId);
    }

    console.log(`[Instagram] Verificando integridade dos slides...`);
    for (const itemId of itemIds) {
      await this.waitForContainer(itemId);
    }

    console.log(`[Instagram] Criando container pai do carrossel...`);
    const carouselContainerId = await this.createContainer({
      mediaType: 'CAROUSEL',
      children: itemIds,
      caption
    });

    console.log(`[Instagram] Verificando status do carrossel: ${carouselContainerId}`);
    await this.waitForContainer(carouselContainerId);

    console.log(`[Instagram] Disparando publicação do carrossel...`);
    const mediaId = await this.publishContainer(carouselContainerId);
    console.log(`[Instagram] Carrossel publicado com sucesso! ID: ${mediaId}`);

    return { mediaId, carouselContainerId, itemIds };
  }

  /**
   * Publica um Reels / Vídeo
   */
  async publishReel({ videoUrl, caption }) {
    if (!videoUrl) throw new Error('videoUrl é obrigatória para postar Reel');
    console.log(`[Instagram] Criando container para Reels: ${videoUrl}`);
    const containerId = await this.createContainer({ videoUrl, caption });

    console.log(`[Instagram] Aguardando transcodificação do vídeo na Meta...`);
    await this.waitForContainer(containerId, 30, 4000);

    console.log(`[Instagram] Publicando Reel...`);
    const mediaId = await this.publishContainer(containerId);
    console.log(`[Instagram] Reel publicado com sucesso! ID: ${mediaId}`);
    return { mediaId, containerId };
  }

  // ==========================================
  // AUTOMAÇÃO DE DMs (MESSAGING API)
  // ==========================================

  /**
   * Envia mensagem direta (DM) para um usuário
   * recipientId: IGSID (Instagram-Scoped ID do usuário)
   */
  async sendDirectMessage({ recipientId, text }) {
    this.validarCredenciais();
    if (!recipientId || !text) {
      throw new Error('recipientId e text são obrigatórios para envio de DM');
    }

    const endpoint = this.isInstagramLogin ? '/me/messages' : `/${this.userId}/messages`;
    return await this._request(endpoint, {
      method: 'POST',
      body: {
        recipient: { id: recipientId },
        message: { text }
      }
    });
  }

  // ==========================================
  // COMENTÁRIOS (MODERAÇÃO & RESPOSTA)
  // ==========================================

  /**
   * Responde publicamente a um comentário de um post
   */
  async replyComment({ commentId, text }) {
    this.validarCredenciais();
    if (!commentId || !text) {
      throw new Error('commentId e text são obrigatórios');
    }

    return await this._request(`/${commentId}/replies`, {
      method: 'POST',
      params: { message: text }
    });
  }

  // ==========================================
  // INSIGHTS & MÉTRICAS
  // ==========================================

  /**
   * Puxa métricas de uma publicação
   */
  async getMediaInsights(mediaId) {
    this.validarCredenciais();
    // Métricas para posts e carrosséis
    const metric = 'impressions,reach,likes,comments,saved,shares';
    try {
      const data = await this._request(`/${mediaId}/insights`, {
        params: { metric }
      });
      return data.data;
    } catch (e) {
      // Se não suportar todas as métricas combinadas, tenta métricas essenciais
      const fallback = await this._request(`/${mediaId}/insights`, {
        params: { metric: 'reach,likes,comments,saved' }
      });
      return fallback.data;
    }
  }

  /**
   * Lista os posts mais recentes da conta
   */
  async getRecentMedia(limit = 10) {
    this.validarCredenciais();
    const endpoint = this.isInstagramLogin ? '/me/media' : `/${this.userId}/media`;
    return await this._request(endpoint, {
      params: {
        fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
        limit
      }
    });
  }

  // ==========================================
  // GESTÃO E RENOVAÇÃO DE TOKENS (60 DIAS)
  // ==========================================

  /**
   * Troca token temporário por token de longa duração (60 dias)
   */
  static async exchangeShortLivedToken({ shortToken, clientSecret }) {
    if (!shortToken || !clientSecret) {
      throw new Error('shortToken e clientSecret são obrigatórios para trocar o token');
    }
    const url = new URL('https://graph.instagram.com/access_token');
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', clientSecret);
    url.searchParams.set('access_token', shortToken);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || 'Falha ao trocar token temporário');
    }
    return data; // { access_token, token_type, expires_in }
  }

  /**
   * Renova token de longa duração antes que expire (ganha mais 60 dias)
   */
  static async refreshLongLivedToken({ longToken }) {
    if (!longToken) throw new Error('longToken é obrigatório');
    const url = new URL('https://graph.instagram.com/refresh_access_token');
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', longToken);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || 'Falha ao renovar token');
    }
    return data; // { access_token, token_type, expires_in }
  }
}

module.exports = { InstagramClient };
