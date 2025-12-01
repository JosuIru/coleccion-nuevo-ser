/**
 * Script para añadir enlaces al Toolkit de Transición en cada capítulo del Manual de Transición
 */

const fs = require('fs');

const manualPath = '/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books/manual-transicion/book.json';
const toolkitPath = '/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books/toolkit-transicion/book.json';

// Leer los archivos
const manual = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
const toolkit = JSON.parse(fs.readFileSync(toolkitPath, 'utf8'));

// Crear un mapa de toolkit chapters por número
const toolkitChapters = {};
toolkit.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    // Extraer el número del ID (toolkit-1, toolkit-2, etc.)
    const match = chapter.id.match(/toolkit-(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      toolkitChapters[num] = {
        id: chapter.id,
        title: chapter.title,
        duration: chapter.duration,
        difficulty: chapter.difficulty
      };
    }
  });
});

console.log(`Encontrados ${Object.keys(toolkitChapters).length} ejercicios en el Toolkit`);

// Añadir linkedExercise a cada capítulo del Manual
let chaptersUpdated = 0;
let chapterNumber = 0;

manual.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    chapterNumber++;

    // Buscar el ejercicio correspondiente
    const toolkitExercise = toolkitChapters[chapterNumber];

    if (toolkitExercise) {
      chapter.linkedExercise = {
        book: "toolkit-transicion",
        chapterId: toolkitExercise.id,
        title: toolkitExercise.title,
        duration: toolkitExercise.duration,
        difficulty: toolkitExercise.difficulty
      };
      chaptersUpdated++;
      console.log(`  Cap ${chapterNumber}: ${chapter.title} -> ${toolkitExercise.title}`);
    }
  });
});

// Guardar el archivo actualizado
fs.writeFileSync(manualPath, JSON.stringify(manual, null, 2));

console.log(`\n✅ Enlaces añadidos a ${chaptersUpdated} capítulos del Manual de Transición`);
