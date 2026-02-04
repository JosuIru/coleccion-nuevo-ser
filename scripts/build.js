#!/usr/bin/env node

/**
 * BUILD SCRIPT - Colección Nuevo Ser
 *
 * Minifica todos los archivos JS y CSS para producción.
 * Mantiene la estructura de carpetas existente.
 *
 * Uso: npm run build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../www');
const DIST_DIR = path.join(__dirname, '../dist');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logStep(step, msg) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${msg}`);
}

/**
 * Copia un directorio recursivamente
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Obtiene todos los archivos con una extensión específica
 */
function getFiles(dir, ext) {
  const files = [];

  function scan(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        // Ignorar node_modules y carpetas ocultas
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scan(fullPath);
        }
      } else if (entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

/**
 * Minifica un archivo JS usando Terser
 */
function minifyJS(filePath) {
  try {
    const options = [
      '--compress',
      'drop_console=true,drop_debugger=true,pure_funcs=["console.log","console.debug","console.info"]',
      '--mangle',
      '--format', 'comments=false',
      '--output', filePath,
      '--', filePath
    ].join(' ');

    execSync(`npx terser ${options}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Minifica un archivo CSS usando clean-css
 */
function minifyCSS(filePath) {
  try {
    execSync(`npx cleancss -o "${filePath}" "${filePath}"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene el tamaño de un archivo en formato legible
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Obtiene el tamaño total de un directorio
 */
function getDirSize(dir) {
  let size = 0;

  function scan(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
  }

  scan(dir);
  return size;
}

/**
 * Función principal de build
 */
async function build() {
  const startTime = Date.now();

  log('\n========================================', 'cyan');
  log('  BUILD - Colección Nuevo Ser', 'cyan');
  log('========================================\n', 'cyan');

  // 1. Limpiar directorio dist
  logStep('1/5', 'Limpiando directorio dist...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }

  // 2. Copiar todos los archivos
  logStep('2/5', 'Copiando archivos...');
  copyDir(SRC_DIR, DIST_DIR);

  const srcSize = getDirSize(SRC_DIR);

  // 3. Minificar archivos JS
  logStep('3/5', 'Minificando archivos JavaScript...');
  const jsFiles = getFiles(DIST_DIR, '.js');
  let jsSuccess = 0;
  let jsFailed = 0;

  for (const file of jsFiles) {
    // No minificar archivos ya minificados o de vendors
    if (file.includes('.min.js') || file.includes('vendor')) {
      continue;
    }

    process.stdout.write(`  Minificando: ${path.relative(DIST_DIR, file)}...`);

    if (minifyJS(file)) {
      jsSuccess++;
      console.log(` ${colors.green}✓${colors.reset}`);
    } else {
      jsFailed++;
      console.log(` ${colors.red}✗${colors.reset}`);
    }
  }

  log(`  JS: ${jsSuccess} minificados, ${jsFailed} errores`, jsSuccess > 0 ? 'green' : 'yellow');

  // 4. Minificar archivos CSS
  logStep('4/5', 'Minificando archivos CSS...');
  const cssFiles = getFiles(DIST_DIR, '.css');
  let cssSuccess = 0;
  let cssFailed = 0;

  for (const file of cssFiles) {
    // No minificar archivos ya minificados
    if (file.includes('.min.css')) {
      continue;
    }

    process.stdout.write(`  Minificando: ${path.relative(DIST_DIR, file)}...`);

    if (minifyCSS(file)) {
      cssSuccess++;
      console.log(` ${colors.green}✓${colors.reset}`);
    } else {
      cssFailed++;
      console.log(` ${colors.red}✗${colors.reset}`);
    }
  }

  log(`  CSS: ${cssSuccess} minificados, ${cssFailed} errores`, cssSuccess > 0 ? 'green' : 'yellow');

  // 5. Generar resumen
  logStep('5/5', 'Generando resumen...');

  const distSize = getDirSize(DIST_DIR);
  const savedBytes = srcSize - distSize;
  const savedPercent = ((savedBytes / srcSize) * 100).toFixed(1);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n========================================', 'green');
  log('  BUILD COMPLETADO', 'green');
  log('========================================', 'green');
  log(`\n  Tiempo: ${duration}s`, 'blue');
  log(`  Archivos JS minificados: ${jsSuccess}`, 'blue');
  log(`  Archivos CSS minificados: ${cssSuccess}`, 'blue');
  log(`\n  Tamaño original: ${(srcSize / (1024 * 1024)).toFixed(2)} MB`, 'yellow');
  log(`  Tamaño final:    ${(distSize / (1024 * 1024)).toFixed(2)} MB`, 'green');
  log(`  Reducción:       ${(savedBytes / (1024 * 1024)).toFixed(2)} MB (${savedPercent}%)`, 'green');
  log(`\n  Output: ${DIST_DIR}`, 'cyan');
  log('\n  Ejecuta "npm run serve:dist" para probar\n', 'cyan');
}

// Ejecutar build
build().catch(error => {
  log(`\nError durante el build: ${error.message}`, 'red');
  process.exit(1);
});
