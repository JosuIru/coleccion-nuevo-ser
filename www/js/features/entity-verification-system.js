/**
 * SISTEMA DE VERIFICACIÓN DESCENTRALIZADA DE ENTIDADES
 *
 * Niveles de verificación:
 *   0: Sin verificar (solo intenciones)
 *   1: Básico (max €100, espera 14 días)
 *   2: Medio (max €1000, espera 7 días)
 *   3: Completo (sin límite, espera 48h)
 *
 * Métodos:
 *   - DNS TXT record
 *   - Meta tag en web
 *   - Firma criptográfica
 *   - Avales sociales con stake
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

class EntityVerificationSystem {
  constructor() {
    this.API_BASE = 'https://gailu.net/api';
    this.currentEntity = null;

    // Configuración de niveles
    this.LEVEL_CONFIG = {
      0: { maxAmount: 0, waitDays: null, name: 'Sin verificar' },
      1: { maxAmount: 100, waitDays: 14, name: 'Básico' },
      2: { maxAmount: 1000, waitDays: 7, name: 'Medio' },
      3: { maxAmount: null, waitDays: 2, name: 'Completo' }
    };

    // Mínimo para avalar
    this.MIN_STAKE_AMOUNT = 20;
    this.MIN_ENDORSEMENTS = 3;

    console.log('[EntityVerification] Sistema inicializado');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICACIÓN TÉCNICA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verificar entidad por DNS TXT record
   * La entidad debe añadir: TXT "nuevo-ser-verify=CODIGO"
   */
  async verifyByDNS(entityId, domain) {
    console.log(`[Verification] Verificando DNS para ${domain}`);

    try {
      const response = await fetch(`${this.API_BASE}/entity-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_dns',
          entityId,
          domain
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Verification] Error DNS:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Verificar entidad por meta tag en su web
   * La entidad debe añadir: <meta name="nuevo-ser-verify" content="CODIGO">
   */
  async verifyByMetaTag(entityId, url) {
    console.log(`[Verification] Verificando meta tag en ${url}`);

    try {
      const response = await fetch(`${this.API_BASE}/entity-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_meta',
          entityId,
          url
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Verification] Error meta tag:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Verificar entidad por firma criptográfica
   * La entidad firma un mensaje con su wallet conocida
   */
  async verifyByCryptoSignature(entityId, message, signature, walletAddress) {
    console.log(`[Verification] Verificando firma de ${walletAddress}`);

    try {
      const response = await fetch(`${this.API_BASE}/entity-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_signature',
          entityId,
          message,
          signature,
          walletAddress
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Verification] Error firma:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Obtener mensaje a firmar para verificación
   */
  getSignatureMessage(entityId, verificationCode) {
    const timestamp = Math.floor(Date.now() / 1000);
    return `Verifico que controlo la entidad ${entityId} en Nuevo Ser. Código: ${verificationCode}. Timestamp: ${timestamp}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE AVALES (ENDORSEMENTS)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Avalar una entidad (requiere stake)
   */
  async endorseEntity(entityId, reason, stakeAmount = 20) {
    const user = window.authHelper?.getUser();
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para avalar' };
    }

    if (stakeAmount < this.MIN_STAKE_AMOUNT) {
      return { success: false, error: `El stake mínimo es €${this.MIN_STAKE_AMOUNT}` };
    }

    try {
      const response = await fetch(`${this.API_BASE}/entity-endorsement.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          action: 'endorse',
          entityId,
          reason,
          stakeAmount
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Endorsement] Error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Obtener avales de una entidad
   */
  async getEndorsements(entityId) {
    try {
      const response = await fetch(`${this.API_BASE}/entity-endorsement.php?entityId=${entityId}`);
      const data = await response.json();
      return data.endorsements || [];
    } catch (error) {
      console.error('[Endorsement] Error obteniendo avales:', error);
      return [];
    }
  }

  /**
   * Verificar si usuario puede avalar (tiene suficiente reputación)
   */
  async canUserEndorse(userId) {
    try {
      const response = await fetch(`${this.API_BASE}/entity-endorsement.php?action=can_endorse&userId=${userId}`);
      const data = await response.json();
      return data.canEndorse || false;
    } catch (error) {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTENCIONES DE DONACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registrar intención de donación (cuando entidad no puede recibir aún)
   */
  async createDonationIntent(entityId, amount, message = '') {
    const user = window.authHelper?.getUser();

    try {
      const response = await fetch(`${this.API_BASE}/donation-intent.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'Authorization': `Bearer ${user.access_token}` } : {})
        },
        body: JSON.stringify({
          action: 'create',
          entityId,
          amount,
          message,
          donorEmail: user?.email
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Intent] Error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Obtener intenciones pendientes para una entidad
   */
  async getPendingIntents(entityId) {
    try {
      const response = await fetch(`${this.API_BASE}/donation-intent.php?entityId=${entityId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Intent] Error:', error);
      return { intents: [], totalAmount: 0, count: 0 };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE DISPUTAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Abrir disputa contra una entidad
   */
  async openDispute(entityId, reason, description, evidenceUrls = []) {
    const user = window.authHelper?.getUser();
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para abrir una disputa' };
    }

    try {
      const response = await fetch(`${this.API_BASE}/entity-dispute.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          action: 'open',
          entityId,
          reason,
          description,
          evidenceUrls
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Dispute] Error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Votar en una disputa (solo árbitros)
   */
  async voteOnDispute(disputeId, vote, reasoning = '') {
    const user = window.authHelper?.getUser();
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para votar' };
    }

    try {
      const response = await fetch(`${this.API_BASE}/entity-dispute.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          action: 'vote',
          disputeId,
          vote, // 'fraud' o 'legitimate'
          reasoning
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Dispute] Error votando:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Obtener disputas activas de una entidad
   */
  async getActiveDisputes(entityId) {
    try {
      const response = await fetch(`${this.API_BASE}/entity-dispute.php?entityId=${entityId}&status=open`);
      const data = await response.json();
      return data.disputes || [];
    } catch (error) {
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtener información completa de verificación de una entidad
   */
  async getEntityVerificationStatus(entityId) {
    try {
      const response = await fetch(`${this.API_BASE}/entity-verification.php?entityId=${entityId}`);
      const data = await response.json();

      return {
        level: data.verification_level || 0,
        levelConfig: this.LEVEL_CONFIG[data.verification_level || 0],
        verifications: data.verifications || [],
        endorsements: data.endorsements || [],
        endorsementCount: data.endorsement_count || 0,
        activeDisputes: data.active_disputes || 0,
        totalReceived: data.total_received || 0,
        totalPending: data.total_pending || 0,
        canReceive: (data.verification_level || 0) > 0,
        isBanned: data.is_banned || false
      };
    } catch (error) {
      console.error('[Verification] Error obteniendo estado:', error);
      return {
        level: 0,
        levelConfig: this.LEVEL_CONFIG[0],
        verifications: [],
        endorsements: [],
        endorsementCount: 0,
        activeDisputes: 0,
        canReceive: false,
        isBanned: false
      };
    }
  }

  /**
   * Verificar si una donación es posible para la entidad
   */
  async canReceiveDonation(entityId, amount) {
    const status = await this.getEntityVerificationStatus(entityId);

    if (status.isBanned) {
      return {
        allowed: false,
        reason: 'entity_banned',
        message: 'Esta entidad ha sido marcada como fraudulenta'
      };
    }

    if (status.level === 0) {
      return {
        allowed: false,
        reason: 'not_verified',
        message: 'Esta entidad aún no está verificada',
        canRegisterIntent: true,
        pendingIntents: status.totalPending
      };
    }

    const maxAmount = status.levelConfig.maxAmount;
    if (maxAmount !== null) {
      const remainingCapacity = maxAmount - status.totalReceived;
      if (amount > remainingCapacity) {
        return {
          allowed: false,
          reason: 'limit_exceeded',
          message: `Esta entidad puede recibir máximo €${maxAmount}. Capacidad restante: €${remainingCapacity.toFixed(2)}`,
          maxAllowed: remainingCapacity
        };
      }
    }

    if (status.activeDisputes > 0) {
      return {
        allowed: false,
        reason: 'active_dispute',
        message: 'Esta entidad tiene disputas activas. Las donaciones están pausadas.',
        disputes: status.activeDisputes
      };
    }

    return {
      allowed: true,
      level: status.level,
      waitDays: status.levelConfig.waitDays,
      message: `Nivel ${status.level}: Los fondos estarán disponibles en ${status.levelConfig.waitDays} días`
    };
  }

  /**
   * Calcular detección de colusión para avaladores
   */
  detectPossibleCollusion(endorsers) {
    const flags = [];

    // Verificar fechas de registro similares
    const registrationDates = endorsers.map(e => new Date(e.created_at).toDateString());
    const uniqueDates = new Set(registrationDates);
    if (uniqueDates.size < endorsers.length * 0.5) {
      flags.push('registration_dates_similar');
    }

    // Verificar si solo se avalan entre ellos
    // (esto requiere datos de grafo social que vendrían del backend)

    return {
      suspicious: flags.length > 0,
      flags
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL DE VERIFICACIÓN PARA ENTIDADES
// ═══════════════════════════════════════════════════════════════════════════════

class EntityVerificationModal {
  constructor(verificationSystem) {
    this.system = verificationSystem;
    this.currentEntity = null;
    this.verificationStatus = null;
  }

  async show(entity) {
    this.currentEntity = entity;
    this.verificationStatus = await this.system.getEntityVerificationStatus(entity.id);
    this.render();
    this.attachEvents();
  }

  close() {
    const modal = document.getElementById('entity-verification-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => modal.remove(), 200);
    }
  }

  render() {
    const existing = document.getElementById('entity-verification-modal');
    if (existing) existing.remove();

    const level = this.verificationStatus.level;
    const levelConfig = this.verificationStatus.levelConfig;

    const modal = document.createElement('div');
    modal.id = 'entity-verification-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="verification-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">

        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 border-b border-white/10">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-white">Verificación de Entidad</h2>
              <p class="text-sm text-blue-400">${this.escapeHtml(this.currentEntity.name)}</p>
            </div>
            <button id="verification-close" class="p-2 hover:bg-white/10 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

          <!-- Nivel actual -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <span class="text-slate-400">Nivel de verificación</span>
              <span class="px-3 py-1 rounded-full text-sm font-medium ${this.getLevelColor(level)}">
                Nivel ${level}: ${levelConfig.name}
              </span>
            </div>
            ${this.renderLevelProgress(level)}
            <p class="text-xs text-slate-500 mt-2">
              ${level === 0 ? 'Esta entidad no puede recibir donaciones aún.' :
                `Puede recibir hasta €${levelConfig.maxAmount || '∞'}. Espera de retiro: ${levelConfig.waitDays} días.`}
            </p>
          </div>

          <!-- Verificaciones completadas -->
          ${this.renderCompletedVerifications()}

          <!-- Métodos de verificación disponibles -->
          <div class="mb-6">
            <h3 class="text-white font-medium mb-3">Métodos de verificación</h3>

            <!-- DNS -->
            <div class="bg-white/5 rounded-xl p-4 mb-3">
              <div class="flex items-start gap-3">
                <span class="text-2xl">🌐</span>
                <div class="flex-1">
                  <h4 class="text-white font-medium">Verificación por DNS</h4>
                  <p class="text-slate-400 text-sm mb-3">
                    Añade un registro TXT a tu dominio para demostrar que lo controlas.
                  </p>
                  <div class="bg-black/30 rounded-lg p-3 mb-3">
                    <code class="text-xs text-green-400 break-all">
                      TXT "nuevo-ser-verify=${this.currentEntity.verification_code || 'CODIGO'}"
                    </code>
                  </div>
                  <div class="flex gap-2">
                    <input type="text" id="dns-domain" placeholder="tudominio.org"
                           class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                    <button id="verify-dns" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                      Verificar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Meta Tag -->
            <div class="bg-white/5 rounded-xl p-4 mb-3">
              <div class="flex items-start gap-3">
                <span class="text-2xl">🏷️</span>
                <div class="flex-1">
                  <h4 class="text-white font-medium">Verificación por Meta Tag</h4>
                  <p class="text-slate-400 text-sm mb-3">
                    Añade esta etiqueta al &lt;head&gt; de tu página web.
                  </p>
                  <div class="bg-black/30 rounded-lg p-3 mb-3">
                    <code class="text-xs text-amber-400 break-all">
                      &lt;meta name="nuevo-ser-verify" content="${this.currentEntity.verification_code || 'CODIGO'}"&gt;
                    </code>
                  </div>
                  <div class="flex gap-2">
                    <input type="text" id="meta-url" placeholder="https://tudominio.org"
                           class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                    <button id="verify-meta" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
                      Verificar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Firma Crypto -->
            <div class="bg-white/5 rounded-xl p-4 mb-3">
              <div class="flex items-start gap-3">
                <span class="text-2xl">🔐</span>
                <div class="flex-1">
                  <h4 class="text-white font-medium">Verificación por Firma Criptográfica</h4>
                  <p class="text-slate-400 text-sm mb-3">
                    Firma este mensaje con tu wallet Bitcoin para demostrar que la controlas.
                  </p>
                  <div class="bg-black/30 rounded-lg p-3 mb-3">
                    <code class="text-xs text-purple-400 break-all" id="sign-message">
                      ${this.system.getSignatureMessage(this.currentEntity.id, this.currentEntity.verification_code || 'CODIGO')}
                    </code>
                  </div>
                  <div class="space-y-2">
                    <input type="text" id="wallet-address" placeholder="Dirección de wallet (bc1...)"
                           class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                    <input type="text" id="signature" placeholder="Firma del mensaje"
                           class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                    <button id="verify-signature" class="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium">
                      Verificar Firma
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Avales Sociales -->
            <div class="bg-white/5 rounded-xl p-4">
              <div class="flex items-start gap-3">
                <span class="text-2xl">👥</span>
                <div class="flex-1">
                  <h4 class="text-white font-medium">Verificación por Avales</h4>
                  <p class="text-slate-400 text-sm mb-3">
                    ${this.verificationStatus.endorsementCount}/${this.system.MIN_ENDORSEMENTS} avales necesarios.
                    Cada avalador apuesta mínimo €${this.system.MIN_STAKE_AMOUNT} de garantía.
                  </p>
                  ${this.renderEndorsementProgress()}
                  <button id="view-endorsements" class="mt-3 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium border border-green-500/30">
                    Ver Avaladores
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Disputas activas -->
          ${this.verificationStatus.activeDisputes > 0 ? `
            <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div class="flex items-center gap-2 text-red-400 mb-2">
                <span>⚠️</span>
                <span class="font-medium">Disputas Activas: ${this.verificationStatus.activeDisputes}</span>
              </div>
              <p class="text-slate-400 text-sm">
                Esta entidad tiene disputas abiertas. Las donaciones están pausadas hasta su resolución.
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  renderLevelProgress(currentLevel) {
    const levels = [0, 1, 2, 3];
    return `
      <div class="flex items-center gap-1">
        ${levels.map(l => `
          <div class="flex-1 h-2 rounded-full ${l <= currentLevel ? this.getLevelBgColor(l) : 'bg-white/10'}"></div>
        `).join('')}
      </div>
    `;
  }

  renderCompletedVerifications() {
    const verifications = this.verificationStatus.verifications;
    if (verifications.length === 0) return '';

    return `
      <div class="mb-6">
        <h3 class="text-white font-medium mb-3">Verificaciones completadas</h3>
        <div class="space-y-2">
          ${verifications.map(v => `
            <div class="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
              <span class="text-green-400">✓</span>
              <span class="text-white text-sm">${this.getMethodLabel(v.method)}</span>
              <span class="text-slate-500 text-xs ml-auto">${new Date(v.verified_at).toLocaleDateString()}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderEndorsementProgress() {
    const count = this.verificationStatus.endorsementCount;
    const required = this.system.MIN_ENDORSEMENTS;
    const percent = Math.min((count / required) * 100, 100);

    return `
      <div class="mt-2">
        <div class="h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-green-500 transition-all" style="width: ${percent}%"></div>
        </div>
        <div class="flex justify-between text-xs text-slate-500 mt-1">
          <span>${count} avales</span>
          <span>${required} necesarios</span>
        </div>
      </div>
    `;
  }

  getMethodLabel(method) {
    const labels = {
      dns: '🌐 DNS TXT Record',
      meta_tag: '🏷️ Meta Tag',
      crypto_signature: '🔐 Firma Criptográfica',
      social_endorsement: '👥 Avales Sociales'
    };
    return labels[method] || method;
  }

  getLevelColor(level) {
    const colors = {
      0: 'bg-slate-500/20 text-slate-400',
      1: 'bg-blue-500/20 text-blue-400',
      2: 'bg-purple-500/20 text-purple-400',
      3: 'bg-green-500/20 text-green-400'
    };
    return colors[level] || colors[0];
  }

  getLevelBgColor(level) {
    const colors = {
      0: 'bg-slate-500',
      1: 'bg-blue-500',
      2: 'bg-purple-500',
      3: 'bg-green-500'
    };
    return colors[level] || colors[0];
  }

  attachEvents() {
    document.getElementById('verification-close')?.addEventListener('click', () => this.close());
    document.getElementById('verification-backdrop')?.addEventListener('click', () => this.close());

    // DNS
    document.getElementById('verify-dns')?.addEventListener('click', async () => {
      const domain = document.getElementById('dns-domain')?.value.trim();
      if (!domain) {
        window.toast?.error('Ingresa un dominio');
        return;
      }
      await this.handleVerification('dns', domain);
    });

    // Meta tag
    document.getElementById('verify-meta')?.addEventListener('click', async () => {
      const url = document.getElementById('meta-url')?.value.trim();
      if (!url) {
        window.toast?.error('Ingresa una URL');
        return;
      }
      await this.handleVerification('meta', url);
    });

    // Firma
    document.getElementById('verify-signature')?.addEventListener('click', async () => {
      const address = document.getElementById('wallet-address')?.value.trim();
      const signature = document.getElementById('signature')?.value.trim();
      if (!address || !signature) {
        window.toast?.error('Ingresa la dirección y la firma');
        return;
      }
      await this.handleVerification('signature', { address, signature });
    });

    // Ver avaladores
    document.getElementById('view-endorsements')?.addEventListener('click', () => {
      this.showEndorsementsModal();
    });
  }

  async handleVerification(method, data) {
    const btn = document.querySelector(`#verify-${method === 'meta' ? 'meta' : method}`);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>';
    }

    let result;
    switch (method) {
      case 'dns':
        result = await this.system.verifyByDNS(this.currentEntity.id, data);
        break;
      case 'meta':
        result = await this.system.verifyByMetaTag(this.currentEntity.id, data);
        break;
      case 'signature':
        const message = document.getElementById('sign-message')?.textContent;
        result = await this.system.verifyByCryptoSignature(
          this.currentEntity.id, message, data.signature, data.address
        );
        break;
    }

    if (result.success) {
      window.toast?.success('¡Verificación completada!');
      // Recargar modal
      this.verificationStatus = await this.system.getEntityVerificationStatus(this.currentEntity.id);
      this.render();
      this.attachEvents();
    } else {
      window.toast?.error(result.error || 'Error en verificación');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Verificar';
      }
    }
  }

  showEndorsementsModal() {
    // Mostrar modal de avaladores (simplificado)
    window.toast?.info('Modal de avaladores - Por implementar');
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL DE AVALES
// ═══════════════════════════════════════════════════════════════════════════════

class EntityEndorsementModal {
  constructor(verificationSystem) {
    this.system = verificationSystem;
    this.currentEntity = null;
    this.stakeAmount = 20;
  }

  async show(entity) {
    this.currentEntity = entity;
    const endorsements = await this.system.getEndorsements(entity.id);
    this.render(endorsements);
    this.attachEvents();
  }

  close() {
    const modal = document.getElementById('entity-endorsement-modal');
    if (modal) modal.remove();
  }

  render(endorsements) {
    const existing = document.getElementById('entity-endorsement-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'entity-endorsement-modal';
    modal.className = 'fixed inset-0 z-[10001] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="endorsement-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">

        <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 border-b border-white/10">
          <h2 class="text-lg font-bold text-white">Avalar Entidad</h2>
          <p class="text-sm text-green-400">${this.escapeHtml(this.currentEntity.name)}</p>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">

          <!-- Advertencia -->
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <span class="text-xl">⚠️</span>
              <div class="text-sm">
                <p class="text-amber-400 font-medium mb-1">Tu dinero está en juego</p>
                <p class="text-slate-400">
                  Si avalas esta entidad y resulta ser fraudulenta, <strong class="text-amber-400">perderás tu stake de €${this.stakeAmount}</strong>.
                  Solo avala entidades que conozcas personalmente o puedas verificar.
                </p>
              </div>
            </div>
          </div>

          <!-- Avaladores actuales -->
          <div class="mb-6">
            <h3 class="text-white font-medium mb-3">Avaladores actuales (${endorsements.length})</h3>
            ${endorsements.length > 0 ? `
              <div class="space-y-2">
                ${endorsements.map(e => `
                  <div class="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                    <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      ${e.endorser_name?.charAt(0) || '?'}
                    </div>
                    <div class="flex-1">
                      <p class="text-white text-sm">${this.escapeHtml(e.endorser_name || 'Anónimo')}</p>
                      <p class="text-slate-500 text-xs">${e.reason || 'Sin razón especificada'}</p>
                    </div>
                    <span class="text-green-400 text-sm font-medium">€${e.stake_amount}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-slate-500 text-sm">Aún no hay avaladores.</p>
            `}
          </div>

          <!-- Formulario de aval -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-2">¿Por qué avalas esta entidad?</label>
              <textarea id="endorsement-reason" rows="3" placeholder="Conozco personalmente a los responsables..."
                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 resize-none"></textarea>
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-2">Cantidad de stake (mínimo €${this.system.MIN_STAKE_AMOUNT})</label>
              <div class="flex items-center gap-2">
                <input type="number" id="endorsement-stake" value="${this.stakeAmount}" min="${this.system.MIN_STAKE_AMOUNT}" step="5"
                       class="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <span class="text-slate-400">EUR</span>
              </div>
            </div>

            <button id="submit-endorsement" class="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all">
              Avalar con €${this.stakeAmount}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  attachEvents() {
    document.getElementById('endorsement-backdrop')?.addEventListener('click', () => this.close());

    document.getElementById('endorsement-stake')?.addEventListener('input', (e) => {
      this.stakeAmount = Math.max(parseFloat(e.target.value) || 20, this.system.MIN_STAKE_AMOUNT);
      document.getElementById('submit-endorsement').textContent = `Avalar con €${this.stakeAmount}`;
    });

    document.getElementById('submit-endorsement')?.addEventListener('click', async () => {
      const reason = document.getElementById('endorsement-reason')?.value.trim();
      if (!reason) {
        window.toast?.error('Debes explicar por qué avalas esta entidad');
        return;
      }

      const btn = document.getElementById('submit-endorsement');
      btn.disabled = true;
      btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';

      const result = await this.system.endorseEntity(this.currentEntity.id, reason, this.stakeAmount);

      if (result.success) {
        window.toast?.success('¡Aval registrado!');
        this.close();
      } else {
        window.toast?.error(result.error || 'Error al avalar');
        btn.disabled = false;
        btn.textContent = `Avalar con €${this.stakeAmount}`;
      }
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL DE INTENCIÓN DE DONACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

class DonationIntentModal {
  constructor(verificationSystem) {
    this.system = verificationSystem;
    this.currentEntity = null;
    this.selectedAmount = null;
    this.suggestedAmounts = [5, 10, 25, 50, 100];
  }

  async show(entity) {
    this.currentEntity = entity;
    const pendingData = await this.system.getPendingIntents(entity.id);
    this.render(pendingData);
    this.attachEvents();
  }

  close() {
    const modal = document.getElementById('donation-intent-modal');
    if (modal) modal.remove();
  }

  render(pendingData) {
    const existing = document.getElementById('donation-intent-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'donation-intent-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="intent-backdrop"></div>
      <div class="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">

        <div class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4 border-b border-white/10">
          <h2 class="text-lg font-bold text-white">Registrar Intención de Donación</h2>
          <p class="text-sm text-amber-400">${this.escapeHtml(this.currentEntity.name)}</p>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

          <!-- Info -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <span class="text-xl">ℹ️</span>
              <div class="text-sm">
                <p class="text-blue-400 font-medium mb-1">¿Por qué intención de donación?</p>
                <p class="text-slate-400">
                  Esta entidad aún no está verificada y no puede recibir donaciones directamente.
                  Tu intención quedará registrada y te notificaremos cuando puedas completar tu donación.
                </p>
              </div>
            </div>
          </div>

          <!-- Intenciones pendientes -->
          ${pendingData.count > 0 ? `
            <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <div class="flex items-center gap-2">
                <span class="text-xl">💚</span>
                <div>
                  <p class="text-green-400 font-medium">${pendingData.count} personas esperando donar</p>
                  <p class="text-slate-400 text-sm">Total pendiente: €${pendingData.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Selector de monto -->
          <div class="mb-6">
            <label class="block text-sm text-slate-400 mb-2">¿Cuánto te gustaría donar?</label>
            <div class="grid grid-cols-5 gap-2 mb-3">
              ${this.suggestedAmounts.map(amount => `
                <button class="intent-amount-btn px-3 py-2 rounded-lg border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 text-sm font-medium"
                        data-amount="${amount}">
                  ${amount}€
                </button>
              `).join('')}
            </div>
            <div class="flex items-center gap-2">
              <input type="number" id="intent-custom-amount" placeholder="Otra cantidad"
                     class="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500">
              <span class="text-slate-400">EUR</span>
            </div>
          </div>

          <!-- Mensaje -->
          <div class="mb-6">
            <label class="block text-sm text-slate-400 mb-2">Mensaje (opcional)</label>
            <textarea id="intent-message" rows="2" placeholder="¡Ánimo con vuestro proyecto!"
                      class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 resize-none"></textarea>
          </div>

          <button id="submit-intent" class="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50" disabled>
            Selecciona una cantidad
          </button>

          <p class="text-center text-xs text-slate-500 mt-3">
            No se te cobrará nada ahora. Te notificaremos cuando puedas completar tu donación.
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  attachEvents() {
    document.getElementById('intent-backdrop')?.addEventListener('click', () => this.close());

    // Montos sugeridos
    document.querySelectorAll('.intent-amount-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedAmount = parseFloat(btn.dataset.amount);
        this.updateUI();
        document.getElementById('intent-custom-amount').value = '';
      });
    });

    // Monto personalizado
    document.getElementById('intent-custom-amount')?.addEventListener('input', (e) => {
      this.selectedAmount = parseFloat(e.target.value) || null;
      this.updateUI();
      document.querySelectorAll('.intent-amount-btn').forEach(b => {
        b.classList.remove('bg-amber-500', 'border-amber-400', 'text-white');
        b.classList.add('bg-white/5', 'border-white/10', 'text-slate-300');
      });
    });

    // Submit
    document.getElementById('submit-intent')?.addEventListener('click', async () => {
      if (!this.selectedAmount || this.selectedAmount <= 0) return;

      const message = document.getElementById('intent-message')?.value.trim();
      const btn = document.getElementById('submit-intent');
      btn.disabled = true;
      btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';

      const result = await this.system.createDonationIntent(
        this.currentEntity.id,
        this.selectedAmount,
        message
      );

      if (result.success) {
        this.showSuccess();
      } else {
        window.toast?.error(result.error || 'Error al registrar intención');
        btn.disabled = false;
        btn.textContent = `Registrar intención de €${this.selectedAmount}`;
      }
    });
  }

  updateUI() {
    // Actualizar botones
    document.querySelectorAll('.intent-amount-btn').forEach(btn => {
      const amount = parseFloat(btn.dataset.amount);
      if (amount === this.selectedAmount) {
        btn.classList.add('bg-amber-500', 'border-amber-400', 'text-white');
        btn.classList.remove('bg-white/5', 'border-white/10', 'text-slate-300');
      } else {
        btn.classList.remove('bg-amber-500', 'border-amber-400', 'text-white');
        btn.classList.add('bg-white/5', 'border-white/10', 'text-slate-300');
      }
    });

    // Actualizar botón submit
    const submitBtn = document.getElementById('submit-intent');
    if (this.selectedAmount && this.selectedAmount > 0) {
      submitBtn.disabled = false;
      submitBtn.textContent = `Registrar intención de €${this.selectedAmount}`;
    } else {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Selecciona una cantidad';
    }
  }

  showSuccess() {
    const content = document.querySelector('#donation-intent-modal > div:last-child');
    if (!content) return;

    content.innerHTML = `
      <div class="p-6 text-center">
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-xl font-bold text-white mb-2">¡Intención registrada!</h3>
        <p class="text-slate-400 mb-6">
          Hemos guardado tu intención de donar <strong class="text-amber-400">€${this.selectedAmount}</strong> a
          <strong class="text-white">${this.escapeHtml(this.currentEntity.name)}</strong>.
        </p>
        <p class="text-sm text-slate-500 mb-6">
          Te notificaremos por email cuando la entidad se verifique y puedas completar tu donación.
        </p>
        <button id="close-intent-success" class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl">
          Entendido
        </button>
      </div>
    `;

    document.getElementById('close-intent-success')?.addEventListener('click', () => this.close());
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════

// Crear instancia global del sistema
window.entityVerificationSystem = new EntityVerificationSystem();
window.entityVerificationModal = new EntityVerificationModal(window.entityVerificationSystem);
window.entityEndorsementModal = new EntityEndorsementModal(window.entityVerificationSystem);
window.donationIntentModal = new DonationIntentModal(window.entityVerificationSystem);

console.log('[EntityVerificationSystem] ✓ Sistema cargado completamente');
