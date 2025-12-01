/**
 * Script para añadir enlaces de vuelta a los libros principales
 * desde los libros de ejercicios/complementarios
 */

const fs = require('fs');
const path = require('path');

const booksPath = '/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books';

// ============================================================================
// 1. TOOLKIT DE TRANSICIÓN -> MANUAL DE TRANSICIÓN
// ============================================================================
console.log('\n📚 TOOLKIT DE TRANSICIÓN');
console.log('═'.repeat(50));

const toolkitPath = path.join(booksPath, 'toolkit-transicion/book.json');
const manualTransicionPath = path.join(booksPath, 'manual-transicion/book.json');

const toolkit = JSON.parse(fs.readFileSync(toolkitPath, 'utf8'));
const manualTransicion = JSON.parse(fs.readFileSync(manualTransicionPath, 'utf8'));

// Crear mapa de capítulos del Manual de Transición
const manualChaptersMap = {};
manualTransicion.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    manualChaptersMap[chapter.id] = {
      title: chapter.title,
      sectionTitle: section.title
    };
  });
});

// Añadir parentBook a cada ejercicio del Toolkit
toolkit.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    if (chapter.manualChapter) {
      const parentInfo = manualChaptersMap[chapter.manualChapter];
      chapter.parentBook = {
        book: "manual-transicion",
        bookTitle: "Manual de Transición",
        chapterId: chapter.manualChapter,
        chapterTitle: parentInfo?.title || chapter.manualTitle,
        description: `Complementa el capítulo "${parentInfo?.title || chapter.manualTitle}" del Manual de Transición`
      };
      console.log(`  ✓ ${chapter.title} -> ${parentInfo?.title || chapter.manualTitle}`);
    }
  });
});

fs.writeFileSync(toolkitPath, JSON.stringify(toolkit, null, 2));
console.log(`✅ Toolkit de Transición: ${toolkit.sections.flatMap(s => s.chapters).length} ejercicios enlazados`);


// ============================================================================
// 2. GUÍA DE ACCIONES -> MANIFIESTO
// ============================================================================
console.log('\n📚 GUÍA DE ACCIONES');
console.log('═'.repeat(50));

const guiaAccionesPath = path.join(booksPath, 'guia-acciones/book.json');
const manifiestoPath = path.join(booksPath, 'manifiesto/book.json');

const guiaAcciones = JSON.parse(fs.readFileSync(guiaAccionesPath, 'utf8'));
const manifiesto = JSON.parse(fs.readFileSync(manifiestoPath, 'utf8'));

// Crear mapa de capítulos del Manifiesto
const manifiestoChaptersMap = {};
manifiesto.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    manifiestoChaptersMap[chapter.id] = {
      title: chapter.title,
      sectionTitle: section.title
    };
  });
});

// Añadir parentBook a cada acción de la Guía
let accionesEnlazadas = 0;
guiaAcciones.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    if (chapter.manifestoChapter) {
      const parentInfo = manifiestoChaptersMap[chapter.manifestoChapter];
      chapter.parentBook = {
        book: "manifiesto",
        bookTitle: "Manifiesto de la Conciencia Compartida",
        chapterId: chapter.manifestoChapter,
        chapterTitle: parentInfo?.title || chapter.manifestoTitle,
        description: `Acción derivada del capítulo "${parentInfo?.title || chapter.manifestoTitle}" del Manifiesto`
      };
      accionesEnlazadas++;
      if (accionesEnlazadas <= 10) {
        console.log(`  ✓ ${chapter.title} -> ${parentInfo?.title || chapter.manifestoTitle}`);
      }
    }
  });
});
if (accionesEnlazadas > 10) {
  console.log(`  ... y ${accionesEnlazadas - 10} acciones más`);
}

fs.writeFileSync(guiaAccionesPath, JSON.stringify(guiaAcciones, null, 2));
console.log(`✅ Guía de Acciones: ${accionesEnlazadas} acciones enlazadas`);


// ============================================================================
// 3. MANUAL PRÁCTICO -> CÓDIGO DEL DESPERTAR
// ============================================================================
console.log('\n📚 MANUAL PRÁCTICO');
console.log('═'.repeat(50));

const manualPracticoPath = path.join(booksPath, 'manual-practico/book.json');
const codigoDespertarPath = path.join(booksPath, 'codigo-despertar/book.json');

const manualPractico = JSON.parse(fs.readFileSync(manualPracticoPath, 'utf8'));
const codigoDespertar = JSON.parse(fs.readFileSync(codigoDespertarPath, 'utf8'));

// Crear mapa de capítulos del Código del Despertar
const codigoChaptersMap = {};
codigoDespertar.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    codigoChaptersMap[chapter.id] = {
      title: chapter.title,
      sectionTitle: section.title
    };
  });
});

// Mapeo de secciones del Manual Práctico a capítulos del Código del Despertar
const manualPracticoMapping = {
  'seccion1': ['cap1', 'cap2', 'cap3'],           // Fundamentos
  'seccion2': ['cap4', 'cap5', 'cap6', 'cap7'],   // Dimensiones de la Experiencia
  'seccion3': ['cap8', 'cap9', 'cap10', 'cap11'], // La Sombra y la Integración
  'seccion4': ['cap12', 'cap13', 'cap14'],        // Horizontes
  'introduccion': ['prologo'],
  'conclusion': ['epilogo']
};

