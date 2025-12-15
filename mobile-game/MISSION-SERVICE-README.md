# MissionService - Quick Reference

## Archivos Creados

```
mobile-app/src/services/MissionService.js           (40 KB, 1243 líneas)
mobile-app/src/screens/EXAMPLE-DeployMissionScreen.js    (14 KB)
mobile-app/src/screens/EXAMPLE-ActiveMissionsScreen.js   (14 KB)
MISSION-SYSTEM-GUIDE.md                             (12 KB)
```

## Características Implementadas

### ✅ 1. Despliegue de Seres
- Validación completa (energía, disponibilidad, atributos)
- Cálculo de tiempo según distancia
- Actualización automática del estado de seres
- Consumo de energía del usuario

### ✅ 2. Cálculo de Probabilidad
- **Ratio base:** Comparación atributos equipo vs requeridos
- **Sinergias:** 7 combinaciones especiales detectadas automáticamente
- **Bonus trabajo en equipo:** Hasta +5% por equipos grandes
- **Penalizaciones:** -15% por cada atributo crítico faltante
- **Límites:** 5% mínimo, 95% máximo

### ✅ 3. Timers en Background
- `react-native-background-timer` para continuidad
- Persistencia en AsyncStorage
- Recuperación automática al abrir app
- Notificaciones cuando misiones completan

### ✅ 4. Resolución de Misiones
- Roll aleatorio vs probabilidad
- Recompensas completas (100%) o reducidas (30%)
- Actualización automática de XP, consciencia, energía
- Guardado en historial

### ✅ 5. Sistema de Cooldown
- Seres pierden 20% energía por misión
- Estado "resting" si energía < 30%
- Recuperación automática: 1 punto cada 5 minutos
- Vuelta a "available" al llegar a 100%

### ✅ 6. Bonificaciones Especiales

| Bonus | Multiplicador | Condición |
|-------|---------------|-----------|
| Cooperativa | +50% | Misión con otros jugadores |
| Local | x3 | Crisis con scale='local' |
| Racha | +10% por misión | Misiones exitosas consecutivas (max x2) |
| Primera vez | +100 XP | Primera crisis de ese tipo |

### ✅ 7. Persistencia
- AsyncStorage para todas las misiones
- Historial de últimas 100 misiones
- Estadísticas completas
- Recuperación de estado tras cierre de app

### ✅ 8. Notificaciones
- Misión completada (éxito/fallo)
- Ser recuperado (energía 100%)
- Configurables y silenciables

## API Principal

### Inicialización
```javascript
await MissionService.initialize(userId);
```

### Desplegar Seres
```javascript
const resultado = await MissionService.desplegarSeres(
  userId,
  crisisId,
  beingIds,
  gameStore
);
```

### Obtener Misiones Activas
```javascript
const misiones = await MissionService.obtenerMisionesActivas(userId);
```

### Obtener Historial
```javascript
const historial = await MissionService.obtenerHistorial(userId, limite);
```

### Obtener Estadísticas
```javascript
const stats = await MissionService.obtenerEstadisticas(userId);
```

## Dependencias Requeridas

```bash
npm install react-native-background-timer
npm install react-native-push-notification
npm install @react-native-async-storage/async-storage
```

## Integración con gameStore

El servicio usa las siguientes funciones del store:

- `consumeEnergy(amount)` - Consumir energía del usuario
- `updateBeing(id, updates)` - Actualizar estado de un ser
- `addXP(amount)` - Añadir experiencia
- `addConsciousness(amount)` - Añadir puntos de consciencia
- `addEnergy(amount)` - Añadir energía

## Testing

### Funciones de Testing Incluidas

```javascript
import { testingHelpers } from './services/MissionService';

// Probar cálculo de probabilidad
testingHelpers.testCalculoProbabilidad();

// Crear misión de prueba
const mision = await testingHelpers.crearMisionPrueba(userId);

// Resolver inmediatamente
await testingHelpers.resolverMisionInmediata(misionId, gameStore);

// Resetear datos
await testingHelpers.resetearDatosMisiones(userId);
```

## Logs Detallados

El servicio incluye logging extensivo para debugging:

```
🚀 Desplegando 2 seres a crisis...
🎲 Calculando probabilidad de éxito...
✅ Misión creada: mission_abc123
⏱️ Timer iniciado (90 min)
💾 Misión guardada
⏰ Misión completada!
🎯 Resolviendo misión...
✅ ¡ÉXITO!
💰 Recompensas: +360 XP, +108 consciencia
```

## Ejemplo de Uso Mínimo

```javascript
// 1. Inicializar (en App.js)
useEffect(() => {
  MissionService.initialize(userId);
  return () => MissionService.cleanup();
}, [userId]);

// 2. Desplegar seres (en CrisisScreen)
const resultado = await MissionService.desplegarSeres(
  userId,
  crisis.id,
  ['being1', 'being2'],
  gameStore
);

// 3. Ver misiones activas (en MissionsScreen)
const misiones = await MissionService.obtenerMisionesActivas(userId);

// 4. El servicio resuelve automáticamente cuando el timer expira
// No necesitas hacer nada más!
```

## Estructura de Datos

### Objeto Misión
```javascript
{
  id: "mission_123",
  userId: "user_uuid",
  crisisId: "crisis_uuid",
  beingIds: ["being1", "being2"],

  successProbability: 0.72,

  startedAt: "2025-12-13T10:00:00Z",
  endsAt: "2025-12-13T11:30:00Z",
  durationMinutes: 90,

  completed: false,
  success: null,

  baseRewards: { xp: 100, consciousness: 30, energy: 10 },
  earnedRewards: null
}
```

### Objeto Estadísticas
```javascript
{
  misionesCompletadas: 25,
  misionesExitosas: 18,
  misionesFallidas: 7,
  tasaExito: 72.0,
  rachaActual: 3,
  xpTotalGanado: 4500,
  tiposCrisisResueltas: {
    environmental: 8,
    social: 6,
    economic: 4
  }
}
```

## Fórmulas de Cálculo

### Probabilidad de Éxito
```
ratio = atributos_equipo / atributos_requeridos
prob_base = 0.25 + (ratio * 0.3)
prob_final = prob_base + sinergias + bonus_equipo - penalizaciones
prob_final = min(0.95, max(0.05, prob_final))
```

### Recompensas
```
mult = 1.0 (éxito) o 0.3 (fallo)
mult *= 1.5 (cooperativa)
mult *= 3.0 (local)
mult *= (1 + racha * 0.1) max 2.0

recompensa_final = base * mult + bonus_primera_vez
```

## Próximos Pasos

1. **Misiones cooperativas reales** - Sistema de matchmaking
2. **Eventos especiales** - Crisis temporales con recompensas únicas
3. **Sistema de alianzas** - Gremios y recursos compartidos
4. **Mejoras de seres** - Training y evoluciones

## Soporte

Para más detalles, consulta:
- **MISSION-SYSTEM-GUIDE.md** - Guía completa
- **EXAMPLE-DeployMissionScreen.js** - Ejemplo de despliegue
- **EXAMPLE-ActiveMissionsScreen.js** - Ejemplo de misiones activas
- **MissionService.js** - Código fuente completo con comentarios

---

**Versión:** 1.0.0
**Fecha:** 2025-12-13
**Proyecto:** Awakening Protocol - Colección Nuevo Ser
