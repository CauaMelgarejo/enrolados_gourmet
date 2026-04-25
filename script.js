/**
 * Enrolados Gourmet – script.js
 * Responsabilidades:
 *   - Carregar e renderizar o cardápio a partir do JSON
 *   - Filtro dinâmico por categoria
 *   - Integração WhatsApp com mensagem personalizada
 *   - Header scroll / Menu mobile
 *   - Animações de scroll reveal
 */

// =========================================================
// CONFIGURAÇÃO CENTRAL
// =========================================================
const CONFIG = {
  /** URL do cardápio (troque para sua API futuramente) */
  cardapioUrl: 'cardapio.json',

  /** Número do WhatsApp (somente dígitos, com DDI) */
  whatsappNumber: '5511999999999',

  /** Atraso de stagger entre cards (ms) */
  cardStagger: 80,
};

// =========================================================
// ESTADO DA APLICAÇÃO
// =========================================================
const state = {
  /** @type {Array<Object>} */
  cardapio: [],
  categoriaAtiva: 'Todos',
};

// =========================================================
// REFERÊNCIAS DOM
// =========================================================
const dom = {
  header:       document.getElementById('header'),
  menuToggle:   document.getElementById('menuToggle'),
  navMenu:      document.getElementById('navMenu'),
  filtros:      document.getElementById('cardapioFiltros'),
  grid:         document.getElementById('cardapioGrid'),
  loader:       document.getElementById('cardapioLoader'),
  empty:        document.getElementById('cardapioEmpty'),
};

// =========================================================
// UTILS
// =========================================================

/**
 * Formata valor numérico para moeda BR.
 * @param {string|number} valor
 * @returns {string}
 */
function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Gera URL do WhatsApp com mensagem pré-preenchida.
 * @param {string} mensagem
 * @returns {string}
 */
