// ============================================================================
// VOICE NOTES - Sistema de Notas de Voz
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

    // Exponer globalmente
    window.voiceNotes = this;
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

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;

        // Stop all tracks
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Create blob from chunks
        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const duration = Date.now() - this.recordingStartTime;

        resolve({ blob, duration, mimeType });
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording() {
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

  async saveVoiceNote(blob, duration, title = '') {
    const bookId = this.bookEngine?.getCurrentBook() || 'general';
    const chapterId = this.bookEngine?.currentChapterId || 'general';
    const noteId = `voice-${Date.now()}`;

    // Convert blob to base64 for localStorage
    const base64 = await this.blobToBase64(blob);

    // Store audio data
    localStorage.setItem(`voice-note-data-${noteId}`, base64);

    // Store metadata
    const metadata = {
      id: noteId,
      bookId,
      chapterId,
      title: title || `Nota de voz ${new Date().toLocaleDateString()}`,
      duration,
      mimeType: blob.type,
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
                   class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 mb-4 focus:ring-2 focus:ring-red-500 focus:outline-none">

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
          <p class="text-xs text-gray-500">${this.formatDuration(note.duration)}</p>
        </div>
        <button class="delete-voice-note opacity-0 group-hover:opacity-100 p-2 hover:bg-red-900/50 rounded transition"
                data-note-id="${note.id}">
          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `).join('');
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
    modal.querySelector('#stop-btn')?.addEventListener('click', async () => {
      clearInterval(recordingInterval);
      const result = await this.stopRecording();

      if (result) {
        pendingBlob = result.blob;
        recordingInProgress.classList.add('hidden');
        previewArea.classList.remove('hidden');

        // Set up audio preview
        const audioPreview = modal.querySelector('#audio-preview');
        // 🧹 Limpiar URL anterior si existe
        if (audioPreview.src && audioPreview.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioPreview.src);
        }
        audioPreview.src = URL.createObjectURL(result.blob);
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
      previewArea.classList.add('hidden');
      recordingArea.classList.remove('hidden');
      modal.querySelector('#note-title').value = '';
    });

    // Save
    modal.querySelector('#save-voice-note-btn')?.addEventListener('click', async () => {
      if (pendingBlob) {
        const title = modal.querySelector('#note-title').value.trim();
        const duration = Date.now() - this.recordingStartTime;
        await this.saveVoiceNote(pendingBlob, duration, title);
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
          window.toast?.info('Nota eliminada');
        }
      });
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (VoiceNotes.isSupported()) {
      window.voiceNotes = new VoiceNotes(window.bookEngine);
    }
  });
} else {
  if (VoiceNotes.isSupported()) {
    window.voiceNotes = new VoiceNotes(window.bookEngine);
  }
}

// Exportar
window.VoiceNotes = VoiceNotes;
