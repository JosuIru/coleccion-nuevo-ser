/**
 * Content Adapter - Herramienta IA para adaptar contenido de capítulos
 *
 * Permite adaptar el contenido a diferentes audiencias y estilos:
 * - Por edad: niños (8-12), jóvenes (13-17), adultos
 * - Por enfoque: técnico, reflexivo, práctico, coloquial, dormir, historia
 *
 * Usa sistema híbrido: cache local + IA en tiempo real
 *
 * @version 2.9.388 - Timeout IA 60s, validación respuestas, optimización móvil, nuevos estilos
 */

class ContentAdapter {
  constructor() {
    this.bookEngine = null;
    this.aiAdapter = null;
    this.currentBookId = null;
    this.currentChapterId = null;
    this.originalContent = null;      // Texto plano para IA
    this.originalHtmlContent = null;  // HTML para restaurar vista
    this.isAdapted = false;
    this.currentAgeStyle = 'adultos';
    this.currentFocusStyle = 'original';
    this.selectorVisible = false;

    // Configuración de cache
    this.CACHE_PREFIX = 'content_adaptation_';
    this.CACHE_EXPIRY_DAYS = 7;
    this.CACHE_VERSION = '1.0';

    // Estilos disponibles
    this.AGE_STYLES = {
      ninos: {
        id: 'ninos',
        label: 'Niños (8-12)',
        icon: '🎈',
        description: 'Lenguaje simple y ejemplos cotidianos'
      },
      jovenes: {
        id: 'jovenes',
        label: 'Jóvenes (13-17)',
        icon: '🎯',
        description: 'Lenguaje dinámico y referencias actuales'
      },
      adultos: {
        id: 'adultos',
        label: 'Adultos',
        icon: '📖',
        description: 'Contenido original sin modificar'
      },
      mayores: {
        id: 'mayores',
        label: 'Mayores (65+)',
        icon: '🌳',
        description: 'Lenguaje claro, referencias de su época'
      }
    };

    this.FOCUS_STYLES = {
      original: {
        id: 'original',
        label: 'Original',
        icon: '📄',
        description: 'Sin cambio de enfoque'
      },
      tecnico: {
        id: 'tecnico',
        label: 'Técnico',
        icon: '🔬',
        description: 'Precisión científica y referencias'
      },
      reflexivo: {
        id: 'reflexivo',
        label: 'Reflexivo',
        icon: '🧘',
        description: 'Preguntas y contemplación'
      },
      practico: {
        id: 'practico',
        label: 'Práctico',
        icon: '⚡',
        description: 'Pasos concretos y acción'
      },
      coloquial: {
        id: 'coloquial',
        label: 'Coloquial',
        icon: '💬',
        description: 'Lenguaje informal y cercano'
      },
      dormir: {
        id: 'dormir',
        label: 'Para Dormir',
        icon: '🌙',
        description: 'Ritmo calmante para escuchar antes de dormir'
      },
      historia: {
        id: 'historia',
        label: 'Como Historia',
        icon: '📚',
        description: 'Narrado como cuento o historia'
      },
      punk: {
        id: 'punk',
        label: 'Punk',
        icon: '🔥',
        description: 'Directo, irreverente, sin filtros'
      }
    };

    // Prompts de adaptación
    this.ADAPTATION_PROMPTS = {
      ninos: `ADAPTA (no resumas) este texto para niños de 8-12 años:
- Oraciones cortas y simples (máximo 15-20 palabras)
- Vocabulario cotidiano, sin palabras técnicas
- Ejemplos de la vida diaria: escuela, familia, amigos, juegos
- Analogías con cosas que los niños conocen ("es como cuando...")
- Pequeñas preguntas para que reflexionen
- IMPORTANTE: Adapta CADA párrafo, no elimines ni combines contenido`,

      jovenes: `ADAPTA (no resumas) este texto para adolescentes de 13-17 años:
- Lenguaje dinámico y actual, no infantil
- Conecta con su realidad: redes sociales, relaciones, identidad
- Ejemplos que resuenen con su experiencia
- Referencias a cultura pop si es pertinente
- Trátalos como pensadores capaces
- IMPORTANTE: Adapta CADA párrafo, no elimines ni combines contenido`,

      mayores: `ADAPTA (no resumas) este texto para personas mayores de 65 años:
- Oraciones claras y bien estructuradas, sin prisas
- Vocabulario formal pero accesible, evitando anglicismos y jerga moderna
- Referencias culturales de las décadas 1950-1990 (cine clásico, música de su época, acontecimientos históricos que vivieron)
- Ejemplos de la vida cotidiana tradicional: familia extendida, oficios artesanales, costumbres de antaño
- Tono respetuoso que reconozca su experiencia y sabiduría de vida
- Conectar con valores clásicos: esfuerzo, compromiso, palabra dada, tradición
- Usar expresiones que evoquen nostalgia positiva sin ser condescendiente
- Evitar referencias a tecnología moderna (apps, redes sociales, streaming)
- IMPORTANTE: Adapta CADA párrafo, no elimines ni combines contenido`,

      tecnico: `REFORMULA (no resumas) con enfoque técnico-científico:
- Precisión conceptual y terminología especializada
- Referencias a estudios, teorías o autores cuando aplique
- Terminología técnica con explicaciones entre paréntesis
- Estructura lógica: premisa → argumento → conclusión
- Distingue entre hechos, hipótesis y especulaciones
- IMPORTANTE: Reformula CADA párrafo, no elimines contenido`,

      reflexivo: `REFORMULA (no resumas) con enfoque contemplativo:
- Preguntas abiertas para reflexión personal
- Pausas naturales e invitaciones a detenerse
- Conecta con la experiencia interior del lector
- Invita a introspección y autoobservación
- Lenguaje que invite a calma y presencia
- IMPORTANTE: Reformula CADA párrafo, no elimines contenido`,

      practico: `REFORMULA (no resumas) orientado a la acción práctica:
- Convierte conceptos abstractos en pasos concretos
- Añade "Qué puedo hacer hoy" o ejercicios prácticos
- Enfócate en aplicabilidad: ¿cómo uso esto en mi vida?
- Lista acciones numeradas cuando sea apropiado
- Sugiere experimentos para verificar las ideas
- IMPORTANTE: Reformula CADA párrafo, no elimines contenido`,

      coloquial: `REFORMULA (no resumas) en lenguaje coloquial:
- Tono cercano, como hablar con un amigo
- Expresiones cotidianas naturales
- Sin tecnicismos, palabras simples
- Muletillas conversacionales ("mira", "fíjate", "la verdad es que...")
- Ejemplos de situaciones cotidianas
- Humor suave si encaja
- IMPORTANTE: Reformula CADA párrafo, no elimines contenido`,

      dormir: `REFORMULA (no resumas) para escuchar antes de dormir:
- Ritmo lento y pausado, oraciones suaves que fluyen
- Tono calmante, tranquilizador, como una voz que arrulla
- Evita tensión, conflicto o urgencia en la narrativa
- Usa frases que inviten a soltar y relajarse ("permite que...", "suavemente...", "mientras descansas...")
- Transiciones suaves entre ideas, sin cambios bruscos
- Lenguaje que evoque paz, serenidad, descanso
- Añade pausas naturales (puntos suspensivos ocasionales)
- Reemplaza conceptos estimulantes por versiones más serenas
- IMPORTANTE: Reformula CADA párrafo manteniendo el contenido, solo cambia el ritmo y tono`,

      historia: `REFORMULA (no resumas) el contenido como un cuento o historia narrativa:
- Transforma el contenido en una narración envolvente con inicio, desarrollo y cierre
- Usa estructura de cuento: "Había una vez...", "Cuenta la historia que...", "En tiempos remotos..."
- Crea personajes o arquetipos que representen las ideas (el buscador, el sabio, el viajero...)
- Añade ambientación y escenas visuales que ilustren los conceptos
- Incluye diálogos entre personajes para transmitir las enseñanzas
- Usa metáforas y símbolos narrativos (el camino, la montaña, el tesoro, la luz...)
- Mantén un hilo conductor que guíe al lector por la historia
- El tono puede ser épico, íntimo, misterioso o fantástico según el contenido
- Transforma conceptos abstractos en aventuras y descubrimientos
- IMPORTANTE: Reformula CADA párrafo como parte de la historia, no elimines contenido`,

      punk: `REFORMULA (no resumas) el contenido con actitud punk, directa e irreverente:
- Lenguaje directo, sin rodeos, sin florituras académicas
- Actitud desafiante y cuestionadora: reta al lector a pensar por sí mismo
- Usa expresiones coloquiales fuertes (sin ser vulgar), jerga urbana y tono rebelde
- Ironía y sarcasmo inteligente para cuestionar lo establecido
- Frases cortas y contundentes que golpeen como un riff de guitarra
- Cuestiona la autoridad, las instituciones y el pensamiento convencional
- Convierte las ideas en manifiestos: "esto es así y punto" en vez de "podría considerarse que..."
- Usa metáforas urbanas: la calle, el muro, el grito, la resistencia, el underground
- Mantén la esencia del mensaje pero sin el envoltorio políticamente correcto
- El tono es de quien ha visto el mundo como es y no se calla
- IMPORTANTE: Reformula CADA párrafo, no elimines contenido. Cambia el tono, no el mensaje`
    };
  }

