# Arquitectura del Sistema de Misiones

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                      MISSION SERVICE FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. INICIALIZACIÓN (App Start)
   ┌──────────────────┐
   │  App.js          │
   │  useEffect       │
   └────────┬─────────┘
            │
            v
   ┌──────────────────────────────────┐
   │ MissionService.initialize()      │
   │ - Recuperar misiones activas     │
   │ - Restaurar timers               │
   │ - Iniciar recuperación energía   │
   └────────┬─────────────────────────┘
            │
            v
   ┌──────────────────────────────────┐
   │ AsyncStorage                     │
   │ active_missions_{userId}         │
   └──────────────────────────────────┘


2. DESPLIEGUE DE SERES
   ┌──────────────────┐
   │ User selecciona  │
   │ crisis + seres   │
   └────────┬─────────┘
            │
            v
   ┌──────────────────────────────────┐
   │ MissionService.desplegarSeres()  │
   │                                  │
   │ 1. Validar:                      │
   │    - Energía suficiente          │
   │    - Seres disponibles           │
   │    - Energía seres > 30%         │
   │                                  │
   │ 2. Calcular probabilidad:        │
   │    - Ratio atributos             │
   │    - Detectar sinergias          │
   │    - Aplicar bonuses             │
   │                                  │
   │ 3. Crear misión:                 │
   │    - Generar ID único            │
   │    - Calcular tiempo fin         │
   │    - Guardar datos completos     │
   │                                  │
   │ 4. Iniciar timer                 │
   │ 5. Actualizar store              │
   │ 6. Persistir AsyncStorage        │
   └────────┬─────────────────────────┘
            │
            v
   ┌──────────────────────────────────┐
   │ BackgroundTimer.setTimeout()     │
   │ (continúa aunque app esté cerrada)│
   └──────────────────────────────────┘


3. CÁLCULO DE PROBABILIDAD
   ┌──────────────────────────────────┐
   │ calcularProbabilidadExito()      │
   └────────┬─────────────────────────┘
            │
            ├─> Ratio Base (25%-85%)
            │   atributos_equipo / atributos_requeridos
            │
            ├─> Sinergias (+0%-25%)
            │   ┌─────────────────────────────┐
            │   │ empathy + communication     │
            │   │ leadership + strategy       │
            │   │ creativity + technical      │
            │   │ wisdom + consciousness      │
            │   │ action + resilience         │
            │   │ analysis + organization     │
            │   │ collaboration + connection  │
            │   └─────────────────────────────┘
            │
            ├─> Bonus Equipo (+0%-5%)
            │   1 ser: 0%, 2 seres: 2%, 3+: 5%
            │
            ├─> Penalizaciones (-0%-45%)
            │   -15% por cada atributo crítico faltante
            │
            └─> Límites finales
                min: 5%, max: 95%


4. RESOLUCIÓN DE MISIÓN (Timer expira)
   ┌──────────────────────────────────┐
   │ BackgroundTimer callback         │
   └────────┬─────────────────────────┘
            │
            v
   ┌──────────────────────────────────────┐
   │ MissionService.resolverMision()      │
   │                                      │
   │ 1. Roll aleatorio                    │
   │    random(0-1) vs probabilidad       │
   │                                      │
   │ 2. Calcular recompensas:             │
   │    ┌────────────────────────────┐   │
   │    │ Base rewards               │   │
   │    │ * Multiplicador éxito/fallo│   │
   │    │ * Bonus cooperativa (+50%) │   │
   │    │ * Bonus local (x3)         │   │
   │    │ * Bonus racha (+10% c/u)   │   │
   │    │ * Bonus primera vez (+100) │   │
   │    └────────────────────────────┘   │
   │                                      │
   │ 3. Aplicar recompensas               │
   │    gameStore.addXP()                 │
   │    gameStore.addConsciousness()      │
   │    gameStore.addEnergy()             │
   │                                      │
   │ 4. Devolver seres                    │
   │    - Reducir energía (-20%)          │
   │    - Status: 'available' o 'resting' │
   │                                      │
   │ 5. Guardar historial                 │
   │ 6. Actualizar racha                  │
   │ 7. Notificar usuario                 │
   └────────┬─────────────────────────────┘
            │
            v
   ┌──────────────────────────────────┐
   │ PushNotification.localNotification│
   │ "✅ ¡Misión Exitosa! +150 XP"    │
   └──────────────────────────────────┘


5. RECUPERACIÓN DE ENERGÍA (Background)
   ┌──────────────────────────────────┐
   │ BackgroundTimer (cada 5 min)     │
   └────────┬─────────────────────────┘
            │
            v
   ┌──────────────────────────────────────┐
   │ recuperarEnergiaSeres()              │
   │                                      │
   │ Para cada ser en 'resting':          │
   │   energía += 1                       │
   │   if energía >= 100:                 │
   │     status = 'available'             │
   │     notificar usuario                │
   └──────────────────────────────────────┘
