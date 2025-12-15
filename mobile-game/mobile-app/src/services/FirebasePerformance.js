/**
 * AWAKENING PROTOCOL - FIREBASE PERFORMANCE MONITORING
 * Integración con Firebase Performance para monitorear métricas de la app
 */

import { Platform } from 'react-native';

/**
 * Firebase Performance wrapper
 * Descomentar imports cuando Firebase esté configurado
 */
// import perf from '@react-native-firebase/perf';

class FirebasePerformanceService {
  isEnabled = false;
  traces = new Map();
  httpMetrics = new Map();

  constructor() {
    this.init();
  }

  async init() {
    try {
      // Descomentar cuando Firebase esté configurado
      // this.isEnabled = await perf().isPerformanceCollectionEnabled();
      // console.log('[Firebase Performance] Initialized:', this.isEnabled);

      // Por ahora, solo en modo dev
      this.isEnabled = __DEV__;
    } catch (error) {
      logger.error('[Firebase Performance] Init error:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Inicia una traza de performance
   */
  async startTrace(traceName) {
    if (!this.isEnabled) {
      // Fallback a console.time en desarrollo
      if (__DEV__) {
        console.time(`[Trace] ${traceName}`);
      }
      return null;
    }

    try {
      // const trace = await perf().startTrace(traceName);
      // this.traces.set(traceName, trace);
      // return trace;

      // Mock para desarrollo
      const trace = {
        name: traceName,
        startTime: Date.now(),
      };
      this.traces.set(traceName, trace);
      return trace;
    } catch (error) {
      logger.error('[Firebase Performance] Error starting trace:', error);
      return null;
    }
  }

  /**
   * Detiene una traza y la envía a Firebase
   */
  async stopTrace(traceName) {
    if (__DEV__) {
      console.timeEnd(`[Trace] ${traceName}`);
    }

    const trace = this.traces.get(traceName);
    if (!trace) return;

    try {
      // await trace.stop();
      // this.traces.delete(traceName);

      // Mock para desarrollo
      const duration = Date.now() - trace.startTime;
      logger.info("`[Trace] ${traceName}: ${duration}ms`", "");
      this.traces.delete(traceName);
    } catch (error) {
      logger.error('[Firebase Performance] Error stopping trace:', error);
    }
  }

  /**
   * Agrega un atributo personalizado a una traza
   */
  putTraceAttribute(traceName, attribute, value) {
    const trace = this.traces.get(traceName);
    if (!trace) return;

    try {
      // trace.putAttribute(attribute, value);
      logger.info("`[Trace] ${traceName} - ${attribute}: ${value}`", "");
    } catch (error) {
      logger.error('[Firebase Performance] Error setting attribute:', error);
    }
  }

  /**
   * Incrementa una métrica de una traza
   */
  incrementTraceMetric(traceName, metricName, value = 1) {
    const trace = this.traces.get(traceName);
    if (!trace) return;

    try {
      // trace.incrementMetric(metricName, value);
      logger.info("`[Trace] ${traceName} - ${metricName}: +${value}`", "");
    } catch (error) {
      logger.error('[Firebase Performance] Error incrementing metric:', error);
    }
  }

  /**
   * Monitorea una request HTTP
   */
  async createHttpMetric(url, method = 'GET') {
    if (!this.isEnabled) return null;

    try {
      // const metric = perf().newHttpMetric(url, method);
      // await metric.start();
      // return metric;

      // Mock para desarrollo
      const metric = {
        url,
        method,
        startTime: Date.now(),
      };
      return metric;
    } catch (error) {
      logger.error('[Firebase Performance] Error creating HTTP metric:', error);
      return null;
    }
  }

  /**
   * Completa una métrica HTTP
   */
  async stopHttpMetric(metric, responseCode = 200, responseSize = 0) {
    if (!metric) return;

    try {
      // metric.setHttpResponseCode(responseCode);
      // metric.setResponseContentType('application/json');
      // metric.setResponsePayloadSize(responseSize);
      // await metric.stop();

      // Mock para desarrollo
      const duration = Date.now() - metric.startTime;
      console.log(
        `[HTTP] ${metric.method} ${metric.url}: ${duration}ms (${responseCode}, ${responseSize} bytes)`
      );
    } catch (error) {
      logger.error('[Firebase Performance] Error stopping HTTP metric:', error);
    }
  }

  /**
   * Métricas predefinidas para la app
   */

  // Tiempo de carga inicial de la app
  async measureAppStart() {
    await this.startTrace('app_start');
  }

  async completeAppStart() {
    await this.stopTrace('app_start');
  }

  // Tiempo de carga del mapa
  async measureMapLoad() {
    await this.startTrace('map_load');
  }

  async completeMapLoad() {
    await this.stopTrace('map_load');
  }

  // FPS del mapa
  async measureMapFPS(fps) {
    const trace = await this.startTrace('map_render');
    this.putTraceAttribute('map_render', 'fps', fps.toString());
    await this.stopTrace('map_render');
  }

  // Consumo de memoria
  async measureMemory(usedMB) {
    const trace = await this.startTrace('memory_usage');
    this.putTraceAttribute('memory_usage', 'used_mb', usedMB.toString());
    await this.stopTrace('memory_usage');
  }

  // Tiempo de respuesta de API
  async measureAPICall(endpoint, method = 'GET') {
    const metric = await this.createHttpMetric(endpoint, method);
    return {
      complete: async (statusCode, responseSize) => {
        await this.stopHttpMetric(metric, statusCode, responseSize);
      },
    };
  }

  // Tiempo de carga de pantallas
  async measureScreenTransition(screenName) {
    await this.startTrace(`screen_${screenName}`);
  }

  async completeScreenTransition(screenName) {
    await this.stopTrace(`screen_${screenName}`);
  }

  /**
   * Monitoreo automático de renders
   */
  usePerformanceTrace(traceName) {
    return {
      onStart: () => this.startTrace(traceName),
      onEnd: () => this.stopTrace(traceName),
    };
  }
}

// Singleton
const firebasePerformance = new FirebasePerformanceService();

export default firebasePerformance;

/**
 * Hook de React para monitorear performance de componentes
 */
import { useEffect } from 'react';
import logger from '../utils/logger';

export const useComponentPerformance = (componentName) => {
  useEffect(() => {
    const traceName = `component_${componentName}`;
    firebasePerformance.startTrace(traceName);

    return () => {
      firebasePerformance.stopTrace(traceName);
    };
  }, [componentName]);
};

/**
 * HOC para monitorear performance de pantallas
 */
export const withPerformanceMonitoring = (ScreenComponent, screenName) => {
  return (props) => {
    useEffect(() => {
      firebasePerformance.measureScreenTransition(screenName);

      return () => {
        firebasePerformance.completeScreenTransition(screenName);
      };
    }, []);

    return <ScreenComponent {...props} />;
  };
};

/**
 * Configuración de Firebase Performance
 * Agregar al google-services.json:
 *
 * {
 *   "project_info": {
 *     "project_id": "awakening-protocol",
 *     ...
 *   },
 *   "client": [
 *     {
 *       "client_info": {
 *         "android_client_info": {
 *           "package_name": "com.awakeningprotocol.mobile"
 *         }
 *       }
 *     }
 *   ]
 * }
 *
 * Instalación:
 * npm install @react-native-firebase/app @react-native-firebase/perf
 *
 * En build.gradle (app):
 * dependencies {
 *   implementation platform('com.google.firebase:firebase-bom:32.7.0')
 *   implementation 'com.google.firebase:firebase-perf'
 * }
 *
 * En build.gradle (project):
 * classpath 'com.google.firebase:perf-plugin:1.4.2'
 *
 * apply plugin: 'com.google.firebase.firebase-perf'
 */
