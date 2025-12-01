# 📖 GUÍA DE USUARIO - Colección Nuevo Ser

## Bienvenido a la Colección Nuevo Ser

Una aplicación para explorar libros interactivos sobre consciencia, filosofía y transformación social, co-creados por humanos e inteligencia artificial.

---

## 🚀 COMENZAR

### Acceso Web

Abre tu navegador y ve a:
```
https://gailu.net/coleccion/
```

O si lo instalaste localmente:
```
http://localhost:8000
```

### Primera vez

1. Verás la pantalla de bienvenida con el logo 📚
2. Aparecerá la **Biblioteca** con los libros disponibles
3. Click en cualquier libro para empezar a leer

---

## 📚 LA BIBLIOTECA (Pantalla Principal)

### Vista General

La biblioteca muestra:
- **Libros disponibles** en tarjetas con portada, título y descripción
- **Tu progreso** en cada libro (si ya empezaste a leerlos)
- **Estadísticas personales** (libros leídos, capítulos completados)

### Libros Disponibles

#### 🌌 El Código del Despertar
**Tema:** Consciencia, física cuántica, espiritualidad
**Capítulos:** 16 (Prólogo + 14 + Epílogo)
**Ideal para:** Exploración contemplativa, meditación, autoconocimiento

#### 🔥 Manifiesto de la Conciencia Compartida
**Tema:** Filosofía política, crítica sistémica, transformación social
**Capítulos:** 18 + recursos adicionales
**Ideal para:** Activismo, pensamiento crítico, construcción de alternativas

### Buscar Libros

- **Barra de búsqueda:** Escribe título, tema o autor
- **Filtros:** Click en las categorías para filtrar

---

## 📖 LEER UN LIBRO

### Abrir un Libro

1. Click en la tarjeta del libro
2. Click en botón **"Comenzar"** (primera vez) o **"Continuar"** (si ya empezaste)
3. Se abre el **Lector** con el primer capítulo (o el último que leíste)

### Interfaz del Lector

```
┌──────────────────────────────────────────┐
│ ◀ ▶  ← Biblioteca     Capítulo 3         │ ← Header
│                               🎧📝🤖⏳🔗  │
├──────────────────────────────────────────┤
│ [SIDEBAR]  │  [CONTENIDO DEL CAPÍTULO]  │
│            │                             │
│ • Prólogo  │  # Título del Capítulo     │
│ • Cap 1    │                             │
│ ✓ Cap 2    │  Texto del capítulo...     │
│ → Cap 3    │                             │
│ • Cap 4    │  Más contenido...          │
│            │                             │
│ Progreso:  │                             │
│ ██████░░░  │                             │
│ 30%        │                             │
├──────────────────────────────────────────┤
│     ← Capítulo 2    |    Capítulo 4 →    │ ← Footer
└──────────────────────────────────────────┘
```

---

## 🎮 CONTROLES DE NAVEGACIÓN

### Sidebar (Barra Lateral)

**Mostrar/Ocultar:**
- Click en **◀** o **▶** en la esquina superior izquierda

**Contenido:**
- ✅ Lista de todos los capítulos
- ✅ Indica capítulos leídos (✓)
- ✅ Indica capítulo actual (→)
- ✅ Barra de progreso del libro

**Uso:**
- Click en cualquier capítulo para saltar a él

### Navegación entre Capítulos

**Botones en el footer:**
- **← Anterior:** Va al capítulo anterior
- **Siguiente →:** Va al siguiente capítulo

**Atajos de teclado:**
- `←` Flecha izquierda: Capítulo anterior
- `→` Flecha derecha: Siguiente capítulo

### Volver a la Biblioteca

- Click en **"← Biblioteca"** en el header
- Tu progreso se guarda automáticamente

---

## 🎧 AUDIOREADER (Narración)

### Activar Audioreader

1. Click en botón **🎧** en el header
2. Aparecen controles flotantes en la parte inferior

### Controles de Reproducción

```
┌────────────────────────────────────────┐
│  El Código del Despertar               │
│  Párrafo 5 / 23                        │
│                                        │
│  ⏮  ▶️  ⏹  ⏭    [1x▼]  [Voz▼]  🔄  ✕ │
│                                        │
│  ████████████░░░░░░░░░░░ 52%          │
└────────────────────────────────────────┘
```

**Botones:**
- **▶️ Play:** Inicia la narración
- **⏸ Pause:** Pausa (mantiene la posición)
- **⏹ Stop:** Detiene y reinicia
- **⏮ Anterior:** Va al párrafo anterior
- **⏭ Siguiente:** Va al siguiente párrafo

**Configuración:**
- **Velocidad:** 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- **Voz:** Selecciona entre voces españolas disponibles
- **🔄 Auto:** Avanza automáticamente al siguiente capítulo al terminar

### Highlight Visual

Mientras narra:
- El párrafo actual se **ilumina** con un borde de color
- La página hace **scroll automático** para seguir la lectura
- Animación **pulse** sutil para indicar el párrafo activo

### Cerrar Audioreader

- Click en **✕** en los controles
- O vuelve a click en 🎧 en el header

