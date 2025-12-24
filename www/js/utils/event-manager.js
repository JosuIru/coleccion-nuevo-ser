/**
 * EVENT MANAGER
 * Sistema centralizado para gestión de event listeners
 * Soluciona memory leaks por acumulación de listeners
 *
 * @version 1.0.0
 */

class EventManager {
  constructor(debugMode = false) {
    this.listeners = new Map();
    this.debugMode = debugMode;
    this.componentName = 'EventManager';
  }

  /**
   * Añade un event listener de forma segura
   * Si ya existe un listener para ese elemento/evento, lo remueve primero
   */
  addEventListener(target, event, handler, options = {}) {
    if (!target) {
      this.log('warn', `Target is null for event: ${event}`);
      return;
    }

    const key = this.getKey(target, event);

    // Remover listener anterior si existe
    const oldListener = this.listeners.get(key);
    if (oldListener) {
      this.log('debug', `Removing old listener for: ${key}`);
      target.removeEventListener(event, oldListener.handler, oldListener.options);
    }

    // Añadir nuevo listener
    target.addEventListener(event, handler, options);
    this.listeners.set(key, { target, event, handler, options });

    this.log('debug', `Added listener for: ${key} (total: ${this.listeners.size})`);
  }

  /**
   * Añade un event listener usando delegación
   * Útil para elementos dinámicos
   */
  addDelegatedListener(parentTarget, event, selector, handler, options = {}) {
    const delegatedHandler = (e) => {
      const target = e.target.closest(selector);
      if (target) {
        handler.call(target, e);
      }
    };

    this.addEventListener(parentTarget, event, delegatedHandler, options);
  }

  /**
   * Remueve un event listener específico
   */
  removeEventListener(target, event) {
    if (!target) return;

    const key = this.getKey(target, event);
    const listener = this.listeners.get(key);

    if (listener) {
      target.removeEventListener(event, listener.handler, listener.options);
      this.listeners.delete(key);
      this.log('debug', `Removed listener for: ${key} (remaining: ${this.listeners.size})`);
    }
  }

  /**
   * Limpia todos los event listeners registrados
   * CRÍTICO: Llamar en cleanup/destroy de componentes
   */
  cleanup() {
    this.log('info', `Cleaning up ${this.listeners.size} listeners`);

    this.listeners.forEach((listener, key) => {
      try {
        if (listener.target && typeof listener.target.removeEventListener === 'function') {
          listener.target.removeEventListener(
            listener.event,
            listener.handler,
            listener.options
          );
        }
      } catch (error) {
        this.log('error', `Error removing listener ${key}:`, error);
      }
    });

    this.listeners.clear();
    this.log('info', 'Cleanup completed');
  }

  /**
   * Obtiene estadísticas de listeners activos
   */
  getStats() {
    const stats = {
      total: this.listeners.size,
      byEvent: {},
      byTarget: {}
    };

    this.listeners.forEach((listener, key) => {
      const [targetId, event] = key.split(':');

      // Por evento
      stats.byEvent[event] = (stats.byEvent[event] || 0) + 1;

      // Por target
      stats.byTarget[targetId] = (stats.byTarget[targetId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Genera una key única para el listener
   */
  getKey(target, event) {
    let targetId;

    if (target === window) {
      targetId = 'window';
    } else if (target === document) {
      targetId = 'document';
    } else if (target.id) {
      targetId = target.id;
    } else if (target.dataset?.eventId) {
      targetId = target.dataset.eventId;
    } else {
      // Generar ID único si no existe
      if (!target.__eventManagerId) {
        target.__eventManagerId = `elem-${Math.random().toString(36).substr(2, 9)}`;
      }
      targetId = target.__eventManagerId;
    }

    return `${targetId}:${event}`;
  }

  /**
   * Logging interno
   */
  log(level, ...args) {
    if (!this.debugMode && level === 'debug') return;

    const prefix = `[${this.componentName}]`;

    switch (level) {
      case 'debug':
        console.log(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        break;
    }
  }

  /**
   * Establece el nombre del componente para logging
   */
  setComponentName(name) {
    this.componentName = name;
  }
}

// Exportar clase
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventManager;
} else {
  window.EventManager = EventManager;
}
