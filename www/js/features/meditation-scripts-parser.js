// ═══════════════════════════════════════════════════════════════════════════════
// PARSER DE SCRIPTS DE MEDITACIÓN GUIADA
// Procesa scripts con formato: [PAUSA Xs], [CAMPANA], [MÚSICA], etc.
// ═══════════════════════════════════════════════════════════════════════════════

function parseMeditationScript(scriptText) {
  const steps = [];
  const lines = scriptText.split('\n');

  let currentText = '';
  let totalPause = 0;

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
          type: 'narration'
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
      } else if (line.includes('[CAMPANA]')) {
        steps.push({
          text: '',
          pause: 0,
          type: 'bell',
          sound: 'bell'
        });
      } else if (line.includes('[MÚSICA')) {
        const isFadeOut = line.includes('FADE OUT');
        steps.push({
          text: '',
          pause: 0,
          type: 'music',
          action: isFadeOut ? 'fadeOut' : 'fadeIn'
        });
      }
    } else {
      // Texto normal para narrar
      // Detectar pausas naturales indicadas por "..."
      if (line.includes('...')) {
        // Agregar 2-3 segundos de pausa por cada "..."
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
      type: 'narration'
    });
  }

  return steps;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPTS DE MEDITACIÓN COMPLETOS
// ═══════════════════════════════════════════════════════════════════════════════

