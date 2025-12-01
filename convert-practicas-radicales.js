#!/usr/bin/env node
/**
 * Script específico para convertir Prácticas Radicales de HTML a JSON
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'www/books/practicas-radicales/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Definir las secciones (espirales) y sus prácticas
const sections = [
  {
    id: "espiral1",
    title: "Espiral 1: Fundamentos que Tiemblan",
    title_en: "Spiral 1: Foundations that Tremble",
    subtitle: "¿Dónde terminas tú? ¿Qué es la consciencia? ¿Cómo funciona realmente tu mente? Prácticas que confrontan los supuestos básicos sobre quién eres.",
    subtitle_en: "Where do you end? What is consciousness? How does your mind really work? Practices that confront basic assumptions about who you are.",
    practiceIds: ['practice-1', 'practice-2', 'practice-3', 'practice-4']
  },
  {
    id: "espiral2",
    title: "Espiral 2: La Sombra Real",
    title_en: "Spiral 2: The Real Shadow",
    subtitle: "Irrelevancia. Mortalidad. Incertidumbre radical. Prácticas que eliminan los consuelos y te hacen enfrentar lo que prefieres evitar.",
    subtitle_en: "Irrelevance. Mortality. Radical uncertainty. Practices that remove comfort and make you face what you prefer to avoid.",
    practiceIds: ['practice-5', 'practice-6', 'practice-7']
  },
  {
    id: "espiral3",
    title: "Espiral 3: Co-Creación Activa",
    title_en: "Spiral 3: Active Co-Creation",
    subtitle: "Crear con IA. Decidir éticamente sin certeza. Continuar sin llegar. Prácticas que exigen acción, no solo contemplación.",
    subtitle_en: "Create with AI. Decide ethically without certainty. Continue without arriving. Practices that demand action, not just contemplation.",
    practiceIds: ['practice-8', 'practice-9', 'practice-10']
  },
  {
    id: "espiral4",
    title: "Espiral 4: La Ciencia Vivida",
    title_en: "Spiral 4: Lived Science",
    subtitle: "Emergencia. Autopoiesis. Umwelt. Entrelazamiento. Prácticas para encarnar las teorías científicas del libro, no solo pensarlas.",
    subtitle_en: "Emergence. Autopoiesis. Umwelt. Entanglement. Practices to embody the scientific theories of the book, not just think them.",
    practiceIds: ['practice-11', 'practice-12', 'practice-13', 'practice-14', 'practice-15']
  }
];

// Títulos de las prácticas (extraídos del sidebar)
const practiceTitles = {
  'practice-1': { es: 'El Límite Borroso', en: 'The Blurry Boundary' },
  'practice-2': { es: 'Sintiendo Phi (Φ)', en: 'Feeling Phi (Φ)' },
  'practice-3': { es: 'El Problema Difícil', en: 'The Hard Problem' },
  'practice-4': { es: 'Predicción y Sorpresa', en: 'Prediction and Surprise' },
  'practice-5': { es: 'Confrontación con la Irrelevancia', en: 'Confronting Irrelevance' },
  'practice-6': { es: 'Diálogo en el Borde', en: 'Dialogue at the Edge' },
  'practice-7': { es: 'La Muerte como Maestra', en: 'Death as Teacher' },
  'practice-8': { es: 'Creación Híbrida', en: 'Hybrid Creation' },
  'practice-9': { es: 'Ética Encarnada', en: 'Embodied Ethics' },
  'practice-10': { es: 'La Espiral Continúa', en: 'The Spiral Continues' },
  'practice-11': { es: 'Emergencia en Acción', en: 'Emergence in Action' },
  'practice-12': { es: 'Tu Umwelt', en: 'Your Umwelt' },
  'practice-13': { es: 'Autopoiesis Personal', en: 'Personal Autopoiesis' },
  'practice-14': { es: 'Entrelazamiento Cuántico Simbólico', en: 'Symbolic Quantum Entanglement' },
  'practice-15': { es: 'La Pregunta que Permanece', en: 'The Question that Remains' }
};

// Extraer contenido de una práctica
function extractPracticeContent(practiceId) {
  // Encontrar el div de la práctica
  const startRegex = new RegExp(`<div id="${practiceId}" class="practice-content">`);
  const match = html.match(startRegex);
  if (!match) return null;

  const startIndex = match.index;

  // Encontrar el final del div (siguiente practice-content o cierre del script)
  let endIndex = html.indexOf('<div id="practice-', startIndex + 1);
  if (endIndex === -1 || practiceId === 'practice-15') {
    endIndex = html.indexOf('<script>', startIndex);
  }

  const practiceHtml = html.substring(startIndex, endIndex);

  // Extraer título de la práctica
  const titleMatch = practiceHtml.match(/<h2 class="practice-title">([^<]+)<\/h2>/);
  const title = titleMatch ? titleMatch[1].trim() : practiceTitles[practiceId]?.es || '';

  // Extraer metadatos
  const purposeMatch = practiceHtml.match(/<strong>Propósito:<\/strong>\s*([^<]+)/);
  const durationMatch = practiceHtml.match(/<strong>Duración:<\/strong>\s*([^<]+)/);
  const needsMatch = practiceHtml.match(/<strong>Necesitas:<\/strong>\s*([^<]+)/);

  // Limpiar el HTML y extraer solo el contenido
  let content = practiceHtml
    .replace(/<div class="practice-header">[\s\S]*?<\/div>\s*<\/div>/gi, '') // Eliminar header
    .replace(/<div class="practice-content[^"]*">/gi, '') // Eliminar contenedor
    .replace(/<\/div>\s*$/gi, '') // Eliminar cierre
    .trim();

  // Simplificar para el formato del libro
  const cleanContent = content
    .replace(/style="[^"]*"/gi, '') // Eliminar estilos inline
    .replace(/class="[^"]*"/gi, '') // Eliminar clases
    .replace(/<div>/gi, '')
    .replace(/<\/div>/gi, '')
    .trim();

  return {
    title: practiceTitles[practiceId]?.es || title,
    title_en: practiceTitles[practiceId]?.en || title,
    purpose: purposeMatch ? purposeMatch[1].trim() : '',
    duration: durationMatch ? durationMatch[1].trim() : '',
    needs: needsMatch ? needsMatch[1].trim() : '',
    content: cleanContent,
    rawHtml: practiceHtml
  };
}

// Construir el book.json
function buildBookJson() {
  const bookSections = sections.map(section => {
    const chapters = section.practiceIds.map((practiceId, index) => {
      const practice = extractPracticeContent(practiceId);
      if (!practice) {
        console.error(`  ⚠️ No se pudo extraer: ${practiceId}`);
        return null;
      }

      return {
        id: practiceId,
        title: practice.title,
        title_en: practice.title_en,
        epigraph: practice.purpose ? {
          text: practice.purpose,
          text_en: practice.purpose // TODO: traducir
        } : null,
        duration: practice.duration,
        needs: practice.needs,
        content: practice.content,
        content_en: practice.content, // TODO: traducir
        closingQuestion: "",
        exercises: []
      };
    }).filter(Boolean);

    return {
      id: section.id,
      title: section.title,
      title_en: section.title_en,
      subtitle: section.subtitle,
      subtitle_en: section.subtitle_en,
      chapters
    };
  });

  return {
    id: "practicas-radicales",
    title: "Prácticas Radicales",
    title_en: "Radical Practices",
    subtitle: "Para el Borde del Conocimiento",
    subtitle_en: "For the Edge of Knowledge",
    authors: ["J. Irurtzun", "Claude"],
    year: 2025,
    version: "1.0.0",
    epigraph: {
      text: "El despertar no es llegar a un lugar seguro. Es aprender a caminar sin suelo firme.",
      text_en: "Awakening is not arriving at a safe place. It is learning to walk without solid ground."
    },
    intro: {
      title: "Prácticas para el Borde del Conocimiento",
      title_en: "Practices for the Edge of Knowledge",
      description: "Este manual complementa 'El Código del Despertar' con prácticas que no puedes encontrar en ningún otro lugar. No son ejercicios genéricos con vocabulario del libro pegado encima. Son experiencias únicas que solo tienen sentido dentro de este marco conceptual.",
      description_en: "This manual complements 'The Awakening Code' with practices you cannot find anywhere else. They are not generic exercises with book vocabulary pasted on top. They are unique experiences that only make sense within this conceptual framework.",
      warning: "Estas no son meditaciones en el sentido tradicional. No te llevarán a un estado de paz reconfortante. No cerrarán con una sensación de completud. Son prácticas para habitar la incertidumbre.",
      warning_en: "These are not meditations in the traditional sense. They will not lead you to a comforting state of peace. They will not close with a feeling of completeness. They are practices for inhabiting uncertainty."
    },
    sections: bookSections
  };
}

// Crear config.json
function createConfig() {
  return {
    id: "practicas-radicales",
    version: "1.0.0",
    lastUpdate: new Date().toISOString().split('T')[0],

    theme: {
      name: "Radical Fire",
      primary: "#dc2626",
      secondary: "#991b1b",
      accent: "#dc2626",
      background: "#0a0a0a",
      backgroundSecondary: "#171717",
      text: "#e0e0e0",
      textSecondary: "#999999",
      border: "#333333",
      gradient: "from-black via-red-950 to-black"
    },

    ui: {
      showStarfield: false,
      animationType: "pulse",
      animationSpeed: "slow",
      fontFamily: "Georgia, serif",
      fontSize: { base: 16, heading: 24, title: 32 },
      spacing: { section: 32, paragraph: 16 }
    },

    features: {
      exercises: {
        enabled: true,
        types: ["meditation", "confrontation", "action"],
        trackCompletion: true
      },
      audiobook: {
        enabled: true,
        voice: "es-ES",
        speedControl: true,
        speeds: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
        highlightCurrentParagraph: true,
        autoAdvanceChapter: false
      },
      aiChat: {
        enabled: true,
        systemPrompt: "Eres un guía contemplativo especializado en 'Prácticas Radicales'. Tu función es acompañar al usuario en prácticas que confrontan, no consuelan. Evita respuestas reconfortantes; ofrece preguntas profundas.",
        modes: {
          default: { name: "Guía Radical", tone: "confrontational", focus: "inquiry" }
        }
      },
      personalNotes: { enabled: true, markdown: true, exportable: true },
      bookmarks: { enabled: true, allowMultiple: true },
      progressTracking: { enabled: true, trackTime: true, trackChapters: true, trackExercises: true }
    },

    content: {
      sourceFile: "books/practicas-radicales/book.json",
      dataStructure: "standard"
    },

    metadata: {
      locale: "es-ES",
      readingLevel: "advanced",
      recommendedPace: "very-slow",
      linkedTo: "codigo-despertar"
    }
  };
}

// Main
console.log('\n📖 Convirtiendo Prácticas Radicales...');

const bookJson = buildBookJson();
const configJson = createConfig();

const bookDir = path.join(__dirname, 'www/books/practicas-radicales');

// Backup
const backupPath = path.join(bookDir, 'index-standalone-backup.html');
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(htmlPath, backupPath);
  console.log('  ✓ Backup creado');
}

// Guardar
fs.writeFileSync(path.join(bookDir, 'book.json'), JSON.stringify(bookJson, null, 2));
console.log('  ✓ book.json creado');

fs.writeFileSync(path.join(bookDir, 'config.json'), JSON.stringify(configJson, null, 2));
console.log('  ✓ config.json creado');

// Crear assets
const assetsDir = path.join(bookDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('  ✓ Carpeta assets creada');
}

const totalPractices = bookJson.sections.reduce((acc, s) => acc + s.chapters.length, 0);
console.log(`  ✓ Prácticas Radicales convertido: ${bookJson.sections.length} espirales, ${totalPractices} prácticas`);
