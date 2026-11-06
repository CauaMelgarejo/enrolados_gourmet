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
  cardapioUrl: '/cardapio.json',

  /** Número do WhatsApp (somente dígitos, com DDI) */
  whatsappNumber: '5551984298431',

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
  header: document.getElementById('header'),
  menuToggle: document.getElementById('menuToggle'),
  navMenu: document.getElementById('navMenu'),
  filtros: document.getElementById('cardapioFiltros'),
  grid: document.getElementById('cardapioGrid'),
  loader: document.getElementById('cardapioLoader'),
  empty: document.getElementById('cardapioEmpty'),
  natalGrid: document.getElementById('natalProductGrid'),
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
    btn.textContent = cat === 'Todos' ? 'Destaques' : cat;
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
    ? state.cardapio.filter((i) => i.destaque)
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
    mostrarLoader(false);
  } catch (err) {
    console.error('Erro ao carregar cardápio:', err);
    mostrarLoader(false);
    mostrarErroCarga();
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
  if (!dom.header || !dom.menuToggle || !dom.navMenu) return;

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

function iniciarFaqs() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const button = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    if (!button || !panel) return;

    const isOpen = item.classList.contains('is-open');
    panel.hidden = !isOpen;
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    button.addEventListener('click', () => {
      const shouldOpen = !item.classList.contains('is-open');
      item.classList.toggle('is-open', shouldOpen);
      panel.hidden = !shouldOpen;
      button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    });
  });
}

function renderizarPanetonesNatal() {
  if (!dom.natalGrid) return;

  const existingHero = dom.natalGrid.querySelector('.natal-menu-hero');
  const modal = dom.natalGrid.querySelector('.natal-lightbox');
  const trigger = dom.natalGrid.querySelector('.natal-menu-card__zoom');

  if (!existingHero && !modal) {
    const whatsappUrl = gerarUrlWhatsapp(
      'Olá! Gostaria de fazer uma encomenda de Natal. Tenho interesse nos chocotones da Enrolados Gourmet e gostaria de consultar a disponibilidade.'
    );
    const whatsappCorpUrl = gerarUrlWhatsapp(
      'Olá! Tenho interesse em realizar um pedido corporativo de panetones para minha empresa. Gostaria de receber mais informações e solicitar um orçamento.'
    );

    dom.natalGrid.innerHTML = `
      <article class="natal-menu-hero reveal-on-scroll">
        <div class="natal-menu-hero__content">
          <span class="natal-menu-card__tag">Cardápio oficial</span>
          <h3>Nosso Cardápio de Natal</h3>
          <p>Chocotone Tradicional e Chocotone Trufado com tamanhos e preços em destaque. Consulte sabores e condições para sua encomenda.</p>

          <div class="natal-menu-hero__detail-grid">
            <div class="natal-menu-spec">
              <h4>Chocotone Tradicional</h4>
              <ul>
                <li><span>120g</span><strong>R$ 7,50</strong></li>
                <li><span>250g</span><strong>R$ 22,00</strong></li>
                <li><span>500g</span><strong>R$ 35,00</strong></li>
              </ul>
            </div>
            <div class="natal-menu-spec">
              <h4>Chocotone Trufado</h4>
              <ul>
                <li><span>120g</span><strong>R$ 10,00</strong></li>
                <li><span>420g</span><strong>R$ 28,00</strong></li>
                <li><span>800g</span><strong>R$ 48,00</strong></li>
              </ul>
            </div>
          </div>

          <div class="natal-menu-hero__flavors">
            <h4>Sabores disponíveis</h4>
            <ul>
              <li>Brigadeiro</li>
              <li>Branquinho</li>
              <li>Stikadinho</li>
              <li>Morango</li>
              <li class="natal-menu-hero__flavor--note">Cravejado — somente por encomenda</li>
              <li>Ferrero Rocher</li>
              <li>Kinder Bueno</li>
              <li>Oreo</li>
              <li class="natal-menu-hero__flavor--highlight">Ninho com Nutella — acréscimo de R$ 12,00</li>
              <li>Maracujá trufado</li>
            </ul>
          </div>

          <p class="natal-menu-hero__deadline"><strong>Faça suas encomendas de Natal até dia 20 de dezembro.</strong></p>
          <div class="natal-menu-hero__actions">
            <a href="${whatsappUrl}" class="btn btn--whatsapp btn--sm" target="_blank" rel="noopener noreferrer">Fazer pedido</a>
            <a href="${whatsappCorpUrl}" class="btn btn--primary btn--sm" target="_blank" rel="noopener noreferrer">Pedido corporativo</a>
          </div>
        </div>
        <div class="natal-menu-hero__image-wrap">
          <img src="../images/PanetonesFestivos.png" alt="Cardápio oficial de panetones de Natal da Enrolados Gourmet" loading="lazy" />
          <button type="button" class="natal-menu-card__zoom" aria-label="Ampliar imagem do cardápio">Ampliar imagem</button>
        </div>
      </article>
      <div class="natal-lightbox" id="natalLightbox" aria-hidden="true">
        <button type="button" class="natal-lightbox__close" aria-label="Fechar imagem">Fechar</button>
        <img src="../images/PanetonesFestivos.png" alt="Cardápio oficial de panetones de Natal da Enrolados Gourmet" />
      </div>
    `;
  }

  const activeModal = dom.natalGrid.querySelector('.natal-lightbox');
  const activeTrigger = dom.natalGrid.querySelector('.natal-menu-card__zoom');
  if (activeModal && activeTrigger) {
    activeTrigger.addEventListener('click', () => {
      activeModal.classList.add('is-open');
      activeModal.setAttribute('aria-hidden', 'false');
    });

    activeModal.addEventListener('click', (event) => {
      if (event.target === activeModal || event.target.classList.contains('natal-lightbox__close')) {
        activeModal.classList.remove('is-open');
        activeModal.setAttribute('aria-hidden', 'true');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && activeModal.classList.contains('is-open')) {
        activeModal.classList.remove('is-open');
        activeModal.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

// =========================================================
// INICIALIZAÇÃO
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  iniciarHeader();
  iniciarScrollReveal();
  iniciarFaqs();
  renderizarPanetonesNatal();
  if (dom.filtros && dom.grid && dom.loader && dom.empty) {
    iniciarCardapio();
  }
});
