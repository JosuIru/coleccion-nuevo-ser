/**
 * EVENT BUS - Sistema Centralizado de Eventos
 * ============================================
 *
 * Sistema de comunicación basado en eventos para desacoplar componentes
 * de la aplicación Colección Nuevo Ser.
 *
 * CARACTERÍSTICAS:
 * - Registro y eliminación de listeners
 * - Soporte para listeners de una sola ejecución (once)
 * - Namespaces para organizar eventos jerárquicamente
 * - Manejo de wildcards para escuchar múltiples eventos
 * - Debugging integrado para desarrollo
 *
 * USO BÁSICO:
 * -----------
 *
 * // Registrar un listener
 * eventBus.on('book.changed', (data) => {
 *   console.log('Libro cambiado:', data.bookId);
 * });
 *
 * // Emitir un evento
 * eventBus.emit('book.changed', { bookId: 'codigo-despertar' });
 *
 * // Listener de una sola ejecución
 * eventBus.once('app.initialized', () => {
 *   console.log('App inicializada - ejecutado solo una vez');
 * });
 *
 * // Remover un listener específico
 * const handler = (data) => console.log(data);
 * eventBus.on('user.login', handler);
 * eventBus.off('user.login', handler);
 *
 * // Remover todos los listeners de un evento
 * eventBus.off('user.login');
 *
 * NAMESPACES RECOMENDADOS:
 * ------------------------
 *
 * book.*           - Eventos relacionados con libros
 *   book.opened    - Se abrió un libro
 *   book.closed    - Se cerró un libro
 *   book.changed   - Cambió el libro activo
 *   book.progress  - Progreso de lectura actualizado
 *
 * ui.*             - Eventos de interfaz de usuario
 *   ui.sidebar.toggle   - Toggle del sidebar
 *   ui.modal.open       - Modal abierto
 *   ui.modal.close      - Modal cerrado
 *   ui.theme.changed    - Tema cambiado
 *
 * audio.*          - Eventos de audio
 *   audio.play     - Audio reproducido
 *   audio.pause    - Audio pausado
 *   audio.ended    - Audio terminado
 *   audio.error    - Error en audio
 *
 * user.*           - Eventos de usuario
 *   user.login     - Usuario autenticado
 *   user.logout    - Usuario desconectado
 *   user.updated   - Datos de usuario actualizados
 *
 * ai.*             - Eventos de IA
 *   ai.response    - Respuesta de IA recibida
 *   ai.error       - Error en petición de IA
 *   ai.streaming   - Streaming de respuesta
 *
 * app.*            - Eventos de aplicación
 *   app.initialized  - App inicializada
 *   app.ready        - App lista para usar
 *   app.error        - Error global de app
 *
 * EJEMPLOS AVANZADOS:
 * -------------------
 *
 * // Pasar datos complejos
 * eventBus.emit('book.progress', {
 *   bookId: 'codigo-despertar',
 *   chapter: 3,
 *   percentage: 45.5,
 *   timestamp: Date.now()
 * });
 *
 * // Múltiples listeners para el mismo evento
 * eventBus.on('user.login', updateHeader);
 * eventBus.on('user.login', loadUserPreferences);
 * eventBus.on('user.login', syncWithServer);
 *
 * // Listener que se auto-elimina después de ejecutarse
 * eventBus.once('app.initialized', () => {
 *   // Código de inicialización que solo debe ejecutarse una vez
 *   loadInitialData();
 * });
 *
 * // Debugging - ver todos los eventos emitidos
 * eventBus.enableDebug();
 *
 * BUENAS PRÁCTICAS:
 * -----------------
 *
 * 1. Usar nombres descriptivos y consistentes para eventos
 * 2. Documentar los eventos que emite cada componente
 * 3. Limpiar listeners cuando un componente se destruye
 * 4. Usar namespaces para organizar eventos relacionados
 * 5. Pasar objetos como datos para mayor flexibilidad futura
 * 6. Evitar lógica compleja en los listeners
 * 7. Considerar el orden de ejecución de listeners
 *
 */

