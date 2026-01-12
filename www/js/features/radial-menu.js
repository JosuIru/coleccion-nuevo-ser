// ============================================================================
// RADIAL MENU - Menú circular contextual con acciones rápidas
// ============================================================================
// v2.9.355: Fix acciones - audio (play/pause/resume), navegación, tamaño fuente
// v2.9.354: Nuevo componente de acceso rápido
// Menú circular que aparece con long-press (móvil) o click derecho (desktop)

class RadialMenu {
  constructor() {
    this.isOpen = false;
    this.centerX = 0;
    this.centerY = 0;
    this.highlightedIndex = -1;

    // Long press detection
    this.longPressTimeout = null;
    this.longPressDelay = 400; // ms
    this.touchStartPos = { x: 0, y: 0 };

    // EventManager para cleanup automático
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('RadialMenu');

    // i18n
    this.i18n = window.i18n || { t: (key) => key };

    // Radio del menú
    this.radius = 80;

    // Opciones del menú radial (6 opciones)
    this.options = [
      {
        id: 'ai-chat',
        icon: 'bot',
        label: 'Chat IA',
        angle: 270, // arriba (12 o'clock)
        action: () => window.aiChatModal?.open()
      },
      {
        id: 'audio',
        icon: 'headphones',
        label: 'Audio',
        angle: 330, // arriba-derecha
        action: () => this.toggleAudio()
      },
      {
        id: 'next',
        icon: 'chevron-right',
        label: 'Siguiente',
        angle: 30, // derecha-abajo
        action: () => this.navigateNext()
      },
      {
        id: 'font-plus',
        icon: 'plus',
        label: 'Fuente +',
        angle: 90, // abajo (6 o'clock)
        action: () => this.increaseFontSize()
      },
      {
        id: 'font-minus',
        icon: 'minus',
        label: 'Fuente −',
        angle: 150, // abajo-izquierda
        action: () => this.decreaseFontSize()
      },
      {
        id: 'prev',
        icon: 'chevron-left',
        label: 'Anterior',
        angle: 210, // izquierda-arriba
        action: () => this.navigatePrev()
      }
    ];
  }

  // ==========================================================================
  // ATTACH TO CONTENT
  // ==========================================================================

  attachToContent() {
    const contentArea = document.querySelector('.chapter-content');
    if (!contentArea) {
      console.log('[RadialMenu] No chapter-content found, will retry later');
      return;
    }

    // Long press para móvil
    this.eventManager.addEventListener(contentArea, 'touchstart', (e) => {
      // Solo un dedo
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };

      this.longPressTimeout = setTimeout(() => {
        // Vibración háptica si está disponible
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
        this.open(touch.clientX, touch.clientY);
      }, this.longPressDelay);
    });

