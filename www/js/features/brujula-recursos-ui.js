/**
 * Brújula de Recursos - UI Layer
 *
 * Capa de renderizado para la Brújula de Recursos.
 * Mantiene separada la lógica (brujula-recursos.js) de la presentación.
 */

class BrujulaRecursosUI {
  constructor(brujula) {
    this.brujula = brujula;
    this.container = null;
    this.modal = null;
  }

  // ========== RENDERIZADO PRINCIPAL ==========

  render() {
    if (!this.modal) {
      this.crearModal();
    }

    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Renderizar contenido según modo
    switch (this.brujula.modo) {
      case 'inicio':
        this.renderInicio();
        break;
      case 'dialogo':
        this.renderDialogo();
        break;
      case 'explorar':
        this.renderExplorar();
        break;
      case 'serendipity':
        this.renderSerendipity();
        break;
    }
  }

  crearModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'brujula-modal';
    this.modal.className = 'brujula-modal';
    this.modal.innerHTML = `
      <div class="brujula-backdrop"></div>
      <div class="brujula-container">
        <div class="brujula-content"></div>
      </div>
    `;
    document.body.appendChild(this.modal);

    // Click en backdrop cierra modal
    this.modal.querySelector('.brujula-backdrop').addEventListener('click', () => this.close());

