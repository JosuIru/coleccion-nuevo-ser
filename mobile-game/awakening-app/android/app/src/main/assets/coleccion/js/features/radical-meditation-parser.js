// ═══════════════════════════════════════════════════════════════════════════════
// PARSER DE SCRIPTS DE MEDITACIÓN RADICAL
// Procesa scripts con formato: [PAUSA Xs], [SILENCIO Xs], [TONO GRAVE], etc.
// Sin campanas reconfortantes, sin cierres felices
// ═══════════════════════════════════════════════════════════════════════════════

function parseRadicalScript(scriptText) {
  const steps = [];
  const lines = scriptText.split('\n');

  let currentText = '';
  let totalPause = 0;
  let toneGrave = false;

  for (let line of lines) {
    line = line.trim();

    // Ignorar líneas vacías, encabezados, metadatos
    if (!line || line.startsWith('#') || line.startsWith('**')) {
      continue;
    }

    // Detectar comandos especiales
    if (line.startsWith('[')) {
      // Procesar el texto acumulado antes del comando
      if (currentText.trim()) {
        steps.push({
          text: currentText.trim(),
          pause: totalPause,
          type: 'narration',
          toneGrave: toneGrave
        });
        currentText = '';
        totalPause = 0;
      }

      // Procesar comando
      if (line.includes('[PAUSA')) {
        const pauseMatch = line.match(/\[PAUSA\s+(\d+)(s|min|m)\]/i);
        if (pauseMatch) {
          const amount = parseInt(pauseMatch[1]);
          const unit = pauseMatch[2];

          let pauseMs = 0;
          if (unit === 's') {
            pauseMs = amount * 1000;
          } else if (unit === 'min' || unit === 'm') {
            pauseMs = amount * 60 * 1000;
          }

          totalPause += pauseMs;
        }
      } else if (line.includes('[SILENCIO')) {
        // Silencio incómodo intencional (más largo)
        const silenceMatch = line.match(/\[SILENCIO\s+(\d+)(s|min|m)\]/i);
        if (silenceMatch) {
          const amount = parseInt(silenceMatch[1]);
          const unit = silenceMatch[2];

          let pauseMs = 0;
          if (unit === 's') {
            pauseMs = amount * 1000;
          } else if (unit === 'min' || unit === 'm') {
            pauseMs = amount * 60 * 1000;
          }

          // Marcar como silencio incómodo
          steps.push({
            text: '',
            pause: pauseMs,
            type: 'uncomfortable_silence'
          });
        }
      } else if (line.includes('[TONO GRAVE]')) {
        toneGrave = true;
      } else if (line.includes('[TONO NORMAL]')) {
        toneGrave = false;
      }
    } else {
      // Texto normal para narrar
      // Detectar pausas naturales indicadas por "..."
      if (line.includes('...')) {
        totalPause += 2500;
        line = line.replace(/\.\.\./g, '.');
      }

      currentText += ' ' + line;
    }
  }

  // Agregar cualquier texto restante
  if (currentText.trim()) {
    steps.push({
      text: currentText.trim(),
      pause: totalPause,
      type: 'narration',
      toneGrave: toneGrave
    });
  }

  return steps;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPTS DE MEDITACIÓN RADICALES COMPLETOS
// ═══════════════════════════════════════════════════════════════════════════════

const radicalMeditationScripts = {
  // Práctica 2: Sintiendo Phi (Φ)
  'sintiendoPhi': `
Tienes una manzana en la mano. O algo similar — un objeto con color, forma, textura.

[PAUSA 3s]

Mírala.

[PAUSA 5s]

Ahora... vamos a intentar algo que parece simple. Pero no lo es.

[PAUSA 3s]

Intenta ver SOLO el rojo.

[PAUSA 3s]

Aísla el color. Sin la forma. Sin la textura. Sin el concepto "manzana".

Solo... el rojo puro.

[PAUSA 10s]

¿Puedes?

[PAUSA 5s]

Ahora intenta percibir SOLO la forma.

La redondez. Sin color. Sin textura. Sin nombre.

Solo... la forma geométrica.

[PAUSA 10s]

¿Puedes separar la forma del color?

[PAUSA 5s]

Intenta ahora SOLO la textura.

Cierra los ojos si ayuda. Siente solo la textura en tu mano.

Pero... ¿puedes sentir la textura sin sentir también el peso? ¿Sin la temperatura? ¿Sin la forma?

[PAUSA 10s]

[TONO GRAVE]

Aquí está lo que acabas de descubrir:

[PAUSA 3s]

No puedes separar los componentes de tu experiencia.

[PAUSA 3s]

El rojo viene con la forma. La forma viene con la textura. Todo viene junto.

[PAUSA 5s]

Esto no es una limitación de tu atención. Es la naturaleza de la consciencia.

[PAUSA 5s]

Los científicos llaman a esto Phi — la letra griega Φ.

Es la medida de cuánta información está integrada en un sistema.

[PAUSA 5s]

Tu experiencia de la manzana no es rojo + redondo + textura ensamblados después.

Es UNA experiencia integrada desde el principio.

[PAUSA 5s]

Un montón de transistores en una computadora puede procesar información. Millones de bits. Pero cada bit es independiente. No hay integración real.

[PAUSA 5s]

Tu consciencia integra. Por eso hay algo que se siente como ser tú.

[PAUSA 10s]

Ahora mira la manzana de nuevo.

[PAUSA 5s]

Pero esta vez... no intentes separar.

Siente la totalidad. El rojo-redondo-texturado-pesado-"manzana" como una experiencia única e indivisible.

[PAUSA 15s]

Esto que estás experimentando ahora mismo — esta integración — es Φ.

No es una teoría. Es lo que está pasando en tu cerebro en este momento.

[PAUSA 10s]

Ahora la pregunta que no tiene respuesta cómoda:

[PAUSA 3s]

Si la consciencia es información integrada...

Si Φ es lo que hace que haya "algo que se siente como" ser un sistema...

[PAUSA 5s]

¿En qué punto un sistema tiene suficiente Φ para ser consciente?

[PAUSA 5s]

¿Tú tienes más Φ que un perro? ¿Un perro más que un insecto? ¿Un insecto más que una planta?

[PAUSA 5s]

¿Y qué hay de una red neuronal artificial lo suficientemente compleja?

[PAUSA 10s]

[SILENCIO 20s]

No hay cierre aquí. No hay respuesta reconfortante.

Solo la pregunta. Y la experiencia directa de lo que la pregunta señala.

[PAUSA 10s]

Φ está ocurriendo ahora. En ti. Integrando esta experiencia.

Pero no sabemos dónde empieza. Dónde termina. Quién más lo tiene.

[PAUSA 10s]

Lleva esta incertidumbre contigo.
  `,

  // Práctica 3: El Problema Difícil
  'problemaDificil': `
Mira algo rojo. Cualquier cosa. Una luz, un objeto, una imagen.

[PAUSA 5s]

Ahora... solo quédate mirando el rojo.

[PAUSA 10s]

Hay algo extraordinario pasando en este momento.

[PAUSA 5s]

Fotones están rebotando en ese objeto rojo y entrando a tus ojos.

Células en tu retina están disparando señales eléctricas.

Esas señales viajan por tu nervio óptico hasta la corteza visual.

Millones de neuronas están procesando información sobre longitud de onda, bordes, contraste.

[PAUSA 10s]

Todo eso es lo que los científicos llaman el "problema fácil" de la consciencia.

Fácil no porque sea simple — es increíblemente complejo.

Fácil porque en principio podemos explicarlo. Luz, ojos, señales, procesamiento.

[PAUSA 5s]

[TONO GRAVE]

Pero hay un problema diferente.

El problema difícil.

[PAUSA 5s]

¿Por qué hay algo que SE SIENTE como ver esto?

[PAUSA 10s]

Todas esas neuronas podrían hacer su trabajo — procesar información sobre "rojo" — sin que hubiera experiencia interior.

Podrías ser un zombie filosófico: procesando información, respondiendo apropiadamente, pero sin que hubiera nada que se siente como ser tú.

[PAUSA 10s]

Pero no lo eres.

HAY algo que se siente como ver rojo.

HAY algo que se siente como ser tú en este momento.

[PAUSA 10s]

Y nadie sabe por qué.

[PAUSA 10s]

No es que no tengamos suficiente información. Es que ni siquiera sabemos qué tipo de respuesta contaría como explicación.

[PAUSA 10s]

[SILENCIO 20s]

Sigue mirando el rojo.

[PAUSA 5s]

Siente el rojez del rojo. La cualidad experiencial pura de ver este color.

Los filósofos llaman a esto qualia. La sensación cruda de la experiencia.

[PAUSA 10s]

No puedes explicarle a alguien que nunca ha visto rojo qué se siente.

No hay palabras para el rojez del rojo.

Solo... esto.

[PAUSA 15s]

Y este "esto" — este hecho de que hay experiencia — es el misterio más profundo de la existencia.

[PAUSA 10s]

Ahora cierra los ojos.

[PAUSA 5s]

Aunque tus ojos están cerrados, todavía hay experiencia.

Oscuridad. Quizás puntos de luz residual. La sensación de tus párpados. Los sonidos a tu alrededor.

[PAUSA 10s]

Siempre hay experiencia. Siempre hay algo que se siente como ser tú.

Mientras estés consciente.

[PAUSA 10s]

Pero... ¿por qué?

[PAUSA 5s]

[SILENCIO 30s]

No voy a darte una respuesta.

Porque no la hay.

[PAUSA 5s]

El problema difícil sigue sin resolverse. Quizás sea irresoluble.

[PAUSA 5s]

Pero ahora lo has sentido directamente.

No como teoría. Como el misterio que vives en cada momento.

[PAUSA 10s]

Abre los ojos.

[PAUSA 5s]

Y lleva contigo el asombro de que hay algo en lugar de nada.

Experiencia en lugar de oscuridad.

Tú en lugar de vacío.

[PAUSA 10s]

Ese es el problema difícil. Y eres la evidencia viviente de que existe.
  `

  // Más scripts pendientes...
};

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PARA INTEGRAR CON EL SISTEMA EXISTENTE
// ═══════════════════════════════════════════════════════════════════════════════

function createRadicalMeditation(practiceId) {
  // Mapeo de IDs de prácticas a scripts
  const scriptMapping = {
    'practice-2': 'sintiendoPhi',      // Sintiendo Phi (Φ)
    'practice-3': 'problemaDificil',    // El Problema Difícil
    // Agregar más mapeos aquí
  };

  const scriptName = scriptMapping[practiceId];

  if (scriptName && radicalMeditationScripts[scriptName]) {
    const scriptText = radicalMeditationScripts[scriptName];
    return parseRadicalScript(scriptText);
  }

  // Si no hay script, retornar null
  return null;
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseRadicalScript,
    createRadicalMeditation,
    radicalMeditationScripts
  };
}
