# ✅ CHECKLIST DE PRUEBAS LOCALES - CNS

## 🌐 Servidor Local
**URL:** http://localhost:8080
**Estado:** ✅ Corriendo en puerto 8080

---

## 📋 PRUEBAS A REALIZAR

### ✅ 1. CARGA INICIAL

**Verificar:**
- [ ] La app carga sin errores
- [ ] Splash screen aparece y desaparece
- [ ] Biblioteca se muestra correctamente
- [ ] **Abrir consola (F12)** → No debe haber errores rojos
- [ ] Las portadas de los 2 libros se muestran (**FIX:** creadas las imágenes)

**Errores a buscar:**
- ❌ 404 en archivos
- ❌ SyntaxError
- ❌ ReferenceError

---

### ✅ 2. CORRECCIONES CRÍTICAS

#### A. Variable 'e' en filtro (ERR-003)
- [ ] Hacer click en el dropdown de "Categorías"
- [ ] Cambiar de "Todas las categorías" a "Espiritualidad & Ciencia"
- [ ] **NO debe haber error** de "e is not defined"
- [ ] Los libros deben filtrarse correctamente

#### B. Constructor AIAdapter (ERR-002)
- [ ] Abrir consola y escribir: `window.aiAdapter`
- [ ] Debe mostrar el objeto AIAdapter
- [ ] Escribir: `window.aiAdapter.config`
- [ ] Debe mostrar el objeto AIConfig (no undefined)

#### C. Imágenes de portada (ERR-001)
- [ ] Las portadas de ambos libros deben verse
- [ ] "El Código del Despertar" → fondo azul oscuro, texto dorado
- [ ] "Manifiesto" → fondo slate, texto verde
- [ ] No debe haber imagen rota (icono de imagen no cargada)

---

### ✅ 3. WARNINGS CORREGIDOS

#### A. APK Centralizado (WARN-001)
**En Biblioteca:**
- [ ] Click en botón "📱 Descargar Android"
- [ ] Debe descargar `CodigoDelDespertar-v1.1.5.apk`
- [ ] Verificar que descarga (debe iniciar descarga)

**En Lector:**
- [ ] Abrir un libro (click en "Comenzar")
- [ ] En el header, click en "📱" (botón pequeño)
- [ ] Debe descargar el mismo APK
- [ ] Verificar que ambos botones usan el MISMO archivo

**Verificar en consola:**
```javascript
window.bookEngine.getLatestAPK()
// Debe retornar: "downloads/CodigoDelDespertar-v1.1.5.apk"
```

#### B. Sanitización HTML (SEC-001)
**Verificar en consola:**
```javascript
// Probar sanitización con código peligroso
const malicious = '<img src=x onerror="alert(1)"><script>alert(2)</script><p>Safe</p>';
const sanitized = window.sanitizeHTML(malicious);
console.log(sanitized);
// Debe retornar solo: "<p>Safe</p>"
// NO debe ejecutar alerts
```

**En el libro:**
- [ ] Abrir "El Código del Despertar"
- [ ] Verificar que el contenido se ve correctamente formateado
- [ ] NO debe haber scripts ejecutándose
- [ ] Los párrafos, negritas, cursivas deben funcionar

#### C. Event Listeners (PERF-002)
**Test de memoria:**
- [ ] Abrir un libro
- [ ] Volver a biblioteca (botón "← Biblioteca")
- [ ] Repetir 10 veces: abrir libro → volver
- [ ] Abrir consola → Performance/Memory
- [ ] La memoria NO debe crecer descontroladamente

**Test de delegación:**
- [ ] En biblioteca, hacer click en un libro
- [ ] Debe abrir el libro correctamente
- [ ] Hacer click en el botón "Comenzar"
- [ ] Debe abrir el libro en el capítulo correcto

---

### ✅ 4. FUNCIONALIDADES MIGRADAS

#### A. Sistema de Traducciones
- [ ] Click en botón "🌐 Idioma"
- [ ] Debe abrir modal con banderas 🇪🇸 🇬🇧
- [ ] Click en "English"
- [ ] Debe aparecer toast "✓ Language changed to English"
- [ ] La página debe recargar
- [ ] Los textos de UI deben estar en inglés
- [ ] Click en "🌐" → cambiar de vuelta a "Español"
- [ ] Verificar que vuelve al español

