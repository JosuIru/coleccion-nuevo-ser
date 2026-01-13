// ============================================================================
// BIBLIOTECA MODALS - Modales inline de la biblioteca
// ============================================================================
// Módulo extraído de biblioteca.js para mejor organización

/**
 * Clase para gestionar los modales de la biblioteca
 */
class BibliotecaModals {
  constructor(biblioteca) {
    this.biblioteca = biblioteca;
  }

  /**
   * Crea una función de cleanup para un modal
   * @param {HTMLElement} modal - El elemento modal
   * @param {Function} escapeHandler - Handler del evento ESC
   * @returns {Function} Función de cleanup
   */
  createCleanup(modal, escapeHandler) {
    const bib = this.biblioteca;
    return () => {
      if (escapeHandler) {
        bib.eventManager.removeEventListener(document, 'keydown', escapeHandler);
      }
      modal.remove();
    };
  }

  /**
   * Crea un handler para la tecla ESC
   * @param {Function} cleanupFn - Función de cleanup a ejecutar
   * @returns {Function} Handler del evento
   */
  createEscapeHandler(cleanupFn) {
    return (e) => {
      if (e.key === 'Escape') {
        cleanupFn();
      }
    };
  }

  // ==========================================================================
  // MODAL: LOGIN REQUIRED
  // ==========================================================================

