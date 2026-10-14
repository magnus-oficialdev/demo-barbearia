// Ofício 22 — agendamento pela "comanda".
// A pessoa escolhe serviço, barbeiro, dia e horário; o site monta a mensagem e abre o WhatsApp.
// Não há sistema de reservas: os horários listados saem da tabela de funcionamento
// e a confirmação de verdade é feita pela barbearia, no WhatsApp.
//
// Fonte única dos dados:
//   serviços  → itens do cardápio  (data-servico, data-minutos, data-preco)
//   horários  → linhas da tabela   (data-dias = dias da semana 0–6, data-abre, data-fecha em horas)
(function () {
  const form = document.getElementById('form-agendar');
  if (!form) return;

  const WHATSAPP = '558699436939';
  const CHAVE_RASCUNHO = 'oficio22:comanda';
  const DIAS_LISTADOS = 6;
  const ANTECEDENCIA_MIN = 60; // não oferece horário que começa em menos de 1 h

  const servicos = [...document.querySelectorAll('.cardapio__item[data-servico]')].map((li) => ({
    nome: li.dataset.servico,
    minutos: Number(li.dataset.minutos),
    preco: Number(li.dataset.preco),
  }));
  const turnos = [...document.querySelectorAll('.horario tr[data-dias]')].map((tr) => ({
    dias: tr.dataset.dias.split(/\s+/).map(Number),
    abre: Number(tr.dataset.abre),
    fecha: Number(tr.dataset.fecha),
  }));
  if (!servicos.length || !turnos.length) return;

  const caixa = (nome) => form.querySelector(`[data-opcoes="${nome}"]`);
  const resumo = (nome) => form.querySelector(`[data-resumo="${nome}"]`);
  const nome = form.elements.nome;
  const erroNome = document.getElementById('nome-erro');
  const erroHora = document.getElementById('hora-erro');
  const grupoHora = document.getElementById('grupo-hora');
  const avisoRascunho = form.querySelector('[data-rascunho]');

  const semana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
  const semanaLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
  const diaMes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
  const real = (v) => 'R$ ' + v.toLocaleString('pt-BR');
  const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  /* ---------- rascunho (só preferências, nada sensível) ---------- */
  const lerRascunho = () => { try { return JSON.parse(localStorage.getItem(CHAVE_RASCUNHO)) || null; } catch { return null; } };
  const salvarRascunho = () => {
    try {
      localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({
        servico: valor('servico'), barbeiro: valor('barbeiro'), nome: nome.value.trim(),
      }));
    } catch { /* navegação privada: segue sem rascunho */ }
  };
  const apagarRascunho = () => { try { localStorage.removeItem(CHAVE_RASCUNHO); } catch { /* idem */ } };

  /* ---------- opções ---------- */
  // Uma opção = rádio de verdade (teclado e leitor de tela) com o visual de cartão
  function opcao(nomeCampo, valorCampo, titulo, metas, marcada) {
    const label = document.createElement('label');
    label.className = 'opcao';
    label.innerHTML = `<input type="radio" name="${nomeCampo}"><span class="opcao__corpo"><span class="opcao__nome"></span><svg class="icone opcao__marca" aria-hidden="true"><use href="#i-check"/></svg></span>`;
    const input = label.querySelector('input');
    input.value = valorCampo;
    input.checked = Boolean(marcada);
    label.querySelector('.opcao__nome').textContent = titulo;
    if (metas && metas.length) {
      const linha = document.createElement('span');
      linha.className = 'opcao__meta';
      metas.forEach((m) => { const parte = document.createElement('span'); parte.textContent = m; linha.append(parte); });
      label.querySelector('.opcao__nome').after(linha);
    }
    return label;
  }
  const valor = (nomeCampo) => {
    const marcado = form.querySelector(`input[name="${nomeCampo}"]:checked`);
    return marcado ? marcado.value : '';
  };
  const servicoAtual = () => servicos.find((s) => s.nome === valor('servico')) || servicos[0];

  // Horários cheios de um dia em que o serviço cabe antes de fechar
  function horasDoDia(dia, turno, agora) {
    const lista = [];
    for (let h = turno.abre; h * 60 + servicoAtual().minutos <= turno.fecha * 60; h++) {
      const inicio = new Date(dia);
      inicio.setHours(h, 0, 0, 0);
      if ((inicio - agora) / 60000 >= ANTECEDENCIA_MIN) lista.push(h);
    }
    return lista;
  }

  // Próximos dias abertos que ainda têm algum horário
  function proximosDias() {
    const agora = new Date();
    const base = new Date(agora);
    base.setHours(0, 0, 0, 0);
    const dias = [];
    for (let i = 0; dias.length < DIAS_LISTADOS && i < 21; i++) {
      const dia = new Date(base);
      dia.setDate(base.getDate() + i);
      const turno = turnos.find((t) => t.dias.includes(dia.getDay()));
      if (!turno) continue;
      const horas = horasDoDia(dia, turno, agora);
      const chave = `${dia.getFullYear()}-${dia.getMonth() + 1}-${dia.getDate()}`; // data local
      if (horas.length) dias.push({ chave, data: dia, distancia: i, horas });
    }
    return dias;
  }

  let dias = [];
  const diaAtual = () => dias.find((d) => d.chave === valor('dia'));

  function rotuloDia(d) {
    if (d.distancia === 0) return 'Hoje';
    if (d.distancia === 1) return 'Amanhã';
    return capitalizar(semana.format(d.data).replace('.', ''));
  }

  function montarServicos(escolhido) {
    const destino = caixa('servico');
    destino.replaceChildren(...servicos.map((s, i) =>
      opcao('servico', s.nome, s.nome, [`${s.minutos} min`, real(s.preco)], escolhido ? s.nome === escolhido : i === 0)));
    if (!valor('servico')) destino.querySelector('input').checked = true;
  }

  function montarDias() {
    const anterior = valor('dia');
    dias = proximosDias();
    const destino = caixa('dia');
    destino.replaceChildren(...dias.map((d) => opcao('dia', d.chave, rotuloDia(d), [diaMes.format(d.data)], d.chave === anterior)));
    // Padrão: o primeiro dia com horário livre
    if (!valor('dia') && dias.length) destino.querySelector('input').checked = true;
  }

  function montarHoras() {
    const anterior = valor('hora');
    const d = diaAtual();
    const destino = caixa('hora');
    destino.replaceChildren(...(d ? d.horas : []).map((h) => opcao('hora', String(h), `${h}h`, null, String(h) === anterior)));
  }

  /* ---------- resumo (a comanda) ---------- */
  function quando() {
    const d = diaAtual();
    const h = valor('hora');
    if (!d) return 'Escolha o dia e o horário';
    const dia = `${capitalizar(semanaLonga.format(d.data))}, ${diaMes.format(d.data)}`;
    return h ? `${dia}, às ${h}h` : `${dia}. Falta o horário`;
  }
  function atualizarResumo() {
    const s = servicoAtual();
    resumo('servico').textContent = `${s.nome} (${s.minutos} min)`;
    resumo('barbeiro').textContent = valor('barbeiro') || 'Tanto faz';
    resumo('quando').textContent = quando();
    resumo('valor').textContent = real(s.preco);
  }

  /* ---------- validação: só depois de sair do campo; limpa ao voltar a ele ---------- */
  const nomeValido = () => nome.value.trim().length >= 2;
  function mostrarErroNome(mostrar) {
    erroNome.hidden = !mostrar;
    nome.toggleAttribute('aria-invalid', mostrar);
  }
  function mostrarErroHora(mostrar) {
    erroHora.hidden = !mostrar;
    grupoHora.classList.toggle('grupo--erro', mostrar);
  }
  nome.addEventListener('blur', () => mostrarErroNome(!nomeValido()));
  nome.addEventListener('focus', () => mostrarErroNome(false));
  nome.addEventListener('input', () => { mostrarErroNome(false); agendarRascunho(); });

  let espera;
  const agendarRascunho = () => { clearTimeout(espera); espera = setTimeout(salvarRascunho, 500); };

  form.addEventListener('change', (e) => {
    const campo = e.target.name;
    if (campo === 'servico') { montarDias(); montarHoras(); }
    if (campo === 'dia') montarHoras();
    if (campo === 'hora') mostrarErroHora(false);
    atualizarResumo();
    agendarRascunho();
  });

  /* ---------- enviar ---------- */
  function mensagem() {
    const s = servicoAtual();
    return [
      'Olá! Quero agendar na Ofício 22:',
      `- Serviço: ${s.nome} (${s.minutos} min, ${real(s.preco)})`,
      `- Barbeiro: ${valor('barbeiro') || 'Tanto faz'}`,
      `- Quando: ${quando()}`,
      `- Nome: ${nome.value.trim()}`,
      'Pode confirmar?',
    ].join('\n');
  }

  function focarPrimeiroErro(alvo) {
    alvo.scrollIntoView({ block: 'center' });
    alvo.focus({ preventScroll: true });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const faltaHora = !valor('hora');
    const faltaNome = !nomeValido();
    mostrarErroHora(faltaHora);
    mostrarErroNome(faltaNome);
    if (faltaHora) {
      const primeiro = caixa('hora').querySelector('input') || caixa('dia').querySelector('input');
      if (primeiro) focarPrimeiroErro(primeiro);
      return;
    }
    if (faltaNome) { focarPrimeiroErro(nome); return; }

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem())}`;
    window.open(url, '_blank', 'noopener');
    apagarRascunho();
    form.querySelector('[data-link-whatsapp]').href = url;
    form.querySelector('[data-etapa="formulario"]').hidden = true;
    const enviado = form.querySelector('[data-etapa="enviado"]');
    enviado.hidden = false;
    enviado.querySelector('[data-de-novo]').focus({ preventScroll: true });
  });

  form.querySelector('[data-de-novo]').addEventListener('click', () => {
    form.querySelector('[data-etapa="enviado"]').hidden = true;
    form.querySelector('[data-etapa="formulario"]').hidden = false;
    const marcada = form.querySelector('input[name="hora"]:checked');
    if (marcada) marcada.checked = false;
    atualizarResumo();
    caixa('dia').querySelector('input:checked, input')?.focus();
  });

  form.querySelector('[data-descartar]').addEventListener('click', () => {
    apagarRascunho();
    nome.value = '';
    montarServicos();
    form.querySelector('input[name="barbeiro"][value="Tanto faz"]').checked = true;
    montarDias();
    montarHoras();
    atualizarResumo();
    avisoRascunho.hidden = true;
  });

  /* ---------- início ---------- */
  const rascunho = lerRascunho();
  montarServicos(rascunho && rascunho.servico);
  if (rascunho) {
    const barbeiro = form.querySelector(`input[name="barbeiro"][value="${CSS.escape(rascunho.barbeiro || '')}"]`);
    if (barbeiro) barbeiro.checked = true;
    if (rascunho.nome) nome.value = rascunho.nome;
    avisoRascunho.hidden = !(rascunho.nome || rascunho.servico !== servicos[0].nome || rascunho.barbeiro !== 'Tanto faz');
  }
  montarDias();
  montarHoras();
  atualizarResumo();

  // Com a página aberta, horários vão passando: refaz as listas só quando mudarem de fato
  // (sem tirar o foco de quem está escolhendo à toa)
  const assinatura = (lista) => lista.map((d) => d.chave + ':' + d.horas.join(',')).join('|');
  setInterval(() => {
    if (assinatura(proximosDias()) === assinatura(dias)) return;
    montarDias(); montarHoras(); atualizarResumo();
  }, 5 * 60 * 1000);
})();
