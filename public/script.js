// JavaScript do FRONT-END: usa fetch para conversar com a API
const API_URL = '/api/podcasts';

// ---------- Estado da tela ----------
let podcasts = [];            // lista que veio da API (banco de dados)
let categoriaAtiva = 'Todas'; // filtro selecionado
let idParaExcluir = null;     // id guardado enquanto o usuário confirma a exclusão
let tipoExclusao = 'podcast'; // o que está sendo excluído: 'podcast' ou 'episodio'

// ---------- Elementos da página ----------
const lista = document.getElementById('grid');
const vazio = document.getElementById('vazio');
const vazioTitulo = document.getElementById('vazio-titulo');
const vazioTexto = document.getElementById('vazio-texto');
const abas = document.getElementById('chips');
const busca = document.getElementById('busca');
const ordenar = document.getElementById('ordenar');

const modal = document.getElementById('modal');
const form = document.getElementById('form-podcast');
const inputId = document.getElementById('podcast-id');
const inputNome = document.getElementById('nome');
const inputCategoria = document.getElementById('categoria');
const inputApresentador = document.getElementById('apresentador');
const tituloForm = document.getElementById('titulo-form');
const kickerForm = document.getElementById('kicker-form');
const btnSalvar = document.getElementById('btn-salvar');

const modalExcluir = document.getElementById('modal-excluir');
const tituloExcluir = document.getElementById('titulo-excluir');
const textoExcluir = document.getElementById('texto-excluir');
const btnSim = document.getElementById('btn-sim');

// ---------- Funções de apoio (visual) ----------

// Cada categoria tem sempre a mesma cor
const CORES = ['#e0452b', '#c98a1b', '#2f6f5e', '#2b4a7a', '#7a3b5e', '#6b7a2a'];

