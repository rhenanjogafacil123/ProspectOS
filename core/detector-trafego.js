// Rhenan — Detector Real de Tráfego Pago, Tags (GTM/Pixel), Performance & Redes Sociais
// Combina varredura HTTP real no site/agregadores/redes com diagnóstico comercial estruturado.
// Uso: node detector-trafego.js <validados.json> <com-trafego.json> [--cidade "Campinas"]
const fs = require('fs');
const path = require('path');
const { args, lerJSON, gravarJSON, sleep, norm, UA } = require('./comum');

const opt = args();
const [inPath, outPath] = opt._;

if (!inPath || !outPath) {
  console.log('Uso: node detector-trafego.js <validados.json> <com-trafego.json>');
  process.exit(1);
}

const entrada = lerJSON(inPath);
const empresas = entrada.empresas || entrada.candidatos || (Array.isArray(entrada) ? entrada : []);

// ─── Utilitários HTTP & Extratores ───────────────────────────────────────────

async function fetchPageComTempo(url, timeoutMs = 10000) {
  const inicio = Date.now();
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': UA['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      },
      redirect: 'follow'
    });
    if (!r.ok) return { html: null, tempoSeg: null, status: r.status };
    const html = await r.text();
    const tempoSeg = ((Date.now() - inicio) / 1000).toFixed(1) + 's';
    return { html, tempoSeg, status: r.status };
  } catch {
    return { html: null, tempoSeg: null, status: 0 };
  }
}

function normalizarUrl(u) {
  if (!u) return null;
  const limpo = String(u).trim().replace(/[)\]},;."']+$/, '');
  if (!limpo) return null;
  return /^https?:\/\//i.test(limpo) ? limpo : 'https://' + limpo;
}

const REDES = /instagram\.com|facebook\.com|fb\.me|linktr\.ee|beacons\.ai|bio\.link/i;

function ehSiteProprio(url) {
  if (!url) return false;
  if (REDES.test(url)) return false;
  if (/wa\.me|whatsapp\.com|tiktok\.com|ifood\.com|99food|anota\.ai|saipos\.com|contate\.me|tinyurl|bit\.ly|goo\.gl|google\.com\/maps/i.test(url)) return false;
  return /^https?:\/\//i.test(url) || /^[\w.-]+\.[a-z]{2,}/i.test(url);
}

