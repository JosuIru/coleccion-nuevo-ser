/**
 * SISTEMA DE GUARDADO/CARGA DE SOCIEDADES
 * Persistencia completa con múltiples slots
 */

class SaveSystem {
  constructor() {
    this.maxSlots = 5; // Slots gratuitos
    this.saves = {};
    this.autosaveEnabled = true;
    this.autosaveInterval = 30000; // 30 segundos
    this.autosaveTimer = null;

    this.loadAllSaves();
  }

  /**
   * Guardar sociedad en slot
   */
  saveSociety(society, slotId = 'autosave', metadata = {}) {
    const saveData = {
      version: '1.0',
      timestamp: Date.now(),
      slotId,
      metadata: {
        name: metadata.name || society.name,
        goal: society.goal,
        turn: society.turn,
        population: society.beings.filter(b => b.alive).length,
        thumbnail: metadata.thumbnail || null, // Para UI
        ...metadata
      },
      society: this.serializeSociety(society)
    };

    this.saves[slotId] = saveData;
    this.persistToStorage();

    // console.log(`💾 Sociedad guardada en slot: ${slotId}`);
    return true;
  }

  /**
   * Cargar sociedad desde slot
   */
  loadSociety(slotId) {
    const saveData = this.saves[slotId];
    if (!saveData) {
      console.error(`❌ No se encontró save en slot: ${slotId}`);
      return null;
    }

    try {
      const society = this.deserializeSociety(saveData.society);
      // console.log(`📂 Sociedad cargada desde slot: ${slotId}`);
      return society;
    } catch (error) {
      console.error(`❌ Error al cargar sociedad:`, error);
      return null;
    }
  }

  /**
   * Serializar sociedad a JSON-compatible object
   */
  serializeSociety(society) {
    return {
      name: society.name,
      goal: society.goal,
      turn: society.turn,
      running: false, // Siempre pausada al guardar
      speed: society.speed,

      metrics: {...society.metrics},
      metricsHistory: society.metricsHistory.map(m => ({...m})),
      eventLog: society.eventLog.map(e => ({...e})),

      beings: society.beings.map(b => ({
        name: b.name,
        attributes: {...b.attributes},
        pieces: b.pieces ? b.pieces.map(p => ({...p})) : [],
        totalPower: b.totalPower,
        fitness: b.fitness,
        alive: b.alive,
        generation: b.generation || 1
      })),

      // Metadata adicional
      savedAt: Date.now(),
      gameVersion: '1.0'
    };
  }

  /**
   * Deserializar de JSON a MicroSociety
   */
  deserializeSociety(data) {
    // Crear nueva instancia de MicroSociety
    // Nota: Necesitamos importar o tener acceso a la clase
    const society = Object.create(MicroSociety.prototype);

    // Restaurar propiedades
    society.name = data.name;
    society.goal = data.goal;
    society.turn = data.turn;
    society.running = false;
    society.speed = data.speed;
    society.intervalId = null;

    society.metrics = {...data.metrics};
    society.metricsHistory = data.metricsHistory.map(m => ({...m}));
    society.eventLog = data.eventLog.map(e => ({...e}));

    society.beings = data.beings.map(b => ({
      name: b.name,
      attributes: {...b.attributes},
      pieces: b.pieces || [],
      totalPower: b.totalPower,
      fitness: b.fitness,
      alive: b.alive,
      generation: b.generation || 1
    }));

    return society;
  }

  /**
   * Obtener lista de saves
   */
  getSavesList() {
    return Object.entries(this.saves).map(([slotId, data]) => ({
      slotId,
      name: data.metadata.name,
      turn: data.metadata.turn,
      population: data.metadata.population,
      timestamp: data.timestamp,
      thumbnail: data.metadata.thumbnail
    })).sort((a, b) => b.timestamp - a.timestamp); // Más reciente primero
  }

  /**
   * Eliminar save
   */
  deleteSave(slotId) {
    if (this.saves[slotId]) {
      delete this.saves[slotId];
      this.persistToStorage();
      // console.log(`🗑️ Save eliminado: ${slotId}`);
      return true;
    }
    return false;
  }

  /**
   * Verificar si slot está ocupado
   */
  isSlotOccupied(slotId) {
    return !!this.saves[slotId];
  }

  /**
   * Obtener slots disponibles
   */
  getAvailableSlots() {
    const occupied = Object.keys(this.saves).filter(id => id !== 'autosave').length;
    return this.maxSlots - occupied;
  }

  /**
   * Autosave
   */
  startAutosave(society) {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }

