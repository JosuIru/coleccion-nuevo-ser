# Sistema de Misiones - Awakening Protocol

## Descripción General

El `MissionService.js` implementa un sistema completo de misiones para el juego móvil, incluyendo:

- ✅ Despliegue de seres a crisis
- ✅ Cálculo inteligente de probabilidad de éxito
- ✅ Timers en background que continúan aunque la app esté cerrada
- ✅ Sistema de cooldown y recuperación automática de energía
- ✅ Bonificaciones especiales (cooperativas, locales, rachas, primera vez)
- ✅ Persistencia completa en AsyncStorage
- ✅ Notificaciones push cuando las misiones completan
- ✅ Historial y estadísticas detalladas

---

## Instalación de Dependencias

Antes de usar el servicio, instala las siguientes dependencias:

```bash
npm install react-native-background-timer
npm install react-native-push-notification
npm install @react-native-async-storage/async-storage

# Para iOS
cd ios && pod install
```

---

## Inicialización

### 1. En el componente principal de la app

```javascript
import MissionService from './services/MissionService';
import useGameStore from './stores/gameStore';

function App() {
  const userId = useGameStore(state => state.user.id);

  useEffect(() => {
    if (userId) {
      // Inicializar servicio cuando el usuario esté autenticado
      MissionService.initialize(userId);
    }

    // Cleanup al desmontar
    return () => {
      MissionService.cleanup();
    };
  }, [userId]);

  return (
    // ... tu app
  );
}
```

---

## Uso Básico

### 1. Desplegar Seres a una Crisis

```javascript
import MissionService from '../services/MissionService';
import useGameStore from '../stores/gameStore';

function CrisisDetailScreen({ crisis }) {
  const gameStore = useGameStore();
  const userId = gameStore.user.id;

  const handleDeployBeings = async (selectedBeingIds) => {
    const resultado = await MissionService.desplegarSeres(
      userId,
      crisis.id,
      selectedBeingIds,
      gameStore
    );

    if (resultado.exito) {
      console.log('✅ Misión iniciada!');
      console.log('Probabilidad de éxito:', resultado.probabilidad);
      console.log('Tiempo estimado:', resultado.tiempoMinutos, 'minutos');

      // Navegar a pantalla de misiones activas
      navigation.navigate('ActiveMissions');
    } else {
      // Mostrar error
      Alert.alert('Error', resultado.error);
    }
  };

  return (
    <View>
      <BeingSelector onConfirm={handleDeployBeings} />
    </View>
  );
}
```

### 2. Ver Misiones Activas

```javascript
function ActiveMissionsScreen() {
  const [misiones, setMisiones] = useState([]);
  const userId = useGameStore(state => state.user.id);

  useEffect(() => {
    cargarMisiones();
  }, []);

  const cargarMisiones = async () => {
    const misionesActivas = await MissionService.obtenerMisionesActivas(userId);
    setMisiones(misionesActivas);
  };

  return (
    <ScrollView>
      {misiones.map(mision => (
        <MissionCard
          key={mision.id}
          mision={mision}
          tiempoRestante={calcularTiempoRestante(mision.endsAt)}
        />
      ))}
    </ScrollView>
  );
}
```

### 3. Ver Historial de Misiones

```javascript
function MissionHistoryScreen() {
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const userId = useGameStore(state => state.user.id);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const hist = await MissionService.obtenerHistorial(userId, 50);
    const stats = await MissionService.obtenerEstadisticas(userId);

    setHistorial(hist);
    setEstadisticas(stats);
  };

  return (
    <View>
      {/* Estadísticas */}
      <StatsCard>
        <Text>Misiones Completadas: {estadisticas?.misionesCompletadas}</Text>
        <Text>Tasa de Éxito: {estadisticas?.tasaExito}%</Text>
        <Text>Racha Actual: {estadisticas?.rachaActual} 🔥</Text>
      </StatsCard>

      {/* Lista de historial */}
      <FlatList
        data={historial}
        renderItem={({ item }) => <MissionHistoryItem mision={item} />}
      />
    </View>
  );
}
```

---

## Cálculo de Probabilidad

El sistema calcula la probabilidad de éxito basándose en:

### 1. Ratio Base
Compara los atributos del equipo vs los requeridos por la crisis.

