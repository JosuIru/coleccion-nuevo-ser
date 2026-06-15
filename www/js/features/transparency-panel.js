// ============================================================================
// TRANSPARENCY PANEL - Estado abierto del ecosistema y áreas de apoyo
// ============================================================================

class TransparencyPanel {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.isOpen = false;
    this.handleEscape = null;
    this.remoteState = {
      mode: 'catalog',
      goals: [],
      contributions: [],
      inventory: [],
      loaded: false
    };
  }

  async open() {
    this.isOpen = true;
    await this.loadRemoteData();
    this.render();
    this.attachEventListeners();
  }

  close() {
    this.isOpen = false;
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
      this.handleEscape = null;
    }

    const modal = document.getElementById('transparency-panel');
    if (modal) modal.remove();
  }

  getCatalog() {
    return this.bookEngine?.catalog || { library: {}, books: [] };
  }

  async loadRemoteData() {
    const supabase = window.supabaseClient || window.supabase;
    if (!supabase) {
      this.remoteState = { mode: 'catalog', goals: [], contributions: [], inventory: [], loaded: true };
      return;
    }

    try {
      const [goalsResult, contributionsResult, inventoryResult] = await Promise.all([
        supabase
          .from('transparency_goals')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('transparency_contributions')
          .select('*')
          .in('visibility', ['publico', 'anonimo'])
          .order('contribution_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('transparency_inventory')
          .select('*')
          .eq('is_active', true)
          .order('section', { ascending: true })
          .order('display_order', { ascending: true })
      ]);

      if (goalsResult.error) throw goalsResult.error;
      if (contributionsResult.error) throw contributionsResult.error;
      if (inventoryResult.error) throw inventoryResult.error;

      this.remoteState = {
        mode: 'supabase',
        goals: goalsResult.data || [],
        contributions: contributionsResult.data || [],
        inventory: inventoryResult.data || [],
        loaded: true
      };
    } catch (error) {
      logger?.warn?.('[TransparencyPanel] Falling back to catalog data:', error);
      this.remoteState = { mode: 'catalog', goals: [], contributions: [], inventory: [], loaded: true };
    }
  }

  getTransparencyTargets() {
    const { books = [], library = {} } = this.getCatalog();
    const remoteGoals = this.remoteState.goals || [];
    const goals = library.transparency?.fundingGoals || [];

    if (remoteGoals.length > 0) {
      return remoteGoals.map(goal => {
        const linkedBook = books.find(book => book.id === goal.book_id);
        return {
          id: goal.slug,
          title: goal.title,
          description: goal.description,
          icon: linkedBook?.icon || '📘',
          color: linkedBook?.color || '#0ea5e9',
          targetEUR: Number(goal.target_eur || 0),
          fundedEUR: Number(goal.funded_eur || 0),
          area: goal.area || 'General',
          priority: goal.priority || 'media',
          status: goal.status || 'abierto',
          bookTitle: linkedBook?.title || null
        };
      });
    }

    if (goals.length > 0) {
      return goals.map(goal => {
        const linkedBook = books.find(book => book.id === goal.bookId);
        return {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          icon: linkedBook?.icon || '📘',
          color: linkedBook?.color || '#0ea5e9',
          targetEUR: goal.targetEUR || 0,
          fundedEUR: goal.fundedEUR || 0,
          area: goal.area || 'General',
          priority: goal.priority || 'media',
          status: goal.status || 'abierto',
          bookTitle: linkedBook?.title || null
        };
      });
    }

    return books
      .filter(book => book.status === 'published')
      .slice(0, 8)
      .map(book => ({
        id: book.id,
        title: book.title,
        description: this.buildImprovementDescription(book),
        icon: book.icon || '📘',
        color: book.color || '#0ea5e9',
        targetEUR: 0,
        fundedEUR: 0,
        area: 'General',
        priority: 'media',
        status: 'abierto',
        bookTitle: book.title
      }));
  }

  buildImprovementDescription(book) {
    const improvements = [];

    if (book.features?.aiChat) improvements.push('mejorar IA contextual');
    if (book.features?.audiobook) improvements.push('pulir audioreader');
    if (book.features?.externalResources) improvements.push('curar recursos');
    if (book.features?.progressTracking) improvements.push('refinar seguimiento');
    if (book.features?.exercises || book.features?.natureExercises) improvements.push('expandir prácticas');

    if (improvements.length === 0) {
      return 'Edición, estructura, diseño y profundidad de contenido';
    }

    return improvements.slice(0, 3).join(', ');
  }

  getStatusSummary() {
    const { library = {}, books = [] } = this.getCatalog();
    const publishedBooks = books.filter(book => book.status === 'published');
    const interactiveBooks = publishedBooks.filter(book => book.features?.aiChat || book.features?.audiobook);
    const practiceBooks = publishedBooks.filter(book => book.features?.exercises || book.features?.natureExercises || book.features?.toolkit);
    const goals = library.transparency?.fundingGoals || [];
    const targetEUR = goals.reduce((sum, goal) => sum + (goal.targetEUR || 0), 0);
    const fundedEUR = goals.reduce((sum, goal) => sum + (goal.fundedEUR || 0), 0);

    return {
      version: library.version || 'N/D',
      lastUpdate: library.lastUpdate || 'N/D',
      totalBooks: publishedBooks.length,
      interactiveBooks: interactiveBooks.length,
      practiceBooks: practiceBooks.length,
      targetEUR,
      fundedEUR,
      fundingPercentage: targetEUR > 0 ? Math.round((fundedEUR / targetEUR) * 100) : 0
    };
  }

  getEcosystemInventory() {
    const { books = [], library = {} } = this.getCatalog();
    const configuredInventory = library.transparency?.ecosystemInventory;
    const publishedBooks = books.filter(book => book.status === 'published');
    const tools = window.BIBLIOTECA_CONFIG?.HERRAMIENTAS_ECOSISTEMA || [];
    const remoteInventory = this.remoteState.inventory || [];

    if (remoteInventory.length > 0) {
      const mapRemoteItem = (item) => ({
        id: item.slug,
        title: item.title,
        area: item.area,
        status: item.status,
        maturity: item.maturity,
        description: item.description
      });

      return {
        books: remoteInventory.filter(item => item.section === 'books').map(mapRemoteItem),
        tools: remoteInventory.filter(item => item.section === 'tools').map(mapRemoteItem),
        modules: remoteInventory.filter(item => item.section === 'modules').map(mapRemoteItem),
        roadmap: remoteInventory.filter(item => item.section === 'roadmap').map(mapRemoteItem)
      };
    }

    if (configuredInventory) {
      return {
        books: configuredInventory.books || publishedBooks.map(book => ({
          id: book.id,
          title: book.title,
          area: book.category || 'Libro',
          status: 'activo',
          maturity: book.features?.aiChat || book.features?.audiobook ? 'alta' : 'media',
          description: book.description || 'Libro de la colección'
        })),
        tools: configuredInventory.tools || [],
        modules: configuredInventory.modules || [],
        roadmap: configuredInventory.roadmap || []
      };
    }

    const modules = [
      { id: 'ai-chat', title: 'Chat IA contextual', area: 'IA', status: 'activo', maturity: 'alta', description: 'Conversación contextual sobre libros y temas de la colección.' },
      { id: 'audioreader', title: 'Audioreader', area: 'Audio', status: 'activo', maturity: 'alta', description: 'Lectura por voz, posiciones, temporizador y mejoras de experiencia.' },
      { id: 'concept-maps', title: 'Mapas conceptuales', area: 'Aprendizaje', status: 'activo', maturity: 'media', description: 'Visualización de relaciones entre libros, capítulos y conceptos.' },
      { id: 'action-plans', title: 'Planes de acción', area: 'Práctica', status: 'activo', maturity: 'media', description: 'Bajar ideas a acciones concretas y seguimiento personal.' },
      { id: 'smart-notes', title: 'Smart Notes + voz', area: 'Notas', status: 'activo', maturity: 'media', description: 'Notas, notas de voz y apoyo contextual al estudio.' },
      { id: 'progress-dashboard', title: 'Panel de progreso', area: 'Seguimiento', status: 'activo', maturity: 'media', description: 'Métricas de lectura, continuidad y progreso global.' },
      { id: 'reading-circles', title: 'Círculos de lectura', area: 'Comunidad', status: 'beta', maturity: 'media', description: 'Lectura compartida, comentarios y capas colectivas.' },
      { id: 'educators-core', title: 'Kit pedagógico interno', area: 'Educación', status: 'beta', maturity: 'media', description: 'Actividades, recursos por edad y apoyo a facilitadores.' },
      { id: 'knowledge-evolution', title: 'Knowledge Evolution', area: 'IA', status: 'experimental', maturity: 'media', description: 'Síntesis, ingestión y diálogo evolutivo sobre toda la colección.' },
      { id: 'transparency', title: 'Transparencia y donaciones', area: 'Infraestructura', status: 'activo', maturity: 'media', description: 'Objetivos visibles, aportes públicos y financiación dirigida.' }
    ];

    const roadmap = [
      { id: 'release-hardening', title: 'Release y publicación estable', area: 'Infraestructura', status: 'pendiente', maturity: 'media', description: 'Firma segura, release formal, optimización y publicación.' },
      { id: 'live-accounting', title: 'Contabilidad pública más fina', area: 'Transparencia', status: 'pendiente', maturity: 'baja', description: 'Más detalle de gastos, metas y trazabilidad pública por línea.' },
      { id: 'real-payment-sync', title: 'Sincronización completa de pagos reales', area: 'Pagos', status: 'pendiente', maturity: 'baja', description: 'Automatizar más allá de BTC verificado y conectar mejor Stripe/PayPal.' },
      { id: 'ecosystem-map', title: 'Mapa integral del ecosistema', area: 'Producto', status: 'en marcha', maturity: 'media', description: 'Hacer visible todo lo ya construido y lo que sigue en desarrollo.' }
    ];

    return {
      books: publishedBooks.map(book => ({
        id: book.id,
        title: book.title,
        area: book.category || 'Libro',
        status: 'activo',
        maturity: book.features?.aiChat || book.features?.audiobook ? 'alta' : 'media',
        description: book.description || 'Libro de la colección'
      })),
      tools: tools.map(tool => ({
        id: tool.id,
        title: tool.name,
        area: 'Herramienta',
        status: tool.isNew ? 'beta' : 'activo',
        maturity: tool.hasApk || tool.isInternal ? 'media' : 'alta',
        description: tool.description || 'Herramienta del ecosistema'
      })),
      modules,
      roadmap
    };
  }

  getRecentContributions() {
    if ((this.remoteState.contributions || []).length > 0) {
      return this.remoteState.contributions.map(item => ({
        date: item.contribution_date,
        label: item.visibility === 'anonimo' ? 'Aporte anónimo' : item.label,
        amountEUR: Number(item.amount_eur || 0),
        targetId: item.goal_slug,
        visibility: item.visibility
      }));
    }

    const { library = {} } = this.getCatalog();
    return library.transparency?.recentContributions || [];
  }

  render() {
    const existing = document.getElementById('transparency-panel');
    if (existing) existing.remove();

    const { library = {} } = this.getCatalog();
    const summary = this.getStatusSummary();
    const principles = library.transparency?.principles || [];
    const targets = this.getTransparencyTargets();
    const recentContributions = this.getRecentContributions();
    const ecosystem = this.getEcosystemInventory();

    const modal = document.createElement('div');
    modal.id = 'transparency-panel';
    modal.className = 'fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950 text-white shadow-2xl">
        <div class="absolute inset-0 opacity-20 pointer-events-none"
             style="background: radial-gradient(circle at top left, #06b6d4 0%, transparent 35%), radial-gradient(circle at top right, #f59e0b 0%, transparent 30%), linear-gradient(135deg, #020617 0%, #0f172a 100%);"></div>

        <div class="relative border-b border-white/10 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p class="text-cyan-300 text-sm font-semibold tracking-[0.2em] uppercase">Panel de Transparencia</p>
            <h2 class="text-2xl sm:text-3xl font-black mt-1">Estado abierto de la app y la colección</h2>
            <p class="text-sm text-slate-300 mt-2 max-w-3xl">
              ${this.escapeHtml(library.transparency?.mission || 'Ver en qué estado está la colección, qué partes siguen en evolución y dónde puede ayudar la comunidad.')}
            </p>
            <div class="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-300">
              <span>${this.remoteState.mode === 'supabase' ? 'Datos en vivo' : 'Modo catálogo'}</span>
              <span class="${this.remoteState.mode === 'supabase' ? 'text-emerald-300' : 'text-amber-300'}">●</span>
            </div>
          </div>
          <button id="close-transparency-panel" class="shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors" aria-label="Cerrar panel de transparencia">
            ${Icons.close(20)}
          </button>
        </div>

        <div class="relative overflow-y-auto max-h-[calc(92vh-90px)] px-6 py-6 space-y-6">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${this.renderMetricCard('Versión biblioteca', summary.version, '📦')}
            ${this.renderMetricCard('Última actualización', summary.lastUpdate, '🗓️')}
            ${this.renderMetricCard('Libros publicados', summary.totalBooks, '📚')}
            ${this.renderMetricCard('Libros interactivos', summary.interactiveBooks, '✨')}
          </div>

          <section class="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h3 class="text-xl font-bold">Objetivo económico visible</h3>
                <p class="text-sm text-slate-300 mt-1">Vista rápida del volumen total que se quiere cubrir para las mejoras priorizadas.</p>
              </div>
              <div class="text-left lg:text-right">
                <div class="text-3xl font-black text-cyan-200">${this.formatEUR(summary.fundedEUR)} / ${this.formatEUR(summary.targetEUR)}</div>
                <div class="text-xs uppercase tracking-[0.15em] text-cyan-100/80">${summary.fundingPercentage}% cubierto</div>
              </div>
            </div>
            <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/70">
              <div class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300"
                   style="width:${summary.fundingPercentage}%"></div>
            </div>
          </section>

          <div class="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <section class="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 class="text-xl font-bold mb-3">Estado actual</h3>
              <div class="space-y-3 text-sm text-slate-300">
                <p>La app web está operativa, la build de Android está integrada con Capacitor y el ecosistema incluye lectura, progreso, IA, audio, notas, paneles de admin, pagos y donaciones.</p>
                <p>La colección se presenta como una obra viva: los libros no se consideran cerrados, sino en evolución y desarrollo infinito.</p>
                <p>La prioridad ahora es convertir esa evolución en algo visible: qué se mejora, cuánto cuesta y cómo puede apoyar la comunidad por secciones.</p>
              </div>
            </section>

            <section class="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <h3 class="text-xl font-bold mb-3 text-amber-200">Principios de transparencia</h3>
              <div class="space-y-2 text-sm text-amber-50">
                ${principles.map(item => `
                  <div class="flex items-start gap-2">
                    <span class="mt-0.5">${Icons.check(14)}</span>
                    <span>${this.escapeHtml(item)}</span>
                  </div>
                `).join('')}
              </div>
            </section>
          </div>

          <section class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
              <div>
                <h3 class="text-xl font-bold">Objetivos de financiación por sección</h3>
                <p class="text-sm text-slate-300 mt-1">Cada bloque representa una mejora concreta con meta económica y progreso visible.</p>
              </div>
              <button id="open-general-donations-from-transparency" class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors">
                Apoyar el ecosistema completo
              </button>
            </div>

            <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              ${targets.map(target => `
                <article class="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div class="flex items-start gap-3">
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl text-xl" style="background:${this.escapeAttr(target.color)}20; color:${this.escapeAttr(target.color)};">
                      ${this.escapeHtml(target.icon)}
                    </div>
                    <div class="min-w-0">
                      <h4 class="font-bold text-white">${this.escapeHtml(target.title)}</h4>
                      <p class="text-xs uppercase tracking-[0.15em] text-slate-400 mt-1">${this.escapeHtml(target.area)} · ${this.escapeHtml(target.status)}</p>
                    </div>
                  </div>
                  <p class="mt-3 text-sm text-slate-300">${this.escapeHtml(target.description)}</p>
                  ${target.bookTitle ? `<p class="mt-2 text-xs text-slate-400">Relacionado con: ${this.escapeHtml(target.bookTitle)}</p>` : ''}
                  ${this.renderTargetProgress(target)}
                  <div class="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em]">
                    <span class="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-200">Prioridad ${this.escapeHtml(target.priority)}</span>
                    <span class="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-200">${this.formatEUR(target.fundedEUR)} recaudados</span>
                  </div>
                  <button class="transparency-support-btn mt-4 w-full rounded-xl px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
                          data-target-id="${this.escapeAttr(target.id)}"
                          style="background: linear-gradient(135deg, ${this.escapeAttr(target.color)}, #0f172a);">
                    Donar para esta sección
                  </button>
                </article>
              `).join('')}
            </div>
          </section>

          <section class="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 class="text-xl font-bold">Aportes públicos recientes</h3>
              <div class="mt-4 space-y-3">
                ${recentContributions.map(entry => `
                  <div class="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    <div class="min-w-0">
                      <p class="font-medium text-white">${this.escapeHtml(entry.label)}</p>
                      <p class="text-xs text-slate-400">${this.escapeHtml(entry.date)} · ${this.resolveContributionTarget(entry.targetId, targets)}</p>
                    </div>
                    <div class="shrink-0 text-emerald-300 font-bold">${this.formatEUR(entry.amountEUR)}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 class="text-xl font-bold">Cómo usar este panel</h3>
              <div class="mt-4 space-y-3 text-sm text-slate-300">
                <p>Elige una sección concreta si quieres apoyar una mejora específica del ecosistema.</p>
                <p>Usa la meta visible para entender el tamaño del trabajo pendiente antes de donar.</p>
                <p>El historial público sirve como semilla de transparencia. El siguiente paso natural es conectarlo a Supabase para automatizar importes y movimientos reales.</p>
              </div>
            </div>
          </section>

          <section class="grid lg:grid-cols-3 gap-4">
            ${this.renderRoadmapCard('Contenido', 'Revisiones editoriales, expansión de capítulos, claridad pedagógica y nuevas referencias.')}
            ${this.renderRoadmapCard('Experiencia', 'Más legibilidad, mejor navegación, paneles más claros y continuidad entre lectura, audio e IA.')}
            ${this.renderRoadmapCard('Infraestructura', 'Pagos más transparentes, paneles de estado, métricas visibles y más robustez de release.')}
          </section>

          <section class="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5">
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
              <div>
                <h3 class="text-xl font-bold">Inventario real del ecosistema</h3>
                <p class="text-sm text-slate-300 mt-1">Mapa abierto de lo que ya existe, lo que está en beta y lo que sigue pendiente de madurar.</p>
              </div>
              <div class="text-xs uppercase tracking-[0.15em] text-fuchsia-200">${ecosystem.books.length} libros · ${ecosystem.tools.length} herramientas · ${ecosystem.modules.length} módulos</div>
            </div>

            <div class="grid xl:grid-cols-2 gap-4">
              ${this.renderInventorySection('Libros publicados', ecosystem.books)}
              ${this.renderInventorySection('Herramientas y apps', ecosystem.tools)}
              ${this.renderInventorySection('Utilidades y módulos', ecosystem.modules)}
              ${this.renderInventorySection('Líneas futuras', ecosystem.roadmap)}
            </div>
          </section>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  renderMetricCard(label, value, icon) {
    return `
      <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="text-2xl">${icon}</div>
        <div class="mt-3 text-2xl font-black">${this.escapeHtml(String(value))}</div>
        <div class="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400">${this.escapeHtml(label)}</div>
      </div>
    `;
  }

  renderRoadmapCard(title, description) {
    return `
      <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 class="font-bold text-lg">${this.escapeHtml(title)}</h3>
        <p class="text-sm text-slate-300 mt-2">${this.escapeHtml(description)}</p>
      </div>
    `;
  }

  renderInventorySection(title, items) {
    return `
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h4 class="font-bold text-lg">${this.escapeHtml(title)}</h4>
        <div class="mt-4 space-y-3">
          ${items.map(item => `
            <article class="rounded-xl border border-white/10 bg-white/5 p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h5 class="font-semibold text-white">${this.escapeHtml(item.title)}</h5>
                  <p class="text-xs uppercase tracking-[0.14em] text-slate-400 mt-1">${this.escapeHtml(item.area)} · ${this.escapeHtml(item.status)} · madurez ${this.escapeHtml(item.maturity)}</p>
                </div>
                <span class="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200">${this.escapeHtml(item.status)}</span>
              </div>
              <p class="mt-2 text-sm text-slate-300">${this.escapeHtml(item.description)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderTargetProgress(target) {
    if (!target.targetEUR) return '';

    const percentage = Math.max(0, Math.min(100, Math.round((target.fundedEUR / target.targetEUR) * 100)));

    return `
      <div class="mt-4">
        <div class="mb-1 flex items-center justify-between text-xs text-slate-300">
          <span>${this.formatEUR(target.fundedEUR)} de ${this.formatEUR(target.targetEUR)}</span>
          <span>${percentage}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-800">
          <div class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style="width:${percentage}%"></div>
        </div>
      </div>
    `;
  }

  resolveContributionTarget(targetId, targets) {
    const match = targets.find(item => item.id === targetId);
    return this.escapeHtml(match?.title || 'Objetivo general');
  }

  formatEUR(amount) {
    const numeric = Number(amount || 0);
    return `${numeric.toLocaleString('es-ES')}€`;
  }

  attachEventListeners() {
    const modal = document.getElementById('transparency-panel');
    if (!modal) return;

    document.getElementById('close-transparency-panel')?.addEventListener('click', () => this.close());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) this.close();
    });

    document.getElementById('open-general-donations-from-transparency')?.addEventListener('click', () => {
        window.donationsModal?.open({
          title: 'Ecosistema completo Colección Nuevo Ser',
          description: 'Apoyo general para sostener libros, app, APK y mejoras transversales.'
        });
      });

    document.querySelectorAll('.transparency-support-btn').forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.targetId;
        const target = this.getTransparencyTargets().find(item => item.id === targetId);
        if (!target) return;

        window.donationsModal?.open({
          title: target.title,
          goalSlug: target.id,
          description: `${target.description}${target.targetEUR ? ` Meta visible: ${this.formatEUR(target.fundedEUR)} / ${this.formatEUR(target.targetEUR)}.` : ''}`
        });
      });
    });

    this.handleEscape = (event) => {
      if (event.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.handleEscape);
  }

  escapeHtml(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  escapeAttr(value) {
    return this.escapeHtml(String(value || ''));
  }
}

window.TransparencyPanel = TransparencyPanel;
