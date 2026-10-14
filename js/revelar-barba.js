// Ofício 22 — "a navalha do cursor": por onde o mouse passa, a barba some.
// Adaptação do efeito de revelação líquida: a foto COM barba fica sempre visível
// (<img>) e um canvas por cima pinta a foto SEM barba ao longo do rastro do cursor,
// com um pincel de borda suave que vai se apagando sozinho.
//
// As duas fotos são da mesma imagem gerada (pessoa fictícia), alinhadas ao pixel.

const RAIO_PINCEL = 143;   // px de CSS
const DECAIMENTO = 0.016;  // quanto o rastro apaga por quadro enquanto o mouse se move
const QUADROS_ATE_LIMPAR = 120;

/**
 * @param {HTMLElement} caixa  Elemento posicionado que contém a <img> da foto com barba.
 * @param {{ srcRevelada: string }} opcoes  Foto sem barba (mesmo enquadramento).
 * @returns {Promise<void>} resolve quando a foto revelada carregou e o efeito está ativo.
 */
export function iniciarRevelacao(caixa, { srcRevelada }) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.decoding = 'async';
    imagem.onerror = () => reject(new Error('Foto revelada não carregou: ' + srcRevelada));
    imagem.onload = () => { montar(caixa, imagem); resolve(); };
    imagem.src = srcRevelada;
  });
}

function montar(caixa, imagem) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = document.createElement('canvas');
  canvas.className = 'hero__foto-pincel';
  canvas.setAttribute('aria-hidden', 'true');
  caixa.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Foto revelada já no tamanho do canvas ("object-fit: cover", centralizada)
  const capa = document.createElement('canvas');
  const capaCtx = capa.getContext('2d');
  // Pincel: um quadrado com gradiente radial, recortado pela foto revelada
  const pincel = document.createElement('canvas');
  const pincelCtx = pincel.getContext('2d');

  let raio = RAIO_PINCEL * dpr;
  let diametro = Math.ceil(raio * 2);
  let centro = diametro / 2;
  let pontos = [];
  let ultimo = null;
  let ocioso = 0;
  let rodando = false;
  let visivel = true;

  function medir() {
    const caixaRect = caixa.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(caixaRect.width * dpr));
    canvas.height = Math.max(1, Math.round(caixaRect.height * dpr));
    capa.width = canvas.width;
    capa.height = canvas.height;
    const escala = Math.max(capa.width / imagem.naturalWidth, capa.height / imagem.naturalHeight);
    const w = imagem.naturalWidth * escala;
    const h = imagem.naturalHeight * escala;
    capaCtx.clearRect(0, 0, capa.width, capa.height);
    capaCtx.drawImage(imagem, (capa.width - w) / 2, (capa.height - h) / 2, w, h);
    raio = RAIO_PINCEL * dpr;
    diametro = Math.ceil(raio * 2);
    centro = diametro / 2;
    pincel.width = pincel.height = diametro;
    ultimo = null;
  }

  function carimbar(x, y) {
    pincelCtx.globalCompositeOperation = 'source-over';
    pincelCtx.clearRect(0, 0, diametro, diametro);
    const gradiente = pincelCtx.createRadialGradient(centro, centro, 0, centro, centro, centro);
    gradiente.addColorStop(0, 'rgba(255,255,255,1)');
    gradiente.addColorStop(0.55, 'rgba(255,255,255,0.82)');
    gradiente.addColorStop(1, 'rgba(255,255,255,0)');
    pincelCtx.fillStyle = gradiente;
    pincelCtx.fillRect(0, 0, diametro, diametro);
    // Só sobra a foto revelada debaixo do pincel
    pincelCtx.globalCompositeOperation = 'source-in';
    pincelCtx.drawImage(capa, x - centro, y - centro, diametro, diametro, 0, 0, diametro, diametro);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(pincel, x - centro, y - centro);
  }

  function quadro() {
    const desenhando = pontos.length > 0;
    if (desenhando) ocioso = 0;
    else if (++ocioso > QUADROS_ATE_LIMPAR) { rodando = false; return; }

    // O rastro apaga aos poucos; parado, apaga cada vez mais rápido
    const apagar = desenhando ? DECAIMENTO : Math.min(DECAIMENTO + ocioso * 0.004, 0.5);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0,0,0,${apagar})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (desenhando) {
      for (const p of pontos) carimbar(p.x, p.y);
      pontos = [];
    }
    if (ocioso === QUADROS_ATE_LIMPAR) ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(quadro);
  }

  function acordar() {
    if (rodando) return;
    rodando = true;
    requestAnimationFrame(quadro);
  }

  function aoMover(e) {
    if (!visivel) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    // Longe da foto: ignora e recomeça o traço quando voltar
    if (x < -raio || y < -raio || x > canvas.width + raio || y > canvas.height + raio) {
      ultimo = null;
      return;
    }
    if (ultimo) {
      // Preenche o caminho entre dois eventos para o traço não sair pontilhado
      const dx = x - ultimo.x;
      const dy = y - ultimo.y;
      const passo = Math.max(raio * 0.3, 1);
      const n = Math.min(Math.ceil(Math.hypot(dx, dy) / passo), 60);
      for (let i = 1; i <= n; i++) pontos.push({ x: ultimo.x + (dx * i) / n, y: ultimo.y + (dy * i) / n });
    } else {
      pontos.push({ x, y });
    }
    ultimo = { x, y };
    acordar();
  }

  medir();
  new ResizeObserver(medir).observe(caixa);
  // Fora da tela, nem escuta o mouse
  new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting;
    if (!visivel) ultimo = null;
  }).observe(caixa);
  window.addEventListener('pointermove', aoMover, { passive: true });
}
