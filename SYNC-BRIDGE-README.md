# Sync Bridge - Sistema de Sincronización Web ↔ Mobile

Sistema de sincronización bidireccional entre la webapp (Colección Nuevo Ser) y el mobile game (Awakening Protocol).

## ✨ Características

- ✅ Sincronización de progreso de lectura entre plataformas
- ✅ Sincronización de logros/achievements
- ✅ Sincronización de "seres" creados en el mobile game
- ✅ Resolución automática de conflictos (timestamp-based: más reciente gana)
- ✅ Offline-first con cola de sincronización
- ✅ Eventos en tiempo real para actualizaciones de UI

## 📂 Archivos Creados

### Backend (Supabase)

- **`supabase/migrations/006_sync_bridge.sql`**
  - Tablas: `sync_state`, `beings`, `reading_progress`, `achievements`, `sync_queue`
  - Funciones RPC: `sync_entity()`, `get_changes_since()`
  - Políticas RLS para seguridad

### Frontend - Webapp

- **`www/js/services/SyncBridgeService.js`**
  - Servicio de sincronización para webapp
  - Integración con `eventBus` y `localStorage`
  - Auto-inicialización al cargar la página
  - Agregado a `www/index.html` (línea 309)

### Frontend - Mobile Game

- **`mobile-game/mobile-app/src/services/WebBridgeService.js`**
  - Servicio de sincronización para mobile
  - Integración con Zustand store y AsyncStorage
  - Exportación/importación de estado del juego
  - Integrado en `src/navigation/RootNavigator.js`

### Documentación

- **`SYNC-PROTOCOL.md`** - Documentación completa del protocolo
- **`SYNC-BRIDGE-README.md`** - Este archivo (resumen ejecutivo)

## 🚀 Inicio Rápido

### 1. Ejecutar Migración SQL

```bash
# Opción A: Usando Supabase SQL Editor
# Copiar y ejecutar el contenido de: supabase/migrations/006_sync_bridge.sql

# Opción B: Usando Supabase CLI
cd coleccion-nuevo-ser
supabase db push
```

### 2. Configurar Credenciales de Supabase

**Webapp** (`www/js/core/supabase-config.js`):

Ya está configurado si tienes Supabase activo. Si no:

```javascript
window.supabaseConfig = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY'
};
```

**Mobile** (`src/navigation/RootNavigator.js`, línea 403):

Reemplazar las credenciales de ejemplo:

```javascript
const supabaseConfig = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY'
};
```

### 3. Webapp - Ya está integrado

El `SyncBridgeService` se auto-inicializa al cargar la página:

```javascript
// Accesible globalmente
window.syncBridge

// Sincronizar manualmente (opcional)
await window.syncBridge.forceSync();

// Ver estado
console.log(window.syncBridge.getSyncStatus());
```

### 4. Mobile - Ya está integrado

El `WebBridgeService` se inicializa en el `RootNavigator`:

```javascript
import webBridgeService from './services/WebBridgeService';

// Sincronizar manualmente (opcional)
await webBridgeService.forceSync();

// Ver estado
console.log(webBridgeService.getSyncStatus());
```

## 📊 Flujo de Datos

```
WEBAPP (lectura)          ←→          MOBILE GAME (juego)
     ↓                                        ↓
localStorage                           Zustand Store
     ↓                                        ↓
SyncBridgeService          ←→          WebBridgeService
     ↓                                        ↓
     └──────────────→  SUPABASE  ←───────────┘
                    (sync_state, beings,
                     reading_progress,
                     achievements)
```

### Qué se sincroniza

| Dato | Origen | Destino | Uso |
|------|--------|---------|-----|
| **Progreso de lectura** | Webapp | Mobile | Desbloquear contenido/recompensas |
| **Achievements** | Webapp/Mobile | Ambos | Sistema de logros compartido |
| **Beings** | Mobile | Webapp | Mostrar seres creados en el juego |

## 🎯 Uso

### Webapp

```javascript
// Escuchar eventos de sincronización
eventBus.on('sync.completed', (results) => {
  console.log('Sync completado:', results);
});

// Obtener beings del mobile game
eventBus.on('sync.beings.updated', (data) => {
  console.log('Nuevos beings:', data.beings);
  // Renderizar en UI
});

// Obtener beings actuales
const beings = window.syncBridge.getSyncedBeings();
```

