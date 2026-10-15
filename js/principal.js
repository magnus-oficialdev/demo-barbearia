// Ofício 22 — script principal.
// Hero: entrada em GSAP (uma sequência) + poste 3D carregado sob demanda,
// com imagem estática como plano B.

const raiz = document.documentElement;
raiz.classList.add('js');

const parametros = new URLSearchParams(location.search);
// Estado deixado pelo <head>: os blocos das seções ainda estão escondidos esperando o JS?
const revelarAtivo = raiz.classList.contains('revelar');
const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Entrada do hero ---------- */

// A classe `entrada` e a rede de segurança (1,5 s) ficam no <head> (index.html),
// para o texto aparecer mesmo se o GSAP ou este arquivo falharem.
const liberarTexto = () => raiz.classList.remove('entrada');

// Devolve uma promessa que resolve quando a entrada termina (ou na hora, se não houver entrada).
function entradaDoHero() {
  if (!raiz.classList.contains('entrada')) return Promise.resolve(); // movimento reduzido ou rede de segurança já agiu
  if (!window.gsap) { liberarTexto(); return Promise.resolve(); }
  clearTimeout(window.__segurancaEntrada);

  const { gsap } = window;
  // Estados iniciais aplicados antes de tirar a classe, no mesmo quadro: sem piscar.
  gsap.set('.hero__palavra--esq', { opacity: 0, xPercent: -12 });
  gsap.set('.hero__palavra--dir', { opacity: 0, xPercent: 12 });
  gsap.set('.hero__poste', { opacity: 0, y: 40 });
  gsap.set('.hero__foto', { opacity: 0 });
  gsap.set('.hero__texto [data-entrada]', { opacity: 0, y: 16 });
  liberarTexto();

  // Uma única sequência de 0,9 s: palavras se abrem, o poste sobe, o texto entra.
  return gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.hero__foto', { opacity: 1, duration: 0.9, ease: 'power2.out' })
    .to('.hero__palavra', { opacity: 1, xPercent: 0, duration: 0.7 }, 0)
    .to('.hero__poste', { opacity: 1, y: 0, duration: 0.7 }, '<0.05')
    .to('.hero__texto [data-entrada]', { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }, '<0.15')
    .then(() => {});
}

/* ---------- Poste 3D ---------- */

const forcar3D = parametros.has('forcar3d'); // ignora "aparelho fraco" (testes rodam com GL por software)

// Checagens baratas, feitas na hora.
function podeTentar3D() {
  if (parametros.has('sem3d') || movimentoReduzido) return false;
  if (forcar3D) return true;
  const conexao = navigator.connection;
  if (conexao && (conexao.saveData || /(^|-)2g$/.test(conexao.effectiveType || ''))) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
  return true;
}

