# Sistema de Learning Paths - Guía de Implementación

## Descripción

Sistema completo de Learning Paths (Jornadas de Aprendizaje) para Colección Nuevo Ser. Permite a los usuarios seguir rutas guiadas de 7, 21 o 30 días con contenido estructurado que combina lectura, ejercicios, meditaciones y reflexiones.

## Archivos Creados

### 1. Base de Datos
- **Archivo**: `/supabase/migrations/007_learning_paths.sql`
- **Líneas**: 910
- **Contenido**:
  - 4 tablas principales con RLS policies
  - Indexes para optimización de queries
  - Triggers para actualización automática de streaks y completitud
  - 3 funciones RPC para operaciones complejas
  - Datos seed con 2 paths de ejemplo (7 y 21 días)

### 2. Servicio JavaScript
- **Archivo**: `/www/js/services/LearningPathService.js`
- **Líneas**: 823
- **Características**:
  - Gestión completa de paths y progreso
  - Sistema de streaks (rachas diarias)
  - Integración completa con eventBus
  - Cache inteligente de 5 minutos
  - Manejo robusto de errores

## Estructura de Base de Datos

### Tablas Creadas

#### 1. `learning_paths`
Catálogo de paths disponibles.

```sql
- id (UUID)
- slug (VARCHAR, UNIQUE) - Identificador amigable
- title (VARCHAR)
- description (TEXT)
- duration_days (INTEGER) - 7, 21, 30
- difficulty (VARCHAR) - easy, medium, hard
- objectives (JSONB) - Lista de objetivos
- requirements (JSONB) - Prerrequisitos
- tags (JSONB) - Etiquetas para filtrado
- is_active (BOOLEAN)
- is_premium (BOOLEAN)
- sort_order (INTEGER)
```

#### 2. `learning_path_stages`
Etapas diarias de cada path.

```sql
- id (UUID)
- path_id (UUID FK)
- day_number (INTEGER)
- title (VARCHAR)
- description (TEXT)
- content_type (VARCHAR) - reading, exercise, meditation, quiz, reflection, video, mixed
- content_reference (JSONB) - Referencias al contenido
- duration_minutes (INTEGER)
- is_optional (BOOLEAN)
- order_index (INTEGER)
- resources (JSONB) - Recursos adicionales
```

#### 3. `user_learning_paths`
Progreso del usuario en paths.

```sql
- id (UUID)
- user_id (UUID FK)
- path_id (UUID FK)
- status (VARCHAR) - in_progress, completed, abandoned, paused
- started_at (TIMESTAMPTZ)
- current_day (INTEGER)
- completed_at (TIMESTAMPTZ)
- streak_days (INTEGER) - Racha actual
- longest_streak (INTEGER) - Mejor racha histórica
- total_time_minutes (INTEGER)
- completion_percentage (INTEGER)
- certificate_url (TEXT)
```

#### 4. `user_stage_progress`
Progreso detallado en cada etapa.

```sql
- id (UUID)
- user_id (UUID FK)
- user_path_id (UUID FK)
- stage_id (UUID FK)
- status (VARCHAR) - pending, in_progress, completed, skipped
- started_at (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)
- time_spent_minutes (INTEGER)
- score (INTEGER) - 0-100
- rating (INTEGER) - 1-5
- notes (TEXT)
- reflections (JSONB)
```

## Funciones RPC

### 1. `get_learning_path_with_progress(path_slug, user_id)`
Obtiene un path completo con todas sus etapas y el progreso del usuario.

**Retorna**:
```json
{
  "path": { /* datos del path */ },
  "stages": [
    {
      "stage": { /* datos de la etapa */ },
      "progress": { /* progreso del usuario en esta etapa */ }
    }
  ],
  "user_progress": { /* progreso general del usuario en el path */ }
}
```

### 2. `get_user_learning_stats(user_id)`
Obtiene estadísticas generales del usuario.