### Mobile Game

```javascript
// Sincronizar al crear un being
useGameStore.getState().addBeing(newBeing);
await webBridgeService.sync();

// Escuchar cambios en el store
useGameStore.subscribe((state) => {
  // Detectar cambios automáticamente
});
```

## 🔧 Configuración Avanzada

### Auto-Sync

**Webapp** (5 minutos por defecto):
```javascript
// En SyncBridgeService.js, línea 48
this.autoSyncIntervalMs = 5 * 60 * 1000; // Cambiar aquí
```

**Mobile** (10 minutos configurado):
```javascript
// En RootNavigator.js, línea 418
webBridgeService.startAutoSync(10); // Cambiar aquí
```

### Eventos Disponibles

**Webapp** (via `eventBus`):
- `sync.initialized` - Servicio inicializado
- `sync.started` - Sincronización iniciada
- `sync.completed` - Sincronización completada
- `sync.error` - Error en sincronización
- `sync.conflict` - Conflicto detectado
- `sync.beings.updated` - Beings actualizados
- `sync.reading_progress.updated` - Progreso actualizado
- `sync.achievements.updated` - Achievements actualizados

## 🐛 Troubleshooting

### Sincronización no funciona

```javascript
// Webapp - Verificar estado
console.log(window.syncBridge.getSyncStatus());
console.log(window.authHelper.user); // ¿Usuario autenticado?

// Mobile - Verificar estado
console.log(webBridgeService.getSyncStatus());
console.log(useGameStore.getState().user); // ¿Usuario autenticado?
```

### Ver logs de sincronización

**Webapp**:
```javascript
// Habilitar debug mode
window.eventBus.enableDebug();

// Ver estadísticas
window.eventBus.showStats();
```

**Mobile**:
```javascript
// Los logs ya están habilitados
// Buscar en consola: [WebBridge]
```

### Verificar que la migración SQL se ejecutó

```sql
-- En Supabase SQL Editor
SELECT * FROM sync_state LIMIT 1;
SELECT * FROM beings LIMIT 1;
SELECT * FROM reading_progress LIMIT 1;
```

## 📖 Documentación Completa

Para documentación detallada, ver **`SYNC-PROTOCOL.md`** que incluye:

- Arquitectura completa
- Flujo de sincronización detallado
- Resolución de conflictos
- Esquemas de base de datos
- API completa de servicios
- Ejemplos de uso avanzados
- Troubleshooting exhaustivo

## 🎉 Estado

✅ **Sistema completamente implementado y documentado**

### Componentes

- [x] Migración SQL con tablas y funciones RPC
- [x] SyncBridgeService.js (Webapp)
- [x] WebBridgeService.js (Mobile)
- [x] Integración con eventBus (Webapp)
- [x] Integración con Zustand store (Mobile)
- [x] Documentación completa
- [x] Ejemplos de uso
- [x] Troubleshooting guide

### Próximos Pasos (Opcional)

1. **Testing**: Crear tests unitarios para ambos servicios
2. **Monitoreo**: Agregar métricas de sincronización (tiempo, éxito/fallo)
3. **UI**: Crear indicador visual de estado de sincronización
4. **Notificaciones**: Push notifications cuando hay nuevos beings/achievements
5. **Merge Inteligente**: En lugar de LWW, implementar merge de datos (ej. max progress)

## 📝 Notas Importantes

- El sistema usa **Last-Write-Wins** para resolver conflictos (el más reciente gana)
- La sincronización es **bidireccional** y **automática**
- Funciona en **modo offline** con cola de operaciones pendientes
- Requiere que el usuario esté **autenticado** en ambas plataformas
- Los datos se almacenan en **Supabase** con políticas RLS para seguridad

## 🤝 Contribuir

Si encuentras bugs o tienes sugerencias:

1. Revisar `SYNC-PROTOCOL.md` primero
2. Verificar logs de sincronización
3. Documentar el issue con ejemplos reproducibles
4. Proponer soluciones si es posible

---

**Creado por**: Claude Sonnet 4.5
**Versión**: 1.0.0
**Fecha**: Diciembre 2024
