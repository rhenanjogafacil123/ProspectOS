/**
 * WhatsApp Web controlado por navegador (Playwright + Edge).
 *
 * Abre o WhatsApp Web com a sessão salva, e permite:
 *   --logar        pareia pela primeira vez (mostra o QR na tela)
 *   --ler          lista as conversas e as mensagens recentes
 *   --abrir "Nome" abre a conversa de um contato e mostra o histórico
 *   --enviar "Nome" "texto"   envia uma mensagem
 *
 * A sessão fica em ~/.teixo-zap-web/ (fora do repo).
 *
 * Uso:
 *   node web.js --logar
 *   node web.js --ler
 *   node web.js --abrir "CEAF"
 *   node web.js --enviar "CEAF" "texto da mensagem"
 *
 * ATENÇÃO: automatizar o WhatsApp Web não é oficialmente permitido pela Meta.
 * O risco de restrição do número é de quem usa. Prefira volume baixo.
 */

const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PERFIL = path.join(os.homedir(), '.teixo-zap-web');
const MARCA = '[teixo-web]';
const log = (...m) => console.log(MARCA, ...m);
const erro = (...m) => console.error(MARCA, 'ERRO:', ...m);

const args = process.argv.slice(2);
const modo = args.find((a) => a.startsWith('--'))?.replace('--', '');
const resto = args.filter((a) => !a.startsWith('--'));

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrirNavegador({ headless = false } = {}) {
  fs.mkdirSync(PERFIL, { recursive: true });
  const contexto = await chromium.launchPersistentContext(PERFIL, {
    channel: 'msedge',
    headless,
    viewport: { width: 1360, height: 950 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = contexto.pages()[0] || (await contexto.newPage());
  await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { contexto, page };
}

/** Espera o app carregar e diz se está logado ou pedindo QR. */
async function estado(page, tentativas = 20) {
  for (let i = 0; i < tentativas; i++) {
    const qr = await page.locator('canvas[aria-label*="Scan"], canvas').count();
    if (qr > 0) return 'qr';

    const app = await page.locator('#pane-side').count();
    if (app > 0) return 'logado';

    await espera(1000);
  }
  return 'desconhecido';
}

/** Lê a lista de conversas visíveis na lateral. */
async function listarConversas(page) {
  const itens = page.locator('#pane-side div[role="listitem"]');
  const total = await itens.count();
  const saida = [];

  for (let i = 0; i < Math.min(total, 25); i++) {
    const item = itens.nth(i);
    const texto = (await item.innerText().catch(() => '')) || '';
    const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean);
    if (linhas.length === 0) continue;
    saida.push({
      nome: linhas[0],
      detalhe: linhas.slice(1).join(' | '),
    });
  }
  return saida;
}

/** Abre a conversa cujo nome contenha o termo. */
async function abrirConversa(page, termo) {
  const busca = page.locator('#side div[contenteditable="true"]').first();
  await busca.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(termo, { delay: 60 });
  await espera(2500);

  const itens = page.locator('#pane-side div[role="listitem"]');
  if ((await itens.count()) === 0) return false;

  await itens.first().click();
  await espera(2000);
  return true;
}

/** Lê as mensagens da conversa aberta. */
async function lerMensagens(page, limite = 20) {
  const bolhas = page.locator('div.message-in, div.message-out');
  const total = await bolhas.count();
  const inicio = Math.max(0, total - limite);
  const saida = [];

  for (let i = inicio; i < total; i++) {
    const b = bolhas.nth(i);
    const classe = (await b.getAttribute('class')) || '';
    const de = classe.includes('message-out') ? 'EU' : 'LEAD';
    const texto = (await b.innerText().catch(() => '')) || '';
    const limpo = texto.split('\n').filter((l) => l.trim()).join(' ').trim();
    if (!limpo) continue;
    saida.push({ de, texto: limpo });
  }
  return saida;
}

async function main() {
  if (!modo) {
    console.log(`
${MARCA} Uso:
  node web.js --logar                 pareia pela primeira vez (mostra o QR)
  node web.js --ler                   lista conversas e últimas mensagens
  node web.js --abrir "Nome"          abre a conversa e mostra o histórico
  node web.js --enviar "Nome" "txt"   envia uma mensagem
`);
    process.exit(1);
  }

  const { contexto, page } = await abrirNavegador({ headless: modo === 'ler' });

  const st = await estado(page);
  log('estado:', st);

  if (st === 'qr') {
    if (modo === 'logar') {
      log('Escaneie o QR agora: WhatsApp → Aparelhos conectados → Conectar um aparelho');
      log('Aguardando até 5 minutos...');
      for (let i = 0; i < 300; i++) {
        await espera(1000);
        const agora = await estado(page, 1);
        if (agora === 'logado') {
          log('LOGADO. Sessão salva em', PERFIL);
          await espera(3000);
          await contexto.close();
          return;
        }
      }
      erro('Tempo esgotado esperando o QR.');
      await contexto.close();
      process.exit(1);
    }
    erro('Não está logado. Rode primeiro: node web.js --logar');
    await contexto.close();
    process.exit(1);
  }

  if (st !== 'logado') {
    erro('Não consegui identificar o estado da página.');
    await contexto.close();
    process.exit(1);
  }

  if (modo === 'ler') {
    const conversas = await listarConversas(page);
    console.log('');
    log(`${conversas.length} conversas na tela:`);
    conversas.forEach((c, i) => console.log(`  ${i + 1}. ${c.nome}\n     ${c.detalhe}`));
  }

  if (modo === 'abrir' || modo === 'enviar') {
    const termo = resto[0];
    if (!termo) {
      erro('Falta o nome do contato.');
      await contexto.close();
      process.exit(1);
    }

    const achou = await abrirConversa(page, termo);
    if (!achou) {
      erro(`Nenhuma conversa encontrada para "${termo}".`);
      await contexto.close();
      process.exit(1);
    }

    log(`Conversa aberta: ${termo}`);
    const msgs = await lerMensagens(page, 20);
    console.log('');
    msgs.forEach((m) => console.log(`  [${m.de}] ${m.texto}`));

    if (modo === 'enviar') {
      const texto = resto.slice(1).join(' ');
      if (!texto) {
        erro('Falta o texto da mensagem.');
        await contexto.close();
        process.exit(1);
      }

      const caixa = page.locator('#main footer div[contenteditable="true"]').first();
      await caixa.click();
      await espera(500);
      await page.keyboard.type(texto, { delay: 40 });
      await espera(800);
      await page.keyboard.press('Enter');
      await espera(2500);

      log('Mensagem enviada.');
    }
  }

  await espera(1000);
  await contexto.close();
}

main().catch((e) => {
  erro(e.message);
  process.exit(1);
});
