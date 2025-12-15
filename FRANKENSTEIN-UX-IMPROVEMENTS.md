# Mejoras de UX para Frankenstein Lab v1.0

## Resumen

Este documento describe las mejoras de usabilidad implementadas en Frankenstein Lab, inspiradas en las mejores practicas de juegos modernos como Hearthstone, Legends of Runeterra, Genshin Impact y Material Design 3.

**Fecha:** Diciembre 2024
**Version:** 1.0.0

---

## Archivos Creados/Modificados

### Nuevos Archivos

| Archivo | Descripcion |
|---------|-------------|
| `www/css/frankenstein-ux-improvements.css` | Estilos CSS para todas las mejoras de UX |
| `www/js/core/enhanced-ui-system.js` | Sistema JavaScript con clases para Toast, Bottom Sheet, Tooltips |

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `www/frankenstein-web.html` | Incluye nuevos CSS y JS |
| `www/lab.html` | Incluye nuevos CSS y JS |
| `www/js/features/frankenstein-ui.js` | showNotification() usa el nuevo sistema |

---

## 1. Sistema de Toasts Mejorado

### Antes
- Notificaciones simples con posicion fija
- Se solapaban entre si
- Errores desaparecian en 3 segundos
- Sin accesibilidad

### Despues
- **Stackable**: Las notificaciones se apilan verticalmente
- **Animaciones fluidas**: Slide-in desde la derecha con spring physics
- **Tipos visuales**: Success, Error, Warning, Info con iconos y colores
- **Persistencia**: Errores criticos no desaparecen automaticamente
- **Accesibilidad**: `aria-live`, `role="alert"`, anunciador para screen readers
- **Haptic feedback**: Vibracion en dispositivos moviles
- **Acciones**: Boton de accion opcional en el toast
- **Progress bar**: Indicador visual del tiempo restante

### Uso

```javascript
// Uso basico
window.enhancedToast.success('Operacion completada');
window.enhancedToast.error('Algo salio mal');
window.enhancedToast.warning('Atencion requerida');
window.enhancedToast.info('Informacion');

// Con opciones
window.enhancedToast.show('Mensaje', 'success', {
  title: 'Titulo opcional',
  duration: 5000,
  action: 'undo',
  actionLabel: 'Deshacer',
  onAction: () => console.log('Accion ejecutada')
});

// Toast critico (no desaparece)
window.enhancedToast.critical('Error critico que requiere atencion');
```

---

## 2. Modales con "Juice"

### Mejoras Implementadas

- **Animacion de entrada**: Scale + translate con spring physics
- **Backdrop blur progresivo**: El blur aumenta gradualmente
- **Animacion de salida**: Transicion suave al cerrar
- **Drag handle visual**: Indicador para arrastrar en movil
- **Boton cerrar mejorado**: Rota 90 grados al hover

### CSS Classes

```css
/* Aplicar a modales existentes */
.modal-enhanced { ... }
.modal-overlay-enhanced { ... }
.modal-content-enhanced { ... }
.modal-drag-handle { ... }
.modal-header-enhanced { ... }
.modal-close-btn { ... }
```

---

## 3. FABs Accesibles en Movil

### Problema Resuelto
Los labels de los FABs estaban ocultos en movil, dejando solo emojis sin contexto.

### Solucion

- **FAB principal extendido**: Muestra label siempre visible
- **FABs secundarios compactos**: 48px en lugar de 64px
- **Tooltip on long-press**: Al mantener presionado muestra el nombre
- **Ripple effect**: Feedback visual al hacer tap
- **Safe area respetada**: Posicion ajustada para dispositivos con notch

### Uso

```html
<!-- FAB principal con label visible -->
<button class="fab fab-primary">
  <span class="fab-icon">🧬</span>
  <span class="fab-label">Crear Ser</span>
</button>

<!-- FAB secundario con tooltip touch -->
<button class="fab" aria-label="Guardar">
  <span class="fab-icon">💾</span>
  <span class="fab-label">Guardar</span>
</button>
```

---

## 4. Bottom Sheet con Momentum Physics

### Caracteristicas

- **Snap points**: 4 posiciones predefinidas (0%, 25%, 50%, 100%)
- **Momentum/Inertia**: La velocidad del swipe determina el destino
- **Resistencia en bordes**: Efecto elastico al llegar a los limites
- **Haptic feedback**: Vibracion sutil al cambiar de snap
- **Keyboard accessible**: Flechas arriba/abajo para navegar

### Uso

