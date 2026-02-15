/**
 * ENTITY DONATION MODAL
 * Modal para donar a entidades del mapa de transicion
 *
 * Features:
 * - Donaciones en EUR (Stripe/PayPal) o BTC
 * - BTC DESCENTRALIZADO (P2P): Pago directo a wallet de entidad verificada
 * - EUR con escrow: Para pagos fiat que requieren intermediario
 * - Mensaje de apoyo opcional
 * - Historial de donaciones del usuario
 *
 * Modos de donacion:
 * - P2P (Bitcoin): Pago directo a la entidad, sin intermediario
 * - Escrow (Stripe/PayPal): Fondos en custodia hasta verificacion
 *
 * @version 2.0.1 - Añadido fallbacks para logger/toast
 * @created 2025-01-15
 */

// Fallback para logger si no existe
if (typeof window.logger === 'undefined') {
  window.logger = {
    debug: (...args) => console.log('[EntityDonation]', ...args),
    info: (...args) => console.info('[EntityDonation]', ...args),
    warn: (...args) => console.warn('[EntityDonation]', ...args),
    error: (...args) => console.error('[EntityDonation]', ...args)
  };
}

// Fallback para toast si no existe
if (typeof window.toast === 'undefined') {
  window.toast = {
    success: (msg) => alert('✓ ' + msg),
    error: (msg) => alert('✗ ' + msg),
    info: (msg) => alert('ℹ ' + msg),
    warning: (msg) => alert('⚠ ' + msg)
  };
}

class EntityDonationModal {
  constructor() {
    this.currentEntity = null;
    this.selectedAmount = null;
    this.selectedMethod = 'stripe';
    this.donorInfo = {};
    this.btcPrice = 95000; // Precio BTC en EUR (se actualiza dinamicamente)
    this.donationMode = 'escrow'; // 'p2p' para BTC directo, 'escrow' para fondos custodiados

    // Montos sugeridos en EUR
    this.suggestedAmounts = [5, 10, 25, 50, 100];

    // Direccion BTC de escrow (fallback si entidad no tiene direccion)
    this.escrowBtcAddress = 'bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7';

    this.init();
  }