function hash(texto) {
  let h = 0;
  for (const c of texto.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function corCategoria(categoria) {
  return CORES[hash(categoria) % CORES.length];
}

// Evita que texto digitado seja interpretado como HTML
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function formatarNumero(n) {
  return Number(n).toLocaleString('pt-BR');
}

// Número que "sobe" até o valor final
function animarNumero(el, destino) {
  const inicio = Number(el.dataset.valor || 0);
  el.dataset.valor = destino;
  const duracao = 600;
  const t0 = performance.now();
  function passo(t) {
    const p = Math.min((t - t0) / duracao, 1);
    el.textContent = formatarNumero(Math.round(inicio + (destino - inicio) * p));
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

// Barrinhas de "onda de áudio": quanto mais episódios (em relação ao maior), mais barras preenchidas
function gerarOnda(p, maximo) {
  const total = 28;
  const razao = maximo > 0 ? p.qtd_episodios / maximo : 0;
  const preenchidas = p.qtd_episodios > 0 ? Math.max(1, Math.round(total * razao)) : 0;
  let semente = hash(p.nome + p.id);
  let barras = '';
  for (let i = 0; i < total; i++) {
    semente = (semente * 1664525 + 1013904223) >>> 0;
    const altura = 20 + (semente % 80);
    barras += `<i class="${i < preenchidas ? 'on' : ''}" style="height:${altura}%"></i>`;
  }
  return barras;
}

// Mensagem de sucesso ou erro (resposta ao usuário)
function mostrarMensagem(texto, tipo = 'sucesso') {
  const toast = document.createElement('div');
  toast.className = `toast ${tipo === 'erro' ? 'erro' : ''}`;
  toast.textContent = texto;
  document.getElementById('toasts').appendChild(toast);
  setTimeout(() => {
    toast.classList.add('saindo');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---------- READ: busca a lista na API (GET) ----------
async function carregarPodcasts() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error('Falha na API');
    podcasts = await resposta.json();
    renderizar();
  } catch (err) {
    podcasts = [];
    renderizar('Sem conexão.', 'Verifique se o servidor e o banco de dados estão ligados.');
    mostrarMensagem('Erro ao carregar os podcasts. O servidor/banco está ligado?', 'erro');
  }
}

// ---------- Montagem da tela ----------
function renderizar(tituloVazio, textoVazio) {
  atualizarNumeros();
  renderizarAbas();

  // Filtros (feitos no navegador, sobre a lista que veio da API)
  const termo = busca.value.trim().toLowerCase();
  const filtrados = podcasts.filter((p) => {
    const bateCategoria = categoriaAtiva === 'Todas' || p.categoria === categoriaAtiva;
    const bateBusca = !termo ||
      p.nome.toLowerCase().includes(termo) ||
      p.apresentador.toLowerCase().includes(termo) ||
      p.categoria.toLowerCase().includes(termo);
    return bateCategoria && bateBusca;
  });

  // Ordenação
  if (ordenar.value === 'nome') {
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } else if (ordenar.value === 'episodios') {
    filtrados.sort((a, b) => b.qtd_episodios - a.qtd_episodios);
  } else {
    filtrados.sort((a, b) => b.id - a.id);
  }

  const maximo = podcasts.reduce((m, p) => Math.max(m, Number(p.qtd_episodios)), 0);

  // Linhas da lista
  lista.innerHTML = filtrados.map((p, i) => `
    <article class="linha-podcast" style="--delay:${i * 40}ms">
      <span class="col-id">${String(p.id).padStart(2, '0')}</span>
      <div class="col-titulo">
        <h3>${escapar(p.nome)}</h3>
        <p>com ${escapar(p.apresentador)}</p>
      </div>
      <div class="col-cat">
        <span class="tag"><i style="background:${corCategoria(p.categoria)}"></i>${escapar(p.categoria)}</span>
      </div>
      <div class="col-eps">
        <div class="onda" aria-hidden="true">${gerarOnda(p, maximo)}</div>
        <div class="eps-num"><strong>${formatarNumero(p.qtd_episodios)}</strong><small>${Number(p.qtd_episodios) === 1 ? 'episódio' : 'episódios'}</small></div>
      </div>
      <div class="col-acoes">
        <button class="link link-destaque" data-acao="episodios" data-id="${p.id}">Episódios</button>
        <button class="link" data-acao="editar" data-id="${p.id}">Editar</button>
        <button class="link link-perigo" data-acao="excluir" data-id="${p.id}">Excluir</button>
      </div>
    </article>`).join('');

  // Estado vazio
  const semResultado = filtrados.length === 0;
  vazio.classList.toggle('oculto', !semResultado);
  if (semResultado) {
    if (tituloVazio) {
      vazioTitulo.textContent = tituloVazio;
      vazioTexto.textContent = textoVazio;
    } else if (podcasts.length === 0) {
      vazioTitulo.textContent = 'Nada cadastrado ainda.';
      vazioTexto.textContent = 'Use "Novo podcast" para cadastrar o primeiro.';
    } else {
      vazioTitulo.textContent = 'Nenhum resultado.';
      vazioTexto.textContent = 'Tente outro termo de busca ou outra categoria.';
    }
  }
}

function atualizarNumeros() {
  const totalEpisodios = podcasts.reduce((soma, p) => soma + Number(p.qtd_episodios), 0);
  const categorias = new Set(podcasts.map((p) => p.categoria));
  const top = podcasts.reduce((maior, p) => (!maior || p.qtd_episodios > maior.qtd_episodios ? p : maior), null);

  animarNumero(document.getElementById('stat-total'), podcasts.length);
  animarNumero(document.getElementById('stat-episodios'), totalEpisodios);
  animarNumero(document.getElementById('stat-categorias'), categorias.size);
  document.getElementById('stat-top').textContent = top ? top.nome : '—';
}

function renderizarAbas() {
  const contagem = {};
  podcasts.forEach((p) => { contagem[p.categoria] = (contagem[p.categoria] || 0) + 1; });
  const categorias = Object.keys(contagem).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (categoriaAtiva !== 'Todas' && !categorias.includes(categoriaAtiva)) categoriaAtiva = 'Todas';

  const itens = [{ nome: 'Todas', n: podcasts.length }, ...categorias.map((c) => ({ nome: c, n: contagem[c] }))];
  abas.innerHTML = itens.map((c) =>
    `<button class="chip ${c.nome === categoriaAtiva ? 'ativo' : ''}" data-categoria="${escapar(c.nome)}">${escapar(c.nome)}<span class="n">${c.n}</span></button>`
  ).join('');
}

// ---------- Painel de cadastro/edição ----------
function abrirModal(podcast = null) {
  if (podcast) {
    inputId.value = podcast.id;
    inputNome.value = podcast.nome;
    inputCategoria.value = podcast.categoria;
    inputApresentador.value = podcast.apresentador;
    kickerForm.textContent = `Registro #${podcast.id}`;
    tituloForm.textContent = 'Editar podcast';
    btnSalvar.textContent = 'Salvar alterações';
  } else {
    form.reset();
    inputId.value = '';
    kickerForm.textContent = 'Novo registro';
    tituloForm.textContent = 'Novo podcast';
    btnSalvar.textContent = 'Cadastrar';
  }
  modal.classList.remove('oculto');
  inputNome.focus();
}

function fecharModal() {
  modal.classList.add('oculto');
}

// ---------- CREATE (POST) ou UPDATE (PUT) ----------
// Se existe id no campo oculto, é edição (PUT). Se não, é cadastro (POST).
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dados = {
    nome: inputNome.value,
    categoria: inputCategoria.value,
    apresentador: inputApresentador.value
  };

  const id = inputId.value;
  const url = id ? `${API_URL}/${id}` : API_URL;
  const metodo = id ? 'PUT' : 'POST';

  btnSalvar.disabled = true;
  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(resultado.erro || 'Erro ao salvar.', 'erro');
      return;
    }

    mostrarMensagem(resultado.mensagem);
    fecharModal();
    carregarPodcasts();
  } catch (err) {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  } finally {
    btnSalvar.disabled = false;
  }
});

// ---------- Editar: busca o registro pelo id (GET /:id) e abre o painel ----------
async function editarPodcast(id) {
  try {
    const resposta = await fetch(`${API_URL}/${id}`);
    const p = await resposta.json();
    if (!resposta.ok) {
      mostrarMensagem(p.erro || 'Erro ao buscar o podcast.', 'erro');
      return;
    }
    abrirModal(p);
  } catch (err) {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  }
}

// ---------- DELETE: confirma e remove pelo id ----------
function pedirExclusao(tipo, id) {
  idParaExcluir = id;
  tipoExclusao = tipo;

  if (tipo === 'episodio') {
    const ep = episodios.find((item) => item.id === id);
    tituloExcluir.textContent = 'Excluir este episódio?';
    textoExcluir.textContent = `"${ep ? ep.titulo : 'Este episódio'}" será removido do sistema e do banco de dados. Essa ação não pode ser desfeita.`;
  } else {
    const p = podcasts.find((item) => item.id === id);
    tituloExcluir.textContent = 'Excluir este podcast?';
    textoExcluir.textContent = `"${p ? p.nome : 'Este podcast'}" e todos os seus episódios serão removidos do sistema e do banco de dados. Essa ação não pode ser desfeita.`;
  }
  modalExcluir.classList.remove('oculto');
}

function fecharModalExcluir() {
  modalExcluir.classList.add('oculto');
  idParaExcluir = null;
}

btnSim.addEventListener('click', async () => {
  if (idParaExcluir === null) return;
  const id = idParaExcluir;
  const eEpisodio = tipoExclusao === 'episodio';
  // Podcast: DELETE /api/podcasts/:id   |   Episódio: DELETE /api/episodios/:id
  const url = eEpisodio ? `/api/episodios/${id}` : `${API_URL}/${id}`;
  btnSim.disabled = true;
  try {
    const resposta = await fetch(url, { method: 'DELETE' });
    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(resultado.erro || 'Erro ao excluir.', 'erro');
    } else {
      mostrarMensagem(resultado.mensagem);
      if (eEpisodio) carregarEpisodios();
      carregarPodcasts(); // atualiza a contagem de episódios na lista
    }
  } catch (err) {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  } finally {
    btnSim.disabled = false;
    fecharModalExcluir();
  }
});