```
ratio = atributos_equipo / atributos_requeridos
probabilidad_base = 0.25 + (ratio * 0.3)
```

### 2. Sinergias
Detecta combinaciones especiales de atributos:

| Combinación | Nombre | Bonus |
|------------|--------|-------|
| empathy + communication | Comunicador Empático | +15% |
| leadership + strategy | Estratega Líder | +20% |
| creativity + technical | Innovador Técnico | +18% |
| wisdom + consciousness | Sabio Consciente | +25% |
| action + resilience | Ejecutor Resiliente | +15% |
| analysis + organization | Analista Organizado | +12% |
| collaboration + connection | Conector Social | +15% |

### 3. Trabajo en Equipo
- 1 ser: 0%
- 2 seres: +2%
- 3 seres: +4%
- 4+ seres: +5%

### 4. Penalizaciones
- Falta de atributo crítico: -15% por cada uno
- Los atributos críticos dependen del tipo de crisis

### 5. Límites
- Mínimo: 5%
- Máximo: 95%

---

## Sistema de Bonificaciones

### 1. Misiones Cooperativas
- **Bonus:** +50% en todas las recompensas
- **Cómo activar:** Desplegar seres junto a otros jugadores

### 2. Crisis Local
- **Bonus:** x3 multiplicador en todas las recompensas
- **Condición:** La crisis debe tener `scale: 'local'`

### 3. Racha de Éxito
- **Bonus:** +10% por cada misión exitosa consecutiva
- **Máximo:** x2 (100% extra)
- **Ejemplo:** 5 misiones exitosas = +50% recompensas

### 4. Primera Vez
- **Bonus:** +100 XP extra
- **Condición:** Primera vez resolviendo ese tipo de crisis

### 5. Ejemplo de Cálculo

```
Crisis local + 3ra misión en racha + éxito:
Base: 100 XP
Local: 100 * 3 = 300 XP
Racha: 300 * 1.3 = 390 XP
Total: 390 XP
```

---

## Sistema de Cooldown

### Recuperación de Energía

- Cada ser pierde **20% de energía** al completar una misión
- Si energía < 30%, el ser entra en estado **"resting"**
- Recuperación: **1 punto cada 5 minutos** (automático en background)
- Al llegar a 100%, el ser vuelve a **"available"**

### Estados de los Seres

```javascript
// Estados posibles
'available'  // Listo para misiones
'deployed'   // En misión activa
'resting'    // Recuperando energía
'training'   // En entrenamiento (futuro)
```

---

## Timers en Background

El servicio usa `react-native-background-timer` para:

1. **Misiones Activas:** Timer individual por cada misión
2. **Recuperación de Energía:** Timer global cada 5 minutos
3. **Persistencia:** Todo se guarda en AsyncStorage para sobrevivir cierre de app

### Recuperación al Abrir la App

```javascript
// El servicio automáticamente:
// 1. Carga misiones activas desde AsyncStorage
// 2. Verifica si alguna ya expiró
// 3. Resuelve las expiradas inmediatamente
// 4. Reinicia timers para las activas
// 5. Continúa recuperación de energía
```

---

## Notificaciones Push

### Tipos de Notificaciones

1. **Misión Completada (Éxito)**
   ```
   ✅ ¡Misión Exitosa!
   Has resuelto "Crisis Ambiental Local". +150 XP
   ```

2. **Misión Completada (Fallo)**
   ```
   ❌ Misión Fallida
   La misión no tuvo éxito, pero ganaste algo de experiencia.
   ```

3. **Ser Recuperado**
   ```
   ⚡ Ser Recuperado
   "Guardián del Bosque" ha recuperado toda su energía.
   ```

---

## Estructura de Datos

### Objeto de Misión

