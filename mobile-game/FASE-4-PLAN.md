# 🚀 FASE 4: PLAN DE IMPLEMENTACIÓN

**Fecha de planificación:** 2025-12-19
**Versión:** 1.0.0
**Estado:** Planificado (No implementado)

---

## 📋 RESUMEN EJECUTIVO

Fase 4 añade funcionalidades avanzadas que aumentan la retención a largo plazo y la conexión entre la webapp (Frankenstein Lab) y la mobile app (Awakening Protocol).

### Objetivos

1. **Sincronización bidireccional** entre Lab (web) y Mobile
2. **Eventos temporales** que añaden urgencia y variedad
3. **Sistema de logros** que reconoce progreso y motiva
4. **Clanes/Comunidades** para gameplay social

### Métricas Objetivo

| Métrica | Actual | Target Fase 4 | Mejora |
|---------|--------|---------------|--------|
| Retención D7 | 35-40% | 55-65% | +20 pts |
| Retención D30 | 15-20% | 35-45% | +20 pts |
| Sesiones/semana | 4-5 | 8-12 | +100% |
| Tiempo sesión | 45-60 min | 60-90 min | +30 min |
| Engagement social | 0% | 40-50% | N/A (nuevo) |

### Esfuerzo Estimado

- **Desarrollo:** 20-30 horas
- **Testing:** 5-8 horas
- **Total:** 25-38 horas

---

## 🔄 MEJORA 1: SINCRONIZACIÓN BIDIRECCIONAL LAB-MOBILE

### Problema

Actualmente existe un `WebBridgeService` que permite sincronización unidireccional (mobile → web), pero:
- No hay sincronización web → mobile en tiempo real
- Los seres creados en Frankenstein Lab (web) no aparecen automáticamente en mobile
- Los eventos de mobile no se reflejan inmediatamente en la webapp
- Inconsistencias en estado cuando el usuario alterna entre plataformas

### Solución

Implementar sincronización bidireccional usando **Supabase Realtime** y **optimistic updates**.

### Arquitectura

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   Mobile App        │◄───────►│  Supabase DB     │◄───────►│   Web App (Lab)     │
│  (React Native)     │  Sync   │  + Realtime      │  Sync   │   (React)           │
└─────────────────────┘         └──────────────────┘         └─────────────────────┘
         │                              │                              │
         │                              │                              │
         ▼                              ▼                              ▼
   Local State                    Central State              Local State
  (gameStore.js)                (user_progress)            (localStorage)
```

### Tablas de Supabase Requeridas

**1. `user_progress`** (ya existe, verificar schema)
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  energy INTEGER DEFAULT 100,
  max_energy INTEGER DEFAULT 100,
  consciousness_points INTEGER DEFAULT 200,
  max_beings INTEGER DEFAULT 5,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. `beings`** (sincronización de seres)
```sql
CREATE TABLE beings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  being_id TEXT NOT NULL,  -- ID local del ser
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available',  -- available, on_mission, resting
  current_mission UUID REFERENCES missions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  attributes JSONB NOT NULL,  -- Todos los atributos
  source TEXT DEFAULT 'mobile',  -- mobile, lab, shop
  UNIQUE(user_id, being_id)
);

CREATE INDEX idx_beings_user_id ON beings(user_id);
CREATE INDEX idx_beings_status ON beings(status);
```

**3. `active_missions`** (misiones en progreso)
```sql
CREATE TABLE active_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  mission_id TEXT NOT NULL,
  being_id UUID REFERENCES beings(id) NOT NULL,
  crisis_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'in_progress',  -- in_progress, completed, failed
  rewards JSONB,
  completed_at TIMESTAMP,
  UNIQUE(user_id, mission_id)
);

CREATE INDEX idx_active_missions_user_id ON active_missions(user_id);
CREATE INDEX idx_active_missions_ends_at ON active_missions(ends_at);
```

### Implementación: SyncService.js

**Archivo nuevo:** `src/services/SyncService.js` (~600 líneas)

```javascript
/**
 * SYNC SERVICE
 * Sincronización bidireccional entre Mobile y Web usando Supabase Realtime
 */

