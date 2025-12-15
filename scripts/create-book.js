#!/usr/bin/env node

/**
 * create-book.js
 * ============================================================================
 * Script interactivo para generar la estructura de un nuevo libro
 *
 * Uso:
 *   node scripts/create-book.js
 *
 * El script preguntará interactivamente todos los datos necesarios
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

// Interfaz de lectura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisificar readline
const pregunta = (query) => new Promise((resolve) => rl.question(query, resolve));

// Datos del libro
const datosLibro = {
  id: '',
  title: '',
  subtitle: '',
  author: '',
  coAuthor: '',
  theme: {
    name: '',
    primary: '',
    secondary: '',
    accent: '',
    background: '',
    text: ''
  },
  animationType: 'cosmic',
  readingLevel: 'intermediate',
  recommendedPace: 'reflective'
};

/**
 * Validar formato kebab-case
 */
function validarKebabCase(str) {
  return /^[a-z0-9-]+$/.test(str);
}

/**
 * Validar color hexadecimal
 */
function validarColorHex(str) {
  return /^#[0-9a-fA-F]{6}$/.test(str);
}

/**
 * Convertir texto a kebab-case
 */
function toKebabCase(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Recolectar datos del libro interactivamente
 */
async function recolectarDatos() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📚 GENERADOR DE LIBROS - Colección Nuevo Ser');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(colors.reset);

  // 1. Título del libro
  while (!datosLibro.title) {
    const titulo = await pregunta(`${colors.green}📖 Título del libro: ${colors.reset}`);
    if (titulo.trim()) {
      datosLibro.title = titulo.trim();
    } else {
      console.log(`${colors.yellow}⚠️  El título es obligatorio${colors.reset}`);
    }
  }

  // 2. ID del libro (auto-generar desde título)
  const idSugerido = toKebabCase(datosLibro.title);
  const idInput = await pregunta(`${colors.green}🔑 ID del libro [${idSugerido}]: ${colors.reset}`);
  datosLibro.id = idInput.trim() || idSugerido;

  if (!validarKebabCase(datosLibro.id)) {
    console.log(`${colors.red}❌ ID inválido. Usando: ${idSugerido}${colors.reset}`);
    datosLibro.id = idSugerido;
  }

  // 3. Subtítulo
  const subtitulo = await pregunta(`${colors.green}📝 Subtítulo: ${colors.reset}`);
  datosLibro.subtitle = subtitulo.trim();

  // 4. Autor
  while (!datosLibro.author) {
    const autor = await pregunta(`${colors.green}✍️  Autor: ${colors.reset}`);
    if (autor.trim()) {
      datosLibro.author = autor.trim();
    } else {
      console.log(`${colors.yellow}⚠️  El autor es obligatorio${colors.reset}`);
    }
  }

  // 5. Co-autor (opcional)
  const coAutor = await pregunta(`${colors.green}👥 Co-autor (opcional): ${colors.reset}`);
  datosLibro.coAuthor = coAutor.trim();

  console.log(`\n${colors.cyan}${colors.bright}CONFIGURACIÓN DE TEMA${colors.reset}\n`);

  // 6. Nombre del tema
  const nombreTema = await pregunta(`${colors.blue}🎨 Nombre del tema: ${colors.reset}`);
  datosLibro.theme.name = nombreTema.trim() || datosLibro.title;

  // 7. Colores del tema
  console.log(`${colors.dim}Ingresa colores en formato hexadecimal (ej: #059669)${colors.reset}`);

  while (!datosLibro.theme.primary) {
    const primary = await pregunta(`${colors.blue}  Color primario: ${colors.reset}`);
    if (validarColorHex(primary.trim())) {
      datosLibro.theme.primary = primary.trim();
    } else {
      console.log(`${colors.yellow}  ⚠️  Formato inválido. Usa formato #RRGGBB${colors.reset}`);
    }
  }

  while (!datosLibro.theme.secondary) {
    const secondary = await pregunta(`${colors.blue}  Color secundario: ${colors.reset}`);
    if (validarColorHex(secondary.trim())) {
      datosLibro.theme.secondary = secondary.trim();
    } else {
      console.log(`${colors.yellow}  ⚠️  Formato inválido. Usa formato #RRGGBB${colors.reset}`);
    }
  }

  const accent = await pregunta(`${colors.blue}  Color de acento [#fbbf24]: ${colors.reset}`);
  datosLibro.theme.accent = validarColorHex(accent.trim()) ? accent.trim() : '#fbbf24';

  const background = await pregunta(`${colors.blue}  Color de fondo [#1a1a1a]: ${colors.reset}`);
  datosLibro.theme.background = validarColorHex(background.trim()) ? background.trim() : '#1a1a1a';

  const text = await pregunta(`${colors.blue}  Color de texto [#e5e7eb]: ${colors.reset}`);
  datosLibro.theme.text = validarColorHex(text.trim()) ? text.trim() : '#e5e7eb';

  console.log(`\n${colors.cyan}${colors.bright}CONFIGURACIÓN ADICIONAL${colors.reset}\n`);

  // 8. Tipo de animación
  console.log(`${colors.dim}Tipos disponibles: cosmic, revolutionary, organic, minimal${colors.reset}`);
  const animacion = await pregunta(`${colors.magenta}✨ Tipo de animación [cosmic]: ${colors.reset}`);
  const animacionesValidas = ['cosmic', 'revolutionary', 'organic', 'minimal'];
  datosLibro.animationType = animacionesValidas.includes(animacion.trim()) ? animacion.trim() : 'cosmic';

  // 9. Nivel de lectura
  console.log(`${colors.dim}Niveles: beginner, intermediate, advanced${colors.reset}`);
  const nivel = await pregunta(`${colors.magenta}📊 Nivel de lectura [intermediate]: ${colors.reset}`);
  const nivelesValidos = ['beginner', 'intermediate', 'advanced'];
  datosLibro.readingLevel = nivelesValidos.includes(nivel.trim()) ? nivel.trim() : 'intermediate';

  // 10. Ritmo recomendado
  console.log(`${colors.dim}Ritmos: slow, reflective, normal, fast${colors.reset}`);
  const ritmo = await pregunta(`${colors.magenta}⏱️  Ritmo recomendado [reflective]: ${colors.reset}`);
  const ritmosValidos = ['slow', 'reflective', 'normal', 'fast'];
  datosLibro.recommendedPace = ritmosValidos.includes(ritmo.trim()) ? ritmo.trim() : 'reflective';

  return datosLibro;
}

