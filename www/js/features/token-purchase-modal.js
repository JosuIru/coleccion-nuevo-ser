/**
 * TOKEN PURCHASE MODAL
 * Modal para compra de paquetes de tokens
 * Soporta: Stripe, PayPal, Bitcoin
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

class TokenPurchaseModal {
  constructor() {
    this.modal = null;
    this.selectedPackage = null;
    this.selectedPaymentMethod = 'stripe';
    this.btcPaymentRequest = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    this.createModal();
    this.attachEventListeners();
    logger.debug('TokenPurchaseModal inicializado');
  }

  createModal() {
    // Crear contenedor del modal
    this.modal = document.createElement('div');
    this.modal.id = 'token-purchase-modal';
    this.modal.className = 'modal-overlay hidden';
    this.modal.innerHTML = this.renderModal();
    document.body.appendChild(this.modal);
  }

  renderModal() {
    const packages = window.PLANS_CONFIG?.getAllTokenPackages() || [];
    const paymentMethods = window.PLANS_CONFIG?.paymentMethods || {};
    const tokensInfo = window.authHelper?.getTokensInfo() || { formatted: '0', total: 0 };

    return `
      <div class="modal-container token-modal">
        <div class="modal-header">
          <h2>🪙 Comprar Tokens</h2>
          <button class="modal-close" aria-label="Cerrar">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Balance actual -->
          <div class="current-balance">
            <span class="balance-label">Tu balance actual:</span>
            <span class="balance-amount">${tokensInfo.formatted}</span>
          </div>

          <!-- Paquetes de tokens -->
          <div class="packages-section">
            <h3>Selecciona un paquete</h3>
            <div class="packages-grid">
              ${packages.map(pkg => this.renderPackageCard(pkg)).join('')}
            </div>
          </div>

          <!-- Métodos de pago -->
          <div class="payment-section hidden" id="payment-section">
            <h3>Método de pago</h3>
            <div class="payment-methods">
              ${Object.values(paymentMethods)
                .filter(m => m.enabled)
                .map(m => this.renderPaymentMethod(m))
                .join('')}
            </div>

            <!-- Contenido específico por método -->
            <div class="payment-content" id="payment-content">
              ${this.renderStripeContent()}
            </div>
          </div>

          <!-- Resumen de compra -->
          <div class="purchase-summary hidden" id="purchase-summary">
            <div class="summary-row">
              <span>Paquete:</span>
              <span id="summary-package">-</span>
            </div>
            <div class="summary-row">
              <span>Tokens:</span>
              <span id="summary-tokens">-</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span id="summary-total">-</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="btn-cancel">Cancelar</button>
          <button class="btn-primary" id="btn-purchase" disabled>
            Continuar con el pago
          </button>
        </div>
      </div>
    `;
  }

  renderPackageCard(pkg) {
    const pricePerK = window.PLANS_CONFIG?.getPricePerKTokens(pkg.id);

    return `
      <div class="package-card ${pkg.popular ? 'popular' : ''}" data-package="${pkg.id}">
        ${pkg.popular ? '<span class="popular-badge">Más popular</span>' : ''}
        <div class="package-icon">${pkg.icon}</div>
        <div class="package-name">${pkg.name}</div>
        <div class="package-tokens">${window.PLANS_CONFIG?.formatTokens(pkg.tokens)}</div>
        <div class="package-price">${pkg.price.toFixed(2)} ${pkg.currency}</div>
        ${pkg.discount > 0 ? `<div class="package-discount">-${pkg.discount}% ahorro</div>` : ''}
        <div class="package-per-token">${pricePerK}€ / 1K tokens</div>
      </div>
    `;
  }

  renderPaymentMethod(method) {
    return `
      <button class="payment-method ${method.id === 'stripe' ? 'selected' : ''}"
              data-method="${method.id}">
        <span class="method-icon">${method.icon}</span>
        <span class="method-name">${method.name}</span>
      </button>
    `;
  }

  renderStripeContent() {
    return `
      <div class="payment-stripe">
        <p>Serás redirigido a Stripe para completar el pago de forma segura.</p>
        <div class="payment-icons">
          <span>💳 Visa</span>
          <span>💳 Mastercard</span>
          <span>📱 Google Pay</span>
          <span>🍎 Apple Pay</span>
        </div>
      </div>
    `;
  }

  renderPayPalContent() {
    return `
      <div class="payment-paypal">
        <p>Serás redirigido a PayPal para completar el pago.</p>
        <div class="paypal-logo">🅿️ PayPal</div>
      </div>
    `;
  }

  renderBitcoinContent(btcRequest = null) {
    const btcConfig = window.PLANS_CONFIG?.paymentConfig || {};

    if (btcRequest) {
      // Mostrar datos de pago pendiente
      return `
        <div class="payment-bitcoin active-request">
          <div class="btc-instructions">
            <h4>📋 Instrucciones de pago</h4>
            <ol>
              <li>Envía exactamente <strong>${btcRequest.btcAmount} BTC</strong> a:</li>
              <li class="btc-address-container">
                <code class="btc-address">${btcRequest.btcAddress}</code>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('${btcRequest.btcAddress}'); window.toast?.success('Dirección copiada')">
                  📋 Copiar
                </button>
              </li>
              <li>Una vez enviado, ingresa el TX ID:</li>
            </ol>
          </div>

          <div class="btc-txid-form">
            <input type="text" id="btc-txid" placeholder="Transaction ID (txid)"
                   pattern="[a-fA-F0-9]{64}">
            <button class="btn-primary" id="btn-submit-txid">
              Confirmar pago
            </button>
          </div>

          <div class="btc-amount-info">
            <span>Monto EUR:</span>
            <span>${btcRequest.eurAmount}€</span>
          </div>
          <div class="btc-amount-info">
            <span>Monto BTC:</span>
            <span>${btcRequest.btcAmount} BTC</span>
          </div>
          <div class="btc-amount-info">
            <span>Tokens a recibir:</span>
            <span>${window.PLANS_CONFIG?.formatTokens(btcRequest.tokens)}</span>
          </div>

          <p class="btc-note">
            ⏱️ La verificación es automática. Recibirás tus tokens en minutos
            tras la confirmación en blockchain.
          </p>
        </div>
      `;
    }

    // Vista inicial antes de seleccionar paquete
    return `
      <div class="payment-bitcoin">
        <p>Paga con Bitcoin. La verificación es automática via blockchain.</p>
        <div class="btc-info">
          <span>₿ Bitcoin (SegWit o Taproot)</span>
        </div>
        <p class="btc-note">
          Selecciona un paquete arriba para ver la dirección de pago.
        </p>
      </div>
    `;
  }

  attachEventListeners() {
    // Cerrar modal
    this.modal.querySelector('.modal-close')?.addEventListener('click', () => this.close());
    this.modal.querySelector('#btn-cancel')?.addEventListener('click', () => this.close());

    // Click fuera del modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Selección de paquete
    this.modal.querySelectorAll('.package-card').forEach(card => {
      card.addEventListener('click', () => this.selectPackage(card.dataset.package));
    });

    // Selección de método de pago
    this.modal.querySelectorAll('.payment-method').forEach(btn => {
      btn.addEventListener('click', () => this.selectPaymentMethod(btn.dataset.method));
    });

    // Botón de compra
    this.modal.querySelector('#btn-purchase')?.addEventListener('click', () => this.processPurchase());

    // Escape para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  selectPackage(packageId) {
    this.selectedPackage = window.PLANS_CONFIG?.getTokenPackage(packageId);

    if (!this.selectedPackage) return;

    // Actualizar UI de paquetes
    this.modal.querySelectorAll('.package-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.package === packageId);
    });

    // Mostrar sección de pago
    this.modal.querySelector('#payment-section')?.classList.remove('hidden');
    this.modal.querySelector('#purchase-summary')?.classList.remove('hidden');

    // Actualizar resumen
    this.updateSummary();

    // Habilitar botón de compra
    this.modal.querySelector('#btn-purchase').disabled = false;

    // Si es Bitcoin, generar solicitud de pago
    if (this.selectedPaymentMethod === 'bitcoin') {
      this.prepareBitcoinPayment();
    }
  }

  selectPaymentMethod(methodId) {
    this.selectedPaymentMethod = methodId;

    // Actualizar UI
    this.modal.querySelectorAll('.payment-method').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.method === methodId);
    });

    // Actualizar contenido según método
    const contentEl = this.modal.querySelector('#payment-content');
    if (!contentEl) return;

    switch (methodId) {
      case 'stripe':
        contentEl.innerHTML = this.renderStripeContent();
        break;
      case 'paypal':
        contentEl.innerHTML = this.renderPayPalContent();
        break;
      case 'bitcoin':
        if (this.selectedPackage) {
          this.prepareBitcoinPayment();
        } else {
          contentEl.innerHTML = this.renderBitcoinContent();
        }
        break;
    }

    // Actualizar texto del botón
    this.updatePurchaseButton();
  }

  updateSummary() {
    if (!this.selectedPackage) return;

    const pkg = this.selectedPackage;

    this.modal.querySelector('#summary-package').textContent =
      `${pkg.icon} ${pkg.name}`;
    this.modal.querySelector('#summary-tokens').textContent =
      window.PLANS_CONFIG?.formatTokens(pkg.tokens);
    this.modal.querySelector('#summary-total').textContent =
      `${pkg.price.toFixed(2)} ${pkg.currency}`;
  }

  updatePurchaseButton() {
    const btn = this.modal.querySelector('#btn-purchase');
    if (!btn) return;

    const methodNames = {
      stripe: 'Pagar con tarjeta',
      paypal: 'Pagar con PayPal',
      bitcoin: 'Generar dirección BTC',
    };

    btn.textContent = methodNames[this.selectedPaymentMethod] || 'Continuar';
  }

  async prepareBitcoinPayment() {
    if (!this.selectedPackage) return;

    const contentEl = this.modal.querySelector('#payment-content');
    if (!contentEl) return;

    contentEl.innerHTML = '<div class="loading">⏳ Generando dirección de pago...</div>';

    try {
      // Generar solicitud de pago BTC
      this.btcPaymentRequest = await window.aiPremium.purchaseWithBitcoin(this.selectedPackage);

      // Mostrar datos de pago
      contentEl.innerHTML = this.renderBitcoinContent(this.btcPaymentRequest);

      // Attach evento para enviar TX ID
      this.modal.querySelector('#btn-submit-txid')?.addEventListener('click', () => {
        this.submitBtcPayment();
      });

      // Deshabilitar botón principal (ya hay botón específico de BTC)
      const purchaseBtn = this.modal.querySelector('#btn-purchase');
      if (purchaseBtn) {
        purchaseBtn.textContent = 'Pago BTC iniciado';
        purchaseBtn.disabled = true;
      }

    } catch (error) {
      logger.error('Error preparando pago BTC:', error);
      contentEl.innerHTML = `
        <div class="payment-error">
          ❌ Error: ${error.message}
          <button class="btn-retry" onclick="window.tokenPurchaseModal.prepareBitcoinPayment()">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  async submitBtcPayment() {
    const txidInput = this.modal.querySelector('#btc-txid');
    const txid = txidInput?.value?.trim();

    if (!txid) {
      window.toast?.error('Por favor ingresa el Transaction ID');
      return;
    }

    // Validar formato básico de txid (64 caracteres hex)
    if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
      window.toast?.error('Formato de TX ID inválido');
      return;
    }

    if (!this.btcPaymentRequest?.requestId) {
      window.toast?.error('Error: solicitud de pago no encontrada');
      return;
    }

    const submitBtn = this.modal.querySelector('#btn-submit-txid');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando...';
    }

    try {
      await window.aiPremium.notifyBtcPayment(this.btcPaymentRequest.requestId, txid);

      window.toast?.success(
        '✅ Pago notificado. Recibirás tus tokens en unos minutos tras la confirmación en blockchain.',
        10000
      );

      this.close();

    } catch (error) {
      logger.error('Error notificando pago BTC:', error);
      window.toast?.error(`Error: ${error.message}`);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar pago';
      }
    }
  }

  async processPurchase() {
    if (!this.selectedPackage) {
      window.toast?.warning('Selecciona un paquete primero');
      return;
    }

    const btn = this.modal.querySelector('#btn-purchase');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Procesando...';
    }

    try {
      switch (this.selectedPaymentMethod) {
        case 'stripe':
          await window.aiPremium.purchaseWithStripe(this.selectedPackage);
          // Redirige a Stripe, no llega aquí
          break;

        case 'paypal':
          await window.aiPremium.purchaseWithPayPal(this.selectedPackage);
          // Redirige a PayPal, no llega aquí
          break;

        case 'bitcoin':
          // Ya manejado en prepareBitcoinPayment
          break;
      }

    } catch (error) {
      logger.error('Error procesando compra:', error);
      window.toast?.error(`Error: ${error.message}`);

      if (btn) {
        btn.disabled = false;
        this.updatePurchaseButton();
      }
    }
  }

  open() {
    // Actualizar balance actual
    const tokensInfo = window.authHelper?.getTokensInfo();
    const balanceEl = this.modal.querySelector('.balance-amount');
    if (balanceEl && tokensInfo) {
      balanceEl.textContent = tokensInfo.formatted;
    }

    // Reset estado
    this.selectedPackage = null;
    this.btcPaymentRequest = null;

    // Reset UI
    this.modal.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    this.modal.querySelector('#payment-section')?.classList.add('hidden');
    this.modal.querySelector('#purchase-summary')?.classList.add('hidden');
    this.modal.querySelector('#btn-purchase').disabled = true;

    // Reset a Stripe por defecto
    this.selectPaymentMethod('stripe');

    // Mostrar modal
    this.modal.classList.remove('hidden');
    this.isOpen = true;

    // Focus trap
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.classList.add('hidden');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  // Método estático para verificar URL de retorno
  static checkReturnUrl() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('tokens_purchased') === 'success') {
      window.toast?.success('✅ Compra completada. Tus tokens han sido añadidos.', 8000);

      // Refrescar perfil para obtener nuevo balance
      window.authHelper?.refreshProfile();

      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (params.get('tokens_purchased') === 'cancelled') {
      window.toast?.info('Compra cancelada');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
}

// Crear instancia global
window.tokenPurchaseModal = new TokenPurchaseModal();

// Verificar URL de retorno al cargar
document.addEventListener('DOMContentLoaded', () => {
  TokenPurchaseModal.checkReturnUrl();
});

logger.debug('✅ TokenPurchaseModal loaded');
