/**
 * ANALYTICS HELPER
 * Sistema centralizado de analytics con Google Analytics 4
 *
 * @version 1.0.0
 */

class AnalyticsHelper {
  constructor(config = {}) {
    this.measurementId = config.measurementId || null;
    // Solo habilitado si hay un ID válido configurado
    this.isEnabled = config.enabled !== false && this.measurementId && this.measurementId !== 'disabled';
    this.debug = config.debug || false;
    this.userId = null;

    if (this.isEnabled && this.measurementId) {
      this.initialize();
    } else {
      console.log('[Analytics] Deshabilitado - configure un ID de GA4 en Ajustes > General');
    }
  }

  /**
   * Inicializar Google Analytics 4
   */
  initialize() {
    // Verificar si ya está cargado
    if (window.gtag) {
      console.log('[Analytics] GA4 ya inicializado');
      return;
    }

    // Cargar script de GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Inicializar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.measurementId, {
      send_page_view: false, // Controlamos manualmente
      anonymize_ip: true,
      debug_mode: this.debug
    });

    console.log('[Analytics] GA4 inicializado con ID:', this.measurementId);
  }

  /**
   * Establecer ID de usuario para seguimiento
   */
  setUserId(userId) {
    if (!this.isEnabled || !window.gtag) return;

    this.userId = userId;
    window.gtag('set', { user_id: userId });
    console.log('[Analytics] User ID establecido:', userId);
  }

  /**
   * Establecer propiedades de usuario
   */
  setUserProperties(properties) {
    if (!this.isEnabled || !window.gtag) return;

    window.gtag('set', 'user_properties', properties);
    console.log('[Analytics] User properties:', properties);
  }

  /**
   * Registrar evento genérico
   */
  trackEvent(eventName, parameters = {}) {
    if (!this.isEnabled) return;

    if (this.debug) {
      console.log('[Analytics] Event:', eventName, parameters);
    }

    if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  }

  // ==========================================================================
  // EVENTOS DE NAVEGACIÓN
  // ==========================================================================

  trackPageView(pageName, additionalParams = {}) {
    this.trackEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
      ...additionalParams
    });
  }

  trackScreenView(screenName, screenClass = 'general') {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass
    });
  }

  // ==========================================================================
  // EVENTOS DE USUARIO
  // ==========================================================================

  trackSignUp(method = 'email') {
    this.trackEvent('sign_up', {
      method: method
    });
  }

  trackLogin(method = 'email') {
    this.trackEvent('login', {
      method: method
    });
  }

  trackLogout() {
    this.trackEvent('logout');
  }

  // ==========================================================================
  // EVENTOS DE LECTURA
  // ==========================================================================

  trackBookOpen(bookId, bookTitle) {
    this.trackEvent('book_open', {
      book_id: bookId,
      book_title: bookTitle,
      content_type: 'book'
    });
  }

  trackChapterStart(bookId, chapterId, chapterTitle) {
    this.trackEvent('chapter_start', {
      book_id: bookId,
      chapter_id: chapterId,
      chapter_title: chapterTitle,
      content_type: 'chapter'
    });
  }

  trackChapterComplete(bookId, chapterId, timeSpent) {
    this.trackEvent('chapter_complete', {
      book_id: bookId,
      chapter_id: chapterId,
      time_spent_seconds: timeSpent,
      content_type: 'chapter'
    });
  }

  trackReadingTime(bookId, chapterId, duration) {
    this.trackEvent('reading_time', {
      book_id: bookId,
      chapter_id: chapterId,
      duration_seconds: duration,
      engagement_type: 'reading'
    });
  }

  // ==========================================================================
  // EVENTOS DE IA
  // ==========================================================================

  trackAIChatOpen() {
    this.trackEvent('ai_chat_open', {
      feature: 'ai_chat'
    });
  }

  trackAIChatMessage(messageCount, model = 'unknown') {
    this.trackEvent('ai_chat_message', {
      message_count: messageCount,
      model: model,
      feature: 'ai_chat'
    });
  }

  trackTextSelection(action) {
    // action: 'explain', 'define', 'deepen', 'summarize', 'ask'
    this.trackEvent('text_selection_action', {
      action: action,
      feature: 'text_selection'
    });
  }

  // ==========================================================================
  // EVENTOS DE AUDIO
  // ==========================================================================

  trackAudioStart(bookId, chapterId) {
    this.trackEvent('audio_start', {
      book_id: bookId,
      chapter_id: chapterId,
      feature: 'audioreader'
    });
  }

  trackAudioComplete(bookId, chapterId, duration) {
    this.trackEvent('audio_complete', {
      book_id: bookId,
      chapter_id: chapterId,
      duration_seconds: duration,
      feature: 'audioreader'
    });
  }

  // ==========================================================================
  // EVENTOS DE CONVERSIÓN
  // ==========================================================================

  trackPurchase(transactionId, plan, value, currency = 'EUR') {
    this.trackEvent('purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: [{
        item_id: plan,
        item_name: `Plan ${plan}`,
        item_category: 'subscription'
      }]
    });
  }

  trackBeginCheckout(plan, value, currency = 'EUR') {
    this.trackEvent('begin_checkout', {
      value: value,
      currency: currency,
      items: [{
        item_id: plan,
        item_name: `Plan ${plan}`,
        item_category: 'subscription'
      }]
    });
  }

  trackSubscriptionUpgrade(fromPlan, toPlan) {
    this.trackEvent('subscription_upgrade', {
      from_plan: fromPlan,
      to_plan: toPlan,
      conversion_type: 'upgrade'
    });
  }

  // ==========================================================================
  // EVENTOS DE ENGAGEMENT
  // ==========================================================================

  trackBookmark(bookId, chapterId) {
    this.trackEvent('bookmark_add', {
      book_id: bookId,
      chapter_id: chapterId,
      feature: 'bookmarks'
    });
  }

  trackNote(bookId, chapterId, noteType = 'text') {
    this.trackEvent('note_create', {
      book_id: bookId,
      chapter_id: chapterId,
      note_type: noteType,
      feature: 'notes'
    });
  }

  trackShare(method, contentType, contentId) {
    this.trackEvent('share', {
      method: method,
      content_type: contentType,
      content_id: contentId
    });
  }

  trackSearch(searchTerm, resultsCount) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  // ==========================================================================
  // EVENTOS DE FRANKENSTEIN LAB
  // ==========================================================================

  trackLabOpen() {
    this.trackEvent('lab_open', {
      feature: 'frankenstein_lab'
    });
  }

  trackMissionStart(missionId, missionTitle) {
    this.trackEvent('mission_start', {
      mission_id: missionId,
      mission_title: missionTitle,
      feature: 'frankenstein_lab'
    });
  }

  trackMissionComplete(missionId, score, timeSpent) {
    this.trackEvent('mission_complete', {
      mission_id: missionId,
      score: score,
      time_spent_seconds: timeSpent,
      feature: 'frankenstein_lab'
    });
  }

  trackLevelUp(newLevel, xpTotal) {
    this.trackEvent('level_up', {
      level: newLevel,
      xp_total: xpTotal,
      feature: 'frankenstein_lab'
    });
  }

  // ==========================================================================
  // EVENTOS DE ERRORES
  // ==========================================================================

  trackError(errorType, errorMessage, location = '') {
    this.trackEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: location,
      fatal: false
    });
  }

  trackFatalError(errorType, errorMessage, stackTrace = '') {
    this.trackEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage,
      stack_trace: stackTrace,
      fatal: true
    });
  }

  // ==========================================================================
  // EVENTOS DE ONBOARDING
  // ==========================================================================

  trackTutorialStart() {
    this.trackEvent('tutorial_begin');
  }

  trackTutorialComplete() {
    this.trackEvent('tutorial_complete');
  }

  trackTutorialSkip(stepNumber) {
    this.trackEvent('tutorial_skip', {
      step_number: stepNumber
    });
  }

  // ==========================================================================
  // TIMING EVENTS
  // ==========================================================================

  trackTiming(category, variable, value, label = '') {
    this.trackEvent('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_value: value,
      timing_label: label
    });
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Deshabilitar analytics (GDPR compliance)
   */
  disable() {
    this.isEnabled = false;
    console.log('[Analytics] Analytics deshabilitado');
  }

  /**
   * Habilitar analytics
   */
  enable() {
    if (!this.isEnabled) {
      this.isEnabled = true;
      this.initialize();
      console.log('[Analytics] Analytics habilitado');
    }
  }

  /**
   * Obtener estado del sistema
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      initialized: !!window.gtag,
      measurementId: this.measurementId,
      userId: this.userId,
      debug: this.debug
    };
  }
}

// Exportar globalmente
window.AnalyticsHelper = AnalyticsHelper;
