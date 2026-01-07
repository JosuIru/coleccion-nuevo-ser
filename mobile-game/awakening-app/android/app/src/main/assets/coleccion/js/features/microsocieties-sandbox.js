/**
 * MODO SANDBOX
 * Configuración libre y experimentación sin límites
 */

class SandboxMode {
  constructor() {
    this.config = this.getDefaultConfig();
    this.active = false;
    this.loadConfig();
  }

  /**
   * Configuración por defecto
   */
  getDefaultConfig() {
    return {
      // Población
      maxPopulation: 50, // Por defecto 20
      startingPopulation: 5,
      cullThreshold: 10, // Fitness mínimo antes de culling

      // Evolución
      hybridizationInterval: 10, // Turnos entre hibridaciones
      mutationRate: 0.05, // ±5%
      mutationChance: 1.0, // 100% de probabilidad de mutación

      // Eventos
      eventFrequency: 1.0, // 1 evento por turno
      allowCustomEvents: true,
      eventDifficulty: 1.0, // Multiplicador de dificultad

      // Métricas
      startingMetrics: {
        health: 100,
        knowledge: 50,
        action: 50,
        cohesion: 75
      },
      metricDecay: 0, // Decay pasivo por turno (0 = sin decay)
      metricGrowth: 0, // Crecimiento pasivo por turno

      // Física de la simulación
      survivalMode: 'normal', // 'easy', 'normal', 'hard', 'brutal'
      allowRevival: false, // Permitir resurrecciones automáticas
      immortalMode: false, // Seres no pueden morir

      // Experimentación
      allowNegativeMetrics: false, // Permitir métricas < 0
      allowSuperMetrics: true, // Permitir métricas > 100
      randomEventsEnabled: true,
      deterministicMode: false // Seed fijo para reproducibilidad
    };
  }

  /**
   * Activar modo sandbox
   */
  activate(society) {
    this.active = true;

    // Aplicar configuración inicial
    this.applySandboxConfig(society);

    // console.log('🎨 Modo Sandbox activado con config:', this.config);
  }

  /**
   * Desactivar modo sandbox
   */
  deactivate() {
    this.active = false;
    // console.log('🎨 Modo Sandbox desactivado');
  }

  /**
   * Aplicar configuración a la sociedad
   */
  applySandboxConfig(society) {
    // Aplicar métricas iniciales
    Object.assign(society.metrics, this.config.startingMetrics);

    // Configurar parámetros de evolución
    society.maxPopulation = this.config.maxPopulation;
    society.hybridizationInterval = this.config.hybridizationInterval;
    society.mutationRate = this.config.mutationRate;
    society.cullThreshold = this.config.cullThreshold;

    // Modo inmortal
    if (this.config.immortalMode) {
      society.beings.forEach(b => {
        b.immortal = true;
      });
    }

    // console.log('⚙️ Configuración sandbox aplicada');
  }

  /**
   * Procesar turno en sandbox mode
   */
  processSandboxTurn(society) {
    if (!this.active) return;

    // Decay/Growth de métricas
    if (this.config.metricDecay !== 0) {
      Object.keys(society.metrics).forEach(key => {
        society.metrics[key] = Math.max(0, society.metrics[key] - this.config.metricDecay);
      });
    }

    if (this.config.metricGrowth !== 0) {
      Object.keys(society.metrics).forEach(key => {
        society.metrics[key] = Math.min(100, society.metrics[key] + this.config.metricGrowth);
      });
    }

    // Super-métricas
    if (this.config.allowSuperMetrics) {
      // Permitir valores > 100 (sin límite superior)
    }

    // Métricas negativas
    if (!this.config.allowNegativeMetrics) {
      Object.keys(society.metrics).forEach(key => {
        society.metrics[key] = Math.max(0, society.metrics[key]);
      });
    }

    // Modo inmortal: resetear alive = true
    if (this.config.immortalMode) {
      society.beings.forEach(b => {
        b.alive = true;
      });
    }

    // Revival automático
    if (this.config.allowRevival && Math.random() < 0.1) {
      // 10% de chance de revivir un ser muerto
      const dead = society.beings.filter(b => !b.alive);
      if (dead.length > 0) {
        const revived = dead[Math.floor(Math.random() * dead.length)];
        revived.alive = true;
        revived.fitness = 50;
        society.logEvent(`✨ "${revived.name}" ha sido revivido!`, 'success');
      }
    }
  }