```javascript
const bottomSheet = new EnhancedBottomSheet('#my-bottom-sheet', {
  snapPoints: [0, 0.25, 0.5, 1],
  defaultSnap: 0.25,
  velocityThreshold: 0.5,
  onSnapChange: (ratio, name) => {
    console.log(`Snap changed to: ${name} (${ratio * 100}%)`);
  }
});

// Metodos
bottomSheet.open();      // Abre al defaultSnap
bottomSheet.close();     // Cierra completamente
bottomSheet.expand();    // Expande al 100%
bottomSheet.toggle();    // Alterna entre estados
bottomSheet.snapTo(0.5); // Ir a posicion especifica
```

---

## 5. Micro-interacciones en Cards

### Mission Cards

- **Hover lift**: `translateY(-6px) scale(1.02)`
- **Press sink**: `translateY(-2px) scale(0.98)`
- **Selected glow**: Animacion pulsante con box-shadow

### Piece Cards

- **Indicador de tipo**: Barra de color superior (azul=capitulo, verde=ejercicio, naranja=recurso)
- **Hover lift**: Elevacion sutil
- **Checkmark animado**: Pop animation al seleccionar

### CSS

```css
/* Aplicar tipo a piece cards */
<div class="piece-card" data-type="chapter">...</div>
<div class="piece-card" data-type="exercise">...</div>
<div class="piece-card" data-type="resource">...</div>
```

---

## 6. Sistema de Tooltips Inteligentes

### Caracteristicas

- **Auto-posicionamiento**: Detecta bordes de pantalla y se reposiciona
- **Delay de 200ms**: Evita tooltips accidentales
- **Long-press en touch**: Funciona en dispositivos tactiles
- **Accesibilidad**: `aria-describedby` vinculado al trigger
- **Tipos especiales**: Texto simple, atributos con icono/valor

### Uso

```html
<!-- Tooltip simple -->
<button data-tooltip="Descripcion del boton">Hover me</button>

<!-- Tooltip con titulo -->
<span data-tooltip="Descripcion detallada" data-tooltip-title="Titulo">
  Info
</span>

<!-- Tooltip de atributo -->
<div
  data-tooltip="La sabiduria permite tomar mejores decisiones"
  data-tooltip-type="attribute"
  data-tooltip-title="Sabiduria"
  data-tooltip-icon="🧠"
  data-tooltip-value="85"
>
  Sabiduria: 85
</div>
```

---

## 7. Loading States y Skeletons

### Skeleton Shimmer

```html
<!-- Skeleton para texto -->
<div class="skeleton skeleton-text"></div>

<!-- Skeleton para avatar -->
<div class="skeleton skeleton-avatar"></div>

<!-- Card en loading -->
<div class="piece-card loading">...</div>
```

### Button Loading

```javascript
// Mostrar loading en boton
window.loadingStates.showButtonLoading('#my-button');

// Ocultar loading
window.loadingStates.hideButtonLoading('#my-button');
```

### Loading Overlay

```javascript
// Mostrar overlay con spinner
window.loadingStates.showOverlay('#container', 'Cargando datos...');

// Ocultar overlay
window.loadingStates.hideOverlay('#container');
```

### Skeleton Cards

```javascript
// Generar cards skeleton
window.loadingStates.createSkeletonCards('#container', 6, 'mission');
```

---

## 8. Z-Index Scale Consistente

### Nueva Escala

```css
:root {
  --z-base: 1;           /* Elementos normales */
  --z-dropdown: 100;     /* Dropdowns, selects */
  --z-sticky: 200;       /* Headers sticky */
  --z-fixed: 300;        /* Elementos fijos */
  --z-fab: 400;          /* Floating action buttons */
  --z-modal-backdrop: 500; /* Overlay de modales */
  --z-modal: 600;        /* Contenido de modales */
  --z-popover: 700;      /* Popovers */
  --z-tooltip: 800;      /* Tooltips */
  --z-toast: 900;        /* Notificaciones */
  --z-critical: 9999;    /* Elementos criticos */
}
```

---

## 9. Breakpoints Unificados

### Nueva Estructura

```css
:root {
  --bp-mobile: 480px;   /* Moviles pequenos */
  --bp-tablet: 768px;   /* Tablets */
  --bp-desktop: 1024px; /* Desktop */
  --bp-wide: 1280px;    /* Pantallas grandes */
}

/* Mobile-first approach */
@media (min-width: 481px) { /* Tablet */ }
@media (min-width: 769px) { /* Desktop */ }
@media (min-width: 1025px) { /* Wide */ }
```

---

## 10. Accesibilidad

### Mejoras Implementadas

