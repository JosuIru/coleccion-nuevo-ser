// ============================================================================
// KOAN MODAL - Modal para mostrar koans de contemplación
// ============================================================================

class KoanModal {
  constructor(koanGenerator) {
    this.koanGenerator = koanGenerator;
    this.i18n = window.i18n || new I18n();
    this.currentKoan = null;
    this.showBinauralControls = false;
    this.selectedPreset = 'THETA';
    this.duration = 10;
  }

  // Open modal with koan for current chapter
  open(chapterId) {
    if (!this.koanGenerator) {
      // console.warn('KoanGenerator no disponible');
      return;
    }

    this.currentKoan = this.koanGenerator.getKoanForChapter(chapterId);
    this.render();
    this.attachEventListeners();
  }

  // Close modal
  close() {
    const modal = document.getElementById('koan-modal');
    if (modal) modal.remove();

    // Remove escape listener
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
    }
  }

  // Render binaural section
  renderBinauralSection() {
    // Verificar window.binauralAudio en tiempo real, no usar this.binauralAudio
    const binauralAudio = window.binauralAudio;
    if (!binauralAudio) return '';

    const presets = binauralAudio.getPresets();

    return `
      <!-- Audio Binaural Section -->
      <div class="mb-6 p-4 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-lg">
        <button id="toggle-binaural" class="w-full flex items-center justify-between text-left">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🎧</span>
            <span class="font-bold text-purple-300">${this.i18n.t('binaural.title')}</span>
          </div>
          <span class="text-purple-300">${this.showBinauralControls ? '▼' : '▶'}</span>
        </button>

        ${this.showBinauralControls ? `
          <div class="mt-4 space-y-4">
            <!-- Info -->
            <p class="text-xs text-gray-400">
              ${this.i18n.t('binaural.useHeadphones')}
            </p>

            <!-- Presets Grid -->
            <div>
              <p class="text-sm font-semibold text-purple-300 mb-2">${this.i18n.t('binaural.selectState')}:</p>
              <div class="grid grid-cols-2 gap-2">
                ${Object.entries(presets).map(([key, preset]) => `
                  <button
                    data-preset="${key}"
                    class="preset-btn p-3 rounded-lg border-2 transition text-left ${
                      this.selectedPreset === key
                        ? 'border-purple-400 bg-purple-500/30'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-xl">${preset.icon}</span>
                      <div class="flex-1 min-w-0">
                        <div class="font-bold text-white text-sm">${preset.name}</div>
                        <div class="text-xs text-gray-400 truncate">${preset.description}</div>
                      </div>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-sm font-semibold text-purple-300 mb-2">
                ${this.i18n.t('binaural.duration')}:
              </label>
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  id="duration-slider"
                  min="1"
                  max="60"
                  value="${this.duration}"
                  class="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style="accent-color: #a855f7"
                >
                <span id="duration-display" class="text-sm font-bold text-white min-w-[3.5rem]">
                  ${this.duration} min
                </span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex gap-2">
              <button id="play-binaural-btn" class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2">
                ${Icons.play(16)} ${this.i18n.t('binaural.play')}
              </button>
              <button id="stop-binaural-btn" class="flex-1 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2">
                ${Icons.stop(16)} ${this.i18n.t('binaural.stop')}
              </button>
            </div>

            <!-- Status -->
            <div id="binaural-status-koan" class="text-center text-xs text-purple-300 hidden"></div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Render modal
  render() {
    const existing = document.getElementById('koan-modal');
    if (existing) existing.remove();

    if (!this.currentKoan) return;

    const html = `
      <div id="koan-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
        <div class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl max-w-2xl w-full border-2 border-amber-500/30 shadow-2xl my-4 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-amber-500/20 flex-shrink-0">
            <div class="flex items-center justify-between">
              <h2 class="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <span class="text-2xl sm:text-3xl md:text-4xl">${Icons.meditation(32)}</span>
                <span class="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  ${this.i18n.t('koan.title')}
                </span>
              </h2>
              <button id="close-koan" class="hover:text-red-400 transition flex items-center justify-center text-gray-900 dark:text-white" aria-label="Cerrar koan">
                ${Icons.close(28)}
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-8 overflow-y-auto flex-1">
            <!-- Tema -->
            <div class="mb-6 text-center">
              <span class="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-semibold">
                ${this.currentKoan.tema}
              </span>
            </div>

            <!-- Koan -->
            <div class="mb-8 text-center">
              <p class="text-2xl md:text-3xl font-serif text-amber-50 leading-relaxed italic">
                "${this.currentKoan.koan}"
              </p>
            </div>

            <!-- Pista -->
            <div class="mb-6 p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-l-4 border-amber-500 rounded-lg">
              <p class="text-sm font-semibold text-amber-400 mb-1 flex items-center gap-2">${Icons.lightbulb(16)} ${this.i18n.t('koan.hint')}:</p>
              <p class="text-gray-300">${this.currentKoan.pista}</p>
            </div>

            <!-- Instrucciones -->
            <div class="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p class="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">${Icons.meditation(16)} ${this.i18n.t('koan.howTo')}:</p>
              <ul class="text-sm text-gray-300 space-y-2">
                <li>• ${this.i18n.t('koan.instruction1')}</li>
                <li>• ${this.i18n.t('koan.instruction2')}</li>
                <li>• ${this.i18n.t('koan.instruction3')}</li>
                <li>• ${this.i18n.t('koan.instruction4')}</li>
                <li>• ${this.i18n.t('koan.instruction5')}</li>
              </ul>
            </div>

            ${this.renderBinauralSection()}

            <!-- Action Buttons -->
            <div class="flex gap-3 justify-center">
              <button id="new-koan-btn" class="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-bold transition flex items-center gap-2">
                🔄 ${this.i18n.t('koan.newKoan')}
              </button>
              <button id="close-koan-btn" class="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-bold transition">
                ${this.i18n.t('btn.close')}
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-amber-500/20 bg-black/20 flex-shrink-0">
            <p class="text-xs text-center text-gray-400 italic">
              "No busques la respuesta fuera. La pregunta es el camino."
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
    document.getElementById('close-koan')?.addEventListener('click', () => this.close());
    document.getElementById('close-koan-btn')?.addEventListener('click', () => this.close());

    // New koan button
    document.getElementById('new-koan-btn')?.addEventListener('click', () => {
      if (this.currentChapterId) {
        this.open(this.currentChapterId);
      }
    });

    // Toggle binaural controls
    document.getElementById('toggle-binaural')?.addEventListener('click', () => {
      this.showBinauralControls = !this.showBinauralControls;
      this.render();
      this.attachEventListeners();
    });

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
        durationDisplay.textContent = `${this.duration} min`;
      });
    }

    // Play binaural
    document.getElementById('play-binaural-btn')?.addEventListener('click', () => {
      this.playBinaural();
    });

    // Stop binaural
    document.getElementById('stop-binaural-btn')?.addEventListener('click', () => {
      this.stopBinaural();
    });

    // Close on backdrop click
    document.getElementById('koan-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'koan-modal') this.close();
    });

    // ESC to close
    this.handleEscape = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.handleEscape);
  }

  // Play binaural audio
  async playBinaural() {
    const binauralAudio = window.binauralAudio;
    if (!binauralAudio) return;

    try {
      const durationSeconds = this.duration * 60;
      await binauralAudio.play(this.selectedPreset, durationSeconds);

      const statusEl = document.getElementById('binaural-status-koan');
      if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.textContent = `🎵 ${this.i18n.t('binaural.playing')}...`;
      }
    } catch (error) {
      console.error('Error playing binaural audio:', error);
      window.toast?.error('Error al reproducir audio binaural');
    }
  }

  // Stop binaural audio
  stopBinaural() {
    const binauralAudio = window.binauralAudio;
    if (!binauralAudio) return;

    binauralAudio.stop();

    const statusEl = document.getElementById('binaural-status-koan');
    if (statusEl) {
      statusEl.classList.add('hidden');
      statusEl.textContent = '';
    }
  }

  // Set current chapter (for regenerating koans)
  setCurrentChapter(chapterId) {
    this.currentChapterId = chapterId;
  }
}

// Make global
window.KoanModal = KoanModal;
