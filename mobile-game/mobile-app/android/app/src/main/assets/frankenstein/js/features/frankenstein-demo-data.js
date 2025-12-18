/**
 * FRANKENSTEIN LAB - DEMO DATA
 * Datos de ejemplo para modo demostración
 * Incluye seres y microsociedades pre-construidos
 *
 * @version 1.0.0
 * @author Claude Sonnet 4.5
 */

const FrankensteinDemoData = {
  /**
   * Piezas de demo (libros y capítulos)
   */
  demoPieces: [
    // Libro 1: Manifiesto
    { type: 'chapter', id: 'manifiesto-cap1', chapterId: 'cap1', bookId: 'manifiesto', bookTitle: 'Manifiesto', title: 'El Despertar Colectivo', icon: '📖', tags: ['consciencia', 'transformación'], color: '#8B5CF6' },
    { type: 'chapter', id: 'manifiesto-cap2', chapterId: 'cap2', bookId: 'manifiesto', bookTitle: 'Manifiesto', title: 'Visión del Nuevo Ser', icon: '📖', tags: ['identidad', 'propósito'], color: '#8B5CF6' },
    { type: 'chapter', id: 'manifiesto-cap3', chapterId: 'cap3', bookId: 'manifiesto', bookTitle: 'Manifiesto', title: 'Principios Fundamentales', icon: '📖', tags: ['valores', 'ética'], color: '#8B5CF6' },
    { type: 'exercise', id: 'manifiesto-ex1', chapterId: 'ex1', bookId: 'manifiesto', bookTitle: 'Manifiesto', title: 'Meditación de Intención', icon: '🧘', category: 'meditation', color: '#8B5CF6' },

    // Libro 2: Código del Despertar
    { type: 'chapter', id: 'codigo-despertar-cap1', chapterId: 'cap1', bookId: 'codigo-despertar', bookTitle: 'Código del Despertar', title: 'La Naturaleza de la Consciencia', icon: '📖', tags: ['consciencia', 'ciencia'], color: '#10B981' },
    { type: 'chapter', id: 'codigo-despertar-cap2', chapterId: 'cap2', bookId: 'codigo-despertar', bookTitle: 'Código del Despertar', title: 'Realidad y Percepción', icon: '📖', tags: ['realidad', 'percepción'], color: '#10B981' },
    { type: 'chapter', id: 'codigo-despertar-cap3', chapterId: 'cap3', bookId: 'codigo-despertar', bookTitle: 'Código del Despertar', title: 'Transformación Personal', icon: '📖', tags: ['cambio', 'crecimiento'], color: '#10B981' },
    { type: 'exercise', id: 'codigo-ex1', chapterId: 'ex1', bookId: 'codigo-despertar', bookTitle: 'Código del Despertar', title: 'Práctica de Presencia', icon: '🧘', category: 'meditation', color: '#10B981' },

    // Libro 3: Toolkit de Transición
    { type: 'chapter', id: 'toolkit-transicion-cap1', chapterId: 'cap1', bookId: 'toolkit-transicion', bookTitle: 'Toolkit de Transición', title: 'Herramientas para el Cambio', icon: '📖', tags: ['herramientas', 'práctica'], color: '#F59E0B' },
    { type: 'chapter', id: 'toolkit-transicion-cap2', chapterId: 'cap2', bookId: 'toolkit-transicion', bookTitle: 'Toolkit de Transición', title: 'Organización Comunitaria', icon: '📖', tags: ['comunidad', 'organización'], color: '#F59E0B' },
    { type: 'chapter', id: 'toolkit-transicion-cap3', chapterId: 'cap3', bookId: 'toolkit-transicion', bookTitle: 'Toolkit de Transición', title: 'Estrategias de Acción', icon: '📖', tags: ['acción', 'estrategia'], color: '#F59E0B' },
    { type: 'exercise', id: 'toolkit-transicion-ex1', chapterId: 'ex1', bookId: 'toolkit-transicion', bookTitle: 'Toolkit de Transición', title: 'Mapeo de Recursos', icon: '🛠️', category: 'practical', color: '#F59E0B' },

    // Libro 4: Prácticas Radicales
    { type: 'chapter', id: 'practicas-cap1', chapterId: 'cap1', bookId: 'practicas-radicales', bookTitle: 'Prácticas Radicales', title: 'Conexión con la Tierra', icon: '📖', tags: ['naturaleza', 'conexión'], color: '#EF4444' },
    { type: 'chapter', id: 'practicas-cap2', chapterId: 'cap2', bookId: 'practicas-radicales', bookTitle: 'Prácticas Radicales', title: 'Rituales de Transformación', icon: '📖', tags: ['rituales', 'transformación'], color: '#EF4444' },
    { type: 'chapter', id: 'practicas-cap3', chapterId: 'cap3', bookId: 'practicas-radicales', bookTitle: 'Prácticas Radicales', title: 'Sanación Profunda', icon: '📖', tags: ['sanación', 'bienestar'], color: '#EF4444' },
    { type: 'exercise', id: 'practicas-ex1', chapterId: 'ex1', bookId: 'practicas-radicales', bookTitle: 'Prácticas Radicales', title: 'Meditación Terrestre', icon: '🧘', category: 'meditation', color: '#EF4444' },

    // Libro 5: Manual de Transición
    { type: 'chapter', id: 'manual-transicion-cap1', chapterId: 'cap1', bookId: 'manual-transicion', bookTitle: 'Manual de Transición', title: 'Fundamentos del Cambio', icon: '📖', tags: ['cambio', 'fundamentos'], color: '#6366F1' },
    { type: 'chapter', id: 'manual-transicion-cap2', chapterId: 'cap2', bookId: 'manual-transicion', bookTitle: 'Manual de Transición', title: 'Construyendo Comunidad', icon: '📖', tags: ['comunidad', 'construcción'], color: '#6366F1' },
    { type: 'exercise', id: 'manual-transicion-ex1', chapterId: 'ex1', bookId: 'manual-transicion', bookTitle: 'Manual de Transición', title: 'Círculo de Diálogo', icon: '💬', category: 'reflection', color: '#6366F1' },

    // Libro 6: Guía de Acciones
    { type: 'chapter', id: 'guia-acciones-cap1', chapterId: 'cap1', bookId: 'guia-acciones', bookTitle: 'Guía de Acciones', title: 'Acciones Directas', icon: '📖', tags: ['acción', 'directa'], color: '#EC4899' },
    { type: 'chapter', id: 'guia-acciones-cap2', chapterId: 'cap2', bookId: 'guia-acciones', bookTitle: 'Guía de Acciones', title: 'Activismo Consciente', icon: '📖', tags: ['activismo', 'consciencia'], color: '#EC4899' },
    { type: 'exercise', id: 'guia-acciones-ex1', chapterId: 'ex1', bookId: 'guia-acciones', bookTitle: 'Guía de Acciones', title: 'Plan de Acción Personal', icon: '📝', category: 'practical', color: '#EC4899' }
  ],

  /**
   * Obtener piezas de demo
   */
  getDemoPieces() {
    return JSON.parse(JSON.stringify(this.demoPieces));
  },

  /**
   * Seres de ejemplo con diferentes perfiles
   */
  exampleBeings: [
    {
      id: 'demo-eco-activist-001',
      name: 'Guardián de la Tierra',
      missionId: 'earth-defender',
      mission: {
        id: 'earth-defender',
        name: 'Defensor de la Tierra',
        icon: '🛡️',
        description: 'Proteger ecosistemas y liderar la regeneración ambiental'
      },
      pieces: [
        {
          type: 'chapter',
          id: 'toolkit-transicion-cap1',
          bookId: 'toolkit-transicion',
          bookTitle: 'Toolkit de Transición',
          title: 'Introducción',
          icon: '📖'
        },
        {
          type: 'chapter',
          id: 'practicas-radicales-cap2',
          bookId: 'practicas-radicales',
          bookTitle: 'Prácticas Radicales',
          title: 'Conexión con la Naturaleza',
          icon: '📖'
        },
        {
          type: 'exercise',
          id: 'manifiesto-ex1',
          bookId: 'manifiesto',
          bookTitle: 'Manifiesto',
          title: 'Meditación en la Tierra',
          icon: '🧘'
        }
      ],
      being: {
        name: 'Guardián de la Tierra',
        pieces: [],
        attributes: {
          wisdom: 75,
          empathy: 90,
          courage: 80,
          creativity: 70,
          discipline: 85,
          action: 95,
          balance: 88,
          resilience: 85,
          communication: 78,
          consciousness: 82,
          organization: 80
        },
        totalPower: 908
      },
      validation: {
        valid: true,
        score: 95,
        feedback: 'Ser perfectamente equilibrado para la defensa ambiental'
      },
      createdAt: '2025-12-12T10:00:00.000Z'
    },

    {
      id: 'demo-philosopher-002',
      name: 'Sabio Contemplativo',
      missionId: 'consciousness-awakener',
      mission: {
        id: 'consciousness-awakener',
        name: 'Despertador de Consciencia',
        icon: '🌅',
        description: 'Facilitar el despertar de consciencia en individuos y comunidades'
      },
      pieces: [
        {
          type: 'chapter',
          id: 'codigo-despertar-cap1',
          bookId: 'codigo-despertar',
          bookTitle: 'Código del Despertar',
          title: 'El Despertar',
          icon: '📖'
        },
        {
          type: 'chapter',
          id: 'dialogos-maquina-cap1',
          bookId: 'dialogos-maquina',
          bookTitle: 'Diálogos con la Máquina',
          title: 'Conciencia y Tecnología',
          icon: '📖'
        },
        {
          type: 'resource',
          id: 'manifiesto-res1',
          bookId: 'manifiesto',
          bookTitle: 'Manifiesto',
          title: 'Fundamentos Filosóficos',
          icon: '📚'
        }
      ],
      being: {
        name: 'Sabio Contemplativo',
        pieces: [],
        attributes: {
          wisdom: 98,
          empathy: 85,
          courage: 70,
          creativity: 92,
          discipline: 88,
          action: 65,
          balance: 95,
          resilience: 75,
          communication: 80,
          consciousness: 97,
          organization: 70
        },
        totalPower: 915
      },
      validation: {
        valid: true,
        score: 98,
        feedback: 'Excepcional capacidad para despertar consciencia'
      },
      createdAt: '2025-12-12T10:15:00.000Z'
    },

    {
      id: 'demo-community-builder-003',
      name: 'Tejedor de Comunidad',
      missionId: 'community-weaver',
      mission: {
        id: 'community-weaver',
        name: 'Tejedor de Comunidad',
        icon: '🕸️',
        description: 'Crear y mantener redes de apoyo y colaboración'
      },
      pieces: [
        {
          type: 'chapter',
          id: 'guia-acciones-cap1',
          bookId: 'guia-acciones',
          bookTitle: 'Guía de Acciones',
          title: 'Acciones Colectivas',
          icon: '📖'
        },
        {
          type: 'chapter',
          id: 'manual-transicion-cap2',
          bookId: 'manual-transicion',
          bookTitle: 'Manual de Transición',
          title: 'Construyendo Comunidad',
          icon: '📖'
        },
        {
          type: 'exercise',
          id: 'toolkit-ex2',
          bookId: 'toolkit-transicion',
          bookTitle: 'Toolkit de Transición',
          title: 'Círculo de Diálogo',
          icon: '🧘'
        }
      ],
      being: {
        name: 'Tejedor de Comunidad',
        pieces: [],
        attributes: {
          wisdom: 80,
          empathy: 95,
          courage: 75,
          creativity: 85,
          discipline: 78,
          action: 88,
          balance: 90,
          resilience: 92,
          communication: 96,
          consciousness: 83,
          organization: 90
        },
        totalPower: 952
      },
      validation: {
        valid: true,
        score: 96,
        feedback: 'Excepcional capacidad para tejer redes comunitarias'
      },
      createdAt: '2025-12-12T10:30:00.000Z'
    },

    {
      id: 'demo-innovator-004',
      name: 'Catalizador de Innovación',
      missionId: 'tech-humanist',
      mission: {
        id: 'tech-humanist',
        name: 'Tecnólogo Humanista',
        icon: '🤖',
        description: 'Integrar tecnología y humanismo para transformación social'
      },
      pieces: [
        {
          type: 'chapter',
          id: 'dialogos-maquina-cap2',
          bookId: 'dialogos-maquina',
          bookTitle: 'Diálogos con la Máquina',
          title: 'Tecnología Consciente',
          icon: '📖'
        },
        {
          type: 'chapter',
          id: 'codigo-despertar-cap3',
          bookId: 'codigo-despertar',
          bookTitle: 'Código del Despertar',
          title: 'Innovación y Consciencia',
          icon: '📖'
        },
        {
          type: 'resource',
          id: 'toolkit-res1',
          bookId: 'toolkit-transicion',
          bookTitle: 'Toolkit de Transición',
          title: 'Herramientas Digitales',
          icon: '📚'
        }
      ],
      being: {
        name: 'Catalizador de Innovación',
        pieces: [],
        attributes: {
          wisdom: 88,
          empathy: 78,
          courage: 92,
          creativity: 97,
          discipline: 85,
          action: 90,
          balance: 82,
          resilience: 80,
          communication: 86,
          consciousness: 85,
          organization: 88
        },
        totalPower: 951
      },
      validation: {
        valid: true,
        score: 94,
        feedback: 'Excepcional capacidad innovadora con enfoque humanista'
      },
      createdAt: '2025-12-12T10:45:00.000Z'
    },

    {
      id: 'demo-healer-005',
      name: 'Sanador Integral',
      missionId: 'trauma-healer',
      mission: {
        id: 'trauma-healer',
        name: 'Sanador de Traumas',
        icon: '💚',
        description: 'Acompañar procesos de sanación individual y colectiva'
      },
      pieces: [
        {
          type: 'chapter',
          id: 'practicas-radicales-cap1',
          bookId: 'practicas-radicales',
          bookTitle: 'Prácticas Radicales',
          title: 'Sanación Profunda',
          icon: '📖'
        },
        {
          type: 'chapter',
          id: 'manual-practico-cap2',
          bookId: 'manual-practico',
          bookTitle: 'Manual Práctico',
          title: 'Técnicas de Sanación',
          icon: '📖'
        },
        {
          type: 'exercise',
          id: 'practicas-ex1',
          bookId: 'practicas-radicales',
          bookTitle: 'Prácticas Radicales',
          title: 'Meditación Sanadora',
          icon: '🧘'
        }
      ],
      being: {
        name: 'Sanador Integral',
        pieces: [],
        attributes: {
          wisdom: 90,
          empathy: 98,
          courage: 78,
          creativity: 85,
          discipline: 82,
          action: 75,
          balance: 96,
          resilience: 88,
          communication: 87,
          consciousness: 92,
          organization: 76
        },
        totalPower: 947
      },
      validation: {
        valid: true,
        score: 97,
        feedback: 'Capacidad sanadora excepcional con profunda empatía'
      },
      createdAt: '2025-12-12T11:00:00.000Z'
    }
  ],

  /**
   * Microsociedades de ejemplo
   */
  exampleMicrosocieties: [
    {
      name: 'Comunidad Regenerativa',
      goal: 'Crear un modelo de vida sostenible que regenere los ecosistemas locales y fomente la autosuficiencia comunitaria',
      beings: [
        {
          name: 'Guardián de la Tierra',
          attributes: {
            wisdom: 75, empathy: 90, courage: 80, creativity: 70,
            discipline: 85, action: 95, balance: 88, resilience: 85,
            communication: 78, consciousness: 82, organization: 80
          },
          fitness: 50,
          alive: true
        },
        {
          name: 'Tejedor de Comunidad',
          attributes: {
            wisdom: 80, empathy: 95, courage: 75, creativity: 85,
            discipline: 78, action: 88, balance: 90, resilience: 92,
            communication: 96, consciousness: 83, organization: 90
          },
          fitness: 50,
          alive: true
        },
        {
          name: 'Sanador Integral',
          attributes: {
            wisdom: 90, empathy: 98, courage: 78, creativity: 85,
            discipline: 82, action: 75, balance: 96, resilience: 88,
            communication: 87, consciousness: 92, organization: 76
          },
          fitness: 50,
          alive: true
        }
      ],
      description: 'Una comunidad enfocada en la regeneración ecológica y el bienestar colectivo',
      tags: ['ecología', 'sostenibilidad', 'comunidad', 'regeneración'],
      createdAt: '2025-12-12T11:15:00.000Z'
    },

    {
      name: 'Colectivo de Aprendizaje',
      goal: 'Facilitar el despertar de consciencia y el aprendizaje continuo a través del diálogo filosófico y la innovación pedagógica',
      beings: [
        {
          name: 'Sabio Contemplativo',
          attributes: {
            wisdom: 98, empathy: 85, courage: 70, creativity: 92,
            discipline: 88, action: 65, balance: 95, resilience: 75,
            communication: 80, consciousness: 97, organization: 70
          },
          fitness: 50,
          alive: true
        },
        {
          name: 'Catalizador de Innovación',
          attributes: {
            wisdom: 88, empathy: 78, courage: 92, creativity: 97,
            discipline: 85, action: 90, balance: 82, resilience: 80,
            communication: 86, consciousness: 85, organization: 88
          },
          fitness: 50,
          alive: true
        },
        {
          name: 'Tejedor de Comunidad',
          attributes: {
            wisdom: 80, empathy: 95, courage: 75, creativity: 85,
            discipline: 78, action: 88, balance: 90, resilience: 92,
            communication: 96, consciousness: 83, organization: 90
          },
          fitness: 50,
          alive: true
        },
        {
          name: 'Mentor Filosófico',
          attributes: {
            wisdom: 95, empathy: 88, courage: 72, creativity: 90,
            discipline: 92, action: 68, balance: 93, resilience: 78,
            communication: 85, consciousness: 94, organization: 75
          },
          fitness: 50,
          alive: true
        }
      ],
      description: 'Un colectivo dedicado al aprendizaje profundo y la expansión de consciencia',
      tags: ['educación', 'filosofía', 'consciencia', 'innovación'],
      createdAt: '2025-12-12T11:30:00.000Z'
    },

    {
      name: 'Red de Sanación',
      goal: 'Proporcionar apoyo emocional, sanación de traumas y bienestar integral a través de prácticas holísticas y red comunitaria',
      beings: [
        {
          name: 'Sanador Integral',
          attributes: {
            wisdom: 90, empathy: 98, courage: 78, creativity: 85,
            discipline: 82, action: 75, balance: 96, resilience: 88,
            communication: 87, consciousness: 92, organization: 76
          },
          fitness: 50,
          alive: true
        },
        {
          name: 'Guardián Emocional',
          attributes: {
            wisdom: 85, empathy: 96, courage: 75, creativity: 80,
            discipline: 80, action: 72, balance: 94, resilience: 90,
            communication: 88, consciousness: 88, organization: 74
          },
          fitness: 50,
          alive: true
        },
        {
          name: 'Tejedor de Comunidad',
          attributes: {
            wisdom: 80, empathy: 95, courage: 75, creativity: 85,
            discipline: 78, action: 88, balance: 90, resilience: 92,
            communication: 96, consciousness: 83, organization: 90
          },
          fitness: 50,
          alive: true
        }
      ],
      description: 'Una red enfocada en la sanación holística y el apoyo mutuo',
      tags: ['sanación', 'trauma', 'bienestar', 'red de apoyo'],
      createdAt: '2025-12-12T11:45:00.000Z'
    }
  ],

  /**
   * Obtener seres de demo
   */
  getDemoBeings() {
    return JSON.parse(JSON.stringify(this.exampleBeings));
  },

  /**
   * Obtener microsociedades de demo
   */
  getDemoMicrosocieties() {
    return JSON.parse(JSON.stringify(this.exampleMicrosocieties));
  },

  /**
   * Obtener un ser aleatorio de demo
   */
  getRandomDemoBeing() {
    const beings = this.getDemoBeings();
    return beings[Math.floor(Math.random() * beings.length)];
  },

  /**
   * Obtener una microsociedad aleatoria de demo
   */
  getRandomDemoMicrosociety() {
    const societies = this.getDemoMicrosocieties();
    return societies[Math.floor(Math.random() * societies.length)];
  },

  /**
   * Cargar datos de demo en el sistema
   */
  loadDemoData(frankensteinUI) {
    if (!frankensteinUI) {
      console.error('❌ FrankensteinUI no disponible');
      return false;
    }

    try {
      // Cargar piezas de demo sin sobrescribir el catálogo base
      const demoPieces = this.getDemoPieces();
      if (!Array.isArray(frankensteinUI.availablePieces) || frankensteinUI.availablePieces.length === 0) {
        frankensteinUI.availablePieces = [...demoPieces];
        console.warn('⚠️ Catálogo base no disponible. Usando piezas demo como fallback.');
      } else {
        const catalogMap = new Map(frankensteinUI.availablePieces.map(piece => [piece.id, piece]));
        const missingIds = [];
        demoPieces.forEach(piece => {
          if (!catalogMap.has(piece.id)) {
            frankensteinUI.availablePieces.push(piece);
            missingIds.push(piece.id);
          }
        });
        console.log(`✅ Modo demo listo. ${demoPieces.length - missingIds.length} piezas encontradas en el catálogo y ${missingIds.length} añadidas como respaldo.`);
      }

      // Cargar seres de demo en localStorage con prefijo 'demo-'
      const existingBeings = frankensteinUI.loadBeings() || [];
      const demoBeings = this.getDemoBeings();

      // Filtrar seres que ya existen
      const newDemoBeings = demoBeings.filter(demoBeing =>
        !existingBeings.some(existing => existing.id === demoBeing.id)
      );

      if (newDemoBeings.length > 0) {
        const updatedBeings = [...existingBeings, ...newDemoBeings];
        localStorage.setItem('frankenstein-saved-beings', JSON.stringify(updatedBeings));
        console.log(`✅ ${newDemoBeings.length} seres de demo cargados`);
      }

      // Actualizar la UI si el método existe
      if (frankensteinUI.renderPiecesTree) {
        frankensteinUI.renderPiecesTree();
        console.log('✅ UI de piezas actualizada');
      }

      // Auto cargar un ser demo si no hay ser activo aún
      if ((!frankensteinUI.currentBeing || frankensteinUI.selectedPieces.length === 0) && demoBeings.length > 0) {
        const defaultDemo = demoBeings[0];
        setTimeout(() => {
          frankensteinUI.loadBeing(defaultDemo.id);
        }, 200);
      }

      return true;
    } catch (error) {
      console.error('❌ Error cargando datos de demo:', error);
      return false;
    }
  },

  /**
   * Limpiar datos de demo
   */
  clearDemoData() {
    try {
      const existingBeings = JSON.parse(localStorage.getItem('frankenstein-saved-beings') || '[]');
      const nonDemoBeings = existingBeings.filter(being => !being.id.startsWith('demo-'));
      localStorage.setItem('frankenstein-saved-beings', JSON.stringify(nonDemoBeings));
      console.log('✅ Datos de demo eliminados');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando datos de demo:', error);
      return false;
    }
  }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.FrankensteinDemoData = FrankensteinDemoData;
}