```javascript
{
  id: "mission_1234567890_abc123",
  userId: "user_uuid",
  crisisId: "crisis_uuid",
  beingIds: ["being1_uuid", "being2_uuid"],

  // Información de la crisis
  crisisData: {
    title: "Crisis Ambiental Local",
    type: "environmental",
    scale: "local",
    urgency: 7
  },

  // Equipo desplegado
  teamData: {
    beingNames: ["Ser A", "Ser B"],
    teamAttributes: {
      empathy: 80,
      action: 90,
      organization: 70
    },
    teamSize: 2
  },

  // Cálculos
  successProbability: 0.72,
  probabilityDetails: {
    probabilidad: 0.72,
    ratioBase: 0.55,
    bonusSinergia: 0.15,
    bonusEquipo: 0.02,
    penalizacionCriticos: 0,
    sinergias: [
      {
        name: "Comunicador Empático",
        bonus: 0.15,
        attributes: ["empathy", "communication"]
      }
    ]
  },

  // Timing
  startedAt: "2025-12-13T10:00:00.000Z",
  endsAt: "2025-12-13T11:30:00.000Z",
  durationMinutes: 90,

  // Estado
  completed: false,
  success: null,

  // Recompensas
  baseRewards: {
    xp: 100,
    consciousness: 30,
    energy: 10
  },
  earnedRewards: null, // Se llena al completar

  // Metadata
  isCooperative: false,
  isLocal: true
}
```

---

## Testing

### Funciones de Testing Incluidas

```javascript
import { testingHelpers } from './services/MissionService';

// 1. Probar cálculo de probabilidad
testingHelpers.testCalculoProbabilidad();

// 2. Crear misión de prueba
const misionPrueba = await testingHelpers.crearMisionPrueba(
  userId,
  ['being1', 'being2']
);

// 3. Resolver misión inmediatamente (sin esperar timer)
await testingHelpers.resolverMisionInmediata(misionId, gameStore);

// 4. Resetear todos los datos (útil para desarrollo)
await testingHelpers.resetearDatosMisiones(userId);
```

### Logs Detallados

El servicio incluye logs extensivos para debugging:

```
🚀 Desplegando 2 seres a crisis crisis_123...
   ✅ Validación exitosa
   🎲 Calculando probabilidad de éxito...
      Ratio Base: 55.0%
      Sinergias: +15.0%
      Trabajo en Equipo: +2.0%
      Penalizaciones: Ninguna
      TOTAL: 72.0%
   ✅ Misión creada: mission_1234567890_abc123
      Probabilidad: 72.0%
      Duración: 90 minutos
   ⏱️  Timer iniciado para misión (90 min)
   💾 Misión guardada

... (después de 90 minutos) ...

   ⏰ Misión mission_1234567890_abc123 completada!
   🎯 Resolviendo misión...
   🎲 Roll: 45.3% vs Probabilidad: 72.0%
   ✅ ¡ÉXITO!
   💰 Recompensas calculadas:
      📍 Bonus local: x3
      🔥 Racha de 2 misiones: +20%
      XP: 360
      Consciencia: 108
      Energía: 36
   ✅ Recompensas aplicadas: +360 XP, +108 consciencia, +36 energía
   🔙 Ser A devuelto (available, 80% energía)
   🔙 Ser B devuelto (available, 80% energía)
   📚 Misión guardada en historial
   🔥 Racha: 3 misiones exitosas
```

---

## Integración con gameStore

El servicio actualiza automáticamente el store de Zustand:

```javascript
// Consumir energía
gameStore.consumeEnergy(energiaCosto);

// Actualizar seres
gameStore.updateBeing(beingId, {
  status: 'deployed',
  currentMission: crisisId,
  energy: 80
});

// Aplicar recompensas
gameStore.addXP(recompensas.xp);
gameStore.addConsciousness(recompensas.consciousness);
gameStore.addEnergy(recompensas.energy);
```

---

## Persistencia en AsyncStorage

### Keys Utilizadas

```
active_missions_{userId}      // Misiones activas
mission_history_{userId}       // Historial (últimas 100)
mission_streak_{userId}        // Racha actual
```

### Datos Guardados

Toda la información se persiste automáticamente:
- Estado de misiones activas
- Historial completo
- Rachas de éxito
- Energía de seres

---

## Próximos Pasos

### Funcionalidades Futuras

1. **Misiones Cooperativas Reales**
   - Sistema de matchmaking
   - Chat en tiempo real
   - Bonificaciones por sinergia de equipos

2. **Eventos Especiales**
   - Crisis globales temporales
   - Recompensas únicas
   - Rankings de jugadores

3. **Sistema de Alianzas**
   - Gremios de jugadores
   - Misiones de alianza
   - Recursos compartidos

4. **Mejoras de Seres**
   - Sistema de training
   - Evoluciones
   - Habilidades especiales

---

## Licencia

Parte del proyecto **Awakening Protocol** - Colección Nuevo Ser

