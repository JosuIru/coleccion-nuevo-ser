/**
 * FrankensteinValidationExport
 *
 * Módulo responsable de validación de seres, exportación de prompts y integración con IA.
 * Gestiona la evaluación de seres contra misiones y la generación de prompts enriquecidos.
 *
 * Funcionalidades:
 * - Validación de seres contra requisitos de misión
 * - Visualización de resultados de validación
 * - Exportación de seres como prompts para IA
 * - Generación de prompts estructurados con atributos y balance
 * - Integración con sistema de chat IA
 * - Análisis de composición de seres (piezas canónicas)
 *
 * @version 2.9.154
 * @author Laboratorio Frankenstein
 */

export class FrankensteinValidationExport {
  /**
   * Constructor del módulo de validación y exportación
   *
   * @param {Object} missionsSystemRef - Referencia al sistema de misiones
   * @param {Object} labUIRef - Referencia a la UI del laboratorio
   * @param {Object} domCache - Cache de elementos DOM
   */
  constructor(missionsSystemRef, labUIRef, domCache) {
    this.missionsSystem = missionsSystemRef;
    this.labUI = labUIRef;
    this.dom = domCache;

    // Referencias a elementos comunes
    this.validationContainer = null;

    // Timeouts para cleanup
    this.timeouts = [];
  }

  /**
   * Inicializar referencias DOM
   */
  initDOMReferences() {
    this.validationContainer = this.dom.validationResults ||
                              document.getElementById('validation-results');
  }

  /**
   * Validar ser para misión actual
   * Ejecuta validación completa y muestra resultados con efectos visuales
   *
   * @param {Object} being - El ser a validar
   * @param {Object} mission - La misión contra la que validar
   * @returns {Object} Resultados de validación
   */
  validate(being, mission) {
    if (!being || !mission) {
      this.labUI?.showNotification('Selecciona una misión y construye un ser primero', 'warning');
      return null;
    }

    // Ejecutar validación usando el sistema de misiones
    const validacionResultados = this.missionsSystem.validateBeingForMission(being, mission);

    // Mostrar resultados
    this.showResults(validacionResultados);

    // Efectos visuales solo si el ser es viable
    if (validacionResultados.viable) {
      this.playValidationEffects();

      // Recompensas por validar ser viable
      if (window.frankensteinRewards) {
        window.frankensteinRewards.giveReward('validateBeing');
      }
    }

    return validacionResultados;
  }

  /**
   * Reproducir efectos visuales de validación exitosa
   * @private
   */
  playValidationEffects() {
    if (!this.labUI?.playLightningEffect) return;

    // Serie de rayos para celebrar
    this.labUI.playLightningEffect();

    this.timeouts.push(
      setTimeout(() => this.labUI.playLightningEffect(), 300)
    );

    this.timeouts.push(
      setTimeout(() => this.labUI.playLightningEffect(), 600)
    );
  }

