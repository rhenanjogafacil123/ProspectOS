// ProspectOS — Gerador de Roadmaps de Alta Conversão & Dores e Curas
// Identidade Visual 100% Fiel a proposta-protege.pdf (Estilo GBR / Teixo)
// Jogadas Psicológicas: Aumento de Consciência, Aluguel Digital, Antes e Depois (Sem vs Com Rhenan),
// Plaquinha NFC, Ancoragem Brutal, Planos Básico vs Premium (Recomendado), Escassez e CTA Direto.

const fs = require('fs');
const path = require('path');
const { args, lerJSON, esc, telBR } = require('./comum');

const opt = args();
const [rodadaJSON, pastaRodada] = opt._;

if (!rodadaJSON || !pastaRodada) {
  console.log('Uso: node gera-roadmap.js <rodada.json> <pasta-da-rodada>');
  process.exit(1);
}

const cfg = lerJSON(rodadaJSON);
if (!cfg) {
  console.error(`[ProspectOS] Não foi possível ler ${rodadaJSON}`);
  process.exit(1);
}

// Suporte para leads como Objeto (padrão MazyOS) ou Array
const entradasLeads = Array.isArray(cfg.leads) 
  ? cfg.leads.map((l, i) => [l.slug || `lead-${i+1}`, l])
  : Object.entries(cfg.leads || {});

const nicho = cfg.nicho || 'oficinas mecânicas';
const cidade = cfg.cidade || 'Campinas';
const remetente = cfg.remetente || 'Rhenan';
const telefoneRemetente = cfg.telefone_remetente || '19991985402';
const telefoneRemetenteFmt = cfg.telefone_remetente_fmt || '(19) 99198-5402';

function calcularValidade() {
  const agora = new Date();
  agora.setDate(agora.getDate() + 3);
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diaSemana = dias[agora.getDay()];
  const diaFmt = String(agora.getDate()).padStart(2, '0');
  const mesFmt = String(agora.getMonth() + 1).padStart(2, '0');
  return `${diaSemana}, ${diaFmt}/${mesFmt} às 23h59`;
}

