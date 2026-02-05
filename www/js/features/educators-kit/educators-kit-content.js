/**
 * Educators Kit Content - Datos y recursos
 * Gestiona los recursos educativos y el historial de descargas
 * @version 1.0.0
 */

// Logger fallback para paginas standalone
if (typeof logger === 'undefined') {
  window.logger = {
    log: (...args) => console.log('[EducatorsKit]', ...args),
    warn: (...args) => console.warn('[EducatorsKit]', ...args),
    error: (...args) => console.error('[EducatorsKit]', ...args),
    debug: (...args) => console.debug('[EducatorsKit]', ...args)
  };
}

class EducatorsKitContent {
  constructor(educatorsKit) {
    this.educatorsKit = educatorsKit;
  }

  /**
   * Carga el contenido desde el JSON
   */
  async loadContent() {
    try {
      const response = await fetch(this.educatorsKit.resourcesConfig.contentPath);
      if (response.ok) {
        this.educatorsKit.content = await response.json();
        logger.log('[EducatorsKitContent] Contenido cargado:', Object.keys(this.educatorsKit.content.resources || {}).length, 'recursos');
      }
    } catch (error) {
      logger.warn('[EducatorsKitContent] No se pudo cargar content.json:', error);
      this.educatorsKit.content = { resources: {}, activities: {} };
    }
  }