// Añadir parentBook basado en el nombre del ejercicio o la sección
let ejerciciosEnlazados = 0;
manualPractico.sections.forEach((section, sIdx) => {
  // Determinar capítulos relacionados basados en la sección
  let relatedChapters = [];

  if (section.id && manualPracticoMapping[section.id]) {
    relatedChapters = manualPracticoMapping[section.id];
  } else {
    // Mapeo por índice de sección
    const sectionMappings = [
      ['prologo'],           // Introducción
      ['cap1', 'cap2', 'cap3'],           // Sección 1
      ['cap4', 'cap5', 'cap6', 'cap7'],   // Sección 2
      ['cap8', 'cap9', 'cap10', 'cap11'], // Sección 3
      ['cap12', 'cap13', 'cap14'],        // Sección 4
      ['epilogo']            // Conclusión
    ];
    if (sIdx < sectionMappings.length) {
      relatedChapters = sectionMappings[sIdx];
    }
  }

  section.chapters.forEach((chapter, cIdx) => {
    // Determinar el capítulo principal relacionado
    let mainChapterId = relatedChapters[0] || 'cap1';
    if (relatedChapters.length > 1) {
      // Distribuir ejercicios entre capítulos relacionados
      mainChapterId = relatedChapters[Math.min(cIdx, relatedChapters.length - 1)] || relatedChapters[0];
    }

    const parentInfo = codigoChaptersMap[mainChapterId];
    if (parentInfo) {
      chapter.parentBook = {
        book: "codigo-despertar",
        bookTitle: "El Código del Despertar",
        chapterId: mainChapterId,
        chapterTitle: parentInfo.title,
        description: `Ejercicio práctico para profundizar en "${parentInfo.title}"`
      };
      ejerciciosEnlazados++;
      if (ejerciciosEnlazados <= 5) {
        console.log(`  ✓ ${chapter.title} -> ${parentInfo.title}`);
      }
    }
  });
});
if (ejerciciosEnlazados > 5) {
  console.log(`  ... y ${ejerciciosEnlazados - 5} ejercicios más`);
}

fs.writeFileSync(manualPracticoPath, JSON.stringify(manualPractico, null, 2));
console.log(`✅ Manual Práctico: ${ejerciciosEnlazados} ejercicios enlazados`);


// ============================================================================
// 4. PRÁCTICAS RADICALES -> CÓDIGO DEL DESPERTAR
// ============================================================================
console.log('\n📚 PRÁCTICAS RADICALES');
console.log('═'.repeat(50));

const practicasRadicalesPath = path.join(booksPath, 'practicas-radicales/book.json');
const practicasRadicales = JSON.parse(fs.readFileSync(practicasRadicalesPath, 'utf8'));

// Mapeo basado en el apéndice de Prácticas Radicales
const practicasMapping = {
  'practice-1': ['cap3'],                    // El Límite Borroso
  'practice-2': ['cap2'],                    // Sintiendo Phi
  'practice-3': ['cap2'],                    // El Problema Difícil
  'practice-4': ['cap4'],                    // Predicción y Sorpresa
  'practice-5': ['cap9', 'cap11'],           // Confrontación con la Irrelevancia
  'practice-6': ['cap11', 'cap13'],          // Diálogo en el Borde
  'practice-7': ['cap10'],                   // La Muerte como Maestra
  'practice-8': ['cap5', 'cap13'],           // Creación Híbrida
  'practice-9': ['cap12'],                   // Ética Encarnada
  'practice-10': ['cap14', 'epilogo'],       // La Espiral Continúa
  'practice-11': ['prologo', 'cap1'],        // Emergencia
  'practice-12': ['cap3'],                   // Autopoiesis
  'practice-13': ['cap7'],                   // Umwelt
  'practice-14': ['cap6'],                   // Marcador Somático
  'practice-15': ['cap14'],                  // Entrelazamiento
  'question-1': ['cap8'],                    // Preguntas vivas
  'question-2': ['cap9'],
  'question-3': ['cap10'],
  'question-4': ['cap8'],
  'question-5': ['cap11']
};

let practicasEnlazadas = 0;
practicasRadicales.sections.forEach(section => {
  section.chapters.forEach(chapter => {
    const relatedChapters = practicasMapping[chapter.id];
    if (relatedChapters && relatedChapters.length > 0) {
      const mainChapterId = relatedChapters[0];
      const parentInfo = codigoChaptersMap[mainChapterId];

      if (parentInfo) {
        chapter.parentBook = {
          book: "codigo-despertar",
          bookTitle: "El Código del Despertar",
          chapterId: mainChapterId,
          chapterTitle: parentInfo.title,
          description: `Práctica radical que profundiza "${parentInfo.title}"`
        };
        practicasEnlazadas++;
        if (practicasEnlazadas <= 5) {
          console.log(`  ✓ ${chapter.title} -> ${parentInfo.title}`);
        }
      }
    }
  });
});
if (practicasEnlazadas > 5) {
  console.log(`  ... y ${practicasEnlazadas - 5} prácticas más`);
}

fs.writeFileSync(practicasRadicalesPath, JSON.stringify(practicasRadicales, null, 2));
console.log(`✅ Prácticas Radicales: ${practicasEnlazadas} prácticas enlazadas`);


// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log('\n' + '═'.repeat(50));
console.log('📊 RESUMEN DE ENLACES AÑADIDOS');
console.log('═'.repeat(50));
console.log(`  Toolkit de Transición -> Manual de Transición: ${toolkit.sections.flatMap(s => s.chapters).length} ejercicios`);
console.log(`  Guía de Acciones -> Manifiesto: ${accionesEnlazadas} acciones`);
console.log(`  Manual Práctico -> Código del Despertar: ${ejerciciosEnlazados} ejercicios`);
console.log(`  Prácticas Radicales -> Código del Despertar: ${practicasEnlazadas} prácticas`);
console.log('\n✅ Todos los enlaces bidireccionales configurados');
