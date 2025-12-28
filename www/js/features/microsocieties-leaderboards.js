/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE LEADERBOARDS Y SOCIAL SHARING
 * Rankings locales y compartir sociedades
 */

class LeaderboardsSystem {
  constructor() {
    this.leaderboards = this.getDefaultLeaderboards();
    this.loadLeaderboards();
  }

  /**
   * Estructura de leaderboards
   */
  getDefaultLeaderboards() {
    return {
      maxGeneration: {
        name: 'Máxima Generación Alcanzada',
        icon: '🧬',
        entries: [],
        maxEntries: 10
      },
      longestSurvival: {
        name: 'Mayor Supervivencia (Turnos)',
        icon: '⏱️',
        entries: [],
        maxEntries: 10
      },
      highestFitness: {
        name: 'Mayor Fitness Promedio',
        icon: '💪',
        entries: [],
        maxEntries: 10
      },
      largestPopulation: {
        name: 'Mayor Población Alcanzada',
        icon: '👥',
        entries: [],
        maxEntries: 10
      },
      chaptersCompleted: {
        name: 'Capítulos de Historia Completados',
        icon: '📖',
        entries: [],
        maxEntries: 10
      },
      totalXP: {
        name: 'Total XP Ganado',
        icon: '⭐',
        entries: [],
        maxEntries: 10
      }
    };
  }

  /**
   * Registrar entrada en leaderboard
   */
  submitEntry(leaderboardId, entry) {
    const leaderboard = this.leaderboards[leaderboardId];
    if (!leaderboard) return false;

    // Crear entrada completa
    const fullEntry = {
      playerName: entry.playerName || 'Anónimo',
      societyName: entry.societyName,
      score: entry.score,
      date: Date.now(),
      details: entry.details || {}
    };

    // Añadir a lista
    leaderboard.entries.push(fullEntry);

    // Ordenar por score descendente
    leaderboard.entries.sort((a, b) => b.score - a.score);

    // Mantener solo top N
    if (leaderboard.entries.length > leaderboard.maxEntries) {
      leaderboard.entries = leaderboard.entries.slice(0, leaderboard.maxEntries);
    }

    this.saveLeaderboards();

    // logger.debug(`🏆 Nueva entrada en "${leaderboard.name}": ${entry.score}`);
    return true;
  }

  /**
   * Registrar sociedad finalizada
   */
  registerSociety(society, playerName = 'Anónimo') {
    const aliveBeings = society.beings.filter(b => b.alive);

    // Máxima generación
    const maxGeneration = Math.max(...society.beings.map(b => b.generation || 1));
    this.submitEntry('maxGeneration', {
      playerName,
      societyName: society.name,
      score: maxGeneration,
      details: {
        turn: society.turn,
        population: aliveBeings.length
      }
    });

    // Supervivencia
    this.submitEntry('longestSurvival', {
      playerName,
      societyName: society.name,
      score: society.turn,
      details: {
        maxGeneration,
        population: aliveBeings.length
      }
    });

    // Fitness promedio
    const avgFitness = aliveBeings.length > 0
      ? aliveBeings.reduce((sum, b) => sum + b.fitness, 0) / aliveBeings.length
      : 0;

    this.submitEntry('highestFitness', {
      playerName,
      societyName: society.name,
      score: Math.round(avgFitness * 100) / 100, // 2 decimales
      details: {
        turn: society.turn,
        population: aliveBeings.length
      }
    });

    // Mayor población
    const maxPopulation = society.maxPopulationReached || aliveBeings.length;
    this.submitEntry('largestPopulation', {
      playerName,
      societyName: society.name,
      score: maxPopulation,
      details: {
        turn: society.turn,
        maxGeneration
      }
    });

    // Capítulos completados (si usa Story Mode)
    if (window.storyMode && window.storyMode.completedChapters) {
      this.submitEntry('chaptersCompleted', {
        playerName,
        societyName: society.name,
        score: window.storyMode.completedChapters.length,
        details: {
          turn: society.turn,
          chapters: window.storyMode.completedChapters
        }
      });
    }

    // Total XP (si usa Progression System)
    if (window.progressionSystem) {
      this.submitEntry('totalXP', {
        playerName,
        societyName: society.name,
        score: window.progressionSystem.player.xp + window.progressionSystem.player.totalXPEarned || 0,
        details: {
          level: window.progressionSystem.player.level,
          turn: society.turn
        }
      });
    }

    // logger.debug(`🏆 Sociedad "${society.name}" registrada en leaderboards`);
  }