  /**
   * Inicializar el adaptador
   */
  init(bookEngine) {
    this.bookEngine = bookEngine;

    // Reusar instancia global de AIAdapter si existe
    if (window.aiAdapter) {
      this.aiAdapter = window.aiAdapter;
    } else if (window.AIAdapter) {
      this.aiAdapter = new window.AIAdapter();
      window.aiAdapter = this.aiAdapter;
    }

    // Cargar preferencias guardadas
    this.loadPreferences();

    logger.debug('[ContentAdapter] Initialized');
    return this;
  }

  /**
   * Cargar preferencias del usuario
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem('content_adapter_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.currentAgeStyle = prefs.age || 'adultos';
        this.currentFocusStyle = prefs.focus || 'original';
      }
    } catch (e) {
      logger.warn('[ContentAdapter] Error loading preferences:', e);
    }
  }

  /**
   * Guardar preferencias del usuario
   */
  savePreferences() {
    try {
      localStorage.setItem('content_adapter_preferences', JSON.stringify({
        age: this.currentAgeStyle,
        focus: this.currentFocusStyle
      }));
    } catch (e) {
      logger.warn('[ContentAdapter] Error saving preferences:', e);
    }
  }

  /**
   * Establecer contexto del capítulo actual
   */
  setContext(bookId, chapterId, originalContent, originalHtml = null) {
    this.currentBookId = bookId;
    this.currentChapterId = chapterId;
    this.originalContent = originalContent;  // Texto plano para IA
    if (originalHtml) {
      this.originalHtmlContent = originalHtml;  // HTML para restaurar
    }
    this.isAdapted = false;
  }

