/**
 * Educators Kit - Kit para Educadores
 * Gestiona recursos educativos, visualización y descargas
 * @version 2.0.0
 */

class EducatorsKit {
  constructor() {
    this.resources = [];
    this.activities = [];
    this.content = null;
    this.currentAgeFilter = 'primaria';
    this.downloadHistory = [];
    this.viewerModal = null;

    // Configuración de recursos
    this.resourcesConfig = {
      basePath: './assets',
      contentPath: './assets/content.json'
    };
  }

  /**
   * Inicializa el Kit de Educadores
   */
  async init() {
    try {
      await this.loadContent();
      await this.loadResources();
      this.loadDownloadHistory();
      this.createViewerModal();
      this.setupEventListeners();
      this.renderActivities(this.currentAgeFilter);
      logger.log('[EducatorsKit] Inicializado correctamente v2.0');
    } catch (error) {
      logger.error('[EducatorsKit] Error al inicializar:', error);
    }
  }

  /**
   * Carga el contenido desde el JSON
   */
  async loadContent() {
    try {
      const response = await fetch(this.resourcesConfig.contentPath);
      if (response.ok) {
        this.content = await response.json();
        logger.log('[EducatorsKit] Contenido cargado:', Object.keys(this.content.resources || {}).length, 'recursos');
      }
    } catch (error) {
      logger.warn('[EducatorsKit] No se pudo cargar content.json:', error);
      this.content = { resources: {}, activities: {} };
    }
  }

