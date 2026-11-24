#!/usr/bin/env node
/**
 * Responde as conversas de prospecção no WhatsApp, no lugar do Rhenan.
 *
 * ============================== LEIA ISSO ==============================
 *
 * NÃO usa modelo de linguagem. As respostas são determinísticas, montadas a
 * partir de fatos que VOCÊ preencheu em config-conversa.json.
 *
 * Consequência direta: o bot NÃO CONSEGUE inventar prazo, desconto, escopo,
 * garantia nem promessa de resultado. Se a pergunta não estiver coberta por um
 * fato que você escreveu, ele NÃO responde: marca a conversa como pendente e
 * deixa pra você. Ficar sem responder é sempre melhor do que prometer errado.
 *
 * Teto de segurança: padrão 10 conversas por dia. Ao bater o teto, ele para de
 * responder sozinho e passa tudo pra você.
 *
 * Usa a API não-oficial do WhatsApp (Baileys), o que viola os Termos de Serviço
 * da Meta. O risco de restrição do número é de quem usa.
 *
 * Uso:
 *   node conversar.js --conferir     mostra o que faria, sem conectar
 *   node conversar.js --rodar        conecta e responde
 * ======================================================================
 */

require('./sem-ruido');

const fs = require('fs');
const os = require('os');
const path = require('path');

const MARCA = '[teixo-zap]';
const log = (...m) => console.log(MARCA, ...m);
const erro = (...m) => console.error(MARCA, 'ERRO:', ...m);
const alerta = (...m) => console.log(MARCA, '⚠ ', ...m);

const args = process.argv.slice(2);
const conferir = args.includes('--conferir');
const rodar = args.includes('--rodar');

const pastaFila = args.find((a) => !a.startsWith('--') && fs.existsSync(a) && fs.statSync(a).isDirectory());
if (!pastaFila && !conferir) {
  console.error(`
${MARCA} Uso:
  node conversar.js <pasta-da-rodada> --conferir
  node conversar.js <pasta-da-rodada> --rodar

A pasta da rodada é a que tem fila.json e config-conversa.json.
`);
  process.exit(1);
}

const RAIZ = path.resolve(pastaFila || '.');
const ARQ_FILA = path.join(RAIZ, 'fila.json');
const ARQ_CONFIG = path.join(RAIZ, 'config-conversa.json');
const ARQ_ESTADO = path.join(RAIZ, 'estado-conversa.json');
const ARQ_PENDENTES = path.join(RAIZ, 'precisa-de-voce.json');
const ARQ_TRANSCRICOES = path.join(RAIZ, 'transcricoes.json');

const TETO_DIARIO_PADRAO = 10;

// ---------- leitura dos arquivos ----------

function lerJson(caminho, padrao) {
  if (!fs.existsSync(caminho)) return padrao;
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch (e) {
    erro(`${path.basename(caminho)} não é JSON válido:`, e.message);
    process.exit(1);
  }
}

const fila = lerJson(ARQ_FILA, null);
if (!Array.isArray(fila)) {
  erro('Não achei fila.json válido nesta pasta. Rode o enviar.js primeiro.');
  process.exit(1);
}

const config = lerJson(ARQ_CONFIG, null);
if (!config) {
  erro(`Não achei ${path.basename(ARQ_CONFIG)}. Sem ele eu não sei o que é verdade pra dizer.`);
  process.exit(1);
}

const TETO = Number(config.tetoDiario) > 0 ? Number(config.tetoDiario) : TETO_DIARIO_PADRAO;

// campanha só responde a quem está na fila; nunca a desconhecido
const LEADS = new Map();
for (const item of fila) {
  const d = String(item.telefone || '').replace(/\D/g, '');
  if (d) LEADS.set(d, item);
}

// ---------- comparação de números ----------

// O WhatsApp às vezes devolve o nono dígito e às vezes não.
function mesmoNumero(a, b) {
  if (a === b) return true;
  const semNove = (n) => (n.length === 13 && n[4] === '9' ? n.slice(0, 4) + n.slice(5) : n);
  return semNove(a) === semNove(b);
}

function leadDoJid(jid) {
  const d = String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
  if (!d) return null;
  if (LEADS.has(d)) return { telefone: d, lead: LEADS.get(d) };
  for (const [tel, lead] of LEADS) {
    if (mesmoNumero(tel, d)) return { telefone: tel, lead };
  }
  return null;
}

// ---------- normalização de texto ----------

