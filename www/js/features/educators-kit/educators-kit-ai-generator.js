/**
 * Educators Kit AI Generator - Generador IA de recursos
 * Genera recursos educativos personalizados usando IA
 * @version 1.0.0
 */

class EducatorsKitAIGenerator {
  constructor(educatorsKit) {
    this.educatorsKit = educatorsKit;
    this.aiGenFormData = {};
    this.generatedContent = null;
  }

  /**
   * Abre el modal del generador de IA
   */
  openAIGenerator() {
    this.createAIGeneratorModal();
    const modal = document.getElementById('ai-generator-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Crea el modal del generador de IA
   */
  createAIGeneratorModal() {
    if (document.getElementById('ai-generator-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ai-generator-modal';
    modal.className = 'ai-generator-modal';
    modal.innerHTML = `
      <div class="ai-gen-backdrop" onclick="window.educatorsKit?.closeAIGenerator()"></div>
      <div class="ai-gen-container">
        <div class="ai-gen-header">
          <div class="ai-gen-header-icon">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h2 class="ai-gen-title">Generador de Recursos con IA</h2>
            <p class="ai-gen-subtitle">Crea materiales educativos personalizados</p>
          </div>
          <button class="ai-gen-close" onclick="window.educatorsKit?.closeAIGenerator()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Formulario -->
        <div class="ai-gen-body" id="ai-gen-form-view">
          <form id="ai-gen-form" onsubmit="window.educatorsKit?.generateResource(event)">
            <!-- Tipo de recurso -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">Que tipo de recurso necesitas?</label>
              <div class="ai-gen-options" id="resource-type-options">
                <button type="button" class="ai-gen-option" data-value="actividad" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">🎯</span>
                  <span class="ai-gen-option-text">Actividad</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="reflexion" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">💭</span>
                  <span class="ai-gen-option-text">Preguntas de reflexion</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="sesion" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">📋</span>
                  <span class="ai-gen-option-text">Plan de sesion</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="explicacion" onclick="window.educatorsKit?.selectOption(this, 'resourceType')">
                  <span class="ai-gen-option-icon">📖</span>
                  <span class="ai-gen-option-text">Texto explicativo</span>
                </button>
              </div>
            </div>

            <!-- Edad del grupo -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">Para que grupo de edad?</label>
              <div class="ai-gen-options" id="age-options">
                <button type="button" class="ai-gen-option" data-value="primaria" onclick="window.educatorsKit?.selectOption(this, 'targetAge')">
                  <span class="ai-gen-option-icon">👶</span>
                  <span class="ai-gen-option-text">Primaria (6-12)</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="secundaria" onclick="window.educatorsKit?.selectOption(this, 'targetAge')">
                  <span class="ai-gen-option-icon">🧑</span>
                  <span class="ai-gen-option-text">Secundaria (12-18)</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="adultos" onclick="window.educatorsKit?.selectOption(this, 'targetAge')">
                  <span class="ai-gen-option-icon">👨</span>
                  <span class="ai-gen-option-text">Adultos</span>
                </button>
              </div>
            </div>

            <!-- Tema -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">Sobre que tema del Nuevo Ser?</label>
              <div class="ai-gen-options grid-3" id="topic-options">
                <button type="button" class="ai-gen-option" data-value="interdependencia" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🌐 Interdependencia</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="premisas" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🧠 Premisas ocultas</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="naturaleza" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🌿 Conexion naturaleza</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="emociones" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">💖 Emociones</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="comunidad" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">🤝 Comunidad</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="accion" onclick="window.educatorsKit?.selectOption(this, 'topic')">
                  <span class="ai-gen-option-text">⚡ Accion transformadora</span>
                </button>
              </div>
            </div>

            <!-- Duracion -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">Cuanto tiempo tienes disponible?</label>
              <div class="ai-gen-options" id="duration-options">
                <button type="button" class="ai-gen-option" data-value="15" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">15 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="30" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">30 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="45" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">45 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="60" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">60 min</span>
                </button>
                <button type="button" class="ai-gen-option" data-value="90" onclick="window.educatorsKit?.selectOption(this, 'duration')">
                  <span class="ai-gen-option-text">90 min</span>
                </button>
              </div>
            </div>

            <!-- Contexto adicional (opcional) -->
            <div class="ai-gen-field">
              <label class="ai-gen-label">Algun contexto adicional? <span class="text-gray-500">(opcional)</span></label>
              <textarea id="ai-gen-context" class="ai-gen-textarea" placeholder="Ej: Es un grupo de 15 personas que ya conocen los conceptos basicos. Me gustaria algo interactivo que incluya movimiento..."></textarea>
            </div>

            <!-- Boton generar -->
            <button type="submit" class="ai-gen-submit" id="ai-gen-submit-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Generar Recurso
            </button>
          </form>
        </div>

        <!-- Vista de carga -->
        <div class="ai-gen-loading" id="ai-gen-loading-view" style="display: none;">
          <div class="ai-gen-loading-spinner"></div>
          <p class="ai-gen-loading-text">Generando tu recurso personalizado...</p>
          <p class="ai-gen-loading-subtext">Esto puede tomar unos segundos</p>
        </div>

        <!-- Vista de resultado -->
        <div class="ai-gen-result" id="ai-gen-result-view" style="display: none;">
          <div class="ai-gen-result-content" id="ai-gen-result-content">
            <!-- Contenido generado aqui -->
          </div>
          <div class="ai-gen-result-actions">
            <button class="ai-gen-btn secondary" onclick="window.educatorsKit?.resetAIGenerator()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Generar Otro
            </button>
            <button class="ai-gen-btn primary" onclick="window.educatorsKit?.copyGeneratedResource()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
              </svg>
              Copiar
            </button>
            <button class="ai-gen-btn primary" onclick="window.educatorsKit?.printGeneratedResource()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Imprimir/PDF
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Agregar estilos del generador
    this.addAIGeneratorStyles();
  }

  /**
   * Agrega los estilos del generador de IA
   */
  addAIGeneratorStyles() {
    if (document.getElementById('ai-generator-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'ai-generator-styles';
    styles.textContent = `
      .ai-generator-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
      }
      .ai-generator-modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ai-gen-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(4px);
      }
      .ai-gen-container {
        position: relative;
        width: 95%;
        max-width: 700px;
        max-height: 90vh;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25);
      }
      .ai-gen-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        background: rgba(139, 92, 246, 0.1);
      }
      .ai-gen-header-icon {
        padding: 12px;
        background: rgba(139, 92, 246, 0.2);
        border-radius: 12px;
      }
      .ai-gen-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        margin: 0;
      }
      .ai-gen-subtitle {
        font-size: 0.875rem;
        color: #a78bfa;
        margin: 4px 0 0;
      }
      .ai-gen-close {
        margin-left: auto;
        padding: 8px;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        color: #ef4444;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ai-gen-close:hover {
        background: rgba(239, 68, 68, 0.3);
      }
      .ai-gen-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }
      .ai-gen-field {
        margin-bottom: 24px;
      }
      .ai-gen-label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 12px;
      }
      .ai-gen-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .ai-gen-options.grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }
      .ai-gen-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px 12px;
        background: rgba(30, 41, 59, 0.8);
        border: 2px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ai-gen-option:hover {
        border-color: rgba(139, 92, 246, 0.4);
        background: rgba(139, 92, 246, 0.1);
      }
      .ai-gen-option.selected {
        border-color: #8b5cf6;
        background: rgba(139, 92, 246, 0.2);
        color: white;
      }
      .ai-gen-option-icon {
        font-size: 1.5rem;
      }
      .ai-gen-option-text {
        font-size: 0.85rem;
        text-align: center;
      }
      .ai-gen-textarea {
        width: 100%;
        min-height: 100px;
        padding: 16px;
        background: rgba(30, 41, 59, 0.8);
        border: 2px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        color: white;
        font-size: 0.9rem;
        resize: vertical;
      }
      .ai-gen-textarea:focus {
        outline: none;
        border-color: rgba(139, 92, 246, 0.5);
      }
      .ai-gen-submit {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 24px;
        background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }
      .ai-gen-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4);
      }
      .ai-gen-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      /* Loading */
      .ai-gen-loading {
        padding: 60px 24px;
        text-align: center;
      }
      .ai-gen-loading-spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 24px;
        border: 3px solid rgba(139, 92, 246, 0.2);
        border-top-color: #8b5cf6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .ai-gen-loading-text {
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 8px;
      }
      .ai-gen-loading-subtext {
        color: #94a3b8;
        font-size: 0.9rem;
        margin: 0;
      }

      /* Result */
      .ai-gen-result {
        padding: 24px;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .ai-gen-result-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #e2e8f0;
        line-height: 1.7;
        margin-bottom: 16px;
      }
      .ai-gen-result-content h2 {
        color: #a78bfa;
        font-size: 1.3rem;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid rgba(139, 92, 246, 0.3);
      }
      .ai-gen-result-content h3 {
        color: #c4b5fd;
        font-size: 1.1rem;
        margin: 20px 0 12px;
      }
      .ai-gen-result-content ul, .ai-gen-result-content ol {
        margin: 12px 0;
        padding-left: 24px;
      }
      .ai-gen-result-content li {
        margin: 8px 0;
      }
      .ai-gen-result-content strong {
        color: white;
      }
      .ai-gen-result-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .ai-gen-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
        min-width: 120px;
      }
      .ai-gen-btn.primary {
        background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
        border: none;
        color: white;
      }
      .ai-gen-btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 15px -3px rgba(139, 92, 246, 0.4);
      }
      .ai-gen-btn.secondary {
        background: rgba(148, 163, 184, 0.1);
        border: 1px solid rgba(148, 163, 184, 0.3);
        color: #94a3b8;
      }
      .ai-gen-btn.secondary:hover {
        background: rgba(148, 163, 184, 0.2);
        color: white;
      }

      @media (max-width: 640px) {
        .ai-gen-options {
          grid-template-columns: 1fr;
        }
        .ai-gen-options.grid-3 {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Selecciona una opcion del formulario
   */
  selectOption(button, fieldName) {
    // Deseleccionar otras opciones del mismo grupo
    const container = button.parentElement;
    container.querySelectorAll('.ai-gen-option').forEach(opt => opt.classList.remove('selected'));

    // Seleccionar esta opcion
    button.classList.add('selected');

    // Guardar valor
    this.aiGenFormData[fieldName] = button.dataset.value;
  }

  /**
   * Genera el recurso con IA
   */
  async generateResource(event) {
    event.preventDefault();

    // Validar que todas las opciones esten seleccionadas
    const required = ['resourceType', 'targetAge', 'topic', 'duration'];
    const missing = required.filter(field => !this.aiGenFormData?.[field]);

    if (missing.length > 0) {
      this.educatorsKit.showToast('Por favor, selecciona todas las opciones', 'warning');
      return;
    }

    // Obtener contexto adicional
    const context = document.getElementById('ai-gen-context')?.value || '';

    // Mostrar vista de carga
    document.getElementById('ai-gen-form-view').style.display = 'none';
    document.getElementById('ai-gen-loading-view').style.display = 'block';

    try {
      // Construir prompt
      const prompt = this.buildAIPrompt({
        ...this.aiGenFormData,
        context
      });

      // Llamar a la IA
      const result = await this.callAI(prompt);

      // Mostrar resultado
      this.showGeneratedResult(result);

    } catch (error) {
      logger.error('[EducatorsKitAIGenerator] Error generando recurso:', error);
      this.educatorsKit.showToast('Error al generar el recurso. Intentalo de nuevo.', 'error');
      this.resetAIGenerator();
    }
  }

  /**
   * Construye el prompt para la IA
   */
  buildAIPrompt(data) {
    const typeNames = {
      'actividad': 'una actividad educativa completa',
      'reflexion': 'un conjunto de 10 preguntas de reflexion',
      'sesion': 'un plan de sesion estructurado',
      'explicacion': 'un texto explicativo claro y pedagogico'
    };

    const ageDescriptions = {
      'primaria': 'ninios de primaria (6-12 anios), usando lenguaje sencillo, ejemplos concretos y elementos ludicos',
      'secundaria': 'adolescentes de secundaria (12-18 anios), que pueden manejar conceptos abstractos y buscan relevancia y autenticidad',
      'adultos': 'adultos, con profundidad conceptual, conexion con experiencia de vida y aplicabilidad practica'
    };

    const topicDescriptions = {
      'interdependencia': 'la interdependencia y conexion de todo con todo, como formamos parte de sistemas mayores',
      'premisas': 'las premisas ocultas y creencias asumidas, como cuestionarlas y explorar alternativas',
      'naturaleza': 'la conexion con la naturaleza, la ecologia profunda y nuestro lugar en el ecosistema',
      'emociones': 'la inteligencia emocional, reconocer y expresar emociones, bienestar interior',
      'comunidad': 'la construccion de comunidad, cooperacion vs competencia, tejido social',
      'accion': 'la accion transformadora, pasar del conocimiento a la practica, generar cambio real'
    };

    return `Eres un educador experto en pedagogia transformadora y los principios del "Nuevo Ser" (interdependencia, cuestionamiento de premisas, reconexion con la naturaleza, desarrollo integral).

Genera ${typeNames[data.resourceType]} sobre el tema de ${topicDescriptions[data.topic]}.

El recurso debe estar adaptado para ${ageDescriptions[data.targetAge]}.

Duracion disponible: ${data.duration} minutos.

${data.context ? `Contexto adicional del facilitador: ${data.context}` : ''}

FORMATO DE RESPUESTA (usa HTML para formatear):
- Titulo claro y atractivo (h2)
- Objetivos de aprendizaje (lista)
- Materiales necesarios (si aplica)
- Desarrollo paso a paso con tiempos aproximados
- Preguntas de reflexion para cerrar
- Variantes o adaptaciones opcionales

Se creativo, practico y asegurate de que el recurso sea facil de implementar. Usa un tono calido y cercano.`;
  }

  /**
   * Llama a la API de IA
   */
  async callAI(prompt) {
    // Intentar usar AIAdapter si esta disponible
    if (window.AIAdapter) {
      try {
        const adapter = new window.AIAdapter();
        await adapter.init();
        const response = await adapter.generateText(prompt, {
          maxTokens: 2000,
          temperature: 0.7
        });
        return response;
      } catch (e) {
        logger.warn('[EducatorsKitAIGenerator] AIAdapter failed, trying Puter:', e);
      }
    }

    // Intentar usar Puter AI
    if (typeof puter !== 'undefined' && puter.ai) {
      try {
        const response = await puter.ai.chat(prompt, {
          model: 'gpt-4o-mini'
        });
        return response?.message?.content || response;
      } catch (e) {
        logger.warn('[EducatorsKitAIGenerator] Puter AI failed:', e);
      }
    }

    // Fallback: generar respuesta local
    return this.generateLocalResponse(this.aiGenFormData);
  }

  /**
   * Genera una respuesta local como fallback
   */
  generateLocalResponse(data) {
    const templates = {
      'actividad': {
        'interdependencia': `<h2>🌐 Tejiendo la Red de la Vida</h2>
<h3>Objetivos</h3>
<ul>
<li>Comprender que todo esta interconectado</li>
<li>Visualizar las relaciones de interdependencia</li>
<li>Reflexionar sobre nuestro lugar en el sistema</li>
</ul>

<h3>Materiales</h3>
<ul>
<li>Ovillo de lana o cuerda</li>
<li>Tarjetas con nombres de elementos (sol, agua, plantas, animales, humanos, etc.)</li>
<li>Espacio para formar circulo</li>
</ul>

<h3>Desarrollo (${data.duration} min)</h3>
<p><strong>Apertura (5 min):</strong> Formar un circulo. Repartir tarjetas con elementos de la naturaleza/sociedad.</p>
<p><strong>Actividad principal (${Math.floor(data.duration * 0.6)} min):</strong></p>
<ol>
<li>La primera persona sostiene el ovillo y dice: "Yo soy el Sol, doy energia a..." y lanza el hilo a quien tenga la tarjeta relacionada.</li>
<li>Cada persona recibe el hilo, explica su conexion, y lo lanza a otro elemento del que depende.</li>
<li>Continuar hasta crear una red visible que conecte a todos.</li>
</ol>
<p><strong>Reflexion (${Math.floor(data.duration * 0.2)} min):</strong> Observar la red creada.</p>
<ul>
<li>Que pasa si soltamos un hilo?</li>
<li>Donde estamos nosotros en esta red?</li>
<li>Como afectan nuestras acciones a la red?</li>
</ul>

<h3>Variantes</h3>
<ul>
<li>Usar elementos de la comunidad local</li>
<li>Incluir elementos emocionales/abstractos</li>
<li>Fotografiar la red como recordatorio</li>
</ul>`,
        'premisas': `<h2>🧠 Arqueologia de Creencias</h2>
<h3>Objetivos</h3>
<ul>
<li>Identificar creencias asumidas como verdades</li>
<li>Explorar el origen de nuestras creencias</li>
<li>Imaginar alternativas posibles</li>
</ul>

<h3>Materiales</h3>
<ul>
<li>Post-its de colores</li>
<li>Rotuladores</li>
<li>Pizarra o papel grande</li>
</ul>

<h3>Desarrollo (${data.duration} min)</h3>
<p><strong>Introduccion (5 min):</strong> Explicar que es una "premisa oculta" - una creencia que asumimos sin cuestionar.</p>
<p><strong>Excavacion individual (${Math.floor(data.duration * 0.3)} min):</strong></p>
<ol>
<li>Cada participante completa frases como: "El exito es...", "El dinero sirve para...", "Las personas en el fondo son..."</li>
<li>Escribir cada respuesta en un post-it</li>
</ol>
<p><strong>Mapa colectivo (${Math.floor(data.duration * 0.3)} min):</strong></p>
<ol>
<li>Pegar post-its agrupandolos por temas</li>
<li>Observar patrones: que premisas compartimos?</li>
</ol>
<p><strong>Reflexion (${Math.floor(data.duration * 0.2)} min):</strong></p>
<ul>
<li>De donde vienen estas creencias?</li>
<li>Son verdades o construcciones culturales?</li>
<li>Que alternativas podrian existir?</li>
</ul>

<h3>Variantes</h3>
<ul>
<li>Enfocarse en un tema especifico (trabajo, relaciones, naturaleza)</li>
<li>Investigar premisas de otros contextos culturales</li>
</ul>`
      },
      'reflexion': {
        'default': `<h2>💭 Preguntas para la Reflexion</h2>
<p>Estas preguntas pueden usarse individualmente, en parejas o en grupo. Deja espacio para el silencio despues de cada una.</p>

<h3>Preguntas sobre ${data.topic}</h3>
<ol>
<li>Que es lo que mas te sorprende cuando piensas en este tema?</li>
<li>Que creencias sobre esto heredaste sin cuestionarlas?</li>
<li>Como seria el mundo si esta premisa fuera diferente?</li>
<li>Donde sientes esta reflexion en tu cuerpo?</li>
<li>Que pequenio cambio podrias hacer esta semana relacionado con esto?</li>
<li>Quien en tu vida encarna una forma diferente de ver esto?</li>
<li>Que perderias si cambiaras tu perspectiva sobre este tema?</li>
<li>Que ganarias?</li>
<li>Que pregunta te llevas para seguir reflexionando?</li>
<li>Si pudieras transmitir una idea sobre esto a las proximas generaciones, cual seria?</li>
</ol>

<h3>Como usar estas preguntas</h3>
<ul>
<li>Selecciona 3-4 preguntas segun el tiempo disponible</li>
<li>Deja al menos 2 minutos de silencio despues de cada pregunta</li>
<li>Invita a escribir antes de compartir en voz alta</li>
<li>Recuerda que no hay respuestas "correctas"</li>
</ul>`
      },
      'sesion': {
        'default': `<h2>📋 Plan de Sesion: ${data.topic}</h2>
<p><strong>Duracion:</strong> ${data.duration} minutos | <strong>Grupo:</strong> ${data.targetAge}</p>

<h3>Objetivos</h3>
<ul>
<li>Explorar el tema de ${data.topic} desde la perspectiva del Nuevo Ser</li>
<li>Crear espacio para la reflexion personal y colectiva</li>
<li>Generar compromisos de accion concretos</li>
</ul>

<h3>Estructura</h3>

<h4>1. APERTURA (${Math.floor(data.duration * 0.15)} min)</h4>
<ul>
<li>Circulo de llegada: cada persona comparte en una palabra como llega</li>
<li>Practica de presencia: 3 respiraciones conscientes juntos</li>
<li>Establecer intencion: que queremos explorar hoy?</li>
</ul>

<h4>2. DESARROLLO (${Math.floor(data.duration * 0.6)} min)</h4>
<p><strong>Introduccion al tema (${Math.floor(data.duration * 0.1)} min):</strong></p>
<ul>
<li>Pregunta provocadora o dato sorprendente</li>
<li>Breve contexto conceptual</li>
</ul>

<p><strong>Actividad experiencial (${Math.floor(data.duration * 0.3)} min):</strong></p>
<ul>
<li>Ejercicio practico relacionado con el tema</li>
<li>Trabajo individual, en parejas o grupal segun el ejercicio</li>
</ul>

<p><strong>Reflexion compartida (${Math.floor(data.duration * 0.2)} min):</strong></p>
<ul>
<li>Puesta en comun de insights</li>
<li>Preguntas que profundicen la exploracion</li>
</ul>

<h4>3. CIERRE (${Math.floor(data.duration * 0.15)} min)</h4>
<ul>
<li>Sintesis de aprendizajes clave (sin cerrar el tema)</li>
<li>Compromiso de accion: "Esta semana voy a..."</li>
<li>Circulo de cierre: una palabra de gratitud o intencion</li>
</ul>

<h3>Materiales necesarios</h3>
<ul>
<li>Espacio comodo dispuesto en circulo</li>
<li>Campana o elemento para marcar transiciones</li>
<li>Papel y boligrafos para cada participante</li>
</ul>`
      },
      'explicacion': {
        'default': `<h2>📖 Comprendiendo ${data.topic}</h2>

<h3>Que significa realmente?</h3>
<p>En el contexto del Nuevo Ser, ${data.topic} no es solo un concepto teorico, sino una invitacion a cambiar nuestra forma de estar en el mundo.</p>

<h3>La premisa vieja</h3>
<p>El paradigma dominante nos ha enseñado a ver el mundo de cierta manera. Esta vision, aunque nos parece "natural", es en realidad una construccion cultural que puede ser cuestionada.</p>

<h3>La premisa nueva</h3>
<p>El Nuevo Ser propone una perspectiva diferente. No se trata de tener razon, sino de explorar posibilidades que el paradigma actual no permite ver.</p>

<h3>Por que importa?</h3>
<p>Cuando cambiamos nuestra manera de entender algo fundamental, todo lo demas cambia. No es solo un cambio de ideas, sino de como vivimos, nos relacionamos y actuamos en el mundo.</p>

<h3>Ejemplos concretos</h3>
<ul>
<li>En lo personal: como esto afecta nuestras decisiones diarias</li>
<li>En lo relacional: como cambia nuestra forma de estar con otros</li>
<li>En lo colectivo: que posibilidades se abren para la sociedad</li>
</ul>

<h3>Para reflexionar</h3>
<ul>
<li>Donde veo esto operando en mi vida?</li>
<li>Que cambiaria si adoptara esta nueva perspectiva?</li>
<li>Que me cuesta soltar de la vision anterior?</li>
</ul>`
      }
    };

    // Obtener template apropiado
    let template = templates[data.resourceType]?.[data.topic] ||
                   templates[data.resourceType]?.['default'] ||
                   templates['explicacion']['default'];

    return template;
  }

  /**
   * Muestra el resultado generado
   */
  showGeneratedResult(result) {
    document.getElementById('ai-gen-loading-view').style.display = 'none';
    document.getElementById('ai-gen-result-view').style.display = 'flex';

    const contentDiv = document.getElementById('ai-gen-result-content');
    contentDiv.innerHTML = result;

    this.generatedContent = result;
  }

  /**
   * Resetea el generador
   */
  resetAIGenerator() {
    document.getElementById('ai-gen-form-view').style.display = 'block';
    document.getElementById('ai-gen-loading-view').style.display = 'none';
    document.getElementById('ai-gen-result-view').style.display = 'none';

    // Limpiar selecciones
    document.querySelectorAll('.ai-gen-option').forEach(opt => opt.classList.remove('selected'));
    const contextTextarea = document.getElementById('ai-gen-context');
    if (contextTextarea) {
      contextTextarea.value = '';
    }

    this.aiGenFormData = {};
  }

  /**
   * Cierra el generador de IA
   */
  closeAIGenerator() {
    const modal = document.getElementById('ai-generator-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    this.resetAIGenerator();
  }

  /**
   * Copia el recurso generado al portapapeles
   */
  copyGeneratedResource() {
    if (!this.generatedContent) return;

    // Convertir HTML a texto plano
    const temp = document.createElement('div');
    temp.innerHTML = this.generatedContent;
    const text = temp.textContent || temp.innerText;

    navigator.clipboard.writeText(text).then(() => {
      this.educatorsKit.showToast('Contenido copiado al portapapeles', 'success');
    }).catch(() => {
      this.educatorsKit.showToast('Error al copiar', 'error');
    });
  }

  /**
   * Imprime el recurso generado
   */
  printGeneratedResource() {
    const content = document.getElementById('ai-gen-result-content').innerHTML;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recurso Educativo - Coleccion Nuevo Ser</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; }
          h2 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
          h3 { color: #6d28d9; margin-top: 24px; }
          ul, ol { margin: 12px 0; padding-left: 24px; }
          li { margin: 8px 0; }
          strong { color: #1e293b; }
          p { margin: 12px 0; }
        </style>
      </head>
      <body>
        ${content}
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
          Generado con el Kit para Educadores - Coleccion Nuevo Ser
        </footer>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  destroy() {
    this.aiGenFormData = {};
    this.generatedContent = null;
  }
}

// Exportar globalmente
window.EducatorsKitAIGenerator = EducatorsKitAIGenerator;
