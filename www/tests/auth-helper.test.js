/**
 * Auth Helper Tests
 *
 * Tests for the AuthHelper class which manages authentication,
 * session handling, subscription tiers, and error handling.
 *
 * NOTE: The AuthHelper constructor calls this.init() immediately,
 * so we mock Supabase before requiring the module.
 */

// ---------------------------------------------------------------------------
// Mock Supabase client BEFORE loading AuthHelper
// ---------------------------------------------------------------------------
const mockAuthGetSession = jest.fn(() =>
  Promise.resolve({ data: { session: null } })
);

const mockAuthOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } }
}));

const mockAuthSignUp = jest.fn();
const mockAuthSignInWithPassword = jest.fn();
const mockAuthSignInWithOAuth = jest.fn();
const mockAuthSignOut = jest.fn(() => Promise.resolve({ error: null }));
const mockAuthResetPasswordForEmail = jest.fn();
const mockAuthUpdateUser = jest.fn();
const mockAuthSignInAnonymously = jest.fn();

const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(() => Promise.resolve({ data: null, error: null }))
}));

const mockSupabaseRpc = jest.fn(() => Promise.resolve({ data: true, error: null }));

const mockSupabaseClient = {
  auth: {
    getSession: mockAuthGetSession,
    onAuthStateChange: mockAuthOnAuthStateChange,
    signUp: mockAuthSignUp,
    signInWithPassword: mockAuthSignInWithPassword,
    signInWithOAuth: mockAuthSignInWithOAuth,
    signOut: mockAuthSignOut,
    resetPasswordForEmail: mockAuthResetPasswordForEmail,
    updateUser: mockAuthUpdateUser,
    signInAnonymously: mockAuthSignInAnonymously
  },
  from: mockSupabaseFrom,
  rpc: mockSupabaseRpc,
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.png' } }))
    }))
  }
};

// Set up window.supabase library mock (the createClient factory)
window.supabase = {
  createClient: jest.fn(() => mockSupabaseClient)
};
window.supabaseClient = mockSupabaseClient;

// Now load the module (AuthHelper constructor will call init())
require('../js/core/auth-helper.js');