  init() {
    logger.debug('EntityDonationModal initialized');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ABRIR/CERRAR MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  async show(entity) {
    console.log('[EntityDonationModal] show() called with entity:', entity);

    if (!entity) {
      console.error('[EntityDonationModal] No entity provided');
      window.toast?.error('Entidad no especificada');
      return;
    }

    this.currentEntity = entity;
    this.selectedAmount = null;
    this.selectedMethod = 'stripe';

    // ═══════════════════════════════════════════════════════════════════════════
    // VERIFICAR NIVEL DE LA ENTIDAD
    // ═══════════════════════════════════════════════════════════════════════════

    // Usar el sistema de verificación si está disponible
    if (window.entityVerificationSystem) {
      console.log('[EntityDonationModal] Checking verification status...');
      const verificationStatus = await window.entityVerificationSystem.getEntityVerificationStatus(entity.id);
      this.verificationStatus = verificationStatus;

      // Si está baneada, no permitir donaciones
      if (verificationStatus.isBanned) {
        window.toast?.error('Esta entidad ha sido marcada como fraudulenta');
        return;
      }

      // Si no está verificada (nivel 0), mostrar modal de intención
      if (verificationStatus.level === 0) {
        console.log('[EntityDonationModal] Entity not verified, showing intent modal');
        if (window.donationIntentModal) {
          window.donationIntentModal.show(entity);
        } else {
          // Fallback: mostrar mensaje explicativo
          this.renderNotVerifiedMessage(verificationStatus);
        }
        return;
      }

      // Si tiene disputas activas, pausar donaciones
      if (verificationStatus.activeDisputes > 0) {
        window.toast?.warning('Esta entidad tiene disputas activas. Las donaciones están pausadas.');
        return;
      }

      // Guardar límites según nivel
      this.maxAmount = this.getMaxAmountForLevel(verificationStatus.level);
      this.remainingCapacity = this.maxAmount ? (this.maxAmount - verificationStatus.totalReceived) : null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURAR MODO DE DONACIÓN
    // ═══════════════════════════════════════════════════════════════════════════

    // Detectar modo de donacion:
    // - P2P: Si entidad esta verificada Y tiene direccion BTC (Bitcoin descentralizado)
    // - Escrow: Para cualquier otro caso (Stripe/PayPal o BTC sin verificar)
    const level = this.verificationStatus?.level || (entity.is_verified ? 1 : 0);
    this.donationMode = (level >= 1 && entity.btc_address) ? 'p2p' : 'escrow';

    // Si hay modo P2P disponible, BTC es la opcion recomendada
    if (this.donationMode === 'p2p') {
      this.selectedMethod = 'btc';
    }

    // Pre-cargar info del usuario si esta logueado
    const user = window.authHelper?.getUser();
    const profile = window.authHelper?.getProfile();
    this.donorInfo = {
      id: user?.id,
      name: profile?.full_name || '',
      email: user?.email || ''
    };

    // Obtener precio BTC actualizado
    try {
      await this.fetchBtcPrice();
      console.log('[EntityDonationModal] BTC price fetched:', this.btcPrice);
    } catch (e) {
      console.error('[EntityDonationModal] Error fetching BTC price:', e);
    }

    console.log('[EntityDonationModal] Calling render()...');
    try {
      this.render();
      console.log('[EntityDonationModal] Modal rendered');
    } catch (e) {
      console.error('[EntityDonationModal] Error rendering modal:', e);
    }

    console.log('[EntityDonationModal] Attaching events...');
    this.attachEvents();
    console.log('[EntityDonationModal] show() complete');
  }

  /**
   * Obtener límite máximo según nivel de verificación
   */
  getMaxAmountForLevel(level) {
    const limits = { 0: 0, 1: 100, 2: 1000, 3: null };
    return limits[level] ?? 0;
  }

  /**
   * Renderizar mensaje cuando la entidad no está verificada
   */
  renderNotVerifiedMessage(verificationStatus) {
    const existing = document.getElementById('entity-donation-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'entity-donation-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="document.getElementById('entity-donation-modal').remove()"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-white/10">
        <div class="text-center">
          <div class="text-5xl mb-4">⏳</div>
          <h2 class="text-xl font-bold text-white mb-2">Entidad Pendiente de Verificación</h2>
          <p class="text-slate-400 mb-4">
            <strong class="text-white">${this.escapeHtml(this.currentEntity.name)}</strong>
            aún no está verificada y no puede recibir donaciones directamente.
          </p>

          ${verificationStatus.totalPending > 0 ? `
            <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
              <p class="text-green-400 text-sm">
                💚 <strong>${verificationStatus.endorsementCount || 0}</strong> personas ya quieren donar
                (€${verificationStatus.totalPending?.toFixed(2) || 0} pendientes)
              </p>
            </div>
          ` : ''}

          <p class="text-slate-500 text-sm mb-6">
            Puedes registrar tu intención de donar. Te notificaremos cuando la entidad
            complete su verificación.
          </p>

          <div class="flex gap-3">
            <button onclick="document.getElementById('entity-donation-modal').remove()"
                    class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
              Cerrar
            </button>
            <button onclick="document.getElementById('entity-donation-modal').remove(); window.donationIntentModal?.show(window.entityDonationModal.currentEntity)"
                    class="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors">
              Registrar Intención
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Obtener precio actual de BTC
   */
  async fetchBtcPrice() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
      const data = await response.json();
      this.btcPrice = data.bitcoin?.eur || 95000;
    } catch (error) {
      logger.warn('[EntityDonation] Error fetching BTC price:', error);
      this.btcPrice = 95000; // Fallback
    }
  }

  close() {
    const modal = document.getElementById('entity-donation-modal');
    if (modal) {
      modal.classList.add('opacity-0', 'scale-95');
      setTimeout(() => modal.remove(), 200);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERIZADO
  // ═══════════════════════════════════════════════════════════════════════════

  render() {
    const existing = document.getElementById('entity-donation-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'entity-donation-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-200';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="donation-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 transform transition-all duration-200">

        <!-- Header -->
        <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 border-b border-white/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl">
                ${this.getCategoryEmoji(this.currentEntity.category)}
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">${this.escapeHtml(this.currentEntity.name)}</h2>
                <div class="flex items-center gap-2">
                  <p class="text-sm text-emerald-400">${this.currentEntity.category}</p>
                  ${this.renderVerificationBadge()}
                </div>
              </div>
            </div>
            <button id="donation-close" class="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          ${this.renderCapacityWarning()}
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <!-- Descripcion -->
          ${this.currentEntity.description ? `
            <p class="text-slate-300 text-sm mb-6">${this.escapeHtml(this.currentEntity.description)}</p>
          ` : ''}

          <!-- Seleccion de monto -->
          <div class="mb-6">
            <label class="block text-sm text-slate-400 mb-2">Cantidad a donar</label>
            <div class="grid grid-cols-5 gap-2 mb-3">
              ${this.suggestedAmounts.map(amount => `
                <button class="amount-btn px-3 py-2 rounded-lg border transition-all text-sm font-medium
                  ${this.selectedAmount === amount
                    ? 'bg-emerald-500 border-emerald-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}"
                  data-amount="${amount}">
                  ${amount}€
                </button>
              `).join('')}
            </div>
            <div class="flex items-center gap-2">
              <input type="number" id="custom-amount" placeholder="Otra cantidad"
                     class="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                     min="1" step="0.01">
              <span class="text-slate-400">EUR</span>
            </div>
          </div>

          <!-- Metodo de pago -->
          <div class="mb-6">
            <label class="block text-sm text-slate-400 mb-2">Metodo de pago</label>
            <div class="grid grid-cols-3 gap-2">
              <button class="method-btn flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                ${this.selectedMethod === 'stripe' ? 'bg-purple-500/20 border-purple-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}"
                data-method="stripe">
                <span class="text-2xl">💳</span>
                <span class="text-xs ${this.selectedMethod === 'stripe' ? 'text-purple-400' : 'text-slate-400'}">Tarjeta</span>
              </button>
              <button class="method-btn flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                ${this.selectedMethod === 'paypal' ? 'bg-blue-500/20 border-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}"
                data-method="paypal">
                <span class="text-2xl">🅿️</span>
                <span class="text-xs ${this.selectedMethod === 'paypal' ? 'text-blue-400' : 'text-slate-400'}">PayPal</span>
              </button>
              <button class="method-btn flex flex-col items-center gap-2 p-3 rounded-lg border transition-all relative
                ${this.selectedMethod === 'btc' ? 'bg-orange-500/20 border-orange-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}"
                data-method="btc">
                ${this.donationMode === 'p2p' ? '<span class="absolute -top-1 -right-1 px-1.5 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded-full">P2P</span>' : ''}
                <span class="text-2xl">₿</span>
                <span class="text-xs ${this.selectedMethod === 'btc' ? 'text-orange-400' : 'text-slate-400'}">Bitcoin</span>
              </button>
            </div>
            ${this.donationMode === 'p2p' && this.selectedMethod === 'btc' ? `
              <div class="mt-2 text-xs text-green-400 flex items-center gap-1">
                <span>✓</span>
                <span>Pago directo P2P - Sin intermediarios</span>
              </div>
            ` : ''}
          </div>

          <!-- Info del donador -->
          <div class="mb-6 space-y-3">
            <div>
              <label class="block text-sm text-slate-400 mb-1">Tu nombre (opcional)</label>
              <input type="text" id="donor-name" value="${this.escapeHtml(this.donorInfo.name)}"
                     placeholder="Anonimo"
                     class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">Email (para recibir confirmacion)</label>
              <input type="email" id="donor-email" value="${this.escapeHtml(this.donorInfo.email)}"
                     placeholder="tu@email.com"
                     class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1">Mensaje de apoyo (opcional)</label>
              <textarea id="donor-message" rows="2" placeholder="Escribe un mensaje para la entidad..."
                        class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"></textarea>
            </div>
          </div>

          <!-- Info segun modo -->
          ${this.renderDonationModeInfo()}
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-white/10 bg-slate-900/50">
          <button id="donate-btn" class="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            <span>💚</span>
            <span id="donate-btn-text">Selecciona una cantidad</span>
          </button>
          <p class="text-center text-xs text-slate-500 mt-2">
            100% de tu donacion va a la entidad
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Renderiza la info segun el modo de donacion
   */
  renderDonationModeInfo() {
    // Modo P2P para BTC verificado
    if (this.donationMode === 'p2p' && this.selectedMethod === 'btc') {
      return `
        <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <div class="flex items-start gap-3">
            <span class="text-2xl">⚡</span>
            <div>
              <h4 class="text-green-400 font-medium mb-1">Pago Descentralizado P2P</h4>
              <p class="text-slate-400 text-xs">
                Esta entidad esta <strong class="text-green-400">verificada</strong>. Tu donacion ira
                <strong>directamente</strong> a su wallet Bitcoin, sin intermediarios.
                Los fondos llegaran instantaneamente tras confirmar en blockchain.
              </p>
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Sin custodia</span>
                <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">100% directo</span>
                <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Trustless</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Modo escrow para Stripe/PayPal o BTC sin verificar
    return `
      <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🔒</span>
          <div>
            <h4 class="text-emerald-400 font-medium mb-1">Sistema de custodia seguro</h4>
            <p class="text-slate-400 text-xs">
              ${this.currentEntity.is_verified
                ? 'Para pagos con tarjeta o PayPal, los fondos pasan por nuestro sistema seguro.'
                : 'Tu donacion quedara en custodia hasta que la entidad verifique su identidad.'}
              ${!this.currentEntity.is_verified
                ? ' Si la entidad no reclama los fondos en 30 dias, se te devolvera el dinero.'
                : ''}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  attachEvents() {
    // Cerrar
    document.getElementById('donation-close')?.addEventListener('click', () => this.close());
    document.getElementById('donation-backdrop')?.addEventListener('click', () => this.close());

    // Seleccion de monto
    document.querySelectorAll('.amount-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseFloat(btn.dataset.amount);
        this.selectAmount(amount);
        document.getElementById('custom-amount').value = '';
      });
    });

    // Monto personalizado
    document.getElementById('custom-amount')?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (value > 0) {
        this.selectAmount(value);
        document.querySelectorAll('.amount-btn').forEach(btn => {
          btn.classList.remove('bg-emerald-500', 'border-emerald-400', 'text-white');
          btn.classList.add('bg-white/5', 'border-white/10', 'text-slate-300');
        });
      }
    });

    // Seleccion de metodo
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectMethod(btn.dataset.method);
      });
    });

    // Boton donar
    document.getElementById('donate-btn')?.addEventListener('click', () => this.processDonation());
  }

