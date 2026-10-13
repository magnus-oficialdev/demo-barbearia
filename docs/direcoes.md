# Direções visuais — demo-barbearia

> **Atenção:** o briefing da "seção 6" não veio — a mensagem trouxe o texto-modelo `{{COLE AQUI O BRIEFING DA SEÇÃO 6 E AS SUAS REFERÊNCIAS}}` sem preencher. Este documento usa como briefing apenas o que já está registrado: `.ux-profile.md` (preto fosco/cinza, amarelo, branco; voz direta em PT-BR; WCAG AA; Lucide) e as duas imagens enviadas.
> **Proposta de assunto (a confirmar):** site de uma barbearia de bairro; público: homens 20–45 que decidem pelo celular; trabalho principal da página: levar a pessoa a **agendar um horário** em poucos toques.

## 1. Referências — o que funciona

**Ref. 1 — landing "Slick Style" (imagem estática, desktop + mobile)**
- Título condensado gigante sobre a foto do barbeiro cria impacto imediato; o laranja único sobre fundo escuro guia o olho direto para preços e CTA.
- Ritmo forte: faixas laranja de largura total marcam a troca de seção; no mobile tudo vira uma coluna sem perder hierarquia. (Movimento: não dá para avaliar — é imagem parada.)

**Ref. 2 — logo "Braincut"**
- O poste de barbeiro "corta" a palavra no meio: um objeto real vira parte da tipografia — é a ideia mais forte das duas referências.
- Muito espaço vazio, fundo de parede clara, só duas cores (dourado + preto) e um "EST. 2022" pequeno: sóbrio e com cara de ofício.

## 2. Direções

### Direção A — "Poste Aceso"

**Adjetivos:** noturna, tátil, magnética.

**Ideia:** a fachada da barbearia à noite. Fundo preto fosco, e um **poste de barbeiro 3D** girando no hero, atravessando o nome da casa como no logo Braincut — só que com listras amarelo / branco / preto em vez de vermelho/azul.

**Paleta (60-30-10)**

| Nome | Hex | Papel | % |
|---|---|---|---|
| Carvão fosco | `#161616` | fundo | 60 |
| Grafite | `#2B2B2B` | faixas, superfícies, bordas fortes | 30 |
| Amarelo navalha | `#F2B630` | CTA "Agendar", preços, listra do poste | 10 |
| Branco giz | `#F2F2EE` | texto principal | — |
| Cinza fumaça | `#9C9C9C` | texto secundário | — |

**Contraste (WCAG, calculado):**
- Branco giz sobre Carvão: **16,12:1** (AA ✔, AAA ✔)
- Branco giz sobre Grafite: **12,62:1**
- Cinza fumaça sobre Carvão: **6,59:1** (AA ✔) · sobre Grafite: **5,16:1** (AA ✔)
- Carvão sobre Amarelo (texto do botão): **9,92:1**

**Fontes (Google Fonts — verificadas, resposta HTTP 200 em fonts.googleapis.com):**
- Títulos: **Big Shoulders Display** (condensada, inspirada em letreiros industriais de Chicago — lembra placa de fachada)
- Texto: **Barlow** (sans levemente arredondada, ótima leitura no celular)

**Hero (desktop):**
```
+--------------------------------------------------------------+
| BARBEARIA DO ZÉ            Serviços  Equipe  Local  [Agendar] |
|                                                              |
|                         ||                                   |
|   B A R B E A R I A     ||/      D O   Z É                   |
|   (letras enormes)      |/|      (letras enormes)            |
|                         ||/   <- poste 3D girando,           |
|                         |/|      "cortando" o nome           |
|                                                              |
|   Corte, barba e toalha quente. Sem fila.                    |
|   [ Agendar horário ]   Ter–Sáb, 9h–20h · Rua X, 123         |
+--------------------------------------------------------------+
```
**Hero (mobile):** nome empilhado em 2 linhas, poste menor à direita, botão "Agendar horário" fixo na base da tela.

**Assinatura:** poste de barbeiro procedural em three.js (cilindro + tampas; as listras em espiral são uma textura gerada por código, sem imagem). Gira devagar sozinho e acelera um pouco quando a pessoa rola a página. Com `prefers-reduced-motion`, fica parado.

**Resto da página (sem grade de cartões):** serviços como uma **tabela de preços de parede** (nome à esquerda, preço em amarelo à direita, linha fina entre eles); antes/depois em fotos grandes lado a lado; mapa + horário; rodapé simples.

---

### Direção B — "Parede de Concreto"