describe('AuthHelper', () => {
  let authHelper;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockAuthGetSession.mockResolvedValue({ data: { session: null } });

    // Create fresh instance, bypassing constructor init
    authHelper = new (window.AuthHelper || window.authHelper.constructor)();
    authHelper.supabase = mockSupabaseClient;
    authHelper.initialized = true;
    authHelper.currentUser = null;
    authHelper.currentProfile = null;
    authHelper.session = null;
    authHelper.authStateListeners = [];
  });

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  describe('Initialization', () => {
    it('should create an instance with default values', () => {
      expect(authHelper.currentUser).toBeNull();
      expect(authHelper.currentProfile).toBeNull();
      expect(authHelper.session).toBeNull();
      expect(authHelper.authStateListeners).toEqual([]);
    });

    it('should have compatibility getter for user property', () => {
      authHelper.currentUser = { id: 'user-1', email: 'test@test.com' };
      expect(authHelper.user).toEqual({ id: 'user-1', email: 'test@test.com' });
    });

    it('should report as not authenticated when no user', () => {
      expect(authHelper.isAuthenticated()).toBe(false);
    });

    it('should report as authenticated when user exists', () => {
      authHelper.currentUser = { id: 'user-1' };
      expect(authHelper.isAuthenticated()).toBe(true);
    });
  });

  // ========================================================================
  // SESSION MANAGEMENT
  // ========================================================================
  describe('Session Management', () => {
    it('should load session and set user when session exists', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@test.com' },
        access_token: 'mock-token'
      };
      mockAuthGetSession.mockResolvedValueOnce({
        data: { session: mockSession }
      });

      // Mock loadUserProfile to avoid Supabase calls
      authHelper.loadUserProfile = jest.fn(() => Promise.resolve(null));

      await authHelper.loadSession();

      expect(authHelper.currentUser).toEqual(mockSession.user);
      expect(authHelper.session).toEqual(mockSession);
    });

    it('should handle load session with no active session', async () => {
      mockAuthGetSession.mockResolvedValueOnce({
        data: { session: null }
      });

      await authHelper.loadSession();
      expect(authHelper.currentUser).toBeNull();
    });

    it('should handle load session errors', async () => {
      mockAuthGetSession.mockRejectedValueOnce(new Error('Session error'));

      await authHelper.loadSession();
      // Should not throw, just log the error
      expect(logger.error).toHaveBeenCalled();
    });

    it('should get current session', () => {
      const mockSession = { access_token: 'abc123' };
      authHelper.session = mockSession;
      expect(authHelper.getSession()).toBe(mockSession);
    });

    it('should get access token from session', async () => {
      authHelper.session = { access_token: 'my-token' };
      const token = await authHelper.getAccessToken();
      expect(token).toBe('my-token');
    });

    it('should attempt to get access token from Supabase when no session', async () => {
      authHelper.session = null;
      mockAuthGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'fresh-token' } }
      });

      const token = await authHelper.getAccessToken();
      expect(token).toBe('fresh-token');
    });
  });

  // ========================================================================
  // LOGIN / LOGOUT FLOWS
  // ========================================================================
  describe('Login / Logout Flows', () => {
    it('should sign in with email and password', async () => {
      const mockData = {
        user: { id: 'user-1', email: 'test@test.com' },
        session: { access_token: 'token' }
      };
      mockAuthSignInWithPassword.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await authHelper.signIn('test@test.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockAuthSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123'
      });
    });

    it('should return error on sign in failure', async () => {
      mockAuthSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      // The method throws when error exists
      const result = await authHelper.signIn('wrong@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should sign up a new user', async () => {
      const mockData = { user: { id: 'new-user' } };
      mockAuthSignUp.mockResolvedValueOnce({ data: mockData, error: null });

      // Mock showEmailConfirmationMessage to avoid DOM manipulation
      authHelper.showEmailConfirmationMessage = jest.fn();

      const result = await authHelper.signUp('new@test.com', 'pass123', 'Test User');

      expect(result.success).toBe(true);
      expect(mockAuthSignUp).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@test.com',
        password: 'pass123'
      }));
    });

    it('should return error on sign up failure', async () => {
      mockAuthSignUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already taken' }
      });

      const result = await authHelper.signUp('taken@test.com', 'pass123', 'User');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already taken');
    });

    it('should sign out successfully', async () => {
      authHelper.currentUser = { id: 'user-1' };
      authHelper.currentProfile = { id: 'user-1' };

      const result = await authHelper.signOut();

      expect(result.success).toBe(true);
      expect(authHelper.currentUser).toBeNull();
      expect(authHelper.currentProfile).toBeNull();
    });

    it('should handle sign out errors', async () => {
      mockAuthSignOut.mockResolvedValueOnce({
        error: { message: 'Sign out failed' }
      });

      const result = await authHelper.signOut();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });

    it('should reset password', async () => {
      mockAuthResetPasswordForEmail.mockResolvedValueOnce({ error: null });
      authHelper.showNotification = jest.fn();

      const result = await authHelper.resetPassword('test@test.com');

      expect(result.success).toBe(true);
      expect(mockAuthResetPasswordForEmail).toHaveBeenCalledWith(
        'test@test.com',
        expect.any(Object)
      );
    });

    it('should update password', async () => {
      mockAuthUpdateUser.mockResolvedValueOnce({ error: null });
      authHelper.showNotification = jest.fn();

      const result = await authHelper.updatePassword('newpass123');

      expect(result.success).toBe(true);
      expect(mockAuthUpdateUser).toHaveBeenCalledWith({ password: 'newpass123' });
    });

    it('should sign in with Google', async () => {
      mockAuthSignInWithOAuth.mockResolvedValueOnce({
        data: { url: 'https://google.com/auth' },
        error: null
      });

      const result = await authHelper.signInWithGoogle();

      expect(result.success).toBe(true);
      expect(mockAuthSignInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'google'
      }));
    });
  });

  // ========================================================================
  // AUTH STATE LISTENERS
  // ========================================================================
  describe('Auth State Listeners', () => {
    it('should register auth state listener', () => {
      const listener = jest.fn();
      authHelper.onAuthStateChange(listener);

      expect(authHelper.authStateListeners).toContain(listener);
    });

    it('should call listener immediately if user is already signed in', () => {
      authHelper.currentUser = { id: 'user-1' };
      const listener = jest.fn();

      authHelper.onAuthStateChange(listener);

      expect(listener).toHaveBeenCalledWith('signed_in', { id: 'user-1' });
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = authHelper.onAuthStateChange(listener);

      expect(authHelper.authStateListeners).toHaveLength(1);

      unsubscribe();

      expect(authHelper.authStateListeners).toHaveLength(0);
    });

    it('should notify all listeners on state change', () => {
      const listenerA = jest.fn();
      const listenerB = jest.fn();

      authHelper.onAuthStateChange(listenerA);
      authHelper.onAuthStateChange(listenerB);

      authHelper.notifyAuthStateChange('signed_in', { id: 'user-1' });

      expect(listenerA).toHaveBeenCalledWith('signed_in', { id: 'user-1' });
      expect(listenerB).toHaveBeenCalledWith('signed_in', { id: 'user-1' });
    });

    it('should handle errors in listeners gracefully', () => {
      const failingListener = jest.fn(() => { throw new Error('Listener crash'); });
      const okListener = jest.fn();

      authHelper.onAuthStateChange(failingListener);
      authHelper.onAuthStateChange(okListener);

      // Should not throw
      authHelper.notifyAuthStateChange('signed_out', null);

      // Both should have been called
      expect(failingListener).toHaveBeenCalled();
      expect(okListener).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // SUBSCRIPTION AND FEATURES
  // ========================================================================
  describe('Subscription and Features', () => {
    it('should return free tier when no profile exists', () => {
      authHelper.currentProfile = null;
      expect(authHelper.getSubscriptionTier()).toBe('free');
    });

    it('should return subscription tier from profile', () => {
      authHelper.currentProfile = { subscription_tier: 'premium' };
      expect(authHelper.getSubscriptionTier()).toBe('premium');
    });

    it('should check if subscription is active', () => {
      authHelper.currentProfile = { subscription_status: 'active' };
      expect(authHelper.isSubscriptionActive()).toBe(true);

      authHelper.currentProfile = { subscription_status: 'expired' };
      expect(authHelper.isSubscriptionActive()).toBe(false);
    });

    it('should identify premium users', () => {
      authHelper.currentProfile = { subscription_tier: 'premium' };
      expect(authHelper.isPremium()).toBe(true);

      authHelper.currentProfile = { subscription_tier: 'pro' };
      expect(authHelper.isPremium()).toBe(true);

      authHelper.currentProfile = { subscription_tier: 'free' };
      expect(authHelper.isPremium()).toBe(false);
    });

    it('should identify trial users', () => {
      authHelper.currentProfile = { subscription_status: 'trialing' };
      expect(authHelper.isOnTrial()).toBe(true);

      authHelper.currentProfile = { subscription_status: 'active' };
      expect(authHelper.isOnTrial()).toBe(false);
    });

    it('should return AI credits from profile', () => {
      authHelper.currentProfile = { ai_credits_remaining: 150 };
      expect(authHelper.getAICredits()).toBe(150);
    });

    it('should return 0 credits when no profile', () => {
      authHelper.currentProfile = null;
      expect(authHelper.getAICredits()).toBe(0);
    });

    it('should check if user has enough credits', () => {
      authHelper.currentProfile = { ai_credits_remaining: 100 };
      expect(authHelper.hasEnoughCredits(50)).toBe(true);
      expect(authHelper.hasEnoughCredits(100)).toBe(true);
      expect(authHelper.hasEnoughCredits(101)).toBe(false);
    });

    it('should check features using hasFeature (fallback path)', () => {
      delete window.PLANS_CONFIG;
      authHelper.currentProfile = { subscription_tier: 'premium' };
      expect(authHelper.hasFeature('ai_chat')).toBe(true);
      expect(authHelper.hasFeature('nonexistent_feature')).toBe(false);
    });

    it('should return false for hasFeature when no profile', () => {
      authHelper.currentProfile = null;
      expect(authHelper.hasFeature('ai_chat')).toBe(false);
    });

    it('should get plan info', () => {
      authHelper.currentProfile = { subscription_tier: 'premium' };
      const planInfo = authHelper.getPlanInfo();
      expect(planInfo.name).toBe('Premium');
      expect(planInfo.icon).toBeDefined();
    });

    it('should return free plan info by default', () => {
      authHelper.currentProfile = null;
      const planInfo = authHelper.getPlanInfo();
      expect(planInfo.name).toBe('Gratuito');
    });

    it('should calculate days until renewal', () => {
      const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      authHelper.currentProfile = { subscription_end: tenDaysFromNow.toISOString() };

      const daysRemaining = authHelper.getDaysUntilRenewal();
      expect(daysRemaining).toBe(10);
    });

    it('should return null for days until renewal when no end date', () => {
      authHelper.currentProfile = {};
      expect(authHelper.getDaysUntilRenewal()).toBeNull();
    });
  });

  // ========================================================================
  // RETRY LOGIC
  // ========================================================================
  describe('Retry Logic', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn(() => Promise.resolve({ data: 'success' }));
      const result = await authHelper.executeWithRetry(operation);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on recoverable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValueOnce({ data: 'recovered' });

      const result = await authHelper.executeWithRetry(operation, 3, 10);

      expect(result).toEqual({ data: 'recovered' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const operation = jest.fn(() => Promise.reject(new Error('Failed to fetch')));

      await expect(
        authHelper.executeWithRetry(operation, 2, 10)
      ).rejects.toThrow('Failed to fetch');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-recoverable errors', async () => {
      const operation = jest.fn(() => Promise.reject(new Error('Permission denied')));

      await expect(
        authHelper.executeWithRetry(operation, 3, 10)
      ).rejects.toThrow('Permission denied');

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================
  describe('Error Handling', () => {
    it('should identify recoverable errors', () => {
      expect(authHelper.isRecoverableError({ message: 'Network request failed' })).toBe(true);
      expect(authHelper.isRecoverableError({ message: 'Failed to fetch' })).toBe(true);
      expect(authHelper.isRecoverableError({ message: 'timeout occurred' })).toBe(true);
      expect(authHelper.isRecoverableError({ message: 'Too many requests' })).toBe(true);
      expect(authHelper.isRecoverableError({ code: '503' })).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      expect(authHelper.isRecoverableError({ message: 'Permission denied' })).toBe(false);
      expect(authHelper.isRecoverableError({ message: 'Invalid credentials' })).toBe(false);
      expect(authHelper.isRecoverableError(null)).toBe(false);
    });

    it('should categorize network errors', () => {
      const category = authHelper.categorizeSupabaseError({ message: 'Failed to fetch' });
      expect(category).toBe('network');
    });

    it('should categorize auth errors', () => {
      const category = authHelper.categorizeSupabaseError({ code: 'auth_error', message: '' });
      expect(category).toBe('auth');
    });

    it('should categorize permission errors', () => {
      const category = authHelper.categorizeSupabaseError({ code: 'pgrst301', message: '' });
      expect(category).toBe('permission');
    });

    it('should categorize validation errors', () => {
      const category = authHelper.categorizeSupabaseError({ code: '23505', message: '' });
      expect(category).toBe('validation');
    });

    it('should categorize session expired errors', () => {
      const category = authHelper.categorizeSupabaseError({ code: 'refresh_token_invalid', message: '' });
      expect(category).toBe('session_expired');
    });

    it('should categorize insufficient credits errors', () => {
      const category = authHelper.categorizeSupabaseError({ message: 'Créditos insuficientes', code: '' });
      expect(category).toBe('insufficient_credits');
    });

    it('should return unknown for null error', () => {
      expect(authHelper.categorizeSupabaseError(null)).toBe('unknown');
    });

    it('should handle supabase error with structured logging', () => {
      const error = { message: 'Test error', code: '500', details: 'details', hint: 'hint' };
      const category = authHelper.handleSupabaseError(error, 'testContext');

      expect(category).toBe('fatal');
      expect(logger.group).toHaveBeenCalled();
      expect(logger.groupEnd).toHaveBeenCalled();
    });

    it('should capture error in ErrorBoundary when available', () => {
      const captureError = jest.fn();
      window.errorBoundary = { captureError };
      const error = { message: 'boundary test', code: '500', details: 'd' };

      authHelper.handleSupabaseError(error, 'consumeTokens');

      expect(captureError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          context: 'supabase_consumeTokens',
          filename: 'auth-helper.js'
        })
      );
    });

    it('should notify user for user_action_required category', () => {
      authHelper.notifyUserOfError = jest.fn();
      const error = { message: 'email not confirmed', code: '' };

      const category = authHelper.handleSupabaseError(error, 'signup');

      expect(category).toBe('user_action_required');
      expect(authHelper.notifyUserOfError).toHaveBeenCalledWith(error, 'user_action_required', 'signup');
    });

    it('should fallback to logger when toast is unavailable', () => {
      const previousToast = window.toast;
      window.toast = null;

      authHelper.notifyUserOfError({ message: 'boom' }, 'fatal', 'ctx');

      expect(logger.error).toHaveBeenCalled();
      window.toast = previousToast;
    });

    it('should trigger delayed signOut on session expired', () => {
      jest.useFakeTimers();
      authHelper.signOut = jest.fn();

      authHelper.notifyUserOfError({ message: 'expired' }, 'session_expired', 'ctx');
      jest.advanceTimersByTime(2100);

      expect(authHelper.signOut).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should estimate costs correctly', () => {
      const cost = authHelper.estimateCost(1000, 'openai', 'gpt-4o');
      expect(parseFloat(cost)).toBeCloseTo(0.005, 3);
    });

    it('should use default cost for unknown models', () => {
      const cost = authHelper.estimateCost(1000, 'unknown', 'unknown-model');
      expect(parseFloat(cost)).toBeCloseTo(0.002, 3);
    });
  });

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  describe('Utility Methods', () => {
    it('should get current user', () => {
      authHelper.currentUser = { id: 'user-1' };
      expect(authHelper.getUser()).toEqual({ id: 'user-1' });
      expect(authHelper.getCurrentUser()).toEqual({ id: 'user-1' });
    });

    it('should get current profile', () => {
      authHelper.currentProfile = { subscription_tier: 'free' };
      expect(authHelper.getProfile()).toEqual({ subscription_tier: 'free' });
    });

    it('should group array by key function', () => {
      const items = [
        { type: 'a' }, { type: 'b' }, { type: 'a' }, { type: 'c' }, { type: 'b' }
      ];
      const grouped = authHelper.groupBy(items, (item) => item.type);
      expect(grouped).toEqual({ a: 2, b: 2, c: 1 });
    });

    it('should delay for specified ms', async () => {
      const startTime = Date.now();
      await authHelper.delay(50);
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow slight timing variance
    });

    it('should show notification using toast when available', () => {
      authHelper.showNotification('Test message', 'success');
      expect(window.toast.success).toHaveBeenCalledWith('Test message');

      authHelper.showNotification('Error msg', 'error');
      expect(window.toast.error).toHaveBeenCalledWith('Error msg');

      authHelper.showNotification('Info msg', 'info');
      expect(window.toast.info).toHaveBeenCalledWith('Info msg');
    });

    it('should return empty error stats when ErrorBoundary is unavailable', () => {
      window.errorBoundary = null;

      expect(authHelper.getErrorStats()).toEqual({
        total: 0,
        byCategory: {},
        recent: []
      });
    });

    it('should aggregate error stats from ErrorBoundary log', () => {
      window.errorBoundary = {
        getErrorLog: jest.fn(() => [
          { context: 'supabase_login', category: 'auth', filename: 'auth-helper.js' },
          { context: 'supabase_profile', category: 'network', filename: 'auth-helper.js' },
          { context: 'other', category: 'other', filename: 'other.js' }
        ])
      };

      const stats = authHelper.getErrorStats();

      expect(stats.total).toBe(2);
      expect(stats.byCategory.auth).toBe(1);
      expect(stats.byCategory.network).toBe(1);
      expect(stats.recent).toHaveLength(2);
    });
  });
});
