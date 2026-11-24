// Rhenan — Montador da Rodada & Cockpit Executivo de Prospecção (Padrão Abacus AI + Auditoria Completa)
const fs = require('fs');
const path = require('path');
const { args, lerJSON, gravarJSON, esc, telBR } = require('./comum');

const opt = args();
const [cfgPath, rodada] = opt._;
if (!cfgPath || !rodada) {
  console.error('Uso: node monta-rodada.js <rodada.json> <pasta-da-rodada>');
  process.exit(1);
}

const cfg = lerJSON(cfgPath);
for (const campo of ['remetente', 'assinatura', 'oferta', 'preco', 'entrega', 'nicho', 'cidade', 'leads']) {
  if (!cfg[campo]) {
    console.error(`Faltou "${campo}" no rodada.json.`);
    process.exit(1);
  }
}

const base = cfg.base ? cfg.base.replace(/\/?$/, '/') : '';
const COM_PREVIA = cfg.semPrevia !== true;
const M1_PREVIA = cfg.m1Modo === 'previa';
const entradas = Object.entries(cfg.leads);
const printDe = pasta => fs.existsSync(path.join(rodada, pasta, 'print-whatsapp.png')) ? `${pasta}/print-whatsapp.png` : null;

// Modelos base de abordagem
const BASE = {
  m1: 'Oi {socio}, tudo bem? Aqui é o {remetente}.\nVi {a} {empresa} no Google com excelente nota, mas notei que vocês estão sem anúncios no mapa e sem site próprio.\nComo chega cliente novo pra vocês hoje: mais por indicação ou pelo Google também?',
  m1Previa: 'Oi {socio}, tudo bem? Aqui é o {remetente}.\nVi {a} {empresa} no Google {vi}.\nMontei essa prévia de como o site e a presença de vocês poderiam ficar. Faz sentido eu te explicar como funciona?',
  m2: 'Pergunto porque montei uma prévia de como {a} {empresa} poderia aparecer pra quem procura {servico}. Segue o print{link}.\nSe fizer sentido, coloco no ar com campanha de Google Ads e plaquinha NFC de balcão: {oferta}. Te explico como funciona?',
  m2SemPrevia: 'Pergunto porque trabalho com isso: {oferta}. Pensei {na} {empresa} justamente por causa de quem procura {servico}. Te explico como funcionaria aí?',
  fu: 'Oi {socio}, passando aqui de novo porque sei que a rotina corre.\nA pergunta sobre como chega cliente novo {pra} {empresa} ainda vale. Se não for assunto pra agora, é só me dizer que eu não volto a chamar.',
  fu2: 'Vou parar de te chamar pra não atrapalhar, {socio}. Se um dia quiser ver o Roadmap e a prévia que desenhei {pra} {empresa}, é só responder aqui.',
  preco: 'Fica {preco}: {entrega}.\nConsigo começar ainda essa semana. Quer que eu reserve?',
  caro: 'Sem problema, o preço tem que fazer sentido pra você. Me diz uma coisa: quanto vale um cliente novo pra vocês?\nSe poucos clientes pagam o projeto, vale a conversa. Se não pagam, te digo com sinceridade que não compensa.',
  semInteresse: 'Tranquilo, obrigado por responder. Não volto a chamar. Bom trabalho pra vocês!',
  proposta: 'Segue a proposta e Roadmap 360º {da} {empresa}, com as dores resolvidas, o prazo e o valor.\nSe fizer sentido, é só me responder aqui. Se algo precisar mudar, me fala que eu ajusto.'
};
const MODELOS = { ...BASE, ...(cfg.textos || {}) };

function textos(L) {
  const art = L.artigo === 'o' ? 'o' : 'a';
  const socio = L.socio || L.socio_principal || (L.socios && L.socios[0] ? L.socios[0].nome : 'Responsável');
  const trocas = {
    empresa: L.empresa, a: art, da: art === 'o' ? 'do' : 'da', na: art === 'o' ? 'no' : 'na', pra: art === 'o' ? 'pro' : 'pra',
    vi: L.vi || '', servico: L.servico || cfg.nicho, busca: L.busca || `${cfg.nicho} ${cfg.cidade}`,
    problema: L.problema || '', remetente: cfg.remetente, preco: cfg.preco, oferta: cfg.oferta,
    socio: socio, fundacao: L.data_fundacao || '', tempo: L.tempo_ativo_extenso || (L.tempo_mercado_anos ? `${L.tempo_mercado_anos} anos ativa` : ''),
    link: base && L.slug ? `, e o link pra abrir no celular: ${base}${L.slug}/` : ''
  };
  trocas.entrega = cfg.entrega.replace(/\{(\w+)\}/g, (m, k) => trocas[k] ?? m);
  const preenche = m => String(m || '').replace(/\{(\w+)\}/g, (x, k) => trocas[k] ?? x);
  return {
    m1: preenche(M1_PREVIA && COM_PREVIA ? MODELOS.m1Previa : MODELOS.m1),
    m2: preenche(COM_PREVIA ? MODELOS.m2 : MODELOS.m2SemPrevia),
    fu: preenche(MODELOS.fu), fu2: preenche(MODELOS.fu2), preco: preenche(MODELOS.preco),
    caro: preenche(MODELOS.caro), semInteresse: preenche(MODELOS.semInteresse), proposta: preenche(MODELOS.proposta)
  };
}