/**
 * Generar book.json
 */
function generarBookJson(datos) {
  return {
    title: datos.title,
    subtitle: datos.subtitle,
    author: datos.author,
    ...(datos.coAuthor && { coAuthor: datos.coAuthor }),
    sections: [
      {
        id: 'seccion-1',
        title: 'Primera Sección',
        subtitle: 'Subtítulo de la sección',
        chapters: [
          {
            id: 'capitulo-1',
            title: 'Primer Capítulo',
            epigraph: {
              text: 'Cita inspiradora aquí',
              author: 'Autor de la cita'
            },
            content: '## Introducción\n\nContenido del capítulo en formato Markdown.\n\n## Desarrollo\n\nMás contenido aquí.',
            closingQuestion: '¿Qué reflexiones te surgen después de leer este capítulo?',
            exercises: [
              {
                id: 'ejercicio-1',
                title: 'Ejercicio de Reflexión',
                duration: '10-15 minutos',
                description: 'Descripción breve del ejercicio',
                steps: [
                  'Paso 1: Busca un lugar tranquilo',
                  'Paso 2: Reflexiona sobre el contenido',
                  'Paso 3: Anota tus insights'
                ],
                reflection: '¿Qué descubriste durante este ejercicio?'
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Generar config.json
 */
function generarConfigJson(datos) {
  const hoy = new Date().toISOString().split('T')[0];

  return {
    id: datos.id,
    version: '1.0.0',
    lastUpdate: hoy,
    theme: {
      name: datos.theme.name,
      primary: datos.theme.primary,
      secondary: datos.theme.secondary,
      accent: datos.theme.accent,
      background: datos.theme.background,
      backgroundSecondary: ajustarBrillo(datos.theme.background, 1.2),
      text: datos.theme.text,
      textSecondary: ajustarBrillo(datos.theme.text, 0.9),
      border: datos.theme.primary,
      gradient: `from-[${datos.theme.primary}] to-[${datos.theme.secondary}]`
    },
    ui: {
      showStarfield: true,
      animationType: datos.animationType,
      animationSpeed: 'medium',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: {
        base: 16,
        heading: 24,
        title: 32
      },
      spacing: {
        section: 48,
        paragraph: 16
      }
    },
    features: {
      audiobook: {
        enabled: true,
        voice: 'es-ES',
        speedControl: true,
        speeds: [0.75, 1.0, 1.25, 1.5],
        highlightCurrentParagraph: true,
        autoAdvanceChapter: false
      },
      aiChat: {
        enabled: true,
        systemPrompt: `Eres un asistente especializado en "${datos.title}". Ayuda al lector a comprender y aplicar los conceptos del libro.`,
        modes: {},
        maxHistoryMessages: 10
      },
      personalNotes: {
        enabled: true,
        markdown: true,
        exportable: true
      },
      bookmarks: {
        enabled: true,
        allowMultiple: true
      },
      progressTracking: {
        enabled: true,
        trackTime: true,
        trackChapters: true,
        trackExercises: true
      }
    },
    content: {
      sourceFile: 'book.json',
      dataStructure: 'standard'
    },
    metadata: {
      locale: 'es-ES',
      readingLevel: datos.readingLevel,
      recommendedPace: datos.recommendedPace,
      tags: ['filosofía', 'crecimiento-personal'],
      complementaryBooks: []
    }
  };
}

/**
 * Ajustar brillo de color hex (simplificado)
 */
function ajustarBrillo(hexColor, factor) {
  const hex = hexColor.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.min(255, Math.floor(r * factor));
  g = Math.min(255, Math.floor(g * factor));
  b = Math.min(255, Math.floor(b * factor));

  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Generar README.md para el libro
 */
function generarReadme(datos) {
  return `# ${datos.title}

${datos.subtitle ? `> ${datos.subtitle}\n` : ''}
**Autor:** ${datos.author}${datos.coAuthor ? ` y ${datos.coAuthor}` : ''}

## Estructura del Libro

Este libro forma parte de la Colección Nuevo Ser.

### Archivos principales

- \`book.json\` - Contenido del libro (secciones, capítulos, ejercicios)
- \`config.json\` - Configuración del tema y características
- \`assets/\` - Recursos adicionales

### Assets opcionales

- \`assets/chapter-metadata.json\` - Metadatos por capítulo
- \`assets/quizzes.json\` - Cuestionarios interactivos
- \`assets/resources.json\` - Recursos adicionales
- \`assets/timeline.json\` - Líneas de tiempo

## Desarrollo

### Validar el libro

\`\`\`bash
node scripts/validate-book.js ${datos.id}
\`\`\`

### Tema CSS

El tema CSS está en: \`www/css/themes/${datos.id}.css\`

Colores del tema:
- Primario: ${datos.theme.primary}
- Secundario: ${datos.theme.secondary}
- Acento: ${datos.theme.accent}

## Notas

- El contenido está en formato Markdown
- Los IDs deben ser únicos y en formato kebab-case
- Sigue las guías de estilo en \`/docs/AÑADIR-LIBRO.md\`
`;
}

/**
 * Generar tema CSS básico
 */
function generarTemaCss(datos) {
  const kebabName = datos.id;
  const themeName = datos.theme.name;

  return `/* ============================================================================
   TEMA: ${themeName.toUpperCase()}
   ============================================================================
   ${datos.subtitle || 'Tema personalizado para ' + datos.title}
   ============================================================================ */

/* VARIABLES CSS - DARK MODE */
body.theme-dark.theme-${kebabName} {
  --color-primary: ${datos.theme.primary};
  --color-secondary: ${datos.theme.secondary};
  --color-accent: ${datos.theme.accent};
  --color-background: ${datos.theme.background};
  --color-background-secondary: ${ajustarBrillo(datos.theme.background, 1.2)};
  --color-text: ${datos.theme.text};
  --color-text-secondary: ${ajustarBrillo(datos.theme.text, 0.9)};
  --color-border: ${datos.theme.primary};
}

/* VARIABLES CSS - LIGHT MODE */
body.theme-light.theme-${kebabName} {
  --color-primary: ${datos.theme.primary};
  --color-secondary: ${datos.theme.secondary};
  --color-accent: ${ajustarBrillo(datos.theme.accent, 0.8)};
  --color-background: #ffffff;
  --color-background-secondary: #f9fafb;
  --color-text: #1f2937;
  --color-text-secondary: #4b5563;
  --color-border: ${ajustarBrillo(datos.theme.primary, 1.2)};
}

/* FONDO ANIMADO - DARK MODE */
body.theme-dark.theme-${kebabName} {
  background: ${datos.theme.background};
  position: relative;
  overflow-x: hidden;
}

body.theme-dark.theme-${kebabName}::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, ${datos.theme.primary}15 0%, transparent 50%);
  opacity: 0.5;
  z-index: -1;
  pointer-events: none;
  animation: ${kebabName}Pulse 20s ease-in-out infinite;
}

/* ANIMACIONES */
@keyframes ${kebabName}Pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

/* TARJETAS */
.theme-dark.theme-${kebabName} .card:hover {
  box-shadow: 0 10px 40px -10px ${datos.theme.primary}80;
  transform: translateY(-2px);
}

/* BOTONES */
.theme-dark.theme-${kebabName} .btn-primary {
  background: linear-gradient(135deg, ${datos.theme.primary} 0%, ${datos.theme.secondary} 100%);
  border-color: ${datos.theme.primary};
}

.theme-dark.theme-${kebabName} .btn-primary:hover {
  background: linear-gradient(135deg, ${datos.theme.secondary} 0%, ${datos.theme.primary} 100%);
  box-shadow: 0 4px 20px ${datos.theme.primary}66;
}

/* ENLACES */
.theme-dark.theme-${kebabName} a {
  color: ${datos.theme.secondary};
}

.theme-dark.theme-${kebabName} a:hover {
  color: ${datos.theme.primary};
}

/* HEADINGS */
.theme-dark.theme-${kebabName} h1,
.theme-dark.theme-${kebabName} h2,
.theme-dark.theme-${kebabName} h3 {
  color: ${datos.theme.text};
  text-shadow: 0 2px 10px ${datos.theme.primary}40;
}

/* SCROLLBAR */
.theme-dark.theme-${kebabName} ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, ${datos.theme.primary} 0%, ${datos.theme.secondary} 100%);
}

/* CÓDIGO Y BLOCKQUOTES */
.theme-dark.theme-${kebabName} code,
.theme-dark.theme-${kebabName} pre {
  background: ${datos.theme.primary}15;
  border-color: ${datos.theme.border};
}

.theme-dark.theme-${kebabName} blockquote {
  border-left-color: ${datos.theme.primary};
  background: ${datos.theme.primary}10;
}
`;
}

/**
 * Crear estructura de archivos
 */
async function crearEstructura(datos) {
  const rutaBase = path.join(__dirname, '..');
  const rutaLibro = path.join(rutaBase, 'www', 'books', datos.id);
  const rutaAssets = path.join(rutaLibro, 'assets');
  const rutaTema = path.join(rutaBase, 'www', 'css', 'themes', `${datos.id}.css`);

  console.log(`\n${colors.cyan}${colors.bright}CREANDO ESTRUCTURA...${colors.reset}\n`);

  // 1. Verificar que no existe
  if (fs.existsSync(rutaLibro)) {
    console.log(`${colors.red}❌ Error: El libro "${datos.id}" ya existe${colors.reset}`);
    return false;
  }

  try {
    // 2. Crear directorios
    fs.mkdirSync(rutaLibro, { recursive: true });
    fs.mkdirSync(rutaAssets, { recursive: true });
    console.log(`${colors.green}✓${colors.reset} Creado directorio: ${colors.dim}www/books/${datos.id}/${colors.reset}`);
    console.log(`${colors.green}✓${colors.reset} Creado directorio: ${colors.dim}www/books/${datos.id}/assets/${colors.reset}`);

    // 3. Generar book.json
    const bookJson = generarBookJson(datos);
    fs.writeFileSync(
      path.join(rutaLibro, 'book.json'),
      JSON.stringify(bookJson, null, 2),
      'utf8'
    );
    console.log(`${colors.green}✓${colors.reset} Generado: ${colors.dim}book.json${colors.reset}`);

    // 4. Generar config.json
    const configJson = generarConfigJson(datos);
    fs.writeFileSync(
      path.join(rutaLibro, 'config.json'),
      JSON.stringify(configJson, null, 2),
      'utf8'
    );
    console.log(`${colors.green}✓${colors.reset} Generado: ${colors.dim}config.json${colors.reset}`);

    // 5. Generar README.md
    const readme = generarReadme(datos);
    fs.writeFileSync(
      path.join(rutaLibro, 'README.md'),
      readme,
      'utf8'
    );
    console.log(`${colors.green}✓${colors.reset} Generado: ${colors.dim}README.md${colors.reset}`);

    // 6. Generar tema CSS
    const temaCss = generarTemaCss(datos);
    fs.writeFileSync(rutaTema, temaCss, 'utf8');
    console.log(`${colors.green}✓${colors.reset} Generado: ${colors.dim}www/css/themes/${datos.id}.css${colors.reset}`);

    // 7. Crear archivos de assets vacíos (plantillas)
    const assetsPlantillas = {
      'chapter-metadata.json': [],
      'quizzes.json': [],
      'resources.json': { resources: [] },
      'timeline.json': { events: [] }
    };

    Object.entries(assetsPlantillas).forEach(([nombre, contenido]) => {
      fs.writeFileSync(
        path.join(rutaAssets, nombre),
        JSON.stringify(contenido, null, 2),
        'utf8'
      );
    });
    console.log(`${colors.green}✓${colors.reset} Generadas plantillas de assets`);

    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Error creando estructura: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Mostrar próximos pasos
 */
function mostrarProximosPasos(datos) {
  console.log(`\n${colors.green}${colors.bright}✅ LIBRO CREADO EXITOSAMENTE${colors.reset}\n`);
  console.log(`${colors.cyan}📚 Libro: ${colors.bright}${datos.title}${colors.reset}`);
  console.log(`${colors.cyan}🔑 ID: ${colors.bright}${datos.id}${colors.reset}\n`);

  console.log(`${colors.yellow}${colors.bright}PRÓXIMOS PASOS:${colors.reset}\n`);

  console.log(`${colors.dim}1.${colors.reset} Edita el contenido del libro:`);
  console.log(`   ${colors.blue}www/books/${datos.id}/book.json${colors.reset}\n`);

  console.log(`${colors.dim}2.${colors.reset} Personaliza el tema CSS:`);
  console.log(`   ${colors.blue}www/css/themes/${datos.id}.css${colors.reset}\n`);

  console.log(`${colors.dim}3.${colors.reset} Añade el libro al catálogo:`);
  console.log(`   ${colors.blue}www/books/catalog.json${colors.reset}`);
  console.log(`   ${colors.dim}Agrega una entrada con:`);
  console.log(`   ${colors.dim}{`);
  console.log(`     "id": "${datos.id}",`);
  console.log(`     "title": "${datos.title}",`);
  console.log(`     "author": "${datos.author}",`);
  console.log(`     "category": "categoria-aqui"`);
  console.log(`   ${colors.dim}}${colors.reset}\n`);

  console.log(`${colors.dim}4.${colors.reset} Añade el tema CSS a index.html:`);
  console.log(`   ${colors.blue}www/index.html${colors.reset}`);
  console.log(`   ${colors.dim}<link rel="stylesheet" href="css/themes/${datos.id}.css">${colors.reset}\n`);

  console.log(`${colors.dim}5.${colors.reset} Valida el libro:`);
  console.log(`   ${colors.blue}node scripts/validate-book.js ${datos.id}${colors.reset}\n`);

  console.log(`${colors.dim}6.${colors.reset} Completa los assets opcionales en:`);
  console.log(`   ${colors.blue}www/books/${datos.id}/assets/${colors.reset}\n`);

  console.log(`${colors.green}¡Listo para empezar a escribir! 📝${colors.reset}\n`);
}

/**
 * Main
 */
async function main() {
  try {
    const datos = await recolectarDatos();
    rl.close();

    const exito = await crearEstructura(datos);

    if (exito) {
      mostrarProximosPasos(datos);
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
}

// Ejecutar
main();