#### B. Modal de IA Settings
- [ ] Click en botón "⚙️ Configurar IA"
- [ ] Debe abrir modal con selector de proveedor
- [ ] Probar selector: Claude API / Modo Local
- [ ] Input de API key debe tener botón show/hide
- [ ] Click en "X" debe cerrar
- [ ] ESC debe cerrar
- [ ] Click fuera del modal debe cerrar

#### C. Modal de Donaciones
- [ ] Click en botón "☕ Apoyar"
- [ ] Debe abrir modal con 3 opciones:
  - Ko-fi
  - PayPal
  - GitHub Sponsors
- [ ] **NOTA:** URLs están como TUUSUARIO (correcto, se actualizará antes de producción)
- [ ] Modal debe cerrar con X, ESC, o click fuera

#### D. Manual Práctico
- [ ] Click en botón "🧘 Manual Práctico"
- [ ] Debe abrir en nueva pestaña: `manual-practico.html`
- [ ] Verificar que carga correctamente
- [ ] Debe tener ~24 ejercicios
- [ ] Scroll debe funcionar
- [ ] Cerrar pestaña

#### E. Prácticas Radicales
- [ ] Click en botón "🔮 Prácticas Radicales"
- [ ] Debe abrir en nueva pestaña: `practicas-radicales.html`
- [ ] Verificar que carga correctamente
- [ ] Cerrar pestaña

#### F. Generador de Koans
- [ ] Abrir un libro (ej: El Código del Despertar)
- [ ] En el header, click en botón "🧘"
- [ ] Debe abrir modal con un koan zen
- [ ] Verificar:
  - Tema del koan
  - Pregunta paradójica
  - Pista para contemplación
  - Instrucciones de cómo contemplar
- [ ] Click en "🔄 Otro Koan"
- [ ] Debe generar un koan diferente
- [ ] Cerrar modal

#### G. Audio Binaural
- [ ] En el lector, click en botón "🎧"
- [ ] Debe abrir modal con 5 frecuencias:
  - 😴 Delta (Indigo)
  - 🧘 Theta (Purple)
  - 🌊 Alpha (Cyan)
  - 🎯 Beta (Green)
  - ⚡ Gamma (Amber)
- [ ] Seleccionar "🧘 Theta"
- [ ] Ajustar duración a 5 minutos
- [ ] Click en "▶️ Reproducir"
- [ ] **CON AURICULARES:** Debe escucharse un tono
- [ ] Verificar status "✅ Reproduciendo Theta por 5 minutos..."
- [ ] Click en "⏹️ Detener"
- [ ] Audio debe parar
- [ ] Cerrar modal

---

### ✅ 5. NAVEGACIÓN Y FUNCIONALIDADES EXISTENTES

#### A. Abrir Libro
- [ ] Click en "El Código del Despertar"
- [ ] Debe abrir el libro
- [ ] Sidebar con capítulos debe verse
- [ ] Click en un capítulo
- [ ] Debe cambiar el contenido
- [ ] Navegación anterior/siguiente debe funcionar

#### B. Sistema de Notas
- [ ] En un capítulo, click en "📝 Notas"
- [ ] Debe abrir panel de notas
- [ ] Agregar una nota: "Prueba local"
- [ ] Click en "Guardar"
- [ ] Cerrar y reabrir notas
- [ ] La nota debe persistir

#### C. Chat IA
- [ ] Click en "🤖 Chat IA"
- [ ] Modal debe abrir
- [ ] Escribir: "Hola"
- [ ] Si está configurado, debe responder
- [ ] Si no está configurado, debe mostrar info sobre configuración

#### D. Bookmarks
- [ ] Click en "📑" para agregar bookmark
- [ ] Icono debe cambiar a "🔖"
- [ ] Ir a otro capítulo y volver
- [ ] Bookmark debe persistir

#### E. Progreso de Lectura
- [ ] Leer varios capítulos
- [ ] Volver a biblioteca
- [ ] La tarjeta del libro debe mostrar:
  - Progreso en %
  - "X de Y capítulos leídos"
  - Botón "Continuar" en lugar de "Comenzar"