  /**
   * Mostrar resultados de validación en la UI
   * Genera HTML con fortalezas, debilidades y acciones disponibles
   *
   * @param {Object} validacionResultados - Resultados de la validación
   * @param {boolean} validacionResultados.viable - Si el ser es viable
   * @param {number} validacionResultados.percentage - Porcentaje de cumplimiento
   * @param {Object} validacionResultados.grade - Calificación del ser
   * @param {Array} validacionResultados.strengths - Fortalezas detectadas
   * @param {Array} validacionResultados.missingAttributes - Atributos faltantes
   * @param {Array} validacionResultados.balanceIssues - Problemas de balance
   */
  showResults(validacionResultados) {
    const contenedorValidacion = this.validationContainer ||
                                 this.dom.validationResults ||
                                 document.getElementById('validation-results');

    if (!contenedorValidacion) return;

    let contenidoHTML = `
      <div class="validation-header ${validacionResultados.viable ? 'viable' : 'not-viable'}">
        <h3>${validacionResultados.viable ? '✅ ¡SER VIABLE!' : '❌ Ser No Viable'}</h3>
        <p class="validation-score">Puntuación: ${validacionResultados.percentage}% (${validacionResultados.grade.letter})</p>
      </div>
    `;

    // Sección de fortalezas
    if (validacionResultados.strengths.length > 0) {
      contenidoHTML += '<div class="validation-section"><h4>💪 Fortalezas</h4><ul>';
      validacionResultados.strengths.forEach(fortaleza => {
        contenidoHTML += `<li>${fortaleza.message}</li>`;
      });
      contenidoHTML += '</ul></div>';
    }

    // Sección de atributos faltantes
    if (validacionResultados.missingAttributes.length > 0) {
      contenidoHTML += '<div class="validation-section"><h4>⚠️ Atributos Faltantes</h4><ul>';
      validacionResultados.missingAttributes.forEach(faltante => {
        contenidoHTML += `<li>${faltante.message}</li>`;
      });
      contenidoHTML += '</ul></div>';
    }

    // Sección de problemas de balance
    if (validacionResultados.balanceIssues.length > 0) {
      contenidoHTML += '<div class="validation-section"><h4>⚖️ Problemas de Balance</h4><ul>';
      validacionResultados.balanceIssues.forEach(problema => {
        contenidoHTML += `<li>${problema.message}</li>`;
      });
      contenidoHTML += '</ul></div>';
    }

    // Acciones disponibles para seres viables
    if (validacionResultados.viable) {
      const mensajeExito = this.labUI?.selectedMission?.successMessage ||
                          '¡Este ser está listo para cumplir su misión!';

      contenidoHTML += `<p class="validation-message success">${mensajeExito}</p>`;
      contenidoHTML += `
        <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
          <button class="lab-button primary" onclick="window.frankensteinLabUI.saveBeingWithPrompt()">
            💾 Guardar Ser
          </button>
          <button class="lab-button secondary" onclick="window.frankensteinLabUI.exportBeingAsPrompt()">
            🌟 Exportar Prompt
          </button>
          <button class="lab-button secondary" onclick="window.frankensteinLabUI.startChallenges()">
            🎮 Poner a Prueba
          </button>
          <button class="lab-button secondary" onclick="window.frankensteinLabUI.createMicroSociety()" title="Crear una microsociedad evolutiva con este ser">
            🌍 Microsociedad
          </button>
        </div>
      `;
    }

    contenedorValidacion.innerHTML = contenidoHTML;
    contenedorValidacion.style.display = 'block';
  }

  /**
   * Exportar ser como prompt para IA
   * Genera el prompt y lo copia al portapapeles, además de mostrarlo en modal
   *
   * @param {Object} being - El ser a exportar
   * @returns {string} El prompt generado
   */
  export(being) {
    if (!being) {
      this.labUI?.showNotification('No hay ser para exportar', 'warning');
      return '';
    }

    const textoPrompt = this.generatePrompt(being);

    // Copiar al portapapeles
    navigator.clipboard.writeText(textoPrompt).then(() => {
      this.labUI?.showNotification('📋 Prompt copiado al portapapeles', 'success', 4000);
    }).catch(err => {
      logger.error('Error copiando prompt al portapapeles:', err);
      this.labUI?.showNotification('Error al copiar prompt', 'error');
    });

    // Mostrar en modal
    if (this.labUI?.modals?.showPrompt) {
      this.labUI.modals.showPrompt(textoPrompt);
    }

    return textoPrompt;
  }

  /**
   * Generar prompt estructurado del ser
   * Incluye misión, atributos nucleares, balance y conocimiento base
   *
   * @param {Object} being - El ser para el que generar el prompt
   * @param {Object} mission - La misión del ser (opcional, usa la actual si no se provee)
   * @returns {string} Prompt formateado para IA
   */
  generatePrompt(being, mission = null) {
    if (!being) {
      return 'No hay un ser activo en este momento. Construye o carga un ser para generar su prompt.';
    }

    // Misión por defecto si no hay una seleccionada
    const misionFallback = {
      name: 'Exploración Libre',
      description: 'Explorar el laboratorio sin un encargo específico, definiendo el propósito durante la conversación.',
      longDescription: 'Este ser todavía no tiene una misión asignada. Úsalo para prototipar ideas y definir objetivos durante la sesión.'
    };

    const misionActual = mission || this.labUI?.selectedMission || misionFallback;

    // Asegurar que tenemos atributos acumulados
    const atributosAcumulados = this.getAccumulatedAttributes(being);

    // Calcular balance
    const datosBalance = this.getBalanceData(being, atributosAcumulados);

    // Obtener piezas canónicas del ser
    const piezasComposicion = this.getCanonicalPieces(being).filter(Boolean);

    // Generar entradas de ADN (top 4 atributos dominantes)
    const entradasADN = this.generateDNAEntries(atributosAcumulados);

    // Generar sección de conocimiento
    const seccionConocimiento = this.generateKnowledgeSection(piezasComposicion);

    // Construir el prompt completo
    const textoPrompt = `Eres un Ser Transformador creado en el Laboratorio Frankenstein de la Colección Nuevo Ser.

MISIÓN: ${misionActual.name}
${misionActual.longDescription || misionActual.description || 'Explora, aprende y define tu propósito durante la conversación.'}

ATRIBUTOS NUCLEARES:
${entradasADN}

BALANCE:
- 🧠 Intelectual: ${Math.round(datosBalance.intellectual || 0)}
- ❤️ Emocional: ${Math.round(datosBalance.emotional || 0)}
- ⚡ Acción: ${Math.round(datosBalance.action || 0)}
- 🌟 Espiritual: ${Math.round(datosBalance.spiritual || 0)}
- 🔧 Práctico: ${Math.round(datosBalance.practical || 0)}
- Armonía: ${Math.round(datosBalance.harmony || 0)}%

CONOCIMIENTO BASE (capítulos y ejercicios seleccionados):
${seccionConocimiento}

Como este ser, debes:
1. Actuar según tus atributos y balance específicos
2. Usar el conocimiento de las piezas que te componen
3. Cumplir tu misión: ${misionActual.description || 'Clarificar el propósito de la sesión junto a la persona que te invoca'}
4. Mantener coherencia con tu propósito transformador

Cuando interactúes, habla desde tu identidad única como este ser, no como una IA genérica.`;

    return textoPrompt;
  }

