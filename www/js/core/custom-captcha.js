/**
 * Custom CAPTCHA - Beautiful & Themed
 * Un CAPTCHA personalizado que encaja con el diseño de Colección Nuevo Ser
 */

class CustomCaptcha {
    constructor(containerId) {
        this.containerId = containerId;
        this.verified = false;
        this.currentChallenge = null;
        this.challenges = [
            { type: 'slider', difficulty: 'easy' },
            { type: 'pattern', difficulty: 'medium' },
            { type: 'question', difficulty: 'easy' }
        ];
    }

    /**
     * Renderiza el CAPTCHA en el contenedor
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Seleccionar desafío aleatorio
        this.currentChallenge = this.challenges[Math.floor(Math.random() * this.challenges.length)];

        let html = '';

        switch (this.currentChallenge.type) {
            case 'slider':
                html = this.renderSliderCaptcha();
                break;
            case 'pattern':
                html = this.renderPatternCaptcha();
                break;
            case 'question':
                html = this.renderQuestionCaptcha();
                break;
        }

        container.innerHTML = html;
        this.attachListeners();
    }

    /**
     * CAPTCHA tipo Slider - Desliza para verificar
     */
    renderSliderCaptcha() {
        return `
            <div class="custom-captcha bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-300">🔒 Verifica que eres humano</span>
                    <span id="captcha-status" class="text-xs text-gray-500"></span>
                </div>
                <div class="captcha-slider-track relative h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-600">
                    <div id="captcha-slider-fill" class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-500 w-0 transition-all"></div>
                    <div id="captcha-slider-thumb" class="absolute top-1/2 -translate-y-1/2 left-1 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span class="text-sm text-gray-400 font-medium">Desliza para verificar →</span>
                    </div>
                </div>
                <div id="captcha-success" class="hidden mt-2 text-center text-green-400 text-sm">
                    ✓ Verificado correctamente
                </div>
            </div>
        `;
    }

    /**
     * CAPTCHA tipo Pattern - Selecciona el patrón correcto
     */
    renderPatternCaptcha() {
        const patterns = [
            { correct: '🌙', options: ['🌙', '☀️', '⭐', '🌟'] },
            { correct: '📚', options: ['📚', '📖', '📝', '✍️'] },
            { correct: '🧠', options: ['🧠', '💡', '🔮', '✨'] }
        ];

        const selected = patterns[Math.floor(Math.random() * patterns.length)];
        this.correctPattern = selected.correct;

        // Mezclar opciones
        const shuffled = selected.options.sort(() => Math.random() - 0.5);

        return `
            <div class="custom-captcha bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div class="text-center mb-3">
                    <span class="text-sm text-gray-300">🔒 Selecciona el símbolo correcto:</span>
                    <div class="text-4xl my-2">${this.correctPattern}</div>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    ${shuffled.map(pattern => `
                        <button type="button" class="captcha-pattern-btn text-3xl p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-all hover:scale-110" data-pattern="${pattern}">
                            ${pattern}
                        </button>
                    `).join('')}
                </div>
                <div id="captcha-success" class="hidden mt-3 text-center text-green-400 text-sm">
                    ✓ ¡Correcto! Verificado
                </div>
                <div id="captcha-error" class="hidden mt-3 text-center text-red-400 text-sm">
                    ✗ Incorrecto, intenta de nuevo
                </div>
            </div>
        `;
    }

    /**
     * CAPTCHA tipo Pregunta - Responde una pregunta simple
     */
    renderQuestionCaptcha() {
        const questions = [
            { q: '¿Cuántos libros hay en una biblioteca? (número)', a: /\d+/ },
            { q: '¿De qué color es el cielo? (azul/blue)', a: /(azul|blue)/i },
            { q: '¿Cuántas letras tiene "libro"? (número)', a: /5/ },
            { q: '¿Qué viene después del día? (noche/night)', a: /(noche|night)/i }
        ];

        this.currentQuestion = questions[Math.floor(Math.random() * questions.length)];

        return `
            <div class="custom-captcha bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div class="text-center mb-3">
                    <span class="text-sm text-gray-300">🔒 Responde para verificar:</span>
                </div>
                <div class="mb-3">
                    <label class="block text-sm text-gray-300 mb-2">${this.currentQuestion.q}</label>
                    <input type="text" id="captcha-answer"
                           class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                           placeholder="Tu respuesta...">
                </div>
                <button type="button" id="captcha-verify-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition">
                    Verificar
                </button>
                <div id="captcha-success" class="hidden mt-3 text-center text-green-400 text-sm">
                    ✓ ¡Correcto! Verificado
                </div>
                <div id="captcha-error" class="hidden mt-3 text-center text-red-400 text-sm">
                    ✗ Respuesta incorrecta
                </div>
            </div>
        `;
    }

