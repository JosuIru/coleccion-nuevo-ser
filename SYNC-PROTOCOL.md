# Protocolo de Sincronización Web ↔ Mobile

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Componentes](#componentes)
4. [Flujo de Sincronización](#flujo-de-sincronización)
5. [Resolución de Conflictos](#resolución-de-conflictos)
6. [Tablas de Base de Datos](#tablas-de-base-de-datos)
7. [API de Servicios](#api-de-servicios)
8. [Eventos](#eventos)
9. [Configuración](#configuración)
10. [Ejemplos de Uso](#ejemplos-de-uso)
11. [Troubleshooting](#troubleshooting)

---

## Descripción General

Sistema de sincronización bidireccional entre:
- **Webapp** (Colección Nuevo Ser): Aplicación web para lectura de libros
- **Mobile Game** (Awakening Protocol): Juego móvil React Native

### Objetivos

- ✅ Sincronizar progreso de lectura entre plataformas
- ✅ Sincronizar logros/achievements obtenidos
- ✅ Sincronizar "seres" creados en el mobile game
- ✅ Resolución automática de conflictos (timestamp-based)
- ✅ Soporte offline-first con cola de sincronización
- ✅ Eventos en tiempo real para actualizaciones de UI

---

## Arquitectura

```
┌─────────────────┐                  ┌─────────────────┐
│   WEBAPP        │                  │  MOBILE GAME    │
│                 │                  │                 │
│  SyncBridge     │◄────────────────►│  WebBridge      │
│  Service        │                  │  Service        │
│                 │                  │                 │
│  eventBus       │                  │  Zustand Store  │
│  localStorage   │                  │  AsyncStorage   │
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         │         ┌─────────────────┐        │
         └────────►│   SUPABASE      │◄───────┘
                   │                 │
                   │  - sync_state   │
                   │  - beings       │
                   │  - reading_progress
                   │  - achievements │
                   │  - sync_queue   │
                   └─────────────────┘
```

### Flujo de Datos

1. **Push**: Cliente → Supabase (enviar cambios locales)
2. **Pull**: Supabase → Cliente (obtener cambios remotos)
3. **Conflict Resolution**: Timestamp-based (más reciente gana)
4. **Queue**: Operaciones offline se almacenan y procesan al reconectar

---

## Componentes

### 1. SyncBridgeService.js (Webapp)

**Ubicación**: `www/js/services/SyncBridgeService.js`

**Responsabilidades**:
- Sincronizar progreso de lectura desde localStorage
- Aplicar beings recibidos desde mobile game
- Aplicar achievements desde mobile
- Emitir eventos via `eventBus`
- Gestionar cola offline

**Dependencias**:
- `window.supabase` - Cliente Supabase
- `window.eventBus` - Sistema de eventos
- `window.authHelper` - Autenticación

### 2. WebBridgeService.js (Mobile Game)

**Ubicación**: `mobile-game/mobile-app/src/services/WebBridgeService.js`

**Responsabilidades**:
- Exportar estado del juego (beings, user stats)
- Sincronizar beings con Supabase
- Aplicar progreso de lectura desde webapp
- Aplicar achievements desde webapp
- Integración con Zustand store

**Dependencias**:
- `@supabase/supabase-js` - Cliente Supabase
- `useGameStore` - Zustand store
- `AsyncStorage` - Persistencia local

### 3. Migración SQL

**Ubicación**: `supabase/migrations/006_sync_bridge.sql`

**Tablas creadas**:
- `sync_state` - Estado de sincronización por dispositivo
- `beings` - Seres creados en el juego
- `reading_progress` - Progreso de lectura
- `achievements` - Logros desbloqueados
- `sync_queue` - Cola de operaciones offline

---

## Flujo de Sincronización

### Sincronización Completa

```javascript
// 1. Inicialización (automática)
// Webapp
await window.syncBridge.init();

// Mobile
await webBridgeService.init(supabaseConfig);

// 2. Sincronización manual
// Webapp
const result = await window.syncBridge.sync();

// Mobile
const result = await webBridgeService.sync();
```

### Proceso Detallado

#### PUSH (Enviar cambios locales)

**Webapp**:
1. Lee `localStorage.read_progress`
2. Lee `localStorage.achievements`
3. Llama `sync_entity()` RPC por cada item
4. Actualiza `sync_state`

**Mobile**:
1. Exporta `useGameStore.beings`
2. Llama `sync_entity()` RPC por cada being
3. Actualiza `sync_state`

#### PULL (Recibir cambios remotos)

**Webapp**:
1. Llama `get_changes_since(last_sync_timestamp)`
2. Recibe beings desde mobile
3. Aplica a `localStorage.synced_beings`
4. Emite evento `sync.beings.updated`

**Mobile**:
1. Llama `get_changes_since(last_sync_timestamp)`
2. Recibe progreso de lectura
3. Recibe achievements
4. Aplica recompensas al store
5. Emite notificaciones internas

---

## Resolución de Conflictos

### Estrategia: Last-Write-Wins (LWW)

El registro con `last_modified_at` más reciente prevalece.

### Proceso

```sql
-- En sync_entity() RPC function
IF v_existing_record.last_modified_at > p_modified_at THEN
  -- Conflicto detectado
  RETURN jsonb_build_object(
    'status', 'conflict',
    'message', 'Server has newer data',
    'server_data', row_to_json(v_existing_record)
  );
ELSE
  -- Actualizar con datos del cliente
  UPDATE ... SET ... WHERE ...;
END IF;
```

### Manejo en Cliente

**Webapp**:
```javascript
if (data?.status === 'conflict') {
  console.log('Conflicto detectado');

  // Emitir evento
  eventBus.emit('sync.conflict', {
    type: 'reading_progress',
    local: localData,
    remote: data.server_data
  });

  // Opción 1: Aceptar versión del servidor (silenciosamente)
  // Opción 2: Mostrar UI para resolver manualmente
  // Opción 3: Merge inteligente (ej. max progress)
}
```

**Mobile**:
```javascript
if (data?.status === 'conflict') {
  logger.warn(`Conflicto detectado para ${being.name}`);
  // El servidor tiene datos más recientes
  // En este caso, aceptamos la versión del servidor
}
```

---

## Tablas de Base de Datos

### 1. sync_state

Rastrea el estado de sincronización por dispositivo.

```sql
CREATE TABLE sync_state (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  platform TEXT CHECK (platform IN ('web', 'mobile', 'android', 'ios')),
  device_id TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_version INTEGER,
  data_hash TEXT,
  sync_status TEXT CHECK (sync_status IN ('idle', 'syncing', 'error', 'conflict')),
  sync_error TEXT,
  conflict_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, platform, device_id)
);
```

### 2. beings

Seres creados en el mobile game.

```sql
CREATE TABLE beings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  being_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '🌱',
  status TEXT CHECK (status IN ('available', 'deployed', 'resting', 'evolving')),
  current_mission TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  attributes JSONB,
  source_app TEXT DEFAULT 'mobile-game',
  community_id TEXT,
  synced_from TEXT DEFAULT 'mobile',
  last_modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, being_id)
);
```

### 3. reading_progress

Progreso de lectura en libros.

```sql
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  progress_percentage DECIMAL(5,2),
  last_position INTEGER,
  completed BOOLEAN,
  bookmarked BOOLEAN,
  reading_time_seconds INTEGER,
  last_read_at TIMESTAMPTZ,
  synced_from TEXT,
  last_modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, book_id, chapter_id)
);
```

### 4. achievements

Logros compartidos entre plataformas.

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  achievement_id TEXT NOT NULL,
  achievement_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  progress DECIMAL(5,2),
  completed BOOLEAN,
  unlocked_at TIMESTAMPTZ,
  rewards JSONB,
  metadata JSONB,
  synced_from TEXT,
  last_modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);
```

### 5. sync_queue

Cola para operaciones offline-first.

```sql
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  operation_type TEXT CHECK (operation_type IN ('create', 'update', 'delete')),
  entity_type TEXT CHECK (entity_type IN ('being', 'reading_progress', 'achievement')),
  entity_id TEXT NOT NULL,
  data JSONB NOT NULL,
  platform TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);
```

---

## API de Servicios

### Funciones RPC en Supabase

#### sync_entity()

Sincroniza una entidad resolviendo conflictos.

```sql
sync_entity(
  p_user_id UUID,
  p_entity_type TEXT,      -- 'being', 'reading_progress', 'achievement'
  p_entity_id TEXT,
  p_data JSONB,
  p_platform TEXT,         -- 'web', 'mobile'
  p_modified_at TIMESTAMPTZ
)
RETURNS JSONB
```

**Retorno**:
```json
{
  "status": "created" | "updated" | "conflict",
  "message": "...",
  "server_data": { ... }  // Solo si hay conflicto
}
```

#### get_changes_since()

Obtiene cambios desde la última sincronización.

```sql
get_changes_since(
  p_user_id UUID,
  p_platform TEXT,
  p_last_sync TIMESTAMPTZ
)
RETURNS JSONB
```

**Retorno**:
```json
{
  "beings": [...],
  "reading_progress": [...],
  "achievements": [...],
  "sync_timestamp": "2025-01-15T10:30:00Z"
}
```

### API JavaScript - Webapp

```javascript
// Inicializar
await window.syncBridge.init();

// Sincronizar manualmente
const result = await window.syncBridge.sync();

// Forzar sincronización
const result = await window.syncBridge.forceSync();

// Obtener beings sincronizados
const beings = window.syncBridge.getSyncedBeings();

// Obtener estado
const status = window.syncBridge.getSyncStatus();

// Agregar a cola offline
window.syncBridge.queueOperation({
  entity_type: 'reading_progress',
  entity_id: 'codigo-despertar_cap1',
  operation_type: 'update',
  data: { completed: true }
});

// Iniciar/detener auto-sync
window.syncBridge.startAutoSync();
window.syncBridge.stopAutoSync();
```

### API JavaScript - Mobile

```javascript
import webBridgeService from './services/WebBridgeService';

// Inicializar
await webBridgeService.init(supabaseConfig);

// Sincronizar
const result = await webBridgeService.sync();

// Forzar sincronización
const result = await webBridgeService.forceSync();

// Exportar estado del juego
const gameState = webBridgeService.exportGameState();

// Obtener estado
const status = webBridgeService.getSyncStatus();

// Auto-sync (cada N minutos)
webBridgeService.startAutoSync(10); // 10 minutos
webBridgeService.stopAutoSync();

// Limpiar al logout
await webBridgeService.clear();
```

---

## Eventos

### Webapp (via eventBus)

```javascript
// Sincronización iniciada
eventBus.on('sync.started', (data) => {
  console.log('Sync started:', data.timestamp);
});

// Sincronización completada
eventBus.on('sync.completed', (results) => {
  console.log('Sync completed:', results);
  // results: { success, timestamp, pushed, pulled }
});

// Error en sincronización
eventBus.on('sync.error', (error) => {
  console.error('Sync error:', error);
});

// Conflicto detectado
eventBus.on('sync.conflict', (conflict) => {
  console.warn('Conflict:', conflict.type, conflict.local, conflict.remote);
});

// Beings actualizados
eventBus.on('sync.beings.updated', (data) => {
  console.log('Beings updated:', data.count, data.beings);
  // Actualizar UI con nuevos beings
});

// Progreso de lectura actualizado
eventBus.on('sync.reading_progress.updated', (data) => {
  console.log('Progress updated:', data.bookId, data.chapterId);
});

// Achievements actualizados
eventBus.on('sync.achievements.updated', (data) => {
  console.log('Achievements updated:', data.count);
});
```

### Mobile (via logger o store listeners)

Los eventos se manejan internamente con el logger y actualizaciones del Zustand store.

```javascript
// Escuchar cambios en el store
useGameStore.subscribe((state) => {
  // Detectar cambios en beings, user stats, etc.
});
```

---

## Configuración

### 1. Configuración de Supabase

**Webapp** (`www/js/core/supabase-config.js`):

```javascript
window.supabaseConfig = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY',
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
};
```

**Mobile** (en `RootNavigator.js`):

```javascript
const supabaseConfig = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY'
};

await webBridgeService.init(supabaseConfig);
```

### 2. Ejecutar Migración SQL

```bash
# En Supabase SQL Editor
psql -h db.YOUR_PROJECT.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/006_sync_bridge.sql
```

O usar Supabase CLI:

```bash
supabase db push
```

### 3. Configurar Auto-Sync

**Webapp**:
- Auto-sync se activa automáticamente cada 5 minutos al autenticarse
- Configurable en `SyncBridgeService.js`:

```javascript
this.autoSyncIntervalMs = 5 * 60 * 1000; // 5 minutos
```

**Mobile**:
- Auto-sync se activa manualmente:

```javascript
webBridgeService.startAutoSync(10); // 10 minutos
```

---

## Ejemplos de Uso

### Ejemplo 1: Sincronizar al Autenticarse (Webapp)

```javascript
// En auth-helper.js o después de login
window.authHelper.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Sincronizar inmediatamente
    window.syncBridge.sync({ silent: true });
  }
});
```

### Ejemplo 2: Mostrar Beings del Mobile Game (Webapp)

```javascript
// Escuchar cambios de beings
eventBus.on('sync.beings.updated', (data) => {
  const beings = data.beings;

  // Renderizar en UI
  const beingsContainer = document.getElementById('mobile-beings');
  beingsContainer.innerHTML = beings.map(being => `
    <div class="being-card">
      <div class="avatar">${being.avatar}</div>
      <h3>${being.name}</h3>
      <p>Level ${being.level} - ${being.status}</p>
    </div>
  `).join('');
});

// Obtener beings actuales
const beings = window.syncBridge.getSyncedBeings();
```

### Ejemplo 3: Sincronizar Beings desde Mobile

```javascript
// En el mobile game, después de crear un being
import useGameStore from './stores/gameStore';
import webBridgeService from './services/WebBridgeService';

// Crear being
const newBeing = {
  id: 'being_123',
  name: 'Guardián del Despertar',
  avatar: '🌟',
  level: 1,
  attributes: { ... }
};

useGameStore.getState().addBeing(newBeing);

// Sincronizar inmediatamente
await webBridgeService.sync();
```

### Ejemplo 4: Aplicar Progreso de Lectura en Mobile

```javascript
// Cuando se recibe progreso de lectura desde webapp
eventBus.on('sync.reading_progress.pulled', (progress) => {
  progress.forEach(item => {
    if (item.completed) {
      // Dar recompensas por lectura
      useGameStore.getState().addXP(50);
      useGameStore.getState().addConsciousness(25);

      // Mostrar notificación
      Toast.show({
        type: 'success',
        text1: 'Progreso sincronizado',
        text2: `Completaste: ${item.book_id}`
      });
    }
  });
});
```

### Ejemplo 5: Manejo de Conflictos

```javascript
// Webapp: Manejo manual de conflicto
eventBus.on('sync.conflict', (conflict) => {
  // Mostrar modal de resolución
  const modal = new ConfirmModal({
    title: 'Conflicto de Sincronización',
    message: `
      Hay una versión más reciente en el servidor.
      ¿Qué versión quieres mantener?
    `,
    buttons: [
      {
        text: 'Mantener Local',
        onClick: () => {
          // Forzar subir versión local
          window.syncBridge.sync({ force: true });
        }
      },
      {
        text: 'Usar Servidor',
        onClick: () => {
          // Aceptar versión del servidor
          applyServerVersion(conflict.remote);
        }
      }
    ]
  });

  modal.show();
});
```

### Ejemplo 6: Offline Queue

```javascript
// Webapp: Agregar a cola cuando no hay conexión
window.addEventListener('offline', () => {
  console.log('Sin conexión, usando cola offline');
});

// Las operaciones se agregan automáticamente a la cola
// cuando sync() falla por falta de conexión

// Al reconectar, se procesan automáticamente
window.addEventListener('online', () => {
  console.log('Conexión restaurada, procesando cola...');
  // SyncBridgeService lo hace automáticamente
});
```

---

## Troubleshooting

### Problema: Sincronización No Funciona

**Síntomas**: No se sincronizan datos entre plataformas

**Soluciones**:

1. Verificar que la migración SQL se ejecutó correctamente:
```sql
SELECT * FROM sync_state LIMIT 1;
```

2. Verificar que el usuario está autenticado:
```javascript
// Webapp
console.log(window.authHelper.user);

// Mobile
console.log(useGameStore.getState().user);
```

3. Verificar logs de sincronización:
```javascript
// Webapp
console.log(window.syncBridge.getSyncStatus());

// Mobile
console.log(webBridgeService.getSyncStatus());
```

4. Verificar que Supabase RLS permite acceso:
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'beings';
```

### Problema: Conflictos Constantes

**Síntomas**: Siempre aparecen conflictos en cada sync

**Soluciones**:

1. Verificar timestamps:
```javascript
// Los timestamps deben estar en formato ISO correcto
const timestamp = new Date().toISOString();
```

2. Sincronizar relojes:
- Asegurar que los dispositivos tienen hora correcta
- Usar NTP en servidores

3. Verificar lógica de comparación en `sync_entity()`:
```sql
-- El timestamp debe compararse correctamente
IF v_existing_record.last_modified_at > p_modified_at THEN
```

### Problema: Datos No Aparecen en UI

**Síntomas**: Los datos se sincronizan pero no se muestran

**Soluciones**:

1. Verificar que los eventos se emiten:
```javascript
// Webapp
eventBus.on('sync.beings.updated', (data) => {
  console.log('Event received:', data);
});
```

2. Verificar que localStorage se actualiza:
```javascript
// Webapp
console.log(localStorage.getItem('synced_beings'));
```

3. Verificar que el store se actualiza:
```javascript
// Mobile
console.log(useGameStore.getState().beings);
```

### Problema: Cola Offline Crece Infinitamente

**Síntomas**: La cola nunca se vacía

**Soluciones**:

1. Verificar que hay conexión a Supabase:
```javascript
const { data, error } = await supabase.from('sync_state').select('*').limit(1);
console.log('Connection test:', error ? 'FAIL' : 'OK');
```

2. Verificar límite de reintentos:
```javascript
// En sync_queue, max_retries debería ser 3
// Operaciones que fallen 3 veces se descartan
```

3. Limpiar cola manualmente si es necesario:
```javascript
// Webapp
localStorage.setItem('sync_queue', '[]');
window.syncBridge.syncQueue = [];

// Mobile
await AsyncStorage.setItem('sync_queue', '[]');
```

### Logs de Debugging

**Webapp**:
```javascript
// Habilitar debug mode en eventBus
window.eventBus.enableDebug();

// Ver estadísticas
window.eventBus.showStats();

// Ver estado de sync
console.log(window.syncBridge.getSyncStatus());
```

**Mobile**:
```javascript
import logger from './utils/logger';

// Los logs ya están habilitados
// Buscar en consola: [WebBridge], [SyncBridge]
```

---

## Resumen

✅ **Sistema completo de sincronización bidireccional**
✅ **Resolución automática de conflictos**
✅ **Soporte offline-first**
✅ **Eventos en tiempo real**
✅ **Integración con Zustand y eventBus**
✅ **Documentación completa**

Para más detalles, consultar:
- Código fuente: `www/js/services/SyncBridgeService.js`
- Código fuente: `mobile-game/mobile-app/src/services/WebBridgeService.js`
- SQL: `supabase/migrations/006_sync_bridge.sql`
