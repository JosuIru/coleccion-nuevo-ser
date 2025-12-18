/**
 * EJEMPLO DE USO: Sistema de Learning Paths
 * ==========================================
 *
 * Este archivo contiene ejemplos prácticos de cómo usar el sistema de Learning Paths
 * en diferentes escenarios de la aplicación Colección Nuevo Ser.
 *
 * NOTA: Este es un archivo de ejemplo y documentación.
 * No debe ser cargado en producción.
 */

// ============================================================================
// EJEMPLO 1: Dashboard con Paths Activos
// ============================================================================

async function renderLearningPathsDashboard() {
  const service = window.learningPathService;

  // Obtener paths activos del usuario
  const activePaths = await service.getActiveUserPaths();

  // Obtener estadísticas generales
  const stats = await service.getUserStats();

  const dashboardHTML = `
    <div class="learning-paths-dashboard">
      <!-- Stats Header -->
      <div class="stats-header">
        <div class="stat-card">
          <h4>${stats.total_paths_completed || 0}</h4>
          <p>Paths Completados</p>
        </div>
        <div class="stat-card">
          <h4>${stats.current_streak || 0} días</h4>
          <p>Racha Actual 🔥</p>
        </div>
        <div class="stat-card">
          <h4>${stats.longest_streak || 0} días</h4>
          <p>Mejor Racha</p>
        </div>
        <div class="stat-card">
          <h4>${Math.round((stats.total_time_minutes || 0) / 60)}h</h4>
          <p>Tiempo Total</p>
        </div>
      </div>

      <!-- Active Paths -->
      <div class="active-paths">
        <h3>Mis Jornadas Activas</h3>
        ${activePaths.length > 0 ? activePaths.map(path => `
          <div class="path-card" data-path-id="${path.id}">
            <h4>${path.learning_paths.title}</h4>
            <p>${path.learning_paths.description}</p>

            <!-- Progress Bar -->
            <div class="progress-container">
              <div class="progress-bar" style="width: ${path.completion_percentage}%">
                ${path.completion_percentage}%
              </div>
            </div>

            <!-- Day Info -->
            <div class="day-info">
              <span>Día ${path.current_day} de ${path.learning_paths.duration_days}</span>
              <span>Racha: ${path.streak_days} días</span>
            </div>

            <!-- Action Button -->
            <button onclick="continuePath('${path.learning_paths.slug}')">
              Continuar Jornada
            </button>
          </div>
        `).join('') : '<p>No tienes jornadas activas. ¡Comienza una nueva!</p>'}
      </div>

      <!-- Browse Paths Button -->
      <button onclick="showPathBrowser()">
        Explorar Jornadas de Aprendizaje
      </button>
    </div>
  `;

  document.getElementById('dashboard').innerHTML = dashboardHTML;
}

// ============================================================================
// EJEMPLO 2: Navegador de Paths Disponibles
// ============================================================================

async function renderPathBrowser() {
  const service = window.learningPathService;

  // Obtener todos los paths
  const allPaths = await service.getPaths();

  // Agrupar por dificultad
  const pathsByDifficulty = {
    easy: allPaths.filter(p => p.difficulty === 'easy'),
    medium: allPaths.filter(p => p.difficulty === 'medium'),
    hard: allPaths.filter(p => p.difficulty === 'hard')
  };

  const browserHTML = `
    <div class="path-browser">
      <h2>Jornadas de Aprendizaje</h2>

      <!-- Filters -->
      <div class="filters">
        <button onclick="filterPaths('all')">Todas</button>
        <button onclick="filterPaths('easy')">Principiante</button>
        <button onclick="filterPaths('medium')">Intermedio</button>
        <button onclick="filterPaths('hard')">Avanzado</button>
        <button onclick="filterPaths('free')">Gratis</button>
      </div>

      <!-- Path Grid -->
      <div class="path-grid">
        ${allPaths.map(path => `
          <div class="path-preview ${path.difficulty}" data-path-slug="${path.slug}">
            ${path.image_url ? `<img src="${path.image_url}" alt="${path.title}">` : ''}

            <div class="path-preview-content">
              <h3>${path.title}</h3>
              <p>${path.description}</p>

              <div class="path-meta">
                <span class="duration">${path.duration_days} días</span>
                <span class="difficulty badge-${path.difficulty}">
                  ${path.difficulty === 'easy' ? 'Principiante' :
                    path.difficulty === 'medium' ? 'Intermedio' : 'Avanzado'}
                </span>
                ${path.is_premium ? '<span class="premium">Premium</span>' : ''}
              </div>

              <div class="objectives">
                <h4>Objetivos:</h4>
                <ul>
                  ${(path.objectives || []).slice(0, 3).map(obj => `<li>${obj}</li>`).join('')}
                </ul>
              </div>

              <button onclick="viewPathDetail('${path.slug}')">
                Ver Detalles
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('content').innerHTML = browserHTML;
}

