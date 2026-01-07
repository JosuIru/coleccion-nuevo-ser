/**
 * AWAKENING PROTOCOL - SENTRY CRASH REPORTING
 * Integración con Sentry para reporte de crashes y errores
 */

import { Platform } from 'react-native';

/**
 * Sentry wrapper
 * Descomentar imports cuando Sentry esté configurado
 */
// import * as Sentry from '@sentry/react-native';

class SentryService {
  isInitialized = false;

  /**
   * Inicializa Sentry
   */
  init(dsn, environment = 'production') {
    if (this.isInitialized) return;

    try {
      // Sentry.init({
      //   dsn,
      //   environment,
      //   enableAutoSessionTracking: true,
      //   sessionTrackingIntervalMillis: 30000,
      //   tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
      //   beforeSend: (event, hint) => {
      //     // Filtrar información sensible
      //     if (event.user) {
      //       delete event.user.email;
      //       delete event.user.ip_address;
      //     }
      //     return event;
      //   },
      //   integrations: [
      //     new Sentry.ReactNativeTracing({
      //       routingInstrumentation: this.routingInstrumentation,
      //       tracingOrigins: ['localhost', 'api.awakeningprotocol.com', /^\//],
      //     }),
      //   ],
      // });

      this.isInitialized = true;
      console.log('[Sentry] Initialized in', environment, 'mode');

      // Mock para desarrollo
      if (__DEV__) {
        logger.info('[Sentry] Mock mode enabled (development)', '');
      }
    } catch (error) {
      logger.error('[Sentry] Initialization error:', error);
    }
  }

  /**
   * Captura una excepción
   */
  captureException(error, context = {}) {
    if (!this.isInitialized && !__DEV__) return;

    try {
      // Sentry.captureException(error, {
      //   contexts: context,
      // });

      // Mock para desarrollo
      logger.error('[Sentry] Exception captured:', error);
      if (Object.keys(context).length > 0) {
        logger.error('[Sentry] Context:', context);
      }
    } catch (err) {
      logger.error('[Sentry] Error capturing exception:', err);
    }
  }

  /**
   * Captura un mensaje
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized && !__DEV__) return;

    try {
      // Sentry.captureMessage(message, {
      //   level,
      //   contexts: context,
      // });

      // Mock para desarrollo
      console.log(`[Sentry] Message (${level}):`, message);
    } catch (error) {
      logger.error('[Sentry] Error capturing message:', error);
    }
  }

  /**
   * Agrega breadcrumb para contexto
   */
  addBreadcrumb(category, message, data = {}, level = 'info') {
    if (!this.isInitialized && !__DEV__) return;

    try {
      // Sentry.addBreadcrumb({
      //   category,
      //   message,
      //   data,
      //   level,
      //   timestamp: Date.now() / 1000,
      // });

      // Mock para desarrollo
      if (__DEV__) {
        console.log(`[Sentry] Breadcrumb [${category}]:`, message, data);
      }
    } catch (error) {
      logger.error('[Sentry] Error adding breadcrumb:', error);
    }
  }

  /**
   * Establece información del usuario
   */
  setUser(user) {
    if (!this.isInitialized) return;

    try {
      // Sentry.setUser({
      //   id: user.id,
      //   username: user.username,
      //   // NO incluir email o datos sensibles
      // });

      // Mock para desarrollo
      console.log('[Sentry] User set:', user.id);
    } catch (error) {
      logger.error('[Sentry] Error setting user:', error);
    }
  }

  /**
   * Limpia información del usuario
   */
  clearUser() {
    if (!this.isInitialized) return;

    try {
      // Sentry.setUser(null);
      logger.info('[Sentry] User cleared', '');
    } catch (error) {
      logger.error('[Sentry] Error clearing user:', error);
    }
  }

