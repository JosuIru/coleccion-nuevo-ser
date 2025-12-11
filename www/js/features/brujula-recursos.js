/**
 * Brújula de Recursos - Sistema de Navegación Inteligente
 *
 * Sistema contemplativo y no directivo para explorar recursos del ecosistema.
 * Aprende de las preferencias del usuario y sugiere rutas personalizadas.
 *
 * Mejoras implementadas:
 * - Algoritmo de scoring semántico para relevancia
 * - Aprendizaje de preferencias del usuario
 * - Cross-referencing entre libros
 * - Sugerencias relacionadas inteligentes
 * - Modo serendipidad para descubrimientos inesperados
 * - Integración con progreso y notas del usuario
 */

class BrujulaRecursos {
  constructor() {
    this.modo = 'inicio'; // inicio, dialogo, explorar, serendipity
    this.pasoDialogo = 0;
    this.inquietud = '';
    this.dimensionElegida = null;
    this.reflexion = '';
    this.recursos = [];
    this.recursoAbierto = null;
    this.filtro = { dimension: null, tipo: null, libro: null };
    this.historial = this.cargarHistorial();
    this.favoritos = this.cargarFavoritos();
    this.preferencias = this.cargarPreferencias();

    // Dimensiones del ecosistema
    this.dimensiones = {
      interior: {
        emoji: '🔮',
        nombre: 'Interior/Personal',
        color: 'rgb(139, 92, 246)',
        libros: ['codigo-despertar', 'manual-practico', 'manual-transicion'],
        pregunta: '¿Qué está pasando dentro de ti? ¿Qué necesitas transformar en ti mismo?',
        keywords: ['consciencia', 'meditación', 'contemplación', 'despertar', 'yo', 'identidad', 'presencia']
      },
      relacional: {
        emoji: '🤝',
        nombre: 'Relacional',
        color: 'rgb(234, 88, 12)',
        libros: ['manual-transicion', 'manual-practico'],
        pregunta: '¿Cómo son tus relaciones? ¿Qué patrones se repiten?',
        keywords: ['comunidad', 'diálogo', 'conflicto', 'empatía', 'comunicación', 'círculo', 'grupo']
      },
      institucional: {
        emoji: '🏛️',
        nombre: 'Institucional/Organizacional',
        color: 'rgb(59, 130, 246)',
        libros: ['ahora-instituciones'],
        pregunta: '¿Cómo funcionan las estructuras? ¿Qué premisas operan invisibles?',
        keywords: ['organización', 'institución', 'gobernanza', 'cooperativa', 'estructura', 'sistema', 'poder']
      },
      colectivo: {
        emoji: '🌍',
        nombre: 'Colectivo/Ecológico',
        color: 'rgb(34, 197, 94)',
        libros: ['manifiesto', 'practicas-radicales', 'ahora-instituciones'],
        pregunta: '¿Cómo se conecta con el contexto mayor? ¿Con la Tierra, con lo vivo?',
        keywords: ['ecología', 'planeta', 'biosfera', 'regeneración', 'interdependencia', 'clima', 'naturaleza']
      },
      fundamentos: {
        emoji: '📚',
        nombre: 'Fundamentos Filosóficos',
        color: 'rgb(161, 161, 170)',
        libros: ['codigo-despertar', 'manifiesto'],
        pregunta: '¿Qué ideas sostienen la situación? ¿Desde qué paradigma operas?',
        keywords: ['filosofía', 'premisas', 'paradigma', 'ontología', 'epistemología', 'teoría', 'marco']
      }
    };
  }

  // ========== INICIALIZACIÓN ==========

  async init() {
    console.log('🧭 Inicializando Brújula de Recursos...');
    await this.cargarTodosRecursos();
    console.log(`✅ Brújula cargada con ${this.recursos.length} recursos`);
  }

