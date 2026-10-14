// Ofício 22 — poste de barbearia em 3D, 100% procedural.
// Geometria, textura das listras e o "estúdio" que gera os reflexos são feitos
// por código. Nenhum arquivo de modelo ou imagem é carregado.
//
// Comportamento: o cilindro interno gira devagar conforme a rolagem e o poste
// inclina de leve seguindo o mouse. Quando nada muda, para de desenhar
// (sem giro infinito). Fora da tela, pausa.

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Color, Vector2,
  CylinderGeometry, LatheGeometry, TorusGeometry, SphereGeometry, ConeGeometry, BoxGeometry,
  MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial,
  CanvasTexture, RepeatWrapping, ClampToEdgeWrapping, SRGBColorSpace,
  DirectionalLight, HemisphereLight, PMREMGenerator, NeutralToneMapping,
  AdditiveBlending, DoubleSide, BackSide,
} from 'three';

// Proporção do quadro onde o poste é desenhado (largura / altura).
// A mesma proporção é usada na imagem estática do plano B.
export const PROPORCAO = 9 / 26;

// Medidas do poste (unidades da cena)
const RAIO_LISTRAS = 0.34;
const RAIO_VIDRO = 0.38;
const ALTURA_VIDRO = 2.5;
const GIRO_POR_PIXEL = 0.006; // radianos de giro do cilindro por pixel rolado (~0,34°)
const VELOCIDADE_MAX = Math.PI; // radianos por segundo (meia volta/s): giro sempre lento
const INCLINACAO_MAX = 0.12;  // radianos
const SUAVIDADE = 3.2;        // quanto maior, mais rápido alcança o alvo
const LIMIAR = 0.002;         // abaixo disso (radianos) o movimento é imperceptível: para de desenhar

function lerCor(nome, padrao) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return valor || padrao;
}

function coresDaMarca() {
  return {
    ambar: lerCor('--cor-acento', '#F2B630'),
    branco: lerCor('--cor-texto', '#F2F2EE'),
    carvao: lerCor('--cor-fundo', '#161616'),
  };
}

