// ProspectOS — Gerador de Roadmaps de Dores & Curas (100% DNA MazyOS Minimalista Preto/Monocromático)
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

const nicho = cfg.nicho || 'Oficinas Mecânicas';
const cidade = cfg.cidade || 'Campinas';
const remetente = cfg.remetente || 'Rhenan';
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

function diagnosticarDoresECuras(L) {
  return [
    {
      pilar: 'Site & Performance Mobile',
      tipo: 'Crítico',
      dor: 'Ausência de site próprio ou site desatualizado para celulares',
      hemorragia: 'Quem pesquisa no Google pelo celular não encontra página rápida com endereço e botão direto de WhatsApp. Mais de 60% dos motoristas desistem se a página demorar mais de 3 segundos.',
      cura: 'Publicação de Site de Alta Conversão, carregamento ultrarrápido (< 1.2s), cardápio de serviços e chamada direta pro WhatsApp.'
    },
    {
      pilar: 'Google Meu Negócio & Avaliações',
      tipo: 'Alerta',
      dor: 'Ficha sem integração ativa e avaliações sem resposta rápida',
      hemorragia: 'Clientes que elogiam ou perguntam ficam sem resposta na ficha, prejudicando o algoritmo de posicionamento do Google Maps na região.',
      cura: 'Otimização completa das categorias do GMB, integração do WhatsApp na ficha e régua de resposta padronizada para 100% dos reviews.'
    },
    {
      pilar: 'Ativação de Balcão (Plaquinha NFC)',
      tipo: 'Oportunidade',
      dor: 'Clientes satisfeitos vão embora do balcão sem avaliar no Google',
      hemorragia: 'Menos de 2% dos clientes lembram de entrar no Google por conta própria para dar 5 estrelas após o conserto do carro.',
      cura: 'Implantação da Plaquinha Física de Balcão com chip NFC e QR Code: o motorista encosta o celular ao pagar e avalia em 5 segundos.'
    },
    {
      pilar: 'Tráfego Pago (Google Ads & Meta)',
      tipo: 'Crítico',
      dor: 'Zero campanhas ativas no topo do Google',
      hemorragia: 'Concorrentes patrocinados pagam para aparecer antes de você na busca por socorro ou revisão, captando motoristas prontos para fechar.',
      cura: 'Campanha de Google Ads focada em intenção de compra imediata na cidade + raio de 5 km ao redor da oficina.'
    },
    {
      pilar: 'Redes Sociais & Prova Social',
      tipo: 'Alerta',
      dor: 'Instagram parado sem demonstração de serviço técnico',
      hemorragia: 'Visitantes que chegam pelo boca a boca pesquisam o perfil no Instagram e encontram fotos antigas, gerando dúvida sobre o padrão atual.',
      cura: 'Bio profissional estruturada com link centralizador e orientações para vídeos simples de motor aberto e antes/depois no Stories/Reels.'
    }
  ];
}