- [ ] Click en "Continuar"
- [ ] Debe abrir en el último capítulo leído

---

### ✅ 6. RESPONSIVE Y UI

#### A. Sidebar
- [ ] Click en botón hamburguesa para abrir/cerrar sidebar
- [ ] Debe animar correctamente
- [ ] En móvil (F12 → Toggle device toolbar)
- [ ] Sidebar debe comportarse correctamente

#### B. Temas
- [ ] Abrir "El Código del Despertar"
- [ ] Tema debe ser azul/cyan oscuro
- [ ] Volver y abrir "Manifiesto"
- [ ] Tema debe cambiar a rojo/naranja oscuro
- [ ] Los colores deben aplicarse correctamente

---

### ✅ 7. RENDIMIENTO

#### A. Tiempo de Carga
- [ ] Recargar página (Ctrl+R)
- [ ] Splash screen debe aparecer ~1.5 segundos
- [ ] App debe cargar en < 3 segundos

#### B. Búsqueda y Filtros
- [ ] En biblioteca, escribir en búsqueda: "despertar"
- [ ] Los resultados deben filtrarse instantáneamente
- [ ] Borrar búsqueda
- [ ] Cambiar filtro de categoría
- [ ] Debe filtrar sin lag

#### C. Navegación entre Capítulos
- [ ] Navegar entre 10 capítulos seguidos
- [ ] No debe haber lag
- [ ] Contenido debe cambiar suavemente

---

## 🔍 ERRORES COMUNES A VERIFICAR

### En Consola (F12 → Console)
```
❌ Errores a buscar:
- 404 (archivos no encontrados)
- Uncaught ReferenceError
- Uncaught TypeError
- Uncaught SyntaxError
- Failed to fetch

✅ OK ver:
- "🚀 Iniciando Colección Nuevo Ser..."
- "✅ i18n inicializado"
- "✅ BookEngine inicializado"
- "✅ Biblioteca inicializado"
- "✅ App inicializada correctamente"
```

### En Network (F12 → Network)
```
✅ Todos los archivos deben cargar con 200:
- index.html
- js/core/*.js
- js/features/*.js
- js/ai/*.js
- books/catalog.json
- books/codigo-despertar/book.json
- css/*.css

❌ NO debe haber:
- 404 errors
- Failed requests
```

---

## 📊 CHECKLIST FINAL

### Correcciones Críticas
- [ ] ERR-003: Filtro de categorías funciona sin errores
- [ ] ERR-002: AIAdapter inicializa correctamente
- [ ] ERR-001: Portadas de libros se muestran

### Warnings Corregidos
- [ ] WARN-001: APK se descarga desde configuración dinámica
- [ ] SEC-001: HTML está sanitizado (test en consola pasa)
- [ ] PERF-002: No hay memory leaks (test de memoria)

### Funcionalidades Migradas
- [ ] Traducciones ES/EN funcionan
- [ ] Modal IA Settings funciona
- [ ] Modal Donaciones funciona
- [ ] Manual Práctico abre correctamente
- [ ] Prácticas Radicales abre correctamente
- [ ] Generador de Koans funciona
- [ ] Audio Binaural reproduce

### Funcionalidades Existentes
- [ ] Navegación entre libros
- [ ] Sistema de notas
- [ ] Chat IA
- [ ] Bookmarks
- [ ] Progreso de lectura
- [ ] Temas por libro
- [ ] Búsqueda y filtros

---

## ✅ RESULTADO ESPERADO

Si todas las pruebas pasan:
- ✅ **LISTO PARA PRODUCCIÓN**

Si hay errores:
- 📝 Documentar el error
- 🔧 Corregir
- 🔄 Re-probar

---

## 🎯 PRÓXIMO PASO

Una vez completado este checklist:

1. Actualizar URLs de donaciones en `js/features/donations-modal.js`
2. Hacer commit de los cambios
3. Subir al servidor por FTP
4. Repetir pruebas en servidor

---

**Servidor corriendo:** http://localhost:8080
**Detener servidor:** Ctrl+C en la terminal del servidor
**Recargar app:** F5 o Ctrl+R en el navegador

---

**Happy Testing! 🚀**
