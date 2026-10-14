// Ofício 22 — barra fixa de agendar (celular).
// Arquivo separado e carregado ANTES do GSAP: não depende dele e precisa agir cedo,
// senão em rede lenta a rede de segurança do <head> mostra a barra sobre o hero.
//
// A barra só aparece quando nenhum outro botão de agendar está na tela: depois que o botão
// do hero sai pelo topo, e some de novo na comanda de agendamento e no botão da seção de horário.
(function () {
  const raiz = document.documentElement;
  const botaoHero = document.querySelector('.hero__acoes .botao');
  // Elementos que, visíveis, tornam a barra redundante
  const escondem = [...document.querySelectorAll('#agendar, .local__texto .botao')];
  if (!botaoHero || !('IntersectionObserver' in window)) {
    raiz.classList.remove('barra-oculta');
    return;
  }
  window.__barraControlada = true;

  let passouDoHero = false;
  const naTela = new Set();
  const atualizar = () => raiz.classList.toggle('barra-oculta', !passouDoHero || naTela.size > 0);

  new IntersectionObserver(([e]) => {
    passouDoHero = !e.isIntersecting && e.boundingClientRect.top < 0;
    atualizar();
  }).observe(botaoHero);
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? naTela.add(e.target) : naTela.delete(e.target)));
    atualizar();
  });
  escondem.forEach((alvo) => observador.observe(alvo));
})();