    this.eventManager.addEventListener(contentArea, 'touchmove', (e) => {
      if (this.isOpen) {
        // Si el menú está abierto, mover resalta opciones
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMove(touch.clientX, touch.clientY);
      } else {
        // Si se mueve mucho antes del long-press, cancelar
        const touch = e.touches[0];
        const dx = touch.clientX - this.touchStartPos.x;
        const dy = touch.clientY - this.touchStartPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          this.cancelLongPress();
        }
      }
    });

    this.eventManager.addEventListener(contentArea, 'touchend', (e) => {
      this.cancelLongPress();
      if (this.isOpen) {
        e.preventDefault();
        this.executeHighlighted();
      }
    });

    this.eventManager.addEventListener(contentArea, 'touchcancel', () => {
      this.cancelLongPress();
      this.close();
    });

    // Click derecho para desktop
    this.eventManager.addEventListener(contentArea, 'contextmenu', (e) => {
      e.preventDefault();
      this.open(e.clientX, e.clientY);
    });

    console.log('[RadialMenu] Attached to chapter-content');
  }

  cancelLongPress() {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  // ==========================================================================
  // OPEN / CLOSE
  // ==========================================================================

  open(x, y) {
    if (this.isOpen) return;

    // Ajustar posición si está muy cerca de los bordes
    const padding = this.radius + 60;
    this.centerX = Math.max(padding, Math.min(window.innerWidth - padding, x));
    this.centerY = Math.max(padding, Math.min(window.innerHeight - padding, y));

    this.isOpen = true;
    this.highlightedIndex = -1;
    this.render();
    this.attachMenuListeners();
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.highlightedIndex = -1;

    const menu = document.getElementById('radial-menu');
    if (menu) {
      menu.classList.remove('open');
      setTimeout(() => menu.remove(), 200);
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  render() {
    // Remover existente si hay
    const existing = document.getElementById('radial-menu');
    if (existing) existing.remove();

    const html = `
      <div id="radial-menu"
           class="fixed inset-0 z-[9500] open"
           role="menu"
           aria-label="Menú de acciones rápidas">

        <!-- Centro indicador -->
        <div class="radial-center absolute"
             style="left: ${this.centerX}px; top: ${this.centerY}px;">
        </div>

        <!-- Opciones -->
        <div class="radial-options">
          ${this.renderOptions()}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  renderOptions() {
    return this.options.map((option, index) => {
      // Calcular posición basada en ángulo
      const angleRad = (option.angle * Math.PI) / 180;
      const x = this.centerX + this.radius * Math.cos(angleRad);
      const y = this.centerY + this.radius * Math.sin(angleRad);

      // Determinar posición del label
      const position = this.getLabelPosition(option.angle);

      return `
        <button class="radial-option"
                data-option-index="${index}"
                data-position="${position}"
                style="left: ${x}px; top: ${y}px;"
                aria-label="${option.label}"
                role="menuitem">
          <span class="radial-label">${option.label}</span>
          ${this.getIcon(option.icon)}
        </button>
      `;
    }).join('');
  }

  getLabelPosition(angle) {
    // Normalizar ángulo a 0-360
    angle = ((angle % 360) + 360) % 360;

    if (angle >= 337.5 || angle < 22.5) return 'right';
    if (angle >= 22.5 && angle < 67.5) return 'bottom-right';
    if (angle >= 67.5 && angle < 112.5) return 'bottom';
    if (angle >= 112.5 && angle < 157.5) return 'bottom-left';
    if (angle >= 157.5 && angle < 202.5) return 'left';
    if (angle >= 202.5 && angle < 247.5) return 'top-left';
    if (angle >= 247.5 && angle < 292.5) return 'top';
    return 'top-right';
  }

  getIcon(iconName) {
    const Icons = window.Icons;
    if (Icons && Icons[iconName]) {
      return Icons[iconName](20);
    }

    // Fallback SVG icons
    const icons = {
      'bot': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></svg>',
      'headphones': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      'chevron-left': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
      'chevron-right': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
      'plus': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
      'minus': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>'
    };

    return icons[iconName] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachMenuListeners() {
    const menu = document.getElementById('radial-menu');
    if (!menu) return;

    // Click en opción
    this.eventManager.addEventListener(menu, 'click', (e) => {
      const optionBtn = e.target.closest('.radial-option');
      if (optionBtn) {
        const index = parseInt(optionBtn.dataset.optionIndex);
        this.executeOption(index);
      } else {
        // Click fuera de las opciones cierra
        this.close();
      }
    });

    // Mouse move para highlight en desktop
    this.eventManager.addEventListener(menu, 'mousemove', (e) => {
      this.handleMove(e.clientX, e.clientY);
    });

    // Escape cierra
    this.eventManager.addEventListener(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  handleMove(x, y) {
    if (!this.isOpen) return;

    // Calcular distancia y ángulo desde el centro
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Si está muy cerca del centro, no resaltar nada
    if (distance < 30) {
      this.setHighlighted(-1);
      return;
    }

    // Calcular ángulo en grados
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = ((angle % 360) + 360) % 360;

    // Encontrar la opción más cercana
    let closestIndex = -1;
    let closestDiff = 360;

    this.options.forEach((option, index) => {
      let diff = Math.abs(angle - option.angle);
      if (diff > 180) diff = 360 - diff;

      if (diff < closestDiff && diff < 45) {
        closestDiff = diff;
        closestIndex = index;
      }
    });

    this.setHighlighted(closestIndex);
  }

  setHighlighted(index) {
    if (this.highlightedIndex === index) return;

    this.highlightedIndex = index;

    // Actualizar clases visuales
    const options = document.querySelectorAll('.radial-option');
    options.forEach((opt, i) => {
      opt.classList.toggle('highlighted', i === index);
    });

    // Vibración sutil al cambiar de opción
    if (index >= 0 && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  // ==========================================================================
  // EXECUTE
  // ==========================================================================

  executeHighlighted() {
    if (this.highlightedIndex >= 0) {
      this.executeOption(this.highlightedIndex);
    } else {
      this.close();
    }
  }

  executeOption(index) {
    const option = this.options[index];
    if (option && option.action) {
      this.close();

      setTimeout(() => {
        try {
          option.action();
        } catch (error) {
          console.error('[RadialMenu] Error ejecutando acción:', option.id, error);
        }
      }, 100);
    }
  }

  // ==========================================================================
  // ACCIONES HELPERS
  // ==========================================================================

  toggleAudio() {
    const audioReader = window.audioReader || window.dependencyInjector?.getSafe('audioReader');
    if (audioReader) {
      if (audioReader.isPlaying && !audioReader.isPaused) {
        audioReader.pause();
        this.showToast('Audio pausado');
      } else if (audioReader.isPaused) {
        audioReader.resume();
        this.showToast('Reproduciendo audio');
      } else {
        audioReader.play();
        this.showToast('Reproduciendo audio');
      }
    } else {
      this.showToast('Audio no disponible');
    }
  }

  navigateNext() {
    const bookReader = window.bookReader;
    const bookEngine = bookReader?.bookEngine || window.bookEngine;
    if (bookReader && bookEngine) {
      const currentChapterId = bookReader.currentChapter?.id;
      const nextChapter = bookEngine.getNextChapter(currentChapterId);
      if (nextChapter) {
        bookReader.navigateToChapter(nextChapter.id);
      } else {
        this.showToast('Ya estás en el último capítulo');
      }
    }
  }

  navigatePrev() {
    const bookReader = window.bookReader;
    const bookEngine = bookReader?.bookEngine || window.bookEngine;
    if (bookReader && bookEngine) {
      const currentChapterId = bookReader.currentChapter?.id;
      const prevChapter = bookEngine.getPreviousChapter(currentChapterId);
      if (prevChapter) {
        bookReader.navigateToChapter(prevChapter.id);
      } else {
        this.showToast('Ya estás en el primer capítulo');
      }
    }
  }

  increaseFontSize() {
    const savedSize = localStorage.getItem('font-size');
    const currentSize = savedSize ? parseInt(savedSize) : 16;
    const newSize = Math.min(currentSize + 2, 24);

    localStorage.setItem('font-size', newSize);

    // Aplicar al contenido
    const chapterContent = document.querySelector('.chapter-content');
    if (chapterContent) {
      chapterContent.style.fontSize = `${newSize}px`;
    }

    this.showToast(`Fuente: ${newSize}px`);
  }

  decreaseFontSize() {
    const savedSize = localStorage.getItem('font-size');
    const currentSize = savedSize ? parseInt(savedSize) : 16;
    const newSize = Math.max(currentSize - 2, 12);

    localStorage.setItem('font-size', newSize);

    // Aplicar al contenido
    const chapterContent = document.querySelector('.chapter-content');
    if (chapterContent) {
      chapterContent.style.fontSize = `${newSize}px`;
    }

    this.showToast(`Fuente: ${newSize}px`);
  }

  showToast(message) {
    const toast = window.toast || window.dependencyInjector?.getSafe('toast');
    if (toast?.show) {
      toast.show(message);
    } else {
      console.log('[RadialMenu]', message);
    }
  }

  // ==========================================================================
  // DETACH / CLEANUP
  // ==========================================================================

  detach() {
    this.eventManager.cleanup();
    this.close();
  }

  destroy() {
    this.detach();
  }
}

// Exportar como global
window.RadialMenu = RadialMenu;

// No inicializar en APK (Capacitor/Cordova) - problemas con long-press en móvil
const isNativeApp = window.Capacitor?.isNativePlatform?.() ||
                    window.cordova ||
                    document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;

if (!isNativeApp) {
  window.radialMenu = new RadialMenu();
} else {
  console.log('[RadialMenu] Deshabilitado en app nativa');
  window.radialMenu = null;
}
