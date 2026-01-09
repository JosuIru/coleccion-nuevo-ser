// ============================================================================
// MICRO-COURSES - Sistema de Cursos de 30 Días
// ============================================================================
// v2.9.331: Cursos estructurados con lecciones diarias detalladas
// Notificaciones, tracking de progreso, streaks por curso
// Contenido expandido con 6+ cursos y lecciones completas

class MicroCourses {
  constructor() {
    this.modalElement = null;
    this.enrolledCourses = this.loadEnrolledCourses();
    this.courseProgress = this.loadCourseProgress();

    // Cursos disponibles
    this.courses = this.initCourses();
  }

  // ==========================================================================
  // DATOS DE CURSOS EXPANDIDOS
  // ==========================================================================

  initCourses() {
    return {
      // =====================================================================
      // CURSO 1: 30 DÍAS DE DESPERTAR
      // =====================================================================
      'despertar-30': {
        id: 'despertar-30',
        title: '30 Días de Despertar',
        subtitle: 'Transformación Consciente',
        description: 'Un viaje de 30 días para despertar tu consciencia. Cada día incluye una lectura profunda, reflexiones guiadas y prácticas transformadoras.',
        bookId: 'el-codigo-del-despertar',
        duration: 30,
        difficulty: 'principiante',
        icon: '🌅',
        color: 'from-amber-500 to-orange-500',
        benefits: [
          'Mayor claridad mental',
          'Reducción del estrés',
          'Conexión con tu esencia',
          'Hábitos de consciencia'
        ],
        lessons: this.getDespertarLessons()
      },

      // =====================================================================
      // CURSO 2: 21 DÍAS DE MEDITACIÓN
      // =====================================================================
      'meditacion-21': {
        id: 'meditacion-21',
        title: '21 Días de Meditación',
        subtitle: 'Práctica Diaria Progresiva',
        description: 'Establece una práctica de meditación sólida en 21 días. Ejercicios progresivos de 5 a 30 minutos con técnicas variadas.',
        bookId: 'practicas-radicales',
        duration: 21,
        difficulty: 'principiante',
        icon: '🧘',
        color: 'from-purple-500 to-indigo-500',
        benefits: [
          'Calma mental duradera',
          'Mejor concentración',
          'Gestión emocional',
          'Paz interior'
        ],
        lessons: this.getMeditationLessons()
      },

      // =====================================================================
      // CURSO 3: 14 DÍAS DE TRANSFORMACIÓN INTENSIVA
      // =====================================================================
      'transformacion-14': {
        id: 'transformacion-14',
        title: '14 Días de Transformación',
        subtitle: 'Cambio Intensivo',
        description: 'Un programa intensivo de 2 semanas diseñado para catalizar cambios profundos en tu vida. Ejercicios potentes y reflexiones transformadoras.',
        bookId: 'manual-practico',
        duration: 14,
        difficulty: 'intermedio',
        icon: '🦋',
        color: 'from-emerald-500 to-teal-500',
        benefits: [
          'Romper patrones limitantes',
          'Nueva perspectiva de vida',
          'Claridad de propósito',
          'Acción consciente'
        ],
        lessons: this.getTransformationLessons()
      },

      // =====================================================================
      // CURSO 4: 7 DÍAS DE GRATITUD
      // =====================================================================
      'gratitud-7': {
        id: 'gratitud-7',
        title: '7 Días de Gratitud',
        subtitle: 'El Poder del Agradecimiento',
        description: 'Una semana para transformar tu perspectiva a través de la gratitud consciente. Ejercicios simples pero profundamente efectivos.',
        bookId: null,
        duration: 7,
        difficulty: 'principiante',
        icon: '🙏',
        color: 'from-pink-500 to-rose-500',
        benefits: [
          'Positividad aumentada',
          'Mejor bienestar emocional',
          'Relaciones más profundas',
          'Apreciación de la vida'
        ],
        lessons: this.getGratitudeLessons()
      },

      // =====================================================================
      // CURSO 5: 30 DÍAS DE MINDFULNESS
      // =====================================================================
      'mindfulness-30': {
        id: 'mindfulness-30',
        title: '30 Días de Mindfulness',
        subtitle: 'Atención Plena en la Vida Diaria',
        description: 'Integra la atención plena en cada aspecto de tu vida. Desde comer consciente hasta comunicación mindful, transforma tu día a día.',
        bookId: null,
        duration: 30,
        difficulty: 'intermedio',
        icon: '🌿',
        color: 'from-green-500 to-emerald-500',
        benefits: [
          'Presencia constante',
          'Reducción de ansiedad',
          'Mayor disfrute de la vida',
          'Respuestas conscientes'
        ],
        lessons: this.getMindfulnessLessons()
      },

      // =====================================================================
      // CURSO 6: 10 DÍAS DE SILENCIO INTERIOR
      // =====================================================================
      'silencio-10': {
        id: 'silencio-10',
        title: '10 Días de Silencio Interior',
        subtitle: 'Encuentro con tu Esencia',
        description: 'Un retiro interior de 10 días para conectar con el silencio profundo que habita en ti. Prácticas contemplativas avanzadas.',
        bookId: null,
        duration: 10,
        difficulty: 'avanzado',
        icon: '🌙',
        color: 'from-slate-600 to-slate-800',
        benefits: [
          'Silencio mental profundo',
          'Conexión espiritual',
          'Claridad absoluta',
          'Paz imperturbable'
        ],
        lessons: this.getSilenceLessons()
      }
    };
  }

  // ==========================================================================
  // LECCIONES: 30 DÍAS DE DESPERTAR
  // ==========================================================================