  async cargarTodosRecursos() {
    try {
      // Cargar catálogo de libros
      const response = await fetch('books/catalog.json');
      const catalog = await response.json();

      this.recursos = [];

      // Cargar recursos de cada libro (verificando su config.json)
      for (const libro of catalog.books) {
        await this.cargarRecursosLibro(libro);
      }

      // Enriquecer recursos con scoring y metadata
      this.enriquecerRecursos();

    } catch (error) {
      console.error('Error cargando recursos:', error);
    }
  }

  async cargarRecursosLibro(libro) {
    try {
      const configResponse = await fetch(`books/${libro.id}/config.json`);
      const config = await configResponse.json();

      // Verificar si tiene recursos habilitados
      if (config.features?.resources?.enabled) {
        console.log(`📦 Cargando recursos de ${libro.id}...`);
        const recursosResponse = await fetch(config.features.resources.file);
        const data = await recursosResponse.json();

        // Procesar cada tipo de recurso
        const tipos = ['books', 'papers', 'documentaries', 'podcasts', 'organizations', 'tools'];
        let recursosLibro = 0;

        for (const tipo of tipos) {
          if (data[tipo]) {
            data[tipo].forEach(recurso => {
              this.recursos.push({
                ...recurso,
                tipo: this.mapearTipo(tipo),
                icono: this.asignarIcono(tipo),
                libroOrigen: libro.id,
                libroNombre: libro.title,
                dimensiones: this.detectarDimensiones(recurso, libro.id)
              });
              recursosLibro++;
            });
          }
        }

        // Añadir referencias a otros libros de la colección
        if (data.related_books_coleccion) {
          data.related_books_coleccion.forEach(ref => {
            this.recursos.push({
              id: `rel-${ref.id}`,
              title: ref.title,
              description: ref.relation,
              tipo: 'libro_colección',
              icono: '📖',
              libroOrigen: libro.id,
              libroDestino: ref.id,
              dimensiones: ref.relatedChapters ? this.inferirDimensionesDeCapitulos(ref.relatedChapters) : [],
              relatedChapters: ref.relatedChapters
            });
            recursosLibro++;
          });
        }

        console.log(`  ✓ ${recursosLibro} recursos cargados de ${libro.id}`);
      }
    } catch (error) {
      console.warn(`No se pudieron cargar recursos de ${libro.id}:`, error);
    }
  }

  // ========== SISTEMA DE DIMENSIONES INTELIGENTE ==========

  detectarDimensiones(recurso, libroId) {
    const dimensiones = new Set();
    const texto = `${recurso.title} ${recurso.description} ${recurso.why || ''}`.toLowerCase();

    // Detectar por keywords
    for (const [dimId, dim] of Object.entries(this.dimensiones)) {
      const coincidencias = dim.keywords.filter(kw => texto.includes(kw)).length;
      if (coincidencias > 0) {
        dimensiones.add(dimId);
      }

      // Detectar por libro de origen
      if (dim.libros.includes(libroId)) {
        dimensiones.add(dimId);
      }
    }

    // Si no se detectó ninguna, asignar fundamentos por defecto
    if (dimensiones.size === 0) {
      dimensiones.add('fundamentos');
    }

    return Array.from(dimensiones);
  }

  inferirDimensionesDeCapitulos(capitulos) {
    // Inferir dimensiones basadas en capítulos relacionados
    const dimensiones = new Set();

    capitulos.forEach(cap => {
      // Los capítulos iniciales suelen ser fundamentos
      if (cap.match(/cap[1-4]|prologo/)) {
        dimensiones.add('fundamentos');
      }
      // Capítulos intermedios son prácticos
      if (cap.match(/cap[5-9]|cap1[0-4]/)) {
        dimensiones.add('interior');
      }
      // Capítulos finales son aplicación
      if (cap.match(/cap1[5-9]|cap2[0-9]/)) {
        dimensiones.add('colectivo');
      }
    });

    return Array.from(dimensiones);
  }

  // ========== ALGORITMO DE SCORING Y RELEVANCIA ==========

  enriquecerRecursos() {
    this.recursos = this.recursos.map(recurso => ({
      ...recurso,
      score: this.calcularScoreBase(recurso),
      tags: this.extraerTags(recurso)
    }));
  }