  /**
   * Resetear estado del adaptador al cambiar de capítulo
   * 🔧 FIX v2.9.385: Evitar que la adaptación persista entre capítulos
   */
  resetState() {
    logger.debug('[ContentAdapter] Reseteando estado para nuevo capítulo');
    this.originalContent = null;
    this.originalHtmlContent = null;
    this.isAdapted = false;
    this.currentBookId = null;
    this.currentChapterId = null;
    // No reseteamos currentAgeStyle ni currentFocusStyle
    // para que el usuario mantenga su preferencia de adaptación
    this.updateUI();
  }

  /**
   * Generar clave de cache
   */
  getCacheKey(bookId, chapterId, ageStyle, focusStyle) {
    return `${this.CACHE_PREFIX}${bookId}_${chapterId}_${ageStyle}_${focusStyle}`;
  }

  /**
   * Obtener adaptación del cache
   */
  getCachedAdaptation(bookId, chapterId, ageStyle, focusStyle) {
    try {
      const key = this.getCacheKey(bookId, chapterId, ageStyle, focusStyle);
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const data = JSON.parse(cached);

      // Verificar versión
      if (data.version !== this.CACHE_VERSION) {
        localStorage.removeItem(key);
        return null;
      }

      // Verificar expiración
      const now = Date.now();
      const expiry = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (now - data.timestamp > expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data.content;
    } catch (e) {
      logger.warn('[ContentAdapter] Error reading cache:', e);
      return null;
    }
  }

  /**
   * Guardar adaptación en cache
   */
  cacheAdaptation(bookId, chapterId, ageStyle, focusStyle, content) {
    try {
      const key = this.getCacheKey(bookId, chapterId, ageStyle, focusStyle);
      localStorage.setItem(key, JSON.stringify({
        content,
        timestamp: Date.now(),
        version: this.CACHE_VERSION
      }));
    } catch (e) {
      logger.warn('[ContentAdapter] Error caching adaptation:', e);
    }
  }

  /**
   * Limpiar caché de adaptaciones
   */
  clearCache(bookId = null, chapterId = null) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          // Si se especifica libro/capítulo, solo borrar esos
          if (bookId && chapterId) {
            if (key.includes(`${bookId}_${chapterId}_`)) {
              keysToRemove.push(key);
            }
          } else {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      logger.debug(`[ContentAdapter] Cache cleared: ${keysToRemove.length} entries`);
      if (window.toast) {
        window.toast.success(`🗑️ Caché limpiado (${keysToRemove.length} adaptaciones)`, 3000);
      }
      return keysToRemove.length;
    } catch (e) {
      logger.warn('[ContentAdapter] Error clearing cache:', e);
      return 0;
    }
  }

  /**
   * Construir prompt de adaptación
   */
  buildAdaptationPrompt(content, ageStyle, focusStyle) {
    let prompt = 'Eres un experto en comunicación y adaptación de contenidos educativos.\n\n';

    // Añadir instrucciones de edad si no es adultos
    if (ageStyle !== 'adultos' && this.ADAPTATION_PROMPTS[ageStyle]) {
      prompt += this.ADAPTATION_PROMPTS[ageStyle] + '\n\n';
    }

    // Añadir instrucciones de enfoque si no es original
    if (focusStyle !== 'original' && this.ADAPTATION_PROMPTS[focusStyle]) {
      prompt += this.ADAPTATION_PROMPTS[focusStyle] + '\n\n';
    }

    // Si ambos son default, no hay nada que adaptar
    if (ageStyle === 'adultos' && focusStyle === 'original') {
      return null;
    }

    prompt += `REGLAS CRÍTICAS - DEBES SEGUIRLAS:
1. **NO RESUMAS** - Adapta CADA párrafo del original, no lo acortes
2. **MANTÉN LA EXTENSIÓN** - El texto adaptado debe tener aproximadamente la MISMA longitud que el original
3. **PÁRRAFO POR PÁRRAFO** - Transforma cada párrafo individualmente, no combines ni elimines párrafos
4. **CONSERVA TODO EL CONTENIDO** - Todas las ideas del original deben aparecer en la adaptación
5. Mantén la estructura (párrafos, secciones, listas)
6. No añadas saludos, despedidas ni comentarios meta
7. Devuelve directamente el contenido adaptado
8. Respeta el formato markdown si existe

TEXTO ORIGINAL A ADAPTAR (${content.length} caracteres - tu respuesta debe tener extensión SIMILAR):
---
${content}
---

Devuelve el texto COMPLETO adaptado (sin resumir, sin acortar):`;

    return prompt;
  }

