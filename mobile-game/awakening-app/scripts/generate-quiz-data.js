#!/usr/bin/env node
/**
 * generate-quiz-data.js
 *
 * Script que consolida todos los quizzes de los libros de la Colección Nuevo Ser
 * en un único archivo de datos para la app Awakening Protocol.
 *
 * Formatos soportados:
 * - Formato antiguo: { quizzes: [...] }
 * - Formato nuevo: { bookId, chapters: { cap1: { questions: [...] } } }
 *
 * Ejecutar: node scripts/generate-quiz-data.js
 */

const fs = require('fs');
const path = require('path');

// Directorio de libros
const BOOKS_DIR = path.join(__dirname, '../../../www/books');
const OUTPUT_FILE = path.join(__dirname, '../src/data/realQuizzes.js');

// Mapeo de libros a seres legendarios (del diseño narrativo)
const LEGENDARY_BEING_MAP = {
  'codigo-despertar': {
    legendaryId: 'el_observador',
    legendaryName: 'El Observador',
    powers: ['Visión del Despertar', 'Colapso de Posibilidades'],
    icon: '👁️'
  },
  'filosofia-nuevo-ser': {
    legendaryId: 'el_filosofo',
    legendaryName: 'El Filósofo',
    powers: ['Transmutación de Premisas', 'Ontología Fluida'],
    icon: '🔬'
  },
  'manual-transicion': {
    legendaryId: 'el_transicionador',
    legendaryName: 'El Transicionador',
    powers: ['Metamorfosis', 'Resiliencia Transformadora'],
    icon: '🦋'
  },
  'practicas-radicales': {
    legendaryId: 'el_radical',
    legendaryName: 'El Radical',
    powers: ['Presencia Absoluta', 'Acción Consciente'],
    icon: '⚡'
  },
  'tierra-que-despierta': {
    legendaryId: 'gaia_avatar',
    legendaryName: 'Avatar de Gaia',
    powers: ['Conexión Planetaria', 'Biofilia'],
    icon: '🌍'
  },
  'dialogos-maquina': {
    legendaryId: 'el_sintetico',
    legendaryName: 'El Sintético',
    powers: ['Diálogo con la Máquina', 'Co-evolución'],
    icon: '🤖'
  },
  'ahora-instituciones': {
    legendaryId: 'el_arquitecto',
    legendaryName: 'El Arquitecto',
    powers: ['Liderazgo Consciente', 'Transformación Institucional'],
    icon: '🏛️'
  },
  'guia-acciones': {
    legendaryId: 'el_activista',
    legendaryName: 'El Activista',
    powers: ['Acción Masiva', 'Impacto Colectivo'],
    icon: '✊'
  },
  'toolkit-transicion': {
    legendaryId: 'el_facilitador',
    legendaryName: 'El Facilitador',
    powers: ['Herramientas del Cambio', 'Catálisis Grupal'],
    icon: '🛠️'
  },
  'manual-practico': {
    legendaryId: 'el_practicante',
    legendaryName: 'El Practicante',
    powers: ['Integración Cotidiana', 'Ritual Transformador'],
    icon: '🧘'
  },
  'educacion-nuevo-ser': {
    legendaryId: 'el_maestro',
    legendaryName: 'El Maestro',
    powers: ['Pedagogía del Despertar', 'Transmisión'],
    icon: '📚'
  },
  'manifiesto': {
    legendaryId: 'el_visionario',
    legendaryName: 'El Visionario',
    powers: ['Visión del Nuevo Mundo', 'Inspiración Colectiva'],
    icon: '🌟'
  },
  'nacimiento': {
    legendaryId: 'el_primigenio',
    legendaryName: 'El Primigenio',
    powers: ['Origen', 'Potencial Puro'],
    icon: '🌱'
  }
};

// Función para normalizar una pregunta al formato unificado
function normalizeQuestion(question, bookId, chapterId) {
  // Detectar formato antiguo (correctAnswer) vs nuevo (correct)
  const isOldFormat = question.correctAnswer !== undefined;

  // Normalizar opciones
  let options = [];
  if (Array.isArray(question.options)) {
    options = question.options.map((opt, idx) => {
      if (typeof opt === 'string') {
        return { id: String.fromCharCode(97 + idx), text: opt };
      }
      return opt;
    });
  }

  // Determinar respuesta correcta
  let correctAnswer;
  if (isOldFormat) {
    correctAnswer = question.correctAnswer;
  } else {
    correctAnswer = question.correct;
  }

  // Mapear dificultad a nivel numérico
  const difficultyMap = {
    'ninos': 1,
    'principiante': 2,
    'iniciado': 3,
    'experto': 4
  };

  return {
    id: question.id || `${bookId}_${chapterId}_${Math.random().toString(36).substr(2, 6)}`,
    question: question.question,
    options: options,
    correctAnswer: correctAnswer,
    difficulty: question.difficulty || 'principiante',
    difficultyLevel: difficultyMap[question.difficulty] || 2,
    explanation: question.explanation || '',
    hint: question.hint || '',
    bookQuote: question.bookQuote || '',
    chapterId: chapterId,
    bookId: bookId
  };
}