function normalizar(t) {
  return String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- intenções seguras ----------

/**
 * Cada intenção só existe se o fato estiver preenchido no config.
 * Fato vazio = intenção não existe = conversa vai pra você. Nunca inventa.
 */
function intencoes() {
  const lista = [];

  if (config.preco && config.entrega) {
    lista.push({
      nome: 'preco',
      gatilhos: [
        'quanto custa', 'quanto e', 'quanto fica', 'qual o valor', 'qual valor',
        'valor', 'preco', 'precos', 'quanto sai', 'quanto ta', 'custa quanto',
      ],
      responder: () =>
        `Fica ${config.preco}: ${config.entrega}.\n` +
        `${config.frasePreco || 'Consigo começar ainda essa semana. Quer que eu reserve?'}`,
    });
  }

  if (config.endereco) {
    lista.push({
      nome: 'endereco',
      gatilhos: ['onde fica', 'onde voces', 'qual o endereco', 'endereco', 'onde e', 'como chego'],
      responder: () => `${config.endereco}`,
    });
  }

  if (config.horario) {
    lista.push({
      nome: 'horario',
      gatilhos: ['que horas', 'horario', 'abre', 'fecha', 'funciona quando', 'atendem quando', 'aberto'],
      responder: () => `Atendo ${config.horario}`,
    });
  }

  lista.push({
    nome: 'saudacao',
    // palavra inteira: senão "foi" casaria com "oi"
    palavraInteira: true,
    gatilhos: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eae', 'salve', 'tudo bem', 'oi tudo bem'],
    responder: () =>
      `Oi! Aqui é o ${config.remetente || 'Rhenan'}. ` +
      `Tudo bem? Sobre o site de vocês, me diz o que você quer saber que eu te explico.`,
  });

  // resposta à pergunta da M1: "chega mais por indicação ou pelo Google?"
  // só dispara UMA vez por lead, e nunca se o texto tiver "?"
  if (config.respostaQualificacao) {
    lista.push({
      nome: 'qualificacao',
      umaVezPorLead: true,
      gatilhos: [
        'so indicacao', 'so por indicacao', 'mais por indicacao', 'por indicacao',
        'boca a boca', 'so boca a boca', 'só indicação',
        'so google', 'so pelo google', 'mais pelo google', 'pelo google',
        'os dois', 'um pouco dos dois', 'tudo indica', 'os dois um pouco',
      ],
      responder: () => config.respostaQualificacao,
    });
  }

  return lista;
}

const INTENCOES = intencoes();

// perguntas que sempre vão pra você, mesmo que alguma intenção bata
const BLOQUEIOS = [
  'desconto', 'prazo', 'quando entrega', 'garantia', 'contrato', 'nota fiscal',
  'parcela', 'parcelar', 'cartao', 'pix', 'reuniao', 'visita', 'ligar',
  'amostra', 'portfolio', 'quantos clientes', 'resultado', 'vendas',
];

function classificar(texto, telefone, semGravar) {
  const t = normalizar(texto);

  // 1. pergunta sensível sempre vai pra você, antes de qualquer coisa
  for (const b of BLOQUEIOS) {
    if (t.includes(b)) {
      return { acao: 'escalar', motivo: `pergunta sensível: "${b}"` };
    }
  }

  // 2. pergunta com "?" que não seja preço/endereço/horário vai pra você.
  //    Melhor não responder do que responder algo que não cobre a pergunta.
  const ehPergunta = /[?]/.test(texto);
  const ehFatoSeguro = /(quanto custa|quanto fica|qual o valor|qual valor|quanto sai|preco|onde fica|qual o endereco|que horas|horario)/.test(t);
  if (ehPergunta && !ehFatoSeguro) {
    return { acao: 'escalar', motivo: 'pergunta que não é preço, endereço ou horário' };
  }

  for (const it of INTENCOES) {
    if (it.umaVezPorLead && !semGravar && estado.conversas[telefone]?.[it.nome]) continue;

    for (const g of it.gatilhos) {
      const bateu = it.palavraInteira
        ? new RegExp(`(^|\\s)${g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`).test(t)
        : t === g || t.includes(g);
      if (bateu) {
        if (it.umaVezPorLead && !semGravar) {
          estado.conversas[telefone] = estado.conversas[telefone] || {};
          estado.conversas[telefone][it.nome] = true;
          gravarEstado();
        }
        return { acao: 'responder', intencao: it.nome, texto: it.responder() };
      }
    }
  }

  return { acao: 'escalar', motivo: 'não bateu com nenhuma resposta segura' };
}

// ---------- estado ----------

const hoje = () => new Date().toISOString().slice(0, 10);

let estado = lerJson(ARQ_ESTADO, { porDia: {}, conversas: {}, mensagensVistas: [] });
estado.porDia = estado.porDia || {};
estado.conversas = estado.conversas || {};
estado.mensagensVistas = estado.mensagensVistas || [];
estado.porDia[hoje()] = estado.porDia[hoje()] || { leads: [], respostas: 0 };

const gravarEstado = () =>
  fs.writeFileSync(ARQ_ESTADO, JSON.stringify(estado, null, 2), 'utf8');

let pendentes = lerJson(ARQ_PENDENTES, []);
const gravarPendentes = () =>
  fs.writeFileSync(ARQ_PENDENTES, JSON.stringify(pendentes, null, 2), 'utf8');

let transcricoes = lerJson(ARQ_TRANSCRICOES, {});
const gravarTranscricoes = () =>
  fs.writeFileSync(ARQ_TRANSCRICOES, JSON.stringify(transcricoes, null, 2), 'utf8');

function registrarConversa(telefone, entrada) {
  transcricoes[telefone] = transcricoes[telefone] || { nome: null, mensagens: [] };
  transcricoes[telefone].nome = LEADS.get(telefone)?.nome || null;
  transcricoes[telefone].mensagens.push({ quando: new Date().toISOString(), ...entrada });
  if (transcricoes[telefone].mensagens.length > 200) {
    transcricoes[telefone].mensagens = transcricoes[telefone].mensagens.slice(-200);
  }
  gravarTranscricoes();
}

function marcarPendente(telefone, motivo, texto) {
  const existente = pendentes.find((p) => p.telefone === telefone && !p.resolvido);
  if (existente) {
    existente.motivo = motivo;
    existente.ultimoTexto = texto;
    existente.quando = new Date().toISOString();
  } else {
    pendentes.push({
      telefone,
      nome: LEADS.get(telefone)?.nome || null,
      motivo,
      ultimoTexto: texto,
      quando: new Date().toISOString(),
      resolvido: false,
    });
  }
  gravarPendentes();
}

// ---------- revisão antes de conectar ----------

console.log('');
log('Configuração da conversa:');
log(`  Remetente: ${config.remetente || '(vazio)'}`);
log(`  Preço: ${config.preco || '(vazio: não responde preço)'}`);
log(`  Endereço: ${config.endereco || '(vazio: não responde endereço)'}`);
log(`  Horário: ${config.horario || '(vazio: não responde horário)'}`);
log(`  Teto diário: ${TETO} conversas`);
log(`  Intenções ativas: ${INTENCOES.map((i) => i.nome).join(', ')}`);
log(`  Leads na fila: ${LEADS.size}`);
log(`  Conversas hoje: ${estado.porDia[hoje()].leads.length}/${TETO}`);
console.log('');

if (conferir) {
  log('MODO CONFERÊNCIA. Não conectou, não respondeu nada.');
  log('As perguntas que caírem fora das intenções acima vão pra precisa-de-voce.json.');
  console.log('');
  log('Simulação com frases reais de lead:');
  console.log('');
  const AMOSTRAS = [
    ['quanto custa?', 'deve responder preço'],
    ['qual o valor do site', 'deve responder preço'],
    ['só indicação', 'deve responder qualificação'],
    ['os dois um pouco', 'deve responder qualificação'],
    ['boa tarde', 'deve responder saudação'],
    ['tem desconto?', 'deve escalar'],
    ['qual o prazo de entrega?', 'deve escalar'],
    ['vocês dão garantia?', 'deve escalar'],
    ['me manda seu portfólio', 'deve escalar'],
    ['quanto tempo demora pra ficar pronto?', 'deve escalar'],
    ['acho que não é pra mim', 'deve escalar'],
    ['vou pensar e te falo', 'deve escalar'],
    ['manda foto do serviço', 'deve escalar'],
  ];
  const telefoneTeste = '__teste__';
  for (const [frase, esperado] of AMOSTRAS) {
    const d = classificar(frase, telefoneTeste, true);
    const resultado = d.acao === 'responder' ? `responde (${d.intencao})` : `ESCALA: ${d.motivo}`;
    const marca = d.acao === 'responder' ? '→' : '•';
    console.log(`  ${marca} "${frase}"`);
    console.log(`      ${resultado}`);
    console.log(`      esperado: ${esperado}`);
    console.log('');
  }
  log('Nada disso foi enviado nem gravado. Só simulação.');
  process.exit(0);
}

if (!rodar) {
  erro('Passe --rodar pra conectar de verdade, ou --conferir pra só revisar.');
  process.exit(1);
}

// ---------- conexão ----------

const { default: makeWASocketRaw, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } =
  require('@whiskeysockets/baileys');
const makeWASocket = makeWASocketRaw.default || makeWASocketRaw;
const pino = require('pino');

const PASTA_SESSAO = path.join(os.homedir(), '.teixo-zap');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const extrairTexto = (msg) => {
  const m = msg.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  );
};

