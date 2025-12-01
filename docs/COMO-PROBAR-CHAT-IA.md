# 🤖 CÓMO PROBAR EL CHAT IA

## ✅ CHAT IA IMPLEMENTADO Y LISTO

---

## 🚀 PASO 1: Levantar el Servidor Local

```bash
cd /home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/

# Opción 1: Python (recomendado)
python3 -m http.server 8000

# Opción 2: PHP
php -S localhost:8000

# Opción 3: Node.js
npx http-server -p 8000
```

---

## 🌐 PASO 2: Abrir en Navegador

Abre tu navegador en: **http://localhost:8000**

---

## 📝 PASO 3: Configurar API Key de Claude (SI NO LO HICISTE)

### Opción A: Desde la Consola del Navegador

1. Abre DevTools (F12)
2. En la consola, escribe:

```javascript
// Guardar tu API key
localStorage.setItem('claude_api_key', 'sk-ant-XXXXXXX');

// Verificar que se guardó
localStorage.getItem('claude_api_key');
```

### Opción B: Desde el Código

Edita temporalmente `www/index.html` y añade después de la línea del `aiConfig`:

```javascript
// API key temporal para pruebas
aiConfig.setClaudeApiKey('sk-ant-XXXXXXX');
```

---

## 🎯 PASO 4: Probar el Chat IA

### 4.1 Abrir un Libro

1. Verás la pantalla Home con 2 libros
2. Click en **"El Código del Despertar"** 🌌 o **"Manifiesto"** 🔥

### 4.2 Abrir el Chat

1. Una vez en el lector, arriba a la derecha verás: 🤖 (botón Chat IA)
2. **Click en el botón 🤖**
3. Se abrirá el modal de Chat IA

### 4.3 Conversar

**En "El Código del Despertar":**
- Verás 1 modo: "Guía Contemplativo"
- Pregunta: *"¿Qué es la conciencia según el libro?"*
- Pregunta: *"¿Cómo puedo empezar a meditar?"*

**En "Manifiesto de la Conciencia Compartida":**
- Verás **3 modos** de IA:
  - 🔴 **Crítico Sistémico** (analiza y desmonta)
  - 🟢 **Constructor de Alternativas** (propone soluciones)
  - 🔵 **Historiador de Movimientos** (contextualiza)

- Prueba cambiar de modo y ver cómo responde diferente
- Pregunta: *"¿Cuáles son las premisas ocultas del sistema?"*

---

## 🎨 CARACTERÍSTICAS DEL CHAT

### ✅ Lo que funciona:

- [x] **Modal completo** con diseño responsive
- [x] **Historial de conversación** persistente durante sesión
- [x] **Selector de modos** (solo Manifiesto)
- [x] **Preguntas sugeridas** al inicio
- [x] **Formateo básico** de mensajes (negritas, cursivas)
- [x] **Enter para enviar** (Shift+Enter para nueva línea)
- [x] **Indicador de estado** de IA
- [x] **Auto-scroll** a últimos mensajes
- [x] **Cerrar con ESC** o click fuera
- [x] **Integración con ai-adapter** (proxy en gailu.net)
- [x] **Contexto del libro** automático

### 📋 Funciones Adicionales:

- **Exportar conversación** (en código, llamar `aiChatModal.exportHistory()`)
- **Limpiar historial** (en código, llamar `aiChatModal.clearHistory()`)

---

## 🐛 TROUBLESHOOTING

### Error: "Sistema de IA no disponible"

**Solución:**
- Verifica que el navegador tiene acceso a internet
- Verifica que los archivos JS se cargaron:
  ```javascript
  console.log(window.AIConfig);    // Debe mostrar una función
  console.log(window.AIAdapter);   // Debe mostrar una función
  console.log(window.aiChatModal); // Debe mostrar un objeto
  ```

### Error: "No hay API key configurada"

**Solución:**
- Sigue el PASO 3 arriba para configurar tu API key
- Verifica en consola:
  ```javascript
  window.aiConfig.getClaudeApiKey(); // Debe mostrar tu key
  ```

### Error: "Failed to fetch" / Error de red

**Solución:**
- Verifica conexión a internet
- Verifica que el proxy funciona:
  ```bash
  curl https://gailu.net/api/claude-proxy-simple.php
  ```
  Debe devolver JSON con error de API key (es normal)

### La IA no responde correctamente

**Solución:**
- Verifica que tu API key de Claude es válida
- Verifica que tienes créditos en tu cuenta de Anthropic
- Mira la consola del navegador (F12) para ver errores

### Modal no se abre

**Solución:**
- Verifica en consola:
  ```javascript
  window.aiChatModal.open(); // Debe abrir el modal
  ```
- Verifica que no hay errores de JavaScript en consola

---

## 💡 PREGUNTAS DE PRUEBA

### Para "El Código del Despertar" 🌌