// Listras a 45° que se repetem sem emenda nos dois sentidos.
// Fundo branco + faixas âmbar e carvão desenhadas como paralelogramos
// (o canvas 2D suaviza as bordas e é rápido, mesmo em celular).
function texturaListras(cores) {
  const T = 512;
  const periodo = T / 2;               // 2 ciclos por volta
  const faixa = periodo / 4;           // âmbar, branco, carvão, branco
  const tela = document.createElement('canvas');
  tela.width = tela.height = T;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = cores.branco;
  ctx.fillRect(0, 0, T, T);
  const faixas = [[0, cores.ambar], [2 * faixa, cores.carvao]];
  for (let x0 = -T; x0 < 2 * T; x0 += periodo) {
    for (const [deslocamento, cor] of faixas) {
      const a = x0 + deslocamento;     // faixa entre as retas x + y = a e x + y = a + faixa
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.moveTo(a, 0);
      ctx.lineTo(a + faixa, 0);
      ctx.lineTo(a + faixa - T, T);
      ctx.lineTo(a - T, T);
      ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new CanvasTexture(tela);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  // 1 volta na horizontal; na vertical, repete conforme a altura para manter o ângulo
  tex.repeat.set(1, ALTURA_VIDRO / (2 * Math.PI * RAIO_LISTRAS) * 0.62);
  return tex;
}

// Brilho do vidro: duas faixas verticais claras que somam luz (truque de estúdio).
function texturaBrilho() {
  const tela = document.createElement('canvas');
  tela.width = 256; tela.height = 4;
  const ctx = tela.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0.00, 'rgba(0,0,0,0)');
  grad.addColorStop(0.36, 'rgba(0,0,0,0)');
  grad.addColorStop(0.40, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.43, 'rgba(0,0,0,0)');
  grad.addColorStop(0.58, 'rgba(0,0,0,0)');
  grad.addColorStop(0.60, 'rgba(255,255,255,0.18)');
  grad.addColorStop(0.64, 'rgba(0,0,0,0)');
  grad.addColorStop(1.00, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 4);
  const tex = new CanvasTexture(tela);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  return tex;
}

// "Estúdio" procedural: caixas de luz numa sala escura, convertidas em mapa de
// reflexo. É o que dá o brilho discreto no metal e no vidro.
function ambienteEstudio(renderer) {
  const sala = new Scene();
  sala.background = new Color(0x2a2a2a);
  const caixa = new BoxGeometry(1, 1, 1);
  const softbox = (forca, pos, escala) => {
    const m = new Mesh(caixa, new MeshBasicMaterial({ color: new Color(1, 1, 1).multiplyScalar(forca), side: DoubleSide }));
    m.position.set(...pos);
    m.scale.set(...escala);
    sala.add(m);
  };
  softbox(6.0, [-3.2, 1.0, 1.8], [0.15, 4.0, 2.2]); // principal, à esquerda
  softbox(2.2, [3.2, 0.5, 1.2], [0.15, 3.0, 1.6]);  // preenchimento, à direita
  softbox(2.0, [0, 4.0, 0], [3.0, 0.15, 3.0]);      // teto
  const parede = new Mesh(new BoxGeometry(12, 12, 12), new MeshBasicMaterial({ color: 0x262626, side: BackSide }));
  sala.add(parede);
  const pmrem = new PMREMGenerator(renderer);
  // 128 px bastam: o poste ocupa no máximo ~160 px de largura na tela
  const env = pmrem.fromScene(sala, 0.035, 0.1, 100, { size: 128 }).texture;
  pmrem.dispose();
  caixa.dispose();
  return env;
}

// Perfil das tampas (girado em torno do eixo para virar sólido).
function perfilTampa() {
  const p = [new Vector2(0.415, 0), new Vector2(0.44, 0.015), new Vector2(0.44, 0.11),
    new Vector2(0.42, 0.13), new Vector2(0.39, 0.14)];
  const passos = 14;
  for (let i = 1; i <= passos; i++) {
    const t = (i / passos) * (Math.PI / 2);
    p.push(new Vector2(0.06 + 0.33 * Math.cos(t), 0.14 + 0.24 * Math.sin(t)));
  }
  p.push(new Vector2(0.045, 0.40), new Vector2(0.045, 0.46), new Vector2(0.0, 0.46));
  return p;
}

function montarPoste(cores, renderer) {
  const poste = new Group();

  const metal = new MeshStandardMaterial({ color: 0xd2d2cc, metalness: 1, roughness: 0.32 });
  const metalEscuro = new MeshStandardMaterial({ color: 0x6a6a66, metalness: 1, roughness: 0.4 });

  // Cilindro interno com as listras (é ele que gira)
  const texListras = texturaListras(cores);
  texListras.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const listras = new Mesh(
    new CylinderGeometry(RAIO_LISTRAS, RAIO_LISTRAS, ALTURA_VIDRO, 96, 1, true),
    new MeshStandardMaterial({
      map: texListras,
      emissiveMap: texListras,
      emissive: 0xffffff,
      emissiveIntensity: 0.32, // "aceso" por dentro, sem brilhar demais
      roughness: 0.6,
      metalness: 0,
    }),
  );
  poste.add(listras);

  // Vidro: camada quase transparente + faixas de brilho somadas
  const vidro = new Mesh(
    new CylinderGeometry(RAIO_VIDRO, RAIO_VIDRO, ALTURA_VIDRO, 96, 1, true),
    new MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.14, roughness: 0.05,
      metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, depthWrite: false,
    }),
  );
  vidro.renderOrder = 1;
  poste.add(vidro);

  const brilho = new Mesh(
    new CylinderGeometry(RAIO_VIDRO + 0.002, RAIO_VIDRO + 0.002, ALTURA_VIDRO * 0.96, 64, 1, true),
    new MeshBasicMaterial({ map: texturaBrilho(), transparent: true, blending: AdditiveBlending, depthWrite: false }),
  );
  brilho.rotation.y = -Math.PI / 2; // faixa de luz do lado da softbox principal
  brilho.renderOrder = 2;
  poste.add(brilho);

  // Tampas de metal (em cima e embaixo, espelhadas)
  const geoTampa = new LatheGeometry(perfilTampa(), 72);
  const tampaCima = new Mesh(geoTampa, metal);
  tampaCima.position.y = ALTURA_VIDRO / 2;
  poste.add(tampaCima);
  const tampaBaixo = new Mesh(geoTampa, metal);
  tampaBaixo.position.y = -ALTURA_VIDRO / 2;
  tampaBaixo.rotation.x = Math.PI;
  poste.add(tampaBaixo);

  // Aros que prendem o vidro
  const geoAro = new TorusGeometry(RAIO_VIDRO + 0.02, 0.022, 16, 96);
  for (const sinal of [1, -1]) {
    const aro = new Mesh(geoAro, metalEscuro);
    aro.rotation.x = Math.PI / 2;
    aro.position.y = sinal * (ALTURA_VIDRO / 2);
    poste.add(aro);
  }

  // Remate de cima (bola) e de baixo (ponta)
  const bola = new Mesh(new SphereGeometry(0.085, 32, 16), metal);
  bola.position.y = ALTURA_VIDRO / 2 + 0.53;
  poste.add(bola);
  const ponta = new Mesh(new ConeGeometry(0.07, 0.26, 32), metal);
  ponta.rotation.x = Math.PI;
  ponta.position.y = -(ALTURA_VIDRO / 2 + 0.46 + 0.13);
  poste.add(ponta);

  return { poste, listras };
}

