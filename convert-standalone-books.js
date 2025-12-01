#!/usr/bin/env node
/**
 * Script para convertir libros standalone (HTML) al formato JSON estándar
 * Esto permite que todos los libros usen el mismo sistema de:
 * - Navegación
 * - Reproductor de audio
 * - Traducciones
 * - Menús
 */

const fs = require('fs');
const path = require('path');

// Extraer el objeto translations del HTML
function extractTranslations(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Buscar el bloque de translations
  const match = html.match(/const translations = (\{[\s\S]*?\n    \});/);
  if (!match) {
    console.error(`No se encontró translations en ${htmlPath}`);
    return null;
  }

  // Evaluar el objeto JavaScript (cuidado: esto es seguro porque controlamos el input)
  try {
    const translationsStr = match[1];
    // Usar Function constructor para evaluar de forma más segura
    const translations = eval('(' + translationsStr + ')');
    return translations;
  } catch (e) {
    console.error(`Error parseando translations: ${e.message}`);
    return null;
  }
}

// Convertir ejercicios a formato de capítulos
function convertToBookFormat(translations, bookId, bookMeta) {
  const esData = translations.es;
  const enData = translations.en;

  // Crear estructura de secciones con capítulos
  const sections = esData.sections.map((section, sectionIndex) => {
    // Filtrar ejercicios de esta sección
    const sectionExercises = esData.exercises.filter(ex => ex.section === sectionIndex);
    const sectionExercisesEn = enData.exercises.filter(ex => ex.section === sectionIndex);

    // Convertir ejercicios a capítulos
    const chapters = sectionExercises.map((exercise, exIndex) => {
      const exerciseEn = sectionExercisesEn[exIndex] || exercise;
      const chapterId = `${section.id}-ex${exIndex + 1}`;

      // Construir contenido HTML del capítulo
      const contentEs = buildExerciseContent(exercise);
      const contentEn = buildExerciseContent(exerciseEn);

      return {
        id: chapterId,
        title: exercise.title,
        title_en: exerciseEn.title,
        duration: exercise.duration,
        epigraph: {
          text: exercise.description,
          text_en: exerciseEn.description
        },
        content: contentEs,
        content_en: contentEn,
        closingQuestion: exercise.reflection,
        closingQuestion_en: exerciseEn.reflection,
        exercises: [] // Los ejercicios ya están integrados en el contenido
      };
    });

    return {
      id: section.id,
      title: section.title,
      title_en: enData.sections[sectionIndex]?.title || section.title,
      subtitle: section.subtitle,
      subtitle_en: enData.sections[sectionIndex]?.subtitle || section.subtitle,
      chapters
    };
  });

  // Estructura final del libro
  return {
    id: bookId,
    title: esData.title,
    title_en: enData.title,
    subtitle: esData.subtitle?.replace(/<br>/g, ' - ') || '',
    subtitle_en: enData.subtitle?.replace(/<br>/g, ' - ') || '',
    authors: bookMeta.authors,
    year: bookMeta.year,
    version: "1.0.0",
    intro: {
      title: esData.intro?.title || '',
      title_en: enData.intro?.title || '',
      description: esData.intro?.desc || '',
      description_en: enData.intro?.desc || '',
      howToUse: esData.intro ? [
        esData.intro.howTo1,
        esData.intro.howTo2,
        esData.intro.howTo3,
        esData.intro.howTo4
      ].filter(Boolean) : [],
      howToUse_en: enData.intro ? [
        enData.intro.howTo1,
        enData.intro.howTo2,
        enData.intro.howTo3,
        enData.intro.howTo4
      ].filter(Boolean) : []
    },
    sections
  };
}

// Construir contenido HTML de un ejercicio
function buildExerciseContent(exercise) {
  let html = '';

  // Descripción
  if (exercise.description) {
    html += `<p class="exercise-intro">${exercise.description}</p>\n\n`;
  }

  // Duración
  if (exercise.duration) {
    html += `<p class="duration"><strong>${exercise.duration}</strong></p>\n\n`;
  }

  // Pasos
  if (exercise.steps && exercise.steps.length > 0) {
    html += `<h3>Pasos</h3>\n<ol class="exercise-steps">\n`;
    exercise.steps.forEach(step => {
      html += `  <li>${step}</li>\n`;
    });
    html += `</ol>\n\n`;
  }

  // Reflexión
  if (exercise.reflection) {
    html += `<div class="reflection-box">\n`;
    html += `  <h4>Reflexión</h4>\n`;
    html += `  <p>${exercise.reflection}</p>\n`;
    html += `</div>\n`;
  }

  return html;
}

