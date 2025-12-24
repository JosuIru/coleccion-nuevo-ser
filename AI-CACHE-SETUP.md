# Sistema de Caché de IA - Reducción de Costos 40-60%

## 📊 Problema Identificado

Según el análisis de mercado realizado:
- Los costos de IA pueden consumir el 40-60% de los ingresos
- Con 150 usuarios premium: ~25,000€ revenue → 10,000-15,000€ en costos IA
- **Cuello de botella crítico** para la viabilidad financiera

## 💡 Solución: Sistema de Caché de Dos Niveles

### Nivel 1: LocalStorage (Cliente)
- ✅ Respuesta instantánea (0 latencia)
- ✅ Sin costo
- ✅ Persistente en dispositivo
- 📦 Límite: 100 entradas más recientes (LRU)

### Nivel 2: Supabase (Compartido)
- ✅ Compartido entre todos los usuarios
- ✅ Respuestas comunes benefician a todos
- ✅ Persistente y centralizado
- 📦 Sin límite (limpieza automática de expirados)

## 🚀 Configuración

### 1. Base de Datos (Supabase)

Ejecutar migración:
```bash
supabase db push supabase/migrations/011_ai_cache_table.sql
```

Esto crea:
- Tabla `ai_cache` con índices optimizados
- Triggers para `updated_at` y `hit_count`
- Políticas RLS para seguridad
- Vista `ai_cache_stats` para métricas

### 2. Aplicación

Ya está configurado en `app-initialization.js`:
```javascript
window.aiCacheService = new AICacheService({
  enabled: true,
  maxLocalEntries: 100,
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 días
  definitionTTL: 30 * 24 * 60 * 60 * 1000, // 30 días
  debug: false
});
```

## 📖 Uso en Código

### Patrón Básico

```javascript
async function askAI(prompt, context = {}) {
  const type = 'chat'; // o 'definition', 'explain', 'summary', etc.

  // 1. Intentar obtener de caché
  const cached = await window.aiCacheService.get(type, prompt, context);
  if (cached) {
    console.log('✅ Respuesta de caché (sin costo)');
    return cached;
  }

  // 2. Si no está en caché, hacer llamada a IA
  const response = await callActualAIAPI(prompt, context);

  // 3. Guardar en caché para futuras consultas
  await window.aiCacheService.set(type, prompt, response, context);

  return response;
}
```

### Ejemplo Real: Text Selection Helper

```javascript
// EN: www/js/features/text-selection-helper.js

async explainText(selectedText) {
  const prompt = `Explica el siguiente texto: ${selectedText}`;
  const context = { bookId: this.currentBook, action: 'explain' };

  // Intentar caché
  const cached = await window.aiCacheService.get('explain', prompt, context);
  if (cached) {
    this.displayResponse(cached);
    return;
  }

  // Llamar a IA
  const response = await this.callClaudeAPI(prompt);

  // Guardar en caché
  await window.aiCacheService.set('explain', prompt, response, context);

  this.displayResponse(response);
}
```

### Ejemplo Real: AI Chat Modal

```javascript
// EN: www/js/features/ai-chat-modal.js

async sendMessage(userMessage) {
  const context = { bookId: this.currentBook, chapterId: this.currentChapter };

  // Solo cachear preguntas sobre conceptos (no conversaciones personales)
  if (this.isConceptualQuestion(userMessage)) {
    const cached = await window.aiCacheService.get('chat', userMessage, context);
    if (cached) {
      this.addMessageToChat('assistant', cached);
      return;
    }
  }

  // Llamar a IA
  const response = await this.callChatAPI(userMessage);

  // Guardar en caché si es conceptual
  if (this.isConceptualQuestion(userMessage)) {
    await window.aiCacheService.set('chat', userMessage, response, context);
  }

  this.addMessageToChat('assistant', response);
}

isConceptualQuestion(message) {
  // Preguntas sobre definiciones, explicaciones, conceptos
  const conceptualKeywords = [
    'qué es', 'define', 'explica', 'significa',
    'diferencia entre', 'cómo funciona', 'por qué'
  ];
  const lowerMessage = message.toLowerCase();
  return conceptualKeywords.some(kw => lowerMessage.includes(kw));
}
```

### Tipos de Consulta Recomendados para Caché

#### ✅ Cachear (Alto retorno)
- `definition` - Definiciones de términos
- `explain` - Explicaciones de conceptos
- `summary` - Resúmenes de capítulos
- Preguntas conceptuales frecuentes

#### ❌ NO Cachear (Bajo retorno)
- Conversaciones contextuales personales
- Generación creativa única
- Análisis de notas personales
- Preguntas con contexto temporal ("hoy", "ahora")

## 📊 Monitoreo de Métricas

### Ver Estadísticas

```javascript
// En consola del navegador
const stats = window.aiCacheService.getStats();
console.log(stats);
```

Retorna:
```javascript
{
  hits: 450,              // Respuestas de caché
  misses: 200,            // Llamadas a IA reales
  localHits: 350,         // Desde localStorage
  remoteHits: 100,        // Desde Supabase
  saves: 200,             // Entradas guardadas
  hitRate: "69.23",       // % de aciertos
  localCacheSize: 87,     // Entradas en localStorage
  estimatedSavings: "0.90" // € ahorrados
}
```

### Dashboard en Supabase

```sql
-- Ver estadísticas por tipo de consulta
SELECT * FROM ai_cache_stats ORDER BY total_hits DESC;

-- Entradas más populares
SELECT
  query_type,
  hit_count,
  created_at,
  expires_at
FROM ai_cache
ORDER BY hit_count DESC
LIMIT 20;

-- Limpiar entradas expiradas manualmente
SELECT cleanup_expired_ai_cache();
```

