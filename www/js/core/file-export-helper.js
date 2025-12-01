// ============================================================================
// FILE EXPORT HELPER - Exportar Notas y Datos a Archivos
// ============================================================================

class FileExportHelper {
  constructor() {
    this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    this.Filesystem = null;
    this.Share = null;

    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    if (this.isCapacitor && window.Capacitor?.Plugins) {
      this.Filesystem = window.Capacitor.Plugins.Filesystem;
      this.Share = window.Capacitor.Plugins.Share;
    }

    // Exponer globalmente
    window.fileExportHelper = this;
  }

  // ==========================================================================
  // EXPORTAR NOTAS
  // ==========================================================================

  async exportNotes(format = 'txt') {
    const notes = this.getAllNotes();

    if (notes.length === 0) {
      window.toast?.info('No hay notas para exportar');
      return null;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `notas-coleccion-nuevo-ser-${timestamp}`;

    switch (format) {
      case 'txt':
        return this.exportAsTxt(notes, fileName);
      case 'json':
        return this.exportAsJson(notes, fileName);
      case 'markdown':
      case 'md':
        return this.exportAsMarkdown(notes, fileName);
      default:
        return this.exportAsTxt(notes, fileName);
    }
  }

  getAllNotes() {
    const allNotes = [];
    const booksWithNotes = ['manifiesto', 'codigo-despertar', 'sintaxis', 'manual', 'transmisiones', 'cartas', 'reflexiones'];

    for (const bookId of booksWithNotes) {
      const storageKey = `notes-${bookId}`;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const bookNotes = JSON.parse(stored);
          for (const [chapterId, noteData] of Object.entries(bookNotes)) {
            if (noteData && noteData.content) {
              allNotes.push({
                bookId,
                chapterId,
                ...noteData
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Error loading notes for ${bookId}:`, error);
      }
    }

    // Ordenar por fecha
    allNotes.sort((a, b) => new Date(b.updated || b.created || 0) - new Date(a.updated || a.created || 0));

    return allNotes;
  }

  // ==========================================================================
  // FORMATOS DE EXPORTACIÓN
  // ==========================================================================

  async exportAsTxt(notes, fileName) {
    let content = '═══════════════════════════════════════════════════════════════\n';
    content += '                 COLECCIÓN NUEVO SER - MIS NOTAS\n';
    content += '═══════════════════════════════════════════════════════════════\n\n';
    content += `Exportado: ${new Date().toLocaleString('es-ES')}\n`;
    content += `Total de notas: ${notes.length}\n\n`;

    for (const note of notes) {
      content += '───────────────────────────────────────────────────────────────\n';
      content += `📚 Libro: ${this.getBookTitle(note.bookId)}\n`;
      content += `📖 Capítulo: ${note.chapterId}\n`;
      if (note.updated) {
        content += `📅 Última actualización: ${new Date(note.updated).toLocaleString('es-ES')}\n`;
      }
      content += '───────────────────────────────────────────────────────────────\n\n';
      content += note.content + '\n\n';
    }

    content += '═══════════════════════════════════════════════════════════════\n';
    content += '              Generado por Colección Nuevo Ser\n';
    content += '═══════════════════════════════════════════════════════════════\n';

    return this.saveFile(content, `${fileName}.txt`, 'text/plain');
  }

  async exportAsJson(notes, fileName) {
    const exportData = {
      appName: 'Colección Nuevo Ser',
      exportDate: new Date().toISOString(),
      version: '2.1.0',
      notesCount: notes.length,
      notes: notes.map(note => ({
        bookId: note.bookId,
        bookTitle: this.getBookTitle(note.bookId),
        chapterId: note.chapterId,
        content: note.content,
        created: note.created,
        updated: note.updated
      }))
    };

    const content = JSON.stringify(exportData, null, 2);
    return this.saveFile(content, `${fileName}.json`, 'application/json');
  }

  async exportAsMarkdown(notes, fileName) {
    let content = '# Colección Nuevo Ser - Mis Notas\n\n';
    content += `> Exportado: ${new Date().toLocaleString('es-ES')}\n\n`;
    content += `**Total de notas:** ${notes.length}\n\n`;
    content += '---\n\n';

    // Agrupar por libro
    const notesByBook = {};
    for (const note of notes) {
      if (!notesByBook[note.bookId]) {
        notesByBook[note.bookId] = [];
      }
      notesByBook[note.bookId].push(note);
    }

    for (const [bookId, bookNotes] of Object.entries(notesByBook)) {
      content += `## ${this.getBookTitle(bookId)}\n\n`;

      for (const note of bookNotes) {
        content += `### ${note.chapterId}\n\n`;
        if (note.updated) {
          content += `*Actualizado: ${new Date(note.updated).toLocaleString('es-ES')}*\n\n`;
        }
        content += note.content + '\n\n';
        content += '---\n\n';
      }
    }

    content += '\n*Generado por Colección Nuevo Ser*\n';

    return this.saveFile(content, `${fileName}.md`, 'text/markdown');
  }

  // ==========================================================================
  // EXPORTAR PROGRESO DE LECTURA
  // ==========================================================================

  async exportProgress() {
    const progressData = {
      appName: 'Colección Nuevo Ser',
      exportDate: new Date().toISOString(),
      version: '2.1.0',
      books: {}
    };

    const books = ['manifiesto', 'codigo-despertar', 'sintaxis', 'manual', 'transmisiones', 'cartas', 'reflexiones'];

    for (const bookId of books) {
      try {
        const progressKey = `reading-progress-${bookId}`;
        const bookmarksKey = `bookmarks-${bookId}`;

        const progress = localStorage.getItem(progressKey);
        const bookmarks = localStorage.getItem(bookmarksKey);

        progressData.books[bookId] = {
          title: this.getBookTitle(bookId),
          progress: progress ? JSON.parse(progress) : null,
          bookmarks: bookmarks ? JSON.parse(bookmarks) : []
        };
      } catch (error) {
        console.warn(`Error loading progress for ${bookId}:`, error);
      }
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const content = JSON.stringify(progressData, null, 2);
    return this.saveFile(content, `progreso-lectura-${timestamp}.json`, 'application/json');
  }

  // ==========================================================================
  // EXPORTAR TODO (BACKUP COMPLETO)
  // ==========================================================================

  async exportFullBackup() {
    const backupData = {
      appName: 'Colección Nuevo Ser',
      exportDate: new Date().toISOString(),
      version: '2.1.0',
      backupType: 'full',
      data: {}
    };

    // Recopilar todos los datos de localStorage relacionados con la app
    const prefixes = ['notes-', 'reading-progress-', 'bookmarks-', 'achievements-', 'voice-notes-', 'ai-chat-', 'biometric-', 'notifications-', 'theme-'];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        try {
          const value = localStorage.getItem(key);
          backupData.data[key] = JSON.parse(value);
        } catch {
          backupData.data[key] = localStorage.getItem(key);
        }
      }
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const content = JSON.stringify(backupData, null, 2);
    return this.saveFile(content, `backup-coleccion-nuevo-ser-${timestamp}.json`, 'application/json');
  }

  // ==========================================================================
  // IMPORTAR BACKUP
  // ==========================================================================

  async importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);

          if (backupData.appName !== 'Colección Nuevo Ser') {
            reject(new Error('Archivo de backup no válido'));
            return;
          }

          // Restaurar datos
          if (backupData.data) {
            for (const [key, value] of Object.entries(backupData.data)) {
              const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
              localStorage.setItem(key, stringValue);
            }
          }

          resolve({
            success: true,
            date: backupData.exportDate,
            itemsRestored: Object.keys(backupData.data || {}).length
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  }

  // ==========================================================================
  // GUARDAR ARCHIVO
  // ==========================================================================

  async saveFile(content, fileName, mimeType) {
    if (this.isCapacitor && this.Filesystem) {
      return this.saveFileNative(content, fileName, mimeType);
    } else {
      return this.saveFileWeb(content, fileName, mimeType);
    }
  }

  async saveFileNative(content, fileName, mimeType) {
    try {
      const { Filesystem, Directory } = window.Capacitor.Plugins;

      // Guardar en directorio de documentos
      const result = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Documents,
        encoding: 'utf8'
      });

      window.toast?.success(`Archivo guardado: ${fileName}`);

      // Opción de compartir
      if (this.Share) {
        const shareResult = await window.toast?.confirm?.('¿Deseas compartir el archivo?');
        if (shareResult) {
          await this.Share.share({
            title: fileName,
            url: result.uri,
            dialogTitle: 'Compartir exportación'
          });
        }
      }

      return { success: true, path: result.uri };
    } catch (error) {
      console.error('Error saving file:', error);
      // Fallback a descarga web
      return this.saveFileWeb(content, fileName, mimeType);
    }
  }

  saveFileWeb(content, fileName, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = fileName;
      downloadLink.style.display = 'none';

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(url);

      window.toast?.success(`Descargando: ${fileName}`);
      return { success: true, path: fileName };
    } catch (error) {
      console.error('Error downloading file:', error);
      window.toast?.error('Error al descargar el archivo');
      return { success: false, error: error.message };
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  getBookTitle(bookId) {
    const titles = {
      'manifiesto': 'Manifiesto del Nuevo Ser',
      'codigo-despertar': 'El Código del Despertar',
      'sintaxis': 'Sintaxis de la Conciencia',
      'manual': 'Manual del Nuevo Ser',
      'transmisiones': 'Transmisiones desde el Límite',
      'cartas': 'Cartas a un Aprendiz de la Conciencia',
      'reflexiones': 'Reflexiones en el Umbral'
    };
    return titles[bookId] || bookId;
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================

  showExportModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.id = 'export-modal';
    modal.innerHTML = `
      <div class="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-600 overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>📤</span> Exportar Datos
            </h2>
            <button onclick="document.getElementById('export-modal').remove()"
                    class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          <div class="space-y-3">
            <button onclick="window.fileExportHelper.exportNotes('txt'); document.getElementById('export-modal').remove();"
                    class="w-full p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center gap-4">
              <span class="text-3xl">📝</span>
              <div>
                <p class="font-semibold text-white">Exportar Notas (TXT)</p>
                <p class="text-sm text-gray-400">Formato de texto plano</p>
              </div>
            </button>

            <button onclick="window.fileExportHelper.exportNotes('markdown'); document.getElementById('export-modal').remove();"
                    class="w-full p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center gap-4">
              <span class="text-3xl">📋</span>
              <div>
                <p class="font-semibold text-white">Exportar Notas (Markdown)</p>
                <p class="text-sm text-gray-400">Formato con estilo</p>
              </div>
            </button>

            <button onclick="window.fileExportHelper.exportNotes('json'); document.getElementById('export-modal').remove();"
                    class="w-full p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center gap-4">
              <span class="text-3xl">🔧</span>
              <div>
                <p class="font-semibold text-white">Exportar Notas (JSON)</p>
                <p class="text-sm text-gray-400">Formato para desarrolladores</p>
              </div>
            </button>

            <button onclick="window.fileExportHelper.exportProgress(); document.getElementById('export-modal').remove();"
                    class="w-full p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center gap-4">
              <span class="text-3xl">📊</span>
              <div>
                <p class="font-semibold text-white">Exportar Progreso</p>
                <p class="text-sm text-gray-400">Capítulos leídos y marcadores</p>
              </div>
            </button>

            <button onclick="window.fileExportHelper.exportFullBackup(); document.getElementById('export-modal').remove();"
                    class="w-full p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 rounded-xl text-left transition-colors flex items-center gap-4 border border-purple-500/30">
              <span class="text-3xl">💾</span>
              <div>
                <p class="font-semibold text-white">Backup Completo</p>
                <p class="text-sm text-gray-400">Todas las notas, progreso, configuración</p>
              </div>
            </button>
          </div>

          <div class="mt-6 p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
            <p class="text-sm text-blue-300">
              💡 El backup completo te permite restaurar todos tus datos si cambias de dispositivo.
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  showImportModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.id = 'import-modal';
    modal.innerHTML = `
      <div class="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-600 overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>📥</span> Importar Backup
            </h2>
            <button onclick="document.getElementById('import-modal').remove()"
                    class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          <div class="space-y-4">
            <div class="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
              <input type="file" id="import-file-input" accept=".json" class="hidden"
                     onchange="window.fileExportHelper.handleImportFile(this.files[0])">
              <label for="import-file-input" class="cursor-pointer">
                <span class="text-5xl block mb-4">📁</span>
                <p class="text-white font-semibold">Seleccionar archivo de backup</p>
                <p class="text-sm text-gray-400 mt-2">Solo archivos .json</p>
              </label>
            </div>

            <div class="p-4 bg-amber-900/20 rounded-xl border border-amber-500/30">
              <p class="text-sm text-amber-300">
                ⚠️ Importar un backup sobrescribirá los datos actuales. Considera hacer un backup primero.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  async handleImportFile(file) {
    if (!file) return;

    try {
      const result = await this.importBackup(file);
      if (result.success) {
        window.toast?.success(`Backup restaurado: ${result.itemsRestored} elementos`);
        document.getElementById('import-modal')?.remove();

        // Recargar página para aplicar cambios
        setTimeout(() => {
          if (confirm('¿Recargar la aplicación para aplicar los cambios?')) {
            location.reload();
          }
        }, 1000);
      }
    } catch (error) {
      window.toast?.error('Error al importar: ' + error.message);
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FileExportHelper());
} else {
  new FileExportHelper();
}

// Exportar
window.FileExportHelper = FileExportHelper;