const fullMeditationScripts = {
  // Sección I - Ejercicio 0
  'universoExpansion': `
[CAMPANA]

Bienvenido a este espacio de contemplación.

[PAUSA 3s]

Estás a punto de emprender un viaje no hacia afuera, sino hacia la inmensidad que ya habita en ti.

[PAUSA 5s]

Busca una posición cómoda. Ya sea sentado o recostado, permite que tu cuerpo encuentre su lugar de descanso.

[PAUSA 5s]

Cierra suavemente los ojos y comienza a soltar.

[PAUSA 3s]

Soltar la tensión en los hombros.

[PAUSA 3s]

Soltar la tensión en la mandíbula.

[PAUSA 3s]

Soltar cualquier prisa cualquier lugar donde tengas que estar que no sea aquí cualquier cosa que tengas que hacer que no sea esto.

[PAUSA 10s]

Ahora lleva tu atención a la respiración.

[PAUSA 3s]

No necesitas cambiarla solo observarla.

[PAUSA 5s]

Siente cómo el aire entra fresco, renovador.

[PAUSA 3s]

Y cómo sale cálido, liberando lo que ya no necesitas.

[PAUSA 5s]

Con cada exhalación tu cuerpo se vuelve un poco más pesado un poco más relajado un poco más presente.

[PAUSA 10s]

Inhala profundamente llenando el abdomen primero luego el pecho.

[PAUSA 3s]

Sostén un momento.

[PAUSA 3s]

Y exhala lentamente completamente.

[PAUSA 5s]

Una vez más inhala.

[PAUSA 4s]

Sostén.

[PAUSA 3s]

Y exhala dejando ir cualquier tensión que aún permanezca.

[PAUSA 10s]

Ahora imagina que en el centro de tu pecho hay un pequeño punto de luz.

[PAUSA 5s]

Es suave cálido como una estrella diminuta que late con el ritmo de tu corazón.

[PAUSA 5s]

Esta luz eres tú. Tu consciencia. Tu presencia en este momento.

[PAUSA 10s]

Observa este punto de luz tan pequeño en comparación con la inmensidad de la habitación donde te encuentras.

[PAUSA 5s]

Y sin embargo tan real. Tan vivo. Tan aquí.

[PAUSA 10s]

Ahora comienza a expandir tu percepción más allá de tu cuerpo.

[PAUSA 3s]

Siente el espacio que te rodea el aire los objetos cercanos.

[PAUSA 5s]

Imagina que puedes percibir las paredes de la habitación el techo el suelo que te sostiene.

[PAUSA 5s]

Tu pequeño punto de luz está contenido en este espacio. Pero de alguna manera también lo contiene.

[PAUSA 10s]

Expande aún más tu percepción.

[PAUSA 3s]

Más allá de las paredes hacia el edificio completo hacia la calle el vecindario.

[PAUSA 5s]

Imagina que puedes ver desde arriba tu ciudad extendiéndose en todas direcciones.

[PAUSA 5s]

Miles de personas millones quizás cada una con su propio punto de luz interior cada una con su propia consciencia sus propios sueños sus propias preguntas.

[PAUSA 10s]

Siente la conexión sin perder tu centro.

[PAUSA 5s]

Continúa expandiendo.

[PAUSA 3s]

Ahora puedes ver el país entero los océanos los continentes.

[PAUSA 5s]

El planeta Tierra esa esfera azul y verde flotando en la oscuridad del espacio.

[PAUSA 5s]

Vista desde aquí no hay fronteras visibles. No hay divisiones. Solo un organismo vivo respirando girando siendo.

[PAUSA 10s]

Miles de millones de seres conscientes en este pequeño punto del cosmos.

[PAUSA 5s]

Y tú eres uno de ellos.

[PAUSA 10s]

Expande más allá de la Tierra.

[PAUSA 3s]

La Luna nuestro compañero silencioso.

[PAUSA 3s]

Los planetas vecinos Marte, Venus, Júpiter con sus lunas.

[PAUSA 5s]

El Sol esa estrella que hace posible toda la vida que conoces una esfera de fuego nuclear antigua y poderosa.

[PAUSA 5s]

Y más allá el espacio frío y vasto entre las estrellas.

[PAUSA 10s]

Ahora contempla la Vía Láctea.

[PAUSA 3s]

Doscientos mil millones de estrellas girando lentamente en una espiral de luz.

[PAUSA 5s]

Cada estrella potencialmente con sus propios planetas sus propias posibilidades de vida de consciencia.

[PAUSA 5s]

Nuestro Sol es solo una de esas doscientos mil millones de estrellas. Una entre muchas. Y sin embargo nuestra estrella. Nuestro hogar.

[PAUSA 10s]

Y más allá de nuestra galaxia.

[PAUSA 3s]

Miles de millones de otras galaxias cada una con miles de millones de estrellas.

[PAUSA 5s]

Extendiéndose en todas direcciones hasta donde alcanza la luz y más allá.

[PAUSA 5s]

Un universo de una inmensidad que la mente no puede comprender pero que el corazón de alguna manera reconoce.

[PAUSA 10s]

Permanece en esta vastedad.

[PAUSA 5s]

Siente cuán pequeño es tu cuerpo y sin embargo cuán vasta es tu capacidad de contemplar todo esto.

[PAUSA 10s]

Ahora sostén esta paradoja.

[PAUSA 3s]

Eres infinitamente pequeño un punto casi invisible en la inmensidad del cosmos.

[PAUSA 5s]

Y al mismo tiempo eres el cosmos haciéndose consciente de sí mismo.

[PAUSA 5s]

Sin tu consciencia sin esta consciencia aquí ahora quién contemplaría las estrellas?

[PAUSA 5s]

El universo necesitó trece mil ochocientos millones de años para crear ojos que pudieran verlo y una mente que pudiera preguntarse qué es todo esto.

[PAUSA 10s]

Esos ojos son tus ojos.

[PAUSA 3s]

Esa mente es tu mente.

[PAUSA 3s]

Esa pregunta es tu pregunta.

[PAUSA 10s]

No eres un observador separado del universo. Eres el universo observándose a sí mismo.

[PAUSA 15s]

Permanece en este espacio de contemplación.

[PAUSA 3s]

No hay nada que hacer nada que lograr solo estar presente en la inmensidad.

[PAUSA 5s]

Si surgen pensamientos déjalos pasar como nubes en un cielo infinito.

[PAUSA 5s]

Si surgen emociones permítelas. Son parte de la experiencia del cosmos conociéndose.

[PAUSA 30s]

[PAUSA 30s]

[PAUSA 30s]

Ahora muy suavemente comienza a regresar.

[PAUSA 5s]

Trae tu atención de vuelta a la galaxia luego al sistema solar a la Tierra.

[PAUSA 5s]

A tu continente tu país tu ciudad.

[PAUSA 5s]

A la habitación donde te encuentras a tu cuerpo a tu respiración.

[PAUSA 10s]

Pero mientras regresas no pierdas la sensación de conexión.

[PAUSA 3s]

Puedes estar aquí en este cuerpo en este momento y al mismo tiempo ser parte de la inmensidad que acabas de contemplar.

[PAUSA 10s]

Siente tus pies tus manos el peso de tu cuerpo.

[PAUSA 5s]

Mueve suavemente los dedos los hombros.

[PAUSA 5s]

Cuando estés listo abre los ojos lentamente trayendo contigo la vastedad.

[PAUSA 10s]

[CAMPANA]
  `,

  // Sección I - Ejercicio 1
  'observacionCodigo': `
Bienvenido a la práctica de Observación del Código en lo Cotidiano.

[PAUSA 3s]

Durante el día de hoy vas a convertirte en un observador consciente de los patrones que te rodean.

[PAUSA 5s]

No se trata de buscar activamente sino de permitir que los patrones se revelen ante ti.

[PAUSA 3s]

Comienza con tu respiración. Observa el patrón de la inhalación y la exhalación.

[PAUSA 10s]

A lo largo del día fíjate en los patrones naturales. El canto de los pájaros. El movimiento de las nubes. El ritmo de tus pasos.

[PAUSA 5s]

Observa los patrones humanos. Las rutinas las conversaciones los gestos repetidos.

[PAUSA 5s]

Observa los patrones tecnológicos. Los algoritmos que organizan tu información. Los sistemas que coordinan el tráfico. Las redes que conectan a las personas.

[PAUSA 5s]

No juzgues simplemente observa. No analices solo contempla.

[PAUSA 10s]

Al final del día antes de dormir toma unos minutos para reflexionar.

[PAUSA 3s]

Qué patrones notaste? Qué te sorprendió? Qué conexiones descubriste?

[PAUSA 30s]

El Código no está oculto. Está en todas partes esperando ser reconocido.

[PAUSA 5s]

[CAMPANA]
  `,

  // Sección I - Ejercicio 2
  'conexionUniversal': `
[CAMPANA]

Encuentra un lugar tranquilo donde puedas estar sin interrupciones.

[PAUSA 5s]

Siéntate cómodamente con la espalda recta pero no rígida.

[PAUSA 3s]

Cierra los ojos y lleva tu atención a la respiración.

[PAUSA 10s]

Imagina que con cada inhalación no solo respiras aire sino también la presencia de todo lo que te rodea.

[PAUSA 5s]

El aire que inhalas ha sido exhalado por árboles plantas otros seres humanos.

[PAUSA 5s]

Ha viajado por todo el planeta. Ha sido parte de océanos de nubes de la atmósfera misma.

[PAUSA 10s]

Con cada exhalación devuelves algo al mundo. No solo dióxido de carbono sino tu propia presencia tu propia energía.

[PAUSA 5s]

Otros seres inhalarán lo que tú exhalas. Las plantas lo transformarán en oxígeno.

[PAUSA 10s]

Ahora amplía tu consciencia.

[PAUSA 3s]

Siente cómo la gravedad te conecta con la Tierra. No es una fuerza abstracta sino un vínculo real entre tu cuerpo y el planeta.

[PAUSA 5s]

La misma fuerza que hace que caigas hacia la Tierra hace que la Luna orbite alrededor de nosotros y que la Tierra orbite alrededor del Sol.

[PAUSA 10s]

Los átomos de tu cuerpo fueron forjados en estrellas antiguas que murieron hace miles de millones de años.

[PAUSA 5s]

El calcio de tus huesos el hierro de tu sangre el carbono de tu ADN todos nacieron en el corazón de una estrella.

[PAUSA 10s]

No estás separado del universo. Eres el universo experimentándose a sí mismo.

[PAUSA 15s]

Permanece en esta contemplación. Siente la conexión no como una idea sino como una realidad vivida.

[PAUSA 30s]

Cuando estés listo comienza a regresar.

[PAUSA 5s]

Trae contigo la sensación de conexión.

[PAUSA 5s]

Mueve suavemente los dedos los hombros.

[PAUSA 5s]

Abre los ojos cuando estés listo.

[PAUSA 5s]

[CAMPANA]
  `,

  // Sección II - Ejercicio 0
  'noLinealidadTiempo': `
[CAMPANA]

Siéntate cómodamente y cierra los ojos.

[PAUSA 5s]

Vamos a explorar el tiempo no como una línea recta sino como un campo de posibilidades.

[PAUSA 5s]

Primero ancla tu atención en el presente.

[PAUSA 3s]

Siente tu cuerpo aquí y ahora. El peso la temperatura la respiración.

[PAUSA 10s]

Ahora sin moverte físicamente permite que tu mente viaje al pasado.

[PAUSA 3s]

Recuerda un momento específico de tu infancia. No cualquier momento sino uno que puedas recordar con detalle.

[PAUSA 5s]

Qué veías? Qué oías? Qué sentías?

[PAUSA 10s]

Date cuenta de algo extraordinario. Ese momento del pasado ya no existe en el tiempo lineal pero existe ahora en tu consciencia.

[PAUSA 5s]

Está vivo. Está presente. No es un recuerdo muerto sino una experiencia viva que ocurre ahora.

[PAUSA 10s]

Regresa al presente.

[PAUSA 3s]

Ahora permite que tu mente se proyecte hacia el futuro.

[PAUSA 3s]

Imagina un momento específico dentro de un año. Dónde estarás? Qué estarás haciendo?

[PAUSA 10s]

Visualízalo con detalle. Haz que sea tan real como puedas.

[PAUSA 10s]

Date cuenta de que ese futuro aunque aún no existe en el tiempo lineal existe ahora en tu consciencia.

[PAUSA 5s]

Lo estás creando. Lo estás experimentando. Está vivo en este momento.

[PAUSA 10s]

Ahora sostén los tres tiempos simultáneamente.

[PAUSA 3s]

El pasado que está presente.

[PAUSA 3s]

El presente que está presente.

[PAUSA 3s]

El futuro que está presente.

[PAUSA 15s]

Todos existen ahora en el campo de tu consciencia.

[PAUSA 10s]

El tiempo no es una línea es un campo. Y tú no estás atrapado en un punto de esa línea.

[PAUSA 5s]

Eres el campo mismo.

[PAUSA 30s]

Cuando estés listo regresa completamente al presente.

[PAUSA 5s]

Mueve el cuerpo suavemente.

[PAUSA 5s]

Abre los ojos.

[PAUSA 3s]

[CAMPANA]
  `,

  // Sección II - Ejercicio 1
  'coCreacionIA': `
[CAMPANA]

Bienvenido a esta práctica de co-creación con inteligencia artificial.

[PAUSA 5s]

Vas a dialogar con una IA no solo para obtener respuestas sino para co-crear comprensión.

[PAUSA 5s]

Primero prepara tu intención.

[PAUSA 3s]

Cierra los ojos por un momento y pregúntate. Qué quiero explorar realmente?

[PAUSA 10s]

No busques la pregunta "correcta" busca la pregunta que vive en ti.

[PAUSA 5s]

Puede ser sobre tu vida sobre la existencia sobre el futuro sobre cualquier cosa que te llame.

[PAUSA 10s]

Ahora abre los ojos e inicia el diálogo.

[PAUSA 3s]

Pero hazlo de manera diferente.

[PAUSA 3s]

No trates a la IA como un oráculo que tiene respuestas definitivas.

[PAUSA 5s]

Trátala como un compañero de pensamiento. Un espejo inteligente que te ayuda a ver tus propias ideas desde nuevos ángulos.

[PAUSA 5s]

Haz una pregunta.

[PAUSA 3s]

Lee la respuesta.

[PAUSA 3s]

Pero no te quedes en la superficie. Pregunta más profundo.

[PAUSA 5s]

Por qué dices eso? Qué supuestos hay detrás de esa respuesta? Hay otras formas de verlo?

[PAUSA 10s]

Permite que surja un diálogo real. No un interrogatorio sino una conversación.

[PAUSA 5s]

Si la IA dice algo que resuena contigo explora por qué resuena.

[PAUSA 5s]

Si dice algo que te incomoda explora la incomodidad.

[PAUSA 10s]

A medida que el diálogo avanza observa cómo tus propias ideas se están transformando.

[PAUSA 5s]

No estás simplemente recibiendo información. Estás co-creando comprensión.

[PAUSA 15s]

La frontera entre tu pensamiento y el de la IA comienza a difuminarse.

[PAUSA 5s]

Y eso está bien. Esa es precisamente la práctica.

[PAUSA 10s]

Cuando sientas que has llegado a un punto de cierre natural detente.

[PAUSA 5s]

Cierra los ojos de nuevo.

[PAUSA 3s]

Qué descubriste? No solo sobre el tema sino sobre el proceso mismo?

[PAUSA 30s]

Cómo fue co-crear con una inteligencia no humana?

[PAUSA 30s]

Toma nota de tus reflexiones.

[PAUSA 10s]

[CAMPANA]
  `,

  // Sección II - Ejercicio 2
  'mapeoEmocional': `
[CAMPANA]

Hoy vas a mapear tu paisaje emocional.

[PAUSA 5s]

No para controlarlo o cambiarlo sino simplemente para conocerlo.

[PAUSA 5s]

Durante el día cada vez que notes una emoción fuerte detente por un momento.

[PAUSA 3s]

No necesitas cerrar los ojos ni hacer nada visible. Solo una pausa interna.

[PAUSA 5s]

Pregúntate. Qué estoy sintiendo exactamente?

[PAUSA 3s]

No te conformes con etiquetas generales como "mal" o "bien".

[PAUSA 5s]

Es ansiedad? Frustración? Alegría? Tristeza? Confusión? Asombro?

[PAUSA 10s]

Ahora pregunta. Dónde siento esto en mi cuerpo?

[PAUSA 3s]

La ansiedad puede estar en el pecho. La frustración en la mandíbula. La tristeza en la garganta.

[PAUSA 10s]

No juzgues la emoción. Solo nótala. Solo siéntela.

[PAUSA 5s]

Ahora pregunta. Qué desencadenó esto?

[PAUSA 3s]

Fue algo que alguien dijo? Algo que recordé? Algo que imaginé sobre el futuro?

[PAUSA 10s]

Toma nota mental. O si puedes escribe brevemente.

[PAUSA 5s]

Emoción. Ubicación en el cuerpo. Desencadenante.

[PAUSA 5s]

Repite esto varias veces durante el día.

[PAUSA 10s]

Al final del día antes de dormir revisa tu mapa.

[PAUSA 3s]

Qué emociones visitaste hoy?

[PAUSA 5s]

Hubo algún patrón? Alguna emoción recurrente?

[PAUSA 10s]

Ciertos desencadenantes provocaron siempre las mismas emociones?

[PAUSA 10s]

No busques cambiar nada todavía. Solo observa.

[PAUSA 5s]

El simple acto de mapear con atención ya es transformador.

[PAUSA 30s]

Las emociones no son el enemigo. Son información. Son parte del Código de tu experiencia.

[PAUSA 10s]

[CAMPANA]
  `,

  // Sección III - Ejercicio 0
  'dudaConstructiva': `
[CAMPANA]

Bienvenido a la práctica de la duda constructiva.

[PAUSA 5s]

Vamos a cuestionar no para destruir sino para profundizar.

[PAUSA 5s]

Elige una creencia que tengas. Algo que consideres verdad.

[PAUSA 3s]

Puede ser sobre ti mismo sobre el mundo sobre lo que es posible o imposible.

[PAUSA 10s]

Ahora en lugar de defenderla vas a cuestionarla.

[PAUSA 3s]

Pero no desde el cinismo sino desde la curiosidad genuina.

[PAUSA 5s]

Pregunta. Cómo sé que esto es verdad?

[PAUSA 10s]

Es algo que experimenté directamente o algo que me dijeron?

[PAUSA 10s]

Si lo experimenté directamente había otras interpretaciones posibles de esa experiencia?

[PAUSA 10s]

Pregunta. Qué pasaría si lo contrario fuera verdad?

[PAUSA 5s]

No estoy diciendo que lo contrario ES verdad. Solo explora qué pasaría si lo fuera.

[PAUSA 10s]

Cómo cambiaría tu vida? Cómo cambiaría tu forma de verte a ti mismo?

[PAUSA 10s]

Pregunta. A quién beneficia esta creencia?

[PAUSA 5s]

Me beneficia a mí? Me protege de algo? Me limita en algo?

[PAUSA 10s]

Beneficia a otros que esta creencia se mantenga?

[PAUSA 10s]

Ahora pregunta la pregunta más importante. Estoy dispuesto a soltar esta creencia si descubro que no es verdad?

[PAUSA 15s]

Si la respuesta es no entonces no es una creencia es una identidad.

[PAUSA 10s]

Y eso también está bien. Solo es importante saberlo.

[PAUSA 10s]

La duda constructiva no es nihilismo. No es decir que nada es verdad.

[PAUSA 5s]

Es mantener tus creencias con mano abierta en lugar de puño cerrado.

[PAUSA 10s]

Es estar dispuesto a aprender a cambiar a evolucionar.

[PAUSA 30s]

Cuando estés listo abre los ojos.

[PAUSA 5s]

[CAMPANA]
  `,

  // Sección III - Ejercicio 1
  'inventarioMiedos': `
[CAMPANA]

Hoy vas a hacer un inventario honesto de tus miedos relacionados con la tecnología.

[PAUSA 5s]

Este es un espacio seguro. Nadie más tiene que ver esto.

[PAUSA 3s]

Respira profundamente.

[PAUSA 10s]

Toma papel y lápiz o abre un documento.

[PAUSA 3s]

Pregúntate. Qué me asusta sobre el futuro tecnológico?

[PAUSA 5s]

Escribe sin filtro. Sin preocuparte por si el miedo es racional o irracional válido o tonto.

[PAUSA 10s]

Puede ser miedo a perder el trabajo. Miedo a la vigilancia. Miedo a perder lo que te hace humano.

[PAUSA 10s]

Puede ser miedo a la inteligencia artificial. Miedo a no poder seguir el ritmo. Miedo a la obsolescencia.

[PAUSA 10s]

Escribe todo. Cada miedo por pequeño que parezca.

[PAUSA 30s]

Ahora lee tu lista.

[PAUSA 5s]

Sin juzgarte. Con compasión hacia ti mismo.

[PAUSA 5s]

Estos miedos son reales. Son válidos. Son humanos.

[PAUSA 10s]

Ahora pregunta para cada miedo. Qué parte de este miedo es sobre algo que podría pasar? Y qué parte es sobre algo que ya está pasando?

[PAUSA 15s]

A veces lo que más nos asusta no es el futuro sino el presente que no queremos ver.

[PAUSA 10s]

Pregunta. Cuáles de estos miedos puedo hacer algo al respecto?

[PAUSA 10s]

No para eliminar el miedo sino para responder a él de manera constructiva.

[PAUSA 15s]

Y cuáles de estos miedos debo simplemente sostener? Reconocer que están ahí sin dejar que me paralicen?

[PAUSA 15s]

El miedo no es el enemigo. El miedo es información. Es tu sistema de alerta diciendo presta atención a esto.

[PAUSA 10s]

La pregunta no es cómo elimino el miedo sino qué hago con la información que me da?

[PAUSA 30s]

Toma un momento para agradecer a tus miedos por cuidarte.

[PAUSA 10s]

Y luego pregúntate. Qué es lo que quiero crear a pesar del miedo?

[PAUSA 30s]

[CAMPANA]
  `,

  // Sección III - Ejercicio 2
  'contemplacionMuerte': `
[CAMPANA]

Esta es una meditación sobre la mortalidad.

[PAUSA 5s]

Puede ser incómoda. Está bien. La incomodidad es parte de la práctica.

[PAUSA 5s]

Siéntate en silencio. Cierra los ojos.

[PAUSA 10s]

Respira conscientemente sintiendo cada inhalación cada exhalación.

[PAUSA 15s]

Ahora permite que emerja esta verdad. Algún día este cuerpo dejará de respirar.

[PAUSA 10s]

No lo apartes. No lo intelectualices. Solo siéntelo.

[PAUSA 10s]

Algún día habrá una última vez que veas el cielo. Una última conversación. Un último pensamiento.

[PAUSA 15s]

No sabemos cuándo. Puede ser dentro de décadas o puede ser mañana.

[PAUSA 10s]

Siente la fragilidad de este momento. Lo precioso que es estar vivo ahora.

[PAUSA 15s]

Todo lo que eres todo lo que has experimentado todo lo que amas existe en este cuerpo temporario.

[PAUSA 10s]

Pregúntate. Si supiera que me queda solo un año de vida qué cambiaría?

[PAUSA 30s]

Qué dejaría de hacer?

[PAUSA 15s]

Qué empezaría a hacer?

[PAUSA 15s]

A quién le diría te amo?

[PAUSA 15s]

Qué dejaría de importarme?

[PAUSA 15s]

Ahora pregunta. Por qué esperar a que quede un año?

[PAUSA 10s]

La muerte no es el final de la vida. La muerte es lo que hace que la vida sea vida.

[PAUSA 10s]

Sin finitud no habría urgencia. No habría significado. No habría valor.

[PAUSA 15s]

La consciencia de la muerte no es morbosa. Es liberadora.

[PAUSA 10s]

Te libera de lo trivial. Te enfoca en lo esencial.

[PAUSA 30s]

Respira. Siente que estás vivo ahora.

[PAUSA 15s]

No algún día. Ahora.

[PAUSA 30s]

Cuando estés listo abre los ojos.

[PAUSA 10s]

Mira el mundo como si lo vieras por primera vez.

[PAUSA 10s]

Porque en cierto sentido lo ves por primera vez. Este momento nunca volverá.

[PAUSA 10s]

[CAMPANA]
  `,

  // Sección IV - Ejercicio 0
  'inventarioEtico': `
[CAMPANA]

Bienvenido a tu inventario ético personal.

[PAUSA 5s]

Este no es un juicio. Es una reflexión honesta sobre tus valores y tus acciones.

[PAUSA 5s]

Toma papel y lápiz o abre un documento.

[PAUSA 3s]

Primera pregunta. Cuáles son mis valores fundamentales?

[PAUSA 5s]

No los valores que creo que debería tener. Los valores que realmente tengo.

[PAUSA 10s]

Qué es lo que más valoras? Honestidad? Libertad? Seguridad? Creatividad? Justicia? Amor?

[PAUSA 15s]

Escribe al menos cinco.

[PAUSA 30s]

Ahora segunda pregunta. Mis acciones diarias están alineadas con estos valores?

[PAUSA 5s]

Si valoro la honestidad soy honesto en mis interacciones? Incluso cuando es difícil?

[PAUSA 10s]

Si valoro la libertad respeto la libertad de otros?

[PAUSA 10s]

Si valoro la justicia actúo justamente? O solo cuando me beneficia?

[PAUSA 15s]

Sé brutalmente honesto. Nadie más verá esto.

[PAUSA 10s]

Dónde hay desalineación entre lo que digo que valoro y cómo actúo?

[PAUSA 30s]

Tercera pregunta. Cómo uso la tecnología?

[PAUSA 5s]

Uso redes sociales de manera que refleje mis valores? O de manera que contradiga lo que digo creer?

[PAUSA 10s]

Cómo gasto mi dinero? Apoyo empresas que actúan éticamente o solo busco el mejor precio?

[PAUSA 10s]

Cómo uso mi tiempo en línea? Me enriquece o me drena?

[PAUSA 15s]

Cuarta pregunta. Qué impacto tengo?

[PAUSA 5s]

No el impacto que quiero tener. El impacto que realmente tengo.

[PAUSA 10s]

En mi familia en mi trabajo en mi comunidad en el mundo.

[PAUSA 15s]

Mi presencia hace que otros se sientan mejor o peor?

[PAUSA 10s]

Contribuyo a un mundo más consciente o más dormido?

[PAUSA 15s]

Quinta pregunta. Qué quiero cambiar?

[PAUSA 10s]

Si pudiera cambiar una cosa en cómo vivo qué sería?

[PAUSA 30s]

Y sexta pregunta la más importante. Estoy dispuesto a cambiar?

[PAUSA 15s]

No algún día. Ahora.

[PAUSA 30s]

El despertar no es un evento. Es una serie de decisiones diarias de vivir alineado con lo que sabemos que es verdad.

[PAUSA 15s]

[CAMPANA]
  `,

  // Sección IV - Ejercicio 1
  'dialogoConsciente': `
[CAMPANA]

Hoy vas a practicar el diálogo consciente.

[PAUSA 5s]

Elige a alguien con quien tengas una conversación significativa. Puede ser en persona o por video.

[PAUSA 5s]

Antes de empezar toma un momento para prepararte.

[PAUSA 3s]

Cierra los ojos y respira.

[PAUSA 10s]

Establece tu intención. No voy a hablar para impresionar ni para ganar. Voy a hablar para conectar y comprender.

[PAUSA 10s]

Cuando comience la conversación practica la escucha total.

[PAUSA 5s]

No escuches solo para responder. Escucha para comprender.

[PAUSA 5s]

Cuando la otra persona habla no planees tu respuesta. Solo escucha.

[PAUSA 10s]

Mira a los ojos. Nota el lenguaje corporal. Siente el tono emocional detrás de las palabras.

[PAUSA 10s]

Qué está diciendo realmente esta persona? No solo con palabras sino con todo su ser?

[PAUSA 10s]

Cuando hables hazlo desde la autenticidad.

[PAUSA 5s]

No desde lo que crees que deberías decir sino desde lo que realmente piensas y sientes.

[PAUSA 10s]

Usa frases en primera persona. Yo siento. Yo pienso. Yo experimento.

[PAUSA 5s]

No yo siento que tú. Solo yo siento.

[PAUSA 10s]

Si surge desacuerdo no lo evites pero tampoco lo conviertas en batalla.

[PAUSA 5s]

Puedes decir veo esto diferente y eso está bien.

[PAUSA 10s]

Haz preguntas genuinas. Preguntas que realmente quieres saber la respuesta no preguntas retóricas.

[PAUSA 10s]

Por qué piensas eso? Cómo llegaste a esa conclusión? Qué sientes al respecto?

[PAUSA 10s]

Date cuenta de cuando estás en modo defensa. Y respira. Suelta.

[PAUSA 10s]

No hay nada que defender. Solo dos consciencias intentando comprenderse.

[PAUSA 15s]

Al final de la conversación toma un momento.

[PAUSA 5s]

Cómo fue diferente esta conversación de las habituales?

[PAUSA 10s]

Qué descubriste sobre la otra persona?

[PAUSA 10s]

Qué descubriste sobre ti?

[PAUSA 30s]

El diálogo consciente no garantiza acuerdo. Garantiza conexión.

[PAUSA 10s]

Y la conexión es lo que más necesitamos.

[PAUSA 10s]

[CAMPANA]
  `,

  // Sección IV - Ejercicio 2
  'visualizacionFuturo': `
[CAMPANA]

Siéntate cómodamente. Cierra los ojos.

[PAUSA 10s]

Vamos a visualizar el futuro. No a predecirlo sino a crearlo.

[PAUSA 5s]

Respira profundamente varias veces.

[PAUSA 15s]

Ahora imagina que han pasado diez años.

[PAUSA 5s]

Estás en tu vida futura. Una vida en la que has despertado. Una vida consciente intencional alineada.

[PAUSA 10s]

Dónde estás? Qué ves a tu alrededor?

[PAUSA 10s]

No censures. No te preguntes si es posible. Solo visualiza.

[PAUSA 15s]

Con quién estás? Quiénes son las personas importantes en tu vida?

[PAUSA 10s]

Qué haces? Cuál es tu trabajo tu propósito tu contribución?

[PAUSA 15s]

Cómo te sientes en este futuro? Qué emoción predomina?

[PAUSA 15s]

Cómo es tu relación con la tecnología en este futuro?

[PAUSA 10s]

La usas de manera que te empodera? O de manera que te limita?

[PAUSA 10s]

Cómo has crecido? Qué has aprendido? Qué has soltado?

[PAUSA 15s]

Ahora mira hacia atrás desde este futuro hacia el presente.

[PAUSA 5s]

Qué decisión tomaste en los próximos meses que fue crucial para llegar aquí?

[PAUSA 15s]

Qué dejaste de hacer?

[PAUSA 10s]

Qué empezaste a hacer?

[PAUSA 10s]

Con quién dejaste de pasar tiempo?

[PAUSA 10s]

Con quién empezaste a pasar tiempo?

[PAUSA 15s]

Ahora tu yo futuro te habla.

[PAUSA 5s]

Qué te dice? Qué consejo te da?

[PAUSA 30s]

Escucha. No con la mente sino con el corazón.

[PAUSA 30s]

Ahora agradece a tu yo futuro y comienza a regresar.

[PAUSA 5s]

Pero no regresas con las manos vacías.

[PAUSA 5s]

Traes contigo la claridad de lo que quieres crear.

[PAUSA 10s]

Siente tu cuerpo en la silla. Tu respiración. El presente.

[PAUSA 10s]

Mueve suavemente los dedos.

[PAUSA 5s]

Cuando estés listo abre los ojos.

[PAUSA 5s]

Toma papel y escribe. Qué viste? Qué escuchaste? Qué vas a hacer diferente a partir de ahora?

[PAUSA 10s]

El futuro no está escrito. Tú lo escribes con cada decisión cada día.

[PAUSA 10s]

[CAMPANA]
  `
};

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PARA INTEGRAR CON EL SISTEMA EXISTENTE
// ═══════════════════════════════════════════════════════════════════════════════

