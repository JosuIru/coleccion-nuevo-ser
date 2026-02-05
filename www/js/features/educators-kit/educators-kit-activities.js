/**
 * Educators Kit Activities - Actividades por edad
 * Gestiona el filtrado y renderizado de actividades educativas
 * @version 1.0.0
 */

class EducatorsKitActivities {
  constructor(educatorsKit) {
    this.educatorsKit = educatorsKit;
  }

  /**
   * Configura los event listeners para actividades
   */
  setupEventListeners() {
    // Tabs de edad
    const ageTabs = document.querySelectorAll('.age-tab');
    ageTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const age = e.target.dataset.age;
        this.setAgeFilter(age);
      });
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.educatorsKit.viewerModal?.classList.contains('active')) {
        this.educatorsKit.viewerModule.closeViewer();
      }
    });
  }

  /**
   * Establece el filtro de edad y renderiza actividades
   */
  setAgeFilter(age) {
    this.educatorsKit.currentAgeFilter = age;

    // Actualizar tabs activos
    const tabs = document.querySelectorAll('.age-tab');
    tabs.forEach(tab => {
      if (tab.dataset.age === age) {
        tab.classList.add('active', 'bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/30');
        tab.classList.remove('bg-slate-800', 'text-gray-400', 'border-slate-700');
      } else {
        tab.classList.remove('active', 'bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/30');
        tab.classList.add('bg-slate-800', 'text-gray-400', 'border-slate-700');
      }
    });

    this.renderActivities(age);
  }

  /**
   * Renderiza las actividades filtradas por edad
   */
  renderActivities(age) {
    const container = document.getElementById('activities-grid');
    if (!container) return;

    const filteredActivities = this.educatorsKit.activities.filter(act => act.targetAge === age);

    if (filteredActivities.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-500">
          <p>No hay actividades disponibles para este grupo de edad todavia.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredActivities.map(activity => this.renderActivityCard(activity)).join('');
  }

  /**
   * Renderiza una tarjeta de actividad
   */
  renderActivityCard(activity) {
    const colorMap = {
      emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', hoverBorder: 'hover:border-emerald-500/50' },
      amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', hoverBorder: 'hover:border-amber-500/50' },
      green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', hoverBorder: 'hover:border-green-500/50' },
      teal: { bg: 'bg-teal-500/20', border: 'border-teal-500/30', text: 'text-teal-400', hoverBorder: 'hover:border-teal-500/50' },
      blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', hoverBorder: 'hover:border-blue-500/50' },
      purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', hoverBorder: 'hover:border-purple-500/50' },
      indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', hoverBorder: 'hover:border-indigo-500/50' },
      yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', hoverBorder: 'hover:border-yellow-500/50' },
      red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', hoverBorder: 'hover:border-red-500/50' },
      cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', hoverBorder: 'hover:border-cyan-500/50' },
      orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', hoverBorder: 'hover:border-orange-500/50' },
      pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400', hoverBorder: 'hover:border-pink-500/50' },
      slate: { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-400', hoverBorder: 'hover:border-slate-500/50' }
    };

    const colors = colorMap[activity.color] || colorMap.emerald;

    const difficultyBadge = {
      'basico': 'bg-green-500/20 text-green-300 border-green-500/30',
      'intermedio': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'avanzado': 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    const hasContent = activity.hasContent && this.educatorsKit.content?.activities?.[activity.id];

    return `
      <div class="activity-card bg-slate-800/50 rounded-xl border border-slate-700/50 ${colors.hoverBorder} transition-all p-6 flex flex-col">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg ${colors.bg} ${colors.border} text-2xl">
              ${activity.icon}
            </div>
            <div>
              <h4 class="font-semibold text-white">${activity.title}</h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-500">${activity.duration}</span>
                <span class="px-2 py-0.5 text-xs rounded-full border ${difficultyBadge[activity.difficulty]}">${activity.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-gray-400 text-sm mb-4 flex-grow">${activity.description}</p>

        <!-- Objectives -->
        <div class="mb-4">
          <p class="text-xs text-gray-500 mb-2">Objetivos:</p>
          <div class="flex flex-wrap gap-1">
            ${activity.objectives.slice(0, 3).map(obj => `
              <span class="px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-gray-400">${obj}</span>
            `).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          ${hasContent ? `
            <button
              onclick="window.educatorsKit?.viewActivity('${activity.id}')"
              class="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Ver
            </button>
          ` : ''}
          <button
            onclick="window.educatorsKit?.downloadActivity('${activity.id}')"
            class="${hasContent ? 'flex-1' : 'w-full'} px-4 py-2.5 ${colors.bg} hover:opacity-80 border ${colors.border} rounded-lg ${colors.text} text-sm font-medium transition-all flex items-center justify-center gap-2"
            ${!hasContent ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            ${hasContent ? 'PDF' : 'Proximamente'}
          </button>
        </div>
      </div>
    `;
  }

  destroy() {
    // Cleanup si es necesario
  }
}

// Exportar globalmente
window.EducatorsKitActivities = EducatorsKitActivities;
