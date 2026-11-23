// ProspectOS — Utilitários Comuns
const fs = require('fs');
const path = require('path');

const UA = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
};

function args() {
  const argv = process.argv.slice(2);
  const opt = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const chave = a.slice(2);
      const proximo = argv[i + 1];
      if (proximo && !proximo.startsWith('--')) {
        opt[chave] = proximo;
        i++;
      } else {
        opt[chave] = true;
      }
    } else {
      opt._.push(a);
    }
  }
  return opt;
}

function lerJSON(caminho) {
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function gravarJSON(caminho, dados) {
  fs.mkdirSync(path.dirname(path.resolve(caminho)), { recursive: true });
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const digits = s => String(s || '').replace(/\D/g, '');
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function telBR(s) {
  let d = digits(s);
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length === 10 || d.length === 11) return d;
  return '';
}

function ehCelular(tel) {
  const limpo = telBR(tel);
  return limpo.length === 11 && limpo[2] === '9';
}

function formataTel(s) {
  const d = telBR(s);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s || '';
}

function formataCNPJ(s) {
  const d = digits(s);
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return s || '';
}

function formataMoeda(val) {
  const n = Number(val) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  UA,
  args,
  lerJSON,
  gravarJSON,
  sleep,
  digits,
  norm,
  telBR,
  ehCelular,
  formataTel,
  formataCNPJ,
  formataMoeda,
  esc
};
