/**
 * DEPENDENCY INJECTOR
 * Sistema centralizado para gestionar dependencias globales
 * Previene errores por orden de carga de módulos
 *
 * @version 1.0.0
 */

class DependencyInjector {
  constructor() {
    this.dependencies = new Map();
    this.promises = new Map();
    this.instances = new Map();
  }

  /**
   * Registrar una factory para crear una dependencia
   * @param {string} name - Nombre de la dependencia
   * @param {Function} factory - Función que retorna la instancia o Promise<instancia>
   */
  register(name, factory) {
    this.dependencies.set(name, factory);
  }

  /**
   * Obtener una dependencia (esperando si es necesario)
   * @param {string} name - Nombre de la dependencia
   * @param {number} timeout - Timeout en ms (default: 5000)
   * @returns {Promise<any>}
   */
  async get(name, timeout = 5000) {
    // Si ya existe en instancias locales, retornar
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Si existe en window global, cachear y retornar
    if (window[name]) {
      this.instances.set(name, window[name]);
      return window[name];
    }

    // Si ya se está cargando, esperar
    if (this.promises.has(name)) {
      return this.promises.get(name);
    }

    // Cargar dependencia con timeout
    const factory = this.dependencies.get(name);
    if (!factory) {
      // Si no hay factory, intentar esperar a que aparezca en window
      return this.waitForDependency(name, timeout);
    }

    const promise = Promise.race([
      factory(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout loading ${name}`)), timeout)
      )
    ]);

    this.promises.set(name, promise);

    try {
      const instance = await promise;
      this.instances.set(name, instance);
      window[name] = instance;
      this.promises.delete(name);
      return instance;
    } catch (error) {
      this.promises.delete(name);
      throw error;
    }
  }

  /**
   * Esperar a que una dependencia aparezca en window
   * @param {string} name - Nombre de la dependencia
   * @param {number} timeout - Timeout en ms
   * @returns {Promise<any>}
   */
  waitForDependency(name, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        if (window[name]) {
          clearInterval(checkInterval);
          this.instances.set(name, window[name]);
          resolve(window[name]);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Timeout waiting for ${name}`));
        }
      }, 50);
    });
  }

  /**
   * Inyectar dependencias en una clase
   * @param {Function} Class - Constructor de la clase
   * @param {string[]} dependencies - Array de nombres de dependencias
   * @returns {Promise<any>}
   */
  async inject(Class, dependencies) {
    const instances = await Promise.all(
      dependencies.map(dep => this.get(dep))
    );
    return new Class(...instances);
  }

  /**
   * Verificar si una dependencia está disponible
   * @param {string} name - Nombre de la dependencia
   * @returns {boolean}
   */
  has(name) {
    return this.instances.has(name) || !!window[name];
  }

  /**
   * Obtener una dependencia de forma segura (retorna null si no existe)
   * @param {string} name - Nombre de la dependencia
   * @returns {any|null}
   */
  getSafe(name) {
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }
    return window[name] || null;
  }

  /**
   * Obtener múltiples dependencias de forma segura
   * @param {string[]} names - Array de nombres de dependencias
   * @returns {Object} Objeto con las dependencias disponibles
   */
  getMultipleSafe(names) {
    const result = {};
    names.forEach(name => {
      result[name] = this.getSafe(name);
    });
    return result;
  }

  /**
   * Limpiar instancias cacheadas
   */
  clear() {
    this.instances.clear();
    this.promises.clear();
  }

  /**
   * Obtener estado de debug
   */
  getDebugInfo() {
    return {
      registered: Array.from(this.dependencies.keys()),
      instances: Array.from(this.instances.keys()),
      loading: Array.from(this.promises.keys())
    };
  }
}

// Crear instancia global
window.dependencyInjector = new DependencyInjector();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DependencyInjector;
}
