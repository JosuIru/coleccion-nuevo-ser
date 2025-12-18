# 🛠️ GUÍA DE IMPLEMENTACIÓN TÉCNICA
## Colección Nuevo Ser - Cómo Construir las Mejoras

---

## 📋 ÍNDICE

1. [Sistema de Logros](#1-sistema-de-logros)
2. [Resumen Automático](#2-resumen-automático)
3. [Preguntas Reflexivas](#3-preguntas-reflexivas)
4. [Mapas Conceptuales](#4-mapas-conceptuales)
5. [Notas Inteligentes](#5-notas-inteligentes)
6. [Planes de Acción](#6-planes-de-acción)
7. [Sugerencias Contextuales](#7-sugerencias-contextuales)
8. [Comunidad Asincrónica](#8-comunidad-asincrónica)

---

## 1. SISTEMA DE LOGROS

### Estructura de Datos

```javascript
// data/achievements.js
const ACHIEVEMENTS = {
  'codigo-despertar': [
    {
      id: 'primer-paso',
      titulo: '📖 Primer Paso',
      descripcion: 'Completar capítulo 1',
      condition: (progress) => progress['cap1'] === true,
      points: 10,
      icon: '📖'
    },
    {
      id: 'pensador',
      titulo: '🖊️ Pensador',
      descripcion: 'Escribir 5 notas',
      condition: (stats) => stats.notasCount >= 5,
      points: 25,
      icon: '🖊️'
    },
    {
      id: 'mitad-camino',
      titulo: '🌙 Mitad del Camino',
      descripcion: 'Leer 50% del libro',
      condition: (progress) => {
        const completados = Object.values(progress).filter(x => x).length;
        return completados >= 8; // De 16 caps
      },
      points: 50,
      icon: '🌙'
    }
    // ... más logros
  ],
  'manifiesto': [
    // ... logros específicos para este libro
  ]
};
```

### Sistema de Verificación

```javascript
// features/achievements.js
class AchievementSystem {
  constructor(storage) {
    this.storage = storage;
    this.unlockedAchievements = storage.get('unlockedAchievements') || {};
  }

  // Verificar y desbloquear logros
  async checkAndUnlock(libroId) {
    const logros = ACHIEVEMENTS[libroId];
    const progress = this.storage.get(`progress-${libroId}`);
    const stats = this.storage.get(`stats-${libroId}`) || {};

    for (const logro of logros) {
      const yaDesbloqueado = this.unlockedAchievements[logro.id];

      if (!yaDesbloqueado && logro.condition(progress, stats)) {
        // Desbloquear
        this.unlock(logro);
        this.showNotification(logro);
      }
    }
  }

  unlock(logro) {
    this.unlockedAchievements[logro.id] = {
      unlockedAt: new Date(),
      points: logro.points
    };
    this.storage.set('unlockedAchievements', this.unlockedAchievements);
  }

  showNotification(logro) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-content">
        <h3>${logro.icon} ${logro.titulo}</h3>
        <p>${logro.descripcion}</p>
        <span class="points">+${logro.points} puntos</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }

  // Mostrar dashboard
  renderDashboard(libroId) {
    const logros = ACHIEVEMENTS[libroId];
    const unlocked = this.unlockedAchievements;

    const html = logros.map(logro => `
      <div class="achievement-card ${unlocked[logro.id] ? 'unlocked' : 'locked'}">
        <span class="icon">${logro.icon}</span>
        <h4>${logro.titulo}</h4>
        <p>${logro.descripcion}</p>
        ${unlocked[logro.id] ? `
          <small>Desbloqueado: ${new Date(unlocked[logro.id].unlockedAt).toLocaleDateString()}</small>
        ` : '<small>Bloqueado</small>'}
      </div>
    `).join('');

    return html;
  }
}
```

### CSS

```css
/* styles/achievements.css */
.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

@keyframes slideIn {
  from { transform: translateX(400px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.achievement-card {
  border: 2px solid #333;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;
}

.achievement-card.unlocked {
  background: rgba(251, 191, 36, 0.1);
  border-color: #fbbf24;
  transform: scale(1.05);
}

.achievement-card.locked {
  opacity: 0.5;
  filter: grayscale(100%);
}
```

---

## 2. RESUMEN AUTOMÁTICO

### Función Principal

```javascript
// features/auto-summary.js
class AutoSummary {
  constructor(aiClient) {
    this.aiClient = aiClient; // Claude API client
  }

  async generateSummary(capitulo) {
    const contenido = capitulo.contenido;

    // Limitar a primeras 3000 caracteres para no gastar tokens
    const contenidoLimitado = contenido.substring(0, 3000);

    const prompt = `
Genera un resumen en formato bullet points de 3-5 puntos CLAVE del siguiente capítulo.
Se ultra-conciso. Cada punto máximo 2 líneas.

FORMATO:
🔑 Punto clave 1: Explicación breve
🔑 Punto clave 2: Explicación breve
... etc

CAPÍTULO: "${capitulo.titulo}"

CONTENIDO:
${contenidoLimitado}

INSTRUCCIONES ESPECIALES:
- Si el capítulo es teórico: Enfócate en conceptos
- Si es narrativo: Enfócate en insights del diálogo
- Si es práctico: Enfócate en acciones concretas
    `;

    try {
      const response = await this.aiClient.claude({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error generando resumen:', error);
      return null;
    }
  }

  async generarYGuardar(capitulo, libroId) {
    const summary = await this.generateSummary(capitulo);

    if (summary) {
      const key = `summary-${libroId}-${capitulo.id}`;
      localStorage.setItem(key, summary);
      return summary;
    }

    return null;
  }

  mostrarResumen(capitulo, libroId) {
    const key = `summary-${libroId}-${capitulo.id}`;
    const summary = localStorage.getItem(key);

    if (!summary) return null;

    return `
      <div class="chapter-summary">
        <h4>📄 Resumen del Capítulo</h4>
        <div class="summary-content">
          ${summary.split('\n').map(line =>
            line.trim() ? `<p>${line}</p>` : ''
          ).join('')}
        </div>
        <div class="summary-actions">
          <button onclick="downloadSummary('${libroId}', '${capitulo.id}')">
            📥 Descargar
          </button>
          <button onclick="openChatWithSummary('${summary}')">
            💬 Preguntar sobre esto
          </button>
        </div>
      </div>
    `;
  }
}

// Usar en el flujo de lectura
async function alTerminarCapitulo(capitulo, libroId) {
  const summary = new AutoSummary(claudeClient);
  const resumenGenerado = await summary.generarYGuardar(capitulo, libroId);

  if (resumenGenerado) {
    mostrarModal({
      titulo: '✨ Resumen del Capítulo',
      contenido: summary.mostrarResumen(capitulo, libroId),
      acciones: ['Cerrar', 'Siguiente capítulo']
    });
  }
}
```

---

## 3. PREGUNTAS REFLEXIVAS

### Data y Lógica

```javascript
// data/reflexive-questions.js
const REFLEXIVE_QUESTIONS = {
  'codigo-despertar': {
    'cap1': [
      '¿Cómo cambiaría tu vida si entendieras que TODO es información?',
      '¿Qué sistema en tu vida podría verse como "código ejecutable"?',
      '¿Cuándo fue la última vez que cuestionaste una "realidad" dada?'
    ],
    'cap2': [
      '¿De dónde surge el "yo" que observa?',
      '¿Qué diferencia hay entre procesar algo y entenderlo?',
      'Si replicaran exactamente tu cerebro, ¿serías tú?'
    ],
    // ... más preguntas
  },
  'manifiesto': {
    'cap1': [
      '¿A qué sistema te beneficias sin cuestionarlo?',
      '¿Qué acción pequeña podrías hacer HOY?',
      '¿Quién en tu círculo necesita escuchar esto?'
    ]
    // ... más preguntas
  }
};

// features/reflexive-questions.js
class ReflexiveQuestions {
  constructor(storage) {
    this.storage = storage;
  }

  getPregunta(libroId, capituloId) {
    const preguntas = REFLEXIVE_QUESTIONS[libroId]?.[capituloId] || [];
    if (!preguntas.length) return null;

    // Seleccionar aleatoriamente
    return preguntas[Math.floor(Math.random() * preguntas.length)];
  }

  async mostrarAlTerminarCapitulo(libroId, capituloId) {
    const pregunta = this.getPregunta(libroId, capituloId);
    if (!pregunta) return;

    const modal = this.crearModal(pregunta, libroId, capituloId);
    document.body.appendChild(modal);
  }

  crearModal(pregunta, libroId, capituloId) {
    const modal = document.createElement('div');
    modal.className = 'reflexive-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>✨ Pregunta para Reflexionar</h3>
        <p class="pregunta">"${pregunta}"</p>

        <textarea id="reflexion-input"
                  placeholder="Tómate un momento para reflexionar..."
                  rows="5"></textarea>

        <div class="modal-actions">
          <button onclick="guardarReflexion('${libroId}', '${capituloId}')">
            Guardar privado
          </button>
          <button onclick="compartirReflexion('${libroId}', '${capituloId}')">
            Compartir anónimamente
          </button>
          <button onclick="cerrarModal()">
            Saltar
          </button>
        </div>
      </div>
    `;

    return modal;
  }

  async guardarReflexion(libroId, capituloId) {
    const contenido = document.getElementById('reflexion-input').value;
    const key = `reflexion-privada-${libroId}-${capituloId}`;
    this.storage.set(key, {
      contenido,
      timestamp: new Date(),
      compartida: false
    });
    // Cerrar modal y mostrar confirmación
  }

  async compartirReflexion(libroId, capituloId) {
    const contenido = document.getElementById('reflexion-input').value;

    // Enviar a backend (si existe)
    const response = await fetch('/api/reflexions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libroId,
        capituloId,
        contenido,
        anonimo: true,
        timestamp: new Date()
      })
    });

    if (response.ok) {
      alert('¡Gracias por compartir tu reflexión con la comunidad!');
    }
  }
}
```

---

## 4. MAPAS CONCEPTUALES

### Usando vis.js

```javascript
// features/concept-maps.js
import { Network } from 'vis-network/standalone/umd/vis-network.min.js';

class ConceptMap {
  constructor(capituloId) {
    this.capituloId = capituloId;
  }

  async generarMapa(contenido) {
    // Usar Claude para extraer conceptos y relaciones
    const prompt = `
Analiza este contenido y extrae:
1. Los 5-8 conceptos CLAVE
2. Las relaciones entre ellos

FORMATO JSON:
{
  "nodos": [
    { "id": "consciencia", "label": "Consciencia", "color": "#ff6b6b" },
    { "id": "informacion", "label": "Información", "color": "#4ecdc4" }
  ],
  "aristas": [
    { "from": "consciencia", "to": "informacion", "label": "es" }
  ]
}

CONTENIDO:
${contenido.substring(0, 2000)}
    `;

    const response = await claudeClient.call(prompt);
    const mapData = JSON.parse(response);

    return mapData;
  }

  renderizar(containerId, mapData) {
    const container = document.getElementById(containerId);

    const data = {
      nodes: new vis.DataSet(mapData.nodos),
      edges: new vis.DataSet(mapData.aristas)
    };

    const options = {
      physics: {
        enabled: true,
        stabilization: { iterations: 200 }
      },
      nodes: {
        font: { size: 14 },
        borderWidth: 2,
        borderWidthSelected: 3,
        margin: { top: 10, bottom: 10, left: 10, right: 10 },
      },
      edges: {
        font: { size: 12 },
        arrows: 'to',
        smooth: { type: 'continuous' }
      },
      interaction: {
        navigationButtons: true,
        keyboard: true
      }
    };

    const network = new Network(container, data, options);

    // Click en nodo → abre opciones
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodoId = params.nodes[0];
        const nodo = mapData.nodos.find(n => n.id === nodoId);
        this.mostrarDetallesNodo(nodo);
      }
    });

    return network;
  }

  mostrarDetallesNodo(nodo) {
    const modal = document.createElement('div');
    modal.className = 'concepto-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${nodo.label}</h3>
        <div class="acciones">
          <button onclick="openChat('Explícame: ${nodo.label}')">
            💬 Preguntar sobre esto
          </button>
          <button onclick="crearNota('${nodo.label}')">
            📝 Crear nota
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// Usar
async function mostrarMapaConceptual(capitulo) {
  const mapa = new ConceptMap(capitulo.id);
  const mapData = await mapa.generarMapa(capitulo.contenido);
  mapa.renderizar('concept-map-container', mapData);
}
```

---

## 5. NOTAS INTELIGENTES

### Estructura Avanzada

```javascript
// features/smart-notes.js
class SmartNote {
  constructor(contenido, capituloId, libroId) {
    this.contenido = contenido;
    this.capituloId = capituloId;
    this.libroId = libroId;
    this.fechaCreacion = new Date();
    this.tags = this.extraerTags(contenido);
    this.conceptos = []; // Extraído por IA
  }

  extraerTags(texto) {
    // Buscar #palabra en el texto
    const regex = /#\w+/g;
    return texto.match(regex) || [];
  }

  async extraerConceptos() {
    const prompt = `
Extrae los 3-5 conceptos principales de esta nota:

"${this.contenido}"

Formato: JSON
{ "conceptos": ["concepto1", "concepto2", ...] }
    `;

    const response = await claudeClient.call(prompt);
    const { conceptos } = JSON.parse(response);
    this.conceptos = conceptos;
  }

  obtenerNotasConexas() {
    const todasLasNotas = this.obtenerTodas();

    return todasLasNotas.filter(nota => {
      // Notas con tags en común
      const tagsComunes = nota.tags.some(t => this.tags.includes(t));
      // Notas con conceptos en común
      const conceptosComunes = nota.conceptos.some(c =>
        this.conceptos.includes(c)
      );

      return (tagsComunes || conceptosComunes) && nota.id !== this.id;
    }).slice(0, 3);
  }

  async generarSintesis() {
    const notasConexas = this.obtenerNotasConexas();

    const todasLasNotas = [this.contenido, ...notasConexas.map(n => n.contenido)];

    const prompt = `
Genera una síntesis conectando estas notas sobre el mismo tema:

${todasLasNotas.map((nota, i) => `Nota ${i}: "${nota}"`).join('\n\n')}

La síntesis debe:
1. Conectar las ideas
2. Añadir insight nuevo
3. Ser máx 3 párrafos
    `;

    return await claudeClient.call(prompt);
  }

  // Spaced repetition
  calcularProximoRepaso() {
    const ahora = new Date();
    const dias = [1, 3, 7, 14, 30]; // Días para revisar
    const cantidadRepasos = this.repasos?.length || 0;
    const diasHasta = dias[Math.min(cantidadRepasos, dias.length - 1)];

    return new Date(ahora.getTime() + diasHasta * 24 * 60 * 60 * 1000);
  }

  guardar() {
    const key = `nota-${this.id || Date.now()}`;
    const data = {
      id: this.id || Date.now(),
      contenido: this.contenido,
      capituloId: this.capituloId,
      libroId: this.libroId,
      tags: this.tags,
      conceptos: this.conceptos,
      fechaCreacion: this.fechaCreacion,
      proximoRepaso: this.calcularProximoRepaso(),
      repasos: this.repasos || []
    };

    localStorage.setItem(key, JSON.stringify(data));
    return data.id;
  }

  // Renderizar nota
  render() {
    return `
      <div class="smart-note">
        <h4>${this.contenido.substring(0, 50)}...</h4>

        <div class="tags">
          ${this.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>

        <p class="meta">Cap: ${this.capituloId} | Creada: ${this.fechaCreacion.toLocaleDateString()}</p>

        <details>
          <summary>Ver notas conectadas</summary>
          <div class="notas-conexas">
            ${this.obtenerNotasConexas().map(nota => `
              <p>→ ${nota.contenido.substring(0, 40)}...</p>
            `).join('')}
          </div>
        </details>

        <button onclick="verSintesis('${this.id}')">🧠 Ver síntesis</button>
      </div>
    `;
  }
}
```

---

## 6. PLANES DE ACCIÓN

```javascript
// features/action-plans.js
class ActionPlanGenerator {
  async generar(libroId, intereses, contexto) {
    const prompt = `
El usuario leyó "${libroId}".
Intereses: ${intereses.join(', ')}
Contexto: ${contexto}

Crea un PLAN DE ACCIÓN de 30 días ESPECÍFICO con:

SEMANA 1: APRENDIZAJE (4-5 horas)
- Lunes: [Tarea específica] (duración)
- Miércoles: [Tarea específica] (duración)
- Viernes: [Tarea específica] (duración)

SEMANA 2: CONVERSACIÓN (4-5 horas)
[Igual formato]

SEMANA 3: PROTOTIPADO (4-5 horas)
[Igual formato]

SEMANA 4: ACCIÓN (4-5 horas)
[Igual formato]

IMPORTANTE:
- Sé MUY ESPECÍFICO
- Incluye duración exacta
- Nomina personas/grupos reales si aplica
- Resultado medible

Ejemplo NO: "Aprender sobre cooperativas"
Ejemplo SÍ: "Leer artículo '30-year history of Mondragon' (45 min)"
    `;

    const response = await claudeClient.call(prompt);
    return response;
  }

  renderizar(plan) {
    return `
      <div class="action-plan">
        <h3>🎯 Tu Plan de 30 Días</h3>
        ${plan}

        <div class="plan-actions">
          <button onclick="guardarPlan()">Guardar en mi calendario</button>
          <button onclick="compartirPlan()">Compartir con amigo</button>
          <button onclick="downloadPlan()">Descargar PDF</button>
        </div>
      </div>
    `;
  }
}
```

---

## 7. SUGERENCIAS CONTEXTUALES

```javascript
// features/contextual-suggestions.js
class ContextualAISuggestions {
  async obtenerSugerencias(capituloId, libroId) {
    const capitulo = getCapitulo(libroId, capituloId);

    const suggestions = await Promise.all([
      this.profundizar(capitulo),
      this.contraargumento(capitulo),
      this.aplicacion(capitulo)
    ]);

    return suggestions;
  }

  async profundizar(capitulo) {
    const prompt = `
En el capítulo "${capitulo.titulo}" se mencionan estos temas principales:
${capitulo.temasprincipales.join(', ')}

¿En cuál podríamos profundizar más? Sugiere UN tema específico
que la persona podría explorar en el chat.
    `;

    const tema = await claudeClient.call(prompt);

    return {
      tipo: 'profundizar',
      titulo: 'Explorar más',
      tema,
      accion: () => abrirChat(`Cuéntame más sobre: ${tema}`)
    };
  }

  async contraargumento(capitulo) {
    const prompt = `
El capítulo argumenta que: "${capitulo.argumentoPrincipal}"

¿Cuál sería un contraargumento válido? Usa 1 línea.
    `;

    const contra = await claudeClient.call(prompt);

    return {
      tipo: 'contraargumento',
      titulo: 'Perspectiva alternativa',
      tema: contra,
      accion: () => abrirChat(`¿Pero no podrían decir que...? ${contra}`)
    };
  }

  async aplicacion(capitulo) {
    const prompt = `
El capítulo trata sobre: "${capitulo.titulo}"

¿Cómo alguien podría aplicar esto en su vida HOYAÑADO mismo?
Sugiere UNA acción concreta que toma máx 15 minutos.
    `;

    const accion = await claudeClient.call(prompt);

    return {
      tipo: 'aplicacion',
      titulo: 'Prueba ahora',
      tema: accion,
      accion: () => mostrarEjercicio(accion)
    };
  }

  renderizar(sugerencias) {
    return `
      <div class="ai-suggestions">
        <h4>💡 Sugerencias para profundizar</h4>
        ${sugerencias.map(s => `
          <button class="suggestion-btn ${s.tipo}"
                  onclick="${s.accion}">
            <strong>${s.titulo}:</strong> ${s.tema}
          </button>
        `).join('')}
      </div>
    `;
  }
}
```

---

## 8. COMUNIDAD ASINCRÓNICA

### Backend Básico

```javascript
// backend/reflexions-api.js
// (Node.js + Express)

app.post('/api/reflexions', async (req, res) => {
  const {libroId, capituloId, contenido, anonimo} = req.body;

  // Validar contenido (anti-spam)
  if (!contenido || contenido.length < 10) {
    return res.status(400).json({error: 'Contenido muy corto'});
  }

  // Guardar en DB
  const reflexion = await db.reflexions.create({
    libroId,
    capituloId,
    contenido,
    anonimo,
    userId: anonimo ? null : req.user.id,
    timestamp: new Date(),
    status: 'approved' // O 'pending' si quieres moderar
  });

  res.json({success: true, id: reflexion.id});
});

// Obtener reflexiones de una pregunta
app.get('/api/reflexions/:libroId/:capituloId', async (req, res) => {
  const {libroId, capituloId} = req.params;

  const reflexiones = await db.reflexions.find({
    libroId,
    capituloId,
    status: 'approved'
  });

  // Generar síntesis con IA
  const sintesis = await generarSintesis(reflexiones);

  res.json({
    count: reflexiones.length,
    ejemplos: reflexiones.slice(0, 3),
    sintesis
  });
});
```

### Frontend

```javascript
// features/community.js
class CommunityReflections {
  async verRespuestas(libroId, capituloId) {
    const response = await fetch(`/api/reflexions/${libroId}/${capituloId}`);
    const data = await response.json();

    return `
      <div class="community-responses">
        <h4>👥 ${data.count} personas respondieron</h4>

        <div class="respuestas-muestra">
          ${data.ejemplos.map(r => `
            <blockquote>
              <p>"${r.contenido.substring(0, 150)}..."</p>
            </blockquote>
          `).join('')}
        </div>

        ${data.sintesis ? `
          <details>
            <summary>Ver síntesis de la comunidad</summary>
            <p>${data.sintesis}</p>
          </details>
        ` : ''}

        <p><small>Respuestas anónimas - sin ranking ni votación</small></p>
      </div>
    `;
  }
}
```

---

## 🚀 PRÓXIMOS PASOS

1. **Iniciar Fase 1**: Implementar Logros + Reflexiones + Resumen
2. **Testing**: QA exhaustivo en web y Android
3. **Deployment**: Push a producción
4. **Métricas**: Monitorear impacto
5. **Iteración**: Recibir feedback y mejorar

---

**Documentación técnica completa: 1 de Diciembre 2025**
**Stack actual mantener: Vanilla JS + Tailwind + LocalStorage**
**Nuevas librerías: vis.js (mapas) + Claude API (IA)**