    this.autosaveTimer = setInterval(() => {
      if (this.autosaveEnabled && society) {
        this.saveSociety(society, 'autosave', {
          name: `${society.name} (Autosave)`,
          auto: true
        });
      }
    }, this.autosaveInterval);

    // console.log(`💾 Autosave activado (cada ${this.autosaveInterval / 1000}s)`);
  }

  /**
   * Detener autosave
   */
  stopAutosave() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
      // console.log('💾 Autosave detenido');
    }
  }

  /**
   * Exportar save a archivo JSON
   */
  exportToFile(slotId) {
    const saveData = this.saves[slotId];
    if (!saveData) return null;

    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Crear link de descarga temporal
    const a = document.createElement('a');
    a.href = url;
    a.download = `microsociety-${saveData.metadata.name}-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    // console.log('📤 Save exportado a archivo');
    return true;
  }

  /**
   * Importar save desde archivo JSON
   */
  importFromFile(file, slotId = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result);

          // Validar versión
          if (saveData.version !== '1.0') {
            reject(new Error('Versión de save incompatible'));
            return;
          }

          // Asignar a slot disponible
          const targetSlot = slotId || `import-${Date.now()}`;
          this.saves[targetSlot] = saveData;
          this.persistToStorage();

          // console.log(`📥 Save importado a slot: ${targetSlot}`);
          resolve(targetSlot);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Generar thumbnail de la sociedad
   */
  generateThumbnail(society) {
    // Crear canvas mini para preview
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    // Fondo
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 200, 150);

    // Dibujar mini-gráfico de métricas
    const metrics = society.metrics;
    const colors = {
      health: '#2d5016',
      knowledge: '#d4af37',
      action: '#8b0000',
      cohesion: '#4a235a'
    };

    let x = 20;
    Object.entries(metrics).forEach(([key, value]) => {
      ctx.fillStyle = colors[key];
      const height = (value / 100) * 100;
      ctx.fillRect(x, 130 - height, 30, height);
      x += 40;
    });

    // Texto: Turno
    ctx.fillStyle = '#f4e9d8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Turn: ${society.turn}`, 10, 20);

    // Población
    const population = society.beings.filter(b => b.alive).length;
    ctx.fillText(`Pop: ${population}`, 10, 40);

    return canvas.toDataURL();
  }

  /**
   * Persistir a localStorage
   */
  persistToStorage() {
    try {
      localStorage.setItem('microsocieties-saves', JSON.stringify(this.saves));
    } catch (error) {
      console.error('❌ Error al guardar en localStorage:', error);
      // Si localStorage está lleno, eliminar saves más antiguos
      if (error.name === 'QuotaExceededError') {
        this.cleanOldSaves();
        localStorage.setItem('microsocieties-saves', JSON.stringify(this.saves));
      }
    }
  }

  /**
   * Cargar todos los saves
   */
  loadAllSaves() {
    try {
      const saved = localStorage.getItem('microsocieties-saves');
      if (saved) {
        this.saves = JSON.parse(saved);
        // console.log(`📂 ${Object.keys(this.saves).length} saves cargados`);
      }
    } catch (error) {
      console.error('❌ Error al cargar saves:', error);
      this.saves = {};
    }
  }

  /**
   * Limpiar saves antiguos
   */
  cleanOldSaves() {
    const saves = Object.entries(this.saves)
      .filter(([id]) => id !== 'autosave')
      .sort(([, a], [, b]) => b.timestamp - a.timestamp);

    // Mantener solo los 3 más recientes
    const toKeep = saves.slice(0, 3);
    const toDelete = saves.slice(3);

    toDelete.forEach(([id]) => {
      delete this.saves[id];
      // console.log(`🗑️ Save antiguo eliminado: ${id}`);
    });
  }

  /**
   * Obtener estadísticas de almacenamiento
   */
  getStorageStats() {
    const json = JSON.stringify(this.saves);
    const sizeInBytes = new Blob([json]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);

    // Estimar límite (típicamente 5-10MB en localStorage)
    const estimatedLimit = 5 * 1024; // 5MB en KB
    const usagePercentage = ((sizeInKB / estimatedLimit) * 100).toFixed(2);

    return {
      sizeInBytes,
      sizeInKB,
      usagePercentage,
      totalSaves: Object.keys(this.saves).length,
      availableSlots: this.getAvailableSlots()
    };
  }

  /**
   * Resetear todo
   */
  resetAll() {
    this.saves = {};
    this.stopAutosave();
    this.persistToStorage();
    // console.log('🗑️ Todos los saves eliminados');
  }
}

// Exportar
window.SaveSystem = SaveSystem;
// console.log('💾 Sistema de Guardado cargado');