// Cede a vez para o navegador desenhar/responder entre etapas pesadas.
const cederVez = () => new Promise((r) => setTimeout(r, 0));

// Monta renderer, cena e câmera. Com `ceder`, a montagem é feita em etapas
// (sem uma tarefa longa travando a página). A captura do plano B usa a versão direta.
function* etapasDaCena(canvas, preservarQuadro) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: preservarQuadro,
  });
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  yield;

  const cena = new Scene();
  cena.environment = ambienteEstudio(renderer);
  cena.environmentIntensity = 0.9;
  yield;

  const chave = new DirectionalLight(0xffffff, 1.4);
  chave.position.set(-3, 3, 4);
  cena.add(chave);
  cena.add(new HemisphereLight(0xffffff, 0x101010, 0.35));

  const { poste, listras } = montarPoste(coresDaMarca(), renderer);
  cena.add(poste);

  // Câmera "teleobjetiva" (pouca distorção), enquadrando o poste inteiro
  const camera = new PerspectiveCamera(20, PROPORCAO, 0.1, 50);
  const alturaTotal = ALTURA_VIDRO + 2 * 0.62;
  const distancia = (alturaTotal * 1.1) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  camera.position.set(0, 0.35, distancia);
  camera.lookAt(0, 0, 0);

  return { renderer, cena, camera, poste, listras };
}

function criarCena(canvas, { preservarQuadro = false } = {}) {
  const etapas = etapasDaCena(canvas, preservarQuadro);
  let passo = etapas.next();
  while (!passo.done) passo = etapas.next();
  return passo.value;
}

async function criarCenaEmEtapas(canvas) {
  const etapas = etapasDaCena(canvas, false);
  let passo = etapas.next();
  while (!passo.done) {
    await cederVez();
    passo = etapas.next();
  }
  return passo.value;
}

function ajustarTamanho(ctx, largura, altura, razaoPixel) {
  ctx.renderer.setPixelRatio(razaoPixel);
  ctx.renderer.setSize(largura, altura, false);
  ctx.camera.aspect = largura / altura;
  ctx.camera.updateProjectionMatrix();
}

const razaoPixel = () => Math.min(window.devicePixelRatio || 1, 2);

/**
 * Monta o poste interativo dentro de `palco` (o elemento .hero__poste).
 * Lança erro se o WebGL não estiver disponível — quem chama mantém a imagem estática.
 * @param {HTMLElement} palco
 * @param {{ aoFicarPronto?: () => void, aoFalhar?: () => void }} opcoes
 */
