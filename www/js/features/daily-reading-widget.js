// ============================================================================
// DAILY READING WIDGET - Widget de Lectura Diaria
// ============================================================================
// v2.9.369: Fragmento aleatorio del día con recordatorios
// ============================================================================

class DailyReadingWidget {
  constructor() {
    this.i18n = window.i18n || { t: (key) => key };
    this.todayFragment = null;
    this.fragmentCache = this.loadFragmentCache();
    this.reminderTime = localStorage.getItem('daily-reading-reminder') || null;

    // Verificar si hay recordatorio programado
    this.checkReminder();
  }

  // ==========================================================================
  // GESTIÓN DE FRAGMENTOS
  // ==========================================================================

  loadFragmentCache() {
    try {
      return JSON.parse(localStorage.getItem('daily-fragment-cache') || '{}');
    } catch {
      return {};
    }
  }

  saveFragmentCache() {
    try {
      localStorage.setItem('daily-fragment-cache', JSON.stringify(this.fragmentCache));
    } catch (error) {
      logger.error('Error guardando caché de fragmentos:', error);
    }
  }

  getTodayKey() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  async getTodayFragment() {
    const todayKey = this.getTodayKey();

    // Si ya tenemos el fragmento de hoy en caché, usarlo
    if (this.fragmentCache[todayKey]) {
      this.todayFragment = this.fragmentCache[todayKey];
      return this.todayFragment;
    }

    // Generar nuevo fragmento aleatorio
    try {
      const fragment = await this.generateRandomFragment();
      if (fragment) {
        // Guardar en caché
        this.fragmentCache = { [todayKey]: fragment }; // Solo mantener el de hoy
        this.saveFragmentCache();
        this.todayFragment = fragment;
      }
      return fragment;
    } catch (error) {
      logger.error('Error generando fragmento del día:', error);
      return null;
    }
  }

  async generateRandomFragment() {
    try {
      // Cargar catálogo de libros
      const response = await fetch('books/catalog.json');
      if (!response.ok) throw new Error('No se pudo cargar el catálogo');
      const catalog = await response.json();

      // Filtrar libros publicados
      const publishedBooks = catalog.books.filter(b => b.status === 'published');
      if (publishedBooks.length === 0) return null;

      // Seleccionar libro aleatorio
      const randomBook = publishedBooks[Math.floor(Math.random() * publishedBooks.length)];

      // Cargar datos del libro
      const bookResponse = await fetch(`books/${randomBook.id}/book.json`);
      if (!bookResponse.ok) throw new Error(`No se pudo cargar ${randomBook.id}`);
      const bookData = await bookResponse.json();

      // Recopilar todos los capítulos con contenido
      const chapters = [];
      for (const section of bookData.sections || []) {
        for (const chapter of section.chapters || []) {
          if (chapter.content && chapter.content.length > 200) {
            chapters.push({
              ...chapter,
              sectionTitle: section.title,
              bookId: randomBook.id,
              bookTitle: randomBook.title
            });
          }
        }
      }

      if (chapters.length === 0) return null;

      // Seleccionar capítulo aleatorio
      const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];

      // Extraer fragmento significativo (buscar párrafo completo)
      const paragraphs = randomChapter.content
        .split(/\n\n+/)
        .filter(p => p.length > 100 && p.length < 500)
        .filter(p => !p.startsWith('#')); // Excluir encabezados

      if (paragraphs.length === 0) {
        // Fallback: tomar los primeros 300 caracteres
        return {
          text: randomChapter.content.substring(0, 300) + '...',
          bookId: randomChapter.bookId,
          bookTitle: randomChapter.bookTitle,
          chapterId: randomChapter.id,
          chapterTitle: randomChapter.title,
          sectionTitle: randomChapter.sectionTitle
        };
      }

      const randomParagraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];