  /**
   * Carga los recursos desde el JSON de configuración
   */
  async loadResources() {
    // Definición de recursos inline
    this.resources = [
      // Guía del Facilitador
      {
        id: 'guia-facilitador',
        type: 'guide',
        title: 'Guía del Facilitador',
        description: 'Guía completa de 30+ páginas para educadores',
        size: '5 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Plantillas
      {
        id: 'plan-sesion',
        type: 'template',
        title: 'Plan de Sesión',
        description: 'Plantilla para estructurar sesiones de 90 minutos',
        size: '1 página',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'evaluacion',
        type: 'template',
        title: 'Evaluación de Impacto',
        description: 'Formulario de feedback para participantes',
        size: '1 página',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'carta-familias',
        type: 'template',
        title: 'Carta a Familias',
        description: 'Modelo de comunicación para padres/tutores',
        size: '1 página',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'certificado',
        type: 'template',
        title: 'Certificado de Participación',
        description: 'Certificado editable para participantes',
        size: '1 página',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Material Visual
      {
        id: 'posters-pack',
        type: 'visual',
        title: 'Pack de Pósters A3',
        description: '5 pósters con conceptos clave del Nuevo Ser',
        size: '5 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'tarjetas-reflexion',
        type: 'visual',
        title: 'Tarjetas de Reflexión',
        description: '30 tarjetas recortables para dinámicas grupales',
        size: '3 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'infografias-pack',
        type: 'visual',
        title: 'Pack de Infografías',
        description: '3 infografías visuales de conceptos clave',
        size: '3 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Herramientas de Evaluación y Seguimiento
      {
        id: 'rubricas-evaluacion',
        type: 'evaluation',
        title: 'Rúbricas de Evaluación',
        description: 'Rúbricas para evaluar competencias del Nuevo Ser',
        size: '5 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'fichas-seguimiento',
        type: 'evaluation',
        title: 'Fichas de Seguimiento',
        description: 'Registro del desarrollo de cada participante',
        size: '5 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Planificación
      {
        id: 'planificacion-trimestral',
        type: 'template',
        title: 'Planificación Trimestral',
        description: 'Plantilla para organizar el programa educativo',
        size: '4 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Recursos de Facilitación
      {
        id: 'banco-preguntas',
        type: 'guide',
        title: 'Banco de Preguntas Reflexivas',
        description: '100+ preguntas organizadas por tema',
        size: '5 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'dinamicas-grupo',
        type: 'guide',
        title: 'Guía de Dinámicas de Grupo',
        description: '16 dinámicas paso a paso',
        size: '5 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      {
        id: 'diario-facilitador',
        type: 'template',
        title: 'Diario del Facilitador',
        description: 'Plantilla de reflexión y desarrollo profesional',
        size: '4 páginas',
        format: 'HTML/PDF',
        hasContent: true
      },
      // Material para Alumnos
      {
        id: 'cuaderno-alumno',
        type: 'student',
        title: 'Cuaderno del Alumno',
        description: 'Material de trabajo para participantes',
        size: '5 páginas',
        format: 'HTML/PDF',
        hasContent: true
      }
    ];

    // Definición de actividades por edad
    this.activities = [
      // Primaria (6-12 años)
      {
        id: 'act-primaria-1',
        targetAge: 'primaria',
        title: 'El Jardín de la Interdependencia',
        duration: '45 min',
        difficulty: 'básico',
        description: 'Creación colectiva de un jardín de conexiones para comprender la interdependencia.',
        objectives: ['Comprender que todo está conectado', 'Desarrollar empatía con la naturaleza', 'Trabajar colaborativamente'],
        materials: ['Papel grande', 'Pinturas', 'Elementos naturales'],
        icon: '🌱',
        color: 'emerald',
        hasContent: true
      },
      {
        id: 'act-primaria-2',
        targetAge: 'primaria',
        title: 'El Círculo de Gratitud',
        duration: '15 min',
        difficulty: 'básico',
        description: 'Práctica diaria de gratitud ecosistémica en grupo.',
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
        difficulty: 'básico',
        description: 'Exploración sensorial del entorno natural con registro de descubrimientos.',
        objectives: ['Observación consciente', 'Conexión con la naturaleza', 'Registro científico-artístico'],
        materials: ['Cuaderno', 'Lápices', 'Lupa (opcional)'],
        icon: '🔍',
        color: 'green',
        hasContent: true
      },
      {
        id: 'act-primaria-4',
        targetAge: 'primaria',
        title: 'Respiración del Árbol',
        duration: '10 min',
        difficulty: 'básico',
        description: 'Meditación guiada conectando la respiración con el ciclo del árbol.',
        objectives: ['Calmar la mente', 'Conexión cuerpo-naturaleza', 'Introducción a meditación'],
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
        objectives: ['Cooperación', 'Valorar aportes diversos', 'Resultado colectivo'],
        materials: ['Materiales reciclados', 'Pegamento', 'Tijeras'],
        icon: '🏗️',
        color: 'blue',
        hasContent: true
      },

      // Secundaria (12-18 años)
      {
        id: 'act-secundaria-1',
        targetAge: 'secundaria',
        title: 'Mapeando Mis Premisas',
        duration: '60 min',
        difficulty: 'intermedio',
        description: 'Ejercicio de arqueología mental para identificar creencias asumidas.',
        objectives: ['Identificar creencias ocultas', 'Cuestionar orígenes', 'Explorar alternativas'],
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
        description: 'Debate estructurado comparando sistemas económicos/sociales alternativos.',
        objectives: ['Pensamiento crítico', 'Argumentación', 'Conocer alternativas'],
        materials: ['Materiales de investigación previa'],
        icon: '⚖️',
        color: 'indigo',
        hasContent: true
      },
      {
        id: 'act-secundaria-3',
        targetAge: 'secundaria',
        title: 'Diseñando Alternativas',
        duration: '120 min',
        difficulty: 'avanzado',
        description: 'Taller de diseño participativo para crear soluciones locales.',
        objectives: ['Pensamiento de diseño', 'Creatividad aplicada', 'Agencia de cambio'],
        materials: ['Materiales de prototipado'],
        icon: '💡',
        color: 'yellow',
        hasContent: true
      },
      {
        id: 'act-secundaria-4',
        targetAge: 'secundaria',
        title: 'El Muro de Preguntas Incómodas',
        duration: '45 min',
        difficulty: 'intermedio',
        description: 'Espacio seguro para formular y explorar preguntas difíciles.',
        objectives: ['Fomentar curiosidad', 'Normalizar la duda', 'Diálogo profundo'],
        materials: ['Muro/pizarra', 'Post-its', 'Marcadores'],
        icon: '❓',
        color: 'red',
        hasContent: true
      },
      {
        id: 'act-secundaria-5',
        targetAge: 'secundaria',
        title: 'Meditación del Observador',
        duration: '15 min',
        difficulty: 'intermedio',
        description: 'Práctica de mindfulness para desarrollar la conciencia testigo.',
        objectives: ['Autoobservación', 'Separar pensamientos de identidad', 'Calma mental'],
        materials: ['Espacio tranquilo'],
        icon: '👁️',
        color: 'cyan',
        hasContent: true
      },

      // Adultos
      {
        id: 'act-adultos-1',
        targetAge: 'adultos',
        title: 'Introducción al Nuevo Ser',
        duration: '180 min',
        difficulty: 'intermedio',
        description: 'Taller completo de 3 horas para introducir los conceptos fundamentales.',
        objectives: ['Diagnóstico sistémico', 'Identificar premisas', 'Conocer alternativas', 'Compromiso de acción'],
        materials: ['Proyector', 'Post-its', 'Papel grande'],
        icon: '🌟',
        color: 'amber',
        hasContent: true
      },
      {
        id: 'act-adultos-2',
        targetAge: 'adultos',
        title: 'Excavación de Premisas',
        duration: '90 min',
        difficulty: 'avanzado',
        description: 'Exploración profunda de las creencias que sostienen el paradigma actual.',
        objectives: ['Autoconocimiento', 'Deconstrucción', 'Apertura a nuevas perspectivas'],
        materials: ['Cuaderno personal', 'Ambiente íntimo'],
        icon: '⛏️',
        color: 'orange',
        hasContent: true
      },
      {
        id: 'act-adultos-3',
        targetAge: 'adultos',
        title: 'Círculo de Práctica',
        duration: '120 min',
        difficulty: 'intermedio',
        description: 'Formato para grupos de práctica continuada con estructura de apoyo mutuo.',
        objectives: ['Comunidad de práctica', 'Accountability', 'Profundización colectiva'],
        materials: ['Espacio cómodo', 'Objeto de palabra'],
        icon: '🔄',
        color: 'emerald',
        hasContent: true
      },
      {
        id: 'act-adultos-4',
        targetAge: 'adultos',
        title: 'Body Scan Ecológico',
        duration: '30 min',
        difficulty: 'básico',
        description: 'Meditación de escaneo corporal conectando con la dimensión ecológica.',
        objectives: ['Reconexión corporal', 'Interdependencia sentida', 'Relajación profunda'],
        materials: ['Espacio para tumbarse', 'Audio guía (opcional)'],
        icon: '🧘',
        color: 'teal',
        hasContent: true
      },
      {
        id: 'act-adultos-5',
        targetAge: 'adultos',
        title: 'Proyecto de Acción Real',
        duration: 'Variable',
        difficulty: 'avanzado',
        description: 'Marco para diseñar e implementar un proyecto de transformación local.',
        objectives: ['De la teoría a la práctica', 'Impacto real', 'Aprendizaje experiencial'],
        materials: ['Según proyecto'],
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
        difficulty: 'básico',
        description: 'Creación de una historia sobre el Nuevo Ser entre todos los participantes.',
        objectives: ['Creatividad grupal', 'Escucha activa', 'Imaginación de futuros posibles'],
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
        difficulty: 'básico',
        description: 'Dibujar un mapa del cuerpo identificando dónde sentimos cada emoción.',
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
        title: 'Análisis Crítico de Medios',
        duration: '60 min',
        difficulty: 'intermedio',
        description: 'Desconstruir mensajes publicitarios y mediáticos desde la perspectiva del Nuevo Ser.',
        objectives: ['Pensamiento crítico', 'Identificar premisas ocultas', 'Alternativas conscientes'],
        materials: ['Recortes de revistas/anuncios', 'Proyector (opcional)'],
        icon: '📺',
        color: 'slate',
        hasContent: true
      }
    ];
  }

  /**
   * Crea el modal de visualización
   */
  createViewerModal() {
    if (document.getElementById('content-viewer-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'content-viewer-modal';
    modal.className = 'content-viewer-modal';
    modal.innerHTML = `
      <div class="viewer-backdrop" onclick="window.educatorsKit?.closeViewer()"></div>
      <div class="viewer-container">
        <div class="viewer-header">
          <div class="viewer-title-area">
            <h2 class="viewer-title" id="viewer-title">Título</h2>
            <p class="viewer-subtitle" id="viewer-subtitle">Subtítulo</p>
          </div>
          <div class="viewer-actions">
            <button class="viewer-btn" onclick="window.educatorsKit?.printContent()" title="Imprimir/Guardar PDF">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              <span>Imprimir/PDF</span>
            </button>
            <button class="viewer-close" onclick="window.educatorsKit?.closeViewer()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="viewer-nav" id="viewer-nav">
          <!-- Pagination buttons -->
        </div>
        <div class="viewer-content" id="viewer-content">
          <!-- Content here -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.viewerModal = modal;

    // Estilos del visor
    if (!document.getElementById('viewer-styles')) {
      const styles = document.createElement('style');
      styles.id = 'viewer-styles';
      styles.textContent = `
        .content-viewer-modal {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 9999;
        }
        .content-viewer-modal.active {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .viewer-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
        }
        .viewer-container {
          position: relative;
          width: 95%;
          max-width: 900px;
          max-height: 90vh;
          background: #1e293b;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(15, 23, 42, 0.8);
        }
        .viewer-title-area {
          flex: 1;
        }
        .viewer-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .viewer-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 4px 0 0;
        }
        .viewer-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .viewer-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(251, 191, 36, 0.2);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 8px;
          color: #fbbf24;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .viewer-btn:hover {
          background: rgba(251, 191, 36, 0.3);
        }
        .viewer-close {
          padding: 8px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          cursor: pointer;
          transition: all 0.2s;
        }
        .viewer-close:hover {
          background: rgba(239, 68, 68, 0.3);
        }
        .viewer-nav {
          display: flex;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(15, 23, 42, 0.5);
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          overflow-x: auto;
        }
        .viewer-nav-btn {
          padding: 8px 16px;
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          color: #94a3b8;
          font-size: 0.875rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        .viewer-nav-btn:hover {
          background: rgba(148, 163, 184, 0.2);
        }
        .viewer-nav-btn.active {
          background: rgba(251, 191, 36, 0.2);
          border-color: rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }
        .viewer-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          color: #e2e8f0;
          line-height: 1.7;
        }
        .viewer-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(251, 191, 36, 0.3);
        }
        .viewer-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fbbf24;
          margin: 24px 0 12px;
        }
        .viewer-content h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #94a3b8;
          margin: 20px 0 8px;
        }
        .viewer-content p {
          margin: 12px 0;
        }
        .viewer-content ul, .viewer-content ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        .viewer-content li {
          margin: 8px 0;
        }
        .viewer-content strong {
          color: white;
        }
        .viewer-content hr {
          border: none;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
          margin: 24px 0;
        }
        .viewer-content .form-template,
        .viewer-content .letter-template,
        .viewer-content .certificate-template {
          background: rgba(15, 23, 42, 0.5);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        /* Print styles */
        @media print {
          body * {
            visibility: hidden;
          }
          .content-viewer-modal,
          .content-viewer-modal * {
            visibility: visible;
          }
          .content-viewer-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white;
          }
          .viewer-backdrop,
          .viewer-header,
          .viewer-nav {
            display: none !important;
          }
          .viewer-container {
            max-width: 100%;
            max-height: none;
            background: white;
            border: none;
            border-radius: 0;
          }
          .viewer-content {
            color: black;
            padding: 20px;
          }
          .viewer-content h2 {
            color: black;
            border-color: #333;
          }
          .viewer-content h3 {
            color: #333;
          }
          .viewer-content strong {
            color: black;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  /**
   * Carga el historial de descargas desde localStorage
   */
  loadDownloadHistory() {
    try {
      const history = localStorage.getItem('educator-downloads');
      this.downloadHistory = history ? JSON.parse(history) : [];
    } catch (error) {
      logger.warn('[EducatorsKit] Error cargando historial:', error);
      this.downloadHistory = [];
    }
  }

  /**
   * Guarda el historial de descargas
   */
  saveDownloadHistory() {
    try {
      localStorage.setItem('educator-downloads', JSON.stringify(this.downloadHistory));
    } catch (error) {
      logger.warn('[EducatorsKit] Error guardando historial:', error);
    }
  }

  /**
   * Configura los event listeners
   */
  setupEventListeners() {
    // Tabs de edad
    const ageTabs = document.querySelectorAll('.age-tab');
    ageTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const age = e.target.dataset.age;
        this.setAgeFilter(age);
      });
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.viewerModal?.classList.contains('active')) {
        this.closeViewer();
      }
    });
  }

