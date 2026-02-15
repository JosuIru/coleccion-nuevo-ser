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

    if (ua.includes('Brave')) return 'brave';
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
  // DETECCIÓN DE PROBLEMA LINUX + CHROME
  // ==========================================================================

  isLinuxChromeIssue() {
    return (
      this.platform === 'linux' &&
      (this.browser === 'chrome' || this.browser === 'brave' || this.browser === 'edge')
    );
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
          </div>

          <!-- Footer Info -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p class="text-blue-100 text-sm">
              <strong>ℹ️ Nota:</strong> Este problema solo afecta a ${browserName} en Linux.
              La aplicación Android y otros sistemas operativos funcionan correctamente.
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

    // Solo verificar si es Linux + Chrome/Brave/Edge
    if (!this.isLinuxChromeIssue()) {
      return false; // No hay problema
    }

    // Verificar si el usuario ya dijo "no mostrar más"
    if (localStorage.getItem('hide-linux-chrome-tts-warning') === 'true') {
      return false; // Usuario no quiere ver el modal
    }

    // Verificar si hay voces disponibles
    const hasVoices = await this.checkVoices(3000);

    if (!hasVoices) {
      this.showLinuxChromeFixModal();
      return true; // Se mostró el modal
    }

    return false; // Hay voces, todo bien
  }
}

// Crear instancia global
window.ttsPlatformHelper = new TTSPlatformHelper();

// NOTA: Ya no se ejecuta autoCheck automáticamente.
// El modal solo se mostrará cuando el usuario intente usar el reproductor de audio.

// logger.debug('✅ TTS Platform Helper cargado');
