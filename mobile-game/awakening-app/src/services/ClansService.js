/**
 * CLANS SERVICE
 * =============
 *
 * Servicio para gestionar clanes y comunidades de jugadores.
 *
 * CARACTERÍSTICAS:
 * - Crear y administrar clanes
 * - Sistema de invitaciones
 * - Roles y jerarquías
 * - Chat interno del clan
 * - Actividades y logs
 * - Rankings globales
 * - Contribuciones de miembros
 *
 * ROLES:
 * - Leader: Control total del clan
 * - Co-Leader: Puede invitar, promover hasta Officer
 * - Officer: Puede invitar miembros
 * - Member: Miembro regular
 *
 * USO:
 * ```javascript
 * import clansService from './services/ClansService';
 *
 * // Crear clan
 * await clansService.createClan('Mi Clan', 'Descripción');
 *
 * // Unirse a clan
 * await clansService.joinClan(clanId);
 *
 * // Enviar mensaje
 * await clansService.sendMessage(clanId, 'Hola!');
 * ```
 *
 * @version 1.0.0
 */

import logger from '../utils/logger';
import useGameStore from '../stores/gameStore';
import realtimeManager from './RealtimeManager';

class ClansService {
  constructor() {
    this.supabase = null;
    this.initialized = false;

    // Clan actual del usuario
    this.currentClan = null;
    this.clanMembers = [];

    // Cache
    this.clanActivities = [];
    this.chatMessages = [];
    this.publicClans = [];

    // Listeners
    this.clanListeners = [];
    this.realtimeUnsubscribers = [];

    // Polling
    this.activitiesPollingInterval = null;
  }

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================

  /**
   * Inicializa el servicio
   */
  async init(supabase) {
    if (this.initialized) {
      logger.info('ClansService', 'Ya inicializado');
      return true;
    }

    if (!supabase) {
      logger.error('ClansService', 'Supabase client no proporcionado');
      return false;
    }

    this.supabase = supabase;

    // Cargar clan del usuario
    await this.loadUserClan();

    // Si tiene clan, configurar Realtime y cargar datos
    if (this.currentClan) {
      await this.setupRealtimeListeners();
      await this.loadClanData();
    }

    this.initialized = true;
    logger.info('ClansService', `✓ Inicializado${this.currentClan ? ` (Clan: ${this.currentClan.name})` : ''}`);

    return true;
  }

  /**
   * Carga clan del usuario actual
   */
  async loadUserClan() {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        logger.warn('ClansService', 'No hay usuario autenticado');
        return null;
      }