  getDespertarLessons() {
    return [
      // Semana 1: Fundamentos
      {
        day: 1,
        title: 'El Despertar Comienza',
        theme: 'Introducción',
        readingTime: 15,
        practiceTime: 10,
        content: `Hoy marcas el inicio de un viaje transformador. El despertar no es un destino, sino un proceso continuo de mayor consciencia.`,
        practice: {
          name: 'Respiración Consciente',
          duration: 10,
          steps: [
            'Siéntate cómodamente con la espalda recta',
            'Cierra los ojos suavemente',
            'Respira naturalmente y observa',
            'Nota cada inhalación y exhalación',
            'Si tu mente divaga, vuelve gentilmente a la respiración'
          ]
        },
        reflection: '¿Qué significa para ti "despertar"? ¿Qué esperas de este viaje?',
        quote: { text: 'El viaje de mil millas comienza con un solo paso.', author: 'Lao Tse' }
      },
      {
        day: 2,
        title: 'El Momento Presente',
        theme: 'Presencia',
        readingTime: 12,
        practiceTime: 15,
        content: `El presente es el único momento real. El pasado ya no existe y el futuro aún no ha llegado. Solo en el ahora podemos experimentar la vida plenamente.`,
        practice: {
          name: 'Anclaje en el Ahora',
          duration: 15,
          steps: [
            'Detén lo que estás haciendo',
            'Nombra 5 cosas que puedes ver',
            'Nombra 4 cosas que puedes tocar',
            'Nombra 3 cosas que puedes oír',
            'Nombra 2 cosas que puedes oler',
            'Nombra 1 cosa que puedes saborear'
          ]
        },
        reflection: '¿Cuánto tiempo pasas en el presente versus perdido en pensamientos del pasado o futuro?',
        quote: { text: 'El ayer es historia, el mañana es un misterio, pero el hoy es un regalo. Por eso se llama presente.', author: 'Bil Keane' }
      },
      {
        day: 3,
        title: 'El Observador Interior',
        theme: 'Consciencia Testigo',
        readingTime: 15,
        practiceTime: 12,
        content: `Dentro de ti existe un observador silencioso que puede ver tus pensamientos sin ser arrastrado por ellos. Este testigo es tu verdadera naturaleza.`,
        practice: {
          name: 'Meditación del Testigo',
          duration: 12,
          steps: [
            'Siéntate en silencio',
            'Observa tus pensamientos como nubes que pasan',
            'No te identifiques con ellos',
            'Pregúntate: ¿Quién está observando?',
            'Permanece como el observador, no como lo observado'
          ]
        },
        reflection: '¿Puedes distinguir entre tú como observador y tus pensamientos?',
        quote: { text: 'Tú no eres tus pensamientos. Eres el que observa los pensamientos.', author: 'Eckhart Tolle' }
      },
      {
        day: 4,
        title: 'La Ilusión del Ego',
        theme: 'Autoconocimiento',
        readingTime: 18,
        practiceTime: 10,
        content: `El ego es una construcción mental que crea la ilusión de separación. Reconocer sus mecanismos es el primer paso para trascenderlo.`,
        practice: {
          name: 'Observación del Ego',
          duration: 10,
          steps: [
            'A lo largo del día, nota cuando el ego reacciona',
            'Observa defensividad, comparación, juicio',
            'No intentes cambiar, solo observa',
            'Anota tus observaciones al final del día'
          ]
        },
        reflection: '¿En qué situaciones tu ego se activa más fuertemente?',
        quote: { text: 'El ego no es quien realmente eres. El ego es la imagen que tienes de ti mismo.', author: 'Wayne Dyer' }
      },
      {
        day: 5,
        title: 'Aceptación Radical',
        theme: 'Rendición',
        readingTime: 15,
        practiceTime: 15,
        content: `Aceptar no significa resignarse. Significa dejar de luchar contra lo que es, para poder responder conscientemente desde un lugar de paz.`,
        practice: {
          name: 'Práctica de Aceptación',
          duration: 15,
          steps: [
            'Piensa en algo que estés resistiendo',
            'Siente la resistencia en tu cuerpo',
            'Respira profundamente hacia esa tensión',
            'Repite internamente: "Lo acepto tal como es"',
            'Observa cómo se suaviza la resistencia'
          ]
        },
        reflection: '¿Qué aspecto de tu vida necesita más aceptación?',
        quote: { text: 'Lo que resistes, persiste. Lo que aceptas, se transforma.', author: 'Carl Jung' }
      },
      {
        day: 6,
        title: 'El Poder de la Pausa',
        theme: 'Respuesta Consciente',
        readingTime: 12,
        practiceTime: 20,
        content: `Entre estímulo y respuesta hay un espacio. En ese espacio está nuestro poder para elegir nuestra respuesta. En nuestra respuesta yace nuestro crecimiento y libertad.`,
        practice: {
          name: 'La Pausa Sagrada',
          duration: 20,
          steps: [
            'Hoy, antes de responder a cualquier situación, haz una pausa',
            'Toma 3 respiraciones profundas',
            'Pregúntate: ¿Cuál es la respuesta más consciente?',
            'Luego actúa desde ese lugar de claridad'
          ]
        },
        reflection: '¿Cómo cambiaron tus interacciones hoy al incorporar la pausa?',
        quote: { text: 'Entre estímulo y respuesta hay un espacio. En ese espacio está nuestra libertad.', author: 'Viktor Frankl' }
      },
      {
        day: 7,
        title: 'Día de Integración',
        theme: 'Reflexión Semanal',
        readingTime: 10,
        practiceTime: 30,
        content: `Has completado la primera semana. Hoy es día de descanso activo: revisa lo aprendido, integra las prácticas, y celebra tu compromiso.`,
        practice: {
          name: 'Integración Semanal',
          duration: 30,
          steps: [
            'Revisa tus notas de la semana',
            'Practica tu meditación favorita por 15 minutos',
            'Escribe un resumen de tus insights principales',
            'Establece una intención para la próxima semana'
          ]
        },
        reflection: '¿Cuál ha sido el aprendizaje más significativo de esta semana?',
        quote: { text: 'El descanso no es ociosidad, es preparación para una nueva creación.', author: 'John Lubbock' }
      },

      // Semana 2: Profundización
      {
        day: 8,
        title: 'La Mente Silenciosa',
        theme: 'Quietud Mental',
        readingTime: 15,
        practiceTime: 20,
        content: `Debajo del ruido mental hay un océano de quietud. Aprender a acceder a ese silencio es una de las habilidades más valiosas que puedes desarrollar.`,
        practice: {
          name: 'Meditación del Silencio',
          duration: 20,
          steps: [
            'Busca un lugar tranquilo',
            'Siéntate con los ojos cerrados',
            'No intentes detener los pensamientos',
            'Busca el espacio entre los pensamientos',
            'Descansa en ese silencio, por breve que sea',
            'Gradualmente, el silencio se expandirá'
          ]
        },
        reflection: '¿Qué descubres en los momentos de silencio mental?',
        quote: { text: 'El silencio no es la ausencia de sonido, sino la presencia de la paz.', author: 'Anónimo' }
      },
      {
        day: 9,
        title: 'Emociones como Maestras',
        theme: 'Inteligencia Emocional',
        readingTime: 18,
        practiceTime: 15,
        content: `Las emociones no son el enemigo. Son mensajeras que nos muestran dónde necesitamos atención, sanación o crecimiento.`,
        practice: {
          name: 'RAIN para Emociones',
          duration: 15,
          steps: [
            'R - Reconoce: ¿Qué emoción estás sintiendo?',
            'A - Acepta: Permite que esté ahí sin juzgar',
            'I - Investiga: ¿Dónde la sientes en el cuerpo?',
            'N - No-identificación: Recuerda que no eres la emoción'
          ]
        },
        reflection: '¿Qué emoción difícil está pidiendo tu atención actualmente?',
        quote: { text: 'Las emociones son la puerta de entrada al alma.', author: 'Karla McLaren' }
      },
      {
        day: 10,
        title: 'El Cuerpo Consciente',
        theme: 'Encarnación',
        readingTime: 12,
        practiceTime: 25,
        content: `El despertar no es solo mental. El cuerpo guarda sabiduría ancestral y es nuestro ancla al momento presente.`,
        practice: {
          name: 'Body Scan Consciente',
          duration: 25,
          steps: [
            'Acuéstate cómodamente',
            'Lleva la atención a los pies',
            'Sube lentamente por todo el cuerpo',
            'Nota sensaciones sin juzgar',
            'Envía agradecimiento a cada parte',
            'Termina sintiendo el cuerpo como un todo'
          ]
        },
        reflection: '¿Qué partes de tu cuerpo tienden a acumular tensión? ¿Qué mensaje podrían tener?',
        quote: { text: 'El cuerpo es el templo del espíritu.', author: 'San Pablo' }
      },
      {
        day: 11,
        title: 'Patrones y Programas',
        theme: 'Desidentificación',
        readingTime: 20,
        practiceTime: 15,
        content: `Muchos de nuestros comportamientos son patrones automáticos heredados o aprendidos. Verlos con claridad es el primer paso para transformarlos.`,
        practice: {
          name: 'Mapeo de Patrones',
          duration: 15,
          steps: [
            'Identifica un comportamiento repetitivo tuyo',
            'Traza su origen: ¿Cuándo empezó?',
            'Observa el disparador que lo activa',
            'Nota el beneficio secundario que obtiene',
            'Pregunta: ¿Este patrón me sirve hoy?'
          ]
        },
        reflection: '¿Qué patrón limitante estás listo para soltar?',
        quote: { text: 'Hasta que lo inconsciente no se haga consciente, dirigirá tu vida y lo llamarás destino.', author: 'Carl Jung' }
      },
      {
        day: 12,
        title: 'La Sombra',
        theme: 'Integración',
        readingTime: 20,
        practiceTime: 20,
        content: `La sombra contiene todo lo que rechazamos de nosotros mismos. Integrarla es esencial para la totalidad y el despertar auténtico.`,
        practice: {
          name: 'Encuentro con la Sombra',
          duration: 20,
          steps: [
            'Piensa en alguien que te irrita profundamente',
            'Identifica la cualidad específica que te molesta',
            'Pregúntate: ¿Dónde existe esa cualidad en mí?',
            'Observa sin juicio',
            'Envía compasión a esa parte de ti'
          ]
        },
        reflection: '¿Qué aspecto de ti mismo has estado evitando ver?',
        quote: { text: 'Lo que niegas te somete. Lo que aceptas te transforma.', author: 'Carl Jung' }
      },
      {
        day: 13,
        title: 'Conexión Universal',
        theme: 'Unidad',
        readingTime: 15,
        practiceTime: 15,
        content: `La separación es una ilusión. En esencia, todos estamos conectados en una red de vida interdependiente.`,
        practice: {
          name: 'Meditación de Conexión',
          duration: 15,
          steps: [
            'Cierra los ojos y respira profundo',
            'Siente tu conexión con la tierra',
            'Expande tu consciencia a tu entorno',
            'Siente a todos los seres que comparten este momento',
            'Reconoce la red de vida que te sostiene'
          ]
        },
        reflection: '¿Cómo cambiaría tu vida si sintieras constantemente esta conexión?',
        quote: { text: 'No somos seres humanos teniendo una experiencia espiritual. Somos seres espirituales teniendo una experiencia humana.', author: 'Pierre Teilhard de Chardin' }
      },
      {
        day: 14,
        title: 'Día de Integración',
        theme: 'Reflexión Semanal',
        readingTime: 10,
        practiceTime: 30,
        content: `Segunda semana completada. Has profundizado en territorios importantes. Hoy, integra y descansa.`,
        practice: {
          name: 'Ritual de Media Trayectoria',
          duration: 30,
          steps: [
            'Medita 15 minutos en gratitud por tu proceso',
            'Escribe los 5 insights más importantes hasta ahora',
            'Identifica qué práctica resonó más contigo',
            'Establece tu intención para las próximas 2 semanas'
          ]
        },
        reflection: '¿Cómo te sientes diferente comparado con el día 1?',
        quote: { text: 'En el medio del camino de nuestra vida, me encontré en una selva oscura.', author: 'Dante Alighieri' }
      },

      // Semana 3: Expansión
      ...this.generateWeek3DespertarLessons(),

      // Semana 4: Integración
      ...this.generateWeek4DespertarLessons()
    ];
  }

