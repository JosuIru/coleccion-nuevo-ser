/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * EJEMPLO DE USO - Service Layer
 * Ejemplos prácticos de cómo usar los servicios
 *
 * Copia estos ejemplos en la consola del navegador para probarlos
 */

// ============================================================================
// EJEMPLOS BOOKSERVICE
// ============================================================================

/**
 * Ejemplo 1: Obtener y mostrar información de un libro
 */
async function ejemploObtenerLibro() {
  logger.debug('📚 Ejemplo 1: Obtener información de libro');

  const libro = await window.bookService.getBook('codigo-despertar');

  if (libro) {
    logger.debug('✅ Libro encontrado:', {
      id: libro.id,
      titulo: libro.title,
      autor: libro.author,
      descripcion: libro.description?.substring(0, 100) + '...'
    });
  } else {
    logger.debug('❌ Libro no encontrado');
  }
}

/**
 * Ejemplo 2: Gestionar progreso de lectura
 */
async function ejemploProgresoLectura() {
  logger.debug('📖 Ejemplo 2: Gestionar progreso de lectura');

  const bookId = 'codigo-despertar';

  // Obtener progreso actual
  const progreso = await window.bookService.getReadingProgress(null, bookId);
  logger.debug('Progreso actual:', progreso);

  // Actualizar progreso
  const nuevoProgreso = await window.bookService.updateReadingProgress(null, bookId, {
    current_page: progreso.current_page + 1,
    progress_percent: Math.min(100, progreso.progress_percent + 5),
    last_position: {
      chapter: 3,
      section: 2,
      paragraph: 5
    }
  });

  logger.debug('✅ Progreso actualizado:', nuevoProgreso);

  // Obtener estadísticas
  const stats = await window.bookService.getReadingStats();
  logger.debug('📊 Estadísticas de lectura:', stats);
}

/**
 * Ejemplo 3: Gestionar marcadores
 */
async function ejemploMarcadores() {
  logger.debug('🔖 Ejemplo 3: Gestionar marcadores');

  const bookId = 'codigo-despertar';

  // Crear un marcador
  const marcador = await window.bookService.saveBookmark(null, bookId, {
    title: 'Definición de consciencia',
    page: 'capitulo-3',
    position: 'paragraph-12',
    notes: 'Revisar esta definición - muy importante para el ejercicio 5'
  });

  logger.debug('✅ Marcador creado:', marcador);

  // Obtener todos los marcadores
  const marcadores = await window.bookService.getBookmarks(null, bookId);
  logger.debug('📌 Marcadores del libro:', marcadores);

  // Eliminar el marcador de ejemplo
  if (marcador && marcador.id) {
    const eliminado = await window.bookService.deleteBookmark(marcador.id);
    logger.debug(eliminado ? '✅ Marcador eliminado' : '❌ Error eliminando marcador');
  }
}

/**
 * Ejemplo 4: Completar un libro
 */
async function ejemploCompletarLibro() {
  logger.debug('🎉 Ejemplo 4: Completar libro');

  const bookId = 'codigo-despertar';

  const resultado = await window.bookService.completeBook(null, bookId);

  if (resultado) {
    logger.debug('✅ ¡Libro completado!', resultado);
    logger.debug('Progreso: 100%');
    logger.debug('Completado el:', resultado.completed_at);
  } else {
    logger.debug('❌ Error completando libro');
  }
}

/**
 * Ejemplo 5: Obtener todos los libros con progreso
 */
async function ejemploLibrosConProgreso() {
  logger.debug('📚 Ejemplo 5: Libros con progreso');

  const libros = await window.bookService.getBooksWithProgress();

  logger.debug(`Total de libros: ${libros.length}`);

  libros.forEach(libro => {
    const progreso = libro.progress || {};
    logger.debug(`
      📖 ${libro.title}
      Progreso: ${progreso.progress_percent || 0}%
      ${progreso.completed ? '✅ Completado' : '⏳ En progreso'}
    `);
  });
}

// ============================================================================
// EJEMPLOS USERSERVICE
// ============================================================================

/**
 * Ejemplo 6: Obtener perfil del usuario actual
 */
async function ejemploPerfilUsuario() {
  logger.debug('👤 Ejemplo 6: Perfil de usuario');

  const perfil = await window.userService.getCurrentProfile();

  if (perfil) {
    logger.debug('✅ Perfil cargado:', {
      nombre: perfil.full_name,
      email: perfil.email,
      plan: perfil.subscription_tier,
      miembroDesde: perfil.created_at
    });
  } else {
    logger.debug('❌ No hay usuario autenticado');
  }
}

/**
 * Ejemplo 7: Actualizar perfil
 */
