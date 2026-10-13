// Ofício 22 — script principal.
// Hero: entrada em GSAP (uma sequência) + poste 3D carregado sob demanda,
// com imagem estática como plano B.

const raiz = document.documentElement;
raiz.classList.add('js');

const parametros = new URLSearchParams(location.search);
const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Entrada do hero ---------- */

// Rede de segurança: se o GSAP não carregar, o texto aparece mesmo assim.
const SEGURANCA_MS = 1500;
const liberarTexto = () => raiz.classList.remove('entrada');
const seguranca = setTimeout(liberarTexto, SEGURANCA_MS);

// Devolve uma promessa que resolve quando a entrada termina (ou na hora, se não houver entrada).
function entradaDoHero() {
  if (!raiz.classList.contains('entrada')) return Promise.resolve(); // movimento reduzido ou já liberado
  if (!window.gsap) { liberarTexto(); return Promise.resolve(); }
  clearTimeout(seguranca);

  const { gsap } = window;
  // Estados iniciais aplicados antes de tirar a classe, no mesmo quadro: sem piscar.
  gsap.set('.hero__palavra--esq', { opacity: 0, xPercent: -12 });
  gsap.set('.hero__palavra--dir', { opacity: 0, xPercent: 12 });
  gsap.set('.hero__poste', { opacity: 0, y: 40 });
  gsap.set('.hero__texto [data-entrada]', { opacity: 0, y: 16 });
  liberarTexto();

  // Uma única sequência: palavras se abrem, o poste sobe, o texto entra.
  return gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.hero__palavra', { opacity: 1, xPercent: 0, duration: 0.9 })
    .to('.hero__poste', { opacity: 1, y: 0, duration: 0.9 }, '<0.1')
    .to('.hero__texto [data-entrada]', { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '<0.35')
    .then(() => {});
}

/* ---------- Poste 3D ---------- */

// Decide se vale a pena carregar o 3D neste aparelho.
// ?forcar3d ignora a checagem de aparelho fraco (usado nos testes, que rodam com GL por software).
function aparelhoAguenta3D() {
  if (parametros.has('sem3d')) return false;
  if (movimentoReduzido) return false;
  const forcar = parametros.has('forcar3d');
  if (!forcar) {
    if (navigator.connection && navigator.connection.saveData) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
  }
  try {
    const teste = document.createElement('canvas');
    // failIfMajorPerformanceCaveat: recusa GL por software (sinal de aparelho fraco)
    const gl = teste.getContext('webgl2', forcar ? {} : { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    if (!forcar) {
      // Segunda checagem: placa "de mentira" (renderização por software)
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const placa = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
      if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(placa)) return false;
    }
    const perda = gl.getExtension('WEBGL_lose_context');
    if (perda) perda.loseContext();
    return true;
  } catch {
    return false;
  }
}

// O 3D só começa depois da entrada do hero, para não disputar a thread principal
// com a animação do texto. Como a imagem é o próprio 3D, a troca não aparece.
function carregarPoste(depoisDaEntrada) {
  const palco = document.querySelector('.hero__poste');
  if (!palco || !aparelhoAguenta3D()) {
    raiz.dataset.poste = 'imagem';
    return;
  }

  const quandoOcioso = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  // Só carrega quando o hero estiver na tela, e depois que o texto já foi desenhado.
  const observador = new IntersectionObserver(([entrada]) => {
    if (!entrada.isIntersecting) return;
    observador.disconnect();
    depoisDaEntrada.then(() => quandoOcioso(() => {
      performance.mark('poste-inicio');
      import('./poste3d.js')
        .then(({ iniciarPoste }) => iniciarPoste(palco, {
          aoFicarPronto: () => {
            raiz.dataset.poste = '3d';
            performance.mark('poste-pronto');
          },
        }))
        .catch((erro) => {
          raiz.dataset.poste = 'imagem';
          console.warn('Poste 3D indisponível, mantendo a imagem estática.', erro);
        });
    }, { timeout: 1500 }));
  });
  observador.observe(palco);
}

carregarPoste(entradaDoHero());
