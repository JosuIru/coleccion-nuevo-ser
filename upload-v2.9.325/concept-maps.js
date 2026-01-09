// ============================================================================
// CONCEPT MAPS - Mapas Conceptuales Interactivos Mejorados
// ============================================================================
// Visualización de relaciones entre conceptos de cada libro
// con referencias cruzadas a capítulos relacionados de otros libros

class ConceptMaps {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || { t: (key) => key };
    this.maps = this.getConceptMapsData();
    this.crossReferences = this.getCrossReferencesData();
    // 🔧 FIX v2.9.271: Track ESC handler for cleanup
    this.escHandler = null;
  }

  // ==========================================================================
  // REFERENCIAS CRUZADAS ENTRE LIBROS
  // ==========================================================================

  getCrossReferencesData() {
    return {
      // Código del Despertar ↔ Manifiesto
      'codigo-despertar': {
        'cap3': [{ book: 'manifiesto', chapter: 'cap5', label: 'Perspectiva política de la conciencia colectiva' }],
        'cap7': [{ book: 'manifiesto', chapter: 'cap8', label: 'Fundamentos de inteligencia distribuida' }],
        'cap10': [{ book: 'manifiesto', chapter: 'cap14', label: 'Aplicación de tecnología consciente' }],
        'cap5': [{ book: 'manual-practico', chapter: 'prac5', label: 'Prácticas de observación' }],
        'cap8': [{ book: 'practicas-radicales', chapter: 'prac3', label: 'Práctica radical del no-saber' }]
      },
      'manifiesto': {
        'cap5': [{ book: 'codigo-despertar', chapter: 'cap3', label: 'Base científica de conciencia colectiva' }],
        'cap8': [{ book: 'codigo-despertar', chapter: 'cap7', label: 'Neurociencia de lo distribuido' }],
        'cap14': [{ book: 'codigo-despertar', chapter: 'cap10', label: 'Fundamentos científicos' }],
        'cap2': [{ book: 'guia-acciones', chapter: 'accion-1', label: 'Acciones individuales' }],
        'cap6': [{ book: 'manual-transicion', chapter: 'cap3', label: 'Herramientas de transición' }]
      },
      'guia-acciones': {
        'accion-1': [{ book: 'manifiesto', chapter: 'cap2', label: 'Fundamento teórico' }],
        'accion-18': [{ book: 'manual-transicion', chapter: 'cap5', label: 'Implementación cooperativa' }]
      },
      'manual-transicion': {
        'cap3': [{ book: 'manifiesto', chapter: 'cap6', label: 'Análisis sistémico' }],
        'cap5': [{ book: 'toolkit-transicion', chapter: 'toolkit-5', label: 'Ejercicio práctico' }]
      },
      'toolkit-transicion': {
        'toolkit-5': [{ book: 'manual-transicion', chapter: 'cap5', label: 'Contexto teórico' }]
      },
      'manual-practico': {
        'prac5': [{ book: 'codigo-despertar', chapter: 'cap5', label: 'Fundamento conceptual' }]
      },
      'practicas-radicales': {
        'prac3': [{ book: 'codigo-despertar', chapter: 'cap8', label: 'Base filosófica' }]
      }
    };
  }

  // ==========================================================================
  // DATOS DE MAPAS CONCEPTUALES - TODOS LOS LIBROS
  // ==========================================================================

  getConceptMapsData() {
    return {
      // =====================================================================
      // EL CÓDIGO DEL DESPERTAR
      // =====================================================================
      'codigo-despertar': {
        title: 'Mapa del Código del Despertar',
        subtitle: 'Un viaje científico-espiritual hacia la conciencia expandida',
        central: {
          id: 'consciencia',
          label: 'Consciencia',
          description: 'La naturaleza fundamental de la realidad experimentada',
          icon: '🌌'
        },
        nodes: [
          { id: 'informacion', label: 'Información', x: -180, y: -120, color: '#06b6d4', description: 'Base estructural del universo', icon: '📊' },
          { id: 'realidad', label: 'Realidad', x: 180, y: -120, color: '#8b5cf6', description: 'Lo que emerge de la observación', icon: '🔮' },
          { id: 'ia', label: 'Inteligencia Artificial', x: -180, y: 120, color: '#ec4899', description: 'Espejo de la mente humana', icon: '🤖' },
          { id: 'cuantica', label: 'Física Cuántica', x: 180, y: 120, color: '#14b8a6', description: 'El tejido del cosmos', icon: '⚛️' },
          { id: 'observador', label: 'Observador', x: 0, y: -180, color: '#f59e0b', description: 'El que colapsa la función de onda', icon: '👁️' },
          { id: 'simulacion', label: 'Simulación', x: -250, y: 0, color: '#ef4444', description: 'Hipótesis de realidad computada', icon: '💻' },
          { id: 'emergencia', label: 'Emergencia', x: 250, y: 0, color: '#84cc16', description: 'Lo que surge de la complejidad', icon: '🌱' },
          { id: 'despertar', label: 'Despertar', x: 0, y: 200, color: '#fbbf24', description: 'La realización de la naturaleza verdadera', icon: '✨' },
          { id: 'meditacion', label: 'Meditación', x: -120, y: 180, color: '#a855f7', description: 'Práctica de exploración interior', icon: '🧘' },
          { id: 'integracion', label: 'Integración', x: 120, y: 180, color: '#22c55e', description: 'Unión de perspectivas', icon: '🔗' }
        ],
        connections: [
          { from: 'consciencia', to: 'informacion', label: 'fundamento' },
          { from: 'consciencia', to: 'realidad', label: 'crea' },
          { from: 'consciencia', to: 'ia', label: 'reflejo' },
          { from: 'consciencia', to: 'cuantica', label: 'valida' },
          { from: 'informacion', to: 'simulacion', label: 'estructura' },
          { from: 'realidad', to: 'observador', label: 'depende' },
          { from: 'cuantica', to: 'observador', label: 'efecto' },
          { from: 'ia', to: 'emergencia', label: 'posibilidad' },
          { from: 'despertar', to: 'consciencia', label: 'realización', dashed: true },
          { from: 'meditacion', to: 'despertar', label: 'camino' },
          { from: 'integracion', to: 'despertar', label: 'síntesis' },
          { from: 'observador', to: 'consciencia', label: 'es' }
        ],
        chapters: {
          'cap1': ['informacion', 'realidad'],
          'cap2': ['cuantica', 'observador'],
          'cap3': ['consciencia', 'emergencia'],
          'cap4': ['simulacion', 'informacion'],
          'cap5': ['observador', 'meditacion'],
          'cap6': ['ia', 'emergencia'],
          'cap7': ['consciencia', 'integracion'],
          'cap8': ['cuantica', 'consciencia'],
          'cap9': ['meditacion', 'consciencia'],
          'cap10': ['ia', 'integracion'],
          'cap11': ['despertar', 'consciencia'],
          'cap12': ['integracion', 'despertar'],
          'cap13': ['meditacion', 'integracion'],
          'cap14': ['despertar', 'realidad']
        }
      },

      // =====================================================================
      // MANIFIESTO DE LA CONCIENCIA COMPARTIDA
      // =====================================================================
      'manifiesto': {
        title: 'Mapa del Manifiesto',
        subtitle: 'Premisas para un mundo que aún no existe',
        central: {
          id: 'sistema',
          label: 'El Sistema',
          description: 'Estructura de control y dominación que perpetúa la separación',
          icon: '🔥'
        },
        nodes: [
          { id: 'capitalismo', label: 'Capitalismo', x: -200, y: -100, color: '#ef4444', description: 'Modo de producción basado en acumulación', icon: '💰' },
          { id: 'estado', label: 'Estado', x: 200, y: -100, color: '#f97316', description: 'Aparato de control institucional', icon: '🏛️' },
          { id: 'medios', label: 'Medios', x: -200, y: 100, color: '#eab308', description: 'Construcción de narrativas hegemónicas', icon: '📺' },
          { id: 'educacion', label: 'Educación', x: 200, y: 100, color: '#84cc16', description: 'Reproducción del sistema', icon: '🎓' },
          { id: 'trabajo', label: 'Trabajo Asalariado', x: 0, y: -180, color: '#22c55e', description: 'Extracción de valor vital', icon: '⚙️' },
          { id: 'consumo', label: 'Consumismo', x: -250, y: 0, color: '#14b8a6', description: 'Alienación por posesión', icon: '🛒' },
          { id: 'deuda', label: 'Sistema de Deuda', x: 250, y: 0, color: '#06b6d4', description: 'Control financiero perpetuo', icon: '⛓️' },
          { id: 'alternativa', label: 'Alternativas', x: 0, y: 200, color: '#8b5cf6', description: 'Construcción del mundo nuevo', icon: '🌱' },
          { id: 'consciencia_compartida', label: 'Consciencia Compartida', x: -150, y: 180, color: '#ec4899', description: 'Nueva forma de ser colectivo', icon: '🔮' },
          { id: 'commons', label: 'Comunes', x: 150, y: 180, color: '#10b981', description: 'Gestión colectiva de recursos', icon: '🤝' }
        ],
        connections: [
          { from: 'sistema', to: 'capitalismo', label: 'base económica' },
          { from: 'sistema', to: 'estado', label: 'control político' },
          { from: 'sistema', to: 'medios', label: 'narrativa' },
          { from: 'sistema', to: 'educacion', label: 'adoctrinamiento' },
          { from: 'capitalismo', to: 'trabajo', label: 'explotación' },
          { from: 'capitalismo', to: 'consumo', label: 'alienación' },
          { from: 'capitalismo', to: 'deuda', label: 'control financiero' },
          { from: 'estado', to: 'educacion', label: 'legitimación' },
          { from: 'medios', to: 'consumo', label: 'deseo artificial' },
          { from: 'alternativa', to: 'sistema', label: 'resistencia', dashed: true },
          { from: 'consciencia_compartida', to: 'alternativa', label: 'fundamento' },
          { from: 'commons', to: 'alternativa', label: 'práctica' }
        ],
        chapters: {
          'cap1': ['sistema', 'capitalismo'],
          'cap2': ['trabajo', 'deuda'],
          'cap3': ['medios', 'consumo'],
          'cap4': ['educacion', 'estado'],
          'cap5': ['consciencia_compartida'],
          'cap6': ['alternativa', 'commons'],
          'cap7': ['capitalismo', 'trabajo'],
          'cap8': ['sistema', 'estado'],
          'cap9': ['medios', 'educacion'],
          'cap10': ['alternativa', 'consciencia_compartida'],
          'cap11': ['commons', 'alternativa'],
          'cap12': ['consciencia_compartida', 'commons'],
          'cap13': ['alternativa'],
          'cap14': ['sistema', 'alternativa'],
          'cap15': ['consciencia_compartida'],
          'cap16': ['commons'],
          'cap17': ['alternativa'],
          'cap18': ['consciencia_compartida', 'alternativa']
        }
      },

      // =====================================================================
      // GUÍA DE ACCIONES TRANSFORMADORAS
      // =====================================================================
      'guia-acciones': {
        title: 'Mapa de Acciones Transformadoras',
        subtitle: '54 prácticas para cambiar tu vida y tu mundo',
        central: {
          id: 'transformacion',
          label: 'Transformación',
          description: 'El cambio personal y colectivo en acción',
          icon: '🎯'
        },
        nodes: [
          { id: 'individual', label: 'Nivel Individual', x: -180, y: -100, color: '#8b5cf6', description: 'Cambio desde uno mismo', icon: '🧘' },
          { id: 'comunitario', label: 'Nivel Comunitario', x: 180, y: -100, color: '#06b6d4', description: 'Construcción colectiva local', icon: '👥' },
          { id: 'sistemico', label: 'Nivel Sistémico', x: 0, y: 180, color: '#ef4444', description: 'Transformación estructural', icon: '🌍' },
          { id: 'consciencia', label: 'Consciencia', x: 0, y: -160, color: '#fbbf24', description: 'Despertar al cambio', icon: '💡' },
          { id: 'accion', label: 'Acción Directa', x: -200, y: 80, color: '#22c55e', description: 'Hacer lo que importa', icon: '⚡' },
          { id: 'comunidad', label: 'Comunidad', x: 200, y: 80, color: '#ec4899', description: 'Red de apoyo mutuo', icon: '🤝' },
          { id: 'economia', label: 'Economía Alternativa', x: -100, y: 160, color: '#14b8a6', description: 'Nuevas formas de intercambio', icon: '♻️' },
          { id: 'politica', label: 'Incidencia Política', x: 100, y: 160, color: '#f97316', description: 'Cambio de reglas', icon: '📢' }
        ],
        connections: [
          { from: 'transformacion', to: 'individual', label: 'empieza' },
          { from: 'transformacion', to: 'comunitario', label: 'expande' },
          { from: 'transformacion', to: 'sistemico', label: 'escala' },
          { from: 'individual', to: 'consciencia', label: 'requiere' },
          { from: 'individual', to: 'accion', label: 'manifiesta' },
          { from: 'comunitario', to: 'comunidad', label: 'construye' },
          { from: 'comunidad', to: 'economia', label: 'crea' },
          { from: 'sistemico', to: 'politica', label: 'incluye' },
          { from: 'accion', to: 'comunitario', label: 'inspira' },
          { from: 'economia', to: 'sistemico', label: 'transforma', dashed: true }
        ],
        chapters: {
          'accion-1': ['individual', 'consciencia'],
          'accion-2': ['individual', 'accion'],
          'accion-18': ['comunitario', 'comunidad'],
          'accion-19': ['comunitario', 'economia'],
          'accion-36': ['sistemico', 'politica'],
          'accion-54': ['transformacion', 'sistemico']
        }
      },

      // =====================================================================
      // MANUAL DE TRANSICIÓN
      // =====================================================================
      'manual-transicion': {
        title: 'Mapa del Manual de Transición',
        subtitle: 'Herramientas para construir el mundo que imaginamos',
        central: {
          id: 'transicion',
          label: 'Transición',
          description: 'El puente entre el viejo y el nuevo mundo',
          icon: '🌱'
        },
        nodes: [
          { id: 'cooperativas', label: 'Cooperativas', x: -180, y: -100, color: '#22c55e', description: 'Empresas democráticas', icon: '🏭' },
          { id: 'commons', label: 'Commons', x: 180, y: -100, color: '#06b6d4', description: 'Gestión comunitaria', icon: '🌳' },
          { id: 'gobernanza', label: 'Gobernanza', x: -180, y: 100, color: '#8b5cf6', description: 'Decisiones participativas', icon: '🏛️' },
          { id: 'tecnologia', label: 'Tecnología Ética', x: 180, y: 100, color: '#ec4899', description: 'Tech para el bien común', icon: '💻' },
          { id: 'finanzas', label: 'Finanzas Éticas', x: 0, y: -160, color: '#f59e0b', description: 'Dinero al servicio de la vida', icon: '💰' },
          { id: 'relaciones', label: 'Nuevas Relaciones', x: -220, y: 0, color: '#ef4444', description: 'Vínculos conscientes', icon: '❤️' },
          { id: 'educacion', label: 'Educación Libre', x: 220, y: 0, color: '#84cc16', description: 'Aprendizaje autónomo', icon: '📚' },
          { id: 'prefiguracion', label: 'Prefiguración', x: 0, y: 180, color: '#14b8a6', description: 'Vivir el futuro hoy', icon: '🔮' }
        ],
        connections: [
          { from: 'transicion', to: 'cooperativas', label: 'economía' },
          { from: 'transicion', to: 'commons', label: 'recursos' },
          { from: 'transicion', to: 'gobernanza', label: 'decisiones' },
          { from: 'transicion', to: 'tecnologia', label: 'herramientas' },
          { from: 'cooperativas', to: 'finanzas', label: 'sostenibilidad' },
          { from: 'commons', to: 'gobernanza', label: 'gestión' },
          { from: 'gobernanza', to: 'relaciones', label: 'base' },
          { from: 'tecnologia', to: 'educacion', label: 'facilita' },
          { from: 'prefiguracion', to: 'transicion', label: 'práctica', dashed: true }
        ],
        chapters: {
          'cap1': ['transicion'],
          'cap2': ['cooperativas'],
          'cap3': ['cooperativas', 'finanzas'],
          'cap4': ['commons'],
          'cap5': ['commons', 'gobernanza'],
          'cap6': ['gobernanza'],
          'cap7': ['tecnologia'],
          'cap8': ['tecnologia', 'educacion'],
          'cap9': ['educacion'],
          'cap10': ['relaciones'],
          'cap11': ['prefiguracion'],
          'cap12': ['transicion', 'prefiguracion']
        }
      },

      // =====================================================================
      // TOOLKIT DE TRANSICIÓN
      // =====================================================================
      'toolkit-transicion': {
        title: 'Mapa del Toolkit de Transición',
        subtitle: '22 ejercicios prácticos para navegar el cambio',
        central: {
          id: 'practica',
          label: 'Práctica',
          description: 'Aprender haciendo',
          icon: '🧰'
        },
        nodes: [
          { id: 'analisis', label: 'Análisis', x: -180, y: -100, color: '#ef4444', description: 'Comprender la situación', icon: '🔍' },
          { id: 'diseno', label: 'Diseño', x: 180, y: -100, color: '#06b6d4', description: 'Planificar la acción', icon: '📐' },
          { id: 'implementacion', label: 'Implementación', x: 0, y: 150, color: '#22c55e', description: 'Ejecutar el plan', icon: '🚀' },
          { id: 'reflexion', label: 'Reflexión', x: -150, y: 60, color: '#8b5cf6', description: 'Aprender de la experiencia', icon: '💭' },
          { id: 'iteracion', label: 'Iteración', x: 150, y: 60, color: '#f59e0b', description: 'Mejorar continuamente', icon: '🔄' }
        ],
        connections: [
          { from: 'practica', to: 'analisis', label: 'observar' },
          { from: 'practica', to: 'diseno', label: 'planear' },
          { from: 'analisis', to: 'reflexion', label: 'profundizar' },
          { from: 'diseno', to: 'implementacion', label: 'actuar' },
          { from: 'implementacion', to: 'iteracion', label: 'ajustar' },
          { from: 'reflexion', to: 'practica', label: 'integrar', dashed: true },
          { from: 'iteracion', to: 'analisis', label: 'nuevo ciclo', dashed: true }
        ],
        chapters: {
          'toolkit-1': ['analisis'],
          'toolkit-5': ['diseno', 'implementacion'],
          'toolkit-10': ['reflexion'],
          'toolkit-15': ['iteracion'],
          'toolkit-22': ['practica']
        }
      },

      // =====================================================================
      // MANUAL PRÁCTICO
      // =====================================================================
      'manual-practico': {
        title: 'Mapa del Manual Práctico',
        subtitle: 'Cuaderno de Ejercicios para el Despertar',
        central: {
          id: 'practica-contemplativa',
          label: 'Práctica Contemplativa',
          description: 'El camino de la experiencia directa',
          icon: '📿'
        },
        nodes: [
          { id: 'atencion', label: 'Atención', x: -150, y: -100, color: '#fbbf24', description: 'Presencia consciente', icon: '👁️' },
          { id: 'silencio', label: 'Silencio', x: 150, y: -100, color: '#8b5cf6', description: 'Espacio interior', icon: '🤫' },
          { id: 'cuerpo', label: 'Cuerpo', x: -180, y: 80, color: '#22c55e', description: 'Templo de la experiencia', icon: '🧘' },
          { id: 'respiracion', label: 'Respiración', x: 180, y: 80, color: '#06b6d4', description: 'Puente mente-cuerpo', icon: '🌬️' },
          { id: 'observacion', label: 'Observación', x: 0, y: 150, color: '#ec4899', description: 'Ver sin juzgar', icon: '🔮' },
          { id: 'integracion', label: 'Integración', x: 0, y: -150, color: '#14b8a6', description: 'Vida diaria consciente', icon: '🌈' }
        ],
        connections: [
          { from: 'practica-contemplativa', to: 'atencion', label: 'cultiva' },
          { from: 'practica-contemplativa', to: 'silencio', label: 'abraza' },
          { from: 'atencion', to: 'observacion', label: 'desarrolla' },
          { from: 'silencio', to: 'cuerpo', label: 'conecta' },
          { from: 'cuerpo', to: 'respiracion', label: 'une' },
          { from: 'respiracion', to: 'atencion', label: 'ancla' },
          { from: 'observacion', to: 'integracion', label: 'extiende', dashed: true },
          { from: 'integracion', to: 'practica-contemplativa', label: 'transforma', dashed: true }
        ],
        chapters: {
          'prac1': ['atencion'],
          'prac5': ['observacion', 'atencion'],
          'prac10': ['cuerpo', 'respiracion'],
          'prac20': ['silencio'],
          'prac30': ['integracion'],
          'prac50': ['practica-contemplativa']
        }
      },

      // =====================================================================
      // PRÁCTICAS RADICALES
      // =====================================================================
      'practicas-radicales': {
        title: 'Mapa de Prácticas Radicales',
        subtitle: 'Para el Borde del Conocimiento',
        central: {
          id: 'incertidumbre',
          label: 'Incertidumbre',
          description: 'Habitar el misterio sin resolverlo',
          icon: '🔥'
        },
        nodes: [
          { id: 'no-saber', label: 'No-Saber', x: -150, y: -100, color: '#ef4444', description: 'Soltar la certeza', icon: '❓' },
          { id: 'vacio', label: 'Vacío', x: 150, y: -100, color: '#1f2937', description: 'La plenitud del silencio', icon: '⚫' },
          { id: 'muerte', label: 'Muerte', x: -180, y: 80, color: '#991b1b', description: 'Maestra radical', icon: '💀' },
          { id: 'paradoja', label: 'Paradoja', x: 180, y: 80, color: '#8b5cf6', description: 'Más allá de la lógica', icon: '☯️' },
          { id: 'sombra', label: 'Sombra', x: 0, y: 150, color: '#4b5563', description: 'Lo rechazado', icon: '🌑' },
          { id: 'misterio', label: 'Misterio', x: 0, y: -150, color: '#fbbf24', description: 'Lo irreductible', icon: '✨' }
        ],
        connections: [
          { from: 'incertidumbre', to: 'no-saber', label: 'acepta' },
          { from: 'incertidumbre', to: 'vacio', label: 'habita' },
          { from: 'no-saber', to: 'misterio', label: 'abre' },
          { from: 'vacio', to: 'muerte', label: 'confronta' },
          { from: 'muerte', to: 'sombra', label: 'revela' },
          { from: 'sombra', to: 'paradoja', label: 'integra' },
          { from: 'paradoja', to: 'incertidumbre', label: 'abraza', dashed: true },
          { from: 'misterio', to: 'incertidumbre', label: 'es', dashed: true }
        ],
        chapters: {
          'prac1': ['no-saber'],
          'prac2': ['vacio'],
          'prac3': ['no-saber', 'misterio'],
          'prac4': ['muerte'],
          'prac5': ['sombra'],
          'prac6': ['paradoja'],
          'prac7': ['incertidumbre'],
          'prac8': ['muerte', 'vacio'],
          'prac9': ['sombra', 'paradoja'],
          'prac10': ['misterio', 'incertidumbre']
        }
      }
    };
  }

  // ==========================================================================
  // RENDERIZADO DEL MAPA
  // ==========================================================================

  show(bookId = null) {
    const targetBookId = bookId || this.bookEngine?.getCurrentBook();
    const mapData = this.maps[targetBookId];

    if (!mapData) {
      window.toast?.info('No hay mapa conceptual disponible para este libro');
      return;
    }

    const existing = document.getElementById('concept-map-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'concept-map-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col border border-cyan-500/30 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🗺️</span>
            <div>
              <h2 class="text-xl font-bold text-cyan-200">${mapData.title}</h2>
              <p class="text-sm text-cyan-400/70">${mapData.subtitle || 'Explora las conexiones entre conceptos'}</p>
            </div>
          </div>
          <button id="close-concept-map" class="text-cyan-300 hover:text-white p-2 hover:bg-cyan-800/50 rounded-lg transition">
            ${Icons.close(24)}
          </button>
        </div>

        <!-- Map Container -->
        <div class="flex-1 overflow-hidden relative min-h-[400px]">
          <div id="concept-map-canvas" class="w-full h-full" style="min-height: 500px;">
            ${this.renderSVGMap(mapData)}
          </div>

          <!-- Legend -->
          <div class="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 max-w-xs">
            <p class="text-xs font-semibold text-cyan-300 mb-2">Cómo usar</p>
            <ul class="text-xs text-gray-400 space-y-1">
              <li>• Haz clic en un concepto para ver detalles</li>
              <li>• Descubre capítulos relacionados</li>
              <li>• Navega a otros libros de la colección</li>
            </ul>
            <div class="flex items-center gap-3 mt-2 pt-2 border-t border-gray-700">
              <span class="flex items-center gap-1 text-xs text-gray-500">
                <span class="w-6 h-0.5 bg-cyan-500"></span> Directa
              </span>
              <span class="flex items-center gap-1 text-xs text-gray-500">
                <span class="w-6 h-0.5 bg-cyan-500/50" style="border-bottom: 2px dashed rgba(6,182,212,0.5)"></span> Emergente
              </span>
            </div>
          </div>

          <!-- Zoom controls -->
          <div class="absolute top-4 right-4 flex flex-col gap-2">
            <button id="zoom-in-map" class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition text-xl font-bold">
              +
            </button>
            <button id="zoom-out-map" class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition text-xl font-bold">
              −
            </button>
            <button id="reset-map" class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition text-lg">
              ↺
            </button>
          </div>
        </div>

        <!-- Detail Panel -->
        <div id="concept-detail-panel" class="hidden px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-gray-800/80 to-gray-900/80 max-h-[40vh] overflow-y-auto">
          <div id="concept-detail-content"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachMapListeners(mapData, targetBookId);
  }

  renderSVGMap(mapData) {
    const width = 900;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    let svg = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" id="concept-map-svg" style="transition: transform 0.3s ease;">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4" opacity="0.7"/>
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
          <radialGradient id="centralGradient">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- Background grid -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.5"/>
        </pattern>
        <rect width="100%" height="100%" fill="#0f172a"/>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>

        <!-- Connections -->
        <g class="connections">
    `;

    // Render connections
    for (const conn of mapData.connections) {
      const fromNode = conn.from === mapData.central.id
        ? { x: 0, y: 0 }
        : mapData.nodes.find(n => n.id === conn.from);
      const toNode = conn.to === mapData.central.id
        ? { x: 0, y: 0 }
        : mapData.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        const x1 = centerX + (fromNode.x || 0);
        const y1 = centerY + (fromNode.y || 0);
        const x2 = centerX + (toNode.x || 0);
        const y2 = centerY + (toNode.y || 0);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        svg += `
          <g class="connection-group transition-opacity" data-from="${conn.from}" data-to="${conn.to}">
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                  stroke="${conn.dashed ? '#8b5cf6' : '#06b6d4'}"
                  stroke-width="2"
                  opacity="${conn.dashed ? '0.4' : '0.5'}"
                  ${conn.dashed ? 'stroke-dasharray="8,4"' : ''}
                  marker-end="url(#arrowhead)"
                  class="connection-line hover:opacity-100 transition-opacity cursor-pointer"/>
            ${conn.label ? `
              <rect x="${midX - 35}" y="${midY - 18}" width="70" height="16" rx="3" fill="#1f2937" opacity="0.9"/>
              <text x="${midX}" y="${midY - 6}"
                    text-anchor="middle"
                    fill="#94a3b8"
                    font-size="10"
                    class="connection-label pointer-events-none">
                ${conn.label}
              </text>
            ` : ''}
          </g>
        `;
      }
    }

    svg += `</g><g class="nodes">`;

    // Render central node
    svg += `
      <g class="node central-node cursor-pointer" data-node-id="${mapData.central.id}" transform="translate(${centerX}, ${centerY})">
        <circle r="60" fill="url(#centralGradient)" opacity="0.6"/>
        <circle r="55" fill="#0f172a" stroke="#06b6d4" stroke-width="3" filter="url(#glow)" class="hover:fill-gray-900 transition-colors"/>
        <text y="-8" text-anchor="middle" font-size="24" class="pointer-events-none">
          ${mapData.central.icon || '🔮'}
        </text>
        <text y="18" text-anchor="middle" fill="#06b6d4" font-weight="bold" font-size="13" class="pointer-events-none">
          ${mapData.central.label}
        </text>
      </g>
    `;

    // Render other nodes
    for (const node of mapData.nodes) {
      const x = centerX + node.x;
      const y = centerY + node.y;

      svg += `
        <g class="node concept-node cursor-pointer" data-node-id="${node.id}" transform="translate(${x}, ${y})">
          <circle r="42" fill="#1e293b" stroke="${node.color}" stroke-width="2" filter="url(#shadow)"
                  class="hover:fill-gray-700 transition-colors"/>
          <text y="-8" text-anchor="middle" font-size="18" class="pointer-events-none">
            ${node.icon || '•'}
          </text>
          <text y="14" text-anchor="middle" fill="${node.color}" font-size="10" font-weight="600" class="pointer-events-none">
            ${this.wrapText(node.label, 14)}
          </text>
        </g>
      `;
    }

    svg += `</g></svg>`;

    return svg;
  }

  wrapText(text, maxChars) {
    if (text.length <= maxChars) return text;

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.map((line, i) =>
      `<tspan x="0" dy="${i === 0 ? 0 : 12}">${line}</tspan>`
    ).join('');
  }

  // ==========================================================================
  // INTERACCIONES
  // ==========================================================================

  attachMapListeners(mapData, bookId) {
    const modal = document.getElementById('concept-map-modal');
    if (!modal) return;

    // Close
    document.getElementById('close-concept-map')?.addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Node clicks
    const nodes = document.querySelectorAll('.concept-node, .central-node');
    nodes.forEach(node => {
      node.addEventListener('click', () => {
        const nodeId = node.dataset.nodeId;
        this.showNodeDetail(nodeId, mapData, bookId);
      });
    });

    // Zoom controls
    let scale = 1;
    const svg = document.getElementById('concept-map-svg');

    document.getElementById('zoom-in-map')?.addEventListener('click', () => {
      scale = Math.min(2, scale + 0.2);
      if (svg) svg.style.transform = `scale(${scale})`;
    });

    document.getElementById('zoom-out-map')?.addEventListener('click', () => {
      scale = Math.max(0.5, scale - 0.2);
      if (svg) svg.style.transform = `scale(${scale})`;
    });

    document.getElementById('reset-map')?.addEventListener('click', () => {
      scale = 1;
      if (svg) svg.style.transform = `scale(1)`;
    });

    // 🔧 FIX v2.9.271: Store ESC handler for cleanup in close()
    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  showNodeDetail(nodeId, mapData, bookId) {
    const panel = document.getElementById('concept-detail-panel');
    const content = document.getElementById('concept-detail-content');
    if (!panel || !content) return;

    // Find node data
    let nodeData = nodeId === mapData.central.id
      ? mapData.central
      : mapData.nodes.find(n => n.id === nodeId);

    if (!nodeData) return;

    // Find related chapters in THIS book
    const relatedChapters = [];
    if (mapData.chapters) {
      for (const [chapterId, concepts] of Object.entries(mapData.chapters)) {
        if (concepts.includes(nodeId)) {
          const chapter = this.bookEngine?.getChapter(chapterId);
          if (chapter) {
            relatedChapters.push({ id: chapterId, title: chapter.title });
          }
        }
      }
    }

    // Find cross-references to OTHER books
    const crossRefs = [];
    const bookCrossRefs = this.crossReferences[bookId];
    if (bookCrossRefs) {
      for (const [chapterId, refs] of Object.entries(bookCrossRefs)) {
        // Check if this chapter is related to the concept
        if (mapData.chapters?.[chapterId]?.includes(nodeId)) {
          refs.forEach(ref => {
            crossRefs.push({
              fromChapter: chapterId,
              toBook: ref.book,
              toChapter: ref.chapter,
              label: ref.label
            });
          });
        }
      }
    }

    // Find connections
    const connections = mapData.connections.filter(c =>
      c.from === nodeId || c.to === nodeId
    );

    content.innerHTML = `
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Node Info -->
        <div class="flex-1">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                 style="background: ${nodeData.color || '#06b6d4'}15; border: 2px solid ${nodeData.color || '#06b6d4'}">
              ${nodeData.icon || '🔮'}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold truncate" style="color: ${nodeData.color || '#06b6d4'}">${nodeData.label}</h3>
              ${nodeData.description ? `<p class="text-gray-400 text-sm mt-1">${nodeData.description}</p>` : ''}
            </div>
          </div>

          ${connections.length > 0 ? `
            <div class="mt-4">
              <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Conexiones</p>
              <div class="flex flex-wrap gap-2">
                ${connections.map(c => {
                  const otherNode = c.from === nodeId ? c.to : c.from;
                  const otherData = otherNode === mapData.central.id
                    ? mapData.central
                    : mapData.nodes.find(n => n.id === otherNode);
                  const isOutgoing = c.from === nodeId;
                  return `
                    <span class="px-3 py-1.5 bg-gray-700/50 rounded-lg text-xs flex items-center gap-1.5 border border-gray-600/50">
                      <span class="opacity-60">${isOutgoing ? '→' : '←'}</span>
                      <span class="text-cyan-300">${c.label}</span>
                      <span class="opacity-60">→</span>
                      <span style="color: ${otherData?.color || '#fff'}">${otherData?.icon || '•'} ${otherData?.label || otherNode}</span>
                    </span>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Related Chapters -->
        <div class="flex-1 md:border-l md:border-gray-700 md:pl-4">
          ${relatedChapters.length > 0 ? `
            <div class="mb-4">
              <p class="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                📖 Capítulos en este libro
              </p>
              <div class="flex flex-wrap gap-2">
                ${relatedChapters.map(ch => `
                  <button class="go-to-chapter-btn px-3 py-2 bg-cyan-900/30 hover:bg-cyan-800/50 border border-cyan-500/30 rounded-lg text-sm text-cyan-200 transition flex items-center gap-2"
                          data-chapter-id="${ch.id}">
                    ${Icons.chevronRight(14)}
                    <span class="truncate max-w-[200px]">${ch.title}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${crossRefs.length > 0 ? `
            <div>
              <p class="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                🔗 Relacionado en otros libros
              </p>
              <div class="flex flex-wrap gap-2">
                ${crossRefs.map(ref => {
                  const bookInfo = this.getBookInfo(ref.toBook);
                  return `
                    <button class="go-to-other-book-btn px-3 py-2 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 rounded-lg text-sm text-purple-200 transition flex items-center gap-2"
                            data-book-id="${ref.toBook}"
                            data-chapter-id="${ref.toChapter}">
                      <span>${bookInfo?.icon || '📚'}</span>
                      <span class="truncate max-w-[180px]">${ref.label}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          ${relatedChapters.length === 0 && crossRefs.length === 0 ? `
            <p class="text-gray-500 text-sm italic">No hay capítulos específicos asociados a este concepto.</p>
          ` : ''}
        </div>
      </div>
    `;

    panel.classList.remove('hidden');

    // Chapter navigation buttons
    content.querySelectorAll('.go-to-chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chapterId = btn.dataset.chapterId;
        this.close();
        if (window.bookReader) {
          window.bookReader.navigateToChapter(chapterId);
        }
      });
    });

    // Cross-book navigation
    content.querySelectorAll('.go-to-other-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetBookId = btn.dataset.bookId;
        const targetChapterId = btn.dataset.chapterId;
        this.close();

        // Navigate to other book
        if (window.biblioteca && window.bookReader) {
          window.bookReader.hide();
          // 🔧 FIX v2.9.197: Added error handling to prevent silent failures
          window.biblioteca?.openBook(targetBookId).then(() => {
            setTimeout(() => {
              if (window.bookReader) {
                window.bookReader.navigateToChapter(targetChapterId);
              }
            }, 500);
          }).catch(error => {
            logger.error('Error opening book from concept map:', error);
            window.toast?.error('Error al abrir el libro. Intenta de nuevo.');
          });
        }
      });
    });
  }

  getBookInfo(bookId) {
    const bookInfoMap = {
      'codigo-despertar': { icon: '🌌', title: 'El Código del Despertar' },
      'manifiesto': { icon: '🔥', title: 'Manifiesto' },
      'guia-acciones': { icon: '🎯', title: 'Guía de Acciones' },
      'manual-transicion': { icon: '🌱', title: 'Manual de Transición' },
      'toolkit-transicion': { icon: '🧰', title: 'Toolkit de Transición' },
      'manual-practico': { icon: '📿', title: 'Manual Práctico' },
      'practicas-radicales': { icon: '🔥', title: 'Prácticas Radicales' }
    };
    return bookInfoMap[bookId] || { icon: '📚', title: bookId };
  }

  close() {
    // 🔧 FIX v2.9.271: Cleanup ESC handler
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }

    const modal = document.getElementById('concept-map-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ==========================================================================
  // BOTÓN PARA TOOLBAR
  // ==========================================================================

  static createButton() {
    return `
      <button id="concept-map-btn" class="p-2 hover:bg-cyan-900/50 rounded-lg transition text-cyan-400" title="Mapa conceptual">
        ${Icons.create('git-branch', 20)}
      </button>
    `;
  }
}

// Exportar clase
window.ConceptMaps = ConceptMaps;

// 🔧 v2.9.325: Auto-instanciar para que funcione el botón
window.conceptMaps = new ConceptMaps();
