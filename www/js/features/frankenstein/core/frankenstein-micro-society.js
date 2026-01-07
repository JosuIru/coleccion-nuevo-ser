/**
 * @file frankenstein-micro-society.js
 * @description Sistema de microsociedades para el Laboratorio Frankenstein
 *
 * Este módulo gestiona la creación, simulación y visualización de microsociedades,
 * permitiendo crear comunidades evolutivas de seres transformadores que interactúan
 * y responden a eventos dinámicos.
 *
 * Características principales:
 * - Creación de microsociedades con variaciones de seres
 * - Simulación local de eventos y métricas
 * - Renderizado de cards y modales
 * - Gestión de eventos dinámicos
 * - Integración con sistemas externos de microsociedades
 *
 * @version 2.0.0
 * @date 2025-12-28
 */

/**
 * @class FrankensteinMicroSociety
 * @description Gestiona microsociedades de seres transformadores
 *
 * @example
 * const microSociety = new FrankensteinMicroSociety(missionsSystem, labUI, domCache);
 * const society = microSociety.create(currentBeing, { count: 7 });
 * microSociety.renderCard();
 */
export class FrankensteinMicroSociety {
  /**
   * Constructor del sistema de microsociedades
   *
   * @param {Object} missionsSystemRef - Referencia al sistema de misiones
   * @param {Object} labUIRef - Referencia al UI del laboratorio
   * @param {Object} domCache - Cache de elementos DOM
   */
  constructor(missionsSystemRef, labUIRef, domCache) {
    this.missionsSystem = missionsSystemRef;
    this.labUI = labUIRef;
    this.dom = domCache;

    // Estado de microsociedades
    this.microSocietySnapshot = null;
    this.microEventHistory = [];

    // Definición de eventos dinámicos disponibles
    this.microSocietyEvents = [
      {
        id: 'research',
        label: 'Explorar piezas',
        description: 'Investigar nuevas piezas y compartir aprendizajes.',
        deltas: { knowledge: 8, action: 3 }
      },
      {
        id: 'care',
        label: 'Círculo de cuidado',
        description: 'Activar redes de apoyo y fortalecer la cohesión.',
        deltas: { cohesion: 10, health: 4 }
      },
      {
        id: 'respond',
        label: 'Responder crisis',
        description: 'Actuar rápido ante desafíos y demostrar resiliencia.',
        deltas: { action: 7, resilience: 5, health: -2 }
      }
    ];

    // Referencias a funciones del labUI (para backward compatibility)
    this._setTimeout = this.labUI?._setTimeout?.bind(this.labUI) || setTimeout;
    this.showNotification = this.labUI?.showNotification?.bind(this.labUI) || console.log;
    this.currentBeing = null;
    this.selectedMission = null;
  }

  /**
   * Establecer el ser actual
   *
   * @param {Object} being - Ser transformador actual
   */
  setCurrentBeing(being) {
    this.currentBeing = being;
  }

  /**
   * Establecer la misión seleccionada
   *
   * @param {Object} mission - Misión seleccionada
   */
  setSelectedMission(mission) {
    this.selectedMission = mission;
  }