async function ejemploActualizarPerfil() {
  logger.debug('✏️ Ejemplo 7: Actualizar perfil');

  const resultado = await window.userService.updateProfile(null, {
    full_name: 'Usuario Actualizado',
    preferences: {
      theme: 'dark',
      notifications: true,
      autoplay: false
    }
  });

  if (resultado) {
    logger.debug('✅ Perfil actualizado:', resultado);
  } else {
    logger.debug('❌ Error actualizando perfil');
  }
}

/**
 * Ejemplo 8: Gestionar logros
 */
async function ejemploLogros() {
  logger.debug('🏆 Ejemplo 8: Gestionar logros');

  // Obtener logros actuales
  const logros = await window.userService.getAchievements();
  logger.debug(`Logros desbloqueados: ${logros.length}`);

  // Desbloquear un nuevo logro
  const nuevoLogro = await window.userService.unlockAchievement(
    null,
    'first_session',
    {
      session_duration: 30,
      books_read: 1,
      timestamp: new Date().toISOString()
    }
  );

  if (nuevoLogro) {
    logger.debug('🎉 ¡Nuevo logro desbloqueado!', nuevoLogro);
  } else {
    logger.debug('Este logro ya estaba desbloqueado o hubo un error');
  }
}

/**
 * Ejemplo 9: Verificar suscripción y características premium
 */
async function ejemploSuscripcion() {
  logger.debug('💎 Ejemplo 9: Verificar suscripción');

  // Obtener información completa de suscripción
  const suscripcion = await window.userService.getSubscription();

  if (suscripcion) {
    logger.debug('Información de suscripción:', {
      plan: suscripcion.tier,
      estado: suscripcion.status,
      caracteristicas: suscripcion.features
    });

    // Verificar si es premium
    const isPremium = await window.userService.isPremium();
    logger.debug(`¿Es premium? ${isPremium ? 'Sí ✅' : 'No ❌'}`);

    // Verificar características específicas
    const tieneAIChat = await window.userService.hasFeature('ai_chat');
    const tieneAITutor = await window.userService.hasFeature('ai_tutor');

    logger.debug(`Chat con IA: ${tieneAIChat ? 'Sí ✅' : 'No ❌'}`);
    logger.debug(`Tutor IA: ${tieneAITutor ? 'Sí ✅' : 'No ❌'}`);
  } else {
    logger.debug('❌ No hay información de suscripción');
  }
}

/**
 * Ejemplo 10: Gestionar créditos de IA
 */
async function ejemploCreditosIA() {
  logger.debug('🤖 Ejemplo 10: Gestionar créditos de IA');

  // Obtener créditos disponibles
  const creditos = await window.userService.getAICredits();

  logger.debug('Créditos de IA:', {
    disponibles: creditos.remaining,
    total: creditos.total,
    porcentaje: Math.round((creditos.remaining / creditos.total) * 100) + '%',
    resetDate: creditos.resetDate
  });

  // Simular uso de 1 crédito
  const decrementado = await window.userService.decrementAICredits(1);

  if (decrementado) {
    logger.debug('✅ Crédito usado. Recargando...');

    // Verificar créditos actualizados
    const creditosActualizados = await window.userService.getAICredits();
    logger.debug('Créditos restantes:', creditosActualizados.remaining);
  }
}

/**
 * Ejemplo 11: Estadísticas completas del usuario
 */
async function ejemploEstadisticasUsuario() {
  logger.debug('📊 Ejemplo 11: Estadísticas completas');

  const stats = await window.userService.getUserStats();

  if (stats) {
    logger.debug('Estadísticas completas:', {
      perfil: {
        nombre: stats.perfil.full_name,
        email: stats.perfil.email
      },
      logros: {
        total: stats.logros.total,
        lista: stats.logros.lista.map(l => l.achievement_key)
      },
      suscripcion: stats.suscripcion.tier,
      miembroDesde: new Date(stats.miembroDesde).toLocaleDateString('es-ES'),
      ultimaActualizacion: new Date(stats.ultimaActualizacion).toLocaleDateString('es-ES')
    });
  }
}

// ============================================================================
// EJEMPLOS DE CARACTERÍSTICAS AVANZADAS
// ============================================================================

/**
 * Ejemplo 12: Gestión de cache
 */
