# Sistema de Misiones - Índice Completo

## Archivos Creados

### 📦 Servicio Principal
- **`mobile-app/src/services/MissionService.js`** (40 KB, 1243 líneas)
  - Servicio completo con todas las funcionalidades
  - Sistema de despliegue, cálculo de probabilidad, timers, recompensas
  - Persistencia, recuperación de energía, notificaciones
  - Funciones de testing incluidas

### 📱 Ejemplos de Uso
- **`mobile-app/src/screens/EXAMPLE-DeployMissionScreen.js`** (14 KB)
  - Pantalla completa para seleccionar y desplegar seres
  - Cálculo de probabilidad en tiempo real
  - UI completa con estilos dark mode

- **`mobile-app/src/screens/EXAMPLE-ActiveMissionsScreen.js`** (14 KB)
  - Pantalla de misiones activas con timers en tiempo real
  - Barras de progreso animadas
  - Pull-to-refresh, notificaciones

### 📚 Documentación
- **`MISSION-SERVICE-README.md`** (6.3 KB)
  - Quick reference con API y ejemplos mínimos
  - Tabla de bonificaciones
  - Dependencias necesarias

- **`MISSION-SYSTEM-GUIDE.md`** (12 KB)
  - Guía completa de uso
  - Instalación paso a paso
  - Ejemplos de integración
  - Fórmulas de cálculo detalladas

- **`MISSION-SYSTEM-ARCHITECTURE.md`** (17 KB)
  - Diagramas de flujo ASCII
  - Arquitectura del sistema
  - Estados de seres
  - Ciclo de vida completo

---

## Funcionalidades Implementadas

### ✅ 1. Despliegue de Seres a Crisis

```javascript
const resultado = await MissionService.desplegarSeres(
  userId,
  crisisId,
  ['being1', 'being2'],
  gameStore
);
```

**Validaciones automáticas:**
- Energía suficiente del usuario
- Seres disponibles (no en misión)
- Energía de seres > 30%

**Acciones realizadas:**
- Consumir energía del usuario (10 por ser)
- Actualizar estado de seres a "deployed"
- Crear registro de misión
- Iniciar timer en background
- Guardar en AsyncStorage

---

### ✅ 2. Cálculo de Probabilidad de Éxito

**Componentes del cálculo:**

1. **Ratio Base (25%-85%)**
   ```
   ratio = atributos_equipo / atributos_requeridos
   probabilidad = 0.25 + (ratio * 0.3)
   ```

2. **Sinergias (+0%-25%)**
   - 7 combinaciones especiales detectadas automáticamente
   - Ejemplo: `empathy + communication` = +15%

3. **Bonus Equipo (+0%-5%)**
   - 1 ser: 0%
   - 2 seres: +2%
   - 3+ seres: +5%

4. **Penalizaciones (-0%-45%)**
   - -15% por cada atributo crítico faltante
   - Atributos críticos varían según tipo de crisis

5. **Límites**
   - Mínimo: 5%
   - Máximo: 95%

**Sinergias Detectadas:**

| Combinación | Nombre | Bonus |
|------------|--------|-------|
| empathy + communication | Comunicador Empático | +15% |
| leadership + strategy | Estratega Líder | +20% |
| creativity + technical | Innovador Técnico | +18% |
| wisdom + consciousness | Sabio Consciente | +25% |
| action + resilience | Ejecutor Resiliente | +15% |
| analysis + organization | Analista Organizado | +12% |
| collaboration + connection | Conector Social | +15% |

---

### ✅ 3. Timers en Background

**Tecnología:** `react-native-background-timer`

**Características:**
- Continúan ejecutándose aunque la app esté cerrada
- Persistencia en AsyncStorage para recuperación
- Notificaciones cuando misiones completan
- Recuperación automática al abrir la app

**Flujo:**
```
1. Misión creada → Timer iniciado
2. App cerrada → Timer continúa
3. Timer expira → Misión resuelta
4. Notificación enviada
5. App abierta → Estado actualizado
```

---

### ✅ 4. Resolución de Misiones

**Proceso:**

