/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Content Adapter - Herramienta IA para adaptar contenido de capítulos
 *
 * Permite adaptar el contenido a diferentes audiencias y estilos:
 * - Por edad: niños (8-12), jóvenes (13-17), adultos
 * - Por enfoque: técnico, reflexivo, práctico
 *
 * Usa sistema híbrido: cache local + IA en tiempo real
 *
 * @version 1.0.0
 */

class ContentAdapter {
  constructor() {
    this.bookEngine = null;
    this.aiAdapter = null;
    this.currentBookId = null;
    this.currentChapterId = null;
    this.originalContent = null;
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
      }
    };

    // Prompts de adaptación
    this.ADAPTATION_PROMPTS = {
      ninos: `Adapta este texto para niños de 8-12 años. Instrucciones:
- Usa oraciones cortas y simples (máximo 15-20 palabras por oración)
- Vocabulario cotidiano, evita palabras técnicas o abstractas
- Incluye ejemplos de la vida diaria: escuela, familia, amigos, juegos
- Añade analogías con cosas que los niños conocen
- Mantén el mensaje central pero hazlo completamente accesible
- Si hay conceptos difíciles, usa comparaciones ("es como cuando...")
- Puedes añadir pequeñas preguntas para que el niño reflexione
- Extensión similar al original`,

      jovenes: `Adapta este texto para adolescentes de 13-17 años. Instrucciones:
- Lenguaje dinámico y actual, sin ser infantil
- Conecta con su realidad: redes sociales, relaciones, búsqueda de identidad
- Mantén la profundidad pero hazlo engaging y relevante
- Usa ejemplos que resuenen con su experiencia
- Puedes hacer referencias a cultura pop si es pertinente
- Evita ser condescendiente, trátalos como pensadores capaces
- Extensión similar al original`,

      tecnico: `Reformula este contenido con enfoque técnico-científico. Instrucciones:
- Añade precisión conceptual y terminología especializada
- Incluye referencias a estudios, teorías o autores relevantes cuando aplique
- Usa terminología técnica con breves explicaciones entre paréntesis
- Estructura lógica y analítica (premisa → argumento → conclusión)
- Distingue entre hechos, hipótesis y especulaciones
- Añade matices y limitaciones de los conceptos presentados
- Extensión puede ser ligeramente mayor al original`,

      reflexivo: `Reformula este contenido con enfoque contemplativo y reflexivo. Instrucciones:
- Añade preguntas abiertas para la reflexión personal
- Incluye pausas naturales e invitaciones a detenerse
- Conecta los conceptos con la experiencia interior del lector
- Invita a la introspección y autoobservación
- Usa lenguaje que invite a la calma y presencia
- Sugiere momentos de meditación o contemplación sobre las ideas
- Extensión similar al original`,

      practico: `Reformula este contenido orientado a la acción práctica. Instrucciones:
- Convierte cada concepto abstracto en pasos concretos aplicables
- Añade secciones "Qué puedo hacer hoy" o "Ejercicio práctico"
- Incluye ejercicios simples que el lector pueda hacer inmediatamente
- Enfócate en aplicabilidad: ¿cómo uso esto en mi vida?
- Lista acciones numeradas cuando sea apropiado
- Sugiere experimentos personales para verificar las ideas
- Extensión puede ser ligeramente mayor al original`,

      coloquial: `Reformula este contenido en lenguaje coloquial e informal. Instrucciones:
- Usa un tono cercano, como si hablaras con un amigo
- Incluye expresiones cotidianas y naturales
- Evita tecnicismos, usa palabras simples del día a día
- Puedes usar muletillas conversacionales ("mira", "fíjate", "la verdad es que...")
- Haz el texto más ligero y ameno de leer
- Usa ejemplos de situaciones cotidianas
- Mantén el mensaje pero hazlo sentir como una charla casual
- Puedes usar humor suave si encaja con el contenido
- Extensión similar al original`
    };
  }

  /**
   * Inicializar el adaptador
   */
  init(bookEngine) {
    this.bookEngine = bookEngine;

    // Intentar obtener AIAdapter si existe
    if (window.AIAdapter) {
      this.aiAdapter = new window.AIAdapter();
    } else if (window.aiAdapter) {
      this.aiAdapter = window.aiAdapter;
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
  setContext(bookId, chapterId, originalContent) {
    this.currentBookId = bookId;
    this.currentChapterId = chapterId;
    this.originalContent = originalContent;
    this.isAdapted = false;
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

    prompt += `IMPORTANTE:
- Mantén la estructura del texto (párrafos, secciones)
- No añadas saludos ni despedidas
- No menciones que estás adaptando el texto
- Devuelve directamente el contenido adaptado
- Respeta el formato markdown si existe

TEXTO A ADAPTAR:
---
${content}
---

Devuelve el texto adaptado:`;

    return prompt;
  }

  /**
   * Adaptar contenido usando IA
   */
  async adaptContent(ageStyle, focusStyle) {
    // Si es contenido original, restaurar
    if (ageStyle === 'adultos' && focusStyle === 'original') {
      return this.restoreOriginal();
    }

    // Verificar que tenemos contexto
    if (!this.currentBookId || !this.currentChapterId || !this.originalContent) {
      throw new Error('No hay contenido para adaptar. Por favor, abre un capítulo primero.');
    }

    // Verificar cache primero
    const cached = this.getCachedAdaptation(
      this.currentBookId,
      this.currentChapterId,
      ageStyle,
      focusStyle
    );

    if (cached) {
      logger.debug('[ContentAdapter] Using cached adaptation');
      this.currentAgeStyle = ageStyle;
      this.currentFocusStyle = focusStyle;
      this.isAdapted = true;
      this.savePreferences();
      return { content: cached, fromCache: true };
    }

    // Verificar que tenemos IA disponible
    if (!this.aiAdapter) {
      // Intentar cargar el adaptador
      if (window.AIAdapter) {
        this.aiAdapter = new window.AIAdapter();
      } else {
        throw new Error('Sistema de IA no disponible. Por favor, configura un proveedor de IA.');
      }
    }

    // Verificar créditos si hay sistema premium
    if (window.aiPremium) {
      const hasCredits = await window.aiPremium.checkCredits(2000, 'content_adaptation');
      if (!hasCredits) {
        throw new Error('No tienes suficientes créditos de IA. Considera usar el modo gratuito o adquirir más créditos.');
      }
    }

    // Construir prompt
    const prompt = this.buildAdaptationPrompt(this.originalContent, ageStyle, focusStyle);

    if (!prompt) {
      return { content: this.originalContent, fromCache: false };
    }

    // Limitar contenido para no exceder tokens
    const maxContentLength = 6000;
    let contentToAdapt = this.originalContent;
    if (contentToAdapt.length > maxContentLength) {
      contentToAdapt = contentToAdapt.substring(0, maxContentLength) + '\n\n[Contenido truncado por longitud...]';
    }

    // Llamar a IA
    try {
      const response = await this.aiAdapter.ask(
        this.buildAdaptationPrompt(contentToAdapt, ageStyle, focusStyle),
        'Eres un experto adaptador de contenidos educativos. Adapta textos manteniendo su esencia pero ajustando el lenguaje y enfoque según las instrucciones.',
        []
      );

      if (response && response.trim()) {
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
   * Restaurar contenido original
   */
  restoreOriginal() {
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
          <button class="adapter-close" id="adapter-close-btn" title="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

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
          <button class="adapter-btn adapter-btn-primary" id="adapter-apply-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            Aplicar
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
    }
    if (modal) {
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
    }
    logger.debug('[ContentAdapter] Selector hidden');
  }

  /**
   * Adjuntar eventos al selector
   */
  attachSelectorEvents() {
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

    // Botón aplicar
    const applyBtn = document.getElementById('adapter-apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        await this.applyAdaptation();
      });
    }

    // Botón restaurar
    const restoreBtn = document.getElementById('adapter-restore-btn');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        this.restoreOriginal();
      });
    }
  }

  /**
   * Guardar preferencias
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
   * Aplicar adaptación al contenido actual
   */
  async applyAdaptation() {
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

    // Guardar contenido original si no lo tenemos
    if (!this.originalContent) {
      this.originalContent = chapterContent.innerHTML;
      // Intentar obtener bookId y chapterId del contexto
      if (window.bookEngine) {
        this.currentBookId = window.bookEngine.currentBookId;
        this.currentChapterId = window.bookEngine.currentChapterId;
      }
    }

    // Mostrar estado de carga
    this.showLoading('Adaptando contenido con IA...');

    try {
      // Extraer texto plano del contenido HTML
      const textContent = chapterContent.innerText || chapterContent.textContent;

      // Llamar a adaptContent con el contenido actual
      this.setContext(this.currentBookId, this.currentChapterId, textContent);

      const result = await this.adaptContent(this.currentAgeStyle, this.currentFocusStyle);

      if (result && result.content) {
        // Aplicar contenido adaptado
        // Preservar estructura HTML pero reemplazar texto
        const adaptedHtml = this.convertToHtml(result.content);
        chapterContent.innerHTML = adaptedHtml;

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
      this.hideLoading();
      this.showError(error.message);
      window.toast?.error(error.message || 'Error al adaptar contenido');
    }
  }

  /**
   * Convertir texto plano a HTML con formato básico
   */
  convertToHtml(text) {
    if (!text) return '';

    // Dividir en párrafos y formatear
    const paragraphs = text.split(/\n\n+/);
    return paragraphs
      .map(p => {
        p = p.trim();
        if (!p) return '';

        // Detectar encabezados (líneas cortas que terminan en : o son todo mayúsculas)
        if (p.length < 80 && (p.endsWith(':') || p === p.toUpperCase())) {
          return `<h3 class="text-lg font-bold mt-6 mb-3">${this.escapeHtml(p)}</h3>`;
        }

        // Detectar listas
        if (p.match(/^[-•*]\s/m)) {
          const items = p.split(/\n/).map(line => {
            const content = line.replace(/^[-•*]\s*/, '').trim();
            return content ? `<li>${this.escapeHtml(content)}</li>` : '';
          }).join('');
          return `<ul class="list-disc pl-6 my-4">${items}</ul>`;
        }

        // Párrafo normal
        return `<p class="mb-4">${this.escapeHtml(p).replace(/\n/g, '<br>')}</p>`;
      })
      .filter(p => p)
      .join('\n');
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
    if (this.originalContent) {
      const chapterContent = document.querySelector('.chapter-content, .content-wrapper, #chapter-content, .book-content');
      if (chapterContent) {
        chapterContent.innerHTML = this.originalContent;
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
   * Limpiar cache de adaptaciones
   */
  clearCache() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.CACHE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
      logger.debug(`[ContentAdapter] Cleared ${keys.length} cached adaptations`);
      return keys.length;
    } catch (e) {
      logger.error('[ContentAdapter] Error clearing cache:', e);
      return 0;
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
