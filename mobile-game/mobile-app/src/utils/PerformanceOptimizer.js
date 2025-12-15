/**
 * AWAKENING PROTOCOL - PERFORMANCE OPTIMIZER
 * Utilidades para optimizar rendimiento y reducir re-renders
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { InteractionManager, Platform } from 'react-native';
import logger from '../utils/logger';

/**
 * Hook para debounce de funciones
 * Previene ejecuciones excesivas (útil para búsqueda, scroll, etc.)
 */
export const useDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

/**
 * Hook para throttle de funciones
 * Limita ejecuciones a intervalos específicos (útil para scroll events)
 */
export const useThrottle = (callback, delay = 100) => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
};

/**
 * Hook para ejecutar código después de que las interacciones terminen
 * Mejora el rendimiento de animaciones y transiciones
 */
export const useAfterInteractions = (callback) => {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(callback);
    return () => task.cancel();
  }, [callback]);
};

/**
 * Memoiza cálculos costosos
 */
export const useMemoizedValue = (computeFn, deps) => {
  return useMemo(computeFn, deps);
};

/**
 * Optimiza renderizado de listas
 * Devuelve keyExtractor y getItemLayout optimizados
 */
export const useOptimizedList = (itemHeight = 100) => {
  const keyExtractor = useCallback((item, index) => {
    return item.id || item.key || `item-${index}`;
  }, []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  return { keyExtractor, getItemLayout };
};

/**
 * Performance monitor
 * Mide tiempo de ejecución de funciones
 */
export class PerformanceMonitor {
  static marks = new Map();

  static start(label) {
    this.marks.set(label, Date.now());
  }

  static end(label) {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`[Performance] No start mark found for: ${label}`);
      return null;
    }

    const duration = Date.now() - startTime;
    this.marks.delete(label);

    if (__DEV__) {
      logger.info("`[Performance] ${label}: ${duration}ms`", "");
    }

    return duration;
  }

  static async measure(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  static cache = new Map();
  static maxCacheSize = 50; // Máximo de items en cache

  static set(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      // Remover el item más antiguo (FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  static get(key) {
    return this.cache.get(key);
  }

  static clear() {
    this.cache.clear();
  }

  static has(key) {
    return this.cache.has(key);
  }
}

/**
 * Image optimization helpers
 */
export const optimizeImageSource = (uri, width, height) => {
  // Para Android, usar resize parameter en URLs
  if (Platform.OS === 'android' && uri.startsWith('http')) {
    return {
      uri,
      cache: 'force-cache',
      priority: 'low',
    };
  }

  return { uri };
};

/**
 * Batch updates para reducir re-renders
 */
export class BatchUpdater {
  static updates = [];
  static timeout = null;

  static schedule(updateFn) {
    this.updates.push(updateFn);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, 16); // ~60fps
  }

  static flush() {
    const updates = this.updates;
    this.updates = [];
    this.timeout = null;

    updates.forEach((updateFn) => {
      try {
        updateFn();
      } catch (error) {
        logger.error('[BatchUpdater] Error executing update:', error);
      }
    });
  }
}

/**
 * FPS Monitor (solo desarrollo)
 */
export class FPSMonitor {
  static frames = 0;
  static lastTime = Date.now();
  static fps = 60;
  static interval = null;

  static start() {
    if (!__DEV__ || this.interval) return;

    this.interval = setInterval(() => {
      const now = Date.now();
      const delta = now - this.lastTime;
      this.fps = Math.round((this.frames * 1000) / delta);

      if (this.fps < 30) {
        console.warn(`[FPS] Low framerate detected: ${this.fps} fps`);
      }

      this.frames = 0;
      this.lastTime = now;
    }, 1000);
  }

  static tick() {
    this.frames++;
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  static getFPS() {
    return this.fps;
  }
}

/**
 * Preloader para recursos críticos
 */
export const preloadCriticalResources = async () => {
  const resources = [
    // Precargar imágenes críticas
    // Image.prefetch('https://...'),

    // Precargar datos críticos
    // fetch('/api/critical-data'),
  ];

  try {
    await Promise.all(resources);
    logger.info('[Preloader] Critical resources loaded', '');
  } catch (error) {
    logger.error('[Preloader] Error loading resources:', error);
  }
};

/**
 * Network request optimizer
 */
export class NetworkOptimizer {
  static pending = new Map();

  static async fetch(url, options = {}) {
    // Deduplicar requests simultáneos a la misma URL
    if (this.pending.has(url)) {
      return this.pending.get(url);
    }

    const promise = fetch(url, {
      ...options,
      headers: {
        'Cache-Control': 'max-age=3600',
        ...options.headers,
      },
    })
      .then((response) => response.json())
      .finally(() => {
        this.pending.delete(url);
      });

    this.pending.set(url, promise);
    return promise;
  }
}

/**
 * Hook para detectar si la app está en primer plano
 */
export const useAppState = (callback) => {
  const appState = useRef('active');

  useEffect(() => {
    const { AppState } = require('react-native');

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        callback('foreground');
      } else if (nextAppState === 'background') {
        callback('background');
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [callback]);
};

/**
 * Optimiza animaciones reduciendo complejidad en dispositivos lentos
 */
export const getAnimationConfig = () => {
  const { Platform, Dimensions } = require('react-native');
  const { width, height } = Dimensions.get('window');
  const pixelCount = width * height;

  // Reduce animaciones en dispositivos de baja gama
  const isLowEndDevice = pixelCount < 1280 * 720 || Platform.Version < 28;

  return {
    enableComplexAnimations: !isLowEndDevice,
    particleCount: isLowEndDevice ? 50 : 200,
    animationDuration: isLowEndDevice ? 200 : 300,
    useNativeDriver: true,
  };
};

export default {
  useDebounce,
  useThrottle,
  useAfterInteractions,
  useMemoizedValue,
  useOptimizedList,
  PerformanceMonitor,
  MemoryManager,
  BatchUpdater,
  FPSMonitor,
  NetworkOptimizer,
  useAppState,
  getAnimationConfig,
  preloadCriticalResources,
};