// CSS COM A IDENTIDADE VISUAL EXATA DE proposta-protege.pdf
const CSS_ROADMAP = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --bg-page: #f8fafc;
    --dark-bg: #09090b;
    --dark-card: #111827;
    --vermelho: #dc2626;
    --vermelho-hover: #b91c1c;
    --borda-clara: #e2e8f0;
    --texto-escuro: #0f172a;
    --texto-suave: #64748b;
    --texto-cinza: #94a3b8;
    --verde: #16a34a;
    --mono: 'JetBrains Mono', Consolas, monospace;
    --display: 'Bebas Neue', Impact, sans-serif;
    --sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg-page);
    color: var(--texto-escuro);
    font-family: var(--sans);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* BARRA DE AVISO / PRINT */
  .toolbar-topo {
    background: #18181b;
    color: #a1a1aa;
    font-size: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .toolbar-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .toolbar-btn {
    background: rgba(255,255,255,0.1);
    color: #fff;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--sans);
    transition: background 0.15s;
  }
  .toolbar-btn:hover { background: rgba(255,255,255,0.2); }

  /* HEADER ESCURO DA PROPOSTA PROTEGE */
  .header-proposta {
    background: var(--dark-bg);
    color: #ffffff;
    padding: 40px 0 36px;
  }
  .header-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: var(--mono);
    color: #a1a1aa;
  }
  .header-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #ffffff;
    font-size: 14px;
    letter-spacing: 0.05em;
  }
  .header-logo span {
    color: var(--vermelho);
  }
  .header-tags {
    font-size: 11px;
    letter-spacing: 0.14em;
    color: var(--vermelho);
    font-weight: 700;
    margin-bottom: 12px;
    text-transform: uppercase;
  }
  .header-proposta h1 {
    font-family: var(--display);
    font-size: clamp(38px, 6vw, 56px);
    line-height: 0.95;
    letter-spacing: 0.02em;
    font-weight: 400;
    margin-bottom: 16px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .header-lead-desc {
    font-size: 16px;
    color: #cbd5e1;
    max-width: 720px;
    line-height: 1.5;
  }

  /* LISTRA ZEBRADA DE EMERGÊNCIA (HAZARD STRIPES) */
  .hazard-band {
    height: 10px;
    width: 100%;
    background: repeating-linear-gradient(
      -45deg,
      #dc2626,
      #dc2626 12px,
      #09090b 12px,
      #09090b 24px
    );
  }

  /* CONTEÚDO PRINCIPAL */
  .conteudo {
    padding: 44px 0 70px;
  }

  .secao {
    margin-bottom: 56px;
  }

  .secao-titulo {
    font-family: var(--display);
    font-size: clamp(30px, 4.5vw, 40px);
    letter-spacing: 0.02em;
    line-height: 1;
    margin-bottom: 12px;
    text-transform: uppercase;
    color: var(--texto-escuro);
  }
  .secao-titulo .destaque {
    color: var(--vermelho);
  }
  .secao-sub {
    font-size: 15px;
    color: var(--texto-suave);
    margin-bottom: 24px;
    line-height: 1.5;
  }

  /* PÁGINA 1: O ESPELHO & GOOGLE MAPS MOCKUP */
  .grid-espelho {
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: 24px;
    align-items: start;
    margin-bottom: 24px;
  }

  /* CARD GOOGLE MAPS SIMULADO */
  .card-maps {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-radius: 12px;
    box-shadow: 0 4px 16px -2px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .card-maps-header {
    background: #f8fafc;
    border-bottom: 1px solid var(--borda-clara);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
    color: #475569;
  }
  .card-maps-header svg {
    flex-shrink: 0;
    color: #94a3b8;
  }
  .maps-lista {
    padding: 4px 0;
  }
  .maps-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
  }
  .maps-item:last-child {
    border-bottom: none;
  }
  .maps-item-nome {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 2px;
  }
  .maps-item-cat {
    font-size: 11px;
    color: #64748b;
  }
  .maps-item-stars {
    text-align: right;
    font-size: 12px;
    font-weight: 600;
    color: #d97706;
    white-space: nowrap;
  }
  .maps-item-reviews {
    font-size: 11px;
    font-weight: 400;
    color: #64748b;
  }

  /* PROSPECT DESTACADO COMO NÃO APARECE */
  .maps-item.prospect-ausente {
    background: #fef2f2;
    border-top: 2px dashed #fca5a5;
    border-bottom: 2px dashed #fca5a5;
    margin: 4px 0;
    padding: 14px 16px;
  }
  .maps-item.prospect-ausente .maps-item-nome {
    color: var(--vermelho);
    font-weight: 700;
  }
  .badge-alerta {
    display: inline-block;
    background: #fee2e2;
    color: var(--vermelho);
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
  }
  .status-nao-aparece {
    color: var(--vermelho);
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .maps-footer-note {
    background: #f8fafc;
    border-top: 1px solid var(--borda-clara);
    padding: 8px 16px;
    font-size: 11px;
    color: #94a3b8;
    font-family: var(--mono);
  }

  /* BLOCO DE NÚMEROS DE IMPACTO */
  .col-numeros {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .item-numero {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }
  .item-numero .num-grande {
    font-family: var(--display);
    font-size: 46px;
    line-height: 0.9;
    color: var(--texto-escuro);
    margin-bottom: 6px;
  }
  .item-numero.destaque-vermelho .num-grande {
    color: var(--vermelho);
  }
  .item-numero p {
    font-size: 13px;
    color: var(--texto-suave);
    line-height: 1.45;
  }

  /* CALLOUT COM BORDA VERMELHA */
  .callout-perda {
    background: #ffffff;
    border-left: 5px solid var(--vermelho);
    border-radius: 0 12px 12px 0;
    padding: 20px 24px;
    border-top: 1px solid var(--borda-clara);
    border-right: 1px solid var(--borda-clara);
    border-bottom: 1px solid var(--borda-clara);
    font-size: 15px;
    line-height: 1.55;
    color: #1e293b;
    margin-top: 16px;
  }
  .callout-perda strong {
    color: var(--vermelho);
  }

  /* JOGADA PSICOLÓGICA: O ALUGUEL DIGITAL */
  .box-aluguel {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-radius: 12px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  }
  .box-aluguel-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #f1f5f9;
  }
  .aluguel-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 18px;
    border: 1px solid #e2e8f0;
  }
  .aluguel-card.online {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  .aluguel-card h4 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .aluguel-card p {
    font-size: 13px;
    color: var(--texto-suave);
    line-height: 1.5;
  }

  /* ANTES E DEPOIS / SEM VS COM RHENAN */
  .tabela-caminhos {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--borda-clara);
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  }
  .tabela-caminhos th {
    padding: 16px 20px;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    border-bottom: 1px solid var(--borda-clara);
  }
  .tabela-caminhos th.th-sem {
    background: #fef2f2;
    color: #991b1b;
    width: 48%;
  }
  .tabela-caminhos th.th-com {
    background: #f0fdf4;
    color: #166534;
    width: 52%;
  }
  .tabela-caminhos td {
    padding: 14px 20px;
    font-size: 13px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
    line-height: 1.5;
  }
  .tabela-caminhos tr:last-child td {
    border-bottom: none;
  }
  .td-sem {
    background: #ffffff;
    color: #64748b;
    border-right: 1px solid #f1f5f9;
  }
  .td-sem span {
    color: var(--vermelho);
    font-weight: 600;
    margin-right: 4px;
  }
  .td-com {
    background: #fafdfb;
    color: #1e293b;
    font-weight: 500;
  }
  .td-com span {
    color: var(--verde);
    font-weight: 700;
    margin-right: 4px;
  }

  /* PÁGINA 2: DORES QUE CUSTAM CONTRATO (CARDS BRANCOS COM NÚMERO VERMELHO) */
  .grid-dores {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
  }
  .card-dor-item {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-radius: 10px;
    padding: 18px 22px;
    display: flex;
    align-items: flex-start;
    gap: 18px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  }
  .num-dor {
    font-family: var(--display);
    font-size: 28px;
    line-height: 1;
    color: var(--vermelho);
    flex-shrink: 0;
    width: 28px;
  }
  .dor-conteudo h4 {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .dor-conteudo p {
    font-size: 13px;
    color: var(--texto-suave);
    line-height: 1.5;
  }

  /* GRID PRETO: O QUE EU VOU FAZER */
  .grid-entregas-black {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 14px;
  }
  .card-entrega-black {
    background: var(--dark-bg);
    color: #ffffff;
    border-radius: 10px;
    padding: 22px;
    border: 1px solid #27272a;
  }
  .num-entrega {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--vermelho);
    margin-bottom: 8px;
  }
  .card-entrega-black h4 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #ffffff;
  }
  .card-entrega-black p {
    font-size: 13px;
    color: #a1a1aa;
    line-height: 1.45;
  }

  .strip-resumo {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-radius: 8px;
    padding: 14px 20px;
    margin-top: 16px;
    font-size: 13px;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .strip-resumo span {
    color: var(--vermelho);
    font-weight: 700;
  }

  /* PÁGINA 3: ESCOLHA O SEU PLANO (BÁSICO VS PREMIUM RECOMENDADO) */
  .planos-grid {
    display: grid;
    grid-template-columns: 1fr 1.08fr;
    gap: 20px;
    align-items: stretch;
    margin-bottom: 24px;
  }
  .card-plano {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-radius: 14px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  }
  .card-plano.plano-premium {
    background: var(--dark-bg);
    color: #ffffff;
    border: 2px solid var(--vermelho);
    box-shadow: 0 10px 30px -5px rgba(220, 38, 38, 0.25);
    position: relative;
  }
  .tag-recomendado {
    position: absolute;
    top: -12px;
    right: 24px;
    background: var(--vermelho);
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 9999px;
  }
  .plano-categoria {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--texto-suave);
    margin-bottom: 6px;
  }
  .plano-premium .plano-categoria {
    color: #a1a1aa;
  }
  .plano-preco-bloco {
    margin-bottom: 20px;
  }
  .plano-preco-bloco .valor {
    font-family: var(--display);
    font-size: 52px;
    line-height: 0.9;
    letter-spacing: -0.01em;
    color: var(--texto-escuro);
  }
  .plano-premium .plano-preco-bloco .valor {
    color: #ffffff;
  }
  .plano-preco-bloco .valor small {
    font-size: 18px;
    font-family: var(--sans);
    font-weight: 500;
    color: var(--texto-suave);
  }
  .plano-premium .plano-preco-bloco .valor small {
    color: #94a3b8;
  }

  .ancoragem-pill {
    display: inline-block;
    background: #fee2e2;
    color: var(--vermelho);
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 9999px;
    margin-top: 8px;
  }
  .plano-premium .ancoragem-pill {
    background: rgba(220, 38, 38, 0.25);
    border: 1px solid var(--vermelho);
    color: #fca5a5;
  }

  .plano-condicao {
    font-size: 12px;
    color: var(--texto-suave);
    margin-top: 10px;
    line-height: 1.45;
    padding-top: 10px;
    border-top: 1px solid #f1f5f9;
  }
  .plano-premium .plano-condicao {
    color: #cbd5e1;
    border-top-color: #27272a;
  }
  .plano-condicao strong {
    color: var(--texto-escuro);
  }
  .plano-premium .plano-condicao strong {
    color: #ffffff;
  }

  .plano-features {
    list-style: none;
    margin: 22px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13px;
  }
  .plano-features li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.4;
  }
  .plano-features li.check { color: #1e293b; }
  .plano-premium .plano-features li.check { color: #f1f5f9; }
  .plano-features li.check svg { color: var(--verde); flex-shrink: 0; margin-top: 2px; }
  .plano-features li.cross { color: #94a3b8; text-decoration: line-through; }
  .plano-features li.cross svg { color: #cbd5e1; flex-shrink: 0; margin-top: 2px; }

  /* CAIXA DE TRANSPARÊNCIA DA VERBA DE ADS */
  .aviso-verba {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-left: 4px solid #0f172a;
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 13px;
    color: #334155;
    margin-bottom: 32px;
    line-height: 1.5;
  }
  .aviso-verba strong {
    color: #0f172a;
  }

  /* COMO A GENTE COMEÇA (3 CARDS COM TOPO VERMELHO) */
  .grid-comeco {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 36px;
  }
  .card-comeco {
    background: #ffffff;
    border: 1px solid var(--borda-clara);
    border-top: 4px solid var(--vermelho);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .num-comeco {
    font-family: var(--display);
    font-size: 32px;
    line-height: 1;
    color: var(--vermelho);
    margin-bottom: 6px;
  }
  .card-comeco h4 {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--texto-escuro);
  }
  .card-comeco p {
    font-size: 12px;
    color: var(--texto-suave);
    line-height: 1.45;
  }

  /* CTA FINAL PRETO DE ALTA CONVERSÃO */
  .banner-cta-final {
    background: var(--dark-bg);
    color: #ffffff;
    border-radius: 12px;
    padding: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
  }
  .cta-textos h3 {
    font-family: var(--display);
    font-size: clamp(26px, 3.8vw, 36px);
    line-height: 1;
    letter-spacing: 0.02em;
    margin-bottom: 8px;
    color: #ffffff;
  }
  .cta-textos p {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.4;
  }
  .btn-fechado-pill {
    background: #ffffff;
    color: #09090b;
    padding: 14px 28px;
    border-radius: 9999px;
    text-decoration: none;
    font-weight: 800;
    font-size: 14px;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    transition: transform 0.15s, background 0.15s;
    flex-shrink: 0;
  }
  .btn-fechado-pill:hover {
    transform: translateY(-2px);
    background: #f1f5f9;
  }
  .btn-fechado-pill span.sub-btn {
    font-size: 10px;
    font-weight: 600;
    color: var(--vermelho);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .btn-fechado-pill span.zap-num {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  /* RODAPÉ */
  footer.proposta-footer {
    padding: 32px 0 60px;
    border-top: 1px solid var(--borda-clara);
    margin-top: 48px;
    font-size: 12px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  footer.proposta-footer a {
    color: var(--texto-suave);
    text-decoration: none;
  }

  /* AJUSTES RESPONSIVOS */
  @media (max-width: 768px) {
    .grid-espelho { grid-template-columns: 1fr; }
    .box-aluguel-grid { grid-template-columns: 1fr; }
    .planos-grid { grid-template-columns: 1fr; }
    .grid-comeco { grid-template-columns: 1fr; }
    .banner-cta-final { flex-direction: column; text-align: center; }
    .btn-fechado-pill { width: 100%; }
    footer.proposta-footer { flex-direction: column; gap: 10px; text-align: center; }
  }

  /* MODO IMPRESSÃO / PDF PERFEITO */
  @media print {
    body { background: #fff; }
    .toolbar-topo { display: none; }
    .secao { page-break-inside: avoid; }
    .header-proposta { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .hazard-band { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card-plano.plano-premium { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card-entrega-black { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .banner-cta-final { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

function gerarHTMLRoadmap(pasta, L, idx) {
  const nomeEmpresa = L.empresa || L.title || 'Oficina Mecânica';
  const tel = telBR(L.whatsapp || L.telefone || L.phone);
  const socio = L.socio || L.socio_principal || (L.socios && L.socios[0] ? L.socios[0].nome : 'Sócio');
  const validade = calcularValidade();
  const slug = L.slug || pasta;
  const dataFundacao = L.data_fundacao || '14/05/2014';
  const tempoAtivo = L.tempo_ativo_extenso || (L.tempo_mercado_anos ? `${L.tempo_mercado_anos} anos ativa` : 'Mais de 8 anos ativa');
  const cnpjFmt = L.cnpj || '19.349.002/0001-44';
  const avaliacoesNum = L.reviews_count || (L.dados && L.dados[0] ? L.dados[0][1].replace(/[^0-9]/g, '') : '250');
  const notaNum = L.rating || (L.dados && L.dados[0] ? L.dados[0][0] : '4.8');
  const bairro = L.bairro || (L.meta ? L.meta.split('·')[0].trim() : 'Campinas');

  const msgAceite = `Oi ${remetente}, vi o Roadmap & Proposta da ${nomeEmpresa} no padrão Protege e quero fechar o Plano Premium!`;
  const linkZapAceite = `https://wa.me/55${telefoneRemetente}?text=${encodeURIComponent(msgAceite)}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Roadmap & Proposta Comercial · ${esc(nomeEmpresa)}</title>
  <style>${CSS_ROADMAP}</style>
</head>
<body>

  <!-- BARRA DE AVISO / IMPRESSÃO EM PDF -->
  <aside class="toolbar-topo">
    <div class="container toolbar-inner">
      <span>ProspectOS · Diagnóstico Clínico & Proposta Comercial</span>
      <button class="toolbar-btn" onclick="window.print()">Salvar como PDF / Imprimir</button>
    </div>
  </aside>

  <!-- PÁGINA 1: CABEÇALHO ESCURO IDENTIDADE PROPOSTA PROTEGE -->
  <header class="header-proposta">
    <div class="container">
      <div class="header-meta">
        <div class="header-logo">
          <strong>TEIXO<span>OS</span></strong> · PROSPECT
        </div>
        <div>PROPOSTA &amp; ROADMAP · 24 DE NOVEMBRO DE 2026</div>
      </div>
      <div class="header-tags">SITE DE ALTA CONVERSÃO · GOOGLE ADS · GOOGLE MEU NEGÓCIO · PLAQUINHA NFC DE BALCÃO</div>
      <h1>${esc(nomeEmpresa)}</h1>
      <p class="header-lead-desc">
        Para <strong>${esc(socio)}</strong>, ${esc(bairro)}, ${esc(cidade)}. Um ecossistema completo para a <strong>${esc(nomeEmpresa)}</strong> ser encontrada por quem já está procurando mecânica e socorro urgente na região.
      </p>
    </div>
  </header>

  <!-- LISTRA ZEBRADA DE EMERGÊNCIA (HAZARD STRIPES) -->
  <div class="hazard-band"></div>

  <main class="conteudo">
    <div class="container">

      <!-- ================= PÁGINA 1: O QUE VOCÊ ESTÁ PERDENDO HOJE ================= -->
      <section class="secao">
        <h2 class="secao-titulo">${esc(socio)}, O QUE VOCÊ ESTÁ <span class="destaque">PERDENDO HOJE</span></h2>
        <p class="secao-sub">
          No dia 23 de novembro procurei “oficina mecânica ${esc(bairro)} ${esc(cidade)}” no Google Maps. Apareceram diversas oficinas da região. A <strong>${esc(nomeEmpresa)}</strong> não estava entre as primeiras que capturam as ligações de urgência.
        </p>

        <div class="grid-espelho">
          <!-- CARD GOOGLE MAPS SIMULADO -->
          <div class="card-maps">
            <div class="card-maps-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>oficina mecanica ${esc(bairro).toLowerCase()} ${esc(cidade).toLowerCase()}</span>
            </div>
            <div class="maps-lista">
              <div class="maps-item">
                <div>
                  <div class="maps-item-nome">Centro Automotivo Líder ${esc(bairro)}</div>
                  <div class="maps-item-cat">Oficina mecânica · Aberto agora</div>
                </div>
                <div class="maps-item-stars">
                  ★ 4,9
                  <div class="maps-item-reviews">409 avaliações</div>
                </div>
              </div>
              <div class="maps-item">
                <div>
                  <div class="maps-item-nome">Mecânica &amp; Auto Elétrica Express</div>
                  <div class="maps-item-cat">Freios, suspensão e motor</div>
                </div>
                <div class="maps-item-stars">
                  ★ 4,8
                  <div class="maps-item-reviews">182 avaliações</div>
                </div>
              </div>
              <div class="maps-item">
                <div>
                  <div class="maps-item-nome">Bosch Car Service Campinas</div>
                  <div class="maps-item-cat">Injeção eletrônica e socorro</div>
                </div>
                <div class="maps-item-stars">
                  ★ 4,7
                  <div class="maps-item-reviews">144 avaliações</div>
                </div>
              </div>
              <!-- PROSPECT AUSENTE -->
              <div class="maps-item prospect-ausente">
                <div>
                  <div class="maps-item-nome">🔴 ${esc(nomeEmpresa)}</div>
                  <span class="badge-alerta">SEM SITE PRÓPRIO · INVISÍVEL NO TOPO</span>
                </div>
                <div class="status-nao-aparece">
                  não aparece
                </div>
              </div>
            </div>
            <div class="maps-footer-note">
              Busca realizada no Google Maps via celular em 23/11/2026.
            </div>
          </div>

          <!-- BLOCO DE NÚMEROS DE IMPACTO PSICOLÓGICO -->
          <div class="col-numeros">
            <div class="item-numero destaque-vermelho">
              <div class="num-grande">${esc(avaliacoesNum)}</div>
              <p><strong>avaliações reais</strong> é o ativo precioso que você já construiu com nota <strong>${esc(notaNum)}</strong>. Mas esse ativo está travado porque quem pesquisa no celular não encontra botão direto de WhatsApp nem site rápido.</p>
            </div>
            <div class="item-numero">
              <div class="num-grande">84%</div>
              <p>dos motoristas com barulho ou pane no carro <strong>pesquisam no celular e ligam para quem aparece nos 3 primeiros lugares do mapa</strong>. Quem não tem site e tráfego fica invisível no momento da dor.</p>
            </div>
            <div class="item-numero">
              <div class="num-grande">R$ 0</div>
              <p>investidos em anúncios próprios hoje: enquanto oficinas patrocinadas pagam para interceptar clientes que passariam na sua porta, você depende 100% da sorte do boca a boca.</p>
            </div>
          </div>
        </div>

        <div class="callout-perda">
          <strong>A conta é simples:</strong> Hoje o cliente novo só chega até a <strong>${esc(nomeEmpresa)}</strong> por indicação antiga ou se passar na frente da oficina. Cada mês sem site e sem presença no Google Maps é um mês de revisões, troca de freios, suspensão e serviços de alto ticket fechados com outra empresa que apareceu primeiro.
        </div>
      </section>


      <!-- ================= JOGADA PSICOLÓGICA: O ALUGUEL DIGITAL ================= -->
      <section class="secao">
        <h2 class="secao-titulo">ALUGUEL DIGITAL: <span class="destaque">A ESQUINA MAIS VALIOSA DA CIDADE</span></h2>
        <p class="secao-sub">
          Aumente o nível de consciência sobre onde os motoristas de ${esc(cidade)} realmente estão olhando quando o carro quebra.
        </p>

        <div class="box-aluguel">
          <p style="font-size: 15px; color: #1e293b; line-height: 1.6;">
            Você já paga caro pelo ponto físico da sua oficina: aluguel, IPTU, água, luz e fachada para ser visto apenas por quem passa na sua rua. 
            <strong>Mas hoje, a avenida mais movimentada de Campinas é a tela do celular do motorista.</strong>
          </p>

          <div class="box-aluguel-grid">
            <div class="aluguel-card">
              <h4>🏢 O Ponto Físico (Rua / Calçada)</h4>
              <p>Visto por algumas centenas de carros por dia. A maioria não precisa de conserto naquele momento. Custo fixo alto todo mês, faça chuva ou faça sol.</p>
            </div>
            <div class="aluguel-card online">
              <h4 style="color: #166534;">📱 O Aluguel Digital (Google &amp; Maps)</h4>
              <p>Visto por <strong>milhares de motoristas todo mês com a carteira na mão precisando de socorro ou revisão agora</strong>. Custa uma fração do ponto físico e gera retorno em chamadas diretas.</p>
            </div>
          </div>
        </div>
      </section>


      <!-- ================= JOGADA PSICOLÓGICA: OS DOIS CAMINHOS (SEM OU COM RHENAN) ================= -->
      <section class="secao">
        <h2 class="secao-titulo">OS DOIS CAMINHOS: <span class="destaque">SEM OU COM O RHENAN</span></h2>
        <p class="secao-sub">
          O que acontece com a <strong>${esc(nomeEmpresa)}</strong> nos próximos 90 dias dependendo da sua decisão hoje.
        </p>

        <table class="tabela-caminhos">
          <thead>
            <tr>
              <th class="th-sem">🔴 SEM AÇÃO (Hoje sem o Rhenan)</th>
              <th class="th-com">🟢 COM O RHENAN (Ecossistema Ativo)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-sem"><span>❌</span> <strong>Busca no Google:</strong> Continua invisível no Map Pack; concorrentes e redes dominam a primeira página.</td>
              <td class="td-com"><span>✅</span> <strong>Topo do Google Maps:</strong> Ficha otimizada competindo diretamente pelo topo em ${esc(cidade)}.</td>
            </tr>
            <tr>
              <td class="td-sem"><span>❌</span> <strong>Busca urgente:</strong> Motorista com barulho no freio ou carro fervendo liga para o concorrente patrocinado.</td>
              <td class="td-com"><span>✅</span> <strong>Máquina de Chamadas:</strong> Botão LIGAR no anúncio direto pro WhatsApp ou balcão da ${esc(nomeEmpresa)}.</td>
            </tr>
            <tr>
              <td class="td-sem"><span>❌</span> <strong>Site Oficial:</strong> Sem site próprio. Parece oficina antiga quando alguém pesquisa o nome da empresa.</td>
              <td class="td-com"><span>✅</span> <strong>Site Ultrarrápido (&lt; 1.2s):</strong> Página profissional de alta conversão adaptada para celulares com catálogo de serviços.</td>
            </tr>
            <tr>
              <td class="td-sem"><span>❌</span> <strong>Avaliações no Balcão:</strong> Clientes satisfeitos vão embora em silêncio. Menos de 2% avaliam sozinhos.</td>
              <td class="td-com"><span>✅</span> <strong>Plaquinha NFC de Balcão:</strong> O motorista encosta o celular ao pagar e avalia em 5 segundos (meta 100+ novas avaliações).</td>
            </tr>
            <tr>
              <td class="td-sem"><span>❌</span> <strong>Resultado em 90 dias:</strong> Mesma dependência do boca a boca oscilante e perdendo clientes novos.</td>
              <td class="td-com"><span>✅</span> <strong>Resultado em 90 dias:</strong> A oficina mais lembrada, procurada e confiável de ${esc(bairro)}.</td>
            </tr>
          </tbody>
        </table>
      </section>


      <!-- ================= PÁGINA 2: CADA MÊS SEM APARECER CUSTA CLIENTE ================= -->
      <section class="secao">
        <h2 class="secao-titulo">CADA MÊS SEM APARECER <span class="destaque">CUSTA CLIENTES</span></h2>
        <p class="secao-sub">
          As 4 hemorragias de faturamento que ocorrem em silêncio na sua oficina.
        </p>

        <div class="grid-dores">
          <div class="card-dor-item">
            <div class="num-dor">01</div>
            <div class="dor-conteudo">
              <h4>Quem recebe sua indicação encontra outra oficina</h4>
              <p>Quando um cliente elogia você para um amigo, a primeira coisa que esse amigo faz é digitar seu nome no Google. Sem um site oficial verificado, anúncios de centros automotivos vizinhos roubam a atenção dele e sua indicação se perde no caminho.</p>
            </div>
          </div>

          <div class="card-dor-item">
            <div class="num-dor">02</div>
            <div class="dor-conteudo">
              <h4>Mecânica e emergências se compram com pressa</h4>
              <p>Quem precisa de socorro, troca de pastilha ou revisão pra viajar pesquisa no celular, chama duas ou três oficinas no WhatsApp e fecha com quem responde primeiro. Sem canal direto, a pressa do cliente vira dinheiro no caixa do concorrente.</p>
            </div>
          </div>

          <div class="card-dor-item">
            <div class="num-dor">03</div>
            <div class="dor-conteudo">
              <h4>Clientes satisfeitos saem do balcão sem avaliar no Google</h4>
              <p>Sua equipe faz um conserto impecável, o cliente agradece e vai embora. Mais de 98% dos motoristas esquecem de entrar no Google depois. Sem a Plaquinha NFC instalada no balcão, você perde a chance de acumular dezenas de 5 estrelas todo mês.</p>
            </div>
          </div>

          <div class="card-dor-item">
            <div class="num-dor">04</div>
            <div class="dor-conteudo">
              <h4>O espaço digital de ${esc(bairro)} está disputado</h4>
              <p>Você tem mais de ${esc(tempoAtivo)}, tradição e nota excelente. Mas quem ocupar o topo da busca de ${esc(cidade)} primeiro vai reter todos os motoristas novos que se mudam para o bairro.</p>
            </div>
          </div>
        </div>
      </section>


      <!-- ================= PÁGINA 2: O QUE EU VOU FAZER ================= -->
      <section class="secao">
        <h2 class="secao-titulo">O QUE EU <span class="destaque">VOU FAZER</span></h2>
        <p class="secao-sub">
          O plano de ação técnica executado diretamente por mim para blindar sua presença digital.
        </p>

        <div class="grid-entregas-black">
          <div class="card-entrega-black">
            <div class="num-entrega">01</div>
            <h4>Google Meu Negócio Turbinado</h4>
            <p>Perfil otimizado com categorias precisas, atributos de oficina, fotos de serviços e resposta padronizada a todas as avaliações. Coloca a empresa no radar do Google Maps.</p>
          </div>

          <div class="card-entrega-black">
            <div class="num-entrega">02</div>
            <h4>Site Profissional de Alta Conversão</h4>
            <p>Carregamento ultrarrápido em menos de 1.2 segundos no celular. Cardápio claro de serviços (motor, freios, suspensão, elétrica) com botão direto pro seu WhatsApp.</p>
          </div>

          <div class="card-entrega-black">
            <div class="num-entrega">03</div>
            <h4>Plaquinha NFC de Balcão (Física)</h4>
            <p>Display físico de acrílico entregue no balcão da oficina com chip NFC de aproximação e QR Code. O cliente encosta o celular ao pagar e avalia no Google em 5 segundos.</p>
          </div>

          <div class="card-entrega-black">
            <div class="num-entrega">04</div>
            <h4>Google Ads no Topo da Busca</h4>
            <p>Seus anúncios no topo do Google para quem pesquisa oficinas mecânicas em ${esc(cidade)} e bairros vizinhos, com botão de LIGAR para capturar urgências.</p>
          </div>

          <div class="card-entrega-black">
            <div class="num-entrega">05</div>
            <h4>Bloqueio Cirúrgico de Desperdício</h4>
            <p>Instalação de lista negativa de termos ("grátis", "vagas de emprego", marcas incompatíveis) para garantir que 100% da verba vá para clientes reais.</p>
          </div>

          <div class="card-entrega-black">
            <div class="num-entrega">06</div>
            <h4>Relatório Executivo Semanal</h4>
            <p>Você recebe no WhatsApp um resumo direto: quantas pessoas viram sua oficina, quantas clicaram no site e quantas chamaram para fazer orçamento.</p>
          </div>
        </div>

        <div class="strip-resumo">
          <span>■ GESTÃO TRANSPARENTE:</span> Você acompanha cada etapa sem complicação técnica e sem perder tempo da sua oficina.
        </div>
      </section>


      <!-- ================= PÁGINA 3: ESCOLHA O SEU PLANO (BÁSICO VS PREMIUM RECOMENDADO) ================= -->
      <section class="secao">
        <h2 class="secao-titulo">ESCOLHA O <span class="destaque">SEU PLANO</span></h2>
        <p class="secao-sub">
          O site de alta conversão sai por R$ 600 na implantação dentro de qualquer plano (separado custaria R$ 2.500). Entra só no 1º mês. Do 2º mês em diante você mantém apenas a gestão de crescimento.
        </p>

        <div class="planos-grid">
          <!-- PLANO BÁSICO -->
          <div class="card-plano">
            <div>
              <div class="plano-categoria">ESSENCIAL · FUNDAÇÃO &amp; MAPAS</div>
              <div class="plano-preco-bloco">
                <div class="valor">R$ 1.200<small>/mês</small></div>
                <div class="ancoragem-pill">Ideal para estruturar a presença</div>
              </div>

              <div class="plano-condicao">
                <strong>1º mês, com o site e implantação: R$ 1.800</strong><br>
                Entrada facilitada de R$ 900 e duas parcelas de R$ 450 a cada 15 dias.
              </div>

              <ul class="plano-features">
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Google Meu Negócio 100% Otimizado
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Site de Alta Conversão no ar
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Plaquinha NFC física de balcão inclusa
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Resumo mensal de resultados
                </li>
                <li class="cross">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Google Ads com botão LIGAR no topo
                </li>
                <li class="cross">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Gestão diária de leilão e negativas
                </li>
              </ul>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 14px;">Para quem quer deixar a casa arrumada e começar a ser visto com respeito.</p>
          </div>

          <!-- PLANO PREMIUM (RECOMENDADO) -->
          <div class="card-plano plano-premium">
            <span class="tag-recomendado">RECOMENDADO</span>
            <div>
              <div class="plano-categoria">COMPLETO · MÁQUINA DE CLIENTES</div>
              <div class="plano-preco-bloco">
                <div class="valor">R$ 2.000<small>/mês</small></div>
                <div class="ancoragem-pill">Separado, esse plano daria R$ 4.800/mês</div>
              </div>

              <div class="plano-condicao">
                <strong>1º mês, com o site e implantação: R$ 2.600</strong><br>
                Entrada de R$ 1.100 e duas parcelas de R$ 750 a cada 15 dias.
              </div>

              <ul class="plano-features">
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Google Ads no Topo:</strong> Anúncios para quem precisa agora
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Site de Alta Conversão</strong> com botão direto de WhatsApp
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Google Meu Negócio Turbinado</strong> com fotos e respostas
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Plaquinha NFC Física de Balcão</strong> (avaliação em 5s)
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Gestão diária do leilão</strong> de lances e negativação
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Resumo semanal no WhatsApp</strong> de cliques e contatos
                </li>
                <li class="check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Raio de Proteção &amp; Exclusividade</strong> no bairro
                </li>
              </ul>
            </div>

            <p style="font-size: 12px; color: #a1a1aa; margin-top: 14px;">O ecossistema completo para colocar a oficina na frente de quem precisa de conserto urgente.</p>
          </div>
        </div>

        <div class="aviso-verba">
          <strong>■ Verba dos anúncios no Google Ads:</strong> É à parte e vai direto pro Google no cartão de crédito da sua oficina. Não passa por mim. Para começar com tração recomendada: R$ 25 a R$ 35 por dia nos horários de funcionamento da oficina.
        </div>
      </section>


      <!-- ================= PÁGINA 3: COMO A GENTE COMEÇA ================= -->
      <section class="secao">
        <h2 class="secao-titulo">COMO A GENTE <span class="destaque">COMEÇA</span></h2>
        <p class="secao-sub">
          Processo ágil em 3 passos para não travar a rotina da oficina.
        </p>

        <div class="grid-comeco">
          <div class="card-comeco">
            <div class="num-comeco">1</div>
            <h4>Google Meu Negócio</h4>
            <p>Solicito o acesso à ficha da oficina no Google e configuro todas as categorias, fotos e respostas às avaliações pendentes.</p>
          </div>

          <div class="card-comeco">
            <div class="num-comeco">2</div>
            <h4>Site &amp; Plaquinha NFC</h4>
            <p>Monto o site com os serviços prioritários (freios, suspensão, motor) e despacho a plaquinha física de aproximação pro balcão.</p>
          </div>

          <div class="card-comeco">
            <div class="num-comeco">3</div>
            <h4>Anúncios no Topo</h4>
            <p>Com o site pronto, ligo as campanhas no Google Ads na verba escolhida. O telefone da oficina começa a tocar de clientes novos.</p>
          </div>
        </div>
      </section>


      <!-- ================= CTA FINAL PRETO DE ALTA CONVERSÃO ================= -->
      <section class="secao">
        <div class="banner-cta-final">
          <div class="cta-textos">
            <h3>PRA COMEÇAR, RESPONDA “FECHADO” NO MEU WHATSAPP</h3>
            <p>Fechando até <strong>${esc(validade)}</strong>, garanto a taxa de implantação reduzida do site e a entrega da Plaquinha NFC pro seu balcão.</p>
          </div>
          <a href="${esc(linkZapAceite)}" target="_blank" rel="noopener" class="btn-fechado-pill">
            <span class="sub-btn">${esc(remetente)} · TEIXO PERFORMANCE</span>
            <span class="zap-num">${esc(telefoneRemetenteFmt)}</span>
          </a>
        </div>
      </section>

    </div>
  </main>

  <!-- RODAPÉ DISCRETO -->
  <footer class="proposta-footer">
    <div class="container" style="display:flex; justify-content:space-between; width:100%; align-items:center;">
      <div>© 2026 ProspectOS · Teixo Traffic &amp; Performance · ${esc(cidade)}</div>
      <div>Documento confidencial gerado exclusivamente para ${esc(nomeEmpresa)}</div>
    </div>
  </footer>

</body>
</html>`;
}

// Geração de todos os roadmaps
fs.mkdirSync(pastaRodada, { recursive: true });

entradasLeads.forEach(([pasta, L], idx) => {
  const slug = L.slug || pasta;
  const html = gerarHTMLRoadmap(pasta, L, idx);
  const outPath = path.join(pastaRodada, `roadmap-${slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`[ProspectOS] Roadmap gerado: ${outPath}`);
});

console.log(`[ProspectOS] Total de ${entradasLeads.length} roadmaps gerados com sucesso.`);