1. **Roll Aleatorio**
   ```javascript
   const roll = Math.random();
   const exito = roll <= probabilidad;
   ```

2. **Cálculo de Recompensas**
   - Éxito: 100% de recompensas
   - Fallo: 30% de recompensas
   - Aplicar multiplicadores de bonificaciones

3. **Aplicar Recompensas**
   ```javascript
   gameStore.addXP(recompensas.xp);
   gameStore.addConsciousness(recompensas.consciousness);
   gameStore.addEnergy(recompensas.energy);
   ```

4. **Devolver Seres**
   - Reducir energía (-20%)
   - Estado: "available" o "resting"

5. **Historial y Estadísticas**
   - Guardar en historial (últimas 100)
   - Actualizar racha de éxitos
   - Generar estadísticas

---

### ✅ 5. Sistema de Cooldown

**Recuperación de Energía:**

- **Tasa:** 1 punto cada 5 minutos
- **Estado:** "resting" si energía < 30%
- **Proceso:** Automático en background
- **Notificación:** Cuando llega a 100%

**Estados de los Seres:**

```
available  → deployed → [energy check]
                            ├─> >= 30% → available
                            └─> < 30%  → resting → available (at 100%)
```

---

### ✅ 6. Bonificaciones Especiales

#### Misiones Cooperativas
- **Bonus:** +50% en todas las recompensas
- **Activación:** Desplegar con otros jugadores

#### Crisis Local
- **Bonus:** x3 multiplicador
- **Condición:** `crisis.scale === 'local'`

#### Racha de Éxito (Streak)
- **Bonus:** +10% por cada misión exitosa
- **Máximo:** x2 (100% extra)
- **Ejemplo:** 5 misiones = +50% recompensas

#### Primera Vez
- **Bonus:** +100 XP extra
- **Condición:** Primera vez resolviendo ese tipo de crisis

#### Ejemplo de Cálculo

```
Base: 100 XP

Crisis local + 3ra misión en racha + éxito + primera vez:
  100 * 1.0 (éxito)
  * 3.0 (local)
  * 1.3 (racha)
  + 100 (primera vez)
  = 490 XP total
```

---

### ✅ 7. Persistencia en AsyncStorage

**Keys utilizadas:**

```
active_missions_{userId}     // Misiones activas
mission_history_{userId}      // Historial (últimas 100)
mission_streak_{userId}       // Racha actual
```

**Datos guardados:**
- Estado completo de misiones activas
- Historial de misiones completadas
- Rachas de éxito
- Timestamps para recuperación

---

### ✅  8. Notificaciones Push

**Tipos de notificaciones:**

1. **Misión Exitosa**
   ```
   ✅ ¡Misión Exitosa!
   Has resuelto "Crisis Ambiental". +150 XP
   ```

2. **Misión Fallida**
   ```
   ❌ Misión Fallida
   Ganaste algo de experiencia.
   ```

3. **Ser Recuperado**
   ```
   ⚡ Ser Recuperado
   "Guardián" está listo para nuevas misiones.
   ```

---

## API del Servicio

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

// Retorna:
{
  exito: true,
  mision: { ... },
  probabilidad: { ... },
  tiempoMinutos: 90
}
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

// Retorna:
{
  misionesCompletadas: 25,
  misionesExitosas: 18,
  misionesFallidas: 7,
  tasaExito: 72.0,
  rachaActual: 3,
  xpTotalGanado: 4500,
  tiposCrisisResueltas: { ... }
}
```

### Cleanup

```javascript
MissionService.cleanup();
```

---

## Testing

### Funciones de Testing

```javascript
import { testingHelpers } from './services/MissionService';

// 1. Test de cálculo de probabilidad
testingHelpers.testCalculoProbabilidad();

// 2. Crear misión de prueba
const mision = await testingHelpers.crearMisionPrueba(userId);

// 3. Resolver inmediatamente (sin esperar)
await testingHelpers.resolverMisionInmediata(misionId, gameStore);