  generateWeek3DespertarLessons() {
    return [
      {
        day: 15, title: 'Intención Consciente', theme: 'Propósito',
        readingTime: 15, practiceTime: 15,
        content: 'La intención es la semilla de toda creación. Establecer intenciones claras alinea tu energía con tus aspiraciones más elevadas.',
        practice: { name: 'Establecimiento de Intención', duration: 15, steps: ['Define una intención clara para este período', 'Siéntela en tu cuerpo', 'Visualízala manifestada', 'Suéltala con confianza'] },
        reflection: '¿Cuál es tu intención más profunda para tu vida?',
        quote: { text: 'La intención es la fuerza creativa que satisface todas nuestras necesidades.', author: 'Deepak Chopra' }
      },
      {
        day: 16, title: 'Escucha Profunda', theme: 'Comunicación Consciente',
        readingTime: 12, practiceTime: 20,
        content: 'Escuchar verdaderamente es un acto de amor y presencia. Requiere silenciar la mente que prepara respuestas.',
        practice: { name: 'Práctica de Escucha', duration: 20, steps: ['En tu próxima conversación, escucha sin preparar respuesta', 'Nota las sensaciones en tu cuerpo mientras escuchas', 'Observa el impulso de interrumpir', 'Haz preguntas desde la curiosidad genuina'] },
        reflection: '¿Qué descubres cuando realmente escuchas a otro?',
        quote: { text: 'La escucha más profunda es aquella que escucha el silencio detrás de las palabras.', author: 'Thich Nhat Hanh' }
      },
      {
        day: 17, title: 'Gratitud Transformadora', theme: 'Abundancia',
        readingTime: 10, practiceTime: 25,
        content: 'La gratitud transforma lo que tenemos en suficiente. Es la puerta de entrada a la abundancia verdadera.',
        practice: { name: 'Inmersión en Gratitud', duration: 25, steps: ['Escribe 20 cosas por las que estás agradecido', 'Incluye cosas obvias y sutiles', 'Siente cada una en tu corazón', 'Termina agradeciendo tu propia consciencia'] },
        reflection: '¿Cómo cambia tu perspectiva cuando te enfocas en la gratitud?',
        quote: { text: 'La gratitud no es solo la mayor de las virtudes, sino la madre de todas las demás.', author: 'Cicerón' }
      },
      {
        day: 18, title: 'El Arte de Soltar', theme: 'Desapego',
        readingTime: 18, practiceTime: 15,
        content: 'Soltar no es perder, es liberar. Aferrarse crea sufrimiento; soltar crea espacio para lo nuevo.',
        practice: { name: 'Ceremonia de Soltar', duration: 15, steps: ['Identifica algo que necesitas soltar', 'Escríbelo en un papel', 'Agradécele lo que te enseñó', 'Quema o rompe el papel simbólicamente', 'Respira profundo y suelta'] },
        reflection: '¿Qué estás listo para soltar en tu vida?',
        quote: { text: 'Cuando dejas ir lo que eres, te conviertes en lo que podrías ser.', author: 'Lao Tse' }
      },
      {
        day: 19, title: 'Creatividad Consciente', theme: 'Expresión',
        readingTime: 12, practiceTime: 30,
        content: 'La creatividad es la expresión natural del ser despierto. Cuando fluimos con la vida, la creatividad emerge naturalmente.',
        practice: { name: 'Expresión Libre', duration: 30, steps: ['Elige un medio: escribir, dibujar, movimiento', 'Sin planificar, comienza a expresar', 'No juzgues lo que emerge', 'Permite que la creatividad fluya', 'Observa qué surge desde el silencio'] },
        reflection: '¿Qué quiere expresarse a través de ti?',
        quote: { text: 'La creatividad requiere el coraje de soltar las certezas.', author: 'Erich Fromm' }
      },
      {
        day: 20, title: 'Compasión Activa', theme: 'Amor',
        readingTime: 15, practiceTime: 20,
        content: 'La compasión es el corazón del despertar. Es la respuesta natural cuando vemos que todos los seres buscan la felicidad y temen el sufrimiento.',
        practice: { name: 'Tonglen', duration: 20, steps: ['Siéntate en quietud', 'Piensa en alguien que sufre', 'Inhala su sufrimiento como humo negro', 'Transfórmalo en tu corazón', 'Exhala luz y alivio hacia ellos'] },
        reflection: '¿Cómo puedes expresar más compasión en tu vida diaria?',
        quote: { text: 'Si quieres que otros sean felices, practica la compasión. Si quieres ser feliz, practica la compasión.', author: 'Dalai Lama' }
      },
      {
        day: 21, title: 'Día de Integración', theme: 'Reflexión Semanal',
        readingTime: 10, practiceTime: 30,
        content: 'Tres semanas completadas. Has expandido significativamente tu consciencia. Celebra tu dedicación.',
        practice: { name: 'Celebración Consciente', duration: 30, steps: ['Medita 20 minutos', 'Revisa tu diario del proceso', 'Escribe una carta a tu yo del día 1', 'Prepárate para la última semana'] },
        reflection: '¿Qué versión de ti mismo está emergiendo?',
        quote: { text: 'No es la montaña lo que conquistamos, sino a nosotros mismos.', author: 'Edmund Hillary' }
      }
    ];
  }

  generateWeek4DespertarLessons() {
    return [
      {
        day: 22, title: 'Vivir Despierto', theme: 'Integración Diaria',
        readingTime: 15, practiceTime: 20,
        content: 'El verdadero despertar se mide en cómo vives cada momento ordinario, no en experiencias extraordinarias.',
        practice: { name: 'Mindfulness en Acción', duration: 20, steps: ['Elige 3 actividades rutinarias hoy', 'Realízalas con total presencia', 'Nota cada sensación, cada movimiento', 'Transforma lo ordinario en extraordinario'] },
        reflection: '¿Cómo sería tu vida si cada momento fuera vivido con plena consciencia?',
        quote: { text: 'Antes de la iluminación, corta leña, carga agua. Después de la iluminación, corta leña, carga agua.', author: 'Proverbio Zen' }
      },
      {
        day: 23, title: 'Relaciones Conscientes', theme: 'Conexión',
        readingTime: 18, practiceTime: 15,
        content: 'Las relaciones son espejos y oportunidades para el crecimiento. Cada persona que encuentras es un maestro disfrazado.',
        practice: { name: 'Reflexión Relacional', duration: 15, steps: ['Piensa en tus 5 relaciones más importantes', 'Pregunta: ¿Qué me enseña cada una?', 'Identifica patrones que se repiten', 'Establece una intención para cada relación'] },
        reflection: '¿Qué patrones de relación estás listo para transformar?',
        quote: { text: 'Las personas entran en nuestras vidas por una razón, una temporada, o toda una vida.', author: 'Anónimo' }
      },
      {
        day: 24, title: 'Propósito y Servicio', theme: 'Dharma',
        readingTime: 20, practiceTime: 15,
        content: 'Tu propósito no es algo que encuentras, es algo que expresas. Emerge naturalmente cuando vives alineado con tu verdadera naturaleza.',
        practice: { name: 'Descubrimiento del Dharma', duration: 15, steps: ['¿Qué actividades te hacen perder la noción del tiempo?', '¿Qué harías aunque no te pagaran?', '¿Qué necesita el mundo que tú puedes ofrecer?', 'Encuentra la intersección de estas respuestas'] },
        reflection: '¿Cómo puedes servir al mundo desde tu singularidad?',
        quote: { text: 'El propósito de la vida es una vida de propósito.', author: 'Robert Byrne' }
      },
      {
        day: 25, title: 'La Muerte como Maestra', theme: 'Impermanencia',
        readingTime: 18, practiceTime: 20,
        content: 'Contemplar la muerte no es morboso, es liberador. Nos recuerda vivir plenamente y priorizar lo esencial.',
        practice: { name: 'Meditación Maranasati', duration: 20, steps: ['Siéntate en quietud', 'Contempla: Este cuerpo morirá algún día', 'Nota qué surge: ¿miedo? ¿paz? ¿urgencia?', 'Pregunta: Si muriera mañana, ¿estoy en paz con mi vida?', 'Deja que esta consciencia informe tus elecciones'] },
        reflection: '¿Qué harías diferente si supieras que este es tu último año?',
        quote: { text: 'La muerte es la única certeza en la vida. Vive como si fueras a morir mañana. Aprende como si fueras a vivir para siempre.', author: 'Gandhi' }
      },
      {
        day: 26, title: 'Celebrar la Vida', theme: 'Alegría',
        readingTime: 12, practiceTime: 25,
        content: 'La alegría no es la ausencia de dolor, sino la presencia de amor. Es nuestra naturaleza esencial cuando dejamos de resistir la vida.',
        practice: { name: 'Inmersión en la Alegría', duration: 25, steps: ['Recuerda un momento de alegría pura', 'Revive las sensaciones en tu cuerpo', 'Expande esa sensación', 'Permite que la alegría sea tu estado natural', 'Mantén esta frecuencia durante el día'] },
        reflection: '¿Qué te impide experimentar alegría más frecuentemente?',
        quote: { text: 'La alegría no está en las cosas; está en nosotros.', author: 'Richard Wagner' }
      },
      {
        day: 27, title: 'El Camino Continúa', theme: 'Compromiso',
        readingTime: 15, practiceTime: 20,
        content: 'El despertar no es un evento sino un proceso continuo. Cada día es una nueva oportunidad para profundizar.',
        practice: { name: 'Ritual de Compromiso', duration: 20, steps: ['Escribe tu visión para los próximos 90 días', 'Define 3 prácticas que mantendrás', 'Crea un espacio sagrado para tu práctica', 'Establece un momento fijo cada día'] },
        reflection: '¿Qué estructura necesitas para mantener tu práctica?',
        quote: { text: 'Somos lo que hacemos repetidamente. La excelencia no es un acto, sino un hábito.', author: 'Aristóteles' }
      },
      {
        day: 28, title: 'Compartir la Luz', theme: 'Transmisión',
        readingTime: 15, practiceTime: 20,
        content: 'Lo que has recibido, compártelo. La luz que guardas solo para ti eventualmente se apaga.',
        practice: { name: 'Práctica de Compartir', duration: 20, steps: ['Identifica a alguien que podría beneficiarse de lo que has aprendido', 'Comparte una práctica o insight con esa persona', 'Hazlo sin expectativas', 'Observa cómo dar enriquece tu propia comprensión'] },
        reflection: '¿Cómo puedes ser un faro de consciencia para otros?',
        quote: { text: 'Miles de velas pueden encenderse de una sola vela, y la vida de la vela no se acorta.', author: 'Buda' }
      },
      {
        day: 29, title: 'Integración Final', theme: 'Síntesis',
        readingTime: 20, practiceTime: 30,
        content: 'Prepárate para cerrar este ciclo con honra. Recoge la cosecha de tu trabajo interior.',
        practice: { name: 'Gran Integración', duration: 30, steps: ['Medita 15 minutos', 'Escribe los 10 aprendizajes principales', 'Crea tu propio mantra o afirmación', 'Diseña tu práctica diaria para el futuro', 'Prepara tu ritual de cierre'] },
        reflection: '¿Quién eras hace 30 días y quién eres ahora?',
        quote: { text: 'El final es solo un nuevo comienzo.', author: 'T.S. Eliot' }
      },
      {
        day: 30, title: 'Graduación',
        theme: 'Celebración',
        readingTime: 15,
        practiceTime: 40,
        content: '¡Lo lograste! 30 días de práctica consistente. Eres un guerrero de la consciencia. Este no es el final, es un nuevo comienzo más elevado.',
        practice: { name: 'Ceremonia de Cierre', duration: 40, steps: ['Crea un espacio sagrado', 'Enciende una vela', 'Lee tu carta del día 1', 'Medita en gratitud por tu viaje', 'Escribe una carta a tu yo del futuro', 'Establece tu próxima aventura de crecimiento'] },
        reflection: '¿Qué promesa te haces a ti mismo para mantener vivo este despertar?',
        quote: { text: 'No termino este curso más sabio, termino más despierto.', author: 'Tu Yo Despierto' }
      }
    ];
  }