// ---------- Eventos da interface ----------
document.getElementById('btn-novo').addEventListener('click', () => abrirModal());
document.getElementById('btn-fechar').addEventListener('click', fecharModal);
document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
document.getElementById('btn-nao').addEventListener('click', fecharModalExcluir);

// Clicar fora do painel fecha
modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
modalExcluir.addEventListener('click', (e) => { if (e.target === modalExcluir) fecharModalExcluir(); });

// Tecla Esc fecha
// (fecha primeiro o que estiver por cima: confirmação > episódios > formulário)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!modalExcluir.classList.contains('oculto')) return fecharModalExcluir();
  if (!modalEps.classList.contains('oculto')) return fecharPainelEpisodios();
  fecharModal();
});

// Botões Editar/Excluir da lista (um único "ouvinte" para todos)
lista.addEventListener('click', (e) => {
  const botao = e.target.closest('button[data-acao]');
  if (!botao) return;
  const id = Number(botao.dataset.id);
  if (botao.dataset.acao === 'episodios') abrirEpisodios(id);
  if (botao.dataset.acao === 'editar') editarPodcast(id);
  if (botao.dataset.acao === 'excluir') pedirExclusao('podcast', id);
});

// Filtro por categoria
abas.addEventListener('click', (e) => {
  const aba = e.target.closest('.chip');
  if (!aba) return;
  categoriaAtiva = aba.dataset.categoria;
  renderizar();
});

