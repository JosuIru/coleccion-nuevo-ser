/**
 * AudioReader TTS Engine Tests
 *
 * Tests for the AudioReaderTTSEngine class which manages text-to-speech
 * synthesis across multiple providers (browser, native, OpenAI, ElevenLabs).
 */

// Load the source file which assigns AudioReaderTTSEngine to window
require('../js/features/audioreader/audioreader-tts-engine.js');

const AudioReaderTTSEngine = window.AudioReaderTTSEngine;

describe('AudioReaderTTSEngine', () => {
  let ttsEngine;
  let mockAudioReader;

  beforeEach(() => {
    // Reset speech synthesis mock state
    window.speechSynthesis.speaking = false;
    window.speechSynthesis.paused = false;
    window.speechSynthesis.pending = false;
    window.speechSynthesis.getVoices.mockReturnValue([]);

    // Ensure Capacitor is not present by default
    delete window.Capacitor;

    mockAudioReader = {
      bookEngine: {
        currentBook: 'test-book',
        currentChapter: 'cap1'
      }
    };

    ttsEngine = new AudioReaderTTSEngine(mockAudioReader);
  });

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  describe('Initialization', () => {
    it('should create an instance with default values', () => {
      expect(ttsEngine).toBeInstanceOf(AudioReaderTTSEngine);
      expect(ttsEngine.audioReader).toBe(mockAudioReader);
      expect(ttsEngine.synthesis).toBe(window.speechSynthesis);
      expect(ttsEngine.utterance).toBeNull();
      expect(ttsEngine.nativeTTS).toBeNull();
      expect(ttsEngine.ttsManager).toBeNull();
      expect(ttsEngine.isInitialized).toBe(false);
      expect(ttsEngine.initPromise).toBeNull();
    });

    it('should default provider to browser', () => {
      expect(ttsEngine.provider).toBe('browser');
    });

    it('should load saved provider from localStorage', () => {
      localStorage.setItem('tts-provider', 'openai');
      const engineWithSaved = new AudioReaderTTSEngine(mockAudioReader);
      expect(engineWithSaved.provider).toBe('openai');
    });

    it('should load saved voice URI from localStorage', () => {
      localStorage.setItem('preferred-tts-voice', 'com.google.es-ES');
      const engineWithVoice = new AudioReaderTTSEngine(mockAudioReader);
      expect(engineWithVoice.selectedVoiceURI).toBe('com.google.es-ES');
    });

    it('should detect Capacitor platform', () => {
      window.Capacitor = { isNative: true, getPlatform: () => 'android' };
      const capacitorEngine = new AudioReaderTTSEngine(mockAudioReader);
      expect(capacitorEngine.isCapacitor).toBe(true);
      expect(capacitorEngine.isAndroid).toBe(true);
      delete window.Capacitor;
    });

    it('should detect non-Capacitor environment', () => {
      expect(ttsEngine.isCapacitor).toBe(false);
      expect(ttsEngine.isAndroid).toBe(false);
    });

    it('should initialize only once (singleton pattern)', async () => {
      // Set up voices so loadVoices works
      window.speechSynthesis.getVoices.mockReturnValue([
        { lang: 'es-ES', voiceURI: 'spanish-voice', name: 'Spanish' }
      ]);

      await ttsEngine.init();
      expect(ttsEngine.isInitialized).toBe(true);

      // Second init should be a no-op
      const initPromise = ttsEngine.initPromise;
      await ttsEngine.init();
      // Should not create a new promise
      expect(ttsEngine.isInitialized).toBe(true);
    });
  });

  // ========================================================================
  // VOICE SELECTION
  // ========================================================================
  describe('Voice Selection', () => {
    it('should select the best Spanish voice', () => {
      const mockVoices = [
        { lang: 'en-US', voiceURI: 'english', name: 'English' },
        { lang: 'es-MX', voiceURI: 'spanish-mx', name: 'Spanish Mexico' },
        { lang: 'es-ES', voiceURI: 'spanish-es', name: 'Spanish Spain' },
        { lang: 'fr-FR', voiceURI: 'french', name: 'French' }
      ];
      window.speechSynthesis.getVoices.mockReturnValue(mockVoices);

      ttsEngine.selectBestVoice();

      expect(ttsEngine.selectedVoice).toBeDefined();
      // Should prefer es-ES over es-MX
      expect(ttsEngine.selectedVoice.voiceURI).toBe('spanish-es');
    });

    it('should fallback to first Spanish voice when es-ES is unavailable', () => {
      const mockVoices = [
        { lang: 'en-US', voiceURI: 'english', name: 'English' },
        { lang: 'es-MX', voiceURI: 'spanish-mx', name: 'Spanish Mexico' }
      ];
      window.speechSynthesis.getVoices.mockReturnValue(mockVoices);

      ttsEngine.selectBestVoice();

      expect(ttsEngine.selectedVoice.voiceURI).toBe('spanish-mx');
    });

    it('should fallback to first available voice when no Spanish voice exists', () => {
      const mockVoices = [
        { lang: 'en-US', voiceURI: 'english', name: 'English' }
      ];
      window.speechSynthesis.getVoices.mockReturnValue(mockVoices);

      ttsEngine.selectBestVoice();

      expect(ttsEngine.selectedVoice.voiceURI).toBe('english');
    });

    it('should use saved preferred voice when available', () => {
      ttsEngine.selectedVoiceURI = 'preferred-voice';
      const mockVoices = [
        { lang: 'es-ES', voiceURI: 'spanish-es', name: 'Spanish' },
        { lang: 'es-ES', voiceURI: 'preferred-voice', name: 'Preferred' }
      ];
      window.speechSynthesis.getVoices.mockReturnValue(mockVoices);

      ttsEngine.selectBestVoice();

      expect(ttsEngine.selectedVoice.voiceURI).toBe('preferred-voice');
    });

    it('should handle empty voices list', () => {
      window.speechSynthesis.getVoices.mockReturnValue([]);
      ttsEngine.selectBestVoice();
      expect(ttsEngine.selectedVoice).toBeNull();
    });

    it('should set voice and save to localStorage', () => {
      const mockVoices = [
        { lang: 'es-ES', voiceURI: 'new-voice', name: 'New Voice' }
      ];
      window.speechSynthesis.getVoices.mockReturnValue(mockVoices);

      ttsEngine.setVoice('new-voice');

      expect(ttsEngine.selectedVoiceURI).toBe('new-voice');
      expect(localStorage.setItem).toHaveBeenCalledWith('preferred-tts-voice', 'new-voice');
      expect(ttsEngine.selectedVoice).toBeDefined();
      expect(ttsEngine.selectedVoice.voiceURI).toBe('new-voice');
    });

    it('should get available voices filtered to Spanish', async () => {
      const mockVoices = [
        { lang: 'es-ES', voiceURI: 'v1', name: 'Spanish' },
        { lang: 'en-US', voiceURI: 'v2', name: 'English' },
        { lang: 'es-MX', voiceURI: 'v3', name: 'Mexico' }
      ];
      window.speechSynthesis.getVoices.mockReturnValue(mockVoices);

      const voices = await ttsEngine.getAvailableVoices();
      expect(voices).toHaveLength(2);
      expect(voices.every((v) => v.lang.startsWith('es'))).toBe(true);
    });

    it('should return empty array when synthesis is unavailable', async () => {
      ttsEngine.synthesis = null;
      const voices = await ttsEngine.getAvailableVoices();
      expect(voices).toEqual([]);
    });
  });

  // ========================================================================
  // RATE CONTROL
  // ========================================================================
  describe('Rate Control', () => {
    it('should set rate and save to localStorage', () => {
      ttsEngine.setRate(1.5);
      expect(ttsEngine.rate).toBe(1.5);
      expect(localStorage.setItem).toHaveBeenCalledWith('tts-rate', '1.5');
    });

    it('should clamp rate to minimum 0.5', () => {
      ttsEngine.setRate(0.1);
      expect(ttsEngine.rate).toBe(0.5);
    });

    it('should clamp rate to maximum 2.0', () => {
      ttsEngine.setRate(3.0);
      expect(ttsEngine.rate).toBe(2.0);
    });

    it('should get current rate', () => {
      ttsEngine.rate = 1.2;
      expect(ttsEngine.getRate()).toBe(1.2);
    });
  });

  // ========================================================================
  // PROVIDER MANAGEMENT
  // ========================================================================
  describe('Provider Management', () => {
    it('should set valid provider', () => {
      const result = ttsEngine.setProvider('browser');
      expect(result).toBe(true);
      expect(ttsEngine.provider).toBe('browser');
    });

    it('should reject invalid provider', () => {
      const result = ttsEngine.setProvider('invalid-provider');
      expect(result).toBe(false);
    });

    it('should reject openai without API key', () => {
      const result = ttsEngine.setProvider('openai');
      expect(result).toBe(false);
    });

    it('should accept openai with API key', () => {
      localStorage.setItem('openai-tts-key', 'sk-test-key');
      const result = ttsEngine.setProvider('openai');
      expect(result).toBe(true);
      expect(ttsEngine.provider).toBe('openai');
    });

    it('should reject elevenlabs without premium', () => {
      ttsEngine.ttsManager = { isElevenLabsAvailable: jest.fn(() => false) };
      const result = ttsEngine.setProvider('elevenlabs');
      expect(result).toBe(false);
    });

    it('should accept elevenlabs for premium users', () => {
      ttsEngine.ttsManager = {
        isElevenLabsAvailable: jest.fn(() => true),
        setProvider: jest.fn()
      };
      const result = ttsEngine.setProvider('elevenlabs');
      expect(result).toBe(true);
      expect(ttsEngine.provider).toBe('elevenlabs');
    });

    it('should save provider to localStorage', () => {
      ttsEngine.setProvider('browser');
      expect(localStorage.setItem).toHaveBeenCalledWith('tts-provider', 'browser');
    });

    it('should notify ttsManager of provider change', () => {
      const mockSetProvider = jest.fn();
      ttsEngine.ttsManager = {
        setProvider: mockSetProvider,
        isElevenLabsAvailable: jest.fn(() => false)
      };

      ttsEngine.setProvider('browser');
      expect(mockSetProvider).toHaveBeenCalledWith('browser');
    });

    it('should get current provider', () => {
      ttsEngine.provider = 'native';
      expect(ttsEngine.getProvider()).toBe('native');
    });
  });

  // ========================================================================
  // SPEECH SYNTHESIS - SPEAK
  // ========================================================================
  describe('Speech Synthesis', () => {
    beforeEach(async () => {
      // Initialize the engine
      window.speechSynthesis.getVoices.mockReturnValue([
        { lang: 'es-ES', voiceURI: 'spanish', name: 'Spanish' }
      ]);
      ttsEngine.isInitialized = true;
      ttsEngine.selectedVoice = { lang: 'es-ES', voiceURI: 'spanish', name: 'Spanish' };
      ttsEngine.provider = 'browser';
    });

    it('should handle string paragraph input by wrapping in object', async () => {
      // speak normalizes string to {text: string}
      const callbacks = { onEnd: jest.fn(), onError: jest.fn() };

      // The speakWithWebSpeechAPI will be called
      await ttsEngine.speak('Test text', 0, callbacks);

      expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('Test text');
    });

    it('should call speakWithWebSpeechAPI for browser provider', async () => {
      const spySpeakWeb = jest.spyOn(ttsEngine, 'speakWithWebSpeechAPI').mockResolvedValue();

      await ttsEngine.speak({ text: 'Hello world' }, 0, {});

      expect(spySpeakWeb).toHaveBeenCalled();
      spySpeakWeb.mockRestore();
    });

    it('should call speakWithNativeTTS when native provider is set and available', async () => {
      ttsEngine.provider = 'native';
      ttsEngine.nativeTTS = {
        speak: jest.fn(() => Promise.resolve()),
        stop: jest.fn()
      };

      const spySpeakNative = jest.spyOn(ttsEngine, 'speakWithNativeTTS').mockResolvedValue();

      await ttsEngine.speak({ text: 'Native text' }, 0, {});

      expect(spySpeakNative).toHaveBeenCalled();
      spySpeakNative.mockRestore();
    });

    it('should call speakWithOpenAI when openai provider is set', async () => {
      ttsEngine.provider = 'openai';
      ttsEngine.ttsManager = { speak: jest.fn(() => Promise.resolve()) };
      localStorage.setItem('openai-tts-key', 'sk-test');

      const spySpeakOpenAI = jest.spyOn(ttsEngine, 'speakWithOpenAI').mockResolvedValue();

      await ttsEngine.speak({ text: 'OpenAI text' }, 0, {});

      expect(spySpeakOpenAI).toHaveBeenCalled();
      spySpeakOpenAI.mockRestore();
    });

    it('should call speakWithElevenLabs when elevenlabs provider is set', async () => {
      ttsEngine.provider = 'elevenlabs';
      ttsEngine.ttsManager = {
        isElevenLabsAvailable: jest.fn(() => true),
        providers: { elevenlabs: { speakWithContext: jest.fn() } }
      };

      const spySpeakEleven = jest.spyOn(ttsEngine, 'speakWithElevenLabs').mockResolvedValue();

      await ttsEngine.speak({ text: 'ElevenLabs text' }, 0, {});

      expect(spySpeakEleven).toHaveBeenCalled();
      spySpeakEleven.mockRestore();
    });

    it('should report error when synthesis is unavailable', async () => {
      ttsEngine.synthesis = null;
      ttsEngine.nativeTTS = null;
      ttsEngine.provider = 'browser';

      const onError = jest.fn();
      await ttsEngine.speakWithWebSpeechAPI({ text: 'test' }, 0, { onError });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should report error when no voices available', async () => {
      window.speechSynthesis.getVoices.mockReturnValue([]);
      ttsEngine.selectedVoice = null;

      const onError = jest.fn();
      await ttsEngine.speakWithWebSpeechAPI({ text: 'test' }, 0, { onError });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========================================================================
  // FALLBACK MECHANISM
  // ========================================================================
  describe('Fallback Mechanism', () => {
    it('should fallback OpenAI to WebSpeech on provider error', async () => {
      ttsEngine.isInitialized = true;
      ttsEngine.provider = 'openai';
      ttsEngine.ttsManager = {
        speak: jest.fn(() => Promise.reject(new Error('OpenAI unavailable')))
      };

      const spyWebSpeech = jest.spyOn(ttsEngine, 'speakWithWebSpeechAPI').mockResolvedValue();

      await ttsEngine.speakWithOpenAI({ text: 'test' }, 0, {});

      expect(ttsEngine.provider).toBe('browser');
      expect(spyWebSpeech).toHaveBeenCalled();
      spyWebSpeech.mockRestore();
    });

    it('should fallback ElevenLabs to WebSpeech when no provider available', async () => {
      ttsEngine.ttsManager = { providers: {} };

      const spyWebSpeech = jest.spyOn(ttsEngine, 'speakWithWebSpeechAPI').mockResolvedValue();

      await ttsEngine.speakWithElevenLabs({ text: 'test' }, 0, {});

      expect(spyWebSpeech).toHaveBeenCalled();
      spyWebSpeech.mockRestore();
    });

    it('should fallback to nativeTTS when browser provider has native available', async () => {
      ttsEngine.provider = 'browser';
      ttsEngine.nativeTTS = {
        speak: jest.fn(() => Promise.resolve()),
        stop: jest.fn()
      };

      const spySpeakNative = jest.spyOn(ttsEngine, 'speakWithNativeTTS').mockResolvedValue();

      await ttsEngine.speak({ text: 'text with native fallback' }, 0, {});

      expect(spySpeakNative).toHaveBeenCalled();
      spySpeakNative.mockRestore();
    });
  });

  // ========================================================================
  // CONTROL (PAUSE / RESUME / STOP)
  // ========================================================================
  describe('Control Methods', () => {
    it('should pause Web Speech API synthesis', () => {
      ttsEngine.provider = 'browser';
      ttsEngine.nativeTTS = null;
      window.speechSynthesis.speaking = true;

      ttsEngine.pause();
      expect(window.speechSynthesis.pause).toHaveBeenCalled();
    });

    it('should resume Web Speech API synthesis', () => {
      ttsEngine.provider = 'browser';
      ttsEngine.nativeTTS = null;
      window.speechSynthesis.paused = true;

      ttsEngine.resume();
      expect(window.speechSynthesis.resume).toHaveBeenCalled();
    });

    it('should stop all providers', () => {
      ttsEngine.nativeTTS = { stop: jest.fn() };
      ttsEngine.utterance = {
        onstart: jest.fn(),
        onend: jest.fn(),
        onerror: jest.fn(),
        onboundary: jest.fn()
      };

      ttsEngine.stop();

      expect(ttsEngine.nativeTTS.stop).toHaveBeenCalled();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(ttsEngine.utterance).toBeNull();
    });

    it('should pause native TTS by stopping it', () => {
      ttsEngine.provider = 'browser';
      ttsEngine.nativeTTS = { stop: jest.fn() };

      ttsEngine.pause();

      expect(ttsEngine.nativeTTS.stop).toHaveBeenCalled();
    });

    it('should pause ElevenLabs when provider is elevenlabs', () => {
      const mockPause = jest.fn();
      ttsEngine.provider = 'elevenlabs';
      ttsEngine.ttsManager = {
        providers: {
          elevenlabs: { pause: mockPause }
        }
      };

      ttsEngine.pause();
      expect(mockPause).toHaveBeenCalled();
    });

    it('should resume ElevenLabs when provider is elevenlabs', () => {
      const mockResume = jest.fn();
      ttsEngine.provider = 'elevenlabs';
      ttsEngine.ttsManager = {
        providers: {
          elevenlabs: { resume: mockResume }
        }
      };

      ttsEngine.resume();
      expect(mockResume).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // CLEANUP
  // ========================================================================
  describe('Cleanup', () => {
    it('should destroy all resources', () => {
      ttsEngine.nativeTTS = { stop: jest.fn() };
      ttsEngine.ttsManager = {
        providers: { openai: { cleanup: jest.fn() } }
      };
      ttsEngine.selectedVoice = { name: 'test' };

      ttsEngine.destroy();

      expect(ttsEngine.selectedVoice).toBeNull();
      expect(ttsEngine.nativeTTS).toBeNull();
      expect(ttsEngine.ttsManager).toBeNull();
      expect(ttsEngine.audioReader).toBeNull();
    });

    it('should handle destroy when no resources exist', () => {
      ttsEngine.nativeTTS = null;
      ttsEngine.ttsManager = null;

      // Should not throw
      expect(() => ttsEngine.destroy()).not.toThrow();
    });
  });

  // ========================================================================
  // PREMIUM AUTO-CONFIGURATION
  // ========================================================================
  describe('Premium Auto-Configuration', () => {
    it('should auto-configure elevenlabs for premium users', () => {
      window.authHelper = { isPremium: jest.fn(() => true) };
      ttsEngine.ttsManager = {
        providers: { elevenlabs: {} }
      };

      ttsEngine.autoConfigurePremium();

      expect(ttsEngine.provider).toBe('elevenlabs');
      delete window.authHelper;
    });

    it('should not auto-configure if user is not premium', () => {
      window.authHelper = { isPremium: jest.fn(() => false) };
      ttsEngine.provider = 'browser';

      ttsEngine.autoConfigurePremium();

      expect(ttsEngine.provider).toBe('browser');
      delete window.authHelper;
    });

    it('should not override saved non-browser provider', () => {
      window.authHelper = { isPremium: jest.fn(() => true) };
      localStorage.setItem('tts-provider', 'openai');
      ttsEngine.provider = 'openai';
      ttsEngine.ttsManager = {
        providers: { elevenlabs: {} }
      };

      ttsEngine.autoConfigurePremium();

      // Should not change because saved provider is not 'browser'
      expect(ttsEngine.provider).toBe('openai');
      delete window.authHelper;
    });
  });
});
