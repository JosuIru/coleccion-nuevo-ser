/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * FRANKENSTEIN BEING CARD - Ficha de Ser Mejorada v2.0
 * Muestra información completa del ser: nivel, energía, turnos, tiempo, predicciones
 *
 * @version 2.0.0 - Mejoras de jugabilidad y visualización
 */

class FrankensteinBeingCard {
  constructor() {
    this.container = null;
    this.currentBeing = null;
    this.missionsSystem = null;
    this.updateInterval = null;
    this.missionStartTime = null;
    this.turnDurationMs = 3 * 60 * 1000; // 3 minutos por turno por defecto
  }

  init(containerId = 'being-card-container') {
    this.container = document.getElementById(containerId);
    this.missionsSystem = window.frankensteinMissions;

    if (!this.container) {
      logger.warn('Being card container not found:', containerId);
      return;
    }

    // Actualizar cada 30 segundos para mejor feedback temporal
    this.updateInterval = setInterval(() => {
      if (this.currentBeing) {
        this.missionsSystem?.updateBeingEnergy(this.currentBeing);
        this.render(this.currentBeing);
      }
    }, 30000);

    logger.debug('FrankensteinBeingCard v2.0 initialized');
  }

  /**
   * Calcular tiempo estimado de misión
   */
  calculateTimeEstimates(being) {
    const turnsRemaining = being.turnsRemaining || 0;
    const turnsTotal = being.turnsTotal || 0;
    const turnsCompleted = turnsTotal - turnsRemaining;

    // Tiempo por turno según dificultad (en minutos)
    const timePerTurnByDifficulty = {
      facil: 2,
      intermedio: 3,
      avanzado: 4,
      experto: 5
    };

    const mission = this.missionsSystem?.missions?.find(m => m.id === being.currentMission);
    const minutesPerTurn = timePerTurnByDifficulty[mission?.difficulty] || 3;

    const estimatedMinutesRemaining = turnsRemaining * minutesPerTurn;
    const estimatedMinutesTotal = turnsTotal * minutesPerTurn;

    return {
      turnsRemaining,
      turnsTotal,
      turnsCompleted,
      minutesPerTurn,
      estimatedMinutesRemaining,
      estimatedMinutesTotal,
      estimatedCompletionTime: this.formatTimeRemaining(estimatedMinutesRemaining),
      progressPercent: turnsTotal > 0 ? Math.round((turnsCompleted / turnsTotal) * 100) : 0,
      isUrgent: turnsRemaining <= 3 && turnsRemaining > 0,
      isCritical: turnsRemaining === 1
    };
  }

