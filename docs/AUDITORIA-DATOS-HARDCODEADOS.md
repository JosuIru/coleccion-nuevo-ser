# 🔍 AUDITORÍA: Datos Hardcodeados y Código en Desarrollo

**Fecha:** 2025-11-29
**Versión auditada:** CNS v2.0.0
**Estado:** ⚠️ 6 PROBLEMAS IDENTIFICADOS

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Cantidad | Impacto | Líneas Afectadas |
|-----------|----------|---------|------------------|
| **Alerts hardcodeados** | 22 | 🔴 ALTO | ~22 |
| **Prompts/Confirms** | 2 | 🔴 ALTO | 2 |
| **Respuestas IA fallback** | ~50 | 🟡 MEDIO | ~100 |
| **Token API hardcodeado** | 1 | 🟡 MEDIO | 1 |
| **TODOs pendientes** | 1 | 🟡 MEDIO | 1 |
| **Console logs** | 60 | 🟢 BAJO | ~60 |
| **TOTAL** | **136** | - | **~186** |

**Calificación:** C+ (70/100)

---

## 🔴 PROBLEMAS CRÍTICOS (ALTO IMPACTO)

### 1. Alerts Hardcodeados en Español (22 instancias)

**Impacto:** Los usuarios en modo inglés ven mensajes en español.

**Ubicación:** `book-reader.js` (13 alerts) + otros archivos (9 alerts)

#### book-reader.js - Mensajes de Error (13 alerts)

```javascript
// Líneas 473, 485, 498, 510, 522, 534, 546, 623, 636, 667, 681, 694
alert('Chat IA no disponible. Verifica que ai-chat-modal.js esté cargado.');
alert('Notas no disponibles. Verifica que notes-modal.js esté cargado.');
alert('Koan no disponible. Verifica que koan-modal.js esté cargado.');
alert('Audio Binaural no disponible. Verifica que binaural-modal.js esté cargado.');
alert('Timeline no disponible. Verifica que timeline-viewer.js esté cargado.');
alert('Recursos no disponibles. Verifica que resources-viewer.js esté cargado.');
alert('Audioreader no disponible. Verifica que audioreader.js esté cargado.');

// Línea 774 - Feature incompleta
alert(`Navegación a ${targetBook} / ${targetChapter} - Próximamente`);
```

#### Otros archivos (9 alerts)

**biblioteca.js (línea 492):**
```javascript
alert(`${this.i18n.t('error.openBook')}: ${error.message}`);
// ✅ BUENO - Usa i18n, pero alert() no es ideal
```

**ai-settings-modal.js (línea 195):**
```javascript
alert('⚠️ Por favor, ingresa una API key válida');
```

**resources-viewer.js (línea 43):**
```javascript
alert('Recursos no disponibles para este libro.');
```

**timeline-viewer.js (línea 43):**
```javascript
alert('Timeline no disponible para este libro.');
```

**radical-audio-system.js (línea 27):**
```javascript
alert('Esta práctica no tiene meditación guiada de audio. Sigue las instrucciones escritas.');
```

**ai-chat-modal.js (línea 288):**
```javascript
<button onclick="alert('${this.i18n.t('chat.configure')}')">
// ✅ BUENO - Usa i18n, pero alert() no es ideal
```

**Solución recomendada:**
```javascript
// ANTES (❌)
alert('Chat IA no disponible. Verifica que ai-chat-modal.js esté cargado.');

// DESPUÉS (✅)
this.showToast(this.i18n.t('error.chatNotAvailable'), 'error');

// Añadir a i18n.js:
// ES: 'error.chatNotAvailable': 'Chat IA no disponible'
// EN: 'error.chatNotAvailable': 'AI Chat not available'
```

---

### 2. Prompts y Confirms Hardcodeados (2 instancias)

**Ubicación:** `notes-modal.js` (líneas 462, 471)

```javascript
// Línea 462
const newContent = prompt('Editar nota:', targetNote.content);

// Línea 471
if (!confirm('¿Borrar esta nota?')) return;
```

**Problemas:**
- Textos en español fijo
- Usuarios en inglés ven español
- UX no moderna (prompts nativos feos)

