// ============================================================================
// ACHIEVEMENTS DATA - Definición de logros por libro
// ============================================================================

const ACHIEVEMENTS = {
  // ==========================================================================
  // LOGROS GLOBALES (aplican a cualquier libro)
  // ==========================================================================
  'global': [
    {
      id: 'primer-libro',
      titulo: 'Explorador',
      descripcion: 'Abrir tu primer libro',
      icon: '📚',
      points: 10,
      condition: (stats) => stats.booksOpened >= 1
    },
    {
      id: 'pensador',
      titulo: 'Pensador',
      descripcion: 'Escribir 5 notas',
      icon: '🖊️',
      points: 25,
      condition: (stats) => stats.notesCount >= 5
    },
    {
      id: 'escritor',
      titulo: 'Escritor Prolífico',
      descripcion: 'Escribir 20 notas',
      icon: '📝',
      points: 50,
      condition: (stats) => stats.notesCount >= 20
    },
    {
      id: 'dialogante',
      titulo: 'Dialogante',
      descripcion: 'Tener 5 conversaciones con la IA',
      icon: '💬',
      points: 25,
      condition: (stats) => stats.aiChats >= 5
    },
    {
      id: 'filosofo',
      titulo: 'Filósofo Digital',
      descripcion: 'Tener 20 conversaciones con la IA',
      icon: '🧠',
      points: 75,
      condition: (stats) => stats.aiChats >= 20
    },
    {
      id: 'reflexivo',
      titulo: 'Reflexivo',
      descripcion: 'Guardar 3 reflexiones',
      icon: '✨',
      points: 30,
      condition: (stats) => stats.reflexionsCount >= 3
    },
    {
      id: 'contemplativo',
      titulo: 'Contemplativo',
      descripcion: 'Guardar 10 reflexiones',
      icon: '🔮',
      points: 60,
      condition: (stats) => stats.reflexionsCount >= 10
    },
    {
      id: 'oyente',
      titulo: 'Oyente Activo',
      descripcion: 'Usar el audioreader',
      icon: '🎧',
      points: 15,
      condition: (stats) => stats.audioUsed >= 1
    },
    {
      id: 'maratonista',
      titulo: 'Maratonista',
      descripcion: 'Leer durante más de 1 hora',
      icon: '⏱️',
      points: 40,
      condition: (stats) => stats.totalReadingMinutes >= 60
    },
    {
      id: 'coleccionista',
      titulo: 'Coleccionista',
      descripcion: 'Abrir 3 libros diferentes',
      icon: '📖',
      points: 35,
      condition: (stats) => stats.uniqueBooksOpened >= 3
    },
    {
      id: 'planificador',
      titulo: 'Planificador',
      descripcion: 'Crear tu primer plan de acción',
      icon: '📋',
      points: 20,
      condition: (stats) => stats.plansCreated >= 1
    },
    {
      id: 'transformador',
      titulo: 'Transformador',
      descripcion: 'Completar un plan de acción',
      icon: '🦋',
      points: 50,
      condition: (stats) => stats.plansCompleted >= 1
    }
  ],

  // ==========================================================================
  // LOGROS ESPECÍFICOS: MANIFIESTO
  // ==========================================================================
  'manifiesto': [
    {
      id: 'manifiesto-inicio',
      titulo: 'Despertar Económico',
      descripcion: 'Comenzar a leer el Manifiesto',
      icon: '🌱',
      points: 10,
      condition: (progress) => progress['prologo'] || progress['cap1']
    },
    {
      id: 'manifiesto-mitad',
      titulo: 'Cuestionador',
      descripcion: 'Completar la mitad del Manifiesto',
      icon: '🤔',
      points: 50,
      condition: (progress) => {
        const completados = Object.values(progress).filter(x => x).length;
        return completados >= 4;
      }
    },
    {
      id: 'manifiesto-completo',
      titulo: 'Revolucionario',
      descripcion: 'Completar el Manifiesto completo',
      icon: '🔥',
      points: 100,
      condition: (progress) => {
        const chapters = ['prologo', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7'];
        return chapters.every(ch => progress[ch]);
      }
    },
    {
      id: 'manifiesto-timeline',
      titulo: 'Historiador',
      descripcion: 'Explorar la línea temporal',
      icon: '📜',
      points: 20,
      condition: (stats) => stats.timelineViewed
    },
    {
      id: 'manifiesto-recursos',
      titulo: 'Investigador',
      descripcion: 'Consultar los recursos externos',
      icon: '🔗',
      points: 20,
      condition: (stats) => stats.resourcesViewed
    }
  ],

  // ==========================================================================
  // LOGROS ESPECÍFICOS: CÓDIGO DEL DESPERTAR
  // ==========================================================================
  'codigo-despertar': [
    {
      id: 'codigo-inicio',
      titulo: 'Buscador',
      descripcion: 'Comenzar El Código del Despertar',
      icon: '🌟',
      points: 10,
      condition: (progress) => progress['prologo'] || progress['cap1']
    },
    {
      id: 'codigo-mitad',
      titulo: 'Viajero Interior',
      descripcion: 'Completar la mitad del libro',
      icon: '🧭',
      points: 50,
      condition: (progress) => {
        const completados = Object.values(progress).filter(x => x).length;
        return completados >= 7;
      }
    },
    {
      id: 'codigo-completo',
      titulo: 'Despierto',
      descripcion: 'Completar El Código del Despertar',
      icon: '☀️',
      points: 100,
      condition: (progress) => {
        const chapters = ['prologo', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7',
                         'cap8', 'cap9', 'cap10', 'cap11', 'cap12', 'cap13', 'cap14'];
        return chapters.filter(ch => progress[ch]).length >= 14;
      }
    },
    {
      id: 'codigo-meditador',
      titulo: 'Meditador',
      descripcion: 'Completar un ejercicio de meditación',
      icon: '🧘',
      points: 30,
      condition: (stats) => stats.meditationsCompleted >= 1
    },
    {
      id: 'codigo-koan',
      titulo: 'Contemplador de Koans',
      descripcion: 'Generar 3 koans',
      icon: '🎋',
      points: 25,
      condition: (stats) => stats.koansGenerated >= 3
    }
  ],

  // ==========================================================================
  // LOGROS ESPECÍFICOS: MANUAL DE TRANSICIÓN
  // ==========================================================================
  'manual-transicion': [
    {
      id: 'manual-inicio',
      titulo: 'Transicionador',
      descripcion: 'Comenzar el Manual de Transición',
      icon: '🛠️',
      points: 10,
      condition: (progress) => progress['parte1']
    },
    {
      id: 'manual-completo',
      titulo: 'Preparado',
      descripcion: 'Completar el Manual de Transición',
      icon: '✅',
      points: 75,
      condition: (progress) => {
        const parts = ['parte1', 'parte2', 'parte3', 'parte4'];
        return parts.every(p => progress[p]);
      }
    }
  ],

  // ==========================================================================
  // LOGROS ESPECÍFICOS: TOOLKIT
  // ==========================================================================
  'toolkit-transicion': [
    {
      id: 'toolkit-inicio',
      titulo: 'Equipado',
      descripcion: 'Abrir el Toolkit de Transición',
      icon: '🧰',
      points: 10,
      condition: (progress) => Object.values(progress).some(x => x)
    }
  ],

  // ==========================================================================
  // LOGROS ESPECÍFICOS: GUÍA DE ACCIONES
  // ==========================================================================
  'guia-acciones': [
    {
      id: 'guia-inicio',
      titulo: 'Activista',
      descripcion: 'Comenzar la Guía de Acciones',
      icon: '✊',
      points: 10,
      condition: (progress) => Object.values(progress).some(x => x)
    }
  ]
};

// Exportar
window.ACHIEVEMENTS = ACHIEVEMENTS;
