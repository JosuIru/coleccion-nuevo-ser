// ============================================================================
// AUDIO CONTROL MODAL - Panel de control avanzado de audio
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class AudioControlModal {
  constructor(enhancedAudioReader) {
    this.audioReader = enhancedAudioReader;
    this.modal = null;
    this.currentTab = 'modes';
    this.visualizer = null;

    // 🔧 FIX: EventManager para gestión automática de listeners
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('AudioControlModal');
    this._eventListenersAttached = false;
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  render() {
    // Remover modal existente si hay
    const existing = document.getElementById('audio-control-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'audio-control-modal';
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] hidden items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-cyan-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-cyan-600 to-purple-600 p-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            ${Icons.headphones(28)}
            <div>
              <h2 class="text-2xl font-bold text-white">Control de Audio</h2>
              <p class="text-cyan-100 text-sm">Experiencia de escucha inmersiva</p>
            </div>
          </div>
          <button id="audio-control-close" class="hover:bg-white/20 p-2 rounded-lg transition">
            ${Icons.close(24)}
          </button>
        </div>

        <!-- Visualizador -->
        <div id="audio-visualizer-container" class="bg-slate-900/50 p-4 border-b border-slate-300 dark:border-slate-700">
          <!-- El canvas se insertará aquí -->
        </div>

        <!-- Tabs -->
        <div class="bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 px-6">
          <div class="flex gap-1">
            <button class="audio-tab px-6 py-3 font-semibold transition border-b-2 border-transparent" data-tab="modes">
              🎵 Modos
            </button>
            <button class="audio-tab px-6 py-3 font-semibold transition border-b-2 border-transparent" data-tab="equalizer">
              🎚️ Ecualizador
            </button>
            <button class="audio-tab px-6 py-3 font-semibold transition border-b-2 border-transparent" data-tab="ambient">
              🌊 Ambiente
            </button>
            <button class="audio-tab px-6 py-3 font-semibold transition border-b-2 border-transparent" data-tab="settings">
              ⚙️ Ajustes
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div id="audio-tab-content"></div>
        </div>

        <!-- Footer -->
        <div class="bg-slate-800/50 border-t border-slate-300 dark:border-slate-700 p-4 flex justify-between items-center">
          <div class="text-sm text-gray-400">
            <span id="audio-status">Listo</span>
          </div>
          <button id="audio-apply" class="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition">
            Aplicar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // Adjuntar eventos
    this.attachEvents();

    // Mostrar tab inicial
    this.showTab('modes');
  }

  // ==========================================================================
  // TABS
  // ==========================================================================

  showTab(tabName) {
    this.currentTab = tabName;

    // Actualizar botones de tab
    const tabs = this.modal.querySelectorAll('.audio-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('border-cyan-500', 'text-cyan-400');
        tab.classList.remove('border-transparent', 'text-gray-400');
      } else {
        tab.classList.remove('border-cyan-500', 'text-cyan-400');
        tab.classList.add('border-transparent', 'text-gray-400');
      }
    });

    // Renderizar contenido del tab
    const content = this.modal.querySelector('#audio-tab-content');
    switch (tabName) {
      case 'modes':
        content.innerHTML = this.renderModesTab();
        break;
      case 'equalizer':
        content.innerHTML = this.renderEqualizerTab();
        this.attachEqualizerEvents();
        break;
      case 'ambient':
        content.innerHTML = this.renderAmbientTab();
        break;
      case 'settings':
        content.innerHTML = this.renderSettingsTab();
        break;
    }

    // Inicializar iconos de Lucide después de renderizar
    if (window.Icons && window.Icons.init) {
      Icons.init();
    }
  }

  renderModesTab() {
    const modes = this.audioReader.getModes();
    const currentMode = this.audioReader.getCurrentMode();

    return `
      <div class="space-y-4">
        <div>
          <h3 class="text-lg font-bold text-cyan-300 mb-2">Modos de Escucha</h3>
          <p class="text-sm text-gray-400 mb-4">Configuraciones predefinidas para diferentes momentos</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${Object.keys(modes).map(key => {
            const mode = modes[key];
            const isActive = currentMode === key;

            return `
              <button class="audio-mode-btn p-4 rounded-xl border-2 transition text-left ${
                isActive
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 bg-slate-800/50'
              }" data-mode="${key}">
                <div class="flex items-start gap-3">
                  <div class="text-3xl">${mode.icon}</div>
                  <div class="flex-1">
                    <h4 class="font-bold text-white mb-1">${mode.name}</h4>
                    <p class="text-xs text-gray-400">${mode.description}</p>
                    ${mode.ttsRate ? `<div class="mt-2 text-xs text-cyan-400">Velocidad: ${mode.ttsRate}x</div>` : ''}
                  </div>
                  ${isActive ? `<div class="text-cyan-500">${Icons.check(20)}</div>` : ''}
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <div class="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-300 dark:border-slate-700">
          <h4 class="font-semibold text-white mb-2">Presets Rápidos</h4>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
            ${['meditate', 'focus', 'sleep', 'energize', 'relax'].map(preset => `
              <button class="audio-preset-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition capitalize" data-preset="${preset}">
                ${preset}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderEqualizerTab() {
    const profiles = this.audioReader.getProfiles();
    const currentProfile = this.audioReader.getCurrentProfile();

    return `
      <div class="space-y-6">
        <!-- Perfiles predefinidos -->
        <div>
          <h3 class="text-lg font-bold text-cyan-300 mb-2">Perfiles de Audio</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${Object.keys(profiles).map(key => {
              const profile = profiles[key];
              const isActive = currentProfile === key;

              return `
                <button class="audio-profile-btn px-4 py-3 rounded-lg border transition text-left ${
                  isActive
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 bg-slate-800/50'
                }" data-profile="${key}">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="font-semibold text-white">${profile.name}</h4>
                      <p class="text-xs text-gray-400">${profile.description}</p>
                    </div>
                    ${isActive ? `<div class="text-cyan-500">${Icons.check(20)}</div>` : ''}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Control manual de EQ -->
        <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-300 dark:border-slate-700">
          <h4 class="font-semibold text-white mb-4">Control Manual</h4>

          <div class="space-y-4">
            <!-- Bass -->
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-gray-300">Bajos</label>
                <span id="bass-value" class="text-sm text-cyan-400">0 dB</span>
              </div>
              <input type="range" id="bass-slider" min="-12" max="12" value="0" step="1"
                     class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider touch-manipulation">
            </div>

            <!-- Mid -->
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-gray-300">Medios</label>
                <span id="mid-value" class="text-sm text-cyan-400">0 dB</span>
              </div>
              <input type="range" id="mid-slider" min="-12" max="12" value="0" step="1"
                     class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider touch-manipulation">
            </div>

            <!-- Treble -->
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-gray-300">Agudos</label>
                <span id="treble-value" class="text-sm text-cyan-400">0 dB</span>
              </div>
              <input type="range" id="treble-slider" min="-12" max="12" value="0" step="1"
                     class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider touch-manipulation">
            </div>

            <!-- Reverb -->
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm text-gray-300">Reverb</label>
                <span id="reverb-value" class="text-sm text-cyan-400">5%</span>
              </div>
              <input type="range" id="reverb-slider" min="0" max="100" value="5" step="1"
                     class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider touch-manipulation">
            </div>

            <button id="eq-reset" class="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              Restaurar valores por defecto
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderAmbientTab() {
    const soundscapes = [
      { name: 'rain', label: 'Lluvia', icon: '🌧️' },
      { name: 'ocean', label: 'Océano', icon: '🌊' },
      { name: 'forest', label: 'Bosque', icon: '🌲' },
      { name: 'river', label: 'Río', icon: '💧' },
      { name: 'cafe', label: 'Cafetería', icon: '☕' },
      { name: 'fire', label: 'Fuego', icon: '🔥' },
      { name: 'storm', label: 'Tormenta', icon: '⛈️' },
      { name: 'wind', label: 'Viento', icon: '🌬️' },
      { name: 'night', label: 'Noche', icon: '🌙' },
      { name: 'birds', label: 'Pájaros', icon: '🐦' },
      { name: 'meditation', label: 'Meditación', icon: '🕉️' },
      { name: 'piano', label: 'Piano', icon: '🎹' }
    ];

    const binauralPresets = [
      { name: 'DELTA', label: 'Delta (Sueño)', icon: '😴' },
      { name: 'THETA', label: 'Theta (Meditación)', icon: '🧘' },
      { name: 'ALPHA', label: 'Alpha (Relajación)', icon: '🌊' },
      { name: 'BETA', label: 'Beta (Concentración)', icon: '🎯' },
      { name: 'GAMMA', label: 'Gamma (Insight)', icon: '⚡' }
    ];

    return `
      <div class="space-y-6">
        <!-- Soundscapes -->
        <div>
          <h3 class="text-lg font-bold text-cyan-300 mb-2">Música Ambiental</h3>
          <p class="text-sm text-gray-400 mb-4">Sonidos de fondo para mayor inmersión</p>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            ${soundscapes.map(sound => `
              <button class="ambient-btn p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 active:border-cyan-500 hover:border-cyan-500/50 bg-slate-800/50 active:bg-cyan-500/20 transition-all text-center touch-manipulation min-h-[80px]" data-soundscape="${sound.name}">
                <div class="text-3xl mb-2 pointer-events-none">${sound.icon}</div>
                <div class="text-sm font-medium text-white pointer-events-none">${sound.label}</div>
              </button>
            `).join('')}
          </div>

          <div class="flex gap-2">
            <button id="ambient-stop" class="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-sm font-medium transition">
              Detener Ambiente
            </button>
            <div class="flex items-center gap-2 bg-slate-800/50 px-4 rounded-lg border border-slate-300 dark:border-slate-700">
              <label class="text-sm text-gray-300">Vol:</label>
              <input type="range" id="ambient-volume" min="0" max="100" value="30" step="1" class="w-24">
            </div>
          </div>
        </div>

        <!-- Binaural -->
        <div>
          <h3 class="text-lg font-bold text-cyan-300 mb-2">Ondas Binaurales</h3>
          <p class="text-sm text-gray-400 mb-4">Frecuencias para inducir estados mentales</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            ${binauralPresets.map(preset => `
              <button class="binaural-btn p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 active:border-cyan-500 hover:border-cyan-500/50 bg-slate-800/50 active:bg-cyan-500/20 transition-all text-left touch-manipulation min-h-[60px]" data-binaural="${preset.name}">
                <div class="flex items-center gap-3 pointer-events-none">
                  <div class="text-2xl">${preset.icon}</div>
                  <div class="text-sm font-medium text-white">${preset.label}</div>
                </div>
              </button>
            `).join('')}
          </div>

          <div class="flex gap-2">
            <button id="binaural-stop" class="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-sm font-medium transition">
              Detener Binaural
            </button>
            <div class="flex items-center gap-2 bg-slate-800/50 px-4 rounded-lg border border-slate-300 dark:border-slate-700">
              <label class="text-sm text-gray-300">Vol:</label>
              <input type="range" id="binaural-volume" min="0" max="100" value="20" step="1" class="w-24">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsTab() {
    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-bold text-cyan-300 mb-4">Ajustes de Audio</h3>

          <div class="space-y-4">
            <!-- Volumen maestro -->
            <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-300 dark:border-slate-700">
              <div class="flex justify-between mb-2">
                <label class="text-sm font-medium text-gray-300">Volumen Maestro</label>
                <span id="master-volume-value" class="text-sm text-cyan-400">100%</span>
              </div>
              <input type="range" id="master-volume" min="0" max="100" value="100" step="1"
                     class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider">
            </div>

            <!-- Mejoras activadas -->
            <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-300 dark:border-slate-700">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-white">Mejoras de Audio</h4>
                  <p class="text-xs text-gray-400 mt-1">Activar procesamiento y efectos avanzados</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="enhanced-toggle" class="sr-only peer" ${this.audioReader.isEnhanced ? 'checked' : ''}>
                  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>

            <!-- Info del estado -->
            <div class="p-4 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
              <h4 class="font-medium text-cyan-300 mb-2">Estado Actual</h4>
              <div class="text-sm text-gray-300 space-y-1">
                <div>Modo: <span class="text-cyan-400">${this.audioReader.getCurrentMode()}</span></div>
                <div>Perfil: <span class="text-cyan-400">${this.audioReader.getCurrentProfile()}</span></div>
                <div>Ambiente: <span class="text-cyan-400">${this.audioReader.getState().hasAmbient ? 'Activo' : 'Inactivo'}</span></div>
                <div>Binaural: <span class="text-cyan-400">${this.audioReader.getState().hasBinaural ? 'Activo' : 'Inactivo'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // EVENTOS
  // ==========================================================================

  attachEvents() {
    // 🔧 FIX: Protección contra re-attach múltiple
    if (this._eventListenersAttached) {
      console.warn('[AudioControlModal] Listeners already attached, skipping');
      return;
    }

    // Cerrar modal
    const closeBtn = this.modal.querySelector('#audio-control-close');
    if (closeBtn) {
      this.eventManager.addEventListener(closeBtn, 'click', () => this.close());
    }

    // Tabs
    const tabs = this.modal.querySelectorAll('.audio-tab');
    tabs.forEach(tab => {
      this.eventManager.addEventListener(tab, 'click', () => {
        this.showTab(tab.dataset.tab);
      });
    });

    // Delegación de eventos para contenido dinámico
    const content = this.modal.querySelector('#audio-tab-content');
    if (content) {
      this.eventManager.addEventListener(content, 'click', async (e) => {
        const modeBtn = e.target.closest('.audio-mode-btn');
        const presetBtn = e.target.closest('.audio-preset-btn');
        const profileBtn = e.target.closest('.audio-profile-btn');
        const ambientBtn = e.target.closest('.ambient-btn');
        const binauralBtn = e.target.closest('.binaural-btn');

        if (modeBtn) {
          await this.audioReader.setMode(modeBtn.dataset.mode);
          this.showTab('modes'); // Refresh
        } else if (presetBtn) {
          await this.audioReader.quickSetup(presetBtn.dataset.preset);
          this.showTab('modes'); // Refresh
        } else if (profileBtn) {
          this.audioReader.setProfile(profileBtn.dataset.profile);
          this.showTab('equalizer'); // Refresh
        } else if (ambientBtn) {
          // Toggle: Si ya está activo, detener
          const isActive = ambientBtn.classList.contains('border-cyan-500');

          if (isActive) {
            // Desactivar y detener
            ambientBtn.classList.remove('border-cyan-500', 'bg-cyan-500/20');
            ambientBtn.classList.add('border-slate-300 dark:border-slate-700');
            this.audioReader.stopAmbient();
          } else {
            // Desactivar todos los demás
            const allAmbientBtns = this.modal.querySelectorAll('.ambient-btn');
            allAmbientBtns.forEach(btn => {
              btn.classList.remove('border-cyan-500', 'bg-cyan-500/20');
              btn.classList.add('border-slate-300 dark:border-slate-700');
            });

            // Activar el seleccionado
            ambientBtn.classList.add('border-cyan-500', 'bg-cyan-500/20');
            ambientBtn.classList.remove('border-slate-300 dark:border-slate-700');

            // Reproducir
            await this.audioReader.playAmbient(ambientBtn.dataset.soundscape);
          }
        } else if (binauralBtn) {
          // Toggle: Si ya está activo, detener
          const isActive = binauralBtn.classList.contains('border-cyan-500');

          if (isActive) {
            // Desactivar y detener
            binauralBtn.classList.remove('border-cyan-500', 'bg-cyan-500/20');
            binauralBtn.classList.add('border-slate-300 dark:border-slate-700');
            this.audioReader.stopBinaural();
          } else {
            // Desactivar todos los demás
            const allBinauralBtns = this.modal.querySelectorAll('.binaural-btn');
            allBinauralBtns.forEach(btn => {
              btn.classList.remove('border-cyan-500', 'bg-cyan-500/20');
              btn.classList.add('border-slate-300 dark:border-slate-700');
            });

            // Activar el seleccionado
            binauralBtn.classList.add('border-cyan-500', 'bg-cyan-500/20');
            binauralBtn.classList.remove('border-slate-300 dark:border-slate-700');

            // Reproducir
            await this.audioReader.playBinaural(binauralBtn.dataset.binaural);
          }
        } else if (e.target.id === 'ambient-stop') {
          this.audioReader.stopAmbient();
        } else if (e.target.id === 'binaural-stop') {
          this.audioReader.stopBinaural();
        }
      });
    }

    // Click fuera del modal para cerrar
    this.eventManager.addEventListener(this.modal, 'click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    this._eventListenersAttached = true;
  }

  attachEqualizerEvents() {
    // 🔧 FIX: Usar EventManager para todos los listeners del ecualizador
    const bassSlider = this.modal.querySelector('#bass-slider');
    const midSlider = this.modal.querySelector('#mid-slider');
    const trebleSlider = this.modal.querySelector('#treble-slider');
    const reverbSlider = this.modal.querySelector('#reverb-slider');
    const resetBtn = this.modal.querySelector('#eq-reset');

    if (bassSlider) {
      this.eventManager.addEventListener(bassSlider, 'input', (e) => {
        const value = parseInt(e.target.value);
        this.modal.querySelector('#bass-value').textContent = `${value} dB`;
        this.audioReader.setBass(value);
      });
    }

    if (midSlider) {
      this.eventManager.addEventListener(midSlider, 'input', (e) => {
        const value = parseInt(e.target.value);
        this.modal.querySelector('#mid-value').textContent = `${value} dB`;
        this.audioReader.setMid(value);
      });
    }

    if (trebleSlider) {
      this.eventManager.addEventListener(trebleSlider, 'input', (e) => {
        const value = parseInt(e.target.value);
        this.modal.querySelector('#treble-value').textContent = `${value} dB`;
        this.audioReader.setTreble(value);
      });
    }

    if (reverbSlider) {
      this.eventManager.addEventListener(reverbSlider, 'input', (e) => {
        const value = parseInt(e.target.value);
        this.modal.querySelector('#reverb-value').textContent = `${value}%`;
        this.audioReader.setReverb(value / 100);
      });
    }

    if (resetBtn) {
      this.eventManager.addEventListener(resetBtn, 'click', () => {
        bassSlider.value = 0;
        midSlider.value = 0;
        trebleSlider.value = 0;
        reverbSlider.value = 5;

        this.audioReader.setBass(0);
        this.audioReader.setMid(0);
        this.audioReader.setTreble(0);
        this.audioReader.setReverb(0.05);

        this.showTab('equalizer'); // Refresh
      });
    }

    // Volumen de canales
    const ambientVolume = this.modal.querySelector('#ambient-volume');
    const binauralVolume = this.modal.querySelector('#binaural-volume');
    const masterVolume = this.modal.querySelector('#master-volume');

    if (ambientVolume) {
      this.eventManager.addEventListener(ambientVolume, 'input', (e) => {
        this.audioReader.setAmbientVolume(parseInt(e.target.value) / 100);
      });
    }

    if (binauralVolume) {
      this.eventManager.addEventListener(binauralVolume, 'input', (e) => {
        this.audioReader.setBinauralVolume(parseInt(e.target.value) / 100);
      });
    }

    if (masterVolume) {
      this.eventManager.addEventListener(masterVolume, 'input', (e) => {
        const value = parseInt(e.target.value);
        this.modal.querySelector('#master-volume-value').textContent = `${value}%`;
        this.audioReader.setMasterVolume(value / 100);
      });
    }

    // Toggle enhanced
    const enhancedToggle = this.modal.querySelector('#enhanced-toggle');
    if (enhancedToggle) {
      this.eventManager.addEventListener(enhancedToggle, 'change', (e) => {
        this.audioReader.toggleEnhanced();
      });
    }
  }

  // ==========================================================================
  // CONTROL
  // ==========================================================================

  open() {
    if (!this.modal) this.render();
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');

    // Inicializar visualizador si está disponible
    this.initializeVisualizer();
  }

  close() {
    // 🔧 FIX: Cleanup de event listeners ANTES de ocultar
    if (this.eventManager) {
      this.eventManager.cleanup();
    }
    this._eventListenersAttached = false;

    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
    }

    // Detener visualizador
    if (this.visualizer) {
      this.visualizer.stop();
    }
  }

  initializeVisualizer() {
    // Solo inicializar si AudioVisualizer está disponible y hay audioMixer
    if (!window.AudioVisualizer || !this.audioReader.audioMixer) {
      // logger.debug('AudioVisualizer o AudioMixer no disponible');
      return;
    }

    try {
      const audioContext = this.audioReader.audioMixer.audioContext;
      if (!audioContext) return;

      // Crear visualizador
      this.visualizer = new AudioVisualizer(audioContext);

      // Obtener nodo de salida del masterGain
      const masterGain = this.audioReader.audioMixer.masterGain;
      if (masterGain) {
        this.visualizer.initialize(masterGain);

        // Crear canvas
        const canvas = this.visualizer.createCanvas('audio-visualizer-container', 600, 60);

        if (canvas) {
          // Iniciar visualización
          this.visualizer.start();
          // logger.debug('✅ Visualizador de audio iniciado');
        }
      }
    } catch (error) {
      console.error('Error inicializando visualizador:', error);
    }
  }

  toggle() {
    if (!this.modal) {
      this.open();
    } else {
      this.modal.classList.contains('hidden') ? this.open() : this.close();
    }
  }
}

// Exportar
window.AudioControlModal = AudioControlModal;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioControlModal;
}