  /**
   * Adaptar contenido usando IA
   * @param {string} ageStyle - Estilo de edad (ninos, jovenes, adultos)
   * @param {string} focusStyle - Estilo de enfoque (original, tecnico, reflexivo, practico, coloquial)
   * @param {boolean} forceRegenerate - Si true, ignora caché y regenera
   */
  async adaptContent(ageStyle, focusStyle, forceRegenerate = false) {
    // Si es contenido original, restaurar
    if (ageStyle === 'adultos' && focusStyle === 'original') {
      return this.restoreOriginalInternal();
    }

    // Verificar que tenemos contexto
    if (!this.currentBookId || !this.currentChapterId || !this.originalContent) {
      throw new Error('No hay contenido para adaptar. Por favor, abre un capítulo primero.');
    }

    // Verificar cache primero (si no se fuerza regeneración)
    if (!forceRegenerate) {
      const cached = this.getCachedAdaptation(
        this.currentBookId,
        this.currentChapterId,
        ageStyle,
        focusStyle
      );

      if (cached) {
        logger.debug('[ContentAdapter] Using cached adaptation');
        // Mostrar toast indicando que es caché
        if (window.toast) {
          window.toast.info(`📦 Usando adaptación guardada (${cached.length} chars). Mantén pulsado para regenerar.`, 4000);
        }
        this.currentAgeStyle = ageStyle;
        this.currentFocusStyle = focusStyle;
        this.isAdapted = true;
        this.savePreferences();
        return { content: cached, fromCache: true };
      }
    } else {
      logger.debug('[ContentAdapter] Force regenerate - skipping cache');
      if (window.toast) {
        window.toast.info('🔄 Regenerando adaptación con IA...', 3000);
      }
    }

    // Verificar que tenemos IA disponible
    if (!this.aiAdapter) {
      // Reusar instancia global o crear una sola vez
      if (window.aiAdapter) {
        this.aiAdapter = window.aiAdapter;
      } else if (window.AIAdapter) {
        this.aiAdapter = new window.AIAdapter();
        window.aiAdapter = this.aiAdapter;
      } else {
        throw new Error('Sistema de IA no disponible. Por favor, configura un proveedor de IA.');
      }
    }

    // Verificar créditos si hay sistema premium
    if (window.aiPremium) {
      const hasCredits = await window.aiPremium.checkCredits(2000, 'ai_content_adapter');
      if (!hasCredits) {
        throw new Error('No tienes suficientes créditos de IA. Considera usar el modo gratuito o adquirir más créditos.');
      }
    }

    // Verificar que hay algo que adaptar (no adultos + original)
    if (ageStyle === 'adultos' && focusStyle === 'original') {
      return { content: this.originalContent, fromCache: false };
    }

    // Limitar contenido para no exceder tokens (reducido para mejor rendimiento móvil)
    const maxContentLength = 8000;
    let contentToAdapt = this.originalContent;
    if (contentToAdapt.length > maxContentLength) {
      contentToAdapt = contentToAdapt.substring(0, maxContentLength) + '\n\n[Contenido truncado por longitud...]';
      logger.warn(`[ContentAdapter] Contenido truncado: ${this.originalContent.length} → ${maxContentLength} chars`);
      window.toast?.warning(`⚠️ Capítulo muy largo, adaptando primeros ${Math.round(maxContentLength/1000)}K caracteres`, 4000);
    }

    // Construir prompt con el contenido (potencialmente truncado)
    const adaptationPrompt = this.buildAdaptationPrompt(contentToAdapt, ageStyle, focusStyle);

    if (!adaptationPrompt) {
      return { content: this.originalContent, fromCache: false };
    }

    logger.debug(`[ContentAdapter] Contenido original: ${this.originalContent.length} chars`);
    logger.debug(`[ContentAdapter] Contenido a adaptar: ${contentToAdapt.length} chars`);
    logger.debug(`[ContentAdapter] Estilos: edad=${ageStyle}, enfoque=${focusStyle}`);

    // Llamar a IA con timeout de 60s para evitar bloqueos
    try {
      const timeoutMs = 60000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La IA tardó demasiado en responder. Intenta con un capítulo más corto.')), timeoutMs);
      });

      const aiPromise = this.aiAdapter.ask(
        adaptationPrompt,
        'Eres un adaptador de contenidos. Tu tarea es TRANSFORMAR textos párrafo por párrafo, cambiando el estilo/lenguaje pero MANTENIENDO TODA la información y extensión. NUNCA resumas ni acortes. Si el texto original tiene 10 párrafos, tu respuesta debe tener 10 párrafos adaptados.',
        [],
        'content_adaptation'
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);

      // Validar tipo de respuesta
      if (typeof response !== 'string') {
        logger.error('[ContentAdapter] Respuesta no es string:', typeof response);
        throw new Error('La IA devolvió un formato de respuesta inesperado');
      }

      const responseLength = response?.length || 0;
      const contentLength = contentToAdapt.length;
      logger.debug(`[ContentAdapter] Respuesta recibida: ${responseLength} chars`);