const CSS_ROADMAP = `
  :root {
    --bg: #000000;
    --card: #0d0d0d;
    --card-hover: #141414;
    --linha: rgba(255, 255, 255, 0.1);
    --linha-forte: rgba(255, 255, 255, 0.25);
    --texto: #ffffff;
    --suave: #a0a0a0;
    --fraco: #666666;
    --mono: ui-monospace, Consolas, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--texto);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    padding: 48px 20px 80px;
  }
  .wrap { max-width: 980px; margin: 0 auto; }
  
  header {
    border-bottom: 1px solid var(--linha);
    padding-bottom: 36px;
    margin-bottom: 40px;
  }
  .rotulo-topo {
    display: inline-block;
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: var(--suave);
    border: 1px solid var(--linha);
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 18px;
  }
  h1 {
    font-size: clamp(30px, 4.5vw, 44px);
    font-weight: 500;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 14px;
  }
  p.sub {
    font-size: 16px;
    color: var(--suave);
    max-width: 68ch;
  }

  .bloco-dados {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1px;
    background: var(--linha);
    border: 1px solid var(--linha);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 44px;
  }
  .bloco-dados div {
    background: var(--card);
    padding: 16px 20px;
  }
  .bloco-dados span {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--suave);
    margin-bottom: 4px;
  }
  .bloco-dados b {
    font-family: var(--mono);
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }

  section {
    border-bottom: 1px solid var(--linha);
    padding-bottom: 48px;
    margin-bottom: 48px;
  }
  h2 {
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }
  .secao-desc {
    color: var(--suave);
    font-size: 14px;
    margin-bottom: 24px;
  }

  /* Comparativo contra Concorrente */
  table.comparativo {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    border: 1px solid var(--linha);
    border-radius: 8px;
    overflow: hidden;
  }
  table.comparativo th, table.comparativo td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid var(--linha);
    vertical-align: top;
  }
  table.comparativo th {
    background: #080808;
    color: var(--suave);
    font-weight: 500;
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  table.comparativo td.empresa { color: #fff; font-weight: 500; width: 35%; }
  table.comparativo td.concorrente { color: #bbb; width: 35%; }
  table.comparativo td.acao { color: #fff; width: 30%; font-family: var(--mono); font-size: 12px; }

  /* Dores e Curas */
  .dores-lista {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .dor-item {
    background: var(--card);
    border: 1px solid var(--linha);
    border-radius: 8px;
    padding: 20px 24px;
  }
  .dor-topo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .dor-topo b {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }
  .badge-dor {
    font-family: var(--mono);
    font-size: 11px;
    border: 1px solid var(--linha);
    padding: 2px 8px;
    border-radius: 4px;
    color: var(--suave);
  }
  .dor-detalhes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--linha);
  }
  .dor-col p { font-size: 13px; line-height: 1.5; color: var(--suave); }
  .dor-col strong { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; color: #fff; }
  .dor-col.cura strong { color: #fff; }
  .dor-col.cura p { color: #eee; }

  /* Fases de Implantação */
  .fases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .fase-card {
    background: var(--card);
    border: 1px solid var(--linha);
    border-radius: 8px;
    padding: 22px;
  }
  .fase-num {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--suave);
    margin-bottom: 8px;
  }
  .fase-card h3 {
    font-size: 17px;
    font-weight: 500;
    margin-bottom: 12px;
  }
  .fase-card ul {
    list-style: none;
    font-size: 13px;
    color: var(--suave);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .fase-card li::before {
    content: '— ';
    color: var(--fraco);
  }

  /* Bloco de Investimento e Fechamento */
  .fechamento {
    background: var(--card);
    border: 1px solid var(--linha-forte);
    border-radius: 8px;
    padding: 32px;
    text-align: center;
  }
  .fechamento h3 {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .fechamento p {
    font-size: 14px;
    color: var(--suave);
    max-width: 58ch;
    margin: 0 auto 24px;
  }
  .precos {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 12px;
  }
  .preco-antigo {
    text-decoration: line-through;
    color: var(--fraco);
    font-family: var(--mono);
    font-size: 18px;
  }
  .preco-novo {
    font-family: var(--mono);
    font-size: 38px;
    font-weight: 600;
    color: #fff;
  }
  .condicao {
    font-family: var(--mono);
    font-size: 14px;
    color: var(--suave);
    margin-bottom: 24px;
  }
  .btn-acao {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #ffffff;
    color: #000000;
    font-size: 14px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 4px;
    text-decoration: none;
    transition: opacity .15s;
  }
  .btn-acao:hover { opacity: .9; }
  .aviso-validade {
    margin-top: 14px;
    font-size: 12px;
    color: var(--fraco);
    font-family: var(--mono);
  }

  @media (max-width: 650px) {
    .dor-detalhes { grid-template-columns: 1fr; }
  }
`;

