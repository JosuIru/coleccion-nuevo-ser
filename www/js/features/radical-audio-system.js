// ═══════════════════════════════════════════════════════════════════════════════
// SISTEMA DE AUDIO PARA PRÁCTICAS RADICALES
// Maneja meditaciones guiadas con tono grave, silencios incómodos, sin cierres
// ═══════════════════════════════════════════════════════════════════════════════

// Estado global
let radicalAudioStates = {}; // {practiceId: {isPlaying, isPaused, currentStep, meditation}}
let radicalUtterances = {};
let radicalTimers = {};
let currentLanguage = 'es';
let currentSpeed = 0.9; // Más lento para prácticas radicales

// Iniciar meditación radical
function playRadicalAudio(practiceId) {
  // Detener cualquier otra meditación
  stopAllRadicalAudio();

  // Verificar si hay script disponible
  if (typeof createRadicalMeditation !== 'function') {
    console.warn('radical-meditation-parser.js no cargado');
    return;
  }

  const meditation = createRadicalMeditation(practiceId);

  if (!meditation || meditation.length === 0) {
    window.toast.info('error.noAudioGuided');
    return;
  }

  // Crear estado
  radicalAudioStates[practiceId] = {
    isPlaying: true,
    isPaused: false,
    currentStep: 0,
    totalSteps: meditation.length,
    startTime: Date.now(),
    meditation: meditation
  };

  // Iniciar primer paso
  playRadicalStep(practiceId, 0);
  updateRadicalUI(practiceId);
}

// Reproducir paso individual
function playRadicalStep(practiceId, stepIndex) {
  const state = radicalAudioStates[practiceId];
  if (!state || stepIndex >= state.meditation.length) {
    stopRadicalAudio(practiceId);
    return;
  }

  const step = state.meditation[stepIndex];
  state.currentStep = stepIndex;

  // Manejar silencios incómodos
  if (step.type === 'uncomfortable_silence') {
    // Solo pausa, sin narración
    if (step.pause > 0) {
      radicalTimers[practiceId] = setTimeout(() => {
        if (state.isPlaying) {
          playRadicalStep(practiceId, stepIndex + 1);
        }
      }, step.pause);
    } else {
      playRadicalStep(practiceId, stepIndex + 1);
    }
    return;
  }

  // Paso de narración
  if (!step.text || step.text.trim() === '') {
    // Solo pausa
    if (step.pause > 0) {
      radicalTimers[practiceId] = setTimeout(() => {
        if (state.isPlaying) {
          playRadicalStep(practiceId, stepIndex + 1);
        }
      }, step.pause);
    } else {
      playRadicalStep(practiceId, stepIndex + 1);
    }
    return;
  }

  // Crear utterance
  const utterance = new SpeechSynthesisUtterance(step.text);
  utterance.lang = currentLanguage === 'es' ? 'es-ES' : 'en-US';

  // Ajustar velocidad y tono según tipo
  if (step.toneGrave) {
    utterance.rate = 0.8; // Más lento para tono grave
    utterance.pitch = 0.8; // Más grave
  } else {
    utterance.rate = currentSpeed;
    utterance.pitch = 1.0;
  }

  utterance.onend = () => {
    if (!state.isPlaying) return;

    // Pausa después del texto
    if (step.pause > 0) {
      radicalTimers[practiceId] = setTimeout(() => {
        if (state.isPlaying) {
          playRadicalStep(practiceId, stepIndex + 1);
        }
      }, step.pause);
    } else {
      playRadicalStep(practiceId, stepIndex + 1);
    }
  };

  utterance.onerror = () => {
    console.error('Error en síntesis de voz radical');
    stopRadicalAudio(practiceId);
  };

  radicalUtterances[practiceId] = utterance;
  window.speechSynthesis.speak(utterance);
}

// Pausar meditación
function pauseRadicalAudio(practiceId) {
  const state = radicalAudioStates[practiceId];
  if (!state) return;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }

  if (radicalTimers[practiceId]) {
    clearTimeout(radicalTimers[practiceId]);
  }

  state.isPlaying = false;
  state.isPaused = true;
  updateRadicalUI(practiceId);
}

// Reanudar meditación
function resumeRadicalAudio(practiceId) {
  const state = radicalAudioStates[practiceId];
  if (!state) return;

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  } else {
    // Continuar desde paso actual
    playRadicalStep(practiceId, state.currentStep);
  }

  state.isPlaying = true;
  state.isPaused = false;
  updateRadicalUI(practiceId);
}

// Detener meditación
function stopRadicalAudio(practiceId) {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  if (radicalTimers[practiceId]) {
    clearTimeout(radicalTimers[practiceId]);
    delete radicalTimers[practiceId];
  }

  if (radicalUtterances[practiceId]) {
    delete radicalUtterances[practiceId];
  }

  delete radicalAudioStates[practiceId];
  updateRadicalUI(practiceId);
}

// Detener todas las meditaciones
function stopAllRadicalAudio() {
  Object.keys(radicalAudioStates).forEach(id => {
    stopRadicalAudio(id);
  });
}

// Actualizar UI de botones
function updateRadicalUI(practiceId) {
  const state = radicalAudioStates[practiceId];
  const playBtn = document.querySelector(`#${practiceId} .audio-btn-play`);
  const pauseBtn = document.querySelector(`#${practiceId} .audio-btn-pause`);
  const stopBtn = document.querySelector(`#${practiceId} .audio-btn-stop`);

  if (playBtn && pauseBtn && stopBtn) {
    if (state && state.isPlaying && !state.isPaused) {
      playBtn.disabled = true;
      playBtn.textContent = '▶ Reproduciendo...';
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
    } else if (state && state.isPaused) {
      playBtn.disabled = false;
      playBtn.textContent = '▶ Continuar';
      pauseBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      playBtn.disabled = false;
      playBtn.textContent = '▶ Iniciar Meditación';
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
    }
  }
}

// Cleanup al salir
window.addEventListener('beforeunload', () => {
  stopAllRadicalAudio();
});