**Retorna**:
```json
{
  "total_paths_started": 3,
  "total_paths_completed": 1,
  "total_paths_in_progress": 2,
  "current_streak": 5,
  "longest_streak": 12,
  "total_time_minutes": 420,
  "average_completion": 67.5
}
```

### 3. `get_next_stage(path_slug, user_id)`
Obtiene la siguiente etapa pendiente en un path.

### 4. `advance_to_next_day(path_slug, user_id)`
Avanza al siguiente día si todas las etapas obligatorias están completadas.

## Uso del Servicio JavaScript

### Inicialización

El servicio se auto-inicializa cuando carga el DOM:

```javascript
// Acceder al servicio
const service = window.learningPathService;

// Verificar estado
const info = service.getServiceInfo();
console.log(info);
// { initialized: true, authenticated: true, userId: "...", ... }
```

### Listar Paths Disponibles

```javascript
// Obtener todos los paths activos
const paths = await learningPathService.getPaths();

// Filtrar por dificultad
const easyPaths = await learningPathService.getPaths({
  difficulty: 'easy'
});

// Solo paths gratuitos de máximo 7 días
const freePaths = await learningPathService.getPaths({
  isPremium: false,
  maxDuration: 7
});
```

### Iniciar un Path

```javascript
// Iniciar el "Viaje del Despertar"
const userPath = await learningPathService.startPath('viaje-despertar');

if (userPath) {
  console.log('Path iniciado con éxito');
  console.log(`Día actual: ${userPath.current_day}`);
}
```

### Obtener Información de un Path

```javascript
// Obtener path completo con progreso
const pathData = await learningPathService.getPath('viaje-despertar');

console.log('Path:', pathData.path);
console.log('Etapas:', pathData.stages);
console.log('Mi progreso:', pathData.user_progress);
```

### Completar una Etapa

```javascript
// Completar una etapa simple
await learningPathService.completeStage(stageId);

// Completar con datos adicionales
await learningPathService.completeStage(stageId, {
  notes: 'Excelente meditación, sentí mucha paz',
  rating: 5,
  timeSpentMinutes: 25,
  reflections: [
    {
      question: '¿Qué aprendiste hoy?',
      answer: 'La importancia de la respiración consciente'
    }
  ]
});
```

### Obtener Siguiente Etapa

```javascript
const nextStage = await learningPathService.getNextStage('viaje-despertar');

if (nextStage) {
  console.log('Siguiente etapa:', nextStage.title);
  console.log('Día:', nextStage.day_number);
  console.log('Tipo:', nextStage.content_type);
  console.log('Duración:', nextStage.duration_minutes, 'minutos');
}
```

### Avanzar al Siguiente Día

```javascript
// Intentar avanzar al siguiente día
const advanced = await learningPathService.advanceToNextDay('viaje-despertar');

if (advanced) {
  console.log('¡Avanzado al siguiente día!');
} else {
  console.log('Completa todas las etapas del día actual primero');
}
```

### Gestionar Paths

```javascript
// Pausar un path
await learningPathService.pausePath('viaje-despertar');

// Reanudar un path
await learningPathService.resumePath('viaje-despertar');

// Abandonar un path
await learningPathService.abandonPath('viaje-despertar', 'No tengo tiempo');
```

### Obtener Estadísticas

```javascript
// Estadísticas generales
const stats = await learningPathService.getUserStats();
console.log(`Has completado ${stats.total_paths_completed} paths`);
console.log(`Racha actual: ${stats.current_streak} días`);
console.log(`Mejor racha: ${stats.longest_streak} días`);

// Paths activos
const activePaths = await learningPathService.getActiveUserPaths();
console.log(`Tienes ${activePaths.length} paths en progreso`);

// Historial completo
const history = await learningPathService.getPathHistory();
console.log('Historial:', history);
```

## Eventos Emitidos

El servicio emite eventos a través del `eventBus` global:

### `learningPath.started`
Se emite cuando un usuario inicia un nuevo path.