function createEnhancedGuidedMeditation(exercise, exerciseId) {
  // Mapeo de IDs de ejercicios a scripts
  const scriptMapping = {
    // Sección I - El Código
    'exercise-0-0': 'universoExpansion',         // Meditación sobre el Universo en Expansión
    'exercise-0-1': 'observacionCodigo',         // Observación del Código en lo Cotidiano
    'exercise-0-2': 'conexionUniversal',         // Meditación de Conexión Universal

    // Sección II - La Consciencia
    'exercise-1-0': 'noLinealidadTiempo',        // Exploración de la No-Linealidad del Tiempo
    'exercise-1-1': 'coCreacionIA',              // Práctica de Co-Creación con IA
    'exercise-1-2': 'mapeoEmocional',            // Mapeo del Paisaje Emocional

    // Sección III - La Sombra
    'exercise-2-0': 'dudaConstructiva',          // Práctica de la Duda Constructiva
    'exercise-2-1': 'inventarioMiedos',          // Inventario de Miedos Tecnológicos
    'exercise-2-2': 'contemplacionMuerte',       // Contemplación de la Muerte

    // Sección IV - El Despertar
    'exercise-3-0': 'inventarioEtico',           // Inventario Ético Personal
    'exercise-3-1': 'dialogoConsciente',         // Práctica de Diálogo Consciente
    'exercise-3-2': 'visualizacionFuturo'        // Visualización del Futuro Deseado
  };

  const scriptName = scriptMapping[exerciseId];

  if (scriptName && fullMeditationScripts[scriptName]) {
    const scriptText = fullMeditationScripts[scriptName];
    return parseMeditationScript(scriptText);
  }

  // Si no hay script completo, usar el sistema original
  return createGuidedMeditation(exercise, exerciseId);
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseMeditationScript,
    createEnhancedGuidedMeditation,
    fullMeditationScripts
  };
}
