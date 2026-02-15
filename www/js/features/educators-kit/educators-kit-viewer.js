/**
 * Educators Kit Viewer - Visor de contenido
 * Gestiona la visualizacion de recursos y actividades
 * @version 1.0.0
 */

class EducatorsKitViewer {
  constructor(educatorsKit) {
    this.educatorsKit = educatorsKit;
    this.currentViewerContent = null;
    this.currentViewerPage = 0;
  }

  /**
   * Crea el modal de visualizacion
   */
  createViewerModal() {
    if (document.getElementById('content-viewer-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'content-viewer-modal';
    modal.className = 'content-viewer-modal';
    modal.innerHTML = `
      <div class="viewer-backdrop" onclick="window.educatorsKit?.closeViewer()"></div>
      <div class="viewer-container">
        <div class="viewer-header">
          <div class="viewer-title-area">
            <h2 class="viewer-title" id="viewer-title">Titulo</h2>
            <p class="viewer-subtitle" id="viewer-subtitle">Subtitulo</p>
          </div>
          <div class="viewer-actions">
            <button class="viewer-btn" onclick="window.educatorsKit?.printContent()" title="Imprimir/Guardar PDF">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              <span>Imprimir/PDF</span>
            </button>
            <button class="viewer-close" onclick="window.educatorsKit?.closeViewer()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="viewer-nav" id="viewer-nav">
          <!-- Pagination buttons -->
        </div>
        <div class="viewer-content" id="viewer-content">
          <!-- Content here -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.educatorsKit.viewerModal = modal;

    // Estilos del visor
    this.addViewerStyles();
  }

  /**
   * Agrega los estilos del visor
   */
  addViewerStyles() {
    if (document.getElementById('viewer-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'viewer-styles';
    styles.textContent = `
      .content-viewer-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
      }
      .content-viewer-modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .viewer-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(4px);
      }
      .viewer-container {
        position: relative;
        width: 95%;
        max-width: 900px;
        max-height: 90vh;
        background: #1e293b;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .viewer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.8);
      }
      .viewer-title-area {
        flex: 1;
      }
      .viewer-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        margin: 0;
      }
      .viewer-subtitle {
        font-size: 0.875rem;
        color: #94a3b8;
        margin: 4px 0 0;
      }
      .viewer-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .viewer-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(251, 191, 36, 0.2);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 8px;
        color: #fbbf24;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .viewer-btn:hover {
        background: rgba(251, 191, 36, 0.3);
      }
      .viewer-close {
        padding: 8px;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        color: #ef4444;
        cursor: pointer;
        transition: all 0.2s;
      }
      .viewer-close:hover {
        background: rgba(239, 68, 68, 0.3);
      }
      .viewer-nav {
        display: flex;
        gap: 8px;
        padding: 12px 24px;
        background: rgba(15, 23, 42, 0.5);
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        overflow-x: auto;
      }
      .viewer-nav-btn {
        padding: 8px 16px;
        background: rgba(148, 163, 184, 0.1);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 8px;
        color: #94a3b8;
        font-size: 0.875rem;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s;
      }
      .viewer-nav-btn:hover {
        background: rgba(148, 163, 184, 0.2);
      }
      .viewer-nav-btn.active {
        background: rgba(251, 191, 36, 0.2);
        border-color: rgba(251, 191, 36, 0.3);
        color: #fbbf24;
      }
      .viewer-content {
        flex: 1;
        overflow-y: auto;
        padding: 32px;
        color: #e2e8f0;
        line-height: 1.7;
      }
      .viewer-content h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid rgba(251, 191, 36, 0.3);
      }
      .viewer-content h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #fbbf24;
        margin: 24px 0 12px;
      }
      .viewer-content h4 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #94a3b8;
        margin: 20px 0 8px;
      }
      .viewer-content p {
        margin: 12px 0;
      }
      .viewer-content ul, .viewer-content ol {
        margin: 12px 0;
        padding-left: 24px;
      }
      .viewer-content li {
        margin: 8px 0;
      }
      .viewer-content strong {
        color: white;
      }
      .viewer-content hr {
        border: none;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        margin: 24px 0;
      }
      .viewer-content .form-template,
      .viewer-content .letter-template,
      .viewer-content .certificate-template {
        background: rgba(15, 23, 42, 0.5);
        padding: 24px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
      }

      /* Print styles */
      @media print {
        body * {
          visibility: hidden;
        }
        .content-viewer-modal,
        .content-viewer-modal * {
          visibility: visible;
        }
        .content-viewer-modal {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: auto;
          background: white;
        }
        .viewer-backdrop,
        .viewer-header,
        .viewer-nav {
          display: none !important;
        }
        .viewer-container {
          max-width: 100%;
          max-height: none;
          background: white;
          border: none;
          border-radius: 0;
        }
        .viewer-content {
          color: black;
          padding: 20px;
        }
        .viewer-content h2 {
          color: black;
          border-color: #333;
        }
        .viewer-content h3 {
          color: #333;
        }
        .viewer-content strong {
          color: black;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Ver recurso en modal
   */
  viewResource(resourceId) {
    const contentData = this.educatorsKit.content?.resources?.[resourceId];
    if (!contentData) {
      this.educatorsKit.showToast('Contenido no disponible todavia', 'warning');
      return;
    }

    this.openViewer(contentData, 'resource');
    this.educatorsKit.contentModule.trackView(resourceId, 'resource');
  }

  /**
   * Ver actividad en modal
   */
  viewActivity(activityId) {
    const contentData = this.educatorsKit.content?.activities?.[activityId];
    if (!contentData) {
      this.educatorsKit.showToast('Contenido no disponible todavia', 'warning');
      return;
    }

    this.openViewer(contentData, 'activity');
    this.educatorsKit.contentModule.trackView(activityId, 'activity');
  }

  /**
   * Abre el visor con el contenido
   */
  openViewer(contentData, _type) {
    if (!this.educatorsKit.viewerModal || !contentData) return;

    this.currentViewerContent = contentData;
    this.currentViewerPage = 0;

    // Actualizar titulo
    document.getElementById('viewer-title').textContent = contentData.title;
    document.getElementById('viewer-subtitle').textContent = contentData.subtitle || '';

    // Renderizar navegacion si hay multiples paginas
    const nav = document.getElementById('viewer-nav');
    if (contentData.pages && contentData.pages.length > 1) {
      nav.style.display = 'flex';
      nav.innerHTML = contentData.pages.map((page, index) => `
        <button class="viewer-nav-btn ${index === 0 ? 'active' : ''}"
                onclick="window.educatorsKit?.goToPage(${index})">
          ${page.title}
        </button>
      `).join('');
    } else {
      nav.style.display = 'none';
    }

    // Renderizar contenido
    this.renderViewerPage(0);

    // Mostrar modal
    this.educatorsKit.viewerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Renderiza una pagina del visor
   */
  renderViewerPage(pageIndex) {
    if (!this.currentViewerContent?.pages?.[pageIndex]) return;

    const page = this.currentViewerContent.pages[pageIndex];
    document.getElementById('viewer-content').innerHTML = page.content;

    // Actualizar navegacion activa
    const navBtns = document.querySelectorAll('.viewer-nav-btn');
    navBtns.forEach((btn, index) => {
      btn.classList.toggle('active', index === pageIndex);
    });

    this.currentViewerPage = pageIndex;
  }

  /**
   * Navega a una pagina especifica
   */
  goToPage(pageIndex) {
    this.renderViewerPage(pageIndex);
  }

  /**
   * Cierra el visor
   */
  closeViewer() {
    if (this.educatorsKit.viewerModal) {
      this.educatorsKit.viewerModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Imprime el contenido actual (para guardar como PDF)
   */
  printContent() {
    window.print();
  }

  /**
   * Descarga un recurso por ID
   */
  downloadResource(resourceId) {
    const resource = this.educatorsKit.resources.find(r => r.id === resourceId);
    const contentData = this.educatorsKit.content?.resources?.[resourceId];

    if (!resource) {
      logger.warn('[EducatorsKitViewer] Recurso no encontrado:', resourceId);
      this.educatorsKit.showToast('Recurso no disponible', 'warning');
      return;
    }

    if (!contentData) {
      this.educatorsKit.showToast('Este recurso estara disponible proximamente', 'info');
      return;
    }

    // Track descarga
    this.educatorsKit.contentModule.trackDownload(resourceId, 'resource');

    // Abrir visor para imprimir
    this.viewResource(resourceId);
    setTimeout(() => {
      this.educatorsKit.showToast('Usa Ctrl+P o el boton Imprimir para guardar como PDF', 'info');
    }, 500);
  }

  /**
   * Descarga una actividad por ID
   */
  downloadActivity(activityId) {
    const activity = this.educatorsKit.activities.find(a => a.id === activityId);
    const contentData = this.educatorsKit.content?.activities?.[activityId];

    if (!activity) {
      logger.warn('[EducatorsKitViewer] Actividad no encontrada:', activityId);
      this.educatorsKit.showToast('Actividad no disponible', 'warning');
      return;
    }

    if (!contentData) {
      this.educatorsKit.showToast('Esta actividad estara disponible proximamente', 'info');
      return;
    }

    // Track descarga
    this.educatorsKit.contentModule.trackDownload(activityId, 'activity');

    // Abrir visor para imprimir
    this.viewActivity(activityId);
    setTimeout(() => {
      this.educatorsKit.showToast('Usa Ctrl+P o el boton Imprimir para guardar como PDF', 'info');
    }, 500);
  }

  destroy() {
    this.currentViewerContent = null;
    this.currentViewerPage = 0;
  }
}

// Exportar globalmente
window.EducatorsKitViewer = EducatorsKitViewer;
