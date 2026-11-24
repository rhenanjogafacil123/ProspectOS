#!/usr/bin/env node
/**
 * Rhenan — Extrator de Métricas e Performance do Instagram
 * Puxa as últimas publicações, alcance, engajamento e salva relatório em saidas/
 * 
 * Uso:
 * node scripts/instagram/metricas.js [--limite 10] [--json]
 */

const fs = require('fs');
const path = require('path');
const { InstagramClient } = require('./instagram-client');

const args = process.argv.slice(2);
function getArg(nome) {
  const idx = args.indexOf('--' + nome);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}
const exportarJson = args.includes('--json');
const limite = parseInt(getArg('limite') || '10', 10);

async function main() {
  const client = new InstagramClient();

  console.log(`[Rhenan Metrics] Buscando perfil e últimas ${limite} publicações...`);
  const profile = await client.getProfile();
  console.log(`\nConta: @${profile.username || 'n/a'} (${profile.name || 'Rhenan'}) | ID: ${profile.user_id || profile.id}`);

  const mediaList = await client.getRecentMedia(limite);
  const posts = mediaList.data || [];

  if (posts.length === 0) {
    console.log(`Nenhuma publicação encontrada.`);
    process.exit(0);
  }

  console.log(`\n--------------------------------------------------------------------------`);
  console.log(`Data        | Tipo      | Likes | Coment. | Link / Resumo`);
  console.log(`--------------------------------------------------------------------------`);

  const relatorio = [];

  for (const post of posts) {
    const dataStr = post.timestamp ? post.timestamp.split('T')[0] : 'n/a';
    const tipo = (post.media_type || 'POST').padEnd(9);
    const likes = String(post.like_count ?? '-').padEnd(5);
    const comments = String(post.comments_count ?? '-').padEnd(7);
    const resumoLegenda = (post.caption || '').replace(/\n/g, ' ').slice(0, 35);

    console.log(`${dataStr}  | ${tipo} | ${likes} | ${comments} | ${resumoLegenda}...`);

    let insights = null;
    try {
      insights = await client.getMediaInsights(post.id);
    } catch (e) {
      // Alguns formatos ou posts recentes podem não ter insights consolidados ainda
    }

    relatorio.push({
      id: post.id,
      tipo: post.media_type,
      data: post.timestamp,
      link: post.permalink,
      likes: post.like_count,
      comentarios: post.comments_count,
      legenda: post.caption,
      insights
    });
  }

  console.log(`--------------------------------------------------------------------------\n`);

  // Salva em saidas/
  const dirSaidas = path.resolve(process.cwd(), 'saidas');
  if (!fs.existsSync(dirSaidas)) fs.mkdirSync(dirSaidas, { recursive: true });
  
  const arquivoSaida = path.join(dirSaidas, 'metricas-instagram.json');
  fs.writeFileSync(arquivoSaida, JSON.stringify({ perfil: profile, posts: relatorio }, null, 2));
  console.log(`✓ Relatório completo salvo em: saidas/metricas-instagram.json`);
}

main().catch(err => {
  console.error('[Erro]', err.message);
  process.exit(1);
});
