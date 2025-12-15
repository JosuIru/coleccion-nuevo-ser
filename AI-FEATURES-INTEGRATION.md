# GUÍA DE INTEGRACIÓN - Sistema IA Premium

## 📋 Tabla de Contenidos

1. [Cargar Módulos](#cargar-módulos)
2. [Integración en Libros](#integración-en-libros)
3. [Integración en Frankenstein Lab](#integración-frankenstein-lab)
4. [Ejemplos de Código](#ejemplos-de-código)
5. [Testing](#testing)

---

## Cargar Módulos

### Opción A: Carga Automática (Recomendado)

Los módulos de IA se cargan automáticamente cuando se necesitan. Simplemente incluye en tu HTML:

```html
<!-- Premium System (Auth + Payments) -->
<script>
  // Cargar cuando usuario accede a premium features
  window.lazyLoader.load('premium-system');
</script>

<!-- AI Features (cuando el usuario abre Frankenstein Lab) -->
<script>
  // Cargar junto con frankenstein-lab
  window.lazyLoader.load(['frankenstein-lab', 'ai-features']);
</script>
```

### Opción B: Carga Manual en HTML

Si prefieres cargar todo directo:

```html
<!-- CSS -->
<link rel="stylesheet" href="/css/auth-premium.css">
<link rel="stylesheet" href="/css/ai-features.css">

<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Premium System -->
<script src="/js/core/supabase-config.js"></script>
<script src="/js/core/auth-helper.js"></script>
<script src="/js/features/auth-modal.js"></script>
<script src="/js/features/pricing-modal.js"></script>

<!-- AI Features -->
<script src="/js/features/ai-premium.js"></script>
<script src="/js/features/ai-book-features.js"></script>
<script src="/js/features/ai-game-master.js"></script>
```

---

## Integración en Libros

### 1. Agregar Botones de IA al Lector

En el componente de lectura de libros, agrega botones para las features de IA:

```html
<!-- En la barra de herramientas del lector de libros -->
<div class="book-reader-toolbar">
  <!-- Botones existentes... -->

  <!-- IA Features (solo si usuario tiene créditos) -->
  <button
    class="ai-feature-btn"
    onclick="window.aiBookFeatures?.chatAboutBook()"
    title="Charla IA sobre el capítulo"
  >
    💬 Preguntar a IA
  </button>

  <button
    class="ai-feature-btn"
    onclick="window.aiBookFeatures?.generatePersonalizedQuiz()"
    title="Quiz personalizado"
  >
    📝 Generar Quiz
  </button>

  <button
    class="ai-feature-btn"
    onclick="window.aiBookFeatures?.generateChapterSummary()"
    title="Resumen del capítulo"
  >
    📖 Resumen
  </button>
</div>
```

### 2. Implementar Chat Contextual

```javascript
// En el componente de lectura
async function initializeBookAI() {
  // Verificar si el usuario tiene acceso
  if (!window.aiBookFeatures) {
    console.log('IA Features no cargadas');
    return;
  }

  // Cargar capítulo actual
  const currentChapter = window.bookEngine?.getCurrentChapter();

  if (!currentChapter) return;

  // Inicializar chat con contexto del capítulo
  window.aiBookFeatures.currentChapter = currentChapter;

  console.log('✅ IA Book Features inicializado');
}

// Llamar cuando se carga un capítulo
if (window.bookEngine) {
  window.bookEngine.onChapterLoad(() => {
    initializeBookAI();
  });
}
```

### 3. Mostrar Widget de Créditos

```javascript
// Agregar widget de créditos en la UI
function addCreditsWidget() {
  if (!window.aiPremium) {
    console.log('AI Premium no inicializado');
    return;
  }

  // Crear widget
  const widget = window.aiPremium.createCreditsWidget();

  // Insertar en la UI (ej: header, sidebar, etc)
  const header = document.querySelector('.book-reader-header');
  if (header) {
    header.appendChild(widget);
  }
}

// Inicializar cuando el usuario autentifica
if (window.authHelper) {
  window.authHelper.onAuthStateChange((event, user) => {
    if (event === 'signed_in') {
      addCreditsWidget();
    }
  });
}
```

### 4. Manejo de Respuestas de IA

```javascript
// Cuando el usuario solicita una feature de IA
async function handleAIFeatureRequest(featureName, featureFunction) {
  try {
    // Mostrar loading
    const loadingEl = document.createElement('div');
    loadingEl.className = 'ai-loading';
    loadingEl.innerHTML = `
      <div class="ai-loading-spinner"></div>
      <span>Generando ${featureName}...</span>
    `;

    // Ejecutar feature
    const result = await featureFunction();

    if (!result.success) {
      // Mostrar error (probablemente upgrade necesario)
      if (result.error.includes('plan')) {
        window.pricingModal?.showPricingModal();
      } else {
        showErrorMessage(result.error);
      }
      return;
    }

    // Mostrar respuesta en tarjeta
    showAIResponse(featureName, result);

  } catch (error) {
    console.error(`Error en ${featureName}:`, error);
    showErrorMessage(error.message);
  }
}

function showAIResponse(title, result) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="ai-response-icon">✨</span>
      <span class="ai-response-title">${title}</span>
    </div>
    <div class="ai-response-content">
      ${result.response || result.analysis || JSON.stringify(result)}
    </div>
  `;

  // Insertar después del contenido
  document.querySelector('.book-content')?.appendChild(card);
}
```

---

## Integración en Frankenstein Lab

### 1. Agregar Game Master IA

En la interfaz de Frankenstein Lab:

```html
<!-- En el menu principal de Frankenstein Lab -->
<div class="frankenstein-menu">
  <!-- Items existentes... -->

  <!-- Game Master IA (solo Pro) -->
  <div class="menu-item" onclick="launchGameMasterModal()">
    <div class="menu-icon">🎮</div>
    <div class="menu-label">Game Master IA</div>
    <span class="pro-badge">PRO</span>
  </div>
</div>
```

### 2. Modal de Game Master

```javascript
function launchGameMasterModal() {
  // Verificar acceso
  if (!window.aiGameMaster?.canUseGameMaster()) {
    window.aiGameMaster?.showUpgradeIfNeeded('ai_game_master');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'upgrade-prompt-modal';
  modal.innerHTML = `
    <div class="upgrade-overlay" onclick="this.parentElement.remove()"></div>
    <div class="upgrade-content" style="max-width: 600px;">
      <div style="text-align: left;">
        <h2 style="color: #8b5cf6; margin-bottom: 1rem;">🎮 Game Master IA</h2>

        <!-- Tabs -->
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 1rem;">
          <button class="tab-btn active" onclick="switchTab('npcs')">NPCs</button>
          <button class="tab-btn" onclick="switchTab('missions')">Misiones</button>
          <button class="tab-btn" onclick="switchTab('narrative')">Narrativa</button>
        </div>

        <!-- NPCs Tab -->
        <div id="npcs-tab" class="tab-content active">
          <h3>Conversa con NPCs</h3>
          <p>Personajes con personalidad única y memoria de conversación.</p>
          <button class="ai-feature-btn" onclick="launchNPCChat()">
            💬 Iniciar Conversación
          </button>
        </div>

        <!-- Missions Tab -->
        <div id="missions-tab" class="tab-content">
          <h3>Misiones Dinámicas</h3>
          <p>Misiones generadas para tu ser actual.</p>
          <button class="ai-feature-btn" onclick="generateNewMission()">
            🗺️ Generar Misión
          </button>
        </div>

        <!-- Narrative Tab -->
        <div id="narrative-tab" class="tab-content">
          <h3>Narrativa Adaptativa</h3>
          <p>La historia evoluciona según tus decisiones.</p>
          <button class="ai-feature-btn" onclick="continueNarrative()">
            📖 Continuar Historia
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function switchTab(tabName) {
  // Ocultar todos
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  // Mostrar seleccionado
  const tab = document.getElementById(`${tabName}-tab`);
  if (tab) {
    tab.classList.add('active');
    tab.style.display = 'block';
  }

  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target?.classList.add('active');
}
```

### 3. Chat con NPCs

```javascript
async function launchNPCChat() {
  const npcId = 'mysterious-sage';
  const npc = {
    name: 'El Sabio Misterioso',
    role: 'Guía espiritual del Lab',
    traits: [
      'Habla con metáforas y paradojas',
      'Cuestiona las suposiciones',
      'Utiliza analogías de la naturaleza',
      'Es paciente pero directo'
    ],
    knowledge: 'Experto en filosofía, consciencia y transformación personal',
    speechStyle: 'Poético, contemplativo, a veces irónico'
  };

  const chatContainer = document.createElement('div');
  chatContainer.className = 'npc-chat-container';
  chatContainer.innerHTML = `
    <div class="npc-header">
      <div class="npc-avatar">🧙</div>
      <div class="npc-info">
        <div class="npc-name">${npc.name}</div>
        <div class="npc-role">${npc.role}</div>
      </div>
      <button onclick="this.closest('.npc-chat-container').remove()"
              style="border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 1.5rem;">×</button>
    </div>
    <div class="npc-messages" id="npc-messages"></div>
    <div class="npc-input-group">
      <input
        type="text"
        class="npc-input"
        id="npc-input"
        placeholder="¿Qué quieres preguntar?"
        onkeypress="if(event.key === 'Enter') sendNPCMessage('${npcId}', '${npc.name}')"
      >
      <button
        class="npc-send-btn"
        onclick="sendNPCMessage('${npcId}', '${npc.name}')"
      >
        📤
      </button>
    </div>
  `;

  // Insertar en modal
  const modal = document.querySelector('.upgrade-prompt-modal .upgrade-content');
  if (modal) {
    modal.innerHTML = '';
    modal.appendChild(chatContainer);
  }

  // Mensaje inicial del NPC
  addNPCMessage(npc.name, '¿Hola? ¿Qué te trae por aquí?', false);
}

async function sendNPCMessage(npcId, npcName) {
  const input = document.getElementById('npc-input');
  const userMessage = input.value.trim();

  if (!userMessage) return;

  input.value = '';
  input.disabled = true;

  // Mostrar mensaje del usuario
  addNPCMessage('Tú', userMessage, true);

  try {
    // Obtener historial
    const history = window.aiGameMaster?.getNPCConversationHistory(npcId) || [];

    // Llamar IA
    const response = await window.aiGameMaster.chatWithNPC(
      npcId,
      {
        name: npcName,
        role: 'Personaje del Lab',
        traits: ['Personaje de juego'],
        knowledge: 'Está en el Frankenstein Lab',
        speechStyle: 'Natural y conversacional'
      },
      userMessage,
      history
    );

    if (response.success) {
      addNPCMessage(npcName, response.response, false);
    } else {
      addNPCMessage('Sistema', `Error: ${response.error}`, false);
    }
  } catch (error) {
    console.error('Error en chat NPC:', error);
    addNPCMessage('Sistema', 'Hubo un error. Intenta de nuevo.', false);
  } finally {
    input.disabled = false;
    input.focus();
  }
}

function addNPCMessage(sender, text, isPlayer) {
  const messagesContainer = document.getElementById('npc-messages');
  const messageEl = document.createElement('div');
  messageEl.className = `npc-message ${isPlayer ? 'player' : 'npc'}`;
  messageEl.innerHTML = `<div class="npc-bubble">${text}</div>`;

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
```

### 4. Generación de Misiones

```javascript
async function generateNewMission() {
  // Obtener ser actual del game
  const currentBeing = window.frankenstein?.getCurrentBeing();

  if (!currentBeing) {
    alert('Necesitas crear un ser primero');
    return;
  }

  // Mostrar loading
  showProcessing('Generando misión...');

  try {
    const result = await window.aiGameMaster.generateDynamicMission(
      currentBeing,
      'intermedio',  // difficulty
      'exploración'  // theme
    );

    if (result.success) {
      showMissionCard(result.mission);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Error generando misión:', error);
    showError('No se pudo generar la misión');
  }
}

function showMissionCard(mission) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="ai-response-icon">${mission.icon || '🗺️'}</span>
      <span class="ai-response-title">${mission.name}</span>
      <span style="color: #9ca3af; margin-left: auto;">
        ${mission.difficulty}
      </span>
    </div>
    <div class="ai-response-content">
      <p><strong>Descripción:</strong></p>
      <p>${mission.description}</p>

      <p style="margin-top: 1rem;"><strong>Narrativa:</strong></p>
      <p>${mission.narrative}</p>

      <p style="margin-top: 1rem;"><strong>Requisitos:</strong></p>
      <ul style="margin-left: 1.5rem; color: #9ca3af;">
        ${mission.requirements.map(req =>
          `<li>${req.type === 'attribute' ? `${req.attribute} (mín: ${req.minValue})` : `${req.category} x${req.minCount}`}</li>`
        ).join('')}
      </ul>

      <p style="margin-top: 1rem;"><strong>Recompensas:</strong></p>
      <p>• ${mission.rewards.experience} XP</p>
      <p>• ${mission.rewards.specialReward}</p>
    </div>
    <div class="ai-response-actions">
      <button class="ai-response-action" onclick="acceptMission('${mission.id}')">
        ✓ Aceptar Misión
      </button>
      <button class="ai-response-action" onclick="generateNewMission()">
        🔄 Otra Misión
      </button>
    </div>
  `;

  const container = document.querySelector('.npc-chat-container') ||
                    document.querySelector('.upgrade-content');

  if (container) {
    const oldCard = container.querySelector('.ai-response-card');
    if (oldCard) oldCard.remove();
    container.appendChild(card);
  }
}
```

---

## Ejemplos de Código

### Ejemplo 1: Inicializar Sistema Completo

```javascript
// En tu main.js o initialization script
async function initializePremiumSystem() {
  // 1. Esperar a que Supabase esté listo
  if (!window.supabase) {
    console.error('Supabase no inicializado');
    return;
  }

  // 2. Cargar módulo premium
  await window.lazyLoader.load('premium-system');

  // 3. Escuchar cambios de autenticación
  window.authHelper.onAuthStateChange((event, user) => {
    if (event === 'signed_in') {
      console.log('✅ Usuario autenticado:', user.email);

      // 4. Cargar AI features si es premium
      if (window.authHelper.hasFeature('ai_chat')) {
        window.lazyLoader.load('ai-features');
      }
    }
  });

  // 5. Mostrar botón de login
  const loginBtn = document.createElement('button');
  loginBtn.className = 'btn-login';
  loginBtn.textContent = '🔐 Iniciar Sesión';
  loginBtn.onclick = () => window.authModal.showLoginModal();

  document.querySelector('.header-buttons')?.appendChild(loginBtn);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializePremiumSystem);
```

### Ejemplo 2: Chat Sobre un Libro

```javascript
async function initializeBookChat() {
  const chatBtn = document.querySelector('.book-chat-btn');

  chatBtn?.addEventListener('click', async () => {
    // Obtener contenido del capítulo actual
    const chapter = window.bookEngine.getCurrentChapter();

    // Mostrar modal de chat
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="upgrade-prompt-modal">
        <div class="upgrade-overlay"></div>
        <div class="upgrade-content" style="max-width: 600px;">
          <div class="ai-processing">
            <div class="ai-loading-spinner"></div>
            <p>Inicializando chat sobre "${chapter.title}"...</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    try {
      // Llamar feature
      const result = await window.aiBookFeatures.chatAboutBook(
        chapter.content,
        chapter.title,
        'Un análisis profundo del capítulo'
      );

      if (result.success) {
        modal.querySelector('.upgrade-content').innerHTML = `
          <div class="ai-response-card">
            <div class="ai-response-content">
              ${result.response}
            </div>
            <div class="ai-response-actions">
              <button class="ai-response-action" onclick="this.closest('.upgrade-prompt-modal').remove()">
                Cerrar
              </button>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error en chat:', error);
      modal.remove();
    }
  });
}
```

### Ejemplo 3: Mostrar Upgrade Modal

```javascript
function requirePremium(featureName, displayName) {
  const hasFeature = window.aiPremium?.hasFeature(featureName);

  if (!hasFeature) {
    const modal = document.createElement('div');
    modal.className = 'upgrade-prompt-modal fade-in';
    modal.innerHTML = `
      <div class="upgrade-overlay" onclick="this.parentElement.remove()"></div>
      <div class="upgrade-content scale-in">
        <div class="upgrade-icon">✨</div>
        <h3>${displayName} es una función Premium</h3>
        <p>Acceso exclusivo para miembros Premium y Pro.</p>

        <ul class="upgrade-features">
          <li>Chat ilimitado con IA</li>
          <li>Generación de quizzes</li>
          <li>Análisis de comprensión</li>
          <li>Prioridad en respuestas</li>
        </ul>

        <button class="btn-upgrade" onclick="
          window.pricingModal.showPricingModal();
          this.closest('.upgrade-prompt-modal').remove();
        ">
          Ver Planes Premium
        </button>
        <button class="btn-cancel" onclick="this.closest('.upgrade-prompt-modal').remove()">
          Ahora no
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    return false;
  }

  return true;
}
```

---

## Testing

### Test 1: Inicialización

```javascript
// En consola
console.log('aiPremium:', window.aiPremium);
console.log('aiBookFeatures:', window.aiBookFeatures);
console.log('aiGameMaster:', window.aiGameMaster);
console.log('authHelper:', window.authHelper);

// Debería mostrar todas las instancias inicializadas
```

### Test 2: Chat de Libro

```javascript
// Obtener capítulo actual
const chapter = {
  title: 'Capítulo 1: Fundamentos',
  content: 'Lorem ipsum dolor sit amet...'
};

// Llamar feature
const result = await window.aiBookFeatures.chatAboutBook(
  chapter.content,
  chapter.title,
  '¿Cuál es el tema principal?'
);

console.log('Resultado:', result);
// Debería mostrar: { success: true, response: "...", analysis: "..." }
```

### Test 3: Generación de Quiz

```javascript
const result = await window.aiBookFeatures.generatePersonalizedQuiz(
  {
    title: 'Capítulo 1',
    content: 'Contenido del capítulo...',
    difficulty: 'intermedio'
  },
  ['respuesta1']  // Respuestas previas (si existen)
);

console.log('Quiz generado:', result);
// Esperado: { success: true, quiz: { title, difficulty, questions: [...] } }
```

### Test 4: Créditos

```javascript
// Obtener créditos
console.log('Créditos restantes:', window.aiPremium.getCreditsRemaining());
console.log('Total mensual:', window.aiPremium.getCreditsTotal());
console.log('Porcentaje:', window.aiPremium.getCreditsPercentage());
console.log('Días hasta reset:', window.aiPremium.getDaysUntilReset());
```

### Test 5: Game Master

```javascript
// Obtener ser actual
const being = {
  name: 'Mi Ser',
  attributes: {
    strength: 50,
    wisdom: 70,
    creativity: 60
  },
  pieces: ['libro_1', 'meditacion_1']
};

// Generar misión
const mission = await window.aiGameMaster.generateDynamicMission(
  being,
  'intermedio',
  'exploración'
);

console.log('Misión:', mission);
// Esperado: { success: true, mission: { name, description, requirements, ... } }
```

---

## Checklist de Integración

- [ ] Módulos cargados en lazy-loader.js
- [ ] CSS ai-features.css creado
- [ ] Botones de IA agregados al lector de libros
- [ ] Widget de créditos visible
- [ ] Game Master IA integrado en Frankenstein Lab
- [ ] Chat con NPCs funcionando
- [ ] Generación de misiones activa
- [ ] Manejo de errores y upgrades modal
- [ ] Tests pasados en consola
- [ ] UX consistente con tema del proyecto

---

**¡Integración lista! Los usuarios ahora pueden acceder a todas las features de IA.** 🚀