  // ==========================================================================
  // LECCIONES: 21 DÍAS DE MEDITACIÓN
  // ==========================================================================

  getMeditationLessons() {
    const techniques = [
      { name: 'Respiración Consciente', duration: 5, focus: 'Observa tu respiración natural sin cambiarla', week: 1 },
      { name: 'Conteo de Respiraciones', duration: 7, focus: 'Cuenta hasta 10, luego reinicia', week: 1 },
      { name: 'Respiración 4-7-8', duration: 8, focus: 'Inhala 4s, mantén 7s, exhala 8s', week: 1 },
      { name: 'Escaneo Corporal Breve', duration: 10, focus: 'Recorre tu cuerpo de pies a cabeza', week: 1 },
      { name: 'Meditación de Anclaje', duration: 10, focus: 'Usa las sensaciones del cuerpo como ancla', week: 1 },
      { name: 'Atención al Presente', duration: 12, focus: 'Sé consciente de este momento único', week: 1 },
      { name: 'Integración Semana 1', duration: 15, focus: 'Practica tu técnica favorita de la semana', week: 1 },
      { name: 'Meditación del Corazón', duration: 12, focus: 'Lleva la atención al centro del pecho', week: 2 },
      { name: 'Loving-Kindness', duration: 15, focus: 'Envía amor a ti y a otros', week: 2 },
      { name: 'Compasión', duration: 15, focus: 'Cultiva compasión hacia el sufrimiento', week: 2 },
      { name: 'Observación de Pensamientos', duration: 15, focus: 'Observa pensamientos como nubes pasajeras', week: 2 },
      { name: 'Meditación del Testigo', duration: 18, focus: 'Sé el observador silencioso', week: 2 },
      { name: 'No-Hacer', duration: 18, focus: 'Simplemente ser, sin agenda', week: 2 },
      { name: 'Integración Semana 2', duration: 20, focus: 'Combina las técnicas aprendidas', week: 2 },
      { name: 'Silencio Profundo', duration: 20, focus: 'Descansa en el silencio entre pensamientos', week: 3 },
      { name: 'Consciencia Expandida', duration: 22, focus: 'Expande tu consciencia más allá del cuerpo', week: 3 },
      { name: 'Meditación de Vacuidad', duration: 22, focus: 'Descansa en el espacio de la consciencia pura', week: 3 },
      { name: 'Unidad', duration: 25, focus: 'Siente tu conexión con todo lo que existe', week: 3 },
      { name: 'Tu Práctica Personal', duration: 25, focus: 'Crea tu propia meditación integrando todo', week: 3 },
      { name: 'Meditación Extendida', duration: 30, focus: 'Sesión larga con todas las técnicas', week: 3 },
      { name: 'Graduación', duration: 30, focus: 'Celebra tu nueva práctica establecida', week: 3 }
    ];

    return techniques.map((tech, index) => ({
      day: index + 1,
      title: `Día ${index + 1}: ${tech.name}`,
      theme: `Semana ${tech.week}`,
      practiceTime: tech.duration,
      readingTime: 5,
      focus: tech.focus,
      practice: {
        name: tech.name,
        duration: tech.duration,
        steps: this.getMeditationSteps(tech.name)
      },
      reflection: `¿Cómo te sientes después de ${tech.duration} minutos de ${tech.name.toLowerCase()}?`,
      quote: this.getMeditationQuote(index)
    }));
  }

  getMeditationSteps(technique) {
    const steps = {
      'Respiración Consciente': ['Siéntate cómodamente', 'Cierra los ojos', 'Observa tu respiración natural', 'No la cambies, solo observa', 'Cuando divagues, vuelve gentilmente'],
      'Conteo de Respiraciones': ['Inhala y cuenta 1', 'Exhala', 'Inhala y cuenta 2', 'Continúa hasta 10', 'Reinicia en 1'],
      'Respiración 4-7-8': ['Inhala contando hasta 4', 'Mantén contando hasta 7', 'Exhala contando hasta 8', 'Repite 4 ciclos', 'Descansa en la calma'],
      'Loving-Kindness': ['Envía amor a ti mismo', 'Envía amor a alguien querido', 'Envía amor a alguien neutral', 'Envía amor a alguien difícil', 'Envía amor a todos los seres'],
      default: ['Siéntate con la espalda recta', 'Cierra los ojos suavemente', 'Relaja el cuerpo', 'Sigue las instrucciones del foco', 'Mantén la práctica con gentileza']
    };
    return steps[technique] || steps.default;
  }

  getMeditationQuote(day) {
    const quotes = [
      { text: 'La meditación no es evasión, es un encuentro sereno con la realidad.', author: 'Thich Nhat Hanh' },
      { text: 'Meditar no es huir del mundo, es prepararse mejor para él.', author: 'Anónimo' },
      { text: 'La mente es como el agua. Cuando está agitada es difícil ver. Cuando está calma, todo se vuelve claro.', author: 'Prasad Mahes' },
      { text: 'Siéntate. Quédate quieto. El mundo dará vueltas a tu alrededor.', author: 'Anónimo' },
      { text: 'Un momento de paciencia en un momento de ira te ahorra cien momentos de arrepentimiento.', author: 'Anónimo' }
    ];
    return quotes[day % quotes.length];
  }

  // ==========================================================================
  // LECCIONES: 14 DÍAS DE TRANSFORMACIÓN
  // ==========================================================================

