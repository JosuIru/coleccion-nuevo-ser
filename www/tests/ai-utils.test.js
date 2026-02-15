/**
 * AI Utils Tests
 */

require('../js/core/ai-utils.js');

const AIUtils = window.AIUtils;

describe('AIUtils', () => {
  let aiUtils;

  beforeEach(() => {
    aiUtils = new AIUtils();

    window.authHelper = {
      user: null,
      getProfile: jest.fn(() => null)
    };

    window.aiConfig = {
      config: { provider: 'local', preferences: {} },
      getCurrentProvider: jest.fn(() => 'local'),
      isClaudeConfigured: jest.fn(() => false),
      isOpenAIConfigured: jest.fn(() => false),
      isGeminiConfigured: jest.fn(() => false),
      isQwenConfigured: jest.fn(() => false),
      isMistralConfigured: jest.fn(() => false),
      isHuggingFaceConfigured: jest.fn(() => false),
      getAvailableModels: jest.fn(() => [{ id: 'm1', name: 'Model 1' }]),
      getSelectedModel: jest.fn(() => 'm1'),
      getModelInfo: jest.fn(() => ({ name: 'Model 1' })),
      getProviderInfo: jest.fn(() => ({ claude: { getApiKey: 'https://keys' } })),
      saveConfig: jest.fn(),
      setSelectedModel: jest.fn()
    };

    window.aiPremium = undefined;
    window.Capacitor = undefined;
    window.cordova = undefined;
  });

  it('detects premium user from profile', () => {
    window.authHelper.getProfile.mockReturnValue({ subscription_tier: 'premium' });
    expect(aiUtils.isPremiumUser()).toBe(true);
  });

  it('detects AI access from token balance', () => {
    window.authHelper.getProfile.mockReturnValue({ subscription_tier: 'free', token_balance: 10 });
    expect(aiUtils.hasAIAccess()).toBe(true);
  });

  it('returns false AI access when profile missing', () => {
    window.authHelper.getProfile.mockReturnValue(null);
    expect(aiUtils.hasAIAccess()).toBe(false);
  });

  it('checks authentication via authHelper.user', () => {
    expect(aiUtils.isAuthenticated()).toBe(false);
    window.authHelper.user = { id: 'u1' };
    expect(aiUtils.isAuthenticated()).toBe(true);
  });

  it('detects native app with Capacitor', () => {
    window.Capacitor = {};
    expect(aiUtils.isNativeApp()).toBe(true);
  });

  it('returns current provider from aiConfig', () => {
    window.aiConfig.getCurrentProvider.mockReturnValue('gemini');
    expect(aiUtils.getCurrentProvider()).toBe('gemini');
  });

  it('validates provider configured matrix', () => {
    window.aiConfig.isClaudeConfigured.mockReturnValue(true);
    expect(aiUtils.isProviderConfigured('claude')).toBe(true);
    expect(aiUtils.isProviderConfigured('ollama')).toBe(true);
    expect(aiUtils.isProviderConfigured('local')).toBe(true);
    expect(aiUtils.isProviderConfigured('unknown')).toBe(false);
  });

  it('marks puter unavailable in native app', () => {
    window.Capacitor = {};
    expect(aiUtils.isProviderConfigured('puter')).toBe(false);
  });

  it('isAIAvailable true when has access', () => {
    jest.spyOn(aiUtils, 'hasAIAccess').mockReturnValue(true);
    expect(aiUtils.isAIAvailable()).toBe(true);
  });

  it('isAIAvailable false in local mode without access', () => {
    jest.spyOn(aiUtils, 'hasAIAccess').mockReturnValue(false);
    window.aiConfig.getCurrentProvider.mockReturnValue('local');
    expect(aiUtils.isAIAvailable()).toBe(false);
  });

  it('builds AI status with reason not_configured', () => {
    jest.spyOn(aiUtils, 'hasAIAccess').mockReturnValue(false);
    jest.spyOn(aiUtils, 'isPremiumUser').mockReturnValue(false);
    jest.spyOn(aiUtils, 'isAuthenticated').mockReturnValue(true);
    jest.spyOn(aiUtils, 'isNativeApp').mockReturnValue(false);
    window.aiConfig.getCurrentProvider.mockReturnValue('claude');
    window.aiConfig.isClaudeConfigured.mockReturnValue(false);

    const status = aiUtils.getAIStatus();
    expect(status.available).toBe(false);
    expect(status.reason).toBe('not_configured');
  });

  it('checkCredits returns true for premium user', async () => {
    jest.spyOn(aiUtils, 'isPremiumUser').mockReturnValue(true);
    await expect(aiUtils.checkCredits()).resolves.toBe(true);
  });

  it('checkCredits delegates to aiPremium when needed', async () => {
    jest.spyOn(aiUtils, 'isPremiumUser').mockReturnValue(false);
    jest.spyOn(aiUtils, 'isAuthenticated').mockReturnValue(true);
    window.aiPremium = { checkCredits: jest.fn(async () => true) };

    const ok = await aiUtils.checkCredits(1200, 'x');
    expect(ok).toBe(true);
    expect(window.aiPremium.checkCredits).toHaveBeenCalledWith(1200, 'x');
  });

  it('consumeCredits computes tokens and calls aiPremium', async () => {
    jest.spyOn(aiUtils, 'isPremiumUser').mockReturnValue(false);
    jest.spyOn(aiUtils, 'isAuthenticated').mockReturnValue(true);
    window.aiConfig.getCurrentProvider.mockReturnValue('gemini');
    window.aiConfig.getSelectedModel.mockReturnValue('g1');
    window.aiPremium = { consumeCredits: jest.fn(async () => {}) };

    await aiUtils.consumeCredits('abcd', 'abcdefgh', 'feature-x');
    expect(window.aiPremium.consumeCredits).toHaveBeenCalled();
  });

  it('renderAIStatusBanner returns empty when available and hidden', () => {
    jest.spyOn(aiUtils, 'getAIStatus').mockReturnValue({ available: true, isPremium: false, provider: 'claude' });
    expect(aiUtils.renderAIStatusBanner({ showWhenAvailable: false })).toBe('');
  });

  it('renderAvailableBadge supports compact premium', () => {
    const html = aiUtils.renderAvailableBadge({ isPremium: true }, true);
    expect(html).toContain('Premium');
  });

  it('renderUnavailableBanner renders configure/settings buttons', () => {
    const html = aiUtils.renderUnavailableBanner({
      reason: 'not_configured',
      provider: 'claude',
      isAuthenticated: true
    }, false);
    expect(html).toContain('ai-utils-settings-btn');
    expect(html).toContain('ai-utils-plans-btn');
  });

  it('renderProviderSelector renders provider selector for free users', () => {
    jest.spyOn(aiUtils, 'getAIStatus').mockReturnValue({ isPremium: false });
    const html = aiUtils.renderProviderSelector({ idPrefix: 'x' });
    expect(html).toContain('x-provider-selector');
  });

  it('attachBannerEvents binds and triggers actions', () => {
    document.body.innerHTML = `
      <div id="c">
        <button class="ai-utils-login-btn"></button>
        <button class="ai-utils-plans-btn"></button>
        <button class="ai-utils-settings-btn"></button>
      </div>
    `;

    const closeFn = jest.fn();
    window.authModal = { open: jest.fn() };
    window.openPremiumModal = jest.fn();
    window.aiSettingsModal = { open: jest.fn() };

    const container = document.getElementById('c');
    aiUtils.attachBannerEvents(container, closeFn);

    container.querySelector('.ai-utils-login-btn').click();
    container.querySelector('.ai-utils-plans-btn').click();
    container.querySelector('.ai-utils-settings-btn').click();

    expect(closeFn).toHaveBeenCalledTimes(3);
    expect(window.authModal.open).toHaveBeenCalled();
    expect(window.openPremiumModal).toHaveBeenCalled();
    expect(window.aiSettingsModal.open).toHaveBeenCalled();
  });

  it('attachProviderSelectorEvents updates provider config', () => {
    document.body.innerHTML = `
      <div id="c">
        <div class="flex">
          <select id="z-provider-selector"><option value="gemini">gemini</option></select>
          <span class="rounded-full"></span>
        </div>
        <select id="z-model-selector"><option value="m1">m1</option></select>
      </div>
    `;

    const container = document.getElementById('c');
    aiUtils.attachProviderSelectorEvents(container, 'z');

    const providerSelect = container.querySelector('#z-provider-selector');
    providerSelect.value = 'gemini';
    providerSelect.dispatchEvent(new Event('change'));

    const modelSelect = container.querySelector('#z-model-selector');
    modelSelect.value = 'm1';
    modelSelect.dispatchEvent(new Event('change'));

    expect(window.aiConfig.saveConfig).toHaveBeenCalled();
    expect(window.aiConfig.setSelectedModel).toHaveBeenCalledWith('m1');
  });

  it('formats specific error messages', () => {
    expect(aiUtils.formatErrorMessage(new Error('invalid API key'))).toContain('autenticación');
    expect(aiUtils.formatErrorMessage(new Error('credit exhausted'))).toContain('créditos');
    expect(aiUtils.formatErrorMessage(new Error('rate limit exceeded'))).toContain('Límite');
  });

  it('showErrorToast maps message classes to toast channels', () => {
    aiUtils.showErrorToast(new Error('invalid API key'));
    expect(window.toast.error).toHaveBeenCalled();

    aiUtils.showErrorToast(new Error('rate limit exceeded'));
    expect(window.toast.warning).toHaveBeenCalled();
  });
});
