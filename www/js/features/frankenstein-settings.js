/**
 * FRANKENSTEIN LAB - Sistema de Ajustes y UI Mejorada v1.0
 * Panel de settings, header mejorado, galeria de microsociedades
 *
 * @version 1.0.0
 * @date 2024-12
 */

// ========================================
// 1. PANEL DE AJUSTES
// ========================================

class FrankensteinSettings {
  constructor() {
    this.isOpen = false;
    this.settings = this.loadSettings();
    this.modal = null;
  }

  loadSettings() {
    const defaults = {
      // Juego
      gameMode: 'juego',
      difficulty: 'principiante',
      autoSave: true,
      showTutorialHints: true,

      // Audio
      soundEnabled: true,
      soundVolume: 0.7,
      musicEnabled: false,
      musicVolume: 0.5,

      // Visual
      animations: true,
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium',

      // Notificaciones
      toastPosition: 'bottom-right',
      toastDuration: 4000,
      hapticFeedback: true,

      // Datos
      syncEnabled: false,
      analyticsEnabled: false
    };

    try {
      const saved = localStorage.getItem('frankenstein-settings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('frankenstein-settings', JSON.stringify(this.settings));
      this.applySettings();
      if (window.enhancedToast) {
        window.enhancedToast.success('Ajustes guardados');
      }
    } catch (e) {
      console.error('Error guardando settings:', e);
    }
  }

  applySettings() {
    // Aplicar reduced motion
    if (this.settings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    // Aplicar high contrast
    if (this.settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Aplicar font size
    document.documentElement.setAttribute('data-font-size', this.settings.fontSize);

    // Notificar cambios al quiz system
    if (window.FrankensteinQuiz) {
      window.FrankensteinQuiz.setMode(this.settings.gameMode);
      window.FrankensteinQuiz.setDifficulty(this.settings.difficulty);
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.createModal();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    if (this.modal) {
      this.modal.classList.add('closing');
      setTimeout(() => {
        this.modal.remove();
        this.modal = null;
      }, 300);
    }
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'settings-modal';
    this.modal.innerHTML = `
      <div class="settings-overlay" onclick="window.frankensteinSettings.close()"></div>
      <div class="settings-panel">
        <div class="settings-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Ajustes
          </h2>
          <button class="settings-close" onclick="window.frankensteinSettings.close()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="settings-content">
          ${this.renderGameSection()}
          ${this.renderAudioSection()}
          ${this.renderVisualSection()}
          ${this.renderNotificationsSection()}
          ${this.renderDataSection()}
        </div>

        <div class="settings-footer">
          <button class="settings-btn secondary" onclick="window.frankensteinSettings.resetToDefaults()">
            Restaurar Predeterminados
          </button>
          <button class="settings-btn primary" onclick="window.frankensteinSettings.close()">
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Animar entrada
    requestAnimationFrame(() => {
      this.modal.classList.add('active');
    });

    // Attach event listeners
    this.attachEventListeners();
  }

  renderGameSection() {
    return `
      <section class="settings-section">
        <h3>
          <span class="section-icon">🎮</span>
          Juego
        </h3>

        <div class="setting-item">
          <div class="setting-info">
            <label>Modo de Juego</label>
            <p>Define como interactuas con el laboratorio</p>
          </div>
          <select id="setting-gameMode" onchange="window.frankensteinSettings.set('gameMode', this.value)">
            <option value="investigacion" ${this.settings.gameMode === 'investigacion' ? 'selected' : ''}>
              Investigacion
            </option>
            <option value="juego" ${this.settings.gameMode === 'juego' ? 'selected' : ''}>
              Aprendizaje
            </option>
            <option value="demo" ${this.settings.gameMode === 'demo' ? 'selected' : ''}>
              Demo
            </option>
          </select>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Dificultad de Quiz</label>
            <p>Nivel de complejidad de las preguntas</p>
          </div>
          <select id="setting-difficulty" onchange="window.frankensteinSettings.set('difficulty', this.value)">
            <option value="ninos" ${this.settings.difficulty === 'ninos' ? 'selected' : ''}>
              Ninos
            </option>
            <option value="principiante" ${this.settings.difficulty === 'principiante' ? 'selected' : ''}>
              Principiante
            </option>
            <option value="iniciado" ${this.settings.difficulty === 'iniciado' ? 'selected' : ''}>
              Iniciado
            </option>
            <option value="experto" ${this.settings.difficulty === 'experto' ? 'selected' : ''}>
              Experto
            </option>
          </select>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Guardado Automatico</label>
            <p>Guarda tu progreso automaticamente</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.autoSave ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('autoSave', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Mostrar Pistas del Tutorial</label>
            <p>Ayudas contextuales durante el juego</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.showTutorialHints ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('showTutorialHints', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </section>
    `;
  }

  renderAudioSection() {
    return `
      <section class="settings-section">
        <h3>
          <span class="section-icon">🔊</span>
          Audio
        </h3>

        <div class="setting-item">
          <div class="setting-info">
            <label>Efectos de Sonido</label>
            <p>Sonidos de interacciones y eventos</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.soundEnabled ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('soundEnabled', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item ${!this.settings.soundEnabled ? 'disabled' : ''}">
          <div class="setting-info">
            <label>Volumen de Efectos</label>
          </div>
          <input type="range" min="0" max="100" value="${this.settings.soundVolume * 100}"
                 onchange="window.frankensteinSettings.set('soundVolume', this.value / 100)"
                 ${!this.settings.soundEnabled ? 'disabled' : ''}>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Musica Ambiental</label>
            <p>Musica de fondo gotica atmosferica</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.musicEnabled ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('musicEnabled', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </section>
    `;
  }

  renderVisualSection() {
    return `
      <section class="settings-section">
        <h3>
          <span class="section-icon">🎨</span>
          Visual
        </h3>

        <div class="setting-item">
          <div class="setting-info">
            <label>Animaciones</label>
            <p>Efectos visuales y transiciones</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.animations ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('animations', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Reducir Movimiento</label>
            <p>Minimiza animaciones para accesibilidad</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.reducedMotion ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('reducedMotion', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Alto Contraste</label>
            <p>Mejora visibilidad de elementos</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.highContrast ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('highContrast', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Tamano de Fuente</label>
          </div>
          <select onchange="window.frankensteinSettings.set('fontSize', this.value)">
            <option value="small" ${this.settings.fontSize === 'small' ? 'selected' : ''}>Pequeno</option>
            <option value="medium" ${this.settings.fontSize === 'medium' ? 'selected' : ''}>Mediano</option>
            <option value="large" ${this.settings.fontSize === 'large' ? 'selected' : ''}>Grande</option>
          </select>
        </div>
      </section>
    `;
  }

  renderNotificationsSection() {
    return `
      <section class="settings-section">
        <h3>
          <span class="section-icon">🔔</span>
          Notificaciones
        </h3>

        <div class="setting-item">
          <div class="setting-info">
            <label>Posicion de Toasts</label>
          </div>
          <select onchange="window.frankensteinSettings.set('toastPosition', this.value)">
            <option value="top-right" ${this.settings.toastPosition === 'top-right' ? 'selected' : ''}>
              Arriba Derecha
            </option>
            <option value="top-left" ${this.settings.toastPosition === 'top-left' ? 'selected' : ''}>
              Arriba Izquierda
            </option>
            <option value="bottom-right" ${this.settings.toastPosition === 'bottom-right' ? 'selected' : ''}>
              Abajo Derecha
            </option>
            <option value="bottom-left" ${this.settings.toastPosition === 'bottom-left' ? 'selected' : ''}>
              Abajo Izquierda
            </option>
          </select>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Vibracion Haptica</label>
            <p>Feedback tactil en dispositivos moviles</p>
          </div>
          <label class="toggle">
            <input type="checkbox" ${this.settings.hapticFeedback ? 'checked' : ''}
                   onchange="window.frankensteinSettings.set('hapticFeedback', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </section>
    `;
  }

  renderDataSection() {
    return `
      <section class="settings-section">
        <h3>
          <span class="section-icon">💾</span>
          Datos
        </h3>

        <div class="setting-item">
          <div class="setting-info">
            <label>Seres Guardados</label>
            <p>${this.countSavedBeings()} seres en almacenamiento local</p>
          </div>
          <button class="settings-btn small" onclick="window.frankensteinSettings.exportData()">
            Exportar
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Microsociedades</label>
            <p>${this.countSavedSocieties()} sociedades guardadas</p>
          </div>
          <button class="settings-btn small" onclick="window.frankensteinSettings.showSocietiesGallery()">
            Ver Galeria
          </button>
        </div>

        <div class="setting-item danger">
          <div class="setting-info">
            <label>Borrar Todos los Datos</label>
            <p>Esta accion no se puede deshacer</p>
          </div>
          <button class="settings-btn small danger" onclick="window.frankensteinSettings.confirmClearData()">
            Borrar
          </button>
        </div>
      </section>
    `;
  }

  attachEventListeners() {
    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  countSavedBeings() {
    try {
      const saved = localStorage.getItem('frankenstein-saved-beings');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  }

  countSavedSocieties() {
    try {
      const saved = localStorage.getItem('frankenstein-microsocieties');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  }

  exportData() {
    const data = {
      settings: this.settings,
      beings: JSON.parse(localStorage.getItem('frankenstein-saved-beings') || '[]'),
      societies: JSON.parse(localStorage.getItem('frankenstein-microsocieties') || '[]'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frankenstein-lab-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (window.enhancedToast) {
      window.enhancedToast.success('Datos exportados correctamente');
    }
  }

  async confirmClearData() {
    const confirmed = await window.confirmModal?.show({
      title: 'Borrar todos los datos',
      message: '¿Estás seguro de que quieres borrar TODOS los datos?\n\nEsto incluye:\n- Seres guardados\n- Microsociedades\n- Ajustes\n\nEsta acción NO se puede deshacer.',
      confirmText: 'Borrar todo',
      cancelText: 'Cancelar',
      type: 'danger'
    }) ?? confirm('¿Estás seguro de que quieres borrar TODOS los datos?');

    if (confirmed) {
      this.clearAllData();
    }
  }

  clearAllData() {
    localStorage.removeItem('frankenstein-saved-beings');
    localStorage.removeItem('frankenstein-microsocieties');
    localStorage.removeItem('frankenstein-settings');
    localStorage.removeItem('frankenstein-stats');

    this.settings = this.loadSettings();

    if (window.enhancedToast) {
      window.enhancedToast.success('Todos los datos han sido borrados');
    }

    // Recargar modal
    this.close();
    setTimeout(() => this.open(), 300);
  }

  async resetToDefaults() {
    const confirmed = await window.confirmModal?.show({
      title: 'Restaurar ajustes',
      message: '¿Restaurar todos los ajustes a sus valores predeterminados?',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar',
      type: 'warning'
    }) ?? confirm('¿Restaurar todos los ajustes a sus valores predeterminados?');

    if (confirmed) {
      localStorage.removeItem('frankenstein-settings');
      this.settings = this.loadSettings();
      this.close();
      setTimeout(() => this.open(), 300);

      if (window.enhancedToast) {
        window.enhancedToast.success('Ajustes restaurados');
      }
    }
  }

  showSocietiesGallery() {
    this.close();
    setTimeout(() => {
      if (window.microsocietiesGallery) {
        window.microsocietiesGallery.open();
      } else {
        if (window.enhancedToast) {
          window.enhancedToast.info('Galeria no disponible');
        }
      }
    }, 300);
  }
}


// ========================================
// 2. HEADER MEJORADO CON MENU
// ========================================

class FrankensteinHeader {
  constructor() {
    this.menuOpen = false;
  }

  create(container) {
    const header = document.createElement('header');
    header.className = 'franken-header';
    header.innerHTML = `
      <div class="franken-header-content">
        <div class="franken-header-left">
          <button class="franken-header-menu-btn" onclick="window.frankensteinHeader.toggleMenu()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <div class="franken-header-brand">
            <span class="brand-icon">🧬</span>
            <div class="brand-text">
              <h1>Laboratorio Frankenstein</h1>
              <p>Seres Transformadores</p>
            </div>
          </div>
        </div>

        <div class="franken-header-right">
          <button class="franken-header-btn" onclick="window.frankensteinSettings.open()"
                  data-tooltip="Ajustes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          <button class="franken-header-btn" onclick="window.frankensteinStats.open()"
                  data-tooltip="Estadisticas">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </button>

          <button class="franken-header-btn close" onclick="window.frankensteinHeader.exit()"
                  data-tooltip="Salir">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Menu lateral -->
      <div class="franken-menu-overlay" onclick="window.frankensteinHeader.closeMenu()"></div>
      <nav class="franken-menu">
        <div class="franken-menu-header">
          <span class="menu-icon">🧬</span>
          <span>Menu</span>
        </div>

        <div class="franken-menu-content">
          <a class="franken-menu-item" onclick="window.frankensteinHeader.goTo('lab')">
            <span class="menu-item-icon">⚗️</span>
            <span>Laboratorio</span>
          </a>
          <a class="franken-menu-item" onclick="window.frankensteinHeader.goTo('beings')">
            <span class="menu-item-icon">🗂️</span>
            <span>Mis Seres</span>
            <span class="menu-item-badge">${this.getBeingsCount()}</span>
          </a>
          <a class="franken-menu-item" onclick="window.frankensteinHeader.goTo('societies')">
            <span class="menu-item-icon">🌍</span>
            <span>Microsociedades</span>
            <span class="menu-item-badge">${this.getSocietiesCount()}</span>
          </a>
          <a class="franken-menu-item" onclick="window.frankensteinHeader.goTo('challenges')">
            <span class="menu-item-icon">🏆</span>
            <span>Retos</span>
          </a>

          <div class="franken-menu-divider"></div>

          <a class="franken-menu-item" onclick="window.frankensteinSettings.open(); window.frankensteinHeader.closeMenu();">
            <span class="menu-item-icon">⚙️</span>
            <span>Ajustes</span>
          </a>
          <a class="franken-menu-item" onclick="window.frankensteinStats.open(); window.frankensteinHeader.closeMenu();">
            <span class="menu-item-icon">📊</span>
            <span>Estadisticas</span>
          </a>
          <a class="franken-menu-item" onclick="window.frankensteinHeader.showHelp()">
            <span class="menu-item-icon">❓</span>
            <span>Ayuda</span>
          </a>

          <div class="franken-menu-divider"></div>

          <a class="franken-menu-item danger" onclick="window.frankensteinHeader.exit()">
            <span class="menu-item-icon">🚪</span>
            <span>Salir del Lab</span>
          </a>
        </div>

        <div class="franken-menu-footer">
          <small>Frankenstein Lab v3.1</small>
        </div>
      </nav>
    `;

    if (container) {
      container.insertBefore(header, container.firstChild);
    }

    return header;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    document.body.classList.toggle('menu-open', this.menuOpen);
  }

  closeMenu() {
    this.menuOpen = false;
    document.body.classList.remove('menu-open');
  }

  getBeingsCount() {
    try {
      const saved = localStorage.getItem('frankenstein-saved-beings');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  }

  getSocietiesCount() {
    try {
      const saved = localStorage.getItem('frankenstein-microsocieties');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  }

  goTo(section) {
    this.closeMenu();

    switch (section) {
      case 'lab':
        // Ya estamos en el lab
        break;
      case 'beings':
        if (window.frankensteinLabUI) {
          window.frankensteinLabUI.showSavedBeingsModal();
        }
        break;
      case 'societies':
        if (window.microsocietiesGallery) {
          window.microsocietiesGallery.open();
        }
        break;
      case 'challenges':
        if (window.frankensteinChallenges) {
          window.frankensteinChallenges.showChallengesModal();
        }
        break;
    }
  }

  showHelp() {
    this.closeMenu();
    // Mostrar tutorial o ayuda
    if (window.enhancedToast) {
      window.enhancedToast.info('Ayuda: Selecciona una mision, elige piezas y crea tu ser!');
    }
  }

  exit() {
    this.closeMenu();

    if (window.frankensteinLabUI && window.frankensteinLabUI.organism) {
      window.frankensteinLabUI.organism.hide();
    } else {
      // Fallback: ir a la biblioteca
      const container = document.getElementById('organism-container');
      if (container) {
        container.classList.add('hidden');
      }
      document.getElementById('biblioteca-view')?.classList.remove('hidden');
    }
  }
}


// ========================================
// 3. GALERIA DE MICROSOCIEDADES
// ========================================

class MicrosocietiesGallery {
  constructor() {
    this.modal = null;
    this.societies = [];
  }

  loadSocieties() {
    try {
      const saved = localStorage.getItem('frankenstein-microsocieties');
      this.societies = saved ? JSON.parse(saved) : [];
    } catch {
      this.societies = [];
    }
    return this.societies;
  }

  saveSociety(society) {
    this.loadSocieties();

    // Actualizar si existe, sino agregar
    const index = this.societies.findIndex(s => s.id === society.id);
    if (index >= 0) {
      this.societies[index] = society;
    } else {
      society.id = society.id || `society-${Date.now()}`;
      this.societies.push(society);
    }

    localStorage.setItem('frankenstein-microsocieties', JSON.stringify(this.societies));
  }

  deleteSociety(id) {
    this.loadSocieties();
    this.societies = this.societies.filter(s => s.id !== id);
    localStorage.setItem('frankenstein-microsocieties', JSON.stringify(this.societies));
  }

  open() {
    this.loadSocieties();

    this.modal = document.createElement('div');
    this.modal.className = 'societies-gallery-modal';
    this.modal.innerHTML = `
      <div class="societies-gallery-overlay" onclick="window.microsocietiesGallery.close()"></div>
      <div class="societies-gallery-panel">
        <div class="societies-gallery-header">
          <h2>🌍 Mis Microsociedades</h2>
          <button class="societies-gallery-close" onclick="window.microsocietiesGallery.close()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="societies-gallery-content">
          ${this.societies.length === 0 ? this.renderEmptyState() : this.renderSocietiesList()}
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    requestAnimationFrame(() => {
      this.modal.classList.add('active');
    });
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('closing');
      setTimeout(() => {
        this.modal.remove();
        this.modal = null;
      }, 300);
    }
  }

  renderEmptyState() {
    return `
      <div class="societies-empty">
        <div class="societies-empty-icon">🌍</div>
        <h3>No tienes microsociedades</h3>
        <p>Crea un ser viable y luego usa el boton "Microsociedad" para crear tu primera sociedad.</p>
      </div>
    `;
  }

  renderSocietiesList() {
    return `
      <div class="societies-grid">
        ${this.societies.map(society => this.renderSocietyCard(society)).join('')}
      </div>
    `;
  }

  renderSocietyCard(society) {
    const metrics = society.metrics || { health: 0, knowledge: 0, action: 0, cohesion: 0 };
    const avgMetric = Math.round((metrics.health + metrics.knowledge + metrics.action + metrics.cohesion) / 4);

    return `
      <div class="society-card" data-id="${society.id}">
        <div class="society-card-header">
          <h3>${society.name || 'Sin nombre'}</h3>
          <span class="society-turn">Turno ${society.turn || 0}</span>
        </div>

        <div class="society-card-metrics">
          <div class="metric">
            <span class="metric-icon">❤️</span>
            <div class="metric-bar">
              <div class="metric-fill health" style="width: ${metrics.health}%"></div>
            </div>
          </div>
          <div class="metric">
            <span class="metric-icon">📚</span>
            <div class="metric-bar">
              <div class="metric-fill knowledge" style="width: ${metrics.knowledge}%"></div>
            </div>
          </div>
          <div class="metric">
            <span class="metric-icon">⚡</span>
            <div class="metric-bar">
              <div class="metric-fill action" style="width: ${metrics.action}%"></div>
            </div>
          </div>
          <div class="metric">
            <span class="metric-icon">🤝</span>
            <div class="metric-bar">
              <div class="metric-fill cohesion" style="width: ${metrics.cohesion}%"></div>
            </div>
          </div>
        </div>

        <div class="society-card-info">
          <span>👥 ${society.beings?.length || 0} seres</span>
          <span class="society-score ${avgMetric >= 70 ? 'good' : avgMetric >= 40 ? 'medium' : 'bad'}">
            ${avgMetric}%
          </span>
        </div>

        <div class="society-card-actions">
          <button class="society-btn primary" onclick="window.microsocietiesGallery.resumeSociety('${society.id}')">
            ▶️ Continuar
          </button>
          <button class="society-btn danger" onclick="window.microsocietiesGallery.confirmDelete('${society.id}')">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  resumeSociety(id) {
    const society = this.societies.find(s => s.id === id);
    if (society && window.microSocietiesManager) {
      this.close();
      window.microSocietiesManager.resumeSociety(society);
    }
  }

  async confirmDelete(id) {
    const society = this.societies.find(s => s.id === id);
    if (!society) return;

    const confirmed = await window.confirmModal?.show({
      title: 'Eliminar microsociedad',
      message: `¿Eliminar "${society.name}"?\n\nEsta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }) ?? confirm(`¿Eliminar "${society.name}"?`);

    if (confirmed) {
      this.deleteSociety(id);
      // Refrescar lista
      const content = this.modal.querySelector('.societies-gallery-content');
      content.innerHTML = this.societies.length === 0 ? this.renderEmptyState() : this.renderSocietiesList();

      if (window.enhancedToast) {
        window.enhancedToast.success('Microsociedad eliminada');
      }
    }
  }
}


// ========================================
// 4. ESTADISTICAS DEL JUGADOR
// ========================================

class FrankensteinStats {
  constructor() {
    this.modal = null;
    this.stats = this.loadStats();
  }

  loadStats() {
    const defaults = {
      totalBeingsCreated: 0,
      totalBeingsValidated: 0,
      totalViableBeings: 0,
      totalSocietiesCreated: 0,
      totalTurnsSimulated: 0,
      totalQuizAnswered: 0,
      correctAnswers: 0,
      piecesUsed: {},
      missionsCompleted: {},
      playTime: 0,
      lastSession: null,
      firstSession: null
    };

    try {
      const saved = localStorage.getItem('frankenstein-stats');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  }

  saveStats() {
    localStorage.setItem('frankenstein-stats', JSON.stringify(this.stats));
  }

  track(event, data = {}) {
    switch (event) {
      case 'being_created':
        this.stats.totalBeingsCreated++;
        break;
      case 'being_validated':
        this.stats.totalBeingsValidated++;
        if (data.viable) this.stats.totalViableBeings++;
        break;
      case 'society_created':
        this.stats.totalSocietiesCreated++;
        break;
      case 'turn_simulated':
        this.stats.totalTurnsSimulated++;
        break;
      case 'quiz_answered':
        this.stats.totalQuizAnswered++;
        if (data.correct) this.stats.correctAnswers++;
        break;
      case 'piece_used':
        const pieceId = data.pieceId || 'unknown';
        this.stats.piecesUsed[pieceId] = (this.stats.piecesUsed[pieceId] || 0) + 1;
        break;
      case 'mission_completed':
        const missionId = data.missionId || 'unknown';
        this.stats.missionsCompleted[missionId] = (this.stats.missionsCompleted[missionId] || 0) + 1;
        break;
      case 'session_start':
        if (!this.stats.firstSession) {
          this.stats.firstSession = Date.now();
        }
        this.stats.lastSession = Date.now();
        break;
    }

    this.saveStats();
  }

  open() {
    this.modal = document.createElement('div');
    this.modal.className = 'stats-modal';
    this.modal.innerHTML = `
      <div class="stats-overlay" onclick="window.frankensteinStats.close()"></div>
      <div class="stats-panel">
        <div class="stats-header">
          <h2>📊 Estadisticas</h2>
          <button class="stats-close" onclick="window.frankensteinStats.close()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="stats-content">
          ${this.renderOverview()}
          ${this.renderCreation()}
          ${this.renderQuiz()}
          ${this.renderSocieties()}
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    requestAnimationFrame(() => {
      this.modal.classList.add('active');
    });
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('closing');
      setTimeout(() => {
        this.modal.remove();
        this.modal = null;
      }, 300);
    }
  }

  renderOverview() {
    const savedBeings = JSON.parse(localStorage.getItem('frankenstein-saved-beings') || '[]').length;
    const savedSocieties = JSON.parse(localStorage.getItem('frankenstein-microsocieties') || '[]').length;

    return `
      <section class="stats-section">
        <h3>Resumen General</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${savedBeings}</div>
            <div class="stat-label">Seres Guardados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${savedSocieties}</div>
            <div class="stat-label">Microsociedades</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.stats.totalBeingsCreated}</div>
            <div class="stat-label">Seres Creados</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.getSuccessRate()}%</div>
            <div class="stat-label">Tasa de Exito</div>
          </div>
        </div>
      </section>
    `;
  }

  renderCreation() {
    return `
      <section class="stats-section">
        <h3>Creacion de Seres</h3>
        <div class="stats-list">
          <div class="stat-row">
            <span>Seres validados</span>
            <span>${this.stats.totalBeingsValidated}</span>
          </div>
          <div class="stat-row">
            <span>Seres viables</span>
            <span>${this.stats.totalViableBeings}</span>
          </div>
          <div class="stat-row">
            <span>Misiones completadas</span>
            <span>${Object.keys(this.stats.missionsCompleted).length}</span>
          </div>
        </div>
      </section>
    `;
  }

  renderQuiz() {
    const accuracy = this.stats.totalQuizAnswered > 0
      ? Math.round((this.stats.correctAnswers / this.stats.totalQuizAnswered) * 100)
      : 0;

    return `
      <section class="stats-section">
        <h3>Quiz y Aprendizaje</h3>
        <div class="stats-list">
          <div class="stat-row">
            <span>Preguntas respondidas</span>
            <span>${this.stats.totalQuizAnswered}</span>
          </div>
          <div class="stat-row">
            <span>Respuestas correctas</span>
            <span>${this.stats.correctAnswers}</span>
          </div>
          <div class="stat-row">
            <span>Precision</span>
            <span class="${accuracy >= 70 ? 'good' : accuracy >= 40 ? 'medium' : 'bad'}">${accuracy}%</span>
          </div>
        </div>
      </section>
    `;
  }

  renderSocieties() {
    return `
      <section class="stats-section">
        <h3>Microsociedades</h3>
        <div class="stats-list">
          <div class="stat-row">
            <span>Sociedades creadas</span>
            <span>${this.stats.totalSocietiesCreated}</span>
          </div>
          <div class="stat-row">
            <span>Turnos simulados</span>
            <span>${this.stats.totalTurnsSimulated}</span>
          </div>
        </div>
      </section>
    `;
  }

  getSuccessRate() {
    if (this.stats.totalBeingsValidated === 0) return 0;
    return Math.round((this.stats.totalViableBeings / this.stats.totalBeingsValidated) * 100);
  }
}


// ========================================
// 5. INICIALIZACION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Settings
  window.frankensteinSettings = new FrankensteinSettings();
  window.frankensteinSettings.applySettings();

  // Header
  window.frankensteinHeader = new FrankensteinHeader();

  // Galeria de microsociedades
  window.microsocietiesGallery = new MicrosocietiesGallery();

  // Stats
  window.frankensteinStats = new FrankensteinStats();
  window.frankensteinStats.track('session_start');

  console.log('✅ Frankenstein Settings & UI initialized');
});

// Exportar globalmente
window.FrankensteinSettings = FrankensteinSettings;
window.FrankensteinHeader = FrankensteinHeader;
window.MicrosocietiesGallery = MicrosocietiesGallery;
window.FrankensteinStats = FrankensteinStats;
