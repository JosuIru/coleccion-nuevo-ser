# Service Layer - Colección Nuevo Ser

Esta capa de servicios abstrae todas las operaciones con Supabase, proporcionando:

- **Cache en memoria** con TTL configurable (5 minutos por defecto)
- **Cola offline** para operaciones cuando no hay conexión
- **Manejo de errores centralizado** con eventos personalizados
- **API consistente** para todas las operaciones CRUD

## Arquitectura

```
BaseService (Clase base abstracta)
    ├── BookService (Gestión de libros y progreso)
    └── UserService (Gestión de usuarios y perfiles)
```

## Uso

### BookService

El servicio de libros está disponible globalmente como `window.bookService`.

#### Obtener información de un libro

```javascript
const libro = await window.bookService.getBook('codigo-despertar');
console.log(libro);
// { id: 'codigo-despertar', title: 'El Código del Despertar', ... }
```

#### Obtener progreso de lectura

```javascript
// Para el usuario actual
const progreso = await window.bookService.getReadingProgress(null, 'codigo-despertar');
console.log(progreso);
// {
//   user_id: '...',
//   book_id: 'codigo-despertar',
//   current_page: 42,
//   progress_percent: 35,
//   completed: false,
//   ...
// }
```

#### Actualizar progreso de lectura

```javascript
await window.bookService.updateReadingProgress(null, 'codigo-despertar', {
  current_page: 50,
  progress_percent: 42,
  last_position: { chapter: 3, section: 2 }
});
```

#### Marcar libro como completado

```javascript
await window.bookService.completeBook(null, 'codigo-despertar');
```

#### Gestionar marcadores

```javascript
// Obtener marcadores
const marcadores = await window.bookService.getBookmarks(null, 'codigo-despertar');

// Guardar marcador
await window.bookService.saveBookmark(null, 'codigo-despertar', {
  title: 'Importante: definición de consciencia',
  page: 'capitulo-3',
  position: 'paragraph-5',
  notes: 'Revisar esta definición más tarde'
});

// Eliminar marcador
await window.bookService.deleteBookmark(bookmarkId);
```

#### Obtener estadísticas de lectura

```javascript
const stats = await window.bookService.getReadingStats();
console.log(stats);
// {
//   librosIniciados: 5,
//   librosCompletados: 2,
//   progresoPromedio: 68.4,
//   ultimaLectura: { ... }
// }
```

### UserService

El servicio de usuarios está disponible globalmente como `window.userService`.

#### Obtener perfil del usuario actual

```javascript
const perfil = await window.userService.getCurrentProfile();
console.log(perfil);
// {
//   id: '...',
//   email: 'user@example.com',
//   full_name: 'Usuario Ejemplo',
//   subscription_tier: 'premium',
//   ...
// }
```

#### Actualizar perfil

```javascript
await window.userService.updateProfile(null, {
  full_name: 'Nuevo Nombre',
  avatar_url: 'https://...',
  preferences: {
    theme: 'dark',
    notifications: true
  }
});
```

#### Gestionar logros

```javascript
// Obtener logros
const logros = await window.userService.getAchievements();

// Desbloquear un logro
await window.userService.unlockAchievement(null, 'first_book_completed', {
  book_id: 'codigo-despertar',
  completion_date: new Date().toISOString()
});
```

#### Verificar suscripción y características premium

```javascript
// Obtener información de suscripción
const suscripcion = await window.userService.getSubscription();
console.log(suscripcion);
// {
//   tier: 'premium',
//   status: 'active',
//   features: { ai_chat: true, ai_tutor: true, ... },
//   aiCreditsRemaining: 50,
//   ...
// }

// Verificar si es premium
const isPremium = await window.userService.isPremium();

// Verificar si tiene una característica específica
const hasAIChat = await window.userService.hasFeature('ai_chat');
```

#### Gestionar créditos de IA

```javascript
// Obtener créditos disponibles
const creditos = await window.userService.getAICredits();
console.log(creditos);
// { remaining: 50, total: 100, resetDate: '2025-01-18T...' }

// Decrementar créditos (al usar IA)
await window.userService.decrementAICredits(1);
```

#### Obtener estadísticas completas