  getTransformationLessons() {
    return [
      { day: 1, title: 'Reconocer el Cambio', theme: 'Iniciación', readingTime: 15, practiceTime: 20, content: 'Todo cambio comienza con el reconocimiento de que algo necesita transformarse.', practice: { name: 'Inventario Vital', duration: 20, steps: ['Lista las áreas de tu vida: salud, relaciones, trabajo, espiritualidad', 'Puntúa cada una del 1-10', 'Identifica las que necesitan transformación', 'Elige una para enfocar estas 2 semanas'] }, reflection: '¿Qué área de tu vida pide transformación más urgentemente?', quote: { text: 'El primer paso hacia el cambio es la consciencia.', author: 'Nathaniel Branden' } },
      { day: 2, title: 'Visión Clara', theme: 'Claridad', readingTime: 12, practiceTime: 25, content: 'Sin una visión clara, el cambio es errático. Define exactamente qué quieres crear.', practice: { name: 'Visualización del Futuro', duration: 25, steps: ['Cierra los ojos', 'Imagina tu vida transformada en 1 año', 'Usa todos los sentidos', 'Escribe la visión en detalle', 'Léela en voz alta'] }, reflection: '¿Cómo se ve tu vida transformada en detalle?', quote: { text: 'Si no sabes hacia dónde vas, cualquier camino te llevará allí.', author: 'Lewis Carroll' } },
      { day: 3, title: 'Creencias Limitantes', theme: 'Desbloqueo', readingTime: 18, practiceTime: 20, content: 'Las creencias son el filtro a través del cual creamos nuestra realidad. Algunas nos limitan sin que lo sepamos.', practice: { name: 'Excavación de Creencias', duration: 20, steps: ['Sobre el área a transformar, pregunta: ¿Qué creo sobre esto?', 'Lista todas las creencias', 'Identifica cuáles son limitantes', 'Para cada una, pregunta: ¿Es esto absolutamente verdad?'] }, reflection: '¿Qué creencia limitante descubriste hoy?', quote: { text: 'El que dice que puede y el que dice que no puede, ambos tienen razón.', author: 'Confucio' } },
      { day: 4, title: 'Nuevas Creencias', theme: 'Reprogramación', readingTime: 15, practiceTime: 25, content: 'Podemos elegir conscientemente nuevas creencias que nos empoderen.', practice: { name: 'Instalación de Creencias', duration: 25, steps: ['Toma cada creencia limitante del día 3', 'Crea una creencia opuesta y empoderadora', 'Escríbelas como afirmaciones en presente', 'Repítelas 10 veces cada una con emoción', 'Visualiza actuando desde la nueva creencia'] }, reflection: '¿Cómo te sientes al afirmar las nuevas creencias?', quote: { text: 'Cambia tus pensamientos y cambiarás tu mundo.', author: 'Norman Vincent Peale' } },
      { day: 5, title: 'Pequeños Pasos', theme: 'Acción', readingTime: 12, practiceTime: 30, content: 'La transformación ocurre un paso a la vez. Pequeñas acciones consistentes crean grandes cambios.', practice: { name: 'Micro-Acciones', duration: 30, steps: ['Define 3 acciones pequeñas hacia tu visión', 'Que sean tan pequeñas que sea imposible fallar', 'Realiza al menos una hoy', 'Programa las otras en tu calendario', 'Celebra cada paso completado'] }, reflection: '¿Qué pequeña acción tomaste hoy hacia tu transformación?', quote: { text: 'Un viaje de mil millas comienza con un solo paso.', author: 'Lao Tse' } },
      { day: 6, title: 'Resistencia', theme: 'Navegación', readingTime: 15, practiceTime: 20, content: 'La resistencia al cambio es natural. No es el enemigo, es información.', practice: { name: 'Diálogo con la Resistencia', duration: 20, steps: ['Nota dónde sientes resistencia en tu cuerpo', 'Pregúntale: ¿Qué intentas proteger?', 'Escucha la respuesta', 'Agradece su intención positiva', 'Negocia: ¿Cómo podemos avanzar juntos?'] }, reflection: '¿Qué descubriste sobre tu resistencia al cambio?', quote: { text: 'Lo que resistes, persiste.', author: 'Carl Jung' } },
      { day: 7, title: 'Integración Semana 1', theme: 'Consolidación', readingTime: 10, practiceTime: 35, content: 'Una semana de trabajo intenso. Descansa, integra, y prepárate para profundizar.', practice: { name: 'Revisión Semanal', duration: 35, steps: ['Revisa tus notas de la semana', 'Celebra tus avances', 'Identifica qué ajustar', 'Descansa profundamente', 'Prepara la mente para la semana 2'] }, reflection: '¿Cuál fue tu mayor descubrimiento esta semana?', quote: { text: 'El descanso no es holgazanería.', author: 'John Lubbock' } },
      { day: 8, title: 'Identidad Expandida', theme: 'Ser', readingTime: 18, practiceTime: 25, content: 'El cambio duradero requiere un cambio de identidad. No solo hacer diferente, sino ser diferente.', practice: { name: 'Declaración de Identidad', duration: 25, steps: ['Escribe: Yo soy una persona que...', 'Completa con cualidades de tu yo transformado', 'Siéntete como esa persona', 'Actúa hoy como esa persona actuaría'] }, reflection: '¿Quién eres en tu versión más elevada?', quote: { text: 'Sé el cambio que quieres ver en el mundo.', author: 'Gandhi' } },
      { day: 9, title: 'Entorno Consciente', theme: 'Diseño', readingTime: 12, practiceTime: 30, content: 'Tu entorno moldea tu comportamiento más de lo que crees. Diseña un entorno que apoye tu transformación.', practice: { name: 'Auditoría de Entorno', duration: 30, steps: ['Observa tu espacio físico', 'Identifica qué apoya tu cambio', 'Identifica qué lo obstaculiza', 'Haz 3 cambios pequeños hoy', 'Planifica cambios mayores'] }, reflection: '¿Cómo puedes diseñar tu entorno para apoyar tu transformación?', quote: { text: 'Somos el promedio de las 5 personas con las que pasamos más tiempo.', author: 'Jim Rohn' } },
      { day: 10, title: 'Hábitos Transformadores', theme: 'Rutinas', readingTime: 15, practiceTime: 25, content: 'Los hábitos son la arquitectura invisible de tu vida. Instala hábitos que automaticen tu transformación.', practice: { name: 'Stack de Hábitos', duration: 25, steps: ['Identifica un hábito existente sólido', 'Ancla un nuevo hábito transformador a él', 'Hazlo ridículamente pequeño al principio', 'Practica el stack 3 veces hoy', 'Celebra cada vez'] }, reflection: '¿Qué nuevo hábito instalarás?', quote: { text: 'Primero hacemos nuestros hábitos, luego nuestros hábitos nos hacen a nosotros.', author: 'John Dryden' } },
      { day: 11, title: 'Rendición de Cuentas', theme: 'Compromiso', readingTime: 12, practiceTime: 20, content: 'Compartir tu compromiso con otros multiplica tu capacidad de mantenerlo.', practice: { name: 'Sistema de Apoyo', duration: 20, steps: ['Identifica 1-3 personas de confianza', 'Comparte tu visión y compromiso con ellas', 'Pide que te pregunten regularmente', 'Agenda check-ins semanales', 'Ofrece el mismo apoyo a cambio'] }, reflection: '¿A quién puedes recurrir para apoyarte en tu transformación?', quote: { text: 'Solo, vas más rápido. Acompañado, llegas más lejos.', author: 'Proverbio Africano' } },
      { day: 12, title: 'Celebrar el Proceso', theme: 'Alegría', readingTime: 10, practiceTime: 30, content: 'La transformación sostenible incluye celebración. No esperes el resultado final para celebrar.', practice: { name: 'Fiesta del Proceso', duration: 30, steps: ['Lista todos tus avances hasta ahora', 'Celebra cada uno físicamente', 'Crea un ritual de celebración diaria', 'Comparte tu alegría con alguien', 'Planifica una recompensa para el día 14'] }, reflection: '¿Cómo puedes incorporar más celebración en tu proceso?', quote: { text: 'La alegría no es la meta del viaje; es el viaje mismo.', author: 'Anónimo' } },
      { day: 13, title: 'Visión Expandida', theme: 'Horizonte', readingTime: 15, practiceTime: 25, content: 'Con todo lo aprendido, es momento de expandir tu visión más allá de lo que creías posible.', practice: { name: 'Visión 10X', duration: 25, steps: ['Toma tu visión original', 'Multiplica su impacto por 10', '¿Cómo se vería?', '¿Qué tendría que ser verdad?', 'Permite que esta visión expandida te inspire'] }, reflection: '¿Qué sería posible si no tuvieras miedo?', quote: { text: 'Apunta a la luna. Incluso si fallas, aterrizarás entre las estrellas.', author: 'Les Brown' } },
      { day: 14, title: 'Nuevo Comienzo', theme: 'Renacimiento', readingTime: 15, practiceTime: 40, content: 'Hoy no es el final, es un nuevo comienzo. Has sembrado semillas de transformación que seguirán creciendo.', practice: { name: 'Ritual de Renacimiento', duration: 40, steps: ['Medita 15 minutos', 'Escribe una carta de despedida a tu antiguo yo', 'Escribe una carta de bienvenida a tu nuevo yo', 'Crea un plan de mantenimiento para los próximos 90 días', 'Celebra tu transformación'] }, reflection: '¿Quién estás eligiendo ser a partir de hoy?', quote: { text: 'No es que tenga que morir para renacer. Puedo renacer cada mañana.', author: 'Anónimo' } }
    ];
  }

  // ==========================================================================
  // LECCIONES: 7 DÍAS DE GRATITUD
  // ==========================================================================

  getGratitudeLessons() {
    return [
      { day: 1, title: 'Despertar a la Gratitud', readingTime: 10, practiceTime: 15, theme: 'Inicio', content: 'La gratitud es una práctica que transforma nuestra percepción de la realidad.', practice: { name: 'Lista de Gratitud', duration: 15, steps: ['Escribe 10 cosas por las que estás agradecido', 'Incluye cosas grandes y pequeñas', 'Siente cada una en tu corazón'] }, reflection: '¿Qué descubriste al hacer tu primera lista de gratitud?' },
      { day: 2, title: 'Gratitud por el Cuerpo', readingTime: 8, practiceTime: 20, theme: 'Cuerpo', content: 'Tu cuerpo te permite experimentar la vida. ¿Cuándo fue la última vez que le agradeciste?', practice: { name: 'Gratitud Corporal', duration: 20, steps: ['Siéntate cómodamente', 'Lleva atención a cada parte del cuerpo', 'Agradece específicamente: ojos, manos, corazón...'] }, reflection: '¿Qué parte de tu cuerpo merece más gratitud?' },
      { day: 3, title: 'Gratitud por las Personas', readingTime: 10, practiceTime: 25, theme: 'Relaciones', content: 'Las personas en tu vida son regalos. Hoy expresamos gratitud hacia ellas.', practice: { name: 'Cartas de Gratitud', duration: 25, steps: ['Elige 3 personas importantes en tu vida', 'Escribe una breve carta de agradecimiento a cada una', 'Si puedes, envíalas o léelas en persona'] }, reflection: '¿Cómo se sintió expresar gratitud directamente?' },
      { day: 4, title: 'Gratitud por los Desafíos', readingTime: 12, practiceTime: 20, theme: 'Crecimiento', content: 'Los desafíos son maestros disfrazados. ¿Puedes encontrar gratitud incluso en lo difícil?', practice: { name: 'Reencuadre de Desafíos', duration: 20, steps: ['Piensa en un desafío actual o pasado', 'Encuentra 3 cosas que te enseñó', 'Agradece esas lecciones'] }, reflection: '¿Qué desafío ahora puedes ver como un regalo?' },
      { day: 5, title: 'Gratitud Sensorial', readingTime: 8, practiceTime: 25, theme: 'Sentidos', content: 'Tus sentidos te conectan con la belleza del mundo. Hoy los honramos con gratitud.', practice: { name: 'Paseo de Gratitud Sensorial', duration: 25, steps: ['Da un paseo consciente', 'Nota 5 cosas hermosas que ves', 'Nota 3 sonidos agradables', 'Nota 2 texturas placenteras', 'Agradece cada experiencia sensorial'] }, reflection: '¿Qué belleza cotidiana habías pasado por alto?' },
      { day: 6, title: 'Gratitud Anticipatoria', readingTime: 10, practiceTime: 20, theme: 'Futuro', content: 'Podemos estar agradecidos no solo por lo que fue, sino por lo que será.', practice: { name: 'Gratitud por el Futuro', duration: 20, steps: ['Visualiza tu futuro ideal', 'Siéntelo como si ya existiera', 'Escribe una carta de gratitud desde ese futuro', 'Agradece por todo lo que "ya" tienes'] }, reflection: '¿Cómo cambia tu relación con el futuro al agradecer por él?' },
      { day: 7, title: 'Gratitud como Estilo de Vida', readingTime: 10, practiceTime: 30, theme: 'Integración', content: 'La gratitud no es algo que haces, es algo que eres. Hoy la integramos como forma de vida.', practice: { name: 'Ritual de Gratitud Diaria', duration: 30, steps: ['Diseña tu práctica de gratitud diaria', 'Define cuándo y dónde la harás', 'Crea un recordatorio', 'Comprométete a 21 días más', 'Celebra estos 7 días completados'] }, reflection: '¿Cómo continuarás cultivando la gratitud?' }
    ];
  }