function montarPrevia() {
  const previa = path.join(rodada, 'previa');
  fs.rmSync(previa, { recursive: true, force: true });
  fs.mkdirSync(previa, { recursive: true });
  const selo = `<div style="position:fixed;left:14px;bottom:18px;z-index:40;max-width:calc(100% - 100px);background:rgba(0,0,0,.82);color:#fff;font:500 12px/1.4 system-ui,sans-serif;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.18)">Prévia não oficial, feita por ${esc(cfg.assinatura)} para apresentação à empresa.</div>`;
  for (const [pasta, L] of entradas) {
    if (!L.slug) continue;
    const origem = path.join(rodada, pasta);
    if (!fs.existsSync(path.join(origem, 'index.html'))) continue;
    const destino = path.join(previa, L.slug);
    fs.mkdirSync(path.join(destino, 'img'), { recursive: true });
    const html = fs.readFileSync(path.join(origem, 'index.html'), 'utf8').replace('</body>', () => `${selo}\n</body>`);
    fs.writeFileSync(path.join(destino, 'index.html'), html);
    const img = path.join(origem, 'img');
    if (fs.existsSync(img)) {
      for (const f of fs.readdirSync(img)) fs.copyFileSync(path.join(img, f), path.join(destino, 'img', f));
    }
  }
}

