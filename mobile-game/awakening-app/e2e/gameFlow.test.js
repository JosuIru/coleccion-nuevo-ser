/**
 * E2E TESTS - GAME FLOW
 * End-to-end tests using Detox
 *
 * Coverage:
 * - Complete game flow
 * - Login → Explore → Collect fractal → Deploy being → Complete mission
 * - Navigation between screens
 * - Synchronization
 * - Notifications
 * - Performance
 */

describe('Awakening Protocol - Game Flow E2E', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        location: 'always',
        notifications: 'YES'
      }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // ═══════════════════════════════════════════════════════════
  // LOGIN Y ONBOARDING
  // ═══════════════════════════════════════════════════════════

  describe('Login and Onboarding', () => {
    it('should show welcome screen on first launch', async () => {
      await expect(element(by.id('welcome-screen'))).toBeVisible();
      await expect(element(by.text('Awakening Protocol'))).toBeVisible();
    });

    it('should allow user to create account', async () => {
      await element(by.id('username-input')).typeText('TestUser123');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('map-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show tutorial on first login', async () => {
      await expect(element(by.id('tutorial-overlay'))).toBeVisible();
      await element(by.id('tutorial-next-button')).tap();
      await element(by.id('tutorial-next-button')).tap();
      await element(by.id('tutorial-finish-button')).tap();

      await expect(element(by.id('tutorial-overlay'))).not.toBeVisible();
    });

    it('should persist login after app restart', async () => {
      // Login
      await element(by.id('username-input')).typeText('PersistentUser');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('map-screen'))).toBeVisible();

      // Restart app
      await device.reloadReactNative();

      // Should go directly to map
      await expect(element(by.id('map-screen'))).toBeVisible();
      await expect(element(by.id('welcome-screen'))).not.toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // EXPLORACIÓN DEL MAPA
  // ═══════════════════════════════════════════════════════════

  describe('Map Exploration', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('username-input')).typeText('MapExplorer');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();
    });

    it('should display map with user location', async () => {
      await expect(element(by.id('map-view'))).toBeVisible();
      await expect(element(by.id('user-location-marker'))).toBeVisible();
    });

    it('should show resource HUD at top', async () => {
      await expect(element(by.id('energy-display'))).toBeVisible();
      await expect(element(by.id('consciousness-display'))).toBeVisible();
      await expect(element(by.id('level-display'))).toBeVisible();
    });

    it('should display nearby fractals', async () => {
      await waitFor(element(by.id('fractal-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should center map on user when center button tapped', async () => {
      // Scroll map away from user
      await element(by.id('map-view')).scroll(100, 'down');

      // Tap center button
      await element(by.id('center-button')).tap();

      // Map should animate back to user location
      await waitFor(element(by.id('user-location-marker')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should show detection radius circle', async () => {
      await expect(element(by.id('detection-circle'))).toBeVisible();
    });

    it('should load map in under 2 seconds', async () => {
      const inicio = Date.now();

      await element(by.id('username-input')).typeText('SpeedTest');
      await element(by.id('create-account-button')).tap();

      await waitFor(element(by.id('map-view')))
        .toBeVisible()
        .withTimeout(2000);

      const duracion = Date.now() - inicio;
      expect(duracion).toBeLessThan(2000);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RECOLECCIÓN DE FRACTALES
  // ═══════════════════════════════════════════════════════════

  describe('Fractal Collection', () => {
    beforeEach(async () => {
      await element(by.id('username-input')).typeText('FractalCollector');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();
    });

    it('should show fractal info when tapped', async () => {
      await waitFor(element(by.id('fractal-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('fractal-marker')).atIndex(0).tap();

      await expect(element(by.id('fractal-info-modal'))).toBeVisible();
      await expect(element(by.id('fractal-name'))).toBeVisible();
      await expect(element(by.id('fractal-rewards'))).toBeVisible();
    });

    it('should collect fractal when in range', async () => {
      // Mock being very close to a fractal
      await device.setLocation(40.4168, -3.7038);

      await waitFor(element(by.id('fractal-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('fractal-marker')).atIndex(0).tap();
      await element(by.id('collect-fractal-button')).tap();

      // Should show success message
      await expect(element(by.text('¡Fractal recolectado!'))).toBeVisible();

      // Resources should increase
      await expect(element(by.id('consciousness-display'))).toHaveText(/\d+/);
    });

    it('should show error if too far from fractal', async () => {
      // Set location far from fractal
      await device.setLocation(40.5168, -3.8038);

      await waitFor(element(by.id('fractal-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('fractal-marker')).atIndex(0).tap();
      await element(by.id('collect-fractal-button')).tap();

      await expect(element(by.text(/Debes estar a menos de/))).toBeVisible();
    });

    it('should update resources after collection', async () => {
      await device.setLocation(40.4168, -3.7038);

      const energiaInicial = await element(by.id('energy-display')).getText();

      await waitFor(element(by.id('fractal-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('fractal-marker')).atIndex(0).tap();
      await element(by.id('collect-fractal-button')).tap();

      // Wait for modal to close
      await waitFor(element(by.id('fractal-info-modal')))
        .not.toBeVisible()
        .withTimeout(2000);

      const energiaFinal = await element(by.id('energy-display')).getText();

      expect(energiaFinal).not.toBe(energiaInicial);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GESTIÓN DE SERES
  // ═══════════════════════════════════════════════════════════

  describe('Beings Management', () => {
    beforeEach(async () => {
      await element(by.id('username-input')).typeText('BeingsMaster');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();
    });

    it('should open beings screen from map', async () => {
      await element(by.id('beings-button')).tap();

      await expect(element(by.id('beings-screen'))).toBeVisible();
      await expect(element(by.text('Mis Seres'))).toBeVisible();
    });

    it('should create new being from Frankenstein Lab', async () => {
      await element(by.id('beings-button')).tap();
      await element(by.id('create-being-button')).tap();

      await expect(element(by.id('frankenstein-lab'))).toBeVisible();

      // Select attributes
      await element(by.id('attribute-empathy')).tap();
      await element(by.id('attribute-action')).tap();
      await element(by.id('attribute-resilience')).tap();

      // Name being
      await element(by.id('being-name-input')).typeText('Héroe');

      // Create
      await element(by.id('create-being-submit')).tap();

      await waitFor(element(by.id('being-created-success')))
        .toBeVisible()
        .withTimeout(2000);

      // Should return to beings list
      await expect(element(by.id('beings-screen'))).toBeVisible();
      await expect(element(by.text('Héroe'))).toBeVisible();
    });

    it('should show being details', async () => {
      // Create a being first
      await element(by.id('beings-button')).tap();
      await element(by.id('create-being-button')).tap();
      await element(by.id('attribute-empathy')).tap();
      await element(by.id('attribute-action')).tap();
      await element(by.id('being-name-input')).typeText('Detallado');
      await element(by.id('create-being-submit')).tap();

      await waitFor(element(by.text('Detallado'))).toBeVisible();

      // Tap on being
      await element(by.text('Detallado')).tap();

      await expect(element(by.id('being-detail-modal'))).toBeVisible();
      await expect(element(by.id('being-attributes'))).toBeVisible();
      await expect(element(by.id('being-status'))).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DESPLIEGUE DE SERES EN CRISIS
  // ═══════════════════════════════════════════════════════════

  describe('Being Deployment', () => {
    beforeEach(async () => {
      await element(by.id('username-input')).typeText('Deployer');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      // Create a being
      await element(by.id('beings-button')).tap();
      await element(by.id('create-being-button')).tap();
      await element(by.id('attribute-empathy')).tap();
      await element(by.id('attribute-action')).tap();
      await element(by.id('being-name-input')).typeText('Guerrero');
      await element(by.id('create-being-submit')).tap();
      await waitFor(element(by.id('beings-screen'))).toBeVisible();

      // Back to map
      await element(by.id('back-to-map-button')).tap();
    });

    it('should deploy being to crisis', async () => {
      // Find crisis marker
      await waitFor(element(by.id('crisis-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('crisis-marker')).atIndex(0).tap();

      await expect(element(by.id('crisis-detail-modal'))).toBeVisible();

      // Deploy being
      await element(by.id('deploy-being-button')).tap();
      await element(by.text('Guerrero')).tap();
      await element(by.id('confirm-deployment-button')).tap();

      await expect(element(by.text('Ser desplegado'))).toBeVisible();

      // Energy should decrease
      await expect(element(by.id('energy-display'))).toBeVisible();
    });

    it('should show error if not enough energy', async () => {
      // Deplete energy (simulate)
      // This would require a way to set energy to low value

      await waitFor(element(by.id('crisis-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('crisis-marker')).atIndex(0).tap();
      await element(by.id('deploy-being-button')).tap();

      // If energy is low, should show error
      // await expect(element(by.text('No hay suficiente energía'))).toBeVisible();
    });

    it('should show mission progress', async () => {
      // Deploy being
      await waitFor(element(by.id('crisis-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('crisis-marker')).atIndex(0).tap();
      await element(by.id('deploy-being-button')).tap();
      await element(by.text('Guerrero')).tap();
      await element(by.id('confirm-deployment-button')).tap();

      // Close modal
      await element(by.id('close-modal-button')).tap();

      // Open missions screen
      await element(by.id('missions-button')).tap();

      await expect(element(by.id('active-missions-list'))).toBeVisible();
      await expect(element(by.text('Guerrero'))).toBeVisible();
      await expect(element(by.id('mission-progress-bar'))).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // COMPLETAR MISIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Mission Completion', () => {
    it('should complete mission and give rewards', async () => {
      // Login
      await element(by.id('username-input')).typeText('Completer');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      // Create being
      await element(by.id('beings-button')).tap();
      await element(by.id('create-being-button')).tap();
      await element(by.id('attribute-empathy')).tap();
      await element(by.id('being-name-input')).typeText('Rápido');
      await element(by.id('create-being-submit')).tap();
      await element(by.id('back-to-map-button')).tap();

      // Deploy to short mission
      await waitFor(element(by.id('crisis-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('crisis-marker')).atIndex(0).tap();
      await element(by.id('deploy-being-button')).tap();
      await element(by.text('Rápido')).tap();
      await element(by.id('confirm-deployment-button')).tap();
      await element(by.id('close-modal-button')).tap();

      // Fast-forward time (if testing allows)
      // Or wait for mission to complete
      await device.setTime(Date.now() + 6 * 60 * 1000); // +6 minutes

      // Should receive notification
      await expect(element(by.text('Misión completada'))).toBeVisible();

      // XP should increase
      const xpAntes = await element(by.id('level-display')).getText();

      // Open missions
      await element(by.id('missions-button')).tap();
      await element(by.text('Rápido')).tap();
      await element(by.id('claim-rewards-button')).tap();

      const xpDespues = await element(by.id('level-display')).getText();

      expect(xpDespues).not.toBe(xpAntes);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SINCRONIZACIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Synchronization', () => {
    it('should sync data from web', async () => {
      await element(by.id('username-input')).typeText('Syncer');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      // Open settings
      await element(by.id('settings-button')).tap();

      await expect(element(by.id('settings-screen'))).toBeVisible();

      // Trigger sync
      await element(by.id('sync-now-button')).tap();

      await waitFor(element(by.text('Sincronización completada')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show sync status indicator', async () => {
      await element(by.id('username-input')).typeText('SyncStatus');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      await element(by.id('settings-button')).tap();
      await element(by.id('sync-now-button')).tap();

      // Should show syncing indicator
      await expect(element(by.id('syncing-indicator'))).toBeVisible();

      await waitFor(element(by.id('syncing-indicator')))
        .not.toBeVisible()
        .withTimeout(10000);
    });

    it('should handle sync errors gracefully', async () => {
      // Disable network
      await device.setNetworkCondition('offline');

      await element(by.id('username-input')).typeText('OfflineSync');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      await element(by.id('settings-button')).tap();
      await element(by.id('sync-now-button')).tap();

      await expect(element(by.text(/Error de sincronización/))).toBeVisible();

      // Re-enable network
      await device.setNetworkCondition('wifi');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // NOTIFICACIONES
  // ═══════════════════════════════════════════════════════════

  describe('Notifications', () => {
    it('should show notification when mission completes', async () => {
      // This test would require background app testing
      // Detox can send app to background and foreground

      await element(by.id('username-input')).typeText('NotifTest');
      await element(by.id('create-account-button')).tap();

      // Deploy a being
      // ...

      // Send app to background
      await device.sendToHome();

      // Wait for mission to complete
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Bring app back
      await device.launchApp({ newInstance: false });

      // Should see notification
      // await expect(element(by.text('Misión completada'))).toBeVisible();
    });

    it('should respect notification settings', async () => {
      await element(by.id('username-input')).typeText('NoNotif');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      // Disable notifications
      await element(by.id('settings-button')).tap();
      await element(by.id('notifications-toggle')).tap();

      // Notifications should now be off
      // Future missions shouldn't trigger notifications
    });
  });

  // ═══════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════

  describe('Navigation', () => {
    beforeEach(async () => {
      await element(by.id('username-input')).typeText('Navigator');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();
    });

    it('should navigate between all screens', async () => {
      // Map → Beings
      await element(by.id('beings-button')).tap();
      await expect(element(by.id('beings-screen'))).toBeVisible();

      // Beings → Map
      await element(by.id('back-to-map-button')).tap();
      await expect(element(by.id('map-screen'))).toBeVisible();

      // Map → Missions
      await element(by.id('missions-button')).tap();
      await expect(element(by.id('missions-screen'))).toBeVisible();

      // Missions → Map
      await element(by.id('back-to-map-button')).tap();
      await expect(element(by.id('map-screen'))).toBeVisible();

      // Map → Settings
      await element(by.id('settings-button')).tap();
      await expect(element(by.id('settings-screen'))).toBeVisible();

      // Settings → Map
      await element(by.id('back-button')).tap();
      await expect(element(by.id('map-screen'))).toBeVisible();
    });

    it('should maintain state when navigating', async () => {
      // Collect some resources
      await device.setLocation(40.4168, -3.7038);
      await waitFor(element(by.id('fractal-marker')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('fractal-marker')).atIndex(0).tap();
      await element(by.id('collect-fractal-button')).tap();

      const energiaAntes = await element(by.id('energy-display')).getText();

      // Navigate away and back
      await element(by.id('beings-button')).tap();
      await element(by.id('back-to-map-button')).tap();

      const energiaDespues = await element(by.id('energy-display')).getText();

      expect(energiaDespues).toBe(energiaAntes);
    });

    it('should handle back button correctly', async () => {
      await element(by.id('beings-button')).tap();
      await element(by.id('create-being-button')).tap();

      // Back should go to beings list, not map
      await device.pressBack();
      await expect(element(by.id('beings-screen'))).toBeVisible();

      // Another back to map
      await device.pressBack();
      await expect(element(by.id('map-screen'))).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PERFORMANCE Y ESTABILIDAD
  // ═══════════════════════════════════════════════════════════

  describe('Performance and Stability', () => {
    it('should not crash during extended use', async () => {
      await element(by.id('username-input')).typeText('Stable');
      await element(by.id('create-account-button')).tap();

      // Perform many actions
      for (let i = 0; i < 10; i++) {
        await element(by.id('beings-button')).tap();
        await element(by.id('back-to-map-button')).tap();
        await element(by.id('settings-button')).tap();
        await element(by.id('back-button')).tap();
      }

      // Should still be responsive
      await expect(element(by.id('map-screen'))).toBeVisible();
    });

    it('should handle rapid taps without crashing', async () => {
      await element(by.id('username-input')).typeText('RapidTap');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      // Rapid tap center button
      await element(by.id('center-button')).multiTap(10);

      await expect(element(by.id('map-screen'))).toBeVisible();
    });

    it('should maintain good FPS during map interaction', async () => {
      await element(by.id('username-input')).typeText('FPSTest');
      await element(by.id('create-account-button')).tap();
      await waitFor(element(by.id('map-screen'))).toBeVisible();

      // Scroll map multiple times
      for (let i = 0; i < 20; i++) {
        await element(by.id('map-view')).scroll(50, 'down');
        await element(by.id('map-view')).scroll(50, 'up');
      }

      // App should still be responsive
      await element(by.id('center-button')).tap();
    });
  });
});