  // ==========================================================================
  // LECCIONES: 30 DÍAS DE MINDFULNESS
  // ==========================================================================

  getMindfulnessLessons() {
    const activities = [
      'Comer', 'Caminar', 'Ducharse', 'Escuchar', 'Hablar', 'Trabajar', 'Descansar',
      'Relaciones', 'Emociones', 'Pensamientos', 'Naturaleza', 'Tecnología', 'Tiempo',
      'Cuerpo', 'Respiración', 'Sonido', 'Silencio', 'Movimiento', 'Quietud', 'Transiciones',
      'Mañana', 'Noche', 'Estrés', 'Alegría', 'Aburrimiento', 'Espera', 'Conducir',
      'Cocinar', 'Limpiar', 'Integración'
    ];

    return activities.map((activity, index) => ({
      day: index + 1,
      title: `Mindfulness al ${activity}`,
      theme: index < 10 ? 'Fundamentos' : index < 20 ? 'Profundización' : 'Integración',
      readingTime: 8,
      practiceTime: 15 + Math.floor(index / 10) * 5,
      content: `Hoy llevarás atención plena a ${activity.toLowerCase()}. Esta práctica transforma lo ordinario en extraordinario.`,
      practice: {
        name: `${activity} Consciente`,
        duration: 15 + Math.floor(index / 10) * 5,
        steps: [
          `Cuando ${activity.toLowerCase()}, hazlo con total presencia`,
          'Nota cada sensación, cada detalle',
          'Si la mente divaga, vuelve gentilmente',
          'No juzgues, solo observa',
          'Aprecia la experiencia completa'
        ]
      },
      reflection: `¿Qué notaste al ${activity.toLowerCase()} con atención plena?`
    }));
  }

  // ==========================================================================
  // LECCIONES: 10 DÍAS DE SILENCIO INTERIOR
  // ==========================================================================

  getSilenceLessons() {
    return [
      { day: 1, title: 'Entrada al Silencio', readingTime: 15, practiceTime: 30, theme: 'Preparación', content: 'El silencio no es la ausencia de sonido, sino la presencia de la paz. Hoy comenzamos el descenso hacia tu quietud interior.', practice: { name: 'Meditación Silenciosa', duration: 30, steps: ['Desconecta dispositivos', 'Siéntate en completo silencio', 'No hagas nada', 'Simplemente sé'] }, reflection: '¿Qué surge cuando no hay nada que hacer?' },
      { day: 2, title: 'El Ruido Interior', readingTime: 12, practiceTime: 35, theme: 'Observación', content: 'Antes de encontrar el silencio, debemos conocer el ruido. Hoy observamos sin resistir.', practice: { name: 'Escucha del Ruido Mental', duration: 35, steps: ['Siéntate en silencio externo', 'Observa el ruido de la mente', 'No lo silencies, escúchalo', 'Nota patrones y temas recurrentes'] }, reflection: '¿Qué tipo de pensamientos dominan tu mente?' },
      { day: 3, title: 'Entre los Pensamientos', readingTime: 10, practiceTime: 40, theme: 'Espacio', content: 'Entre pensamiento y pensamiento hay un espacio de silencio. Hoy buscamos ese espacio.', practice: { name: 'Meditación del Espacio', duration: 40, steps: ['Observa un pensamiento surgir', 'Observa otro pensamiento surgir', 'Nota el espacio entre ellos', 'Descansa en ese espacio'] }, reflection: '¿Qué encuentras en el espacio entre pensamientos?' },
      { day: 4, title: 'Silencio de Palabra', readingTime: 8, practiceTime: 45, theme: 'Noble Silencio', content: 'Hoy practicamos el noble silencio: minimizar las palabras para maximizar la consciencia.', practice: { name: 'Ayuno de Palabras', duration: 45, steps: ['Habla solo lo esencial hoy', 'Antes de hablar, pregunta: ¿Es necesario?', 'Nota cómo cambia tu experiencia', 'Medita 45 minutos en silencio total'] }, reflection: '¿Qué descubres cuando reduces las palabras?' },
      { day: 5, title: 'Día de Integración', readingTime: 10, practiceTime: 50, theme: 'Descanso', content: 'Mitad del camino. Descansa en lo que has descubierto.', practice: { name: 'Retiro Interior', duration: 50, steps: ['Medita libremente', 'No hay técnica correcta', 'Sigue lo que surge naturalmente'] }, reflection: '¿Cómo ha cambiado tu relación con el silencio?' },
      { day: 6, title: 'El Silencio que Escucha', readingTime: 12, practiceTime: 50, theme: 'Receptividad', content: 'El silencio verdadero es profundamente receptivo. Escucha sin filtro.', practice: { name: 'Escucha Pura', duration: 50, steps: ['Siéntate en silencio', 'Escucha todos los sonidos sin preferencia', 'Escucha el silencio detrás de los sonidos', 'Sé pura receptividad'] }, reflection: '¿Qué se revela cuando escuchas profundamente?' },
      { day: 7, title: 'Silencio del Corazón', readingTime: 10, practiceTime: 55, theme: 'Corazón', content: 'El corazón tiene su propio silencio, más profundo que el mental.', practice: { name: 'Meditación del Corazón Silencioso', duration: 55, steps: ['Lleva la atención al corazón', 'Escucha su silencio', 'Descansa ahí', 'Permite lo que surja'] }, reflection: '¿Qué encuentra tu corazón en el silencio?' },
      { day: 8, title: 'Vacuidad Luminosa', readingTime: 12, practiceTime: 60, theme: 'Profundidad', content: 'El silencio más profundo está vacío de contenido pero lleno de presencia.', practice: { name: 'Meditación de Vacuidad', duration: 60, steps: ['Suelta todo contenido mental', 'Suelta toda identidad', 'Descansa como consciencia pura', 'Sin centro, sin límites'] }, reflection: '¿Quién eres cuando no hay pensamientos?' },
      { day: 9, title: 'Silencio en Movimiento', readingTime: 8, practiceTime: 60, theme: 'Integración', content: 'El silencio interior puede mantenerse incluso en la actividad.', practice: { name: 'Movimiento Silencioso', duration: 60, steps: ['Camina muy lentamente en silencio', 'Mantén la conexión con la quietud interior', 'Nota cómo el silencio permanece en el movimiento'] }, reflection: '¿Puedes mantener el silencio interior mientras te mueves?' },
      { day: 10, title: 'Regreso Transformado', readingTime: 15, practiceTime: 60, theme: 'Culminación', content: 'Has tocado el silencio. Ahora llevas esa quietud contigo a tu vida.', practice: { name: 'Ritual de Cierre', duration: 60, steps: ['Medita 30 minutos', 'Escribe tu experiencia', 'Establece cómo mantendrás el contacto con el silencio', 'Agradece este viaje interior'] }, reflection: '¿Cómo ha transformado este retiro tu relación con la quietud?' }
    ];
  }

  // ==========================================================================
  // MÉTODOS DE GENERACIÓN GENÉRICA (FALLBACK)
  // ==========================================================================

  generateLessonsFromBook(bookId, numDays) {
    const lessons = [];
    const bookData = window.bookEngine?.books?.[bookId];

    if (!bookData?.sections) {
      for (let i = 1; i <= numDays; i++) {
        lessons.push({
          day: i,
          title: `Día ${i}: Exploración Consciente`,
          theme: `Semana ${Math.ceil(i / 7)}`,
          readingTime: 15,
          practiceTime: 10,
          content: 'Hoy continúas tu viaje de autoconocimiento.',
          practice: {
            name: 'Meditación y Reflexión',
            duration: 10,
            steps: ['Medita 10 minutos', 'Reflexiona sobre tu día', 'Escribe tus insights']
          },
          reflection: '¿Qué has aprendido hoy sobre ti mismo?'
        });
      }
      return lessons;
    }

    const allChapters = [];
    bookData.sections.forEach(section => {
      if (section.chapters) {
        section.chapters.forEach(chapter => {
          allChapters.push({ ...chapter, sectionTitle: section.title });
        });
      }
    });

    for (let i = 0; i < numDays; i++) {
      const chapterIndex = Math.floor((i / numDays) * allChapters.length);
      const chapter = allChapters[chapterIndex] || allChapters[allChapters.length - 1];

      lessons.push({
        day: i + 1,
        title: `Día ${i + 1}: ${chapter?.title || 'Reflexión'}`,
        theme: chapter?.sectionTitle || 'Práctica',
        chapterId: chapter?.id,
        readingTime: 15,
        practiceTime: 10,
        content: chapter?.content?.substring(0, 200) + '...' || 'Continúa tu práctica diaria.',
        practice: {
          name: 'Lectura y Reflexión',
          duration: 10,
          steps: ['Lee el capítulo asignado', 'Reflexiona sobre su mensaje', 'Anota tus insights', 'Aplica una idea hoy']
        },
        reflection: chapter?.closingQuestion || '¿Qué insight has tenido hoy?',
        epigraph: chapter?.epigraph
      });
    }

    return lessons;
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadEnrolledCourses() {
    try {
      return JSON.parse(localStorage.getItem('micro-courses-enrolled')) || {};
    } catch {
      return {};
    }
  }

  saveEnrolledCourses() {
    localStorage.setItem('micro-courses-enrolled', JSON.stringify(this.enrolledCourses));
  }

  loadCourseProgress() {
    try {
      return JSON.parse(localStorage.getItem('micro-courses-progress')) || {};
    } catch {
      return {};
    }
  }

  saveCourseProgress() {
    localStorage.setItem('micro-courses-progress', JSON.stringify(this.courseProgress));
  }

  // ==========================================================================
  // GESTIÓN DE CURSOS
  // ==========================================================================

  enrollCourse(courseId) {
    if (this.enrolledCourses[courseId]) {
      window.toast?.info('Ya estás inscrito en este curso');
      return;
    }

    const course = this.courses[courseId];
    if (!course) return;

    this.enrolledCourses[courseId] = {
      enrolledAt: new Date().toISOString(),
      startDate: new Date().toISOString(),
      currentDay: 1,
      streak: 0,
      lastCompletedAt: null,
      notificationsEnabled: true
    };

    this.courseProgress[courseId] = {
      completedDays: [],
      reflections: {},
      totalTime: 0
    };

    this.saveEnrolledCourses();
    this.saveCourseProgress();

    window.toast?.success(`¡Inscrito en "${course.title}"!`);
    this.scheduleNotification(courseId);
    this.updateUI();
  }

  completeLesson(courseId, day) {
    const enrollment = this.enrolledCourses[courseId];
    const progress = this.courseProgress[courseId];

    if (!enrollment || !progress) return;

    if (progress.completedDays.includes(day)) {
      window.toast?.info('Esta lección ya está completada');
      return;
    }

    progress.completedDays.push(day);

    const today = new Date().toDateString();
    const lastCompleted = enrollment.lastCompletedAt
      ? new Date(enrollment.lastCompletedAt).toDateString()
      : null;

    if (lastCompleted !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastCompleted === yesterday.toDateString()) {
        enrollment.streak++;
      } else {
        enrollment.streak = 1;
      }
    }

    enrollment.lastCompletedAt = new Date().toISOString();
    enrollment.currentDay = Math.max(enrollment.currentDay, day + 1);

    const course = this.courses[courseId];
    const lesson = course?.lessons?.[day - 1];
    if (lesson) {
      progress.totalTime += (lesson.readingTime || 0) + (lesson.practiceTime || 0);
    }

    this.saveEnrolledCourses();
    this.saveCourseProgress();

    if (progress.completedDays.length >= course.duration) {
      this.completeCourse(courseId);
    } else {
      window.toast?.success(`¡Día ${day} completado! Racha: ${enrollment.streak} días 🔥`);
    }

    this.updateUI();
  }