  /**
   * Muestra modal de login requerido
   * @param {string} feature - Nombre de la funcionalidad que requiere login
   */
  showLoginRequiredModal(feature) {
    const existente = document.getElementById('login-required-modal');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.id = 'login-required-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    let cleanupModal;
    const escapeHandler = this.createEscapeHandler(() => cleanupModal());
    cleanupModal = this.createCleanup(modal, escapeHandler);

    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="login-required-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10">
        <div class="text-center">
          <div class="text-5xl mb-4">🔐</div>
          <h3 class="text-xl font-bold text-white mb-2">Inicio de sesión requerido</h3>
          <p class="text-slate-400 mb-6">
            Para acceder a <strong class="text-amber-400">${feature}</strong>, necesitas iniciar sesión o crear una cuenta.
          </p>
          <div class="flex gap-3 justify-center">
            <button id="login-required-login-btn"
                    class="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all">
              Iniciar sesión
            </button>
            <button id="login-required-cancel-btn"
                    class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const bib = this.biblioteca;
    bib.eventManager.addEventListener(document.getElementById('login-required-backdrop'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document.getElementById('login-required-login-btn'), 'click', async () => {
      cleanupModal();
      if (window.lazyLoader && !window.lazyLoader.isLoaded('auth-modal')) {
        await window.lazyLoader.loadAuthModal();
      }
      if (window.authModal) window.authModal.show();
    });
    bib.eventManager.addEventListener(document.getElementById('login-required-cancel-btn'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document, 'keydown', escapeHandler);
  }

  // ==========================================================================
  // MODAL: ACCESS DENIED
  // ==========================================================================

  /**
   * Muestra modal de acceso denegado
   */
  showAccessDeniedModal() {
    const existente = document.getElementById('access-denied-modal');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.id = 'access-denied-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    let cleanupModal;
    const escapeHandler = this.createEscapeHandler(() => cleanupModal());
    cleanupModal = this.createCleanup(modal, escapeHandler);

    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="access-denied-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-500/30">
        <div class="text-center">
          <div class="text-5xl mb-4">🚫</div>
          <h3 class="text-xl font-bold text-red-400 mb-2">Acceso denegado</h3>
          <p class="text-slate-400 mb-6">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
          <button id="access-denied-ok-btn"
                  class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
            Entendido
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const bib = this.biblioteca;
    bib.eventManager.addEventListener(document.getElementById('access-denied-backdrop'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document.getElementById('access-denied-ok-btn'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document, 'keydown', escapeHandler);
  }

  // ==========================================================================
  // MODAL: PREMIUM INFO
  // ==========================================================================

  /**
   * Muestra modal de información premium
   */
  showPremiumInfoModal() {
    const existente = document.getElementById('premium-info-modal');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.id = 'premium-info-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    let cleanupModal;
    const escapeHandler = this.createEscapeHandler(() => cleanupModal());
    cleanupModal = this.createCleanup(modal, escapeHandler);

    const bib = this.biblioteca;

    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="premium-info-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-amber-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-b border-white/10 p-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            👑 Premium & IA
          </h2>
          <button id="premium-info-close" class="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
            ${Icons.create('x', 24)}
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
          <!-- Plans -->
          <div class="space-y-4">
            <!-- Free -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">🆓</span>
                <div>
                  <h3 class="font-bold text-white">Gratuito</h3>
                  <p class="text-sm text-green-400">Tu plan actual</p>
                </div>
                <span class="ml-auto text-2xl font-bold text-white">0€</span>
              </div>
              <ul class="text-sm text-slate-300 space-y-1">
                <li class="flex items-center gap-2">✅ Acceso a todos los libros</li>
                <li class="flex items-center gap-2">✅ Progreso y notas</li>
                <li class="flex items-center gap-2">✅ Audiolibro integrado</li>
                <li class="flex items-center gap-2">✅ Quizzes básicos</li>
              </ul>
            </div>

            <!-- Premium -->
            <div class="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl p-4 border border-amber-500/30 relative overflow-hidden">
              <div class="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded">
                RECOMENDADO
              </div>
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">⭐</span>
                <div>
                  <h3 class="font-bold text-amber-400">Premium</h3>
                  <p class="text-sm text-slate-400">Para lectores activos</p>
                </div>
                <span class="ml-auto text-2xl font-bold text-white">9,99€<span class="text-sm font-normal text-slate-400">/mes</span></span>
              </div>
              <ul class="text-sm text-slate-300 space-y-1">
                <li class="flex items-center gap-2">✅ Todo lo gratuito</li>
                <li class="flex items-center gap-2">⭐ Chat IA ilimitado sobre libros</li>
                <li class="flex items-center gap-2">⭐ Tutor IA personalizado</li>
                <li class="flex items-center gap-2">⭐ Adaptador de contenido IA</li>
                <li class="flex items-center gap-2">⭐ 500 consultas IA/mes</li>
                <li class="flex items-center gap-2">⭐ Exportar a PDF</li>
              </ul>
            </div>

            <!-- Pro -->
            <div class="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/30">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">👑</span>
                <div>
                  <h3 class="font-bold text-purple-400">Pro</h3>
                  <p class="text-sm text-slate-400">Para gamers y creadores</p>
                </div>
                <span class="ml-auto text-2xl font-bold text-white">19,99€<span class="text-sm font-normal text-slate-400">/mes</span></span>
              </div>
              <ul class="text-sm text-slate-300 space-y-1">
                <li class="flex items-center gap-2">✅ Todo lo Premium</li>
                <li class="flex items-center gap-2">👑 Game Master IA</li>
                <li class="flex items-center gap-2">👑 NPCs conversacionales</li>
                <li class="flex items-center gap-2">👑 Misiones dinámicas</li>
                <li class="flex items-center gap-2">👑 2000 consultas IA/mes</li>
              </ul>
            </div>
          </div>

          <!-- IA Config Info -->
          <div class="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
            <h3 class="font-semibold text-cyan-400 mb-2 flex items-center gap-2">
              🤖 Usar tu propia API de IA
            </h3>
            <p class="text-sm text-slate-300 mb-3">
              Si tienes una API key de OpenAI, Anthropic u otro proveedor, puedes configurarla
              en <strong>Configuración → IA</strong> para usar las funciones de IA sin suscripción.
            </p>
            <button id="open-ai-settings" class="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors">
              Configurar IA →
            </button>
          </div>

          <!-- Payment Methods -->
          <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <h3 class="font-semibold text-green-400 mb-3 flex items-center gap-2">
              💳 Métodos de Pago
            </h3>
            <div class="flex flex-wrap gap-3">
              <a href="https://www.paypal.com/paypalme/codigodespierto" target="_blank"
                 class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.48c-.55 0-1.015.394-1.096.937l-1.308 8.069Z"/>
                </svg>
                PayPal
              </a>
              <button id="premium-donations-btn"
                      class="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors">
                <span>🪙</span>
                Cripto / Otros
              </button>
            </div>
            <p class="text-xs text-slate-500 mt-3">
              Después de donar, contacta para activar tu plan Premium manualmente.
            </p>
          </div>

          <!-- Coming Soon -->
          <div class="text-center text-sm text-slate-500 pt-4 border-t border-white/10">
            <p>💳 Pagos automáticos con Stripe próximamente</p>
            <p class="mt-1">Por ahora usa PayPal/Cripto o configura tu API de IA</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    bib.eventManager.addEventListener(document.getElementById('premium-info-backdrop'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document.getElementById('premium-info-close'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document.getElementById('open-ai-settings'), 'click', () => {
      cleanupModal();
      if (window.SettingsModal) {
        const settings = new window.SettingsModal();
        settings.show();
        bib.utils.setTimeout(() => {
          const iaTab = document.querySelector('[data-tab="ia"], [data-section="ia"], #settings-tab-ia');
          if (iaTab) iaTab.click();
        }, 300);
      }
    });
    bib.eventManager.addEventListener(document.getElementById('premium-donations-btn'), 'click', () => {
      cleanupModal();
      if (window.donationsModal) window.donationsModal.open();
    });
    bib.eventManager.addEventListener(document, 'keydown', escapeHandler);
  }

  // ==========================================================================
  // MODAL: ABOUT
  // ==========================================================================

  /**
   * Muestra modal de información "Acerca de"
   */
  showAboutModal() {
    const existente = document.getElementById('about-modal');
    if (existente) existente.remove();

    const bib = this.biblioteca;
    const datosLibreria = bib.bookEngine.catalog.library;
    const totalLibros = bib.bookEngine.catalog.books.filter(b => b.status === 'published').length;

    const modal = document.createElement('div');
    modal.id = 'about-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    let cleanupModal;
    const escapeHandler = this.createEscapeHandler(() => cleanupModal());
    cleanupModal = this.createCleanup(modal, escapeHandler);

    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="about-modal-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
        <!-- Header -->
        <div class="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            📚 Acerca de
          </h2>
          <button id="about-modal-close" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
            ${Icons.create('x', 24)}
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
          <!-- Título -->
          <div class="text-center">
            <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400 mb-2">
              ${datosLibreria.name}
            </h1>
            <p class="text-slate-300">${datosLibreria.tagline}</p>
            <p class="text-sm text-slate-500 mt-2">Por ${datosLibreria.authors.join(' & ')}</p>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div class="text-2xl font-bold text-amber-400">${totalLibros}</div>
              <div class="text-xs text-slate-400">Libros</div>
            </div>
            <div class="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div class="text-2xl font-bold text-cyan-400">250+</div>
              <div class="text-xs text-slate-400">Capítulos</div>
            </div>
            <div class="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div class="text-2xl font-bold text-green-400">100%</div>
              <div class="text-xs text-slate-400">Gratuito</div>
            </div>
          </div>

          <!-- Descripción -->
          <div class="space-y-4 text-slate-300">
            <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <h3 class="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                🤝 Co-creación Humano-IA
              </h3>
              <p class="text-sm">
                Todos los libros han sido co-creados entre <strong class="text-white">J. Irurtzun</strong> (humano) y
                <strong class="text-white">Claude</strong> (IA de Anthropic). Esta colaboración única combina experiencia
                vivencial con capacidad de síntesis y análisis de la inteligencia artificial.
              </p>
            </div>

            <p class="text-sm">
              La Colección explora los grandes temas de nuestro tiempo: la naturaleza de la conciencia,
              la transformación personal y social, la relación entre humanidad y tecnología,
              y los caminos hacia un mundo más consciente y sostenible.
            </p>
          </div>

          <!-- Funcionalidades -->
          <div>
            <h3 class="font-semibold text-white mb-3">Funcionalidades</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-cyan-400">🎧</span> Audiolibro integrado
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-purple-400">🤖</span> Chat con IA
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-amber-400">📝</span> Notas personales
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-green-400">📊</span> Seguimiento de progreso
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-red-400">🧘</span> Meditaciones guiadas
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-blue-400">🎯</span> Quizzes interactivos
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-pink-400">🔄</span> Adaptador de contenido
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <span class="text-yellow-400">🧬</span> Laboratorio Frankenstein
              </div>
            </div>
          </div>

          <!-- Ayuda rápida -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 class="font-semibold text-white mb-3">Ayuda Rápida</h3>
            <div class="space-y-2 text-sm text-slate-300">
              <p><strong class="text-white">Para empezar:</strong> Elige un libro y pulsa "Leer"</p>
              <p><strong class="text-white">Audio:</strong> Dentro del lector, busca el botón 🎧</p>
              <p><strong class="text-white">Notas:</strong> Selecciona texto para subrayar o comentar</p>
              <p><strong class="text-white">Progreso:</strong> Se guarda automáticamente</p>
            </div>
          </div>

          <!-- Links -->
          <div class="flex flex-wrap gap-3 justify-center pt-4 border-t border-white/10">
            <a href="about.html" target="_blank" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">
              📄 Página completa
            </a>
            <a href="lab.html" class="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-sm text-amber-400 transition-colors">
              🧬 Laboratorio
            </a>
          </div>

          <!-- Footer -->
          <div class="text-center text-xs text-slate-500 pt-4">
            <p>Versión ${datosLibreria.version} • © 2025 Colección Nuevo Ser</p>
            <p class="mt-1">Co-creado con amor entre humano e IA</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    bib.eventManager.addEventListener(document.getElementById('about-modal-backdrop'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document.getElementById('about-modal-close'), 'click', cleanupModal);
    bib.eventManager.addEventListener(document, 'keydown', escapeHandler);
  }
}

// Exportar globalmente
window.BibliotecaModals = BibliotecaModals;
