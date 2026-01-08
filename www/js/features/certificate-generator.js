// ============================================================================
// CERTIFICATE GENERATOR - Sistema de Certificados de Lectura
// ============================================================================
// v2.9.326: Genera certificados al completar libros
// Integra con sistema de logros y permite compartir/descargar

class CertificateGenerator {
  constructor() {
    this.certificates = this.loadCertificates();
    this.modalElement = null;
    this.i18n = window.i18n || { t: (key) => key };
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadCertificates() {
    try {
      return JSON.parse(localStorage.getItem('user-certificates')) || {};
    } catch {
      return {};
    }
  }

  saveCertificates() {
    try {
      localStorage.setItem('user-certificates', JSON.stringify(this.certificates));

      // Sync con Supabase si está disponible
      if (window.authHelper?.user && window.supabaseSyncHelper?.syncSettingsToCloud) {
        window.supabaseSyncHelper.syncSettingsToCloud(['user-certificates']);
      }
    } catch (error) {
      logger.error('[Certificate] Error guardando certificados:', error);
    }
  }

  // ==========================================================================
  // GENERACIÓN DE CERTIFICADOS
  // ==========================================================================

  /**
   * Verifica si un libro está completado y genera certificado si no existe
   */
  checkAndGenerateCertificate(bookId) {
    if (!window.bookEngine) return null;

    const progress = window.bookEngine.getProgress(bookId);

    // Solo generar si el libro está 100% completado
    if (progress.percentage !== 100) return null;

    // Verificar si ya existe el certificado
    if (this.certificates[bookId]) {
      return this.certificates[bookId];
    }

    // Generar nuevo certificado
    return this.generateCertificate(bookId, progress);
  }

  /**
   * Genera un certificado para un libro completado
   */
  generateCertificate(bookId, progress) {
    const bookInfo = window.bookEngine?.getBookInfo(bookId);
    if (!bookInfo) return null;

    const userName = this.getUserName();
    const certificate = {
      id: `cert-${bookId}-${Date.now()}`,
      bookId: bookId,
      bookTitle: bookInfo.title,
      bookSubtitle: bookInfo.subtitle || '',
      bookAuthors: bookInfo.authors || ['Autor desconocido'],
      bookIcon: bookInfo.icon || '📚',
      bookColor: bookInfo.color || '#0ea5e9',
      userName: userName,
      completedAt: new Date().toISOString(),
      chaptersRead: progress.chaptersRead,
      totalChapters: progress.totalChapters,
      certificateNumber: this.generateCertificateNumber()
    };

    // Guardar certificado
    this.certificates[bookId] = certificate;
    this.saveCertificates();

    // Disparar evento para notificación
    window.dispatchEvent(new CustomEvent('certificate-earned', {
      detail: certificate
    }));

    logger.log('[Certificate] Certificado generado:', certificate.id);
    return certificate;
  }

  getUserName() {
    // Intentar obtener nombre del usuario
    if (window.authHelper?.user?.user_metadata?.name) {
      return window.authHelper.user.user_metadata.name;
    }
    if (window.authHelper?.user?.email) {
      return window.authHelper.user.email.split('@')[0];
    }
    return localStorage.getItem('user-display-name') || 'Lector';
  }

  generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CNS-${timestamp}-${random}`;
  }

  // ==========================================================================
  // RENDERIZADO DEL CERTIFICADO
  // ==========================================================================

  /**
   * Genera el HTML del certificado para visualización/captura
   */
  renderCertificateHTML(certificate) {
    const completedDate = new Date(certificate.completedAt);
    const formattedDate = completedDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return `
      <div id="certificate-canvas" class="certificate-container" style="
        width: 800px;
        min-height: 600px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        border: 4px solid ${certificate.bookColor};
        border-radius: 16px;
        padding: 48px;
        position: relative;
        overflow: hidden;
        font-family: 'Crimson Text', Georgia, serif;
        color: white;
      ">
        <!-- Decorative corners -->
        <div style="position: absolute; top: 16px; left: 16px; width: 60px; height: 60px; border-top: 3px solid ${certificate.bookColor}; border-left: 3px solid ${certificate.bookColor}; opacity: 0.6;"></div>
        <div style="position: absolute; top: 16px; right: 16px; width: 60px; height: 60px; border-top: 3px solid ${certificate.bookColor}; border-right: 3px solid ${certificate.bookColor}; opacity: 0.6;"></div>
        <div style="position: absolute; bottom: 16px; left: 16px; width: 60px; height: 60px; border-bottom: 3px solid ${certificate.bookColor}; border-left: 3px solid ${certificate.bookColor}; opacity: 0.6;"></div>
        <div style="position: absolute; bottom: 16px; right: 16px; width: 60px; height: 60px; border-bottom: 3px solid ${certificate.bookColor}; border-right: 3px solid ${certificate.bookColor}; opacity: 0.6;"></div>

        <!-- Background pattern -->
        <div style="position: absolute; inset: 0; opacity: 0.03; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4='); pointer-events: none;"></div>

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 4px; color: ${certificate.bookColor}; margin-bottom: 8px;">
            Colección Nuevo Ser
          </div>
          <h1 style="font-size: 42px; font-weight: bold; margin: 0; font-family: 'Cinzel', serif; background: linear-gradient(135deg, ${certificate.bookColor}, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            CERTIFICADO DE LECTURA
          </h1>
        </div>

        <!-- Body -->
        <div style="text-align: center; padding: 24px 0;">
          <p style="font-size: 18px; color: #94a3b8; margin-bottom: 16px;">
            Este certificado acredita que
          </p>

          <h2 style="font-size: 36px; font-weight: bold; margin: 16px 0; color: white; font-family: 'Cinzel', serif;">
            ${this.escapeHtml(certificate.userName)}
          </h2>

          <p style="font-size: 18px; color: #94a3b8; margin: 16px 0;">
            ha completado satisfactoriamente la lectura de
          </p>

          <!-- Book info -->
          <div style="margin: 32px auto; padding: 24px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid ${certificate.bookColor}40; max-width: 500px;">
            <div style="font-size: 48px; margin-bottom: 12px;">${certificate.bookIcon}</div>
            <h3 style="font-size: 28px; font-weight: bold; margin: 0 0 8px 0; color: ${certificate.bookColor};">
              ${this.escapeHtml(certificate.bookTitle)}
            </h3>
            ${certificate.bookSubtitle ? `
              <p style="font-size: 16px; color: #94a3b8; margin: 0; font-style: italic;">
                ${this.escapeHtml(certificate.bookSubtitle)}
              </p>
            ` : ''}
            <p style="font-size: 14px; color: #64748b; margin-top: 12px;">
              ${certificate.totalChapters} capítulos completados
            </p>
          </div>

          <p style="font-size: 16px; color: #64748b; margin-top: 24px;">
            Por ${certificate.bookAuthors.join(' & ')}
          </p>
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: left;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">Fecha de finalización</p>
            <p style="font-size: 16px; color: white; margin: 4px 0 0 0; font-weight: 500;">${formattedDate}</p>
          </div>
          <div style="text-align: center;">
            <div style="width: 80px; height: 80px; border: 2px solid ${certificate.bookColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <span style="font-size: 32px;">✓</span>
            </div>
            <p style="font-size: 10px; color: #64748b; margin-top: 8px;">VERIFICADO</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">Número de certificado</p>
            <p style="font-size: 14px; color: ${certificate.bookColor}; margin: 4px 0 0 0; font-family: monospace;">${certificate.certificateNumber}</p>
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================================================
  // MODAL DE CERTIFICADO
  // ==========================================================================

  /**
   * Muestra el modal con el certificado
   */
  showCertificateModal(bookId) {
    const certificate = this.certificates[bookId];
    if (!certificate) {
      window.toast?.warn('No se encontró el certificado para este libro.');
      return;
    }

    this.renderModal(certificate);
  }

  renderModal(certificate) {
    // Remover modal existente
    this.closeModal();

    const modal = document.createElement('div');
    modal.id = 'certificate-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.certificateGenerator?.closeModal()"></div>

      <!-- Modal Content -->
      <div class="relative bg-slate-900 rounded-2xl shadow-2xl max-w-[900px] w-full max-h-[90vh] overflow-hidden border border-gray-700">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            🎓 Tu Certificado de Lectura
          </h2>
          <button onclick="window.certificateGenerator?.closeModal()"
                  class="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Certificate Preview -->
        <div class="p-4 overflow-auto" style="max-height: calc(90vh - 140px);">
          <div class="flex justify-center" style="transform: scale(0.85); transform-origin: top center;">
            ${this.renderCertificateHTML(certificate)}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center justify-center gap-3 p-4 border-t border-gray-700 bg-slate-800/50">
          <button onclick="window.certificateGenerator?.downloadCertificate('${certificate.bookId}')"
                  class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Descargar imagen
          </button>
          <button onclick="window.certificateGenerator?.shareCertificate('${certificate.bookId}')"
                  class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Compartir
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    // Escape para cerrar
    this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  closeModal() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
  }

  // ==========================================================================
  // DESCARGAR Y COMPARTIR
  // ==========================================================================

  /**
   * Descarga el certificado como imagen PNG
   */
  async downloadCertificate(bookId) {
    const certificate = this.certificates[bookId];
    if (!certificate) return;

    try {
      // Mostrar loading
      window.loadingIndicator?.showBar('certificate-download');

      // Crear contenedor temporal para captura
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = 'position: fixed; left: -9999px; top: 0;';
      tempContainer.innerHTML = this.renderCertificateHTML(certificate);
      document.body.appendChild(tempContainer);

      const certificateElement = tempContainer.querySelector('#certificate-canvas');

      // Usar html2canvas si está disponible, sino canvas nativo
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(certificateElement, {
          backgroundColor: '#0f172a',
          scale: 2,
          useCORS: true,
          logging: false
        });

        // Descargar
        const link = document.createElement('a');
        link.download = `certificado-${certificate.bookId}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        window.toast?.success('Certificado descargado correctamente');
      } else {
        // Fallback: abrir en nueva pestaña para screenshot manual
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Certificado - ${certificate.bookTitle}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
            <style>
              body { margin: 0; padding: 40px; background: #1e293b; display: flex; justify-content: center; }
            </style>
          </head>
          <body>
            ${this.renderCertificateHTML(certificate)}
            <p style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); color: #94a3b8; font-family: sans-serif; font-size: 14px;">
              Haz clic derecho y selecciona "Guardar imagen como..." o usa Ctrl+S
            </p>
          </body>
          </html>
        `);
        newWindow.document.close();
        window.toast?.info('Se abrió el certificado en una nueva pestaña. Guárdalo manualmente.');
      }

      // Limpiar
      tempContainer.remove();

    } catch (error) {
      logger.error('[Certificate] Error descargando:', error);
      window.toast?.error('Error al descargar el certificado');
    } finally {
      window.loadingIndicator?.hide('certificate-download');
    }
  }

  /**
   * Comparte el certificado usando Web Share API o Capacitor Share
   */
  async shareCertificate(bookId) {
    const certificate = this.certificates[bookId];
    if (!certificate) return;

    const shareText = `🎓 ¡He completado "${certificate.bookTitle}" en Colección Nuevo Ser!\n\n` +
      `📚 ${certificate.totalChapters} capítulos leídos\n` +
      `✨ Certificado #${certificate.certificateNumber}\n\n` +
      `#ColeccionNuevoSer #Lectura #Crecimiento`;

    try {
      // Capacitor Share
      if (window.Capacitor?.isNativePlatform() && window.Capacitor.Plugins?.Share) {
        await window.Capacitor.Plugins.Share.share({
          title: `Certificado: ${certificate.bookTitle}`,
          text: shareText,
          dialogTitle: 'Compartir certificado'
        });
        return;
      }

      // Web Share API
      if (navigator.share) {
        await navigator.share({
          title: `Certificado: ${certificate.bookTitle}`,
          text: shareText
        });
        return;
      }

      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(shareText);
      window.toast?.success('Texto copiado al portapapeles. ¡Compártelo donde quieras!');

    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.error('[Certificate] Error compartiendo:', error);
        window.toast?.error('Error al compartir');
      }
    }
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================

  /**
   * Obtiene todos los certificados del usuario
   */
  getAllCertificates() {
    return Object.values(this.certificates).sort((a, b) =>
      new Date(b.completedAt) - new Date(a.completedAt)
    );
  }

  /**
   * Verifica si existe certificado para un libro
   */
  hasCertificate(bookId) {
    return !!this.certificates[bookId];
  }

  /**
   * Obtiene certificado de un libro específico
   */
  getCertificate(bookId) {
    return this.certificates[bookId] || null;
  }

  /**
   * Permite al usuario establecer su nombre para certificados
   */
  setUserName(name) {
    if (name && name.trim()) {
      localStorage.setItem('user-display-name', name.trim());
      window.toast?.success('Nombre actualizado para certificados');
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

// Auto-instanciar
window.certificateGenerator = new CertificateGenerator();

// Nota: La generación de certificados se dispara desde book-engine.js
// cuando un libro se completa al 100% (en markChapterAsRead)

logger.log('[CertificateGenerator] Sistema de certificados inicializado');
