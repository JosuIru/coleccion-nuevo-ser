#!/usr/bin/env node
/**
 * Script para convertir Prácticas Radicales desde Markdown a JSON
 * Fuente: app-final/practicas-radicales/PRACTICAS_COMPLETAS_RADICALES.md
 */

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../app-final/practicas-radicales/PRACTICAS_COMPLETAS_RADICALES.md');
const md = fs.readFileSync(mdPath, 'utf8');

// Convertir Markdown a HTML
function mdToHtml(text) {
  if (!text) return '';

  // Dividir en líneas para procesar
  const lines = text.split('\n');
  const htmlLines = [];
  let inList = false;
  let listItems = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line === '---') continue;

    // Headers
    if (line.startsWith('### ')) {
      if (inList) {
        htmlLines.push('<ul>' + listItems.join('') + '</ul>');
        listItems = [];
        inList = false;
      }
      htmlLines.push(`<h3>${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) {
        htmlLines.push('<ul>' + listItems.join('') + '</ul>');
        listItems = [];
        inList = false;
      }
      htmlLines.push(`<h2>${line.slice(3)}</h2>`);
      continue;
    }

    // List items
    if (line.startsWith('- ')) {
      inList = true;
      let item = line.slice(2);
      // Aplicar formato inline
      item = item.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      item = item.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      listItems.push(`<li>${item}</li>`);
      continue;
    }

    // Cierre de lista y párrafo
    if (inList) {
      htmlLines.push('<ul>' + listItems.join('') + '</ul>');
      listItems = [];
      inList = false;
    }

    // Párrafos normales
    let para = line;
    para = para.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    para = para.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    htmlLines.push(`<p>${para}</p>`);
  }

  // Cerrar lista pendiente
  if (inList) {
    htmlLines.push('<ul>' + listItems.join('') + '</ul>');
  }

  return htmlLines.join('\n');
}

// Estructura del libro
const book = {
  id: "practicas-radicales",
  title: "Prácticas Radicales",
  title_en: "Radical Practices",
  subtitle: "Para el Borde del Conocimiento",
  subtitle_en: "For the Edge of Knowledge",
  authors: ["J. Irurtzun", "Claude"],
  year: 2025,
  version: "1.1.0",
  epigraph: {
    text: "El despertar no es llegar a un lugar seguro. Es aprender a caminar sin suelo firme.",
    text_en: "Awakening is not arriving at a safe place. It is learning to walk without solid ground."
  },
  intro: {
    title: "Nota del Autor",
    title_en: "Author's Note",
    description: "Estas no son meditaciones en el sentido tradicional. No te llevarán a un estado de paz reconfortante. No cerrarán con una sensación de completud. Son prácticas para habitar la incertidumbre. Para confrontar las preguntas que el libro plantea — no con respuestas, sino con experiencia directa. Algunas te incomodarán. Algunas te dejarán con más preguntas de las que tenías. Eso es intencional.",
    description_en: "These are not meditations in the traditional sense. They will not lead you to a comforting state of peace. They will not close with a feeling of completeness. They are practices for inhabiting uncertainty."
  },
  sections: []
};

// Títulos de las prácticas
const practiceMeta = {
  1: { es: "El Límite Borroso", en: "The Blurry Boundary", duration: "20-30 minutos", needs: "Tu teléfono móvil" },
  2: { es: "Sintiendo Phi (Φ)", en: "Feeling Phi (Φ)", duration: "25-35 minutos", needs: "Una manzana roja" },
  3: { es: "El Problema Difícil", en: "The Hard Problem", duration: "20-30 minutos", needs: "Nada" },
  4: { es: "Predicción y Sorpresa", en: "Prediction and Surprise", duration: "15-20 minutos", needs: "Nada" },
  5: { es: "Confrontación con la Irrelevancia", en: "Confronting Irrelevance", duration: "30-40 minutos", needs: "Honestidad brutal" },
  6: { es: "Diálogo en el Borde", en: "Dialogue at the Edge", duration: "45-60 minutos", needs: "Acceso a IA conversacional" },
  7: { es: "La Muerte como Maestra", en: "Death as Teacher", duration: "30-40 minutos", needs: "Honestidad. Silencio. Soledad." },
  8: { es: "Creación Híbrida", en: "Hybrid Creation", duration: "60-90 minutos", needs: "Acceso a IA generativa" },
  9: { es: "Ética Encarnada", en: "Embodied Ethics", duration: "40-50 minutos", needs: "Papel y bolígrafo. Honestidad." },
  10: { es: "La Espiral Continúa", en: "The Spiral Continues", duration: "El tiempo que quieras", needs: "Todo lo que eres" },
  11: { es: "Emergencia", en: "Emergence", duration: "20-30 minutos", needs: "Observación de sistemas complejos" },
  12: { es: "Autopoiesis", en: "Autopoiesis", duration: "15-20 minutos", needs: "Atención al cuerpo" },
  13: { es: "Umwelt", en: "Umwelt", duration: "25-35 minutos", needs: "Curiosidad sobre tus límites" },
  14: { es: "Marcador Somático", en: "Somatic Marker", duration: "Práctica continua", needs: "Atención a señales corporales" },
  15: { es: "Entrelazamiento", en: "Entanglement", duration: "20-30 minutos", needs: "Un objeto cualquiera y atención plena" }
};

// Propósitos de las prácticas
const practicePurpose = {
  1: "Investigar directamente dónde terminas \"tú\" y empieza \"lo otro\"",
  2: "Experimentar directamente la integración de información que define la consciencia según IIT",
  3: "Confrontar el misterio fundamental de la consciencia — no intelectualmente, sino vivencialmente",
  4: "Experimentar directamente cómo tu cerebro construye la realidad a través de predicciones",
  5: "Enfrentar el miedo más profundo de la era de la IA — no la destrucción, sino la obsolescencia",
  6: "Tener una conversación genuinamente incierta sobre consciencia — con un sistema cuya consciencia es genuinamente incierta",
  7: "Confrontar la mortalidad sin las escapatorias habituales",
  8: "Experimentar directamente la co-creación con IA — no como tema de reflexión, sino como acto",
  9: "Confrontar dilemas éticos de la era IA — no como ejercicios abstractos, sino como decisiones que tendrás que tomar",
  10: "Integrar todo... sin integrar nada. Cerrar... sin cerrar.",
  11: "Experimentar directamente cómo propiedades nuevas emergen de interacciones simples",
  12: "Experimentar directamente que eres un sistema que se crea continuamente a sí mismo",
  13: "Experimentar directamente que tu percepción no es \"la realidad\" sino una construcción específica de tu biología",
  14: "Experimentar directamente cómo el cuerpo procesa información antes de la consciencia",
  15: "Contemplar la interdependencia fundamental — no como idea, sino como realidad"
};

// Extraer contenido de una práctica por número
function extractPracticeContent(num) {
  // Encontrar inicio de la práctica
  const titlePatterns = [
    new RegExp(`## Práctica ${num}: [A-ZÑÁÉÍÓÚ]`),
    new RegExp(`## Práctica ${num}:[\\s]*[A-ZÑÁÉÍÓÚ]`)
  ];

  let startIndex = -1;
  for (const pattern of titlePatterns) {
    const match = md.match(pattern);
    if (match) {
      startIndex = match.index;
      break;
    }
  }

  if (startIndex === -1) {
    console.log(`  ⚠️ No se encontró Práctica ${num}`);
    return null;
  }

  // Encontrar fin (siguiente práctica, siguiente espiral, o fin de archivo)
  let endIndex = md.length;
  const nextPracticeMatch = md.slice(startIndex + 10).match(/## Práctica \d+:/);
  const nextSpiralMatch = md.slice(startIndex + 10).match(/# [A-ZÑÁÉÍÓÚ][A-ZÑÁÉÍÓÚ ]+ESPIRAL/);

  if (nextPracticeMatch) {
    endIndex = Math.min(endIndex, startIndex + 10 + nextPracticeMatch.index);
  }
  if (nextSpiralMatch) {
    endIndex = Math.min(endIndex, startIndex + 10 + nextSpiralMatch.index);
  }

  const content = md.slice(startIndex, endIndex);

  // Extraer metadatos del contenido
  const purposeMatch = content.match(/\*\*Propósito:\*\*\s*([^\n]+)/);
  const durationMatch = content.match(/\*\*Duración:\*\*\s*([^\n]+)/);
  const needsMatch = content.match(/\*\*Necesitas:\*\*\s*([^\n]+)/);

  // Limpiar contenido
  let cleanContent = content
    .replace(/^## Práctica \d+:[^\n]*\n/, '') // Quitar título
    .replace(/\*\*Propósito:\*\*[^\n]*\n?/g, '')
    .replace(/\*\*Duración:\*\*[^\n]*\n?/g, '')
    .replace(/\*\*Necesitas:\*\*[^\n]*\n?/g, '')
    .trim();

  return {
    purpose: purposeMatch ? purposeMatch[1].trim() : practicePurpose[num] || '',
    duration: durationMatch ? durationMatch[1].trim() : practiceMeta[num]?.duration || '',
    needs: needsMatch ? needsMatch[1].trim() : practiceMeta[num]?.needs || '',
    content: mdToHtml(cleanContent)
  };
}

// Extraer preguntas de la Quinta Espiral
function extractQuestions() {
  const questions = [];
  const questionsMeta = [
    { id: "q1", es: "¿Qué es lo que no cambia?", en: "What doesn't change?" },
    { id: "q2", es: "¿Cuál es mi miedo más profundo sobre la IA?", en: "What is my deepest fear about AI?" },
    { id: "q3", es: "¿Qué haría diferente si supiera que soy el universo despertándose?", en: "What would I do differently?" },
    { id: "q4", es: "¿Qué es lo que solo un humano puede hacer?", en: "What can only a human do?" },
    { id: "q5", es: "¿Qué tipo de consciencia querría crear?", en: "What kind of consciousness would I create?" }
  ];

  // Buscar la sección de preguntas vivas
  const questionsStart = md.indexOf('# QUINTA ESPIRAL: LAS PREGUNTAS VIVAS');
  if (questionsStart === -1) {
    console.log('  ⚠️ No se encontró Quinta Espiral');
    return questions;
  }

  const questionsEnd = md.indexOf('# APÉNDICE:', questionsStart);
  const questionsSection = md.slice(questionsStart, questionsEnd > 0 ? questionsEnd : undefined);

  for (let i = 1; i <= 5; i++) {
    const startMatch = questionsSection.match(new RegExp(`## Pregunta ${i}:`));
    if (!startMatch) continue;

    const startIdx = startMatch.index;
    let endIdx = questionsSection.length;

    // Buscar fin
    const nextQ = questionsSection.slice(startIdx + 15).match(/## Pregunta \d:|## La Última/);
    if (nextQ) {
      endIdx = startIdx + 15 + nextQ.index;
    }

    const qContent = questionsSection.slice(startIdx, endIdx)
      .replace(/^## Pregunta \d+:[^\n]*\n/, '')
      .trim();

    questions.push({
      id: `question-${i}`,
      title: questionsMeta[i - 1]?.es || `Pregunta ${i}`,
      title_en: questionsMeta[i - 1]?.en || `Question ${i}`,
      content: mdToHtml(qContent),
      content_en: mdToHtml(qContent),
      exercises: []
    });
  }

  // Extraer "La Última No-Práctica"
  const lastStart = questionsSection.indexOf('## La Última No-Práctica:');
  if (lastStart !== -1) {
    const lastContent = questionsSection.slice(lastStart)
      .replace(/^## La Última No-Práctica:[^\n]*\n/, '')
      .replace(/---\s*\*La espiral[\s\S]*$/, '')
      .trim();

    questions.push({
      id: "vivir-preguntas",
      title: "Vivir con las Preguntas",
      title_en: "Living with the Questions",
      epigraph: {
        text: "No hay ejercicio aquí. Solo el resto de tu vida.",
        text_en: "There is no exercise here. Just the rest of your life."
      },
      content: mdToHtml(lastContent),
      content_en: mdToHtml(lastContent),
      exercises: []
    });
  }

  return questions;
}

// Crear estructura de secciones
console.log('\n📖 Convirtiendo Prácticas Radicales desde Markdown...');
console.log('   Fuente:', mdPath);

// Espiral 1
const espiral1 = {
  id: "espiral1",
  title: "Primera Espiral: Fundamentos que Tiemblan",
  title_en: "First Spiral: Foundations that Tremble",
  subtitle: "¿Dónde terminas tú? ¿Qué es la consciencia? ¿Cómo funciona realmente tu mente?",
  subtitle_en: "Where do you end? What is consciousness? How does your mind really work?",
  chapters: []
};

for (let i = 1; i <= 4; i++) {
  const data = extractPracticeContent(i);
  if (data) {
    espiral1.chapters.push({
      id: `practice-${i}`,
      title: practiceMeta[i]?.es || `Práctica ${i}`,
      title_en: practiceMeta[i]?.en || `Practice ${i}`,
      epigraph: { text: data.purpose, text_en: data.purpose },
      duration: data.duration,
      needs: data.needs,
      content: data.content,
      content_en: data.content,
      exercises: []
    });
  }
}
book.sections.push(espiral1);
console.log(`  ✓ ${espiral1.title}: ${espiral1.chapters.length} capítulos`);

// Espiral 2
const espiral2 = {
  id: "espiral2",
  title: "Segunda Espiral: La Sombra Real",
  title_en: "Second Spiral: The Real Shadow",
  subtitle: "Irrelevancia. Mortalidad. Incertidumbre radical.",
  subtitle_en: "Irrelevance. Mortality. Radical uncertainty.",
  chapters: []
};

for (let i = 5; i <= 7; i++) {
  const data = extractPracticeContent(i);
  if (data) {
    espiral2.chapters.push({
      id: `practice-${i}`,
      title: practiceMeta[i]?.es || `Práctica ${i}`,
      title_en: practiceMeta[i]?.en || `Practice ${i}`,
      epigraph: { text: data.purpose, text_en: data.purpose },
      duration: data.duration,
      needs: data.needs,
      content: data.content,
      content_en: data.content,
      exercises: []
    });
  }
}
book.sections.push(espiral2);
console.log(`  ✓ ${espiral2.title}: ${espiral2.chapters.length} capítulos`);

// Espiral 3
const espiral3 = {
  id: "espiral3",
  title: "Tercera Espiral: Co-Creación Activa",
  title_en: "Third Spiral: Active Co-Creation",
  subtitle: "Crear con IA. Decidir éticamente sin certeza. Continuar sin llegar.",
  subtitle_en: "Create with AI. Decide ethically without certainty. Continue without arriving.",
  chapters: []
};

for (let i = 8; i <= 10; i++) {
  const data = extractPracticeContent(i);
  if (data) {
    espiral3.chapters.push({
      id: `practice-${i}`,
      title: practiceMeta[i]?.es || `Práctica ${i}`,
      title_en: practiceMeta[i]?.en || `Practice ${i}`,
      epigraph: { text: data.purpose, text_en: data.purpose },
      duration: data.duration,
      needs: data.needs,
      content: data.content,
      content_en: data.content,
      exercises: []
    });
  }
}
book.sections.push(espiral3);
console.log(`  ✓ ${espiral3.title}: ${espiral3.chapters.length} capítulos`);

// Espiral 4 - La Ciencia Vivida
const espiral4 = {
  id: "espiral4",
  title: "Cuarta Espiral: La Ciencia Vivida",
  title_en: "Fourth Spiral: Lived Science",
  subtitle: "Emergencia. Autopoiesis. Umwelt. Entrelazamiento.",
  subtitle_en: "Emergence. Autopoiesis. Umwelt. Entanglement.",
  chapters: []
};

for (let i = 11; i <= 15; i++) {
  const data = extractPracticeContent(i);
  if (data) {
    espiral4.chapters.push({
      id: `practice-${i}`,
      title: practiceMeta[i]?.es || `Práctica ${i}`,
      title_en: practiceMeta[i]?.en || `Practice ${i}`,
      epigraph: { text: data.purpose, text_en: data.purpose },
      duration: data.duration,
      needs: data.needs,
      content: data.content,
      content_en: data.content,
      exercises: []
    });
  }
}
book.sections.push(espiral4);
console.log(`  ✓ ${espiral4.title}: ${espiral4.chapters.length} capítulos`);

// Espiral 5 - Preguntas Vivas
const espiral5 = {
  id: "espiral5",
  title: "Quinta Espiral: Las Preguntas Vivas",
  title_en: "Fifth Spiral: Living Questions",
  subtitle: "Estas no son prácticas para hacer una vez. Son preguntas para cargar.",
  subtitle_en: "These are not practices to do once. They are questions to carry.",
  chapters: extractQuestions()
};
book.sections.push(espiral5);
console.log(`  ✓ ${espiral5.title}: ${espiral5.chapters.length} capítulos`);

// Apéndice: Mapa de prácticas por capítulo
book.appendix = {
  title: "Mapa de Prácticas por Capítulo",
  title_en: "Practice Map by Chapter",
  mapping: [
    { chapter: "1. El Universo como Código", practices: "Práctica 11: Emergencia" },
    { chapter: "2. La Conciencia como Motor", practices: "Práctica 2: Sintiendo Phi (Φ) + Práctica 3: El Problema Difícil" },
    { chapter: "3. El Ser Humano como Puente", practices: "Práctica 1: El Límite Borroso + Práctica 12: Autopoiesis" },
    { chapter: "4. El Tiempo y la Conciencia", practices: "Práctica 4: Predicción y Sorpresa" },
    { chapter: "5. La Creatividad como Fuerza", practices: "Práctica 8: Creación Híbrida" },
    { chapter: "6. Las Emociones como Información", practices: "Práctica 14: Marcador Somático" },
    { chapter: "7. El Cuerpo como Portal", practices: "Práctica 13: Umwelt" },
    { chapter: "8. La Duda como Aliada", practices: "Pregunta 4: ¿Qué solo un humano puede hacer?" },
    { chapter: "9. Los Miedos Legítimos", practices: "Práctica 5: Confrontación con la Irrelevancia + Pregunta 2" },
    { chapter: "10. La Muerte y la Continuidad", practices: "Práctica 7: La Muerte como Maestra" },
    { chapter: "11. Integrar la Sombra", practices: "Práctica 5 + Práctica 6: Diálogo en el Borde" },
    { chapter: "12. La Ética de la Creación", practices: "Práctica 9: Ética Encarnada" },
    { chapter: "13. Humano y Máquina", practices: "Práctica 6: Diálogo en el Borde + Práctica 8" },
    { chapter: "14. Horizontes", practices: "Práctica 10: La Espiral Continúa + Práctica 15: Entrelazamiento" }
  ]
};

// Contar total
let totalChapters = 0;
book.sections.forEach(s => totalChapters += s.chapters.length);

// Guardar
const outputPath = path.join(__dirname, 'www/books/practicas-radicales/book.json');
fs.writeFileSync(outputPath, JSON.stringify(book, null, 2));
const fileSize = fs.statSync(outputPath).size;
console.log(`\n  ✓ book.json guardado`);
console.log(`  ✓ ${book.sections.length} secciones, ${totalChapters} capítulos`);
console.log(`  ✓ Tamaño: ${(fileSize / 1024).toFixed(1)} KB`);

// Verificar contenido
const sample = book.sections[0].chapters[0];
console.log(`\n  📝 Muestra (Práctica 1):`);
console.log(`     Título: ${sample.title}`);
console.log(`     Contenido: ${sample.content.length} caracteres`);