- **Focus visible mejorado**: Outline dorado de 3px
- **Reduced motion**: Respeta preferencias del usuario
- **High contrast**: Bordes mas gruesos en modo alto contraste
- **Screen reader support**: Regiones ARIA live para anuncios
- **Keyboard navigation**: Todos los elementos interactivos son accesibles

---

## Integracion con Codigo Existente

El sistema se integra automaticamente. El metodo `showNotification()` de `FrankensteinLabUI` ahora usa el sistema mejorado si esta disponible:

```javascript
// En frankenstein-ui.js
showNotification(message, type = 'info', duration = 3000) {
  // Usa sistema mejorado si esta disponible
  if (window.enhancedToast) {
    window.enhancedToast.show(message, type, { duration });
    return;
  }
  // Fallback al sistema basico...
}
```

---

## Fuentes de Inspiracion

- [Game UI/UX Design Guide](https://generalistprogrammer.com/game-ui-ux-design)
- [Toast Notifications Best Practices - LogRocket](https://blog.logrocket.com/ux-design/toast-notifications/)
- [Bottom Sheets UX Guidelines - NN/g](https://www.nngroup.com/articles/bottom-sheet/)
- [Material Design 3 Components](https://m3.material.io/components)
- [Microinteractions in UX - NN/g](https://www.nngroup.com/articles/microinteractions/)
- [Juicy UI: Smallest Interactions](https://medium.com/@mezoistvan/juicy-ui-why-the-smallest-interactions-make-the-biggest-difference-5cb5a5ffc752)

---

## Proximos Pasos Sugeridos

1. **Audio feedback**: Añadir sonidos sutiles a las interacciones
2. **Confetti/Particles**: Celebracion visual al completar misiones
3. **Onboarding tour**: Tutorial interactivo para nuevos usuarios
4. **Gesture hints**: Indicadores visuales de gestos disponibles
5. **Dark/Light mode**: Tema claro opcional

---

## Compatibilidad

- **Navegadores**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Movil**: iOS 13+, Android 8+
- **Capacitor**: Compatible con la app Android

---

## 11. Panel de Ajustes

### Archivos Adicionales Creados

| Archivo | Descripcion |
|---------|-------------|
| `www/js/features/frankenstein-settings.js` | Sistema completo de ajustes, header, galeria, stats |
| `www/css/frankenstein-settings.css` | Estilos para todos los nuevos componentes |

### Abrir Panel de Ajustes

```javascript
window.frankensteinSettings.open();
```

### Opciones Disponibles

**Juego:**
- Modo de juego (Investigacion, Aprendizaje, Demo)
- Dificultad de Quiz (Ninos, Principiante, Iniciado, Experto)
- Guardado automatico
- Pistas del tutorial

**Audio:**
- Efectos de sonido (on/off + volumen)
- Musica ambiental (on/off)

**Visual:**
- Animaciones (on/off)
- Reducir movimiento (accesibilidad)
- Alto contraste
- Tamano de fuente

**Notificaciones:**
- Posicion de toasts
- Vibracion haptica

**Datos:**
- Exportar datos
- Ver galeria de microsociedades
- Borrar todos los datos

---

## 12. Header Mejorado con Menu Hamburguesa

El header ahora incluye:
- Boton de menu hamburguesa (izquierda)
- Logo y titulo
- Botones de ajustes, estadisticas y cerrar (derecha)

### Menu Lateral

Incluye acceso rapido a:
- Laboratorio
- Mis Seres (con badge de cantidad)
- Microsociedades (con badge de cantidad)
- Retos
- Ajustes
- Estadisticas
- Ayuda
- Salir del Lab

---

## 13. Galeria de Microsociedades

```javascript
window.microsocietiesGallery.open();
```

### Funcionalidades

- Lista de todas las microsociedades guardadas
- Metricas visuales (Salud, Conocimiento, Accion, Cohesion)
- Numero de seres y turno actual
- Continuar simulacion guardada
- Eliminar microsociedad

### Guardar Microsociedad

```javascript
window.microsocietiesGallery.saveSociety({
  id: 'unique-id',
  name: 'Nombre',
  beings: [...],
  metrics: { health: 100, knowledge: 50, action: 50, cohesion: 75 },
  turn: 15
});
```

---

## 14. Estadisticas del Jugador

```javascript
window.frankensteinStats.open();
```

### Metricas Trackeadas

- Total de seres creados
- Seres validados / viables
- Tasa de exito
- Microsociedades creadas
- Turnos simulados
- Preguntas de quiz respondidas
- Precision en quizzes

### Tracking Manual

```javascript
window.frankensteinStats.track('being_created');
window.frankensteinStats.track('quiz_answered', { correct: true });
window.frankensteinStats.track('society_created');
```
