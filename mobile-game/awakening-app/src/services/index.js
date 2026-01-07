/**
 * SERVICES INDEX
 * ==============
 *
 * Exportación centralizada de todos los servicios de Phase 4
 *
 * USO:
 * ```javascript
 * import { serviceManager, eventsService, clansService } from './services';
 *
 * // O individual
 * import serviceManager from './services/ServiceManager';
 * ```
 */

// ========================================================================
// CORE SERVICES
// ========================================================================

export { default as serviceManager } from './ServiceManager';
export { default as analyticsService } from './AnalyticsService';
export { default as deepLinkService } from './DeepLinkService';
export { default as soundService } from './SoundService';
export { default as logger } from '../utils/logger';

// ========================================================================
// SYNC SERVICES (Phase 4.0 + 4.1 + Fusion)
// ========================================================================

export { default as webBridgeService } from './WebBridgeService';
export { default as bidirectionalSyncService } from './BidirectionalSyncService';
export { default as realtimeManager } from './RealtimeManager';
export { default as unifiedSyncService } from './UnifiedSyncService'; // Fusion Opción A

// ========================================================================
// GAME SERVICES (Phase 4.1 + 4.2 + 4.3)
// ========================================================================

export { default as eventsService } from './EventsService';
export { default as achievementsService } from './AchievementsService';
export { default as clansService } from './ClansService';

// ========================================================================
// NEW MECHANICS SERVICES (Phase 5.0 - La Gran Transición)
// ========================================================================

export { default as powerNodesService } from './PowerNodesService';
export { default as hiddenBeingsService } from './HiddenBeingsService';
export { default as corruptionService } from './CorruptionService';
export { default as knowledgeQuizService } from './KnowledgeQuizService';
export { default as explorationService } from './ExplorationService';
export { default as evolutionService } from './EvolutionService';
export { default as transitionService } from './TransitionService';
export { default as guardiansService } from './GuardiansService';
export { default as institutionsService } from './InstitutionsService';

// ========================================================================
// CONVENIENCE EXPORTS
// ========================================================================

/**
 * Obtiene todos los servicios de juego en un objeto
 */
export const getGameServices = () => ({
  events: require('./EventsService').default,
  achievements: require('./AchievementsService').default,
  clans: require('./ClansService').default
});

/**
 * Obtiene todos los servicios de sincronización
 */
export const getSyncServices = () => ({
  webBridge: require('./WebBridgeService').default,
  bidirectionalSync: require('./BidirectionalSyncService').default,
  realtime: require('./RealtimeManager').default,
  unifiedSync: require('./UnifiedSyncService').default
});