class EventBus {
  constructor() {
    // Almacena los listeners organizados por nombre de evento
    this.listeners = {};

    // Flag para habilitar mensajes de debug en consola
    this.debugMode = false;

    // Contador de eventos emitidos (útil para debugging)
    this.eventCount = 0;
  }

  /**
   * Registra un listener para un evento específico
   *
   * @param {string} eventName - Nombre del evento (soporta namespaces con puntos)
   * @param {function} callback - Función a ejecutar cuando se emita el evento
   * @returns {EventBus} - Retorna this para permitir encadenamiento
   *
   * @example
   * eventBus.on('book.opened', (data) => {
   *   console.log('Libro abierto:', data.bookId);
   * });
   */
  on(eventName, callback) {
    if (typeof eventName !== 'string' || !eventName.trim()) {
      console.error('EventBus.on: eventName debe ser un string no vacío');
      return this;
    }

    if (typeof callback !== 'function') {
      console.error('EventBus.on: callback debe ser una función');
      return this;
    }

    // Crear array de listeners si no existe
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    // Agregar callback al array
    this.listeners[eventName].push(callback);

    if (this.debugMode) {
      console.log(`[EventBus] Listener registrado: ${eventName} (total: ${this.listeners[eventName].length})`);
    }

    return this;
  }

  /**
   * Remueve un listener de un evento
   *
   * @param {string} eventName - Nombre del evento
   * @param {function} [callback] - Callback específico a remover (opcional)
   *                                Si no se proporciona, remueve todos los listeners del evento
   * @returns {EventBus} - Retorna this para permitir encadenamiento
   *
   * @example
   * // Remover un listener específico
   * eventBus.off('book.opened', myHandler);
   *
   * // Remover todos los listeners de un evento
   * eventBus.off('book.opened');
   */
  off(eventName, callback) {
    if (typeof eventName !== 'string' || !eventName.trim()) {
      console.error('EventBus.off: eventName debe ser un string no vacío');
      return this;
    }

    if (!this.listeners[eventName]) {
      return this;
    }

    // Si no se proporciona callback, remover todos los listeners del evento
    if (!callback) {
      const listenerCount = this.listeners[eventName].length;
      delete this.listeners[eventName];

      if (this.debugMode) {
        console.log(`[EventBus] Removidos ${listenerCount} listeners de: ${eventName}`);
      }

      return this;
    }

    // Remover solo el callback específico
    const initialLength = this.listeners[eventName].length;
    this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);

    if (this.debugMode && initialLength !== this.listeners[eventName].length) {
      console.log(`[EventBus] Listener removido: ${eventName}`);
    }

    // Si no quedan listeners, eliminar el array
    if (this.listeners[eventName].length === 0) {
      delete this.listeners[eventName];
    }

