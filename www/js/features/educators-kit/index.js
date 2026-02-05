/**
 * Educators Kit - Kit para Educadores (Coordinador Principal)
 * Gestiona recursos educativos, visualizacion y descargas
 * @version 2.0.0
 *
 * Modulos:
 *   - EducatorsKitContent      - Datos y recursos
 *   - EducatorsKitViewer       - Visor de contenido
 *   - EducatorsKitActivities   - Actividades por edad
 *   - EducatorsKitAIGenerator  - Generador IA de recursos
 */

class EducatorsKit {
  constructor() {
    this.resources = [];
    this.activities = [];
    this.content = null;
    this.currentAgeFilter = 'primaria';
    this.downloadHistory = [];
    this.viewerModal = null;

    // Configuracion de recursos
    this.resourcesConfig = {
      basePath: './assets',
      contentPath: './assets/content.json'
    };

    // Inicializar modulos
    this.contentModule = new (window.EducatorsKitContent || EducatorsKitContent)(this);
    this.viewerModule = new (window.EducatorsKitViewer || EducatorsKitViewer)(this);
    this.activitiesModule = new (window.EducatorsKitActivities || EducatorsKitActivities)(this);
    this.aiGeneratorModule = new (window.EducatorsKitAIGenerator || EducatorsKitAIGenerator)(this);
  }

  /**
   * Inicializa el Kit de Educadores
   */
  async init() {
    try {
      await this.contentModule.loadContent();
      await this.contentModule.loadResources();
      this.contentModule.loadDownloadHistory();
      this.viewerModule.createViewerModal();
      this.activitiesModule.setupEventListeners();
      this.activitiesModule.renderActivities(this.currentAgeFilter);
      logger.log('[EducatorsKit] Inicializado correctamente v2.0 (modular)');
    } catch (error) {
      logger.error('[EducatorsKit] Error al inicializar:', error);
    }
  }

  // ==========================================================================
  // METODOS DELEGADOS - Content Module
  // ==========================================================================

  getDownloadStats() {
    return this.contentModule.getDownloadStats();
  }

  // ==========================================================================
  // METODOS DELEGADOS - Viewer Module
  // ==========================================================================

  viewResource(resourceId) {
    this.viewerModule.viewResource(resourceId);
  }

  viewActivity(activityId) {
    this.viewerModule.viewActivity(activityId);
  }

  openViewer(contentData, type) {
    this.viewerModule.openViewer(contentData, type);
  }

  goToPage(pageIndex) {
    this.viewerModule.goToPage(pageIndex);
  }

  closeViewer() {
    this.viewerModule.closeViewer();
  }

  printContent() {
    this.viewerModule.printContent();
  }

  downloadResource(resourceId) {
    this.viewerModule.downloadResource(resourceId);
  }

  downloadActivity(activityId) {
    this.viewerModule.downloadActivity(activityId);
  }

  // ==========================================================================
  // METODOS DELEGADOS - Activities Module
  // ==========================================================================

  setAgeFilter(age) {
    this.activitiesModule.setAgeFilter(age);
  }

  renderActivities(age) {
    this.activitiesModule.renderActivities(age);
  }

  // ==========================================================================
  // METODOS DELEGADOS - AI Generator Module
  // ==========================================================================

  openAIGenerator() {
    this.aiGeneratorModule.openAIGenerator();
  }

  selectOption(button, fieldName) {
    this.aiGeneratorModule.selectOption(button, fieldName);
  }

  generateResource(event) {
    this.aiGeneratorModule.generateResource(event);
  }

  resetAIGenerator() {
    this.aiGeneratorModule.resetAIGenerator();
  }

  closeAIGenerator() {
    this.aiGeneratorModule.closeAIGenerator();
  }

  copyGeneratedResource() {
    this.aiGeneratorModule.copyGeneratedResource();
  }

  printGeneratedResource() {
    this.aiGeneratorModule.printGeneratedResource();
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Muestra un toast/notificacion
   */
  showToast(message, type = 'info') {
    if (window.toast) {
      const icons = {
        info: '📘',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };
      window.toast.show(`${icons[type]} ${message}`, type, 4000);
      return;
    }

    // Fallback: crear toast simple
    const existingToast = document.querySelector('.edu-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'edu-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 12px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    if (this.contentModule) this.contentModule.destroy();
    if (this.viewerModule) this.viewerModule.destroy();
    if (this.activitiesModule) this.activitiesModule.destroy();
    if (this.aiGeneratorModule) this.aiGeneratorModule.destroy();

    logger.log('[EducatorsKit] Destruido');
  }
}

// Exportar para uso global
window.EducatorsKit = EducatorsKit;
