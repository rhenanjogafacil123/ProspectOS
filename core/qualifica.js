// ProspectOS — Funil de Qualificação de Leads
const fs = require('fs');
const path = require('path');
const { args, lerJSON, gravarJSON, norm, telBR, ehCelular } = require('./comum');

const opt = args();
const [inCSV, outJSON] = opt._;

if (!inCSV || !outJSON) {
  console.log('Uso: node qualifica.js <final.csv> <candidatos.json> [--ramo "mecanic|auto"] [--cidade "Campinas"] [--nota-min 4.0] [--min-aval 10]');
  process.exit(1);
}

function parseCSV(conteudo) {
  const linhas = [];
  let linhaAtual = [];
  let campoAtual = '';
  let dentroAspas = false;

  for (let i = 0; i < conteudo.length; i++) {
    const char = conteudo[i];
    const prox = conteudo[i + 1];

    if (char === '"') {
      if (dentroAspas && prox === '"') {
        campoAtual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (char === ',' && !dentroAspas) {
      linhaAtual.push(campoAtual);
      campoAtual = '';
    } else if ((char === '\r' || char === '\n') && !dentroAspas) {
      if (char === '\r' && prox === '\n') i++;
      linhaAtual.push(campoAtual);
      if (linhaAtual.some(c => c.trim())) linhas.push(linhaAtual);
      linhaAtual = [];
      campoAtual = '';
    } else {
      campoAtual += char;
    }
  }
  if (campoAtual || linhaAtual.length > 0) {
    linhaAtual.push(campoAtual);
    if (linhaAtual.some(c => c.trim())) linhas.push(linhaAtual);
  }

  if (linhas.length < 2) return [];
  const cabecalho = linhas[0].map(h => norm(h).replace(/[^a-z0-9_]/g, '_'));
  return linhas.slice(1).map(l => {
    const obj = {};
    cabecalho.forEach((h, idx) => {
      obj[h] = l[idx] !== undefined ? l[idx].trim() : '';
    });
    return obj;
  });
}

function qualificar() {
  const raw = fs.readFileSync(inCSV, 'utf-8');
  const registros = parseCSV(raw);

  const NOTA_MIN = Number(opt['nota-min'] ?? 4.0);
  const MIN_AVAL = Number(opt['min-aval'] ?? 10);
  const EXIGE_CELULAR = opt.celular !== '0';
  const EXIGE_SEM_SITE = opt['sem-site'] !== '0';
  const REGEX_RAMO = opt.ramo ? new RegExp(norm(opt.ramo), 'i') : null;
  const CIDADE = opt.cidade ? norm(opt.cidade) : null;

  const historico = opt.historico && fs.existsSync(opt.historico) ? (lerJSON(opt.historico) || {}) : {};

  const funil = {
    total: registros.length,
    doRamo: 0,
    notaMinima: 0,
    avaliacoesMinimas: 0,
    semSite: 0,
    comCelular: 0,
    aprovados: 0
  };

  const candidatos = [];

  for (const r of registros) {
    const nome = r.title || r.name || '';
    const categoria = r.category || r.categories || '';
    const nota = parseFloat((r.rating || r.total_score || '0').replace(',', '.'));
    const avaliacoes = parseInt(r.reviews_count || r.reviews || '0', 10);
    const site = r.website || r.site || '';
    const telefone = r.phone || r.phone_number || '';
    const endereco = r.address || r.formatted_address || '';

    // 1. Ramo
    if (REGEX_RAMO) {
      const textoChecagem = norm(`${nome} ${categoria}`);
      if (!REGEX_RAMO.test(textoChecagem)) continue;
    }
    funil.doRamo++;

    // 2. Nota
    if (nota < NOTA_MIN) continue;
    funil.notaMinima++;

    // 3. Avaliações
    if (avaliacoes < MIN_AVAL) continue;
    funil.avaliacoesMinimas++;

    // 4. Sem site
    if (EXIGE_SEM_SITE && site) continue;
    funil.semSite++;

    // 5. Celular / WhatsApp
    const telLimpo = telBR(telefone);
    if (!telLimpo) continue;
    if (EXIGE_CELULAR && !ehCelular(telLimpo)) continue;
    funil.comCelular++;

    // 6. Histórico de abordados
    if (historico[telLimpo]) continue;

    funil.aprovados++;

    candidatos.push({
      title: nome,
      category: categoria,
      rating: nota,
      reviews_count: avaliacoes,
      phone: telefone,
      phone_clean: telLimpo,
      address: endereco,
      place_id: r.place_id || '',
      cid: r.cid || '',
      data_extracao: new Date().toISOString()
    });
  }

  // Ordena por maior número de avaliações (empresas com mais fluxo e autoridade)
  candidatos.sort((a, b) => b.reviews_count - a.reviews_count);

  gravarJSON(outJSON, {
    funil,
    candidatos
  });

  console.log('[ProspectOS] Funil de Qualificação Concluído:');
  console.log(`  Total no CSV: ${funil.total}`);
  console.log(`  Do ramo pretendido: ${funil.doRamo}`);
  console.log(`  Nota >= ${NOTA_MIN}: ${funil.notaMinima}`);
  console.log(`  Avaliações >= ${MIN_AVAL}: ${funil.avaliacoesMinimas}`);
  console.log(`  Sem site registrado: ${funil.semSite}`);
  console.log(`  Com WhatsApp/Celular válido: ${funil.comCelular}`);
  console.log(`  -> Candidatos qualificados: ${funil.aprovados}`);
  console.log(`Arquivo salvo em: ${outJSON}`);
}

qualificar();
