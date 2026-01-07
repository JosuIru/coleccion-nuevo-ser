/**
 * SAFE FETCH UTILITY
 * Wrapper seguro para fetch con manejo de errores, retry y offline detection
 *
 * @version 1.0.0
 * FIX: Audit v2.9.234 - fetch sin error handling
 */

class SafeFetch {
  static defaultOptions = {
    retries: 2,
    retryDelay: 1000,
    timeout: 30000,
    showToast: true,
    offlineCache: true
  };

  /**
   * Fetch seguro con validación de response.ok
   * @param {string} url - URL a fetchear
   * @param {Object} options - Opciones de fetch + opciones custom
   * @returns {Promise<Response>} - Response validado
   */
  static async fetch(url, options = {}) {
    const config = { ...this.defaultOptions, ...options };

    // Check offline
    if (!navigator.onLine) {
      if (config.offlineCache) {
        const cached = this.getFromCache(url);
        if (cached) {
          logger.debug('[SafeFetch] Returning cached data for:', url);
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-From-Cache': 'true' }
          });
        }
      }

      if (config.showToast && window.toast) {
        window.toast.warning('Sin conexion. Algunos datos pueden no estar disponibles.');
      }
      throw new Error('OFFLINE: No internet connection');
    }

    let lastError;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Validar response.ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;

      } catch (error) {
        lastError = error;

        if (error.name === 'AbortError') {
          lastError = new Error(`Timeout after ${config.timeout}ms`);
        }

        // No retry on 4xx errors
        if (error.message.includes('HTTP 4')) {
          break;
        }

        // Wait before retry
        if (attempt < config.retries) {
          await new Promise(r => setTimeout(r, config.retryDelay * (attempt + 1)));
        }
      }
    }

    // All retries failed
    logger.error('[SafeFetch] Failed after retries:', url, lastError);

    if (config.showToast && window.toast) {
      window.toast.error('Error de conexion. Intenta de nuevo.');
    }

    throw lastError;
  }

  /**
   * Fetch JSON con parsing seguro
   * @param {string} url - URL a fetchear
   * @param {Object} options - Opciones
   * @returns {Promise<Object>} - JSON parseado
   */
  static async json(url, options = {}) {
    const response = await this.fetch(url, options);
    const data = await response.json();

    // Cache for offline use
    if (options.offlineCache !== false) {
      this.saveToCache(url, data);
    }

    return data;
  }

  /**
   * Fetch con fallback a cache
   * @param {string} url - URL
   * @param {Object} fallback - Valor por defecto si falla
   * @returns {Promise<Object>}
   */
  static async jsonWithFallback(url, fallback = null, options = {}) {
    try {
      return await this.json(url, { ...options, showToast: false });
    } catch (error) {
      logger.warn('[SafeFetch] Using fallback for:', url, error.message);

      // Try cache
      const cached = this.getFromCache(url);
      if (cached) return cached;

      return fallback;
    }
  }

  // Simple localStorage cache
  static cachePrefix = 'safefetch_cache_';
  static cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours

  static saveToCache(url, data) {
    try {
      const key = this.cachePrefix + this.hashUrl(url);
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      // localStorage full or disabled
    }
  }

  static getFromCache(url) {
    try {
      const key = this.cachePrefix + this.hashUrl(url);
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheMaxAge) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (e) {
      return null;
    }
  }

  static hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear all cached data
   */
  static clearCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.cachePrefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

// Export global
window.SafeFetch = SafeFetch;

// Convenience aliases
window.safeFetch = SafeFetch.fetch.bind(SafeFetch);
window.safeFetchJson = SafeFetch.json.bind(SafeFetch);