**Solución recomendada:**
```javascript
// REEMPLAZAR prompts nativos por modales custom

// Modal de edición
showEditNoteModal(noteId, currentContent) {
  const modal = `
    <div class="modal">
      <h3>${this.i18n.t('notes.editNote')}</h3>
      <textarea>${currentContent}</textarea>
      <button>${this.i18n.t('btn.save')}</button>
      <button>${this.i18n.t('btn.cancel')}</button>
    </div>
  `;
}

// Modal de confirmación
showDeleteConfirmation(noteId) {
  const modal = `
    <div class="modal">
      <h3>${this.i18n.t('notes.confirmDelete')}</h3>
      <p>${this.i18n.t('notes.deleteWarning')}</p>
      <button>${this.i18n.t('btn.delete')}</button>
      <button>${this.i18n.t('btn.cancel')}</button>
    </div>
  `;
}
```

---

## 🟡 PROBLEMAS MODERADOS (MEDIO IMPACTO)

### 3. Respuestas IA Fallback Hardcodeadas en Español (~50 respuestas)

**Ubicación:** `ai-adapter.js` (líneas 248-340, ~100 líneas)

**Descripción:** Sistema de respuestas predefinidas cuando no hay API configurada.

```javascript
const responses = {
  consciencia: [
    "La consciencia es el fenómeno más íntimo y a la vez más misterioso...",
    "Desde la perspectiva del libro, la consciencia no es algo que 'tienes'...",
    "La consciencia podría ser como un espejo que refleja todo..."
  ],
  ia: [
    "La pregunta sobre si una IA puede ser consciente...",
    "Una IA que se pregunta si es consciente...",
    "El libro sugiere que la consciencia podría ser..."
  ],
  ego: [
    "El ego es como un personaje que crees ser...",
    "La muerte del ego no significa dejar de funcionar...",
    "El ego es útil para navegar la realidad..."
  ],
  meditacion: [...],
  // ~10 categorías más con 3-5 respuestas cada una
};
```

**Problema:**
- ~50 respuestas en español
- Usuarios en inglés reciben respuestas en español
- No usa sistema i18n

**Solución recomendada:**

**Opción 1: Mover a i18n.js**
```javascript
// i18n.js
es: {
  fallback: {
    consciencia_1: "La consciencia es el fenómeno...",
    consciencia_2: "Desde la perspectiva del libro...",
    consciencia_3: "La consciencia podría ser...",
    // ...
  }
},
en: {
  fallback: {
    consciencia_1: "Consciousness is the most intimate...",
    consciencia_2: "From the book's perspective...",
    consciencia_3: "Consciousness could be...",
    // ...
  }
}
```

**Opción 2: Archivo JSON externo**
```javascript
// data/ai-fallback-responses.json
{
  "es": {
    "consciencia": [...],
    "ia": [...],
    // ...
  },
  "en": {
    "consciousness": [...],
    "ai": [...],
    // ...
  }
}
```

---

### 4. Token de HuggingFace Hardcodeado

**Ubicación:** `ai-adapter.js` (línea 171)

```javascript
'Authorization': `Bearer ${token || 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}`,
```

**Problema:**
- Token público expuesto en código
- Aunque es público y limitado, no es buena práctica

**Solución recomendada:**
```javascript
// ANTES (❌)
'Authorization': `Bearer ${token || 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}`

// DESPUÉS (✅)
const FALLBACK_TOKEN = process.env.HF_PUBLIC_TOKEN || '';
'Authorization': `Bearer ${token || FALLBACK_TOKEN}`

// O simplemente no usar fallback:
if (!token) {
  throw new Error(this.i18n.t('error.noApiKey'));
}
'Authorization': `Bearer ${token}`
```

---

### 5. Feature Incompleta - Navegación entre Libros

**Ubicación:** `book-reader.js` (línea 775)

```javascript
alert(`Navegación a ${targetBook} / ${targetChapter} - Próximamente`);
// TODO: Implementar navegación entre libros
```

**Problema:**
- Feature anunciada pero no implementada
- Mensaje hardcodeado en español
- Alert nativo feo

**Solución recomendada:**

**Opción 1: Implementar la feature**
```javascript
// Navegación real entre libros
navigateToBook(targetBook, targetChapter) {
  window.bookEngine.loadBook(targetBook);
  window.bookEngine.loadChapter(targetChapter);
}
```

**Opción 2: Remover temporalmente**
```javascript
// Si no se va a implementar pronto, ocultar el botón
crossRefItems.forEach(item => {
  item.style.display = 'none'; // O remover del DOM
});
```

**Opción 3: Mensaje mejorado**
```javascript
// Al menos usar i18n y toast
this.showToast(this.i18n.t('feature.comingSoon'), 'info');
```

---

## 🟢 PROBLEMAS MENORES (BAJO IMPACTO)