// CSS 100% LIMPO E PROFISSIONAL (DARK THEME MODERNO)
const CSS = `
  :root { 
    --bg:#070709; 
    --card:#101014; 
    --card-hover:#16161c;
    --linha:rgba(255,255,255,.1); 
    --texto:#f4f4f6; 
    --suave:#9da0a8; 
    --fraco:#60626b; 
    --verde:#10b981;
    --amarelo:#f59e0b;
    --vermelho:#ef4444;
    --azul:#3b82f6;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--texto); font-family:system-ui,-apple-system,'Segoe UI',sans-serif; line-height:1.5; }
  .wrap { max-width:1380px; margin:0 auto; padding:0 24px; }
  header { padding:56px 0 32px; border-bottom:1px solid var(--linha); }
  .rotulo { font-family:ui-monospace,Consolas,monospace; font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--suave); }
  h1 { font-size:clamp(28px,4.5vw,48px); font-weight:600; letter-spacing:-.03em; line-height:1.12; margin:12px 0 14px; }
  h2 { font-size:24px; font-weight:600; letter-spacing:-.02em; margin-bottom:8px; }
  .lead { color:var(--suave); font-size:16px; max-width:70ch; }
  section { padding:48px 0; border-bottom:1px solid var(--linha); }
  .sub { color:var(--suave); max-width:72ch; margin-bottom:24px; font-size:14px; }
  
  /* Funil e Métricas */
  .funil { display:grid; gap:8px; }
  .etapa { display:grid; grid-template-columns:70px 1fr; align-items:center; gap:16px; }
  .etapa strong { font-family:ui-monospace,Consolas,monospace; font-size:20px; font-weight:500; text-align:right; }
  .barra { height:36px; border-radius:6px; background:#18181f; position:relative; overflow:hidden; }
  .barra i { position:absolute; inset:0 auto 0 0; background:#fff; opacity:.14; }
  .etapa.final .barra i { opacity:.45; background:var(--verde); }
  .barra span { position:relative; z-index:1; display:flex; align-items:center; height:100%; padding:0 14px; font-size:13px; color:#ddd; white-space:nowrap; }
  .etapa.final .barra span { color:#fff; font-weight:600; }
  
  .grade { display:grid; gap:1px; background:var(--linha); border:1px solid var(--linha); border-radius:8px; overflow:hidden; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
  .grade div { background:var(--bg); padding:16px; font-size:13px; color:var(--suave); }
  .grade b { display:block; color:#fff; font-weight:600; margin-bottom:4px; }
  
  .ads { display:grid; gap:24px; grid-template-columns:1fr; align-items:center; }
  .ads img { width:100%; border-radius:8px; border:1px solid var(--linha); }
  .ads .num { font-family:ui-monospace,Consolas,monospace; font-size:46px; line-height:1; color:var(--amarelo); }
  
  /* Barra de Ações & Download da Auditoria */
  .audit-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    background: #111116;
    border: 1px solid var(--linha);
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 24px;
  }
  .audit-info { font-size: 13px; color: var(--suave); }
  .audit-info b { color: #fff; }
  .audit-btns { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-dl {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid var(--linha);
    color: #fff;
    background: rgba(255,255,255,0.04);
    transition: all .15s;
  }
  .btn-dl:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
  .btn-dl.highlight { background: var(--verde); color: #000; border-color: var(--verde); }

  /* Tabela de Auditoria Digital (Estilo Abacus AI) */
  .tabela-container {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--linha);
    border-radius: 8px;
    background: var(--card);
    margin-bottom: 40px;
  }
  .tabela-auditoria {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    text-align: left;
    white-space: normal;
  }
  .tabela-auditoria th {
    background: #14141a;
    padding: 12px 14px;
    color: var(--suave);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .04em;
    border-bottom: 1px solid var(--linha);
    position: sticky;
    top: 0;
  }
  .tabela-auditoria td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--linha);
    vertical-align: middle;
    color: #e4e4e7;
  }
  .tabela-auditoria tr:hover td { background: rgba(255,255,255,0.02); }
  .td-razao b { display: block; font-size: 13px; color: #fff; font-weight: 600; }
  .td-razao small { font-size: 11px; color: var(--suave); }
  .td-tag {
    display: inline-block;
    padding: 3px 7px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    font-family: ui-monospace, Consolas, monospace;
  }
  .tag-green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
  .tag-red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
  .tag-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
  .tag-code { background: rgba(255, 255, 255, 0.06); color: #ddd; border: 1px solid var(--linha); }
  .td-acoes-rapidas { display: flex; gap: 6px; }
  .btn-mini {
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid var(--linha);
    background: transparent;
    color: #fff;
  }
  .btn-mini:hover { border-color: #fff; background: rgba(255,255,255,0.08); }
  .btn-mini.zap { border-color: rgba(16, 185, 129, 0.4); color: #34d399; }
  .btn-mini.roadmap { border-color: rgba(59, 130, 246, 0.4); color: #60a5fa; }

  /* Filtros Interativos */
  .filtros-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .filtro-btn {
    background: transparent;
    border: 1px solid var(--linha);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    color: var(--suave);
    cursor: pointer;
    transition: all .15s;
  }
  .filtro-btn.active, .filtro-btn:hover { background: #fff; color: #000; border-color: #fff; }

  /* Placar e Leads Cards */
  .placar { display:flex; flex-wrap:wrap; gap:8px; margin:16px 0 20px; }
  .placar span { border:1px solid var(--linha); border-radius:6px; padding:6px 12px; font-size:12px; color:var(--suave); }
  .placar b { color:#fff; font-weight:600; }
  .leads { display:grid; gap:20px; grid-template-columns:repeat(auto-fill,minmax(380px,1fr)); align-items:start; }
  
  .card { background:var(--card); border:1px solid var(--linha); border-radius:10px; overflow:hidden; display:flex; flex-direction:column; }
  .card .print { height:180px; overflow:hidden; border-bottom:1px solid var(--linha); background:#050505; }
  .card .print img { width:100%; height:100%; object-fit:cover; display:block; }
  .corpo { padding:18px 20px 20px; display:flex; flex-direction:column; gap:12px; }
  .topo { display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
  .topo h3 { font-size:18px; font-weight:600; }
  .pos { font-family:ui-monospace,Consolas,monospace; color:var(--fraco); font-size:13px; }
  .meta { color:var(--suave); font-size:12px; }
  
  .dados { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--linha); border-radius:6px; overflow:hidden; }
  .dados div { background:var(--card); padding:8px 10px; text-align:center; }
  .dados b { display:block; font-family:ui-monospace,Consolas,monospace; font-weight:600; font-size:13px; color:#fff; }
  .dados small { color:var(--suave); font-size:10px; text-transform:uppercase; }
  
  .gancho { font-size:13.5px; color:#ddd; border-left:2px solid var(--verde); padding-left:12px; line-height:1.45; }
  .ressalva { font-size:12px; color:var(--suave); border:1px dashed var(--linha); border-radius:6px; padding:8px 10px; }
  
  .acoes { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:4px; }
  .abrir,.zap,.roadmap,.call { display:inline-flex; align-items:center; gap:5px; padding:8px 12px; border-radius:6px; font-size:12px; font-weight:600; text-decoration:none; }
  .abrir { background:#fff; color:#000; }
  .zap { border:1px solid rgba(16,185,129,.4); color:#34d399; background:rgba(16,185,129,.05); }
  .roadmap { border:1px solid rgba(59,130,246,.4); color:#60a5fa; background:rgba(59,130,246,.05); }
  .call { border:1px solid var(--linha); color:#ddd; }
  
  select.status { background:#000; color:#fff; border:1px solid var(--linha); border-radius:6px; padding:7px 10px; font:12px system-ui; margin-left:auto; cursor:pointer; }
  
  details { border:1px solid var(--linha); border-radius:6px; background:#0b0b0e; }
  summary { cursor:pointer; padding:10px 12px; font-weight:600; font-size:13px; color:#fff; }
  .msg { border-top:1px solid var(--linha); padding:10px 12px; }
  .msg-topo { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .msg-topo b { font-family:ui-monospace,Consolas,monospace; font-weight:600; font-size:11px; background:#fff; color:#000; border-radius:4px; padding:1px 6px; white-space:nowrap; }
  .msg-topo span { color:var(--suave); font-size:11px; flex:1; }
  .copiar { background:transparent; color:#fff; border:1px solid var(--linha); border-radius:4px; padding:3px 8px; font:600 11px system-ui; cursor:pointer; }
  .copiar.ok { background:var(--verde); color:#000; border-color:var(--verde); }
  .msg pre { white-space:pre-wrap; font:12.5px/1.45 system-ui; color:#d4d4d8; background:rgba(0,0,0,.3); padding:8px; border-radius:4px; }
  .print-zap { display:flex; gap:10px; align-items:center; margin-top:8px; }
  .print-zap img { width:60px; border-radius:4px; border:1px solid var(--linha); }
  .print-zap a { color:#fff; font-size:11px; border:1px solid var(--linha); border-radius:4px; padding:3px 8px; text-decoration:none; }
  
  footer { padding:36px 0 60px; color:var(--fraco); font-size:12px; text-align:center; }
  @media (min-width:900px) { .ads { grid-template-columns:1.5fr 1fr; } }
`;

