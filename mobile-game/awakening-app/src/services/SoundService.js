/**
 * SOUND SERVICE
 * Gestiona feedback háptico y de audio del juego
 * Usa vibración como feedback principal (más confiable en Android)
 *
 * @version 1.2.0
 */

import { Vibration, Platform } from 'react-native';
import logger from '../utils/logger';

// Patrones de vibración por tipo de acción (en ms)
// Valores aumentados para mejor percepción
const VIBRATION_PATTERNS = {
  tap: 80,                                    // Toque simple - más fuerte
  click: 60,                                  // Click - más fuerte
  success: [0, 150, 100, 200],                // Éxito - doble vibración
  error: [0, 200, 100, 200, 100, 200],        // Error - triple vibración fuerte
  collect: [0, 120, 80, 150],                 // Recolectar fractal
  levelup: [0, 150, 100, 200, 100, 300],      // Subir nivel - patrón largo
  fusion: [0, 200, 100, 250, 100, 350],       // Fusión - patrón épico
  deploy: [0, 150, 80, 200],                  // Desplegar ser
  crisis: [0, 200, 100, 200, 100, 200],       // Crisis - urgente
  notification: [0, 150, 100, 200],           // Notificación
  reward: [0, 150, 100, 200, 100, 250]        // Recompensa - celebración
};

class SoundService {
  constructor() {
    this.enabled = true;
    this.hapticsEnabled = true;
    this.initialized = false;
  }

  /**
   * Inicializar el servicio
   */
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    logger.info('[SoundService] Initialized with haptic feedback');
  }

  /**
   * Reproducir feedback para una acción
   */
  play(name) {
    if (!this.enabled || !this.hapticsEnabled) return;

    try {
      const pattern = VIBRATION_PATTERNS[name];
      if (pattern) {
        if (Array.isArray(pattern)) {
          Vibration.vibrate(pattern);
        } else {
          Vibration.vibrate(pattern);
        }
      }
    } catch (error) {
      // Ignorar errores de vibración
    }
  }

  /**
   * Métodos de conveniencia
   */
  playTap() { this.play('tap'); }
  playSuccess() { this.play('success'); }
  playError() { this.play('error'); }
  playCollect() { this.play('collect'); }
  playLevelUp() { this.play('levelup'); }
  playFusion() { this.play('fusion'); }
  playDeploy() { this.play('deploy'); }
  playCrisis() { this.play('crisis'); }
  playNotification() { this.play('notification'); }
  playReward() { this.play('reward'); }

  /**
   * Habilitar/deshabilitar feedback
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`[SoundService] Feedback ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Configurar hápticos
   */
  setHapticsEnabled(enabled) {
    this.hapticsEnabled = enabled;
  }

  /**
   * Liberar recursos
   */
  release() {
    Vibration.cancel();
    this.initialized = false;
  }
}

// Exportar instancia única
const soundService = new SoundService();
export default soundService;