  /**
   * Obtener leaderboard específico
   */
  getLeaderboard(leaderboardId) {
    return this.leaderboards[leaderboardId] || null;
  }

  /**
   * Obtener todos los leaderboards
   */
  getAllLeaderboards() {
    return this.leaderboards;
  }

  /**
   * Obtener posición del jugador en leaderboard
   */
  getPlayerRank(leaderboardId, playerName) {
    const leaderboard = this.leaderboards[leaderboardId];
    if (!leaderboard) return null;

    const entries = leaderboard.entries.filter(e => e.playerName === playerName);
    if (entries.length === 0) return null;

    // Mejor posición del jugador
    const bestScore = Math.max(...entries.map(e => e.score));
    const rank = leaderboard.entries.findIndex(e => e.score === bestScore) + 1;

    return {
      rank,
      score: bestScore,
      total: leaderboard.entries.length
    };
  }

  /**
   * Resetear leaderboards
   */
  reset() {
    this.leaderboards = this.getDefaultLeaderboards();
    this.saveLeaderboards();
    // logger.debug('🏆 Leaderboards reseteados');
  }

  /**
   * Guardar leaderboards
   */
  saveLeaderboards() {
    localStorage.setItem('microsocieties-leaderboards', JSON.stringify(this.leaderboards));
  }

  /**
   * Cargar leaderboards
   */
  loadLeaderboards() {
    try {
      const saved = localStorage.getItem('microsocieties-leaderboards');
      if (saved) {
        const loaded = JSON.parse(saved);
        // Merge con estructura por defecto (para añadir nuevos leaderboards)
        this.leaderboards = {...this.getDefaultLeaderboards(), ...loaded};
        // logger.debug('🏆 Leaderboards cargados');
      }
    } catch (error) {
      console.error('❌ Error al cargar leaderboards:', error);
    }
  }