```

## Persistencia en AsyncStorage

```
┌─────────────────────────────────────────┐
│          STORAGE KEYS                    │
├─────────────────────────────────────────┤
│                                         │
│  active_missions_{userId}               │
│  ├─ Array de misiones activas          │
│  └─ Se restauran al abrir app          │
│                                         │
│  mission_history_{userId}               │
│  ├─ Array de últimas 100 misiones      │
│  └─ Ordenadas por fecha (desc)         │
│                                         │
│  mission_streak_{userId}                │
│  ├─ Número entero                       │
│  └─ Racha de misiones exitosas         │
│                                         │
└─────────────────────────────────────────┘
```

## Estados de los Seres

```
┌──────────────────────────────────────────┐
│         BEING STATUS FLOW                 │
└──────────────────────────────────────────┘

    available
       │
       │ (deploy)
       v
    deployed ──────┐
       │           │
       │ (mission) │ (recall early)
       │  completes│
       v           v
   [energy check]
       │
       ├─> energy >= 30% ──> available
       │
       └─> energy < 30%  ──> resting
                                │
                                │ (auto recovery)
                                │ +1 energy / 5min
                                │
                                └──> available (at 100%)
```

## Integración con GameStore (Zustand)

```
┌────────────────────────────────────────────┐
│         GAMESTORE INTEGRATION               │
└────────────────────────────────────────────┘

MissionService ←──────────→ gameStore
     │                           │
     │  consumeEnergy(amount)    │
     ├──────────────────────────>│
     │                           │
     │  updateBeing(id, updates) │
     ├──────────────────────────>│
     │                           │
     │  addXP(amount)            │
     ├──────────────────────────>│
     │                           │
     │  addConsciousness(amount) │
     ├──────────────────────────>│
     │                           │
     │  addEnergy(amount)        │
     ├──────────────────────────>│
     │                           │
     │  getState()               │
     │<──────────────────────────┤
     │  { user, beings, ... }    │
     │                           │
```

## Dependencias Externas

```
┌────────────────────────────────────────────┐
│         EXTERNAL DEPENDENCIES               │
└────────────────────────────────────────────┘

MissionService
    │
    ├─> @react-native-async-storage/async-storage
    │   └─ Persistencia de datos
    │
    ├─> react-native-background-timer
    │   ├─ Timers en background
    │   ├─ setTimeout / setInterval
    │   └─ Continúa aunque app cerrada
    │
    ├─> react-native-push-notification
    │   ├─ Notificaciones locales
    │   └─ Alertas de misiones completas
    │
    └─> Zustand (gameStore)
        └─ Estado global del juego
```

## Ciclo de Vida Completo

```
┌─────────────────────────────────────────────────────┐
│              MISSION LIFECYCLE                       │
└─────────────────────────────────────────────────────┘

1. CREATION
   User selects crisis + beings
        ↓
   Validation checks
        ↓
   Probability calculation
        ↓
   Mission object created
        ↓
   Saved to AsyncStorage

2. ACTIVE
   Timer running in background
        ↓
   Energy recovering (other beings)
        ↓
   User can view progress
        ↓
   [Time passes...]

3. COMPLETION
   Timer expires
        ↓
   Roll vs probability
        ↓
   Calculate rewards
        ↓
   Apply to gameStore
        ↓
   Update being states
        ↓
   Save to history
        ↓
   Send notification
        ↓
   Remove from active

4. POST-MISSION
   Beings recover energy
        ↓
   Update statistics
        ↓
   Update streak
        ↓
   [Ready for next mission]
```

## Bonificaciones Visualizadas

```
┌─────────────────────────────────────────────────────┐
│           BONUS MULTIPLIERS FLOW                     │
└─────────────────────────────────────────────────────┘

Base Rewards: 100 XP, 30 Consciousness, 10 Energy
     │
     ├─> Success? ──> YES ──> x 1.0
     │            └─> NO  ──> x 0.3
     │
     ├─> Cooperative? ──> YES ──> x 1.5
     │                └─> NO  ──> x 1.0
     │
     ├─> Local Crisis? ──> YES ──> x 3.0
     │                 └─> NO  ──> x 1.0
     │
     ├─> Streak? ──> 0 ──> x 1.0
     │           ├─> 1 ──> x 1.1
     │           ├─> 2 ──> x 1.2
     │           ├─> 3 ──> x 1.3
     │           └─> 10+ ──> x 2.0 (max)
     │
     └─> First Time? ──> YES ──> +100 XP bonus
                     └─> NO  ──> +0

EXAMPLE:
  Local crisis, 3-mission streak, success, first time
  100 XP * 1.0 * 3.0 * 1.3 + 100 = 490 XP!
```

## Testing Flow

```
┌─────────────────────────────────────────────────────┐
│              TESTING HELPERS                         │
└─────────────────────────────────────────────────────┘

testingHelpers.testCalculoProbabilidad()
  ├─> Creates mock crisis
  ├─> Creates mock beings
  ├─> Calculates probability
  └─> Logs detailed breakdown

testingHelpers.crearMisionPrueba(userId)
  ├─> Creates test mission
  ├─> Adds to AsyncStorage
  └─> Returns mission object

testingHelpers.resolverMisionInmediata(missionId)
  ├─> Skips timer
  ├─> Immediately resolves
  └─> Applies rewards

testingHelpers.resetearDatosMisiones(userId)
  ├─> Clears active missions
  ├─> Clears history
  ├─> Clears streak
  └─> Fresh start for testing
```

---

**Notas de Arquitectura:**

1. **Singleton Pattern:** MissionService se exporta como instancia única
2. **Background Resilience:** Timers continúan aunque app se cierre
3. **State Recovery:** Al abrir app, se recuperan misiones activas y se reinician timers
4. **Separation of Concerns:** Service maneja lógica, gameStore maneja estado
5. **Immutability:** Todas las operaciones crean nuevos objetos
6. **Error Handling:** Try/catch en todas las operaciones async
7. **Logging:** Logs extensivos para debugging
8. **Testability:** Helpers incluidos para testing
