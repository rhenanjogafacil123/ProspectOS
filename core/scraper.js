// ProspectOS — Scraper de Google Maps (Engine Integrada)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { args, sleep, UA } = require('./comum');

const opt = args();
const comando = opt._[0];
const PORTA = opt.porta || 8080;
const API = `http://localhost:${PORTA}/api/v1/jobs`;
const ehWin = process.platform === 'win32';
const EXE = ehWin ? 'mazyos-scraper.exe' : 'mazyos-scraper';

const noAr = async () => {
  try {
    return (await fetch(API, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
};

function acharInstalado() {
  const lugares = [
    opt.pasta,
    process.env.PROSPECTOS_SCRAPER,
    path.join(os.homedir(), 'mazyos-scraper'),
    path.join(os.homedir(), 'prospectos-scraper'),
    'C:\\Users\\rhena\\mazyos-scraper',
    path.join(process.cwd(), 'ferramentas', 'scraper')
  ].filter(Boolean);
  return lugares.find(d => fs.existsSync(path.join(d, EXE))) || null;
}

async function abrir() {
  if (await noAr()) {
    console.log(`[ProspectOS] Scraper ativo em http://localhost:${PORTA}`);
    return;
  }
  const dir = acharInstalado();
  if (!dir) {
    throw new Error(`[ProspectOS] Executável do scraper não encontrado (${EXE}). Verifique a pasta ~/mazyos-scraper.`);
  }

  console.log(`[ProspectOS] Iniciando scraper a partir de ${dir}...`);
  const filho = spawn(path.join(dir, EXE), ['-web', '-addr', `:${PORTA}`, '-c', '4', '-data-folder', 'webdata'], {
    cwd: dir,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, DISABLE_TELEMETRY: '1' }
  });

  filho.on('error', e => {
    console.error('[ProspectOS] Erro ao abrir scraper:', e.message);
    process.exitCode = 1;
  });
  filho.unref();

  for (let i = 0; i < 40; i++) {
    await sleep(1500);
    if (await noAr()) {
      console.log(`[ProspectOS] Scraper pronto e respondendo em http://localhost:${PORTA}`);
      return;
    }
  }
  throw new Error(`[ProspectOS] O scraper não respondeu na porta ${PORTA}.`);
}

async function geocodificar(cidade) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cidade)}&format=json&limit=1`, { headers: UA });
  const j = await r.json();
  if (!j[0]) throw new Error(`Não achei "${cidade}" no mapa. Informe --lat e --lon.`);
  return { lat: j[0].lat, lon: j[0].lon };
}

async function buscar() {
  const { nicho, cidade, saida } = opt;
  if (!nicho || !cidade || !saida) {
    throw new Error('Uso: node scraper.js buscar --nicho "oficina mecanica" --cidade "Campinas" --saida final.csv [--bairros "Centro,Cambuí"]');
  }

  await abrir();
  const bairros = String(opt.bairros === true ? '' : opt.bairros || '').split(',').map(s => s.trim()).filter(Boolean);
  const nichos = String(nicho).split(',').map(s => s.trim()).filter(Boolean);
  const keywords = nichos.flatMap(n => [`${n} em ${cidade}`, ...bairros.map(b => `${n} em ${b}, ${cidade}`)]);
  const { lat, lon } = opt.lat ? { lat: String(opt.lat), lon: String(opt.lon) } : await geocodificar(cidade);

  const corpo = {
    name: `${nichos.join(' + ')} · ${cidade}`,
    keywords,
    lang: 'pt',
    zoom: 12,
    lat,
    lon,
    radius: Number(opt.raio || 20000),
    depth: 6,
    email: false,
    max_time: Math.max(900, keywords.length * 240)
  };

  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });

  if (!r.ok) throw new Error(`O scraper recusou a busca (${r.status}): ${await r.text()}`);
  const { id } = await r.json();
  console.log(`[ProspectOS] Job iniciado (#${id}): ${keywords.length} termos de busca.`);

  const inicio = Date.now();
  const limite = (corpo.max_time + 300) * 1000;
  let status = '';

  while (Date.now() - inicio < limite) {
    await sleep(10000);
    const j = await (await fetch(`${API}/${id}`)).json();
    status = String(j.Status || j.status || '').toLowerCase();
    if (status === 'ok') break;
    if (status === 'failed') throw new Error('A busca falhou no scraper. O Google pode ter bloqueado temporariamente.');
  }

  console.log(`[ProspectOS] Busca finalizada (status: ${status}). Baixando CSV final...`);
  const download = await fetch(`${API}/${id}/csv`);
  if (!download.ok) throw new Error(`Falha ao baixar CSV do job ${id}`);

  const textoCSV = await download.text();
  fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  fs.writeFileSync(saida, textoCSV, 'utf-8');
  console.log(`[ProspectOS] CSV salvo com sucesso em: ${saida}`);
}

async function main() {
  try {
    if (comando === 'abrir') await abrir();
    else if (comando === 'buscar') await buscar();
    else {
      console.log('Comandos disponíveis:');
      console.log('  node scraper.js abrir');
      console.log('  node scraper.js buscar --nicho <nicho> --cidade <cidade> --saida <arquivo.csv>');
    }
  } catch (err) {
    console.error(`[ProspectOS Erro]: ${err.message}`);
    process.exit(1);
  }
}

main();