  selectAmount(amount) {
    this.selectedAmount = amount;

    // Actualizar UI
    document.querySelectorAll('.amount-btn').forEach(btn => {
      const btnAmount = parseFloat(btn.dataset.amount);
      if (btnAmount === amount) {
        btn.classList.add('bg-emerald-500', 'border-emerald-400', 'text-white');
        btn.classList.remove('bg-white/5', 'border-white/10', 'text-slate-300');
      } else {
        btn.classList.remove('bg-emerald-500', 'border-emerald-400', 'text-white');
        btn.classList.add('bg-white/5', 'border-white/10', 'text-slate-300');
      }
    });

    this.updateDonateButton();
  }

  selectMethod(method) {
    this.selectedMethod = method;

    document.querySelectorAll('.method-btn').forEach(btn => {
      const isSelected = btn.dataset.method === method;
      const colors = {
        stripe: ['purple', 'bg-purple-500/20', 'border-purple-400', 'text-purple-400'],
        paypal: ['blue', 'bg-blue-500/20', 'border-blue-400', 'text-blue-400'],
        btc: ['orange', 'bg-orange-500/20', 'border-orange-400', 'text-orange-400']
      };
      const [_, bgClass, borderClass, textClass] = colors[btn.dataset.method];

      btn.classList.remove('bg-purple-500/20', 'bg-blue-500/20', 'bg-orange-500/20',
                           'border-purple-400', 'border-blue-400', 'border-orange-400');
      btn.querySelector('span:last-child')?.classList.remove('text-purple-400', 'text-blue-400', 'text-orange-400');

      if (isSelected) {
        btn.classList.add(bgClass, borderClass);
        btn.querySelector('span:last-child')?.classList.add(textClass);
      } else {
        btn.classList.add('bg-white/5', 'border-white/10');
        btn.querySelector('span:last-child')?.classList.add('text-slate-400');
      }
    });

    // Re-renderizar info de modo de donacion
    this.updateDonationModeInfo();
    this.updateDonateButton();
  }