busca.addEventListener('input', () => renderizar());
ordenar.addEventListener('change', () => renderizar());

// =====================================================================
// EPISÓDIOS (tabela "episodios"): CRUD dentro de cada podcast
// Rotas usadas:
//   GET    /api/podcasts/:id/episodios   -> lista os episódios do podcast
//   POST   /api/podcasts/:id/episodios   -> cadastra um episódio
//   PUT    /api/episodios/:id            -> altera um episódio
//   DELETE /api/episodios/:id            -> exclui um episódio
// =====================================================================
let podcastAtual = null; // podcast cujo painel de episódios está aberto
let episodios = [];      // episódios desse podcast (vieram da API)

const modalEps = document.getElementById('modal-eps');
const epLista = document.getElementById('ep-lista');
const epVazio = document.getElementById('ep-vazio');
const epResumo = document.getElementById('eps-resumo');
const formEp = document.getElementById('form-episodio');
const epId = document.getElementById('ep-id');
const epNumero = document.getElementById('ep-numero');
const epTitulo = document.getElementById('ep-titulo');
const epDuracao = document.getElementById('ep-duracao');
const epData = document.getElementById('ep-data');
const epFormTitulo = document.getElementById('ep-form-titulo');
const epSalvar = document.getElementById('ep-salvar');

