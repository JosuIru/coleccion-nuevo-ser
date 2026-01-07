/**
 * FrankensteinBeingStorage
 * ========================
 * Módulo de gestión de almacenamiento para seres Frankenstein
 *
 * Responsabilidades:
 * - Persistencia de seres en localStorage
 * - Sincronización opcional con Supabase
 * - Serialización y deserialización de estado del laboratorio
 * - Gestión de estado temporal (sesión)
 * - Hidratación de piezas legacy
 *
 * @module FrankensteinBeingStorage
 * @version 2.9.154
 */

export class FrankensteinBeingStorage {
  /**
   * Constructor del gestor de almacenamiento
   *
   * @param {Object} labUIReference - Referencia a FrankensteinUI para acceso a dependencias
   * @param {string} storageKeyForBeings - Clave localStorage para seres guardados
   * @param {string} storageKeyForLabState - Clave localStorage para estado del laboratorio
   */
  constructor(labUIReference, storageKeyForBeings = 'frankenstein-saved-beings', storageKeyForLabState = 'frankenstein-lab-state') {
    this.labUI = labUIReference;
    this.storageKey = storageKeyForBeings;
    this.labStateKey = storageKeyForLabState;
    this.hasRestoredLabState = false;
  }

  /**
   * Guardar ser pidiendo nombre al usuario mediante prompt
   *
   * @returns {boolean} true si se guardó exitosamente
   */
  saveBeingWithPrompt() {
    if (!this.labUI.currentBeing || !this.labUI.selectedMission) {
      this.labUI.showNotification('⚠️ No hay ser para guardar', 'warning');
      return false;
    }

    const defaultName = `${this.labUI.selectedMission.name.substring(0, 20)} - ${new Date().toLocaleDateString()}`;
    const beingName = prompt('Nombre para este ser:', defaultName);

    if (!beingName) {
      // Usuario canceló
      return false;
    }

    return this.save(beingName.trim());
  }