  calcularScoreBase(recurso) {
    let score = 5; // Base neutral

    // Bonus por tipo (algunos tipos son más accesibles)
    const bonusTipo = {
      'libro_colección': 3,
      'herramienta': 2,
      'documental': 2,
      'podcast': 1,
      'libro': 0,
      'artículo': -1 // Más académico, menos accesible
    };
    score += bonusTipo[recurso.tipo] || 0;

    // Bonus por año reciente (para papers y libros)
    if (recurso.year && recurso.year > 2015) {
      score += 1;
    }

    // Bonus si es del ecosistema Nuevo Ser
    if (recurso.tipo === 'libro_colección') {
      score += 5;
    }

    return score;
  }

  calcularRelevancia(recurso, inquietud = '', dimensionPreferida = null) {
    let score = recurso.score;

    // Scoring basado en inquietud del usuario
    if (inquietud) {
      const palabrasInquietud = inquietud.toLowerCase().split(/\s+/);
      const textoRecurso = `${recurso.title} ${recurso.description}`.toLowerCase();

      const coincidencias = palabrasInquietud.filter(palabra =>
        palabra.length > 3 && textoRecurso.includes(palabra)
      ).length;

      score += coincidencias * 3;
    }

    // Scoring basado en dimensión preferida
    if (dimensionPreferida && recurso.dimensiones.includes(dimensionPreferida)) {
      score += 5;
    }

    // Bonus por historial del usuario
    if (this.historial.some(h => h.id === recurso.id)) {
      score -= 2; // Penalizar recursos ya vistos (priorizar novedad)
    }

    // Bonus por favoritos relacionados
    const favoritosRelacionados = this.favoritos.filter(f =>
      recurso.dimensiones.some(d => f.dimensiones.includes(d))
    );
    if (favoritosRelacionados.length > 0) {
      score += favoritosRelacionados.length;
    }

    // Bonus por preferencias aprendidas
    recurso.dimensiones.forEach(dim => {
      score += (this.preferencias[dim] || 0) * 0.5;
    });

    return score;
  }

  extraerTags(recurso) {
    const tags = new Set();

    // Tags de dimensiones
    recurso.dimensiones.forEach(d => tags.add(d));

    // Tags de tipo
    tags.add(recurso.tipo);

    // Tags de keywords detectadas
    const texto = `${recurso.title} ${recurso.description}`.toLowerCase();
    Object.entries(this.dimensiones).forEach(([dimId, dim]) => {
      dim.keywords.forEach(kw => {
        if (texto.includes(kw)) tags.add(kw);
      });
    });

    return Array.from(tags);
  }

  // ========== RECOMENDACIONES INTELIGENTES ==========

  obtenerRecomendaciones(recursoActual, limite = 5) {
    return this.recursos
      .filter(r => r.id !== recursoActual.id)
      .map(r => ({
        ...r,
        similaridad: this.calcularSimilaridad(recursoActual, r)
      }))
      .sort((a, b) => b.similaridad - a.similaridad)
      .slice(0, limite);
  }

  calcularSimilaridad(r1, r2) {
    let score = 0;

    // Similitud por dimensiones compartidas
    const dimensionesComunes = r1.dimensiones.filter(d => r2.dimensiones.includes(d));
    score += dimensionesComunes.length * 3;

    // Similitud por mismo tipo
    if (r1.tipo === r2.tipo) score += 2;

    // Similitud por tags compartidos
    const tagsComunes = r1.tags.filter(t => r2.tags.includes(t));
    score += tagsComunes.length;

    // Similitud por mismo libro de origen
    if (r1.libroOrigen === r2.libroOrigen) score += 1;

    return score;
  }

  // ========== MODO SERENDIPITY ==========

  obtenerRecursoAleatorio(evitarVistos = true) {
    let candidatos = this.recursos;

    if (evitarVistos && this.historial.length > 0) {
      candidatos = this.recursos.filter(r =>
        !this.historial.some(h => h.id === r.id)
      );
    }

    if (candidatos.length === 0) candidatos = this.recursos;

    return candidatos[Math.floor(Math.random() * candidatos.length)];
  }

