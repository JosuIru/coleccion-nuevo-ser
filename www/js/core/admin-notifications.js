/**
 * ADMIN NOTIFICATION SERVICE
 * Registra eventos de donaciones, pagos y soporte en Supabase.
 * Fallback a console.log si Supabase no esta disponible.
 *
 * @version 1.0.0
 */

class AdminNotificationService {
  constructor() {
    this.supabase = null;
    this.tableName = 'admin_notifications';
    this.init();
  }

  init() {
    if (typeof window.supabase !== 'undefined') {
      this.supabase = window.supabase;
    } else {
      setTimeout(() => this.init(), 1000);
    }
  }

  getAdminEmail() {
    return window.env?.ADMIN_EMAIL || null;
  }

  /**
   * Insertar notificacion en Supabase
   */
  async insertNotification(type, details) {
    const notification = {
      type,
      details,
      admin_email: this.getAdminEmail(),
      user_id: window.authHelper?.getUser()?.id || null,
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from(this.tableName)
          .insert([notification]);

        if (error) {
          logger.warn('Error insertando notificacion admin:', error.message);
          this.logLocal(notification);
        } else {
          logger.debug('Notificacion admin registrada:', type);
        }
      } catch (insertError) {
        logger.warn('Supabase no disponible para notificaciones:', insertError.message);
        this.logLocal(notification);
      }
    } else {
      this.logLocal(notification);
    }
  }

  /**
   * Fallback: log en consola
   */
  logLocal(notification) {
    logger.info('[AdminNotification][local]', notification.type, notification.details);
  }

  /**
   * Notificar donacion (Ko-fi, PayPal)
   */
  async notifyDonation(platform, details = {}) {
    await this.insertNotification('donation', {
      platform,
      ...details,
    });
  }

  /**
   * Notificar pago Bitcoin (copia de direccion)
   */
  async notifyBTCPayment(address, details = {}) {
    await this.insertNotification('btc_address_copied', {
      address,
      ...details,
    });
  }

  /**
   * Notificar suscripcion/pago via Stripe
   */
  async notifyPayment(tier, userId) {
    await this.insertNotification('subscription_checkout', {
      tier,
      user_id: userId,
    });
  }

  /**
   * Notificar solicitud de soporte
   */
  async notifySupportRequest(subject, message) {
    await this.insertNotification('support_request', {
      subject,
      message,
    });
  }
}

window.adminNotifications = new AdminNotificationService();
