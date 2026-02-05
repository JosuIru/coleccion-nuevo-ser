// ============================================================================
// INTERNATIONALIZATION (i18n) - Sistema de Traducciones
// ============================================================================

class I18n {
  constructor() {
    this.currentLang = this.loadLanguage();
    this.translations = {
      es: {
        // Navigation
        'nav.library': 'Biblioteca',
        'nav.back': 'Volver',
        'nav.prev': 'Anterior',
        'nav.next': 'Siguiente',

        // Library
        'library.title': 'Colección Nuevo Ser',
        'library.tagline': 'Una colección interactiva co-creada entre humano e IA para explorar la conciencia, la meditación, el activismo y la transformación social. Combina reflexión profunda con prácticas, ejercicios y herramientas de apoyo para acompañarte en tu proceso de cambio personal y colectivo.',
        'library.search': 'Filtrar libros... (Enter: buscar en contenido)',
        'library.allCategories': 'Todas las categorías',
        'library.continue': 'Continuar',
        'library.start': 'Comenzar',
        'library.chapters': 'capítulos',
        'library.totalChapters': 'capítulos totales',
        'library.comingSoon': 'Próximamente',
        'library.tools': 'Herramientas y Aplicaciones',
        'library.progress': 'Tu Progreso Global',
        'library.chaptersRead': 'Capítulos leídos',
        'library.booksStarted': 'Libros iniciados',
        'library.booksCompleted': 'Libros completados',
        'library.totalTime': 'Tiempo total',
        'library.published': 'Publicado',
        'library.inProgress': 'En progreso',
        'library.notStarted': 'No iniciado',
        'library.completed': 'Completado',

        // Reader
        'reader.chapter': 'Capítulo',
        'reader.loading': 'Cargando',
        'reader.bookmark': 'Marcador',
        'reader.notes': 'Notas',
        'reader.chat': 'Chat IA',
        'reader.timeline': 'Timeline Histórico',
        'reader.resources': 'Recursos',
        'reader.audio': 'Narración',
        'reader.markRead': 'Marcar como leído',
        'reader.markUnread': 'Desmarcar como leído',
        'reader.chapterComplete': '¡Capítulo completado!',

        // Buttons
        'btn.download': 'Descargar Android',
        'btn.aiSettings': 'Configurar IA',
        'btn.support': 'Apoyar',
        'btn.close': 'Cerrar',
        'btn.save': 'Guardar',
        'btn.cancel': 'Cancelar',
        'btn.export': 'Exportar',
        'btn.delete': 'Eliminar',
        'btn.edit': 'Editar',
        'btn.language': 'Idioma',
        'btn.retry': 'Reintentar',

        // AI Settings
        'ai.title': 'Configuración de IA',
        'ai.provider': 'Proveedor de IA',
        'ai.apiKey': 'API Key',
        'ai.getKey': 'Obtener API Key',
        'ai.status': 'Estado Actual',
        'ai.configured': 'Configurado',
        'ai.notConfigured': 'No configurado',
        'ai.localMode': 'Modo Local',
        'ai.localInfo': 'Este modo proporciona respuestas predefinidas sin usar IA real.',

        // Donations
        'donate.title': 'Apoyar el Proyecto',
        'donate.intro': 'Este proyecto es 100% gratuito y de código abierto.',
        'donate.helpText': 'Si te ha sido útil y quieres apoyar su desarrollo:',
        'donate.coffee': 'Invítame a un café',
        'donate.direct': 'Donación directa',
        'donate.monthly': 'Apoyo mensual',
        'donate.otherWays': 'Otras formas de ayudar',
        'donate.thanks': '¡Gracias!',
        'donate.thanksText': 'Tu apoyo hace posible que este proyecto siga creciendo.',

        // Notes
        'notes.title': 'Notas Personales',
        'notes.add': 'Agregar Nota',
        'notes.viewAll': 'Ver todas',
        'notes.empty': 'No hay notas para este capítulo',
        'notes.placeholder': 'Escribe tu nota aquí... (Soporta Markdown)',
        'notes.writeBelow': 'Escribe tu nota a continuación',
        'notes.saveNote': 'Guardar Nota',

        // Audio
        'audio.play': 'Reproducir',
        'audio.pause': 'Pausar',
        'audio.stop': 'Detener',
        'audio.speed': 'Velocidad',
        'audio.voice': 'Voz',
        'audio.autoAdvance': 'Auto-avance',

        // TTS Premium
        'tts.premium': 'Voz Premium',
        'tts.premium.active': 'Usando voz premium',
        'tts.premium.inactive': 'Voz del navegador',
        'tts.premium.notConfigured': 'Configura voz premium en Ajustes',
        'tts.premium.testing': 'Probando voz...',
        'tts.premium.testSuccess': '¡Voz premium funcionando correctamente!',
        'tts.premium.testError': 'Error al probar voz',
        'tts.premium.noCredits': 'Sin créditos. Añade saldo a tu cuenta OpenAI',
        'tts.premium.invalidKey': 'API Key inválida o expirada',
        'tts.premium.rateLimit': 'Límite de uso alcanzado. Intenta más tarde',
        'tts.premium.generating': 'Generando audio...',
        'tts.premium.cached': 'Audio cacheado',

        // Messages
        'msg.loading': 'Cargando...',
        'msg.error': 'Error',
        'msg.success': 'Éxito',
        'msg.saved': 'Guardado correctamente',

        // Menu
        'menu.title': 'Menú',
        'menu.open': 'Abrir menú',
        'menu.close': 'Cerrar menú',
        'menu.more': 'Más opciones',

        // Errors
        'error.chatNotAvailable': 'Chat IA no disponible',
        'error.notesNotAvailable': 'Notas no disponibles',
        'error.koanNotAvailable': 'Koan no disponible',
        'error.binauralNotAvailable': 'Audio Binaural no disponible',
        'error.timelineNotAvailable': 'Timeline no disponible',
        'error.resourcesNotAvailable': 'Recursos no disponibles',
        'error.audioreaderNotAvailable': 'Narración no disponible',
        'error.openBook': 'Error al abrir libro',
        'error.invalidApiKey': 'Por favor, ingresa una API key válida',
        'error.noAudioGuided': 'Esta práctica no tiene meditación guiada de audio',
        'error.moduleNotLoaded': 'Verifica que el módulo esté cargado',

        // Features
        'feature.comingSoon': 'Próximamente',
        'feature.crossReference': 'Navegación entre libros próximamente',

        // Koans
        'koan.title': 'Koan de Contemplación',
        'koan.theme': 'Tema',
        'koan.hint': 'Pista',
        'koan.howTo': 'Cómo contemplar este koan',
        'koan.newKoan': 'Otro Koan',
        'koan.instruction1': '1. Lee el koan lentamente, tres veces',
        'koan.instruction2': '2. Siéntate en silencio con la pregunta',
        'koan.instruction3': '3. No busques responder, deja que la pregunta te habite',
        'koan.instruction4': '4. Observa qué surge sin juzgar',
        'koan.instruction5': '5. La pregunta es el camino',

        // Binaural Audio
        'binaural.title': 'Audio Binaural',
        'binaural.selectState': 'Selecciona un estado mental',
        'binaural.duration': 'Duración',
        'binaural.minutes': 'minutos',
        'binaural.play': 'Reproducir',
        'binaural.stop': 'Detener',
        'binaural.playing': 'Reproduciendo',
        'binaural.stopped': 'Detenido',
        'binaural.started': 'Audio binaural iniciado',
        'binaural.for': 'para',
        'binaural.error': 'Error al reproducir audio',
        'binaural.useHeadphones': 'IMPORTANTE: Usa auriculares para mejor efecto',

        // Reader - Additional
        'reader.manualPractico': 'Manual Práctico',
        'reader.practicasRadicales': 'Prácticas Radicales',
        'reader.koan': 'Koan de Contemplación',
        'reader.binaural': 'Audio Binaural',

        // Language
        'lang.title': 'Idioma / Language',
        'lang.select': 'Selecciona tu idioma',
        'lang.changed': 'Idioma cambiado',
        'lang.current': 'Idioma actual',

        // Chat
        'chat.title': 'Chat con IA',
        'chat.askAbout': 'Pregunta sobre el capítulo actual',
        'chat.placeholder': 'Escribe tu pregunta...',
        'chat.send': 'Enviar',
        'chat.clear': 'Limpiar conversación',
        'chat.export': 'Exportar conversación',
        'chat.mode': 'Modo',
        'chat.notConfigured': 'IA no configurada. Configura tu API key en el menú de configuración.',
        'chat.noApiKey': 'Sin API Key configurada',
        'chat.configure': 'Configurar',
        'chat.configureNow': 'Configurar ahora',
        'chat.thinking': 'Pensando...',

        // Progress & Stats
        'progress.of': 'de',
        'progress.read': 'leído',
        'progress.completed': 'completado',

        // Mobile Menu
        'menu.open': 'Abrir menú',
        'menu.title': 'Menú',

        // Errors
        'error.loadLibrary': 'Error al cargar la biblioteca',
        'error.openBook': 'Error al abrir el libro',

        // Loading
        'loading.loadingBook': 'Cargando libro...',

        // Premium Edition
        'premium.title': 'Edición Premium Digital',
        'premium.description': 'Descarga el libro completo en formato HTML elegante',
        'premium.features': 'Ideal para leer sin conexión, imprimir o convertir a PDF. Incluye todos los capítulos, ejercicios y contenido completo con diseño profesional.',
        'premium.download': 'Descargar Edición Premium',
        'premium.contribution': 'Contribución sugerida',
        'premium.optional': '100% opcional',
        'premium.free': 'Gratis',
        'premium.downloadFree': 'Descargar Gratis',
        'premium.whatIncludes': '¿Qué incluye la edición premium?',
        'premium.feature1': 'Libro completo en HTML elegante y profesional',
        'premium.feature2': 'Todos los capítulos, ejercicios prácticos y reflexiones',
        'premium.feature3': 'Optimizado para lectura offline y conversión a PDF',
        'premium.feature4': 'Diseño limpio ideal para impresión o archivo personal',
        'premium.suggestedContribution': 'Contribución Sugerida',
        'premium.contributionText': 'Este libro es completamente gratuito y siempre lo será. Si te ha aportado valor, considera hacer una contribución voluntaria de <strong class="text-amber-300">15€</strong> para apoyar el proyecto.',
        'premium.supportText': 'Tu apoyo me permite seguir creando contenido de calidad y mantener este proyecto libre y accesible para todos.',
        'premium.contributePaypal': 'Contribuir 15€ con PayPal',
        'premium.freeNote': 'La descarga es completamente gratuita. La contribución es 100% voluntaria.',

        // Resources
        'resources.title': 'Recursos Complementarios',
        'resources.forChapter': 'Recursos para este capítulo',
        'resources.all': 'Todos',
        'resources.organizations': 'Organizaciones',
        'resources.books': 'Libros',
        'resources.tools': 'Herramientas',
        'resources.documentaries': 'Documentales',
        'resources.podcasts': 'Podcasts',
        'resources.noResources': 'No hay recursos disponibles para este capítulo',
        'resources.visitWebsite': 'Visitar Sitio Web',
        'resources.viewResource': 'Ver Recurso',
        'resources.favorite': 'Favorito',
        'resources.unfavorite': 'Quitar de favoritos',
        'resources.favorites': 'Favoritos',
        'resources.location': 'Ubicación',
        'resources.author': 'Autor',
        'resources.year': 'Año',
        'resources.duration': 'Duración',
        'resources.episodes': 'episodios',
        'resources.resourcesAvailable': 'recursos disponibles',
        'resources.noResourcesAvailable': 'No hay recursos disponibles para este libro',
        'resources.noResourcesInCategory': 'No hay recursos en esta categoría',
        'resources.noResourcesForChapter': 'No hay recursos específicos para este capítulo',
        'resources.whyRead': 'Por qué leer',
        'resources.readOnline': 'Leer Online',
        'resources.useFor': 'Para qué usar',
        'resources.tryTool': 'Probar Herramienta',
        'resources.whyWatch': 'Por qué ver',
        'resources.listen': 'Escuchar',
        'resources.addedToFavorites': 'Añadido a favoritos',
        'resources.removedFromFavorites': 'Eliminado de favoritos',

        // Actions
        'actions.nextSteps': 'Próximas Acciones',
        'actions.takeQuiz': 'Quiz Interactivo',
        'actions.quizDescription': 'Pon a prueba tu comprensión',
        'actions.practicalExercise': 'Ejercicio Práctico',
        'actions.exercisesAvailable': 'ejercicios disponibles',
        'actions.resourcesDescription': 'Organizaciones, libros y herramientas',
        'actions.personalReflection': 'Reflexión Personal',
        'actions.reflectionDescription': '¿Cómo aplicarías esto?',
        'actions.start': 'Comenzar',
        'actions.view': 'Ver',
        'actions.explore': 'Explorar',
        'actions.reflect': 'Reflexionar',
      },

      en: {
        // Navigation
        'nav.library': 'Library',
        'nav.back': 'Back',
        'nav.prev': 'Previous',
        'nav.next': 'Next',

        // Library
        'library.title': 'New Being Collection',
        'library.tagline': 'Explorations at the Frontier of Human-AI Thought',
        'library.search': 'Filter books... (Enter: search in content)',
        'library.allCategories': 'All categories',
        'library.continue': 'Continue',
        'library.start': 'Start',
        'library.chapters': 'chapters',
        'library.totalChapters': 'total chapters',
        'library.comingSoon': 'Coming Soon',
        'library.tools': 'Tools & Applications',
        'library.progress': 'Your Global Progress',
        'library.chaptersRead': 'Chapters read',
        'library.booksStarted': 'Books started',
        'library.booksCompleted': 'Books completed',
        'library.totalTime': 'Total time',
        'library.published': 'Published',
        'library.inProgress': 'In progress',
        'library.notStarted': 'Not started',
        'library.completed': 'Completed',

        // Reader
        'reader.chapter': 'Chapter',
        'reader.loading': 'Loading',
        'reader.bookmark': 'Bookmark',
        'reader.notes': 'Notes',
        'reader.chat': 'AI Chat',
        'reader.timeline': 'Historical Timeline',
        'reader.resources': 'Resources',
        'reader.audio': 'Narration',
        'reader.markRead': 'Mark as read',
        'reader.markUnread': 'Mark as unread',
        'reader.chapterComplete': 'Chapter complete!',

        // Buttons
        'btn.download': 'Download Android',
        'btn.aiSettings': 'AI Settings',
        'btn.support': 'Support',
        'btn.close': 'Close',
        'btn.save': 'Save',
        'btn.cancel': 'Cancel',
        'btn.export': 'Export',
        'btn.delete': 'Delete',
        'btn.edit': 'Edit',
        'btn.language': 'Language',
        'btn.retry': 'Retry',

        // AI Settings
        'ai.title': 'AI Configuration',
        'ai.provider': 'AI Provider',
        'ai.apiKey': 'API Key',
        'ai.getKey': 'Get API Key',
        'ai.status': 'Current Status',
        'ai.configured': 'Configured',
        'ai.notConfigured': 'Not configured',
        'ai.localMode': 'Local Mode',
        'ai.localInfo': 'This mode provides predefined responses without using real AI.',

        // Donations
        'donate.title': 'Support the Project',
        'donate.intro': 'This project is 100% free and open source.',
        'donate.helpText': 'If you found it useful and want to support its development:',
        'donate.coffee': 'Buy me a coffee',
        'donate.direct': 'Direct donation',
        'donate.monthly': 'Monthly support',
        'donate.otherWays': 'Other ways to help',
        'donate.thanks': 'Thank you!',
        'donate.thanksText': 'Your support makes this project possible.',

        // Notes
        'notes.title': 'Personal Notes',
        'notes.add': 'Add Note',
        'notes.viewAll': 'View all',
        'notes.empty': 'No notes for this chapter',
        'notes.placeholder': 'Write your note here... (Markdown supported)',
        'notes.writeBelow': 'Write your note below',
        'notes.saveNote': 'Save Note',

        // Audio
        'audio.play': 'Play',
        'audio.pause': 'Pause',
        'audio.stop': 'Stop',
        'audio.speed': 'Speed',
        'audio.voice': 'Voice',
        'audio.autoAdvance': 'Auto-advance',

        // TTS Premium
        'tts.premium': 'Premium Voice',
        'tts.premium.active': 'Using premium voice',
        'tts.premium.inactive': 'Browser voice',
        'tts.premium.notConfigured': 'Configure premium voice in Settings',
        'tts.premium.testing': 'Testing voice...',
        'tts.premium.testSuccess': 'Premium voice working correctly!',
        'tts.premium.testError': 'Error testing voice',
        'tts.premium.noCredits': 'No credits. Add balance to your OpenAI account',
        'tts.premium.invalidKey': 'Invalid or expired API Key',
        'tts.premium.rateLimit': 'Rate limit reached. Try again later',
        'tts.premium.generating': 'Generating audio...',
        'tts.premium.cached': 'Cached audio',

        // Messages
        'msg.loading': 'Loading...',
        'msg.error': 'Error',
        'msg.success': 'Success',
        'msg.saved': 'Saved successfully',

        // Menu
        'menu.title': 'Menu',
        'menu.open': 'Open menu',
        'menu.close': 'Close menu',
        'menu.more': 'More options',

        // Errors
        'error.chatNotAvailable': 'AI Chat not available',
        'error.notesNotAvailable': 'Notes not available',
        'error.koanNotAvailable': 'Koan not available',
        'error.binauralNotAvailable': 'Binaural Audio not available',
        'error.timelineNotAvailable': 'Timeline not available',
        'error.resourcesNotAvailable': 'Resources not available',
        'error.audioreaderNotAvailable': 'Narration not available',
        'error.openBook': 'Error opening book',
        'error.invalidApiKey': 'Please enter a valid API key',
        'error.noAudioGuided': 'This practice has no guided audio meditation',
        'error.moduleNotLoaded': 'Verify that the module is loaded',

        // Features
        'feature.comingSoon': 'Coming Soon',
        'feature.crossReference': 'Cross-book navigation coming soon',

        // Koans
        'koan.title': 'Contemplation Koan',
        'koan.theme': 'Theme',
        'koan.hint': 'Hint',
        'koan.howTo': 'How to contemplate this koan',
        'koan.newKoan': 'Another Koan',
        'koan.instruction1': '1. Read the koan slowly, three times',
        'koan.instruction2': '2. Sit in silence with the question',
        'koan.instruction3': '3. Don\'t seek to answer, let the question inhabit you',
        'koan.instruction4': '4. Observe what arises without judging',
        'koan.instruction5': '5. The question is the way',

        // Binaural Audio
        'binaural.title': 'Binaural Audio',
        'binaural.selectState': 'Select a mental state',
        'binaural.duration': 'Duration',
        'binaural.minutes': 'minutes',
        'binaural.play': 'Play',
        'binaural.stop': 'Stop',
        'binaural.playing': 'Playing',
        'binaural.stopped': 'Stopped',
        'binaural.started': 'Binaural audio started',
        'binaural.for': 'for',
        'binaural.error': 'Error playing audio',
        'binaural.useHeadphones': 'IMPORTANT: Use headphones for best effect',

        // Reader - Additional
        'reader.manualPractico': 'Practical Manual',
        'reader.practicasRadicales': 'Radical Practices',
        'reader.koan': 'Contemplation Koan',
        'reader.binaural': 'Binaural Audio',

        // Language
        'lang.title': 'Language / Idioma',
        'lang.select': 'Select your language',
        'lang.changed': 'Language changed',
        'lang.current': 'Current language',

        // Chat
        'chat.title': 'AI Chat',
        'chat.askAbout': 'Ask about the current chapter',
        'chat.placeholder': 'Type your question...',
        'chat.send': 'Send',
        'chat.clear': 'Clear conversation',
        'chat.export': 'Export conversation',
        'chat.mode': 'Mode',
        'chat.notConfigured': 'AI not configured. Set up your API key in the configuration menu.',
        'chat.noApiKey': 'No API Key configured',
        'chat.configure': 'Configure',
        'chat.configureNow': 'Configure now',
        'chat.thinking': 'Thinking...',

        // Progress & Stats
        'progress.of': 'of',
        'progress.read': 'read',
        'progress.completed': 'completed',

        // Mobile Menu
        'menu.open': 'Open menu',
        'menu.title': 'Menu',

        // Errors
        'error.loadLibrary': 'Error loading library',
        'error.openBook': 'Error opening book',

        // Loading
        'loading.loadingBook': 'Loading book...',

        // Premium Edition
        'premium.title': 'Premium Digital Edition',
        'premium.description': 'Download the complete book in elegant HTML format',
        'premium.features': 'Perfect for offline reading, printing, or converting to PDF. Includes all chapters, exercises, and complete content with professional design.',
        'premium.download': 'Download Premium Edition',
        'premium.contribution': 'Suggested contribution',
        'premium.optional': '100% optional',
        'premium.free': 'Free',
        'premium.downloadFree': 'Download Free',
        'premium.whatIncludes': 'What does the premium edition include?',
        'premium.feature1': 'Complete book in elegant, professional HTML',
        'premium.feature2': 'All chapters, practical exercises, and reflections',
        'premium.feature3': 'Optimized for offline reading and PDF conversion',
        'premium.feature4': 'Clean design ideal for printing or personal archive',
        'premium.suggestedContribution': 'Suggested Contribution',
        'premium.contributionText': 'This book is completely free and always will be. If it has brought you value, consider making a voluntary contribution of <strong class="text-amber-300">15€</strong> to support the project.',
        'premium.supportText': 'Your support allows me to keep creating quality content and keep this project free and accessible for everyone.',
        'premium.contributePaypal': 'Contribute 15€ via PayPal',
        'premium.freeNote': 'The download is completely free. The contribution is 100% voluntary.',

        // Resources
        'resources.title': 'Complementary Resources',
        'resources.forChapter': 'Resources for this chapter',
        'resources.all': 'All',
        'resources.organizations': 'Organizations',
        'resources.books': 'Books',
        'resources.tools': 'Tools',
        'resources.documentaries': 'Documentaries',
        'resources.podcasts': 'Podcasts',
        'resources.noResources': 'No resources available for this chapter',
        'resources.visitWebsite': 'Visit Website',
        'resources.viewResource': 'View Resource',
        'resources.favorite': 'Favorite',
        'resources.unfavorite': 'Remove from favorites',
        'resources.favorites': 'Favorites',
        'resources.location': 'Location',
        'resources.author': 'Author',
        'resources.year': 'Year',
        'resources.duration': 'Duration',
        'resources.episodes': 'episodes',
        'resources.resourcesAvailable': 'resources available',
        'resources.noResourcesAvailable': 'No resources available for this book',
        'resources.noResourcesInCategory': 'No resources in this category',
        'resources.noResourcesForChapter': 'No specific resources for this chapter',
        'resources.whyRead': 'Why read',
        'resources.readOnline': 'Read Online',
        'resources.useFor': 'What to use for',
        'resources.tryTool': 'Try Tool',
        'resources.whyWatch': 'Why watch',
        'resources.listen': 'Listen',
        'resources.addedToFavorites': 'Added to favorites',
        'resources.removedFromFavorites': 'Removed from favorites',

        // Actions
        'actions.nextSteps': 'Next Steps',
        'actions.takeQuiz': 'Interactive Quiz',
        'actions.quizDescription': 'Test your understanding',
        'actions.practicalExercise': 'Practical Exercise',
        'actions.exercisesAvailable': 'exercises available',
        'actions.resourcesDescription': 'Organizations, books and tools',
        'actions.personalReflection': 'Personal Reflection',
        'actions.reflectionDescription': 'How would you apply this?',
        'actions.start': 'Start',
        'actions.view': 'View',
        'actions.explore': 'Explore',
        'actions.reflect': 'Reflect',
      }
    };
  }

