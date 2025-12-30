/**
 * UPDATE MODAL
 * Modal para notificar y gestionar actualizaciones disponibles
 *
 * @version 1.0.0
 */

class UpdateModal {
  constructor(versionManager, updateHelper) {
    this.versionManager = versionManager;
    this.updateHelper = updateHelper;
    this.isVisible = false;
    this.modalId = 'update-modal-container';

    // Escuchar eventos de actualización
    this.versionManager.on('updateAvailable', (update) => {
      this.showUpdateNotification(update);
    });

    this.updateHelper.on('downloadStarted', () => {
      this.showDownloadProgress();
    });

    this.updateHelper.on('downloadProgress', (progress) => {
      this.updateDownloadProgress(progress);
    });

    this.updateHelper.on('downloadCompleted', () => {
      this.showDownloadComplete();
    });

    this.updateHelper.on('updateError', (error) => {
      this.showError(error);
    });
  }

  /**
   * Mostrar notificación de actualización disponible
   */
  showUpdateNotification(updateInfo) {
    const isCritical = updateInfo.isCritical || false;
    const isSecurity = updateInfo.isSecurity || false;

    const html = `
      <div class="update-modal-overlay ${isCritical ? 'critical' : ''}">
        <div class="update-modal-content">
          <!-- Header -->
          <div class="update-modal-header">
            <div class="update-icon">
              ${isCritical ? '🚨' : '📦'}
            </div>
            <h2>${isCritical ? '¡Actualización Crítica!' : '¡Actualización Disponible!'}</h2>
            ${isSecurity ? '<span class="security-badge">🔒 Seguridad</span>' : ''}
          </div>

          <!-- Content -->
          <div class="update-modal-body">
            <div class="version-info">
              <p class="version-change">
                <strong>${this.versionManager.currentVersion}</strong>
                <span class="arrow">→</span>
                <strong>${updateInfo.version}</strong>
              </p>
              <p class="release-date">Publicado: ${updateInfo.releaseDate}</p>
            </div>

            <!-- Features/Changes -->
            <div class="features-section">
              <h3>Novedades:</h3>
              <ul class="features-list">
                ${(updateInfo.features || updateInfo.changesSummary || [])
                  .map(feature => `<li>${feature}</li>`)
                  .join('')}
              </ul>
            </div>

            <!-- Size Info -->
            <div class="download-info">
              <span class="info-label">📥 Tamaño estimado:</span>
              <span class="info-value">${updateInfo.estimatedSize || 'Unknown'}</span>
            </div>

            <!-- Critical Warning -->
            ${isCritical ? `
              <div class="warning-box">
                <strong>⚠️ Esta actualización es crítica</strong>
                <p>Puede contener correcciones de seguridad importantes o problemas graves.</p>
              </div>
            ` : ''}
          </div>

          <!-- Actions -->
          <div class="update-modal-footer">
            ${!isCritical ? `
              <button class="btn-later" data-action="remind-later">
                Recordarme más tarde
              </button>
            ` : ''}
            <button class="btn-update" data-action="download-update">
              ${isCritical ? 'Actualizar Ahora (Requerido)' : 'Actualizar Ahora'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.render(html);
    this.attachEventListeners(updateInfo);
    this.isVisible = true;
  }

  /**
   * Mostrar progreso de descarga
   */
  showDownloadProgress() {
    const html = `
      <div class="update-modal-overlay no-dismiss">
        <div class="update-modal-content">
          <div class="update-modal-header">
            <div class="update-icon">⏳</div>
            <h2>Descargando Actualización...</h2>
          </div>

          <div class="update-modal-body">
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
              </div>
              <p class="progress-text" id="progress-text">0%</p>
            </div>
            <p class="status-message">Por favor, no cierres la aplicación durante la descarga.</p>
          </div>
        </div>
      </div>
    `;

    this.render(html);
  }

  /**
   * Actualizar barra de progreso
   */
  updateDownloadProgress(progress) {
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');

    if (fill && text) {
      fill.style.width = progress + '%';
      text.textContent = progress + '%';
    }
  }

  /**
   * Mostrar descarga completada
   */
  showDownloadComplete() {
    const html = `
      <div class="update-modal-overlay no-dismiss">
        <div class="update-modal-content">
          <div class="update-modal-header">
            <div class="update-icon success">✅</div>
            <h2>¡Descarga Completada!</h2>
          </div>

          <div class="update-modal-body">
            <p>La actualización está lista. La aplicación se reiniciará en breve...</p>
            <p class="countdown">Reiniciando en <span id="countdown">5</span> segundos</p>
          </div>
        </div>
      </div>
    `;

    this.render(html);

    // Countdown
    let seconds = 5;
    const countdown = setInterval(() => {
      seconds--;
      const el = document.getElementById('countdown');
      if (el) el.textContent = seconds;

      if (seconds <= 0) {
        clearInterval(countdown);
        window.location.reload();
      }
    }, 1000);
  }

  /**
   * Mostrar error
   */
  showError(error) {
    const html = `
      <div class="update-modal-overlay">
        <div class="update-modal-content error">
          <div class="update-modal-header">
            <div class="update-icon error">❌</div>
            <h2>Error en la Actualización</h2>
          </div>

          <div class="update-modal-body">
            <p class="error-message">${error.message || 'Error desconocido'}</p>
            <p class="error-hint">Intenta nuevamente más tarde o contacta con soporte.</p>
          </div>

          <div class="update-modal-footer">
            <button class="btn-close" data-action="close-modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    this.render(html);
    this.attachEventListeners({ isCritical: false });
  }