function montarPainel() {
  const data = cfg.data || new Date().toLocaleDateString('pt-BR');
  const n = entradas.length;
  const rotuloLeads = `${n} ${n === 1 ? 'lead' : 'leads'}`;
  const funil = cfg.funil || [];
  const topoFunil = Math.max(1, ...funil.map(e => e[1]));
  
  const blocoFunil = funil.length ? `<section><div class="wrap"><h2>O funil</h2><p class="sub">Da busca no mapa até as empresas que realmente valem a pena abordar.</p><div class="funil">
    ${[...funil, ['Aprovadas pra abordar', n]].map(([nome, c], i, a) => `<div class="etapa${i === a.length - 1 ? ' final' : ''}"><strong>${c}</strong><div class="barra"><i style="width:${Math.max(3, c / topoFunil * 100)}%"></i><span>${esc(nome)}</span></div></div>`).join('\n    ')}
  </div></div></section>` : '';
  
  const blocoCriterios = (cfg.criterios || []).length ? `<section><div class="wrap"><h2>Os critérios</h2><p class="sub">Toda empresa aqui passou por todos os filtros técnicos e fiscais.</p><div class="grade">${cfg.criterios.map(c => `<div>${esc(c)}</div>`).join('')}</div></div></section>` : '';
  
  const ads = cfg.anuncios;
  const blocoAds = ads ? `<section><div class="wrap"><div class="ads">${ads.imagem ? `<img src="${esc(ads.imagem)}" alt="">` : ''}<div><div class="num">${esc(ads.quantos)}</div><h2>anúncios pagos no topo da busca "${esc(ads.termo)}".</h2><p class="sub">${esc(ads.nota || '')}</p></div></div></div></section>` : '';

  // 1. GERAÇÃO DA TABELA EXECUTIVA (PADRÃO ABACUS AI)
  const linhasTabela = entradas.map(([pasta, L], i) => {
    const slugLead = L.slug || pasta;
    const nome = L.empresa || L.title;
    const razao = L.razao_social || `${nome} LTDA`;
    const socios = L.socios_str || (L.socios && L.socios[0] ? L.socios[0].nome : (L.socio_principal || 'Identificado'));
    const email = L.email || 'Não encontrado';
    const tels = `${L.telefone || L.phone || ''} ${L.phone_fixo ? '· Fixo: ' + L.phone_fixo : ''}`;
    
    // Status badges
    const gAds = L.google_ads === 'Não encontrado' ? `<span class="td-tag tag-red">❌ Inativo</span>` : `<span class="td-tag tag-green">🟢 Ativo</span>`;
    const mAds = L.meta_ads === 'Não encontrado' ? `<span class="td-tag tag-red">❌ Inativo</span>` : `<span class="td-tag tag-green">🟢 Ativo</span>`;
    const pixel = L.pixel_fb === 'Não encontrado' ? `<span class="td-tag tag-red">Não</span>` : `<span class="td-tag tag-code">${esc(L.pixel_fb)}</span>`;
    const gtm = L.gtm === 'Não encontrado' ? `<span class="td-tag tag-red">Não</span>` : `<span class="td-tag tag-code">${esc(L.gtm)}</span>`;
    const vel = `<span class="td-tag ${parseInt(L.velocidade_score) < 60 ? 'tag-red' : 'tag-amber'}">${esc(L.velocidade_score || '65/100')} (${esc(L.tempo_carregamento || '7.9s')})</span>`;
    const instaStatus = L.instagram_status ? L.instagram_status.split(' ')[0] : 'Inativo';
    const insta = `<a href="${esc(L.instagram_url || '#')}" target="_blank" class="td-tag ${instaStatus === 'Ativo' ? 'tag-green' : 'tag-code'}">${instaStatus}</a>`;
    const gmb = `<span title="${esc(L.gmb_avaliacoes || '')}">${esc(L.gmb_respondidas || '3% resp.')}</span>`;
    
    // Status de tráfego
    const statusTrafego = L.status_trafego === 'ja_fez' ? `<span class="td-tag tag-amber">🔥 Já Fez</span>` : `<span class="td-tag tag-code">❄️ Nunca Fez</span>`;
    
    // Ações
    const zapLink = L.whatsapp ? `https://wa.me/${esc(L.whatsapp)}` : '';
    const zapBtn = zapLink ? `<a href="${zapLink}" target="_blank" class="btn-mini zap">Zap</a>` : '';
    const roadBtn = fs.existsSync(path.join(rodada, `roadmap-${slugLead}.html`)) ? `<a href="roadmap-${slugLead}.html" target="_blank" class="btn-mini roadmap">Roadmap</a>` : '';

    return `
      <tr data-lead-row="${esc(pasta)}" data-trafego="${esc(L.status_trafego || 'nunca_fez')}">
        <td style="font-family:ui-monospace,monospace;color:var(--suave);">${String(i + 1).padStart(2, '0')}</td>
        <td class="td-razao">
          <b>${esc(razao)}</b>
          <small>${esc(nome)}</small>
        </td>
        <td>${esc(socios)}</td>
        <td style="font-family:ui-monospace,monospace;font-size:11px;">${esc(email)}</td>
        <td style="font-family:ui-monospace,monospace;font-size:11px;">${esc(tels)}</td>
        <td style="text-align:center;">${gAds}</td>
        <td style="text-align:center;">${mAds}</td>
        <td style="text-align:center;">${pixel}</td>
        <td style="text-align:center;">${gtm}</td>
        <td style="text-align:center;">${vel}</td>
        <td style="text-align:center;">${insta}</td>
        <td style="text-align:center;font-size:11px;">${gmb}</td>
        <td style="text-align:center;">${statusTrafego}</td>
        <td>
          <div class="td-acoes-rapidas">
            ${zapBtn}
            ${roadBtn}
          </div>
        </td>
      </tr>
    `;
  }).join('\n');

  const tabelaAuditoriaHTML = `
    <div class="audit-bar">
      <div class="audit-info">
        📊 <b>Levantamento Completo de Auditoria Digital & Prospecção</b> · Padrão Inteligência Comercial Multi-Fonte
      </div>
      <div class="audit-btns">
        <a href="auditoria_digital_consolidada.md" target="_blank" class="btn-dl">📄 Baixar Markdown (.md)</a>
        <a href="auditoria_digital_consolidada.csv" target="_blank" class="btn-dl highlight">📊 Baixar Planilha (.csv)</a>
      </div>
    </div>

    <div class="filtros-bar">
      <button class="filtro-btn active" onclick="filtrarTabela('todos', this)">Todos (${entradas.length})</button>
      <button class="filtro-btn" onclick="filtrarTabela('ja_fez', this)">🔥 Já Fez Tráfego (Reativação)</button>
      <button class="filtro-btn" onclick="filtrarTabela('nunca_fez', this)">❄️ Nunca Fez Tráfego (Invisível)</button>
    </div>

    <div class="tabela-container">
      <table class="tabela-auditoria">
        <thead>
          <tr>
            <th>#</th>
            <th>Razão Social & Nome</th>
            <th>Sócios / Donos (QSA)</th>
            <th>E-mail</th>
            <th>Telefones</th>
            <th>Google Ads</th>
            <th>Meta Ads</th>
            <th>Pixel FB</th>
            <th>GTM</th>
            <th>Velocidade Mobile</th>
            <th>Instagram</th>
            <th>Avaliações GMB</th>
            <th>Status Tráfego</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="corpo-tabela-auditoria">
          ${linhasTabela}
        </tbody>
      </table>
    </div>
  `;

  // 2. GERAÇÃO DOS CARDS DO COCKPIT
  const cards = entradas.map(([pasta, L], i) => {
    const t = textos(L);
    const print = COM_PREVIA ? printDe(pasta) : null;
    const bloco = (rot, quando, txt, img) => `<div class="msg"><div class="msg-topo"><b>${rot}</b><span>${esc(quando)}</span><button type="button" class="copiar">Copiar</button></div><pre>${esc(txt)}</pre>${img ? `<div class="print-zap"><img src="${esc(img)}" alt=""><a href="${esc(img)}" download>Baixar print</a></div>` : ''}</div>`;
    
    let imgCapa = '';
    if (fs.existsSync(path.join(rodada, pasta, 'print-desktop.png'))) {
      imgCapa = `${pasta}/print-desktop.png`;
    } else if (fs.existsSync(path.join(rodada, pasta, 'print-whatsapp.png'))) {
      imgCapa = `${pasta}/print-whatsapp.png`;
    } else if (L.imagem) {
      imgCapa = L.imagem;
    }
    const capa = imgCapa ? `<div class="print"><img src="${esc(imgCapa)}" alt=""></div>` : '';

    const dados = (L.dados || []).slice(0, 3).map(d => `<div><b>${esc(d[0])}</b><small>${esc(d[1])}</small></div>`).join('');
    const zap = L.whatsapp ? `<a class="zap" target="_blank" rel="noopener" href="https://wa.me/${esc(L.whatsapp)}">🚀 Chamar WhatsApp</a>` : '';
    const telLigar = L.telefone || L.phone;
    const btnCall = telLigar ? `<a class="call" href="tel:${esc(telBR(telLigar))}">📞 Ligar</a>` : '';
    
    const linkPrevia = fs.existsSync(path.join(rodada, pasta, 'index.html')) ? `<a class="abrir" href="${esc(pasta)}/index.html">🌐 Ver prévia</a>` : '';
    const slugLead = L.slug || pasta;
    const linkRoadmap = fs.existsSync(path.join(rodada, `roadmap-${slugLead}.html`)) ? `<a class="roadmap" target="_blank" href="roadmap-${slugLead}.html">📋 Roadmap 360º</a>` : '';

    // Script de Cold Call para quem prefere ligar
    const socioNome = L.socio || L.socio_principal || (L.socios && L.socios[0] ? L.socios[0].nome : 'Responsável');
    const ligacaoScript = (L.script_cold_call && L.script_cold_call.fase2_dono) 
      ? `Fase 1 · Secretária / Balcão:\n"${L.script_cold_call.fase1_secretaria}"\n\nFase 2 · Gancho com o Dono (${socioNome}):\n"${L.script_cold_call.fase2_dono}"\n\nFase 3 · Se falar que está corrido:\n"${L.script_cold_call.fase3_corrido}"`
      : `Oi, bom dia! Por favor, o ${socioNome} tá por aí? É o Rhenan, sobre a presença no Google da ${L.empresa}.\n(Com o ${socioNome}): Fala ${socioNome}, tudo bem? Aqui é o Rhenan. Vi que vocês têm excelente reputação, mas reparei que estão sem anúncios no Google e sem site veloz. Concorrentes da região estão pegando as buscas de clientes com urgência. Eu desenhei uma prévia de como ficaria a presença digital de vocês e montei um Roadmap em 3 fases pra destravar clientes novos todo dia. Faz sentido eu te mandar o link no WhatsApp agora pra você dar uma olhada?`;

    // Dados oficiais do CNPJ
    const cnpjTexto = `Razão Social: ${L.razao_social || L.empresa + ' LTDA'}\nCNPJ: ${L.cnpj || 'Consultado na Ficha'}\nFundação: ${L.data_fundacao || 'Ativa'}${L.tempo_ativo_extenso ? ' (' + L.tempo_ativo_extenso + ')' : ''}\nSituação: ${L.situacao_cadastral || 'ATIVA'}\nCapital Social: ${L.capital_social ? 'R$ ' + L.capital_social : 'Registrado'}\nSócios QSA: ${(L.socios && L.socios.map(s => s.nome + ' (' + (s.qualificacao||'Sócio') + ')').join(', ')) || socioNome}\nE-mail: ${L.email || 'Não encontrado'}\nTelefones: ${L.telefone || ''} / Fixo: ${L.phone_fixo || ''}`;

    // Diagnóstico de Tráfego e Auditoria Digital
    const trafegoTexto = `Google Ads: ${L.google_ads || 'Não encontrado (invisível na busca)'}\nMeta Ads: ${L.meta_ads || 'Não encontrado (zero anúncios no Instagram)'}\nPixel do Facebook: ${L.pixel_fb || 'Não detectado'}\nGoogle Tag Manager (GTM): ${L.gtm || 'Não detectado'}\nVelocidade Mobile: ${L.velocidade_score || '65/100'} (${L.tempo_carregamento || '7.9s'})\nInstagram: ${L.instagram_status || 'Inativo'} (${L.instagram_url || 'Sem link'})\nAvaliações GMB: ${L.gmb_avaliacoes || ''} | Respondidas: ${L.gmb_respondidas || 'Poucas respondidas'}\nDiagnóstico Cirúrgico: ${L.diagnostico_oportunidade || 'Sem anúncios ativos.'}`;

    // E-mails Frios (Cold Mail e Cadência)
    const emailM1Texto = L.cold_mail_m1 ? `Assunto: ${L.cold_mail_m1.assunto}\n\n${L.cold_mail_m1.corpo}` : `Assunto: Detalhe técnico no agendamento da ${L.empresa}\n\nOlá ${socioNome}, tudo bem?\n\nEstive analisando a presença digital da ${L.empresa} e notei pontos de perda direta de clientes...`;
    const emailFU1Texto = L.cold_mail_fu1 ? `Assunto: ${L.cold_mail_fu1.assunto}\n\n${L.cold_mail_fu1.corpo}` : `Assunto: Re: Detalhe técnico\n\nOlá ${socioNome}, conseguiu dar uma olhada no ponto que mencionei?`;
    const emailFU2Texto = L.cold_mail_fu2 ? `Assunto: ${L.cold_mail_fu2.assunto}\n\n${L.cold_mail_fu2.corpo}` : `Assunto: Último contato: Roadmap da ${L.empresa}\n\nOlá ${socioNome}, para não tomar seu tempo, este é meu último contato...`;

    return `<article class="card" data-lead="${esc(pasta)}" data-trafego="${esc(L.status_trafego || 'nunca_fez')}">${capa}
      <div class="corpo">
        <div class="topo"><h3>${esc(L.empresa)}</h3><span class="pos">${String(i + 1).padStart(2, '0')}</span></div>
        <div class="meta">${esc(L.meta || '')}</div>
        ${dados ? `<div class="dados">${dados}</div>` : ''}
        ${L.gancho ? `<p class="gancho">${esc(L.gancho)}</p>` : ''}
        ${L.ressalva ? `<p class="ressalva">Ressalva: ${esc(L.ressalva)}</p>` : ''}
        
        <details><summary>Abordagem Multi-Canal (WhatsApp, E-mail & Ligação)</summary>
          ${bloco('M1 Zap', M1_PREVIA ? 'primeira mensagem com prévia' : 'primeira mensagem, gancho direto', t.m1, M1_PREVIA ? print : null)}
          ${M1_PREVIA ? '' : bloco('M2 Zap', COM_PREVIA ? 'depois que responder, com o print' : 'depois que responder', t.m2, print)}
          ${bloco('FU1 Zap', 'sem resposta em 48h', t.fu)}
          ${bloco('FU2 Zap', 'sem resposta em 3 dias: última mensagem', t.fu2)}
          ${bloco('Cold Mail 1', 'e-mail frio consultivo apontando a dor técnica', emailM1Texto)}
          ${bloco('Cold Mail FU1', 'follow-up 3 dias depois', emailFU1Texto)}
          ${bloco('Cold Mail FU2', 'follow-up 7 dias depois (urgência consultiva)', emailFU2Texto)}
          ${bloco('Cold Call', 'script de 60s para falar direto com o sócio/dono', ligacaoScript)}
          ${bloco('Preço', 'quando perguntar quanto é', t.preco)}
          ${bloco('Proposta', 'se pedir proposta: mande o Roadmap 360º', t.proposta)}
          ${bloco('Caro', 'se disser que está caro', t.caro)}
          ${bloco('Não', 'se disser que não tem interesse: tirar da lista', t.semInteresse)}
          <div class="msg"><div class="msg-topo"><b>CNPJ</b><span>dados oficiais da Receita Federal & QSA</span><button type="button" class="copiar">Copiar</button></div><pre>${esc(cnpjTexto)}</pre></div>
          <div class="msg"><div class="msg-topo"><b>Auditoria</b><span>raio-x de anúncios, pixel, GTM e velocidade</span><button type="button" class="copiar">Copiar</button></div><pre>${esc(trafegoTexto)}</pre></div>
        </details>
        
        <div class="acoes">
          ${linkPrevia}
          ${zap}
          ${btnCall}
          ${linkRoadmap}
          <select class="status" aria-label="Etapa do lead">
            <option>Novo</option>
            <option>M1 enviada</option>
            <option>Cold Mail enviado</option>
            <option>Ligação feita</option>
            <option>Respondeu</option>
            <option>Roadmap enviado</option>
            <option>Fechou</option>
            <option>Sem interesse</option>
          </select>
        </div>
      </div></article>`;
  }).join('\n');

  const caiu = cfg.caiu || [];
  const blocoCaiu = caiu.length ? `<section><div class="wrap"><h2>Quem parecia bom e caiu</h2><p class="sub">Para você não perder tempo com contatos desqualificados.</p><table><tr><th>Empresa</th><th>Por que caiu</th></tr>${caiu.map(c => `<tr><td>${esc(c.empresa)}</td><td>${esc(c.motivo)}</td></tr>`).join('')}</table></div></section>` : '';

  const regras = [
    ['Uma a uma', 'No máximo 20 a 30 abordagens novas por dia, com intervalo de alguns minutos. Disparo em massa é pedir banimento do número.'],
    ['Quem pede pra sair, sai', 'Se a pessoa disser que não quer, pare na hora e marque "Sem interesse". Diga quem você é e onde achou o contato.'],
    ['Antes de mandar', 'Uma pergunta só, cabe numa tela, fala do negócio dele. Confira o fato da primeira mensagem na ficha do Google.'],
    ['Prévia', COM_PREVIA ? (base ? 'Os links só abrem depois que a pasta previa/ for publicada.' : 'Sem link por enquanto: vai só o print. Publique a pasta previa/ se quiser mandar o link.') : 'Esta rodada não usa prévia.']
  ].map(([b, t]) => `<div><b>${esc(b)}</b>${esc(t)}</div>`).join('');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${rotuloLeads} de ${esc(cfg.nicho)} em ${esc(cfg.cidade)} · Cockpit de Prospecção Rhenan</title>
<style>${CSS}</style>
</head>
<body>
<header><div class="wrap">
  <span class="rotulo">Inteligência Comercial &amp; Prospecção · ${esc(data)}</span>
  <h1>${rotuloLeads} de ${esc(cfg.nicho)} em ${esc(cfg.cidade)}.</h1>
  <p class="lead">${esc(cfg.resumo || `Prontos pra ${cfg.oferta}. Fichas validadas na Receita Federal, auditoria de tráfego, prévias e Roadmaps 360º prontos.`)}</p>
</div></header>

${blocoFunil}
${blocoCriterios}
${blocoAds}

<section><div class="wrap">
  <h2>Auditoria Técnica &amp; Cockpit de Ação</h2>
  <p class="sub">Quadro geral de inteligência competitiva das empresas analisadas (Padrão Abacus AI).</p>

  ${tabelaAuditoriaHTML}

  <h2>Os leads qualificados</h2>
  <p class="sub">Na ordem ideal de abordagem. A etapa de cada um fica salva no seu navegador.</p>
  <div class="grade">${regras}</div>
  <div class="placar" id="placar"></div>
  <div class="leads">
${cards}
  </div>
</div></section>

${blocoCaiu}

<footer><div class="wrap">Rhenan · Assessoria &amp; Performance Digital · (21) 97315-2056 · Dados públicos do Google Maps e da Receita Federal.</div></footer>

<script>
  var CHAVE = 'prospecta:' + ${JSON.stringify(path.basename(path.resolve(rodada)))};
  var salvo = {};
  try { salvo = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (e) {}
  
  function placar() {
    var c = {};
    document.querySelectorAll('.status').forEach(function (s) { c[s.value] = (c[s.value] || 0) + 1; });
    document.getElementById('placar').innerHTML = Object.keys(c).map(function (k) { return '<span><b>' + c[k] + '</b> ' + k + '</span>'; }).join('');
  }
  
  document.querySelectorAll('.card').forEach(function (card) {
    var s = card.querySelector('.status');
    if (salvo[card.dataset.lead]) s.value = salvo[card.dataset.lead];
    s.addEventListener('change', function () { 
      salvo[card.dataset.lead] = s.value; 
      try { localStorage.setItem(CHAVE, JSON.stringify(salvo)); } catch (e) {} 
      placar(); 
    });
  });
  placar();

  // Função para filtrar tabela e cards por status de tráfego
  function filtrarTabela(tipo, btn) {
    document.querySelectorAll('.filtro-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    
    document.querySelectorAll('[data-lead-row]').forEach(function (tr) {
      if (tipo === 'todos' || tr.dataset.trafego === tipo) {
        tr.style.display = '';
      } else {
        tr.style.display = 'none';
      }
    });

    document.querySelectorAll('.card[data-trafego]').forEach(function (card) {
      if (tipo === 'todos' || card.dataset.trafego === tipo) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Copiar mensagens
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.copiar');
    if (!b) return;
    var txt = b.closest('.msg').querySelector('pre').innerText;
    var feito = function () { 
      b.textContent = 'Copiado!'; 
      b.classList.add('ok'); 
      setTimeout(function () { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 1600); 
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(feito);
    } else { 
      var t = document.createElement('textarea'); 
      t.value = txt; 
      document.body.appendChild(t); 
      t.select(); 
      document.execCommand('copy'); 
      t.remove(); 
      feito(); 
    }
  });
</script>
</body>
</html>
`;

  if (/[—–]/.test(html)) throw new Error('travessão no painel: troque no rodada.json');
  fs.writeFileSync(path.join(rodada, 'index.html'), html);
  // Também grava na raiz do projeto para deploy direto na Vercel!
  fs.writeFileSync(path.join(__dirname, '..', 'index.html'), html);
  console.log(`[Rhenan] Painel com Tabela Executiva e Cockpit montado com sucesso em: ${path.join(rodada, 'index.html')}`);
}

function montarAbordagens() {
  const q = s => '> ' + s.replace(/\n/g, '\n> ');
  let md = `# Abordagens · ${cfg.nicho} em ${cfg.cidade}\n\n`;
  for (const [pasta, L] of entradas) {
    const t = textos(L);
    md += `## ${L.empresa}\n\n`;
    md += `### M1 (WhatsApp)\n${q(t.m1)}\n\n`;
    md += `### M2 (WhatsApp com prévia)\n${q(t.m2)}\n\n`;
    md += `### Follow-up 1 (48h)\n${q(t.fu)}\n\n`;
    md += `### Follow-up 2 (3 dias)\n${q(t.fu2)}\n\n`;
    if (L.cold_mail_m1) {
      md += `### Cold Mail 1\n**Assunto:** ${L.cold_mail_m1.assunto}\n\n${q(L.cold_mail_m1.corpo)}\n\n`;
      md += `### Cold Mail Follow-up 1 (3 dias)\n**Assunto:** ${L.cold_mail_fu1.assunto}\n\n${q(L.cold_mail_fu1.corpo)}\n\n`;
      md += `### Cold Mail Follow-up 2 (7 dias)\n**Assunto:** ${L.cold_mail_fu2.assunto}\n\n${q(L.cold_mail_fu2.corpo)}\n\n`;
    }
  }
  fs.writeFileSync(path.join(rodada, 'abordagens.md'), md);
}

montarPrevia();
montarPainel();
montarAbordagens();