  updateDonationModeInfo() {
    // Encontrar y actualizar el contenedor de info
    const infoContainers = document.querySelectorAll('#entity-donation-modal .overflow-y-auto > div:last-child');
    const lastContainer = infoContainers[infoContainers.length - 1];

    if (lastContainer && (lastContainer.classList.contains('bg-green-500/10') || lastContainer.classList.contains('bg-emerald-500/10'))) {
      lastContainer.outerHTML = this.renderDonationModeInfo();
    }
  }

  updateDonateButton() {
    const btn = document.getElementById('donate-btn');
    const text = document.getElementById('donate-btn-text');

    if (this.selectedAmount && this.selectedAmount > 0) {
      btn.disabled = false;
      const methodLabels = { stripe: 'con tarjeta', paypal: 'con PayPal', btc: 'con Bitcoin' };
      text.textContent = `Donar ${this.selectedAmount}€ ${methodLabels[this.selectedMethod]}`;
    } else {
      btn.disabled = true;
      text.textContent = 'Selecciona una cantidad';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESAR DONACION
  // ═══════════════════════════════════════════════════════════════════════════

  async processDonation() {
    if (!this.selectedAmount || this.selectedAmount <= 0) {
      window.toast?.error('Selecciona una cantidad valida');
      return;
    }

    const donorName = document.getElementById('donor-name')?.value.trim();
    const donorEmail = document.getElementById('donor-email')?.value.trim();
    const donorMessage = document.getElementById('donor-message')?.value.trim();

    // Validar email si se proporciona
    if (donorEmail && !this.isValidEmail(donorEmail)) {
      window.toast?.error('Email no valido');
      return;
    }

    const btn = document.getElementById('donate-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>';

    try {
      // Crear donacion en el backend
      const response = await fetch('https://gailu.net/api/create-entity-donation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: this.currentEntity.id,
          amount: this.selectedAmount,
          currency: 'EUR',
          paymentMethod: this.selectedMethod,
          donorId: this.donorInfo.id,
          donorName: donorName || 'Anonimo',
          donorEmail,
          donorMessage
        })
      });

      if (!response.ok) {
        throw new Error('Error creando donacion');
      }

      const data = await response.json();

      // Procesar segun metodo de pago
      switch (this.selectedMethod) {
        case 'stripe':
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            window.toast?.info('Stripe no disponible. Usa Bitcoin.');
          }
          break;

        case 'paypal':
          if (data.paypalUrl) {
            window.open(data.paypalUrl, '_blank');
          }
          this.showPaypalConfirmation(data.donationId);
          break;

        case 'btc':
          this.showBtcPayment(data);
          break;
      }

    } catch (error) {
      console.error('[EntityDonation] Error:', error);

      // FALLBACK: Si el servidor no responde, usar modo offline para BTC
      if (this.selectedMethod === 'btc') {
        console.log('[EntityDonation] Usando modo fallback para BTC');
        const btcAmount = this.selectedAmount / this.btcPrice;
        const btcAddress = this.currentEntity.btc_address || this.escrowBtcAddress;

        this.showBtcPayment({
          donationId: 'offline_' + Date.now(),
          btcAmount: btcAmount.toFixed(8),
          btcAddress: btcAddress,
          isP2P: !!(this.currentEntity.btc_address && this.currentEntity.is_verified)
        });
      } else {
        // Para Stripe/PayPal sin servidor, sugerir BTC
        window.toast?.error('Servidor no disponible. Usa Bitcoin para donar.');
        btn.disabled = false;
        btn.innerHTML = '<span>💚</span><span>Reintentar</span>';
      }
    }
  }

  showBtcPayment(data) {
    const content = document.querySelector('#entity-donation-modal .overflow-y-auto');
    if (!content) return;

    // Determinar si es P2P (directo a entidad) o escrow
    const isP2P = this.donationMode === 'p2p' && this.currentEntity.btc_address;
    const btcAddress = isP2P ? this.currentEntity.btc_address : this.escrowBtcAddress;

    content.innerHTML = `
      <div class="text-center py-6">
        <div class="text-5xl mb-4">${isP2P ? '⚡' : '₿'}</div>
        <h3 class="text-xl font-bold text-white mb-2">
          ${isP2P ? 'Pago Directo P2P' : 'Pago con Bitcoin'}
        </h3>

        ${isP2P ? `
          <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 text-left">
            <div class="flex items-center gap-2 text-green-400 text-sm">
              <span>✓</span>
              <span>Pago descentralizado - Sin intermediarios</span>
            </div>
            <p class="text-slate-400 text-xs mt-1">
              Los fondos iran directamente a la wallet de <strong class="text-white">${this.escapeHtml(this.currentEntity.name)}</strong>
            </p>
          </div>
        ` : ''}

        <p class="text-slate-400 mb-6">Envia exactamente esta cantidad:</p>

        <div class="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
          <div class="text-2xl font-mono text-orange-400 mb-2">${data.btcAmount} BTC</div>
          <div class="text-sm text-slate-500">(≈ ${this.selectedAmount}€)</div>
        </div>

        <p class="text-slate-400 text-sm mb-2">
          ${isP2P ? 'A la wallet de la entidad:' : 'A esta direccion de escrow:'}
        </p>
        <div class="bg-white/5 rounded-lg p-3 mb-4 ${isP2P ? 'border border-green-500/30' : ''}">
          <code class="text-xs ${isP2P ? 'text-green-300' : 'text-amber-300'} break-all">${btcAddress}</code>
        </div>

        <button id="copy-btc-address" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors mb-6">
          📋 Copiar direccion
        </button>

        <div class="bg-white/5 rounded-xl p-4">
          <p class="text-slate-400 text-sm mb-3">Despues de enviar, ingresa el TX ID:</p>
          <input type="text" id="btc-tx-id" placeholder="ID de transaccion Bitcoin"
                 class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none mb-3">
          <button id="confirm-btc-payment" class="w-full px-4 py-2 ${isP2P ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white font-semibold rounded-lg transition-colors">
            Verificar transaccion
          </button>
        </div>

        <p class="text-xs text-slate-500 mt-4">
          ${isP2P
            ? '⚡ La verificacion automatica confirma que los fondos llegaron a la entidad.'
            : '🔒 Los fondos quedaran en custodia hasta que la entidad verifique su identidad.'}
          La verificacion automatica puede tardar 10-30 minutos.
        </p>
      </div>
    `;

    // Eventos
    document.getElementById('copy-btc-address')?.addEventListener('click', () => {
      navigator.clipboard.writeText(btcAddress);
      window.toast?.success('Direccion copiada');
    });

    document.getElementById('confirm-btc-payment')?.addEventListener('click', async () => {
      const txId = document.getElementById('btc-tx-id')?.value.trim();
      if (!txId) {
        window.toast?.error('Ingresa el TX ID');
        return;
      }

      // Usar endpoint diferente segun modo
      if (isP2P) {
        await this.verifyP2PPayment(data.donationId, txId);
      } else {
        await this.confirmBtcPayment(data.donationId, txId);
      }
    });
  }

  /**
   * Verificar pago P2P (descentralizado)
   */
  async verifyP2PPayment(donationId, txId) {
    const btn = document.getElementById('confirm-btc-payment');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
    }

    try {
      const response = await fetch('https://gailu.net/api/direct-btc-donation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          entityId: this.currentEntity.id,
          txId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showP2PSuccess(data);
      } else {
        window.toast?.error(data.error || 'Error verificando transaccion');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Reintentar verificacion';
        }
      }
    } catch (error) {
      logger.error('[EntityDonation] P2P verification error:', error);
      window.toast?.error('Error de conexion. Intenta de nuevo.');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Reintentar verificacion';
      }
    }
  }

  /**
   * Mostrar exito para pago P2P
   */
  showP2PSuccess(data) {
    const content = document.querySelector('#entity-donation-modal .overflow-y-auto');
    if (!content) return;

    content.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">⚡</div>
        <h3 class="text-2xl font-bold text-white mb-2">Transaccion Verificada!</h3>
        <p class="text-slate-400 mb-6">
          <strong class="text-green-400">${this.escapeHtml(this.currentEntity.name)}</strong>
          ha recibido tu donacion directamente.
        </p>

        <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <div class="text-lg font-mono text-green-400 mb-2">${data.btcAmount?.toFixed(8) || '---'} BTC</div>
          <p class="text-green-400 text-sm">
            ✓ Fondos entregados directamente (P2P)
          </p>
          <p class="text-slate-500 text-xs mt-2">
            ${data.confirmations || 0} confirmaciones en blockchain
          </p>
        </div>

        <a href="${data.txUrl || '#'}" target="_blank" class="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors mb-6">
          🔗 Ver en Blockchain
        </a>

        <div class="mt-4">
          <button id="close-success" class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.getElementById('close-success')?.addEventListener('click', () => this.close());
    setTimeout(() => this.close(), 8000);
  }

  async confirmBtcPayment(donationId, txId) {
    try {
      const response = await fetch('https://gailu.net/api/confirm-entity-donation-btc.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId, txId })
      });

      if (response.ok) {
        this.showSuccess();
      } else {
        throw new Error('Error confirmando pago');
      }
    } catch (error) {
      window.toast?.error('Error confirmando pago. Contacta soporte.');
    }
  }

  showPaypalConfirmation(_donationId) {
    const content = document.querySelector('#entity-donation-modal .overflow-y-auto');
    if (!content) return;

    content.innerHTML = `
      <div class="text-center py-6">
        <div class="text-5xl mb-4">🅿️</div>
        <h3 class="text-xl font-bold text-white mb-2">Confirma tu pago PayPal</h3>
        <p class="text-slate-400 mb-6">
          Se abrio una ventana de PayPal. Completa el pago y haz clic en confirmar.
        </p>

        <button id="confirm-paypal" class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
          Ya pague con PayPal
        </button>

        <p class="text-xs text-slate-500 mt-4">
          Si no se abrio la ventana, <a href="#" id="reopen-paypal" class="text-blue-400 hover:underline">haz clic aqui</a>
        </p>
      </div>
    `;

    document.getElementById('confirm-paypal')?.addEventListener('click', () => {
      this.showSuccess();
    });
  }

  showSuccess() {
    const content = document.querySelector('#entity-donation-modal .overflow-y-auto');
    if (!content) return;

    content.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">💚</div>
        <h3 class="text-2xl font-bold text-white mb-2">Gracias por tu donacion!</h3>
        <p class="text-slate-400 mb-6">
          Tu apoyo a <strong class="text-emerald-400">${this.escapeHtml(this.currentEntity.name)}</strong> hace la diferencia.
        </p>

        <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
          <p class="text-emerald-400 text-sm">
            Los fondos estan en custodia. La entidad recibira una notificacion
            y podra reclamarlos una vez verifique su identidad.
          </p>
        </div>

        <button id="close-success" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">
          Cerrar
        </button>
      </div>
    `;

    document.getElementById('close-success')?.addEventListener('click', () => this.close());

    // Cerrar automaticamente despues de 5s
    setTimeout(() => this.close(), 5000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Renderizar badge de nivel de verificación
   */
  renderVerificationBadge() {
    const level = this.verificationStatus?.level ?? (this.currentEntity.is_verified ? 1 : 0);

    const badges = {
      0: { text: 'Sin verificar', class: 'bg-slate-500/20 text-slate-400' },
      1: { text: 'Nivel 1', class: 'bg-blue-500/20 text-blue-400' },
      2: { text: 'Nivel 2', class: 'bg-purple-500/20 text-purple-400' },
      3: { text: 'Verificada ✓', class: 'bg-green-500/20 text-green-400' }
    };

    const badge = badges[level] || badges[0];
    return `<span class="px-2 py-0.5 text-xs rounded-full ${badge.class}">${badge.text}</span>`;
  }

  /**
   * Renderizar advertencia de capacidad si hay límite
   */
  renderCapacityWarning() {
    if (!this.remainingCapacity || this.remainingCapacity > 500) return '';

    const level = this.verificationStatus?.level || 1;
    const waitDays = { 1: 14, 2: 7, 3: 2 }[level] || 14;

    return `
      <div class="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p class="text-amber-400 text-xs">
          ⚠️ Esta entidad puede recibir máx. €${this.maxAmount}.
          Capacidad restante: <strong>€${this.remainingCapacity?.toFixed(2)}</strong>.
          Espera de retiro: ${waitDays} días.
        </p>
      </div>
    `;
  }

  getCategoryEmoji(category) {
    const emojis = {
      ecoaldea: '🌱',
      cooperativa: '🤝',
      proyecto: '🚀',
      comunidad: '👥',
      huerto: '🥕',
      educacion: '📚',
      salud: '💚',
      arte: '🎨',
      tecnologia: '💻'
    };
    return emojis[category] || '🌍';
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Crear instancia global
window.EntityDonationModal = EntityDonationModal;

try {
  window.entityDonationModal = new EntityDonationModal();
  console.log('[EntityDonationModal] ✓ Instancia creada correctamente');
} catch (error) {
  console.error('[EntityDonationModal] ✗ Error creando instancia:', error);
}

console.log('[EntityDonationModal] Script cargado, window.entityDonationModal =', !!window.entityDonationModal);