class SyncService {
  constructor() {
    this.supabase = null;
    this.subscriptions = [];
    this.syncQueue = [];
    this.isSyncing = false;
  }

  // Inicialización
  async initialize(supabaseClient) {
    this.supabase = supabaseClient;

    // Subscribe a cambios en tiempo real
    await this.subscribeToChanges();

    // Sync inicial
    await this.performFullSync();
  }

  // Suscribirse a cambios en tiempo real
  async subscribeToChanges() {
    const userId = useGameStore.getState().user.id;

    // Subscription 1: User progress
    const progressSubscription = this.supabase
      .channel('user_progress_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleProgressChange(payload);
      })
      .subscribe();

    // Subscription 2: Beings
    const beingsSubscription = this.supabase
      .channel('beings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'beings',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleBeingChange(payload);
      })
      .subscribe();

    // Subscription 3: Active missions
    const missionsSubscription = this.supabase
      .channel('missions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'active_missions',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleMissionChange(payload);
      })
      .subscribe();

    this.subscriptions.push(
      progressSubscription,
      beingsSubscription,
      missionsSubscription
    );
  }

  // Manejar cambios en user_progress
  handleProgressChange(payload) {
    const { new: newData } = payload;

    // Actualizar estado local con optimistic locking
    useGameStore.getState().updateUser({
      level: newData.level,
      xp: newData.xp,
      energy: newData.energy,
      maxEnergy: newData.max_energy,
      consciousnessPoints: newData.consciousness_points,
      maxBeings: newData.max_beings
    });

    console.log('[SyncService] User progress updated from remote');
  }

  // Manejar cambios en beings
  handleBeingChange(payload) {
    const { eventType, new: newData, old: oldData } = payload;

    if (eventType === 'INSERT') {
      // Nuevo ser creado (probablemente desde Lab)
      useGameStore.getState().addBeing(this.transformBeingFromDB(newData));
    } else if (eventType === 'UPDATE') {
      // Ser actualizado
      useGameStore.getState().updateBeing(newData.being_id, this.transformBeingFromDB(newData));
    } else if (eventType === 'DELETE') {
      // Ser eliminado
      useGameStore.getState().removeBeing(oldData.being_id);
    }

    console.log('[SyncService] Being updated from remote:', eventType);
  }

  // Transformar being de DB a formato local
  transformBeingFromDB(dbBeing) {
    return {
      id: dbBeing.being_id,
      name: dbBeing.name,
      avatar: dbBeing.avatar,
      level: dbBeing.level,
      experience: dbBeing.experience,
      status: dbBeing.status,
      currentMission: dbBeing.current_mission,
      attributes: dbBeing.attributes,
      createdAt: dbBeing.created_at,
      source: dbBeing.source
    };
  }

  // Sync completo (al iniciar app)
  async performFullSync() {
    try {
      const userId = useGameStore.getState().user.id;

      // 1. Sync user progress
      const { data: progress, error: progressError } = await this.supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (progress) {
        this.handleProgressChange({ new: progress });
      }

      // 2. Sync beings
      const { data: beings, error: beingsError } = await this.supabase
        .from('beings')
        .select('*')
        .eq('user_id', userId);

      if (beings) {
        const localBeings = beings.map(this.transformBeingFromDB);
        useGameStore.getState().setBeings(localBeings);
      }

      // 3. Sync active missions
      const { data: missions, error: missionsError } = await this.supabase
        .from('active_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'in_progress');

      if (missions) {
        useGameStore.getState().setActiveMissions(missions);
      }

      console.log('[SyncService] Full sync completed');
    } catch (error) {
      console.error('[SyncService] Full sync error:', error);
    }
  }

  // Push local changes to remote
  async pushLocalChanges(changeType, data) {
    const userId = useGameStore.getState().user.id;

    try {
      switch (changeType) {
        case 'user_progress':
          await this.supabase
            .from('user_progress')
            .upsert({
              user_id: userId,
              ...data,
              updated_at: new Date().toISOString()
            });
          break;

        case 'being_created':
          await this.supabase
            .from('beings')
            .insert({
              user_id: userId,
              being_id: data.id,
              name: data.name,
              avatar: data.avatar,
              level: data.level,
              experience: data.experience,
              status: data.status,
              attributes: data.attributes,
              source: 'mobile'
            });
          break;

        case 'being_updated':
          await this.supabase
            .from('beings')
            .update({
              ...data,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('being_id', data.id);
          break;

        case 'mission_started':
          await this.supabase
            .from('active_missions')
            .insert({
              user_id: userId,
              mission_id: data.missionId,
              being_id: data.beingId,
              crisis_id: data.crisisId,
              ends_at: data.endsAt,
              status: 'in_progress'
            });
          break;

        case 'mission_completed':
          await this.supabase
            .from('active_missions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              rewards: data.rewards
            })
            .eq('user_id', userId)
            .eq('mission_id', data.missionId);
          break;
      }

      console.log('[SyncService] Pushed change:', changeType);
    } catch (error) {
      console.error('[SyncService] Push error:', error);
      // Agregar a cola de retry
      this.syncQueue.push({ changeType, data, retries: 0 });
    }
  }

  // Cleanup
  cleanup() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}

export default new SyncService();
```

### Integración en gameStore

Agregar hooks en gameStore para llamar a SyncService cuando hay cambios:

```javascript
// En gameStore.js

createBeing: (beingData) => {
  set((state) => ({
    beings: [...state.beings, beingData]
  }));

  // Sync to remote
  syncService.pushLocalChanges('being_created', beingData);
},

updateUser: (updates) => {
  set((state) => ({
    user: { ...state.user, ...updates }
  }));

  // Sync to remote (debounced)
  debouncedSyncUserProgress(updates);
},
```

### Testing

1. Crear ser en Lab → verificar aparece en mobile en <2s
2. Iniciar misión en mobile → verificar aparece en Lab
3. Completar misión → verificar recompensas sincronizadas
4. Probar offline → verificar cola de sync al reconectar

---

## 🎪 MEJORA 2: SISTEMA DE EVENTOS TEMPORALES

### Problema

El juego actual es estático:
- Siempre las mismas crisis disponibles
- No hay urgencia o exclusividad
- Falta variedad y sorpresa
- Baja motivación para volver diariamente

### Solución

Sistema de eventos temporales que rotan semanalmente con recompensas exclusivas.

### Tipos de Eventos

**1. Crisis Globales (Weekend Events)**
- Duración: 48-72 horas (viernes-domingo)
- Crisis de alto impacto con multiplicadores de recompensa x2-x3
- Requiere coordinación de múltiples seres
- Ejemplos:
  - "Crisis Climática Global" (requiere 5+ seres, recompensa: ser legendario)
  - "Revolución Tecnológica" (requiere atributos técnicos altos)

**2. Desafíos Semanales**
- Renovación: Cada lunes
- 3-5 desafíos con objetivos específicos
- Ejemplos:
  - "Completa 10 crisis de tipo social"
  - "Crea 2 seres con creatividad > 70"
  - "Alcanza nivel 5 antes del domingo"

**3. Eventos Estacionales**
- Duración: 2-4 semanas
- Temática especial (ej: "Mes de la Sostenibilidad")
- Seres exclusivos temporales
- Avatares y recompensas únicas

**4. Flash Events**
- Duración: 6-12 horas
- Aparición aleatoria
- Recompensas instantáneas (energía, consciencia, fragmentos)
- Notificación push

### Implementación: EventsService.js

**Archivo nuevo:** `src/services/EventsService.js` (~450 líneas)

```javascript
/**
 * EVENTS SERVICE
 * Sistema de eventos temporales y desafíos rotativos
 */

class EventsService {
  constructor() {
    this.activeEvents = [];
    this.checkInterval = null;
  }

  // Inicializar y cargar eventos activos
  async initialize() {
    await this.loadActiveEvents();

    // Check cada 15 minutos
    this.checkInterval = setInterval(() => {
      this.checkForNewEvents();
    }, 15 * 60 * 1000);
  }

  // Cargar eventos activos desde Supabase
  async loadActiveEvents() {
    try {
      const { data, error } = await supabase
        .from('active_events')
        .select('*')
        .gte('ends_at', new Date().toISOString())
        .order('priority', { ascending: false });

      if (data) {
        this.activeEvents = data;
        useGameStore.getState().setActiveEvents(data);
      }
    } catch (error) {
      console.error('[EventsService] Load error:', error);
    }
  }

  // Verificar nuevos eventos
  async checkForNewEvents() {
    const currentEvents = this.activeEvents.map(e => e.id);
    await this.loadActiveEvents();

    // Detectar nuevos eventos
    const newEvents = this.activeEvents.filter(e => !currentEvents.includes(e.id));

    if (newEvents.length > 0) {
      // Mostrar notificación
      this.notifyNewEvents(newEvents);
    }
  }

  // Verificar progreso en eventos
  async updateEventProgress(eventId, progress) {
    const userId = useGameStore.getState().user.id;

    try {
      await supabase
        .from('user_event_progress')
        .upsert({
          user_id: userId,
          event_id: eventId,
          progress: progress,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[EventsService] Progress update error:', error);
    }
  }

  // Reclamar recompensas de evento
  async claimEventRewards(eventId) {
    const userId = useGameStore.getState().user.id;

    try {
      // Verificar que cumple requisitos
      const { data: progress } = await supabase
        .from('user_event_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      const event = this.activeEvents.find(e => e.id === eventId);

      if (progress.progress >= event.required_progress) {
        // Otorgar recompensas
        useGameStore.getState().addConsciousness(event.rewards.consciousness);
        useGameStore.getState().addEnergy(event.rewards.energy);

        if (event.rewards.being) {
          useGameStore.getState().addBeing(event.rewards.being);
        }

        // Marcar como reclamado
        await supabase
          .from('user_event_progress')
          .update({ claimed: true })
          .eq('user_id', userId)
          .eq('event_id', eventId);

        return { success: true, rewards: event.rewards };
      }

      return { success: false, reason: 'requirements_not_met' };
    } catch (error) {
      console.error('[EventsService] Claim error:', error);
      return { success: false, reason: 'error' };
    }
  }
}

export default new EventsService();
```

### Tabla de Supabase: active_events

```sql
CREATE TABLE active_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,  -- weekend, weekly, seasonal, flash
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  priority INTEGER DEFAULT 1,
  required_progress INTEGER DEFAULT 100,
  rewards JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_event_progress (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_id UUID REFERENCES active_events(id) NOT NULL,
  progress INTEGER DEFAULT 0,
  claimed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX idx_active_events_ends_at ON active_events(ends_at);
CREATE INDEX idx_user_event_progress_user_id ON user_event_progress(user_id);
```

### UI: EventsModal Component

**Archivo nuevo:** `src/components/EventsModal.js` (~400 líneas)

- Lista de eventos activos con countdown
- Barra de progreso por evento
- Botón "Reclamar Recompensas"
- Badges de "Nuevo" y "Finaliza Pronto"

---

## 🏆 MEJORA 3: SISTEMA DE LOGROS Y ACHIEVEMENTS

### Problema

- No hay reconocimiento del progreso
- Falta motivación para explorar todas las mecánicas
- Jugadores no saben qué hacer después de tutorial

### Solución

Sistema de logros escalonados con recompensas y badges.

### Categorías de Logros

**1. Progresión General**
- "Primer Paso" - Completa el tutorial
- "Despertar" - Alcanza nivel 5
- "Iluminación" - Alcanza nivel 10
- "Maestro" - Alcanza nivel 25
- "Leyenda" - Alcanza nivel 50

**2. Misiones y Crisis**
- "Voluntario" - Completa 1 misión
- "Héroe Local" - Completa 10 misiones
- "Salvador Global" - Completa 50 misiones
- "Crisis Manager" - Completa 5 crisis simultáneamente
- "Perfeccionista" - Completa 20 misiones con 100% éxito

**3. Frankenstein Lab**
- "Creador" - Crea tu primer ser personalizado
- "Arquitecto" - Crea 5 seres personalizados
- "Dios" - Crea 20 seres personalizados
- "Genetista" - Crea un ser con todos los atributos > 70
- "Coleccionista" - Posee todos los avatares

**4. Exploración**
- "Curioso" - Lee 1 libro completo
- "Erudito" - Lee 5 libros
- "Sabio" - Lee todos los libros disponibles
- "Viajero" - Visita 10 locaciones diferentes

**5. Social (Fase 4.4 - Clanes)**
- "Sociable" - Únete a un clan
- "Líder" - Crea un clan
- "Campeón" - Tu clan gana la liga semanal

**6. Eventos**
- "Participante" - Completa 1 evento
- "Competidor" - Completa 5 eventos
- "Campeón de Eventos" - Completa 20 eventos

### Implementación: AchievementsService.js

**Archivo nuevo:** `src/services/AchievementsService.js` (~500 líneas)

```javascript
/**
 * ACHIEVEMENTS SERVICE
 * Sistema de logros con tracking automático
 */

// Definición de todos los logros
const ACHIEVEMENTS = {
  // Progresión
  FIRST_STEP: {
    id: 'first_step',
    category: 'progression',
    title: 'Primer Paso',
    description: 'Completa el tutorial',
    icon: '🎓',
    requirement: { type: 'tutorial_completed', value: 1 },
    rewards: { consciousness: 50, xp: 100 }
  },

  AWAKENING: {
    id: 'awakening',
    category: 'progression',
    title: 'Despertar',
    description: 'Alcanza nivel 5',
    icon: '⭐',
    requirement: { type: 'level', value: 5 },
    rewards: { consciousness: 100, xp: 200, energy: 50 }
  },

  // Misiones
  VOLUNTEER: {
    id: 'volunteer',
    category: 'missions',
    title: 'Voluntario',
    description: 'Completa tu primera misión',
    icon: '🤝',
    requirement: { type: 'missions_completed', value: 1 },
    rewards: { consciousness: 30, xp: 50 }
  },

  // ... (más logros)
};

class AchievementsService {
  constructor() {
    this.unlockedAchievements = [];
  }

  // Inicializar
  async initialize() {
    await this.loadUnlockedAchievements();

    // Escuchar cambios en el gameStore
    useGameStore.subscribe(
      (state) => this.checkAchievements(state)
    );
  }

  // Cargar logros desbloqueados
  async loadUnlockedAchievements() {
    const userId = useGameStore.getState().user.id;

    const { data } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);

    this.unlockedAchievements = data || [];
  }

  // Verificar logros automáticamente
  checkAchievements(state) {
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (this.isUnlocked(achievement.id)) return;

      if (this.meetsRequirement(achievement.requirement, state)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  // Verificar si cumple requisito
  meetsRequirement(requirement, state) {
    switch (requirement.type) {
      case 'level':
        return state.user.level >= requirement.value;

      case 'missions_completed':
        return state.user.missionsCompleted >= requirement.value;

      case 'beings_created':
        return state.beings.filter(b => b.source === 'lab').length >= requirement.value;

      // ... más tipos

      default:
        return false;
    }
  }

  // Desbloquear logro
  async unlockAchievement(achievement) {
    const userId = useGameStore.getState().user.id;

    try {
      // Guardar en DB
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        });

      // Actualizar local
      this.unlockedAchievements.push({
        achievement_id: achievement.id,
        unlocked_at: new Date().toISOString()
      });

      // Otorgar recompensas
      if (achievement.rewards.consciousness) {
        useGameStore.getState().addConsciousness(achievement.rewards.consciousness);
      }
      if (achievement.rewards.xp) {
        useGameStore.getState().addXP(achievement.rewards.xp);
      }
      if (achievement.rewards.energy) {
        useGameStore.getState().addEnergy(achievement.rewards.energy);
      }

      // Mostrar notificación
      this.showAchievementUnlocked(achievement);

      // Track analytics
      analyticsService.trackEvent('achievement_unlocked', {
        achievement_id: achievement.id,
        category: achievement.category
      });

      console.log('[AchievementsService] Unlocked:', achievement.title);
    } catch (error) {
      console.error('[AchievementsService] Unlock error:', error);
    }
  }

  // Verificar si está desbloqueado
  isUnlocked(achievementId) {
    return this.unlockedAchievements.some(a => a.achievement_id === achievementId);
  }

  // Obtener progreso de logro
  getProgress(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    const state = useGameStore.getState();

    // Calcular progreso actual vs requerido
    const current = this.getCurrentValue(achievement.requirement, state);
    const required = achievement.requirement.value;

    return {
      current,
      required,
      percentage: Math.min(100, (current / required) * 100)
    };
  }
}

export default new AchievementsService();
```

### Tabla de Supabase: user_achievements

```sql
CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
```

### UI: AchievementsModal Component

**Archivo nuevo:** `src/components/AchievementsModal.js` (~450 líneas)

- Grid de logros por categoría
- Indicador de progreso para cada logro
- Animación de desbloqueo
- Filtro por categoría y estado (bloqueado/desbloqueado)

---

## 👥 MEJORA 4: SISTEMA DE CLANES Y COMUNIDADES

### Problema

- Gameplay completamente individual
- No hay motivación social
- Falta sentido de comunidad
- Baja retención a largo plazo sin aspecto social

### Solución

Sistema de clanes con rankings, chat y eventos cooperativos.

### Funcionalidades

**1. Creación y Gestión de Clanes**
- Crear clan (costo: 500 consciencia)
- Nombre, descripción, avatar
- Roles: Líder, Co-Líder, Miembro
- Máximo 50 miembros por clan
- Sistema de invitaciones

**2. Liga de Clanes**
- Ranking semanal por puntos acumulados
- Puntos por:
  - Misiones completadas (1 pt)
  - Crisis globales (5 pts)
  - Eventos completados (3 pts)
- Recompensas semanales para top 10:
  - 1º: 1000 consciencia + ser legendario
  - 2º-3º: 500 consciencia + ser especializado
  - 4º-10º: 200 consciencia

**3. Eventos de Clan**
- Crisis cooperativas que requieren múltiples miembros
- "Raid Bosses" - crisis masivas que duran 48h
- Recompensas compartidas para todos los participantes

**4. Chat de Clan**
- Chat en tiempo real (Supabase Realtime)
- Compartir logros
- Coordinar estrategias

**5. Tienda de Clan**
- Items exclusivos comprables con puntos de clan
- Avatares especiales
- Boosts de equipo

### Implementación: ClansService.js

**Archivo nuevo:** `src/services/ClansService.js` (~700 líneas)

```javascript
/**
 * CLANS SERVICE
 * Sistema de clanes con rankings y eventos cooperativos
 */

class ClansService {
  constructor() {
    this.currentClan = null;
    this.clanMembers = [];
    this.chatSubscription = null;
  }

  // Crear clan
  async createClan(clanData) {
    const userId = useGameStore.getState().user.id;

    // Verificar consciencia suficiente
    if (useGameStore.getState().user.consciousnessPoints < 500) {
      return { success: false, reason: 'insufficient_consciousness' };
    }

    try {
      const { data, error } = await supabase
        .from('clans')
        .insert({
          name: clanData.name,
          description: clanData.description,
          avatar: clanData.avatar,
          leader_id: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Unirse automáticamente como líder
      await this.joinClan(data.id);

      // Descontar consciencia
      useGameStore.getState().spendConsciousness(500);

      return { success: true, clan: data };
    } catch (error) {
      console.error('[ClansService] Create error:', error);
      return { success: false, reason: 'error' };
    }
  }

  // Unirse a clan
  async joinClan(clanId) {
    const userId = useGameStore.getState().user.id;

    try {
      await supabase
        .from('clan_members')
        .insert({
          clan_id: clanId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        });

      await this.loadClanData(clanId);
      return { success: true };
    } catch (error) {
      console.error('[ClansService] Join error:', error);
      return { success: false };
    }
  }

  // Cargar datos del clan
  async loadClanData(clanId) {
    try {
      // Cargar clan
      const { data: clan } = await supabase
        .from('clans')
        .select('*')
        .eq('id', clanId)
        .single();

      this.currentClan = clan;

      // Cargar miembros
      const { data: members } = await supabase
        .from('clan_members')
        .select('*, users(username, level)')
        .eq('clan_id', clanId);

      this.clanMembers = members;

      // Suscribirse al chat
      this.subscribeToClanChat(clanId);
    } catch (error) {
      console.error('[ClansService] Load error:', error);
    }
  }

  // Chat en tiempo real
  subscribeToClanChat(clanId) {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }

    this.chatSubscription = supabase
      .channel(`clan_chat_${clanId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'clan_chat',
        filter: `clan_id=eq.${clanId}`
      }, (payload) => {
        this.handleNewMessage(payload.new);
      })
      .subscribe();
  }

  // Enviar mensaje
  async sendMessage(message) {
    const userId = useGameStore.getState().user.id;

    try {
      await supabase
        .from('clan_chat')
        .insert({
          clan_id: this.currentClan.id,
          user_id: userId,
          message: message,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[ClansService] Send message error:', error);
    }
  }

  // Obtener ranking de clanes
  async getClanRankings() {
    try {
      const { data } = await supabase
        .from('clan_rankings')
        .select('*, clans(name, avatar)')
        .order('points', { ascending: false })
        .limit(100);

      return data || [];
    } catch (error) {
      console.error('[ClansService] Rankings error:', error);
      return [];
    }
  }

  // Contribuir puntos al clan
  async contributionPoints(points, activity) {
    const userId = useGameStore.getState().user.id;

    try {
      // Actualizar puntos del clan
      await supabase.rpc('increment_clan_points', {
        clan_id: this.currentClan.id,
        points_to_add: points
      });

      // Registrar contribución
      await supabase
        .from('clan_contributions')
        .insert({
          clan_id: this.currentClan.id,
          user_id: userId,
          points: points,
          activity: activity,
          created_at: new Date().toISOString()
        });

      console.log('[ClansService] Contributed:', points, 'points');
    } catch (error) {
      console.error('[ClansService] Contribution error:', error);
    }
  }
}

export default new ClansService();
```

### Tablas de Supabase: Clans

```sql
-- Clanes
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar TEXT NOT NULL,
  leader_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  member_count INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0
);

-- Miembros de clan
CREATE TABLE clan_members (
  clan_id UUID REFERENCES clans(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT DEFAULT 'member',  -- leader, co_leader, member
  joined_at TIMESTAMP DEFAULT NOW(),
  contribution_points INTEGER DEFAULT 0,
  PRIMARY KEY (clan_id, user_id)
);

-- Chat de clan
CREATE TABLE clan_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id UUID REFERENCES clans(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rankings de clanes
CREATE TABLE clan_rankings (
  clan_id UUID REFERENCES clans(id) PRIMARY KEY,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contribuciones
CREATE TABLE clan_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id UUID REFERENCES clans(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  points INTEGER NOT NULL,
  activity TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clan_members_clan_id ON clan_members(clan_id);
CREATE INDEX idx_clan_chat_clan_id ON clan_chat(clan_id);
CREATE INDEX idx_clan_rankings_points ON clan_rankings(points DESC);

-- Función para incrementar puntos
CREATE OR REPLACE FUNCTION increment_clan_points(
  clan_id UUID,
  points_to_add INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE clans
  SET total_points = total_points + points_to_add
  WHERE id = clan_id;

  UPDATE clan_rankings
  SET points = points + points_to_add,
      updated_at = NOW()
  WHERE clan_id = clan_id
    AND week_number = EXTRACT(WEEK FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
END;
$$ LANGUAGE plpgsql;
```

### UI: Clans Screens

**Archivos nuevos:**

1. **ClansListScreen.js** (~300 líneas)
   - Lista de clanes disponibles
   - Búsqueda y filtros
   - Botón "Crear Clan"
   - Opción de unirse

2. **ClanDetailScreen.js** (~500 líneas)
   - Información del clan
   - Lista de miembros con contribuciones
   - Chat en tiempo real
   - Eventos de clan activos
   - Botón "Salir del Clan"

3. **ClanRankingsScreen.js** (~250 líneas)
   - Top 100 clanes
   - Puntos y ranking
   - Botón para ver detalle

---

## 📅 CRONOGRAMA DE IMPLEMENTACIÓN

### Semana 1 (10-12 horas)
- **Día 1-2:** Sincronización bidireccional (SyncService)
- **Día 3:** Testing de sync Lab-Mobile
- **Día 4:** Eventos temporales (EventsService + UI)

### Semana 2 (8-10 horas)
- **Día 1-2:** Sistema de logros (AchievementsService + UI)
- **Día 3:** Testing de logros
- **Día 4:** Inicio de Clanes (database schema + ClansService)

### Semana 3 (7-8 horas)
- **Día 1-2:** UI de Clanes (screens + chat)
- **Día 3:** Rankings y eventos de clan
- **Día 4:** Testing completo Fase 4

### Semana 4 (5 horas)
- **Día 1-2:** Testing de integración
- **Día 3:** Ajustes y pulido
- **Día 4:** Documentación

---

## 🎯 CRITERIOS DE ÉXITO

### Métricas a Medir

**Sincronización:**
- [ ] Latencia < 2 segundos
- [ ] 99% sincronización exitosa
- [ ] 0 pérdidas de datos

**Eventos:**
- [ ] 60%+ participación en eventos
- [ ] +30% tiempo de sesión durante eventos
- [ ] +15% retención D7

**Logros:**
- [ ] 80%+ jugadores desbloquean 1er logro
- [ ] Promedio 5+ logros por jugador en primera semana
- [ ] +20% engagement

**Clanes:**
- [ ] 40%+ jugadores se unen a clan
- [ ] 70%+ clanes tienen >5 miembros
- [ ] +25% retención D30

---

## 🚨 RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Complejidad de sync en tiempo real | Media | Alto | Usar Supabase Realtime (probado), fallback a polling |
| Sobrecarga de notificaciones | Alta | Medio | Limitar a 3 notificaciones/día, permitir configurar |
| Clanes abandonados | Media | Medio | Auto-disolución tras 30 días inactivos |
| Spam en chat | Media | Alto | Rate limiting, moderación automática |
| Carga en DB por eventos | Media | Medio | Índices optimizados, caché en Redis |

---

## 🔄 MANTENIMIENTO POST-LANZAMIENTO

### Tareas Semanales
- Crear nuevos eventos (2-3 por semana)
- Revisar rankings de clanes
- Moderar chats reportados

### Tareas Mensuales
- Analizar métricas de participación
- Ajustar balanceo de recompensas
- Añadir nuevos logros (2-3 por mes)

### Tareas Trimestrales
- Eventos estacionales grandes
- Nuevas features de clanes
- Refinar algoritmo de rankings

---

## 📚 REFERENCIAS Y RECURSOS

### Documentación Técnica
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [React Native Push Notifications](https://reactnative.dev/docs/pushnotificationios)
- [Zustand Best Practices](https://github.com/pmndrs/zustand)

### Inspiración de Juegos
- **Clash of Clans:** Sistema de clanes
- **Hearthstone:** Eventos rotativos
- **Steam:** Sistema de logros
- **Destiny 2:** Eventos semanales

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Sincronización
- [ ] Crear tablas en Supabase
- [ ] Implementar SyncService.js
- [ ] Integrar en gameStore
- [ ] Testing Lab → Mobile
- [ ] Testing Mobile → Lab
- [ ] Testing offline mode

### Eventos
- [ ] Crear tabla active_events
- [ ] Implementar EventsService.js
- [ ] Crear EventsModal.js
- [ ] Diseñar 5 eventos iniciales
- [ ] Sistema de notificaciones
- [ ] Testing ciclo completo

### Logros
- [ ] Definir todos los logros (30+)
- [ ] Implementar AchievementsService.js
- [ ] Crear AchievementsModal.js
- [ ] Animación de desbloqueo
- [ ] Testing tracking automático
- [ ] Testing recompensas

### Clanes
- [ ] Crear todas las tablas
- [ ] Implementar ClansService.js
- [ ] ClansListScreen.js
- [ ] ClanDetailScreen.js
- [ ] ClanRankingsScreen.js
- [ ] Chat en tiempo real
- [ ] Sistema de invitaciones
- [ ] Testing rankings
- [ ] Testing eventos cooperativos

---

**Fin del Plan de Fase 4**
