# Sistema de Crisis Dinámicas - Awakening Protocol

## Descripción

Sistema completo de generación de crisis basadas en **noticias reales** del mundo para el juego móvil Awakening Protocol. Convierte eventos globales actuales en misiones educativas jugables.

## ¿Qué hace?

1. **Lee noticias** de fuentes verificadas (UN News, Reuters, BBC, Guardian)
2. **Clasifica** con IA (OpenAI/Claude/Gemini) o keywords
3. **Genera crisis jugables** con ubicación, urgencia, atributos requeridos
4. **Funciona offline** con generación procedural
5. **Se sincroniza** automáticamente cada 6 horas

## Instalación Rápida (5 minutos)

### Opción 1: Script automático

```bash
chmod +x setup-crisis-system.sh
./setup-crisis-system.sh
```

### Opción 2: Manual

```bash
# Crear directorios
mkdir -p cache/rss cache/ai
chmod 755 cache cache/rss cache/ai

# Configurar API key (opcional)
cd api
cp .env.example .env
nano .env  # Agregar OPENAI_API_KEY=sk-...

# Verificar
curl "http://localhost/api/rss-parser.php?action=health"
```

## Estructura de Archivos

```
mobile-game/
├── api/
│   ├── rss-parser.php       ← Parser de noticias RSS
│   ├── ai-classifier.php    ← Clasificador con IA
│   └── .env                 ← API keys (opcional)
├── mobile-app/src/
│   ├── services/
│   │   └── CrisisService.js ← Servicio React Native
│   └── screens/
│       └── CrisisExampleScreen.js ← Ejemplo de UI
├── cache/
│   ├── rss/                 ← Caché de noticias (1h)
│   └── ai/                  ← Caché de clasificaciones
├── test-crisis-system.html  ← Interfaz de testing
├── CRISIS-SYSTEM-GUIDE.md   ← Documentación técnica
├── CRISIS-QUICK-START.md    ← Guía de inicio
└── IMPLEMENTACION-CRISIS.md ← Resumen de implementación
```

## Uso Básico

### Backend PHP

```bash
# Obtener noticias
curl "http://localhost/api/rss-parser.php?action=get_news&limit=10"

# Clasificar noticia
curl -X POST "http://localhost/api/ai-classifier.php?action=classify" \
  -H "Content-Type: application/json" \
  -d '{"title":"Wildfire threatens communities","description":"...","primaryCategory":"environmental"}'
```

### React Native

```javascript
import CrisisService from './services/CrisisService';

// Obtener crisis
const crises = await CrisisService.getCrises({ limit: 10 });

// Filtrar por tipo
const environmental = await CrisisService.getCrises({
  type: 'environmental',
  limit: 5
});

// Completar crisis
await CrisisService.completeCrisis(crisisId, userId, {
  success: true,
  population_affected: 50000
});

// Ver estadísticas
const stats = await CrisisService.getCrisisStats(userId);
console.log(`Completadas: ${stats.total_completed}`);
```

## Características Principales

### ✅ Noticias Reales

- 4 fuentes verificadas (UN, Reuters, BBC, Guardian)
- Actualización automática
- URLs a fuentes originales

### ✅ Clasificación Inteligente

- OpenAI GPT-4
- Anthropic Claude 3.5
- Google Gemini
- Fallback sin IA (20 crisis predefinidas)

### ✅ Modo Offline

- Generación procedural
- Caché persistente (6h)
- Funciona sin internet

### ✅ Datos Estructurados

```json
{
  "type": "environmental",
  "title": "Incendio amenaza Amazonía",
  "urgency": 9,
  "location": {"country": "Brasil", "lat": -3.46, "lon": -62.21},
  "attributes": {"empathy": 75, "action": 90, "organization": 85},
  "population_affected": 500000,
  "duration_minutes": 50
}
```

### ✅ Performance Optimizado

- Caché de 1h en backend
- Caché de 6h en móvil
- Rate limiting inteligente
- Deduplicación automática

## Tipos de Crisis

1. **Environmental** 🌍 - Clima, desastres naturales
2. **Social** 👥 - Protestas, derechos civiles
3. **Economic** 💰 - Crisis financieras, desempleo
4. **Humanitarian** ❤️ - Refugiados, hambrunas
5. **Health** 🏥 - Pandemias, emergencias sanitarias
6. **Educational** 📚 - Crisis educativas
7. **Infrastructure** 🏗️ - Colapsos de infraestructura

## Modos de Operación

### Modo 1: Full IA (Óptimo)