// não responde a mesma mensagem duas vezes depois de reconectar
function jaVista(id) {
  return estado.mensagensVistas.includes(id);
}
function marcarVista(id) {
  estado.mensagensVistas.push(id);
  if (estado.mensagensVistas.length > 3000) {
    estado.mensagensVistas = estado.mensagensVistas.slice(-3000);
  }
}

async function principal() {
  fs.mkdirSync(PASTA_SESSAO, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(PASTA_SESSAO);

  let versao = [2, 3000, 0];
  try {
    const v = await fetchLatestBaileysVersion();
    if (v && v.version) versao = v.version;
  } catch {
    /* usa padrão */
  }

  const sock = makeWASocket({
    version: versao,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['TeixoOS', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('');
      log('Escaneie o QR com o WhatsApp do celular:');
      log('WhatsApp → Aparelhos conectados → Conectar um aparelho');
      console.log('');
      require('qrcode-terminal').generate(qr, { small: true });
    }
    if (connection === 'open') {
      log('Conectado. Ouvindo as respostas dos leads. Ctrl+C para parar.');
    }
    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode;
      if (codigo === DisconnectReason.loggedOut) {
        erro('Sessão desconectada no celular. Apague', PASTA_SESSAO, 'e pareie de novo.');
        process.exit(1);
      }
      log('Conexão caiu, reconectando...');
      principal().catch((e) => {
        erro(e.message);
        process.exit(1);
      });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;
        if (msg.key.remoteJid === 'status@broadcast') continue;
        if (String(msg.key.remoteJid || '').endsWith('@g.us')) continue;

        const alvo = leadDoJid(msg.key.remoteJid);
        if (!alvo) continue; // desconhecido: ignora por completo

        const id = msg.key.id;
        if (jaVista(id)) continue;
        marcarVista(id);
        gravarEstado();

        const texto = extrairTexto(msg);
        if (!texto.trim()) {
          marcarPendente(alvo.telefone, 'recebeu áudio, imagem ou figurinha', '(mídia)');
          registrarConversa(alvo.telefone, { de: 'lead', texto: '(mídia)' });
          alerta(`${alvo.lead.nome}: mídia recebida, não respondo sozinho.`);
          continue;
        }

        registrarConversa(alvo.telefone, { de: 'lead', texto });
        log(`${alvo.lead.nome}: "${texto}"`);

        // teto diário
        const dia = estado.porDia[hoje()];
        if (!dia.leads.includes(alvo.telefone)) {
          if (dia.leads.length >= TETO) {
            marcarPendente(alvo.telefone, `teto de ${TETO} conversas/dia atingido`, texto);
            alerta(`Teto de ${TETO}/dia atingido. ${alvo.lead.nome} ficou pra você.`);
            continue;
          }
          dia.leads.push(alvo.telefone);
          gravarEstado();
        }

        const decisao = classificar(texto);

        if (decisao.acao === 'escalar') {
          marcarPendente(alvo.telefone, decisao.motivo, texto);
          alerta(`${alvo.lead.nome}: ${decisao.motivo}. Não respondi, está em precisa-de-voce.json.`);
          continue;
        }

        // digita, responde, registra
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
        await espera(1500 + Math.random() * 3000);
        await sock.sendMessage(msg.key.remoteJid, { text: decisao.texto });
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid);

        registrarConversa(alvo.telefone, { de: 'bot', texto: decisao.texto, intencao: decisao.intencao });
        estado.porDia[hoje()].respostas = (estado.porDia[hoje()].respostas || 0) + 1;
        gravarEstado();

        log(`  → respondido (${decisao.intencao})`);
      } catch (e) {
        erro('Falha ao tratar mensagem:', e.message);
      }
    }
  });
}

principal().catch((e) => {
  erro(e.message);
  process.exit(1);
});