  /**
   * Crear microsociedad con variaciones del ser actual
   *
   * @param {Object} being - Ser base para crear variaciones
   * @param {Object} societyConfig - Configuración de la microsociedad
   * @param {number} societyConfig.count - Número de seres iniciales (5-12)
   * @param {string} societyConfig.name - Nombre de la microsociedad
   * @param {string} societyConfig.goal - Objetivo de la microsociedad
   * @returns {Object|null} Datos de la microsociedad creada o null si hay error
   */
  create(being, societyConfig = {}) {
    if (!being) {
      this.showNotification('⚠️ No hay ser creado para la microsociedad', 'warning');
      return null;
    }

    // Configuración por defecto
    const defaultConfig = {
      count: 7,
      name: null,
      goal: null
    };

    const config = { ...defaultConfig, ...societyConfig };

    // Validar número de seres
    let beingsCount = config.count;
    if (typeof beingsCount !== 'number' || isNaN(beingsCount)) {
      beingsCount = parseInt(beingsCount);
    }

    if (isNaN(beingsCount) || beingsCount < 5 || beingsCount > 12) {
      this.showNotification('⚠️ Número de seres debe estar entre 5 y 12', 'error');
      return null;
    }

    // Crear variaciones del ser actual
    const beings = [being];

    // Crear (count - 1) variaciones con mutaciones aleatorias
    for (let i = 1; i < beingsCount; i++) {
      const variation = this.createBeingVariation(being, i);
      beings.push(variation);
    }

    const societyName = config.name || `${being.name || 'Microsociedad'} (${beingsCount} seres)`;
    const societyGoal = config.goal || this.selectedMission?.name || 'Explorar cooperación evolutiva';
    let society = null;
    let usedLocalFallback = false;

    // Intentar usar sistema externo de microsociedades
    if (typeof window.createMicroSocietyFromBeings === 'function') {
      window.createMicroSocietyFromBeings(beings);
    } else {
      const manager = this.ensureMicroSocietiesManager();
      if (manager?.createSociety) {
        society = manager.createSociety(societyName, beings, societyGoal);
      } else {
        usedLocalFallback = true;
        society = this.simulate(beings, { name: societyName, goal: societyGoal });
      }
    }

    // Guardar snapshot para visualización
    this.microSocietySnapshot = {
      name: societyName,
      beingsCount: beingsCount,
      metrics: this.estimateMetrics(beings),
      updatedAt: new Date().toISOString()
    };

    // Renderizar card
    this.renderCard();

    // Abrir modal si es necesario
    if (society) {
      if (!usedLocalFallback && typeof window.openMicroSocietiesModal === 'function') {
        window.openMicroSocietiesModal(society);
      } else if (usedLocalFallback) {
        this.renderBasicModal(society);
      }
    }

    this.showNotification(`🌍 Microsociedad creada con ${beingsCount} seres`, 'success');

    return society;
  }

  /**
   * Crear variación de un ser con mutaciones aleatorias
   *
   * @param {Object} originalBeing - Ser original a mutar
   * @param {number} variationIndex - Índice de la variación
   * @returns {Object} Ser variado con mutaciones
   */
  createBeingVariation(originalBeing, variationIndex) {
    const variation = {
      name: `${originalBeing.name} (v${variationIndex})`,
      pieces: originalBeing.pieces,
      attributes: {},
      totalPower: 0
    };

    // Mutar atributos ±10%
    Object.entries(originalBeing.attributes).forEach(([attr, value]) => {
      const mutation = (Math.random() - 0.5) * 0.2; // ±10%
      variation.attributes[attr] = Math.max(0, value * (1 + mutation));
    });

    // Recalcular poder total
    variation.totalPower = originalBeing.totalPower * (0.9 + Math.random() * 0.2); // 90%-110%

    return variation;
  }

  /**
   * Simular microsociedad localmente sin sistema externo
   *
   * @param {Array} beings - Lista de seres para la microsociedad
   * @param {Object} simulationConfig - Configuración de la simulación
   * @param {string} simulationConfig.name - Nombre de la microsociedad
   * @param {string} simulationConfig.goal - Objetivo de la microsociedad
   * @returns {Object} Datos de la microsociedad simulada
   */
  simulate(beings, { name, goal } = {}) {
    const preparedBeings = beings.map((being, index) => {
      const clone = JSON.parse(JSON.stringify(being));
      clone.id = clone.id || `being-${Date.now()}-${index}`;
      clone.alive = clone.alive ?? true;
      clone.totalPower = Math.round(
        clone.totalPower ||
        Object.values(clone.attributes || {}).reduce((acc, value) => acc + (value || 0), 0)
      );
      return clone;
    });

    const metrics = this.estimateMetrics(preparedBeings);

    return {
      name: name || 'Microsociedad Experimental',
      goal: goal || 'Explorar cooperación evolutiva',
      beings: preparedBeings,
      turn: 0,
      metrics,
      metricsHistory: [{ turn: 0, ...metrics }],
      eventLog: [{
        turn: 0,
        icon: '🧪',
        text: 'Microsociedad inicializada'
      }]
    };
  }

