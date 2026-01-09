// ============================================================================
// HELP CENTER MODAL - Centro de Ayuda Interactivo
// ============================================================================
// Sistema completo de ayuda con búsqueda, categorías y atajos de teclado

class HelpCenterModal {
  constructor() {
    this.isOpen = false;
    this.currentTab = 'basics';
    this.searchQuery = '';
    this.i18n = window.i18n || { t: (key) => key };

    // 🔧 FIX: EventManager para gestión automática de listeners
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('HelpCenterModal');
    this._eventListenersAttached = false;

    // Base de conocimiento organizada por categorías
    this.helpContent = {
      basics: {
        title: '📖 Lectura Básica',
        icon: '📖',
        items: [
          {
            id: 'navigation',
            title: 'Navegación entre capítulos',
            description: 'Cómo moverte por el libro',
            content: `
              <p><strong>Formas de navegar:</strong></p>
              <ul>
                <li>📱 <strong>Menú lateral:</strong> Click en "☰" para ver todos los capítulos</li>
                <li>⬅️ <strong>Botones anterior/siguiente:</strong> En la parte superior</li>
                <li>⌨️ <strong>Teclado:</strong> Flechas izquierda/derecha para cambiar de capítulo</li>
              </ul>
              <p class="mt-3 text-cyan-400">💡 Tip: Tu progreso se guarda automáticamente</p>
            `,
            tags: ['navegación', 'capítulos', 'menú']
          },
          {
            id: 'bookmarks',
            title: 'Marcadores',
            description: 'Guarda tus capítulos favoritos',
            content: `
              <p><strong>¿Qué son los marcadores?</strong></p>
              <p>Marca capítulos importantes para volver fácilmente a ellos.</p>

              <p class="mt-3"><strong>Cómo usar:</strong></p>
              <ul>
                <li>🔖 Click en el icono de marcador en la parte superior</li>
                <li>📚 Ver todos tus marcadores en el menú lateral</li>
                <li>⌨️ Atajo rápido: <kbd>B</kbd></li>
              </ul>

              <p class="mt-3 text-purple-400">✨ Los marcadores se sincronizan en la nube si estás autenticado</p>
            `,
            tags: ['marcadores', 'favoritos', 'bookmark']
          },
          {
            id: 'share',
            title: 'Compartir contenido',
            description: 'Comparte capítulos o fragmentos',
            content: `
              <p><strong>Formas de compartir:</strong></p>
              <ul>
                <li>📤 <strong>Capítulo completo:</strong> Botón de compartir en el menú</li>
                <li>📋 <strong>Fragmento de texto:</strong> Selecciona texto → Copiar</li>
                <li>🔗 <strong>URL directa:</strong> Cada capítulo tiene su propia URL</li>
              </ul>

              <p class="mt-3"><strong>Opciones al compartir:</strong></p>
              <ul>
                <li>WhatsApp, Telegram, Email</li>
                <li>Copiar enlace directo</li>
                <li>Redes sociales</li>
              </ul>
            `,
            tags: ['compartir', 'share', 'url', 'link']
          },
          {
            id: 'progress',
            title: 'Progreso de lectura',
            description: 'Rastrea tu avance en el libro',
            content: `
              <p><strong>El sistema rastrea automáticamente:</strong></p>
              <ul>
                <li>✅ Capítulos leídos (marca verde)</li>
                <li>📊 Porcentaje de avance por libro</li>
                <li>⏱️ Tiempo de lectura estimado</li>
                <li>🔥 Racha de días leyendo</li>
              </ul>

              <p class="mt-3"><strong>Ver tu progreso:</strong></p>
              <ul>
                <li>Menú lateral: muestra capítulos completados</li>
                <li>Dashboard de progreso: estadísticas detalladas</li>
              </ul>

              <p class="mt-3 text-green-400">💚 Tu progreso se sincroniza automáticamente</p>
            `,
            tags: ['progreso', 'avance', 'estadísticas', 'progress']
          }
        ]
      },

      ai: {
        title: '🤖 Inteligencia Artificial',
        icon: '🤖',
        items: [
          {
            id: 'ai-setup',
            title: 'Configurar IA',
            description: 'Conecta tu proveedor de IA favorito',
            content: `
              <p><strong>Pasos para configurar:</strong></p>
              <ol>
                <li>Abre <strong>Configuración</strong> (⚙️ en el menú)</li>
                <li>Ve a la pestaña <strong>"IA"</strong></li>
                <li>Selecciona un proveedor:
                  <ul>
                    <li>✨ <strong>Gemini</strong> (Google) - Gratis</li>
                    <li>🚀 <strong>Claude</strong> (Anthropic) - De pago</li>
                    <li>💬 <strong>ChatGPT</strong> (OpenAI) - De pago</li>
                    <li>🌐 <strong>Qwen</strong> (Alibaba) - 1M tokens gratis/mes</li>
                  </ul>
                </li>
                <li>Ingresa tu API key</li>
                <li>Guarda y ¡listo!</li>
              </ol>

              <p class="mt-3 text-cyan-400">💡 Recomendado: Gemini para empezar (gratis y buena calidad)</p>
            `,
            tags: ['configurar', 'ia', 'api', 'gemini', 'claude', 'chatgpt']
          },
          {
            id: 'ai-chat',
            title: 'Chat con IA',
            description: 'Conversa sobre el contenido del libro',
            content: `
              <p><strong>Cómo usar el chat:</strong></p>
              <ul>
                <li>💬 Click en el botón de chat (💭) en el menú superior</li>
                <li>Haz preguntas sobre el libro actual</li>
                <li>La IA conoce todo el contexto del capítulo</li>
              </ul>

              <p class="mt-3"><strong>Modos de conversación:</strong></p>
              <ul>
                <li>📖 <strong>Explorador:</strong> Profundizar en conceptos</li>
                <li>🎯 <strong>Práctico:</strong> Aplicaciones en la vida real</li>
                <li>🧘 <strong>Reflexivo:</strong> Meditaciones guiadas</li>
              </ul>

              <p class="mt-3"><strong>Ejemplos de preguntas:</strong></p>
              <ul>
                <li>"¿Qué es la conciencia según este capítulo?"</li>
                <li>"Dame ejemplos prácticos de esto"</li>
                <li>"Resume los puntos clave"</li>
              </ul>
            `,
            tags: ['chat', 'conversación', 'preguntas', 'ia']
          },
          {
            id: 'text-selection',
            title: 'Preguntar sobre texto seleccionado',
            description: 'Selecciona y pregunta directamente',
            content: `
              <p><strong>Función de selección de texto:</strong></p>
              <p>Selecciona cualquier palabra o párrafo del libro y aparecerá un menú contextual.</p>

              <p class="mt-3"><strong>Opciones disponibles:</strong></p>
              <ul>
                <li>💡 <strong>Explicar:</strong> Explicación clara del concepto</li>
                <li>📖 <strong>Definir:</strong> Definición precisa</li>
                <li>🔍 <strong>Profundizar:</strong> Análisis detallado con ejemplos</li>
                <li>📝 <strong>Resumir:</strong> Puntos clave del texto</li>
                <li>❓ <strong>Preguntar:</strong> Pregunta personalizada</li>
                <li>📋 <strong>Copiar:</strong> Copiar al portapapeles</li>
              </ul>

              <p class="mt-3"><strong>Cómo usar:</strong></p>
              <ol>
                <li>Selecciona texto (mínimo 3 caracteres)</li>
                <li>Aparece el menú flotante</li>
                <li>Click en la acción deseada</li>
                <li>La IA responde automáticamente</li>
              </ol>

              <p class="mt-3 text-purple-400">✨ Requiere tener la IA configurada</p>
            `,
            tags: ['selección', 'texto', 'explicar', 'definir', 'contextual']
          },
          {
            id: 'ai-suggestions',
            title: 'Sugerencias de IA',
            description: 'Preguntas automáticas sugeridas',
            content: `
              <p><strong>¿Qué son las sugerencias?</strong></p>
              <p>Al abrir un capítulo, la IA genera automáticamente preguntas relevantes sobre el contenido.</p>

              <p class="mt-3"><strong>Dónde verlas:</strong></p>
              <ul>
                <li>🎯 Botón de sugerencias en el menú superior</li>
                <li>💭 Al abrir el chat (si no hay conversación activa)</li>
              </ul>

              <p class="mt-3"><strong>Tipos de sugerencias:</strong></p>
              <ul>
                <li>Preguntas de comprensión</li>
                <li>Aplicaciones prácticas</li>
                <li>Conexiones con otros conceptos</li>
                <li>Ejercicios de reflexión</li>
              </ul>
            `,
            tags: ['sugerencias', 'preguntas', 'automático']
          }
        ]
      },

      audio: {
        title: '🎧 Audio y Lectura',
        icon: '🎧',
        items: [
          {
            id: 'audioreader',
            title: 'AudioReader',
            description: 'Escucha el libro con voz sintética',
            content: `
              <p><strong>Características del AudioReader:</strong></p>
              <ul>
                <li>🔊 Text-to-Speech en español</li>
                <li>⏯️ Controles play/pause</li>
                <li>⚡ Velocidad ajustable (0.5x a 2x)</li>
                <li>📍 Resaltado de párrafo activo</li>
                <li>⏭️ Auto-avance al siguiente capítulo</li>
                <li>💤 Sleep timer</li>
                <li>🔖 Marcadores de audio</li>
              </ul>

              <p class="mt-3"><strong>Cómo activar:</strong></p>
              <ul>
                <li>Click en el botón 🎧 en el menú superior</li>
                <li>Atajo rápido: <kbd>A</kbd></li>
              </ul>

              <p class="mt-3 text-green-400">🌟 Tu posición se guarda automáticamente</p>
            `,
            tags: ['audio', 'audioreader', 'tts', 'lectura', 'voz']
          },
          {
            id: 'audio-shortcuts',
            title: 'Atajos de AudioReader',
            description: 'Controles de teclado para audio',
            content: `
              <p><strong>Atajos disponibles:</strong></p>
              <div class="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <kbd>Space</kbd> Play/Pause
                </div>
                <div>
                  <kbd>ESC</kbd> Cerrar AudioReader
                </div>
                <div>
                  <kbd>→</kbd> Siguiente párrafo
                </div>
                <div>
                  <kbd>←</kbd> Párrafo anterior
                </div>
                <div>
                  <kbd>+</kbd> Aumentar velocidad
                </div>
                <div>
                  <kbd>-</kbd> Reducir velocidad
                </div>
                <div>
                  <kbd>B</kbd> Crear marcador
                </div>
                <div>
                  <kbd>M</kbd> Ver marcadores
                </div>
                <div>
                  <kbd>T</kbd> Sleep timer
                </div>
                <div>
                  <kbd>N</kbd> Auto-avance On/Off
                </div>
              </div>

              <p class="mt-3 text-cyan-400">💡 Los atajos funcionan cuando el panel está abierto</p>
            `,
            tags: ['atajos', 'keyboard', 'audio', 'shortcuts']
          },
          {
            id: 'sleep-timer',
            title: 'Sleep Timer',
            description: 'Programa el apagado automático',
            content: `
              <p><strong>¿Para qué sirve?</strong></p>
              <p>Detiene la reproducción automáticamente después de un tiempo determinado. Ideal para escuchar antes de dormir.</p>

              <p class="mt-3"><strong>Cómo usar:</strong></p>
              <ol>
                <li>Abre el AudioReader</li>
                <li>Click en el icono ⏱️ Sleep Timer</li>
                <li>Selecciona tiempo: 15, 30, 45 o 60 minutos</li>
                <li>El timer empieza a contar</li>
              </ol>

              <p class="mt-3"><strong>Características:</strong></p>
              <ul>
                <li>⏸️ Pausa automática al terminar</li>
                <li>🔔 Notificación al apagarse</li>
                <li>❌ Cancelable en cualquier momento</li>
                <li>⌨️ Atajo: <kbd>T</kbd></li>
              </ul>
            `,
            tags: ['sleep', 'timer', 'dormir', 'temporizador']
          },
          {
            id: 'binaural',
            title: 'Audio Binaural',
            description: 'Sonidos ambientales para concentración',
            content: `
              <p><strong>¿Qué es el audio binaural?</strong></p>
              <p>Sonidos diseñados para mejorar concentración, relajación o meditación mientras lees.</p>

              <p class="mt-3"><strong>Categorías disponibles:</strong></p>
              <ul>
                <li>🧘 <strong>Meditación:</strong> Ondas theta para relajación profunda</li>
                <li>🎯 <strong>Concentración:</strong> Ondas beta para enfoque</li>
                <li>🌊 <strong>Ambiente:</strong> Lluvia, bosque, océano</li>
              </ul>

              <p class="mt-3"><strong>Cómo usar:</strong></p>
              <ol>
                <li>Click en el botón de audio binaural 🎵</li>
                <li>Selecciona categoría y sonido</li>
                <li>Ajusta volumen</li>
                <li>Continúa leyendo con el audio de fondo</li>
              </ol>

              <p class="mt-3 text-purple-400">🎧 Usa audífonos para mejor efecto</p>
            `,
            tags: ['binaural', 'audio', 'meditación', 'concentración', 'ambiente']
          }
        ]
      },

      practices: {
        title: '🧘 Prácticas y Ejercicios',
        icon: '🧘',
        items: [
          {
            id: 'practice-library',
            title: 'Biblioteca de Prácticas',
            description: 'Acceso rápido a todos los ejercicios',
            content: `
              <p><strong>¿Qué es la Biblioteca de Prácticas?</strong></p>
              <p>Un sistema centralizado para explorar y acceder a las 100+ prácticas, ejercicios y meditaciones de toda la colección.</p>

              <p class="mt-3"><strong>Cómo acceder:</strong></p>
              <ul>
                <li>🧘 Click en el botón "Prácticas" en la pantalla principal</li>
                <li>Desde cualquier libro → botón "Ver todas las prácticas"</li>
              </ul>

              <p class="mt-3"><strong>Filtros disponibles:</strong></p>
              <ul>
                <li>🧘 <strong>Por tipo:</strong> Meditaciones, Reflexiones, Acciones, Ejercicios Físicos</li>
                <li>📊 <strong>Por dificultad:</strong> Básico, Intermedio, Avanzado</li>
                <li>⏱️ <strong>Por duración:</strong> <15min, 15-30min, 30-60min, >60min</li>
                <li>📚 <strong>Por libro:</strong> Filtra por cualquier libro de la colección</li>
                <li>🔍 <strong>Búsqueda:</strong> Busca por palabra clave</li>
              </ul>

              <p class="mt-3"><strong>Acciones:</strong></p>
              <ul>
                <li>▶️ <strong>Hacer ahora:</strong> Te lleva directamente al ejercicio</li>
                <li>➕ <strong>Añadir a Plan:</strong> Agrega a tu plan de acción</li>
              </ul>

              <p class="mt-3 text-cyan-400">💡 Tip: Usa los filtros combinados para encontrar la práctica perfecta para tu momento actual</p>
            `,
            tags: ['prácticas', 'ejercicios', 'meditación', 'biblioteca', 'practice library']
          },
          {
            id: 'practice-of-day',
            title: 'Práctica del Día',
            description: 'Recomendación personalizada diaria',
            content: `
              <p><strong>¿Qué es la Práctica del Día?</strong></p>
              <p>Un widget en la pantalla principal que te sugiere una práctica personalizada cada día, basada en tus intereses y progreso.</p>

              <p class="mt-3"><strong>Características:</strong></p>
              <ul>
                <li>🎯 <strong>Personalizada:</strong> Aprende de tus preferencias</li>
                <li>📅 <strong>Diaria:</strong> Cambia cada 24 horas</li>
                <li>🔥 <strong>Streak:</strong> Mantén racha de días practicando</li>
                <li>✅ <strong>Progreso:</strong> Ve tu total de prácticas completadas</li>
                <li>💡 <strong>3 Sugerencias:</strong> Además de la destacada, 3 alternativas</li>
              </ul>

              <p class="mt-3"><strong>Algoritmo de recomendación considera:</strong></p>
              <ul>
                <li>📖 Libros que estás leyendo actualmente</li>
                <li>❤️ Tipos de prácticas que más haces</li>
                <li>🎯 Tu nivel de dificultad preferido</li>
                <li>⏱️ Duración que sueles elegir</li>
                <li>📊 Prácticas que nunca has hecho (para variedad)</li>
                <li>⏳ Tiempo desde tu última práctica de cada tipo</li>
              </ul>

              <p class="mt-3"><strong>Acciones disponibles:</strong></p>
              <ul>
                <li>✅ <strong>Hacer ahora:</strong> Comienza la práctica y se registra como completada</li>
                <li>⏭️ <strong>Otro día:</strong> Marca como "omitida" para mejorar recomendaciones</li>
                <li>📚 <strong>Ver todas:</strong> Abre la Biblioteca completa</li>
              </ul>

              <p class="mt-3 text-purple-400">🔥 Mantén tu streak practicando al menos 1 vez al día!</p>
            `,
            tags: ['práctica del día', 'recomendaciones', 'widget', 'personalización', 'streak']
          },
          {
            id: 'learning-paths',
            title: 'Learning Paths',
            description: 'Rutas de aprendizaje estructuradas',
            content: `
              <p><strong>¿Qué son los Learning Paths?</strong></p>
              <p>Caminos guiados paso a paso para alcanzar objetivos específicos de transformación personal y colectiva. Son como "cursos" estructurados dentro de cada libro.</p>

              <p class="mt-3"><strong>Acceso:</strong></p>
              <ul>
                <li>📚 Desde la ficha de cada libro → Botón "Learning Paths"</li>
                <li>🧘 Desde Biblioteca de Prácticas → Banner "¿Buscas un camino estructurado?"</li>
              </ul>

              <p class="mt-3"><strong>42 Paths disponibles en 10 libros:</strong></p>
              <ul>
                <li>🧠 <strong>Filosofía:</strong> Pensamiento filosófico, Ontología participativa, Ética relacional</li>
                <li>🤖 <strong>IA:</strong> Diálogo con IA, Filosofía de IA, Ética de IA</li>
                <li>🎓 <strong>Pedagogía:</strong> Educación transformadora, Aprender a aprender, Comunidades</li>
                <li>🌍 <strong>Ecología:</strong> Duelo ecológico, Recordar que somos Tierra, Activismo enraizado</li>
                <li>🌱 <strong>Transición:</strong> Iniciar comunidad, Cooperativa energética, Resiliencia local</li>
                <li>💪 <strong>Acciones:</strong> Primera acción transformadora, Activismo cotidiano</li>
                <li>🔧 <strong>Toolkit:</strong> Huerto comunitario, Repair Café</li>
                <li>📿 <strong>Prácticas:</strong> Rutina diaria, Dominar técnica central</li>
                <li>🍃 <strong>Simplicidad:</strong> Camino a simplicidad, Autosuficiencia</li>
                <li>🎨 <strong>Creatividad:</strong> Desbloqueo creativo, Arte como activismo, Imaginación radical</li>
                <li>❤️ <strong>Relaciones:</strong> Comunicación no violenta, Intimidad auténtica, Relaciones liberadoras</li>
                <li>📜 <strong>Manifiesto:</strong> Escribir tu manifiesto, Círculo de conciencia compartida</li>
              </ul>

              <p class="mt-3"><strong>Estructura de cada path:</strong></p>
              <ul>
                <li>🎯 <strong>Objetivo claro:</strong> Qué lograrás al completarlo</li>
                <li>⏱️ <strong>Duración estimada:</strong> 4-16 semanas según complejidad</li>
                <li>📊 <strong>Dificultad:</strong> Principiante, Intermedio o Avanzado</li>
                <li>🔢 <strong>4 pasos:</strong> Etapas secuenciales con criterios de completitud</li>
                <li>📚 <strong>Recursos:</strong> Lecturas, herramientas y referencias</li>
              </ul>

              <p class="mt-3"><strong>Ejemplos de paths:</strong></p>
              <ul>
                <li>🧘 "Profundizar en Meditación" - 8 semanas, Principiante</li>
                <li>🌍 "Procesar Duelo Ecológico" - 6-8 semanas, Intermedio</li>
                <li>⚡ "Crear Cooperativa Energética" - 12-16 semanas, Avanzado</li>
                <li>🎨 "Arte como Activismo" - 10 semanas, Intermedio</li>
                <li>🌈 "Imaginación Radical" - 8 semanas, Avanzado</li>
              </ul>

              <p class="mt-3 text-green-400">💚 Navega entre Learning Paths y Biblioteca de Prácticas según tu necesidad</p>
            `,
            tags: ['learning paths', 'rutas', 'aprendizaje', 'objetivos', 'paths', 'caminos']
          },
          {
            id: 'practice-tracking',
            title: 'Seguimiento de Prácticas',
            description: 'Sistema de registro y estadísticas',
            content: `
              <p><strong>¿Qué se rastrea automáticamente?</strong></p>
              <ul>
                <li>✅ <strong>Prácticas completadas:</strong> Registro con fecha y hora</li>
                <li>⏭️ <strong>Prácticas omitidas:</strong> Para mejorar recomendaciones</li>
                <li>⏸️ <strong>Prácticas iniciadas:</strong> Pero no terminadas</li>
                <li>⭐ <strong>Calificaciones:</strong> Opcional, cómo te sentiste (1-5 estrellas)</li>
              </ul>

              <p class="mt-3"><strong>Estadísticas disponibles:</strong></p>
              <ul>
                <li>📊 Total de prácticas completadas</li>
                <li>🔥 Racha de días consecutivos practicando</li>
                <li>❤️ Tu tipo de práctica favorito (más frecuente)</li>
                <li>📈 Historial completo de prácticas</li>
              </ul>

              <p class="mt-3"><strong>Cómo se usan estos datos:</strong></p>
              <ul>
                <li>🎯 <strong>Recomendaciones:</strong> Mejoran con el tiempo según tus patrones</li>
                <li>📉 <strong>Evita repetición:</strong> No sugiere lo que hiciste recientemente</li>
                <li>🌈 <strong>Diversidad:</strong> Te anima a probar nuevos tipos</li>
                <li>🎓 <strong>Nivel apropiado:</strong> Ajusta dificultad según tu experiencia</li>
              </ul>

              <p class="mt-3 text-cyan-400">💡 Cuanto más uses el sistema, mejores serán las recomendaciones</p>
            `,
            tags: ['tracking', 'seguimiento', 'estadísticas', 'progreso', 'registro']
          }
        ]
      },

      tools: {
        title: '🛠️ Herramientas',
        icon: '🛠️',
        items: [
          {
            id: 'notes',
            title: 'Sistema de Notas',
            description: 'Toma notas mientras lees',
            content: `
              <p><strong>Tipos de notas:</strong></p>
              <ul>
                <li>📝 <strong>Nota simple:</strong> Texto libre</li>
                <li>🎙️ <strong>Nota de voz:</strong> Graba tu reflexión</li>
                <li>🔖 <strong>Asociada a capítulo:</strong> Ligada al contexto</li>
              </ul>

              <p class="mt-3"><strong>Cómo crear:</strong></p>
              <ol>
                <li>Click en el botón 📝 Notas</li>
                <li>Escribe tu nota o graba voz</li>
                <li>Guarda (se sincroniza automáticamente)</li>
              </ol>

              <p class="mt-3"><strong>Gestión de notas:</strong></p>
              <ul>
                <li>Ver todas las notas en un capítulo</li>
                <li>Buscar por contenido</li>
                <li>Exportar como texto</li>
                <li>Editar o eliminar</li>
              </ul>
            `,
            tags: ['notas', 'notes', 'voz', 'grabación']
          },
          {
            id: 'concept-maps',
            title: 'Mapas Conceptuales',
            description: 'Visualiza conexiones entre ideas',
            content: `
              <p><strong>¿Qué son los mapas conceptuales?</strong></p>
              <p>Diagramas visuales que muestran relaciones entre conceptos del libro.</p>

              <p class="mt-3"><strong>Características:</strong></p>
              <ul>
                <li>🎨 Visualización interactiva</li>
                <li>🔗 Conexiones entre conceptos</li>
                <li>📊 Jerarquías de ideas</li>
                <li>💾 Exportable como imagen</li>
              </ul>

              <p class="mt-3"><strong>Cómo usar:</strong></p>
              <ol>
                <li>Algunos libros incluyen mapas predefinidos</li>
                <li>Puedes crear los tuyos propios</li>
                <li>Arrastra nodos para reorganizar</li>
                <li>Click en nodos para ver detalles</li>
              </ol>
            `,
            tags: ['mapas', 'conceptuales', 'visual', 'diagrama']
          },
          {
            id: 'action-plans',
            title: 'Planes de Acción',
            description: 'Convierte ideas en tareas concretas',
            content: `
              <p><strong>¿Qué son los planes de acción?</strong></p>
              <p>Herramienta para convertir las enseñanzas del libro en pasos concretos a seguir.</p>

              <p class="mt-3"><strong>Estructura:</strong></p>
              <ul>
                <li>🎯 <strong>Objetivo:</strong> Qué quieres lograr</li>
                <li>📋 <strong>Tareas:</strong> Pasos específicos</li>
                <li>📅 <strong>Plazo:</strong> Cuándo completar</li>
                <li>✅ <strong>Seguimiento:</strong> Marca tareas completadas</li>
              </ul>

              <p class="mt-3"><strong>Cómo crear:</strong></p>
              <ol>
                <li>Lee un capítulo inspirador</li>
                <li>Click en "Planes de Acción"</li>
                <li>Define tu objetivo</li>
                <li>Divide en tareas pequeñas</li>
                <li>¡Empieza a ejecutar!</li>
              </ol>
            `,
            tags: ['planes', 'acción', 'tareas', 'objetivos', 'action']
          },
          {
            id: 'achievements',
            title: 'Sistema de Logros',
            description: 'Desbloquea logros mientras lees',
            content: `
              <p><strong>¿Qué son los logros?</strong></p>
              <p>Recompensas por alcanzar hitos en tu viaje de lectura.</p>

              <p class="mt-3"><strong>Categorías de logros:</strong></p>
              <ul>
                <li>📚 <strong>Lectura:</strong> Capítulos leídos, libros completados</li>
                <li>🔥 <strong>Consistencia:</strong> Rachas de días leyendo</li>
                <li>🤖 <strong>IA:</strong> Conversaciones, preguntas respondidas</li>
                <li>🎧 <strong>Audio:</strong> Horas escuchadas</li>
                <li>📝 <strong>Notas:</strong> Notas creadas</li>
              </ul>

              <p class="mt-3"><strong>Ejemplos de logros:</strong></p>
              <ul>
                <li>🌟 "Primer capítulo" - Lee tu primer capítulo</li>
                <li>📖 "Lector dedicado" - 7 días seguidos leyendo</li>
                <li>💡 "Curioso" - Haz 50 preguntas a la IA</li>
                <li>🎓 "Maestro" - Completa todos los libros</li>
              </ul>
            `,
            tags: ['logros', 'achievements', 'gamificación', 'recompensas']
          },
          {
            id: 'koan',
            title: 'Generador de Koans',
            description: 'Reflexiones filosóficas diarias',
            content: `
              <p><strong>¿Qué es un Koan?</strong></p>
              <p>Una reflexión breve y profunda, diseñada para estimular la contemplación.</p>

              <p class="mt-3"><strong>Cómo funciona:</strong></p>
              <ul>
                <li>🎲 Genera koans aleatorios o del libro actual</li>
                <li>📱 Widget en Android con koan diario</li>
                <li>💾 Guarda tus favoritos</li>
                <li>📤 Comparte en redes sociales</li>
              </ul>

              <p class="mt-3"><strong>Uso recomendado:</strong></p>
              <ol>
                <li>Genera un koan al comenzar el día</li>
                <li>Medita sobre él durante unos minutos</li>
                <li>Observa cómo resuena a lo largo del día</li>
                <li>Reflexiona antes de dormir</li>
              </ol>
            `,
            tags: ['koan', 'meditación', 'reflexión', 'filosofía']
          }
        ]
      },

      shortcuts: {
        title: '⌨️ Atajos de Teclado',
        icon: '⌨️',
        items: [
          {
            id: 'global-shortcuts',
            title: 'Atajos Globales',
            description: 'Funcionan en toda la aplicación',
            content: `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Menú principal</span>
                  <kbd>M</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Búsqueda</span>
                  <kbd>Ctrl+F</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Ayuda</span>
                  <kbd>?</kbd> o <kbd>H</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Configuración</span>
                  <kbd>Ctrl+,</kbd>
                </div>
              </div>
            `,
            tags: ['atajos', 'globales', 'shortcuts', 'keyboard']
          },
          {
            id: 'reading-shortcuts',
            title: 'Atajos de Lectura',
            description: 'Navegación y lectura',
            content: `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Capítulo anterior</span>
                  <kbd>←</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Capítulo siguiente</span>
                  <kbd>→</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Crear marcador</span>
                  <kbd>B</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Notas</span>
                  <kbd>N</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Chat IA</span>
                  <kbd>C</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>AudioReader</span>
                  <kbd>A</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Compartir</span>
                  <kbd>S</kbd>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span>Volver a biblioteca</span>
                  <kbd>ESC</kbd>
                </div>
              </div>
            `,
            tags: ['lectura', 'navegación', 'atajos', 'reading']
          }
        ]
      },

      advanced: {
        title: '⚡ Funciones Avanzadas',
        icon: '⚡',
        items: [
          {
            id: 'sync',
            title: 'Sincronización en la Nube',
            description: 'Supabase sync automático',
            content: `
              <p><strong>¿Qué se sincroniza?</strong></p>
              <ul>
                <li>📊 Progreso de lectura</li>
                <li>📝 Notas y reflexiones</li>
                <li>🔖 Marcadores</li>
                <li>🎯 Planes de acción</li>
                <li>🏆 Logros desbloqueados</li>
                <li>⚙️ Configuración de IA</li>
              </ul>

              <p class="mt-3"><strong>Requisitos:</strong></p>
              <ul>
                <li>✅ Crear cuenta o iniciar sesión</li>
                <li>🌐 Conexión a internet</li>
                <li>☁️ Sincronización automática en segundo plano</li>
              </ul>

              <p class="mt-3"><strong>Ventajas:</strong></p>
              <ul>
                <li>📱 Lee en múltiples dispositivos</li>
                <li>💾 Respaldo automático de tus datos</li>
                <li>🔄 Siempre actualizado</li>
              </ul>
            `,
            tags: ['sincronización', 'nube', 'supabase', 'backup', 'cloud']
          },
          {
            id: 'offline',
            title: 'Modo Offline',
            description: 'Lee sin conexión a internet',
            content: `
              <p><strong>¿Cómo funciona?</strong></p>
              <p>La app almacena los libros en caché local para que puedas leer sin internet.</p>

              <p class="mt-3"><strong>Funcionalidades offline:</strong></p>
              <ul>
                <li>📖 Leer todos los capítulos descargados</li>
                <li>📝 Crear notas (se sincronizan al reconectar)</li>
                <li>🔖 Crear marcadores</li>
                <li>🎧 AudioReader (TTS local)</li>
                <li>📊 Ver progreso</li>
              </ul>

              <p class="mt-3"><strong>Limitaciones offline:</strong></p>
              <ul>
                <li>❌ Chat de IA (requiere conexión)</li>
                <li>❌ Sincronización en tiempo real</li>
                <li>❌ Descarga de nuevos libros</li>
              </ul>

              <p class="mt-3 text-green-400">💚 Al reconectar, todo se sincroniza automáticamente</p>
            `,
            tags: ['offline', 'sin internet', 'caché', 'local']
          },
          {
            id: 'widgets',
            title: 'Widgets de Android',
            description: 'Accesos directos en tu pantalla principal',
            content: `
              <p><strong>Widgets disponibles:</strong></p>
              <ul>
                <li>📚 <strong>Progreso de lectura:</strong> Muestra tu avance actual</li>
                <li>💡 <strong>Koan diario:</strong> Reflexión del día</li>
                <li>📖 <strong>Continuar leyendo:</strong> Acceso rápido al último capítulo</li>
              </ul>

              <p class="mt-3"><strong>Cómo agregar:</strong></p>
              <ol>
                <li>Mantén presionado en la pantalla principal</li>
                <li>Selecciona "Widgets"</li>
                <li>Busca "Colección Nuevo Ser"</li>
                <li>Arrastra el widget deseado</li>
              </ol>

              <p class="mt-3 text-purple-400">🤖 Solo disponible en Android</p>
            `,
            tags: ['widgets', 'android', 'pantalla principal', 'accesos']
          },
          {
            id: 'export',
            title: 'Exportar Datos',
            description: 'Descarga tus notas y progreso',
            content: `
              <p><strong>Formatos de exportación:</strong></p>
              <ul>
                <li>📄 <strong>Notas:</strong> TXT, Markdown, JSON</li>
                <li>📊 <strong>Progreso:</strong> CSV, JSON</li>
                <li>🎯 <strong>Planes de acción:</strong> PDF, Markdown</li>
                <li>🔖 <strong>Marcadores:</strong> JSON, HTML</li>
              </ul>

              <p class="mt-3"><strong>Cómo exportar:</strong></p>
              <ol>
                <li>Ve a Configuración → Exportar datos</li>
                <li>Selecciona qué quieres exportar</li>
                <li>Elige formato</li>
                <li>Descarga el archivo</li>
              </ol>

              <p class="mt-3"><strong>Usos:</strong></p>
              <ul>
                <li>💾 Respaldo personal</li>
                <li>📤 Compartir con otros</li>
                <li>📈 Análisis externo</li>
                <li>📝 Importar en otras apps</li>
              </ul>
            `,
            tags: ['exportar', 'descargar', 'backup', 'export', 'datos']
          },
          {
            id: 'themes',
            title: 'Temas y Personalización',
            description: 'Personaliza el aspecto de la app',
            content: `
              <p><strong>Modos de tema:</strong></p>
              <ul>
                <li>🌙 <strong>Oscuro:</strong> Ideal para leer de noche</li>
                <li>☀️ <strong>Claro:</strong> Mejor para luz del día</li>
                <li>🔄 <strong>Auto:</strong> Cambia según la hora del sistema</li>
              </ul>

              <p class="mt-3"><strong>Personalización por libro:</strong></p>
              <p>Cada libro tiene su propio tema visual único:</p>
              <ul>
                <li>🎨 Paleta de colores adaptada</li>
                <li>🖼️ Iconografía temática</li>
                <li>✨ Animaciones contextuales</li>
              </ul>

              <p class="mt-3"><strong>Cambiar tema:</strong></p>
              <ul>
                <li>Click en el icono 🌙/☀️ en el menú</li>
                <li>O desde Configuración → Apariencia</li>
              </ul>
            `,
            tags: ['temas', 'personalización', 'dark mode', 'light mode', 'apariencia']
          }
        ]
      },

      // 🔧 v2.9.333: Nueva categoría de soporte
      support: {
        title: '💬 Contactar Soporte',
        icon: '💬',
        items: [
          {
            id: 'contact-form',
            title: 'Enviar mensaje al equipo',
            description: 'Reporta problemas, sugerencias o consultas',
            content: `
              <div id="support-form-container">
                <p class="mb-4">Completa el formulario para contactar con nuestro equipo de soporte.</p>

                <form id="support-form" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      id="support-email"
                      required
                      placeholder="tu@email.com"
                      class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Tipo de consulta</label>
                    <select
                      id="support-type"
                      required
                      class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 transition">
                      <option value="">Selecciona una opción</option>
                      <option value="bug">🐛 Reportar un error</option>
                      <option value="feature">💡 Sugerencia de mejora</option>
                      <option value="question">❓ Pregunta general</option>
                      <option value="account">👤 Problema con mi cuenta</option>
                      <option value="other">📝 Otro</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-1">Mensaje</label>
                    <textarea
                      id="support-message"
                      required
                      rows="5"
                      placeholder="Describe tu consulta con el mayor detalle posible..."
                      class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                    📤 Enviar mensaje
                  </button>
                </form>

                <p class="mt-4 text-xs text-gray-500 text-center">
                  Normalmente respondemos en 24-48 horas hábiles.
                </p>
              </div>
            `,
            tags: ['soporte', 'contacto', 'ayuda', 'mensaje', 'email', 'bug', 'sugerencia']
          },
          {
            id: 'faq',
            title: 'Preguntas frecuentes',
            description: 'Respuestas a las dudas más comunes',
            content: `
              <div class="space-y-4">
                <div class="p-3 bg-gray-800/50 rounded-lg">
                  <h5 class="font-bold text-cyan-300 mb-2">¿Cómo recupero mi progreso si cambié de dispositivo?</h5>
                  <p class="text-sm">Si tienes cuenta, tu progreso se sincroniza automáticamente. Simplemente inicia sesión con la misma cuenta.</p>
                </div>

                <div class="p-3 bg-gray-800/50 rounded-lg">
                  <h5 class="font-bold text-cyan-300 mb-2">¿Los libros funcionan sin internet?</h5>
                  <p class="text-sm">Sí, una vez cargados los libros funcionan offline. Solo la IA y sincronización requieren conexión.</p>
                </div>

                <div class="p-3 bg-gray-800/50 rounded-lg">
                  <h5 class="font-bold text-cyan-300 mb-2">¿Cómo configuro la IA?</h5>
                  <p class="text-sm">Ve a Configuración - IA y selecciona un proveedor. Gemini es gratis y recomendado para empezar.</p>
                </div>

                <div class="p-3 bg-gray-800/50 rounded-lg">
                  <h5 class="font-bold text-cyan-300 mb-2">¿Mis datos están seguros?</h5>
                  <p class="text-sm">Sí. Usamos Supabase con encriptación. Nunca compartimos datos con terceros.</p>
                </div>
              </div>
            `,
            tags: ['faq', 'preguntas', 'frecuentes', 'dudas']
          }
        ]
      }
    };
  }