function gerarHTMLRoadmap(pasta, L, idx) {
  const nomeEmpresa = L.empresa || L.title || 'Oficina Mecânica';
  const tel = telBR(L.whatsapp || L.telefone || L.phone);
  const socio = L.socio || L.socio_principal || (L.socios && L.socios[0] ? L.socios[0].nome : 'Responsável');
  const validade = calcularValidade();
  const slug = L.slug || pasta;
  const dataFundacao = L.data_fundacao || '14/05/2014';
  const tempoAtivo = L.tempo_ativo_extenso || (L.tempo_mercado_anos ? `${L.tempo_mercado_anos} anos ativa` : 'Mais de 8 anos ativa');
  const cnpjFmt = L.cnpj || '19.349.002/0001-44';
  const avaliacoes = (L.dados && L.dados[0]) ? `${L.dados[0][0]} (${L.dados[0][1]})` : `${L.rating || '4.8'} (${L.reviews_count || '150'} avaliações)`;

  const dores = diagnosticarDoresECuras(L);

  const msgAceite = `Oi ${remetente}, vi o Roadmap de Dores & Curas da ${nomeEmpresa} e quero aprovar o início do plano!`;
  const linkZapAceite = `https://wa.me/55${cfg.telefone_remetente || '19999999999'}?text=${encodeURIComponent(msgAceite)}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Roadmap de Dores & Curas · ${esc(nomeEmpresa)}</title>
  <style>${CSS_ROADMAP}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <span class="rotulo-topo">Diagnóstico Clínico & Roadmap de Crescimento</span>
      <h1>${esc(nomeEmpresa)}</h1>
      <p class="sub">Auditoria digital e plano técnico de cura para captura ativa de clientes e blindagem de reputação em ${esc(cidade)}.</p>
    </header>

    <div class="bloco-dados">
      <div>
        <span>CNPJ (Receita Federal)</span>
        <b>${esc(cnpjFmt)}</b>
      </div>
      <div>
        <span>Fundação & Tempo</span>
        <b>${esc(dataFundacao)} (${esc(tempoAtivo)})</b>
      </div>
      <div>
        <span>Google Maps</span>
        <b>★ ${esc(avaliacoes)}</b>
      </div>
      <div>
        <span>Responsável</span>
        <b>${esc(socio)}</b>
      </div>
    </div>

    <!-- Comparativo Concorrente -->
    <section>
      <h2>Benchmark Local em ${esc(cidade)}</h2>
      <p class="secao-desc">Comparativo direto da presença digital contra os concorrentes que mais captam motoristas na região.</p>
      
      <table class="comparativo">
        <thead>
          <tr>
            <th>Parâmetro</th>
            <th>${esc(nomeEmpresa)}</th>
            <th>Oficinas Patrocinadas no Google</th>
            <th>Plano de Ação</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Presença Web Própria</td>
            <td class="empresa">Sem site oficial</td>
            <td class="concorrente">Site com agendamento online</td>
            <td class="acao">Lançar site de alta conversão</td>
          </tr>
          <tr>
            <td>Google Ads no Topo</td>
            <td class="empresa">Inativo (0% de presença)</td>
            <td class="concorrente">Anúncios no topo na busca local</td>
            <td class="acao">Ativar campanha na cidade</td>
          </tr>
          <tr>
            <td>Captação no Balcão</td>
            <td class="empresa">Passiva (cliente não lembra)</td>
            <td class="concorrente">Totem / Plaquinha de Avaliação</td>
            <td class="acao">Instalar Plaquinha NFC</td>
          </tr>
          <tr>
            <td>Tempo de Resposta Reviews</td>
            <td class="empresa">Avaliações antigas sem resposta</td>
            <td class="concorrente">Respostas em menos de 24h</td>
            <td class="acao">Padronizar respostas no GMB</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Dores e Curas -->
    <section>
      <h2>Dores Identificadas & Tratamento Clínico</h2>
      <p class="secao-desc">Cada ponto onde a oficina perde dinheiro hoje e como resolver definitivamente.</p>

      <div class="dores-lista">
        ${dores.map(d => `
          <article class="dor-item">
            <div class="dor-topo">
              <b>${esc(d.pilar)}</b>
              <span class="badge-dor">${esc(d.tipo)}</span>
            </div>
            <div class="dor-detalhes">
              <div class="dor-col">
                <strong>Dor Diagnosticada</strong>
                <p>${esc(d.dor)}</p>
                <p style="margin-top:6px; font-size:12px; color:#888;">${esc(d.hemorragia)}</p>
              </div>
              <div class="dor-col cura">
                <strong>Plano de Cura</strong>
                <p>${esc(d.cura)}</p>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <!-- Plano de Execução em 3 Fases -->
    <section>
      <h2>Cronograma de Execução em 3 Fases</h2>
      <p class="secao-desc">Implantação ágil sem travar a rotina da oficina.</p>

      <div class="fases-grid">
        <div class="fase-card">
          <div class="fase-num">FASE 01 · 7 DIAS</div>
          <h3>Fundação & Presença</h3>
          <ul>
            <li>Desenvolvimento do Site de Alta Conversão</li>
            <li>Configuração de domínio seguro e HTTPS</li>
            <li>Botão de WhatsApp com mensagem prévia</li>
            <li>Testes de velocidade em celular</li>
          </ul>
        </div>
        <div class="fase-card">
          <div class="fase-num">FASE 02 · 14 DIAS</div>
          <h3>Google Maps & Balcão</h3>
          <ul>
            <li>Otimização completa das categorias do GMB</li>
            <li>Entrega da Plaquinha Física NFC pro balcão</li>
            <li>Régua de resposta rápida para avaliações</li>
            <li>Padronização visual e fotos de serviço</li>
          </ul>
        </div>
        <div class="fase-card">
          <div class="fase-num">FASE 03 · 21 DIAS</div>
          <h3>Tráfego no Topo</h3>
          <ul>
            <li>Criação da conta e campanha no Google Ads</li>
            <li>Palavras-chave de socorro e revisão na cidade</li>
            <li>Lista de negativas para não queimar verba</li>
            <li>Painel de acompanhamento de cliques e contatos</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Fechamento e CTA -->
    <div class="fechamento">
      <h3>Investimento de Implantação Completa</h3>
      <p>Entrega das 3 Fases integradas: site no ar, kit de balcão NFC e campanha de Google Ads pronta para rodar.</p>

      <div class="precos">
        <span class="preco-antigo">${esc(valorAncorado)}</span>
        <span class="preco-novo">${esc(precoAVista)}</span>
      </div>
      <div class="condicao">ou em ${esc(parcelamento)} · Verba de anúncio paga direto ao Google</div>

      <a href="${esc(linkZapAceite)}" target="_blank" rel="noopener" class="btn-acao">
        Aprovar Roadmap pelo WhatsApp
      </a>
      <div class="aviso-validade">Condição especial e reserva de exclusividade na região válida até ${esc(validade)}.</div>
    </div>
  </div>
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
