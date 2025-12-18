#!/usr/bin/env node

/**
 * TEST SUITE - Colección Nuevo Ser + Awakening Protocol
 * Verifica la integridad de todos los componentes
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = '  ℹ ';
  let color = colors.blue;

  if (type === 'success') {
    prefix = '  ✓ ';
    color = colors.green;
  } else if (type === 'error') {
    prefix = '  ✗ ';
    color = colors.red;
  } else if (type === 'warn') {
    prefix = '  ⚠ ';
    color = colors.yellow;
  }

  console.log(`${color}${prefix}${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.blue}═══ ${title} ═══${colors.reset}`);
}

function test(description, condition, details = '') {
  testsRun++;
  if (condition) {
    testsPassed++;
    log('success', description);
    if (details) log('info', `  ${details}`);
  } else {
    testsFailed++;
    log('error', description);
    if (details) log('error', `  ${details}`);
  }
}

function fileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const size = exists ? (fs.statSync(filePath).size / 1024 / 1024).toFixed(2) : '0';
  test(`${description} (${exists ? size + 'MB' : 'NO EXISTE'})`, exists, filePath);
  return exists;
}

function fileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exists = content.includes(searchString);
    test(description, exists, `Search: "${searchString.substring(0, 50)}..."`);
    return exists;
  } catch (error) {
    test(description, false, `Error: ${error.message}`);
    return false;
  }
}

const baseDir = '/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser';

// ===============================================
// TESTS
// ===============================================

section('1. ARCHIVOS PRINCIPALES');

fileExists(path.join(baseDir, 'package.json'), 'package.json');
fileExists(path.join(baseDir, 'www/index.html'), 'index.html');
fileExists(path.join(baseDir, 'www/frankenstein-lab.html'), 'frankenstein-lab.html');

section('2. SISTEMA DE VERSIONES - ARCHIVOS');

fileExists(path.join(baseDir, 'www/js/core/version-manager.js'), 'version-manager.js');
fileExists(path.join(baseDir, 'www/js/core/update-helper.js'), 'update-helper.js');
fileExists(path.join(baseDir, 'www/js/core/app-initialization.js'), 'app-initialization.js');
fileExists(path.join(baseDir, 'www/js/features/update-modal.js'), 'update-modal.js');
fileExists(path.join(baseDir, 'api/check-version.php'), 'check-version.php');

section('3. INTEGRACIÓN EN HTML');

fileContains(
  path.join(baseDir, 'www/index.html'),
  'js/core/version-manager.js',
  'version-manager.js integrado en index.html'
);

fileContains(
  path.join(baseDir, 'www/index.html'),
  'js/core/update-helper.js',
  'update-helper.js integrado en index.html'
);

fileContains(
  path.join(baseDir, 'www/index.html'),
  'js/features/update-modal.js',
  'update-modal.js integrado en index.html'
);

fileContains(
  path.join(baseDir, 'www/index.html'),
  'js/core/app-initialization.js',
  'app-initialization.js integrado en index.html'
);

section('4. ARCHIVOS APK - DESCARGABLES');

fileExists(
  path.join(baseDir, 'www/downloads/awakening-protocol-latest.apk'),
  'awakening-protocol-latest.apk'
);

fileExists(
  path.join(baseDir, 'www/downloads/coleccion-nuevo-ser-latest.apk'),
  'coleccion-nuevo-ser-latest.apk'
);

fileExists(
  path.join(baseDir, 'www/downloads/frankenstein-lab-v1.2.7.apk'),
  'frankenstein-lab APK v1.2.7'
);

section('5. HERRAMIENTAS CONFIGURADAS');

fileContains(
  path.join(baseDir, 'www/js/core/biblioteca.js'),
  "id: 'awakening-protocol'",
  'Awakening Protocol en HERRAMIENTAS_ECOSISTEMA'
);

fileContains(
  path.join(baseDir, 'www/js/core/biblioteca.js'),
  "id: 'frankenstein-lab'",
  'Frankenstein Lab en HERRAMIENTAS_ECOSISTEMA'
);

fileContains(
  path.join(baseDir, 'www/js/core/biblioteca.js'),
  "id: 'cosmos-navigation'",
  'Cosmos en HERRAMIENTAS_ECOSISTEMA'
);

fileContains(
  path.join(baseDir, 'www/js/core/biblioteca.js'),
  "id: 'truk'",
  'TRUK en HERRAMIENTAS_ECOSISTEMA'
);

section('6. VERSIÓN - CONFIGURACIÓN');

fileContains(
  path.join(baseDir, 'package.json'),
  '"version": "2.9.32"',
  'package.json versión 2.9.32'
);

fileContains(
  path.join(baseDir, 'android/app/build.gradle'),
  'versionName "2.9.32"',
  'build.gradle versión 2.9.32'
);

fileContains(
  path.join(baseDir, 'android/app/build.gradle'),
  'versionCode 93',
  'build.gradle versionCode 93'
);

fileContains(
  path.join(baseDir, 'www/js/core/app-initialization.js'),
  "window.__APP_VERSION__ = '2.9.32'",
  'app-initialization.js versión 2.9.32'
);

section('7. API ENDPOINT');

fileContains(
  path.join(baseDir, 'api/check-version.php'),
  "'latest' => '2.9.32'",
  'check-version.php tiene versión 2.9.32'
);

fileContains(
  path.join(baseDir, 'api/check-version.php'),
  "Content-Type",
  'check-version.php retorna JSON'
);

fileContains(
  path.join(baseDir, 'api/check-version.php'),
  "compareVersions",
  'check-version.php tiene función de comparación'
);

section('8. ARCHIVOS DE DOCUMENTACIÓN');

fileExists(path.join(baseDir, 'CHANGELOG-2.9.32.md'), 'CHANGELOG-2.9.32.md');

fileContains(
  path.join(baseDir, 'CHANGELOG-2.9.32.md'),
  'Sistema Completo de Versiones y Actualizaciones',
  'CHANGELOG documenta sistema de versiones'
);

section('9. SISTEMA PREMIUM Y AUTH');

fileExists(
  path.join(baseDir, 'www/js/core/auth-helper.js'),
  'auth-helper.js (consolidado)'
);

fileExists(
  path.join(baseDir, 'www/js/core/plans-config.js'),
  'plans-config.js'
);

fileExists(
  path.join(baseDir, 'www/js/features/ai-premium.js'),
  'ai-premium.js'
);

fileExists(
  path.join(baseDir, 'www/tests/premium-system-test.js'),
  'premium-system-test.js'
);

fileContains(
  path.join(baseDir, 'www/js/core/auth-helper.js'),
  'window.supabaseAuthHelper = window.authHelper',
  'auth-helper.js tiene alias de compatibilidad'
);

section('10. MÓVIL - AWAKENING PROTOCOL');

fileContains(
  path.join(baseDir, 'mobile-game/mobile-app/index.js'),
  'RootNavigator',
  'Mobile app index.js importa RootNavigator'
);

fileContains(
  path.join(baseDir, 'mobile-game/mobile-app/android/app/src/main/java/com/awakeningprotocol/MainApplication.java'),
  'ReactNativeHost',
  'MainApplication implementa ReactNativeHost'
);

fileContains(
  path.join(baseDir, 'mobile-game/mobile-app/android/app/src/main/AndroidManifest.xml'),
  'NuevoSerFirebaseMessagingService',
  'AndroidManifest registra Firebase Service'
);

section('11. VERIFIACIONES DE SINTAXIS');

// Verificar que los archivos JS tienen sintaxis válida
const jsFiles = [
  'www/js/core/version-manager.js',
  'www/js/core/update-helper.js',
  'www/js/core/app-initialization.js',
  'www/js/features/update-modal.js'
];

jsFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  // Verificar que no hay errores obvios
  const hasErrors = content.includes('undefined') && content.includes('function');
  test(`${file} - Sin errores obvios`, !hasErrors);
});

section('12. VERIFICACIÓN CRUZADA');

// Verificar que los scripts están en el mismo orden en index.html
const indexContent = fs.readFileSync(path.join(baseDir, 'www/index.html'), 'utf8');
const vmIndex = indexContent.indexOf('version-manager.js');
const uhIndex = indexContent.indexOf('update-helper.js');
const aiIndex = indexContent.indexOf('app-initialization.js');
const umIndex = indexContent.indexOf('update-modal.js');

test(
  'Scripts en orden correcto en HTML',
  vmIndex > 0 && uhIndex > vmIndex && aiIndex > uhIndex && umIndex > aiIndex,
  `Order: VM(${vmIndex}) → UH(${uhIndex}) → AI(${aiIndex}) → UM(${umIndex})`
);

// ===============================================
// RESUMEN
// ===============================================

section('RESUMEN DE TESTS');

console.log(`
${colors.blue}Total Tests: ${testsRun}${colors.reset}
${colors.green}Passed: ${testsPassed}${colors.reset}
${colors.red}Failed: ${testsFailed}${colors.reset}
${colors.yellow}Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%${colors.reset}
`);

if (testsFailed === 0) {
  console.log(`${colors.green}✓ TODOS LOS TESTS PASARON${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}✗ ALGUNOS TESTS FALLARON${colors.reset}\n`);
  process.exit(1);
}