// ============================================================================
// EJEMPLO 3: Vista Detallada de un Path
// ============================================================================

async function renderPathDetail(pathSlug) {
  const service = window.learningPathService;

  // Obtener path completo con progreso
  const pathData = await service.getPath(pathSlug);

  if (!pathData?.path) {
    console.error('Path no encontrado');
    return;
  }

  const path = pathData.path;
  const userProgress = pathData.user_progress;
  const stages = pathData.stages || [];

  // Agrupar etapas por día
  const stagesByDay = {};
  stages.forEach(stageData => {
    const day = stageData.stage.day_number;
    if (!stagesByDay[day]) stagesByDay[day] = [];
    stagesByDay[day].push(stageData);
  });

  const detailHTML = `
    <div class="path-detail">
      <!-- Header -->
      <div class="path-header">
        <h1>${path.title}</h1>
        <p class="subtitle">${path.description}</p>

        <div class="path-info">
          <span>${path.duration_days} días</span>
          <span>${path.difficulty}</span>
          ${path.is_premium ? '<span class="premium">Premium</span>' : ''}
        </div>
      </div>

      <!-- User Progress (si está iniciado) -->
      ${userProgress ? `
        <div class="user-progress-summary">
          <h3>Tu Progreso</h3>
          <div class="progress-bar-large">
            <div class="progress" style="width: ${userProgress.completion_percentage}%">
              ${userProgress.completion_percentage}%
            </div>
          </div>
          <p>Día ${userProgress.current_day} de ${path.duration_days}</p>
          <p>Racha: ${userProgress.streak_days} días 🔥</p>
        </div>
      ` : ''}

      <!-- Objectives -->
      <div class="objectives">
        <h3>¿Qué lograrás?</h3>
        <ul>
          ${(path.objectives || []).map(obj => `<li>${obj}</li>`).join('')}
        </ul>
      </div>

      <!-- Curriculum (etapas por día) -->
      <div class="curriculum">
        <h3>Plan de ${path.duration_days} Días</h3>

        ${Object.keys(stagesByDay).sort((a, b) => a - b).map(day => {
          const dayStages = stagesByDay[day];
          const isCurrentDay = userProgress?.current_day === parseInt(day);
          const isPastDay = userProgress && userProgress.current_day > parseInt(day);

          return `
            <div class="day-section ${isCurrentDay ? 'current' : ''} ${isPastDay ? 'completed' : ''}">
              <h4>Día ${day}</h4>

              <div class="day-stages">
                ${dayStages.map(({ stage, progress }) => {
                  const isCompleted = progress?.status === 'completed';
                  const contentTypeIcons = {
                    reading: '📖',
                    meditation: '🧘',
                    exercise: '💪',
                    quiz: '📝',
                    reflection: '💭',
                    video: '🎥',
                    mixed: '🔄'
                  };

                  return `
                    <div class="stage-card ${isCompleted ? 'completed' : ''}">
                      <div class="stage-header">
                        <span class="icon">${contentTypeIcons[stage.content_type] || '📄'}</span>
                        <h5>${stage.title}</h5>
                        ${isCompleted ? '<span class="checkmark">✓</span>' : ''}
                      </div>

                      <p>${stage.description}</p>

                      <div class="stage-meta">
                        <span>${stage.duration_minutes} min</span>
                        <span>${stage.content_type}</span>
                        ${stage.is_optional ? '<span class="optional">Opcional</span>' : ''}
                      </div>

                      ${progress?.notes ? `
                        <div class="user-notes">
                          <em>"${progress.notes}"</em>
                          ${progress.rating ? `<span>${'⭐'.repeat(progress.rating)}</span>` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Action Button -->
      <div class="action-buttons">
        ${!userProgress ? `
          <button class="btn-primary" onclick="startPath('${path.slug}')">
            Comenzar Jornada
          </button>
        ` : userProgress.status === 'in_progress' ? `
          <button class="btn-primary" onclick="continuePath('${path.slug}')">
            Continuar
          </button>
          <button class="btn-secondary" onclick="pausePath('${path.slug}')">
            Pausar
          </button>
        ` : userProgress.status === 'paused' ? `
          <button class="btn-primary" onclick="resumePath('${path.slug}')">
            Reanudar
          </button>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('content').innerHTML = detailHTML;
}

// ============================================================================
// EJEMPLO 4: Viewer de Etapa Actual
// ============================================================================

async function renderCurrentStage(pathSlug) {
  const service = window.learningPathService;

  // Obtener siguiente etapa
  const stage = await service.getNextStage(pathSlug);

  if (!stage) {
    console.log('No hay etapas pendientes');
    return;
  }

  // Obtener progreso del path
  const userProgress = await service.getUserProgress(pathSlug);

  const stageHTML = `
    <div class="stage-viewer">
      <!-- Header -->
      <div class="stage-header-banner">
        <p class="day-label">Día ${stage.day_number}</p>
        <h2>${stage.title}</h2>
        <p class="description">${stage.description}</p>
        <p class="duration">⏱️ ${stage.duration_minutes} minutos</p>
      </div>

      <!-- Content Area -->
      <div class="stage-content">
        ${renderStageContent(stage)}
      </div>

      <!-- Completion Form -->
      <div class="completion-form">
        <h3>Reflexiona sobre esta etapa</h3>

        <textarea id="stage-notes" placeholder="¿Qué aprendiste? ¿Qué sentiste?"></textarea>

        <div class="rating">
          <p>Califica esta experiencia:</p>
          <div class="stars">
            ${[1, 2, 3, 4, 5].map(n => `
              <span class="star" data-rating="${n}" onclick="setRating(${n})">⭐</span>
            `).join('')}
          </div>
        </div>

        <button onclick="completeCurrentStage('${stage.id}')">
          Completar Etapa
        </button>
      </div>

      <!-- Progress Indicator -->
      <div class="path-progress-footer">
        <p>Progreso del Path: ${userProgress.completion_percentage}%</p>
        <p>Racha: ${userProgress.streak_days} días 🔥</p>
      </div>
    </div>
  `;

  document.getElementById('content').innerHTML = stageHTML;
}

function renderStageContent(stage) {
  const ref = stage.content_reference;

  switch (stage.content_type) {
    case 'reading':
      return `
        <div class="reading-stage">
          <p>Lee el capítulo: <strong>${ref.chapterId}</strong> del libro <strong>${ref.bookId}</strong></p>
          <button onclick="openBook('${ref.bookId}', '${ref.chapterId}')">
            Abrir Lectura
          </button>
        </div>
      `;

    case 'meditation':
      return `
        <div class="meditation-stage">
          <h4>Meditación Guiada</h4>
          <p>${ref.instructions || ''}</p>
          <button onclick="startMeditation(${stage.duration_minutes})">
            Comenzar Meditación (${stage.duration_minutes} min)
          </button>
        </div>
      `;

    case 'exercise':
      return `
        <div class="exercise-stage">
          <h4>Ejercicio Práctico</h4>
          <p>${ref.instructions || ''}</p>
          ${ref.checkpoints ? `
            <ul>
              ${ref.checkpoints.map(cp => `<li>${cp}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;

    case 'reflection':
      return `
        <div class="reflection-stage">
          <h4>Preguntas para Reflexionar</h4>
          ${(ref.questions || []).map((q, i) => `
            <div class="reflection-question">
              <p><strong>${q}</strong></p>
              <textarea id="reflection-${i}" placeholder="Tu reflexión..."></textarea>
            </div>
          `).join('')}
        </div>
      `;

    default:
      return `<p>Contenido de tipo: ${stage.content_type}</p>`;
  }
}

// ============================================================================
// EJEMPLO 5: Event Listeners para Integración
// ============================================================================

function setupLearningPathEvents() {
  const eventBus = window.eventBus;

  // Celebrar cuando se completa una etapa
  eventBus.on('learningPath.stage.completed', (data) => {
    showToast(`✅ Completaste: ${data.stageTitle}`, 'success');

    // Actualizar UI si está visible
    updatePathProgressUI(data.pathSlug);
  });

  // Mostrar modal cuando se completa un día
  eventBus.on('learningPath.day.completed', (data) => {
    showDayCompletionModal({
      dayNumber: data.dayNumber,
      pathTitle: data.pathTitle,
      onContinue: () => {
        // Preguntar si quiere avanzar al siguiente día
        advanceToNextDayPrompt(data.pathSlug);
      }
    });
  });

  // Actualizar badge de racha
  eventBus.on('learningPath.streak.updated', (data) => {
    updateStreakBadge(data.streakDays);

    // Celebrar hitos
    if (data.streakDays === 7) {
      showAchievement('¡7 días seguidos! 🔥');
    } else if (data.streakDays === 21) {
      showAchievement('¡21 días seguidos! ⭐ ¡Increíble!');
    } else if (data.streakDays > data.longestStreak) {
      showAchievement('¡Nueva mejor racha personal! 🏆');
    }
  });

  // Celebración especial al completar path
  eventBus.on('learningPath.completed', (data) => {
    showPathCompletionCelebration({
      pathTitle: data.pathTitle,
      durationDays: data.durationDays,
      onClose: () => {
        // Sugerir siguiente path
        suggestNextPath();
      }
    });
  });

  // Notificación cuando se inicia un path
  eventBus.on('learningPath.started', (data) => {
    showToast(`¡Comenzaste: ${data.pathTitle}!`, 'info');
  });
}

// ============================================================================
// EJEMPLO 6: Funciones de Acción
// ============================================================================

async function startPath(pathSlug) {
  const service = window.learningPathService;

  const result = await service.startPath(pathSlug);

  if (result) {
    // Redirigir a la primera etapa
    continuePath(pathSlug);
  } else {
    showToast('Error al iniciar el path', 'error');
  }
}

async function continuePath(pathSlug) {
  const service = window.learningPathService;

  const nextStage = await service.getNextStage(pathSlug);

  if (nextStage) {
    // Mostrar la etapa
    renderCurrentStage(pathSlug);
  } else {
    // No hay más etapas, verificar si avanzar día
    const advanced = await service.advanceToNextDay(pathSlug);

    if (advanced) {
      showToast('¡Día completado! Avanzando al siguiente...', 'success');
      setTimeout(() => continuePath(pathSlug), 1000);
    } else {
      showToast('¡Felicidades! Completaste todo el path', 'success');
    }
  }
}

async function completeCurrentStage(stageId) {
  const service = window.learningPathService;

  // Obtener datos del formulario
  const notes = document.getElementById('stage-notes')?.value || null;
  const rating = parseInt(document.querySelector('.star.selected')?.dataset.rating || '0');

  // Obtener reflexiones si existen
  const reflectionInputs = document.querySelectorAll('[id^="reflection-"]');
  const reflections = Array.from(reflectionInputs).map((input, i) => ({
    question: input.parentElement.querySelector('strong')?.textContent,
    answer: input.value
  })).filter(r => r.answer);

  const success = await service.completeStage(stageId, {
    notes,
    rating: rating > 0 ? rating : null,
    reflections: reflections.length > 0 ? reflections : null
  });

  if (success) {
    showToast('¡Etapa completada!', 'success');

    // Esperar un momento y continuar al siguiente
    setTimeout(() => {
      const pathSlug = new URLSearchParams(window.location.search).get('path');
      continuePath(pathSlug);
    }, 1500);
  }
}

function setRating(rating) {
  document.querySelectorAll('.star').forEach((star, i) => {
    if (i < rating) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });
}

async function pausePath(pathSlug) {
  const service = window.learningPathService;
  await service.pausePath(pathSlug);
  showToast('Path pausado', 'info');
}

async function resumePath(pathSlug) {
  const service = window.learningPathService;
  await service.resumePath(pathSlug);
  showToast('Path reanudado', 'success');
  continuePath(pathSlug);
}

// ============================================================================
// EJEMPLO 7: Widget de Racha en Sidebar
// ============================================================================

async function renderStreakWidget() {
  const service = window.learningPathService;
  const stats = await service.getUserStats();

  const widgetHTML = `
    <div class="streak-widget">
      <h4>Tu Racha 🔥</h4>
      <div class="streak-number">${stats.current_streak || 0}</div>
      <p>días consecutivos</p>

      ${stats.longest_streak > 0 ? `
        <p class="record">Récord: ${stats.longest_streak} días</p>
      ` : ''}

      <div class="streak-calendar">
        ${renderStreakCalendar(stats.current_streak)}
      </div>
    </div>
  `;

  document.getElementById('sidebar-widget').innerHTML = widgetHTML;
}

function renderStreakCalendar(streakDays) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const isActive = i < streakDays;
    return `<div class="day ${isActive ? 'active' : ''}"></div>`;
  });

  return days.join('');
}

// ============================================================================
// UTILIDADES
// ============================================================================

function showToast(message, type = 'info') {
  // Implementar sistema de toasts
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function showDayCompletionModal(options) {
  // Implementar modal de celebración de día
  console.log('Día completado:', options);
}

function showPathCompletionCelebration(options) {
  // Implementar celebración de path completo
  console.log('Path completado:', options);
}

function showAchievement(message) {
  // Implementar sistema de logros
  console.log('Logro desbloqueado:', message);
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// Inicializar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
  setupLearningPathEvents();

  // Si hay un path activo, mostrar widget
  renderStreakWidget();
});

console.log('Learning Paths - Ejemplos de uso cargados');