  /**
   * Crear evento personalizado
   */
  createCustomEvent(template) {
    return {
      type: template.type || 'custom',
      name: template.name,
      icon: template.icon || '🎲',
      narrative: template.narrative,
      options: template.options.map(opt => ({
        label: opt.label,
        requiredAttributes: opt.requiredAttributes || {},
        consequences: {
          success: opt.consequences?.success || {},
          failure: opt.consequences?.failure || {}
        },
        successMessage: opt.successMessage || 'Éxito',
        failureMessage: opt.failureMessage || 'Fracaso'
      }))
    };
  }

  /**
   * Modificar parámetro en tiempo real
   */
  setParameter(key, value) {
    if (this.config.hasOwnProperty(key)) {
      this.config[key] = value;
      this.saveConfig();
      // console.log(`⚙️ Parámetro ${key} = ${value}`);
      return true;
    }
    return false;
  }

  /**
   * Obtener configuración actual
   */
  getConfig() {
    return {...this.config};
  }

  /**
   * Restaurar configuración por defecto
   */
  resetConfig() {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    // console.log('⚙️ Configuración reseteada');
  }

  /**
   * Guardar configuración
   */
  saveConfig() {
    localStorage.setItem('sandbox-config', JSON.stringify(this.config));
  }

  /**
   * Cargar configuración
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('sandbox-config');
      if (saved) {
        this.config = {...this.getDefaultConfig(), ...JSON.parse(saved)};
        // console.log('⚙️ Configuración sandbox cargada');
      }
    } catch (error) {
      console.error('❌ Error al cargar config sandbox:', error);
    }
  }

  /**
   * Exportar configuración
   */
  exportConfig() {
    const json = JSON.stringify(this.config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox-config-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    // console.log('📤 Configuración exportada');
  }

  /**
   * Importar configuración
   */
  importConfig(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          this.config = {...this.getDefaultConfig(), ...imported};
          this.saveConfig();
          // console.log('📥 Configuración importada');
          resolve(this.config);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Presets de configuración
   */
  getPresets() {
    return {
      chaos: {
        name: 'Caos Total',
        description: 'Máxima aleatoriedad y mutación',
        config: {
          maxPopulation: 100,
          mutationRate: 0.25,
          mutationChance: 1.0,
          hybridizationInterval: 5,
          eventFrequency: 2.0,
          randomEventsEnabled: true,
          allowSuperMetrics: true
        }
      },

      utopia: {
        name: 'Utopía Pacífica',
        description: 'Crecimiento sin conflicto',
        config: {
          maxPopulation: 30,
          startingMetrics: {
            health: 100,
            knowledge: 100,
            action: 100,
            cohesion: 100
          },
          metricGrowth: 1,
          eventDifficulty: 0.5,
          immortalMode: true,
          randomEventsEnabled: false
        }
      },

      survival: {
        name: 'Supervivencia Extrema',
        description: 'Lucha constante por existir',
        config: {
          maxPopulation: 10,
          cullThreshold: 30,
          metricDecay: 2,
          eventDifficulty: 2.0,
          survivalMode: 'brutal',
          allowRevival: false,
          startingMetrics: {
            health: 50,
            knowledge: 30,
            action: 30,
            cohesion: 40
          }
        }
      },

      laboratory: {
        name: 'Laboratorio Científico',
        description: 'Control total para experimentación',
        config: {
          maxPopulation: 20,
          hybridizationInterval: 1, // Hibridar cada turno
          mutationRate: 0.1,
          deterministicMode: true,
          randomEventsEnabled: false,
          metricDecay: 0,
          metricGrowth: 0
        }
      },

      evolution: {
        name: 'Evolución Acelerada',
        description: 'Generaciones rápidas',
        config: {
          maxPopulation: 50,
          hybridizationInterval: 3,
          mutationRate: 0.15,
          cullThreshold: 20,
          eventFrequency: 1.5,
          allowSuperMetrics: true
        }
      }
    };
  }

  /**
   * Aplicar preset
   */
  applyPreset(presetName) {
    const presets = this.getPresets();
    const preset = presets[presetName];

    if (preset) {
      this.config = {...this.getDefaultConfig(), ...preset.config};
      this.saveConfig();
      // console.log(`🎨 Preset "${preset.name}" aplicado`);
      return true;
    }

    return false;
  }

  /**
   * Obtener estadísticas de la sesión sandbox
   */
  getSessionStats(society) {
    if (!this.active) return null;

    const aliveBeings = society.beings.filter(b => b.alive);
    const avgGeneration = aliveBeings.reduce((sum, b) => sum + (b.generation || 1), 0) / aliveBeings.length;
    const maxGeneration = Math.max(...aliveBeings.map(b => b.generation || 1));
    const totalBeings = society.beings.length;
    const avgFitness = aliveBeings.reduce((sum, b) => sum + b.fitness, 0) / aliveBeings.length;

    return {
      active: this.active,
      turn: society.turn,
      population: aliveBeings.length,
      totalBeingsCreated: totalBeings,
      avgGeneration: avgGeneration.toFixed(2),
      maxGeneration,
      avgFitness: avgFitness.toFixed(2),
      metrics: {...society.metrics},
      config: {...this.config}
    };
  }

  /**
   * Crear UI de configuración (HTML)
   */
  createConfigUI() {
    return `
      <div class="sandbox-config-panel" style="
        background: rgba(139, 115, 85, 0.2);
        border: 2px solid #8b7355;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      ">
        <h3 style="color: #d4af37; margin-bottom: 1rem;">⚙️ Configuración Sandbox</h3>

        <!-- Presets -->
        <div style="margin-bottom: 1rem;">
          <label style="color: #f4e9d8; font-weight: 600;">Presets:</label>
          <select id="sandbox-preset" style="
            width: 100%;
            padding: 0.5rem;
            background: #0a0a0f;
            color: #f4e9d8;
            border: 2px solid #8b7355;
            border-radius: 4px;
            margin-top: 0.5rem;
          ">
            <option value="">-- Seleccionar Preset --</option>
            <option value="chaos">Caos Total</option>
            <option value="utopia">Utopía Pacífica</option>
            <option value="survival">Supervivencia Extrema</option>
            <option value="laboratory">Laboratorio Científico</option>
            <option value="evolution">Evolución Acelerada</option>
          </select>
        </div>

        <!-- Población -->
        <div style="margin-bottom: 1rem;">
          <label style="color: #f4e9d8;">Población Máxima: <span id="max-pop-value">50</span></label>
          <input type="range" id="max-population" min="5" max="200" value="50" style="width: 100%;">
        </div>

        <!-- Mutación -->
        <div style="margin-bottom: 1rem;">
          <label style="color: #f4e9d8;">Tasa de Mutación: <span id="mutation-rate-value">5%</span></label>
          <input type="range" id="mutation-rate" min="0" max="50" value="5" style="width: 100%;">
        </div>

        <!-- Intervalo Hibridación -->
        <div style="margin-bottom: 1rem;">
          <label style="color: #f4e9d8;">Hibridación cada: <span id="hybrid-interval-value">10</span> turnos</label>
          <input type="range" id="hybrid-interval" min="1" max="50" value="10" style="width: 100%;">
        </div>

        <!-- Modo Inmortal -->
        <div style="margin-bottom: 1rem;">
          <label style="color: #f4e9d8;">
            <input type="checkbox" id="immortal-mode"> Modo Inmortal (seres no mueren)
          </label>
        </div>

        <!-- Super Métricas -->
        <div style="margin-bottom: 1rem;">
          <label style="color: #f4e9d8;">
            <input type="checkbox" id="super-metrics" checked> Permitir métricas > 100
          </label>
        </div>

        <!-- Botones -->
        <div style="display: flex; gap: 0.5rem;">
          <button id="apply-sandbox-config" style="
            flex: 1;
            padding: 0.5rem;
            background: linear-gradient(135deg, #d4af37 0%, #b87333 100%);
            color: #0a0a0f;
            border: none;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
          ">Aplicar</button>

          <button id="reset-sandbox-config" style="
            flex: 1;
            padding: 0.5rem;
            background: rgba(139, 115, 85, 0.3);
            color: #f4e9d8;
            border: 2px solid #8b7355;
            border-radius: 4px;
            cursor: pointer;
          ">Resetear</button>
        </div>
      </div>
    `;
  }
}

// Exportar
window.SandboxMode = SandboxMode;
// console.log('🎨 Sandbox Mode cargado');