  /**
   * Obtener atributos acumulados del ser
   * @private
   */
  getAccumulatedAttributes(being) {
    let atributosRecopilados = { ...(being.attributes || {}) };

    // Si no hay atributos precalculados, calcularlos desde las piezas
    if ((!atributosRecopilados || Object.keys(atributosRecopilados).length === 0) &&
        this.missionsSystem) {
      atributosRecopilados = {};
      const fuentePiezas = (being.pieces && being.pieces.length > 0 ?
                           being.pieces :
                           this.labUI?.selectedPieces) || [];

      fuentePiezas.forEach(entrada => {
        const datosPieza = entrada?.piece || entrada;
        if (!datosPieza) return;

        const analisis = this.missionsSystem.analyzePiece(datosPieza);
        if (!analisis || !analisis.attributes) return;

        Object.entries(analisis.attributes).forEach(([atributo, valor]) => {
          if (valor > 0) {
            atributosRecopilados[atributo] = (atributosRecopilados[atributo] || 0) + valor;
          }
        });
      });
    }

    return atributosRecopilados;
  }

  /**
   * Obtener datos de balance del ser
   * @private
   */
  getBalanceData(being, atributosAcumulados) {
    return being.balance ||
           (this.missionsSystem?.calculateBalance(atributosAcumulados) ?? {
             intellectual: 0,
             emotional: 0,
             action: 0,
             spiritual: 0,
             practical: 0,
             harmony: 0
           });
  }