  /**
   * Guardar ser actual en localStorage
   *
   * @param {string} beingName - Nombre descriptivo del ser
   * @returns {boolean} true si se guardó exitosamente
   */
  save(beingName) {
    if (!this.labUI.currentBeing || !this.labUI.selectedMission) {
      this.labUI.showNotification('⚠️ No hay ser para guardar', 'warning');
      return false;
    }

    try {
      // Cargar seres existentes
      const savedBeings = this.loadAll();

      // Crear objeto de ser guardado
      const savedBeing = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: beingName || `Ser del ${new Date().toLocaleDateString()}`,
        being: this.labUI.currentBeing,
        mission: this.labUI.selectedMission,
        validation: this.labUI.lastValidationResults,
        pieces: this.labUI.selectedPieces,
        // Metadata adicional
        totalPower: this.labUI.currentBeing.totalPower,
        pieceCount: this.labUI.selectedPieces.length,
        missionId: this.labUI.selectedMission.id
      };

      // Añadir a la lista
      savedBeings.push(savedBeing);

      // Guardar en localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(savedBeings));

      // Intentar guardar en Supabase si está disponible
      if (window.supabaseSyncHelper && window.supabaseSyncHelper.isAuthenticated) {
        this.saveBeingToSupabase(savedBeing).catch(err => {
          logger.warn('No se pudo sincronizar con Supabase:', err);
        });
      }

      this.labUI.showNotification(`✅ Ser "${savedBeing.name}" guardado exitosamente`, 'success', 4000);

      // Sonido dramático de trueno al crear ser
      if (window.frankenAudio && window.frankenAudio.enabled) {
        window.frankenAudio.playThunder();
        logger.log('[FrankenAudio] ⚡ Trueno reproducido al crear ser');
      }

      // Recompensa por crear/guardar ser
      if (window.frankensteinRewards) {
        window.frankensteinRewards.giveReward('createBeing');
      }

      return true;
    } catch (error) {
      logger.error('Error guardando ser:', error);
      this.labUI.showNotification('❌ Error al guardar el ser', 'error');
      return false;
    }
  }

  /**
   * Cargar todos los seres guardados desde localStorage
   *
   * @returns {Array} Lista de seres guardados
   */
  loadAll() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      logger.error('Error cargando seres:', error);
      return [];
    }
  }

  /**
   * Cargar un ser específico por ID
   *
   * @param {number|string} savedBeingId - ID del ser a cargar
   * @returns {boolean} true si se cargó exitosamente
   */
  load(savedBeingId) {
    try {
      const savedBeings = this.loadAll();
      const savedBeing = savedBeings.find(b => b.id === savedBeingId);

      if (!savedBeing) {
        this.labUI.showNotification('⚠️ Ser no encontrado', 'warning');
        return false;
      }

      // Resolver misión actual desde el sistema (por si cambió el schema)
      if (this.labUI.missionsSystem) {
        const missionId = savedBeing.mission?.id || savedBeing.missionId;
        const resolvedMission = this.labUI.missionsSystem.missions.find(m => m.id === missionId);
        this.labUI.selectedMission = resolvedMission || savedBeing.mission || null;
      } else {
        this.labUI.selectedMission = savedBeing.mission || null;
      }

      this.labUI.ensureMissionRequirements(this.labUI.selectedMission);

      // Mapear piezas guardadas a las disponibles actualmente
      const piecesById = new Map(this.labUI.availablePieces.map(piece => [piece.id, piece]));
      const storedPieces = savedBeing.pieces?.length
        ? savedBeing.pieces
        : (savedBeing.being?.pieces?.map(entry => entry.piece || entry) || []);

      const missingPieces = [];
      this.labUI.selectedPieces = storedPieces
        .map(piece => {
          const overrides = piece?.overrides ? piece.overrides : piece;
          const resolved = piecesById.get(piece.id);

          if (resolved) {
            return { ...resolved, ...overrides };
          }

          const fallback = this.hydrateLegacyPiece(overrides);
          if (fallback) {
            missingPieces.push(fallback);
            return fallback;
          }
          return null;
        })
        .filter(Boolean);

      if (missingPieces.length > 0) {
        logger.warn('[FrankensteinUI] Piezas no encontradas en el catálogo actual:', missingPieces.map(p => p.id));
        this.labUI.showNotification(`⚠️ ${missingPieces.length} piezas no existen en el catálogo actual. Se usaron versiones de respaldo.`, 'warning', 6000);
      }

      this.labUI.lastValidationResults = savedBeing.validation || null;

      const analyzedPieces = (this.labUI.missionsSystem && this.labUI.selectedPieces.length > 0)
        ? this.labUI.selectedPieces.map(piece =>
            this.labUI.missionsSystem.analyzePiece(piece) || { piece, attributes: {}, totalPower: 0 }
          )
        : [];

      let restoredBeing = null;
      const isDemoBeing = Boolean(savedBeing.id && savedBeing.id.startsWith('demo-')) || Boolean(savedBeing.isDemo);

      const shouldUseSnapshot =
        isDemoBeing ||
        !this.labUI.missionsSystem ||
        analyzedPieces.length === 0 ||
        missingPieces.length > 0;

      if (this.labUI.missionsSystem && analyzedPieces.length > 0 && !shouldUseSnapshot) {
        restoredBeing = this.labUI.missionsSystem.createBeing(analyzedPieces, savedBeing.name || 'Ser guardado');
        restoredBeing.pieces = analyzedPieces;
      } else if (savedBeing.being) {
        restoredBeing = {
          ...savedBeing.being,
          pieces: savedBeing.being.pieces || analyzedPieces
        };
      } else {
        restoredBeing = {
          name: savedBeing.name || 'Ser guardado',
          attributes: {},
          totalPower: savedBeing.totalPower || 0,
          balance: null,
          pieces: analyzedPieces
        };
      }

      const savedPower = savedBeing.totalPower || savedBeing.being?.totalPower || 0;
      if (savedPower > (restoredBeing?.totalPower || 0)) {
        restoredBeing.totalPower = savedPower;
      }

      this.labUI.currentBeing = {
        ...restoredBeing,
        name: savedBeing.name || restoredBeing?.name || 'Ser guardado'
      };

      // Calcular balance si no existe (para seres demo)
      if (!this.labUI.currentBeing.balance && this.labUI.currentBeing.attributes) {
        const attrs = this.labUI.currentBeing.attributes;
        this.labUI.currentBeing.balance = {
          intellectual: Math.round((attrs.wisdom + attrs.consciousness) / 2),
          emotional: Math.round((attrs.empathy + attrs.balance) / 2),
          action: Math.round((attrs.action + attrs.courage) / 2),
          spiritual: Math.round((attrs.consciousness + attrs.balance) / 2),
          practical: Math.round((attrs.organization + attrs.discipline) / 2),
          harmony: Math.round((attrs.balance + attrs.resilience) / 2)
        };
      }

      // Actualizar UI del laboratorio
      this.labUI.updateBeingDisplay();
      this.labUI.applyDemoScenario(savedBeing);

      if (this.labUI.selectedMission) {
        this.labUI.updateRequirementsPanel();
      } else {
        this.labUI.clearRequirementsPanel();
      }

      // Marcar piezas como seleccionadas en el grid
      document.querySelectorAll('.piece-card.selected').forEach(card => card.classList.remove('selected'));
      this.labUI.selectedPieces.forEach(piece => {
        if (!piece || !piece.id) return;
        const card = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (card) {
          card.classList.add('selected');
        }
      });

      // Resaltar misión seleccionada en la UI si existe
      if (this.labUI.selectedMission?.id) {
        document.querySelectorAll('.mission-card.selected, .mission-tab.selected').forEach(c => c.classList.remove('selected'));
        const missionCard = document.querySelector(`[data-mission-id="${this.labUI.selectedMission.id}"]`);
        if (missionCard) {
          missionCard.classList.add('selected');
        }
      }

      this.labUI.generateMiniChallenge(true);
      this.labUI.showNotification(`✅ Ser "${savedBeing.name}" cargado`, 'success', 3000);
      this.saveState();
      return true;
    } catch (error) {
      logger.error('Error cargando ser:', error);
      this.labUI.showNotification('❌ Error al cargar el ser', 'error');
      return false;
    }
  }

  /**
   * Eliminar un ser guardado por ID
   *
   * @param {number|string} savedBeingId - ID del ser a eliminar
   * @returns {boolean} true si se eliminó exitosamente
   */
  delete(savedBeingId) {
    try {
      let savedBeings = this.loadAll();
      const originalLength = savedBeings.length;

      savedBeings = savedBeings.filter(b => b.id !== savedBeingId);

      if (savedBeings.length === originalLength) {
        this.labUI.showNotification('⚠️ Ser no encontrado', 'warning');
        return false;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(savedBeings));
      this.labUI.showNotification('🗑️ Ser eliminado', 'info', 2000);
      return true;
    } catch (error) {
      logger.error('Error eliminando ser:', error);
      this.labUI.showNotification('❌ Error al eliminar el ser', 'error');
      return false;
    }
  }

  /**
   * Guardar ser en Supabase (sincronización opcional)
   *
   * @param {Object} savedBeing - Objeto del ser a sincronizar
   * @returns {Promise<void>}
   */
  async saveBeingToSupabase(savedBeing) {
    if (!window.supabase) return;

    try {
      const { data, error } = await window.supabase
        .from('frankenstein_beings')
        .insert([{
          user_id: window.supabaseSyncHelper.userId,
          being_data: savedBeing,
          name: savedBeing.name,
          mission_id: savedBeing.missionId,
          total_power: savedBeing.totalPower,
          created_at: savedBeing.timestamp
        }]);

      if (error) throw error;
      logger.log('✅ Ser sincronizado con Supabase');
    } catch (error) {
      logger.warn('Error en Supabase sync:', error);
      // No lanzar error, es opcional
    }
  }

  /**
   * Guardar estado actual del laboratorio en localStorage
   * Incluye misión seleccionada y piezas activas
   *
   * @returns {void}
   */
  saveState() {
    if (!window?.localStorage) return;
    const record = {
      missionId: this.labUI.selectedMission?.id || null,
      selectedPieces: this.labUI.selectedPieces.map(piece => this.serializePieceState(piece))
    };
    try {
      localStorage.setItem(this.labStateKey, JSON.stringify(record));
    } catch (error) {
      logger.warn('[FrankensteinUI] No se pudo guardar el estado del laboratorio:', error);
    }
  }

  /**
   * Serializar estado de una pieza para almacenamiento
   * Extrae solo los campos relevantes para persistencia
   *
   * @param {Object} piece - Pieza a serializar
   * @returns {Object} Estado serializado { id, overrides }
   */
  serializePieceState(piece) {
    if (!piece) return null;
    const overrides = {};
    const fields = [
      'title', 'bookTitle', 'bookId', 'chapterId', 'exerciseId', 'icon',
      'type', 'description', 'dominantAttribute', 'totalPower', 'powerMultiplier',
      'quizScore', 'quizTotal', 'syntheticAttributes', 'isSpecialReward', 'color', 'tags'
    ];
    fields.forEach(key => {
      if (piece[key] !== undefined) {
        overrides[key] = piece[key];
      }
    });
    return {
      id: piece.id || `piece-${Date.now()}`,
      overrides
    };
  }

  /**
   * Restaurar estado del laboratorio desde localStorage
   * Carga misión y piezas seleccionadas de la última sesión
   *
   * @returns {void}
   */
  restoreState() {
    if (this.hasRestoredLabState) return;
    this.hasRestoredLabState = true;
    if (!window?.localStorage) return;
    const raw = localStorage.getItem(this.labStateKey);
    if (!raw) return;
    let state;
    try {
      state = JSON.parse(raw);
    } catch (error) {
      logger.warn('[FrankensteinUI] Estado del laboratorio corrupto:', error);
      return;
    }

    if (state?.missionId) {
      this.applyMissionFromState(state.missionId);
    }

    if (Array.isArray(state?.selectedPieces) && state.selectedPieces.length) {
      document.querySelectorAll('.piece-card.selected, .mobile-piece-card.selected').forEach(card => {
        card.classList.remove('selected');
      });

      this.labUI.selectedPieces = this.rehydratePiecesFromState(state.selectedPieces);
      this.labUI.selectedPieces.forEach(piece => this.markSelectedPieceCards(piece.id));
      if (this.labUI.selectedPieces.length) {
        this.labUI.updateBeingFromPieces();
      } else {
        this.labUI.currentBeing = null;
        this.labUI.updateBeingDisplay();
      }
    } else {
      this.labUI.updateBeingDisplay();
    }

    this.labUI.updateRequirementsPanel();
    this.labUI.updateDemoScenarioProgress();
    this.labUI.updateMiniChallengeProgress();
    this.labUI.updatePiecesSidebarMeta();
    this.saveState();
  }

  /**
   * Rehidratar piezas desde registros serializados
   * Combina IDs con catálogo actual más overrides
   *
   * @param {Array} records - Registros de piezas serializadas
   * @returns {Array} Piezas rehidratadas
   */
  rehydratePiecesFromState(records = []) {
    const piecesById = new Map(this.labUI.availablePieces.map(piece => [piece.id, piece]));
    const rehydrated = [];
    records.forEach(record => {
      if (!record?.id) return;
      const overrides = record.overrides || {};
      const base = piecesById.get(record.id);
      if (base) {
        rehydrated.push({ ...base, ...overrides });
      } else {
        rehydrated.push({ id: record.id, ...overrides });
      }
    });
    return rehydrated;
  }

  /**
   * Hidratar pieza legacy (piezas que ya no existen en el catálogo)
   * Reconstruye una pieza válida a partir de sus datos guardados
   *
   * @param {Object} piece - Datos de pieza legacy
   * @returns {Object|null} Pieza hidratada o null si no es válida
   */
  hydrateLegacyPiece(piece) {
    if (!piece || !piece.id) return null;
    const hydrated = { ...piece };
    hydrated.type = hydrated.type || 'chapter';
    hydrated.bookId = hydrated.bookId || (piece.id.includes('-') ? piece.id.split('-')[0] : '');
    hydrated.bookTitle = hydrated.bookTitle || this.labUI.getBookTitle(hydrated.bookId);
    hydrated.title = hydrated.title || 'Pieza sin título';
    hydrated.color = hydrated.color || this.labUI.getBookColor(hydrated.bookId);
    return hydrated;
  }

  /**
   * Marcar tarjetas de piezas como seleccionadas en el DOM
   *
   * @param {string} pieceId - ID de la pieza a marcar
   * @returns {void}
   */
  markSelectedPieceCards(pieceId) {
    if (!pieceId) return;
    ['.piece-card', '.mobile-piece-card'].forEach(selector => {
      const card = document.querySelector(`${selector}[data-piece-id="${pieceId}"]`);
      if (card) {
        card.classList.add('selected');
      }
    });
  }

  /**
   * Aplicar misión desde estado restaurado
   *
   * @param {string} missionId - ID de la misión a aplicar
   * @returns {boolean} true si se aplicó exitosamente
   */
  applyMissionFromState(missionId) {
    if (!missionId || !this.labUI.missionsSystem) return false;
    const mission = this.labUI.missionsSystem.missions.find(m => m.id === missionId);
    if (!mission) return false;
    const card = document.querySelector(`[data-mission-id="${mission.id}"]`);
    if (card) {
      this.labUI.selectMission(mission, card, { silent: true });
      return true;
    }

    this.labUI.selectedMission = mission;
    this.labUI.ensureMissionRequirements(mission);
    this.labUI.updateMissionProgressUI({
      fulfilled: 0,
      total: mission.requirements ? mission.requirements.length : 0
    });
    this.labUI.updateBeingDisplay();
    this.labUI.updateRequirementsPanel();
    return true;
  }

  /**
   * Limpiar y destruir instancia
   * Libera referencias para permitir GC
   *
   * @returns {void}
   */
  destroy() {
    this.labUI = null;
    this.storageKey = null;
    this.labStateKey = null;
    this.hasRestoredLabState = false;
  }
}