async function ejemploCache() {
  logger.debug('💾 Ejemplo 12: Gestión de cache');

  // Primera llamada - desde DB
  console.time('Primera llamada (DB)');
  const perfil1 = await window.userService.getCurrentProfile();
  console.timeEnd('Primera llamada (DB)');

  // Segunda llamada - desde cache
  console.time('Segunda llamada (Cache)');
  const perfil2 = await window.userService.getCurrentProfile();
  console.timeEnd('Segunda llamada (Cache)');

  logger.debug('¿Mismo objeto?', perfil1 === perfil2);

  // Limpiar cache
  window.userService.limpiarCache();
  logger.debug('✅ Cache limpiado');

  // Tercera llamada - desde DB de nuevo
  console.time('Tercera llamada (DB después de limpiar)');
  const perfil3 = await window.userService.getCurrentProfile();
  console.timeEnd('Tercera llamada (DB después de limpiar)');
}

/**
 * Ejemplo 13: Estadísticas del servicio
 */
function ejemploEstadisticasServicio() {
  logger.debug('📈 Ejemplo 13: Estadísticas de servicios');

  const statsBook = window.bookService.getStats();
  const statsUser = window.userService.getStats();

  logger.debug('BookService:', statsBook);
  logger.debug('UserService:', statsUser);
}

/**
 * Ejemplo 14: Escuchar eventos del servicio
 */
function ejemploEventos() {
  logger.debug('🎧 Ejemplo 14: Escuchar eventos');

  // Escuchar errores
  window.addEventListener('service-error', (event) => {
    console.error('❌ Error en servicio:', event.detail);
  });

  // Escuchar actualizaciones de perfil
  window.addEventListener('profile-updated', (event) => {
    logger.debug('✅ Perfil actualizado:', event.detail.profile);
  });

  // Escuchar logros desbloqueados
  window.addEventListener('achievement-unlocked', (event) => {
    logger.debug('🎉 ¡Nuevo logro!', event.detail.achievement);
  });

  logger.debug('✅ Listeners configurados. Actualiza tu perfil para verlos en acción:');
  logger.debug('await window.userService.updateProfile(null, { full_name: "Test" })');
}

// ============================================================================
// EJECUTAR TODOS LOS EJEMPLOS
// ============================================================================

/**
 * Ejecutar todos los ejemplos en secuencia
 */
async function ejecutarTodosLosEjemplos() {
  logger.debug('🚀 Ejecutando todos los ejemplos...\n');

  // Verificar que el usuario esté autenticado
  if (!window.authHelper?.isAuthenticated()) {
    logger.debug('❌ Debes iniciar sesión primero para ejecutar los ejemplos');
    return;
  }

  try {
    await ejemploObtenerLibro();
    logger.debug('\n---\n');

    await ejemploProgresoLectura();
    logger.debug('\n---\n');

    await ejemploMarcadores();
    logger.debug('\n---\n');

    await ejemploLibrosConProgreso();
    logger.debug('\n---\n');

    await ejemploPerfilUsuario();
    logger.debug('\n---\n');

    await ejemploLogros();
    logger.debug('\n---\n');

    await ejemploSuscripcion();
    logger.debug('\n---\n');

    await ejemploCreditosIA();
    logger.debug('\n---\n');

    await ejemploEstadisticasUsuario();
    logger.debug('\n---\n');

    await ejemploCache();
    logger.debug('\n---\n');

    ejemploEstadisticasServicio();
    logger.debug('\n---\n');

    logger.debug('✅ Todos los ejemplos ejecutados correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando ejemplos:', error);
  }
}

// ============================================================================
// EXPORTAR EJEMPLOS
// ============================================================================

window.ejemplosServicios = {
  // BookService
  obtenerLibro: ejemploObtenerLibro,
  progresoLectura: ejemploProgresoLectura,
  marcadores: ejemploMarcadores,
  completarLibro: ejemploCompletarLibro,
  librosConProgreso: ejemploLibrosConProgreso,

  // UserService
  perfilUsuario: ejemploPerfilUsuario,
  actualizarPerfil: ejemploActualizarPerfil,
  logros: ejemploLogros,
  suscripcion: ejemploSuscripcion,
  creditosIA: ejemploCreditosIA,
  estadisticasUsuario: ejemploEstadisticasUsuario,

  // Avanzado
  cache: ejemploCache,
  estadisticasServicio: ejemploEstadisticasServicio,
  eventos: ejemploEventos,

  // Ejecutar todos
  todos: ejecutarTodosLosEjemplos
};

logger.debug(`
📚 EJEMPLOS DE USO - SERVICE LAYER

Para ejecutar un ejemplo, usa:
  await window.ejemplosServicios.obtenerLibro()
  await window.ejemplosServicios.progresoLectura()
  await window.ejemplosServicios.marcadores()
  await window.ejemplosServicios.perfilUsuario()
  await window.ejemplosServicios.suscripcion()

Para ejecutar todos los ejemplos:
  await window.ejemplosServicios.todos()

Para ver la lista completa:
  logger.debug(Object.keys(window.ejemplosServicios))
`);