  /**
   * Exportar sociedad a JSON
   */
  exportSociety(society) {
    const exportData = {
      version: '1.0',
      exportDate: Date.now(),
      society: {
        name: society.name,
        goal: society.goal,
        turn: society.turn,
        metrics: {...society.metrics},
        beings: society.beings.map(b => ({
          name: b.name,
          attributes: {...b.attributes},
          pieces: b.pieces || [],
          totalPower: b.totalPower,
          fitness: b.fitness,
          alive: b.alive,
          generation: b.generation || 1
        })),
        metricsHistory: society.metricsHistory.slice(-50), // Últimos 50 snapshots
        eventLog: society.eventLog.slice(0, 20) // Primeros 20 eventos
      },
      statistics: this.getSocietyStatistics(society)
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `microsociety-${society.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    // logger.debug(`📤 Sociedad "${society.name}" exportada`);
    return exportData;
  }

  /**
   * Importar sociedad desde JSON
   */
  importSociety(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          if (data.version !== '1.0') {
            reject(new Error('Versión incompatible'));
            return;
          }

          // logger.debug(`📥 Sociedad "${data.society.name}" importada`);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Generar código de compartir (base64)
   */
  generateShareCode(society) {
    const data = {
      n: society.name,
      t: society.turn,
      m: society.metrics,
      p: society.beings.filter(b => b.alive).length,
      g: Math.max(...society.beings.map(b => b.generation || 1)),
      f: society.beings.filter(b => b.alive).reduce((sum, b) => sum + b.fitness, 0) / society.beings.filter(b => b.alive).length
    };

    const json = JSON.stringify(data);
    const base64 = btoa(json);

    // logger.debug('🔗 Código de compartir generado');
    return base64;
  }

  /**
   * Decodificar código de compartir
   */
  decodeShareCode(code) {
    try {
      const json = atob(code);
      const data = JSON.parse(json);

      return {
        name: data.n,
        turn: data.t,
        metrics: data.m,
        population: data.p,
        maxGeneration: data.g,
        avgFitness: data.f
      };
    } catch (error) {
      console.error('❌ Error al decodificar código:', error);
      return null;
    }
  }

  /**
   * Generar URL de compartir
   */
  generateShareURL(society) {
    const code = this.generateShareCode(society);
    const baseURL = window.location.origin + window.location.pathname;
    const shareURL = `${baseURL}?share=${code}`;

    // logger.debug('🔗 URL de compartir:', shareURL);
    return shareURL;
  }

  /**
   * Copiar al portapapeles
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // logger.debug('📋 Copiado al portapapeles');
      return true;
    } catch (error) {
      console.error('❌ Error al copiar:', error);
      return false;
    }
  }

  /**
   * Generar QR code (data URL)
   */
  generateQRCode(society) {
    const shareURL = this.generateShareURL(society);

    // Usar API externa para generar QR
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareURL)}`;

    // logger.debug('📱 QR Code generado:', qrURL);
    return qrURL;
  }

  /**
   * Obtener estadísticas de la sociedad
   */
  getSocietyStatistics(society) {
    const aliveBeings = society.beings.filter(b => b.alive);
    const maxGeneration = Math.max(...society.beings.map(b => b.generation || 1));
    const avgFitness = aliveBeings.length > 0
      ? aliveBeings.reduce((sum, b) => sum + b.fitness, 0) / aliveBeings.length
      : 0;

    return {
      turn: society.turn,
      population: aliveBeings.length,
      totalBeingsCreated: society.beings.length,
      maxGeneration,
      avgFitness: Math.round(avgFitness * 100) / 100,
      metrics: {...society.metrics},
      survivalRate: (aliveBeings.length / society.beings.length) * 100
    };
  }

  /**
   * Crear UI de leaderboards
   */
  createLeaderboardsUI() {
    let html = `
      <div class="leaderboards-container">
        <h2>🏆 Rankings Globales</h2>
    `;

    Object.entries(this.leaderboards).forEach(([id, leaderboard]) => {
      html += `
        <div class="leaderboard-section">
          <h3>${leaderboard.icon} ${leaderboard.name}</h3>
          <div class="leaderboard-entries">
      `;

      if (leaderboard.entries.length === 0) {
        html += `<p class="leaderboard-empty">No hay entradas todavía</p>`;
      } else {
        leaderboard.entries.forEach((entry, index) => {
          const date = new Date(entry.date).toLocaleDateString();
          const rankClass = index < 3 ? `rank-${index + 1}` : '';

          html += `
            <div class="leaderboard-entry ${rankClass}">
              <div class="leaderboard-entry-left">
                <div class="leaderboard-rank">#${index + 1}</div>
                <div>
                  <div class="leaderboard-player-name">${entry.playerName}</div>
                  <div class="leaderboard-meta">${entry.societyName} · ${date}</div>
                </div>
              </div>
              <div class="leaderboard-score">${entry.score}</div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Crear UI de compartir
   */
  createSharingUI(society) {
    const stats = this.getSocietyStatistics(society);
    const shareCode = this.generateShareCode(society);
    const shareURL = this.generateShareURL(society);
    const qrURL = this.generateQRCode(society);

    return `
      <div class="sharing-panel">
        <h3>🔗 Compartir Sociedad</h3>

        <!-- Estadísticas -->
        <div class="sharing-stats">
          <h4>📊 Estadísticas</h4>
          <div class="sharing-stats-grid">
            <div>🏆 Generación: ${stats.maxGeneration}</div>
            <div>⏱️ Turnos: ${stats.turn}</div>
            <div>👥 Población: ${stats.population}</div>
            <div>💪 Fitness: ${stats.avgFitness}</div>
          </div>
        </div>

        <!-- Código de Compartir -->
        <div class="sharing-code-section">
          <label class="sharing-label">Código Corto:</label>
          <div class="sharing-code-display">${shareCode}</div>
          <button onclick="navigator.clipboard.writeText('${shareCode}')" class="sharing-button-copy-code">
            📋 Copiar Código
          </button>
        </div>

        <!-- URL Completa -->
        <div class="sharing-url-section">
          <label class="sharing-label">URL Completa:</label>
          <div class="sharing-url-display">${shareURL}</div>
          <button onclick="navigator.clipboard.writeText('${shareURL}')" class="sharing-button-copy-url">
            🔗 Copiar URL
          </button>
        </div>

        <!-- QR Code -->
        <div class="sharing-qr-section">
          <label class="sharing-label">📱 QR Code:</label>
          <div class="sharing-qr-container">
            <img src="${qrURL}" alt="QR Code" class="sharing-qr-image">
          </div>
        </div>

        <!-- Exportar JSON -->
        <button onclick="window.leaderboardsSystem.exportSociety(window.currentSocietyUI)" class="sharing-button-export">
          💾 Exportar JSON Completo
        </button>
      </div>
    `;
  }
}

// Exportar
window.LeaderboardsSystem = LeaderboardsSystem;
// logger.debug('🏆 Leaderboards System cargado');