    this.container = this.modal.querySelector('.brujula-content');
  }

  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // ========== PANTALLA DE INICIO ==========

  renderInicio() {
    this.container.innerHTML = `
      <div class="brujula-inicio">
        <div class="brujula-bg-circles"></div>

        <div class="brujula-inicio-content">
          <div class="brujula-symbol">
            <span class="brujula-symbol-icon">🧭</span>
          </div>

          <h1 class="brujula-title">BRÚJULA</h1>

          <p class="brujula-subtitle">
            Este es un espacio para explorar recursos de transformación.<br/>
            No te dirá qué hacer. No tiene las respuestas.<br/>
            Solo ofrece orientación. El camino es tuyo.
          </p>

          <div class="brujula-opciones">
            <button class="brujula-btn brujula-btn-primary" data-action="dialogo">
              <span class="brujula-btn-icon">💬</span>
              <div class="brujula-btn-content">
                <strong>Tengo una inquietud</strong>
                <span class="brujula-btn-desc">Explorar juntos qué podría ser relevante</span>
              </div>
            </button>

            <button class="brujula-btn brujula-btn-secondary" data-action="explorar">
              <span class="brujula-btn-icon">📚</span>
              <div class="brujula-btn-content">
                <strong>Quiero explorar libremente</strong>
                <span class="brujula-btn-desc">Navegar los recursos sin guía</span>
              </div>
            </button>

            <button class="brujula-btn brujula-btn-secondary" data-action="serendipity">
              <span class="brujula-btn-icon">🎲</span>
              <div class="brujula-btn-content">
                <strong>Sorpréndeme</strong>
                <span class="brujula-btn-desc">Descubrir algo inesperado</span>
              </div>
            </button>
          </div>

          <p class="brujula-nota">
            Si en algún momento sientes que esto te dirige más de lo que quieres,<br/>
            confía en tu intuición por encima del sistema.
          </p>

          ${this.historial.length > 0 ? `
            <div class="brujula-stats">
              <span>Has explorado ${this.historial.length} recursos</span>
              ${this.favoritos.length > 0 ? `<span>•</span><span>${this.favoritos.length} favoritos</span>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        if (action === 'dialogo') {
          this.brujula.modo = 'dialogo';
          this.brujula.pasoDialogo = 0;
          this.render();
        } else if (action === 'explorar') {
          this.brujula.modo = 'explorar';
          this.render();
        } else if (action === 'serendipity') {
          this.brujula.modo = 'serendipity';
          this.render();
        }
      });
    });
  }

  // ========== MODO DIÁLOGO ==========

  renderDialogo() {
    this.container.innerHTML = `
      <div class="brujula-dialogo">
        <header class="brujula-header">
          <button class="brujula-btn-back" data-action="volver">← Volver</button>
          <span class="brujula-logo">🧭</span>
          <button class="brujula-btn-explorar" data-action="explorar">Explorar libremente →</button>
        </header>

        <div class="brujula-dialogo-content">
          <div class="brujula-mensajes" id="brujula-mensajes">
            ${this.renderMensajesDialogo()}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('[data-action="volver"]').addEventListener('click', () => {
      this.brujula.modo = 'inicio';
      this.brujula.pasoDialogo = 0;
      this.brujula.inquietud = '';
      this.brujula.dimensionElegida = null;
      this.render();
    });

    this.container.querySelector('[data-action="explorar"]').addEventListener('click', () => {
      this.brujula.modo = 'explorar';
      this.render();
    });

    // Auto-scroll al final
    setTimeout(() => {
      const mensajes = this.container.querySelector('#brujula-mensajes');
      if (mensajes) mensajes.scrollTop = mensajes.scrollHeight;
    }, 100);
  }

  renderMensajesDialogo() {
    const { pasoDialogo, dimensionElegida, inquietud } = this.brujula;
    let html = '';

    // Paso 0: Bienvenida
    if (pasoDialogo >= 0) {
      html += this.mensaje('sistema', 'Gracias por estar aquí.', 0);
      html += this.mensaje('sistema', 'Antes de buscar recursos, me ayudaría entender qué te trae. No para clasificarte — sino para ofrecerte perspectivas que puedan resonar.', 800);
      html += this.mensaje('sistema', `
        <p style="margin: 0 0 1rem 0"><strong>¿Qué inquietud, pregunta o situación te trae hoy?</strong></p>
        <p style="margin: 0; font-size: 0.9rem; color: #71717a">Puede ser algo concreto o difuso. No hay respuesta incorrecta.</p>
      `, 1600);
    }

    // Input de inquietud
    if (pasoDialogo === 0) {
      html += `
        <div class="brujula-input-container" style="margin-top: 1rem; animation: fadeIn 0.5s ease-out 2.2s both">
          <textarea
            id="brujula-inquietud"
            class="brujula-textarea"
            placeholder="Escribe aquí lo que te trae..."
            rows="4"
          >${inquietud}</textarea>
          <button class="brujula-btn-enviar" id="btn-enviar-inquietud" ${!inquietud ? 'disabled' : ''}>
            Compartir
          </button>
        </div>
      `;

      // Event listeners para textarea
      setTimeout(() => {
        const textarea = this.container.querySelector('#brujula-inquietud');
        const btnEnviar = this.container.querySelector('#btn-enviar-inquietud');

        if (textarea) {
          textarea.addEventListener('input', (e) => {
            this.brujula.inquietud = e.target.value;
            btnEnviar.disabled = !e.target.value.trim();
          });

          textarea.focus();
        }

        if (btnEnviar) {
          btnEnviar.addEventListener('click', () => {
            this.brujula.pasoDialogo = 1;
            this.render();
          });
        }
      }, 2300);
    }

    // Paso 1: Mostrar inquietud y dimensiones
    if (pasoDialogo >= 1 && inquietud) {
      html += this.mensaje('usuario', inquietud);
      html += this.mensaje('sistema', 'Gracias por compartir eso.', 500);
      html += this.mensaje('sistema', `
        <p style="margin: 0 0 1rem 0">
          Tu inquietud podría explorarse desde varios lugares. No hay uno "correcto" —
          depende de dónde sientas más urgencia o curiosidad:
        </p>
        <div class="brujula-dimensiones">
          ${Object.entries(this.brujula.dimensiones).map(([key, dim]) => `
            <div class="brujula-dimension ${dimensionElegida === key ? 'selected' : ''}"
                 data-dimension="${key}"
                 style="border-color: ${dim.color}20; ${dimensionElegida === key ? `background: ${dim.color}20; border-color: ${dim.color}50` : ''}">
              <div class="brujula-dimension-header">
                <span>${dim.emoji}</span>
                <strong style="color: ${dim.color}">${dim.nombre}</strong>
              </div>
              <p class="brujula-dimension-pregunta">${dim.pregunta}</p>
            </div>
          `).join('')}
        </div>
      `, 1200);

      // Event listeners para dimensiones
      if (pasoDialogo === 1) {
        setTimeout(() => {
          this.container.querySelectorAll('[data-dimension]').forEach(dim => {
            dim.addEventListener('click', (e) => {
              const key = e.currentTarget.dataset.dimension;
              this.brujula.dimensionElegida = key;
              this.render();
            });
          });
        }, 1300);
      }
    }

    // Botón continuar después de elegir dimensión
    if (pasoDialogo === 1 && dimensionElegida) {
      html += `
        <div style="margin-top: 1rem; text-align: center; animation: fadeIn 0.5s ease-out">
          <button class="brujula-btn-continuar" id="btn-continuar">
            Explorar desde ${this.brujula.dimensiones[dimensionElegida].nombre}
          </button>
          <p style="font-size: 0.8rem; color: #52525b; margin-top: 0.5rem">
            (Puedes cambiar después)
          </p>
        </div>
      `;

      setTimeout(() => {
        const btnContinuar = this.container.querySelector('#btn-continuar');
        if (btnContinuar) {
          btnContinuar.addEventListener('click', () => {
            this.brujula.pasoDialogo = 2;
            this.render();
          });
        }
      }, 100);
    }

    // Paso 2: Mostrar recursos relevantes
    if (pasoDialogo >= 2 && dimensionElegida) {
      html += this.mensaje('usuario', `${this.brujula.dimensiones[dimensionElegida].emoji} Quiero explorar desde lo ${this.brujula.dimensiones[dimensionElegida].nombre}`);

      const recursosRelevantes = this.brujula.recursos
        .map(r => ({
          ...r,
          relevancia: this.brujula.calcularRelevancia(r, inquietud, dimensionElegida)
        }))
        .sort((a, b) => b.relevancia - a.relevancia)
        .slice(0, 6);

      html += this.mensaje('sistema', `
        <p style="margin: 0 0 1rem 0">
          Aquí hay algunos recursos que otros han encontrado útiles para explorar esa dimensión.
          No son receta — son invitaciones. Mira si alguno te llama:
        </p>
        <div class="brujula-recursos-lista">
          ${recursosRelevantes.map(r => this.renderRecursoCompacto(r)).join('')}
        </div>
      `, 500);

      html += this.mensaje('sistema', `
        <p style="margin: 0; font-style: italic; color: #a1a1aa">
          También puedes explorar otras dimensiones, o navegar libremente todos los recursos.
          No hay prisa. No hay orden correcto.
        </p>
      `, 1500);

      // Opciones finales
      html += `
        <div class="brujula-opciones-finales" style="margin-top: 2rem; animation: fadeIn 0.5s ease-out 2s both">
          <button class="brujula-btn-opcion" data-action="cambiar-dimension">
            Explorar otra dimensión
          </button>
          <button class="brujula-btn-opcion" data-action="ver-todos">
            Ver todos los recursos
          </button>
        </div>
      `;

      // Event listeners
      setTimeout(() => {
        this.container.querySelectorAll('[data-recurso-id]').forEach(el => {
          el.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.recursoId;
            const recurso = this.brujula.recursos.find(r => r.id === id);
            if (recurso) this.abrirRecurso(recurso);
          });
        });

        const btnCambiar = this.container.querySelector('[data-action="cambiar-dimension"]');
        if (btnCambiar) {
          btnCambiar.addEventListener('click', () => {
            this.brujula.pasoDialogo = 1;
            this.brujula.dimensionElegida = null;
            this.render();
          });
        }

        const btnVerTodos = this.container.querySelector('[data-action="ver-todos"]');
        if (btnVerTodos) {
          btnVerTodos.addEventListener('click', () => {
            this.brujula.modo = 'explorar';
            this.render();
          });
        }
      }, 2100);
    }

    return html;
  }

  mensaje(tipo, contenido, delay = 0) {
    const animationDelay = delay > 0 ? `animation-delay: ${delay}ms;` : '';
    const align = tipo === 'usuario' ? 'flex-end' : 'flex-start';
    const bgClass = tipo === 'usuario' ? 'brujula-mensaje-usuario' : 'brujula-mensaje-sistema';

    return `
      <div class="brujula-mensaje" style="justify-content: ${align}; animation: fadeIn 0.5s ease-out ${delay}ms both; ${animationDelay}">
        <div class="${bgClass}">
          ${contenido}
        </div>
      </div>
    `;
  }

  renderRecursoCompacto(recurso) {
    return `
      <div class="brujula-recurso-compacto" data-recurso-id="${recurso.id}">
        <span class="brujula-recurso-icono">${recurso.icono}</span>
        <div class="brujula-recurso-info">
          <div class="brujula-recurso-titulo">${recurso.title}</div>
          <div class="brujula-recurso-meta">${recurso.libroNombre || recurso.fuente || ''} · ${this.brujula.obtenerDuracionEstimada(recurso)}</div>
        </div>
      </div>
    `;
  }

  // ========== MODO EXPLORAR ==========

  renderExplorar() {
    const { filtro } = this.brujula;

    const recursosFiltrados = this.brujula.recursos.filter(r => {
      if (filtro.dimension && !r.dimensiones.includes(filtro.dimension)) return false;
      if (filtro.tipo && r.tipo !== filtro.tipo) return false;
      if (filtro.libro && r.libroOrigen !== filtro.libro) return false;
      return true;
    });

    const tiposUnicos = [...new Set(this.brujula.recursos.map(r => r.tipo))];
    this.container.innerHTML = `
      <div class="brujula-explorar">
        <header class="brujula-header">
          <button class="brujula-btn-back" data-action="inicio">← Inicio</button>
          <h1 class="brujula-explorar-titulo">Explorar recursos</h1>
          <div style="width: 60px"></div>
        </header>

        <div class="brujula-explorar-content">
          <p class="brujula-explorar-desc">
            ${this.brujula.recursos.length} recursos del ecosistema, sin orden ni jerarquía. Explora lo que te llame.
          </p>

          <!-- Filtros por dimensión -->
          <div class="brujula-filtros">
            <div class="brujula-filtros-grupo">
              <button class="brujula-filtro ${!filtro.dimension ? 'active' : ''}" data-filtro="dimension" data-valor="">
                Todas las dimensiones
              </button>
              ${Object.entries(this.brujula.dimensiones).map(([key, dim]) => `
                <button class="brujula-filtro ${filtro.dimension === key ? 'active' : ''}"
                        data-filtro="dimension"
                        data-valor="${key}"
                        style="${filtro.dimension === key ? `background: ${dim.color}25; border-color: ${dim.color}40; color: ${dim.color}` : ''}">
                  ${dim.emoji} ${dim.nombre}
                </button>
              `).join('')}
            </div>

            <!-- Filtros por tipo -->
            <div class="brujula-filtros-grupo">
              ${tiposUnicos.map(tipo => `
                <button class="brujula-filtro-tipo ${filtro.tipo === tipo ? 'active' : ''}"
                        data-filtro="tipo"
                        data-valor="${tipo}">
                  ${tipo}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Grid de recursos -->
          <div class="brujula-grid">
            ${recursosFiltrados.slice(0, 50).map(r => this.renderTarjetaRecurso(r)).join('')}
          </div>

          ${recursosFiltrados.length === 0 ? `
            <div class="brujula-vacio">
              <p>No se encontraron recursos con estos filtros.</p>
              <button class="brujula-btn-reset" data-action="reset-filtros">Limpiar filtros</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Event listeners
    this.setupFiltros();
    this.setupTarjetas();

    const btnInicio = this.container.querySelector('[data-action="inicio"]');
    if (btnInicio) {
      btnInicio.addEventListener('click', () => {
        this.brujula.modo = 'inicio';
        this.render();
      });
    }

    const btnReset = this.container.querySelector('[data-action="reset-filtros"]');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.brujula.filtro = { dimension: null, tipo: null, libro: null };
        this.render();
      });
    }
  }

  renderTarjetaRecurso(recurso) {
    const esFav = this.brujula.esFavorito(recurso);
    const duracion = this.brujula.obtenerDuracionEstimada(recurso);

    return `
      <div class="brujula-tarjeta" data-recurso-id="${recurso.id}">
        <div class="brujula-tarjeta-header">
          <span class="brujula-tarjeta-icono">${recurso.icono}</span>
          <span class="brujula-tarjeta-duracion">${duracion}</span>
        </div>
        <h3 class="brujula-tarjeta-titulo">${recurso.title}</h3>
        <p class="brujula-tarjeta-desc">${(recurso.description || '').slice(0, 100)}${recurso.description && recurso.description.length > 100 ? '...' : ''}</p>
        <div class="brujula-tarjeta-footer">
          <div class="brujula-tarjeta-dimensiones">
            ${recurso.dimensiones.map(d => {
              const dim = this.brujula.dimensiones[d];
              return `<span class="brujula-dimension-dot" style="background: ${dim.color}" title="${dim.nombre}"></span>`;
            }).join('')}
          </div>
          <button class="brujula-btn-favorito ${esFav ? 'active' : ''}" data-recurso-id="${recurso.id}" data-action="toggle-favorito">
            ${esFav ? '★' : '☆'}
          </button>
        </div>
      </div>
    `;
  }

  setupFiltros() {
    this.container.querySelectorAll('[data-filtro]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filtro = e.currentTarget.dataset.filtro;
        const valor = e.currentTarget.dataset.valor;
        this.brujula.filtro[filtro] = valor || null;
        this.render();
      });
    });
  }

  setupTarjetas() {
    this.container.querySelectorAll('.brujula-tarjeta').forEach(tarjeta => {
      tarjeta.addEventListener('click', (e) => {
        // Ignorar si se clickeó el botón de favorito
        if (e.target.closest('[data-action="toggle-favorito"]')) return;

        const id = tarjeta.dataset.recursoId;
        const recurso = this.brujula.recursos.find(r => r.id === id);
        if (recurso) this.abrirRecurso(recurso);
      });
    });

    this.container.querySelectorAll('[data-action="toggle-favorito"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.recursoId;
        const recurso = this.brujula.recursos.find(r => r.id === id);
        if (recurso) {
          this.brujula.toggleFavorito(recurso);
          this.render();
        }
      });
    });
  }

  // ========== MODO SERENDIPITY ==========

  renderSerendipity() {
    const recurso = this.brujula.obtenerRecursoAleatorio();

    // Si no hay recursos disponibles, mostrar mensaje
    if (!recurso) {
      this.container.innerHTML = `
        <div class="brujula-serendipity">
          <div class="brujula-serendipity-content">
            <div class="brujula-serendipity-symbol">📭</div>
            <h2 class="brujula-serendipity-titulo">No hay recursos disponibles</h2>
            <p class="brujula-serendipity-intro">
              Aún no se han cargado recursos en el sistema.<br/>
              Por favor, verifica que los libros tengan archivos resources.json configurados.
            </p>
            <div class="brujula-serendipity-acciones">
              <button class="brujula-btn-secondary" data-action="inicio">Volver al inicio</button>
            </div>
          </div>
        </div>
      `;

      this.container.querySelector('[data-action="inicio"]').addEventListener('click', () => {
        this.brujula.modo = 'inicio';
        this.render();
      });
      return;
    }

    this.container.innerHTML = `
      <div class="brujula-serendipity">
        <div class="brujula-serendipity-content">
          <div class="brujula-serendipity-symbol">🎲</div>
          <h2 class="brujula-serendipity-titulo">Descubrimiento inesperado</h2>
          <p class="brujula-serendipity-intro">
            A veces lo que necesitamos no es lo que buscamos.<br/>
            Este recurso apareció por serendipidad:
          </p>

          ${this.renderDetalleRecurso(recurso, true)}

          <div class="brujula-serendipity-acciones">
            <button class="brujula-btn-secondary" data-action="otro">Otro recurso aleatorio</button>
            <button class="brujula-btn-secondary" data-action="explorar">Explorar todos</button>
            <button class="brujula-btn-secondary" data-action="inicio">Volver al inicio</button>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('[data-action="otro"]').addEventListener('click', () => this.render());
    this.container.querySelector('[data-action="explorar"]').addEventListener('click', () => {
      this.brujula.modo = 'explorar';
      this.render();
    });
    this.container.querySelector('[data-action="inicio"]').addEventListener('click', () => {
      this.brujula.modo = 'inicio';
      this.render();
    });
  }

  // ========== MODAL DE RECURSO ==========

  abrirRecurso(recurso) {
    this.brujula.registrarVisita(recurso);
    const recomendaciones = this.brujula.obtenerRecomendaciones(recurso, 4);
    const esFav = this.brujula.esFavorito(recurso);

    const modalRecurso = document.createElement('div');
    modalRecurso.className = 'brujula-modal-recurso';
    modalRecurso.innerHTML = `
      <div class="brujula-modal-recurso-backdrop"></div>
      <div class="brujula-modal-recurso-contenido">
        ${this.renderDetalleRecurso(recurso)}

        ${recomendaciones.length > 0 ? `
          <div class="brujula-recomendaciones">
            <h4>Si esto te interesa, también podrías explorar:</h4>
            <div class="brujula-recomendaciones-lista">
              ${recomendaciones.map(r => this.renderRecursoCompacto(r)).join('')}
            </div>
          </div>
        ` : ''}

        <div class="brujula-modal-acciones">
          <button class="brujula-btn-favorito-grande ${esFav ? 'active' : ''}" data-action="toggle-fav">
            ${esFav ? '★ Quitar de favoritos' : '☆ Añadir a favoritos'}
          </button>
          <button class="brujula-btn-cerrar" data-action="cerrar">Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalRecurso);

    // Event listeners
    modalRecurso.querySelector('[data-action="cerrar"]').addEventListener('click', () => {
      modalRecurso.remove();
    });

    modalRecurso.querySelector('.brujula-modal-recurso-backdrop').addEventListener('click', () => {
      modalRecurso.remove();
    });

    modalRecurso.querySelector('[data-action="toggle-fav"]').addEventListener('click', () => {
      this.brujula.toggleFavorito(recurso);
      modalRecurso.remove();
      this.abrirRecurso(recurso); // Reabrir actualizado
    });

    // Recomendaciones clickeables
    modalRecurso.querySelectorAll('[data-recurso-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.recursoId;
        const rec = this.brujula.recursos.find(r => r.id === id);
        if (rec) {
          modalRecurso.remove();
          this.abrirRecurso(rec);
        }
      });
    });
  }

  renderDetalleRecurso(recurso, compacto = false) {
    return `
      <div class="brujula-detalle-recurso ${compacto ? 'compacto' : ''}">
        <div class="brujula-detalle-icono">${recurso.icono}</div>
        <h3 class="brujula-detalle-titulo">${recurso.title}</h3>

        <div class="brujula-detalle-meta">
          <span class="brujula-badge">${recurso.tipo}</span>
          <span class="brujula-badge">⏱ ${this.brujula.obtenerDuracionEstimada(recurso)}</span>
          ${recurso.author ? `<span class="brujula-badge">👤 ${recurso.author}</span>` : ''}
          ${recurso.year ? `<span class="brujula-badge">📅 ${recurso.year}</span>` : ''}
        </div>

        <p class="brujula-detalle-descripcion">${recurso.description || recurso.why || ''}</p>

        ${recurso.libroNombre ? `<p class="brujula-detalle-fuente">Fuente: ${recurso.libroNombre}</p>` : ''}

        ${recurso.link || recurso.website ? `
          <a href="${recurso.link || recurso.website}" target="_blank" rel="noopener" class="brujula-btn-link">
            🔗 Visitar recurso externo
          </a>
        ` : ''}

        ${recurso.libroDestino ? `
          <button class="brujula-btn-libro" data-libro="${recurso.libroDestino}">
            📖 Abrir libro: ${recurso.title}
          </button>
        ` : ''}

        <div class="brujula-detalle-dimensiones">
          ${recurso.dimensiones.map(d => {
            const dim = this.brujula.dimensiones[d];
            return `
              <span class="brujula-dimension-tag" style="background: ${dim.color}20; color: ${dim.color}">
                ${dim.emoji} ${dim.nombre}
              </span>
            `;
          }).join('')}
        </div>

        ${!compacto ? `
          <div class="brujula-nota-humildad">
            <p>Si esto te resuena, explóralo. Si no, déjalo pasar.<br/>
            Tu intuición sabe mejor que cualquier sistema.</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ========== UTILIDADES ==========

  get historial() {
    return this.brujula.historial;
  }

  get favoritos() {
    return this.brujula.favoritos;
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.BrujulaRecursosUI = BrujulaRecursosUI;
}
