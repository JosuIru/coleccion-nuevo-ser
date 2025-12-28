// ============================================================================
// THEME HELPER - Sistema de Dark/Light Mode con integración Android
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class ThemeHelper {
  constructor() {
    this.currentTheme = 'dark'; // dark | light | system
    this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

    // Colores del tema
    this.themes = {
      dark: {
        primary: '#0ea5e9',
        secondary: '#a855f7',
        accent: '#d4a000', // Corregido de #fbbf24 para cumplir WCAG AA (ratio 4.8:1)
        background: '#0f172a',
        backgroundSecondary: '#1e293b',
        text: '#e2e8f0',
        textSecondary: '#cbd5e1',
        border: '#334155',
        statusBarColor: '#0f172a',
        statusBarStyle: 'light'
      },
      light: {
        primary: '#0284c7',
        secondary: '#9333ea',
        accent: '#985304', // Corregido de #d97706 para cumplir WCAG AA (ratio 4.77:1)
        background: '#f8fafc',
        backgroundSecondary: '#e2e8f0',
        text: '#1e293b',
        textSecondary: '#475569',
        border: '#848a92', // Corregido de #cbd5e1 para cumplir WCAG AA (ratio 3.33:1)
        statusBarColor: '#f8fafc',
        statusBarStyle: 'dark'
      }
    };

    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  init() {
    // Cargar preferencia guardada - por defecto 'dark' para evitar problemas de contraste
    const savedTheme = localStorage.getItem('theme-preference') || 'dark';
    this.setTheme(savedTheme, false);

    // Escuchar cambios del sistema
    this.systemPrefersDark.addEventListener('change', (e) => {
      if (this.currentTheme === 'system') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Exponer globalmente
    window.themeHelper = this;
  }

  // ==========================================================================
  // GESTIÓN DEL TEMA
  // ==========================================================================

  setTheme(theme, save = true) {
    this.currentTheme = theme;

    if (save) {
      localStorage.setItem('theme-preference', theme);

      // 🔧 FIX #99: Usar SyncManager para sincronización robusta
      if (window.syncManager) {
        window.syncManager.sync('settings', { keys: ['theme-preference'] }, { showSuccessToast: false }).catch(err => {
          console.error('Error sincronizando tema a la nube:', err);
        });
      } else if (window.supabaseSyncHelper?.isAuthenticated?.()) {
        // Fallback al método antiguo
        window.supabaseSyncHelper.syncSettingsToCloud(['theme-preference']).catch(err => {
          console.error('Error sincronizando tema a la nube:', err);
        });
      }
    }

    // Determinar qué tema visual aplicar
    let visualTheme;
    if (theme === 'system') {
      visualTheme = this.systemPrefersDark.matches ? 'dark' : 'light';
    } else {
      visualTheme = theme;
    }

    this.applyTheme(visualTheme);
  }

  applyTheme(theme) {
    const colors = this.themes[theme];
    if (!colors) return;

    // Aplicar variables CSS
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);

    // Marcar el tema en el body (para CSS custom)
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);

    // Añadir/quitar clase 'dark' para compatibilidad con Tailwind CSS dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    // Las clases de libro específico (theme-codigo-despertar, etc.) se preservan

    // Actualizar meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.background);
    }

    // Actualizar status bar en Android
    this.updateStatusBar(colors);

    // Actualizar botones de toggle
    this.updateToggleButtons();

    // Emitir evento
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme, colors }
    }));
  }

  /**
   * Aplica el tema específico de un libro (con texturas y efectos visuales únicos)
   * @param {Object} bookConfig - Configuración del libro con { id: 'codigo-despertar', ... }
   */
  applyBookTheme(bookConfig) {
    if (!bookConfig || !bookConfig.id) {
      // console.warn('No book config provided to applyBookTheme');
      return;
    }

    // Remover todas las clases de temas de libros anteriores
    const bookThemeClasses = Array.from(document.body.classList)
      .filter(cls => cls.startsWith('theme-') && !cls.match(/^theme-(dark|light)$/));

    bookThemeClasses.forEach(cls => document.body.classList.remove(cls));

    // Añadir la clase específica del libro actual
    const bookThemeClass = `theme-${bookConfig.id}`;
    document.body.classList.add(bookThemeClass);

    // logger.debug(`✨ Applied book theme: ${bookThemeClass}`);
  }

  /**
   * Remueve el tema específico del libro (volver a vista de biblioteca)
   */
  removeBookTheme() {
    const bookThemeClasses = Array.from(document.body.classList)
      .filter(cls => cls.startsWith('theme-') && !cls.match(/^theme-(dark|light)$/));

    bookThemeClasses.forEach(cls => document.body.classList.remove(cls));
  }

  updateToggleButtons() {
    // Actualizar iconos y labels de todos los botones de toggle
    const icon = this.getThemeIcon();
    const label = this.getThemeLabel();

    // Actualizar botón de biblioteca (toolbar)
    const themeIconBib = document.getElementById('theme-icon-bib');
    if (themeIconBib) {
      themeIconBib.innerHTML = icon;
    }
    const themeLabelBib = document.getElementById('theme-label-bib');
    if (themeLabelBib) {
      themeLabelBib.textContent = label;
    }

    // Actualizar botón de menú en biblioteca
    const themeIconMenu = document.getElementById('theme-icon-menu');
    if (themeIconMenu) {
      themeIconMenu.innerHTML = icon;
    }
    const themeLabelMenu = document.getElementById('theme-label-menu');
    if (themeLabelMenu) {
      themeLabelMenu.textContent = label;
    }

    // Actualizar botón de dropdown en book-reader
    const themeIconDropdown = document.getElementById('theme-icon-dropdown');
    if (themeIconDropdown) {
      themeIconDropdown.innerHTML = icon;
    }
    const themeLabelDropdown = document.getElementById('theme-label-dropdown');
    if (themeLabelDropdown) {
      themeLabelDropdown.textContent = label;
    }

    // Actualizar botón normal en book-reader
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.innerHTML = icon;
    }
    const themeLabel = document.getElementById('theme-label');
    if (themeLabel) {
      themeLabel.textContent = label;
    }

    // Actualizar botón mobile
    const themeIconMobile = document.querySelector('#theme-toggle-btn-mobile span:first-child');
    if (themeIconMobile) {
      themeIconMobile.innerHTML = icon;
    }
    const themeLabelMobile = document.querySelector('#theme-toggle-btn-mobile span:last-child');
    if (themeLabelMobile) {
      themeLabelMobile.textContent = label;
    }
  }

  // ==========================================================================
  // INTEGRACIÓN ANDROID (Capacitor)
  // ==========================================================================

  async updateStatusBar(colors) {
    if (!this.isCapacitor) return;

    try {
      // Usar Capacitor Status Bar plugin si está disponible
      if (window.Capacitor?.Plugins?.StatusBar) {
        const { StatusBar } = window.Capacitor.Plugins;

        // Establecer color de fondo
        await StatusBar.setBackgroundColor({ color: colors.statusBarColor });

        // Establecer estilo (iconos claros u oscuros)
        if (colors.statusBarStyle === 'light') {
          await StatusBar.setStyle({ style: 'LIGHT' });
        } else {
          await StatusBar.setStyle({ style: 'DARK' });
        }
      }

      // Navigation bar (Android)
      if (window.Capacitor?.Plugins?.NavigationBar) {
        const { NavigationBar } = window.Capacitor.Plugins;
        await NavigationBar.setColor({
          color: colors.background,
          darkButtons: colors.statusBarStyle === 'dark'
        });
      }
    } catch (error) {
      // console.warn('Error updating status bar:', error);
    }
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================

  toggle() {
    const themes = ['dark', 'light', 'system'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
    return themes[nextIndex];
  }

  toggleDarkLight() {
    // Simple toggle entre dark y light
    const isDark = this.isDark();
    this.setTheme(isDark ? 'light' : 'dark');
  }

  isDark() {
    if (this.currentTheme === 'system') {
      return this.systemPrefersDark.matches;
    }
    return this.currentTheme === 'dark';
  }

  getTheme() {
    return this.currentTheme;
  }

  getActiveTheme() {
    if (this.currentTheme === 'system') {
      return this.systemPrefersDark.matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  getThemeColors() {
    return this.themes[this.getActiveTheme()];
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================

  getThemeIcon() {
    // Mostrar la PREFERENCIA guardada (dark/light/system), no solo el tema aplicado
    return this.getThemePreferenceIcon();
  }

  getThemeLabel() {
    // Mostrar la PREFERENCIA guardada (Oscuro/Claro/Automático)
    return this.getThemePreferenceLabel();
  }

  getThemePreferenceIcon() {
    // Para el selector de preferencias, mostrar la preferencia guardada
    switch (this.currentTheme) {
      case 'dark': return Icons.moon(20);
      case 'light': return Icons.sun(20);
      case 'system': return Icons.monitor(20);
      default: return Icons.moon(20);
    }
  }

  getThemePreferenceLabel() {
    // Para el selector de preferencias, mostrar la preferencia guardada
    switch (this.currentTheme) {
      case 'dark': return 'Modo Oscuro';
      case 'light': return 'Modo Claro';
      case 'system': return 'Automático';
      default: return 'Modo Oscuro';
    }
  }

  // Renderizar selector de tema para modales/settings
  renderThemeSelector() {
    return `
      <div class="theme-selector">
        <label class="block text-sm font-semibold mb-2">Tema de la App</label>
        <div class="flex gap-2">
          <button
            onclick="themeHelper.setTheme('dark')"
            class="flex-1 px-4 py-3 rounded-xl border transition flex flex-col items-center gap-1
                   ${this.currentTheme === 'dark'
                     ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                     : 'border-gray-600 hover:border-gray-500'}">
            <span class="text-2xl">🌙</span>
            <span class="text-xs">Oscuro</span>
          </button>
          <button
            onclick="themeHelper.setTheme('light')"
            class="flex-1 px-4 py-3 rounded-xl border transition flex flex-col items-center gap-1
                   ${this.currentTheme === 'light'
                     ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                     : 'border-gray-600 hover:border-gray-500'}">
            <span class="text-2xl">☀️</span>
            <span class="text-xs">Claro</span>
          </button>
          <button
            onclick="themeHelper.setTheme('system')"
            class="flex-1 px-4 py-3 rounded-xl border transition flex flex-col items-center gap-1
                   ${this.currentTheme === 'system'
                     ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                     : 'border-gray-600 hover:border-gray-500'}">
            <span class="text-2xl">🔄</span>
            <span class="text-xs">Auto</span>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          ${this.currentTheme === 'system'
            ? `Siguiendo el tema del sistema (${this.systemPrefersDark.matches ? 'oscuro' : 'claro'})`
            : ''}
        </p>
      </div>
    `;
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

// Crear instancia cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ThemeHelper());
} else {
  new ThemeHelper();
}

// Exportar
window.ThemeHelper = ThemeHelper;