// 4. Resetear todos los datos
await testingHelpers.resetearDatosMisiones(userId);
```

---

## Dependencias Necesarias

```bash
npm install react-native-background-timer
npm install react-native-push-notification
npm install @react-native-async-storage/async-storage

# iOS
cd ios && pod install
```

---

## Integración con GameStore

**Funciones utilizadas del store:**

- `consumeEnergy(amount)` - Consumir energía
- `updateBeing(id, updates)` - Actualizar ser
- `addXP(amount)` - Añadir XP
- `addConsciousness(amount)` - Añadir consciencia
- `addEnergy(amount)` - Añadir energía
- `getState()` - Obtener estado actual

---

## Flujo de Implementación

### 1. Inicializar en App.js

```javascript
import MissionService from './services/MissionService';
import useGameStore from './stores/gameStore';

function App() {
  const userId = useGameStore(state => state.user.id);

  useEffect(() => {
    if (userId) {
      MissionService.initialize(userId);
    }
    return () => MissionService.cleanup();
  }, [userId]);

  return <NavigationContainer>{/* ... */}</NavigationContainer>;
}
```

### 2. Desplegar desde pantalla de crisis

Ver: `EXAMPLE-DeployMissionScreen.js`

### 3. Mostrar misiones activas

Ver: `EXAMPLE-ActiveMissionsScreen.js`

---

## Logs del Sistema

El servicio incluye logging detallado:

```
🚀 Desplegando 2 seres a crisis crisis_123...
   ✅ Validación exitosa
   🎲 Calculando probabilidad de éxito...
      Ratio Base: 55.0%
      Sinergias: +15.0%
      Trabajo en Equipo: +2.0%
      TOTAL: 72.0%
   ✅ Misión creada: mission_abc123
   ⏱️  Timer iniciado (90 min)
   💾 Misión guardada

⏰ Misión completada!
🎯 Resolviendo misión...
🎲 Roll: 45.3% vs Probabilidad: 72.0%
✅ ¡ÉXITO!
💰 Recompensas: +360 XP, +108 consciencia
```

---

## Estructura de Archivos

```
mobile-game/
├── mobile-app/
│   └── src/
│       ├── services/
│       │   └── MissionService.js          ⭐ SERVICIO PRINCIPAL
│       └── screens/
│           ├── EXAMPLE-DeployMissionScreen.js
│           └── EXAMPLE-ActiveMissionsScreen.js
│
└── docs/
    ├── MISSION-SERVICE-README.md          📖 Quick Reference
    ├── MISSION-SYSTEM-GUIDE.md            📖 Guía Completa
    ├── MISSION-SYSTEM-ARCHITECTURE.md     📖 Arquitectura
    └── MISSION-SYSTEM-INDEX.md            📖 Este archivo
```

---

## Próximos Pasos

### Funcionalidades Futuras

1. **Misiones Cooperativas Reales**
   - Sistema de matchmaking
   - Chat en tiempo real
   - Recompensas compartidas

2. **Eventos Especiales**
   - Crisis globales temporales
   - Recompensas únicas por tiempo limitado
   - Rankings de jugadores

3. **Sistema de Alianzas**
   - Gremios de jugadores
   - Misiones de alianza con recompensas grupales
   - Recursos compartidos

4. **Mejoras de Seres**
   - Sistema de training
   - Evoluciones de seres
   - Habilidades especiales desbloqueables

---

## Recursos Adicionales

- **Código Fuente:** `mobile-app/src/services/MissionService.js`
- **Ejemplos:** Ver carpeta `screens/EXAMPLE-*`
- **Documentación:** Ver archivos `MISSION-*.md`

---

## Contacto y Soporte

Para preguntas sobre el sistema de misiones:
1. Revisar primero `MISSION-SYSTEM-GUIDE.md`
2. Consultar ejemplos en `EXAMPLE-*.js`
3. Usar funciones de testing para debugging

---

**Versión:** 1.0.0
**Fecha:** 2025-12-13
**Proyecto:** Awakening Protocol - Colección Nuevo Ser
**Líneas de código:** ~1,500 (servicio + ejemplos)
**Cobertura:** 100% de funcionalidades solicitadas