## 🎯 Objetivos de Hit Rate

| Hit Rate | Reducción de Costos | Acción |
|----------|---------------------|--------|
| < 30% | Baja (< 20%) | Revisar tipos de consultas cacheadas |
| 30-50% | Moderada (20-35%) | Funcionando bien |
| 50-70% | Alta (35-50%) | ✅ Objetivo alcanzado |
| > 70% | Muy Alta (50-65%) | 🎉 Excelente |

## 🔧 Configuración Avanzada

### Ajustar TTL por Tipo

```javascript
// Definiciones permanecen 30 días
if (type === 'definition') {
  ttl = 30 * 24 * 60 * 60 * 1000;
}

// Resúmenes de capítulos 7 días
if (type === 'summary') {
  ttl = 7 * 24 * 60 * 60 * 1000;
}

// Preguntas conceptuales 14 días
if (type === 'explain') {
  ttl = 14 * 24 * 60 * 60 * 1000;
}
```

### Limpieza Manual

```javascript
// Limpiar caché local
window.aiCacheService.clearLocalCache();

// Limpiar caché remota (requiere permisos)
await window.aiCacheService.clearRemoteCache();

// Resetear estadísticas
window.aiCacheService.resetStats();
```

### Deshabilitar Temporalmente

```javascript
// Deshabilitar (útil para debugging)
window.aiCacheService.disable();

// Rehabilitar
window.aiCacheService.enable();
```

## 💰 Cálculo de Ahorro

### Ejemplo Real

Asumiendo:
- 150 usuarios premium activos
- 20 consultas IA/usuario/día promedio
- Costo promedio: 0.002€ por consulta
- Hit rate objetivo: 60%

**Sin caché:**
- 150 usuarios × 20 consultas × 30 días = 90,000 consultas/mes
- 90,000 × 0.002€ = **180€/mes** = **2,160€/año**

**Con caché (60% hit rate):**
- Solo 40% llegan a IA real = 36,000 consultas
- 36,000 × 0.002€ = **72€/mes** = **864€/año**

**Ahorro: 108€/mes = 1,296€/año (60% reducción)**

### Escalado a 1,000 Usuarios

- Sin caché: 12,000€/año
- Con caché: 4,800€/año
- **Ahorro: 7,200€/año**

## 🚨 Limpieza Automática (Opcional)

Si tienes acceso a `pg_cron` en Supabase:

```sql
-- Programar limpieza diaria a las 2 AM
SELECT cron.schedule(
  'cleanup-expired-ai-cache',
  '0 2 * * *',
  $$ SELECT cleanup_expired_ai_cache(); $$
);
```

## 📝 Checklist de Integración

### Puntos Críticos a Integrar

- [ ] `www/js/features/text-selection-helper.js`
  - [ ] `explainText()`
  - [ ] `defineText()`
  - [ ] `summarizeText()`
  - [ ] `deepenText()`

- [ ] `www/js/features/ai-chat-modal.js`
  - [ ] `sendMessage()` (solo preguntas conceptuales)
  - [ ] Agregar `isConceptualQuestion()`

- [ ] `www/js/features/ai-settings-modal.js`
  - [ ] Mostrar estadísticas de caché
  - [ ] Botón para limpiar caché

- [ ] `www/js/features/admin-panel-modal.js`
  - [ ] Dashboard de métricas de caché
  - [ ] Botón para ver top queries

## 🎓 Mejores Prácticas

1. **Cachear Agresivamente**
   - Definiciones, explicaciones, conceptos nunca cambian
   - Usa TTL largo (30 días)

2. **No Cachear Conversaciones**
   - Chat contextual es único por usuario
   - Solo cachear preguntas independientes

3. **Monitorear Hit Rate**
   - Objetivo: > 50%
   - Revisar semanalmente al inicio
   - Ajustar estrategia según datos

4. **Contexto Mínimo**
   - Solo incluir contexto necesario para unicidad
   - `{ bookId }` puede ser suficiente
   - Evitar `{ userId, timestamp, sessionId }`

5. **Transparencia al Usuario**
   - Usuario no debe notar diferencia
   - Respuestas de caché = mismo UX
   - Opcional: mostrar badge "⚡ Instantáneo"

## 🔍 Debugging

```javascript
// Ver estado completo
console.log(window.aiCacheService.getStats());

// Ver entrada específica
const key = window.aiCacheService.generateCacheKey('explain', 'prompt', {});
console.log(localStorage.getItem(key));

// Habilitar debug
window.aiCacheService.debug = true;

// Ver todas las claves de caché
Object.keys(localStorage).filter(k => k.startsWith('ai_cache_'));
```

## ✅ Verificación de Instalación

1. Abrir app en navegador
2. Abrir DevTools > Console
3. Escribir: `window.aiCacheService.getStats()`
4. Debería retornar objeto con stats
5. Hacer una consulta de IA (ejemplo: definir término)
6. Hacer la misma consulta de nuevo
7. Verificar que hit_count aumentó: `window.aiCacheService.getStats()`

## 📈 Próximos Pasos

Una vez integrado y monitoreado durante 2-4 semanas:

1. Analizar qué tipos de consultas tienen mejor hit rate
2. Ajustar TTL según patrones de uso
3. Considerar pre-cachear FAQs comunes
4. Implementar cache warming para contenido nuevo
5. A/B test: mostrar badge "⚡" en respuestas cacheadas

---

**Impacto Esperado:** Reducción de costos de IA del 40-60%, mejorando significativamente los márgenes y viabilidad del modelo de negocio.
