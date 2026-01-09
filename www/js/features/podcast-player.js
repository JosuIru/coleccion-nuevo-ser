// ============================================================================
// PODCAST PLAYER - Reproductor de Podcast Auto-Generado
// ============================================================================
// v2.9.330: Presenta los capítulos como episodios de podcast
// Usa el sistema de AudioReader existente con interfaz de podcast

class PodcastPlayer {
  constructor() {
    this.modalElement = null;
    this.miniPlayerElement = null;
    this.isPlaying = false;
    this.currentEpisode = null;
    this.currentBookId = null;
    this.playbackSpeed = 1.0;
    this.downloadedEpisodes = this.loadDownloadedEpisodes();

    // Configuración
    this.config = {
      speeds: [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
      autoAdvance: true,
      showMiniPlayer: true
    };
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadDownloadedEpisodes() {
    try {
      return JSON.parse(localStorage.getItem('podcast-downloaded')) || {};
    } catch {
      return {};
    }
  }

  saveDownloadedEpisodes() {
    localStorage.setItem('podcast-downloaded', JSON.stringify(this.downloadedEpisodes));
  }

  loadPlaybackState() {
    try {
      return JSON.parse(localStorage.getItem('podcast-playback')) || {};
    } catch {
      return {};
    }
  }

  savePlaybackState(episodeId, position, duration) {
    const state = this.loadPlaybackState();
    state[episodeId] = { position, duration, updatedAt: Date.now() };
    localStorage.setItem('podcast-playback', JSON.stringify(state));
  }

  // ==========================================================================
  // DATOS DE EPISODIOS
  // ==========================================================================

  /**
   * Obtiene los episodios (capítulos) de un libro
   */
  getEpisodes(bookId) {
    if (!window.bookEngine) return [];

    const currentBook = bookId || window.bookEngine.getCurrentBook();
    const bookData = window.bookEngine.books?.[currentBook];

    if (!bookData?.sections) return [];

    const episodes = [];
    let episodeNumber = 1;

    bookData.sections.forEach(section => {
      if (section.chapters) {
        section.chapters.forEach(chapter => {
          const contentLength = (chapter.content || '').length;
          const estimatedMinutes = Math.max(5, Math.ceil(contentLength / 1000)); // ~1000 chars/min

          episodes.push({
            id: chapter.id,
            number: episodeNumber++,
            title: chapter.title,
            section: section.title,
            duration: estimatedMinutes,
            hasEpigraph: !!chapter.epigraph,
            epigraphAuthor: chapter.epigraph?.author,
            closingQuestion: chapter.closingQuestion,
            isDownloaded: !!this.downloadedEpisodes[`${currentBook}:${chapter.id}`],
            playbackState: this.loadPlaybackState()[`${currentBook}:${chapter.id}`]
          });
        });
      }
    });

    return episodes;
  }

  /**
   * Calcula el progreso de escucha de un episodio
   */
  getEpisodeProgress(bookId, episodeId) {
    const state = this.loadPlaybackState()[`${bookId}:${episodeId}`];
    if (!state || !state.duration) return 0;
    return Math.min(100, Math.round((state.position / state.duration) * 100));
  }

  // ==========================================================================
  // REPRODUCCIÓN
  // ==========================================================================

  /**
   * Reproduce un episodio
   */
  async play(bookId, episodeId) {
    this.currentBookId = bookId;
    this.currentEpisode = episodeId;

    // Cargar el libro si no está cargado
    if (window.bookEngine.getCurrentBook() !== bookId) {
      await window.bookEngine.loadBook(bookId);
    }

    // Navegar al capítulo
    if (window.bookReader?.navigation) {
      window.bookReader.navigation.navigateToChapter(episodeId, true);
    }

    // Iniciar el AudioReader
    if (window.audioReader) {
      // Configurar velocidad
      if (window.audioReader.setRate) {
        window.audioReader.setRate(this.playbackSpeed);
      }

      // Reproducir
      window.audioReader.play();
      this.isPlaying = true;

      // Mostrar mini player
      if (this.config.showMiniPlayer) {
        this.showMiniPlayer();
      }

      // Actualizar UI
      this.updateUI();
    } else {
      window.toast?.error('AudioReader no disponible');
    }
  }

  pause() {
    if (window.audioReader) {
      window.audioReader.pause();
      this.isPlaying = false;
      this.updateUI();
    }
  }

  resume() {
    if (window.audioReader) {
      window.audioReader.resume();
      this.isPlaying = true;
      this.updateUI();
    }
  }

  stop() {
    if (window.audioReader) {
      window.audioReader.stop();
      this.isPlaying = false;
      this.currentEpisode = null;
      this.hideMiniPlayer();
      this.updateUI();
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else if (this.currentEpisode) {
      this.resume();
    }
  }

  /**
   * Cambia la velocidad de reproducción
   */
  setSpeed(speed) {
    this.playbackSpeed = speed;
    if (window.audioReader?.setRate) {
      window.audioReader.setRate(speed);
    }
    localStorage.setItem('podcast-speed', speed.toString());
    this.updateUI();
  }

  cycleSpeed() {
    const currentIndex = this.config.speeds.indexOf(this.playbackSpeed);
    const nextIndex = (currentIndex + 1) % this.config.speeds.length;
    this.setSpeed(this.config.speeds[nextIndex]);
  }

  /**
   * Salta al siguiente episodio
   */
  nextEpisode() {
    if (!this.currentBookId || !this.currentEpisode) return;

    const episodes = this.getEpisodes(this.currentBookId);
    const currentIndex = episodes.findIndex(ep => ep.id === this.currentEpisode);

    if (currentIndex < episodes.length - 1) {
      this.play(this.currentBookId, episodes[currentIndex + 1].id);
    } else {
      window.toast?.info('Has llegado al último episodio');
      this.stop();
    }
  }

  /**
   * Retrocede al episodio anterior
   */
  previousEpisode() {
    if (!this.currentBookId || !this.currentEpisode) return;

    const episodes = this.getEpisodes(this.currentBookId);
    const currentIndex = episodes.findIndex(ep => ep.id === this.currentEpisode);

    if (currentIndex > 0) {
      this.play(this.currentBookId, episodes[currentIndex - 1].id);
    } else {
      window.toast?.info('Ya estás en el primer episodio');
    }
  }

  // ==========================================================================
  // DESCARGA OFFLINE
  // ==========================================================================

  /**
   * Descarga un episodio para escucha offline
   */
  async downloadEpisode(bookId, episodeId) {
    const key = `${bookId}:${episodeId}`;

    // Verificar si ya está descargado
    if (this.downloadedEpisodes[key]) {
      window.toast?.info('Este episodio ya está descargado');
      return;
    }

    window.toast?.info('Preparando descarga...');

    try {
      // Usar el audioCacheManager si existe
      if (window.audioCacheManager) {
        // Obtener el contenido del capítulo
        const chapter = window.bookEngine.getChapter(episodeId);
        if (!chapter) throw new Error('Capítulo no encontrado');

        // Pre-generar el audio y cachear
        // Esto depende de la implementación del audioCacheManager
        await window.audioCacheManager.preloadChapter?.(bookId, episodeId);

        this.downloadedEpisodes[key] = {
          downloadedAt: Date.now(),
          title: chapter.title
        };
        this.saveDownloadedEpisodes();

        window.toast?.success('Episodio descargado');
        this.updateUI();
      } else {
        // Marcar como "descargado" aunque sin caché real
        // El TTS se generará al reproducir
        this.downloadedEpisodes[key] = {
          downloadedAt: Date.now(),
          title: episodeId,
          simulated: true
        };
        this.saveDownloadedEpisodes();

        window.toast?.success('Episodio marcado para offline');
        this.updateUI();
      }
    } catch (error) {
      logger.error('[PodcastPlayer] Error downloading:', error);
      window.toast?.error('Error al descargar');
    }
  }

  /**
   * Elimina un episodio descargado
   */
  removeDownload(bookId, episodeId) {
    const key = `${bookId}:${episodeId}`;
    delete this.downloadedEpisodes[key];
    this.saveDownloadedEpisodes();

    if (window.audioCacheManager?.clearChapter) {
      window.audioCacheManager.clearChapter(bookId, episodeId);
    }

    window.toast?.info('Descarga eliminada');
    this.updateUI();
  }

  // ==========================================================================
  // UI - MODAL PRINCIPAL
  // ==========================================================================

  show(bookId) {
    this.close();
    this.currentBookId = bookId || window.bookEngine?.getCurrentBook();

    const episodes = this.getEpisodes(this.currentBookId);
    const bookData = window.bookEngine?.books?.[this.currentBookId];
    const bookTitle = bookData?.title || 'Podcast';

    // Cargar velocidad guardada
    const savedSpeed = localStorage.getItem('podcast-speed');
    if (savedSpeed) {
      this.playbackSpeed = parseFloat(savedSpeed);
    }

    const modal = document.createElement('div');
    modal.id = 'podcast-player-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="window.podcastPlayer?.close()"></div>
      <div class="relative bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-purple-500/30">
        <!-- Header con artwork -->
        <div class="relative p-6 text-center bg-gradient-to-b from-purple-900/40 to-transparent">
          <button onclick="window.podcastPlayer?.close()"
                  class="absolute right-4 top-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Podcast artwork -->
          <div class="w-32 h-32 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM8 12a4 4 0 0 0 8 0V4a4 4 0 0 0-8 0v8z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
            </svg>
          </div>

          <h2 class="text-xl font-bold text-white mb-1">${this.escapeHtml(bookTitle)}</h2>
          <p class="text-sm text-purple-300">Podcast Audiolibro</p>
          <p class="text-xs text-gray-400 mt-2">${episodes.length} episodios</p>
        </div>

        <!-- Now Playing (si hay algo reproduciéndose) -->
        ${this.currentEpisode && this.isPlaying ? this.renderNowPlaying(episodes) : ''}

        <!-- Lista de episodios -->
        <div id="podcast-episodes" class="flex-1 overflow-y-auto">
          ${episodes.length === 0 ? `
            <div class="text-center py-12 text-gray-500">
              <p>No hay episodios disponibles</p>
            </div>
          ` : episodes.map(ep => this.renderEpisodeCard(ep)).join('')}
        </div>

        <!-- Footer con controles -->
        <div class="p-4 border-t border-gray-700 bg-slate-900/80">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button onclick="window.podcastPlayer?.cycleSpeed()"
                      class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors">
                ${this.playbackSpeed}x
              </button>
              <span class="text-xs text-gray-500">Velocidad</span>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" ${this.config.autoAdvance ? 'checked' : ''}
                     onchange="window.podcastPlayer?.toggleAutoAdvance(this.checked)"
                     class="rounded bg-slate-700 border-gray-600 text-purple-500">
              <span>Auto-avanzar</span>
            </label>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    // Escape to close
    this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  renderNowPlaying(episodes) {
    const current = episodes.find(ep => ep.id === this.currentEpisode);
    if (!current) return '';

    return `
      <div class="px-4 py-3 bg-purple-900/30 border-b border-purple-500/30">
        <div class="flex items-center gap-3">
          <button onclick="window.podcastPlayer?.togglePlayPause()"
                  class="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-colors">
            ${this.isPlaying ? `
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ` : `
              <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            `}
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">Ep. ${current.number}: ${this.escapeHtml(current.title)}</p>
            <p class="text-xs text-purple-300">Reproduciendo ahora</p>
          </div>
          <button onclick="window.podcastPlayer?.stop()"
                  class="p-2 hover:bg-purple-800/50 rounded-lg text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  renderEpisodeCard(episode) {
    const isCurrent = episode.id === this.currentEpisode;
    const progress = this.getEpisodeProgress(this.currentBookId, episode.id);
    const isCompleted = progress >= 95;

    return `
      <div class="p-4 border-b border-gray-800 hover:bg-slate-800/50 transition-colors ${isCurrent ? 'bg-purple-900/20' : ''}"
           onclick="window.podcastPlayer?.play('${this.currentBookId}', '${episode.id}')">
        <div class="flex items-start gap-3">
          <!-- Número de episodio -->
          <div class="w-10 h-10 rounded-lg ${isCurrent ? 'bg-purple-500' : 'bg-slate-700'} flex items-center justify-center flex-shrink-0">
            ${isCompleted ? `
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            ` : `
              <span class="text-sm font-bold ${isCurrent ? 'text-white' : 'text-gray-400'}">${episode.number}</span>
            `}
          </div>

          <!-- Info del episodio -->
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-white truncate">${this.escapeHtml(episode.title)}</h4>
            <p class="text-xs text-gray-500 mt-0.5">${this.escapeHtml(episode.section)}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ~${episode.duration} min
              </span>
              ${episode.isDownloaded ? `
                <span class="text-green-400 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Offline
                </span>
              ` : ''}
              ${progress > 0 && progress < 95 ? `
                <span class="text-purple-400">${progress}% escuchado</span>
              ` : ''}
            </div>

            <!-- Progress bar -->
            ${progress > 0 ? `
              <div class="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-purple-500 rounded-full" style="width: ${progress}%"></div>
              </div>
            ` : ''}
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-1" onclick="event.stopPropagation()">
            ${episode.isDownloaded ? `
              <button onclick="window.podcastPlayer?.removeDownload('${this.currentBookId}', '${episode.id}')"
                      class="p-2 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                      title="Eliminar descarga">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            ` : `
              <button onclick="window.podcastPlayer?.downloadEpisode('${this.currentBookId}', '${episode.id}')"
                      class="p-2 hover:bg-slate-700 rounded-lg text-gray-500 hover:text-white transition-colors"
                      title="Descargar para offline">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // UI - MINI PLAYER
  // ==========================================================================

  showMiniPlayer() {
    this.hideMiniPlayer();

    const episodes = this.getEpisodes(this.currentBookId);
    const current = episodes.find(ep => ep.id === this.currentEpisode);
    if (!current) return;

    const miniPlayer = document.createElement('div');
    miniPlayer.id = 'podcast-mini-player';
    miniPlayer.className = 'fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl z-[9990] p-3';
    miniPlayer.innerHTML = `
      <div class="flex items-center gap-3">
        <!-- Artwork mini -->
        <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          </svg>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">Ep. ${current.number}: ${this.escapeHtml(current.title)}</p>
          <p class="text-xs text-gray-500">Podcast</p>
        </div>

        <!-- Controles -->
        <div class="flex items-center gap-1">
          <button onclick="window.podcastPlayer?.previousEpisode()"
                  class="p-2 hover:bg-slate-700 rounded-full text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button onclick="window.podcastPlayer?.togglePlayPause()"
                  class="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-colors">
            ${this.isPlaying ? `
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ` : `
              <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            `}
          </button>
          <button onclick="window.podcastPlayer?.nextEpisode()"
                  class="p-2 hover:bg-slate-700 rounded-full text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button onclick="window.podcastPlayer?.stop()"
                  class="p-2 hover:bg-slate-700 rounded-full text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(miniPlayer);
    this.miniPlayerElement = miniPlayer;
  }

  hideMiniPlayer() {
    if (this.miniPlayerElement) {
      this.miniPlayerElement.remove();
      this.miniPlayerElement = null;
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  toggleAutoAdvance(enabled) {
    this.config.autoAdvance = enabled;
    localStorage.setItem('podcast-auto-advance', enabled.toString());
  }

  updateUI() {
    // Actualizar modal si está abierto
    if (this.modalElement) {
      const episodesContainer = this.modalElement.querySelector('#podcast-episodes');
      if (episodesContainer) {
        const episodes = this.getEpisodes(this.currentBookId);
        episodesContainer.innerHTML = episodes.map(ep => this.renderEpisodeCard(ep)).join('');
      }
    }

    // Actualizar mini player
    if (this.miniPlayerElement && this.isPlaying) {
      this.showMiniPlayer();
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.PodcastPlayer = PodcastPlayer;
window.podcastPlayer = new PodcastPlayer();

logger.log('[PodcastPlayer] Sistema de podcast inicializado');
