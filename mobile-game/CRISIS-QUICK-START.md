# Quick Start - Sistema de Crisis Dinámicas

Guía de 5 minutos para poner en marcha el sistema de crisis dinámicas.

## 1. Instalación Backend (PHP)

```bash
# Navegar al directorio del proyecto
cd mobile-game

# Crear directorios de caché
mkdir -p cache/rss cache/ai
chmod 755 cache cache/rss cache/ai

# Copiar configuración de ejemplo (opcional)
cd api
cp .env.example .env

# Editar .env y agregar tu API key (opcional - funciona sin esto)
nano .env
```

**Configurar API key (OPCIONAL)**:

```bash
# Solo si quieres usar IA para clasificación
# De lo contrario, el sistema usa fallback predefinido

# Opción 1: OpenAI (recomendado)
OPENAI_API_KEY=sk-proj-tu-clave-aqui

# Opción 2: Claude
CLAUDE_API_KEY=sk-ant-tu-clave-aqui

# Opción 3: Gemini (gratuito)
GEMINI_API_KEY=tu-clave-aqui
```

## 2. Verificar Instalación

Abrir en el navegador:

```
http://localhost/mobile-game/test-crisis-system.html
```

O usar curl:

```bash
# Test RSS Parser
curl "http://localhost/mobile-game/api/rss-parser.php?action=health"

# Test AI Classifier
curl "http://localhost/mobile-game/api/ai-classifier.php?action=health"

# Obtener noticias
curl "http://localhost/mobile-game/api/rss-parser.php?action=get_news&limit=5"
```

**Respuesta esperada**:

```json
{
  "status": "success",
  "service": "RSS Parser",
  "version": "1.0.0",
  "feeds_configured": 4,
  "cache_dir_writable": true
}
```

## 3. Configurar Mobile App (React Native)

```bash
cd mobile-app

# Instalar AsyncStorage (si no está)
npm install @react-native-async-storage/async-storage
```

**Editar `src/config/constants.js`**:

```javascript
export const API_BASE_URL = __DEV__
  ? 'http://localhost/mobile-game/api/mobile-bridge.php'
  : 'https://tu-dominio.com/mobile-game/api/mobile-bridge.php';
```

## 4. Usar en la App

```javascript
import CrisisService from './services/CrisisService';

// En tu componente
async function loadCrises() {
  try {
    // Obtener todas las crisis activas
    const crises = await CrisisService.getCrises({
      limit: 10
    });

    console.log(`Crisis cargadas: ${crises.length}`);

    // Activar auto-refresh cada 6 horas
    CrisisService.startAutoRefresh();

  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 5. Ejemplos de Uso

### Filtrar por tipo

```javascript
// Solo crisis ambientales
const environmental = await CrisisService.getCrises({
  type: 'environmental',
  limit: 5
});

// Solo crisis humanitarias
const humanitarian = await CrisisService.getCrises({
  type: 'humanitarian',
  limit: 5
});
```

### Forzar refresh

```javascript
// Ignorar caché y obtener noticias frescas
const fresh = await CrisisService.getCrises({
  forceRefresh: true
});
```

### Marcar como completada

```javascript
// Cuando el jugador completa una crisis
await CrisisService.completeCrisis(
  crisisId,
  userId,
  {
    success: true,
    population_affected: 50000,
    duration: 30
  }
);
```

### Ver estadísticas

```javascript
const stats = await CrisisService.getCrisisStats(userId);

console.log(`
  Total completadas: ${stats.total_completed}
  Tasa de éxito: ${stats.success_rate}%
  Personas ayudadas: ${stats.total_population_helped}
`);
```

## 6. Troubleshooting Rápido

### "Cache dir not writable"

```bash
chmod 755 cache
chmod 755 cache/rss
chmod 755 cache/ai
```

### "No se cargan crisis"

```javascript
// Limpiar caché
await CrisisService.clearCache();

// Forzar modo procedural (offline)
const crises = CrisisService.generateProceduralCrises();
```

### "Rate limit exceeded"

```bash
# Esperar 1 minuto O limpiar límite
rm cache/ai/rate_limit.json
```

### "RSS feeds timeout"

Las primeras veces puede tardar 10-15 segundos en parsear todos los feeds.
Luego se cachea por 1 hora.

## 7. Modos de Operación

### Modo 1: Full IA (requiere API key)

```
RSS Feeds → Noticias → AI Classifier → Crisis
```

**Ventajas**:
- Crisis reales actualizadas
- Clasificación precisa
- Datos geográficos exactos

### Modo 2: Fallback Sin IA (sin API key)

```
RSS Feeds → Noticias → Clasificación por Keywords → Crisis
```

**Ventajas**:
- No requiere API keys
- Gratis e ilimitado
- Usa 20 crisis predefinidas

### Modo 3: Offline Puro

```
Crisis Procedurales Locales
```

**Ventajas**:
- Funciona sin internet
- Instantáneo
- 10 crisis variadas

## 8. Testing

### Test Manual

Abrir: `test-crisis-system.html`

Ejecutar:
1. ✅ Health Checks
2. 📰 Obtener Noticias
3. 🤖 Clasificar con IA
4. 🔄 Pipeline Completo

### Test con curl

```bash
# Pipeline completo
curl -X GET "http://localhost/mobile-game/api/rss-parser.php?action=get_news&limit=5" \
  | jq '.data.news[0]' \
  | curl -X POST "http://localhost/mobile-game/api/ai-classifier.php?action=classify" \
       -H "Content-Type: application/json" \
       -d @- \
  | jq '.data'
```

## 9. Estructura de Archivos

```
mobile-game/
├── api/
│   ├── rss-parser.php          # Parser de RSS
│   ├── ai-classifier.php       # Clasificador con IA
│   ├── mobile-bridge.php       # API existente
│   ├── .env.example            # Template de configuración
│   └── .env                    # Tu configuración (crear)
├── cache/
│   ├── rss/                    # Caché de noticias
│   └── ai/                     # Caché de clasificaciones
├── mobile-app/
│   └── src/
│       └── services/
│           └── CrisisService.js # Servicio React Native
├── test-crisis-system.html     # Interfaz de testing
├── CRISIS-SYSTEM-GUIDE.md      # Documentación completa
└── CRISIS-QUICK-START.md       # Esta guía
```

## 10. Próximos Pasos

1. **Personalizar feeds RSS**: Editar `rss-parser.php` línea 30
2. **Ajustar keywords**: Editar `rss-parser.php` línea 50
3. **Modificar crisis fallback**: Editar `ai-classifier.php` línea 70
4. **Customizar caché**: Editar tiempos en cada servicio

## Recursos

- 📖 **Documentación completa**: `CRISIS-SYSTEM-GUIDE.md`
- 🧪 **Testing**: `test-crisis-system.html`
- 🔑 **API Keys**:
  - OpenAI: https://platform.openai.com/api-keys
  - Claude: https://console.anthropic.com/
  - Gemini: https://makersuite.google.com/app/apikey

## Soporte

- GitHub Issues
- Email: contact@awakeningprotocol.org
- Discord: [Servidor comunitario]

---

**Versión**: 1.0.0
**Última actualización**: 2025-12-13
**Tiempo de setup**: ~5 minutos

¡Listo para generar crisis del mundo real! 🌍✨