// 75 -> "1h 15min" | 45 -> "45 min"
function formatarDuracao(min) {
  const m = Number(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto ? `${h}h ${String(resto).padStart(2, '0')}min` : `${h}h`;
}

// "2024-02-05" -> "05/02/2024" (sem passar por Date, para não ter erro de fuso horário)
function formatarData(iso) {
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Abre o painel e carrega os episódios do podcast escolhido
function abrirEpisodios(id) {
  podcastAtual = podcasts.find((p) => p.id === id);
  if (!podcastAtual) return;

  document.getElementById('eps-kicker').textContent = `Podcast #${podcastAtual.id} · ${podcastAtual.categoria}`;
  document.getElementById('eps-titulo').textContent = podcastAtual.nome;
  fecharFormEpisodio();
  episodios = [];
  renderizarEpisodios();
  modalEps.classList.remove('oculto');
  carregarEpisodios();
}

function fecharPainelEpisodios() {
  modalEps.classList.add('oculto');
  fecharFormEpisodio();
  podcastAtual = null;
}

// READ: busca os episódios do podcast na API (GET)
async function carregarEpisodios() {
  if (!podcastAtual) return;
  try {
    const resposta = await fetch(`${API_URL}/${podcastAtual.id}/episodios`);
    if (!resposta.ok) throw new Error('Falha na API');
    episodios = await resposta.json();
  } catch (err) {
    episodios = [];
    mostrarMensagem('Erro ao carregar os episódios. O servidor/banco está ligado?', 'erro');
  }
  renderizarEpisodios();
}

function renderizarEpisodios() {
  const total = episodios.reduce((soma, ep) => soma + Number(ep.duracao_min), 0);
  const n = episodios.length;
  epResumo.textContent = n === 0
    ? `com ${podcastAtual ? podcastAtual.apresentador : ''}`
    : `com ${podcastAtual.apresentador} · ${n} ${n === 1 ? 'episódio' : 'episódios'} · ${formatarDuracao(total)} no total`;

  epLista.innerHTML = episodios.map((ep, i) => `
    <article class="ep-item" style="--delay:${i * 35}ms">
      <span class="ep-n">${String(ep.numero).padStart(2, '0')}</span>
      <div class="ep-info">
        <h4>${escapar(ep.titulo)}</h4>
        <p>${formatarData(ep.data_publicacao)} · ${formatarDuracao(ep.duracao_min)}</p>
      </div>
      <div class="col-acoes">
        <button class="link" data-ep-acao="editar" data-id="${ep.id}">Editar</button>
        <button class="link link-perigo" data-ep-acao="excluir" data-id="${ep.id}">Excluir</button>
      </div>
    </article>`).join('');

  epVazio.classList.toggle('oculto', n > 0);
}

// Abre o formulário: vazio (novo) ou preenchido (editar)
function abrirFormEpisodio(ep = null) {
  if (ep) {
    epId.value = ep.id;
    epNumero.value = ep.numero;
    epTitulo.value = ep.titulo;
    epDuracao.value = ep.duracao_min;
    epData.value = String(ep.data_publicacao).slice(0, 10);
    epFormTitulo.textContent = `Editar episódio #${ep.numero}`;
    epSalvar.textContent = 'Salvar alterações';
  } else {
    formEp.reset();
    epId.value = '';
    // sugere o próximo número e a data de hoje
    epNumero.value = episodios.reduce((m, e) => Math.max(m, Number(e.numero)), 0) + 1;
    epDuracao.value = 0;
    epData.value = hojeISO();
    epFormTitulo.textContent = 'Novo episódio';
    epSalvar.textContent = 'Cadastrar episódio';
  }
  formEp.classList.remove('oculto');
  epTitulo.focus();
}

function fecharFormEpisodio() {
  formEp.classList.add('oculto');
  formEp.reset();
  epId.value = '';
}

// CREATE (POST) ou UPDATE (PUT) de episódio
formEp.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!podcastAtual) return;

  const dados = {
    numero: epNumero.value,
    titulo: epTitulo.value,
    duracao_min: epDuracao.value,
    data_publicacao: epData.value
  };

  const id = epId.value;
  const url = id ? `/api/episodios/${id}` : `${API_URL}/${podcastAtual.id}/episodios`;
  const metodo = id ? 'PUT' : 'POST';

  epSalvar.disabled = true;
  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(resultado.erro || 'Erro ao salvar o episódio.', 'erro');
      return;
    }

    mostrarMensagem(resultado.mensagem);
    fecharFormEpisodio();
    carregarEpisodios();
    carregarPodcasts(); // atualiza a contagem de episódios na lista
  } catch (err) {
    mostrarMensagem('Erro de conexão com o servidor.', 'erro');
  } finally {
    epSalvar.disabled = false;
  }
});

// Eventos do painel de episódios
document.getElementById('eps-novo').addEventListener('click', () => abrirFormEpisodio());
document.getElementById('ep-cancelar').addEventListener('click', fecharFormEpisodio);
document.getElementById('eps-fechar').addEventListener('click', fecharPainelEpisodios);
modalEps.addEventListener('click', (e) => { if (e.target === modalEps) fecharPainelEpisodios(); });

epLista.addEventListener('click', (e) => {
  const botao = e.target.closest('button[data-ep-acao]');
  if (!botao) return;
  const id = Number(botao.dataset.id);
  if (botao.dataset.epAcao === 'editar') abrirFormEpisodio(episodios.find((ep) => ep.id === id));
  if (botao.dataset.epAcao === 'excluir') pedirExclusao('episodio', id);
});

// Data de hoje no cabeçalho
document.getElementById('data-hoje').textContent =
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// Ao abrir a página, carrega a lista
carregarPodcasts();
