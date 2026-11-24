#!/usr/bin/env node
/**
 * Envio 1 a 1 de abordagens de prospecção pelo WhatsApp.
 *
 * Não é disparo em massa: envia uma mensagem por vez, com intervalo aleatório
 * e indicador de "digitando", a partir do SEU número. Roda e encerra.
 *
 * Uso:
 *   node enviar.js fila.json --conferir        (só mostra o que faria, não envia)
 *   node enviar.js fila.json --confirmar      (envia de verdade)
 *
 * A sessão fica em ~/.teixo-zap/ (fora do repositório).
 * O histórico de enviados fica em enviados.json, ao lado da fila.
 *
 * AVISO: usa a API não-oficial do WhatsApp (Baileys), o que viola os Termos de
 * Serviço. O risco de restrição do número é de quem usa. Para volume alto e
 * risco zero, o caminho é a WhatsApp Business Cloud API da Meta.
 */

require('./sem-ruido');

const fs = require('fs');
const os = require('os');
const path = require('path');

const MARCA = '[teixo-zap]';
const log = (...m) => console.log(MARCA, ...m);
const erro = (...m) => console.error(MARCA, 'ERRO:', ...m);
const alertaTeto = (espaco, teto, ja) =>
  console.log(
    MARCA,
    `⚠  Teto diário: ${ja} já foram hoje, cabem mais ${espaco} de ${teto}. Enviando só ${espaco}.`
  );

// ---------- argumentos ----------

const args = process.argv.slice(2);
const arquivoFila = args.find((a) => a.endsWith('.json'));
const conferir = args.includes('--conferir');
const confirmar = args.includes('--confirmar');

function ajuda() {
  console.log(`
${MARCA} Envio 1 a 1 de abordagens pelo WhatsApp

  node enviar.js <fila.json> --conferir     revisa a fila, não envia nada
  node enviar.js <fila.json> --confirmar    envia de verdade

Opções:
  --min-segundos N    intervalo mínimo entre envios (padrão 60)
  --max-segundos N    intervalo máximo entre envios (padrão 180)
  --limite N          envia no máximo N mensagens nesta rodada
  --pular N           pula as N primeiras da fila
  --sem-digitando     não simula o "digitando"

A fila é um JSON com esta forma:
[
  { "id": "01-ceaf", "nome": "CEAF - Estética Flowers",
    "telefone": "5521984643185", "texto": "Oi, aqui é o Rhenan..." }
]
`);
}

if (!arquivoFila || args.includes('--ajuda') || args.includes('-h')) {
  ajuda();
  process.exit(arquivoFila ? 0 : 1);
}

const opcaoNumero = (nome, padrao) => {
  const i = args.indexOf(nome);
  if (i === -1) return padrao;
  const n = Number(args[i + 1]);
  return Number.isFinite(n) ? n : padrao;
};

const MIN_SEG = opcaoNumero('--min-segundos', 60);
const MAX_SEG = opcaoNumero('--max-segundos', 180);
const LIMITE = opcaoNumero('--limite', 0);
const PULAR = opcaoNumero('--pular', 0);
const SIMULAR_DIGITANDO = !args.includes('--sem-digitando');

// Teto diário: 10 a 15 leads/dia é o que mantém a conta saudável.
// Acima disso o risco de restrição cresce rápido, com ou sem espaçamento.
const MAX_DIA = opcaoNumero('--max-dia', 15);

if (MAX_SEG < MIN_SEG) {
  erro('--max-segundos precisa ser maior ou igual a --min-segundos.');
  process.exit(1);
}

// ---------- fila ----------

const caminhoFila = path.resolve(arquivoFila);
if (!fs.existsSync(caminhoFila)) {
  erro(`Não achei a fila em ${caminhoFila}`);
  process.exit(1);
}

let fila;
try {
  fila = JSON.parse(fs.readFileSync(caminhoFila, 'utf8'));
} catch (e) {
  erro('A fila não é um JSON válido:', e.message);
  process.exit(1);
}

if (!Array.isArray(fila) || fila.length === 0) {
  erro('A fila precisa ser uma lista com pelo menos um item.');
  process.exit(1);
}

// ---------- validação (nada sai sem passar por aqui) ----------

const PROBLEMAS = [];

function normalizarTelefone(bruto) {
  const digitos = String(bruto || '').replace(/\D/g, '');
  if (digitos.length < 12 || digitos.length > 15) return null;
  if (!digitos.startsWith('55')) return null;
  return digitos;
}

const validos = [];

