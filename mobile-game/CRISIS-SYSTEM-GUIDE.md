# Sistema de Crisis Dinámicas - Awakening Protocol

Sistema completo de generación de crisis basadas en noticias reales para el juego móvil Awakening Protocol.

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Componentes](#componentes)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Uso](#uso)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Ejemplos de Respuestas](#ejemplos-de-respuestas)
7. [Modo Offline](#modo-offline)
8. [Troubleshooting](#troubleshooting)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │           CrisisService.js                         │     │
│  │  - Orchestrator principal                          │     │
│  │  - Caché local (AsyncStorage)                      │     │
│  │  - Modo offline con crisis procedurales            │     │
│  └────────────────────────────────────────────────────┘     │
│                         ▲                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                    BACKEND (PHP APIs)                        │
│                         │                                    │
│  ┌──────────────────────▼─────────┐  ┌─────────────────────┐│
│  │   rss-parser.php               │  │ ai-classifier.php   ││
│  │                                 │  │                     ││
│  │  - Fetch RSS de UN, Reuters    │  │ - OpenAI GPT-4      ││
│  │  - Parse XML → JSON             │  │ - Anthropic Claude  ││
│  │  - Filtrado por keywords        │  │ - Google Gemini     ││
│  │  - Deduplicación                │  │ - Fallback local    ││
│  │  - Caché (1 hora)               │  │ - Rate limiting     ││
│  └─────────────────────────────────┘  └─────────────────────┘│
│                         │                       │             │
└─────────────────────────┼───────────────────────┼─────────────┘
                          │                       │
                          ▼                       ▼
                    ┌─────────┐           ┌─────────────┐
                    │ RSS     │           │ AI Provider │
                    │ Feeds   │           │ (opcional)  │
                    └─────────┘           └─────────────┘
```

---

## Componentes

### 1. RSS Parser (`api/rss-parser.php`)

**Propósito**: Parsear feeds RSS de fuentes de noticias confiables.

**Fuentes configuradas**:
- UN News (Confiabilidad: 95%)
- Reuters World (Confiabilidad: 90%)
- BBC World (Confiabilidad: 88%)
- The Guardian (Confiabilidad: 85%)

**Características**:
- ✅ Parseo de RSS 2.0 y Atom
- ✅ Extracción de imágenes
- ✅ Filtrado por 60+ keywords relevantes
- ✅ Deduplicación por similitud (80%)
- ✅ Categorización automática (7 tipos de crisis)
- ✅ Caché de 1 hora
- ✅ Manejo robusto de errores

**Keywords por categoría**:

```php
environmental: climate, disaster, flood, wildfire, pollution...
social: protest, rights, inequality, discrimination...
humanitarian: famine, refugee, emergency, displaced...
health: pandemic, epidemic, outbreak, virus...
economic: crisis, recession, poverty, inflation...
educational: education crisis, school closure, literacy...
infrastructure: collapse, power outage, blackout...
```

### 2. AI Classifier (`api/ai-classifier.php`)

**Propósito**: Analizar noticias con IA y convertirlas en crisis jugables estructuradas.

**Proveedores soportados**:
- **OpenAI GPT-4** (recomendado para precisión)
- **Anthropic Claude 3.5 Sonnet** (mejor para análisis contextual)
- **Google Gemini** (alternativa gratuita)

**Proceso de clasificación**:

```
1. Recibe noticia (título + descripción)
2. Envía prompt especializado a IA
3. Extrae JSON estructurado
4. Valida campos requeridos
5. Agrega metadatos de juego
6. Guarda en caché
```

**Estructura de crisis generada**:

```json
{
  "type": "environmental | social | economic | humanitarian | health | educational | infrastructure",
  "title": "Título conciso (max 60 chars)",
  "description": "Descripción breve (max 150 chars)",
  "location": {
    "country": "Nombre del país",
    "city": "Ciudad afectada",
    "lat": -34.6037,
    "lon": -58.3816
  },
  "urgency": 8,
  "scale": "local | regional | national | continental | global",
  "attributes": {
    "empathy": 70,
    "organization": 85,
    "action": 75,
    "technical": 60,
    "communication": 80,
    "leadership": 65
  },
  "population_affected": 500000,
  "duration_minutes": 45,
  "id": "crisis_1234567890_abc123",
  "createdAt": "2025-12-13T10:30:00.000Z",
  "expiresAt": "2025-12-15T10:30:00.000Z",
  "status": "active",
  "source": "news",
  "newsUrl": "https://...",
  "newsSource": "UN News"
}
```

**Rate Limiting**:
- Máximo 10 clasificaciones por minuto
- Ventana deslizante de 60 segundos
- Protección contra abuso de API

**Fallback sin IA**:
- 20 crisis predefinidas de alta calidad
- Clasificación basada en keywords
- Funciona 100% offline

### 3. Crisis Service (`mobile-app/src/services/CrisisService.js`)

**Propósito**: Servicio React Native que orquesta todo el sistema.

**Flujo principal**:

```javascript
1. getCrises() → Punto de entrada
   ├─→ ¿Caché válido? → Retornar desde caché
   ├─→ ¿Online? → fetchCrisesFromNetwork()
   │   ├─→ RSS Parser → Obtener noticias
   │   └─→ AI Classifier → Clasificar cada noticia
   └─→ Offline → generateProceduralCrises()
```

**Características**:
- ✅ Caché local con AsyncStorage
- ✅ Revalidación automática cada 6 horas
- ✅ Detección de conectividad
- ✅ Generación procedural offline
- ✅ Filtrado por tipo y límite
- ✅ Sistema de expiración (24-72h)
- ✅ Tracking de crisis completadas
- ✅ Estadísticas de impacto

**Métodos públicos**:

```javascript
// Obtener crisis activas
await CrisisService.getCrises({
  forceRefresh: false,
  type: 'environmental',
  limit: 10
});

// Marcar como completada
await CrisisService.completeCrisis(crisisId, userId, result);

// Obtener estadísticas
await CrisisService.getCrisisStats(userId);

// Auto-refresh
CrisisService.startAutoRefresh();
CrisisService.stopAutoRefresh();

// Caché manual
await CrisisService.clearCache();
```

---

## Instalación y Configuración

### Paso 1: Backend PHP

1. **Verificar requisitos**:
   - PHP 7.4+
   - cURL habilitado
   - Permisos de escritura en `/cache`

2. **Crear directorio de caché**:

```bash
cd mobile-game/api
mkdir -p ../cache/rss
mkdir -p ../cache/ai
chmod 755 ../cache
```

3. **Configurar API keys** (opcional):

```bash
cp .env.example .env
nano .env
```

Editar `.env`:

```bash
# Opción 1: OpenAI (recomendado)
OPENAI_API_KEY=sk-proj-your-key-here

# Opción 2: Claude (mejor análisis)
CLAUDE_API_KEY=sk-ant-your-key-here

# Opción 3: Gemini (gratuito)
GEMINI_API_KEY=your-key-here
```

4. **Verificar instalación**:

```bash
# Health check RSS Parser
curl "http://localhost/api/rss-parser.php?action=health"

# Health check AI Classifier
curl "http://localhost/api/ai-classifier.php?action=health"
```

### Paso 2: Mobile App (React Native)

1. **Verificar que AsyncStorage esté instalado**:

```bash
cd mobile-app
npm install @react-native-async-storage/async-storage
```

2. **Configurar URL de API**:

Editar `src/config/constants.js`:

```javascript
export const API_BASE_URL = __DEV__
  ? 'http://localhost/coleccion-nuevo-ser/mobile-game/api/mobile-bridge.php'
  : 'https://tudominio.com/mobile-game/api/mobile-bridge.php';
```

3. **Importar el servicio**:

```javascript
import CrisisService from './services/CrisisService';
```

---

## Uso

### Ejemplo básico (React Native)

```javascript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import CrisisService from '../services/CrisisService';

function CrisisListScreen() {
  const [crises, setCrises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrises();

    // Auto-refresh cada 6 horas
    CrisisService.startAutoRefresh();

    return () => {
      CrisisService.stopAutoRefresh();
    };
  }, []);

  async function loadCrises() {
    try {
      setLoading(true);

      const data = await CrisisService.getCrises({
        type: null, // Todos los tipos
        limit: 10,
        forceRefresh: false
      });

      setCrises(data);
    } catch (error) {
      console.error('Error cargando crisis:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteCrisis(crisis) {
    await CrisisService.completeCrisis(
      crisis.id,
      'user-id-123',
      {
        success: true,
        population_affected: crisis.population_affected,
        duration: crisis.duration_minutes
      }
    );

    // Recargar lista
    loadCrises();
  }

  return (
    <View>
      {loading ? (
        <Text>Cargando crisis...</Text>
      ) : (
        <FlatList
          data={crises}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CrisisCard
              crisis={item}
              onComplete={() => handleCompleteCrisis(item)}
            />
          )}
        />
      )}
    </View>
  );
}
```

### Filtrado por tipo

```javascript
// Solo crisis ambientales
const environmentalCrises = await CrisisService.getCrises({
  type: 'environmental',
  limit: 5
});

// Solo crisis humanitarias urgentes
const allCrises = await CrisisService.getCrises({ limit: 50 });
const urgent = allCrises.filter(c =>
  c.type === 'humanitarian' && c.urgency >= 9
);
```

### Estadísticas

```javascript
const stats = await CrisisService.getCrisisStats('user-id-123');

console.log(`
  Crisis completadas: ${stats.total_completed}
  Tasa de éxito: ${stats.success_rate}%
  Personas ayudadas: ${stats.total_population_helped.toLocaleString()}

  Por tipo:
  - Ambientales: ${stats.by_type.environmental || 0}
  - Humanitarias: ${stats.by_type.humanitarian || 0}
  - Sociales: ${stats.by_type.social || 0}
`);
```

---

## APIs y Endpoints

### RSS Parser

**Base URL**: `/api/rss-parser.php`

#### GET `/api/rss-parser.php?action=get_news`

Obtener noticias parseadas y filtradas.

**Parámetros**:
- `limit` (int, opcional): Número de noticias (default: 20)
- `type` (string, opcional): Filtrar por tipo de crisis

**Respuesta**:

```json
{
  "status": "success",
  "data": {
    "news": [
      {
        "title": "Climate crisis threatens coastal cities",
        "description": "Rising sea levels pose immediate threat...",
        "url": "https://news.un.org/...",
        "pubDate": "2025-12-13T10:00:00Z",
        "imageUrl": "https://...",
        "source": "UN News",
        "reliability": 0.95,
        "language": "en",
        "detectedCategories": ["environmental", "humanitarian"],
        "primaryCategory": "environmental",
        "relevanceScore": 12
      }
    ],
    "count": 15,
    "cached": true,
    "timestamp": 1702468800
  }
}
```

#### GET `/api/rss-parser.php?action=health`

Health check del servicio.

**Respuesta**:

```json
{
  "status": "success",
  "service": "RSS Parser",
  "version": "1.0.0",
  "feeds_configured": 4,
  "cache_dir_writable": true,
  "timestamp": 1702468800
}
```

### AI Classifier

**Base URL**: `/api/ai-classifier.php`

#### POST `/api/ai-classifier.php?action=classify`

Clasificar una noticia en crisis jugable.

**Body** (JSON):

```json
{
  "title": "Wildfire threatens Amazon rainforest",
  "description": "Massive wildfire spreads across Amazon...",
  "url": "https://...",
  "source": "Reuters",
  "primaryCategory": "environmental"
}
```

**Respuesta**:

```json
{
  "status": "success",
  "data": {
    "type": "environmental",
    "title": "Incendio amenaza Amazonía",
    "description": "Fuego masivo devasta selva tropical",
    "location": {
      "country": "Brasil",
      "city": "Amazonas",
      "lat": -3.4653,
      "lon": -62.2159
    },
    "urgency": 9,
    "scale": "continental",
    "attributes": {
      "empathy": 75,
      "action": 90,
      "organization": 85,
      "technical": 70
    },
    "population_affected": 500000,
    "duration_minutes": 50,
    "id": "crisis_1702468800_xyz789",
    "createdAt": "2025-12-13T10:30:00.000Z",
    "expiresAt": "2025-12-15T10:30:00.000Z",
    "status": "active",
    "source": "news",
    "newsUrl": "https://...",
    "newsSource": "Reuters"
  },
  "timestamp": 1702468800
}
```

#### GET `/api/ai-classifier.php?action=health`

Health check del clasificador.

**Respuesta**:

```json
{
  "status": "success",
  "service": "AI Classifier",
  "version": "1.0.0",
  "ai_enabled": true,
  "current_provider": "openai",
  "enabled_providers": ["openai"],
  "fallback_crises_count": 20,
  "timestamp": 1702468800
}
```

---

## Ejemplos de Respuestas

### Crisis Ambiental

```json
{
  "id": "crisis_1702468800_env001",
  "type": "environmental",
  "title": "Deforestación amenaza Amazonía",
  "description": "Tala ilegal destruye 10,000 hectáreas de bosque tropical",
  "location": {
    "country": "Brasil",
    "city": "Manaus",
    "lat": -3.1190,
    "lon": -60.0217
  },
  "urgency": 8,
  "scale": "regional",
  "attributes": {
    "empathy": 70,
    "action": 85,
    "organization": 75,
    "technical": 65
  },
  "population_affected": 250000,
  "duration_minutes": 45,
  "createdAt": "2025-12-13T10:00:00.000Z",
  "expiresAt": "2025-12-15T22:00:00.000Z",
  "status": "active",
  "source": "news",
  "newsUrl": "https://news.un.org/en/story/2025/12/...",
  "newsSource": "UN News"
}
```

### Crisis Humanitaria

```json
{
  "id": "crisis_1702468900_hum001",
  "type": "humanitarian",
  "title": "Refugiados necesitan asistencia urgente",
  "description": "Miles de desplazados requieren alimentos y refugio",
  "location": {
    "country": "Líbano",
    "city": "Beirut",
    "lat": 33.8938,
    "lon": 35.5018
  },
  "urgency": 10,
  "scale": "national",
  "attributes": {
    "empathy": 95,
    "organization": 85,
    "action": 80,
    "resilience": 90
  },
  "population_affected": 150000,
  "duration_minutes": 60,
  "createdAt": "2025-12-13T11:00:00.000Z",
  "expiresAt": "2025-12-16T11:00:00.000Z",
  "status": "active",
  "source": "news",
  "newsUrl": "https://www.bbc.com/news/world-...",
  "newsSource": "BBC World"
}
```

---

## Modo Offline

El sistema funciona completamente **offline** sin necesidad de API keys ni conexión a internet.

### Generación Procedural

Cuando no hay conexión, el sistema genera crisis procedurales:

```javascript
const crises = CrisisService.generateProceduralCrises();
// Retorna 10 crisis variadas basadas en templates
```

**Templates procedurales**:
- 7 tipos de crisis
- Variación aleatoria de atributos (±10)
- Ubicaciones reales
- Urgencia y escala variables
- Duración 20-60 minutos

### Caché Inteligente

El caché persiste durante **6 horas**, permitiendo uso offline extendido:

```javascript
// Primera carga (online)
const crises = await CrisisService.getCrises();
// → Fetch desde red, guarda en caché

// Segunda carga (offline, dentro de 6h)
const crises = await CrisisService.getCrises();
// → Retorna desde caché, no requiere red

// Forzar refresh (requiere conexión)
const crises = await CrisisService.getCrises({ forceRefresh: true });
```

---

## Troubleshooting

### Problema: "No se cargan crisis"

**Diagnóstico**:

```javascript
// 1. Verificar conectividad
const isOnline = await CrisisService.checkConnection();
console.log('Online:', isOnline);

// 2. Verificar caché
const cached = await CrisisService.getFromCache();
console.log('Caché:', cached);

// 3. Forzar generación procedural
const crises = CrisisService.generateProceduralCrises();
console.log('Procedurales:', crises);
```

**Soluciones**:
- Limpiar caché: `await CrisisService.clearCache()`
- Verificar URL de API en `constants.js`
- Revisar permisos de AsyncStorage

### Problema: "AI Classifier retorna error 401"

**Causa**: API key inválida o no configurada.

**Solución**:

1. Verificar archivo `.env`:
```bash
cat api/.env
# Debe contener: OPENAI_API_KEY=sk-...
```

2. Verificar permisos:
```bash
chmod 644 api/.env
```

3. Reiniciar servidor PHP

4. Modo fallback (sin IA):
```bash
# Remover todas las API keys del .env
# El sistema usará clasificación predefinida
```

### Problema: "Rate limit exceeded"

**Causa**: Más de 10 clasificaciones por minuto.

**Solución**:

1. Esperar 1 minuto
2. Reducir frecuencia de llamadas
3. Aumentar `RATE_LIMIT` en `.env`:

```bash
RATE_LIMIT=20
```

4. Limpiar archivo de rate limit:
```bash
rm cache/ai/rate_limit.json
```

### Problema: "Cache dir not writable"

**Solución**:

```bash
# Crear directorios
mkdir -p cache/rss cache/ai

# Dar permisos
chmod 755 cache
chmod 755 cache/rss
chmod 755 cache/ai

# En producción (Apache/Nginx)
chown www-data:www-data cache -R
```

### Problema: "RSS feeds timeout"

**Causa**: Feeds externos lentos o bloqueados.

**Solución**:

1. Verificar conectividad a feeds:
```bash
curl -I https://news.un.org/feed/subscribe/en/news/all/rss.xml
```

2. Aumentar timeout en `rss-parser.php`:
```php
'timeout' => 20 // En lugar de 10
```

3. Usar solo caché:
```javascript
const crises = await CrisisService.getCrises({ forceRefresh: false });
```

---

## Roadmap

### Futuras mejoras

- [ ] Soporte para más feeds RSS (Al Jazeera, NYT, etc.)
- [ ] Base de datos persistente (Supabase)
- [ ] Webhook para actualizaciones en tiempo real
- [ ] Análisis de sentimiento en noticias
- [ ] Predicción de tendencias de crisis
- [ ] Mapas de calor de crisis globales
- [ ] Sistema de alertas push para crisis urgentes
- [ ] Modo colaborativo multiplayer
- [ ] Leaderboards globales de impacto

---

## Licencia

MIT License - Awakening Protocol Team

## Contacto

- Issues: GitHub Issues
- Email: contact@awakeningprotocol.org
- Discord: [Servidor comunitario](#)

---

**Versión**: 1.0.0
**Última actualización**: 2025-12-13