  /**
   * Renderizar modal en DOM
   */
  render(html) {
    let container = document.getElementById(this.modalId);

    if (!container) {
      container = document.createElement('div');
      container.id = this.modalId;
      document.body.appendChild(container);
    }

    container.innerHTML = html;
    this.attachStyles();
  }

  /**
   * Inyectar estilos CSS
   */
  attachStyles() {
    // Buscar si ya existen estilos
    if (document.getElementById('update-modal-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'update-modal-styles';
    styles.textContent = `
      /* Update Modal Styles */
      .update-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: fadeIn 0.3s ease-in-out;
      }

      .update-modal-overlay.critical {
        background: rgba(239, 68, 68, 0.1);
      }

      .update-modal-overlay.no-dismiss::before {
        content: '';
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .update-modal-content {
        background: var(--color-background-secondary, #ffffff);
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .update-modal-content {
          background: #1f2937;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        }
      }

      .theme-dark .update-modal-content {
        background: #1f2937;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      }

      @keyframes slideUp {
        from {
          transform: translateY(50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .update-modal-content.error {
        border: 2px solid #ef4444;
      }

      .update-modal-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px 24px;
        text-align: center;
        border-radius: 16px 16px 0 0;
        position: relative;
      }

      .update-modal-header.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }

      .update-icon {
        font-size: 48px;
        margin-bottom: 12px;
        display: inline-block;
      }

      .update-icon.success {
        animation: bounce 0.6s ease-out;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .update-modal-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .security-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        margin-top: 8px;
      }

      .update-modal-body {
        padding: 24px;
        color: var(--color-text, #1f2937);
      }

      @media (prefers-color-scheme: dark) {
        .update-modal-body {
          color: #e5e7eb;
        }
      }

      .theme-dark .update-modal-body {
        color: #e5e7eb;
      }

      .version-info {
        background: var(--color-background, #f3f4f6);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      @media (prefers-color-scheme: dark) {
        .version-info {
          background: #374151;
        }
      }

      .theme-dark .version-info {
        background: #374151;
      }

      .version-change {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .arrow {
        margin: 0 8px;
        color: #667eea;
      }

      .release-date {
        margin: 0;
        font-size: 12px;
        color: #6b7280;
      }

      @media (prefers-color-scheme: dark) {
        .release-date {
          color: #9ca3af;
        }
      }

      .theme-dark .release-date {
        color: #9ca3af;
      }

      .features-section {
        margin-bottom: 20px;
      }

      .features-section h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text, #1f2937);
      }

      @media (prefers-color-scheme: dark) {
        .features-section h3 {
          color: #f3f4f6;
        }
      }

      .theme-dark .features-section h3 {
        color: #f3f4f6;
      }

      .features-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .features-list li {
        padding: 6px 0;
        font-size: 13px;
        color: #6b7280;
        padding-left: 20px;
        position: relative;
      }

      @media (prefers-color-scheme: dark) {
        .features-list li {
          color: #d1d5db;
        }
      }

      .theme-dark .features-list li {
        color: #d1d5db;
      }

      .features-list li:before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #10b981;
        font-weight: bold;
      }

      .download-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #ecfdf5;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 16px;
      }

      @media (prefers-color-scheme: dark) {
        .download-info {
          background: #064e3b;
        }
      }

      .theme-dark .download-info {
        background: #064e3b;
      }

      .info-label {
        color: var(--color-text, #1f2937);
      }

      @media (prefers-color-scheme: dark) {
        .info-label {
          color: #d1fae5;
        }
      }

      .theme-dark .info-label {
        color: #d1fae5;
      }

      .info-value {
        font-weight: 600;
        color: #10b981;
      }

      @media (prefers-color-scheme: dark) {
        .info-value {
          color: #6ee7b7;
        }
      }

      .theme-dark .info-value {
        color: #6ee7b7;
      }

      .warning-box {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 12px;
        margin-top: 16px;
        font-size: 13px;
        color: #991b1b;
      }

      @media (prefers-color-scheme: dark) {
        .warning-box {
          background: #7f1d1d;
          border-color: #991b1b;
          color: #fecaca;
        }
      }

      .theme-dark .warning-box {
        background: #7f1d1d;
        border-color: #991b1b;
        color: #fecaca;
      }

      .warning-box strong {
        display: block;
        margin-bottom: 4px;
      }

      .warning-box p {
        margin: 0;
      }

      .progress-container {
        margin: 20px 0;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      }

      @media (prefers-color-scheme: dark) {
        .progress-bar {
          background: #374151;
        }
      }

      .theme-dark .progress-bar {
        background: #374151;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
        border-radius: 4px;
      }

      .progress-text {
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        color: #667eea;
        margin: 0;
      }

      .status-message {
        text-align: center;
        font-size: 13px;
        color: #6b7280;
        margin-top: 12px;
      }

      @media (prefers-color-scheme: dark) {
        .status-message {
          color: #9ca3af;
        }
      }

      .theme-dark .status-message {
        color: #9ca3af;
      }

      .countdown {
        text-align: center;
        font-size: 14px;
        color: #6b7280;
        margin-top: 16px;
      }

      @media (prefers-color-scheme: dark) {
        .countdown {
          color: #9ca3af;
        }
      }

      .theme-dark .countdown {
        color: #9ca3af;
      }

      #countdown {
        font-weight: bold;
        color: #667eea;
      }

      .error-message {
        color: #ef4444;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .error-hint {
        font-size: 13px;
        color: #6b7280;
      }

      @media (prefers-color-scheme: dark) {
        .error-hint {
          color: #9ca3af;
        }
      }

      .theme-dark .error-hint {
        color: #9ca3af;
      }

      .update-modal-footer {
        display: flex;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
        border-radius: 0 0 16px 16px;
      }

      @media (prefers-color-scheme: dark) {
        .update-modal-footer {
          background: #111827;
          border-top-color: #374151;
        }
      }

      .theme-dark .update-modal-footer {
        background: #111827;
        border-top-color: #374151;
      }

      .btn-later {
        flex: 1;
        padding: 12px 16px;
        background: var(--color-background-secondary, #ffffff);
        border: 1px solid #d1d5db;
        color: var(--color-text, #1f2937);
        font-size: 14px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      @media (prefers-color-scheme: dark) {
        .btn-later {
          background: #374151;
          border-color: #4b5563;
          color: #e5e7eb;
        }
      }

      .theme-dark .btn-later {
        background: #374151;
        border-color: #4b5563;
        color: #e5e7eb;
      }

      .btn-later:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      @media (prefers-color-scheme: dark) {
        .btn-later:hover {
          background: #4b5563;
          border-color: #6b7280;
        }
      }

      .theme-dark .btn-later:hover {
        background: #4b5563;
        border-color: #6b7280;
      }

      .btn-update {
        flex: 1;
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        font-size: 14px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-update:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
      }

      .btn-close {
        flex: 1;
        padding: 12px 16px;
        background: white;
        border: 1px solid #d1d5db;
        color: #333;
        font-size: 14px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
      }

      @media (max-width: 600px) {
        .update-modal-content {
          width: 95%;
          margin: 20px;
        }

        .update-modal-header {
          padding: 24px 20px;
        }

        .update-modal-body {
          padding: 20px;
        }

        .update-modal-footer {
          flex-direction: column;
          padding: 16px 20px;
        }

        .update-modal-header h2 {
          font-size: 20px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners(updateInfo) {
    const container = document.getElementById(this.modalId);

    if (!container) return;

    container.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');

        switch (action) {
          case 'download-update':
            this.updateHelper.downloadUpdate(updateInfo);
            break;
          case 'remind-later':
            this.hide();
            break;
          case 'close-modal':
            this.hide();
            break;
        }
      });
    });

    // 🔧 FIX v2.9.270: ESC key para cerrar modal
    this.escHandler = (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  /**
   * Ocultar modal
   */
  hide() {
    // 🔧 FIX v2.9.270: Limpiar ESC handler
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }

    const container = document.getElementById(this.modalId);
    if (container) {
      container.innerHTML = '';
    }
    this.isVisible = false;
  }
}

// Exportar global
window.UpdateModal = UpdateModal;