      if (response && response.trim()) {
        // Detectar respuestas de fallback local (demasiado cortas para ser adaptaciones reales)
        const minAbsoluteLength = 200;
        const actualRatio = responseLength / contentLength;

        if (responseLength < minAbsoluteLength || (actualRatio < 0.1 && responseLength < 500)) {
          logger.error(`[ContentAdapter] Respuesta demasiado corta: ${responseLength} chars`);
          const fallbackPhrases = ['pregunta profunda', 'te invito a sentarte', 'libro explora', 'interesante perspectiva'];
          const isFallback = fallbackPhrases.some(phrase => response.toLowerCase().includes(phrase));

          if (isFallback) {
            throw new Error('La IA no está disponible. Verifica tu conexión o que tengas créditos. Puedes configurar otra IA en ⚙️ Ajustes.');
          } else {
            throw new Error(`La respuesta de IA es muy corta (${responseLength} caracteres). Verifica créditos o intenta regenerar.`);
          }
        }

        if (actualRatio < 0.3 && responseLength < 1000) {
          window.toast?.warning(`⚠️ La adaptación puede estar incompleta (${responseLength} chars). Puedes regenerar si lo deseas.`, 6000);
        }

        // Guardar en cache
        this.cacheAdaptation(
          this.currentBookId,
          this.currentChapterId,
          ageStyle,
          focusStyle,
          response
        );

        this.currentAgeStyle = ageStyle;
        this.currentFocusStyle = focusStyle;
        this.isAdapted = true;
        this.savePreferences();

        return { content: response, fromCache: false };
      } else {
        throw new Error('La IA no devolvió una respuesta válida');
      }
    } catch (error) {
      logger.error('[ContentAdapter] AI error:', error);
      throw new Error(`Error al adaptar contenido: ${error.message}`);
    }
  }

  /**
   * Restaurar contenido original (retorna objeto para uso interno)
   * Para restaurar en la UI, usar el método en la línea ~979
   */
  restoreOriginalInternal() {
    this.isAdapted = false;
    this.currentAgeStyle = 'adultos';
    this.currentFocusStyle = 'original';
    this.savePreferences();
    return { content: this.originalContent, fromCache: false, restored: true };
  }

  /**
   * Renderizar selector de adaptación
   */
  renderSelector() {
    // Obtener estado de IA usando AIUtils
    const aiUtils = window.aiUtils;
    const aiStatus = aiUtils?.getAIStatus?.() || { available: false };
    const aiStatusBanner = aiUtils?.renderAIStatusBanner?.() || '';
    const providerSelector = aiStatus.available ? aiUtils?.renderProviderSelector?.({ idPrefix: 'adapter' }) || '' : '';

    const ageOptions = Object.values(this.AGE_STYLES).map(style => `
      <button class="adapter-option ${this.currentAgeStyle === style.id ? 'active' : ''}"
              data-type="age"
              data-value="${style.id}"
              title="${style.description}">
        <span class="adapter-option-icon">${style.icon}</span>
        <span class="adapter-option-label">${style.label.split(' ')[0]}</span>
      </button>
    `).join('');

    const focusOptions = Object.values(this.FOCUS_STYLES).map(style => `
      <button class="adapter-option ${this.currentFocusStyle === style.id ? 'active' : ''}"
              data-type="focus"
              data-value="${style.id}"
              title="${style.description}">
        <span class="adapter-option-icon">${style.icon}</span>
        <span class="adapter-option-label">${style.label}</span>
      </button>
    `).join('');

    return `
      <div class="content-adapter-selector ${this.selectorVisible ? 'visible' : 'hidden'}" id="content-adapter-selector">
        <div class="adapter-header">
          <span class="adapter-title">Adaptar contenido</span>
          ${providerSelector}
          <button class="adapter-close" id="adapter-close-btn" title="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        ${aiStatusBanner}

        <div class="adapter-section">
          <label class="adapter-label">Por edad</label>
          <div class="adapter-options" data-group="age">
            ${ageOptions}
          </div>
        </div>

        <div class="adapter-section">
          <label class="adapter-label">Por enfoque</label>
          <div class="adapter-options" data-group="focus">
            ${focusOptions}
          </div>
        </div>

        <div class="adapter-actions">
          <button class="adapter-btn adapter-btn-primary" id="adapter-apply-btn" ${!aiStatus.available ? 'disabled title="Configura IA primero"' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            Aplicar
          </button>
          <button class="adapter-btn adapter-btn-warning" id="adapter-regenerate-btn" title="Ignorar caché y regenerar con IA" ${!aiStatus.available ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Regenerar
          </button>
          <button class="adapter-btn adapter-btn-secondary" id="adapter-restore-btn" ${!this.isAdapted ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Restaurar
          </button>
        </div>

        <div class="adapter-status" id="adapter-status"></div>
      </div>
    `;
  }

  /**
   * Renderizar botón de adaptación para el header
   */
  renderButton() {
    const badgeClass = this.isAdapted ? 'has-badge' : '';
    const badgeText = this.isAdapted
      ? `${this.AGE_STYLES[this.currentAgeStyle]?.icon || ''} ${this.FOCUS_STYLES[this.currentFocusStyle]?.icon || ''}`
      : '';

    return `
      <button class="reader-action-btn ${badgeClass}" id="content-adapter-btn" title="Adaptar contenido">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
        <span class="btn-label">Adaptar</span>
        ${this.isAdapted ? `<span class="adapter-badge">${badgeText}</span>` : ''}
      </button>
    `;
  }

  /**
   * Mostrar/ocultar selector
   */
  toggleSelector() {
    logger.debug('[ContentAdapter] toggleSelector() called');
    let selector = document.getElementById('content-adapter-selector');
    let backdrop = document.getElementById('content-adapter-backdrop');

    // Si no existe el selector, crearlo como modal centrado
    if (!selector) {
      logger.debug('[ContentAdapter] Creating selector...');

      // Crear backdrop para cerrar al hacer clic fuera
      backdrop = document.createElement('div');
      backdrop.id = 'content-adapter-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.2s ease, visibility 0.2s;
      `;
      backdrop.addEventListener('click', () => this.hideSelector());
      document.body.appendChild(backdrop);

      // Crear contenedor del modal
      const modalContainer = document.createElement('div');
      modalContainer.id = 'content-adapter-modal';
      modalContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.95);
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
      `;
      modalContainer.innerHTML = this.renderSelector();
      document.body.appendChild(modalContainer);

      selector = document.getElementById('content-adapter-selector');
      if (selector) {
        // Hacer visible el selector dentro del modal (remover clases de posición)
        selector.style.position = 'relative';
        selector.style.top = 'auto';
        selector.style.right = 'auto';
        selector.style.opacity = '1';
        selector.style.visibility = 'visible';
        selector.style.transform = 'none';
        selector.classList.remove('hidden');
        selector.classList.add('visible');
      }

      this.attachSelectorEvents();
      logger.debug('[ContentAdapter] Selector created as centered modal');
    }

    // Toggle visibility
    this.selectorVisible = !this.selectorVisible;
    const modal = document.getElementById('content-adapter-modal');
    backdrop = document.getElementById('content-adapter-backdrop');

    if (this.selectorVisible) {
      // Mostrar
      if (backdrop) {
        backdrop.style.pointerEvents = 'auto';
        backdrop.style.opacity = '1';
        backdrop.style.visibility = 'visible';
      }
      if (modal) {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.style.transform = 'translate(-50%, -50%) scale(1)';
      }
      logger.debug('[ContentAdapter] Selector shown');
    } else {
      this.hideSelector();
    }
  }

  /**
   * Ocultar selector
   */
  hideSelector() {
    this.selectorVisible = false;
    const modal = document.getElementById('content-adapter-modal');
    const backdrop = document.getElementById('content-adapter-backdrop');

    if (backdrop) {
      backdrop.style.opacity = '0';
      backdrop.style.visibility = 'hidden';
      backdrop.style.pointerEvents = 'none';
    }
    if (modal) {
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
      modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
    }
    logger.debug('[ContentAdapter] Selector hidden');
  }

  /**
   * Adjuntar eventos al selector
   */
  attachSelectorEvents() {
    const modal = document.getElementById('content-adapter-modal');

    // Adjuntar eventos del banner de estado IA (login, plans, settings)
    if (window.aiUtils && modal) {
      window.aiUtils.attachBannerEvents(modal);
      window.aiUtils.attachProviderSelectorEvents(modal, 'adapter');
    }

    // Botón cerrar
    const closeBtn = document.getElementById('adapter-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideSelector();
      });
    }

    // Opciones de edad
    document.querySelectorAll('.adapter-option[data-type="age"]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.adapter-option[data-type="age"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentAgeStyle = btn.dataset.value;
        this.savePreferences();
      });
    });

    // Opciones de enfoque
    document.querySelectorAll('.adapter-option[data-type="focus"]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.adapter-option[data-type="focus"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFocusStyle = btn.dataset.value;
        this.savePreferences();
      });
    });

    // Botón aplicar (click normal = usar caché, long-press = regenerar)
    const applyBtn = document.getElementById('adapter-apply-btn');
    if (applyBtn) {
      let longPressTimer = null;
      let isLongPress = false;

      applyBtn.addEventListener('mousedown', () => {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
          isLongPress = true;
          // Long press = forzar regeneración
          this.applyAdaptation(true);
        }, 800);
      });

      applyBtn.addEventListener('mouseup', () => {
        clearTimeout(longPressTimer);
        if (!isLongPress) {
          // Click normal = usar caché si existe
          this.applyAdaptation(false);
        }
      });

      applyBtn.addEventListener('mouseleave', () => {
        clearTimeout(longPressTimer);
      });

      // Touch events para móvil (passive para no interferir con scroll)
      applyBtn.addEventListener('touchstart', (e) => {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
          isLongPress = true;
          this.applyAdaptation(true);
        }, 800);
      }, { passive: true });

      applyBtn.addEventListener('touchend', (e) => {
        clearTimeout(longPressTimer);
        if (!isLongPress) {
          this.applyAdaptation(false);
        }
      }, { passive: true });

      applyBtn.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
        isLongPress = false;
      }, { passive: true });

      applyBtn.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
        isLongPress = false;
      }, { passive: true });
    }

    // Botón regenerar (forzar sin caché)
    const regenerateBtn = document.getElementById('adapter-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        await this.applyAdaptation(true);  // true = forzar regeneración
      });
    }

    // Botón restaurar
    const restoreBtn = document.getElementById('adapter-restore-btn');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        this.restoreOriginal();
        this.hideSelector();
      });
    }
  }

  /**
   * Aplicar adaptación al contenido actual
   * @param {boolean} forceRegenerate - Si true, ignora caché y regenera
   */
  async applyAdaptation(forceRegenerate = false) {
    // Obtener el contenido del capítulo actual
    const chapterContent = document.querySelector('.chapter-content, .content-wrapper, #chapter-content, .book-content');
    if (!chapterContent) {
      logger.warn('[ContentAdapter] No chapter content found');
      window.toast?.error('No se encontró contenido para adaptar');
      return;
    }

    // Si es contenido original, no hacer nada especial
    if (this.currentAgeStyle === 'adultos' && this.currentFocusStyle === 'original') {
      this.restoreOriginal();
      this.hideSelector();
      return;
    }

    // Guardar contenido HTML original para poder restaurarlo
    if (!this.originalHtmlContent) {
      this.originalHtmlContent = chapterContent.innerHTML;
    }

    // Extraer texto plano del contenido HTML para enviar a la IA
    const textContent = chapterContent.innerText || chapterContent.textContent;

    // Obtener bookId y chapterId del contexto actual
    let detectedBookId = null;
    let detectedChapterId = null;

    if (window.bookReader) {
      detectedBookId = window.bookReader.bookEngine?.getCurrentBook?.() || null;
      detectedChapterId = window.bookReader.currentChapter?.id || null;
      logger.debug('[ContentAdapter] Context from bookReader:', { bookId: detectedBookId, chapterId: detectedChapterId });
    }

    if (!detectedBookId && window.bookEngine) {
      detectedBookId = window.bookEngine.getCurrentBook?.() || window.bookEngine.currentBook || null;
      detectedChapterId = window.bookEngine.currentChapter?.id || null;
      logger.debug('[ContentAdapter] Context from bookEngine:', { bookId: detectedBookId, chapterId: detectedChapterId });
    }

    // Usar IDs detectados o generar temporales para cache
    this.currentBookId = detectedBookId || 'temp-book';
    this.currentChapterId = detectedChapterId || `temp-chapter-${Date.now()}`;

    logger.debug('[ContentAdapter] Using context:', {
      bookId: this.currentBookId,
      chapterId: this.currentChapterId,
      hasOriginalHtml: !!this.originalHtmlContent,
      textLength: textContent?.length || 0
    });

    // Configurar contexto para adaptContent (texto plano para IA)
    this.originalContent = textContent;

    // Mostrar estado de carga
    this.showLoading('Adaptando contenido con IA...');

    try {
      const result = await this.adaptContent(this.currentAgeStyle, this.currentFocusStyle, forceRegenerate);

      if (result && result.content) {
        // Aplicar contenido adaptado
        const adaptedHtml = this.convertToHtml(result.content);
        chapterContent.innerHTML = adaptedHtml;

        // Re-adjuntar event listeners del contenido que innerHTML destruyó
        this._reattachContentEvents();

        this.isAdapted = true;
        this.hideLoading();
        this.showSuccess(
          `Adaptado: ${this.AGE_STYLES[this.currentAgeStyle]?.label} + ${this.FOCUS_STYLES[this.currentFocusStyle]?.label}`,
          result.fromCache
        );
        this.updateUI();
        this.hideSelector();

        window.toast?.success('Contenido adaptado correctamente');
      }
    } catch (error) {
      logger.error('[ContentAdapter] Error applying adaptation:', error);
      this.hideSelector();
      window.toast?.error(error.message || 'Error al adaptar contenido', 8000);
    } finally {
      // Siempre restaurar estado de UI para evitar bloqueos
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      this.hideLoading();

      // Forzar ocultar backdrop y modal para evitar pantalla bloqueada
      const backdrop = document.getElementById('content-adapter-backdrop');
      if (backdrop) {
        backdrop.style.opacity = '0';
        backdrop.style.visibility = 'hidden';
        backdrop.style.pointerEvents = 'none';
      }
      const modal = document.getElementById('content-adapter-modal');
      if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        modal.style.pointerEvents = 'none';
      }

      // Rehabilitar botones
      const applyBtn = document.getElementById('adapter-apply-btn');
      const restoreBtn = document.getElementById('adapter-restore-btn');
      const regenerateBtn = document.getElementById('adapter-regenerate-btn');
      if (applyBtn) applyBtn.disabled = false;
      if (regenerateBtn) regenerateBtn.disabled = false;
      if (restoreBtn) restoreBtn.disabled = !this.isAdapted;
    }
  }

  /**
   * Convertir texto plano/markdown a HTML con formato
   */
  convertToHtml(text) {
    if (!text) return '';

    // Dividir en párrafos
    const paragraphs = text.split(/\n\n+/);

    return paragraphs
      .map(p => {
        p = p.trim();
        if (!p) return '';

        // Detectar encabezados markdown (## Título)
        const headerMatch = p.match(/^(#{1,3})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const title = this.formatInlineMarkdown(headerMatch[2]);
          const sizes = { 1: 'text-xl', 2: 'text-lg', 3: 'text-base' };
          return `<h${level + 1} class="${sizes[level]} font-bold mt-6 mb-3">${title}</h${level + 1}>`;
        }

        // Detectar encabezados implícitos (líneas cortas que terminan en :)
        if (p.length < 80 && p.endsWith(':') && !p.includes('\n')) {
          return `<h3 class="text-lg font-bold mt-6 mb-3">${this.formatInlineMarkdown(p)}</h3>`;
        }

        // Detectar listas con viñetas
        if (p.match(/^[-•*]\s/m)) {
          const items = p.split(/\n/).map(line => {
            const content = line.replace(/^[-•*]\s*/, '').trim();
            return content ? `<li>${this.formatInlineMarkdown(content)}</li>` : '';
          }).filter(i => i).join('');
          return `<ul class="list-disc pl-6 my-4 space-y-1">${items}</ul>`;
        }

        // Detectar listas numeradas
        if (p.match(/^\d+[.)]\s/m)) {
          const items = p.split(/\n/).map(line => {
            const content = line.replace(/^\d+[.)]\s*/, '').trim();
            return content ? `<li>${this.formatInlineMarkdown(content)}</li>` : '';
          }).filter(i => i).join('');
          return `<ol class="list-decimal pl-6 my-4 space-y-1">${items}</ol>`;
        }

        // Detectar citas (líneas que empiezan con >)
        if (p.startsWith('>')) {
          const quoteContent = p.replace(/^>\s*/gm, '').trim();
          return `<blockquote class="border-l-4 border-cyan-500/50 pl-4 my-4 italic text-slate-300">${this.formatInlineMarkdown(quoteContent)}</blockquote>`;
        }

        // Párrafo normal con formato inline
        return `<p class="mb-4 leading-relaxed">${this.formatInlineMarkdown(p).replace(/\n/g, '<br>')}</p>`;
      })
      .filter(p => p)
      .join('\n');
  }

  /**
   * Formatear markdown inline (negritas, cursivas, etc.)
   */
  formatInlineMarkdown(text) {
    if (!text) return '';

    let formatted = this.escapeHtml(text);

    // Negritas: **texto** o __texto__
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Cursivas: *texto* o _texto_
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Código inline: `texto`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1 rounded text-sm">$1</code>');

    return formatted;
  }

  /**
   * Re-adjuntar event listeners del contenido tras reemplazo innerHTML
   */
  _reattachContentEvents() {
    try {
      // BookReader content events (action cards, mark-read, prev/next)
      if (window.bookReader?.events?.attachContentEventListeners) {
        window.bookReader.events.attachContentEventListeners();
      }
      // Action link listeners (enlaces internos)
      if (window.bookReader?.events?.attachActionLinkListeners) {
        window.bookReader.events.attachActionLinkListeners();
      }
      // Re-inicializar iconos
      if (window.Icons?.init) {
        window.Icons.init();
      }
    } catch (err) {
      logger.warn('[ContentAdapter] Error re-attaching events:', err);
    }
  }

  /**
   * Escapar HTML para prevenir XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Restaurar contenido original
   */
  restoreOriginal() {
    // Restaurar el HTML original si lo tenemos
    if (this.originalHtmlContent) {
      const chapterContent = document.querySelector('.chapter-content, .content-wrapper, #chapter-content, .book-content');
      if (chapterContent) {
        chapterContent.innerHTML = this.originalHtmlContent;
        // Re-adjuntar event listeners que innerHTML destruyó
        this._reattachContentEvents();
      }
    }

    this.isAdapted = false;
    this.currentAgeStyle = 'adultos';
    this.currentFocusStyle = 'original';
    this.savePreferences();
    this.updateUI();

    window.toast?.info('Contenido restaurado');

    // Actualizar botón restaurar
    const restoreBtn = document.getElementById('adapter-restore-btn');
    if (restoreBtn) restoreBtn.disabled = true;
  }

  /**
   * Mostrar estado de carga
   */
  showLoading(message = 'Adaptando contenido...') {
    const status = document.getElementById('adapter-status');
    if (status) {
      status.innerHTML = `
        <div class="adapter-loading">
          <span class="adapter-spinner"></span>
          <span>${message}</span>
        </div>
      `;
      status.classList.add('visible');
    }

    // Deshabilitar botones
    const applyBtn = document.getElementById('adapter-apply-btn');
    const restoreBtn = document.getElementById('adapter-restore-btn');
    if (applyBtn) applyBtn.disabled = true;
    if (restoreBtn) restoreBtn.disabled = true;
  }

  /**
   * Ocultar estado de carga
   */
  hideLoading() {
    const status = document.getElementById('adapter-status');
    if (status) {
      status.innerHTML = '';
      status.classList.remove('visible');
    }

    // Habilitar botones
    const applyBtn = document.getElementById('adapter-apply-btn');
    const restoreBtn = document.getElementById('adapter-restore-btn');
    if (applyBtn) applyBtn.disabled = false;
    if (restoreBtn) restoreBtn.disabled = !this.isAdapted;
  }

  /**
   * Mostrar mensaje de éxito
   */
  showSuccess(message, fromCache = false) {
    const status = document.getElementById('adapter-status');
    if (status) {
      status.innerHTML = `
        <div class="adapter-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>${message}</span>
          ${fromCache ? '<span class="cache-badge">desde cache</span>' : ''}
        </div>
      `;
      status.classList.add('visible');

      // Ocultar después de 3 segundos
      setTimeout(() => {
        if (status) {
          status.classList.remove('visible');
        }
      }, 3000);
    }
  }

  /**
   * Mostrar mensaje de error
   */
  showError(message) {
    const status = document.getElementById('adapter-status');
    if (status) {
      status.innerHTML = `
        <div class="adapter-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <span>${message}</span>
        </div>
      `;
      status.classList.add('visible');
    }
  }

  /**
   * Actualizar UI después de adaptación
   */
  updateUI() {
    // Actualizar botón principal
    const btn = document.getElementById('content-adapter-btn');
    if (btn) {
      if (this.isAdapted) {
        btn.classList.add('has-badge');
        const badgeText = `${this.AGE_STYLES[this.currentAgeStyle]?.icon || ''} ${this.FOCUS_STYLES[this.currentFocusStyle]?.icon || ''}`;
        let badge = btn.querySelector('.adapter-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'adapter-badge';
          btn.appendChild(badge);
        }
        badge.textContent = badgeText.trim();
      } else {
        btn.classList.remove('has-badge');
        const badge = btn.querySelector('.adapter-badge');
        if (badge) badge.remove();
      }
    }

    // Actualizar selector
    const selector = document.getElementById('content-adapter-selector');
    if (selector) {
      // Actualizar opciones de edad
      selector.querySelectorAll('[data-type="age"]').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.value === this.currentAgeStyle);
      });

      // Actualizar opciones de enfoque
      selector.querySelectorAll('[data-type="focus"]').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.value === this.currentFocusStyle);
      });

      // Actualizar botón restaurar
      const restoreBtn = document.getElementById('adapter-restore-btn');
      if (restoreBtn) {
        restoreBtn.disabled = !this.isAdapted;
      }
    }
  }

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.CACHE_PREFIX));
      let totalSize = 0;
      keys.forEach(k => {
        totalSize += (localStorage.getItem(k) || '').length;
      });
      return {
        count: keys.length,
        sizeKB: Math.round(totalSize / 1024)
      };
    } catch (e) {
      return { count: 0, sizeKB: 0 };
    }
  }
}

// Crear instancia global
window.ContentAdapter = ContentAdapter;
window.contentAdapter = new ContentAdapter();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentAdapter;
}
