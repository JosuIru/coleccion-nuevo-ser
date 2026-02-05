// ============================================================================
// TTS PLATFORM HELPER - Detecta y soluciona problemas de TTS por plataforma
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class TTSPlatformHelper {
  constructor() {
    this.platform = this.detectPlatform();
    this.browser = this.detectBrowser();
    this.hasVoices = false;
    this.checkAttempts = 0;
    this.maxAttempts = 5;
    this.checkInterval = null;
  }

  // ==========================================================================
  // DETECCIÓN DE PLATAFORMA
  // ==========================================================================

  detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (platform.includes('linux') || ua.includes('linux')) return 'linux';
    if (platform.includes('win') || ua.includes('windows')) return 'windows';
    if (platform.includes('mac') || ua.includes('mac')) return 'macos';

    return 'unknown';
  }

  detectBrowser() {
    const ua = navigator.userAgent;

    // Brave no incluye 'Brave' en UA (anti-fingerprinting), pero expone navigator.brave
    // navigator.brave es un objeto con método isBrave() que retorna Promise<boolean>
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') return 'brave';
    // Fallback: en algunas versiones navigator.brave existe como truthy sin isBrave
    if (navigator.brave) return 'brave';
    if (ua.includes('Edg')) return 'edge';
    if (ua.includes('Chrome')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari')) return 'safari';

    return 'unknown';
  }

  // ==========================================================================
  // VERIFICACIÓN DE VOCES
  // ==========================================================================

  async checkVoices(timeout = 8000) {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        this.checkAttempts++;
        const voices = speechSynthesis.getVoices();

        if (voices.length > 0) {
          this.hasVoices = true;
          // logger.debug(`✅ Voces TTS detectadas (${voices.length}) en intento ${this.checkAttempts}`);
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          // logger.warn(`⚠️ No se detectaron voces después de ${timeout}ms`);
          resolve(false);
          return;
        }

        setTimeout(check, 1000);
      };

      check();
    });
  }

  // ==========================================================================
  // DETECCIÓN DE PROBLEMAS POR PLATAFORMA/NAVEGADOR
  // ==========================================================================

  isLinuxChromeIssue() {
    return (
      this.platform === 'linux' &&
      (this.browser === 'chrome' || this.browser === 'brave' || this.browser === 'edge')
    );
  }

  /**
   * Detecta si es Brave en cualquier plataforma (Brave bloquea voces de Google)
   */
  isBraveShieldsIssue() {
    return this.browser === 'brave';
  }

  /**
   * Verifica si hay voces de Google disponibles (las que Brave bloquea)
   */
  hasGoogleVoices() {
    const voices = speechSynthesis.getVoices();
    return voices.some(v => v.name.toLowerCase().includes('google'));
  }

  shouldShowLinuxChromeFix() {
    return this.isLinuxChromeIssue() && !this.hasVoices;
  }

  // ==========================================================================
  // GENERAR SOLUCIONES
  // ==========================================================================

  getLinuxChromeLauncherCommand() {
    const browser = this.browser === 'brave' ? 'brave-browser' :
                   this.browser === 'edge' ? 'microsoft-edge' :
                   'google-chrome';

    const flags = [
      '--enable-speech-dispatcher',
      '--enable-features=WebSpeech',
      '--use-speech-dispatcher',
      '--disable-speech-api-sandboxing'
    ];

    const url = window.location.href;

    return `${browser} ${flags.join(' ')} "${url}"`;
  }

  generateDesktopFile() {
    const browser = this.browser === 'brave' ? 'brave-browser' :
                   this.browser === 'edge' ? 'microsoft-edge' :
                   'google-chrome';

    const browserName = this.browser.charAt(0).toUpperCase() + this.browser.slice(1);

    const flags = [
      '--enable-speech-dispatcher',
      '--enable-features=WebSpeech',
      '--use-speech-dispatcher',
      '--disable-speech-api-sandboxing'
    ];

    const url = window.location.origin + window.location.pathname;

    return `[Desktop Entry]
Version=1.0
Type=Application
Name=Colección Nuevo Ser (TTS Optimizado)
Comment=Lanzador con soporte TTS para Linux
Exec=${browser} ${flags.join(' ')} "${url}"
Icon=applications-internet
Terminal=false
Categories=Network;WebBrowser;
`;
  }

  generateBashScript() {
    const browser = this.browser === 'brave' ? 'brave-browser' :
                   this.browser === 'edge' ? 'microsoft-edge' :
                   'google-chrome';

    const flags = [
      '--enable-speech-dispatcher',
      '--enable-features=WebSpeech',
      '--use-speech-dispatcher',
      '--disable-speech-api-sandboxing'
    ];

    const url = window.location.href;

    return `#!/bin/bash
# Launcher para Colección Nuevo Ser con TTS optimizado en Linux

echo "🚀 Iniciando ${browser} con soporte TTS..."

# Asegurar que speech-dispatcher esté corriendo
systemctl --user start speech-dispatcher 2>/dev/null
sleep 1

# Lanzar navegador con flags TTS
${browser} \\
  ${flags.join(' \\\n  ')} \\
  "${url}"
`;
  }

  // ==========================================================================
  // DESCARGAR ARCHIVOS
  // ==========================================================================

  downloadDesktopFile() {
    const content = this.generateDesktopFile();
    const blob = new Blob([content], { type: 'application/x-desktop' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coleccion-nuevo-ser-tts.desktop';
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadBashScript() {
    const content = this.generateBashScript();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'launch-coleccion-tts.sh';
    a.click();
    URL.revokeObjectURL(url);
  }

  copyCommandToClipboard() {
    const command = this.getLinuxChromeLauncherCommand();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(command).then(() => {
        // logger.debug('✅ Comando copiado al portapapeles');
        if (window.toast) {
          window.toast.success('Comando copiado al portapapeles');
        }
      }).catch(err => {
        logger.error('Error copiando:', err);
        this.fallbackCopyCommand(command);
      });
    } else {
      this.fallbackCopyCommand(command);
    }
  }

  fallbackCopyCommand(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      // logger.debug('✅ Comando copiado (fallback)');
      if (window.toast) {
        window.toast.success('Comando copiado');
      }
    } catch (err) {
      logger.error('Error copiando:', err);
    }

    document.body.removeChild(textarea);
  }

  // ==========================================================================
  // MODAL DE AYUDA
  // ==========================================================================

  showLinuxChromeFixModal() {
    const modal = document.createElement('div');
    modal.id = 'linux-chrome-tts-fix-modal';
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4';
    modal.style.backdropFilter = 'blur(8px)';

    const command = this.getLinuxChromeLauncherCommand();
    const browserName = this.browser.charAt(0).toUpperCase() + this.browser.slice(1);

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-cyan-500/30 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="bg-gradient-to-r from-cyan-600 to-purple-600 p-6 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="text-4xl">🔊</div>
              <div>
                <h2 class="text-2xl font-bold text-white">TTS No Disponible</h2>
                <p class="text-cyan-100 text-sm mt-1">Linux + ${browserName} detectado</p>
              </div>
            </div>
            <button id="linux-tts-close" class="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Explicación -->
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p class="text-amber-100 text-sm leading-relaxed">
              ${browserName} en Linux tiene un problema conocido con las voces TTS.
              Para solucionarlo, necesitas lanzar el navegador con flags específicos.
            </p>
          </div>

          <!-- Soluciones -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              Soluciones Disponibles
            </h3>

            <!-- Solución 1: Comando de Terminal -->
            <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 class="font-semibold text-cyan-400 mb-1">1. Copiar Comando (Más Rápido)</h4>
                  <p class="text-sm text-slate-300">Ejecuta este comando en tu terminal</p>
                </div>
                <button id="copy-command-btn" class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                  Copiar
                </button>
              </div>
              <pre class="bg-black/30 p-3 rounded text-xs text-cyan-300 overflow-x-auto font-mono">${command}</pre>
            </div>

            <!-- Solución 2: Descargar Script -->
            <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 class="font-semibold text-purple-400 mb-1">2. Descargar Script (Recomendado)</h4>
                  <p class="text-sm text-slate-300">Descarga y ejecuta con: <code class="text-cyan-400 bg-black/30 px-2 py-0.5 rounded">chmod +x launch-coleccion-tts.sh && ./launch-coleccion-tts.sh</code></p>
                </div>
                <button id="download-script-btn" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                  </svg>
                  Descargar
                </button>
              </div>
            </div>

            <!-- Solución 3: Launcher Desktop -->
            <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 class="font-semibold text-green-400 mb-1">3. Crear Acceso Directo (Permanente)</h4>
                  <p class="text-sm text-slate-300">Descarga y mueve a <code class="text-cyan-400 bg-black/30 px-2 py-0.5 rounded">~/.local/share/applications/</code></p>
                </div>
                <button id="download-desktop-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                  </svg>
                  Descargar
                </button>
              </div>
            </div>

            <!-- Solución 4: Usar Firefox -->
            <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h4 class="font-semibold text-orange-400 mb-1">4. Usar Firefox (Alternativa)</h4>
                  <p class="text-sm text-slate-300">Firefox funciona perfectamente sin configuración adicional</p>
                </div>
              </div>
            </div>

            ${this.browser === 'brave' ? `
            <!-- Solución 5: Brave Shields -->
            <div class="bg-slate-800/50 rounded-lg p-4 border border-red-500/30">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h4 class="font-semibold text-red-400 mb-1">5. Desactivar Brave Shields (Si los flags no funcionan)</h4>
                  <p class="text-sm text-slate-300">
                    Brave Shields puede bloquear APIs de audio. Haz clic en el icono del escudo
                    <span class="inline-block mx-1">🛡️</span> en la barra de dirección y desactívalo para este sitio.
                  </p>
                </div>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Footer Info -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p class="text-blue-100 text-sm">
              <strong>ℹ️ Nota:</strong> Este problema solo afecta a ${browserName} en Linux.
              La aplicación Android y otros sistemas operativos funcionan correctamente.
              ${this.browser === 'brave' ? '<br><strong>Brave:</strong> Los sonidos ambientales funcionarán aunque TTS no esté disponible.' : ''}
            </p>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="bg-slate-800/50 p-4 rounded-b-2xl flex justify-end gap-3 border-t border-slate-700">
          <button id="linux-tts-remind-later" class="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition">
            Recordar después
          </button>
          <button id="linux-tts-dont-show" class="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition">
            No mostrar más
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const helper = this;

    document.getElementById('linux-tts-close').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('copy-command-btn').addEventListener('click', () => {
      helper.copyCommandToClipboard();
    });

    document.getElementById('download-script-btn').addEventListener('click', () => {
      helper.downloadBashScript();
      if (window.toast) {
        window.toast.success('Script descargado. Ejecútalo desde la terminal.');
      }
    });

    document.getElementById('download-desktop-btn').addEventListener('click', () => {
      helper.downloadDesktopFile();
      if (window.toast) {
        window.toast.success('Archivo .desktop descargado. Muévelo a ~/.local/share/applications/');
      }
    });

    document.getElementById('linux-tts-remind-later').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('linux-tts-dont-show').addEventListener('click', () => {
      localStorage.setItem('hide-linux-chrome-tts-warning', 'true');
      modal.remove();
      if (window.toast) {
        window.toast.info('No se volverá a mostrar este mensaje');
      }
    });
  }

  // ==========================================================================
  // MODAL ESPECÍFICO PARA BRAVE (Shields bloqueando voces)
  // ==========================================================================

  showBraveShieldsModal() {
    // Evitar mostrar si ya hay uno abierto
    if (document.getElementById('brave-shields-tts-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'brave-shields-tts-modal';
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4';
    modal.style.backdropFilter = 'blur(8px)';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-orange-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-600 to-red-600 p-5 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="text-3xl">🦁</div>
              <div>
                <h2 class="text-xl font-bold text-white">Brave Shields Activo</h2>
                <p class="text-orange-100 text-sm">Las voces de audio están bloqueadas</p>
              </div>
            </div>
            <button id="brave-modal-close" class="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-4">
          <div class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p class="text-orange-100 text-sm leading-relaxed">
              <strong>¿Por qué pasa esto?</strong><br>
              Brave bloquea las conexiones a Google que proporcionan las voces de texto-a-voz.
              Chrome usa estas mismas voces, pero Brave las bloquea por privacidad.
            </p>
          </div>

          <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h4 class="font-semibold text-green-400 mb-3 flex items-center gap-2">
              <span class="text-xl">🛡️</span>
              Solución Rápida
            </h4>
            <ol class="text-sm text-slate-300 space-y-2 ml-4">
              <li class="flex items-start gap-2">
                <span class="text-orange-400 font-bold">1.</span>
                <span>Haz clic en el <strong class="text-orange-400">icono del escudo 🛡️</strong> en la barra de direcciones</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-orange-400 font-bold">2.</span>
                <span>Desactiva <strong class="text-orange-400">"Shields"</strong> para este sitio</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-orange-400 font-bold">3.</span>
                <span><strong class="text-green-400">Recarga la página</strong> (F5 o Ctrl+R)</span>
              </li>
            </ol>
          </div>

          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p class="text-blue-100 text-xs">
              <strong>💡 Alternativa:</strong> Usa Chrome o Firefox donde TTS funciona sin configuración.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-slate-800/50 p-4 rounded-b-2xl flex justify-between items-center border-t border-slate-700">
          <button id="brave-modal-retry" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>
            </svg>
            Ya desactivé Shields, reintentar
          </button>
          <button id="brave-modal-dismiss" class="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition text-sm">
            No mostrar más
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const helper = this;

    document.getElementById('brave-modal-close').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('brave-modal-retry').addEventListener('click', async () => {
      modal.remove();

      // Esperar un momento y verificar de nuevo
      if (window.toast) {
        window.toast.info('Verificando voces...');
      }

      await new Promise(r => setTimeout(r, 1000));
      const voices = speechSynthesis.getVoices();

      if (voices.length > 0) {
        if (window.toast) {
          window.toast.success(`¡Voces disponibles! (${voices.length} encontradas)`);
        }
        helper.hasVoices = true;
      } else {
        if (window.toast) {
          window.toast.error('Aún no hay voces. Asegúrate de desactivar Shields y recargar.');
        }
        // Mostrar modal de nuevo
        setTimeout(() => helper.showBraveShieldsModal(), 500);
      }
    });

    document.getElementById('brave-modal-dismiss').addEventListener('click', () => {
      localStorage.setItem('hide-brave-shields-tts-warning', 'true');
      modal.remove();
      if (window.toast) {
        window.toast.info('No se volverá a mostrar');
      }
    });
  }

  // ==========================================================================
  // INICIALIZACIÓN AUTOMÁTICA
  // ==========================================================================

  async autoCheck() {
    // logger.debug(`🔍 Plataforma: ${this.platform}, Navegador: ${this.browser}`);

    // Solo verificar si es Linux + Chrome/Brave/Edge
    if (!this.isLinuxChromeIssue()) {
      // logger.debug('✅ No es necesario verificar (no es Linux + Chrome/Brave/Edge)');
      return;
    }

    // Verificar si el usuario ya dijo "no mostrar más"
    if (localStorage.getItem('hide-linux-chrome-tts-warning') === 'true') {
      // logger.debug('ℹ️ Usuario deshabilitó el aviso de TTS');
      return;
    }

    // Esperar a que intente cargar voces
    const hasVoices = await this.checkVoices();

    if (!hasVoices) {
      // logger.warn('⚠️ No se detectaron voces TTS. Mostrando modal de ayuda...');

      // Esperar un poco más por si acaso
      setTimeout(() => {
        if (speechSynthesis.getVoices().length === 0) {
          this.showLinuxChromeFixModal();
        }
      }, 2000);
    }
  }

  // ==========================================================================
  // VERIFICACIÓN MANUAL (llamada desde el reproductor de audio)
  // ==========================================================================

  async checkAndShowModalIfNeeded() {
    // 🔧 FIX v2.9.202: No mostrar modal en apps Capacitor (tienen TTS nativo)
    if (window.Capacitor) {
      return false; // Capacitor apps tienen TTS nativo, no necesitan este check
    }

    // Verificar si hay voces disponibles (más tiempo para Brave)
    const voiceTimeout = this.browser === 'brave' ? 8000 : 5000;
    const hasVoices = await this.checkVoices(voiceTimeout);

    // Si hay voces, todo bien
    if (hasVoices) {
      return false;
    }

    // 🦁 BRAVE: Mostrar modal específico de Shields (en cualquier plataforma)
    if (this.isBraveShieldsIssue()) {
      // Verificar si el usuario ya dijo "no mostrar más"
      if (localStorage.getItem('hide-brave-shields-tts-warning') === 'true') {
        return false;
      }

      this.showBraveShieldsModal();
      return true;
    }

    // 🐧 LINUX + Chrome/Edge: Mostrar modal de configuración Linux
    if (this.isLinuxChromeIssue()) {
      // Verificar si el usuario ya dijo "no mostrar más"
      if (localStorage.getItem('hide-linux-chrome-tts-warning') === 'true') {
        return false;
      }

      this.showLinuxChromeFixModal();
      return true;
    }

    // Otros navegadores sin voces - no mostramos modal
    return false;
  }
}

// Crear instancia global
window.ttsPlatformHelper = new TTSPlatformHelper();

// NOTA: Ya no se ejecuta autoCheck automáticamente.
// El modal solo se mostrará cuando el usuario intente usar el reproductor de audio.

// logger.debug('✅ TTS Platform Helper cargado');
