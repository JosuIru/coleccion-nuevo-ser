// ============================================================================
// BINAURAL AUDIO MODAL - Control de ondas binaurales
// ============================================================================

class BinauralModal {
  constructor(binauralAudio) {
    this.binauralAudio = binauralAudio;
    this.i18n = window.i18n || new I18n();
    this.selectedPreset = 'THETA';
    this.duration = 10; // minutos
  }

  // Open modal
  open() {
    if (!this.binauralAudio) {
      // logger.warn('BinauralAudioGenerator no disponible');
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  // Close modal
  close() {
    const modal = document.getElementById('binaural-modal');
    if (modal) modal.remove();

    // Remove escape listener
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
    }
  }

  // Render modal
  render() {
    const existing = document.getElementById('binaural-modal');
    if (existing) existing.remove();

    const presets = this.binauralAudio.getPresets();

    const html = `
      <div id="binaural-modal" class="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-[10000] p-0 sm:p-4 backdrop-blur-sm">
        <div class="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-t-2xl sm:rounded-2xl max-w-full sm:max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-2 border-purple-500/30 shadow-2xl">
          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-purple-500/20">
            <div class="flex items-center justify-between">
              <h2 class="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <span class="text-2xl sm:text-3xl md:text-4xl">🎧</span>
                <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ${this.i18n.t('binaural.title')}
                </span>
              </h2>
              <button id="close-binaural" class="text-3xl hover:text-red-400 transition" aria-label="Cerrar ondas binaurales">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p class="text-sm text-gray-300 mt-2">
              Ondas sonoras que inducen diferentes estados de consciencia
            </p>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-6">
            <!-- Info -->
            <div class="mb-6 p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
              <p class="text-sm text-gray-300 flex items-start gap-2">
                <span class="flex-shrink-0">${Icons.info(18)}</span>
                <span><strong>¿Qué son las ondas binaurales?</strong><br>
                Cuando cada oído escucha una frecuencia ligeramente diferente, el cerebro percibe un "latido" que induce estados mentales específicos. <strong>Usa auriculares</strong> para obtener el efecto completo.</span>
              </p>
            </div>

            <!-- Presets Grid -->
            <div class="mb-6">
              <h3 class="text-lg font-bold text-purple-300 mb-3">${this.i18n.t('binaural.selectState')}:</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                ${Object.entries(presets).map(([key, preset]) => `
                  <button
                    data-preset="${key}"
                    class="preset-btn p-4 rounded-lg border-2 transition ${
                      this.selectedPreset === key
                        ? 'border-purple-400 bg-purple-500/30'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-600'
                    }"
                    style="border-color: ${this.selectedPreset === key ? preset.color : ''}"
                  >
                    <div class="text-3xl mb-2">${preset.icon}</div>
                    <div class="font-bold text-white">${preset.name}</div>
                    <div class="text-xs text-gray-400 mt-1">${preset.description}</div>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Duration -->
            <div class="mb-6">
              <label class="block text-sm font-bold text-purple-300 mb-2">
                ${this.i18n.t('binaural.duration')}:
              </label>
              <div class="flex items-center gap-4">
                <input
                  type="range"
                  id="duration-slider"
                  min="1"
                  max="60"
                  value="${this.duration}"
                  class="flex-1 h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style="accent-color: #a855f7"
                >
                <span id="duration-display" class="text-xl font-bold text-white min-w-[4rem]">
                  ${this.duration} ${this.i18n.t('binaural.minutes')}
                </span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex gap-3 justify-center">
              <button id="play-binaural-btn" class="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-lg transition flex items-center gap-2 shadow-lg">
                ${Icons.play(20)} ${this.i18n.t('binaural.play')}
              </button>
              <button id="stop-binaural-btn" class="px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-bold transition flex items-center gap-2">
                ${Icons.stop(20)} ${this.i18n.t('binaural.stop')}
              </button>
            </div>

            <!-- Status -->
            <div id="binaural-status" class="mt-4 text-center text-sm text-gray-400 hidden">
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-purple-500/20 bg-black/20">
            <p class="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              ${Icons.alertTriangle(14)} ${this.i18n.t('binaural.useHeadphones')}
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Attach event listeners
  attachEventListeners() {
    // Close buttons
    document.getElementById('close-binaural')?.addEventListener('click', () => this.close());

    // Preset buttons
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedPreset = btn.getAttribute('data-preset');
        this.render();
        this.attachEventListeners();
      });
    });

    // Duration slider
    const durationSlider = document.getElementById('duration-slider');
    const durationDisplay = document.getElementById('duration-display');
    if (durationSlider && durationDisplay) {
      durationSlider.addEventListener('input', (e) => {
        this.duration = parseInt(e.target.value);
        durationDisplay.textContent = `${this.duration} ${this.i18n.t('binaural.minutes')}`;
      });
    }

    // Play button
    document.getElementById('play-binaural-btn')?.addEventListener('click', () => {
      this.play();
    });

    // Stop button
    document.getElementById('stop-binaural-btn')?.addEventListener('click', () => {
      this.stop();
    });

    // Close on backdrop click
    document.getElementById('binaural-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'binaural-modal') this.close();
    });

    // ESC to close
    this.handleEscape = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.handleEscape);
  }

  // Play binaural audio
  async play() {
    try {
      const durationSeconds = this.duration * 60;
      await this.binauralAudio.play(this.selectedPreset, durationSeconds);

      const statusEl = document.getElementById('binaural-status');
      if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = `✅ ${this.i18n.t('binaural.playing')} ${this.binauralAudio.getPresets()[this.selectedPreset].name} ${this.i18n.t('binaural.for')} ${this.duration} ${this.i18n.t('binaural.minutes')}...`;
      }

      this.showToast(this.i18n.t('binaural.started'), 'success');
    } catch (error) {
      logger.error('Error al reproducir audio binaural:', error);
      this.showToast(this.i18n.t('binaural.error'), 'error');
    }
  }

  // Stop binaural audio
  stop() {
    this.binauralAudio.stop();

    const statusEl = document.getElementById('binaural-status');
    if (statusEl) {
      statusEl.classList.add('hidden');
      statusEl.innerHTML = '';
    }

    this.showToast(this.i18n.t('binaural.stopped'), 'info');
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const colors = {
      'success': 'bg-green-600',
      'error': 'bg-red-600',
      'info': 'bg-blue-600'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-[10000]`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Make global
window.BinauralModal = BinauralModal;
