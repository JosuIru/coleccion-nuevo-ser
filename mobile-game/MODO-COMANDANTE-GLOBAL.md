# Modo Comandante Global + Liga de Crisis

**Fecha de implementación:** 2025-12-17
**Versión:** 1.0.0

---

## Resumen

El **Modo Comandante Global** es un nuevo sistema de juego que permite a los usuarios jugar Awakening Protocol **sin necesidad de GPS ni salir de casa**. Basado en noticias reales del mundo, convierte crisis globales en misiones estratégicas jugables.

---

## Características Principales

### 1. Centro de Comando Global

**Ubicación:** Tab "Comando" en la navegación principal

**Funcionalidades:**
- Mapa mundial interactivo con crisis en tiempo real
- Crisis basadas en noticias de RSS (UN News, Reuters, BBC, Guardian)
- Vista de mapa y vista de lista
- Filtros por tipo de crisis
- Sistema de urgencia visual (colores por gravedad)

**Pantalla:** `src/screens/CommandCenterScreen.js`

### 2. Sistema de Noticias Reales

**Servicio:** `src/services/RealNewsCrisisService.js`

**Fuentes RSS:**
- Naciones Unidas
- Reuters
- BBC World
- The Guardian Environment
- Al Jazeera

**Clasificación automática:**
- 7 tipos de crisis: ambiental, social, económica, humanitaria, salud, educativa, infraestructura
- Extracción de ubicación por países/regiones
- Cálculo de urgencia por palabras clave
- Atributos requeridos según tipo

### 3. Liga de Crisis Semanal

**Servicio:** `src/services/LeagueService.js`
**Pantalla:** `src/screens/LeagueScreen.js`

**Sistema de divisiones:**
| División | Puntos Mínimos | Icono |
|----------|---------------|-------|
| Bronce | 0 | 🥉 |
| Plata | 1,000 | 🥈 |
| Oro | 3,000 | 🥇 |
| Platino | 7,000 | 💎 |
| Diamante | 15,000 | 💠 |
| Maestro | 30,000 | 👑 |
| Leyenda | 60,000 | 🌟 |

**Sistema de puntuación:**
- Crisis resuelta: 100 pts
- Crisis fallida: 30 pts
- Primera del día: +50 pts
- Racha 3 días: +100 pts
- Racha 7 días: +300 pts
- Racha 14 días: +1000 pts
- Crisis destacada: +200 pts

**Recompensas semanales:**
| Posición | XP | Consciencia |
|----------|-----|-------------|
| 1º | 1000 | 500 |
| 2º | 750 | 350 |
| 3º | 500 | 250 |
| Top 10 | 300 | 150 |
| Top 100 | 100 | 50 |

---

## Correcciones Implementadas

### Problema de Coordenadas

**Problema original:** Las crisis se generaban en 8 ciudades fijas (Madrid, CDMX, Buenos Aires, etc.) independientemente de la ubicación del usuario.

**Solución:** Se modificó `CrisisService.js` para:
1. Aceptar `userLocation` como parámetro
2. Generar crisis en radio cercano al usuario según escala:
   - Local: 5 km
   - Regional: 50 km
   - Nacional: 200 km
   - Continental: 1000 km

**Archivos modificados:**
- `src/services/CrisisService.js`:
  - `generateRandomLocation(userLocation, scale)`
  - `generateNearbyLocation(userLocation, scale)`
  - `generateProceduralCrises(userLocation)`
  - `getCrises(options)` ahora acepta `userLocation`

---

## Estructura de Archivos

```
mobile-game/mobile-app/src/
├── screens/
│   ├── CommandCenterScreen.js   # NUEVO - Centro de Comando
│   └── LeagueScreen.js          # NUEVO - Liga de Crisis
├── services/
│   ├── RealNewsCrisisService.js # NUEVO - Noticias reales
│   ├── LeagueService.js         # NUEVO - Sistema de liga
│   └── CrisisService.js         # MODIFICADO - Coordenadas
└── navigation/
    └── RootNavigator.js         # MODIFICADO - Nuevo tab
```

---

## Uso

### Acceder al Centro de Comando

1. Abrir la app
2. Tocar el tab "Comando" (icono de escudo con estrella)
3. Ver mapa mundial con crisis activas
4. Tocar una crisis para ver detalles
5. Seleccionar seres y desplegar

### Acceder a la Liga

1. Desde el Centro de Comando, tocar el icono de trofeo (🏆)
2. Ver ranking semanal
3. Ver división actual y progreso
4. Consultar crisis destacadas de la semana

### Jugar sin GPS

El modo Comandante Global no requiere geolocalización. Las crisis se muestran en un mapa mundial y puedes desplegar seres desde cualquier lugar.

---

## API del Servicio de Noticias

```javascript
import { realNewsCrisisService } from './services/RealNewsCrisisService';

// Obtener crisis
const crises = await realNewsCrisisService.getRealWorldCrises({
  limit: 20,
  types: ['environmental', 'social'],
  minUrgency: 5,
  maxUrgency: 10,
  forceRefresh: false
});

// Obtener estadísticas
const stats = await realNewsCrisisService.getCrisisStats();

// Obtener crisis para la liga
const leagueCrises = await realNewsCrisisService.getWeeklyLeagueCrises();
```

---

## API del Servicio de Liga

```javascript
import { leagueService } from './services/LeagueService';

// Inicializar jugador
await leagueService.initializePlayer(userId, username);

// Registrar crisis resuelta
const { points, bonuses } = await leagueService.recordCrisisResolved(crisis, success, isLeagueCrisis);

// Obtener leaderboard
const leaderboard = await leagueService.getWeeklyLeaderboard();

// Obtener posición del jugador
const playerRank = await leagueService.getCurrentPlayerRank();

// Obtener estadísticas
const stats = leagueService.getPlayerStats();
```

---

## Próximos Pasos

1. **Backend RSS Proxy**: Implementar `api/rss-proxy.php` para fetch de RSS sin problemas de CORS
2. **Sincronización con Supabase**: Persistir puntuaciones de liga en backend
3. **Notificaciones**: Alertas de nuevas crisis y fin de semana de liga
4. **Integración Frankenstein**: Importar seres creados en Frankenstein Lab

---

## Notas Técnicas

- El servicio de noticias usa caché de 2 horas
- Si no hay conexión, genera crisis procedurales
- Los puntos de liga se guardan en AsyncStorage
- El leaderboard incluye 20 bots simulados para demo
