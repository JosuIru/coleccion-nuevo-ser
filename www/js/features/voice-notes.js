// ============================================================================
// VOICE NOTES - Sistema de Notas de Voz
// v2.9.372: Búsqueda de transcripciones y gestión de almacenamiento
// ============================================================================

class VoiceNotes {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.maxDurationMs = 120000; // 2 minutos máximo
    this.notes = this.loadNotes();

    // v2.9.368: Transcripción automática
    this.speechRecognition = null;
    this.currentTranscript = '';
    this.transcriptionEnabled = this.loadTranscriptionPreference();
    this.initSpeechRecognition();

    // Exponer globalmente
    window.voiceNotes = this;
  }

  // ==========================================================================
  // v2.9.368: TRANSCRIPCIÓN AUTOMÁTICA
  // ==========================================================================

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      logger.warn('[VoiceNotes] SpeechRecognition no disponible');
      return;
    }

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = 'es-ES';
    this.speechRecognition.maxAlternatives = 1;

    this.speechRecognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.currentTranscript += finalTranscript;
      }

      // Update UI with current transcription
      this.updateTranscriptionUI(this.currentTranscript + interimTranscript);
    };

    this.speechRecognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        logger.warn('[VoiceNotes] Speech recognition error:', event.error);
      }
    };

    this.speechRecognition.onend = () => {
      // Restart if still recording
      if (this.isRecording && this.transcriptionEnabled && this.speechRecognition) {
        try {
          this.speechRecognition.start();
        } catch (e) {
          // Already started
        }
      }
    };
  }

  startTranscription() {
    if (!this.speechRecognition || !this.transcriptionEnabled) return;

    this.currentTranscript = '';
    try {
      this.speechRecognition.start();
    } catch (e) {
      logger.warn('[VoiceNotes] Error starting transcription:', e);
    }
  }

  stopTranscription() {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {
        // Already stopped
      }
    }
    return this.currentTranscript.trim();
  }

  updateTranscriptionUI(text) {
    const transcriptEl = document.getElementById('voice-transcript');
    if (transcriptEl) {
      transcriptEl.textContent = text || 'Escuchando...';
      transcriptEl.scrollTop = transcriptEl.scrollHeight;
    }
  }

  loadTranscriptionPreference() {
    return localStorage.getItem('voice-notes-transcription') !== 'false';
  }

  saveTranscriptionPreference(enabled) {
    this.transcriptionEnabled = enabled;
    localStorage.setItem('voice-notes-transcription', enabled.toString());
  }

  static isTranscriptionSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadNotes() {
    try {
      return JSON.parse(localStorage.getItem('voice-notes-metadata')) || {};
    } catch {
      return {};
    }
  }

  saveNotesMetadata() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      localStorage.setItem('voice-notes-metadata', JSON.stringify(this.notes));
    } catch (error) {
      logger.error('Error guardando metadatos de notas de voz:', error);
      window.toast?.error('Error al guardar nota de voz. Intenta de nuevo.');
    }
  }

  // ==========================================================================
  // GRABACIÓN
  // ==========================================================================

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // v2.9.368: Start transcription alongside recording
      this.startTranscription();

      // Auto-stop after max duration
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
          window.toast?.warning('Grabación finalizada (máximo 2 minutos)');
        }
      }, this.maxDurationMs);

      return true;
    } catch (error) {
      logger.error('Error starting recording:', error);
      window.toast?.error('No se pudo acceder al micrófono');
      return false;
    }
  }

  async stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      clearTimeout(this.recordingTimeout);

      // v2.9.368: Stop transcription and get result
      const transcript = this.stopTranscription();

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;

        // Stop all tracks
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Create blob from chunks
        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const duration = Date.now() - this.recordingStartTime;

        resolve({ blob, duration, mimeType, transcript });
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording() {
    // v2.9.368: Stop transcription
    this.stopTranscription();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder.stop();
    }
    clearTimeout(this.recordingTimeout);
    this.isRecording = false;
    this.audioChunks = [];
  }

  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  }

  // ==========================================================================
  // ALMACENAMIENTO
  // ==========================================================================

  async saveVoiceNote(blob, duration, title = '', transcript = '') {
    const bookId = this.bookEngine?.getCurrentBook() || 'general';
    const chapterId = this.bookEngine?.currentChapterId || 'general';
    const noteId = `voice-${Date.now()}`;

    // Convert blob to base64 for localStorage
    const base64 = await this.blobToBase64(blob);

    // Store audio data
    localStorage.setItem(`voice-note-data-${noteId}`, base64);

    // Store metadata (v2.9.368: includes transcript)
    const metadata = {
      id: noteId,
      bookId,
      chapterId,
      title: title || `Nota de voz ${new Date().toLocaleDateString()}`,
      duration,
      mimeType: blob.type,
      transcript: transcript || '', // v2.9.368
      createdAt: new Date().toISOString()
    };

    if (!this.notes[bookId]) {
      this.notes[bookId] = {};
    }
    if (!this.notes[bookId][chapterId]) {
      this.notes[bookId][chapterId] = [];
    }
    this.notes[bookId][chapterId].push(metadata);
    this.saveNotesMetadata();

    // Track for achievements
    if (window.achievementSystem) {
      window.achievementSystem.stats.voiceNotesCount =
        (window.achievementSystem.stats.voiceNotesCount || 0) + 1;
      window.achievementSystem.saveStats();
    }

    return metadata;
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async getVoiceNoteBlob(noteId) {
    const base64 = localStorage.getItem(`voice-note-data-${noteId}`);
    if (!base64) return null;

    // Find metadata to get mime type
    let mimeType = 'audio/webm';
    for (const bookNotes of Object.values(this.notes)) {
      for (const chapterNotes of Object.values(bookNotes)) {
        const note = chapterNotes.find(n => n.id === noteId);
        if (note) {
          mimeType = note.mimeType;
          break;
        }
      }
    }

    // Convert base64 back to blob
    const response = await fetch(base64);
    return response.blob();
  }

  deleteVoiceNote(noteId) {
    // Remove data
    localStorage.removeItem(`voice-note-data-${noteId}`);

    // Remove from metadata
    for (const bookId of Object.keys(this.notes)) {
      for (const chapterId of Object.keys(this.notes[bookId])) {
        const index = this.notes[bookId][chapterId].findIndex(n => n.id === noteId);
        if (index !== -1) {
          this.notes[bookId][chapterId].splice(index, 1);
          if (this.notes[bookId][chapterId].length === 0) {
            delete this.notes[bookId][chapterId];
          }
          if (Object.keys(this.notes[bookId]).length === 0) {
            delete this.notes[bookId];
          }
          this.saveNotesMetadata();
          return true;
        }
      }
    }
    return false;
  }

  // ==========================================================================
  // CONSULTAS
  // ==========================================================================

  getNotesForChapter(bookId, chapterId) {
    return this.notes[bookId]?.[chapterId] || [];
  }

  getNotesForBook(bookId) {
    const bookNotes = this.notes[bookId] || {};
    return Object.values(bookNotes).flat();
  }

  getAllNotes() {
    const allNotes = [];
    for (const bookNotes of Object.values(this.notes)) {
      for (const chapterNotes of Object.values(bookNotes)) {
        allNotes.push(...chapterNotes);
      }
    }
    return allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getTotalCount() {
    return this.getAllNotes().length;
  }

  // ==========================================================================
  // v2.9.372: BÚSQUEDA DE TRANSCRIPCIONES
  // ==========================================================================

  /**
   * Busca en las transcripciones de todas las notas
   */
  searchTranscriptions(query) {
    if (!query || query.trim().length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const allNotes = this.getAllNotes();

    return allNotes.filter(note => {
      // Buscar en transcripción
      if (note.transcript && note.transcript.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      // También buscar en título
      if (note.title && note.title.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      return false;
    }).map(note => ({
      ...note,
      // Resaltar coincidencias en la transcripción
      highlightedTranscript: this.highlightMatch(note.transcript || '', query),
      highlightedTitle: this.highlightMatch(note.title || '', query)
    }));
  }

  /**
   * Resalta las coincidencias en el texto
   */
  highlightMatch(text, query) {
    if (!text || !query) return text;
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Muestra el modal de búsqueda
   */
  showSearchModal() {
    document.getElementById('voice-search-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'voice-search-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-gray-700">
        <div class="p-4 border-b border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              🔍 Buscar en transcripciones
            </h3>
            <button onclick="document.getElementById('voice-search-modal')?.remove()"
                    class="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
              ${window.Icons?.close?.(20) || '✕'}
            </button>
          </div>
          <input type="text" id="voice-search-input"
                 placeholder="Buscar en notas de voz..."
                 class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                 autofocus>
        </div>

        <div id="voice-search-results" class="flex-1 overflow-y-auto p-4">
          <p class="text-gray-500 text-center py-8">Escribe para buscar...</p>
        </div>

        <div class="p-3 border-t border-gray-700 text-xs text-gray-500 text-center">
          ${this.getTotalCount()} notas • ${this.getAllNotes().filter(n => n.transcript).length} con transcripción
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Búsqueda con debounce
    const searchInput = modal.querySelector('#voice-search-input');
    const resultsContainer = modal.querySelector('#voice-search-results');
    let searchTimeout;

    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        if (query.length < 2) {
          resultsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Escribe al menos 2 caracteres...</p>';
          return;
        }

        const results = this.searchTranscriptions(query);
        if (results.length === 0) {
          resultsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Sin resultados</p>';
        } else {
          resultsContainer.innerHTML = results.map(note => `
            <div class="p-3 bg-gray-800/50 rounded-lg mb-2 hover:bg-gray-800 cursor-pointer transition"
                 onclick="window.voiceNotes?.playNote('${note.id}')">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-red-400">🎙️</span>
                <span class="text-white font-medium">${note.highlightedTitle || note.title}</span>
                <span class="text-xs text-gray-500 ml-auto">${this.formatDuration(note.duration)}</span>
              </div>
              ${note.transcript ? `
                <p class="text-sm text-gray-300 line-clamp-3">${note.highlightedTranscript}</p>
              ` : ''}
              <p class="text-xs text-gray-500 mt-2">${new Date(note.createdAt).toLocaleDateString()}</p>
            </div>
          `).join('');
        }
      }, 300);
    });

    // Cerrar con ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Reproduce una nota por ID
   */
  async playNote(noteId) {
    const blob = await this.getVoiceNoteBlob(noteId);
    if (blob) {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => URL.revokeObjectURL(audioUrl));
      audio.addEventListener('error', () => URL.revokeObjectURL(audioUrl));
      audio.play();
      window.toast?.info('Reproduciendo nota...');
    } else {
      window.toast?.error('No se pudo cargar la nota');
    }
  }

  // ==========================================================================
  // v2.9.372: GESTIÓN DE ALMACENAMIENTO
  // ==========================================================================

  /**
   * Calcula el espacio usado por las notas de voz
   */
  calculateStorageUsage() {
    let totalBytes = 0;
    const notes = this.getAllNotes();

    for (const note of notes) {
      const data = localStorage.getItem(`voice-note-data-${note.id}`);
      if (data) {
        // base64 ocupa ~4/3 del tamaño original
        totalBytes += data.length * 0.75;
      }
    }

    // Metadatos
    const metadata = localStorage.getItem('voice-notes-metadata');
    if (metadata) {
      totalBytes += metadata.length;
    }

    return {
      bytes: totalBytes,
      formatted: this.formatBytes(totalBytes),
      notesCount: notes.length,
      withTranscript: notes.filter(n => n.transcript).length
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene notas antiguas para limpiar
   */
  getOldNotes(daysOld = 30) {
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    return this.getAllNotes().filter(note =>
      new Date(note.createdAt).getTime() < cutoffDate
    );
  }

  /**
   * Elimina notas antiguas
   */
  deleteOldNotes(daysOld = 30) {
    const oldNotes = this.getOldNotes(daysOld);
    let deletedCount = 0;

    for (const note of oldNotes) {
      if (this.deleteVoiceNote(note.id)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Muestra el modal de gestión de almacenamiento
   */
  showStorageModal() {
    document.getElementById('voice-storage-modal')?.remove();

    const usage = this.calculateStorageUsage();
    const oldNotes = this.getOldNotes(30);

    const modal = document.createElement('div');
    modal.id = 'voice-storage-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700">
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            💾 Almacenamiento de notas
          </h3>
          <button onclick="document.getElementById('voice-storage-modal')?.remove()"
                  class="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
            ${window.Icons?.close?.(20) || '✕'}
          </button>
        </div>

        <div class="p-6">
          <!-- Estadísticas -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-800 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-white">${usage.formatted}</p>
              <p class="text-xs text-gray-400">Espacio usado</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-white">${usage.notesCount}</p>
              <p class="text-xs text-gray-400">Notas guardadas</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-green-400">${usage.withTranscript}</p>
              <p class="text-xs text-gray-400">Con transcripción</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-yellow-400">${oldNotes.length}</p>
              <p class="text-xs text-gray-400">Antiguas (+30 días)</p>
            </div>
          </div>

          <!-- Acciones -->
          <div class="space-y-3">
            ${oldNotes.length > 0 ? `
              <button onclick="window.voiceNotes?.confirmDeleteOld()"
                      class="w-full px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 rounded-xl text-yellow-200 font-medium transition flex items-center justify-center gap-2">
                🗑️ Eliminar ${oldNotes.length} notas antiguas
              </button>
            ` : ''}
            <button onclick="window.voiceNotes?.confirmDeleteAll()"
                    class="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-xl text-red-200 font-medium transition flex items-center justify-center gap-2">
              ⚠️ Eliminar todas las notas
            </button>
            <button onclick="window.voiceNotes?.exportAllNotes()"
                    class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition flex items-center justify-center gap-2">
              📥 Exportar transcripciones
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Confirma y elimina notas antiguas
   */
  confirmDeleteOld() {
    const oldNotes = this.getOldNotes(30);
    if (confirm(`¿Eliminar ${oldNotes.length} notas de más de 30 días?\n\nEsta acción no se puede deshacer.`)) {
      const deleted = this.deleteOldNotes(30);
      window.toast?.success(`${deleted} notas eliminadas`);
      document.getElementById('voice-storage-modal')?.remove();
      this.showStorageModal(); // Refresh
    }
  }

  /**
   * Confirma y elimina todas las notas
   */
  confirmDeleteAll() {
    const allNotes = this.getAllNotes();
    if (confirm(`¿ELIMINAR TODAS las ${allNotes.length} notas de voz?\n\n⚠️ ESTA ACCIÓN ES IRREVERSIBLE`)) {
      if (confirm('¿Estás completamente seguro? Se perderán todas las grabaciones y transcripciones.')) {
        for (const note of allNotes) {
          this.deleteVoiceNote(note.id);
        }
        window.toast?.success('Todas las notas eliminadas');
        document.getElementById('voice-storage-modal')?.remove();
      }
    }
  }

  /**
   * Exporta todas las transcripciones a un archivo de texto
   */
  exportAllNotes() {
    const notes = this.getAllNotes();
    const notesWithTranscript = notes.filter(n => n.transcript);

    if (notesWithTranscript.length === 0) {
      window.toast?.info('No hay transcripciones para exportar');
      return;
    }

    let content = '# Notas de Voz - Transcripciones\n';
    content += `Exportado: ${new Date().toLocaleString()}\n\n`;
    content += '='.repeat(50) + '\n\n';

    for (const note of notesWithTranscript) {
      content += `## ${note.title}\n`;
      content += `Fecha: ${new Date(note.createdAt).toLocaleString()}\n`;
      content += `Duración: ${this.formatDuration(note.duration)}\n\n`;
      content += `${note.transcript}\n\n`;
      content += '-'.repeat(40) + '\n\n';
    }

    // Descargar archivo
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notas-voz-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    window.toast?.success(`${notesWithTranscript.length} transcripciones exportadas`);
  }

  // ==========================================================================
  // MODAL DE GRABACIÓN
  // ==========================================================================

  showRecordingModal() {
    const existing = document.getElementById('voice-notes-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'voice-notes-modal';
    modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-red-500/30 overflow-hidden">
        <!-- Header -->
        <div class="bg-red-900/30 px-6 py-4 border-b border-red-500/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🎙️</span>
            <h2 class="text-xl font-bold text-red-200">Nota de Voz</h2>
          </div>
          <button id="close-voice-modal"
                  class="text-red-300 hover:text-white p-3 hover:bg-red-800/50 rounded-lg transition"
                  aria-label="Cerrar nota de voz"
                  title="Cerrar">
            ${window.Icons?.close(20) || '✕'}
          </button>
        </div>

        <!-- Recording Area -->
        <div class="p-6 text-center">
          <!-- Recording Button -->
          <div id="recording-area">
            <button id="record-btn" class="w-24 h-24 rounded-full bg-red-600 hover:bg-red-500 transition-all flex items-center justify-center mx-auto shadow-lg hover:shadow-red-500/50">
              <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
            <p class="mt-4 text-gray-400">Toca para grabar</p>
          </div>

          <!-- Recording In Progress -->
          <div id="recording-in-progress" class="hidden">
            <div class="relative w-24 h-24 mx-auto">
              <div class="absolute inset-0 rounded-full bg-red-600 animate-pulse"></div>
              <button id="stop-btn" class="relative w-full h-full rounded-full bg-red-600 flex items-center justify-center">
                <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </button>
            </div>
            <p id="recording-time" class="mt-4 text-2xl font-bold text-red-400">00:00</p>
            <p class="text-gray-400">Grabando...</p>

            <!-- v2.9.368: Live transcription -->
            ${VoiceNotes.isTranscriptionSupported() ? `
              <div class="mt-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-gray-400 flex items-center gap-1">
                    <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Transcribiendo...
                  </span>
                </div>
                <p id="voice-transcript" class="text-sm text-gray-300 text-left max-h-20 overflow-y-auto">Escuchando...</p>
              </div>
            ` : ''}

            <button id="cancel-recording-btn" class="mt-2 text-sm text-gray-500 hover:text-gray-300">
              Cancelar
            </button>
          </div>

          <!-- Preview Area -->
          <div id="preview-area" class="hidden">
            <audio id="audio-preview" controls class="w-full mb-4"></audio>

            <label for="note-title" class="sr-only">Título de la nota</label>
            <input type="text" id="note-title" placeholder="Título de la nota (opcional)"
                   aria-label="Título de la nota de voz"
                   class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 mb-3 focus:ring-2 focus:ring-red-500 focus:outline-none">

            <!-- v2.9.368: Transcript preview/edit -->
            <div id="transcript-preview" class="hidden mb-4">
              <label class="text-xs text-gray-400 mb-1 block text-left">Transcripción (editable)</label>
              <textarea id="transcript-edit" rows="3"
                        class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:outline-none"
                        placeholder="Transcripción de la nota..."></textarea>
            </div>

            <div class="flex gap-3">
              <button id="discard-btn" class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition">
                Descartar
              </button>
              <button id="save-voice-note-btn" class="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition">
                Guardar
              </button>
            </div>
          </div>
        </div>

        <!-- Existing Notes -->
        <div class="border-t border-gray-700 p-4">
          <h3 class="text-sm font-semibold text-gray-400 mb-3">Notas de voz guardadas</h3>
          <div id="voice-notes-list" class="space-y-2 max-h-40 overflow-y-auto">
            ${this.renderNotesList()}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachModalListeners(modal);
  }

  renderNotesList() {
    const notes = this.getAllNotes();

    if (notes.length === 0) {
      return '<p class="text-gray-500 text-sm text-center">No hay notas de voz</p>';
    }

    return notes.slice(0, 5).map(note => `
      <div class="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg group">
        <button class="play-voice-note flex-shrink-0 w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600/40 flex items-center justify-center transition"
                data-note-id="${note.id}">
          <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-200 truncate">${note.title}</p>
          <p class="text-xs text-gray-500">${this.formatDuration(note.duration)}${note.transcript ? ' • 📝' : ''}</p>
          ${note.transcript ? `<p class="text-xs text-gray-400 truncate mt-0.5">${note.transcript.substring(0, 50)}${note.transcript.length > 50 ? '...' : ''}</p>` : ''}
        </div>
        <button class="show-transcript-btn ${note.transcript ? '' : 'hidden'} p-2 hover:bg-gray-700 rounded transition"
                data-note-id="${note.id}"
                data-transcript="${this.escapeAttr(note.transcript || '')}"
                title="Ver transcripción">
          📝
        </button>
        <button class="delete-voice-note opacity-0 group-hover:opacity-100 p-2 hover:bg-red-900/50 rounded transition"
                data-note-id="${note.id}">
          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `).join('');
  }

  escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  attachModalListeners(modal) {
    let recordingInterval = null;
    let pendingBlob = null;

    // Close
    const closeModal = () => {
      if (this.isRecording) {
        this.cancelRecording();
      }
      clearInterval(recordingInterval);
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('#close-voice-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Recording area elements
    const recordingArea = modal.querySelector('#recording-area');
    const recordingInProgress = modal.querySelector('#recording-in-progress');
    const previewArea = modal.querySelector('#preview-area');
    const recordingTime = modal.querySelector('#recording-time');

    // Start recording
    modal.querySelector('#record-btn')?.addEventListener('click', async () => {
      const started = await this.startRecording();
      if (started) {
        recordingArea.classList.add('hidden');
        recordingInProgress.classList.remove('hidden');

        // Update timer
        recordingInterval = setInterval(() => {
          const elapsed = Date.now() - this.recordingStartTime;
          recordingTime.textContent = this.formatDuration(elapsed);
        }, 100);
      }
    });

    // Stop recording
    let pendingTranscript = '';
    modal.querySelector('#stop-btn')?.addEventListener('click', async () => {
      clearInterval(recordingInterval);
      const result = await this.stopRecording();

      if (result) {
        pendingBlob = result.blob;
        pendingTranscript = result.transcript || '';
        recordingInProgress.classList.add('hidden');
        previewArea.classList.remove('hidden');

        // Set up audio preview
        const audioPreview = modal.querySelector('#audio-preview');
        // 🧹 Limpiar URL anterior si existe
        if (audioPreview.src && audioPreview.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioPreview.src);
        }
        audioPreview.src = URL.createObjectURL(result.blob);

        // v2.9.368: Show transcript if available
        const transcriptPreview = modal.querySelector('#transcript-preview');
        const transcriptEdit = modal.querySelector('#transcript-edit');
        if (pendingTranscript && transcriptPreview && transcriptEdit) {
          transcriptEdit.value = pendingTranscript;
          transcriptPreview.classList.remove('hidden');
        }
      }
    });

    // Cancel recording
    modal.querySelector('#cancel-recording-btn')?.addEventListener('click', () => {
      clearInterval(recordingInterval);
      this.cancelRecording();
      recordingInProgress.classList.add('hidden');
      recordingArea.classList.remove('hidden');
    });

    // Discard
    modal.querySelector('#discard-btn')?.addEventListener('click', () => {
      // 🧹 Limpiar URL del preview
      const audioPreview = modal.querySelector('#audio-preview');
      if (audioPreview && audioPreview.src && audioPreview.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreview.src);
        audioPreview.src = '';
      }

      pendingBlob = null;
      pendingTranscript = '';
      previewArea.classList.add('hidden');
      recordingArea.classList.remove('hidden');
      modal.querySelector('#note-title').value = '';
      // v2.9.368: Hide transcript
      modal.querySelector('#transcript-preview')?.classList.add('hidden');
      modal.querySelector('#transcript-edit').value = '';
    });

    // Save
    modal.querySelector('#save-voice-note-btn')?.addEventListener('click', async () => {
      if (pendingBlob) {
        const title = modal.querySelector('#note-title').value.trim();
        const duration = Date.now() - this.recordingStartTime;
        // v2.9.368: Include edited transcript
        const transcript = modal.querySelector('#transcript-edit')?.value.trim() || pendingTranscript;
        await this.saveVoiceNote(pendingBlob, duration, title, transcript);
        window.toast?.success('Nota de voz guardada');
        closeModal();
      }
    });

    // Play existing notes
    modal.querySelectorAll('.play-voice-note').forEach(btn => {
      btn.addEventListener('click', async () => {
        const noteId = btn.dataset.noteId;
        const blob = await this.getVoiceNoteBlob(noteId);
        if (blob) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);

          // 🧹 Limpiar URL cuando termine de reproducir
          audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
          });

          // 🧹 También limpiar si hay error
          audio.addEventListener('error', () => {
            URL.revokeObjectURL(audioUrl);
          });

          audio.play();
        }
      });
    });

    // Delete notes
    modal.querySelectorAll('.delete-voice-note').forEach(btn => {
      btn.addEventListener('click', () => {
        const noteId = btn.dataset.noteId;
        if (confirm('¿Eliminar esta nota de voz?')) {
          this.deleteVoiceNote(noteId);
          modal.querySelector('#voice-notes-list').innerHTML = this.renderNotesList();
          this.attachNoteListListeners(modal);
          window.toast?.info('Nota eliminada');
        }
      });
    });

    // v2.9.368: Show full transcript
    modal.querySelectorAll('.show-transcript-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const transcript = btn.dataset.transcript;
        if (transcript) {
          this.showTranscriptModal(transcript);
        }
      });
    });
  }

  // v2.9.368: Re-attach listeners after list update
  attachNoteListListeners(modal) {
    modal.querySelectorAll('.play-voice-note').forEach(btn => {
      btn.addEventListener('click', async () => {
        const noteId = btn.dataset.noteId;
        const blob = await this.getVoiceNoteBlob(noteId);
        if (blob) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.addEventListener('ended', () => URL.revokeObjectURL(audioUrl));
          audio.addEventListener('error', () => URL.revokeObjectURL(audioUrl));
          audio.play();
        }
      });
    });

    modal.querySelectorAll('.delete-voice-note').forEach(btn => {
      btn.addEventListener('click', () => {
        const noteId = btn.dataset.noteId;
        if (confirm('¿Eliminar esta nota de voz?')) {
          this.deleteVoiceNote(noteId);
          modal.querySelector('#voice-notes-list').innerHTML = this.renderNotesList();
          this.attachNoteListListeners(modal);
          window.toast?.info('Nota eliminada');
        }
      });
    });

    modal.querySelectorAll('.show-transcript-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const transcript = btn.dataset.transcript;
        if (transcript) {
          this.showTranscriptModal(transcript);
        }
      });
    });
  }

  // v2.9.368: Show full transcript in modal
  showTranscriptModal(transcript) {
    const existing = document.getElementById('transcript-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'transcript-modal';
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4';
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-white">📝 Transcripción</h3>
          <button class="text-gray-400 hover:text-white p-2" onclick="this.closest('#transcript-modal').remove()">✕</button>
        </div>
        <div class="bg-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto">
          <p class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">${transcript}</p>
        </div>
        <div class="mt-4 flex gap-3">
          <button class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition" onclick="navigator.clipboard.writeText('${this.escapeAttr(transcript)}'); window.toast?.success('Copiado'); this.closest('#transcript-modal').remove();">
            📋 Copiar
          </button>
          <button class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition" onclick="this.closest('#transcript-modal').remove()">
            Cerrar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // ==========================================================================
  // CHECK SUPPORT
  // ==========================================================================

  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

// 🔧 v2.9.325: Siempre crear instancia (puede no tener bookEngine inicialmente)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (VoiceNotes.isSupported()) {
      window.voiceNotes = new VoiceNotes(window.bookEngine || window.bookReader?.bookEngine);
    }
  });
} else {
  if (VoiceNotes.isSupported()) {
    window.voiceNotes = new VoiceNotes(window.bookEngine || window.bookReader?.bookEngine);
  }
}

// Exportar clase y crear instancia de respaldo
window.VoiceNotes = VoiceNotes;

// Garantizar que existe la instancia
if (!window.voiceNotes && VoiceNotes.isSupported()) {
  window.voiceNotes = new VoiceNotes(null);
}
