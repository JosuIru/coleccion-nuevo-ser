// ═══════════════════════════════════════════════════════════════════════════════
// BINAURAL AUDIO GENERATOR
// Genera ondas binaurales para meditación y estados contemplativos
// ═══════════════════════════════════════════════════════════════════════════════

class BinauralAudioGenerator {
  constructor() {
    this.audioContext = null;
    this.leftOscillator = null;
    this.rightOscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.currentPreset = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════════════════════════

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Crear nodo de ganancia (volumen)
    if (!this.gainNode) {
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0; // Empieza en 0 para fade in
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PRESETS DE FRECUENCIAS
  // ═══════════════════════════════════════════════════════════════════════════════

  getPresets() {
    return {
      // Ondas Delta (0.5-4 Hz) - Sueño profundo, sanación
      DELTA: {
        name: 'Delta',
        description: 'Sueño profundo y regeneración',
        baseFreq: 200,
        beatFreq: 2, // 200Hz en un oído, 202Hz en otro = 2Hz beat
        icon: '😴',
        color: '#6366f1' // Indigo
      },

      // Ondas Theta (4-8 Hz) - Meditación profunda, creatividad
      THETA: {
        name: 'Theta',
        description: 'Meditación profunda y contemplación',
        baseFreq: 200,
        beatFreq: 6, // 200Hz + 206Hz = 6Hz beat
        icon: '🧘',
        color: '#8b5cf6' // Purple
      },

      // Ondas Alpha (8-13 Hz) - Relajación, estado flow
      ALPHA: {
        name: 'Alpha',
        description: 'Relajación consciente y calma',
        baseFreq: 200,
        beatFreq: 10, // 200Hz + 210Hz = 10Hz beat
        icon: '🌊',
        color: '#06b6d4' // Cyan
      },

      // Ondas Beta (13-30 Hz) - Concentración, alerta
      BETA: {
        name: 'Beta',
        description: 'Concentración y enfoque mental',
        baseFreq: 200,
        beatFreq: 20, // 200Hz + 220Hz = 20Hz beat
        icon: '🎯',
        color: '#10b981' // Green
      },

      // Ondas Gamma (30-100 Hz) - Insight elevado, consciencia expandida
      GAMMA: {
        name: 'Gamma',
        description: 'Insight elevado y consciencia expandida',
        baseFreq: 200,
        beatFreq: 40, // 200Hz + 240Hz = 40Hz beat
        icon: '⚡',
        color: '#f59e0b' // Amber
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REPRODUCCIÓN
  // ═══════════════════════════════════════════════════════════════════════════════

  async play(presetName = 'THETA', durationSeconds = 600) {
    try {
      this.initialize();

      // Detener audio previo si existe
      this.stop();

      const presets = this.getPresets();
      const preset = presets[presetName] || presets.THETA;
      this.currentPreset = preset;

      // Crear osciladores estéreo
      this.leftOscillator = this.audioContext.createOscillator();
      this.rightOscillator = this.audioContext.createOscillator();

      // Crear nodos de ganancia separados para cada canal
      const leftGain = this.audioContext.createGain();
      const rightGain = this.audioContext.createGain();

      // Configurar frecuencias
      this.leftOscillator.frequency.value = preset.baseFreq;
      this.rightOscillator.frequency.value = preset.baseFreq + preset.beatFreq;

      // Tipo de onda (sine wave es la más suave)
      this.leftOscillator.type = 'sine';
      this.rightOscillator.type = 'sine';

      // Volumen individual de cada canal (50% cada uno)
      leftGain.gain.value = 0.5;
      rightGain.gain.value = 0.5;

      // Crear merger para estéreo
      const merger = this.audioContext.createChannelMerger(2);

      // Conectar: oscilador → gain → merger → gainNode principal → destino
      this.leftOscillator.connect(leftGain);
      this.rightOscillator.connect(rightGain);
      leftGain.connect(merger, 0, 0); // Canal izquierdo
      rightGain.connect(merger, 0, 1); // Canal derecho
      merger.connect(this.gainNode);

      // Fade in (5 segundos)
      const now = this.audioContext.currentTime;
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(0.3, now + 5); // Volumen máximo 30%

      // Fade out (últimos 5 segundos)
      if (durationSeconds > 10) {
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + durationSeconds - 5);
        this.gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);
      }

      // Iniciar osciladores
      this.leftOscillator.start(now);
      this.rightOscillator.start(now);

      // Programar detención
      if (durationSeconds > 0) {
        this.leftOscillator.stop(now + durationSeconds);
        this.rightOscillator.stop(now + durationSeconds);
      }

      this.isPlaying = true;

      // Evento de finalización
      this.leftOscillator.onended = () => {
        this.isPlaying = false;
        this.currentPreset = null;
      };

      return true;

    } catch (error) {
      console.error('Error generando audio binaural:', error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONTROL DE REPRODUCCIÓN
  // ═══════════════════════════════════════════════════════════════════════════════

  stop() {
    if (this.leftOscillator) {
      try {
        this.leftOscillator.stop();
        this.leftOscillator.disconnect();
      } catch (e) {
        // Ya estaba detenido
      }
      this.leftOscillator = null;
    }

    if (this.rightOscillator) {
      try {
        this.rightOscillator.stop();
        this.rightOscillator.disconnect();
      } catch (e) {
        // Ya estaba detenido
      }
      this.rightOscillator = null;
    }

    if (this.gainNode && this.audioContext) {
      // Fade out rápido antes de detener
      const now = this.audioContext.currentTime;
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    }

    this.isPlaying = false;
    this.currentPreset = null;
  }

  pause() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONTROL DE VOLUMEN
  // ═══════════════════════════════════════════════════════════════════════════════

  setVolume(volume) {
    // volume: 0.0 a 1.0
    if (this.gainNode && this.audioContext) {
      const now = this.audioContext.currentTime;
      const targetVolume = Math.max(0, Math.min(1, volume)) * 0.3; // Max 30%
      this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
    }
  }

  getVolume() {
    return this.gainNode ? this.gainNode.gain.value / 0.3 : 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════════════════════════

  isAvailable() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      preset: this.currentPreset,
      volume: this.getVolume(),
      available: this.isAvailable()
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RECOMENDACIONES POR CONTEXTO
  // ═══════════════════════════════════════════════════════════════════════════════

  getRecommendedPreset(context) {
    const recommendations = {
      'koan_contemplation': 'THETA',     // Meditación profunda para koans
      'reading': 'ALPHA',                // Lectura concentrada
      'exercise': 'THETA',               // Ejercicios meditativos
      'reflection': 'ALPHA',             // Reflexión personal
      'deep_meditation': 'DELTA',        // Meditación muy profunda
      'insight': 'GAMMA'                 // Búsqueda de insights
    };

    return recommendations[context] || 'THETA';
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INFORMACIÓN EDUCATIVA
  // ═══════════════════════════════════════════════════════════════════════════════

  getInfo() {
    return {
      title: 'Audio Binaural',
      description: `
El audio binaural utiliza dos tonos de frecuencia ligeramente diferente (uno en cada oído)
para crear un "beat" o pulso percibido por el cerebro.

Este beat puede inducir estados mentales específicos:

• Delta (0.5-4 Hz): Sueño profundo, regeneración
• Theta (4-8 Hz): Meditación profunda, contemplación
• Alpha (8-13 Hz): Relajación consciente, estado flow
• Beta (13-30 Hz): Concentración, alerta mental
• Gamma (30+ Hz): Insight elevado, consciencia expandida

IMPORTANTE: Usa auriculares para mejor efecto.
      `.trim(),
      usage: [
        '1. Colócate auriculares',
        '2. Selecciona un preset según tu objetivo',
        '3. Ajusta el volumen cómodamente',
        '4. Cierra los ojos y respira profundo',
        '5. Permite que el audio guíe tu estado mental'
      ],
      safety: [
        '❌ No usar mientras conduces',
        '❌ No usar si tienes epilepsia',
        '❌ Comienza con volumen bajo',
        '✅ Usa en entorno seguro y relajado',
        '✅ Interrumpe si sientes molestias'
      ]
    };
  }
}

// Exportar clase para uso global
window.BinauralAudioGenerator = BinauralAudioGenerator;
