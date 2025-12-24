(() => {
  class AIDashboardWidget {
    constructor() {
      this.root = document.querySelector('#ai-dashboard-panel');
      if (!this.root) {
        this.root = document.createElement('section');
        this.root.id = 'ai-dashboard-panel';
        this.root.className = 'ai-dashboard-panel';
        document.body.appendChild(this.root);
      }
      this.root.innerHTML = '<h2>Dashboard AI</h2><p class="ai-dashboard-loading">Cargando datos...</p>';
      this.render();
    }

    async render() {
      if (!window.aiPersistence) {
        this.root.innerHTML = '<p class="ai-dashboard-error">AI Persistence no está disponible.</p>';
        return;
      }
      const [summary, activity, active] = await Promise.all([
        window.aiPersistence.fetchMissionSummary(),
        window.aiPersistence.fetchRecentActivity(),
        window.aiPersistence.fetchActiveUsers(),
      ]);

      this.root.innerHTML = `
        <div class="ai-dashboard-grid">
          <article>
            <h3>Misiones recientes</h3>
            ${this.renderSummary(summary)}
          </article>
          <article>
            <h3>Actividad IA</h3>
            ${this.renderActivity(activity)}
          </article>
          <article>
            <h3>Usuarios activos</h3>
            ${this.renderActiveUsers(active)}
          </article>
        </div>
      `;
    }

    renderSummary(rows = []) {
      if (!rows.length) {
        return '<p>No hay misiones registradas aún.</p>';
      }
      return `<ul>${rows
        .map(
          (row) => `<li>
            <strong>${row.user_id}</strong>: ${row.missions_completed}/${row.missions_generated} completadas
            <small>última actualización ${new Date(row.last_update).toLocaleString()}</small>
          </li>`
        )
        .join('')}</ul>`;
    }

    renderActivity(rows = []) {
      if (!rows.length) {
        return '<p>Sin actividad reciente.</p>';
      }
      return `<ul>${rows
        .map(
          (row) => `<li>
            ${row.feature} • ${row.credits_used} créditos • ${row.outcome}
            <small>${new Date(row.created_at).toLocaleTimeString()}</small>
          </li>`
        )
        .join('')}</ul>`;
    }

    renderActiveUsers(rows = []) {
      if (!rows.length) {
        return '<p>Nadie activo aún.</p>';
      }
      return `<ul>${rows
        .map((row) => `<li>${row.user_id}: ${row.mission_count} misiones</li>`)
        .join('')}</ul>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.aiPersistence) {
      new AIDashboardWidget();
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'ai-dashboard-panel ai-dashboard-error';
      fallback.textContent = 'AI Persistence no está cargado aún.';
      document.body.appendChild(fallback);
    }
  });
})();