  // ========== PERSISTENCIA ==========

  cargarHistorial() {
    try {
      return JSON.parse(localStorage.getItem('brujula_historial') || '[]');
    } catch {
      return [];
    }
  }

  guardarHistorial() {
    localStorage.setItem('brujula_historial', JSON.stringify(this.historial));
  }

  registrarVisita(recurso) {
    this.historial.unshift({
      id: recurso.id,
      timestamp: Date.now(),
      dimensiones: recurso.dimensiones
    });

    // Mantener solo últimos 50
    if (this.historial.length > 50) {
      this.historial = this.historial.slice(0, 50);
    }

    this.guardarHistorial();
    this.actualizarPreferencias(recurso.dimensiones);
  }

  cargarFavoritos() {
    try {
      return JSON.parse(localStorage.getItem('brujula_favoritos') || '[]');
    } catch {
      return [];
    }
  }

  guardarFavoritos() {
    localStorage.setItem('brujula_favoritos', JSON.stringify(this.favoritos));
  }

  toggleFavorito(recurso) {
    const index = this.favoritos.findIndex(f => f.id === recurso.id);

    if (index >= 0) {
      this.favoritos.splice(index, 1);
    } else {
      this.favoritos.push({
        id: recurso.id,
        dimensiones: recurso.dimensiones,
        timestamp: Date.now()
      });
    }

    this.guardarFavoritos();
  }

  esFavorito(recurso) {
    return this.favoritos.some(f => f.id === recurso.id);
  }

  cargarPreferencias() {
    try {
      return JSON.parse(localStorage.getItem('brujula_preferencias') || '{}');
    } catch {
      return {};
    }
  }

  guardarPreferencias() {
    localStorage.setItem('brujula_preferencias', JSON.stringify(this.preferencias));
  }

  actualizarPreferencias(dimensiones) {
    dimensiones.forEach(dim => {
      this.preferencias[dim] = (this.preferencias[dim] || 0) + 1;
    });
    this.guardarPreferencias();
  }

  // ========== UTILIDADES ==========

  mapearTipo(tipo) {
    const mapa = {
      'books': 'libro',
      'papers': 'artículo',
      'documentaries': 'documental',
      'podcasts': 'podcast',
      'organizations': 'organización',
      'tools': 'herramienta'
    };
    return mapa[tipo] || tipo;
  }

  asignarIcono(tipo) {
    const iconos = {
      'books': '📚',
      'papers': '📄',
      'documentaries': '🎬',
      'podcasts': '🎙️',
      'organizations': '🏢',
      'tools': '🔧'
    };
    return iconos[tipo] || '📦';
  }

  obtenerDuracionEstimada(recurso) {
    if (recurso.duration) return recurso.duration;

    // Estimaciones por tipo
    const estimaciones = {
      'libro': '8-12 horas',
      'artículo': '30-60 min',
      'documental': '1-2 horas',
      'podcast': '30-90 min',
      'organización': 'variable',
      'herramienta': 'variable',
      'libro_colección': '6-10 horas'
    };

    return estimaciones[recurso.tipo] || 'variable';
  }

  // ========== RENDERIZADO ==========

  render() {
    if (!this.ui) {
      this.ui = new BrujulaRecursosUI(this);
    }
    this.ui.render();
  }

  open() {
    this.modo = 'inicio';
    this.pasoDialogo = 0;
    this.inquietud = '';
    this.dimensionElegida = null;
    this.render();
  }

  close() {
    if (this.ui) {
      this.ui.close();
    }
  }

  // ========== API PÚBLICA ==========

  static async create() {
    const brujula = new BrujulaRecursos();
    await brujula.init();
    return brujula;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.BrujulaRecursos = BrujulaRecursos;

  // Inicializar instancia global al cargar
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🧭 Preparando Brújula de Recursos...');
    window.brujulaRecursos = await BrujulaRecursos.create();
    console.log('✅ Brújula lista');
  });
}