---

## 📝 NOTAS PERSONALES

### Crear Notas

1. Click en botón **📝** en el header
2. Se abre el modal de notas
3. Escribe tu nota en el textarea
4. Click **"Guardar Nota"** o presiona **Ctrl+Enter**

### Ver tus Notas

**Vista por capítulo:**
- Al abrir el modal desde un capítulo, verás solo las notas de ese capítulo

**Ver todas las notas:**
- Click en **"Ver todas"** para ver notas de todo el libro

### Editar/Borrar Notas

- **Editar:** Click en ✏️ Editar, modifica el texto, guarda
- **Borrar:** Click en 🗑️ Borrar, confirma

### Formato Markdown

Las notas soportan formato simple:

```markdown
## Título nivel 2
### Título nivel 3

**Texto en negrita**
*Texto en cursiva*

- Lista con bullets
- Segundo item

1. Lista numerada
2. Segundo item
```

### Exportar Notas

1. Click en **💾 Exportar** en el modal de notas
2. Se descarga un archivo `.md` con todas tus notas
3. Puedes abrirlo en cualquier editor de Markdown

---

## 🤖 CHAT CON IA

### Abrir el Chat

1. Click en botón **🤖** en el header
2. Se abre el modal de chat

### Modos de IA (Manifiesto)

El "Manifiesto" tiene **3 modos** diferentes:

**🔴 Crítico Sistémico**
- Analiza críticamente sistemas de poder
- Desmonta narrativas dominantes
- Pregunta: *"¿Cuáles son las premisas ocultas del capitalismo?"*

**🟢 Constructor de Alternativas**
- Propone soluciones prácticas
- Enfoque en lo posible
- Pregunta: *"¿Qué alternativas económicas puedo implementar?"*

**🔵 Historiador de Movimientos**
- Contextualiza históricamente
- Conecta con movimientos pasados
- Pregunta: *"¿Qué lecciones nos deja la Comuna de París?"*

### Usar el Chat

1. **Selecciona un modo** (solo en Manifiesto)
2. Escribe tu pregunta en el textarea
3. Presiona **Enter** o click **📤 Enviar**
4. La IA responderá en contexto del libro y capítulo actual

### Preguntas Sugeridas

Al abrir el chat, verás preguntas sugeridas como:
- *"¿Qué es la consciencia según el libro?"*
- *"Explícame este capítulo"*
- *"Dame un ejercicio práctico"*

Click en cualquiera para enviarla directamente.

### Historial

- El chat mantiene el **historial** de la conversación actual
- Se reinicia al cambiar de libro
- Puedes hacer preguntas de seguimiento

### Configurar API Key

**Primera vez:**
1. Presiona F12 (Consola del navegador)
2. Escribe:
   ```javascript
   localStorage.setItem('claude_api_key', 'sk-ant-TU_KEY_AQUI');
   ```
3. Recarga la página

---

## ⏳ TIMELINE HISTÓRICO (Solo Manifiesto)

### Abrir Timeline

1. En el libro "Manifiesto", click en **⏳** en el header
2. Se abre la línea temporal de movimientos sociales

### Explorar Eventos

**Vista Timeline:**
- 25 eventos históricos desde 1789 hasta 2024
- Línea vertical con dots en cada año
- Click en cualquier evento para ver detalle completo

**Filtrar por Categoría:**
- ⚔️ Revoluciones (8 eventos)
- ✊ Movimientos Sociales (10 eventos)
- 🔒 Represión (3 eventos)
- 🎉 Victorias (4 eventos)

### Detalle de Evento

Al click en un evento:
- **Descripción completa**
- **Impacto histórico**
- **Lecciones aprendidas**
- **Capítulos relacionados** (click para navegar)

### Patrones Históricos

En el sidebar verás patrones identificados:
- "Crisis como catalizadores"
- "Reproducción de estructuras de poder"
- "Horizontalidad vs Sostenibilidad"

---

## 🔗 RECURSOS EXTERNOS (Solo Manifiesto)

### Abrir Recursos

1. En el libro "Manifiesto", click en **🔗** en el header
2. Se abren 4 tabs con diferentes tipos de recursos

### Tabs Disponibles

**🏢 Organizaciones (10)**
- Cooperativas, ONGs, movimientos
- Información de contacto y web
- Áreas de enfoque

**📚 Libros (10)**
- Libros complementarios recomendados
- Autor, año, sinopsis
- Enlaces para más información

**🎬 Documentales (5)**
- Documentales sobre movimientos sociales
- Director, año, duración
- Enlaces para ver online

**🛠️ Herramientas (5)**
- Apps y plataformas útiles
- Comunicación, organización, financiación
- Indicación si son gratuitas

### Usar Recursos

- Click en **"🌐 Visitar sitio web"** para abrir en nueva pestaña
- Todos los enlaces externos se abren fuera de la app

---

## 🔖 BOOKMARKS Y PROGRESO

### Marcar Capítulos

- Click en **🔖** en el header para marcar el capítulo actual
- Aparecerá relleno: **🔖** (marcado)
- Click de nuevo para desmarcar

