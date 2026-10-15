// Gera a imagem estática do poste (plano B) a partir do próprio 3D.
// Uso:
//   1. python3 -m http.server 8022        (na raiz do projeto)
//   2. node ferramentas/gerar-imagem-poste.cjs
// Precisa de Playwright (npm i -D playwright) e Python com Pillow (para o WebP).
// Saída: img/poste-240.webp e img/poste-480.webp (fundo transparente).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8022/index.html';
const LARGURAS = [240, 480];
const RAIZ = path.resolve(__dirname, '..');

(async () => {
  // GL por software para funcionar em qualquer máquina (inclusive sem GPU)
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  if (process.env.HTTPS_PROXY) args.push('--proxy-server=' + process.env.HTTPS_PROXY, '--proxy-bypass-list=127.0.0.1;localhost');
  const navegador = await chromium.launch({ args });
  const pagina = await navegador.newPage();
  await pagina.goto(BASE + '?sem3d', { waitUntil: 'networkidle' });
  for (const largura of LARGURAS) {
    const dataUrl = await pagina.evaluate(
      async (l) => (await import('./js/poste3d.js')).capturarImagem(l),
      largura,
    );
    const png = path.join(RAIZ, 'img', `poste-${largura}.png`);
    fs.writeFileSync(png, Buffer.from(dataUrl.split(',')[1], 'base64'));
    execFileSync('python3', ['-c',
      'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=84, method=6, alpha_quality=90)',
      png, png.replace(/\.png$/, '.webp')]);
    fs.unlinkSync(png);
    console.log('gerado', `img/poste-${largura}.webp`);
  }
  await navegador.close();
})();