      // Buscar membresía activa
      const { data: membership, error } = await this.supabase
        .from('clan_members')
        .select(`
          *,
          clans (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No está en ningún clan
          logger.info('ClansService', 'Usuario no está en ningún clan');
          return null;
        }
        throw error;
      }

      this.currentClan = membership.clans;
      logger.info('ClansService', `Clan cargado: ${this.currentClan.name}`);

      return this.currentClan;

    } catch (error) {
      logger.error('ClansService', 'Error cargando clan:', error);
      return null;
    }
  }

  /**
   * Carga datos del clan (miembros, actividades, etc.)
   */
  async loadClanData() {
    if (!this.currentClan) return;

    try {
      // Cargar miembros
      await this.loadClanMembers();

      // Cargar actividades recientes
      await this.loadClanActivities(20);

      // Cargar mensajes de chat
      await this.loadChatMessages(50);

      logger.info('ClansService', '✓ Datos del clan cargados');

    } catch (error) {
      logger.error('ClansService', 'Error cargando datos del clan:', error);
    }
  }

  /**
   * Configura listeners de Realtime
   */
  async setupRealtimeListeners() {
    if (!this.currentClan) return;

    try {
      // Suscribirse a cambios en miembros del clan
      const unsubMembers = realtimeManager.subscribe('clans', (payload) => {
        // Filtrar solo eventos de nuestro clan
        if (payload.new?.id === this.currentClan.id || payload.old?.id === this.currentClan.id) {
          this.handleClanUpdate(payload);
        }
      });
      this.realtimeUnsubscribers.push(unsubMembers);

      logger.info('ClansService', '✓ Realtime listeners configurados');

    } catch (error) {
      logger.error('ClansService', 'Error configurando Realtime:', error);
    }
  }

  /**
   * Maneja actualizaciones del clan vía Realtime
   */
  handleClanUpdate(payload) {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'UPDATE' && newRecord) {
      // Actualizar clan local
      this.currentClan = newRecord;
      this.notifyListeners('clan_updated', newRecord);
      logger.info('ClansService', `Clan actualizado: ${newRecord.name}`);
    }
  }

  // ========================================================================
  // GESTIÓN DE CLANES
  // ========================================================================

  /**
   * Crea un nuevo clan
   */
  async createClan(name, description = '', clanTag = null, isPublic = true) {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        throw new Error('No hay usuario autenticado');
      }

      // Verificar que no esté en un clan
      if (this.currentClan) {
        throw new Error('Ya estás en un clan');
      }

      // Llamar función RPC
      const { data, error } = await this.supabase.rpc('create_clan', {
        p_user_id: user.id,
        p_name: name,
        p_description: description,
        p_clan_tag: clanTag,
        p_is_public: isPublic
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error creando clan');
      }

      // Cargar clan recién creado
      await this.loadUserClan();
      await this.setupRealtimeListeners();
      await this.loadClanData();

      logger.info('ClansService', `✓ Clan creado: ${name}`);

      this.notifyListeners('clan_created', this.currentClan);

      return {
        success: true,
        clan: this.currentClan
      };

    } catch (error) {
      logger.error('ClansService', 'Error creando clan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unirse a un clan
   */
  async joinClan(clanId) {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        throw new Error('No hay usuario autenticado');
      }

      // Verificar que no esté en un clan
      if (this.currentClan) {
        throw new Error('Ya estás en un clan. Debes salir primero.');
      }

      // Llamar función RPC
      const { data, error } = await this.supabase.rpc('join_clan', {
        p_user_id: user.id,
        p_clan_id: clanId
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error uniéndose al clan');
      }

      // Cargar clan
      await this.loadUserClan();
      await this.setupRealtimeListeners();
      await this.loadClanData();

      logger.info('ClansService', `✓ Unido al clan: ${this.currentClan.name}`);

      this.notifyListeners('clan_joined', this.currentClan);

      return {
        success: true,
        clan: this.currentClan
      };

    } catch (error) {
      logger.error('ClansService', 'Error uniéndose al clan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Salir del clan actual
   */
  async leaveClan() {
    try {
      if (!this.currentClan) {
        throw new Error('No estás en ningún clan');
      }

      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        throw new Error('No hay usuario autenticado');
      }

      // Llamar función RPC
      const { data, error } = await this.supabase.rpc('leave_clan', {
        p_user_id: user.id,
        p_clan_id: this.currentClan.id
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error saliendo del clan');
      }

      // Limpiar datos locales
      const oldClan = this.currentClan;
      this.currentClan = null;
      this.clanMembers = [];
      this.clanActivities = [];
      this.chatMessages = [];

      // Limpiar listeners
      this.cleanupRealtimeListeners();

      logger.info('ClansService', `✓ Saliste del clan: ${oldClan.name}`);

      this.notifyListeners('clan_left', oldClan);

      return {
        success: true
      };

    } catch (error) {
      logger.error('ClansService', 'Error saliendo del clan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================================================
  // MIEMBROS
  // ========================================================================

  /**
   * Carga miembros del clan
   */
  async loadClanMembers() {
    if (!this.currentClan) return [];

    try {
      const { data, error } = await this.supabase
        .from('clan_members')
        .select('*')
        .eq('clan_id', this.currentClan.id)
        .eq('is_active', true)
        .order('total_contribution', { ascending: false });

      if (error) throw error;

      this.clanMembers = data || [];
      logger.info('ClansService', `${this.clanMembers.length} miembros cargados`);

      return this.clanMembers;

    } catch (error) {
      logger.error('ClansService', 'Error cargando miembros:', error);
      return [];
    }
  }

  /**
   * Obtiene información de un miembro específico
   */
  getMember(userId) {
    return this.clanMembers.find(m => m.user_id === userId);
  }

  /**
   * Verifica si el usuario actual tiene un rol específico
   */
  hasRole(role) {
    const user = useGameStore.getState().user;
    if (!user || !this.currentClan) return false;

    const member = this.getMember(user.id);
    if (!member) return false;

    const roleHierarchy = {
      leader: 4,
      co_leader: 3,
      officer: 2,
      member: 1
    };

    return roleHierarchy[member.role] >= roleHierarchy[role];
  }

  /**
   * Verifica si el usuario es líder
   */
  isLeader() {
    return this.hasRole('leader');
  }

  /**
   * Verifica si el usuario puede invitar (Officer+)
   */
  canInvite() {
    return this.hasRole('officer');
  }

  // ========================================================================
  // INVITACIONES
  // ========================================================================

  /**
   * Envía invitación a un usuario
   */
  async inviteUser(userId, message = '') {
    try {
      if (!this.currentClan) {
        throw new Error('No estás en un clan');
      }

      if (!this.canInvite()) {
        throw new Error('No tienes permisos para invitar');
      }

      const user = useGameStore.getState().user;

      const { error } = await this.supabase
        .from('clan_invitations')
        .insert({
          clan_id: this.currentClan.id,
          inviter_id: user.id,
          invitee_id: userId,
          message: message,
          status: 'pending'
        });

      if (error) throw error;

      logger.info('ClansService', `✓ Invitación enviada a usuario ${userId}`);

      return {
        success: true
      };

    } catch (error) {
      logger.error('ClansService', 'Error enviando invitación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene invitaciones pendientes del usuario
   */
  async getPendingInvitations() {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('clan_invitations')
        .select(`
          *,
          clans (*)
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      return data || [];

    } catch (error) {
      logger.error('ClansService', 'Error obteniendo invitaciones:', error);
      return [];
    }
  }

  /**
   * Acepta una invitación
   */
  async acceptInvitation(invitationId) {
    try {
      // Obtener invitación
      const { data: invitation, error: fetchError } = await this.supabase
        .from('clan_invitations')
        .select('*, clans(*)')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      // Marcar como aceptada
      const { error: updateError } = await this.supabase
        .from('clan_invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Unirse al clan
      return await this.joinClan(invitation.clan_id);

    } catch (error) {
      logger.error('ClansService', 'Error aceptando invitación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rechaza una invitación
   */
  async declineInvitation(invitationId) {
    try {
      const { error } = await this.supabase
        .from('clan_invitations')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      logger.info('ClansService', `✓ Invitación rechazada`);

      return {
        success: true
      };

    } catch (error) {
      logger.error('ClansService', 'Error rechazando invitación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================================================
  // ACTIVIDADES
  // ========================================================================

  /**
   * Carga actividades recientes del clan
   */
  async loadClanActivities(limit = 50) {
    if (!this.currentClan) return [];

    try {
      const { data, error } = await this.supabase
        .from('clan_activities')
        .select('*')
        .eq('clan_id', this.currentClan.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      this.clanActivities = data || [];
      logger.debug('ClansService', `${this.clanActivities.length} actividades cargadas`);

      return this.clanActivities;

    } catch (error) {
      logger.error('ClansService', 'Error cargando actividades:', error);
      return [];
    }
  }

  /**
   * Registra una contribución del usuario al clan
   */
  async recordContribution(contributionType, amount) {
    if (!this.currentClan) return;

    try {
      const user = useGameStore.getState().user;
      const member = this.getMember(user.id);

      if (!member) return;

      // Actualizar contribución del miembro
      const { error } = await this.supabase
        .from('clan_members')
        .update({
          total_contribution: member.total_contribution + amount,
          weekly_contribution: member.weekly_contribution + amount
        })
        .eq('id', member.id);

      if (error) throw error;

      // Actualizar stats del clan
      await this.supabase
        .from('clans')
        .update({
          total_xp: this.currentClan.total_xp + amount,
          weekly_contribution: this.currentClan.weekly_contribution + amount
        })
        .eq('id', this.currentClan.id);

      logger.info('ClansService', `✓ Contribución registrada: +${amount}`);

      // Recargar miembros
      await this.loadClanMembers();

    } catch (error) {
      logger.error('ClansService', 'Error registrando contribución:', error);
    }
  }

  // ========================================================================
  // CHAT
  // ========================================================================

  /**
   * Carga mensajes del chat
   */
  async loadChatMessages(limit = 100) {
    if (!this.currentClan) return [];

    try {
      const { data, error } = await this.supabase
        .from('clan_chat')
        .select('*')
        .eq('clan_id', this.currentClan.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      this.chatMessages = (data || []).reverse(); // Orden cronológico
      logger.debug('ClansService', `${this.chatMessages.length} mensajes cargados`);

      return this.chatMessages;

    } catch (error) {
      logger.error('ClansService', 'Error cargando mensajes:', error);
      return [];
    }
  }

  /**
   * Envía un mensaje al chat del clan
   */
  async sendMessage(message) {
    try {
      if (!this.currentClan) {
        throw new Error('No estás en un clan');
      }

      const user = useGameStore.getState().user;

      const { data, error } = await this.supabase
        .from('clan_chat')
        .insert({
          clan_id: this.currentClan.id,
          user_id: user.id,
          message: message.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Agregar a cache local
      this.chatMessages.push(data);

      this.notifyListeners('message_sent', data);

      return {
        success: true,
        message: data
      };

    } catch (error) {
      logger.error('ClansService', 'Error enviando mensaje:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================================================
  // BÚSQUEDA DE CLANES
  // ========================================================================

  /**
   * Obtiene clanes públicos
   */
  async getPublicClans(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .eq('is_recruiting', true)
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      this.publicClans = data || [];
      return this.publicClans;

    } catch (error) {
      logger.error('ClansService', 'Error obteniendo clanes públicos:', error);
      return [];
    }
  }

  /**
   * Busca clanes por nombre
   */
  async searchClans(query) {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;

      return data || [];

    } catch (error) {
      logger.error('ClansService', 'Error buscando clanes:', error);
      return [];
    }
  }

  /**
   * Obtiene detalles de un clan específico
   */
  async getClanDetails(clanId) {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .select(`
          *,
          clan_members (*)
        `)
        .eq('id', clanId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      logger.error('ClansService', 'Error obteniendo detalles del clan:', error);
      return null;
    }
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  /**
   * Verifica si el usuario está en un clan
   */
  isInClan() {
    return !!this.currentClan;
  }

  /**
   * Obtiene clan actual
   */
  getCurrentClan() {
    return this.currentClan;
  }

  /**
   * Obtiene miembros del clan
   */
  getMembers() {
    return this.clanMembers;
  }

  /**
   * Obtiene actividades del clan
   */
  getActivities() {
    return this.clanActivities;
  }

  /**
   * Obtiene mensajes del chat
   */
  getChatMessages() {
    return this.chatMessages;
  }

  // ========================================================================
  // LISTENERS
  // ========================================================================

  /**
   * Registra listener para eventos de clanes
   */
  addEventListener(callback) {
    this.clanListeners.push(callback);
    return () => {
      this.clanListeners = this.clanListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica a todos los listeners
   */
  notifyListeners(eventName, data) {
    this.clanListeners.forEach(callback => {
      try {
        callback(eventName, data);
      } catch (error) {
        logger.error('ClansService', 'Error en listener:', error);
      }
    });
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  /**
   * Limpia listeners de Realtime
   */
  cleanupRealtimeListeners() {
    this.realtimeUnsubscribers.forEach(unsub => unsub());
    this.realtimeUnsubscribers = [];
  }

  /**
   * Limpia recursos del servicio
   */
  cleanup() {
    logger.info('ClansService', 'Limpiando recursos...');

    this.cleanupRealtimeListeners();

    if (this.activitiesPollingInterval) {
      clearInterval(this.activitiesPollingInterval);
      this.activitiesPollingInterval = null;
    }

    this.currentClan = null;
    this.clanMembers = [];
    this.clanActivities = [];
    this.chatMessages = [];
    this.publicClans = [];
    this.clanListeners = [];
    this.initialized = false;

    logger.info('ClansService', '✓ Recursos limpiados');
  }
}

// Exportar instancia singleton
const clansService = new ClansService();

export default clansService;