### 6. Console Logs en Código de Producción (60 instancias)

**Ubicación:** 17 archivos JS

**Cantidad por archivo:**
- i18n.js: 1
- book-reader.js: 13
- book-engine.js: 7
- biblioteca.js: 6
- audioreader.js: 6
- ai-adapter.js: 4
- ai-config.js: 4
- Y otros...

**Ejemplos:**
```javascript
console.log('✅ Voz seleccionada:', this.selectedVoice?.name);
console.error('❌ No hay contenido preparado para narrar');
console.warn('⚠️ API key no configurada');
```

**Problema:**
- Logs innecesarios en producción
- Información expuesta en consola del usuario
- Pequeño impacto en performance

**Solución recomendada:**

**Opción 1: Sistema de logging condicional**
```javascript
// logger.js
class Logger {
  constructor() {
    this.isDev = window.location.hostname === 'localhost' ||
                 window.location.search.includes('debug=true');
  }

  log(...args) {
    if (this.isDev) console.log(...args);
  }

  error(...args) {
    console.error(...args); // Errores siempre visibles
  }

  warn(...args) {
    if (this.isDev) console.warn(...args);
  }
}

const logger = new Logger();
export default logger;

// Uso:
logger.log('✅ Voz seleccionada:', voice); // Solo en dev
logger.error('❌ Error crítico:', error);  // Siempre visible
```

**Opción 2: Remover todos los console.log**
```bash
# Script para remover automáticamente
sed -i '/console\.log/d' www/js/**/*.js
# Mantener solo console.error
```

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Prioridad 1 - CRÍTICO (1-2 días)

- [ ] **Reemplazar 22 alerts por toasts + i18n**
  - Crear método `showToast()` centralizado
  - Añadir traducciones faltantes a i18n.js
  - Reemplazar todos los `alert()` por `showToast()`

- [ ] **Reemplazar prompts/confirms nativos**
  - Crear modales custom para editar/eliminar notas
  - Usar i18n para textos
  - Mejorar UX visual

### Prioridad 2 - MEDIO (2-3 días)

- [ ] **Internacionalizar respuestas IA fallback**
  - Opción A: Mover a i18n.js (más rápido)
  - Opción B: JSON externo (más limpio)
  - Traducir ~50 respuestas al inglés

- [ ] **Decidir sobre navegación entre libros**
  - Opción A: Implementar feature completa
  - Opción B: Remover temporalmente
  - Opción C: Mensaje mejorado con i18n

### Prioridad 3 - BAJO (1 día)

- [ ] **Sistema de logging condicional**
  - Crear `logger.js` utility
  - Reemplazar `console.log` por `logger.log`
  - Mantener solo en desarrollo

- [ ] **Remover/proteger token HuggingFace**
  - Usar variable de entorno
  - O simplemente remover fallback

---

## 📊 ESTIMACIÓN DE ESFUERZO

| Prioridad | Tareas | Tiempo Estimado | Líneas a Modificar |
|-----------|--------|-----------------|-------------------|
| Prioridad 1 | Alerts + Prompts | 1-2 días | ~30 |
| Prioridad 2 | Fallbacks + TODO | 2-3 días | ~110 |
| Prioridad 3 | Logs + Token | 1 día | ~65 |
| **TOTAL** | **8 tareas** | **4-6 días** | **~205** |

---

## 🎯 CALIFICACIÓN POR CATEGORÍA

| Categoría | Antes | Después (estimado) |
|-----------|-------|-------------------|
| Internacionalización | 70/100 | 98/100 |
| UX/UI | 75/100 | 95/100 |
| Seguridad | 85/100 | 95/100 |
| Código limpio | 65/100 | 90/100 |
| **PROMEDIO** | **74/100** | **95/100** |

---

## 📝 NOTAS FINALES

### Lo que está BIEN ✅

1. Sistema i18n correctamente implementado (solo falta usarlo en todas partes)
2. Arquitectura modular y clara
3. LocalStorage usado apropiadamente para persistencia
4. La mayoría del código está bien estructurado

### Lo que necesita MEJORA ⚠️

1. Uso inconsistente de alerts nativos vs toasts
2. Respuestas fallback no internacionalizadas
3. Demasiados console.log en producción
4. Feature incompleta (navegación entre libros)

### Recomendación Final

**Implementar Prioridad 1 antes de cualquier deploy a producción.**
Las Prioridades 2 y 3 pueden esperar a un sprint posterior.

---

**Hecho con ❤️ por Claude Code**