// Crear config.json para el libro
function createConfig(bookId, bookMeta) {
  return {
    id: bookId,
    version: "1.0.0",
    lastUpdate: new Date().toISOString().split('T')[0],

    theme: {
      name: bookMeta.themeName || "Contemplative",
      primary: bookMeta.color || "#fbbf24",
      secondary: bookMeta.secondaryColor || "#f59e0b",
      accent: "#fbbf24",
      background: bookMeta.backgroundColor || "#0f172a",
      backgroundSecondary: "#1e293b",
      text: "#e2e8f0",
      textSecondary: "#cbd5e1",
      border: "#334155",
      gradient: "from-slate-950 via-amber-950 to-yellow-950"
    },

    ui: {
      showStarfield: true,
      animationType: "cosmic",
      animationSpeed: "slow",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: { base: 16, heading: 24, title: 32 },
      spacing: { section: 32, paragraph: 16 }
    },

    features: {
      exercises: {
        enabled: true,
        types: ["meditation", "reflection", "practice"],
        trackCompletion: true
      },
      audiobook: {
        enabled: true,
        voice: "es-ES",
        speedControl: true,
        speeds: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
        highlightCurrentParagraph: true,
        autoAdvanceChapter: true
      },
      aiChat: {
        enabled: true,
        systemPrompt: `Eres un guía contemplativo especializado en las prácticas de "${bookMeta.title}". Tu función es acompañar al usuario en su exploración, ofreciendo clarificación sobre los ejercicios y apoyo en su proceso.`,
        modes: {
          default: { name: "Guía Contemplativo", tone: "serene", focus: "practice" }
        }
      },
      personalNotes: { enabled: true, markdown: true, exportable: true },
      bookmarks: { enabled: true, allowMultiple: true },
      progressTracking: { enabled: true, trackTime: true, trackChapters: true, trackExercises: true }
    },

    content: {
      sourceFile: `books/${bookId}/book.json`,
      dataStructure: "standard"
    },

    metadata: {
      locale: "es-ES",
      readingLevel: bookMeta.difficulty || "intermediate",
      recommendedPace: "slow",
      linkedTo: bookMeta.linkedTo || null
    }
  };
}

// Procesar Manual Práctico
function processManualPractico() {
  console.log('\n📖 Procesando Manual Práctico...');

  const htmlPath = path.join(__dirname, 'www/books/manual-practico/index.html');
  const translations = extractTranslations(htmlPath);

  if (!translations) {
    console.error('❌ Error extrayendo datos de manual-practico');
    return;
  }

  const bookMeta = {
    title: "Manual Práctico",
    authors: ["J. Irurtzun", "Claude"],
    year: 2025,
    color: "#fbbf24",
    secondaryColor: "#f59e0b",
    backgroundColor: "#0f172a",
    themeName: "Contemplative Gold",
    difficulty: "principiante-intermedio",
    linkedTo: "codigo-despertar"
  };

  const bookJson = convertToBookFormat(translations, 'manual-practico', bookMeta);
  const configJson = createConfig('manual-practico', bookMeta);

  // Guardar archivos
  const bookDir = path.join(__dirname, 'www/books/manual-practico');

  // Backup del HTML original
  const backupPath = path.join(bookDir, 'index-standalone-backup.html');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(htmlPath, backupPath);
    console.log('  ✓ Backup creado: index-standalone-backup.html');
  }

  fs.writeFileSync(path.join(bookDir, 'book.json'), JSON.stringify(bookJson, null, 2));
  console.log('  ✓ book.json creado');

  fs.writeFileSync(path.join(bookDir, 'config.json'), JSON.stringify(configJson, null, 2));
  console.log('  ✓ config.json creado');

  // Crear carpeta assets si no existe
  const assetsDir = path.join(bookDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('  ✓ Carpeta assets creada');
  }

  console.log(`  ✓ Manual Práctico convertido: ${bookJson.sections.length} secciones, ${bookJson.sections.reduce((acc, s) => acc + s.chapters.length, 0)} ejercicios`);
}

// Procesar Prácticas Radicales
function processPracticasRadicales() {
  console.log('\n📖 Procesando Prácticas Radicales...');

  const htmlPath = path.join(__dirname, 'www/books/practicas-radicales/index.html');
  const translations = extractTranslations(htmlPath);

  if (!translations) {
    console.error('❌ Error extrayendo datos de practicas-radicales');
    return;
  }

  const bookMeta = {
    title: "Prácticas Radicales",
    authors: ["J. Irurtzun", "Claude"],
    year: 2025,
    color: "#dc2626",
    secondaryColor: "#991b1b",
    backgroundColor: "#0a0a0a",
    themeName: "Radical Fire",
    difficulty: "avanzado",
    linkedTo: "codigo-despertar"
  };

  const bookJson = convertToBookFormat(translations, 'practicas-radicales', bookMeta);
  const configJson = createConfig('practicas-radicales', bookMeta);

  // Guardar archivos
  const bookDir = path.join(__dirname, 'www/books/practicas-radicales');

  // Backup del HTML original
  const backupPath = path.join(bookDir, 'index-standalone-backup.html');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(htmlPath, backupPath);
    console.log('  ✓ Backup creado: index-standalone-backup.html');
  }

  fs.writeFileSync(path.join(bookDir, 'book.json'), JSON.stringify(bookJson, null, 2));
  console.log('  ✓ book.json creado');

  fs.writeFileSync(path.join(bookDir, 'config.json'), JSON.stringify(configJson, null, 2));
  console.log('  ✓ config.json creado');

  // Crear carpeta assets si no existe
  const assetsDir = path.join(bookDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('  ✓ Carpeta assets creada');
  }

  console.log(`  ✓ Prácticas Radicales convertido: ${bookJson.sections.length} secciones, ${bookJson.sections.reduce((acc, s) => acc + s.chapters.length, 0)} ejercicios`);
}

// Main
console.log('═══════════════════════════════════════════════════════════');
console.log('  CONVERSIÓN DE LIBROS STANDALONE A FORMATO ESTÁNDAR');
console.log('═══════════════════════════════════════════════════════════');

processManualPractico();
processPracticasRadicales();

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  CONVERSIÓN COMPLETADA');
console.log('═══════════════════════════════════════════════════════════');
console.log('\nPróximos pasos:');
console.log('1. Actualizar biblioteca.js para cargar estos libros normalmente');
console.log('2. Probar navegación, audio y traducciones');
console.log('3. Ejecutar: npx cap sync');