  /**
   * Formatear tiempo restante
   */
  formatTimeRemaining(minutes) {
    if (minutes <= 0) return 'Completado';
    if (minutes < 60) return `~${Math.ceil(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);
    if (hours < 24) {
      return remainingMinutes > 0 ? `~${hours}h ${remainingMinutes}m` : `~${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `~${days}d ${remainingHours}h`;
  }

  /**
   * Calcular tiempo hasta recuperación completa de energía
   */
  calculateEnergyRecoveryTime(being) {
    const energyNeeded = (being.maxEnergy || 100) - (being.energy || 0);
    if (energyNeeded <= 0) return { text: 'Energía completa', minutes: 0 };

    const recoveryRate = 10; // 10 energía por hora
    const minutesNeeded = (energyNeeded / recoveryRate) * 60;

    return {
      text: this.formatTimeRemaining(minutesNeeded),
      minutes: minutesNeeded,
      energyNeeded
    };
  }

  /**
   * Predecir viabilidad para todas las misiones
   */
  predictMissionViability(being) {
    if (!this.missionsSystem?.missions) return [];

    return this.missionsSystem.missions.map(mission => {
      const validation = this.missionsSystem.validateBeingForMission(being, mission);
      const energyCost = this.missionsSystem.progressionConfig?.energyCostPerMission?.[mission.difficulty] || 25;
      const hasEnergy = (being.energy || 0) >= energyCost;

      return {
        missionId: mission.id,
        missionName: mission.name,
        missionIcon: mission.icon,
        difficulty: mission.difficulty,
        viabilityScore: validation.percentage,
        isViable: validation.viable && hasEnergy,
        grade: validation.grade,
        missingAttributes: validation.missingAttributes,
        strengths: validation.strengths,
        energyCost,
        hasEnergy,
        recommendation: this.getRecommendation(validation, hasEnergy)
      };
    }).sort((a, b) => b.viabilityScore - a.viabilityScore);
  }

  /**
   * Obtener recomendación para misión
   */
  getRecommendation(validation, hasEnergy) {
    if (!hasEnergy) return { text: 'Sin energía', color: 'text-red-400', icon: '⚡' };
    if (!validation.viable) return { text: 'No viable', color: 'text-red-400', icon: '❌' };
    if (validation.percentage >= 95) return { text: 'Ideal', color: 'text-green-400', icon: '⭐' };
    if (validation.percentage >= 80) return { text: 'Excelente', color: 'text-green-400', icon: '✅' };
    if (validation.percentage >= 65) return { text: 'Bueno', color: 'text-cyan-400', icon: '👍' };
    if (validation.percentage >= 50) return { text: 'Desafiante', color: 'text-yellow-400', icon: '⚠️' };
    return { text: 'Difícil', color: 'text-orange-400', icon: '🔥' };
  }

  /**
   * Renderizar ficha del ser - v2.0 con información temporal mejorada
   */
  render(being) {
    if (!being || !this.container) return;

    this.currentBeing = being;

    // Obtener estado actualizado
    const status = this.missionsSystem?.getBeingStatus(being) || this.getBasicStatus(being);
    const timeEstimates = this.calculateTimeEstimates(being);
    const energyRecovery = this.calculateEnergyRecoveryTime(being);
    const specialty = this.detectSpecialty(being);
    const topMissions = this.predictMissionViability(being).slice(0, 3);

    this.container.innerHTML = `
      <div class="being-card bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-slate-600/50 p-4 shadow-xl">

        <!-- Header: Avatar + Nombre + Nivel + Especialidad -->
        <div class="being-card-header flex items-center gap-4 mb-4 pb-4 border-b border-slate-700/50">
          <div class="being-avatar-wrapper relative">
            <div id="being-card-avatar" class="w-16 h-16 rounded-full bg-gradient-to-br ${specialty.gradient} flex items-center justify-center text-3xl border-2 ${specialty.borderColor}">
              ${this.getAvatarContent(being)}
            </div>
            <div class="absolute -bottom-1 -right-1 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
              Nv.${status.level}
            </div>
            ${specialty.icon ? `
              <div class="absolute -top-1 -left-1 text-lg" title="${specialty.name}">${specialty.icon}</div>
            ` : ''}
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-white truncate">${this.escapeHtml(being.name)}</h3>
            <div class="flex items-center gap-2 text-sm flex-wrap">
              <span class="text-slate-400">Gen ${being.generation || 1}</span>
              <span class="${specialty.textColor} text-xs">${specialty.name}</span>
              ${status.traits?.length > 0 ? `
                <span class="text-amber-400">${status.traits.slice(0, 3).map(t => this.getTraitIcon(t)).join('')}</span>
              ` : ''}
            </div>
          </div>

          <div class="text-right">
            <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              ${Math.round(being.totalPower)}
            </div>
            <div class="text-xs text-slate-400">Poder Total</div>
          </div>
        </div>

        <!-- Barras de Progreso: XP y Energía con tiempos -->
        <div class="being-progress-bars space-y-3 mb-4">

          <!-- Barra de XP -->
          <div class="xp-bar">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-purple-400 font-medium">Experiencia</span>
              <span class="text-slate-400">${status.xp || 0} / ${status.xpToNextLevel || 100} XP</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                   style="width: ${status.xpProgress || 0}%"></div>
            </div>
          </div>

          <!-- Barra de Energía con tiempo de recuperación -->
          <div class="energy-bar">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-cyan-400 font-medium flex items-center gap-1">
                <span class="animate-pulse">&#x26A1;</span> Energía
              </span>
              <span class="text-slate-400">
                ${status.energy || 0} / ${status.maxEnergy || 100}
                ${energyRecovery.minutes > 0 ? `<span class="text-cyan-300 ml-1">(${energyRecovery.text})</span>` : ''}
              </span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full transition-all duration-500 ${this.getEnergyBarColor(status.energyPercent)}"
                   style="width: ${status.energyPercent || 0}%"></div>
            </div>
          </div>
        </div>

        <!-- Estado Actual con Tiempo Estimado -->
        <div class="being-status mb-4 p-3 rounded-lg ${this.getStatusBgClass(status.status)} ${timeEstimates.isUrgent ? 'animate-pulse' : ''} ${timeEstimates.isCritical ? 'ring-2 ring-red-500' : ''}">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">${this.getStatusIcon(status.status)}</span>
              <div>
                <div class="font-medium text-sm">${status.statusMessage || 'Sin estado'}</div>
                ${status.inMission ? `
                  <div class="text-xs text-slate-300 flex items-center gap-2">
                    <span>Turnos: ${timeEstimates.turnsRemaining}/${timeEstimates.turnsTotal}</span>
                    <span class="text-cyan-300">&#x23F1; ${timeEstimates.estimatedCompletionTime}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            ${status.inMission ? `
              <div class="text-right">
                <div class="text-2xl font-bold ${timeEstimates.isCritical ? 'text-red-400 animate-bounce' : timeEstimates.isUrgent ? 'text-yellow-400' : 'text-amber-400'}">
                  ${timeEstimates.turnsRemaining}
                </div>
                <div class="text-xs text-slate-400">turnos</div>
              </div>
            ` : ''}
          </div>

          ${status.inMission ? `
            <div class="mt-3">
              <!-- Barra de progreso mejorada -->
              <div class="relative h-3 bg-slate-600 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r ${timeEstimates.isCritical ? 'from-red-500 to-orange-500' : timeEstimates.isUrgent ? 'from-yellow-500 to-amber-500' : 'from-green-500 to-emerald-400'} transition-all"
                     style="width: ${timeEstimates.progressPercent}%"></div>
                <!-- Marcadores de turnos -->
                <div class="absolute inset-0 flex justify-between px-1">
                  ${Array.from({length: Math.min(timeEstimates.turnsTotal, 10)}, (_, i) => {
                    const position = ((i + 1) / timeEstimates.turnsTotal) * 100;
                    const isPassed = i < timeEstimates.turnsCompleted;
                    return `<div class="w-0.5 h-full ${isPassed ? 'bg-white/30' : 'bg-slate-500/30'}" style="margin-left: ${position - (100/timeEstimates.turnsTotal)}%"></div>`;
                  }).join('')}
                </div>
              </div>
              <div class="flex justify-between text-xs mt-1">
                <span class="text-slate-400">${timeEstimates.progressPercent}% completado</span>
                <span class="text-cyan-300">${timeEstimates.estimatedCompletionTime} restante</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Estadísticas Expandidas -->
        <div class="being-stats grid grid-cols-4 gap-2 mb-4">
          <div class="stat-item bg-slate-700/50 rounded-lg p-2 text-center">
            <div class="text-lg font-bold text-green-400">${status.missionsCompleted || 0}</div>
            <div class="text-xs text-slate-400">Misiones</div>
          </div>
          <div class="stat-item bg-slate-700/50 rounded-lg p-2 text-center">
            <div class="text-lg font-bold text-blue-400">${status.successRate || 0}%</div>
            <div class="text-xs text-slate-400">Éxito</div>
          </div>
          <div class="stat-item bg-slate-700/50 rounded-lg p-2 text-center">
            <div class="text-lg font-bold text-purple-400">${status.totalXp || 0}</div>
            <div class="text-xs text-slate-400">XP Total</div>
          </div>
          <div class="stat-item bg-slate-700/50 rounded-lg p-2 text-center">
            <div class="text-lg font-bold text-cyan-400">${being.stats?.totalTurnsPlayed || 0}</div>
            <div class="text-xs text-slate-400">Turnos</div>
          </div>
        </div>

        <!-- Misiones Recomendadas (solo si no está en misión) -->
        ${!status.inMission && topMissions.length > 0 ? `
          <div class="being-recommendations mb-4">
            <div class="text-xs text-slate-400 mb-2 flex justify-between items-center">
              <span>&#x1F3AF; Misiones Recomendadas</span>
              <button onclick="window.frankensteinBeingCard?.showAllMissionPredictions()"
                      class="text-cyan-400 hover:text-cyan-300 text-xs">Ver todas</button>
            </div>
            <div class="space-y-1">
              ${topMissions.map(m => `
                <div class="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                     onclick="window.frankensteinUI?.selectMission?.('${m.missionId}')">
                  <div class="flex items-center gap-2">
                    <span>${m.missionIcon}</span>
                    <span class="text-sm truncate max-w-32">${m.missionName}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs ${m.recommendation.color}">${m.recommendation.icon} ${m.viabilityScore}%</span>
                    <span class="text-xs px-1.5 py-0.5 rounded ${this.getDifficultyColor(m.difficulty)}">${m.difficulty}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Balance de Atributos (Mini) -->
        <div class="being-balance">
          <div class="text-xs text-slate-400 mb-2 flex justify-between">
            <span>Balance de Atributos</span>
            <span class="text-amber-400">${Math.round(being.balance?.harmony || 0)}% Armonía</span>
          </div>
          <div class="flex gap-1">
            ${this.renderBalanceBars(being.balance)}
          </div>
        </div>

        <!-- Rasgos (si tiene) -->
        ${being.traits?.length > 0 ? `
          <div class="being-traits mt-3 pt-3 border-t border-slate-700/50">
            <div class="text-xs text-slate-400 mb-2">Rasgos Desbloqueados</div>
            <div class="flex flex-wrap gap-1">
              ${being.traits.map(t => `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                  ${this.getTraitIcon(t)} ${this.getTraitName(t)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Afinidades del Ser -->
        ${being.affinities ? `
          <div class="being-affinities mt-3 pt-3 border-t border-slate-700/50">
            <div class="text-xs text-slate-400 mb-2">Afinidades</div>
            <div class="flex flex-wrap gap-1">
              ${(being.affinities.missions || []).slice(0, 3).map(m => `
                <span class="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                  ${this.missionsSystem?.missions?.find(x => x.id === m)?.icon || '🎯'} ${m}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Acciones Rápidas -->
        <div class="being-actions mt-4 pt-3 border-t border-slate-700/50 flex gap-2">
          <button onclick="window.frankensteinBeingCard?.showDetails()"
                  class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition flex items-center justify-center gap-1">
            <span>&#x1F50D;</span> Detalles
          </button>
          ${status.canStartMission ? `
            <button onclick="window.frankensteinUI?.showMissionSelector()"
                    class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition flex items-center justify-center gap-1">
              <span>&#x1F680;</span> Misión
            </button>
          ` : `
            <button disabled
                    class="flex-1 px-3 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm cursor-not-allowed flex items-center justify-center gap-1">
              <span>&#x23F3;</span> ${status.status === 'deployed' ? 'En misión' : 'Recuperando'}
            </button>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Detectar especialidad del ser basada en sus atributos
   */
  detectSpecialty(being) {
    const balance = being.balance || {};
    const categories = [
      { key: 'intellectual', name: 'Pensador', icon: '🧠', gradient: 'from-blue-500/30 to-indigo-500/30', borderColor: 'border-blue-400/50', textColor: 'text-blue-400' },
      { key: 'emotional', name: 'Empático', icon: '❤️', gradient: 'from-red-500/30 to-pink-500/30', borderColor: 'border-red-400/50', textColor: 'text-red-400' },
      { key: 'action', name: 'Activista', icon: '⚡', gradient: 'from-green-500/30 to-emerald-500/30', borderColor: 'border-green-400/50', textColor: 'text-green-400' },
      { key: 'spiritual', name: 'Contemplativo', icon: '🌟', gradient: 'from-purple-500/30 to-violet-500/30', borderColor: 'border-purple-400/50', textColor: 'text-purple-400' },
      { key: 'practical', name: 'Práctico', icon: '🔧', gradient: 'from-slate-500/30 to-zinc-500/30', borderColor: 'border-slate-400/50', textColor: 'text-slate-400' }
    ];

    // Encontrar la categoría dominante
    let dominant = categories[0];
    let maxValue = 0;
    let isBalanced = true;
    const values = [];

    categories.forEach(cat => {
      const value = balance[cat.key] || 0;
      values.push(value);
      if (value > maxValue) {
        maxValue = value;
        dominant = cat;
      }
    });

    // Verificar si está balanceado (diferencia menor al 20%)
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    isBalanced = values.every(v => Math.abs(v - avg) / avg < 0.2);

    if (isBalanced) {
      return {
        key: 'balanced',
        name: 'Equilibrado',
        icon: '☯️',
        gradient: 'from-amber-500/30 to-yellow-500/30',
        borderColor: 'border-amber-400/50',
        textColor: 'text-amber-400'
      };
    }

    return dominant;
  }

  /**
   * Obtener color de dificultad
   */
  getDifficultyColor(difficulty) {
    const colors = {
      facil: 'bg-green-500/20 text-green-300',
      intermedio: 'bg-yellow-500/20 text-yellow-300',
      avanzado: 'bg-orange-500/20 text-orange-300',
      experto: 'bg-red-500/20 text-red-300'
    };
    return colors[difficulty] || 'bg-slate-500/20 text-slate-300';
  }

  /**
   * Mostrar todas las predicciones de misiones
   */
  showAllMissionPredictions() {
    if (!this.currentBeing) return;

    const predictions = this.predictMissionViability(this.currentBeing);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.id = 'mission-predictions-modal';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-2xl border border-slate-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">🎯 Predicción de Misiones</h2>
          <button onclick="document.getElementById('mission-predictions-modal')?.remove()"
                  class="p-2 hover:bg-slate-700 rounded-lg transition">✕</button>
        </div>
        <div class="p-4 space-y-2">
          ${predictions.map(p => `
            <div class="flex items-center justify-between p-3 rounded-lg ${p.isViable ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-800/30 opacity-75'} transition cursor-pointer"
                 onclick="${p.isViable ? `window.frankensteinUI?.selectMission?.('${p.missionId}'); document.getElementById('mission-predictions-modal')?.remove()` : ''}">
              <div class="flex items-center gap-3">
                <span class="text-2xl">${p.missionIcon}</span>
                <div>
                  <div class="font-medium">${p.missionName}</div>
                  <div class="text-xs text-slate-400 flex items-center gap-2">
                    <span class="${this.getDifficultyColor(p.difficulty)} px-1.5 py-0.5 rounded">${p.difficulty}</span>
                    <span>⚡ ${p.energyCost} energía</span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold ${p.recommendation.color}">${p.viabilityScore}%</div>
                <div class="text-xs ${p.recommendation.color}">${p.recommendation.icon} ${p.recommendation.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  /**
   * Renderizar modal de detalles completo
   */
  showDetails() {
    if (!this.currentBeing) return;

    const being = this.currentBeing;
    const status = this.missionsSystem?.getBeingStatus(being) || {};

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.id = 'being-details-modal';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-2xl border border-slate-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        <!-- Header -->
        <div class="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">Ficha de ${this.escapeHtml(being.name)}</h2>
          <button onclick="document.getElementById('being-details-modal')?.remove()"
                  class="p-2 hover:bg-slate-700 rounded-lg transition">
            &#x2715;
          </button>
        </div>

        <div class="p-6 space-y-6">

          <!-- Información Principal -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-800/50 rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Nivel</div>
              <div class="text-3xl font-bold text-amber-400">${being.level || 1}</div>
            </div>
            <div class="bg-slate-800/50 rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Generación</div>
              <div class="text-3xl font-bold text-purple-400">${being.generation || 1}</div>
            </div>
            <div class="bg-slate-800/50 rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Poder Total</div>
              <div class="text-3xl font-bold text-cyan-400">${Math.round(being.totalPower)}</div>
            </div>
            <div class="bg-slate-800/50 rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Piezas</div>
              <div class="text-3xl font-bold text-green-400">${being.pieces?.length || 0}</div>
            </div>
          </div>

          <!-- Experiencia -->
          <div class="bg-slate-800/50 rounded-xl p-4">
            <div class="flex justify-between mb-2">
              <span class="text-slate-400">Experiencia</span>
              <span class="text-purple-400 font-medium">${being.xp || 0} / ${being.xpToNextLevel || 100} XP</span>
            </div>
            <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                   style="width: ${status.xpProgress || 0}%"></div>
            </div>
            <div class="text-xs text-slate-500 mt-1">XP total ganada: ${being.stats?.totalXpEarned || 0}</div>
          </div>

          <!-- Energía -->
          <div class="bg-slate-800/50 rounded-xl p-4">
            <div class="flex justify-between mb-2">
              <span class="text-slate-400">Energía</span>
              <span class="text-cyan-400 font-medium">${being.energy || 0} / ${being.maxEnergy || 100}</span>
            </div>
            <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full ${this.getEnergyBarColor(status.energyPercent)}"
                   style="width: ${status.energyPercent || 0}%"></div>
            </div>
            <div class="text-xs text-slate-500 mt-1">Recupera 10 energía por hora</div>
          </div>

          <!-- Estadísticas de Misiones -->
          <div class="bg-slate-800/50 rounded-xl p-4">
            <h3 class="font-bold mb-3">Historial de Misiones</h3>
            <div class="grid grid-cols-4 gap-3 text-center">
              <div>
                <div class="text-2xl font-bold text-white">${being.stats?.missionsCompleted || 0}</div>
                <div class="text-xs text-slate-400">Completadas</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-400">${being.stats?.missionsSuccess || 0}</div>
                <div class="text-xs text-slate-400">Éxitos</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-red-400">${being.stats?.missionsFailed || 0}</div>
                <div class="text-xs text-slate-400">Fallidas</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-blue-400">${status.successRate || 0}%</div>
                <div class="text-xs text-slate-400">Tasa Éxito</div>
              </div>
            </div>
          </div>

          <!-- Atributos Detallados -->
          <div class="bg-slate-800/50 rounded-xl p-4">
            <h3 class="font-bold mb-3">Atributos</h3>
            <div class="grid grid-cols-2 gap-2">
              ${Object.entries(being.attributes || {}).map(([attr, value]) => `
                <div class="flex items-center justify-between py-1 px-2 bg-slate-700/30 rounded">
                  <span class="text-sm">
                    ${this.getAttributeIcon(attr)} ${this.getAttributeName(attr)}
                  </span>
                  <span class="font-mono font-bold text-sm ${value >= 50 ? 'text-green-400' : value >= 25 ? 'text-yellow-400' : 'text-slate-400'}">
                    ${Math.round(value)}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Balance -->
          <div class="bg-slate-800/50 rounded-xl p-4">
            <h3 class="font-bold mb-3">Balance</h3>
            <div class="space-y-2">
              ${this.renderDetailedBalance(being.balance)}
            </div>
            <div class="mt-3 pt-3 border-t border-slate-700 text-center">
              <span class="text-slate-400">Armonía:</span>
              <span class="text-amber-400 font-bold text-lg ml-2">${Math.round(being.balance?.harmony || 0)}%</span>
            </div>
          </div>

          <!-- Rasgos -->
          ${being.traits?.length > 0 ? `
            <div class="bg-slate-800/50 rounded-xl p-4">
              <h3 class="font-bold mb-3">Rasgos Desbloqueados</h3>
              <div class="flex flex-wrap gap-2">
                ${being.traits.map(t => `
                  <div class="px-3 py-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                    <span class="text-xl mr-2">${this.getTraitIcon(t)}</span>
                    <span class="text-amber-300 font-medium">${this.getTraitName(t)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Componentes -->
          <div class="bg-slate-800/50 rounded-xl p-4">
            <h3 class="font-bold mb-3">Piezas que lo componen (${being.pieces?.length || 0})</h3>
            <div class="max-h-40 overflow-y-auto space-y-1">
              ${(being.pieces || []).map(p => `
                <div class="text-sm py-1 px-2 bg-slate-700/30 rounded flex items-center gap-2">
                  <span>${this.getPieceIcon(p.type)}</span>
                  <span class="truncate flex-1">${this.escapeHtml(p.title || p.id)}</span>
                  <span class="text-xs text-slate-400">${p.type}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Fecha de Creación -->
          <div class="text-center text-sm text-slate-500">
            Creado el ${new Date(being.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 🔧 FIX v2.9.271: Cleanup ESC handler in all close paths
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        modal.remove();
      }
    };
    document.addEventListener('keydown', escHandler);

    // Cerrar al hacer clic fuera - also cleanup ESC handler
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.removeEventListener('keydown', escHandler);
        modal.remove();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  getBasicStatus(being) {
    return {
      level: being.level || 1,
      xp: being.xp || 0,
      xpToNextLevel: being.xpToNextLevel || 100,
      xpProgress: Math.round(((being.xp || 0) / (being.xpToNextLevel || 100)) * 100),
      energy: being.energy || 100,
      maxEnergy: being.maxEnergy || 100,
      energyPercent: Math.round(((being.energy || 100) / (being.maxEnergy || 100)) * 100),
      status: being.status || 'idle',
      statusMessage: being.statusMessage || 'Listo',
      canStartMission: being.status === 'idle',
      inMission: being.status === 'deployed',
      turnsRemaining: being.turnsRemaining || 0,
      turnsTotal: being.turnsTotal || 0,
      missionProgress: 0,
      missionsCompleted: being.stats?.missionsCompleted || 0,
      successRate: 0,
      totalXp: being.stats?.totalXpEarned || 0,
      traits: being.traits || []
    };
  }

  getAvatarContent(being) {
    // Si hay avatar system, usar su contenido
    if (window.avatarSystem && being) {
      return '';
    }
    // Fallback: emoji basado en balance dominante
    const balance = being.balance || {};
    const dominant = Object.entries(balance)
      .filter(([k]) => !['total', 'harmony'].includes(k))
      .sort((a, b) => b[1] - a[1])[0];

    const icons = {
      intellectual: '&#x1F9E0;',
      emotional: '&#x2764;',
      action: '&#x26A1;',
      spiritual: '&#x1F31F;',
      practical: '&#x1F527;'
    };
    return icons[dominant?.[0]] || '&#x1F464;';
  }

  getStatusIcon(status) {
    const icons = {
      idle: '&#x2705;',
      deployed: '&#x1F680;',
      recovering: '&#x1F4A4;',
      exhausted: '&#x1F6AB;'
    };
    return icons[status] || '&#x2753;';
  }

  getStatusBgClass(status) {
    const classes = {
      idle: 'bg-green-900/30 border border-green-700/50',
      deployed: 'bg-blue-900/30 border border-blue-700/50',
      recovering: 'bg-yellow-900/30 border border-yellow-700/50',
      exhausted: 'bg-red-900/30 border border-red-700/50'
    };
    return classes[status] || 'bg-slate-800/30';
  }

  getEnergyBarColor(percent) {
    if (percent >= 60) return 'bg-gradient-to-r from-cyan-500 to-green-500';
    if (percent >= 30) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-red-500 to-orange-500';
  }

  getTraitIcon(traitId) {
    const icons = {
      novice: '&#x1F331;',
      experienced: '&#x2B50;',
      veteran: '&#x1F396;',
      brave: '&#x1F981;',
      master: '&#x1F451;',
      reliable: '&#x1F3AF;'
    };
    return icons[traitId] || '&#x1F3C5;';
  }

  getTraitName(traitId) {
    const names = {
      novice: 'Novato',
      experienced: 'Experimentado',
      veteran: 'Veterano',
      brave: 'Valiente',
      master: 'Maestro',
      reliable: 'Confiable'
    };
    return names[traitId] || traitId;
  }

  getAttributeIcon(attr) {
    const icons = {
      reflection: '&#x1F9E0;',
      analysis: '&#x1F50D;',
      creativity: '&#x1F3A8;',
      empathy: '&#x2764;',
      communication: '&#x1F5E3;',
      leadership: '&#x1F451;',
      action: '&#x26A1;',
      resilience: '&#x1F4AA;',
      strategy: '&#x265F;',
      consciousness: '&#x1F31F;',
      connection: '&#x1F30D;',
      wisdom: '&#x1F4FF;',
      organization: '&#x1F4CB;',
      collaboration: '&#x1F91D;',
      technical: '&#x1F527;'
    };
    return icons[attr] || '&#x2753;';
  }

  getAttributeName(attr) {
    const names = {
      reflection: 'Reflexión',
      analysis: 'Análisis',
      creativity: 'Creatividad',
      empathy: 'Empatía',
      communication: 'Comunicación',
      leadership: 'Liderazgo',
      action: 'Acción',
      resilience: 'Resiliencia',
      strategy: 'Estrategia',
      consciousness: 'Consciencia',
      connection: 'Conexión',
      wisdom: 'Sabiduría',
      organization: 'Organización',
      collaboration: 'Colaboración',
      technical: 'Técnica'
    };
    return names[attr] || attr;
  }

  getPieceIcon(type) {
    const icons = {
      chapter: '&#x1F4D6;',
      exercise: '&#x1F3CB;',
      resource: '&#x1F4E6;'
    };
    return icons[type] || '&#x1F4CC;';
  }

  renderBalanceBars(balance) {
    if (!balance) return '';

    const categories = [
      { key: 'intellectual', label: 'Int', color: 'bg-blue-500' },
      { key: 'emotional', label: 'Emo', color: 'bg-red-500' },
      { key: 'action', label: 'Acc', color: 'bg-green-500' },
      { key: 'spiritual', label: 'Esp', color: 'bg-purple-500' },
      { key: 'practical', label: 'Pra', color: 'bg-slate-500' }
    ];

    const maxVal = Math.max(...categories.map(c => balance[c.key] || 0), 1);

    return categories.map(cat => {
      const value = balance[cat.key] || 0;
      const height = Math.round((value / maxVal) * 100);
      return `
        <div class="flex-1 flex flex-col items-center">
          <div class="w-full h-12 bg-slate-700 rounded relative overflow-hidden">
            <div class="${cat.color} absolute bottom-0 w-full transition-all" style="height: ${height}%"></div>
          </div>
          <span class="text-xs text-slate-400 mt-1">${cat.label}</span>
        </div>
      `;
    }).join('');
  }

  renderDetailedBalance(balance) {
    if (!balance) return '';

    const categories = [
      { key: 'intellectual', label: 'Intelectual', color: 'from-blue-500 to-blue-600' },
      { key: 'emotional', label: 'Emocional', color: 'from-red-500 to-pink-500' },
      { key: 'action', label: 'Acción', color: 'from-green-500 to-emerald-500' },
      { key: 'spiritual', label: 'Espiritual', color: 'from-purple-500 to-violet-500' },
      { key: 'practical', label: 'Práctico', color: 'from-slate-500 to-slate-600' }
    ];

    const maxVal = Math.max(...categories.map(c => balance[c.key] || 0), 1);

    return categories.map(cat => {
      const value = balance[cat.key] || 0;
      const percent = Math.round((value / maxVal) * 100);
      return `
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400 w-20">${cat.label}</span>
          <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r ${cat.color}" style="width: ${percent}%"></div>
          </div>
          <span class="text-xs font-mono text-slate-300 w-10 text-right">${Math.round(value)}</span>
        </div>
      `;
    }).join('');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.container = null;
    this.currentBeing = null;
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.FrankensteinBeingCard = FrankensteinBeingCard;
  window.frankensteinBeingCard = new FrankensteinBeingCard();
}
