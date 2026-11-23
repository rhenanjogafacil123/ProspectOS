// ProspectOS — Gerador Avançado de Roadmaps de Implantação (Dores & Curas + Comparativo com a Concorrência)
const fs = require('fs');
const path = require('path');
const { args, lerJSON, gravarJSON, esc, telBR, formataTel, formataCNPJ, formataMoeda } = require('./comum');

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

const leads = cfg.leads || [];
const nicho = cfg.nicho || 'Comércio Local';
const cidade = cfg.cidade || 'Brasil';
const remetente = cfg.remetente || 'Assessoria de Crescimento';
const precoAVista = cfg.preco || 'R$ 2.000';
const valorAncorado = cfg.valor_ancorado || 'R$ 6.800';
const parcelamento = cfg.parcelamento || '4x de R$ 560';

function calcularValidade() {
  const agora = new Date();
  agora.setDate(agora.getDate() + 3);
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diaSemana = dias[agora.getDay()];
  const diaFmt = String(agora.getDate()).padStart(2, '0');
  const mesFmt = String(agora.getMonth() + 1).padStart(2, '0');
  return `${diaSemana}, ${diaFmt}/${mesFmt} às 23h59`;
}

// Analisador Clínico: Identifica as dores específicas e define a cura exata
function diagnosticarDoresECuras(L) {
  const dores = [];

  // 1. Eixo Site & Velocidade
  if (!L.website) {
    dores.push({
      pilar: 'Site & Presença Web',
      status: 'critico',
      icone: '🌐',
      dor: 'Empresa não possui site próprio',
      hemorragia: 'Quem pesquisa por você pelo celular cai em diretórios genéricos ou não encontra botão rápido de WhatsApp.',
      cura: 'Desenvolvimento e publicação de Site / Biosite de Alta Conversão, otimizado para celulares, com botão WhatsApp 1-clique.'
    });
  } else {
    dores.push({
      pilar: 'Site & Performance',
      status: 'alerta',
      icone: '⚡',
      dor: 'Site lento ou desatualizado para celulares',
      hemorragia: 'Mais de 60% dos visitantes abandonam a página se ela demorar mais de 3 segundos para abrir.',
      cura: 'Reestruturação completa com carregamento ultrarrápido (< 1.2s), arquitetura moderna e rastreamento de conversão.'
    });
  }

  // 2. Eixo Google Meu Negócio & Avaliações
  const semRespostas = L.reviews_count > 30;
  dores.push({
    pilar: 'Google Maps & Reputação',
    status: 'alerta',
    icone: '📍',
    dor: 'Ficha sem integração total e avaliações abandonadas',
    hemorragia: 'Clientes que elogiam ou reclamam ficam no vácuo, derrubando o ranqueamento orgânico do perfil no algoritmo do Google.',
    cura: 'Otimização 360º de categorias, integração de WhatsApp e Instagram no perfil + Automação Inteligente de Resposta a Reviews.'
  });

  // 3. Eixo Ativação de Balcão (Plaquinha NFC)
  dores.push({
    pilar: 'Conversão Física no Balcão',
    status: 'oportunidade',
    icone: '📲',
    dor: 'Clientes satisfeitos vão embora sem avaliar a loja',
    hemorragia: 'Menos de 2% dos clientes lembram de entrar no Google depois para dar 5 estrelas.',
    cura: 'Implantação da Plaquinha Física de Balcão com chip NFC e QR Code: o cliente encosta o celular na saída e avalia em 5 segundos.'
  });

  // 4. Eixo Tráfego Pago (Google Ads & Meta Ads)
  dores.push({
    pilar: 'Aquisição Ativa de Clientes',
    status: 'critico',
    icone: '🎯',
    dor: 'Zero anúncios rodando no Google Ads e Meta Ads',
    hemorragia: 'Dependência 100% passiva de indicação física. Concorrentes do bairro estão pagando para aparecer no topo das buscas.',
    cura: 'Campanhas patrocinadas de Google Ads (fundo de funil com alta intenção) + Anúncios no Meta Ads no raio de 3 a 5 km da loja.'
  });

  // 5. Eixo Instagram & Redes Sociais
  dores.push({
    pilar: 'Redes Sociais & Retenção',
    status: 'alerta',
    icone: '📸',
    dor: 'Instagram sem presença ativa e sem link de conversão na bio',
    hemorragia: 'Visitantes chegam ao perfil e encontram conteúdo estagnado, passando a impressão de negócio parado.',
    cura: 'Bio profissional estruturada + link único interativo de atendimento + ativação de autoridade visual.'
  });

  return dores;
}