```javascript
const stats = await window.userService.getUserStats();
console.log(stats);
// {
//   perfil: { ... },
//   logros: { total: 5, lista: [...] },
//   suscripcion: { ... },
//   miembroDesde: '2024-01-01T...',
//   ultimaActualizacion: '2025-12-18T...'
// }
```

## Características Avanzadas

### Cache

Todos los servicios implementan cache automático con TTL de 5 minutos.

```javascript
// Usar cache (por defecto)
const libro = await bookService.getBook('codigo-despertar');

// Forzar recarga sin cache
const libro = await bookService.get('codigo-despertar', { useCache: false });

// Limpiar cache manualmente
bookService.limpiarCache();

// Invalidar cache específico
bookService.invalidarCache(bookId);
```

### Cola Offline

Cuando no hay conexión, las operaciones se encolan automáticamente:

```javascript
// Esto funciona incluso sin conexión
await bookService.updateReadingProgress(null, 'codigo-despertar', {
  current_page: 50
});
// La operación se ejecutará automáticamente cuando se recupere la conexión
```

### Eventos Personalizados

Los servicios emiten eventos que puedes escuchar:

```javascript
// Errores de servicio
window.addEventListener('service-error', (event) => {
  console.error('Error en servicio:', event.detail);
  // { servicio: 'profiles', operacion: 'update', error: '...' }
});

// Actualización de perfil
window.addEventListener('profile-updated', (event) => {
  console.log('Perfil actualizado:', event.detail.profile);
});

// Logro desbloqueado
window.addEventListener('achievement-unlocked', (event) => {
  console.log('¡Nuevo logro!', event.detail.achievement);
  // Mostrar notificación o animación
});
```

### Estadísticas del Servicio

```javascript
const stats = bookService.getStats();
console.log(stats);
// {
//   tabla: 'reading_progress',
//   entradasCache: 12,
//   operacionesOffline: 0,
//   cacheTTL: 300000,
//   offlineQueueEnabled: true
// }
```

## BaseService (Uso Avanzado)

Si necesitas crear un nuevo servicio, extiende `BaseService`:

```javascript
class MiServicio extends BaseService {
  constructor() {
    super('mi_tabla', {
      cacheTTL: 10 * 60 * 1000, // 10 minutos
      enableOfflineQueue: true
    });
  }

  // Métodos CRUD heredados:
  // - get(id, opciones)
  // - getAll(opciones)
  // - create(datos)
  // - update(id, datos)
  // - delete(id)

  // Métodos de utilidad heredados:
  // - getCurrentUser()
  // - getCurrentUserId()
  // - isAuthenticated()
  // - invalidarCache(id)
  // - limpiarCache()

  // Tus métodos personalizados
  async miMetodoEspecial() {
    // Implementación
  }
}

const miServicio = new MiServicio();
```

## Integración con Código Existente

Los servicios son compatibles con el código existente que usa `window.supabase` directamente:

```javascript
// Forma antigua (aún funciona)
const { data, error } = await window.supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Forma nueva (recomendada)
const perfil = await window.userService.getProfile(userId);
```

## Migración Gradual

Puedes migrar gradualmente del uso directo de Supabase a los servicios:

1. **Fase 1**: Usa servicios para nuevas funcionalidades
2. **Fase 2**: Migra operaciones de lectura al servicio (get, getAll)
3. **Fase 3**: Migra operaciones de escritura (create, update, delete)
4. **Fase 4**: Elimina código obsoleto que usa Supabase directamente

## Mejores Prácticas

1. **Siempre usa los servicios** para operaciones nuevas
2. **Confía en el cache** - no hagas llamadas innecesarias
3. **Maneja errores** - escucha eventos `service-error`
4. **Usa offline queue** - funciona sin conexión
5. **No mezcles enfoques** - usa servicios O Supabase directo, no ambos
6. **Invalida cache** cuando sea necesario después de mutaciones

## Tablas de Supabase Soportadas

- `profiles` - Perfiles de usuario (UserService)
- `reading_progress` - Progreso de lectura (BookService)
- `bookmarks` - Marcadores (BookService)
- `achievements` - Logros (UserService)

## Roadmap

Próximos servicios a implementar:

- [ ] NotesService - Gestión de notas y reflexiones
- [ ] ReflectionsService - Reflexiones y meditaciones
- [ ] AIService - Integración con IA
- [ ] AnalyticsService - Estadísticas y métricas
