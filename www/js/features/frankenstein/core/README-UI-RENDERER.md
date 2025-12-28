# FrankensteinUIRenderer

## Descripción

Módulo responsable de renderizar las pantallas principales del laboratorio Frankenstein. Extraído desde `frankenstein-ui.js` en la versión 2.9.201 como parte del proceso de modularización.

## Ubicación

```
www/js/features/frankenstein/core/frankenstein-ui-renderer.js
```

## Responsabilidades

1. **Pantalla de inicio (Start Screen)**: Renderiza la interfaz inicial del laboratorio con selección de modo y dificultad
2. **UI principal del laboratorio**: Genera el template HTML completo del laboratorio (~600 líneas de HTML)
3. **Gestión de fondos**: Maneja la rotación de fondos vintage de Da Vinci
4. **Partículas decorativas**: Genera elementos visuales animados para el fondo

## Estructura de la clase

```javascript
export default class FrankensteinUIRenderer {
  constructor(labUIRef, domCache)
  createStartScreen()
  createLabUI()
  setRandomDaVinciBackground(preferredImage)
  resolveAssetUrl(assetPath)
  startBackgroundRotation(forceImage)
  generateFloatingParticles()
  destroy()
}
```

## Métodos principales

### `createStartScreen()`
Crea la pantalla de inicio con:
- Selección de modo (Investigación, Aprendizaje, Demo)
- Ajuste de dificultad (Niños, Principiante, Iniciado, Experto)
- Tabs de información (Modos, Dificultad, Briefing)
- Botones de acción (Entrar al Laboratorio, Volver a la Colección)

**HTML generado**: ~250 líneas

### `createLabUI()`
Genera la UI completa del laboratorio incluyendo:
- Header con navegación y acciones
- Menú lateral deslizante
- Workspace con panel de estado del ser
- Visor de Vitruvio
- Tarjetas de información (atributos, misiones, microsociedades, etc.)
- Modales (requisitos, piezas, misiones)
- Bottom navigation
- FABs (Floating Action Buttons)

**HTML generado**: ~600 líneas

Después del renderizado, llama a:
- `populateMissions()`
- `populatePiecesGrid()`
- `updateBeingDisplay()`
- `updateMissionProgressUI()`
- `renderMiniChallenge()`
- `renderDemoScenarioCard()`
- `renderMicrosocietyCard()`
- `initDomCache()`
- `initRewardsHUD()`
- `checkOnboarding()`

### `setRandomDaVinciBackground(preferredImage)`
Establece un fondo vintage aleatorio de Leonardo da Vinci.

**Fondos disponibles**:
- vitruvio.jpg
- leonardo-skull.jpg
- frankenstein-1931.jpg
- turtle-anatomy.jpg
- cheselden-skeleton.jpg
- galvanism-aldini.jpg
- spiralist-anatomy.jpg
- spiralist-bones.jpg
- spiralist-heart.jpg

### `startBackgroundRotation(forceImage)`
Inicia la rotación automática de fondos cada 45 segundos.

### `generateFloatingParticles()`
Genera 20 partículas decorativas animadas con posiciones y delays aleatorios.

## Dependencias

### Del parent (FrankensteinLabUI)
- `this.labUI.availablePieces` - Array de piezas disponibles
- `this.labUI.selectedMission` - Misión actualmente seleccionada
- `this.labUI.vintageBackgrounds` - Array de URLs de fondos
- `this.labUI.organism` - Referencia al organismo
- Métodos: `startLab()`, `populateMissions()`, `populatePiecesGrid()`, etc.
- Helpers de timer: `_setInterval()`, `_clearInterval()`

### Globales
- `window.FrankensteinQuiz` - Sistema de quizzes
- `window.FrankensteinDemoData` - Datos de demostración
- `window.VitruvianBeing` - Visualización del Hombre de Vitruvio
- `window.toast` - Sistema de notificaciones

### DOM
- `#organism-container` - Contenedor principal
- CSS classes de Frankenstein Lab

## Event Listeners

### Start Screen
- `.mode-card` click - Selección de modo
- `.difficulty-card` click - Selección de dificultad
- `[data-panel-target]` click - Cambio de tabs
- `#frankenstein-start-button` click - Iniciar laboratorio
- `#frankenstein-close-button` click - Volver a colección

### Lab UI
Los event listeners son agregados por `FrankensteinLabUI.attachEventListeners()` después del renderizado.

## Arquitectura de datos

### Modo de juego
```javascript
{
  investigacion: 'Exploración Libre',
  juego: 'Aprendizaje Guiado',
  demo: 'Demo Cinemática'
}
```

### Niveles de dificultad
```javascript
{
  ninos: 'Niños',
  principiante: 'Principiante',
  iniciado: 'Iniciado',
  experto: 'Experto'
}
```

## Cleanup

El método `destroy()` limpia:
- Timer de rotación de fondos
- Referencias DOM

## Backward Compatibility

Los métodos antiguos en `FrankensteinLabUI` ahora son wrappers deprecados que delegan al renderer:

```javascript
// En frankenstein-ui.js (deprecated)
createStartScreen() {
  return this.uiRenderer.createStartScreen();
}

createLabUI() {
  return this.uiRenderer.createLabUI();
}

setRandomDaVinciBackground(preferredImage) {
  return this.uiRenderer.setRandomDaVinciBackground(preferredImage);
}

// ... etc
```

Esto garantiza que el código existente siga funcionando sin cambios.

## Notas de implementación

1. **Templates HTML grandes**: Este módulo contiene ~850 líneas de HTML en strings. Mantener todo el HTML intacto es crítico.

2. **Inline event handlers**: Bottom navigation usa `onclick` inline. Esto es deliberado para compatibilidad.

3. **CSS Variables**: Usa `--da-vinci-bg` para establecer el fondo mediante CSS custom properties.

4. **Image preloading**: Valida las URLs de imágenes antes de aplicarlas para evitar fondos rotos.

5. **Timers tracking**: Usa los métodos `_setInterval` y `_clearInterval` del parent para tracking correcto de timers.

## Testing

Para verificar la extracción:
1. Iniciar laboratorio desde pantalla de inicio
2. Verificar que todos los modos/dificultades funcionan
3. Verificar rotación de fondos
4. Verificar que la UI del lab se renderiza completamente
5. Verificar cleanup al cerrar

## Changelog

### v2.9.201 (2025-12-28)
- Extracción inicial desde `frankenstein-ui.js`
- ~1000 líneas de código de renderizado movidas a módulo separado
- Backward compatibility completa mediante delegación
- Documentación JSDoc completa

## Relacionado

- `frankenstein-ui.js` - Clase principal del laboratorio
- `frankenstein-bottom-sheet.js` - Panel móvil inferior
- `frankenstein-modals.js` - Sistema de modales
- `vitruvian-being.js` - Visualización del Hombre de Vitruvio