function gerarUrlWhatsapp(mensagem) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(mensagem)}`;
}

// =========================================================
// CARDÁPIO – DATA LAYER
// =========================================================

/**
 * Busca o cardápio via fetch.
 * Preparado para futura substituição por API REST.
 * @returns {Promise<Array<Object>>}
 */
async function fetchCardapio() {
  const resposta = await fetch(CONFIG.cardapioUrl);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

// =========================================================
// CARDÁPIO – UI LAYER
// =========================================================

/**
 * Extrai categorias únicas e ordena.
 * @param {Array<Object>} itens
 * @returns {string[]}
 */
function extrairCategorias(itens) {
  return ['Todos', ...new Set(itens.map((i) => i.categoria))];
}

/**
 * Constrói os botões de filtro dinamicamente.
 * @param {string[]} categorias
 */
function renderizarFiltros(categorias) {
  dom.filtros.innerHTML = '';
  categorias.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = `filtro-btn${cat === state.categoriaAtiva ? ' filtro-btn--active' : ''}`;
    btn.dataset.categoria = cat;
    btn.textContent = cat;
    btn.id = `filtro${cat.replace(/\s+/g, '')}`;
    btn.setAttribute('aria-pressed', cat === state.categoriaAtiva ? 'true' : 'false');
    btn.addEventListener('click', () => aoSelecionarCategoria(cat));
    dom.filtros.appendChild(btn);
  });
}

/**
 * Monta o HTML de um card de produto.
 * @param {Object} item
 * @param {number} index – índice para stagger de animação
 * @returns {HTMLElement}
 */
function criarCardProduto(item, index) {
  const mensagemWa = `Olá, gostaria de pedir o ${item.nome}`;
  const urlWa = gerarUrlWhatsapp(mensagemWa);

  const article = document.createElement('article');
  article.className = `produto-card reveal-on-scroll${item.destaque ? ' produto-card--destaque' : ''}`;
  article.setAttribute('role', 'listitem');
  article.setAttribute('aria-label', item.nome);
  article.style.setProperty('--i', index);

  article.innerHTML = `
    <div class="produto-card__img-wrap">
      <img
        class="produto-card__img"
        src="${item.imagem}"
        alt="${item.nome}"
        loading="lazy"
        onerror="this.src='images/placeholder.jpg'; this.onerror=null;"
      />
      <span class="produto-card__categoria">${item.categoria}</span>
    </div>
    <div class="produto-card__body">
      <h3 class="produto-card__nome">${item.nome}</h3>
      <p class="produto-card__desc">${item.descricao}</p>
      <div class="produto-card__footer">
        <p class="produto-card__preco">
          <span>a partir de</span><br/>
          ${formatarPreco(item.preco)}
        </p>
        <a
          href="${urlWa}"
          class="btn btn--whatsapp btn--sm"
          id="pedirBtn${item.id}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pedir ${item.nome} no WhatsApp"
        >
          <svg class="btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Pedir
        </a>
      </div>
    </div>
  `;

  return article;
}

/**
 * Filtra itens pela categoria ativa e renderiza no grid.
 */
function renderizarGrid() {
  const filtrados = state.categoriaAtiva === 'Todos'
    ? state.cardapio
    : state.cardapio.filter((i) => i.categoria === state.categoriaAtiva);

  dom.grid.innerHTML = '';

  if (filtrados.length === 0) {
    dom.empty.hidden = false;
    return;
  }

  dom.empty.hidden = true;

  filtrados.forEach((item, idx) => {
    const card = criarCardProduto(item, idx);
    dom.grid.appendChild(card);
  });

  // Ativar scroll reveal nos novos cards
  observarElementos(dom.grid.querySelectorAll('.reveal-on-scroll'));
}

// =========================================================
// CARDÁPIO – CONTROLLER
// =========================================================

/**
 * Inicializa o cardápio: fetch → estado → render.
 */
async function iniciarCardapio() {
  try {
    mostrarLoader(true);
    state.cardapio = await fetchCardapio();

    const categorias = extrairCategorias(state.cardapio);
    renderizarFiltros(categorias);
    renderizarGrid();
  } catch (err) {
    console.error('Erro ao carregar cardápio:', err);
    mostrarErroCarga();
  } finally {
    mostrarLoader(false);
  }
}

function mostrarLoader(visivel) {
  dom.loader.hidden = !visivel;
}

function mostrarErroCarga() {
  dom.empty.hidden = false;
  dom.empty.innerHTML = `
    <span class="cardapio__empty-icon">⚠️</span>
    <p>Não foi possível carregar o cardápio. Por favor, tente novamente mais tarde.</p>
  `;
}

// =========================================================
// FILTRO
// =========================================================

/**
 * Atualiza categoria ativa e re-renderiza grid + botões.
 * @param {string} categoria
 */
function aoSelecionarCategoria(categoria) {
  if (state.categoriaAtiva === categoria) return;
  state.categoriaAtiva = categoria;

  // Atualiza botões
  dom.filtros.querySelectorAll('.filtro-btn').forEach((btn) => {
    const ativo = btn.dataset.categoria === categoria;
    btn.classList.toggle('filtro-btn--active', ativo);
    btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');
  });

  renderizarGrid();
}

// =========================================================
// HEADER – scroll behavior + menu mobile
// =========================================================

function iniciarHeader() {
  // Scroll → adiciona sombra
  window.addEventListener('scroll', () => {
    dom.header.classList.toggle('header--scrolled', window.scrollY > 40);
  }, { passive: true });

  // Menu mobile toggle
  dom.menuToggle.addEventListener('click', () => {
    const aberto = dom.navMenu.classList.toggle('nav--open');
    dom.menuToggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    document.body.style.overflow = aberto ? 'hidden' : '';
  });

  // Fechar menu ao clicar em link
  dom.navMenu.querySelectorAll('.header__nav-link, .header__cta').forEach((link) => {
    link.addEventListener('click', () => {
      dom.navMenu.classList.remove('nav--open');
      dom.menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (
      dom.navMenu.classList.contains('nav--open') &&
      !dom.navMenu.contains(e.target) &&
      !dom.menuToggle.contains(e.target)
    ) {
      dom.navMenu.classList.remove('nav--open');
      dom.menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

// =========================================================
// SCROLL REVEAL – IntersectionObserver
// =========================================================

/** @type {IntersectionObserver} */
let scrollObserver;

function criarObserver() {
  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
}

/**
 * Observa um NodeList ou array de elementos.
 * @param {NodeList|Element[]} elementos
 */
function observarElementos(elementos) {
  elementos.forEach((el) => scrollObserver.observe(el));
}

function iniciarScrollReveal() {
  criarObserver();
  observarElementos(document.querySelectorAll('.reveal-on-scroll'));
}

// =========================================================
// INICIALIZAÇÃO
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  iniciarHeader();
  iniciarScrollReveal();
  iniciarCardapio();
});