```
RSS Feeds → Noticias → AI Classifier → Crisis
```
- Requiere API key
- Más preciso
- ~$0.01-0.05 por 10 crisis

### Modo 2: Sin IA (Gratuito)

```
RSS Feeds → Noticias → Keywords → Crisis Predefinidas
```
- Sin API key
- Gratis ilimitado
- Menos precisión geográfica

### Modo 3: Offline (Fallback)

```
Templates Locales → Crisis Procedurales
```
- Sin internet
- Instantáneo
- Datos ficticios

## Testing

### Interfaz Visual

Abrir: `test-crisis-system.html`

Incluye:
- Health checks
- Fetch de noticias
- Clasificación con IA
- Pipeline completo
- Estadísticas en vivo

### Ejemplos de comandos

```bash
# Health check
curl "http://localhost/api/rss-parser.php?action=health"

# 5 noticias ambientales
curl "http://localhost/api/rss-parser.php?action=get_news&limit=5&type=environmental"

# Clasificar con IA
echo '{"title":"Climate crisis","description":"..."}' | \
  curl -X POST "http://localhost/api/ai-classifier.php?action=classify" \
    -H "Content-Type: application/json" -d @-
```

## Configuración Avanzada

### API Keys

Editar `api/.env`:

```bash
# OpenAI (recomendado)
OPENAI_API_KEY=sk-proj-tu-clave-aqui

# O Claude
CLAUDE_API_KEY=sk-ant-tu-clave-aqui

# O Gemini (gratuito)
GEMINI_API_KEY=tu-clave-aqui
```

### Ajustar Caché

En `rss-parser.php`:
```php
private $cacheLifetime = 3600; // 1 hora
```

En `CrisisService.js`:
```javascript
this.cacheLifetime = 6 * 60 * 60 * 1000; // 6 horas
```

### Añadir Feeds RSS

En `rss-parser.php` línea 30:
```php
private $feedSources = [
    'new_source' => [
        'url' => 'https://...',
        'name' => 'My Source',
        'reliability' => 0.90,
        'language' => 'en'
    ]
];
```

## Troubleshooting

### "Cache dir not writable"

```bash
chmod 755 cache cache/rss cache/ai
```

### "No se cargan crisis"

```javascript
await CrisisService.clearCache();
await CrisisService.getCrises({ forceRefresh: true });
```

### "Rate limit exceeded"

```bash
rm cache/ai/rate_limit.json
```

### "AI classification fails"

El sistema automáticamente usa fallback sin IA.

Verificar API key:
```bash
cat api/.env
# Debe tener: OPENAI_API_KEY=sk-...
```

## Documentación

- 📖 **Guía completa**: `CRISIS-SYSTEM-GUIDE.md`
- ⚡ **Quick Start**: `CRISIS-QUICK-START.md`
- 🔧 **Implementación**: `IMPLEMENTACION-CRISIS.md`

## Métricas

- **Código**: ~3,000 líneas
- **Archivos**: 8 archivos principales
- **Funcionalidades**: 50+
- **Tiempo de setup**: ~5 minutos
- **Fuentes RSS**: 4 verificadas
- **Crisis fallback**: 20 predefinidas
- **Tipos de crisis**: 7 categorías

## Performance

| Operación | Tiempo |
|-----------|--------|
| RSS Parse (primera vez) | 8-12s |
| RSS Parse (cache) | <50ms |
| AI Classification | 2-5s |
| Fallback Classification | <100ms |
| Full Pipeline (10 crisis) | 25-40s |
| Cache read (móvil) | 50-100ms |

## Roadmap

- [ ] Base de datos persistente (Supabase)
- [ ] Más feeds RSS (Al Jazeera, NYT)
- [ ] Notificaciones push
- [ ] Mapas de calor globales
- [ ] Análisis de sentimiento
- [ ] Modo colaborativo
- [ ] Leaderboards globales

## Contribuir

1. Fork el repo
2. Crea una rama: `git checkout -b feature/nueva-fuente-rss`
3. Commit: `git commit -m 'Añadir feed de Al Jazeera'`
4. Push: `git push origin feature/nueva-fuente-rss`
5. Pull Request

## Licencia

MIT License - Awakening Protocol Team

## Contacto

- GitHub Issues: [Reportar bugs]
- Email: contact@awakeningprotocol.org
- Discord: [Comunidad]

---

**Versión**: 1.0.0
**Última actualización**: 2025-12-13
**Estado**: ✅ Producción Ready

¡Listo para transformar noticias en misiones! 🌍✨