  // ==========================================================================
  // APERTURA Y CIERRE
  // ==========================================================================

  open(initialTab = 'basics') {
    if (this.isOpen) return;

    this.isOpen = true;
    this.currentTab = initialTab;
    this.render();
    this.attachEventListeners();

    // Focus en búsqueda
    setTimeout(() => {
      const searchInput = document.getElementById('help-search-input');
      if (searchInput) searchInput.focus();
    }, 100);
  }

  close() {
    // 🔧 FIX: Cleanup de event listeners ANTES de remover
    if (this.eventManager) {
      this.eventManager.cleanup();
    }
    this._eventListenersAttached = false;

    const modal = document.getElementById('help-center-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.remove();
        this.isOpen = false;
      }, 200);
    }
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  isMobile() {
    return window.innerWidth < 768;
  }

  render() {
    const existing = document.getElementById('help-center-modal');
    if (existing) existing.remove();

    const isMobile = this.isMobile();

    const modal = document.createElement('div');
    modal.id = 'help-center-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-0 sm:p-4 opacity-0 transition-opacity duration-200';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl max-w-5xl w-full h-full sm:h-[90vh] flex flex-col border-0 sm:border-2 border-cyan-500/30 overflow-hidden">
        ${this.renderHeader()}

        <div class="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          <!-- Mobile: Tabs como dropdown -->
          <div id="help-mobile-dropdown" class="${isMobile ? 'block' : 'hidden'} border-b border-gray-700 p-3 flex-shrink-0">
            <select id="help-mobile-tab" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
              ${this.renderMobileTabs()}
            </select>
          </div>

          <!-- Desktop: Sidebar con tabs -->
          <div id="help-desktop-sidebar" class="${isMobile ? 'hidden' : 'block'}">
            ${this.renderSidebar()}
          </div>

          <!-- Content area -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            ${this.renderContent()}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Trigger animation
    requestAnimationFrame(() => {
      modal.classList.remove('opacity-0');
    });

    // Add mobile dropdown listener
    if (isMobile) {
      const mobileSelect = document.getElementById('help-mobile-tab');
      if (mobileSelect) {
        // 🔧 FIX: Usar EventManager en vez de addEventListener directo
        this.eventManager.addEventListener(mobileSelect, 'change', (e) => {
          this.currentTab = e.target.value;
          this._eventListenersAttached = false; // Permitir re-attach después de render
          this.render();
          this.attachEventListeners();
        });
      }
    }
  }

  renderMobileTabs() {
    return Object.entries(this.helpContent).map(([key, category]) => `
      <option value="${key}" ${this.currentTab === key ? 'selected' : ''}>
        ${category.icon} ${category.title.replace(/^[^\s]+\s/, '')}
      </option>
    `).join('') + `
      <option value="tutorial">🎓 Tutorial</option>
    `;
  }

  renderHeader() {
    return `
      <div class="border-b border-gray-700 p-3 sm:p-4 flex-shrink-0">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-2xl">❓</span>
            <h2 class="text-xl sm:text-2xl font-bold text-cyan-300">Centro de Ayuda</h2>
          </div>
          <button id="close-help-center" class="p-2 hover:bg-gray-800 rounded-lg transition">
            ${Icons.close(20)}
          </button>
        </div>

        <!-- Búsqueda -->
        <div class="relative">
          <input
            type="text"
            id="help-search-input"
            placeholder="🔍 Buscar funcionalidad, atajo, tema..."
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
            value="${this.searchQuery}"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          ${this.searchQuery ? `
            <button id="clear-help-search" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              ✕
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderSidebar() {
    return `
      <div class="w-48 sm:w-56 border-r border-gray-700 flex-shrink-0 overflow-y-auto bg-gray-800/50">
        ${Object.entries(this.helpContent).map(([key, category]) => `
          <button
            class="help-tab w-full text-left px-4 py-3 border-l-4 transition ${
              this.currentTab === key
                ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-semibold'
                : 'border-transparent hover:bg-gray-700/50 text-gray-300'
            }"
            data-tab="${key}">
            <div class="flex items-center gap-2">
              <span class="text-xl">${category.icon}</span>
              <span class="text-sm hidden sm:inline">${category.title.replace(/^[^\s]+\s/, '')}</span>
            </div>
          </button>
        `).join('')}

        <!-- Tutorial button -->
        <div class="border-t border-gray-700 mt-2 pt-2">
          <button
            id="start-tutorial-btn"
            class="w-full text-left px-4 py-3 hover:bg-purple-600/20 text-purple-300 transition">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎓</span>
              <span class="text-sm hidden sm:inline">Tutorial</span>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  renderContent() {
    const category = this.helpContent[this.currentTab];
    if (!category) return '<p>Categoría no encontrada</p>';

    // Filtrar items si hay búsqueda activa
    let items = category.items;
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      items = items.filter(item => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.includes(query)) ||
          item.content.toLowerCase().includes(query)
        );
      });
    }

    if (items.length === 0) {
      return `
        <div class="text-center py-12 opacity-70">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-bold mb-2">No se encontraron resultados</h3>
          <p class="text-sm">Intenta con otros términos de búsqueda</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        <h3 class="text-2xl font-bold text-cyan-300 mb-4">${category.title}</h3>

        ${items.map((item, index) => `
          <div class="help-item bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
            <button
              class="help-item-header w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition"
              data-item-id="${item.id}">
              <div class="flex-1">
                <h4 class="font-bold text-cyan-300">${item.title}</h4>
                <p class="text-sm text-gray-400 mt-1">${item.description}</p>
              </div>
              <svg class="w-5 h-5 text-gray-400 transform transition help-item-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div id="help-content-${item.id}" class="help-item-content hidden px-4 pb-4 text-sm text-gray-300 leading-relaxed">
              ${item.content}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // 🔧 FIX: Protección contra re-attach múltiple
    if (this._eventListenersAttached) {
      logger.warn('[HelpCenterModal] Listeners already attached, skipping');
      return;
    }

    // Cerrar modal
    const closeBtn = document.getElementById('close-help-center');
    if (closeBtn) {
      this.eventManager.addEventListener(closeBtn, 'click', () => this.close());
    }

    // Click fuera del modal
    const modal = document.getElementById('help-center-modal');
    if (modal) {
      this.eventManager.addEventListener(modal, 'click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    // 🔧 FIX: ESC para cerrar usando EventManager
    const handleEsc = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    this.eventManager.addEventListener(document, 'keydown', handleEsc);

    // Búsqueda
    const searchInput = document.getElementById('help-search-input');
    if (searchInput) {
      this.eventManager.addEventListener(searchInput, 'input', (e) => {
        this.searchQuery = e.target.value;
        this.updateContent();
      });
    }

    // Clear search
    const clearSearch = document.getElementById('clear-help-search');
    if (clearSearch) {
      this.eventManager.addEventListener(clearSearch, 'click', () => {
        this.searchQuery = '';
        const searchInput = document.getElementById('help-search-input');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        this.updateContent();
      });
    }

    // Tabs
    const tabs = document.querySelectorAll('.help-tab');
    tabs.forEach(tab => {
      this.eventManager.addEventListener(tab, 'click', () => {
        this.currentTab = tab.dataset.tab;
        this.searchQuery = ''; // Reset search cuando cambia tab
        this.render();
        this._eventListenersAttached = false; // Permitir re-attach después de render
        this.attachEventListeners();
      });
    });

    // Acordeón de items
    const itemHeaders = document.querySelectorAll('.help-item-header');
    itemHeaders.forEach(header => {
      this.eventManager.addEventListener(header, 'click', () => {
        const itemId = header.dataset.itemId;
        const content = document.getElementById(`help-content-${itemId}`);
        const chevron = header.querySelector('.help-item-chevron');

        if (content && chevron) {
          const isOpen = !content.classList.contains('hidden');

          if (isOpen) {
            content.classList.add('hidden');
            chevron.classList.remove('rotate-180');
          } else {
            content.classList.remove('hidden');
            chevron.classList.add('rotate-180');
          }
        }
      });
    });

    // Tutorial button
    const tutorialBtn = document.getElementById('start-tutorial-btn');
    if (tutorialBtn) {
      this.eventManager.addEventListener(tutorialBtn, 'click', () => {
        this.close();
        setTimeout(() => {
          if (window.onboardingTutorial) {
            window.onboardingTutorial.start();
          }
        }, 300);
      });
    }

    // 🔧 v2.9.333: Formulario de soporte
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
      this.eventManager.addEventListener(supportForm, 'submit', (e) => {
        e.preventDefault();
        this.handleSupportSubmit();
      });
    }

    // Pre-llenar email si está autenticado
    const emailInput = document.getElementById('support-email');
    if (emailInput && window.authHelper?.getCurrentUser()) {
      emailInput.value = window.authHelper.getCurrentUser().email || '';
    }

    this._eventListenersAttached = true;
  }

  updateContent() {
    const contentArea = document.querySelector('#help-center-modal .flex-1.overflow-y-auto');
    if (contentArea) {
      contentArea.innerHTML = this.renderContent();
      // 🔧 FIX: Resetear flag para permitir re-attach de listeners en nuevos elementos
      this._eventListenersAttached = false;
      this.attachEventListeners();
    }
  }

  // ==========================================================================
  // SOPORTE
  // ==========================================================================

  /**
   * 🔧 v2.9.333: Enviar mensaje de soporte a Supabase
   */
  async handleSupportSubmit() {
    const emailInput = document.getElementById('support-email');
    const typeSelect = document.getElementById('support-type');
    const messageInput = document.getElementById('support-message');
    const submitBtn = document.querySelector('#support-form button[type="submit"]');

    if (!emailInput || !typeSelect || !messageInput) return;

    const email = emailInput.value.trim();
    const type = typeSelect.value;
    const message = messageInput.value.trim();

    // Validación
    if (!email || !type || !message) {
      window.toast?.error('Por favor completa todos los campos');
      return;
    }

    // Deshabilitar botón mientras envía
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Enviando...';
    }

    try {
      const supabase = window.supabaseClient;
      if (!supabase) {
        throw new Error('Supabase no disponible');
      }

      const user = window.authHelper?.getCurrentUser();

      const { error } = await supabase
        .from('support_requests')
        .insert({
          email: email,
          request_type: type,
          message: message,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
          app_version: '2.9.333',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Éxito
      window.toast?.success('Mensaje enviado correctamente');

      // Limpiar formulario
      emailInput.value = user?.email || '';
      typeSelect.value = '';
      messageInput.value = '';

      // Mostrar confirmación en el contenedor
      const container = document.getElementById('support-form-container');
      if (container) {
        container.innerHTML = `
          <div class="text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <h4 class="text-xl font-bold text-green-400 mb-2">¡Mensaje enviado!</h4>
            <p class="text-gray-400">Te responderemos a ${email} lo antes posible.</p>
            <button id="send-another-btn" class="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              Enviar otro mensaje
            </button>
          </div>
        `;

        // Handler para "enviar otro"
        const sendAnotherBtn = document.getElementById('send-another-btn');
        if (sendAnotherBtn) {
          this.eventManager.addEventListener(sendAnotherBtn, 'click', () => {
            this._eventListenersAttached = false;
            this.render();
            this.attachEventListeners();
            // Ir a la pestaña de soporte y abrir el formulario
            setTimeout(() => {
              const formHeader = document.querySelector('[data-item-id="contact-form"]');
              if (formHeader) formHeader.click();
            }, 100);
          });
        }
      }
    } catch (error) {
      logger.error('Error enviando soporte:', error);
      window.toast?.error('Error al enviar. Intenta de nuevo.');

      // Restaurar botón
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📤 Enviar mensaje';
      }
    }
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS
  // ==========================================================================

  openToItem(categoryKey, itemId) {
    this.currentTab = categoryKey;
    this.open();

    // Esperar render y abrir item
    setTimeout(() => {
      const header = document.querySelector(`[data-item-id="${itemId}"]`);
      if (header) {
        header.click();
        header.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }
}

// Exportar globalmente
window.HelpCenterModal = HelpCenterModal;

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.helpCenterModal = new HelpCenterModal();
  });
} else {
  window.helpCenterModal = new HelpCenterModal();
}
