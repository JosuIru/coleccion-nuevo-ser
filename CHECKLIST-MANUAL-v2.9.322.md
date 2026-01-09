# ✅ CHECKLIST MANUAL DE TESTING v2.9.322

Este checklist te permite verificar manualmente que TODAS las funcionalidades están funcionando correctamente tanto en DESKTOP como en MOBILE.

---

## 🖥️ DESKTOP - Funcionalidades del Header

### Botones Principales
- [ ] **Toggle Sidebar** - El sidebar se abre/cierra correctamente
- [ ] **AI Chat Button** - Se abre el modal de chat de IA
- [ ] **AudioReader Button** - Inicia/pausa la narración de audio
- [ ] **Support Button (❤️)** - Se abre el modal de donaciones
- [ ] **Notes Button** - Se abre el modal de notas

### Dropdown: Tools (🔧 Herramientas)
- [ ] **El dropdown se abre** al hacer clic en el botón Tools
- [ ] **Chapter Resources** - Abre modal de recursos del capítulo
- [ ] **Summary** - Abre modal de resumen del capítulo
- [ ] **Voice Notes** - Abre modal de notas de voz
- [ ] **Concept Map** - Muestra el mapa conceptual
- [ ] **Action Plans** - Muestra planes de acción
- [ ] **Achievements (Mis Logros)** - Muestra el panel de logros
- [ ] **Learning Paths** - Abre selector de rutas de aprendizaje
- [ ] **Content Adapter (Adaptar Contenido)** - Abre adaptador de contenido

### Dropdown: Book Features (📚 Contenido del libro)
- [ ] **El dropdown se abre** al hacer clic en el botón Book Features
- [ ] **Quiz** - Abre el quiz interactivo
- [ ] **Timeline** - Muestra la línea temporal (si disponible)
- [ ] **Book Resources** - Muestra recursos del libro
- [ ] **Koan** - Abre el modal de koan (si disponible)

### Dropdown: Settings (⚙️ Configuración)
- [ ] **El dropdown se abre** al hacer clic en el botón Settings
- [ ] **Settings Modal** - Abre configuración
- [ ] **Help Center** - Abre centro de ayuda
- [ ] **My Account** - Abre perfil de usuario
- [ ] **Android Download** - Descarga APK (solo web)
- [ ] **Language Selector** - Cambia idioma
- [ ] **Theme Toggle** - Cambia tema claro/oscuro
- [ ] **Premium Edition** - Muestra modal de premium
- [ ] **Share Chapter** - Comparte el capítulo actual

---

## 📱 MOBILE - Funcionalidades del Header

### Botones Visibles (siempre)
- [ ] **Bookmark Button** - Marca/desmarca capítulo como favorito
- [ ] **AI Chat Button (Mobile)** - Abre modal de chat de IA
- [ ] **AudioReader Button (Mobile)** - Inicia/pausa narración
- [ ] **Support Button (Mobile)** - Abre modal de donaciones

### Mobile Menu (☰)
- [ ] **El menú se abre** al hacer clic en el botón de 3 líneas
- [ ] Contiene todas las opciones de Tools, Book Features y Settings
- [ ] Cada opción del menú funciona correctamente

---

## 🧭 NAVEGACIÓN

### Botones de Navegación
- [ ] **Previous Chapter** - Navega al capítulo anterior
- [ ] **Next Chapter** - Navega al siguiente capítulo

### Sidebar
- [ ] **Abrir/Cerrar sidebar** funciona
- [ ] **Click en nombre de capítulo** navega al capítulo
- [ ] **Marcar capítulo como leído** funciona (icono de check)

---

## 🔄 TEST CRÍTICO: DESPUÉS DE NAVEGAR

**IMPORTANTE**: Después de navegar a otro capítulo usando las flechas, verifica que:

### Desktop
- [ ] Los 3 dropdowns siguen funcionando (Tools, Book Features, Settings)
- [ ] Todos los botones dentro de los dropdowns funcionan
- [ ] El botón de AI Chat sigue funcionando
- [ ] El botón de AudioReader sigue funcionando

### Mobile
- [ ] El botón de AI Chat Mobile sigue funcionando
- [ ] El Mobile Menu sigue abriéndose
- [ ] Todos los botones dentro del Mobile Menu funcionan

### Navegación
- [ ] Las flechas Previous/Next siguen funcionando
- [ ] El sidebar sigue funcionando

---

## 🎯 TEST RÁPIDO (5 minutos)

Si no tienes tiempo para el test completo, verifica estos elementos críticos:

1. **Desktop**: Abre el dropdown "Tools" → Click en "Resumen del capitulo"
2. **Desktop**: Navega a otro capítulo → Repite paso 1
3. **Mobile**: Click en botón de AI Chat
4. **Mobile**: Navega a otro capítulo → Repite paso 3
5. **Navegación**: Click en Previous Chapter → Click en Next Chapter

Si estos 5 tests pasan, la mayoría de funcionalidades están OK.

---

## 🐛 QUÉ HACER SI ALGO FALLA

1. **Abre la consola del navegador** (F12)
2. **Ejecuta**: `window.comprehensiveTest.runAll()`
3. **Revisa el output** - te dirá exactamente qué está fallando
4. **Reporta** el error con el output de la consola

---

## 📊 TEST AUTOMATIZADO

Para un test automatizado completo:

1. Abre la consola del navegador (F12)
2. Ejecuta: `window.comprehensiveTest.runAll()`
3. Revisa el resumen al final

O abre el archivo: `/www/test-all-features.html` en el navegador.

---

## ✅ CRITERIOS DE ÉXITO

- **100% Desktop**: Todos los dropdowns y botones funcionan
- **100% Mobile**: Todos los botones del header funcionan
- **100% Navegación**: Las flechas y sidebar funcionan
- **100% Después de navegar**: Todo sigue funcionando igual

Si hay algún fallo, el test automatizado te dirá exactamente qué no está funcionando.
