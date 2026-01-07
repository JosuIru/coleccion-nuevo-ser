/**
 * MODAL DE EVENTOS INTERACTIVOS
 * UI para mostrar eventos y permitir al jugador elegir entre opciones
 */

class EventsModal {
  constructor() {
    this.modal = null;
    this.currentEvent = null;
    this.currentSociety = null;
    this.onChoiceCallback = null;
    this.isOpen = false;
  }

  /**
   * Inicializar modal
   */
  init() {
    this.createModal();
    // console.log('🎲 Events Modal inicializado');
  }

  /**
   * Crear estructura HTML del modal
   */
  createModal() {
    const modalHTML = `
      <div id="events-modal" class="events-modal" style="
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10001;
        align-items: center;
        justify-content: center;
      ">
        <div class="events-modal-content" style="
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1520 100%);
          border: 4px solid #d4af37;
          border-radius: 16px;
          max-width: 700px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          animation: slideInScale 0.4s ease-out;
        ">
          <!-- Tipo de Evento -->
          <div id="event-type-badge" class="event-type-badge" style="
            display: inline-block;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, #8b0000 0%, #b22222 100%);
            color: #f4e9d8;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.85rem;
            text-transform: uppercase;
            margin-bottom: 1rem;
          ">
            Crisis
          </div>

          <!-- Icono y Título -->
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div id="event-icon" style="font-size: 4rem; margin-bottom: 0.5rem;">
              🔥
            </div>
            <h2 id="event-title" style="
              color: #d4af37;
              font-size: 2rem;
              font-weight: 700;
              margin: 0;
            ">
              Título del Evento
            </h2>
          </div>

          <!-- Narrativa -->
          <div id="event-narrative" style="
            color: #f4e9d8;
            font-size: 1.1rem;
            line-height: 1.8;
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: rgba(139, 115, 85, 0.2);
            border-left: 4px solid #d4af37;
            border-radius: 8px;
          ">
            Narrativa del evento aquí...
          </div>

          <!-- Timer (opcional) -->
          <div id="event-timer" style="
            text-align: center;
            color: #ff6b35;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            display: none;
          ">
            ⏱️ <span id="timer-countdown">10</span>s
          </div>

          <!-- Opciones -->
          <div id="event-options" class="event-options">
            <!-- Opciones generadas dinámicamente -->
          </div>

          <!-- Resultado (oculto inicialmente) -->
          <div id="event-result" style="display: none;">
            <div id="result-status" style="
              text-align: center;
              font-size: 3rem;
              margin-bottom: 1rem;
            ">
              ✅
            </div>
            <div id="result-message" style="
              color: #f4e9d8;
              font-size: 1.2rem;
              line-height: 1.8;
              text-align: center;
              margin-bottom: 1.5rem;
            ">
              Mensaje de resultado
            </div>
            <div id="result-consequences" style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
              margin-bottom: 1.5rem;
            ">
              <!-- Consecuencias generadas dinámicamente -->
            </div>
            <button id="result-continue" class="event-option-btn" style="
              width: 100%;
              background: linear-gradient(135deg, #d4af37 0%, #b87333 100%);
            ">
              Continuar
            </button>
          </div>
        </div>
      </div>

      <style>
        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .event-option-btn {
          background: linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%);
          color: #f4e9d8;
          border: 2px solid #85c54e;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          font-size: 1rem;
          width: 100%;
        }

        .event-option-btn:hover {
          transform: translateX(8px);
          box-shadow: 0 8px 24px rgba(133, 197, 78, 0.4);
          border-color: #9acd32;
        }

        .event-option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .event-option-label {
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          display: block;
        }

        .event-option-requirements {
          font-size: 0.85rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .event-option-description {
          font-size: 0.95rem;
          opacity: 0.9;
        }

        .consequence-card {
          background: rgba(139, 115, 85, 0.2);
          border: 2px solid #8b7355;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .consequence-label {
          font-size: 0.85rem;
          color: #d4af37;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .consequence-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .consequence-positive {
          color: #85c54e;
        }

        .consequence-negative {
          color: #ff6b35;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('events-modal');
  }

  /**
   * Mostrar evento al jugador
   */
  show(event, society, onChoice) {
    if (!event || !society) return;

    this.currentEvent = event;
    this.currentSociety = society;
    this.onChoiceCallback = onChoice;
    this.isOpen = true;

    // Pausar la simulación
    if (society.running) {
      society.pause();
    }

    // Actualizar contenido
    this.updateContent();

    // Mostrar modal
    this.modal.style.display = 'flex';

    // Animación de entrada
    if (window.animationSystem) {
      window.animationSystem.fadeIn(this.modal.querySelector('.events-modal-content'), 400);
    }
  }

  /**
   * Actualizar contenido del modal
   */
  updateContent() {
    const event = this.currentEvent;

    // Badge de tipo
    const typeBadge = document.getElementById('event-type-badge');
    const typeColors = {
      crisis: 'linear-gradient(135deg, #8b0000 0%, #b22222 100%)',
      opportunity: 'linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%)',
      dilemma: 'linear-gradient(135deg, #4a235a 0%, #6a3579 100%)',
      challenge: 'linear-gradient(135deg, #b87333 0%, #d4af37 100%)',
      transformation: 'linear-gradient(135deg, #4169e1 0%, #6495ed 100%)'
    };

    typeBadge.textContent = this.translateType(event.type);
    typeBadge.style.background = typeColors[event.type] || typeColors.crisis;

    // Icono y título
    document.getElementById('event-icon').textContent = event.icon || '⚠️';
    document.getElementById('event-title').textContent = event.name;

    // Narrativa
    document.getElementById('event-narrative').textContent = event.narrative;

    // Generar opciones
    this.renderOptions();

    // Ocultar resultado
    document.getElementById('event-result').style.display = 'none';
  }

  /**
   * Traducir tipo de evento
   */
  translateType(type) {
    const translations = {
      crisis: 'Crisis',
      opportunity: 'Oportunidad',
      dilemma: 'Dilema',
      challenge: 'Desafío',
      transformation: 'Transformación'
    };
    return translations[type] || type;
  }

  /**
   * Renderizar opciones
   */
  renderOptions() {
    const container = document.getElementById('event-options');
    const event = this.currentEvent;
    const society = this.currentSociety;

    container.innerHTML = event.options.map((option, index) => {
      // Calcular si la sociedad puede elegir esta opción
      const canAfford = this.canAffordOption(option);
      const requirementsText = this.formatRequirements(option.requiredAttributes);

      return `
        <button
          class="event-option-btn"
          data-option-index="${index}"
          ${!canAfford ? 'disabled' : ''}
          style="${!canAfford ? 'opacity: 0.5; border-color: #8b0000;' : ''}"
        >
          <div class="event-option-label">${option.label}</div>
          <div class="event-option-requirements">
            ${canAfford ? '✅' : '❌'} Requiere: ${requirementsText}
          </div>
          <div class="event-option-description">${option.description || ''}</div>
        </button>
      `;
    }).join('');

    // Event listeners
    container.querySelectorAll('.event-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.optionIndex);
        this.handleChoice(index);
      });
    });
  }

  /**
   * Verificar si la sociedad puede elegir una opción
   */
  canAffordOption(option) {
    const society = this.currentSociety;
    const aliveBeings = society.beings.filter(b => b.alive);

    // Calcular atributos totales de la sociedad
    const societyAttributes = {};
    Object.keys(option.requiredAttributes).forEach(attr => {
      societyAttributes[attr] = aliveBeings.reduce((sum, being) => {
        return sum + (being.attributes[attr] || 0);
      }, 0);
    });

    // Verificar si cumple con al menos 70% de cada requisito
    return Object.entries(option.requiredAttributes).every(([attr, required]) => {
      const has = societyAttributes[attr] || 0;
      return has >= required * 0.7;
    });
  }

  /**
   * Formatear requisitos
   */
  formatRequirements(requirements) {
    return Object.entries(requirements)
      .map(([attr, value]) => `${this.translateAttribute(attr)} ${value}`)
      .join(', ');
  }

  /**
   * Traducir atributo
   */
  translateAttribute(attr) {
    const translations = {
      wisdom: 'Sabiduría',
      empathy: 'Empatía',
      action: 'Acción',
      courage: 'Coraje',
      resilience: 'Resiliencia',
      strategy: 'Estrategia',
      communication: 'Comunicación',
      consciousness: 'Consciencia',
      collaboration: 'Colaboración',
      creativity: 'Creatividad',
      analysis: 'Análisis',
      connection: 'Conexión',
      technical: 'Técnico',
      organization: 'Organización',
      leadership: 'Liderazgo',
      curiosity: 'Curiosidad',
      reflection: 'Reflexión'
    };
    return translations[attr] || attr;
  }

  /**
   * Manejar elección del jugador
   */
  handleChoice(optionIndex) {
    const option = this.currentEvent.options[optionIndex];
    const society = this.currentSociety;

    // Calcular éxito/fracaso
    const result = this.calculateResult(option);

    // Aplicar consecuencias
    this.applyConsequences(option, result.success);

    // Mostrar resultado
    this.showResult(option, result);

    // Notificar callback
    if (this.onChoiceCallback) {
      this.onChoiceCallback({
        event: this.currentEvent,
        option,
        result
      });
    }

    // Animaciones
    if (window.animationSystem) {
      const modalContent = this.modal.querySelector('.events-modal-content');
      const rect = modalContent.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (result.success) {
        window.animationSystem.spawnMissionCompleteParticles(centerX, centerY);
      } else {
        window.animationSystem.screenShake(300, 8);
      }
    }
  }

  /**
   * Calcular resultado
   */
  calculateResult(option) {
    const society = this.currentSociety;
    const aliveBeings = society.beings.filter(b => b.alive);

    // Calcular score
    let totalScore = 0;
    let requiredScore = 0;

    Object.entries(option.requiredAttributes).forEach(([attr, required]) => {
      const societyValue = aliveBeings.reduce((sum, being) => {
        return sum + (being.attributes[attr] || 0);
      }, 0);

      const score = Math.min(societyValue, required);
      totalScore += score;
      requiredScore += required;
    });

    const successRate = totalScore / requiredScore;
    const success = successRate >= 0.7;

    return { success, successRate };
  }

  /**
   * Aplicar consecuencias
   */
  applyConsequences(option, success) {
    const society = this.currentSociety;
    const consequences = success ? option.consequences.success : option.consequences.failure;

    // Aplicar cambios de métricas
    Object.entries(consequences).forEach(([metric, change]) => {
      if (society.metrics.hasOwnProperty(metric)) {
        society.metrics[metric] = Math.max(0, Math.min(100, society.metrics[metric] + change));
      }
    });

    // Log
    const statusIcon = success ? '✅' : '❌';
    const message = `${this.currentEvent.icon} ${this.currentEvent.name}: ${option.label} - ${success ? 'Éxito' : 'Fracaso'}`;
    society.logEvent(message, success ? 'success' : 'failure');
  }

  /**
   * Mostrar resultado
   */
  showResult(option, result) {
    // Ocultar opciones
    document.getElementById('event-options').style.display = 'none';

    // Mostrar resultado
    const resultDiv = document.getElementById('event-result');
    resultDiv.style.display = 'block';

    // Status
    const statusIcon = result.success ? '✅' : '❌';
    document.getElementById('result-status').textContent = statusIcon;

    // Mensaje
    const message = result.success ? option.successMessage : option.failureMessage;
    document.getElementById('result-message').textContent = message;

    // Consecuencias
    const consequences = result.success ? option.consequences.success : option.consequences.failure;
    this.renderConsequences(consequences);

    // Botón continuar
    document.getElementById('result-continue').onclick = () => {
      this.close();
    };

    // Animación
    if (window.animationSystem) {
      window.animationSystem.slideIn(resultDiv, 'up', 500);
    }
  }

  /**
   * Renderizar consecuencias
   */
  renderConsequences(consequences) {
    const container = document.getElementById('result-consequences');

    const metricLabels = {
      health: '🌱 Salud',
      knowledge: '💡 Conocimiento',
      action: '⚡ Acción',
      cohesion: '🤝 Cohesión'
    };

    container.innerHTML = Object.entries(consequences)
      .map(([metric, change]) => {
        const isPositive = change > 0;
        const sign = isPositive ? '+' : '';
        const colorClass = isPositive ? 'consequence-positive' : 'consequence-negative';

        return `
          <div class="consequence-card">
            <div class="consequence-label">${metricLabels[metric] || metric}</div>
            <div class="consequence-value ${colorClass}">${sign}${change}</div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Cerrar modal
   */
  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
    this.currentEvent = null;
    this.currentSociety = null;
    this.onChoiceCallback = null;

    // Reanudar simulación si estaba corriendo
    // (el jugador decidirá con el botón play/pause)
  }

  /**
   * Destruir modal
   */
  destroy() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    this.modal = null;
  }
}

// Exportar
window.EventsModal = EventsModal;
// console.log('🎲 Events Modal cargado');