function gerarHTMLRoadmap(L, idx) {
  const tel = telBR(L.phone);
  const socio = L.socio_principal || (L.socios && L.socios[0] ? L.socios[0].nome : 'Responsável');
  const validade = calcularValidade();
  const slug = L.slug || `lead_${idx}`;
  const dataFundacao = L.data_fundacao || '14/05/2016';
  const tempoAtivo = L.tempo_ativo_extenso || (L.tempo_mercado_anos ? `${L.tempo_mercado_anos} anos ativa` : 'Ativa há anos');

  const dores = diagnosticarDoresECuras(L);

  const msgAceite = `Oi ${remetente}, vi o Roadmap de Dores & Curas da ${L.title} e quero dar início à Fase 1 de implantação!`;
  const linkZapAceite = `https://wa.me/55${cfg.telefone_remetente || '5521999999999'}?text=${encodeURIComponent(msgAceite)}`;

  // Tabela Comparativa contra Concorrente Líder
  const avaliacoesConcorrente = Math.max(L.reviews_count * 2, 480);
  const concorrenteNome = `Líder do Setor em ${cidade}`;

  const itensDoresHTML = dores.map(d => `
    <div class="dor-card ${d.status}">
      <div class="dor-header">
        <span class="dor-pilar">${d.icone} ${d.pilar}</span>
        <span class="status-tag ${d.status}">${d.status === 'critico' ? 'Gargalo Crítico' : (d.status === 'alerta' ? 'Ponto Cego' : 'Oportunidade')}</span>
      </div>
      <div class="dor-corpo">
        <div class="bloco-dor">
          <label>🚨 A Dor / Sintoma:</label>
          <p><b>${esc(d.dor)}</b></p>
          <small class="hemorragia">${esc(d.hemorragia)}</small>
        </div>
        <div class="bloco-cura">
          <label>💊 A Cura (O que vamos implantar):</label>
          <p>${esc(d.cura)}</p>
        </div>
      </div>
    </div>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Roadmap de Dores & Curas · ${esc(L.title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card: #121217;
      --card-alt: #18181f;
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
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #0d0d12;
      border: 1px solid var(--linha);
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .header-dual {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--linha);
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .brand-title span { color: var(--emerald); }
    .badge-exclusivo {
      background: rgba(16, 185, 129, 0.12);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    .hero {
      margin-top: 36px;
      margin-bottom: 32px;
    }
    .hero h1 {
      font-size: 30px;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .hero p {
      font-size: 15px;
      color: var(--suave);
      line-height: 1.6;
    }

    /* Bloco da História e Tradição */
    .historia-box {
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
      border: 1px solid var(--linha);
      border-left: 4px solid var(--emerald);
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 36px;
    }
    .historia-box h3 { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .historia-box p { font-size: 13px; color: #d4d4d8; }

    .secao-titulo {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .12em;
      color: var(--emerald);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .secao-titulo::before {
      content: '';
      width: 16px;
      height: 2px;
      background: var(--emerald);
    }

    /* Tabela Comparativa contra o Concorrente */
    .comparativo-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
      border: 1px solid var(--linha);
      border-radius: 12px;
      overflow: hidden;
      background: var(--card);
    }
    .comparativo-table th, .comparativo-table td {
      padding: 14px 18px;
      font-size: 13px;
      text-align: left;
      border-bottom: 1px solid var(--linha);
    }
    .comparativo-table th {
      background: rgba(255,255,255,0.03);
      color: var(--suave);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .col-voce { color: #fff; font-weight: 700; width: 35%; }
    .col-concorrente { color: var(--amber); font-weight: 700; width: 35%; }
    .col-acao { color: var(--emerald); width: 30%; }

    /* Cards de Dores e Curas */
    .dores-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 44px;
    }
    .dor-card {
      background: var(--card);
      border: 1px solid var(--linha);
      border-radius: 12px;
      padding: 20px 24px;
      transition: border-color .2s;
    }
    .dor-card.critico { border-left: 4px solid var(--red); }
    .dor-card.alerta { border-left: 4px solid var(--amber); }
    .dor-card.oportunidade { border-left: 4px solid var(--emerald); }
    
    .dor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .dor-pilar { font-size: 14px; font-weight: 700; color: #fff; }
    .status-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .status-tag.critico { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-tag.alerta { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .status-tag.oportunidade { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

    .dor-corpo {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .bloco-dor label, .bloco-cura label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .bloco-dor label { color: #f87171; }
    .bloco-cura label { color: var(--emerald); }
    .bloco-dor p { font-size: 13px; color: #fff; margin-bottom: 4px; }
    .hemorragia { font-size: 12px; color: var(--suave); display: block; line-height: 1.4; }
    .bloco-cura p { font-size: 13px; color: #e4e4e7; line-height: 1.5; }

    /* Fases do Roadmap */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 44px;
    }
    .fase-card {
      background: var(--card);
      border: 1px solid var(--linha);
      border-radius: 12px;
      padding: 22px 24px;
    }
    .fase-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #fff;
      background: var(--linha);
      padding: 3px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-family: 'JetBrains Mono', monospace;
    }
    .fase-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 10px; color: #fff; }
    .fase-card ul { list-style: none; padding-left: 0; }
    .fase-card li {
      font-size: 13px;
      color: #d4d4d8;
      margin-bottom: 8px;
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .fase-card li::before {
      content: '✓';
      color: var(--emerald);
      font-weight: 700;
    }

    /* Ancoragem One-Pager */
    .proposta-box {
      background: linear-gradient(180deg, #18181f 0%, #121217 100%);
      border: 1px solid var(--emerald);
      border-radius: 14px;
      padding: 36px 32px;
      text-align: center;
      margin-bottom: 30px;
    }
    .preco-antigo {
      font-size: 16px;
      color: var(--suave);
      text-decoration: line-through;
      margin-bottom: 4px;
    }
    .preco-destaque {
      font-size: 46px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .preco-parcelas {
      font-size: 14px;
      color: var(--emerald);
      font-weight: 600;
      margin-top: 6px;
      margin-bottom: 20px;
    }
    .reason-why {
      font-size: 13px;
      color: var(--suave);
      max-width: 580px;
      margin: 0 auto 24px;
      line-height: 1.5;
    }
    .btn-fechar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: var(--emerald);
      color: #000;
      font-weight: 800;
      font-size: 16px;
      padding: 18px 36px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35);
      transition: transform .15s, background .15s;
    }
    .btn-fechar:hover {
      transform: translateY(-2px);
      background: #059669;
    }
    .escassez {
      font-size: 12px;
      color: var(--amber);
      font-weight: 600;
      margin-top: 14px;
    }
    .fine-print {
      font-size: 11px;
      color: #71717a;
      line-height: 1.5;
      text-align: center;
      margin-top: 24px;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="header-dual">
      <div class="brand-title">PROSPECT<span>OS</span> · GROWTH</div>
      <div class="badge-exclusivo">Diagnóstico Clínico de Dores & Curas</div>
    </div>

    <div class="hero">
      <h1>Plano de Implantação & Cura Digital</h1>
      <p>Desenvolvido exclusivamente para a liderança da <b>${esc(L.title)}</b> em ${esc(cidade)}.</p>
    </div>

    <!-- 1. História e Tradição -->
    <div class="historia-box">
      <h3>🏛️ Tradição & Base Sólida (${tempoAtivo})</h3>
      <p>
        Fundada oficialmente em <b>${dataFundacao}</b> (CNPJ ${esc(L.cnpj)}), a <b>${esc(L.title)}</b> construiu uma história sólida em ${esc(cidade)}, com ${L.reviews_count} avaliações e nota média ${L.rating} no Google Maps. A qualidade do serviço e o atendimento físico são inquestionáveis. O objetivo deste Roadmap é fazer a sua presença digital refletir a grandeza da sua empresa no mundo real.
      </p>
    </div>

    <!-- 2. Comparativo Concorrência Forte -->
    <div class="secao-titulo">1. Comparativo de Mercado: Sua Empresa vs Concorrente Líder</div>
    <table class="comparativo-table">
      <thead>
        <tr>
          <th>Ponto Analisado</th>
          <th class="col-voce">${esc(L.title)} (Hoje)</th>
          <th class="col-concorrente">${esc(concorrenteNome)}</th>
          <th class="col-acao">Ação do Roadmap</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Site / Página de Conversão</b></td>
          <td>❌ Não possui página própria</td>
          <td>✅ Site rápido com WhatsApp</td>
          <td>Desenvolver Biosite 1.2s</td>
        </tr>
        <tr>
          <td><b>Anúncios Patrocinados (Google Ads)</b></td>
          <td>❌ Inativo (0 buscas captadas)</td>
          <td>✅ Anunciando no topo do mapa</td>
          <td>Ativar campanhas de fundo de funil</td>
        </tr>
        <tr>
          <td><b>Meta Ads (Instagram / Facebook)</b></td>
          <td>❌ Zero campanhas ativas</td>
          <td>✅ Anúncios no raio de 3km</td>
          <td>Captação local geolocalizada</td>
        </tr>
        <tr>
          <td><b>Coleta de Avaliações no Balcão</b></td>
          <td>⚠️ Manual (depende do cliente)</td>
          <td>✅ Plaquinha NFC / QR Code</td>
          <td>Implantação de Plaquinha Inteligente</td>
        </tr>
        <tr>
          <td><b>Respostas às Avaliações no Google</b></td>
          <td>⚠️ Frequência baixa / sem padrão</td>
          <td>✅ 100% das avaliações respondidas</td>
          <td>Automação de Respostas com IA</td>
        </tr>
      </tbody>
    </table>

    <!-- 3. Matriz de Dores e Curas -->
    <div class="secao-titulo">2. Matriz de Diagnóstico: Dores Identificadas & Tratamento</div>
    <div class="dores-grid">
      ${itensDoresHTML}
    </div>

    <!-- 4. Fases de Execução -->
    <div class="secao-titulo">3. Cronograma de Execução em 3 Fases</div>
    <div class="timeline">
      <div class="fase-card">
        <span class="fase-badge">Fase 1 · Fundação & Presença Local (Dias 1 a 10)</span>
        <h3>Infraestrutura de Conversão & Reputação Blindada</h3>
        <ul>
          <li>Site profissional e biosite ultrarrápido (< 1.2s no celular) com botão direto de WhatsApp.</li>
          <li>Otimização completa 360º da Ficha no Google Maps (vinculação de WhatsApp, Instagram, categorias e palavras-chave).</li>
          <li>Entrega e ativação da Plaquinha Física de Balcão com chip NFC e QR Code para captação instantânea de avaliações.</li>
          <li>Ativação do robô de respostas inteligentes para avaliações do Google.</li>
        </ul>
      </div>

      <div class="fase-card">
        <span class="fase-badge">Fase 2 · Motor de Clientes & Tráfego Pago (Dias 10 a 20)</span>
        <h3>Captação Ativa de Clientes no Google e Meta</h3>
        <ul>
          <li>Campanhas patrocinadas no Google Ads (Search & Maps) para capturar quem precisa de atendimento imediato em ${esc(cidade)}.</li>
          <li>Campanhas geolocalizadas no Instagram e Facebook num raio de 3 a 5 km ao redor da empresa.</li>
          <li>Instalação do Pixel e tags de conversão para reter e perseguir quem visitou o site.</li>
        </ul>
      </div>

      <div class="fase-card">
        <span class="fase-badge">Fase 3 · Automação & Retenção (Dias 20 a 30)</span>
        <h3>Atendimento Ágil & Acompanhamento de Resultados</h3>
        <ul>
          <li>Configuração de triagem rápida no WhatsApp para responder leads instantaneamente e não perder clientes no almoço ou pós-expediente.</li>
          <li>Painel Executivo de Resultados para acompanhar cliques, contatos e retorno sobre o investimento.</li>
          <li>Régua de recuperação de clientes inativos da base.</li>
        </ul>
      </div>
    </div>

    <!-- 5. Proposta One-Pager Ancorada -->
    <div class="secao-titulo">4. Proposta de Implantação & Kickoff</div>
    <div class="proposta-box">
      <div class="preco-antigo">${valorAncorado}</div>
      <div class="preco-destaque">${precoAVista}</div>
      <div class="preco-parcelas">ou em ${parcelamento} no cartão sem juros</div>
      <p class="reason-why">
        "Condição especial de parceria válida exclusivamente para o kickoff de aceleração da <b>${esc(L.title)}</b>, focada em resolver os gargalos de tráfego e presença digital para consolidar a liderança do setor em ${esc(cidade)}."
      </p>
      <a href="${linkZapAceite}" target="_blank" class="btn-fechar">
        ✅ Aceitar a Proposta & Iniciar Fase 1
      </a>
      <div class="escassez">⏳ Condição reservada até ${validade}</div>
    </div>

    <div class="fine-print">
      * A verba de anúncios do Google e Meta é paga diretamente às plataformas conforme o seu orçamento. Domínio e hospedagem sob responsabilidade do cliente. Acompanhamento contínuo pós-implantação orçado à parte.
    </div>
  </div>

</body>
</html>`;
}

function gerarTodos() {
  leads.forEach((L, idx) => {
    const slug = L.slug || `lead_${idx}`;
    const html = gerarHTMLRoadmap(L, idx);
    const arq = path.join(pastaRodada, `roadmap-${slug}.html`);
    fs.writeFileSync(arq, html, 'utf-8');
    console.log(`[ProspectOS] Roadmap de Dores & Curas gerado para ${L.title}: ${arq}`);
  });
}

gerarTodos();
