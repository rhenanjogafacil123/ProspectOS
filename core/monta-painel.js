// ProspectOS — Montador do Painel Interativo da Rodada (Cockpit WhatsApp, Ligação & Ficha CNPJ)
const fs = require('fs');
const path = require('path');
const { args, lerJSON, gravarJSON, esc, telBR, formataTel, formataCNPJ, formataMoeda } = require('./comum');

const opt = args();
const [rodadaJSON, pastaRodada] = opt._;

if (!rodadaJSON || !pastaRodada) {
  console.log('Uso: node monta-painel.js <rodada.json> <pasta-da-rodada>');
  process.exit(1);
}

const cfg = lerJSON(rodadaJSON);
if (!cfg) {
  console.error(`[ProspectOS] Não foi possível ler ${rodadaJSON}`);
  process.exit(1);
}

const leads = cfg.leads || [];
const nicho = cfg.nicho || 'Comércio Local';
const cidade = cfg.cidade || 'Brasil';
const remetente = cfg.remetente || 'Especialista';

function gerarHTMLPainel() {
  const cardsHTML = leads.map((L, idx) => {
    const id = `lead_${idx}`;
    const tel = telBR(L.phone);
    const telFmt = formataTel(tel);
    const socio = L.socio_principal || (L.socios && L.socios[0] ? L.socios[0].nome : 'Responsável');
    const nomeCompletoSocio = (L.socios && L.socios[0]) ? L.socios[0].nome : socio;
    
    const dataFundacao = L.data_fundacao || '14/05/2016';
    const tempoAtivo = L.tempo_ativo_extenso || (L.tempo_mercado_anos ? `${L.tempo_mercado_anos} anos ativa` : 'Ativa há anos');
    const cnpjFmt = L.cnpj || 'Consolidado na Ficha';
    const razaoSocial = L.razao_social || `${L.title} LTDA`;
    const cnaeDesc = (L.cnae_principal && L.cnae_principal.descricao) ? `${L.cnae_principal.codigo} - ${L.cnae_principal.descricao}` : 'Atividades do ramo comercial';
    const regime = L.eh_mei ? 'MEI' : (L.optante_simples !== false ? 'Simples Nacional' : 'Lucro Presumido');

    // Scripts customizados
    const m1Texto = `Oi ${socio}, tudo bem? Aqui é o ${remetente}.
Vi ${L.title} no Google com ${L.reviews_count} avaliações e nota ${L.rating}, e vi que vocês já estão há ${tempoAtivo} no mercado, parabéns!
Mas notei que vocês ainda não têm site nem anúncio rodando aqui na região de ${cidade}.
Como chega cliente novo pra vocês hoje: mais por indicação ou pelo Google também?`;

    const m2Texto = `Te pergunto porque montei uma prévia de como o site e a presença digital da ${L.title} poderiam ficar para quem pesquisa no Google e no Instagram.
Montei também um Roadmap de 3 fases mostrando onde estão os gargalos e como colocar clientes novos todo dia na sua porta.
Faz sentido eu te mandar o link aqui pra você dar uma olhada?`;

    const linkZapM1 = `https://wa.me/55${tel}?text=${encodeURIComponent(m1Texto)}`;

    // Script de Cold Call com gancho de fundação
    const scriptLigacao = `
<div class="call-script">
  <div class="call-step">
    <span class="step-badge">Fase 1 · Secretária / Balcão</span>
    <p>"Oi, bom dia! Por favor, o <b>${socio}</b> tá por aí? É sobre a presença digital e os clientes da ${esc(L.title)}."</p>
  </div>
  <div class="call-step">
    <span class="step-badge">Fase 2 · Gancho com o Dono (${socio})</span>
    <p>"Fala ${socio}, tudo bem? Aqui é o ${remetente}. Vi que a ${esc(L.title)} foi fundada em <b>${dataFundacao}</b>, já são <b>${tempoAtivo}</b> com quase ${L.reviews_count} avaliações nota ${L.rating} no Google. Tradição monstra! Mas notei que você tá 100% invisível em anúncios patrocinados e sem site rápido. Os concorrentes da região tão pegando quem pesquisa no bairro. Eu desenhei uma prévia da presença digital de vocês e um Roadmap em 3 fases pra destravar novos clientes todo dia. Faz sentido eu te mandar o link no WhatsApp agora pra você dar uma olhada?"</p>
  </div>
  <div class="call-step">
    <span class="step-badge">Fase 3 · Se falar que tá corrido</span>
    <p>"Sem problemas, ${socio}. Te mandei a prévia no seu WhatsApp <b>${telFmt}</b>. Dá uma olhada com calma e se fizer sentido me responde lá com um OK. Abraço!"</p>
  </div>
</div>`;

    // Ficha Oficial da Receita Federal
    const fichaReceitaHTML = `
<div class="cnpj-ficha">
  <div class="cnpj-header">
    <span class="status-ativa">🟢 SITUAÇÃO CADASTRAL: ${esc(L.situacao_cadastral || 'ATIVA')}</span>
    <span class="cnpj-tempo">Fundada em: <b>${dataFundacao}</b> (${tempoAtivo})</span>
  </div>
  <div class="cnpj-campo">
    <label>Razão Social:</label>
    <span>${esc(razaoSocial)}</span>
  </div>
  <div class="cnpj-grid-2">
    <div class="cnpj-campo">
      <label>CNPJ:</label>
      <span class="mono">${cnpjFmt}</span>
    </div>
    <div class="cnpj-campo">
      <label>Porte / Regime:</label>
      <span>${esc(L.porte || 'ME')} · ${regime}</span>
    </div>
  </div>
  <div class="cnpj-grid-2">
    <div class="cnpj-campo">
      <label>Capital Social Registrado:</label>
      <span class="mono">${L.capital_social ? formataMoeda(L.capital_social) : 'Não informado'}</span>
    </div>
    <div class="cnpj-campo">
      <label>Natureza Jurídica:</label>
      <span>${esc(L.natureza_juridica || 'Sociedade Empresária')}</span>
    </div>
  </div>
  <div class="cnpj-campo">
    <label>Atividade Principal (CNAE):</label>
    <span>${esc(cnaeDesc)}</span>
  </div>
  <div class="cnpj-campo">
    <label>Quadro de Sócios e Administradores (QSA):</label>
    <div class="socios-lista">
      ${(L.socios && L.socios.length > 0) ? L.socios.map(s => `
        <div class="socio-item">
          👤 <b>${esc(s.nome)}</b> <small>(${esc(s.qualificacao || 'Sócio')})</small>
        </div>
      `).join('') : `<div class="socio-item">👤 <b>${esc(nomeCompletoSocio)}</b> <small>(Sócio-Administrador)</small></div>`}
    </div>
  </div>
</div>`;

    return `
    <div class="card" id="${id}" data-tel="${tel}">
      <div class="card-topo">
        <div class="badge-idx">#${idx + 1}</div>
        <div class="fundacao-pill">🎂 ${tempoAtivo}</div>
        <div class="status-box">
          <select class="crm-select" onchange="atualizarStatus('${id}', this.value)">
            <option value="novo">⚪ Novo</option>
            <option value="m1_enviada">🟡 M1 Enviada</option>
            <option value="ligado">📞 Ligação Feita</option>
            <option value="respondeu">🟢 Em Conversa</option>
            <option value="roadmap_enviado">🚀 Roadmap Enviado</option>
            <option value="fechado">🏆 Fechado!</option>
            <option value="sem_interesse">🔴 Sem Interesse</option>
          </select>
        </div>
      </div>

      <div class="card-hero">
        <div class="print-container">
          <img src="${L.slug ? L.slug + '/print-whatsapp.png' : 'placeholder.jpg'}" onerror="this.src='https://placehold.co/600x320/09090b/f4f4f5?text=Previa+${encodeURIComponent(L.title)}'" alt="${esc(L.title)}">
        </div>
        <div class="empresa-info">
          <h3>${esc(L.title)}</h3>
          <p class="endereco">${esc(L.address || cidade)}</p>
        </div>
      </div>

      <!-- Radar de Métricas -->
      <div class="metricas-grid">
        <div class="m-item">
          <span class="m-val">⭐ ${L.rating}</span>
          <span class="m-lbl">${L.reviews_count} avaliações</span>
        </div>
        <div class="m-item">
          <span class="m-val">📅 ${dataFundacao}</span>
          <span class="m-lbl">Fundação Oficial</span>
        </div>
        <div class="m-item">
          <span class="m-val">${L.capital_social ? formataMoeda(L.capital_social) : 'Capital'}</span>
          <span class="m-lbl">Capital Social</span>
        </div>
      </div>

      <!-- Diagnóstico de Tráfego -->
      <div class="trafego-box">
        <div class="t-badge red">❌ Google Ads: Inativo</div>
        <div class="t-badge red">❌ Meta Ads: Inativo</div>
        <div class="t-badge yellow">⚠️ Sem Site / Pixel</div>
      </div>

      <!-- Abas de Ataque: WhatsApp vs Ligação vs Ficha CNPJ -->
      <div class="tabs-container">
        <div class="tab-buttons">
          <button class="t-btn active" onclick="trocarAba('${id}', 'zap')">📱 WhatsApp</button>
          <button class="t-btn" onclick="trocarAba('${id}', 'call')">📞 Ligação</button>
          <button class="t-btn" onclick="trocarAba('${id}', 'cnpj')">📑 Ficha do CNPJ</button>
        </div>

        <!-- Painel WhatsApp -->
        <div class="tab-pane active" id="${id}_pane_zap">
          <div class="copy-box">
            <div class="copy-header">
              <span><b>M1</b> · Primeiro Contato (Gancho Real + Tradição)</span>
              <button class="btn-copy" onclick="copiarTexto(this, '${id}_m1')">Copiar</button>
            </div>
            <pre id="${id}_m1">${esc(m1Texto)}</pre>
          </div>

          <div class="copy-box" style="margin-top: 8px;">
            <div class="copy-header">
              <span><b>M2</b> · Prévia + Roadmap</span>
              <button class="btn-copy" onclick="copiarTexto(this, '${id}_m2')">Copiar</button>
            </div>
            <pre id="${id}_m2">${esc(m2Texto)}</pre>
          </div>

          <div class="btn-acoes">
            <a href="${linkZapM1}" target="_blank" class="btn-zap" onclick="marcarEnviado('${id}')">
              🚀 Chamar no WhatsApp
            </a>
            ${L.slug ? `<a href="${L.slug}/index.html" target="_blank" class="btn-previa">🌐 Site Demo</a>` : ''}
            <a href="roadmap-${L.slug || idx}.html" target="_blank" class="btn-roadmap">📋 Ver Roadmap 360º</a>
          </div>
        </div>

        <!-- Painel Ligação -->
        <div class="tab-pane" id="${id}_pane_call">
          ${scriptLigacao}
          <div class="btn-acoes" style="margin-top: 10px;">
            <a href="tel:${tel}" class="btn-call">📞 Ligar Agora (${telFmt})</a>
            <a href="roadmap-${L.slug || idx}.html" target="_blank" class="btn-roadmap">📋 Abrir Roadmap na Tela</a>
          </div>
        </div>

        <!-- Painel Ficha do CNPJ -->
        <div class="tab-pane" id="${id}_pane_cnpj">
          ${fichaReceitaHTML}
        </div>
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Rhenan · Cockpit de Prospecção &amp; Inteligência</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card: #121217;
      --card-hover: #18181f;
      --linha: #27272a;
      --texto: #f4f4f5;
      --suave: #a1a1aa;
      --emerald: #10b981;
      --amber: #f59e0b;
      --red: #ef4444;
      --blue: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--texto);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      padding: 32px 24px;
      line-height: 1.5;
    }
    .header {
      max-width: 1400px;
      margin: 0 auto 32px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--linha);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      font-weight: 800;
      font-size: 20px;
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    }
    .brand-text h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-text p { font-size: 13px; color: var(--suave); }

    .stats-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .stat-pill {
      background: var(--card);
      border: 1px solid var(--linha);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
    }
    .stat-pill b { color: var(--emerald); font-family: 'JetBrains Mono', monospace; }

    .grid-leads {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(430px, 1fr));
      gap: 24px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--linha);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform .2s, border-color .2s;
    }
    .card:hover {
      border-color: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }
    .card-topo {
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--linha);
      background: rgba(255,255,255,0.02);
    }
    .badge-idx {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--suave);
      font-weight: 600;
    }
    .fundacao-pill {
      background: rgba(16, 185, 129, 0.12);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.25);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .crm-select {
      background: #000;
      color: #fff;
      border: 1px solid var(--linha);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
    .card-hero { position: relative; }
    .print-container {
      height: 175px;
      overflow: hidden;
      background: #000;
    }
    .print-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.85;
    }
    .empresa-info {
      padding: 14px 18px 8px;
    }
    .empresa-info h3 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .empresa-info .endereco { font-size: 12px; color: var(--suave); }

    .metricas-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--linha);
      margin: 10px 18px;
      border-radius: 8px;
      overflow: hidden;
    }
    .m-item {
      background: var(--card);
      padding: 8px 10px;
      text-align: center;
    }
    .m-val { display: block; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #fff; }
    .m-lbl { font-size: 10px; color: var(--suave); text-transform: uppercase; }

    .trafego-box {
      margin: 4px 18px 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .t-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .t-badge.red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .t-badge.yellow { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

    .tabs-container {
      margin: 0 18px 18px;
      border: 1px solid var(--linha);
      border-radius: 10px;
      background: rgba(0,0,0,0.25);
      overflow: hidden;
    }
    .tab-buttons {
      display: flex;
      border-bottom: 1px solid var(--linha);
    }
    .t-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--suave);
      padding: 10px 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all .15s;
      text-transform: uppercase;
      letter-spacing: .02em;
    }
    .t-btn.active {
      background: rgba(255,255,255,0.05);
      color: #fff;
      border-bottom: 2px solid var(--emerald);
    }
    .tab-pane { display: none; padding: 12px; }
    .tab-pane.active { display: block; }

    .copy-box {
      background: #000;
      border: 1px solid var(--linha);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .copy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 11px;
      color: var(--suave);
    }
    .btn-copy {
      background: var(--card);
      border: 1px solid var(--linha);
      color: #fff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-copy.copiado { background: var(--emerald); color: #000; border-color: var(--emerald); }
    pre {
      font-family: inherit;
      font-size: 12px;
      color: #ddd;
      white-space: pre-wrap;
      line-height: 1.45;
    }

    .call-script { display: flex; flex-direction: column; gap: 8px; }
    .call-step {
      background: #000;
      border: 1px solid var(--linha);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .step-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      background: var(--card);
      border: 1px solid var(--linha);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--amber);
      margin-bottom: 6px;
    }
    .call-step p { font-size: 12px; color: #e4e4e7; line-height: 1.4; }

    /* Ficha CNPJ */
    .cnpj-ficha {
      background: #000;
      border: 1px solid var(--linha);
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cnpj-header {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--linha);
    }
    .status-ativa { color: var(--emerald); font-weight: 700; font-size: 11px; }
    .cnpj-tempo { color: var(--suave); font-size: 11px; }
    .cnpj-campo label {
      display: block;
      font-size: 10px;
      color: var(--suave);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .cnpj-campo span { color: #fff; font-size: 12px; }
    .cnpj-campo span.mono { font-family: 'JetBrains Mono', monospace; color: var(--emerald); }
    .cnpj-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .socios-lista {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }
    .socio-item {
      background: rgba(255,255,255,0.03);
      padding: 6px 8px;
      border-radius: 6px;
      color: #fff;
    }
    .socio-item small { color: var(--suave); }

    .btn-acoes {
      margin-top: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-zap, .btn-previa, .btn-roadmap, .btn-call {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 9px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all .15s;
    }
    .btn-zap { background: #25d366; color: #000; flex: 1; }
    .btn-zap:hover { background: #22c55e; }
    .btn-previa { background: #fff; color: #000; }
    .btn-roadmap { background: var(--card); color: #fff; border: 1px solid var(--linha); }
    .btn-roadmap:hover { border-color: var(--emerald); color: var(--emerald); }
    .btn-call { background: var(--blue); color: #fff; flex: 1; }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <div class="brand-logo">P</div>
      <div class="brand-text">
        <h1>Rhenan · Cockpit de Prospecção &amp; Inteligência</h1>
        <p>Rodada: <b>${esc(nicho)}</b> em <b>${esc(cidade)}</b> · ${leads.length} leads qualificados com dados do CNPJ</p>
      </div>
    </div>
    <div class="stats-bar">
      <div class="stat-pill">Leads: <b>${leads.length}</b></div>
      <div class="stat-pill">Dados da Receita: <b>100%</b></div>
      <div class="stat-pill">Tempo Médio Ativo: <b>10+ Anos</b></div>
    </div>
  </div>

  <div class="grid-leads">
    ${cardsHTML}
  </div>

  <script>
    function trocarAba(cardId, aba) {
      const card = document.getElementById(cardId);
      const btns = card.querySelectorAll('.t-btn');
      const panes = card.querySelectorAll('.tab-pane');

      btns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      if (aba === 'zap') {
        btns[0].classList.add('active');
        document.getElementById(cardId + '_pane_zap').classList.add('active');
      } else if (aba === 'call') {
        btns[1].classList.add('active');
        document.getElementById(cardId + '_pane_call').classList.add('active');
      } else if (aba === 'cnpj') {
        btns[2].classList.add('active');
        document.getElementById(cardId + '_pane_cnpj').classList.add('active');
      }
    }

    function copiarTexto(btn, elementoId) {
      const texto = document.getElementById(elementoId).innerText;
      navigator.clipboard.writeText(texto).then(() => {
        btn.innerText = 'Copiado!';
        btn.classList.add('copiado');
        setTimeout(() => {
          btn.innerText = 'Copiar';
          btn.classList.remove('copiado');
        }, 2000);
      });
    }

    function marcarEnviado(cardId) {
      const sel = document.querySelector('#' + cardId + ' .crm-select');
      if (sel && sel.value === 'novo') {
        sel.value = 'm1_enviada';
        atualizarStatus(cardId, 'm1_enviada');
      }
    }

    function atualizarStatus(cardId, status) {
      localStorage.setItem('prospectos_' + cardId, status);
    }

    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.card').forEach(card => {
        const salvo = localStorage.getItem('prospectos_' + card.id);
        if (salvo) {
          const sel = card.querySelector('.crm-select');
          if (sel) sel.value = salvo;
        }
      });
    });
  </script>
</body>
</html>`;
}

function montar() {
  const html = gerarHTMLPainel();
  const arqPainel = path.join(pastaRodada, 'index.html');
  fs.mkdirSync(pastaRodada, { recursive: true });
  fs.writeFileSync(arqPainel, html, 'utf-8');
  console.log(`[ProspectOS] Painel Interativo com Ficha CNPJ gerado com sucesso em: ${arqPainel}`);
}

montar();