```javascript
eventBus.on('learningPath.started', (data) => {
  console.log(`Path iniciado: ${data.pathTitle}`);
  console.log(`Duración: ${data.durationDays} días`);
  // Mostrar notificación, actualizar UI, etc.
});
```

**Payload**:
```json
{
  "pathSlug": "viaje-despertar",
  "pathId": "uuid",
  "pathTitle": "Viaje del Despertar",
  "durationDays": 7,
  "timestamp": "2025-12-18T10:30:00Z"
}
```

### `learningPath.stage.completed`
Se emite cuando se completa una etapa.

```javascript
eventBus.on('learningPath.stage.completed', (data) => {
  console.log(`Etapa completada: ${data.stageTitle}`);
  console.log(`Día ${data.dayNumber} del path ${data.pathTitle}`);

  // Mostrar animación de celebración
  if (data.rating === 5) {
    showCelebrationAnimation();
  }
});
```

**Payload**:
```json
{
  "stageId": "uuid",
  "stageTitle": "Meditación de Presencia",
  "dayNumber": 1,
  "pathSlug": "viaje-despertar",
  "pathTitle": "Viaje del Despertar",
  "rating": 5,
  "timestamp": "2025-12-18T10:45:00Z"
}
```

### `learningPath.day.completed`
Se emite cuando se completan todas las etapas de un día.

```javascript
eventBus.on('learningPath.day.completed', (data) => {
  console.log(`¡Día ${data.dayNumber} completado!`);

  // Mostrar mensaje motivacional
  showDayCompletionModal(data.dayNumber);

  // Preguntar si quiere avanzar al siguiente día
  askToAdvanceDay(data.pathSlug);
});
```

**Payload**:
```json
{
  "dayNumber": 1,
  "pathSlug": "viaje-despertar",
  "pathTitle": "Viaje del Despertar",
  "timestamp": "2025-12-18T11:00:00Z"
}
```

### `learningPath.streak.updated`
Se emite cuando cambia la racha del usuario.

```javascript
eventBus.on('learningPath.streak.updated', (data) => {
  console.log(`Racha actual: ${data.streakDays} días`);

  // Mostrar badge si es racha nueva
  if (data.streakDays > data.longestStreak) {
    showNewRecordBadge(data.streakDays);
  }

  // Actualizar widget de streaks
  updateStreakWidget(data.streakDays);
});
```

**Payload**:
```json
{
  "pathSlug": "viaje-despertar",
  "streakDays": 5,
  "longestStreak": 12,
  "timestamp": "2025-12-18T11:00:00Z"
}
```

### `learningPath.completed`
Se emite cuando se completa todo el path.

```javascript
eventBus.on('learningPath.completed', (data) => {
  console.log(`¡Felicidades! Completaste: ${data.pathTitle}`);

  // Mostrar modal de celebración con certificado
  showCompletionCelebration(data);

  // Sugerir siguiente path
  suggestNextPath(data.difficulty);
});
```

### `learningPath.abandoned`
Se emite cuando se abandona un path.

```javascript
eventBus.on('learningPath.abandoned', (data) => {
  console.log(`Path abandonado: ${data.pathTitle}`);
  console.log(`Razón: ${data.reason}`);

  // Ofrecer retomar más tarde
  showAbandonmentMessage(data);
});
```

## Ejemplo de Integración en UI

### Widget de Dashboard

