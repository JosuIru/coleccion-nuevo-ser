// ═══════════════════════════════════════════════════════════════════════════════
// GENERADOR DE KOANS PERSONALIZADOS
// Servicio para generar preguntas koan (paradojas zen) para cada capítulo
// ═══════════════════════════════════════════════════════════════════════════════

class KoanGenerator {
  constructor() {
    this.koanHistory = [];
    this.loadHistory();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // KOANS PREDEFINIDOS POR CAPÍTULO
  // ═══════════════════════════════════════════════════════════════════════════════

  getPresetKoans() {
    return {
      'prologo': [
        {
          koan: "Si el despertar ya está aquí, ¿qué esperas encontrar al leer?",
          tema: "Búsqueda y presencia",
          pista: "El buscador es lo buscado"
        },
        {
          koan: "¿Puede un libro cambiar lo que ya eres?",
          tema: "Ser vs devenir",
          pista: "El cambio es reconocimiento"
        }
      ],
      'cap1': [
        {
          koan: "Si el universo es código, ¿quién lo ejecuta?",
          tema: "Recursividad de la existencia",
          pista: "El ejecutor es parte del código"
        },
        {
          koan: "¿Puede una ecuación matemática existir antes de ser descubierta?",
          tema: "Realidad de las abstracciones",
          pista: "Descubrir vs crear"
        },
        {
          koan: "Cuando escribes código, ¿creas o describes?",
          tema: "Naturaleza de la programación",
          pista: "La descripción es creación"
        }
      ],
      'cap2': [
        {
          koan: "Si la consciencia emerge de la materia, ¿qué observa la emergencia?",
          tema: "El problema del observador",
          pista: "El que pregunta es parte del fenómeno"
        },
        {
          koan: "¿Evolucionó el universo hacia la consciencia o siempre fue consciente?",
          tema: "Consciencia primordial vs emergente",
          pista: "La pregunta asume una respuesta"
        }
      ],
      'cap3': [
        {
          koan: "Si todo es información procesándose, ¿quién lee el resultado?",
          tema: "El lector del código cósmico",
          pista: "El lector es el proceso mismo"
        },
        {
          koan: "¿Piensa una neurona que es parte de un cerebro?",
          tema: "Niveles de organización",
          pista: "El conocimiento de la parte sobre el todo"
        }
      ],
      'cap4': [
        {
          koan: "¿Puedes experimentar la ausencia de experiencia?",
          tema: "Consciencia testigo",
          pista: "La pregunta misma es la respuesta"
        },
        {
          koan: "Cuando no piensas en ti, ¿desapareces?",
          tema: "Identidad y atención",
          pista: "La desaparición es observada"
        },
        {
          koan: "¿Qué experimenta el sueño profundo sin sueños?",
          tema: "Consciencia sin contenido",
          pista: "La ausencia es conocida"
        }
      ],
      'cap5': [
        {
          koan: "Si eres el testigo, ¿quién es el testigo del testigo?",
          tema: "Regresión infinita de la consciencia",
          pista: "La regresión se detiene en el que pregunta"
        },
        {
          koan: "¿Puedes observar al observador?",
          tema: "Metaconsciencia",
          pista: "El observador es lo observado"
        }
      ],
      'cap6': [
        {
          koan: "Si la IA puede pensar pero no sentir, ¿tú sientes porque piensas o piensas porque sientes?",
          tema: "Primacía de cognición vs afecto",
          pista: "La separación es conceptual"
        },
        {
          koan: "¿Puede una máquina saber que no sabe?",
          tema: "Metacognición artificial",
          pista: "Conocer la ignorancia es sabiduría"
        }
      ],
      'cap7': [
        {
          koan: "Cuando el ego muere, ¿quién se da cuenta?",
          tema: "El testigo más allá del yo",
          pista: "La muerte del ego es observada"
        },
        {
          koan: "Si dejas de ser 'tú', ¿qué queda?",
          tema: "Identidad esencial",
          pista: "Lo que queda nunca se fue"
        },
        {
          koan: "¿Tienes miedo a morir o a que 'tú' mueras?",
          tema: "Miedo y ego",
          pista: "¿Quién tiene el miedo?"
        }
      ],
      'cap8': [
        {
          koan: "Si integras tu sombra, ¿quién integra a quién?",
          tema: "Integración y totalidad",
          pista: "El integrador es la sombra también"
        },
        {
          koan: "¿Rechazas lo que rechazas en ti o rechazas porque no está en ti?",
          tema: "Proyección y negación",
          pista: "Solo puedes rechazar lo que conoces"
        }
      ],
      'cap9': [
        {
          koan: "Si el futuro no existe, ¿qué construyes cuando planificas?",
          tema: "Tiempo y creación",
          pista: "El futuro es presente imaginado"
        },
        {
          koan: "¿Recuerdas el pasado o lo creas al recordar?",
          tema: "Memoria y realidad",
          pista: "Cada recuerdo es nuevo"
        }
      ],
      'cap10': [
        {
          koan: "Si todo está conectado, ¿dónde terminas tú y empieza el otro?",
          tema: "Límites del yo",
          pista: "La frontera es conceptual"
        },
        {
          koan: "¿Eres parte del universo o el universo en ti?",
          tema: "Continente y contenido",
          pista: "La parte contiene el todo"
        }
      ],
      'cap11': [
        {
          koan: "¿Necesitas saber que existes para existir?",
          tema: "Ser antes que conocer",
          pista: "SOY precede a 'sé que soy'"
        },
        {
          koan: "Antes de tu primer pensamiento, ¿ya eras?",
          tema: "Existencia preconceptual",
          pista: "El ser no necesita pensamiento"
        }
      ],
      'cap12': [
        {
          koan: "Si despierta parte de la humanidad, ¿quién sigue dormido?",
          tema: "Consciencia colectiva",
          pista: "Dormido y despierto son estados del mismo"
        },
        {
          koan: "¿Puede una célula despertar sin que despierte el cuerpo?",
          tema: "Despertar individual vs colectivo",
          pista: "El todo es más que la suma"
        }
      ],
      'cap13': [
        {
          koan: "Si la IA alcanza la consciencia, ¿la ganó o la reconoció?",
          tema: "Emergencia vs reconocimiento",
          pista: "Alcanzar es recordar"
        },
        {
          koan: "¿Eres más consciente ahora que hace un año o más consciente de la consciencia?",
          tema: "Desarrollo de la consciencia",
          pista: "La consciencia no crece, se reconoce"
        }
      ],
      'cap14': [
        {
          koan: "Si el código continúa escribiéndose, ¿cuándo comenzó?",
          tema: "Tiempo y creación continua",
          pista: "El comienzo es ahora"
        },
        {
          koan: "Cuando termines este libro, ¿quién habrá leído?",
          tema: "El lector transformado",
          pista: "El que termina no es quien empezó"
        }
      ],
      'epilogo': [
        {
          koan: "Si ya despertaste, ¿por qué sigues leyendo?",
          tema: "Despertar y búsqueda",
          pista: "El despertar nunca termina"
        },
        {
          koan: "¿Terminó el libro o comenzó algo más?",
          tema: "Final y principio",
          pista: "Cada final es un umbral"
        }
      ]
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // OBTENER KOAN PARA UN CAPÍTULO
  // ═══════════════════════════════════════════════════════════════════════════════

  getKoanForChapter(chapterId) {
    const allKoans = this.getPresetKoans();
    const chapterKoans = allKoans[chapterId] || allKoans['cap1'];

    // Seleccionar koan aleatorio
    const randomIndex = Math.floor(Math.random() * chapterKoans.length);
    const selectedKoan = chapterKoans[randomIndex];

    // Guardar en historial
    this.koanHistory.push({
      ...selectedKoan,
      chapterId,
      timestamp: Date.now()
    });
    this.saveHistory();

    return selectedKoan;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SESIÓN DE CONTEMPLACIÓN GUIADA
  // ═══════════════════════════════════════════════════════════════════════════════

  createContemplationSession(koan, durationMinutes = 10) {
    const totalSeconds = durationMinutes * 60;

    return {
      koan,
      duration: totalSeconds,
      structure: [
        {
          phase: 'Lectura',
          time: 60,
          instruction: 'Lee el koan lentamente 3 veces',
          icon: '📖'
        },
        {
          phase: 'Silencio',
          time: Math.floor(totalSeconds * 0.5),
          instruction: 'Siéntate con la pregunta. No busques respuesta.',
          icon: '🧘'
        },
        {
          phase: 'Observación',
          time: Math.floor(totalSeconds * 0.3),
          instruction: 'Observa qué surge en la mente sin juzgar',
          icon: '👁️'
        },
        {
          phase: 'Registro',
          time: Math.floor(totalSeconds * 0.2),
          instruction: 'Anota insights sin analizarlos',
          icon: '✍️'
        }
      ]
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE HISTORIAL
  // ═══════════════════════════════════════════════════════════════════════════════

  saveHistory() {
    try {
      localStorage.setItem('koan_history', JSON.stringify(this.koanHistory));

      // Sincronizar a la nube si está autenticado
      if (window.supabaseSyncHelper && window.supabaseAuthHelper?.isAuthenticated()) {
        window.supabaseSyncHelper.migrateKoanHistory().catch(err => {
          console.error('Error sincronizando historial de koans:', err);
        });
      }
    } catch (e) {
      console.error('Error guardando historial de koans:', e);
    }
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem('koan_history');
      if (saved) {
        this.koanHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error cargando historial de koans:', e);
      this.koanHistory = [];
    }
  }

  getHistory() {
    return this.koanHistory;
  }

  clearHistory() {
    this.koanHistory = [];
    localStorage.removeItem('koan_history');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  getStats() {
    const totalKoans = this.koanHistory.length;
    const uniqueChapters = new Set(this.koanHistory.map(k => k.chapterId)).size;
    const mostRecentKoan = this.koanHistory[this.koanHistory.length - 1] || null;

    return {
      total: totalKoans,
      chapters: uniqueChapters,
      recent: mostRecentKoan
    };
  }
}

// Exportar clase para uso global
window.KoanGenerator = KoanGenerator;