  /**
   * Carga los recursos desde el JSON de configuracion
   */
  async loadResources() {
    // Definicion de recursos inline
    this.educatorsKit.resources = [
      // Guia del Facilitador
      {
        id: 'guia-facilitador',
        type: 'guide',
        title: 'Guia del Facilitador',
        description: 'Guia completa de 30+ paginas para educadores',
        size: '5 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Plantillas
      {
        id: 'plan-sesion',
        type: 'template',
        title: 'Plan de Sesion',
        description: 'Plantilla para estructurar sesiones de 90 minutos',
        size: '1 pagina',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'evaluacion',
        type: 'template',
        title: 'Evaluacion de Impacto',
        description: 'Formulario de feedback para participantes',
        size: '1 pagina',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'carta-familias',
        type: 'template',
        title: 'Carta a Familias',
        description: 'Modelo de comunicacion para padres/tutores',
        size: '1 pagina',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'certificado',
        type: 'template',
        title: 'Certificado de Participacion',
        description: 'Certificado editable para participantes',
        size: '1 pagina',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Material Visual
      {
        id: 'posters-pack',
        type: 'visual',
        title: 'Pack de Posters A3',
        description: '5 posters con conceptos clave del Nuevo Ser',
        size: '5 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'tarjetas-reflexion',
        type: 'visual',
        title: 'Tarjetas de Reflexion',
        description: '30 tarjetas recortables para dinamicas grupales',
        size: '3 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'infografias-pack',
        type: 'visual',
        title: 'Pack de Infografias',
        description: '3 infografias visuales de conceptos clave',
        size: '3 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Herramientas de Evaluacion y Seguimiento
      {
        id: 'rubricas-evaluacion',
        type: 'evaluation',
        title: 'Rubricas de Evaluacion',
        description: 'Rubricas para evaluar competencias del Nuevo Ser',
        size: '5 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'fichas-seguimiento',
        type: 'evaluation',
        title: 'Fichas de Seguimiento',
        description: 'Registro del desarrollo de cada participante',
        size: '5 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Planificacion
      {
        id: 'planificacion-trimestral',
        type: 'template',
        title: 'Planificacion Trimestral',
        description: 'Plantilla para organizar el programa educativo',
        size: '4 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Recursos de Facilitacion
      {
        id: 'banco-preguntas',
        type: 'guide',
        title: 'Banco de Preguntas Reflexivas',
        description: '100+ preguntas organizadas por tema',
        size: '5 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'dinamicas-grupo',
        type: 'guide',
        title: 'Guia de Dinamicas de Grupo',
        description: '16 dinamicas paso a paso',
        size: '5 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'diario-facilitador',
        type: 'template',
        title: 'Diario del Facilitador',
        description: 'Plantilla de reflexion y desarrollo profesional',
        size: '4 paginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Material para Alumnos
      {
        id: 'cuaderno-alumno',
        type: 'student',
        title: 'Cuaderno del Alumno',
        description: 'Material de trabajo para participantes',
        size: '5 paginas',
        format: 'HTML/PDF',
        hasContent: true
      }
    ];

    // Definicion de actividades por edad
    this.educatorsKit.activities = [
      // Primaria (6-12 anios)
      {
        id: 'act-primaria-1',
        targetAge: 'primaria',
        title: 'El Jardin de la Interdependencia',
        duration: '45 min',
        difficulty: 'basico',
        description: 'Creacion colectiva de un jardin de conexiones para comprender la interdependencia.',
        objectives: ['Comprender que todo esta conectado', 'Desarrollar empatia con la naturaleza', 'Trabajar colaborativamente'],
        materials: ['Papel grande', 'Pinturas', 'Elementos naturales'],
        icon: '🌱',
        color: 'emerald',
        hasContent: true
      },
      {
        id: 'act-primaria-2',
        targetAge: 'primaria',
        title: 'El Circulo de Gratitud',
        duration: '15 min',
        difficulty: 'basico',
        description: 'Practica diaria de gratitud ecosistemica en grupo.',
        objectives: ['Cultivar la gratitud', 'Reconectar con lo esencial', 'Crear ritual colectivo'],
        materials: ['Ninguno especial'],
        icon: '🙏',
        color: 'amber',
        hasContent: true
      },
      {
        id: 'act-primaria-3',
        targetAge: 'primaria',
        title: 'Detectives de la Naturaleza',
        duration: '60 min',
        difficulty: 'basico',
        description: 'Exploracion sensorial del entorno natural con registro de descubrimientos.',
        objectives: ['Observacion consciente', 'Conexion con la naturaleza', 'Registro cientifico-artistico'],
        materials: ['Cuaderno', 'Lapices', 'Lupa (opcional)'],
        icon: '🔍',
        color: 'green',
        hasContent: true
      },
      {
        id: 'act-primaria-4',
        targetAge: 'primaria',
        title: 'Respiracion del Arbol',
        duration: '10 min',
        difficulty: 'basico',
        description: 'Meditacion guiada conectando la respiracion con el ciclo del arbol.',
        objectives: ['Calmar la mente', 'Conexion cuerpo-naturaleza', 'Introduccion a meditacion'],
        materials: ['Espacio tranquilo'],
        icon: '🌳',
        color: 'teal',
        hasContent: true
      },
      {
        id: 'act-primaria-5',
        targetAge: 'primaria',
        title: 'Construir Juntos',
        duration: '45 min',
        difficulty: 'intermedio',
        description: 'Proyecto colaborativo donde cada participante aporta una pieza.',
        objectives: ['Cooperacion', 'Valorar aportes diversos', 'Resultado colectivo'],
        materials: ['Materiales reciclados', 'Pegamento', 'Tijeras'],
        icon: '🏗️',
        color: 'blue',
        hasContent: true
      },

      // Secundaria (12-18 anios)
      {
        id: 'act-secundaria-1',
        targetAge: 'secundaria',
        title: 'Mapeando Mis Premisas',
        duration: '60 min',
        difficulty: 'intermedio',
        description: 'Ejercicio de arqueologia mental para identificar creencias asumidas.',
        objectives: ['Identificar creencias ocultas', 'Cuestionar origenes', 'Explorar alternativas'],
        materials: ['Post-its', 'Papel grande', 'Rotuladores'],
        icon: '🧠',
        color: 'purple',
        hasContent: true
      },
      {
        id: 'act-secundaria-2',
        targetAge: 'secundaria',
        title: 'Debate de Sistemas',
        duration: '90 min',
        difficulty: 'avanzado',
        description: 'Debate estructurado comparando sistemas economicos/sociales alternativos.',
        objectives: ['Pensamiento critico', 'Argumentacion', 'Conocer alternativas'],
        materials: ['Materiales de investigacion previa'],
        icon: '⚖️',
        color: 'indigo',
        hasContent: true
      },
      {
        id: 'act-secundaria-3',
        targetAge: 'secundaria',
        title: 'Diseniando Alternativas',
        duration: '120 min',
        difficulty: 'avanzado',
        description: 'Taller de disenio participativo para crear soluciones locales.',
        objectives: ['Pensamiento de disenio', 'Creatividad aplicada', 'Agencia de cambio'],
        materials: ['Materiales de prototipado'],
        icon: '💡',
        color: 'yellow',
        hasContent: true
      },
      {
        id: 'act-secundaria-4',
        targetAge: 'secundaria',
        title: 'El Muro de Preguntas Incomodas',
        duration: '45 min',
        difficulty: 'intermedio',
        description: 'Espacio seguro para formular y explorar preguntas dificiles.',
        objectives: ['Fomentar curiosidad', 'Normalizar la duda', 'Dialogo profundo'],
        materials: ['Muro/pizarra', 'Post-its', 'Marcadores'],
        icon: '❓',
        color: 'red',
        hasContent: true
      },
      {
        id: 'act-secundaria-5',
        targetAge: 'secundaria',
        title: 'Meditacion del Observador',
        duration: '15 min',
        difficulty: 'intermedio',
        description: 'Practica de mindfulness para desarrollar la conciencia testigo.',
        objectives: ['Autoobservacion', 'Separar pensamientos de identidad', 'Calma mental'],
        materials: ['Espacio tranquilo'],
        icon: '👁️',
        color: 'cyan',
        hasContent: true
      },

      // Adultos
      {
        id: 'act-adultos-1',
        targetAge: 'adultos',
        title: 'Introduccion al Nuevo Ser',
        duration: '180 min',
        difficulty: 'intermedio',
        description: 'Taller completo de 3 horas para introducir los conceptos fundamentales.',
        objectives: ['Diagnostico sistemico', 'Identificar premisas', 'Conocer alternativas', 'Compromiso de accion'],
        materials: ['Proyector', 'Post-its', 'Papel grande'],
        icon: '🌟',
        color: 'amber',
        hasContent: true
      },
      {
        id: 'act-adultos-2',
        targetAge: 'adultos',
        title: 'Excavacion de Premisas',
        duration: '90 min',
        difficulty: 'avanzado',
        description: 'Exploracion profunda de las creencias que sostienen el paradigma actual.',
        objectives: ['Autoconocimiento', 'Deconstruccion', 'Apertura a nuevas perspectivas'],
        materials: ['Cuaderno personal', 'Ambiente intimo'],
        icon: '⛏️',
        color: 'orange',
        hasContent: true
      },
      {
        id: 'act-adultos-3',
        targetAge: 'adultos',
        title: 'Circulo de Practica',
        duration: '120 min',
        difficulty: 'intermedio',
        description: 'Formato para grupos de practica continuada con estructura de apoyo mutuo.',
        objectives: ['Comunidad de practica', 'Accountability', 'Profundizacion colectiva'],
        materials: ['Espacio comodo', 'Objeto de palabra'],
        icon: '🔄',
        color: 'emerald',
        hasContent: true
      },
      {
        id: 'act-adultos-4',
        targetAge: 'adultos',
        title: 'Body Scan Ecologico',
        duration: '30 min',
        difficulty: 'basico',
        description: 'Meditacion de escaneo corporal conectando con la dimension ecologica.',
        objectives: ['Reconexion corporal', 'Interdependencia sentida', 'Relajacion profunda'],
        materials: ['Espacio para tumbarse', 'Audio guia (opcional)'],
        icon: '🧘',
        color: 'teal',
        hasContent: true
      },
      {
        id: 'act-adultos-5',
        targetAge: 'adultos',
        title: 'Proyecto de Accion Real',
        duration: 'Variable',
        difficulty: 'avanzado',
        description: 'Marco para diseniar e implementar un proyecto de transformacion local.',
        objectives: ['De la teoria a la practica', 'Impacto real', 'Aprendizaje experiencial'],
        materials: ['Segun proyecto'],
        icon: '🎯',
        color: 'red',
        hasContent: true
      },

      // Actividades adicionales Primaria
      {
        id: 'act-primaria-6',
        targetAge: 'primaria',
        title: 'El Cuento Colectivo',
        duration: '45 min',
        difficulty: 'basico',
        description: 'Creacion de una historia sobre el Nuevo Ser entre todos los participantes.',
        objectives: ['Creatividad grupal', 'Escucha activa', 'Imaginacion de futuros posibles'],
        materials: ['Papel', 'Rotuladores', 'Objeto para pasar turno'],
        icon: '📖',
        color: 'purple',
        hasContent: true
      },
      {
        id: 'act-primaria-7',
        targetAge: 'primaria',
        title: 'Mi Mapa de Emociones',
        duration: '30 min',
        difficulty: 'basico',
        description: 'Dibujar un mapa del cuerpo identificando donde sentimos cada emocion.',
        objectives: ['Conciencia corporal', 'Vocabulario emocional', 'Autoconocimiento'],
        materials: ['Silueta humana impresa', 'Colores'],
        icon: '🗺️',
        color: 'pink',
        hasContent: true
      },

      // Actividad adicional Secundaria
      {
        id: 'act-secundaria-6',
        targetAge: 'secundaria',
        title: 'Analisis Critico de Medios',
        duration: '60 min',
        difficulty: 'intermedio',
        description: 'Desconstruir mensajes publicitarios y mediaticos desde la perspectiva del Nuevo Ser.',
        objectives: ['Pensamiento critico', 'Identificar premisas ocultas', 'Alternativas conscientes'],
        materials: ['Recortes de revistas/anuncios', 'Proyector (opcional)'],
        icon: '📺',
        color: 'slate',
        hasContent: true
      }
    ];
  }

  /**
   * Carga el historial de descargas desde localStorage
   */
  loadDownloadHistory() {
    try {
      const history = localStorage.getItem('educator-downloads');
      this.educatorsKit.downloadHistory = history ? JSON.parse(history) : [];
    } catch (error) {
      logger.warn('[EducatorsKitContent] Error cargando historial:', error);
      this.educatorsKit.downloadHistory = [];
    }
  }

  /**
   * Guarda el historial de descargas
   */
  saveDownloadHistory() {
    try {
      localStorage.setItem('educator-downloads', JSON.stringify(this.educatorsKit.downloadHistory));
    } catch (error) {
      logger.warn('[EducatorsKitContent] Error guardando historial:', error);
    }
  }

  /**
   * Obtiene estadisticas de descargas
   */
  getDownloadStats() {
    return {
      total: this.educatorsKit.downloadHistory.length,
      resources: this.educatorsKit.downloadHistory.filter(d => d.type === 'resource').length,
      activities: this.educatorsKit.downloadHistory.filter(d => d.type === 'activity').length,
      lastDownload: this.educatorsKit.downloadHistory.length > 0
        ? this.educatorsKit.downloadHistory[this.educatorsKit.downloadHistory.length - 1]
        : null
    };
  }

  /**
   * Registra una descarga para analytics
   */
  trackDownload(itemId, type) {
    const download = {
      id: itemId,
      type: type,
      date: new Date().toISOString()
    };

    this.educatorsKit.downloadHistory.push(download);
    this.saveDownloadHistory();

    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('educator_download', { itemId, type });
    }

    logger.log('[EducatorsKitContent] Descarga registrada:', download);
  }

  /**
   * Registra una vista para analytics
   */
  trackView(itemId, type) {
    logger.log('[EducatorsKitContent] Vista:', { itemId, type });

    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('educator_view', { itemId, type });
    }
  }

  destroy() {
    // Cleanup si es necesario
  }
}

// Exportar globalmente
window.EducatorsKitContent = EducatorsKitContent;
