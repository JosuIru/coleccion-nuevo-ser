// ============================================================================
// BIBLIOTECA FILTERS - Filtrado y búsqueda de libros
// ============================================================================
// Módulo extraído de biblioteca.js para mejor organización

/**
 * Clase para gestionar filtros y búsqueda de libros
 */
class BibliotecaFilters {
  constructor(biblioteca) {
    this.biblioteca = biblioteca;
  }

  // ==========================================================================
  // FILTRADO DE LIBROS
  // ==========================================================================

  /**
   * Obtiene los libros filtrados según los criterios actuales
   * @returns {Array} Libros filtrados
   */
  getFilteredBooks() {
    const bib = this.biblioteca;
    let librosFiltrados = bib.bookEngine.getAllBooks();

    // Filtrar solo libros publicados
    librosFiltrados = librosFiltrados.filter(libro => libro.status === 'published');

    // Filtro por categoría
    if (bib.filterCategory && bib.filterCategory !== 'all') {
      librosFiltrados = librosFiltrados.filter(libro => libro.category === bib.filterCategory);
    }

    // Filtro por estado de lectura
    if (bib.filterStatus && bib.filterStatus !== 'all') {
      librosFiltrados = librosFiltrados.filter(libro => {
        const progreso = bib.bookEngine.getProgress(libro.id);
        const porcentaje = progreso.percentage || 0;

        switch (bib.filterStatus) {
          case 'in-progress':
            return porcentaje > 0 && porcentaje < 100;
          case 'not-started':
            return porcentaje === 0;
          case 'completed':
            return porcentaje === 100;
          default:
            return true;
        }
      });
    }

    // Filtro por duración estimada
    if (bib.filterDuration && bib.filterDuration !== 'all') {
      librosFiltrados = librosFiltrados.filter(libro => {
        const tiempoEstimado = libro.estimatedReadingTime || libro.estimatedReadTime || '';
        const match = tiempoEstimado.match(/(\d+)/);
        const horasMinimas = match ? parseInt(match[1], 10) : 0;

        switch (bib.filterDuration) {
          case 'short':
            return horasMinimas <= 5;
          case 'medium':
            return horasMinimas >= 6 && horasMinimas <= 10;
          case 'long':
            return horasMinimas > 10;
          default:
            return true;
        }
      });
    }

    // Filtro por búsqueda de texto
    if (bib.searchQuery) {
      const consultaBusqueda = bib.searchQuery.toLowerCase();
      librosFiltrados = librosFiltrados.filter(libro =>
        libro.title.toLowerCase().includes(consultaBusqueda) ||
        (libro.subtitle && libro.subtitle.toLowerCase().includes(consultaBusqueda)) ||
        (libro.description && libro.description.toLowerCase().includes(consultaBusqueda)) ||
        (libro.tags && libro.tags.some(etiqueta => etiqueta.toLowerCase().includes(consultaBusqueda)))
      );
    }

    return librosFiltrados;
  }

  // ==========================================================================
  // RENDERIZADO DE GRID
  // ==========================================================================

  /**
   * Re-renderiza el grid de libros con los filtros aplicados
   */
  renderBooksGrid() {
    const bib = this.biblioteca;
    let contenedorGrid = document.querySelector('.books-grid');

    if (!contenedorGrid) {
      logger.warn('[BibliotecaFilters] .books-grid no encontrado, creando contenedor');

      const bibliotecaContainer = document.querySelector('.biblioteca-container');
      if (!bibliotecaContainer) {
        logger.error('[BibliotecaFilters] No se encontró .biblioteca-container');
        return;
      }

      let booksSection = bibliotecaContainer.querySelector('.books-section');
      if (!booksSection) {
        booksSection = document.createElement('div');
        booksSection.className = 'books-section';
        bibliotecaContainer.appendChild(booksSection);
      }

      contenedorGrid = document.createElement('div');
      contenedorGrid.className = 'books-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12';
      booksSection.appendChild(contenedorGrid);

      logger.info('[BibliotecaFilters] .books-grid creado exitosamente');
    }

    // Usar DocumentFragment para mejor performance
    const libros = this.getFilteredBooks();
    contenedorGrid.innerHTML = '';

    const fragment = document.createDocumentFragment();
    libros.forEach(libro => {
      const card = bib.renderer.createBookCard(libro);
      fragment.appendChild(card);
    });

    contenedorGrid.appendChild(fragment);

    if (window.Icons) {
      Icons.init();
    }
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  /**
   * Adjunta los listeners para los filtros dinámicos
   */
  attachDynamicListeners() {
    const bib = this.biblioteca;

    // Campo de búsqueda
    const campoBusqueda = document.getElementById('search-input');
    if (campoBusqueda) {
      bib.eventManager.addEventListener(campoBusqueda, 'input', (evento) => {
        bib.searchQuery = evento.target.value;
        this.renderBooksGrid();
      });

      // Enter abre búsqueda avanzada
      bib.eventManager.addEventListener(campoBusqueda, 'keydown', async (evento) => {
        if (evento.key === 'Enter' && window.bookEngine) {
          evento.preventDefault();

          if (window.lazyLoader && !window.lazyLoader.isLoaded('search-modal')) {
            await window.lazyLoader.loadSearchModal();
          }

          if (window.SearchModal) {
            const modalBusqueda = new window.SearchModal(window.bookEngine);
            modalBusqueda.open();

            const queryActual = evento.target.value.trim();
            if (queryActual.length >= 3) {
              bib.utils.setTimeout(() => {
                const inputModal = document.querySelector('#search-modal #search-input');
                if (inputModal) {
                  inputModal.value = queryActual;
                  inputModal.dispatchEvent(new Event('input'));
                }
              }, 100);
            }
          }
        }
      });
    }

    // Filtro de categorías
    const filtroCategorias = document.getElementById('category-filter');
    if (filtroCategorias) {
      bib.eventManager.addEventListener(filtroCategorias, 'change', (evento) => {
        bib.filterCategory = evento.target.value;
        this.renderBooksGrid();
      });
    }

    // Filtro de estado
    const filtroEstado = document.getElementById('status-filter');
    if (filtroEstado) {
      bib.eventManager.addEventListener(filtroEstado, 'change', (evento) => {
        bib.filterStatus = evento.target.value;
        this.renderBooksGrid();
      });
    }

    // Filtro de duración
    const filtroDuracion = document.getElementById('duration-filter');
    if (filtroDuracion) {
      bib.eventManager.addEventListener(filtroDuracion, 'change', (evento) => {
        bib.filterDuration = evento.target.value;
        this.renderBooksGrid();
      });
    }
  }
}

// Exportar globalmente
window.BibliotecaFilters = BibliotecaFilters;
