#!/usr/bin/env node
/**
 * Rhenan — Publicador Oficial do Instagram
 * Suporta:
 * 1. Post com Imagem Única
 * 2. Carrossel Completo (2 a 10 slides)
 * 3. Reels / Vídeo
 * 4. Pasta de conteúdo Rhenan (marketing/conteudo/<slug>-<data>)
 * 
 * Exemplos de uso:
 * - node scripts/instagram/postar.js --imagem "https://site.com/img.png" --legenda "Meu post"
 * - node scripts/instagram/postar.js --slides "https://site.com/1.png,https://site.com/2.png" --legenda "Carrossel"
 * - node scripts/instagram/postar.js --pasta "marketing/conteudo/tema-2026-11-22"
 */

const fs = require('fs');
const path = require('path');
const { InstagramClient } = require('./instagram-client');

const args = process.argv.slice(2);
function getArg(nome) {
  const idx = args.indexOf('--' + nome);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}
const hasFlag = nome => args.includes('--' + nome);

async function main() {
  const client = new InstagramClient();

  const imagem = getArg('imagem');
  const video = getArg('video');
  const slidesArg = getArg('slides');
  const pasta = getArg('pasta') || (args[0] && !args[0].startsWith('--') ? args[0] : null);
  let legenda = getArg('legenda') || '';
  const legendaArquivo = getArg('legenda-arquivo');

  if (legendaArquivo && fs.existsSync(legendaArquivo)) {
    legenda = fs.readFileSync(legendaArquivo, 'utf-8').trim();
  }

  // MODO 1: Publicação via Pasta Rhenan (marketing/conteudo/<slug>-<data>)
  if (pasta) {
    const dirAbs = path.resolve(process.cwd(), pasta);
    if (!fs.existsSync(dirAbs)) {
      console.error(`[Erro] Pasta não encontrada: ${pasta}`);
      process.exit(1);
    }

    console.log(`[Rhenan Insta] Processando pasta de conteúdo: ${pasta}`);

    // Lê legenda.md se não foi passada via flag
    if (!legenda) {
      const legendaPath = path.join(dirAbs, 'legenda.md');
      if (fs.existsSync(legendaPath)) {
        legenda = fs.readFileSync(legendaPath, 'utf-8').trim();
        console.log(`  ✓ Legenda carregada de ${legendaPath} (${legenda.length} caracteres)`);
      }
    }

    // Busca slides em <pasta>/instagram/slide-*.png
    const pastaInsta = path.join(dirAbs, 'instagram');
    const pastaAlvo = fs.existsSync(pastaInsta) ? pastaInsta : dirAbs;
    
    const arquivos = fs.readdirSync(pastaAlvo)
      .filter(f => /slide-\d+\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0], 10);
        const numB = parseInt(b.match(/\d+/)[0], 10);
        return numA - numB;
      });

    if (arquivos.length === 0) {
      console.error(`[Erro] Nenhum slide encontrado em ${pastaAlvo} (esperado slide-01.png...)`);
      process.exit(1);
    }

    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
    if (!siteUrl) {
      console.error(`[Erro] SITE_URL não está configurado no .env. A Meta exige URLs públicas para as imagens.`);
      process.exit(1);
    }

    // Extrai o slug da pasta (ex: marketing/conteudo/como-conservar-2026-11-20 -> como-conservar)
    const baseFolder = path.basename(dirAbs);
    const slug = baseFolder.replace(/-\d{4}-\d{2}-\d{2}.*$/, '');

    // Monta as URLs públicas onde o deploy do site disponibilizou os slides
    const imageUrls = arquivos.map(arq => `${siteUrl}/img/posts/${slug}/${arq}`);
    console.log(`  ✓ ${imageUrls.length} slides mapeados via CDN/Site (${siteUrl}/img/posts/${slug}/...)`);

    try {
      let resultado;
      if (imageUrls.length === 1) {
        resultado = await client.publishPhoto({ imageUrl: imageUrls[0], caption: legenda });
      } else {
        resultado = await client.publishCarousel({ imageUrls, caption: legenda });
      }

      console.log(`\n======================================================`);
      console.log(`✓ SUCESSO: Post publicado no Instagram!`);
      console.log(`ID da Mídia: ${resultado.mediaId}`);
      console.log(`======================================================\n`);
      process.exit(0);
    } catch (err) {
      console.error(`\n[Erro na Publicação] ${err.message}`);
      process.exit(1);
    }
  }

  // MODO 2: Carrossel direto via URLs
  if (slidesArg) {
    const urls = slidesArg.split(',').map(u => u.trim()).filter(Boolean);
    try {
      const res = await client.publishCarousel({ imageUrls: urls, caption: legenda });
      console.log(`✓ Carrossel publicado com ID: ${res.mediaId}`);
      process.exit(0);
    } catch (e) {
      console.error(`[Erro] ${e.message}`);
      process.exit(1);
    }
  }

  // MODO 3: Imagem única direta
  if (imagem) {
    try {
      const res = await client.publishPhoto({ imageUrl: imagem, caption: legenda });
      console.log(`✓ Foto publicada com ID: ${res.mediaId}`);
      process.exit(0);
    } catch (e) {
      console.error(`[Erro] ${e.message}`);
      process.exit(1);
    }
  }

  // MODO 4: Reels / Vídeo
  if (video) {
    try {
      const res = await client.publishReel({ videoUrl: video, caption: legenda });
      console.log(`✓ Reel publicado com ID: ${res.mediaId}`);
      process.exit(0);
    } catch (e) {
      console.error(`[Erro] ${e.message}`);
      process.exit(1);
    }
  }

  console.log(`Uso do publicador do Instagram Rhenan:`);
  console.log(`  node scripts/instagram/postar.js --pasta marketing/conteudo/<slug>-<data>`);
  console.log(`  node scripts/instagram/postar.js --imagem <url_publica> --legenda "Texto"`);
  console.log(`  node scripts/instagram/postar.js --slides <url1,url2,...> --legenda "Texto"`);
  console.log(`  node scripts/instagram/postar.js --video <url_publica> --legenda "Texto"`);
}

main().catch(err => {
  console.error('[Erro Fatal]', err);
  process.exit(1);
});