  /**
   * Establece el filtro de edad y renderiza actividades
   */
  setAgeFilter(age) {
    this.currentAgeFilter = age;

    // Actualizar tabs activos
    const tabs = document.querySelectorAll('.age-tab');
    tabs.forEach(tab => {
      if (tab.dataset.age === age) {
        tab.classList.add('active', 'bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/30');
        tab.classList.remove('bg-slate-800', 'text-gray-400', 'border-slate-700');
      } else {
        tab.classList.remove('active', 'bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/30');
        tab.classList.add('bg-slate-800', 'text-gray-400', 'border-slate-700');
      }
    });

    this.renderActivities(age);
  }

  /**
   * Renderiza las actividades filtradas por edad
   */
  renderActivities(age) {
    const container = document.getElementById('activities-grid');
    if (!container) return;

    const filteredActivities = this.activities.filter(act => act.targetAge === age);

    if (filteredActivities.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-500">
          <p>No hay actividades disponibles para este grupo de edad todavía.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredActivities.map(activity => this.renderActivityCard(activity)).join('');
  }

  /**
   * Renderiza una tarjeta de actividad
   */
  renderActivityCard(activity) {
    const colorMap = {
      emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', hoverBorder: 'hover:border-emerald-500/50' },
      amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', hoverBorder: 'hover:border-amber-500/50' },
      green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', hoverBorder: 'hover:border-green-500/50' },
      teal: { bg: 'bg-teal-500/20', border: 'border-teal-500/30', text: 'text-teal-400', hoverBorder: 'hover:border-teal-500/50' },
      blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', hoverBorder: 'hover:border-blue-500/50' },
      purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', hoverBorder: 'hover:border-purple-500/50' },
      indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', hoverBorder: 'hover:border-indigo-500/50' },
      yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', hoverBorder: 'hover:border-yellow-500/50' },
      red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', hoverBorder: 'hover:border-red-500/50' },
      cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', hoverBorder: 'hover:border-cyan-500/50' },
      orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', hoverBorder: 'hover:border-orange-500/50' }
    };

    const colors = colorMap[activity.color] || colorMap.emerald;

    const difficultyBadge = {
      'básico': 'bg-green-500/20 text-green-300 border-green-500/30',
      'intermedio': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'avanzado': 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    const hasContent = activity.hasContent && this.content?.activities?.[activity.id];

    return `
      <div class="activity-card bg-slate-800/50 rounded-xl border border-slate-700/50 ${colors.hoverBorder} transition-all p-6 flex flex-col">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg ${colors.bg} ${colors.border} text-2xl">
              ${activity.icon}
            </div>
            <div>
              <h4 class="font-semibold text-white">${activity.title}</h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-500">${activity.duration}</span>
                <span class="px-2 py-0.5 text-xs rounded-full border ${difficultyBadge[activity.difficulty]}">${activity.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-gray-400 text-sm mb-4 flex-grow">${activity.description}</p>

        <!-- Objectives -->
        <div class="mb-4">
          <p class="text-xs text-gray-500 mb-2">Objetivos:</p>
          <div class="flex flex-wrap gap-1">
            ${activity.objectives.slice(0, 3).map(obj => `
              <span class="px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-gray-400">${obj}</span>
            `).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          ${hasContent ? `
            <button
              onclick="window.educatorsKit?.viewActivity('${activity.id}')"
              class="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Ver
            </button>
          ` : ''}
          <button
            onclick="window.educatorsKit?.downloadActivity('${activity.id}')"
            class="${hasContent ? 'flex-1' : 'w-full'} px-4 py-2.5 ${colors.bg} hover:opacity-80 border ${colors.border} rounded-lg ${colors.text} text-sm font-medium transition-all flex items-center justify-center gap-2"
            ${!hasContent ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            ${hasContent ? 'PDF' : 'Próximamente'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Ver recurso en modal
   */
  viewResource(resourceId) {
    const contentData = this.content?.resources?.[resourceId];
    if (!contentData) {
      this.showToast('Contenido no disponible todavía', 'warning');
      return;
    }

    this.openViewer(contentData, 'resource');
    this.trackView(resourceId, 'resource');
  }

  /**
   * Ver actividad en modal
   */
  viewActivity(activityId) {
    const contentData = this.content?.activities?.[activityId];
    if (!contentData) {
      this.showToast('Contenido no disponible todavía', 'warning');
      return;
    }

    this.openViewer(contentData, 'activity');
    this.trackView(activityId, 'activity');
  }

  /**
   * Abre el visor con el contenido
   */
  openViewer(contentData, type) {
    if (!this.viewerModal || !contentData) return;

    this.currentViewerContent = contentData;
    this.currentViewerPage = 0;

    // Actualizar título
    document.getElementById('viewer-title').textContent = contentData.title;
    document.getElementById('viewer-subtitle').textContent = contentData.subtitle || '';

    // Renderizar navegación si hay múltiples páginas
    const nav = document.getElementById('viewer-nav');
    if (contentData.pages && contentData.pages.length > 1) {
      nav.style.display = 'flex';
      nav.innerHTML = contentData.pages.map((page, index) => `
        <button class="viewer-nav-btn ${index === 0 ? 'active' : ''}"
                onclick="window.educatorsKit?.goToPage(${index})">
          ${page.title}
        </button>
      `).join('');
    } else {
      nav.style.display = 'none';
    }

    // Renderizar contenido
    this.renderViewerPage(0);

    // Mostrar modal
    this.viewerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Renderiza una página del visor
   */
  renderViewerPage(pageIndex) {
    if (!this.currentViewerContent?.pages?.[pageIndex]) return;

    const page = this.currentViewerContent.pages[pageIndex];
    document.getElementById('viewer-content').innerHTML = page.content;

    // Actualizar navegación activa
    const navBtns = document.querySelectorAll('.viewer-nav-btn');
    navBtns.forEach((btn, index) => {
      btn.classList.toggle('active', index === pageIndex);
    });

    this.currentViewerPage = pageIndex;
  }

  /**
   * Navega a una página específica
   */
  goToPage(pageIndex) {
    this.renderViewerPage(pageIndex);
  }

  /**
   * Cierra el visor
   */
  closeViewer() {
    if (this.viewerModal) {
      this.viewerModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Imprime el contenido actual (para guardar como PDF)
   */
  printContent() {
    window.print();
  }

  /**
   * Descarga un recurso por ID
   */
  downloadResource(resourceId) {
    const resource = this.resources.find(r => r.id === resourceId);
    const contentData = this.content?.resources?.[resourceId];

    if (!resource) {
      logger.warn('[EducatorsKit] Recurso no encontrado:', resourceId);
      this.showToast('Recurso no disponible', 'warning');
      return;
    }

    if (!contentData) {
      this.showToast('Este recurso estará disponible próximamente', 'info');
      return;
    }

    // Track descarga
    this.trackDownload(resourceId, 'resource');

    // Abrir visor para imprimir
    this.viewResource(resourceId);
    setTimeout(() => {
      this.showToast('Usa Ctrl+P o el botón Imprimir para guardar como PDF', 'info');
    }, 500);
  }

  /**
   * Descarga una actividad por ID
   */
  downloadActivity(activityId) {
    const activity = this.activities.find(a => a.id === activityId);
    const contentData = this.content?.activities?.[activityId];

    if (!activity) {
      logger.warn('[EducatorsKit] Actividad no encontrada:', activityId);
      this.showToast('Actividad no disponible', 'warning');
      return;
    }

    if (!contentData) {
      this.showToast('Esta actividad estará disponible próximamente', 'info');
      return;
    }

    // Track descarga
    this.trackDownload(activityId, 'activity');

    // Abrir visor para imprimir
    this.viewActivity(activityId);
    setTimeout(() => {
      this.showToast('Usa Ctrl+P o el botón Imprimir para guardar como PDF', 'info');
    }, 500);
  }

  /**
   * Registra una vista para analytics
   */
  trackView(itemId, type) {
    logger.log('[EducatorsKit] Vista:', { itemId, type });

    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('educator_view', { itemId, type });
    }
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

    this.downloadHistory.push(download);
    this.saveDownloadHistory();

    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('educator_download', { itemId, type });
    }

    logger.log('[EducatorsKit] Descarga registrada:', download);
  }

  /**
   * Muestra un toast/notificación
   */
  showToast(message, type = 'info') {
    if (window.toast) {
      const icons = {
        info: '📘',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };
      window.toast.show(`${icons[type]} ${message}`, type, 4000);
      return;
    }

    // Fallback: crear toast simple
    const existingToast = document.querySelector('.edu-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'edu-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 12px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  /**
   * Obtiene estadísticas de descargas
   */
  getDownloadStats() {
    return {
      total: this.downloadHistory.length,
      resources: this.downloadHistory.filter(d => d.type === 'resource').length,
      activities: this.downloadHistory.filter(d => d.type === 'activity').length,
      lastDownload: this.downloadHistory.length > 0
        ? this.downloadHistory[this.downloadHistory.length - 1]
        : null
    };
  }

  // =====================================================
  // GENERADOR DE RECURSOS CON IA
  // =====================================================

  /**
   * Abre el modal del generador de IA
   */
  openAIGenerator() {
    this.createAIGeneratorModal();
    const modal = document.getElementById('ai-generator-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Crea el modal del generador de IA
   */
  createAIGeneratorModal() {
    if (document.getElementById('ai-generator-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ai-generator-modal';
    modal.className = 'ai-generator-modal';
    modal.innerHTML = `
      <div class="ai-gen-backdrop" onclick="window.educatorsKit?.closeAIGenerator()"></div>
      <div class="ai-gen-container">
        <div class="ai-gen-header">
          <div class="ai-gen-header-icon">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h2 class="ai-gen-title">Generador de Recursos con IA</h2>
            <p class="ai-gen-subtitle">Crea materiales educativos personalizados</p>
          </div>
          <button class="ai-gen-close" onclick="window.educatorsKit?.closeAIGenerator()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Formulario -->
        <div class="ai-gen-body" id="ai-gen-form-view">
          <form id="ai-gen-form" onsubmit="window.educatorsKit?.generateResource(event)">
            <!-- Tipo de recurso -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">¿Qué tipo de recurso necesitas?</label>
              <div class="ai-gen-options" id="resource-type-options">
                <button type="button" class="ai-gen-option" data-value="actividad" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">🎯</span>
                  <span class="ai-gen-option-text">Actividad</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="reflexion" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">💭</span>
                  <span class="ai-gen-option-text">Preguntas de reflexión</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="sesion" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">📋</span>
                  <span class="ai-gen-option-text">Plan de sesión</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="explicacion" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">📖</span>
                  <span class="ai-gen-option-text">Texto explicativo</span>
                </button>
              </div>
            </div>

            <!-- Edad del grupo -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">¿Para qué grupo de edad?</label>
              <div class="ai-gen-options" id="age-options">
                <button type="button" class="ai-gen-option" data-value="primaria" onclick="window.educatorsKit?.selectOption(this, 'targetAge')">
                  <span class="ai-gen-option-icon">👶</span>
                  <span class="ai-gen-option-text">Primaria (6-12)</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="secundaria" onclick="window.educatorsKit?.selectOption(this, 'targetAge')">
                  <span class="ai-gen-option-icon">🧑</span>
                  <span class="ai-gen-option-text">Secundaria (12-18)</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="adultos" onclick="window.educatorsKit?.selectOption(this, 'targetAge')">
                  <span class="ai-gen-option-icon">👨</span>
                  <span class="ai-gen-option-text">Adultos</span>
                </button>
              </div>
            </div>

            <!-- Tema -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">¿Sobre qué tema del Nuevo Ser?</label>
              <div class="ai-gen-options grid-3" id="topic-options">
                <button type="button" class="ai-gen-option" data-value="interdependencia" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🌐 Interdependencia</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="premisas" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🧠 Premisas ocultas</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="naturaleza" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🌿 Conexión naturaleza</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="emociones" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">💖 Emociones</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="comunidad" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🤝 Comunidad</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="accion" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">⚡ Acción transformadora</span>
                </button>
              </div>
            </div>

            <!-- Duración -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">¿Cuánto tiempo tienes disponible?</label>
              <div class="ai-gen-options" id="duration-options">
                <button type="button" class="ai-gen-option" data-value="15" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">15 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="30" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">30 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="45" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">45 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="60" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">60 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="90" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">90 min</span>
                </button>
              </div>
            </div>

            <!-- Contexto adicional (opcional) -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">¿Algún contexto adicional? <span class="text-gray-500">(opcional)</span></label>
              <textarea id="ai-gen-context" class="ai-gen-textarea" placeholder="Ej: Es un grupo de 15 personas que ya conocen los conceptos básicos. Me gustaría algo interactivo que incluya movimiento..."></textarea>
            </div>

            <!-- Botón generar -->
            <button type="submit" class="ai-gen-submit" id="ai-gen-submit-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Generar Recurso
            </button>
          </form>
        </div>

        <!-- Vista de carga -->
        <div class="ai-gen-loading" id="ai-gen-loading-view" style="display: none;">
          <div class="ai-gen-loading-spinner"></div>
          <p class="ai-gen-loading-text">Generando tu recurso personalizado...</p>
          <p class="ai-gen-loading-subtext">Esto puede tomar unos segundos</p>
        </div>

        <!-- Vista de resultado -->
        <div class="ai-gen-result" id="ai-gen-result-view" style="display: none;">
          <div class="ai-gen-result-content" id="ai-gen-result-content">
            <!-- Contenido generado aquí -->
          </div>
          <div class="ai-gen-result-actions">
            <button class="ai-gen-btn secondary" onclick="window.educatorsKit?.resetAIGenerator()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Generar Otro
            </button>
            <button class="ai-gen-btn primary" onclick="window.educatorsKit?.copyGeneratedResource()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
              </svg>
              Copiar
            </button>
            <button class="ai-gen-btn primary" onclick="window.educatorsKit?.printGeneratedResource()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Imprimir/PDF
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Añadir estilos del generador
    this.addAIGeneratorStyles();
  }

  /**
   * Añade los estilos del generador de IA
   */
  addAIGeneratorStyles() {
    if (document.getElementById('ai-generator-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'ai-generator-styles';
    styles.textContent = `
      .ai-generator-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
      }
      .ai-generator-modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ai-gen-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(4px);
      }
      .ai-gen-container {
        position: relative;
        width: 95%;
        max-width: 700px;
        max-height: 90vh;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25);
      }
      .ai-gen-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        background: rgba(139, 92, 246, 0.1);
      }
      .ai-gen-header-icon {
        padding: 12px;
        background: rgba(139, 92, 246, 0.2);
        border-radius: 12px;
      }
      .ai-gen-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        margin: 0;
      }
      .ai-gen-subtitle {
        font-size: 0.875rem;
        color: #a78bfa;
        margin: 4px 0 0;
      }
      .ai-gen-close {
        margin-left: auto;
        padding: 8px;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        color: #ef4444;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ai-gen-close:hover {
        background: rgba(239, 68, 68, 0.3);
      }
      .ai-gen-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }
      .ai-gen-field {
        margin-bottom: 24px;
      }
      .ai-gen-label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 12px;
      }
      .ai-gen-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .ai-gen-options.grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }
      .ai-gen-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px 12px;
        background: rgba(30, 41, 59, 0.8);
        border: 2px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ai-gen-option:hover {
        border-color: rgba(139, 92, 246, 0.4);
        background: rgba(139, 92, 246, 0.1);
      }
      .ai-gen-option.selected {
        border-color: #8b5cf6;
        background: rgba(139, 92, 246, 0.2);
        color: white;
      }
      .ai-gen-option-icon {
        font-size: 1.5rem;
      }
      .ai-gen-option-text {
        font-size: 0.85rem;
        text-align: center;
      }
      .ai-gen-textarea {
        width: 100%;
        min-height: 100px;
        padding: 16px;
        background: rgba(30, 41, 59, 0.8);
        border: 2px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        color: white;
        font-size: 0.9rem;
        resize: vertical;
      }
      .ai-gen-textarea:focus {
        outline: none;
        border-color: rgba(139, 92, 246, 0.5);
      }
      .ai-gen-submit {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 24px;
        background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }
      .ai-gen-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4);
      }
      .ai-gen-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      /* Loading */
      .ai-gen-loading {
        padding: 60px 24px;
        text-align: center;
      }
      .ai-gen-loading-spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 24px;
        border: 3px solid rgba(139, 92, 246, 0.2);
        border-top-color: #8b5cf6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .ai-gen-loading-text {
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 8px;
      }
      .ai-gen-loading-subtext {
        color: #94a3b8;
        font-size: 0.9rem;
        margin: 0;
      }

      /* Result */
      .ai-gen-result {
        padding: 24px;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .ai-gen-result-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #e2e8f0;
        line-height: 1.7;
        margin-bottom: 16px;
      }
      .ai-gen-result-content h2 {
        color: #a78bfa;
        font-size: 1.3rem;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid rgba(139, 92, 246, 0.3);
      }
      .ai-gen-result-content h3 {
        color: #c4b5fd;
        font-size: 1.1rem;
        margin: 20px 0 12px;
      }
      .ai-gen-result-content ul, .ai-gen-result-content ol {
        margin: 12px 0;
        padding-left: 24px;
      }
      .ai-gen-result-content li {
        margin: 8px 0;
      }
      .ai-gen-result-content strong {
        color: white;
      }
      .ai-gen-result-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .ai-gen-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
        min-width: 120px;
      }
      .ai-gen-btn.primary {
        background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
        border: none;
        color: white;
      }
      .ai-gen-btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 15px -3px rgba(139, 92, 246, 0.4);
      }
      .ai-gen-btn.secondary {
        background: rgba(148, 163, 184, 0.1);
        border: 1px solid rgba(148, 163, 184, 0.3);
        color: #94a3b8;
      }
      .ai-gen-btn.secondary:hover {
        background: rgba(148, 163, 184, 0.2);
        color: white;
      }

      @media (max-width: 640px) {
        .ai-gen-options {
          grid-template-columns: 1fr;
        }
        .ai-gen-options.grid-3 {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Selecciona una opción del formulario
   */
  selectOption(button, fieldName) {
    // Deseleccionar otras opciones del mismo grupo
    const container = button.parentElement;
    container.querySelectorAll('.ai-gen-option').forEach(opt => opt.classList.remove('selected'));

    // Seleccionar esta opción
    button.classList.add('selected');

    // Guardar valor
    if (!this.aiGenFormData) this.aiGenFormData = {};
    this.aiGenFormData[fieldName] = button.dataset.value;
  }

  /**
   * Genera el recurso con IA
   */
  async generateResource(event) {
    event.preventDefault();

    // Validar que todas las opciones estén seleccionadas
    const required = ['resourceType', 'targetAge', 'topic', 'duration'];
    const missing = required.filter(field => !this.aiGenFormData?.[field]);

    if (missing.length > 0) {
      this.showToast('Por favor, selecciona todas las opciones', 'warning');
      return;
    }

    // Obtener contexto adicional
    const context = document.getElementById('ai-gen-context')?.value || '';

    // Mostrar vista de carga
    document.getElementById('ai-gen-form-view').style.display = 'none';
    document.getElementById('ai-gen-loading-view').style.display = 'block';

    try {
      // Construir prompt
      const prompt = this.buildAIPrompt({
        ...this.aiGenFormData,
        context
      });

      // Llamar a la IA
      const result = await this.callAI(prompt);

      // Mostrar resultado
      this.showGeneratedResult(result);

    } catch (error) {
      logger.error('[EducatorsKit] Error generando recurso:', error);
      this.showToast('Error al generar el recurso. Inténtalo de nuevo.', 'error');
      this.resetAIGenerator();
    }
  }

  /**
   * Construye el prompt para la IA
   */
  buildAIPrompt(data) {
    const typeNames = {
      'actividad': 'una actividad educativa completa',
      'reflexion': 'un conjunto de 10 preguntas de reflexión',
      'sesion': 'un plan de sesión estructurado',
      'explicacion': 'un texto explicativo claro y pedagógico'
    };

    const ageDescriptions = {
      'primaria': 'niños de primaria (6-12 años), usando lenguaje sencillo, ejemplos concretos y elementos lúdicos',
      'secundaria': 'adolescentes de secundaria (12-18 años), que pueden manejar conceptos abstractos y buscan relevancia y autenticidad',
      'adultos': 'adultos, con profundidad conceptual, conexión con experiencia de vida y aplicabilidad práctica'
    };

    const topicDescriptions = {
      'interdependencia': 'la interdependencia y conexión de todo con todo, cómo formamos parte de sistemas mayores',
      'premisas': 'las premisas ocultas y creencias asumidas, cómo cuestionarlas y explorar alternativas',
      'naturaleza': 'la conexión con la naturaleza, la ecología profunda y nuestro lugar en el ecosistema',
      'emociones': 'la inteligencia emocional, reconocer y expresar emociones, bienestar interior',
      'comunidad': 'la construcción de comunidad, cooperación vs competencia, tejido social',
      'accion': 'la acción transformadora, pasar del conocimiento a la práctica, generar cambio real'
    };

    return `Eres un educador experto en pedagogía transformadora y los principios del "Nuevo Ser" (interdependencia, cuestionamiento de premisas, reconexión con la naturaleza, desarrollo integral).

Genera ${typeNames[data.resourceType]} sobre el tema de ${topicDescriptions[data.topic]}.

El recurso debe estar adaptado para ${ageDescriptions[data.targetAge]}.

Duración disponible: ${data.duration} minutos.

${data.context ? `Contexto adicional del facilitador: ${data.context}` : ''}

FORMATO DE RESPUESTA (usa HTML para formatear):
- Título claro y atractivo (h2)
- Objetivos de aprendizaje (lista)
- Materiales necesarios (si aplica)
- Desarrollo paso a paso con tiempos aproximados
- Preguntas de reflexión para cerrar
- Variantes o adaptaciones opcionales

Sé creativo, práctico y asegúrate de que el recurso sea fácil de implementar. Usa un tono cálido y cercano.`;
  }

  /**
   * Llama a la API de IA
   */
  async callAI(prompt) {
    // Intentar usar AIAdapter si está disponible
    if (window.AIAdapter) {
      try {
        const adapter = new window.AIAdapter();
        await adapter.init();
        const response = await adapter.generateText(prompt, {
          maxTokens: 2000,
          temperature: 0.7
        });
        return response;
      } catch (e) {
        logger.warn('[EducatorsKit] AIAdapter failed, trying Puter:', e);
      }
    }

    // Intentar usar Puter AI
    if (typeof puter !== 'undefined' && puter.ai) {
      try {
        const response = await puter.ai.chat(prompt, {
          model: 'gpt-4o-mini'
        });
        return response?.message?.content || response;
      } catch (e) {
        logger.warn('[EducatorsKit] Puter AI failed:', e);
      }
    }

    // Fallback: generar respuesta local
    return this.generateLocalResponse(this.aiGenFormData);
  }

  /**
   * Genera una respuesta local como fallback
   */
  generateLocalResponse(data) {
    const templates = {
      'actividad': {
        'interdependencia': `<h2>🌐 Tejiendo la Red de la Vida</h2>
<h3>Objetivos</h3>
<ul>
<li>Comprender que todo está interconectado</li>
<li>Visualizar las relaciones de interdependencia</li>
<li>Reflexionar sobre nuestro lugar en el sistema</li>
</ul>

<h3>Materiales</h3>
<ul>
<li>Ovillo de lana o cuerda</li>
<li>Tarjetas con nombres de elementos (sol, agua, plantas, animales, humanos, etc.)</li>
<li>Espacio para formar círculo</li>
</ul>

<h3>Desarrollo (${data.duration} min)</h3>
<p><strong>Apertura (5 min):</strong> Formar un círculo. Repartir tarjetas con elementos de la naturaleza/sociedad.</p>
<p><strong>Actividad principal (${Math.floor(data.duration * 0.6)} min):</strong></p>
<ol>
<li>La primera persona sostiene el ovillo y dice: "Yo soy el Sol, doy energía a..." y lanza el hilo a quien tenga la tarjeta relacionada.</li>
<li>Cada persona recibe el hilo, explica su conexión, y lo lanza a otro elemento del que depende.</li>
<li>Continuar hasta crear una red visible que conecte a todos.</li>
</ol>
<p><strong>Reflexión (${Math.floor(data.duration * 0.2)} min):</strong> Observar la red creada.</p>
<ul>
<li>¿Qué pasa si soltamos un hilo?</li>
<li>¿Dónde estamos nosotros en esta red?</li>
<li>¿Cómo afectan nuestras acciones a la red?</li>
</ul>

<h3>Variantes</h3>
<ul>
<li>Usar elementos de la comunidad local</li>
<li>Incluir elementos emocionales/abstractos</li>
<li>Fotografiar la red como recordatorio</li>
</ul>`,
        'premisas': `<h2>🧠 Arqueología de Creencias</h2>
<h3>Objetivos</h3>
<ul>
<li>Identificar creencias asumidas como verdades</li>
<li>Explorar el origen de nuestras creencias</li>
<li>Imaginar alternativas posibles</li>
</ul>

<h3>Materiales</h3>
<ul>
<li>Post-its de colores</li>
<li>Rotuladores</li>
<li>Pizarra o papel grande</li>
</ul>

<h3>Desarrollo (${data.duration} min)</h3>
<p><strong>Introducción (5 min):</strong> Explicar qué es una "premisa oculta" - una creencia que asumimos sin cuestionar.</p>
<p><strong>Excavación individual (${Math.floor(data.duration * 0.3)} min):</strong></p>
<ol>
<li>Cada participante completa frases como: "El éxito es...", "El dinero sirve para...", "Las personas en el fondo son..."</li>
<li>Escribir cada respuesta en un post-it</li>
</ol>
<p><strong>Mapa colectivo (${Math.floor(data.duration * 0.3)} min):</strong></p>
<ol>
<li>Pegar post-its agrupándolos por temas</li>
<li>Observar patrones: ¿qué premisas compartimos?</li>
</ol>
<p><strong>Reflexión (${Math.floor(data.duration * 0.2)} min):</strong></p>
<ul>
<li>¿De dónde vienen estas creencias?</li>
<li>¿Son verdades o construcciones culturales?</li>
<li>¿Qué alternativas podrían existir?</li>
</ul>

<h3>Variantes</h3>
<ul>
<li>Enfocarse en un tema específico (trabajo, relaciones, naturaleza)</li>
<li>Investigar premisas de otros contextos culturales</li>
</ul>`
      },
      'reflexion': {
        'default': `<h2>💭 Preguntas para la Reflexión</h2>
<p>Estas preguntas pueden usarse individualmente, en parejas o en grupo. Deja espacio para el silencio después de cada una.</p>

<h3>Preguntas sobre ${data.topic}</h3>
<ol>
<li>¿Qué es lo que más te sorprende cuando piensas en este tema?</li>
<li>¿Qué creencias sobre esto heredaste sin cuestionarlas?</li>
<li>¿Cómo sería el mundo si esta premisa fuera diferente?</li>
<li>¿Dónde sientes esta reflexión en tu cuerpo?</li>
<li>¿Qué pequeño cambio podrías hacer esta semana relacionado con esto?</li>
<li>¿Quién en tu vida encarna una forma diferente de ver esto?</li>
<li>¿Qué perderías si cambiaras tu perspectiva sobre este tema?</li>
<li>¿Qué ganarías?</li>
<li>¿Qué pregunta te llevas para seguir reflexionando?</li>
<li>Si pudieras transmitir una idea sobre esto a las próximas generaciones, ¿cuál sería?</li>
</ol>

<h3>Cómo usar estas preguntas</h3>
<ul>
<li>Selecciona 3-4 preguntas según el tiempo disponible</li>
<li>Deja al menos 2 minutos de silencio después de cada pregunta</li>
<li>Invita a escribir antes de compartir en voz alta</li>
<li>Recuerda que no hay respuestas "correctas"</li>
</ul>`
      },
      'sesion': {
        'default': `<h2>📋 Plan de Sesión: ${data.topic}</h2>
<p><strong>Duración:</strong> ${data.duration} minutos | <strong>Grupo:</strong> ${data.targetAge}</p>

<h3>Objetivos</h3>
<ul>
<li>Explorar el tema de ${data.topic} desde la perspectiva del Nuevo Ser</li>
<li>Crear espacio para la reflexión personal y colectiva</li>
<li>Generar compromisos de acción concretos</li>
</ul>

<h3>Estructura</h3>

<h4>1. APERTURA (${Math.floor(data.duration * 0.15)} min)</h4>
<ul>
<li>Círculo de llegada: cada persona comparte en una palabra cómo llega</li>
<li>Práctica de presencia: 3 respiraciones conscientes juntos</li>
<li>Establecer intención: ¿qué queremos explorar hoy?</li>
</ul>

<h4>2. DESARROLLO (${Math.floor(data.duration * 0.6)} min)</h4>
<p><strong>Introducción al tema (${Math.floor(data.duration * 0.1)} min):</strong></p>
<ul>
<li>Pregunta provocadora o dato sorprendente</li>
<li>Breve contexto conceptual</li>
</ul>

<p><strong>Actividad experiencial (${Math.floor(data.duration * 0.3)} min):</strong></p>
<ul>
<li>Ejercicio práctico relacionado con el tema</li>
<li>Trabajo individual, en parejas o grupal según el ejercicio</li>
</ul>

<p><strong>Reflexión compartida (${Math.floor(data.duration * 0.2)} min):</strong></p>
<ul>
<li>Puesta en común de insights</li>
<li>Preguntas que profundicen la exploración</li>
</ul>

<h4>3. CIERRE (${Math.floor(data.duration * 0.15)} min)</h4>
<ul>
<li>Síntesis de aprendizajes clave (sin cerrar el tema)</li>
<li>Compromiso de acción: "Esta semana voy a..."</li>
<li>Círculo de cierre: una palabra de gratitud o intención</li>
</ul>

<h3>Materiales necesarios</h3>
<ul>
<li>Espacio cómodo dispuesto en círculo</li>
<li>Campana o elemento para marcar transiciones</li>
<li>Papel y bolígrafos para cada participante</li>
</ul>`
      },
      'explicacion': {
        'default': `<h2>📖 Comprendiendo ${data.topic}</h2>

<h3>¿Qué significa realmente?</h3>
<p>En el contexto del Nuevo Ser, ${data.topic} no es solo un concepto teórico, sino una invitación a cambiar nuestra forma de estar en el mundo.</p>

<h3>La premisa vieja</h3>
<p>El paradigma dominante nos ha enseñado a ver el mundo de cierta manera. Esta visión, aunque nos parece "natural", es en realidad una construcción cultural que puede ser cuestionada.</p>

<h3>La premisa nueva</h3>
<p>El Nuevo Ser propone una perspectiva diferente. No se trata de tener razón, sino de explorar posibilidades que el paradigma actual no permite ver.</p>

<h3>¿Por qué importa?</h3>
<p>Cuando cambiamos nuestra manera de entender algo fundamental, todo lo demás cambia. No es solo un cambio de ideas, sino de cómo vivimos, nos relacionamos y actuamos en el mundo.</p>

<h3>Ejemplos concretos</h3>
<ul>
<li>En lo personal: cómo esto afecta nuestras decisiones diarias</li>
<li>En lo relacional: cómo cambia nuestra forma de estar con otros</li>
<li>En lo colectivo: qué posibilidades se abren para la sociedad</li>
</ul>

<h3>Para reflexionar</h3>
<ul>
<li>¿Dónde veo esto operando en mi vida?</li>
<li>¿Qué cambiaría si adoptara esta nueva perspectiva?</li>
<li>¿Qué me cuesta soltar de la visión anterior?</li>
</ul>`
      }
    };

    // Obtener template apropiado
    let template = templates[data.resourceType]?.[data.topic] ||
                   templates[data.resourceType]?.['default'] ||
                   templates['explicacion']['default'];

    return template;
  }

  /**
   * Muestra el resultado generado
   */
  showGeneratedResult(result) {
    document.getElementById('ai-gen-loading-view').style.display = 'none';
    document.getElementById('ai-gen-result-view').style.display = 'flex';

    const contentDiv = document.getElementById('ai-gen-result-content');
    contentDiv.innerHTML = result;

    this.generatedContent = result;
  }

  /**
   * Resetea el generador
   */
  resetAIGenerator() {
    document.getElementById('ai-gen-form-view').style.display = 'block';
    document.getElementById('ai-gen-loading-view').style.display = 'none';
    document.getElementById('ai-gen-result-view').style.display = 'none';

    // Limpiar selecciones
    document.querySelectorAll('.ai-gen-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('ai-gen-context').value = '';

    this.aiGenFormData = {};
  }

  /**
   * Cierra el generador de IA
   */
  closeAIGenerator() {
    const modal = document.getElementById('ai-generator-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    this.resetAIGenerator();
  }

  /**
   * Copia el recurso generado al portapapeles
   */
  copyGeneratedResource() {
    if (!this.generatedContent) return;

    // Convertir HTML a texto plano
    const temp = document.createElement('div');
    temp.innerHTML = this.generatedContent;
    const text = temp.textContent || temp.innerText;

    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Contenido copiado al portapapeles', 'success');
    }).catch(() => {
      this.showToast('Error al copiar', 'error');
    });
  }

  /**
   * Imprime el recurso generado
   */
  printGeneratedResource() {
    const content = document.getElementById('ai-gen-result-content').innerHTML;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recurso Educativo - Colección Nuevo Ser</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; }
          h2 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
          h3 { color: #6d28d9; margin-top: 24px; }
          ul, ol { margin: 12px 0; padding-left: 24px; }
          li { margin: 8px 0; }
          strong { color: #1e293b; }
          p { margin: 12px 0; }
        </style>
      </head>
      <body>
        ${content}
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
          Generado con el Kit para Educadores - Colección Nuevo Ser
        </footer>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

// Exportar para uso global
window.EducatorsKit = EducatorsKit;
