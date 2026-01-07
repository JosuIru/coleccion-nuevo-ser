/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * MODAL DE RETOS PARA SERES FRANKENSTEIN
 * UI para mostrar y resolver retos basados en la misión del ser
 */

class FrankensteinChallengesModal {
  constructor() {
    this.modal = null;
    this.challengeSystem = null;
    this.currentBeing = null;
    this.currentMission = null;
    this.isOpen = false;
  }

  /**
   * Inicializar modal
   */
  init() {
    this.createModal();
    this.challengeSystem = new (window.FrankensteinChallengesSystem || class {})();
    logger.debug('🎮 Challenges Modal inicializado');
  }

  /**
   * Crear estructura HTML del modal
   */
  createModal() {
    const modalHTML = `
      <div id="challenges-modal" class="challenges-modal fixed inset-0 bg-black/95 z-[10001] flex items-end sm:items-center justify-center overflow-y-auto p-0 sm:p-4" style="display: none;">
        <div class="challenges-modal-content w-full sm:max-w-[750px] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-8 rounded-t-2xl sm:rounded-2xl m-0 sm:m-auto" style="
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1520 100%);
          border: 4px solid #d4af37;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          animation: challengeSlideIn 0.4s ease-out;
        ">
          <!-- Header -->
          <div class="challenges-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid rgba(212, 175, 55, 0.3);
          ">
            <div>
              <h2 id="challenges-title" style="
                color: #d4af37;
                font-size: 1.8rem;
                font-weight: 700;
                margin: 0;
              ">
                🎮 Retos de Misión
              </h2>
              <div id="challenges-subtitle" style="
                color: #a0a0a0;
                font-size: 0.95rem;
                margin-top: 0.25rem;
              ">
                Pon a prueba a tu ser
              </div>
            </div>
            <button id="challenges-close" class="w-11 h-11 sm:w-10 sm:h-10 rounded-full cursor-pointer text-xl transition-all duration-300 hover:scale-110" style="
              background: rgba(255, 107, 53, 0.2);
              border: 2px solid #ff6b35;
              color: #ff6b35;
            ">✕</button>
          </div>

          <!-- Progress Bar -->
          <div id="challenges-progress" style="
            background: rgba(139, 115, 85, 0.3);
            border-radius: 10px;
            height: 12px;
            margin-bottom: 1.5rem;
            overflow: hidden;
          ">
            <div id="challenges-progress-bar" style="
              background: linear-gradient(90deg, #d4af37 0%, #85c54e 100%);
              height: 100%;
              width: 0%;
              transition: width 0.5s ease;
              border-radius: 10px;
            "></div>
          </div>

          <!-- Being Info -->
          <div id="being-info" style="
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: rgba(212, 175, 55, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(212, 175, 55, 0.3);
          ">
            <div style="flex: 1;">
              <div style="color: #d4af37; font-size: 0.85rem; font-weight: 600;">SER</div>
              <div id="being-name" style="color: #f4e9d8; font-size: 1.2rem; font-weight: 700;">-</div>
            </div>
            <div style="flex: 1;">
              <div style="color: #d4af37; font-size: 0.85rem; font-weight: 600;">MISIÓN</div>
              <div id="mission-name" style="color: #f4e9d8; font-size: 1.2rem; font-weight: 700;">-</div>
            </div>
            <div style="flex: 1; text-align: right;">
              <div style="color: #d4af37; font-size: 0.85rem; font-weight: 600;">PUNTUACIÓN</div>
              <div id="current-score" style="color: #85c54e; font-size: 1.5rem; font-weight: 700;">0</div>
            </div>
          </div>

          <!-- Challenge Content -->
          <div id="challenge-content">
            <!-- Populated dynamically -->
          </div>

          <!-- Final Results (hidden initially) -->
          <div id="final-results" style="display: none;">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>

      <style>
        @keyframes challengeSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .challenge-option-btn {
          background: linear-gradient(135deg, #1a1520 0%, #2a2530 100%);
          color: #f4e9d8;
          border: 2px solid #8b7355;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          font-size: 1rem;
          width: 100%;
          display: block;
        }

        .challenge-option-btn:hover {
          transform: translateX(8px);
          border-color: #d4af37;
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
          background: linear-gradient(135deg, #2a2530 0%, #3a3540 100%);
        }

        .challenge-option-btn:active {
          transform: translateX(4px);
        }

        .challenge-option-btn.selected {
          border-color: #85c54e;
          background: linear-gradient(135deg, #1a2a1a 0%, #2a3a2a 100%);
        }

        .challenge-type-badge {
          display: inline-block;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .feedback-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(139, 115, 85, 0.2);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .feedback-item.success {
          border-left: 4px solid #85c54e;
        }

        .feedback-item.failure {
          border-left: 4px solid #ff6b35;
        }

        .feedback-item.bonus {
          border-left: 4px solid #d4af37;
        }

        .result-rank {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin: 1rem 0;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .challenges-modal::-webkit-scrollbar {
          width: 8px;
        }

        .challenges-modal::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .challenges-modal::-webkit-scrollbar-thumb {
          background: #d4af37;
          border-radius: 4px;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('challenges-modal');

    // Event listener para cerrar
    document.getElementById('challenges-close').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // 🔧 FIX v2.9.270: ESC key para cerrar modal
    this.escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  /**
   * Abrir modal con retos para un ser y misión
   */
  open(being, mission) {
    if (!being || !mission) {
      logger.error('Se requiere un ser y una misión para los retos');
      return;
    }

    // Verificar que el sistema de retos está disponible
    if (!window.FrankensteinChallengesSystem) {
      this.showNotification('Sistema de retos no disponible', 'error');
      return;
    }

    this.currentBeing = being;
    this.currentMission = mission;
    this.isOpen = true;

    // Inicializar sistema de retos
    this.challengeSystem = new window.FrankensteinChallengesSystem();
    this.challengeSystem.startChallenges(being, mission);

    // Actualizar UI
    document.getElementById('being-name').textContent = being.name || 'Ser sin nombre';
    document.getElementById('mission-name').textContent = mission.name || mission.id || 'Misión';
    document.getElementById('challenges-subtitle').textContent =
      `${this.challengeSystem.challenges.length} retos para completar`;
    document.getElementById('current-score').textContent = '0';
    document.getElementById('challenges-progress-bar').style.width = '0%';

    // Mostrar primer reto
    this.renderCurrentChallenge();

    // Mostrar modal
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Renderizar reto actual
   */
  renderCurrentChallenge() {
    const challenge = this.challengeSystem.challenges[this.challengeSystem.currentChallengeIndex];
    if (!challenge) {
      this.showFinalResults();
      return;
    }

    const container = document.getElementById('challenge-content');
    const typeColors = {
      'multiple-choice': '#4a7c2e',
      'scenario': '#4a235a',
      'resource-allocation': '#b87333',
      'dilemma': '#8b0000',
      'crisis': '#ff6b35',
      'pattern-recognition': '#4169e1',
      'intervention-design': '#2d5016',
      'paradox': '#9932cc',
      'transmission': '#d4af37',
      'integration': '#20b2aa'
    };

    const typeLabels = {
      'multiple-choice': 'Elección Múltiple',
      'scenario': 'Escenario',
      'resource-allocation': 'Asignación de Recursos',
      'dilemma': 'Dilema Ético',
      'crisis': '¡Crisis!',
      'pattern-recognition': 'Reconocimiento de Patrones',
      'intervention-design': 'Diseño de Intervención',
      'paradox': 'Paradoja',
      'transmission': 'Transmisión',
      'integration': 'Integración'
    };

    const bgColor = typeColors[challenge.type] || '#4a7c2e';

    container.innerHTML = `
      <div class="challenge-type-badge" style="background: ${bgColor}; color: #f4e9d8;">
        Reto ${challenge.number} de ${this.challengeSystem.challenges.length} • ${typeLabels[challenge.type] || challenge.type}
      </div>

      <div style="
        color: #f4e9d8;
        font-size: 1.2rem;
        line-height: 1.8;
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        background: rgba(139, 115, 85, 0.15);
        border-left: 4px solid #d4af37;
        border-radius: 8px;
      ">
        ${challenge.scenario}
        ${challenge.challenge ? `<br><br><strong style="color: #d4af37;">${challenge.challenge}</strong>` : ''}
      </div>

      <div id="challenge-options" style="margin-bottom: 1rem;">
        ${challenge.options.map((option, index) => `
          <button class="challenge-option-btn" data-index="${index}">
            <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; color: #d4af37;">
              ${String.fromCharCode(65 + index)}. ${option.text}
            </div>
            ${this.renderOptionDetails(option)}
          </button>
        `).join('')}
      </div>
    `;

    // Event listeners para opciones
    container.querySelectorAll('.challenge-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.handleAnswer(index);
      });
    });
  }

  /**
   * Renderizar detalles de opción
   */
  renderOptionDetails(option) {
    const attrLabels = {
      strategy: '📊 Estrategia',
      communication: '💬 Comunicación',
      connection: '🔗 Conexión',
      collaboration: '🤝 Colaboración',
      organization: '📋 Organización',
      technical: '🔧 Técnico',
      resilience: '💪 Resiliencia',
      action: '⚡ Acción',
      empathy: '💚 Empatía',
      leadership: '👑 Liderazgo',
      courage: '🦁 Coraje',
      consciousness: '✨ Consciencia',
      wisdom: '🦉 Sabiduría',
      analysis: '🔍 Análisis',
      reflection: '🪞 Reflexión',
      creativity: '🎨 Creatividad'
    };

    const attrs = Object.entries(option.attributes || {})
      .map(([attr, value]) => `<span style="background: rgba(212, 175, 55, 0.2); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${attrLabels[attr] || attr} +${value}</span>`)
      .join(' ');

    let extras = '';
    if (option.risk) {
      const riskColors = { low: '#85c54e', medium: '#d4af37', high: '#ff6b35' };
      extras += `<span style="color: ${riskColors[option.risk]}; font-size: 0.85rem;">⚠️ Riesgo: ${option.risk}</span> `;
    }
    if (option.speed) {
      extras += `<span style="color: #a0a0a0; font-size: 0.85rem;">⏱️ ${option.speed}</span> `;
    }

    return `
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
        ${attrs}
      </div>
      ${extras ? `<div style="margin-top: 0.5rem;">${extras}</div>` : ''}
    `;
  }