  /**
   * Establece un tag
   */
  setTag(key, value) {
    if (!this.isInitialized) return;

    try {
      // Sentry.setTag(key, value);
      if (__DEV__) {
        logger.info("`[Sentry] Tag set: ${key} = ${value}`", "");
      }
    } catch (error) {
      logger.error('[Sentry] Error setting tag:', error);
    }
  }

  /**
   * Establece contexto extra
   */
  setContext(key, context) {
    if (!this.isInitialized) return;

    try {
      // Sentry.setContext(key, context);
      if (__DEV__) {
        console.log(`[Sentry] Context set: ${key}`, context);
      }
    } catch (error) {
      logger.error('[Sentry] Error setting context:', error);
    }
  }

  /**
   * Inicia una transacción (para performance)
   */
  startTransaction(name, op = 'navigation') {
    if (!this.isInitialized) return null;

    try {
      // const transaction = Sentry.startTransaction({ name, op });
      // return transaction;

      // Mock para desarrollo
      return {
        name,
        op,
        startTime: Date.now(),
        finish: () => {
          const duration = Date.now() - this.startTime;
          logger.info("`[Sentry] Transaction "${name}" finished: ${duration}ms`", "");
        },
      };
    } catch (error) {
      logger.error('[Sentry] Error starting transaction:', error);
      return null;
    }
  }

  /**
   * Wrap async function con error handling
   */
  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.captureException(error, {
          function: fn.name,
          args: JSON.stringify(args),
        });
        throw error;
      }
    };
  }

  /**
   * Métricas predefinidas
   */

  // Error de API
  reportAPIError(endpoint, error, statusCode) {
    this.addBreadcrumb('api', `Request to ${endpoint} failed`, {
      endpoint,
      statusCode,
    });
    this.captureException(error, {
      api: {
        endpoint,
        statusCode,
      },
    });
  }

  // Error de navegación
  reportNavigationError(screen, error) {
    this.addBreadcrumb('navigation', `Navigation to ${screen} failed`);
    this.captureException(error, {
      navigation: {
        targetScreen: screen,
      },
    });
  }

  // Error de mapa
  reportMapError(action, error) {
    this.addBreadcrumb('map', `Map action failed: ${action}`);
    this.captureException(error, {
      map: {
        action,
      },
    });
  }

  // Performance warning
  reportPerformanceIssue(metric, value, threshold) {
    this.captureMessage(
      `Performance issue: ${metric} (${value}) exceeds threshold (${threshold})`,
      'warning',
      {
        performance: {
          metric,
          value,
          threshold,
        },
      }
    );
  }
}

// Singleton
const sentry = new SentryService();

export default sentry;

/**
 * Error Boundary para React
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    sentry.captureException(error, {
      errorBoundary: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Algo salió mal</Text>
          <Text style={styles.errorMessage}>
            La aplicación encontró un error inesperado.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetails}>{this.state.error.toString()}</Text>
          )}
          <TouchableOpacity style={styles.resetButton} onPress={this.handleReset}>
            <Text style={styles.resetButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E1F',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  resetButton: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#0A0E1F',
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * CONFIGURACIÓN DE SENTRY
 *
 * 1. Crear cuenta en sentry.io
 * 2. Crear proyecto "awakening-protocol" (React Native)
 * 3. Obtener DSN
 * 4. Instalar dependencias:
 *    npm install @sentry/react-native
 *    npx @sentry/wizard -i reactNative -p android
 *
 * 5. En App.js:
 *    import sentry from './services/SentryIntegration';
import logger from '../utils/logger';
 *    sentry.init('YOUR_DSN_HERE', __DEV__ ? 'development' : 'production');
 *
 * 6. Configurar source maps en build.gradle:
 *    apply from: "../../node_modules/@sentry/react-native/sentry.gradle"
 *
 * 7. Variables de entorno (NO subir a git):
 *    SENTRY_DSN=https://xxx@sentry.io/xxx
 *    SENTRY_ORG=your-org
 *    SENTRY_PROJECT=awakening-protocol
 *    SENTRY_AUTH_TOKEN=your-auth-token
 */
