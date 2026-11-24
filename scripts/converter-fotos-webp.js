/**
 * Script utilitário: converter-fotos-webp.js
 * Converte imagens de alta resolução (PNG/JPG) em WebP otimizado (700x700, 82% qualidade)
 * para o catálogo da Pizza do Juca e aplica alteração CIRÚRGICA de 1 linha por produto no index.html.
 * ZERO alterações de estrutura, layout ou código.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const downloadsDir = 'C:\\Users\\rhena\\Downloads';
const targetDirs = [
  'C:\\Users\\rhena\\Downloads\\Rhenan\\clientes\\Pizza do Juca\\assets\\cardapio',
  'C:\\Users\\rhena\\Downloads\\Rhenan\\clientes\\Pizza do Juca\\cardapio',
  'C:\\Users\\rhena\\Downloads\\Rhenan\\pizzadojuca_official\\assets\\cardapio',
  'C:\\Users\\rhena\\Downloads\\Rhenan\\pizzadojuca_official\\cardapio'
];

const htmlPaths = [
  'C:\\Users\\rhena\\Downloads\\Rhenan\\clientes\\Pizza do Juca\\index.html',
  'C:\\Users\\rhena\\Downloads\\Rhenan\\pizzadojuca_official\\index.html'
];

const mappings = [
  { file: 'Pizza caipira com frango, milho e Catupiry-3.png', target: 'caipira.webp', id: 'pizza-caipira', name: 'Caipira' },
  { file: 'Pizza calabresa com catupiry em treliça-1.png', target: 'calabresa-catupiry.webp', id: 'pizza-calabresa-com-catupiry', name: 'Calabresa com catupiry' },
  { file: 'Pizza Carioca de calabresa, champignon e tomate.png', target: 'carioca.webp', id: 'pizza-carioca', name: 'Carioca' },
  { file: 'Pizza Caroline com bacon, champignon e alho-1.png', target: 'caroline.webp', id: 'pizza-caroline', name: 'Caroline' },
  { file: 'Pizza Cris_ mozzarella, cebola e azeitonas.png', target: 'cris.webp', id: 'pizza-cris', name: 'Cris' },
  { file: 'Pizza Da Hora de bacon e gorgonzola.png', target: 'da-hora.webp', id: 'pizza-da-hora', name: 'Da hora' },
  { file: 'Pizza de frango com catupiry cruzado-2.png', target: 'frango-catupiry.webp', id: 'pizza-frango-com-catupiry', name: 'Frango com catupiry' },
  { file: 'Pizza de lombo ao alho dourado-6.png', target: 'lombo-ao-alho.webp', id: 'pizza-lombo-ao-alho', name: 'Lombo ao alho' },
  { file: 'Pizza de mussarela com orégano-2.png', target: 'mussarela.webp', id: 'pizza-mussarela', name: 'Mussarela' },
  { file: 'Pizza de palmito com catupiry trançado.png', target: 'diplomata.webp', id: 'pizza-diplomata', name: 'Diplomata' },
  { file: 'Pizza de palmito, milho, azeitonas e muçarela-2.png', target: 'extravagante.webp', id: 'pizza-extravagante', name: 'Extravagante' },
  { file: 'Pizza Europeia de Bacon, Ervilhas e Palmito-1.png', target: 'europeia.webp', id: 'pizza-europeia', name: 'Europeia' },
  { file: 'Pizza Frango Caribe com Catupiry e Banana-3.png', target: 'frango-caribe.webp', id: 'pizza-frango-caribe', name: 'Frango caribe' },
  { file: 'Pizza frango jardineiro com bacon e ervilhas-1.png', target: 'frango-jardineiro.webp', id: 'pizza-frango-jardineiro', name: 'Frango jardineiro' },
  { file: 'Pizza frango pizzaiolo com milho-2.png', target: 'frango-pizzaiolo.webp', id: 'pizza-frango-pizzaiolo', name: 'Frango pizzaiolo' },
  { file: 'Pizza Juquinha com bacon, champignon e ovos-3.png', target: 'juquinha.webp', id: 'pizza-juquinha', name: 'Juquinha' },
  { file: 'Pizza Kauã com catupiry trançado-4.png', target: 'kaua.webp', id: 'pizza-kau', name: 'Kauã' },
  { file: 'Pizza Lá Grega com Presunto e Palmito-5.png', target: 'la-grega.webp', id: 'pizza-l-grega', name: 'Lá grega' },
  { file: 'Pizza Nilma de salame e tomate-1.png', target: 'nilma.webp', id: 'pizza-nilma', name: 'Nilma' },
  { file: 'Pizza artesanal de ovos e bacon-3.png', target: 'ovos-com-bacon.webp', id: 'pizza-ovos-com-bacon', name: 'Ovos com bacon' },
  { file: 'Pizza Philadelphia de atum e tomate-cereja-2.png', target: 'philadelphia.webp', id: 'pizza-philadelphia', name: 'Philadelphia' },
  { file: 'Pizza premium de frango com catupiry.png', target: 'premium.webp', id: 'pizza-premium', name: 'Premium' },
  { file: 'Pizza Romanesca artesanal com catupiry.png', target: 'romanesca.webp', id: 'pizza-romanesca', name: 'Romanesca' },
  { file: 'Pizza Super Premium de Frango com Catupiry-1.png', target: 'super-premium.webp', id: 'pizza-super-premium', name: 'Super premium' },
  { file: 'Pizza Suprema artesanal-2.png', target: 'suprema.webp', id: 'pizza-suprema', name: 'Suprema' },
  { file: 'Pizza Tarantela_ salame, provolone e tomate-3.png', target: 'tarantela.webp', id: 'pizza-tarantela', name: 'Tarantela' },
  { file: 'Pizza Verão com Presunto, Ovos e Ervilhas-5.png', target: 'verao.webp', id: 'pizza-ver-o', name: 'Verão' },
  { file: 'Pizza VIGGIE vegetariana premium-4.png', target: 'viggie.webp', id: 'pizza-viggie', name: 'Viggie' }
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

mappings.forEach(m => {
  const inputPath = path.join(downloadsDir, m.file);
  if (!fs.existsSync(inputPath)) return;

  const primaryOut = path.join(targetDirs[0], m.target);
  if (!fs.existsSync(primaryOut)) {
    execSync(`ffmpeg -y -loglevel error -i "${inputPath}" -vf "scale=700:700" -c:v libwebp -quality 82 "${primaryOut}"`);
  }

  for (let i = 1; i < targetDirs.length; i++) {
    const dest = path.join(targetDirs[i], m.target);
    fs.copyFileSync(primaryOut, dest);
  }
});

// Surgical line replacement only
htmlPaths.forEach(htmlPath => {
  if (!fs.existsSync(htmlPath)) return;
  let content = fs.readFileSync(htmlPath, 'utf8');

  mappings.forEach(t => {
    const idStr = `"id": "${t.id}"`;
    const idx = content.indexOf(idStr);
    if (idx !== -1) {
      const nextIdIdx = content.indexOf('"id":', idx + idStr.length);
      const limit = nextIdIdx !== -1 ? nextIdIdx : idx + 500;
      const sub = content.substring(idx, limit);
      const imgMatch = sub.match(/"image":\s*"([^"]+)"/);
      if (imgMatch) {
        const targetImg = `assets/cardapio/${t.target}`;
        const oldDecl = imgMatch[0];
        const newDecl = `"image": "${targetImg}"`;
        if (oldDecl !== newDecl) {
          const subReplaced = sub.replace(oldDecl, newDecl);
          content = content.substring(0, idx) + subReplaced + content.substring(limit);
        }
      }
    }
  });

  fs.writeFileSync(htmlPath, content, 'utf8');
});
console.log('✅ Sincronização cirúrgica concluída.');
