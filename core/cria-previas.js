// ProspectOS — Gerador Rápido de Prévias Locais dos Leads
const fs = require('fs');
const path = require('path');
const { lerJSON, esc } = require('./comum');

const rodadaPath = path.join(__dirname, '..', 'saidas', 'prospeccao', 'teste-oficinas-campinas-2026-11');
const cfg = lerJSON(path.join(rodadaPath, 'rodada.json'));
const modelo = fs.readFileSync(path.join(__dirname, 'modelo-demo.html'), 'utf8');

const leadsEntries = Object.entries(cfg.leads);

leadsEntries.forEach(([pasta, L]) => {
  const destDir = path.join(rodadaPath, pasta);
  fs.mkdirSync(destDir, { recursive: true });

  let h = modelo;
  h = h.replace(/{{NOME_EMPRESA}}/g, L.empresa);
  h = h.replace(/{{O_QUE_FAZ}}/g, L.servico);
  h = h.replace(/{{CIDADE}}/g, cfg.cidade);
  h = h.replace(/{{DESCRICAO_160}}/g, `${L.empresa} em ${cfg.cidade}. Manutenção preventiva, diagnóstico automotivo e reparos com agendamento direto.`);
  h = h.replace(/{{FONTE_TITULO_URL}}/g, 'Plus+Jakarta+Sans');
  h = h.replace(/{{FONTE_CORPO_URL}}/g, 'Plus+Jakarta+Sans');
  h = h.replace(/{{FONTE_TITULO}}/g, 'Plus Jakarta Sans');
  h = h.replace(/{{FONTE_CORPO}}/g, 'Plus Jakarta Sans');

  // Cores personalizadas
  h = h.replace(/{{COR_MARCA}}/g, '#ffffff');
  h = h.replace(/{{COR_MARCA_ESCURA}}/g, '#e0e0e0');
  h = h.replace(/{{COR_SOBRE_MARCA}}/g, '#000000');
  h = h.replace(/{{COR_FUNDO}}/g, '#09090b');
  h = h.replace(/{{COR_FUNDO_2}}/g, '#121217');
  h = h.replace(/{{COR_CARD}}/g, '#18181f');
  h = h.replace(/{{COR_LINHA}}/g, 'rgba(255,255,255,0.08)');
  h = h.replace(/{{COR_TEXTO}}/g, '#f4f4f5');
  h = h.replace(/{{COR_TEXTO_SUAVE}}/g, '#a1a1aa');

  // Dados de contato
  h = h.replace(/{{WHATSAPP_DIGITOS}}/g, L.whatsapp || '5519999999999');
  h = h.replace(/{{TELEFONE_DIGITOS}}/g, (L.whatsapp || '5519999999999').replace(/\D/g, ''));
  h = h.replace(/{{TELEFONE_FORMATADO}}/g, L.telefone || '(19) 99999-9999');
  h = h.replace(/{{ENDERECO}}/g, `${L.meta} · ${cfg.cidade} - SP`);
  h = h.replace(/{{MENSAGEM_WHATS_URLENCODED}}/g, encodeURIComponent(`Olá, vi o site da ${L.empresa} e gostaria de agendar uma revisão!`));
  h = h.replace(/{{ASSINATURA}}/g, cfg.assinatura);

  // Taglines e destaques
  h = h.replace(/{{HERO_ROTULO}}/g, 'Oficina Especializada & Diagnóstico');
  h = h.replace(/{{HERO_TITULO}}/g, `${L.empresa}: Tradição e Excelência Automotiva`);
  h = h.replace(/{{HERO_SUBTITULO}}/g, `Atendimento transparente em ${cfg.cidade}. Mais de ${L.dados ? L.dados[0][1] : '100 avaliações 5 estrelas no Google'}.`);
  h = h.replace(/{{HERO_BOTAO}}/g, 'Agendar Diagnóstico no WhatsApp');

  // Ajustes de blocos
  h = h.replace(/{{NUMERO_1}}/g, L.dados ? L.dados[0][0] : '4.8');
  h = h.replace(/{{LEGENDA_1}}/g, 'Nota no Google');
  h = h.replace(/{{NUMERO_2}}/g, L.dados ? L.dados[0][1] : '300+');
  h = h.replace(/{{LEGENDA_2}}/g, 'Avaliações Reais');
  h = h.replace(/{{NUMERO_3}}/g, L.dados ? L.dados[1][1] : '10 Anos');
  h = h.replace(/{{LEGENDA_3}}/g, 'Atuação no Mercado');

  // Limpeza de campos restantes
  h = h.replace(/{{[^}]+}}/g, '');

  fs.writeFileSync(path.join(destDir, 'index.html'), h, 'utf8');

  // Criar SVG / mockup limpo para print-desktop.png
  const svgMockup = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <rect width="600" height="380" fill="#0d0d0d"/>
    <rect x="0" y="0" width="600" height="32" fill="#181818"/>
    <circle cx="20" cy="16" r="4" fill="#444"/>
    <circle cx="34" cy="16" r="4" fill="#444"/>
    <circle cx="48" cy="16" r="4" fill="#444"/>
    <rect x="70" y="8" width="240" height="16" rx="4" fill="#222"/>
    <text x="80" y="20" fill="#777" font-family="system-ui, sans-serif" font-size="10">${L.slug}.com.br</text>
    
    <!-- Hero Mockup -->
    <rect x="40" y="60" width="140" height="12" rx="3" fill="#ffffff" opacity="0.15"/>
    <text x="40" y="110" fill="#ffffff" font-family="system-ui, sans-serif" font-size="22" font-weight="bold">${esc(L.empresa)}</text>
    <text x="40" y="135" fill="#888888" font-family="system-ui, sans-serif" font-size="12">${esc(L.meta)}</text>
    <rect x="40" y="160" width="160" height="36" rx="4" fill="#ffffff"/>
    <text x="56" y="183" fill="#000000" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">AGENDAR NO WHATSAPP</text>
    
    <!-- Stats Cards -->
    <rect x="40" y="225" width="150" height="65" rx="6" fill="#141414" stroke="#252525"/>
    <text x="55" y="252" fill="#ffffff" font-family="monospace" font-size="18" font-weight="bold">${L.dados ? L.dados[0][0] : '4.8'} ★</text>
    <text x="55" y="272" fill="#777777" font-family="system-ui, sans-serif" font-size="11">${L.dados ? L.dados[0][1] : 'Avaliações'}</text>

    <rect x="210" y="225" width="150" height="65" rx="6" fill="#141414" stroke="#252525"/>
    <text x="225" y="252" fill="#ffffff" font-family="monospace" font-size="18" font-weight="bold">${L.dados ? L.dados[1][1] : '10 Anos'}</text>
    <text x="225" y="272" fill="#777777" font-family="system-ui, sans-serif" font-size="11">Empresa Ativa</text>

    <rect x="380" y="225" width="180" height="65" rx="6" fill="#141414" stroke="#252525"/>
    <text x="395" y="252" fill="#ffffff" font-family="monospace" font-size="18" font-weight="bold">Campinas - SP</text>
    <text x="395" y="272" fill="#777777" font-family="system-ui, sans-serif" font-size="11">Atendimento Regional</text>

    <rect x="0" y="320" width="600" height="60" fill="#080808" stroke="#1f1f1f"/>
    <text x="40" y="355" fill="#666666" font-family="system-ui, sans-serif" font-size="11">Prévia desenvolvida por ${esc(cfg.remetente)}</text>
  </svg>`;

  fs.writeFileSync(path.join(destDir, 'print-desktop.svg'), svgMockup);
  // Também salvar como print-desktop.png (ou manter como fallback)
  fs.writeFileSync(path.join(destDir, 'print-desktop.png'), svgMockup);
  console.log(`[ProspectOS] Prévia compilada para ${L.empresa} em ${destDir}`);
});

console.log('[ProspectOS] Todas as prévias geradas.');
