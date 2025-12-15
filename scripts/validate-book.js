#!/usr/bin/env node

/**
 * VALIDATE-BOOK.JS
 * ================
 * Script de validación completa para libros de la Colección Nuevo Ser
 *
 * Uso:
 *   node scripts/validate-book.js <libro-id>
 *
 * Ejemplo:
 *   node scripts/validate-book.js codigo-despertar
 */

const fs = require('fs');
const path = require('path');

// Colores para output en terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class BookValidator {
  constructor(libroId) {
    this.libroId = libroId;
    this.rutaBase = path.join(__dirname, '..');
    this.rutaLibro = path.join(this.rutaBase, 'www', 'books', libroId);
    this.errores = [];
    this.advertencias = [];
    this.info = [];
  }

  /**
   * Validar libro completo
   */
  validar() {
    console.log(`\n${colors.bright}${colors.cyan}📚 Validando libro: ${this.libroId}${colors.reset}\n`);

    // 1. Verificar que existe la carpeta
    if (!fs.existsSync(this.rutaLibro)) {
      this.errores.push(`La carpeta del libro no existe: ${this.rutaLibro}`);
      this.mostrarResultados();
      return false;
    }

    // 2. Validar archivos obligatorios
    this.validarArchivosObligatorios();

    // 3. Validar book.json
    this.validarBookJson();

    // 4. Validar config.json
    this.validarConfigJson();

    // 5. Validar coherencia entre archivos
    this.validarCoherencia();

    // 6. Validar assets opcionales
    this.validarAssets();

    // 7. Validar registro en catalog.json
    this.validarCatalogo();

    // 8. Validar tema CSS
    this.validarTemaCss();

    // 9. Estadísticas
    this.mostrarEstadisticas();

    // Mostrar resultados
    this.mostrarResultados();

    return this.errores.length === 0;
  }

  /**
   * Validar archivos obligatorios
   */
  validarArchivosObligatorios() {
    const archivosObligatorios = ['book.json', 'config.json'];

    archivosObligatorios.forEach(archivo => {
      const rutaArchivo = path.join(this.rutaLibro, archivo);
      if (!fs.existsSync(rutaArchivo)) {
        this.errores.push(`Falta archivo obligatorio: ${archivo}`);
      }
    });
  }

  /**
   * Validar book.json
   */
  validarBookJson() {
    const rutaBookJson = path.join(this.rutaLibro, 'book.json');

    if (!fs.existsSync(rutaBookJson)) return;

    try {
      const contenido = fs.readFileSync(rutaBookJson, 'utf-8');
      const datosLibro = JSON.parse(contenido);

      // Validar campos obligatorios
      const camposObligatorios = ['title', 'subtitle', 'author', 'sections'];
      camposObligatorios.forEach(campo => {
        if (!datosLibro[campo]) {
          this.errores.push(`book.json: Falta campo obligatorio '${campo}'`);
        }
      });

      // Validar secciones
      if (datosLibro.sections && Array.isArray(datosLibro.sections)) {
        if (datosLibro.sections.length === 0) {
          this.errores.push(`book.json: El libro debe tener al menos una sección`);
        }

        datosLibro.sections.forEach((seccion, index) => {
          this.validarSeccion(seccion, index);
        });
      }

      // Validar IDs únicos
      this.validarIdsUnicos(datosLibro);

      // Validar contenido Markdown
      this.validarMarkdown(datosLibro);

      this.info.push(`book.json: ${this.contarCapitulos(datosLibro)} capítulos en ${datosLibro.sections?.length || 0} secciones`);
      console.log(`${colors.green}✅ book.json: Estructura básica válida${colors.reset}`);

    } catch (error) {
      if (error instanceof SyntaxError) {
        this.errores.push(`book.json: Error de sintaxis JSON - ${error.message}`);
      } else {
        this.errores.push(`book.json: Error al procesar - ${error.message}`);
      }
    }
  }

  /**
   * Validar una sección
   */
  validarSeccion(seccion, indexSeccion) {
    if (!seccion.id) {
      this.errores.push(`Sección ${indexSeccion}: Falta campo 'id'`);
    } else if (!/^[a-z0-9-]+$/.test(seccion.id)) {
      this.errores.push(`Sección '${seccion.id}': ID debe usar formato kebab-case`);
    }

    if (!seccion.title) {
      this.errores.push(`Sección ${indexSeccion}: Falta campo 'title'`);
    }

    if (!seccion.chapters || !Array.isArray(seccion.chapters)) {
      this.errores.push(`Sección '${seccion.id}': Falta array 'chapters'`);
      return;
    }

    if (seccion.chapters.length === 0) {
      this.advertencias.push(`Sección '${seccion.id}': No tiene capítulos`);
    }

    seccion.chapters.forEach((capitulo, indexCap) => {
      this.validarCapitulo(capitulo, seccion.id, indexCap);
    });
  }

  /**
   * Validar un capítulo
   */
  validarCapitulo(capitulo, seccionId, indexCap) {
    const prefijo = `Sección '${seccionId}', Capítulo ${indexCap}`;

    if (!capitulo.id) {
      this.errores.push(`${prefijo}: Falta campo 'id'`);
    } else if (!/^[a-z0-9-]+$/.test(capitulo.id)) {
      this.errores.push(`${prefijo} '${capitulo.id}': ID debe usar formato kebab-case`);
    }

    if (!capitulo.title) {
      this.errores.push(`${prefijo}: Falta campo 'title'`);
    }

    if (!capitulo.content) {
      this.errores.push(`${prefijo} '${capitulo.id}': Falta campo 'content'`);
    } else if (capitulo.content.trim().length === 0) {
      this.advertencias.push(`${prefijo} '${capitulo.id}': Contenido vacío`);
    }

    // Validar ejercicios si existen
    if (capitulo.exercises && Array.isArray(capitulo.exercises)) {
      capitulo.exercises.forEach((ejercicio, indexEj) => {
        this.validarEjercicio(ejercicio, capitulo.id, indexEj);
      });
    }
  }

  /**
   * Validar un ejercicio
   */
  validarEjercicio(ejercicio, capituloId, indexEj) {
    const prefijo = `Capítulo '${capituloId}', Ejercicio ${indexEj}`;

    if (!ejercicio.id) {
      this.advertencias.push(`${prefijo}: Falta campo 'id'`);
    }

    if (!ejercicio.title) {
      this.advertencias.push(`${prefijo}: Falta campo 'title'`);
    }

    if (!ejercicio.steps || !Array.isArray(ejercicio.steps) || ejercicio.steps.length === 0) {
      this.advertencias.push(`${prefijo}: Falta array 'steps' o está vacío`);
    }
  }

  /**
   * Validar config.json
   */
  validarConfigJson() {
    const rutaConfigJson = path.join(this.rutaLibro, 'config.json');

    if (!fs.existsSync(rutaConfigJson)) return;

    try {
      const contenido = fs.readFileSync(rutaConfigJson, 'utf-8');
      const configuracion = JSON.parse(contenido);

      // Validar campos obligatorios
      const camposObligatorios = ['id', 'version', 'lastUpdate', 'theme', 'ui', 'features', 'content', 'metadata'];
      camposObligatorios.forEach(campo => {
        if (!configuracion[campo]) {
          this.errores.push(`config.json: Falta campo obligatorio '${campo}'`);
        }
      });

      // Validar que ID coincida con nombre carpeta
      if (configuracion.id && configuracion.id !== this.libroId) {
        this.errores.push(`config.json: ID '${configuracion.id}' no coincide con nombre de carpeta '${this.libroId}'`);
      }

      // Validar versión semántica
      if (configuracion.version && !/^\d+\.\d+\.\d+$/.test(configuracion.version)) {
        this.errores.push(`config.json: Versión '${configuracion.version}' no es semántica válida (debe ser X.Y.Z)`);
      }

      // Validar fecha
      if (configuracion.lastUpdate && !/^\d{4}-\d{2}-\d{2}$/.test(configuracion.lastUpdate)) {
        this.advertencias.push(`config.json: Fecha '${configuracion.lastUpdate}' no tiene formato YYYY-MM-DD`);
      }

      // Validar colores hex en theme
      if (configuracion.theme) {
        this.validarColoresHex(configuracion.theme);
      }

      // Validar animationType
      if (configuracion.ui && configuracion.ui.animationType) {
        const tiposValidos = ['cosmic', 'revolutionary', 'organic', 'minimal'];
        if (!tiposValidos.includes(configuracion.ui.animationType)) {
          this.advertencias.push(`config.json: animationType '${configuracion.ui.animationType}' no es uno de: ${tiposValidos.join(', ')}`);
        }
      }

      this.info.push(`config.json: Versión ${configuracion.version}, actualizado ${configuracion.lastUpdate}`);
      console.log(`${colors.green}✅ config.json: Estructura básica válida${colors.reset}`);

    } catch (error) {
      if (error instanceof SyntaxError) {
        this.errores.push(`config.json: Error de sintaxis JSON - ${error.message}`);
      } else {
        this.errores.push(`config.json: Error al procesar - ${error.message}`);
      }
    }
  }

  /**
   * Validar coherencia entre book.json y config.json
   */
  validarCoherencia() {
    const rutaBookJson = path.join(this.rutaLibro, 'book.json');
    const rutaConfigJson = path.join(this.rutaLibro, 'config.json');

    if (!fs.existsSync(rutaBookJson) || !fs.existsSync(rutaConfigJson)) return;

    try {
      const configuracion = JSON.parse(fs.readFileSync(rutaConfigJson, 'utf-8'));

      // Verificar que sourceFile apunta a book.json correcto
      const sourceFileEsperado = `books/${this.libroId}/book.json`;
      if (configuracion.content && configuracion.content.sourceFile !== sourceFileEsperado) {
        this.advertencias.push(`config.json: content.sourceFile debería ser '${sourceFileEsperado}'`);
      }

      console.log(`${colors.green}✅ Coherencia entre archivos: OK${colors.reset}`);

    } catch (error) {
      this.errores.push(`Error validando coherencia: ${error.message}`);
    }
  }

  /**
   * Validar assets opcionales
   */
  validarAssets() {
    const rutaAssets = path.join(this.rutaLibro, 'assets');

    if (!fs.existsSync(rutaAssets)) {
      this.advertencias.push('No existe carpeta assets/ (opcional pero recomendada)');
      return;
    }

    // Lista de assets opcionales
    const assetsOpcionales = ['resources.json', 'quizzes.json', 'chapter-metadata.json', 'timeline.json', 'cover.jpg', 'cover.png', 'cover.svg'];

    const assetsEncontrados = [];
    assetsOpcionales.forEach(archivo => {
      const rutaArchivo = path.join(rutaAssets, archivo);
      if (fs.existsSync(rutaArchivo)) {
        assetsEncontrados.push(archivo);

        // Validar JSONs
        if (archivo.endsWith('.json')) {
          this.validarAssetJson(archivo, rutaArchivo);
        }
      }
    });

    if (assetsEncontrados.length > 0) {
      this.info.push(`Assets encontrados: ${assetsEncontrados.join(', ')}`);
    } else {
      this.advertencias.push('Carpeta assets/ vacía - considera añadir resources.json, quizzes.json, etc.');
    }
  }

  /**
   * Validar un archivo JSON en assets
   */
  validarAssetJson(nombreArchivo, rutaArchivo) {
    try {
      const contenido = JSON.parse(fs.readFileSync(rutaArchivo, 'utf-8'));
      console.log(`${colors.green}✅ assets/${nombreArchivo}: JSON válido${colors.reset}`);
    } catch (error) {
      this.errores.push(`assets/${nombreArchivo}: Error de sintaxis JSON - ${error.message}`);
    }
  }

  /**
   * Validar registro en catalog.json
   */
  validarCatalogo() {
    const rutaCatalogo = path.join(this.rutaBase, 'www', 'books', 'catalog.json');

    if (!fs.existsSync(rutaCatalogo)) {
      this.errores.push('No existe catalog.json global');
      return;
    }

    try {
      const catalogo = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf-8'));

      // Verificar que el libro esté registrado
      const libroEnCatalogo = catalogo.books && catalogo.books.find(libro => libro.id === this.libroId);

      if (!libroEnCatalogo) {
        this.errores.push(`Libro '${this.libroId}' NO está registrado en catalog.json`);
      } else {
        console.log(`${colors.green}✅ Libro registrado en catalog.json${colors.reset}`);

        // Validar coherencia con config.json
        const rutaConfigJson = path.join(this.rutaLibro, 'config.json');
        if (fs.existsSync(rutaConfigJson)) {
          const configuracion = JSON.parse(fs.readFileSync(rutaConfigJson, 'utf-8'));

          if (configuracion.theme && libroEnCatalogo.color !== configuracion.theme.primary) {
            this.advertencias.push(`Color en catalog.json (${libroEnCatalogo.color}) difiere de config.json theme.primary (${configuracion.theme.primary})`);
          }
        }
      }

    } catch (error) {
      this.errores.push(`Error al validar catalog.json: ${error.message}`);
    }
  }

  /**
   * Validar tema CSS
   */
  validarTemaCss() {
    const rutaTema = path.join(this.rutaBase, 'www', 'css', 'themes', `${this.libroId}.css`);

    if (!fs.existsSync(rutaTema)) {
      this.advertencias.push(`No existe tema CSS: www/css/themes/${this.libroId}.css (opcional pero recomendado)`);
      return;
    }

    // Leer el archivo CSS y verificar que tenga variables CSS
    try {
      const contenidoCss = fs.readFileSync(rutaTema, 'utf-8');

      // Buscar variables CSS obligatorias
      const variablesObligatorias = [
        '--color-primary',
        '--color-secondary',
        '--color-background',
        '--color-text'
      ];

      const variablesFaltantes = variablesObligatorias.filter(variable => !contenidoCss.includes(variable));

      if (variablesFaltantes.length > 0) {
        this.advertencias.push(`Tema CSS falta variables: ${variablesFaltantes.join(', ')}`);
      } else {
        console.log(`${colors.green}✅ Tema CSS encontrado con variables estándar${colors.reset}`);
      }

    } catch (error) {
      this.advertencias.push(`Error leyendo tema CSS: ${error.message}`);
    }
  }

  /**
   * Validar IDs únicos en book.json
   */
  validarIdsUnicos(datosLibro) {
    const idsEncontrados = new Set();
    const idsDuplicados = [];

    if (!datosLibro.sections) return;

    datosLibro.sections.forEach(seccion => {
      if (!seccion.chapters) return;

      seccion.chapters.forEach(capitulo => {
        if (idsEncontrados.has(capitulo.id)) {
          idsDuplicados.push(capitulo.id);
        }
        idsEncontrados.add(capitulo.id);
      });
    });

    if (idsDuplicados.length > 0) {
      this.errores.push(`IDs de capítulos duplicados: ${idsDuplicados.join(', ')}`);
    }
  }

  /**
   * Validar contenido Markdown
   */
  validarMarkdown(datosLibro) {
    if (!datosLibro.sections) return;

    let capitulosSinContenido = 0;

    datosLibro.sections.forEach(seccion => {
      if (!seccion.chapters) return;

      seccion.chapters.forEach(capitulo => {
        if (!capitulo.content || capitulo.content.trim().length === 0) {
          capitulosSinContenido++;
        }
      });
    });

    if (capitulosSinContenido > 0) {
      this.advertencias.push(`${capitulosSinContenido} capítulo(s) sin contenido`);
    }
  }

  /**
   * Validar colores hexadecimales
   */
  validarColoresHex(tema) {
    const regexHex = /^#[0-9a-fA-F]{6}$/;
    const camposColor = ['primary', 'secondary', 'accent', 'background', 'text'];

    camposColor.forEach(campo => {
      if (tema[campo] && !regexHex.test(tema[campo])) {
        this.errores.push(`config.json: Color inválido en theme.${campo}: ${tema[campo]}`);
      }
    });
  }

  /**
   * Contar capítulos totales
   */
  contarCapitulos(datosLibro) {
    if (!datosLibro.sections) return 0;

    return datosLibro.sections.reduce((total, seccion) => {
      return total + (seccion.chapters ? seccion.chapters.length : 0);
    }, 0);
  }

  /**
   * Mostrar estadísticas del libro
   */
  mostrarEstadisticas() {
    const rutaBookJson = path.join(this.rutaLibro, 'book.json');

    if (!fs.existsSync(rutaBookJson)) return;

    try {
      const datosLibro = JSON.parse(fs.readFileSync(rutaBookJson, 'utf-8'));

      const totalSecciones = datosLibro.sections ? datosLibro.sections.length : 0;
      const totalCapitulos = this.contarCapitulos(datosLibro);

      let totalEjercicios = 0;
      if (datosLibro.sections) {
        datosLibro.sections.forEach(seccion => {
          if (seccion.chapters) {
            seccion.chapters.forEach(capitulo => {
              if (capitulo.exercises) {
                totalEjercicios += capitulo.exercises.length;
              }
            });
          }
        });
      }

      console.log(`\n${colors.bright}${colors.blue}📊 Estadísticas:${colors.reset}`);
      console.log(`   Secciones: ${totalSecciones}`);
      console.log(`   Capítulos: ${totalCapitulos}`);
      console.log(`   Ejercicios: ${totalEjercicios}`);

    } catch (error) {
      // Silencioso si no se pueden obtener estadísticas
    }
  }

  /**
   * Mostrar resultados finales
   */
  mostrarResultados() {
    console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}RESULTADOS DE VALIDACIÓN${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);

    if (this.info.length > 0) {
      console.log(`${colors.blue}${colors.bright}INFO:${colors.reset}\n`);
      this.info.forEach(info => console.log(`${colors.blue}ℹ️  ${info}${colors.reset}`));
      console.log('');
    }

    if (this.advertencias.length > 0) {
      console.log(`${colors.yellow}${colors.bright}ADVERTENCIAS:${colors.reset}\n`);
      this.advertencias.forEach(advertencia => console.log(`${colors.yellow}⚠️  ${advertencia}${colors.reset}`));
      console.log('');
    }

    if (this.errores.length > 0) {
      console.log(`${colors.red}${colors.bright}ERRORES:${colors.reset}\n`);
      this.errores.forEach(error => console.log(`${colors.red}❌ ${error}${colors.reset}`));
      console.log('');
    }

    // Resumen final
    if (this.errores.length === 0 && this.advertencias.length === 0) {
      console.log(`${colors.green}${colors.bright}✅ ¡LIBRO VÁLIDO! No se encontraron problemas.${colors.reset}\n`);
    } else if (this.errores.length === 0) {
      console.log(`${colors.yellow}${colors.bright}⚠️  Libro válido con ${this.advertencias.length} advertencia(s).${colors.reset}\n`);
    } else {
      console.log(`${colors.red}${colors.bright}❌ Validación FALLIDA: ${this.errores.length} error(es), ${this.advertencias.length} advertencia(s).${colors.reset}\n`);
    }
  }
}

// Ejecutar validación
if (require.main === module) {
  const libroId = process.argv[2];

  if (!libroId) {
    console.error(`${colors.red}❌ Uso: node validate-book.js [libro-id]${colors.reset}`);
    console.error(`${colors.yellow}   Ejemplo: node validate-book.js codigo-despertar${colors.reset}`);
    process.exit(1);
  }

  const validador = new BookValidator(libroId);
  const esValido = validador.validar();

  process.exit(esValido ? 0 : 1);
}

module.exports = BookValidator;
