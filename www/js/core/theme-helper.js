// ============================================================================
// THEME HELPER - Sistema de Dark/Light Mode con integración Android
// ============================================================================

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
        accent: '#fbbf24',
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
        accent: '#d97706',
        background: '#f8fafc',
        backgroundSecondary: '#e2e8f0',
        text: '#1e293b',
        textSecondary: '#475569',
        border: '#cbd5e1',
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
    // Cargar preferencia guardada
    const savedTheme = localStorage.getItem('theme-preference') || 'system';
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

    // Marcar el tema en el body
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);

    // Actualizar meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.background);
    }

    // Actualizar status bar en Android
    this.updateStatusBar(colors);

    // Emitir evento
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme, colors }
    }));
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
      console.warn('Error updating status bar:', error);
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
    switch (this.currentTheme) {
      case 'dark': return '🌙';
      case 'light': return '☀️';
      case 'system': return '🔄';
      default: return '🌙';
    }
  }

  getThemeLabel() {
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