```javascript
class LearningPathWidget {
  constructor() {
    this.service = window.learningPathService;
    this.setupEventListeners();
  }

  async init() {
    // Obtener paths activos
    const activePaths = await this.service.getActiveUserPaths();

    // Renderizar cada path activo
    activePaths.forEach(path => {
      this.renderPathCard(path);
    });

    // Obtener estadísticas
    const stats = await this.service.getUserStats();
    this.renderStats(stats);
  }

  setupEventListeners() {
    // Actualizar UI cuando se completa una etapa
    eventBus.on('learningPath.stage.completed', (data) => {
      this.updateProgressBar(data.pathSlug);
      this.showCompletionToast(data.stageTitle);
    });

    // Mostrar animación cuando se completa un día
    eventBus.on('learningPath.day.completed', (data) => {
      this.showDayCompletionAnimation(data);
    });

    // Actualizar widget de streaks
    eventBus.on('learningPath.streak.updated', (data) => {
      this.updateStreakDisplay(data.streakDays);
    });
  }

  async renderPathCard(path) {
    const nextStage = await this.service.getNextStage(path.learning_paths.slug);

    const card = `
      <div class="path-card">
        <h3>${path.learning_paths.title}</h3>
        <div class="progress">
          <div class="progress-bar" style="width: ${path.completion_percentage}%"></div>
        </div>
        <p>Día ${path.current_day} de ${path.learning_paths.duration_days}</p>
        <p>Racha: ${path.streak_days} días 🔥</p>

        ${nextStage ? `
          <div class="next-stage">
            <p>Siguiente: ${nextStage.title}</p>
            <button onclick="continueStage('${nextStage.id}')">
              Continuar
            </button>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('active-paths').innerHTML += card;
  }
}

// Inicializar widget
const pathWidget = new LearningPathWidget();
pathWidget.init();
```

## Paths de Ejemplo Incluidos

### 1. Viaje del Despertar (7 días - Fácil)

Path introductorio para quienes inician su jornada de transformación.

**Objetivos**:
- Comprender los fundamentos del despertar
- Establecer una práctica diaria de meditación
- Desarrollar consciencia del momento presente
- Integrar nuevas perspectivas en la vida cotidiana

**Estructura** (ejemplo de primeros días):
- **Día 1**: Lectura "El Primer Despertar" + Meditación de Presencia (15 min)
- **Día 2**: Lectura "La Naturaleza de la Realidad" + Reflexión personal
- **Día 3**: Lectura "Consciencia y Observación" + Ejercicio práctico
- ... (continúa 7 días)

### 2. Transformación Profunda (21 días - Intermedio)

Path intensivo para transformación real y duradera.

**Objetivos**:
- Desarrollar una práctica espiritual sólida
- Transformar patrones mentales y emocionales
- Integrar consciencia en todas las áreas de la vida
- Establecer nuevos hábitos transformadores
- Conectar con tu propósito de vida

**Requisitos recomendados**:
- Haber completado "Viaje del Despertar"
- Compromiso de 30-45 minutos diarios

## Próximos Pasos (PARTE 2)

Para completar la implementación del sistema, se debe crear:

1. **UI Components** (PARTE 2):
   - PathBrowser.js - Navegador de paths disponibles
   - PathDetail.js - Vista detallada de un path
   - PathProgress.js - Widget de progreso
   - StageViewer.js - Visor de etapa actual
   - StreakWidget.js - Visualización de racha
   - CertificateModal.js - Certificado de completitud

2. **Integración en index.html**:
   - Cargar el servicio
   - Agregar sección de Learning Paths
   - Integrar con navegación principal

3. **Notificaciones**:
   - Recordatorios diarios
   - Celebraciones de logros
   - Alertas de racha en riesgo

## Seguridad

- **RLS Policies**: Usuarios solo pueden ver/editar su propio progreso
- **Validaciones**: Triggers validan que etapas previas estén completas
- **Autenticación**: Todas las operaciones requieren usuario autenticado
- **Admin Panel**: Solo admins pueden crear/editar paths

## Performance

- **Indexes**: Optimizados para queries frecuentes
- **Cache**: 5 minutos en cliente para reducir queries
- **Lazy Loading**: Etapas se cargan bajo demanda
- **Triggers**: Actualizaciones automáticas de progreso

## Monitoreo

Para ver estadísticas del servicio en consola:

```javascript
// Información del servicio
learningPathService.getServiceInfo();

// Estadísticas de eventBus
eventBusStats();
```

---

**Versión**: 1.0.0
**Fecha**: 2025-12-18
**Autor**: Claude Code
**Estado**: PARTE 1 Completada - Backend y Servicio listo para uso