export async function iniciarPoste(palco, { aoFicarPronto, aoFalhar } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'hero__poste-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  palco.appendChild(canvas);

  let ctx;
  try {
    ctx = await criarCenaEmEtapas(canvas);
  } catch (erro) {
    canvas.remove();
    throw erro;
  }

  // Estado: valores atuais perseguem os alvos com suavização exponencial
  let giro = 0, alvoGiro = 0;
  let inclX = 0, alvoInclX = 0, inclZ = 0, alvoInclZ = 0;
  let pronto = false, perdido = false, visivel = true, rodando = false, ultimo = 0;

  const medir = () => {
    const caixa = palco.getBoundingClientRect();
    if (caixa.width > 0 && caixa.height > 0) ajustarTamanho(ctx, caixa.width, caixa.height, razaoPixel());
  };

  const desenhar = () => {
    if (!pronto || perdido) return; // nada de desenhar antes dos shaders prontos
    ctx.listras.rotation.y = giro;
    ctx.poste.rotation.x = inclX;
    ctx.poste.rotation.z = inclZ;
    ctx.renderer.render(ctx.cena, ctx.camera);
  };

  const quadro = (agora) => {
    if (perdido) { rodando = false; return; }
    // O carimbo do rAF pode vir antes do performance.now() de acordar(): dt nunca negativo
    const dt = Math.min(Math.max((agora - ultimo) / 1000, 0), 0.1);
    ultimo = agora;
    const k = 1 - Math.exp(-SUAVIDADE * dt);
    // giro: suavizado e com velocidade máxima (meia volta por segundo)
    const passoMax = VELOCIDADE_MAX * dt;
    giro += Math.max(-passoMax, Math.min(passoMax, (alvoGiro - giro) * k));
    inclX += (alvoInclX - inclX) * k;
    inclZ += (alvoInclZ - inclZ) * k;
    desenhar();
    const parado = Math.abs(alvoGiro - giro) < LIMIAR && Math.abs(alvoInclX - inclX) < LIMIAR && Math.abs(alvoInclZ - inclZ) < LIMIAR;
    if (parado || !visivel) { rodando = false; return; }
    requestAnimationFrame(quadro);
  };

  const acordar = () => {
    if (rodando || !visivel || !pronto || perdido) return;
    rodando = true;
    ultimo = performance.now();
    requestAnimationFrame(quadro);
  };

  // Giro proporcional aos pixels rolados (igual em qualquer largura de tela)
  const aoRolar = () => {
    alvoGiro = window.scrollY * GIRO_POR_PIXEL;
    acordar();
  };

  const aoMoverMouse = (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    alvoInclZ = -nx * INCLINACAO_MAX;
    alvoInclX = ny * INCLINACAO_MAX * 0.6;
    acordar();
  };

  window.addEventListener('scroll', aoRolar, { passive: true });
  const usaMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (usaMouse) window.addEventListener('pointermove', aoMoverMouse, { passive: true });

  // Pausa fora da tela (vale a última entrada: rolagem rápida pode juntar várias)
  const observador = new IntersectionObserver((entradas) => {
    visivel = !perdido && entradas[entradas.length - 1].isIntersecting;
    if (visivel) { aoRolar(); desenhar(); }
  });
  observador.observe(palco);

  const redimensionar = new ResizeObserver(() => { medir(); desenhar(); });
  redimensionar.observe(palco);

  // Zoom ou troca de monitor mudam a densidade de pixels: refaz o tamanho do canvas
  let consultaDpr;
  const vigiarDpr = () => {
    consultaDpr = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    consultaDpr.addEventListener('change', aoMudarDpr, { once: true });
  };
  function aoMudarDpr() { medir(); desenhar(); vigiarDpr(); }
  vigiarDpr();

  // Contexto WebGL perdido: para tudo e devolve a vez para a imagem estática
  canvas.addEventListener('webglcontextlost', () => {
    perdido = true;
    visivel = false;
    palco.classList.remove('hero__poste--3d');
    observador.disconnect();
    redimensionar.disconnect();
    window.removeEventListener('scroll', aoRolar);
    if (usaMouse) window.removeEventListener('pointermove', aoMoverMouse);
    if (consultaDpr) consultaDpr.removeEventListener('change', aoMudarDpr);
    if (aoFalhar) aoFalhar();
  });

  medir();
  // Compila os shaders sem travar a página quando o navegador permite
  if (ctx.renderer.extensions.has('KHR_parallel_shader_compile')) {
    await ctx.renderer.compileAsync(ctx.cena, ctx.camera);
  } else {
    await cederVez();
    ctx.renderer.compile(ctx.cena, ctx.camera);
  }
  if (perdido) return;
  pronto = true;
  alvoGiro = window.scrollY * GIRO_POR_PIXEL;
  giro = alvoGiro; // começa já na pose certa (sem girar sozinho ao aparecer)
  desenhar();
  // Mostra o canvas só depois do primeiro quadro desenhado (troca invisível com a imagem)
  requestAnimationFrame(() => {
    if (perdido) return;
    palco.classList.add('hero__poste--3d');
    if (aoFicarPronto) aoFicarPronto();
  });
}

/**
 * Gera a imagem estática do plano B a partir do próprio 3D (usado pelo Playwright).
 * Mesma pose inicial do poste interativo, fundo transparente.
 * @returns {string} data URL PNG
 */
export function capturarImagem(larguraPx) {
  const alturaPx = Math.round(larguraPx / PROPORCAO);
  const canvas = document.createElement('canvas');
  const ctx = criarCena(canvas, { preservarQuadro: true });
  ajustarTamanho(ctx, larguraPx, alturaPx, 1);
  ctx.renderer.render(ctx.cena, ctx.camera);
  const url = canvas.toDataURL('image/png');
  ctx.renderer.dispose();
  return url;
}