// Checagem cara (cria um contexto WebGL): só roda depois da entrada, com a página ociosa.
function placaAguenta3D() {
  try {
    const teste = document.createElement('canvas');
    // failIfMajorPerformanceCaveat: recusa GL por software (sinal de aparelho fraco)
    const gl = teste.getContext('webgl2', forcar3D ? {} : { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    let ok = true;
    if (!forcar3D) {
      // Segunda checagem: placa "de mentira" (renderização por software)
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const placa = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
      ok = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(placa);
    }
    const perda = gl.getExtension('WEBGL_lose_context');
    if (perda) perda.loseContext();
    return ok;
  } catch {
    return false;
  }
}

// Baixa os três módulos em paralelo (em vez de um depois do outro).
function preCarregarModulos() {
  ['js/poste3d.js', 'vendor/three@0.186.1/three.module.min.js', 'vendor/three@0.186.1/three.core.min.js']
    .forEach((caminho) => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = new URL(caminho, document.baseURI).href;
      document.head.appendChild(link);
    });
}

const usarImagem = () => { raiz.dataset.poste = 'imagem'; };

// O 3D só começa depois da entrada do hero (para não disputar a thread principal
// com a animação do texto) e só se o hero estiver na tela naquele momento.
// Como a imagem é o próprio 3D, a troca não aparece.
function carregarPoste(depoisDaEntrada) {
  const palco = document.querySelector('.hero__poste');
  if (!palco || !podeTentar3D()) { usarImagem(); return; }

  const quandoOcioso = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  let heroNaTela = false;
  let agendado = false;

  const tentar = () => {
    if (!heroNaTela) { agendado = false; return; } // saiu da tela: espera voltar
    observador.disconnect();
    if (!placaAguenta3D()) { usarImagem(); return; }
    preCarregarModulos();
    performance.mark('poste-inicio');
    import('./poste3d.js')
      .then(({ iniciarPoste }) => iniciarPoste(palco, {
        aoFicarPronto: () => { raiz.dataset.poste = '3d'; performance.mark('poste-pronto'); },
        aoFalhar: usarImagem,
      }))
      .catch((erro) => {
        usarImagem();
        console.warn('Poste 3D indisponível, mantendo a imagem estática.', erro);
      });
  };

  const observador = new IntersectionObserver((entradas) => {
    heroNaTela = entradas[entradas.length - 1].isIntersecting;
    if (!heroNaTela || agendado) return;
    agendado = true;
    depoisDaEntrada.then(() => quandoOcioso(tentar, { timeout: 1500 }));
  });
  observador.observe(palco);
}

/* ---------- Seções: entradas curtas ao rolar ---------- */

// Cada bloco marcado com data-revelar sobe 24 px e aparece uma vez, quando entra na tela.
// Sem GSAP ou com movimento reduzido, nada é escondido.
function revelarAoRolar() {
  const { gsap } = window;
  const alvos = [...document.querySelectorAll('[data-revelar]')];
  // Se a rede de segurança do <head> já mostrou tudo (rede lenta), não esconde de novo: nada pisca.
  const aindaEscondidos = revelarAtivo;
  clearTimeout(window.__segurancaRevelar);
  if (!gsap || !aindaEscondidos || !alvos.length) { raiz.classList.remove('revelar'); return; }

  const pendentes = new Set(alvos);
  const mostrar = (alvo, atraso = 0) => {
    if (!pendentes.delete(alvo)) return;
    observador.unobserve(alvo);
    gsap.to(alvo, { opacity: 1, y: 0, duration: 0.6, delay: atraso, ease: 'power3.out', clearProps: 'transform' });
  };

  // O GSAP assume o estado escondido no mesmo quadro em que a classe sai
  gsap.set(alvos, { opacity: 0, y: 24 });
  raiz.classList.remove('revelar');
  const observador = new IntersectionObserver((entradas) => {
    // Blocos que entram juntos aparecem em sequência curta (0,1 s), na ordem da página
    entradas.filter((e) => e.isIntersecting).forEach((e, i) => mostrar(e.target, i * 0.1));
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  alvos.forEach((alvo) => observador.observe(alvo));

  // Teclado: se o foco cair num bloco ainda escondido, ele aparece na hora.
  document.addEventListener('focusin', (e) => {
    const alvo = e.target.closest && e.target.closest('[data-revelar]');
    if (alvo && pendentes.has(alvo)) {
      pendentes.delete(alvo);
      observador.unobserve(alvo);
      gsap.set(alvo, { opacity: 1, y: 0, clearProps: 'transform' });
    }
  });
}

/* ---------- Assinatura da marca: o traço da navalha ---------- */

// Desenha o traço sob "Serviços e preços" uma única vez, quando ele entra na tela.
// Única animação fora de transform/opacity (DrawSVG anima o traçado do SVG, só pintura).
function assinaturaDaNavalha() {
  const linha = document.querySelector('.traco-navalha__linha');
  const { gsap, DrawSVGPlugin } = window;
  if (!linha || !gsap || !DrawSVGPlugin || movimentoReduzido || !('IntersectionObserver' in window)) return;

  // Rede lenta: se a rede de segurança já mostrou as seções, não apaga um traço que já está à vista
  if (!revelarAtivo) return;

  gsap.registerPlugin(DrawSVGPlugin);
  gsap.set(linha, { drawSVG: '0%' });
  // Animação pausada e controlada pela visibilidade: só desenha com o traço na tela.
  // Se ele sair antes de terminar (ex.: menu leva direto ao horário), volta a 0% e espera.
  const traco = gsap.to(linha, {
    drawSVG: '100%', duration: 0.9, delay: 0.3, ease: 'power2.inOut', paused: true,
    onComplete: () => observador.disconnect(),
  });
  const observador = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) traco.restart(true);
    else traco.pause(0);
  }, { rootMargin: '0px 0px -15% 0px', threshold: 1 });
  observador.observe(linha.ownerSVGElement);
}

/* ---------- Hero: o cursor faz a barba ---------- */

// Só em telas com mouse (no toque não há "passar por cima"), sem movimento reduzido,
// e só depois da entrada do hero. A foto sem barba nem é baixada fora disso.
function navalhaDoCursor(depoisDaEntrada) {
  const caixa = document.querySelector('.hero__foto');
  if (!caixa || !caixa.dataset.revelada || movimentoReduzido) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  depoisDaEntrada
    .then(() => import('./revelar-barba.js'))
    .then(({ iniciarRevelacao }) => iniciarRevelacao(caixa, { srcRevelada: caixa.dataset.revelada }))
    .then(() => { raiz.dataset.navalha = 'ativa'; })
    .catch((erro) => console.warn('Efeito da barba indisponível.', erro));
}

// Rolagem suave só depois que as fontes chegam: se a troca de fonte acontece no meio
// de uma rolagem suave até uma âncora, ela termina no lugar errado (título sob o topo).
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => raiz.classList.add('rolagem-suave'));
else raiz.classList.add('rolagem-suave');

const fimDaEntrada = entradaDoHero();
carregarPoste(fimDaEntrada);
navalhaDoCursor(fimDaEntrada);
revelarAoRolar();
assinaturaDaNavalha();
