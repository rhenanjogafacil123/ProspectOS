// Rhenan — Orquestrador Geral da Rodada de Prospecção
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { args, lerJSON, gravarJSON, norm } = require('./comum');

const opt = args();
const nicho = opt.nicho;
const cidade = opt.cidade;

if (!nicho || !cidade) {
  console.log(`
==================================================================
                 RHENAN — INTELIGÊNCIA COMERCIAL & PROSPECÇÃO               
==================================================================
Uso:
  node core/orquestrador.js --nicho "oficinas mecanicas" --cidade "Campinas"
                            [--quantidade 5] [--preco "R$ 2.000"] [--bairros "Centro,Taquaral"]
==================================================================
`);
  process.exit(1);
}

const agora = new Date();
const anoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
const slugRodada = `${norm(nicho).replace(/\s+/g, '-')}-${norm(cidade).replace(/\s+/g, '-')}-${anoMes}`;
const pastaRodada = path.resolve(process.cwd(), 'saidas', 'prospeccao', slugRodada);

fs.mkdirSync(pastaRodada, { recursive: true });

console.log(`
==================================================================
🚀 INICIANDO RODADA DE PROSPECÇÃO COM RHENAN
==================================================================
Nicho:       ${nicho}
Cidade:      ${cidade}
Pasta Saída: ${pastaRodada}
==================================================================
`);

function rodarPasso(nome, script, params) {
  console.log(`\n▶ [Passo]: ${nome}...`);
  const res = spawnSync('node', [script, ...params], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
  });
  if (res.status !== 0) {
    console.error(`❌ Erro no passo ${nome}. Código: ${res.status}`);
    process.exit(res.status || 1);
  }
}

// 1. Definição dos caminhos dos arquivos intermediários
const finalCSV = path.join(pastaRodada, 'final.csv');
const candidatosJSON = path.join(pastaRodada, 'candidatos.json');
const validadosJSON = path.join(pastaRodada, 'validados.json');
const trafegoJSON = path.join(pastaRodada, 'com-trafego.json');
const rodadaConfigJSON = path.join(pastaRodada, 'rodada.json');

// 2. Executa Scraper do Maps (ou usa CSV existente se já foi baixado)
if (!fs.existsSync(finalCSV)) {
  const paramsScraper = ['buscar', '--nicho', nicho, '--cidade', cidade, '--saida', finalCSV];
  if (opt.bairros) paramsScraper.push('--bairros', opt.bairros);
  rodarPasso('1. Extração no Google Maps', path.join(__dirname, 'scraper.js'), paramsScraper);
} else {
  console.log(`\n✓ Usando CSV existente em: ${finalCSV}`);
}

// 3. Funil de Qualificação
rodarPasso('2. Funil de Qualificação de Leads', path.join(__dirname, 'qualifica.js'), [
  finalCSV,
  candidatosJSON,
  '--cidade', cidade,
  '--ramo', opt.ramo || nicho
]);

// 4. Validação Fiscal, Receita e Sócios (QSA)
rodarPasso('3. Validação de CNPJ e Mapeamento de Sócios (QSA)', path.join(__dirname, 'valida.js'), [
  candidatosJSON,
  validadosJSON,
  '--cidade', cidade
]);

// 5. Auditoria de Tráfego Pago (Google Ads & Meta Ads)
rodarPasso('4. Detector de Tráfego Pago & Redes', path.join(__dirname, 'detector-trafego.js'), [
  validadosJSON,
  trafegoJSON
]);

// 6. Preparação dos Leads para a Rodada Final
const dadosTrafego = lerJSON(trafegoJSON);
const listaEmpresas = (dadosTrafego.empresas || []).slice(0, Number(opt.quantidade || 5));

const configRodada = {
  nicho,
  cidade,
  remetente: opt.remetente || 'Rhenan',
  preco: opt.preco || 'R$ 2.000',
  valor_ancorado: opt['valor-ancorado'] || 'R$ 6.800',
  parcelamento: opt.parcelamento || '4x de R$ 560',
  leads: listaEmpresas.map((emp, i) => ({
    ...emp,
    slug: `0${i + 1}-${norm(emp.title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
  }))
};

gravarJSON(rodadaConfigJSON, configRodada);

// 7. Enriquecimento de Inteligência Multi-Fonte Completo (Padrão Abacus AI)
rodarPasso('5. Enriquecimento de Inteligência Multi-Fonte & Auditoria Digital', path.join(__dirname, 'enriquecedor.js'), [
  rodadaConfigJSON
]);

// 8. Geração dos Roadmaps de Implantação 360º (Padrão 3 Páginas A4)
rodarPasso('6. Geração dos Roadmaps de Implantação (HTML e PDF)', path.join(__dirname, 'gera-roadmap.js'), [
  rodadaConfigJSON,
  pastaRodada
]);

// 9. Geração do Cockpit & Painel Interativo com Tabela de Auditoria e Cards
rodarPasso('7. Montagem do Cockpit Executivo (Tabela Abacus + Cards Multi-Canal)', path.join(__dirname, 'monta-rodada.js'), [
  rodadaConfigJSON,
  pastaRodada
]);

console.log(`
==================================================================
🎉 RODADA CONCLUÍDA COM SUCESSO!
==================================================================
Abra o Painel da Rodada no seu navegador:
file:///${pastaRodada.replace(/\\/g, '/')}/index.html
==================================================================
`);