    /**
     * Adjuntar listeners según el tipo de CAPTCHA
     */
    attachListeners() {
        switch (this.currentChallenge.type) {
            case 'slider':
                this.attachSliderListeners();
                break;
            case 'pattern':
                this.attachPatternListeners();
                break;
            case 'question':
                this.attachQuestionListeners();
                break;
        }
    }

    /**
     * Listeners para Slider CAPTCHA
     */
    attachSliderListeners() {
        const thumb = document.getElementById('captcha-slider-thumb');
        const track = thumb.parentElement;
        const fill = document.getElementById('captcha-slider-fill');

        let isDragging = false;
        let currentX = 0;

        const onStart = (_e) => {
            isDragging = true;
            thumb.style.cursor = 'grabbing';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const rect = track.getBoundingClientRect();
            const maxX = rect.width - thumb.offsetWidth;
            currentX = Math.max(0, Math.min(clientX - rect.left - thumb.offsetWidth / 2, maxX));

            thumb.style.left = currentX + 'px';
            fill.style.width = (currentX + thumb.offsetWidth / 2) + 'px';

            // Calcular progreso
            const progress = currentX / maxX;
            if (progress > 0.95) {
                this.onVerified();
            }
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            thumb.style.cursor = 'grab';

            // Si no llegó al final, resetear
            const rect = track.getBoundingClientRect();
            const maxX = rect.width - thumb.offsetWidth;
            const progress = currentX / maxX;

            if (progress < 0.95) {
                thumb.style.left = '4px';
                fill.style.width = '0';
                currentX = 0;
            }
        };

        thumb.addEventListener('mousedown', onStart);
        thumb.addEventListener('touchstart', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    /**
     * Listeners para Pattern CAPTCHA
     */
    attachPatternListeners() {
        const buttons = document.querySelectorAll('.captcha-pattern-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const selected = btn.getAttribute('data-pattern');
                if (selected === this.correctPattern) {
                    this.onVerified();
                } else {
                    this.onError();
                }
            });
        });
    }

    /**
     * Listeners para Question CAPTCHA
     */
    attachQuestionListeners() {
        const verifyBtn = document.getElementById('captcha-verify-btn');
        const answerInput = document.getElementById('captcha-answer');

        const verify = () => {
            const answer = answerInput.value.trim();
            if (this.currentQuestion.a.test(answer)) {
                this.onVerified();
            } else {
                this.onError();
            }
        };

        verifyBtn.addEventListener('click', verify);
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                verify();
            }
        });
    }

    /**
     * Llamado cuando se verifica correctamente
     */
    onVerified() {
        this.verified = true;
        const success = document.getElementById('captcha-success');
        const error = document.getElementById('captcha-error');

        if (success) success.classList.remove('hidden');
        if (error) error.classList.add('hidden');

        // Deshabilitar interacción
        const container = document.getElementById(this.containerId);
        if (container) {
            container.style.pointerEvents = 'none';
            container.style.opacity = '0.7';
        }

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('captcha-verified'));
    }

    /**
     * Llamado cuando hay un error
     */
    onError() {
        const error = document.getElementById('captcha-error');
        const success = document.getElementById('captcha-success');

        if (error) {
            error.classList.remove('hidden');
            setTimeout(() => error.classList.add('hidden'), 2000);
        }
        if (success) success.classList.add('hidden');
    }

    /**
     * Verifica si el CAPTCHA está verificado
     */
    isVerified() {
        return this.verified;
    }

    /**
     * Resetear el CAPTCHA
     */
    reset() {
        this.verified = false;
        this.render();
    }
}

// Exportar
window.CustomCaptcha = CustomCaptcha;