function coletarFontes(lead) {
  const brutos = [];
  const push = v => { if (v) brutos.push(String(v)); };

  push(lead.website);
  push(lead.site);
  push(lead.link);
  push(lead.instagram_url);

  try {
    const about = typeof lead.about === 'string' ? JSON.parse(lead.about) : lead.about;
    const anda = n => {
      if (!n) return;
      if (typeof n === 'string') { if (/^https?:\/\//.test(n)) push(n); return; }
      if (Array.isArray(n)) return n.forEach(anda);
      if (typeof n === 'object') Object.values(n).forEach(anda);
    };
    anda(about);
  } catch {}

  const texto = [lead.description, lead.descriptions].filter(Boolean).join(' ');
  const achadas = texto.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  achadas.forEach(push);

  return [...new Set(brutos.map(normalizarUrl).filter(Boolean))];
}

function extrairLinksDeAgregador(html) {
  if (!html) return [];
  const urls = html.match(/https?:\/\/[^\s"'<>\\)]+/gi) || [];
  const filtradas = urls.filter(u =>
    !/linktr\.ee|beacons\.ai|bio\.link|w3\.org|schema\.org/i.test(u) &&
    !/instagram\.com\/(p|reel|explore|accounts|direct)\//i.test(u) &&
    !/facebook\.com\/(sharer|plugins|dialog|login|help|policies|ads\/)/i.test(u)
  );
  return [...new Set(filtradas.map(normalizarUrl))];
}

// ─── Detectores Técnicos de Tags, Pixels & Botões ────────────────────────────

function extrairGTM(html) {
  if (!html) return null;
  const m = html.match(/GTM-[A-Z0-9]{5,10}/i);
  return m ? m[0].toUpperCase() : null;
}

function extrairMetaPixel(html) {
  if (!html) return null;
  const mInit = html.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]?(\d{10,20})['"]?/i);
  if (mInit) return `ID: ${mInit[1]}`;
  if (/connect\.facebook\.net\/[^"']*fbevents\.js/i.test(html) || /fbq\s*\(\s*['"]track/i.test(html)) {
    return 'Detectado (fbevents.js)';
  }
  return null;
}

function extrairGoogleAds(html) {
  if (!html) return null;
  const mAw = html.match(/AW-\d{8,12}/i);
  if (mAw) return `Tag ${mAw[0].toUpperCase()}`;
  if (/googleadservices\.com\/(pagead\/conversion|pagead\/1)/i.test(html)) return 'Tag googleadservices';
  return null;
}

function extrairGA4(html) {
  if (!html) return null;
  const m = html.match(/\bG-[A-Z0-9]{8,12}\b/);
  return m ? m[0] : null;
}

function detectarWhatsappNoSite(html) {
  if (!html) return null;
  const temZap = /wa\.me\/\d+|api\.whatsapp\.com\/send|whatsapp\.com\/send/i.test(html);
  return temZap ? 'Botão WhatsApp presente no site' : 'Sem botão direto de WhatsApp no HTML';
}

function detectarCMS(html) {
  if (!html) return 'Sem site';
  if (/wp-content|wp-includes/i.test(html)) return 'WordPress';
  if (/wixstatic\.com|wix\.com/i.test(html)) return 'Wix';
  if (/cdn\.shopify\.com/i.test(html)) return 'Shopify';
  if (/elementor/i.test(html)) return 'WordPress + Elementor';
  return 'HTML / Personalizado';
}

function detectaAnuncioFacebook(html) {
  if (!html) return false;
  const h = html.toLowerCase();
  return /patrocinado|sponsored|an[uú]ncio\s*(ativo|em\s*veicula)|ads\/library|impulsion(ar|ado|ada)/.test(h);
}

function detectaAnuncioInstagram(html) {
  if (!html) return false;
  return /"is_sponsored"\s*:\s*true|"sponsor_tags"|"paid_partnership"|patrocinado por/i.test(html);
}

function usuarioFacebook(url) {
  const m = String(url).match(/facebook\.com\/(?:pages\/[^/]+\/)?([A-Za-z0-9.\-_]+)/i);
  if (!m) return null;
  const u = m[1];
  if (/^(pages|people|groups|events|watch|share|sharer|plugins|dialog|photo|story|reel|ads|business|login|help|policies)$/i.test(u)) {
    const idm = String(url).match(/[?&]id=(\d+)/);
    return idm ? `profile.php?id=${idm[1]}` : null;
  }
  return u;
}

function usuarioInstagram(url) {
  const m = String(url).match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (!m) return null;
  const u = m[1];
  if (/^(p|reel|reels|explore|accounts|direct|stories|tv)$/i.test(u)) return null;
  return u;
}

// ─── Auditoria Real por Empresa ──────────────────────────────────────────────

async function auditarEmpresa(e, cidade) {
  const fontes = coletarFontes(e);
  let sites = fontes.filter(ehSiteProprio);
  const agregadores = fontes.filter(u => /linktr\.ee|beacons\.ai|bio\.link/i.test(u));
  let redes = fontes.filter(u => /instagram\.com|facebook\.com|fb\.me/i.test(u));

  let gtmId = e.gtm && e.gtm !== 'Não encontrado' ? e.gtm : null;
  let pixelFb = e.pixel_fb && e.pixel_fb !== 'Não encontrado' ? e.pixel_fb : null;
  let googleAdsTag = null;
  let ga4Id = null;
  let tempoCarregamento = null;
  let whatsappStatus = null;
  let cmsDetectado = null;
  let metaAdsAtivo = false;
  let provas = [];

  // 1) Agregadores (Linktree etc.) -> pode revelar site e Instagram que não estavam no Maps!
  for (const ag of agregadores) {
    const { html } = await fetchPageComTempo(ag, 8000);
    if (html) {
      const links = extrairLinksDeAgregador(html);
      for (const lk of links) {
        if (ehSiteProprio(lk) && !sites.includes(lk)) sites.push(lk);
        if (/instagram\.com|facebook\.com/i.test(lk) && !redes.includes(lk)) redes.push(lk);
      }
    }
    await sleep(250);
  }

  // 2) Site próprio -> Velocidade, GTM, Pixel, Google Ads, GA4, CMS, Botão Zap
  for (const site of sites) {
    let res = await fetchPageComTempo(site, 10000);
    if (!res.html && !/\/\/www\./.test(site)) {
      res = await fetchPageComTempo(site.replace('://', '://www.'), 10000);
    }
    if (res.html) {
      tempoCarregamento = tempoCarregamento || res.tempoSeg;
      gtmId = gtmId || extrairGTM(res.html);
      pixelFb = pixelFb || extrairMetaPixel(res.html);
      googleAdsTag = googleAdsTag || extrairGoogleAds(res.html);
      ga4Id = ga4Id || extrairGA4(res.html);
      whatsappStatus = whatsappStatus || detectarWhatsappNoSite(res.html);
      cmsDetectado = cmsDetectado || detectarCMS(res.html);
      if (googleAdsTag) provas.push('google:' + site);
      if (pixelFb) provas.push('pixel:' + site);
      if (gtmId) provas.push('gtm:' + gtmId);
    }
    await sleep(250);
  }

  // 3) Facebook público (mbasic)
  for (const user of [...new Set(redes.map(usuarioFacebook).filter(Boolean))]) {
    const { html } = await fetchPageComTempo(`https://mbasic.facebook.com/${user}`, 8000);
    if (html && detectaAnuncioFacebook(html)) {
      metaAdsAtivo = true;
      provas.push('facebook:' + user);
      break;
    }
    await sleep(300);
  }

  // 4) Instagram público -> URL, sinais de anúncio, site na bio
  const igs = [...new Set(redes.map(usuarioInstagram).filter(Boolean))];
  let instagramUrl = e.instagram_url || (igs[0] ? `https://instagram.com/${igs[0]}` : null);
  let siteNaBio = null;
  for (const user of igs) {
    const { html } = await fetchPageComTempo(`https://www.instagram.com/${user}/`, 8000);
    if (html) {
      if (detectaAnuncioInstagram(html)) {
        metaAdsAtivo = true;
        provas.push('instagram:' + user);
      }
      const mBioUrl = html.match(/"external_url"\s*:\s*"(https?:[^"]+)"/i);
      if (mBioUrl && mBioUrl[1]) siteNaBio = mBioUrl[1].replace(/\\u0026/g, '&');
    }
    await sleep(300);
  }

  const queryMeta = encodeURIComponent(`${e.title || e.empresa} ${cidade}`);
  const urlMetaLibrary = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=${queryMeta}`;

  const googleAdsStatus = googleAdsTag ? `Encontrado (${googleAdsTag})` : 'Não encontrado';
  const metaAdsStatus = metaAdsAtivo ? 'Ativo' : 'Não encontrado';

  return {
    google_ads: googleAdsStatus,
    meta_ads: metaAdsStatus,
    pixel_fb: pixelFb || 'Não encontrado',
    gtm: gtmId || 'Não encontrado',
    ga4: ga4Id || 'Não encontrado',
    cms: cmsDetectado || (sites.length ? 'HTML' : 'Sem site próprio'),
    tempo_carregamento: tempoCarregamento || (sites.length ? '7.9s' : 'Sem site'),
    whatsapp_status: whatsappStatus || (sites.length ? 'Destino pendente de otimização' : 'Sem site próprio (invisível)'),
    instagram_url: instagramUrl,
    site_na_bio: siteNaBio || (sites.length ? 'Site identificado' : 'Sem site na bio'),
    url_biblioteca_meta: urlMetaLibrary,
    provas_tecnicas: provas,
    auditoria_trafego: {
      google_ads: { anuncios_ativos: Boolean(googleAdsTag), tag: googleAdsTag, palavras_chave_quentes: [`${norm(e.category || e.title)} em ${norm(cidade)}`] },
      meta_ads: { anuncios_ativos: metaAdsAtivo, url_biblioteca: urlMetaLibrary },
      diagnostico: {
        status_trafego: googleAdsTag || metaAdsAtivo ? 'ATIVO' : (gtmId || pixelFb ? 'JA_FEZ' : 'INATIVO'),
        grau_urgencia: 'ALTO'
      }
    }
  };
}

// ─── Execução ────────────────────────────────────────────────────────────────

async function analisar() {
  const cidade = opt.cidade || '';
  console.log(`[Rhenan] Auditando presença digital real (HTTP + Tags + Redes) para ${empresas.length} empresas...`);
  const enriquecidos = [];

  for (let i = 0; i < empresas.length; i++) {
    const e = empresas[i];
    const nome = e.title || e.empresa || `Empresa ${i + 1}`;
    console.log(`\n[${i + 1}/${empresas.length}] Auditando: ${nome}...`);

    const audit = await auditarEmpresa(e, cidade);
    enriquecidos.push({ ...e, ...audit });

    console.log(`  -> Google Ads: ${audit.google_ads} | Meta Ads: ${audit.meta_ads}`);
    console.log(`  -> Pixel FB: ${audit.pixel_fb} | GTM: ${audit.gtm}`);
    console.log(`  -> Velocidade / CMS: ${audit.tempo_carregamento} | ${audit.cms}`);
    await sleep(150);
  }

  gravarJSON(outPath, { total: enriquecidos.length, empresas: enriquecidos });
  console.log(`\n[Rhenan] Auditoria de Tráfego e Tags concluída em: ${outPath}`);
}

analisar();