  /**
   * Generar entradas de ADN (top 4 atributos dominantes)
   * @private
   */
  generateDNAEntries(atributosAcumulados) {
    const entradasAtributos = Object.entries(atributosAcumulados || {});

    return entradasAtributos
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([clave, valor]) => {
        const datosAtributo = this.missionsSystem?.attributes?.[clave];
        return `- ${datosAtributo?.icon || '📊'} ${datosAtributo?.name || clave}: ${Math.round(valor)}`;
      })
      .join('\n') || '- Aún no hay atributos dominantes.';
  }

  /**
   * Generar sección de conocimiento del prompt
   * @private
   */
  generateKnowledgeSection(piezasComposicion) {
    if (!piezasComposicion.length) {
      return '- Agrega piezas para definir el conocimiento base del ser.';
    }

    return piezasComposicion.map(pieza => {
      const atributosSeguros = (pieza.attributes || [])
        .map(atributo => {
          if (!atributo) return null;
          const etiqueta = atributo.name || atributo.key;
          const icono = atributo.icon || '📊';
          const valor = Math.round(atributo.value || 0);
          return `${icono} ${etiqueta}: ${valor}`;
        })
        .filter(Boolean)
        .join(', ');

      const iconoPieza = pieza.icon || '🧩';
      const etiquetaTipo = pieza.typeLabel || pieza.type || 'Pieza';
      const tituloLibro = pieza.bookTitle ||
                         this.labUI?.getBookTitle(pieza.bookId) ||
                         'Libro desconocido';

      return `- ${iconoPieza} ${etiquetaTipo}: "${pieza.title || 'Sin título'}" (${tituloLibro}) → ${atributosSeguros || 'sin atributos detectados'}`;
    }).join('\n');
  }

  /**
   * Obtener piezas canónicas del ser
   * Retorna array de piezas analizadas con sus atributos y metadata
   *
   * @param {Object} serSobrescrito - Ser alternativo a analizar (opcional)
   * @returns {Array} Array de piezas con análisis completo
   */
  getCanonicalPieces(serSobrescrito = null) {
    if (!this.missionsSystem) return [];

    const serObjetivo = serSobrescrito || this.labUI?.currentBeing;
    const piezasAnalizadas = [];

    const metadataTipos = {
      chapter: { icon: '📖', label: 'Capítulo' },
      exercise: { icon: '🧪', label: 'Ejercicio' },
      resource: { icon: '🧰', label: 'Recurso' },
      special: { icon: '✨', label: 'Fragmento' }
    };

    /**
     * Procesar y agregar análisis de pieza
     * @private
     */
    const procesarAnalisis = (analisis) => {
      if (!analisis) return;

      const datosPieza = analisis.piece || analisis;
      if (!datosPieza) return;

      // Obtener top 3 atributos de la pieza
      const entradasAtributos = Object.entries(analisis.attributes || {})
        .filter(([, valor]) => valor > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([clave, valor]) => {
          const atributo = this.missionsSystem?.attributes?.[clave];
          return {
            key: clave,
            value: Math.round(valor),
            icon: atributo?.icon || '📊',
            name: atributo?.name || clave
          };
        });

      const infoTipo = metadataTipos[datosPieza.type] || { icon: '🧩', label: 'Pieza' };

      piezasAnalizadas.push({
        id: datosPieza.id || `piece-${piezasAnalizadas.length}`,
        title: datosPieza.title || 'Pieza sin título',
        type: datosPieza.type || 'piece',
        icon: datosPieza.icon || infoTipo.icon,
        typeLabel: infoTipo.label,
        bookId: datosPieza.bookId || '',
        bookTitle: datosPieza.bookTitle || this.labUI?.getBookTitle(datosPieza.bookId),
        attributes: entradasAtributos,
        totalPower: Math.round(analisis.totalPower || 0)
      });
    };

    // Procesar piezas del ser o de la selección actual
    if (serObjetivo?.pieces?.length) {
      serObjetivo.pieces.forEach(procesarAnalisis);
    } else if (this.labUI?.selectedPieces?.length && this.missionsSystem) {
      this.labUI.selectedPieces.forEach(pieza => {
        const analisis = this.missionsSystem.analyzePiece(pieza);
        procesarAnalisis(analisis);
      });
    }

    return piezasAnalizadas;
  }

  /**
   * Hablar con el ser (abrir chat IA con contexto del ser)
   * Integra con el sistema de chat IA si está disponible
   *
   * @param {Object} being - El ser con el que conversar
   * @param {Object} mission - La misión del ser (opcional)
   */
  talkTo(being, mission = null) {
    if (!being) {
      this.labUI?.showNotification('No hay ser para conversar', 'warning');
      return;
    }

    const textoPrompt = this.generatePrompt(being, mission);

    // Verificar si el chat de IA está disponible
    if (!window.aiChatModal) {
      // Fallback: mostrar prompt en modal
      if (this.labUI?.modals?.showPrompt) {
        this.labUI.modals.showPrompt(textoPrompt);
      }
      this.labUI?.showNotification(
        'Configura la IA en Ajustes para hablar con el ser dentro del laboratorio.',
        'info',
        5000
      );
      return;
    }

    // Limpiar instancias anteriores del chat
    const modalExistente = document.getElementById('ai-chat-modal');
    if (modalExistente) {
      modalExistente.remove();
    }

    // Actualizar contexto del motor de IA si está disponible
    if (window.labAIEngineProxy?.updateContext) {
      window.labAIEngineProxy.updateContext(
        being,
        mission || this.labUI?.selectedMission
      );
    }

    // Abrir chat de IA
    window.aiChatModal.open();

    // Configurar input del chat
    this.timeouts.push(
      setTimeout(() => {
        const campoInput = document.getElementById('ai-chat-input');
        if (campoInput) {
          campoInput.value = '';
          campoInput.placeholder = 'Describe tu siguiente paso o pregúntale algo a tu ser...';
          campoInput.focus();
        }
      }, 200)
    );
  }

  /**
   * Limpiar recursos y timeouts
   */
  destroy() {
    // Limpiar todos los timeouts
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts = [];

    // Limpiar referencias
    this.missionsSystem = null;
    this.labUI = null;
    this.dom = null;
    this.validationContainer = null;
  }
}