  /**
   * Estimar métricas de una microsociedad basándose en los seres
   *
   * @param {Array} beings - Lista de seres de la microsociedad
   * @returns {Object} Métricas estimadas (health, knowledge, action, cohesion)
   */
  estimateMetrics(beings = []) {
    const safeBeings = (beings && beings.length > 0)
      ? beings
      : (this.currentBeing ? [this.currentBeing] : []);

    if (safeBeings.length === 0) {
      return { health: '--', knowledge: '--', action: '--', cohesion: '--' };
    }

    const averageAttr = (attr) => {
      const sum = safeBeings.reduce((acc, being) =>
        acc + (being.attributes?.[attr] || being[attr] || 0), 0);
      return sum / safeBeings.length;
    };

    return {
      health: Math.round((averageAttr('resilience') + averageAttr('organization')) / 2 || 60),
      knowledge: Math.round((averageAttr('wisdom') + averageAttr('analysis')) / 2 || 50),
      action: Math.round((averageAttr('action') + averageAttr('strategy')) / 2 || 50),
      cohesion: Math.round((averageAttr('empathy') + averageAttr('communication')) / 2 || 60)
    };
  }

  /**
   * Renderizar card de microsociedad en el workspace
   */
  renderCard() {
    const body = document.getElementById('microsociety-body');
    const titleEl = document.getElementById('microsociety-title');

    if (!body) return;

    if (this.microSocietySnapshot) {
      const snap = this.microSocietySnapshot;
      if (titleEl) titleEl.textContent = snap.name || 'Microsociedad';

      const metrics = snap.metrics || {};

      const eventsMarkup = this.microSocietyEvents.map(event => `
        <button class="micro-event-btn" data-event="${event.id}">
          <span>${event.label}</span>
          <small>${event.description}</small>
        </button>
      `).join('');

      const historyMarkup = this.microEventHistory.length
        ? this.microEventHistory.slice(0, 3).map(entry => `
            <div class="micro-event-history-item">
              <strong>${entry.label}</strong>
              <p>${entry.description}</p>
              <small>${new Date(entry.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
          `).join('')
        : '<p class="micro-event-empty">Aún no hay eventos dinámicos.</p>';

      body.innerHTML = `
        <div class="microsociety-meta">
          <div class="microsociety-meta-item">
            <span>Seres</span>
            <strong>${snap.beingsCount || snap.beings?.length || 0}</strong>
          </div>
          <div class="microsociety-meta-item">
            <span>Última actualización</span>
            <strong>${new Date(snap.updatedAt || Date.now()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
        </div>
        <div class="microsociety-metrics">
          <div class="micro-metric"><span>❤️ Salud</span><strong>${metrics.health ?? '--'}</strong></div>
          <div class="micro-metric"><span>📚 Conocimiento</span><strong>${metrics.knowledge ?? '--'}</strong></div>
          <div class="micro-metric"><span>⚡ Acción</span><strong>${metrics.action ?? '--'}</strong></div>
          <div class="micro-metric"><span>🤝 Cohesión</span><strong>${metrics.cohesion ?? '--'}</strong></div>
        </div>
        <div class="micro-event-panel">
          <h4>Eventos rápidos</h4>
          <div class="micro-event-buttons">
            ${eventsMarkup}
          </div>
          <div class="micro-event-history">
            ${historyMarkup}
          </div>
        </div>
        <p class="microsociety-hint">Pulsa "Simular" para abrir el gestor completo o "Crear" para generar otra variante con este ser.</p>
      `;

      this.wireEventButtons();
      return;
    }

    // Estado vacío
    const demoAvailable = window.FrankensteinDemoData?.getDemoMicrosocieties;
    if (titleEl) titleEl.textContent = 'Sin simulación';

    body.innerHTML = `
      <p class="empty-card-message">Crea una microsociedad con tu ser (botón "Crear") y revisa cómo responden sus atributos a eventos.</p>
      ${demoAvailable ? `<button class="micro-action secondary" id="btn-demo-microsociety">Ver demo</button>` : ''}
    `;

    const demoBtn = document.getElementById('btn-demo-microsociety');
    if (demoBtn) {
      demoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.previewDemo();
      });
    }
  }

  /**
   * Conectar event handlers a los botones de eventos
   */
  wireEventButtons() {
    const body = document.getElementById('microsociety-body');
    if (!body) return;

    body.querySelectorAll('.micro-event-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.triggerEvent(btn.dataset.event);
      });
    });
  }

  /**
   * Disparar un evento dinámico en la microsociedad
   *
   * @param {string} eventId - ID del evento a disparar
   */
  triggerEvent(eventId) {
    if (!this.microSocietySnapshot) return;

    const event = this.microSocietyEvents.find(evt => evt.id === eventId);
    if (!event) return;

    const metrics = this.microSocietySnapshot.metrics || {};

    // Aplicar deltas del evento a las métricas
    Object.entries(event.deltas || {}).forEach(([key, delta]) => {
      const current = metrics[key] ?? 50;
      metrics[key] = Math.min(100, Math.max(0, current + delta));
    });

    this.microSocietySnapshot.metrics = metrics;
    this.microSocietySnapshot.updatedAt = new Date().toISOString();

    // Registrar en historial
    this.microEventHistory.unshift({
      label: event.label,
      description: event.description,
      timestamp: Date.now()
    });

    if (this.microEventHistory.length > 5) {
      this.microEventHistory.pop();
    }

    this.showNotification(`🎯 Evento: ${event.label}`, 'success', 2500);
    this.renderCard();
  }

  /**
   * Previsualizar microsociedad demo
   */
  previewDemo() {
    const demoSocieties = window.FrankensteinDemoData?.getDemoMicrosocieties?.();

    if (!demoSocieties || demoSocieties.length === 0) {
      this.showNotification('⚠️ No hay microsociedades demo disponibles.', 'warning');
      return;
    }

    const random = demoSocieties[Math.floor(Math.random() * demoSocieties.length)];

    this.microSocietySnapshot = {
      name: random.name || 'Microsociedad Demo',
      metrics: this.estimateMetrics(random.beings || []),
      beingsCount: random.beings?.length || 0,
      updatedAt: new Date().toISOString()
    };

    this.renderCard();
    this.showNotification('✨ Mostrando microsociedad demo. Usa "Simular" para explorar más.', 'info', 4000);
  }

  /**
   * Abrir simulador completo de microsociedades
   */
  openSimulator() {
    // Preferir el nuevo panel de microsociedades
    if (window.microsocietiesInit && typeof window.microsocietiesInit.open === 'function') {
      window.microsocietiesInit.open();
      return;
    }

    // Fallback: galería si está disponible
    if (window.microsocietiesGallery && typeof window.microsocietiesGallery.open === 'function') {
      window.microsocietiesGallery.open();
      return;
    }

    // Asegurar que exista un manager de microsociedades
    const manager = this.ensureMicroSocietiesManager();
    if (!manager) {
      this.showNotification('Sistema de microsociedades no disponible', 'info');
      return;
    }

    let society = manager.getCurrentSociety();

    // Crear sociedad base si no existe ninguna
    if (!society) {
      const beings = this.loadBeings();
      if (!beings.length) {
        this.showNotification('Crea o guarda un ser para iniciar una microsociedad', 'warning');
        return;
      }

      const seedBeings = beings.slice(0, Math.min(8, beings.length));
      society = manager.createSociety(
        `Microsociedad ${seedBeings[0]?.name || 'sin nombre'}`,
        seedBeings,
        'Explorar cooperación evolutiva'
      );
    }

    // Usar modal nativo del sistema completo si existe
    if (typeof window.openMicroSocietiesModal === 'function') {
      if (society) {
        this.microSocietySnapshot = {
          name: society.name,
          beingsCount: society.beings?.length || 0,
          metrics: this.estimateMetrics(society.beings || []),
          updatedAt: new Date().toISOString()
        };
        this.renderCard();
      }
      window.openMicroSocietiesModal(society);
      return;
    }

    // Fallback a un modal resumido propio
    if (society) {
      this.microSocietySnapshot = {
        name: society.name,
        beingsCount: society.beings?.length || 0,
        metrics: this.estimateMetrics(society.beings || []),
        updatedAt: new Date().toISOString()
      };
      this.renderCard();
    }

    this.renderBasicModal(society);
  }

  /**
   * Renderizar modal básico con el estado actual de la microsociedad
   *
   * @param {Object} society - Datos de la microsociedad
   */
  renderBasicModal(society) {
    if (!society) {
      this.showNotification('⚠️ No hay datos de microsociedad para mostrar.', 'warning');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-overlay-enhanced active';

    const livingBeings = society.beings.filter(b => b.alive);
    const metrics = society.metrics || {};

    const metricItems = Object.entries(metrics).map(([key, value]) => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:0.75rem 1rem;">
        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#cbd5f5">${key}</div>
        <div style="font-size:1.4rem;font-weight:600;color:#ffffff">${Math.round(value)}</div>
      </div>
    `).join('');

    const beingsList = livingBeings.slice(0, 5).map(being => `
      <li style="background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.2);border-radius:10px;padding:0.75rem 1rem;">
        <strong style="color:#f8fafc">${being.name}</strong>
        <span style="display:block;font-size:0.85rem;color:#a7f3d0">Poder: ${Math.round(being.totalPower || 0)}</span>
      </li>
    `).join('') || '<li>No hay seres disponibles</li>';

    overlay.innerHTML = `
      <div class="modal-content modal-content-enhanced" style="max-width: 640px;">
        <div class="modal-header">
          <div>
            <h2>🌍 ${society.name}</h2>
            <p class="text-sm text-gray-300">Turno ${society.turn} · ${livingBeings.length} seres activos</p>
          </div>
          <button class="modal-close" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <section class="mb-4">
            <h3 class="text-lg mb-2">Estado actual</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              ${metricItems || '<p>No hay métricas disponibles</p>'}
            </div>
          </section>

          <section class="mb-4">
            <h3 class="text-lg mb-2">Seres activos</h3>
            <ul class="space-y-2">${beingsList}</ul>
          </section>

          <section>
            <p class="text-sm text-gray-300">
              La experiencia completa de microsociedades se encuentra en desarrollo.
              Este resumen permite verificar que los datos se generaron correctamente.
            </p>
          </section>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('.modal-close')) {
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);
  }

  /**
   * Asegurar que exista un manager de microsociedades
   *
   * @returns {Object|null} Manager de microsociedades o null si no está disponible
   */
  ensureMicroSocietiesManager() {
    if (window.microSocietiesManager) {
      return window.microSocietiesManager;
    }

    const ManagerClass = window.MicroSocietiesManager || window.FrankensteinMicrosocieties;
    if (ManagerClass) {
      window.microSocietiesManager = new ManagerClass();
      return window.microSocietiesManager;
    }

    return null;
  }

  /**
   * Cargar seres guardados desde localStorage
   *
   * @returns {Array} Lista de seres guardados
   */
  loadBeings() {
    try {
      const saved = localStorage.getItem('frankenstein-saved-beings');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      logger.error('[FrankensteinMicroSociety] Error loading beings:', error);
      return [];
    }
  }

  /**
   * Obtener snapshot actual de la microsociedad
   *
   * @returns {Object|null} Snapshot de microsociedad o null
   */
  getSnapshot() {
    return this.microSocietySnapshot;
  }

  /**
   * Obtener historial de eventos
   *
   * @returns {Array} Historial de eventos
   */
  getEventHistory() {
    return this.microEventHistory;
  }

  /**
   * Limpiar estado de microsociedades
   */
  clearState() {
    this.microSocietySnapshot = null;
    this.microEventHistory = [];
    this.renderCard();
  }

  /**
   * Destruir instancia y limpiar recursos
   */
  destroy() {
    this.clearState();
    this.missionsSystem = null;
    this.labUI = null;
    this.dom = null;
  }
}

// Exportar por defecto para compatibilidad
export default FrankensteinMicroSociety;
