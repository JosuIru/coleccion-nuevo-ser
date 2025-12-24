# Configuración de Google Analytics 4

## 📊 Obtener Measurement ID de GA4

### 1. Crear cuenta de Google Analytics
1. Ve a [analytics.google.com](https://analytics.google.com)
2. Crea una cuenta si no tienes una
3. Crea una nueva **propiedad GA4** (no Universal Analytics)

### 2. Obtener Measurement ID
1. En tu propiedad GA4, ve a **Admin** (⚙️)
2. En la columna "Propiedad", selecciona **Flujos de datos**
3. Click en el flujo de datos web (o créalo si no existe)
4. Copia el **ID de medición** (formato: `G-XXXXXXXXXX`)

### 3. Configurar en la aplicación
Edita el archivo: `www/js/core/app-initialization.js`

Reemplaza la línea 19:
```javascript
measurementId: 'G-XXXXXXXXXX', // TODO: Reemplazar con ID real de GA4
```

Por tu ID real:
```javascript
measurementId: 'G-ABC123XYZ', // Tu ID de GA4
```

## 📈 Eventos Configurados

El sistema ya trackea automáticamente:

### Onboarding
- `tutorial_begin` - Usuario inicia el tutorial
- `tutorial_complete` - Usuario completa el tutorial
- `tutorial_skip` - Usuario salta el tutorial (incluye paso)

### Navegación
- `page_view` - Vista de página
- `screen_view` - Vista de pantalla (móvil)

### Lectura
- `book_open` - Usuario abre un libro
- `chapter_start` - Usuario inicia un capítulo
- `chapter_complete` - Usuario completa un capítulo (con tiempo)
- `reading_time` - Tiempo de lectura por capítulo

### IA
- `ai_chat_open` - Usuario abre el chat IA
- `ai_chat_message` - Usuario envía mensaje (contador + modelo)
- `text_selection_action` - Usuario usa selección de texto inteligente

### Audio
- `audio_start` - Usuario inicia reproducción
- `audio_complete` - Usuario completa reproducción

### Conversión
- `begin_checkout` - Usuario inicia proceso de pago
- `purchase` - Compra completada (con transactionId)
- `subscription_upgrade` - Upgrade de plan

### Engagement
- `bookmark_add` - Usuario crea marcador
- `note_create` - Usuario crea nota
- `share` - Usuario comparte contenido
- `search` - Usuario realiza búsqueda

### Frankenstein Lab
- `lab_open` - Usuario abre el lab
- `mission_start` - Usuario inicia misión
- `mission_complete` - Usuario completa misión (con score)
- `level_up` - Usuario sube de nivel

### Errores
- `app_error` - Error en la aplicación (fatal/no fatal)

## 🔧 Uso Manual

Para trackear eventos personalizados:

```javascript
// Evento simple
window.analyticsHelper.trackEvent('custom_event', {
  parameter1: 'value1',
  parameter2: 123
});

// Eventos predefinidos
window.analyticsHelper.trackBookOpen('libro-id', 'Título del Libro');
window.analyticsHelper.trackChapterStart('libro-id', 'cap-1', 'Introducción');
window.analyticsHelper.trackPurchase('txn-123', 'Premium', 9.99, 'EUR');
```

## 🎯 Métricas Clave a Monitorear

### Adquisición
- Fuentes de tráfico
- Canales de adquisición
- Campañas de marketing

### Activación (Crítico para reducir abandono)
- % que completa tutorial
- % que salta tutorial (y en qué paso)
- Tiempo hasta primera acción (abrir libro)

### Engagement
- Tiempo promedio de lectura
- Capítulos completados
- Uso de features (IA, Audio, Notas)
- Frankenstein Lab: misiones completadas

### Conversión (Cuello de botella identificado)
- Free → Premium conversion rate
- Premium → Pro conversion rate
- Tiempo hasta conversión
- Eventos previos a conversión

### Retención
- DAU/MAU ratio
- Sesiones por usuario
- Días activos por mes

## 📊 Dashboards Recomendados

Crea estos dashboards en GA4:

1. **Funnel de Onboarding**
   - Tutorial iniciado → Completado → Primera lectura

2. **Funnel de Conversión**
   - Vista de planes → Begin checkout → Purchase

3. **Engagement por Feature**
   - Uso de IA vs Audio vs Notas vs Lab

4. **Retención Cohorts**
   - Usuarios por semana de registro, actividad semanal

## 🔒 Privacidad

El sistema está configurado con:
- ✅ `anonymize_ip: true` - IPs anonimizadas
- ✅ No se envían datos personales identificables
- ✅ Se puede deshabilitar: `window.analyticsHelper.disable()`

## 🧪 Modo Debug

Para desarrollo, los eventos se muestran en consola:
```javascript
window.analyticsHelper = new AnalyticsHelper({
  enabled: true,
  measurementId: 'G-XXXXXXXXXX',
  debug: true // Mostrar eventos en consola
});
```

## ✅ Verificar Instalación

1. Abre la app en navegador
2. Abre **DevTools > Console**
3. Deberías ver:
   ```
   [Analytics] GA4 inicializado con ID: G-XXXXXXXXXX
   [AppInit] Sistema de analytics inicializado
   ```
4. Ve a GA4 > Informes > Tiempo real
5. Deberías ver tu sesión activa

## 🚀 Próximos Pasos

Después de 7-14 días de datos:
1. Identificar puntos de abandono en onboarding
2. Medir efectividad del tutorial nuevo
3. Calcular conversion rate real Free→Premium
4. Optimizar features menos usadas o eliminarlas
5. A/B testing de variaciones de precios/planes