fila.forEach((item, indice) => {
  const n = indice + 1;
  const marcas = [];

  const telefone = normalizarTelefone(item.telefone);
  if (!telefone) marcas.push('telefone inválido (precisa ser 55 + DDD + número, só dígitos)');

  const texto = String(item.texto || '').trim();
  if (!texto) marcas.push('texto vazio');
  if (texto.length > 900) marcas.push(`texto muito longo (${texto.length} caracteres)`);
  if (/[—–]/.test(texto)) marcas.push('texto tem travessão (o padrão Teixo não usa)');
  if (/R\$\s*\d/.test(texto) && !item.permitePreco) {
    marcas.push('texto cita preço sem "permitePreco": true');
  }

  if (marcas.length) {
    PROBLEMAS.push({ posicao: n, nome: item.nome || '(sem nome)', marcas });
    return;
  }

  validos.push({ ...item, telefone, texto, posicao: n });
});

if (PROBLEMAS.length) {
  erro('A fila tem itens que não passaram na conferência:');
  PROBLEMAS.forEach((p) => {
    console.error(`  #${p.posicao} ${p.nome}`);
    p.marcas.forEach((m) => console.error(`      - ${m}`));
  });
  console.error(`\n${MARCA} Nada foi enviado. Corrija a fila e rode de novo.`);
  process.exit(1);
}

// ---------- histórico de enviados ----------

const caminhoEnviados = path.join(path.dirname(caminhoFila), 'enviados.json');
let enviados = {};
if (fs.existsSync(caminhoEnviados)) {
  try {
    enviados = JSON.parse(fs.readFileSync(caminhoEnviados, 'utf8'));
  } catch {
    erro('enviados.json corrompido; começando um novo.');
    enviados = {};
  }
}

const gravarEnviados = () => {
  fs.writeFileSync(caminhoEnviados, JSON.stringify(enviados, null, 2), 'utf8');
};

/** Quantos leads já foram abordados hoje, somando todas as filas desta pasta. */
function enviadosHoje() {
  const hoje = new Date().toISOString().slice(0, 10);
  return Object.values(enviados).filter((e) => String(e.enviadoEm || '').startsWith(hoje)).length;
}

let pendentes = validos.filter((item) => {
  const chave = item.id || item.telefone;
  return !enviados[chave];
});

if (PULAR > 0) pendentes = pendentes.slice(PULAR);
if (LIMITE > 0) pendentes = pendentes.slice(0, LIMITE);

// Trava de volume diário, antes de qualquer conexão.
const jaHoje = enviadosHoje();
const espacoHoje = Math.max(0, MAX_DIA - jaHoje);

if (espacoHoje === 0) {
  erro(`Já foram ${jaHoje} leads hoje, e o teto é ${MAX_DIA}. Nada foi enviado.`);
  erro('Volte amanhã, ou use --max-dia N se souber o que está fazendo.');
  process.exit(1);
}

if (pendentes.length > espacoHoje) {
  alertaTeto(espacoHoje, MAX_DIA, jaHoje);
  pendentes = pendentes.slice(0, espacoHoje);
}

// ---------- revisão ----------

console.log('');
log(`Fila: ${path.basename(caminhoFila)}`);
log(`Itens na fila: ${validos.length}  ·  já enviados: ${Object.keys(enviados).length}  ·  nesta rodada: ${pendentes.length}`);
log(`Intervalo entre envios: ${MIN_SEG}s a ${MAX_SEG}s  ·  "digitando": ${SIMULAR_DIGITANDO ? 'sim' : 'não'}`);
log(`Teto de leads por dia: ${MAX_DIA}  ·  nesta rodada já foram ${enviadosHoje()}`);
console.log('');

if (pendentes.length === 0) {
  log('Nada a enviar. Tudo desta fila já consta como enviado.');
  log('Para reenviar, apague a entrada correspondente em enviados.json.');
  process.exit(0);
}

pendentes.forEach((item, i) => {
  console.log(`${'─'.repeat(64)}`);
  console.log(`#${i + 1}  ${item.nome || item.id || '(sem nome)'}  →  +${item.telefone}`);
  console.log('');
  console.log(
    item.texto
      .split('\n')
      .map((l) => '   ' + l)
      .join('\n')
  );
  console.log('');
});

console.log(`${'─'.repeat(64)}`);
console.log('');

if (conferir || !confirmar) {
  log('MODO CONFERÊNCIA. Nada foi enviado.');
  log('Leia os textos acima. Se estiver tudo certo, rode de novo com --confirmar.');
  process.exit(0);
}