      return {
        text: randomParagraph.trim(),
        bookId: randomChapter.bookId,
        bookTitle: randomChapter.bookTitle,
        chapterId: randomChapter.id,
        chapterTitle: randomChapter.title,
        sectionTitle: randomChapter.sectionTitle
      };
    } catch (error) {
      logger.error('Error generando fragmento aleatorio:', error);
      return null;
    }
  }

  // ==========================================================================
  // RECORDATORIOS
  // ==========================================================================

  setReminder(time) {
    this.reminderTime = time;
    localStorage.setItem('daily-reading-reminder', time);
    this.scheduleReminder();
    window.toast?.success(`Recordatorio configurado para las ${time}`);
  }

  removeReminder() {
    this.reminderTime = null;
    localStorage.removeItem('daily-reading-reminder');
    window.toast?.info('Recordatorio eliminado');
  }

  checkReminder() {
    if (!this.reminderTime) return;

    // Verificar cada minuto si es hora del recordatorio
    setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentTime === this.reminderTime) {
        this.showReminderNotification();
      }
    }, 60000);
  }

  scheduleReminder() {
    // La verificación se hace en checkReminder() con setInterval
  }

  async showReminderNotification() {
    // Toast notification
    window.toast?.info('Es hora de tu lectura diaria', { duration: 10000 });

    // Browser notification si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      const fragment = await this.getTodayFragment();
      new Notification('Lectura del día', {
        body: fragment ? fragment.text.substring(0, 100) + '...' : 'Es hora de tu lectura diaria',
        icon: 'assets/icons/icon-192x192.png',
        tag: 'daily-reading'
      });
    }
  }

  // ==========================================================================
  // UI - MODAL
  // ==========================================================================

  async show() {
    const fragment = await this.getTodayFragment();

    if (!fragment) {
      window.toast?.error('No se pudo cargar el fragmento del día');
      return;
    }

    this.renderModal(fragment);
    this.attachEventListeners();
  }

  renderModal(fragment) {
    // Eliminar modal existente
    document.getElementById('daily-reading-modal')?.remove();

    const today = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const modal = document.createElement('div');
    modal.id = 'daily-reading-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';
    modal.innerHTML = `
      <div class="bg-gradient-to-br from-amber-900/95 to-orange-900/95 rounded-2xl max-w-2xl w-full border border-amber-500/30 shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-amber-800/50 px-6 py-4 border-b border-amber-500/30">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-amber-200 flex items-center gap-2">
                <span class="text-2xl">📖</span> Lectura del Día
              </h2>
              <p class="text-sm text-amber-300/70 mt-1 capitalize">${today}</p>
            </div>
            <button id="close-daily-reading" class="text-amber-300 hover:text-white p-2 hover:bg-amber-700/50 rounded-lg transition">
              ${Icons.close(24)}
            </button>
          </div>
        </div>

        <!-- Fragment -->
        <div class="p-6">
          <blockquote class="text-lg text-amber-100 leading-relaxed italic mb-6 relative">
            <span class="absolute -top-2 -left-2 text-4xl text-amber-500/30">"</span>
            <p class="pl-6">${this.escapeHtml(fragment.text)}</p>
            <span class="absolute -bottom-4 right-0 text-4xl text-amber-500/30">"</span>
          </blockquote>

          <!-- Source -->
          <div class="text-sm text-amber-300/80 border-t border-amber-500/30 pt-4 mt-6">
            <p class="font-semibold">${this.escapeHtml(fragment.bookTitle)}</p>
            <p class="text-amber-400/60">${this.escapeHtml(fragment.sectionTitle)} › ${this.escapeHtml(fragment.chapterTitle)}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button id="read-full-chapter"
                  data-book-id="${fragment.bookId}"
                  data-chapter-id="${fragment.chapterId}"
                  class="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold transition flex items-center justify-center gap-2">
            ${Icons.book(18)} Leer capítulo completo
          </button>
          <button id="share-daily-fragment" class="px-4 py-3 bg-amber-800/50 hover:bg-amber-700/50 border border-amber-500/30 rounded-xl font-semibold transition flex items-center justify-center gap-2">
            ${Icons.share(18)} Compartir
          </button>
          <button id="set-daily-reminder" class="px-4 py-3 bg-amber-800/50 hover:bg-amber-700/50 border border-amber-500/30 rounded-xl font-semibold transition flex items-center justify-center gap-2">
            ${Icons.bell(18)} ${this.reminderTime ? 'Cambiar recordatorio' : 'Recordatorio'}
          </button>
        </div>

        ${this.reminderTime ? `
          <div class="px-6 pb-4">
            <div class="flex items-center justify-between text-sm text-amber-400/70 bg-amber-950/50 rounded-lg px-4 py-2">
              <span>Recordatorio activo: ${this.reminderTime}</span>
              <button id="remove-daily-reminder" class="text-red-400 hover:text-red-300">Eliminar</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(modal);

    // Animación de entrada
    setTimeout(() => {
      modal.querySelector(':scope > div').classList.add('animate-scale-in');
    }, 10);
  }

  attachEventListeners() {
    // Cerrar
    document.getElementById('close-daily-reading')?.addEventListener('click', () => this.close());

    // Click fuera
    document.getElementById('daily-reading-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'daily-reading-modal') this.close();
    });

    // ESC
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.escHandler);

    // Leer capítulo completo
    document.getElementById('read-full-chapter')?.addEventListener('click', (e) => {
      const bookId = e.currentTarget.dataset.bookId;
      const chapterId = e.currentTarget.dataset.chapterId;
      this.close();
      if (window.openBook) {
        window.openBook(bookId, chapterId);
      }
    });

    // Compartir
    document.getElementById('share-daily-fragment')?.addEventListener('click', () => {
      this.shareFragment();
    });

    // Configurar recordatorio
    document.getElementById('set-daily-reminder')?.addEventListener('click', () => {
      this.showReminderModal();
    });

    // Eliminar recordatorio
    document.getElementById('remove-daily-reminder')?.addEventListener('click', () => {
      this.removeReminder();
      this.show(); // Re-render
    });
  }

  close() {
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }
    const modal = document.getElementById('daily-reading-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ==========================================================================
  // COMPARTIR
  // ==========================================================================

  async shareFragment() {
    if (!this.todayFragment) return;

    const shareText = `"${this.todayFragment.text}"\n\n— ${this.todayFragment.bookTitle}\n\nColección Nuevo Ser`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lectura del día',
          text: shareText
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.copyToClipboard(shareText);
        }
      }
    } else {
      this.copyToClipboard(shareText);
    }
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      window.toast?.success('Copiado al portapapeles');
    }).catch(() => {
      window.toast?.error('Error al copiar');
    });
  }

  // ==========================================================================
  // MODAL DE RECORDATORIO
  // ==========================================================================

  showReminderModal() {
    const reminderModal = document.createElement('div');
    reminderModal.id = 'reminder-config-modal';
    reminderModal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[10001] p-4';
    reminderModal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
        <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          ${Icons.bell(20)} Recordatorio diario
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Elige a qué hora quieres recibir tu recordatorio de lectura diaria.
        </p>
        <input type="time"
               id="reminder-time-input"
               value="${this.reminderTime || '09:00'}"
               class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4">
        <div class="flex gap-3">
          <button id="cancel-reminder-config" class="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition">
            Cancelar
          </button>
          <button id="save-reminder-config" class="flex-1 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition">
            Guardar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(reminderModal);

    // Event listeners
    document.getElementById('cancel-reminder-config')?.addEventListener('click', () => {
      reminderModal.remove();
    });

    document.getElementById('save-reminder-config')?.addEventListener('click', () => {
      const time = document.getElementById('reminder-time-input').value;
      if (time) {
        this.setReminder(time);
        reminderModal.remove();
        this.show(); // Re-render main modal
      }
    });

    reminderModal.addEventListener('click', (e) => {
      if (e.target === reminderModal) reminderModal.remove();
    });

    // Solicitar permiso de notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.DailyReadingWidget = DailyReadingWidget;

// Crear instancia global
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.dailyReadingWidget = new DailyReadingWidget();
  });
} else {
  window.dailyReadingWidget = new DailyReadingWidget();
}
