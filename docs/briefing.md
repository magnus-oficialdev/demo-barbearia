# Briefing — Ofício 22 (demo)

> Projeto de demonstração. Marca, pessoas, história, endereço, telefone e "EST. 2022" são **fictícios** e devem aparecer marcados como demonstração no site.

- **Marca:** "Ofício 22" — barbearia de bairro com dois barbeiros. Fundada por Seu Raimundo (personagem fictício), hoje tocada pelo filho. **[CONFIRMAR: nomes, história, cidade]**
- **Público:** homens de 18 a 45 anos que querem hora marcada, sem fila.
- **Objetivo único:** clicar em "Agendar pelo WhatsApp".
- **Sensação:** ofício, cuidado e confiança; barbearia clássica, escura e marcante; premium de bairro sem parecer cara demais.
- **Visual:** segue o `.ux-profile.md` (fundo carvão, âmbar `#F2B630` como único acento). Slick Style e Braincut são referência só de clima: não copiar logo, texto nem layout.
- **Seções:** hero · serviços e preços de exemplo **[TEXTO DE EXEMPLO]** · os dois barbeiros e o jeito de trabalhar · galeria · horário e mapa · rodapé.
- **Humanidade:** um "ritual" em passos (recepção, toalha quente, acabamento) — é sequência real, então numeração é permitida aqui; um detalhe do bairro; a regra da casa.
- **Objeto 3D:** poste de barbearia (cilindro com listras em espiral e tampas metálicas) girando devagar com a rolagem. Só carvão, branco quente e âmbar nas listras. Nada de vermelho e azul.
- **Assinatura de movimento:** traço da navalha se desenhando (SVG + GSAP DrawSVG) ao entrar na seção de serviços.
- **Movimento:** site de apresentação → Padrão Magnus: 0,4–0,9 s, só `transform` e `opacity`, GSAP. Isto **substitui** os 100–300 ms da skill `motion` neste projeto. `prefers-reduced-motion` continua valendo.
- **Etapa 2:** entregar UMA direção refinada e UMA alternativa mais ousada.

## Verificações feitas

- Google Fonts: Bebas Neue, Oswald, Inter, Manrope, Big Shoulders Display, Barlow — todas respondem HTTP 200 em fonts.googleapis.com.
- GSAP 3.15.0 (npm): o pacote inclui `DrawSVGPlugin` (`dist/DrawSVGPlugin.min.js`); licença "Standard 'no charge'" (gsap.com/standard-license).
- three 0.186.1 existe no npm.
- cdn.jsdelivr.net: **NÃO VERIFIQUEI** (bloqueado neste ambiente).

## Pendências

- **Conflito de fontes:** este briefing pede Bebas Neue/Oswald + Inter/Manrope; a Direção A escolhida (e o `.ux-profile.md` atual) usa Big Shoulders Display + Barlow.
- Número de WhatsApp e endereço fictícios a definir (placeholder marcado como demo).