// ---------- envio ----------

const { default: makeWASocketRaw, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } =
  require('@whiskeysockets/baileys');
const makeWASocket = makeWASocketRaw.default || makeWASocketRaw;
const pino = require('pino');

const PASTA_SESSAO = path.join(os.homedir(), '.teixo-zap');

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const intervaloAleatorio = () => Math.floor(MIN_SEG * 1000 + Math.random() * (MAX_SEG - MIN_SEG) * 1000);

async function principal() {
  fs.mkdirSync(PASTA_SESSAO, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(PASTA_SESSAO);

  let versao = [2, 3000, 0];
  try {
    const v = await fetchLatestBaileysVersion();
    if (v && v.version) versao = v.version;
  } catch {
    log('Não consegui checar a versão mais recente do WhatsApp; usando a padrão.');
  }

  const sock = makeWASocket({
    version: versao,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['TeixoOS', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
  });

  let conectado = false;
  let encerrado = false;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (atualizacao) => {
    const { connection, lastDisconnect, qr } = atualizacao;

    if (qr) {
      console.log('');
      log('Escaneie o QR code abaixo com o WhatsApp do seu celular:');
      log('WhatsApp  →  Aparelhos conectados  →  Conectar um aparelho');
      console.log('');
      require('qrcode-terminal').generate(qr, { small: true });
    }

    if (connection === 'open') {
      conectado = true;
      log('Conectado.');
    }

    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode;
      if (codigo === DisconnectReason.loggedOut) {
        erro('A sessão foi desconectada no celular. Apague', PASTA_SESSAO, 'e pareie de novo.');
        process.exit(1);
      }
      if (!encerrado) {
        log('A conexão caiu. Rodando de novo...');
        principal().catch((e) => {
          erro(e.message);
          process.exit(1);
        });
      }
    }
  });

  // espera a conexão abrir (pareamento)
  const limite = Date.now() + 5 * 60 * 1000;
  while (!conectado) {
    if (Date.now() > limite) {
      erro('Tempo esgotado esperando o pareamento. Rode de novo.');
      process.exit(1);
    }
    await espera(500);
  }

  // confere quais números existem no WhatsApp antes de qualquer envio
  log('Conferindo os números no WhatsApp...');
  const alvos = [];
  for (const item of pendentes) {
    try {
      const r = await sock.onWhatsApp(item.telefone);
      if (r && r[0] && r[0].exists) {
        alvos.push({ ...item, jid: r[0].jid });
      } else {
        erro(`+${item.telefone} (${item.nome || item.id}) não tem WhatsApp. Pulado.`);
      }
    } catch (e) {
      erro(`Não consegui conferir +${item.telefone}: ${e.message}. Pulado.`);
    }
  }

  if (alvos.length === 0) {
    erro('Nenhum número válido para envio. Nada foi enviado.');
    process.exit(1);
  }

  console.log('');
  log(`Enviando ${alvos.length} mensagem(ns). Não feche esta janela.`);
  console.log('');

  for (let i = 0; i < alvos.length; i++) {
    const item = alvos[i];
    const chave = item.id || item.telefone;
    const rotulo = `${i + 1}/${alvos.length} · ${item.nome || item.id}`;

    try {
      if (SIMULAR_DIGITANDO) {
        await sock.sendPresenceUpdate('composing', item.jid);
        await espera(2000 + Math.random() * 4000);
      }

      await sock.sendMessage(item.jid, { text: item.texto });

      if (SIMULAR_DIGITANDO) {
        await sock.sendPresenceUpdate('paused', item.jid);
      }

      enviados[chave] = {
        nome: item.nome || null,
        telefone: item.telefone,
        enviadoEm: new Date().toISOString(),
        texto: item.texto,
      };
      gravarEnviados();

      log(`OK   ${rotulo}`);
    } catch (e) {
      erro(`FALHOU ${rotulo}: ${e.message}`);
    }

    if (i < alvos.length - 1) {
      const ms = intervaloAleatorio();
      log(`Aguardando ${Math.round(ms / 1000)}s antes da próxima...`);
      await espera(ms);
    }
  }

  encerrado = true;
  console.log('');
  log(`Fim. ${Object.keys(enviados).length} mensagem(ns) no total em enviados.json.`);
  try {
    await sock.end(undefined);
  } catch {
    /* não importa */
  }
  await espera(500);
  process.exit(0);
}

principal().catch((e) => {
  erro(e.message);
  process.exit(1);
});