  saveReflection(courseId, day, text) {
    const progress = this.courseProgress[courseId];
    if (!progress) return;

    progress.reflections[day] = {
      text: text,
      savedAt: new Date().toISOString()
    };

    this.saveCourseProgress();
    window.toast?.success('Reflexión guardada ✨');
  }

  completeCourse(courseId) {
    const course = this.courses[courseId];
    const enrollment = this.enrolledCourses[courseId];

    if (!course || !enrollment) return;

    enrollment.completedAt = new Date().toISOString();
    this.saveEnrolledCourses();

    setTimeout(() => {
      this.showCompletionModal(courseId);
    }, 500);

    if (window.achievementSystem?.unlockAchievement) {
      window.achievementSystem.unlockAchievement(`course-${courseId}`);
    }
  }

  leaveCourse(courseId) {
    if (!confirm('¿Seguro que quieres abandonar este curso? Se perderá tu progreso.')) {
      return;
    }

    delete this.enrolledCourses[courseId];
    delete this.courseProgress[courseId];

    this.saveEnrolledCourses();
    this.saveCourseProgress();

    window.toast?.info('Has abandonado el curso');
    this.updateUI();
  }

  // ==========================================================================
  // NOTIFICACIONES
  // ==========================================================================

  scheduleNotification(courseId) {
    if (window.Capacitor?.Plugins?.LocalNotifications) {
      const course = this.courses[courseId];

      window.Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 100000),
          title: `${course.icon} ${course.title}`,
          body: '¡Es hora de tu lección diaria! Tu transformación continúa.',
          schedule: { at: this.getNextNotificationTime() },
          sound: 'default',
          smallIcon: 'ic_notification',
          actionTypeId: 'OPEN_COURSE'
        }]
      });
    }
  }

  getNextNotificationTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  getCourseStats(courseId) {
    const course = this.courses[courseId];
    const enrollment = this.enrolledCourses[courseId];
    const progress = this.courseProgress[courseId];

    if (!course || !enrollment || !progress) return null;

    const completedDays = progress.completedDays.length;
    const totalDays = course.duration;
    const percentage = Math.round((completedDays / totalDays) * 100);

    return {
      completedDays,
      totalDays,
      percentage,
      streak: enrollment.streak,
      totalTime: progress.totalTime,
      reflectionsCount: Object.keys(progress.reflections).length,
      isCompleted: !!enrollment.completedAt
    };
  }

  // ==========================================================================
  // UI - MODAL PRINCIPAL
  // ==========================================================================

  show() {
    this.close();

    const modal = document.createElement('div');
    modal.id = 'micro-courses-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.microCourses?.close()"></div>
      <div class="relative bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-700">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-emerald-900/30 to-teal-900/30">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="text-2xl">📚</span> Micro-Cursos
              </h2>
              <p class="text-xs text-emerald-300/70 mt-0.5">Transforma tu vida paso a paso</p>
            </div>
            <button onclick="window.microCourses?.close()"
                    class="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-700">
          <button id="tab-my-courses" onclick="window.microCourses?.showTab('my-courses')"
                  class="flex-1 px-4 py-3 text-sm font-medium text-white border-b-2 border-emerald-500">
            Mis Cursos
          </button>
          <button id="tab-discover" onclick="window.microCourses?.showTab('discover')"
                  class="flex-1 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent">
            Descubrir
          </button>
        </div>

        <!-- Content -->
        <div id="courses-content" class="flex-1 overflow-y-auto p-4">
          ${this.renderMyCourses()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  showTab(tabName) {
    const content = document.getElementById('courses-content');
    const tabMy = document.getElementById('tab-my-courses');
    const tabDiscover = document.getElementById('tab-discover');

    if (!content) return;

    tabMy.className = 'flex-1 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent';
    tabDiscover.className = 'flex-1 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent';

    if (tabName === 'my-courses') {
      tabMy.className = 'flex-1 px-4 py-3 text-sm font-medium text-white border-b-2 border-emerald-500';
      content.innerHTML = this.renderMyCourses();
    } else {
      tabDiscover.className = 'flex-1 px-4 py-3 text-sm font-medium text-white border-b-2 border-emerald-500';
      content.innerHTML = this.renderDiscoverCourses();
    }
  }

  renderMyCourses() {
    const enrolled = Object.keys(this.enrolledCourses);

    if (enrolled.length === 0) {
      return `
        <div class="text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">📖</div>
          <p class="text-lg mb-2">No tienes cursos activos</p>
          <p class="text-sm mb-4">Explora los cursos disponibles y comienza tu transformación</p>
          <button onclick="window.microCourses?.showTab('discover')"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
            Descubrir Cursos
          </button>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${enrolled.map(courseId => this.renderEnrolledCourseCard(courseId)).join('')}
      </div>
    `;
  }

  renderEnrolledCourseCard(courseId) {
    const course = this.courses[courseId];
    const stats = this.getCourseStats(courseId);

    if (!course || !stats) return '';

    return `
      <div class="bg-gradient-to-r ${course.color} p-0.5 rounded-xl">
        <div class="bg-slate-900 rounded-xl p-4">
          <div class="flex items-start gap-4">
            <div class="text-4xl">${course.icon}</div>
            <div class="flex-1">
              <h3 class="font-bold text-white">${course.title}</h3>
              <p class="text-xs text-gray-400">${course.subtitle}</p>

              <div class="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r ${course.color} rounded-full transition-all"
                     style="width: ${stats.percentage}%"></div>
              </div>

              <div class="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>${stats.completedDays}/${stats.totalDays} días</span>
                <span class="flex items-center gap-1">
                  🔥 Racha: ${stats.streak} días
                </span>
              </div>

              ${stats.isCompleted ? `
                <div class="mt-3 flex items-center gap-2 text-green-400 text-sm">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  ¡Curso completado!
                </div>
              ` : `
                <button onclick="window.microCourses?.showCourseDetail('${courseId}')"
                        class="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition-colors">
                  Continuar Día ${Math.min(stats.completedDays + 1, stats.totalDays)}
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDiscoverCourses() {
    const allCourses = Object.values(this.courses);

    return `
      <div class="space-y-4">
        ${allCourses.map(course => this.renderCourseCard(course)).join('')}
      </div>
    `;
  }

  renderCourseCard(course) {
    const isEnrolled = !!this.enrolledCourses[course.id];
    const stats = isEnrolled ? this.getCourseStats(course.id) : null;

    return `
      <div class="bg-slate-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-colors">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
            ${course.icon}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-white">${course.title}</h3>
              ${isEnrolled ? '<span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Inscrito</span>' : ''}
            </div>
            <p class="text-xs text-gray-400 mb-2">${course.subtitle} · ${course.duration} días · ${course.difficulty}</p>
            <p class="text-sm text-gray-300 mb-3">${course.description}</p>

            ${course.benefits ? `
              <div class="flex flex-wrap gap-1 mb-3">
                ${course.benefits.slice(0, 3).map(b => `
                  <span class="text-xs bg-slate-700 text-gray-300 px-2 py-0.5 rounded">✓ ${b}</span>
                `).join('')}
              </div>
            ` : ''}

            ${isEnrolled ? `
              <button onclick="window.microCourses?.showCourseDetail('${course.id}')"
                      class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors">
                Continuar (${stats?.percentage || 0}%)
              </button>
            ` : `
              <button onclick="window.microCourses?.enrollCourse('${course.id}')"
                      class="px-4 py-2 bg-gradient-to-r ${course.color} text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                Comenzar Curso
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // UI - DETALLE DE CURSO
  // ==========================================================================

  showCourseDetail(courseId) {
    const course = this.courses[courseId];
    const stats = this.getCourseStats(courseId);
    const progress = this.courseProgress[courseId];

    if (!course || !stats) return;

    const content = document.getElementById('courses-content');
    if (!content) return;

    content.innerHTML = `
      <div>
        <button onclick="window.microCourses?.showTab('my-courses')"
                class="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>

        <!-- Course Header -->
        <div class="bg-gradient-to-r ${course.color} p-0.5 rounded-xl mb-4">
          <div class="bg-slate-900 rounded-xl p-4">
            <div class="flex items-center gap-4">
              <div class="text-5xl">${course.icon}</div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-white">${course.title}</h3>
                <p class="text-sm text-gray-400">${stats.percentage}% completado · ${stats.streak} días de racha 🔥</p>
                <p class="text-xs text-gray-500 mt-1">${stats.totalTime} minutos de práctica · ${stats.reflectionsCount} reflexiones</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Lessons List -->
        <div class="space-y-2">
          ${course.lessons.map((lesson, index) => this.renderLessonCard(courseId, lesson, progress)).join('')}
        </div>

        <!-- Leave Course -->
        <button onclick="window.microCourses?.leaveCourse('${courseId}')"
                class="mt-6 w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm transition-colors">
          Abandonar Curso
        </button>
      </div>
    `;
  }

  renderLessonCard(courseId, lesson, progress) {
    const isCompleted = progress?.completedDays?.includes(lesson.day);
    const isLocked = lesson.day > (progress?.completedDays?.length || 0) + 1;
    const isCurrent = lesson.day === (progress?.completedDays?.length || 0) + 1;

    return `
      <div class="p-3 rounded-xl border ${isCompleted ? 'bg-emerald-900/20 border-emerald-500/30' : isCurrent ? 'bg-slate-800/50 border-white/20' : 'bg-slate-800/30 border-gray-700/30'} ${isLocked ? 'opacity-50' : ''}">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-white/20' : 'bg-gray-700'} flex items-center justify-center flex-shrink-0">
            ${isCompleted ? `
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            ` : isLocked ? `
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            ` : `
              <span class="text-sm font-bold text-white">${lesson.day}</span>
            `}
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-medium ${isCompleted ? 'text-emerald-300' : 'text-white'} truncate">${lesson.title}</p>
            <p class="text-xs text-gray-500">
              ${lesson.theme ? `${lesson.theme} · ` : ''}
              📖 ${lesson.readingTime || 10} min
              ${lesson.practiceTime ? ` · 🧘 ${lesson.practiceTime} min` : ''}
            </p>
          </div>

          ${!isLocked && !isCompleted ? `
            <button onclick="window.microCourses?.startLesson('${courseId}', ${lesson.day})"
                    class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors">
              ${isCurrent ? 'Empezar' : 'Hacer'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // UI - LECCIÓN DETALLADA
  // ==========================================================================

  startLesson(courseId, day) {
    const course = this.courses[courseId];
    const lesson = course?.lessons?.[day - 1];

    if (!lesson) return;

    this.showLessonModal(courseId, lesson);
  }

  showLessonModal(courseId, lesson) {
    const course = this.courses[courseId];
    const progress = this.courseProgress[courseId];
    const savedReflection = progress?.reflections?.[lesson.day]?.text || '';

    const modal = document.createElement('div');
    modal.id = 'lesson-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/90" onclick="document.getElementById('lesson-modal')?.remove()"></div>
      <div class="relative bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-700 overflow-hidden">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700 bg-gradient-to-r ${course.color} bg-opacity-20">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-400">${course.title} · ${lesson.theme || ''}</p>
              <h3 class="text-lg font-bold text-white">${lesson.title}</h3>
            </div>
            <button onclick="document.getElementById('lesson-modal')?.remove()"
                    class="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-5">
          <!-- Quote -->
          ${lesson.quote ? `
            <div class="bg-slate-800/50 rounded-xl p-4 border-l-4 border-purple-500">
              <p class="text-gray-300 italic text-sm">"${this.escapeHtml(lesson.quote.text)}"</p>
              <p class="text-xs text-gray-500 mt-2">— ${this.escapeHtml(lesson.quote.author)}</p>
            </div>
          ` : ''}

          <!-- Content -->
          ${lesson.content ? `
            <div>
              <h4 class="font-medium text-white mb-2 flex items-center gap-2">
                <span>📖</span> Lectura del día
              </h4>
              <p class="text-sm text-gray-300 leading-relaxed">${this.escapeHtml(lesson.content)}</p>
            </div>
          ` : ''}

          <!-- Practice -->
          ${lesson.practice ? `
            <div class="bg-slate-800/50 rounded-xl p-4">
              <h4 class="font-medium text-white mb-3 flex items-center gap-2">
                <span>🧘</span> Práctica: ${lesson.practice.name} (${lesson.practice.duration} min)
              </h4>
              <ol class="space-y-2 text-sm text-gray-300">
                ${lesson.practice.steps.map((step, i) => `
                  <li class="flex gap-2">
                    <span class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0">${i + 1}</span>
                    <span>${this.escapeHtml(step)}</span>
                  </li>
                `).join('')}
              </ol>
              ${lesson.practice.duration > 10 ? `
                <button onclick="window.microCourses?.startTimer(${lesson.practice.duration})"
                        class="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs transition-colors">
                  ⏱️ Iniciar temporizador
                </button>
              ` : ''}
            </div>
          ` : ''}

          <!-- Focus -->
          ${lesson.focus ? `
            <div class="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
              <h4 class="font-medium text-blue-300 mb-1">🎯 Foco de hoy</h4>
              <p class="text-sm text-gray-300">${this.escapeHtml(lesson.focus)}</p>
            </div>
          ` : ''}

          <!-- Reflection -->
          <div class="bg-slate-800/50 rounded-xl p-4">
            <h4 class="font-medium text-white mb-2 flex items-center gap-2">
              <span>💭</span> Reflexión
            </h4>
            <p class="text-sm text-gray-400 mb-3">${this.escapeHtml(lesson.reflection)}</p>
            <textarea id="lesson-reflection"
                      class="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:border-emerald-500 focus:outline-none text-sm"
                      rows="4"
                      placeholder="Escribe tu reflexión aquí...">${savedReflection}</textarea>
            <button onclick="window.microCourses?.saveReflection('${courseId}', ${lesson.day}, document.getElementById('lesson-reflection').value)"
                    class="mt-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs transition-colors">
              💾 Guardar reflexión
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-700 bg-slate-900/80">
          <button onclick="window.microCourses?.completeAndClose('${courseId}', ${lesson.day})"
                  class="w-full py-3 bg-gradient-to-r ${course.color} text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
            ✓ Completar Día ${lesson.day}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  startTimer(minutes) {
    const endTime = Date.now() + minutes * 60 * 1000;

    window.toast?.info(`Temporizador iniciado: ${minutes} minutos`);

    const timerInterval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      if (remaining <= 0) {
        clearInterval(timerInterval);
        window.toast?.success('¡Tiempo completado! 🎉');

        if (window.Capacitor?.Plugins?.LocalNotifications) {
          window.Capacitor.Plugins.LocalNotifications.schedule({
            notifications: [{
              id: 99999,
              title: '🧘 Práctica Completada',
              body: 'Tu tiempo de práctica ha terminado.',
              schedule: { at: new Date() }
            }]
          });
        }
      }
    }, 1000);
  }

  completeAndClose(courseId, day) {
    const textarea = document.getElementById('lesson-reflection');
    if (textarea?.value?.trim()) {
      this.saveReflection(courseId, day, textarea.value.trim());
    }

    this.completeLesson(courseId, day);
    document.getElementById('lesson-modal')?.remove();
    this.showCourseDetail(courseId);
  }

  openChapter(bookId, chapterId) {
    document.getElementById('lesson-modal')?.remove();
    this.close();

    if (window.bookReader?.navigation) {
      window.bookEngine?.loadBook(bookId).then(() => {
        window.bookReader.navigation.navigateToChapter(chapterId);
      });
    }
  }

  // ==========================================================================
  // UI - COMPLETAR CURSO
  // ==========================================================================

  showCompletionModal(courseId) {
    const course = this.courses[courseId];
    const stats = this.getCourseStats(courseId);

    if (!course) return;

    const modal = document.createElement('div');
    modal.id = 'course-completion-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/90"></div>
      <div class="relative bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-purple-500/50">
        <div class="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 class="text-2xl font-bold text-white mb-2">¡Felicidades!</h2>
        <p class="text-gray-300 mb-6">Has completado<br/><span class="text-xl font-bold text-purple-400">"${course.title}"</span></p>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-slate-800/50 rounded-xl p-3">
            <div class="text-2xl font-bold text-emerald-400">${stats.totalDays}</div>
            <div class="text-xs text-gray-500">Días</div>
          </div>
          <div class="bg-slate-800/50 rounded-xl p-3">
            <div class="text-2xl font-bold text-purple-400">${stats.totalTime}</div>
            <div class="text-xs text-gray-500">Minutos</div>
          </div>
          <div class="bg-slate-800/50 rounded-xl p-3">
            <div class="text-2xl font-bold text-amber-400">${stats.reflectionsCount}</div>
            <div class="text-xs text-gray-500">Reflexiones</div>
          </div>
        </div>

        <p class="text-sm text-gray-400 mb-6">
          Has dado un paso importante en tu camino de crecimiento personal.
          ¡Continúa explorando otros cursos!
        </p>

        <button onclick="document.getElementById('course-completion-modal')?.remove()"
                class="px-6 py-3 bg-gradient-to-r ${course.color} text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
          ¡Genial!
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  updateUI() {
    if (this.modalElement) {
      const activeTab = document.querySelector('[class*="border-emerald-500"]');
      if (activeTab?.id === 'tab-my-courses') {
        this.showTab('my-courses');
      } else if (activeTab?.id === 'tab-discover') {
        this.showTab('discover');
      }
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.MicroCourses = MicroCourses;
window.microCourses = new MicroCourses();

logger.log('[MicroCourses] Sistema de micro-cursos expandido inicializado');