    return this;
  }

  /**
   * Emite un evento, ejecutando todos los listeners registrados
   *
   * @param {string} eventName - Nombre del evento a emitir
   * @param {*} [data] - Datos a pasar a los listeners (opcional)
   * @returns {EventBus} - Retorna this para permitir encadenamiento
   *
   * @example
   * eventBus.emit('book.changed', {
   *   bookId: 'codigo-despertar',
   *   timestamp: Date.now()
   * });
   */
  emit(eventName, data) {
    if (typeof eventName !== 'string' || !eventName.trim()) {
      console.error('EventBus.emit: eventName debe ser un string no vacío');
      return this;
    }

    this.eventCount++;

    if (this.debugMode) {
      console.log(`[EventBus] Evento emitido: ${eventName}`, data);
    }

    // Si no hay listeners para este evento, salir
    if (!this.listeners[eventName]) {
      if (this.debugMode) {
        console.log(`[EventBus] No hay listeners para: ${eventName}`);
      }
      return this;
    }

    // Crear copia del array de listeners para evitar problemas si se modifican durante la ejecución
    const listenersToExecute = [...this.listeners[eventName]];

    // Ejecutar cada listener
    listenersToExecute.forEach((callback, index) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error en listener ${index} de "${eventName}":`, error);
      }
    });

    return this;
  }

  /**
   * Registra un listener que se ejecutará solo una vez
   * El listener se auto-remueve después de su primera ejecución
   *
   * @param {string} eventName - Nombre del evento
   * @param {function} callback - Función a ejecutar
   * @returns {EventBus} - Retorna this para permitir encadenamiento
   *
   * @example
   * eventBus.once('app.initialized', () => {
   *   console.log('Esta función solo se ejecuta una vez');
   * });
   */
  once(eventName, callback) {
    if (typeof eventName !== 'string' || !eventName.trim()) {
      console.error('EventBus.once: eventName debe ser un string no vacío');
      return this;
    }

    if (typeof callback !== 'function') {
      console.error('EventBus.once: callback debe ser una función');
      return this;
    }

    // Crear wrapper que se auto-remueve
    const onceWrapper = (data) => {
      callback(data);
      this.off(eventName, onceWrapper);
    };

    this.on(eventName, onceWrapper);

    return this;
  }

  /**
   * Habilita el modo debug que muestra información detallada en consola
   *
   * @returns {EventBus} - Retorna this para permitir encadenamiento
   */
  enableDebug() {
    this.debugMode = true;
    console.log('[EventBus] Modo debug habilitado');
    return this;
  }

  /**
   * Deshabilita el modo debug
   *
   * @returns {EventBus} - Retorna this para permitir encadenamiento
   */
  disableDebug() {
    this.debugMode = false;
    console.log('[EventBus] Modo debug deshabilitado');
    return this;
  }

  /**
   * Obtiene información sobre el estado actual del EventBus
   *
   * @returns {object} - Objeto con estadísticas del EventBus
   */
  getStats() {
    const eventNames = Object.keys(this.listeners);
    const totalListeners = eventNames.reduce((sum, name) => {
      return sum + this.listeners[name].length;
    }, 0);

    return {
      totalEvents: eventNames.length,
      totalListeners: totalListeners,
      eventCount: this.eventCount,
      debugMode: this.debugMode,
      events: eventNames.map(name => ({
        name: name,
        listeners: this.listeners[name].length
      }))
    };
  }

  /**
   * Muestra estadísticas del EventBus en consola
   */
  showStats() {
    const stats = this.getStats();
    console.log('=== EventBus Stats ===');
    console.log(`Total de eventos registrados: ${stats.totalEvents}`);
    console.log(`Total de listeners: ${stats.totalListeners}`);
    console.log(`Eventos emitidos: ${stats.eventCount}`);
    console.log(`Debug mode: ${stats.debugMode ? 'ON' : 'OFF'}`);
    console.log('\nEventos con listeners:');
    stats.events.forEach(event => {
      console.log(`  - ${event.name}: ${event.listeners} listener(s)`);
    });
    console.log('=====================');
  }

  /**
   * Limpia todos los listeners registrados
   * Útil para testing o resetear la aplicación
   *
   * @returns {EventBus} - Retorna this para permitir encadenamiento
   */
  clear() {
    const eventCount = Object.keys(this.listeners).length;
    this.listeners = {};

    if (this.debugMode) {
      console.log(`[EventBus] Limpiados ${eventCount} eventos`);
    }

    return this;
  }

  /**
   * Verifica si existe al menos un listener para un evento
   *
   * @param {string} eventName - Nombre del evento a verificar
   * @returns {boolean} - true si hay listeners, false si no
   */
  hasListeners(eventName) {
    return this.listeners[eventName] && this.listeners[eventName].length > 0;
  }

  /**
   * Obtiene la cantidad de listeners para un evento específico
   *
   * @param {string} eventName - Nombre del evento
   * @returns {number} - Cantidad de listeners
   */
  listenerCount(eventName) {
    return this.listeners[eventName] ? this.listeners[eventName].length : 0;
  }
}

// Crear instancia global del EventBus
window.eventBus = new EventBus();

// En desarrollo, habilitar debug por defecto si estamos en localhost
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Descomentar la siguiente línea para habilitar debug automático en desarrollo
  // window.eventBus.enableDebug();
}

// Exponer métodos útiles en consola para debugging
window.eventBusStats = () => window.eventBus.showStats();
window.eventBusDebug = (enable = true) => {
  if (enable) {
    window.eventBus.enableDebug();
  } else {
    window.eventBus.disableDebug();
  }
};

console.log('[EventBus] Sistema de eventos inicializado - Accesible como window.eventBus');
