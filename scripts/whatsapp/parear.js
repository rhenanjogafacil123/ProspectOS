#!/usr/bin/env node
/**
 * Pareia o WhatsApp com esta máquina, por QR code, e encerra.
 *
 * Não envia nada e não responde nada. Só abre a sessão, salva em ~/.teixo-zap/
 * e sai. Depois disso, enviar.js e conversar.js reaproveitam a sessão.
 *
 * Uso:
 *   node parear.js             pareia (ou confirma que a sessão já está ativa)
 *   node parear.js --limpar    apaga a sessão e começa do zero
 */

require('./sem-ruido');

const fs = require('fs');
const os = require('os');
const path = require('path');

const MARCA = '[teixo-zap]';
const log = (...m) => console.log(MARCA, ...m);
const erro = (...m) => console.error(MARCA, 'ERRO:', ...m);

const PASTA_SESSAO = path.join(os.homedir(), '.teixo-zap');
const args = process.argv.slice(2);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

if (args.includes('--limpar')) {
  if (fs.existsSync(PASTA_SESSAO)) {
    fs.rmSync(PASTA_SESSAO, { recursive: true, force: true });
    log('Sessão apagada:', PASTA_SESSAO);
  } else {
    log('Não havia sessão para apagar.');
  }
  log('Rode "node parear.js" para parear de novo.');
  process.exit(0);
}

const {
  default: makeWASocketRaw,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const makeWASocket = makeWASocketRaw.default || makeWASocketRaw;
const pino = require('pino');

async function principal() {
  fs.mkdirSync(PASTA_SESSAO, { recursive: true });

  const jaExiste = fs.existsSync(path.join(PASTA_SESSAO, 'creds.json'));
  if (jaExiste) {
    log('Já existe uma sessão salva. Testando se ainda está válida...');
  } else {
    log('Nenhuma sessão encontrada. Vou gerar o QR code.');
  }

  const { state, saveCreds } = await useMultiFileAuthState(PASTA_SESSAO);

  let versao = [2, 3000, 0];
  try {
    const v = await fetchLatestBaileysVersion();
    if (v && v.version) versao = v.version;
  } catch {
    log('Sem checar a versão mais recente; usando a padrão.');
  }

  const sock = makeWASocket({
    version: versao,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['TeixoOS', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
  });

  let encerrado = false;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('');
      log('ESCANEIE O QR CODE ABAIXO');
      log('No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho');
      console.log('');
      require('qrcode-terminal').generate(qr, { small: true });
      console.log('');
      log('O QR expira em cerca de 20 segundos. Se não der tempo, outro aparece sozinho.');
    }

    if (connection === 'open') {
      const usuario = sock.user || {};
      const numero = String(usuario.id || '').split(':')[0].split('@')[0];
      const nome = usuario.name || usuario.verifiedName || '(sem nome)';

      console.log('');
      log('PAREDADO COM SUCESSO');
      log(`  Número: +${numero || '?'}`);
      log(`  Nome:   ${nome}`);
      log(`  Sessão: ${PASTA_SESSAO}`);
      console.log('');
      log('Nada foi enviado. Este script só abriu a sessão.');
      log('Agora você pode rodar:');
      log('  node enviar.js <fila.json> --conferir');
      log('  node conversar.js <pasta-da-rodada> --conferir');
      console.log('');

      encerrado = true;
      await espera(1000);
      try {
        sock.end(undefined);
      } catch {
        /* ok */
      }
      await espera(500);
      process.exit(0);
    }

    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode;
      if (codigo === DisconnectReason.loggedOut) {
        erro('A sessão foi encerrada no celular. Rode com --limpar e pareie de novo.');
        process.exit(1);
      }
      if (!encerrado) {
        log('Conexão caiu. Tentando de novo...');
        principal().catch((e) => {
          erro(e.message);
          process.exit(1);
        });
      }
    }
  });
}

// prazo total para o pareamento
setTimeout(() => {
  erro('Tempo esgotado (15 minutos). Rode de novo quando estiver com o celular na mão.');
  process.exit(1);
}, 15 * 60 * 1000);

principal().catch((e) => {
  erro(e.message);
  process.exit(1);
});