### Ver Bookmarks

- En el sidebar, los capítulos marcados aparecen con 🔖
- Útil para marcar capítulos importantes o para revisar después

### Progreso de Lectura

**Automático:**
- Cada capítulo que visitas se marca como **leído** (✓ en sidebar)
- La barra de progreso se actualiza automáticamente
- Tu progreso se guarda en el navegador (LocalStorage)

**Ver Progreso:**
- En la biblioteca: Barra de progreso en cada libro
- En el sidebar: Porcentaje y capítulos leídos
- En la biblioteca: "X de Y capítulos"

---

## ⚙️ CONFIGURACIÓN Y AJUSTES

### Ajustes del Navegador

**Tamaño de fuente:**
- Usa zoom del navegador: `Ctrl + +` (aumentar) o `Ctrl + -` (disminuir)

**Modo oscuro:**
- La app usa modo oscuro por defecto
- Se adapta al tema del libro activo

### Datos Guardados

La app guarda en tu navegador:
- ✅ Progreso de lectura por libro
- ✅ Bookmarks
- ✅ Notas personales
- ✅ Historial de chat IA (sesión actual)
- ✅ API key de Claude

**Limpiar datos:**
```javascript
// En consola del navegador (F12)
localStorage.clear();
```

### Exportar Datos

**Notas:**
- Click **💾 Exportar** en modal de notas
- Descarga archivo `.md`

**Progreso:**
```javascript
// En consola
console.log(localStorage.getItem('coleccion_progress'));
```

---

## 📱 USO EN MÓVIL

### Navegador Móvil

La app funciona en cualquier navegador móvil:
- Chrome (Android)
- Safari (iOS)
- Firefox Mobile

**Controles táctiles:**
- Swipe izquierda: Siguiente capítulo
- Swipe derecha: Capítulo anterior
- Tap en sidebar: Ver/ocultar

### App Android

Si instalaste la app Android:
1. Abre "Colección Nuevo Ser" desde el launcher
2. Funciona igual que en web
3. **Ventaja:** Acceso offline a libros ya visitados

---

## 🎓 TIPS Y TRUCOS

### Lectura Eficiente

1. **Usa el sidebar** para saltar entre secciones
2. **Marca capítulos importantes** con bookmark 🔖
3. **Toma notas** mientras lees para reflexionar después
4. **Usa el chat IA** cuando algo no quede claro

### Aprendizaje Profundo

1. **Lee un capítulo**
2. **Pausa y reflexiona** (notas o chat IA)
3. **Explora recursos relacionados** (timeline/recursos)
4. **Comparte tus reflexiones** (exporta notas)

### Audioreader para Multitarea

- Escucha mientras haces otras cosas
- Usa velocidad 1.25x o 1.5x para ir más rápido
- Activa auto-advance para escuchar seguido

### Modos de IA en Manifiesto

- Empieza con modo **Crítico** para entender problemas
- Cambia a **Constructor** para soluciones prácticas
- Usa **Historiador** para contextualizar

---

## 🐛 PROBLEMAS COMUNES

### "Chat IA no responde"

**Solución:**
- Verifica que configuraste tu API key de Claude
- Revisa conexión a internet
- Recarga la página

### "Mis notas desaparecieron"

**Solución:**
- Las notas se guardan por navegador
- Si cambiaste de navegador o dispositivo, no las verás
- Exporta notas regularmente como backup

### "Audioreader no habla"

**Solución:**
- Verifica volumen del dispositivo
- Algunos navegadores requieren interacción del usuario primero (click play)
- Prueba en Chrome/Edge (mejor soporte)

### "La página no carga"

**Solución:**
- Verifica conexión a internet
- Limpia caché: Ctrl+Shift+R
- Prueba en modo incógnito

---

## 🆘 AYUDA Y SOPORTE

### Documentación Adicional

- **Guía Técnica:** Para desarrolladores
- **Guía de Deploy:** Para instalar en tu servidor
- **FAQ:** Preguntas frecuentes

### Reportar Problemas

Si encuentras un bug o tienes sugerencias:

1. Anota qué estabas haciendo
2. Copia mensaje de error (si hay)
3. Indica navegador y dispositivo
4. Contacta con el equipo

### Comunidad

[Aquí puedes añadir enlaces a redes sociales, forum, discord, etc.]

---

## 📚 GLOSARIO

**Bookmark:** Marcador para señalar capítulos importantes

**Chat IA:** Asistente inteligente para conversar sobre el libro

**Sidebar:** Barra lateral con lista de capítulos

**Timeline:** Línea temporal de eventos históricos

**Recursos:** Enlaces externos a organizaciones, libros, etc.

**Audioreader:** Sistema de narración con voz sintética

**Markdown:** Formato de texto simple para dar estilo

**LocalStorage:** Almacenamiento local en el navegador

---

## 🎉 ¡DISFRUTA LA LECTURA!

Explora, reflexiona, aprende y comparte.

La Colección Nuevo Ser es un espacio de co-creación entre humanos e IA para explorar las fronteras del pensamiento y la transformación personal y colectiva.

**¡Buena lectura!** 📖✨
