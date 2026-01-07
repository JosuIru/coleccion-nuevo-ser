// ============================================================================
// PREGUNTAS REFLEXIVAS - Datos por libro y capítulo
// ============================================================================

const REFLEXIVE_QUESTIONS = {
  'manifiesto': {
    'prologo': [
      '¿Qué sistema en tu vida funciona "automáticamente" sin que lo cuestiones?',
      '¿Cuándo fue la última vez que te detuviste a pensar si el camino que sigues es el tuyo?'
    ],
    'cap1': [
      '¿A qué sistema te beneficias sin cuestionarlo?',
      '¿Qué "verdad" asumiste como natural que ahora ves como construida?',
      '¿Qué pasaría si mañana todo el mundo dejara de creer en el dinero?'
    ],
    'cap2': [
      '¿Cómo sería tu vida si trabajaras solo para cubrir necesidades reales?',
      '¿Qué tareas haces por obligación que podrían desaparecer en un sistema diferente?',
      '¿Cuántas horas de tu semana dedicas a "mantener el sistema"?'
    ],
    'cap3': [
      '¿Qué recurso natural cercano a ti está siendo explotado insosteniblemente?',
      '¿Podrías vivir con la mitad de lo que consumes actualmente?',
      '¿Qué heredarán tus hijos si nada cambia?'
    ],
    'cap4': [
      '¿Qué premisa "obvia" sobre la economía podrías estar equivocado?',
      '¿Has experimentado alguna vez una forma de intercambio no monetario?',
      '¿Qué cosas valiosas en tu vida no tienen precio?'
    ],
    'cap5': [
      '¿Conoces alguna comunidad que funcione con principios diferentes?',
      '¿Qué experimento pequeño podrías hacer esta semana?',
      '¿Con quién podrías compartir estas ideas?'
    ],
    'cap6': [
      '¿Qué acción concreta puedes tomar HOY?',
      '¿Quién en tu círculo cercano estaría dispuesto a escuchar?',
      '¿Qué miedo te impide actuar diferente?'
    ],
    'cap7': [
      '¿Cómo imaginas tu vida en 10 años si estas ideas se materializan?',
      '¿Qué estarías dispuesto a perder para ganar un mundo mejor?',
      '¿Cuál es tu primer paso?'
    ]
  },

  'codigo-despertar': {
    'prologo': [
      '¿Alguna vez has tenido la sensación de que hay algo más allá de lo visible?',
      '¿Qué te trajo a leer este libro precisamente ahora?'
    ],
    'cap1': [
      '¿Cómo cambiaría tu vida si entendieras que TODO es información?',
      '¿Qué sistema en tu vida podría verse como "código ejecutable"?',
      '¿Cuándo fue la última vez que cuestionaste una "realidad" dada?'
    ],
    'cap2': [
      '¿De dónde surge el "yo" que observa?',
      '¿Qué diferencia hay entre procesar información y entenderla?',
      'Si replicaran exactamente tu cerebro, ¿serías tú?'
    ],
    'cap3': [
      '¿Has experimentado alguna vez una "sincronicidad" inexplicable?',
      '¿Qué fenómeno cuántico te resulta más inquietante?',
      '¿Cómo influye el observador en tu vida diaria?'
    ],
    'cap4': [
      '¿Qué significa para ti "estar consciente"?',
      '¿Has tenido momentos de consciencia expandida?',
      '¿Crees que las máquinas pueden llegar a ser conscientes?'
    ],
    'cap5': [
      '¿Qué patrón se repite en tu vida que podrías cambiar?',
      '¿Cómo influyen tus pensamientos en tu realidad?',
      '¿Qué "programa" mental te gustaría desinstalar?'
    ],
    'cap6': [
      '¿Qué práctica contemplativa has probado?',
      '¿Cuándo fue la última vez que estuviste completamente presente?',
      '¿Qué obstáculo interno te impide meditar regularmente?'
    ],
    'cap7': [
      '¿Cómo sería tu vida si vivieras desde la consciencia plena?',
      '¿Qué legado quieres dejar?',
      '¿Cuál es tu próximo paso en el camino del despertar?'
    ]
  },

  'manual-transicion': {
    'parte1': [
      '¿Qué aspecto de tu vida sientes que necesita más urgentemente una transición?',
      '¿Qué recurso comunitario podrías empezar a usar o crear?'
    ],
    'parte2': [
      '¿Qué habilidad práctica te gustaría aprender para ser más autosuficiente?',
      '¿Conoces a alguien con quien podrías formar un grupo de apoyo mutuo?'
    ],
    'parte3': [
      '¿Qué herramienta del manual te parece más aplicable a tu situación?',
      '¿Qué primer paso concreto puedes dar esta semana?'
    ],
    'parte4': [
      '¿Cómo te imaginas tu comunidad en 5 años si aplicas estas ideas?',
      '¿Con quién compartirás lo que has aprendido?'
    ]
  },

  'toolkit-transicion': {
    'intro': [
      '¿Qué herramienta del toolkit te llama más la atención?',
      '¿Qué obstáculo práctico anticipas al usar estas herramientas?'
    ],
    'herramientas': [
      '¿Cuál de estas herramientas podrías aplicar hoy mismo?',
      '¿Qué adaptación local necesitaría esta herramienta?'
    ]
  },

  'guia-acciones': {
    'intro': [
      '¿Qué acción de la guía resuena más contigo?',
      '¿Qué te ha impedido actuar hasta ahora?'
    ],
    'acciones': [
      '¿Cuál es la acción más pequeña que puedes tomar ahora mismo?',
      '¿Quién en tu red podría unirse a esta acción?'
    ]
  }
};

// Función para obtener pregunta aleatoria
function getRandomQuestion(bookId, chapterId) {
  const bookQuestions = REFLEXIVE_QUESTIONS[bookId];
  if (!bookQuestions) return null;

  const chapterQuestions = bookQuestions[chapterId];
  if (!chapterQuestions || chapterQuestions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * chapterQuestions.length);
  return chapterQuestions[randomIndex];
}

// Exportar para uso global
window.REFLEXIVE_QUESTIONS = REFLEXIVE_QUESTIONS;
window.getRandomQuestion = getRandomQuestion;