  // Load saved language from localStorage
  loadLanguage() {
    const saved = localStorage.getItem('app_language');
    if (saved && (saved === 'es' || saved === 'en')) {
      return saved;
    }

    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('es') ? 'es' : 'en';
  }

  // Save language preference
  setLanguage(lang) {
    if (lang !== 'es' && lang !== 'en') {
      // logger.warn('Invalid language:', lang);
      return false;
    }

    this.currentLang = lang;
    localStorage.setItem('app_language', lang);

    // Trigger reload to apply language
    if (window.bookEngine && window.biblioteca) {
      window.biblioteca?.render();
      window.biblioteca?.attachEventListeners();
    }

    return true;
  }

  // Get current language
  getLanguage() {
    return this.currentLang;
  }

  // Translate a key
  t(key, fallback = null) {
    const translation = this.translations[this.currentLang]?.[key];

    if (translation) {
      return translation;
    }

    // Fallback to Spanish if English not found
    if (this.currentLang === 'en') {
      const spanishTranslation = this.translations.es[key];
      if (spanishTranslation) {
        return spanishTranslation;
      }
    }

    // Return fallback or key
    return fallback || key;
  }

  // Get language name
  getLanguageName(lang) {
    const names = {
      'es': 'Español',
      'en': 'English'
    };
    return names[lang] || lang;
  }

  // Get available languages
  getAvailableLanguages() {
    return [
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'en', name: 'English', flag: '🇬🇧' }
    ];
  }
}

// Make global
window.I18n = I18n;
