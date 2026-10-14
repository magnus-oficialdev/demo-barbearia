// Ofício 22 — barra fixa de agendar (celular).
// Arquivo separado e carregado ANTES do GSAP: não depende dele e precisa agir cedo,
// senão em rede lenta a rede de segurança do <head> mostra a barra sobre o hero.
//
// A barra só aparece quando nenhum outro "Agendar pelo WhatsApp" está na tela:
// depois que o botão do hero sai pelo topo e enquanto o botão da seção de horário não aparece.
(function () {
  const raiz = document.documentElement;
  const botaoHero = document.querySelector('.hero__acoes .botao');
  const botaoHorario = document.querySelector('.local__texto .botao');
  if (!botaoHero || !('IntersectionObserver' in window)) {
    raiz.classList.remove('barra-oculta');
    return;
  }
  window.__barraControlada = true;

  let passouDoHero = false;
  let horarioNaTela = false;
  const atualizar = () => raiz.classList.toggle('barra-oculta', !passouDoHero || horarioNaTela);

  new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.target === botaoHero) passouDoHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      else horarioNaTela = e.isIntersecting;
    });
    atualizar();
  }).observe(botaoHero);
  if (botaoHorario) {
    new IntersectionObserver(([e]) => { horarioNaTela = e.isIntersecting; atualizar(); }).observe(botaoHorario);
  }
})();