**Adjetivos:** clara, seca, artesanal.

**Ideia:** o logo Braincut virado site. Fundo de parede cinza-claro, blocos pretos sólidos, e o amarelo só como **fundo de botão e etiqueta de preço** (nunca como texto — sobre o cinza ele dá só 1,43:1). O movimento é um **corte de navalha**: no carregamento, uma linha fina atravessa o título e a metade de cima desliza, revelando a foto do corte por baixo.

**Paleta (60-30-10)**

| Nome | Hex | Papel | % |
|---|---|---|---|
| Concreto | `#E4E4E1` | fundo | 60 |
| Preto fosco | `#1A1A1A` | blocos (menu, rodapé), texto principal | 30 |
| Amarelo navalha | `#F2B630` | fundo do CTA e das etiquetas de preço | 10 |
| Branco | `#FAFAF8` | áreas de foto/destaque | — |
| Cinza aço | `#5E5E5E` | texto secundário | — |

**Contraste (WCAG, calculado):**
- Preto fosco sobre Concreto: **13,66:1** (AA ✔, AAA ✔)
- Concreto sobre Preto fosco (blocos invertidos): **13,66:1**
- Cinza aço sobre Concreto: **5,09:1** (AA ✔)
- Preto fosco sobre Amarelo (botão): **9,54:1**
- ⚠ Amarelo sobre Concreto: **1,43:1** — proibido como texto nesta direção.

**Fontes (Google Fonts — verificadas, HTTP 200):**
- Títulos: **League Gothic** (gótica condensada clássica de cartaz, muito próxima do traço do Braincut)
- Texto: **Instrument Sans** (sans contemporânea, neutra e firme)

**Hero (desktop):**
```
+--------------------------------------------------------------+
|  Barbearia do Zé                          [ Agendar horário ] |
|                                                              |
|  CORTE                    +--------------------------+       |
|  ----------------- <-navalha  |  foto do corte        |       |
|  (metade de cima desliza) |  (revelada pelo corte)   |       |
|  BEM FEITO.               +--------------------------+       |
|                                                              |
|  Desde 2022 na Rua X.     [ R$ 30 corte ] [ R$ 20 barba ]        |
|                            (etiquetas pretas c/ preço amarelo)|
+--------------------------------------------------------------+
```
**Hero (mobile):** título em cima, foto embaixo em largura total, CTA preto fixo na base.

**Assinatura:** "corte de navalha" em GSAP — uma única animação de abertura (linha + deslize, ~900 ms). Sem 3D. Com `prefers-reduced-motion`, o título já aparece aberto.

**Resto da página:** serviços como lista em blocos pretos alternados com fotos; equipe com retrato P&B; agendamento em destaque.

## 3. Checagem contra as "médias de IA"

| Armadilha | A | B | O que fiz |
|---|---|---|---|
| Creme + serifa + terracota | não | **quase** — fundo claro | Troquei o creme por cinza-concreto frio (`#E4E4E1`) e a serifa por gótica condensada; sem terracota. |
| Preto + acento verde-ácido | **parecido** — preto + 1 acento | não | O acento é amarelo-âmbar pedido por você (não ácido) e o preto é fosco/cinza; o que diferencia é o poste 3D, não a cor. Mantive porque é pedido explícito. |
| Grade de cartões iguais | não | não | Serviços viram tabela de preços (A) e blocos alternados com foto (B). |
| Rótulo em caixa alta antes de cada título | removido | removido | Tirei os "eyebrows" que estavam no `.ux-profile.md`; os títulos já são condensados e grandes. |
| Setinha "→" nos botões | não | não | Botões só com verbo: "Agendar horário". |

**Conflitos com o `.ux-profile.md` a resolver depois da escolha:**
- O perfil prevê "eyebrows em caixa alta" — proponho remover.
- A Direção B usa fundo claro; o perfil diz fundo preto fosco. Se escolher B, o perfil precisa ser atualizado.
- Usar three.js/GSAP via cdn.jsdelivr.net: NÃO VERIFIQUEI (o CDN é bloqueado neste ambiente); alternativa é instalar pelo npm.

## 4. Recomendação: Direção A — "Poste Aceso"

1. É exatamente o que você pediu (preto fosco/cinza, amarelo, branco) e já bate com o perfil salvo — não precisa mudar regra nenhuma.
2. Tem um único elemento memorável, o poste girando atravessando o nome, e todo o resto fica quieto; é fácil de entender e de manter.
3. Fundo escuro com texto claro dá contraste altíssimo (16:1), então fica legível no celular até na rua, sob sol.