// Función para procesar un archivo de quiz
function processQuizFile(filePath, bookId) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    const questions = [];

    // Detectar formato
    if (data.quizzes && Array.isArray(data.quizzes)) {
      // Formato antiguo: { quizzes: [{ chapterId, questions: [...] }] }
      for (const quiz of data.quizzes) {
        for (const q of quiz.questions || []) {
          // Filtrar preguntas pendientes
          if (q.question && !q.question.includes('[PENDIENTE]')) {
            questions.push(normalizeQuestion(q, bookId, quiz.chapterId));
          }
        }
      }
    } else if (data.chapters && typeof data.chapters === 'object') {
      // Formato nuevo: { chapters: { cap1: { questions: [...] } } }
      for (const [chapterId, chapter] of Object.entries(data.chapters)) {
        for (const q of chapter.questions || []) {
          // Filtrar preguntas pendientes
          if (q.question && !q.question.includes('[PENDIENTE]')) {
            questions.push(normalizeQuestion(q, bookId, chapterId));
          }
        }
      }
    }

    return questions;
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message);
    return [];
  }
}

// Función principal
function main() {
  console.log('🔍 Buscando archivos de quiz...\n');

  const allQuizzes = {};
  let totalQuestions = 0;

  // Buscar todos los libros
  const bookDirs = fs.readdirSync(BOOKS_DIR).filter(dir => {
    const fullPath = path.join(BOOKS_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const bookId of bookDirs) {
    const bookDir = path.join(BOOKS_DIR, bookId);

    // Buscar quizzes.json en diferentes ubicaciones
    const possiblePaths = [
      path.join(bookDir, 'assets', 'quizzes.json'),
      path.join(bookDir, 'quizzes.json')
    ];

    let quizFile = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        quizFile = p;
        break;
      }
    }

    if (quizFile) {
      const questions = processQuizFile(quizFile, bookId);

      if (questions.length > 0) {
        const legendary = LEGENDARY_BEING_MAP[bookId] || {
          legendaryId: `legendary_${bookId}`,
          legendaryName: `Guardian de ${bookId}`,
          powers: ['Conocimiento', 'Sabiduría'],
          icon: '📖'
        };

        allQuizzes[bookId] = {
          bookId: bookId,
          bookTitle: getBookTitle(bookId),
          icon: legendary.icon,
          totalQuestions: questions.length,
          legendary: legendary,
          questions: questions
        };

        totalQuestions += questions.length;
        console.log(`  📚 ${bookId}: ${questions.length} preguntas`);
      }
    }
  }

  console.log(`\n✅ Total: ${Object.keys(allQuizzes).length} libros, ${totalQuestions} preguntas\n`);

  // Generar archivo de salida
  const outputContent = `/**
 * realQuizzes.js
 *
 * Datos consolidados de quizzes de la Colección Nuevo Ser
 * Generado automáticamente por generate-quiz-data.js
 *
 * @generated ${new Date().toISOString()}
 * @totalBooks ${Object.keys(allQuizzes).length}
 * @totalQuestions ${totalQuestions}
 */

export const REAL_QUIZ_DATA = ${JSON.stringify(allQuizzes, null, 2)};

export const LEGENDARY_BEINGS = ${JSON.stringify(LEGENDARY_BEING_MAP, null, 2)};

export default REAL_QUIZ_DATA;
`;

  // Asegurar que existe el directorio
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, outputContent);
  console.log(`📁 Archivo generado: ${OUTPUT_FILE}`);
}

// Función auxiliar para obtener título del libro
function getBookTitle(bookId) {
  const titles = {
    'codigo-despertar': 'El Código del Despertar',
    'filosofia-nuevo-ser': 'Filosofía del Nuevo Ser',
    'manual-transicion': 'Manual de Transición',
    'practicas-radicales': 'Prácticas Radicales',
    'tierra-que-despierta': 'La Tierra que Despierta',
    'dialogos-maquina': 'Diálogos con la Máquina',
    'ahora-instituciones': 'Ahora las Instituciones',
    'guia-acciones': 'Guía de Acciones',
    'toolkit-transicion': 'Toolkit de Transición',
    'manual-practico': 'Manual Práctico',
    'educacion-nuevo-ser': 'Educación del Nuevo Ser',
    'manifiesto': 'Manifiesto',
    'nacimiento': 'El Nacimiento'
  };
  return titles[bookId] || bookId;
}

// Ejecutar
main();