  /**
   * Manejar respuesta del jugador
   */
  handleAnswer(optionIndex) {
    const result = this.challengeSystem.evaluateAnswer(
      this.challengeSystem.currentChallengeIndex,
      optionIndex
    );

    if (!result) return;

    // Actualizar puntuación
    document.getElementById('current-score').textContent = result.totalScore;

    // Actualizar progreso
    const progress = (result.completed / result.total) * 100;
    document.getElementById('challenges-progress-bar').style.width = `${progress}%`;

    // Mostrar feedback
    this.showFeedback(result, optionIndex);
  }

  /**
   * Mostrar feedback de la respuesta
   */
  showFeedback(result, optionIndex) {
    const challenge = this.challengeSystem.challenges[this.challengeSystem.currentChallengeIndex];
    const container = document.getElementById('challenge-content');

    // Marcar opción seleccionada
    const buttons = container.querySelectorAll('.challenge-option-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === optionIndex) {
        btn.classList.add('selected');
        btn.style.borderColor = result.success ? '#85c54e' : '#ff6b35';
      }
    });

    // Agregar feedback
    const feedbackHTML = `
      <div style="
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: ${result.success ? 'rgba(133, 197, 78, 0.15)' : 'rgba(255, 107, 53, 0.15)'};
        border: 2px solid ${result.success ? '#85c54e' : '#ff6b35'};
        border-radius: 12px;
      ">
        <div style="
          font-size: 2rem;
          text-align: center;
          margin-bottom: 1rem;
        ">
          ${result.success ? '✅ ¡Éxito!' : '❌ Podría mejorar'}
        </div>
        <div style="
          text-align: center;
          font-size: 1.5rem;
          color: #d4af37;
          margin-bottom: 1rem;
        ">
          +${result.score} puntos
        </div>

        <div style="margin-bottom: 1rem;">
          ${result.feedback.map(f => `
            <div class="feedback-item ${f.success ? 'success' : (f.bonus ? 'bonus' : 'failure')}">
              <span style="color: #f4e9d8;">${f.message}</span>
            </div>
          `).join('')}
        </div>

        <button id="next-challenge-btn" style="
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #d4af37 0%, #b87333 100%);
          border: none;
          border-radius: 8px;
          color: #0a0a0f;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${result.completed < result.total ? '➡️ Siguiente Reto' : '🏆 Ver Resultados'}
        </button>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', feedbackHTML);

    // Event listener para siguiente
    document.getElementById('next-challenge-btn').addEventListener('click', () => {
      if (this.challengeSystem.getNextChallenge()) {
        this.renderCurrentChallenge();
      } else {
        this.showFinalResults();
      }
    });

    // Scroll al feedback
    container.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Mostrar resultados finales
   */
  showFinalResults() {
    const results = this.challengeSystem.getFinalResults();

    document.getElementById('challenge-content').style.display = 'none';
    const container = document.getElementById('final-results');
    container.style.display = 'block';

    const rankEmojis = {
      'Maestro Legendario': '🏆👑',
      'Maestro': '🥇',
      'Experto': '🥈',
      'Competente': '🥉',
      'Novato Avanzado': '📜',
      'Aprendiz': '🌱'
    };

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="font-size: 4rem; margin-bottom: 0.5rem;">
          ${rankEmojis[results.rank] || '🎮'}
        </div>
        <div class="result-rank">${results.rank}</div>
        <div style="color: #a0a0a0; font-size: 1rem;">
          ${results.being} en misión ${results.mission}
        </div>
      </div>

      <div style="
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
      ">
        <div style="
          text-align: center;
          padding: 1.5rem;
          background: rgba(133, 197, 78, 0.15);
          border: 2px solid #85c54e;
          border-radius: 12px;
        ">
          <div style="font-size: 2rem; font-weight: 700; color: #85c54e;">${results.score}</div>
          <div style="color: #a0a0a0; font-size: 0.85rem;">Puntos</div>
        </div>
        <div style="
          text-align: center;
          padding: 1.5rem;
          background: rgba(212, 175, 55, 0.15);
          border: 2px solid #d4af37;
          border-radius: 12px;
        ">
          <div style="font-size: 2rem; font-weight: 700; color: #d4af37;">${results.successRate}%</div>
          <div style="color: #a0a0a0; font-size: 0.85rem;">Éxito</div>
        </div>
        <div style="
          text-align: center;
          padding: 1.5rem;
          background: rgba(65, 105, 225, 0.15);
          border: 2px solid #4169e1;
          border-radius: 12px;
        ">
          <div style="font-size: 2rem; font-weight: 700; color: #4169e1;">${results.challengesCompleted}/${results.totalChallenges}</div>
          <div style="color: #a0a0a0; font-size: 0.85rem;">Completados</div>
        </div>
      </div>

      <div style="margin-bottom: 2rem;">
        <h3 style="color: #d4af37; margin-bottom: 1rem;">📊 Resumen de Retos</h3>
        ${results.challenges.map(ch => `
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background: rgba(139, 115, 85, 0.15);
            border-radius: 8px;
            margin-bottom: 0.5rem;
          ">
            <span style="color: #f4e9d8;">Reto ${ch.number}: ${ch.type}</span>
            <span style="color: ${ch.completed ? '#85c54e' : '#ff6b35'}; font-weight: 700;">
              ${ch.completed ? `+${ch.score}` : 'Pendiente'}
            </span>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 1rem;">
        <button id="retry-challenges-btn" style="
          flex: 1;
          padding: 1rem;
          background: linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%);
          border: 2px solid #85c54e;
          border-radius: 8px;
          color: #f4e9d8;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        ">
          🔄 Reintentar
        </button>
        <button id="close-challenges-btn" style="
          flex: 1;
          padding: 1rem;
          background: linear-gradient(135deg, #d4af37 0%, #b87333 100%);
          border: none;
          border-radius: 8px;
          color: #0a0a0f;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        ">
          ✅ Finalizar
        </button>
      </div>
    `;

    // Event listeners
    document.getElementById('retry-challenges-btn').addEventListener('click', () => {
      this.open(this.currentBeing, this.currentMission);
    });

    document.getElementById('close-challenges-btn').addEventListener('click', () => {
      this.close();
      // Dar recompensas si el sistema existe
      if (window.frankensteinRewards) {
        const xpGained = Math.round(results.score * 0.5);
        window.frankensteinRewards.addXP(xpGained, 'challenges_completed');
        if (results.successRate >= 70) {
          window.frankensteinRewards.addCoins(10, 'challenge_success');
        }
      }
    });
  }

  /**
   * Mostrar notificación
   */
  showNotification(message, type = 'info') {
    if (window.frankensteinUI && window.frankensteinUI.showNotification) {
      window.frankensteinUI.showNotification(message, type);
    } else if (window.showToast) {
      window.showToast(message, type);
    } else {
      logger.debug(`[${type}] ${message}`);
    }
  }

  /**
   * Cerrar modal
   */
  close() {
    // 🔧 FIX v2.9.270: Limpiar ESC handler
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }

    this.modal.style.display = 'none';
    this.isOpen = false;
    document.body.style.overflow = '';

    // Reset contenido
    document.getElementById('challenge-content').style.display = 'block';
    document.getElementById('final-results').style.display = 'none';
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

// Inicializar y exportar
document.addEventListener('DOMContentLoaded', () => {
  window.frankensteinChallengesModal = new FrankensteinChallengesModal();
  window.frankensteinChallengesModal.init();
});

// También exportar clase
window.FrankensteinChallengesModal = FrankensteinChallengesModal;
logger.debug('🎮 Frankenstein Challenges Modal cargado');
