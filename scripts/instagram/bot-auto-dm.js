#!/usr/bin/env node
/**
 * Rhenan — Servidor de Automação de Direct & Comentários do Instagram
 * "ManyChat Nativo Rhenan" — Sem taxas mensais.
 * 
 * Funcionalidades:
 * 1. Comentou no Post -> Envia DM imediata para o lead + responde o comentário
 * 2. Mensagem no Direct -> Respostas automáticas por palavras-chave (cardápio, preço, site, WhatsApp)
 * 3. Validação nativa do Webhook da Meta
 * 
 * Uso:
 * node scripts/instagram/bot-auto-dm.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { InstagramClient } = require('./instagram-client');

const client = new InstagramClient();

// Carrega configurações
const configPath = path.join(__dirname, 'config-bot.json');
let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (e) {
  console.error('[Aviso] Falha ao ler config-bot.json, usando padrão.');
}

const PORT = process.env.PORT || config.porta || 4005;
const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || config.webhook_verify_token || 'teixo_instagram_secret_token_2026';

// Cache para evitar responder duas vezes o mesmo comentário / mensagem
const historicoAtendimentos = new Map();

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function processarEventoComentario(change) {
  const value = change.value;
  if (!value) return;

  const commentId = value.id;
  const textoComentario = value.text || '';
  const fromUser = value.from || {};
  const userId = fromUser.id;
  const username = fromUser.username || 'usuário';

  // Ignora se for comentário da própria página
  if (userId === client.userId) return;

  // Evita reprocessamento
  if (historicoAtendimentos.has(`comment_${commentId}`)) return;
  historicoAtendimentos.set(`comment_${commentId}`, Date.now());

  console.log(`\n[Instagram Bot] Novo comentário de @${username} ("${textoComentario}")`);

  const textoNorm = normalizar(textoComentario);

  // Verifica se casou com algum gatilho de comentário
  const gatilhos = config.gatilhos_comentario || [];
  for (const g of gatilhos) {
    const casou = g.palavras_chave.some(kw => textoNorm.includes(normalizar(kw)));
    if (casou) {
      console.log(`  ✓ Gatilho ativado para "${textoComentario}"!`);

      // 1. Responde o comentário no feed se configurado
      if (g.resposta_publica_comentario) {
        try {
          await client.replyComment({
            commentId,
            text: g.resposta_publica_comentario
          });
          console.log(`  ✓ Resposta pública enviada no post.`);
        } catch (e) {
          console.error(`  [Erro] Falha ao responder comentário: ${e.message}`);
        }
      }

      // 2. Dispara a DM privada diretamente para o usuário
      if (g.resposta_privada_direct) {
        try {
          await client.sendDirectMessage({
            recipientId: userId,
            text: g.resposta_privada_direct
          });
          console.log(`  ✓ Direct enviado com sucesso para @${username} (${userId})!`);
        } catch (e) {
          console.error(`  [Erro] Falha ao enviar DM: ${e.message}`);
        }
      }
      break;
    }
  }
}

async function processarEventoMensagem(messaging) {
  const senderId = messaging.sender?.id;
  const message = messaging.message;

  if (!senderId || !message || message.is_echo) return;

  const textoMsg = message.text || '';
  const msgId = message.mid;

  // Evita reprocessamento
  if (historicoAtendimentos.has(`msg_${msgId}`)) return;
  historicoAtendimentos.set(`msg_${msgId}`, Date.now());

  console.log(`\n[Instagram Bot] DM recebida de ${senderId}: "${textoMsg}"`);

  const textoNorm = normalizar(textoMsg);

  // Procura por gatilhos específicos de Direct
  const gatilhos = config.gatilhos_direct || [];
  let respostaEscolhida = null;

  for (const g of gatilhos) {
    const casou = g.palavras_chave.some(kw => textoNorm.includes(normalizar(kw)));
    if (casou) {
      respostaEscolhida = g.resposta;
      break;
    }
  }

  // Se não encontrou gatilho específico, usa resposta padrão
  if (!respostaEscolhida && config.resposta_padrao_direct) {
    respostaEscolhida = config.resposta_padrao_direct;
  }

  if (respostaEscolhida) {
    try {
      await client.sendDirectMessage({
        recipientId: senderId,
        text: respostaEscolhida
      });
      console.log(`  ✓ Resposta automática enviada via Direct para ${senderId}`);
    } catch (e) {
      console.error(`  [Erro] Falha ao responder DM: ${e.message}`);
    }
  }
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  // 1. Validação de Webhook da Meta (GET)
  if (req.method === 'GET' && urlObj.pathname === '/webhook') {
    const mode = urlObj.searchParams.get('hub.mode');
    const token = urlObj.searchParams.get('hub.verify_token');
    const challenge = urlObj.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Instagram Bot] Webhook validado com sucesso pela Meta!');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(challenge);
    } else {
      console.warn('[Instagram Bot] Tentativa de validação com token inválido.');
      res.writeHead(403);
      res.end('Token de verificação inválido');
    }
    return;
  }

  // 2. Recebimento de Eventos (POST)
  if (req.method === 'POST' && urlObj.pathname === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'EVENT_RECEIVED' }));

      try {
        const payload = JSON.parse(body);
        if (payload.object === 'instagram') {
          for (const entry of payload.entry || []) {
            // Eventos de Direct
            if (entry.messaging) {
              for (const m of entry.messaging) {
                await processarEventoMensagem(m);
              }
            }

            // Eventos de Comentários e Menções
            if (entry.changes) {
              for (const change of entry.changes) {
                if (change.field === 'comments') {
                  await processarEventoComentario(change);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[Instagram Bot] Erro ao processar payload do webhook:', err.message);
      }
    });
    return;
  }

  // Rota raiz de status
  if (urlObj.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      app: 'Rhenan Instagram Bot',
      status: 'online',
      porta: PORT
    }));
    return;
  }

  res.writeHead(404);
  res.end('Rota não encontrada');
});

// Limpeza de cache a cada 30 minutos
setInterval(() => {
  const agora = Date.now();
  for (const [chave, tempo] of historicoAtendimentos.entries()) {
    if (agora - tempo > 1000 * 60 * 30) {
      historicoAtendimentos.delete(chave);
    }
  }
}, 1000 * 60 * 15);

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🤖 Rhenan — Servidor de Automação de Instagram`);
  console.log(`Porta: ${PORT}`);
  console.log(`URL do Webhook: http://localhost:${PORT}/webhook`);
  console.log(`Verify Token: ${VERIFY_TOKEN}`);
  console.log(`======================================================\n`);
});
