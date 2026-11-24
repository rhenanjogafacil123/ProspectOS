#!/usr/bin/env node
/**
 * Rhenan — Gerenciador de Tokens da API do Instagram
 * Suporta:
 * 1. Testar status e permissões do token atual
 * 2. Trocar token temporário por Token de Longa Duração (60 dias)
 * 3. Renovar Token de Longa Duração (ganhar mais 60 dias)
 * 
 * Uso:
 * - node scripts/instagram/token.js --status
 * - node scripts/instagram/token.js --trocar --token <short_token> [--secret <app_secret>]
 * - node scripts/instagram/token.js --renovar
 */

const fs = require('fs');
const path = require('path');
const { InstagramClient } = require('./instagram-client');

const args = process.argv.slice(2);
function getArg(nome) {
  const idx = args.indexOf('--' + nome);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}
const hasFlag = nome => args.includes('--' + nome);

async function main() {
  const client = new InstagramClient();

  // 1. STATUS
  if (hasFlag('status') || args.length === 0) {
    console.log(`[Rhenan Token Manager] Validando credenciais do .env...`);
    try {
      client.validarCredenciais();
      const profile = await client.getProfile();
      console.log(`\n================ CONEXÃO BEM-SUCEDIDA ================`);
      console.log(`ID da Conta:      ${profile.user_id || profile.id}`);
      console.log(`Username:         @${profile.username || 'n/a'}`);
      console.log(`Nome:             ${profile.name || 'n/a'}`);
      console.log(`Tipo de Conta:    ${profile.account_type || 'PROFESSIONAL'}`);
      console.log(`Modo da API:      ${client.isInstagramLogin ? 'Instagram Login (graph.instagram.com)' : 'Facebook Graph API (legado)'}`);
      console.log(`======================================================\n`);
    } catch (err) {
      console.error(`\n[Falha de Autenticação] ${err.message}`);
      console.log(`\nVerifique seu arquivo .env. Consulte o guia: marketing/automacao-meta-setup.md\n`);
      process.exit(1);
    }
    return;
  }

  // 2. TROCAR TOKEN TEMPORÁRIO (SHORT-LIVED -> LONG-LIVED 60 DIAS)
  if (hasFlag('trocar')) {
    const shortToken = getArg('token');
    const secret = getArg('secret') || process.env.INSTAGRAM_APP_SECRET;

    if (!shortToken) {
      console.error(`[Erro] Forneça o token temporário via --token <token>`);
      process.exit(1);
    }
    if (!secret) {
      console.error(`[Erro] INSTAGRAM_APP_SECRET não encontrado no .env nem informado via --secret`);
      process.exit(1);
    }

    console.log(`[Rhenan Token Manager] Trocando token temporário por token de 60 dias...`);
    try {
      const res = await InstagramClient.exchangeShortLivedToken({
        shortToken,
        clientSecret: secret
      });

      console.log(`\n✓ Token de Longa Duração gerado com sucesso!`);
      console.log(`Validade: ~${Math.round((res.expires_in || 5184000) / 86400)} dias (60 dias)`);
      console.log(`\nAdicione/atualize no seu .env:`);
      console.log(`INSTAGRAM_ACCESS_TOKEN=${res.access_token}\n`);
    } catch (e) {
      console.error(`[Erro ao trocar token] ${e.message}`);
      process.exit(1);
    }
    return;
  }

  // 3. RENOVAR TOKEN DE 60 DIAS
  if (hasFlag('renovar')) {
    const currentToken = client.accessToken;
    if (!currentToken) {
      console.error(`[Erro] Nenhum token configurado no .env para renovar.`);
      process.exit(1);
    }

    console.log(`[Rhenan Token Manager] Renovando token de longa duração...`);
    try {
      const res = await InstagramClient.refreshLongLivedToken({ longToken: currentToken });
      console.log(`\n✓ Token renovado por mais 60 dias!`);
      console.log(`\nAtualize seu .env caso o token tenha mudado:`);
      console.log(`INSTAGRAM_ACCESS_TOKEN=${res.access_token}\n`);
    } catch (e) {
      console.error(`[Erro ao renovar token] ${e.message}`);
      process.exit(1);
    }
    return;
  }
}

main().catch(err => {
  console.error('[Erro]', err.message);
  process.exit(1);
});