```
- ¿Qué es la conciencia según este libro?
- ¿Cómo se relaciona la física cuántica con la consciencia?
- Explícame una meditación del libro
- ¿Qué dice el libro sobre la IA y la conciencia?
- Dame un ejercicio práctico para hoy
```

### Para "Manifiesto" (Modo Crítico) 🔴

```
- ¿Cuáles son las 5 premisas ocultas del sistema?
- ¿Por qué el crecimiento infinito es imposible?
- Critica la idea de que la escasez es natural
- ¿Cómo el poder se perpetúa?
```

### Para "Manifiesto" (Modo Constructivo) 🟢

```
- ¿Qué alternativas económicas propone el libro?
- Dame 3 acciones concretas que puedo hacer hoy
- ¿Cómo empezar una cooperativa?
- ¿Qué experimentos exitosos menciona el libro?
```

### Para "Manifiesto" (Modo Histórico) 🔵

```
- ¿Qué lecciones podemos aprender de la Comuna de París?
- Compara Occupy Wall Street con Mayo del 68
- ¿Por qué falló la Primavera Árabe?
- ¿Qué tienen en común las revoluciones exitosas?
```

---

## 📊 MÉTRICAS Y LOGS

### Ver en Consola:

```javascript
// Ver historial de conversación
console.log(aiChatModal.conversationHistory);

// Ver configuración actual
console.log(aiChatModal.bookEngine.getCurrentBookConfig());

// Ver modo actual
console.log(aiChatModal.currentMode);

// Ver todos los modos disponibles
console.log(aiChatModal.bookEngine.getCurrentBookConfig().features.aiChat.modes);
```

---

## 🎯 ESCENARIOS DE PRUEBA

### Test 1: Conversación Básica
1. Abrir Código del Despertar
2. Abrir chat IA
3. Hacer una pregunta sugerida
4. Verificar que responde
5. Hacer pregunta de seguimiento
6. Verificar contexto se mantiene

### Test 2: Cambio de Modos (Manifiesto)
1. Abrir Manifiesto
2. Abrir chat IA
3. Preguntar en modo Crítico
4. Cambiar a modo Constructivo
5. Hacer misma pregunta
6. Verificar respuesta diferente

### Test 3: Persistencia
1. Tener conversación larga (5+ mensajes)
2. Cerrar modal
3. Abrir de nuevo
4. Verificar que historial se mantiene

### Test 4: Error Handling
1. Configurar API key incorrecta
2. Intentar enviar mensaje
3. Verificar mensaje de error amigable
4. Corregir API key
5. Verificar que funciona

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Cambiar Proxy URL (si es necesario):

Edita `www/js/ai/ai-adapter.js`, línea ~65:

```javascript
const PROXY_URL = 'https://gailu.net/api/claude-proxy-simple.php';
```

### Ajustar max_tokens:

En `ai-chat-modal.js`, método `getAIResponse()`, puedes añadir:

```javascript
const response = await window.aiAdapter.ask(
  userMessage,
  systemContext,
  history,
  2048 // maxTokens (opcional)
);
```

### Añadir más modos de IA:

Edita `www/books/[libro]/config.json` y añade en `features.aiChat.modes`:

```json
"nuevo_modo": {
  "name": "Nombre del Modo",
  "tone": "tono",
  "focus": "enfoque",
  "systemPrompt": "Instrucciones para la IA..."
}
```

---

## 📸 SCREENSHOTS ESPERADOS

### Vista del Chat (Código del Despertar):
```
┌──────────────────────────────────────┐
│ 🤖 Chat con IA              ✕       │
│ El Código del Despertar              │
├──────────────────────────────────────┤
│                                      │
│  💭 Comienza una conversación       │
│                                      │
│  Pregunta sobre el libro:            │
│  "¿Qué es la conciencia..."          │
│                                      │
└──────────────────────────────────────┘
```

### Vista con Conversación (Manifiesto con Modos):
```
┌──────────────────────────────────────┐
│ 🤖 Chat con IA              ✕       │
│ Manifiesto de la Conciencia          │
├──────────────────────────────────────┤
│ Modo: [Crítico] [Constructivo] [Hist]│
├──────────────────────────────────────┤
│                                      │
│  👤  ¿Cuáles son las premisas?      │
│                                      │
│  🤖  Las 5 premisas ocultas son:    │
│      1. Escasez como condición...   │
│                                      │
│  Escribe tu pregunta... [📤 Enviar] │
└──────────────────────────────────────┘
```

---

## 🎉 ¡LISTO!

Si seguiste estos pasos, el Chat IA debe estar **100% funcional**.

**Disfruta conversando con la IA sobre los libros!** 🚀

---

## 📝 NOTAS FINALES

- El historial de conversación se mantiene durante la sesión
- Al cambiar de libro, el chat se reinicia (por diseño)
- Los modos solo están disponibles en "Manifiesto"
- El proxy en gailu.net permite usar Claude desde el navegador
- Cada usuario usa su propia API key (no se comparte)

**Cualquier problema, revisa la consola del navegador (F12) para ver errores detallados.**
