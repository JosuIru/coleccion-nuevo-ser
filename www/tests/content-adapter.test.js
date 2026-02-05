/**
 * Content Adapter Tests
 *
 * Tests for the ContentAdapter class which adapts book content
 * to different audiences (age groups) and styles (focus modes).
 */

// Load the source file which assigns ContentAdapter to window
require('../js/features/content-adapter.js');

const ContentAdapter = window.ContentAdapter;

describe('ContentAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new ContentAdapter();
  });

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  describe('Initialization', () => {
    it('should create an instance with default values', () => {
      expect(adapter).toBeInstanceOf(ContentAdapter);
      expect(adapter.currentAgeStyle).toBe('adultos');
      expect(adapter.currentFocusStyle).toBe('original');
      expect(adapter.isAdapted).toBe(false);
      expect(adapter.selectorVisible).toBe(false);
    });

    it('should have all age styles defined', () => {
      const expectedAgeStyles = ['ninos', 'jovenes', 'adultos', 'mayores'];
      const actualStyles = Object.keys(adapter.AGE_STYLES);
      expectedAgeStyles.forEach((styleKey) => {
        expect(actualStyles).toContain(styleKey);
      });
    });

    it('should have all focus styles defined', () => {
      const expectedFocusStyles = [
        'original', 'tecnico', 'reflexivo', 'practico',
        'coloquial', 'dormir', 'historia', 'punk'
      ];
      const actualStyles = Object.keys(adapter.FOCUS_STYLES);
      expectedFocusStyles.forEach((styleKey) => {
        expect(actualStyles).toContain(styleKey);
      });
    });

    it('should initialize with a bookEngine via init()', () => {
      const mockBookEngine = { getCurrentBook: jest.fn(() => 'test-book') };
      const result = adapter.init(mockBookEngine);

      expect(adapter.bookEngine).toBe(mockBookEngine);
      expect(result).toBe(adapter); // returns this for chaining
    });

    it('should reuse global aiAdapter if available', () => {
      const mockAiAdapter = { ask: jest.fn() };
      window.aiAdapter = mockAiAdapter;

      const mockBookEngine = { getCurrentBook: jest.fn() };
      adapter.init(mockBookEngine);

      expect(adapter.aiAdapter).toBe(mockAiAdapter);

      delete window.aiAdapter;
    });
  });

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================
  describe('Cache Management', () => {
    it('should generate correct cache keys', () => {
      const cacheKey = adapter.getCacheKey('book1', 'cap1', 'ninos', 'tecnico');
      expect(cacheKey).toBe('content_adaptation_book1_cap1_ninos_tecnico');
    });

    it('should store and retrieve cached content', () => {
      const bookId = 'test-book';
      const chapterId = 'cap3';
      const ageStyle = 'jovenes';
      const focusStyle = 'reflexivo';
      const adaptedContent = 'Adapted content for testing';

      adapter.cacheAdaptation(bookId, chapterId, ageStyle, focusStyle, adaptedContent);

      const cached = adapter.getCachedAdaptation(bookId, chapterId, ageStyle, focusStyle);
      expect(cached).toBe(adaptedContent);
    });

    it('should return null for non-existent cache entries', () => {
      const cached = adapter.getCachedAdaptation('no-book', 'no-cap', 'adultos', 'original');
      expect(cached).toBeNull();
    });

    it('should invalidate cache with wrong version', () => {
      const cacheKey = adapter.getCacheKey('book1', 'cap1', 'ninos', 'original');
      localStorage.setItem(cacheKey, JSON.stringify({
        content: 'old content',
        timestamp: Date.now(),
        version: '0.0.1' // wrong version
      }));

      const cached = adapter.getCachedAdaptation('book1', 'cap1', 'ninos', 'original');
      expect(cached).toBeNull();
    });

    it('should invalidate expired cache entries', () => {
      const cacheKey = adapter.getCacheKey('book1', 'cap1', 'ninos', 'original');
      const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
      localStorage.setItem(cacheKey, JSON.stringify({
        content: 'expired content',
        timestamp: eightDaysAgo,
        version: adapter.CACHE_VERSION
      }));

      const cached = adapter.getCachedAdaptation('book1', 'cap1', 'ninos', 'original');
      expect(cached).toBeNull();
    });

    it('should clear all cache entries', () => {
      adapter.cacheAdaptation('book1', 'cap1', 'ninos', 'tecnico', 'content1');
      adapter.cacheAdaptation('book1', 'cap2', 'jovenes', 'reflexivo', 'content2');
      adapter.cacheAdaptation('book2', 'cap1', 'adultos', 'practico', 'content3');

      const removedCount = adapter.clearCache();
      expect(removedCount).toBe(3);
    });

    it('should clear cache for a specific book and chapter', () => {
      adapter.cacheAdaptation('book1', 'cap1', 'ninos', 'tecnico', 'content1');
      adapter.cacheAdaptation('book1', 'cap1', 'jovenes', 'reflexivo', 'content2');
      adapter.cacheAdaptation('book2', 'cap1', 'adultos', 'practico', 'content3');

      const removedCount = adapter.clearCache('book1', 'cap1');
      expect(removedCount).toBe(2);

      // book2 entry should still exist
      const remaining = adapter.getCachedAdaptation('book2', 'cap1', 'adultos', 'practico');
      expect(remaining).toBe('content3');
    });

    it('should return cache stats structure', () => {
      // getCacheStats uses Object.keys(localStorage) which requires enumerable keys.
      // We verify the method returns the correct structure without errors.
      const stats = adapter.getCacheStats();

      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('sizeKB');
      expect(typeof stats.count).toBe('number');
      expect(typeof stats.sizeKB).toBe('number');
    });
  });

  // ========================================================================
  // PREFERENCES
  // ========================================================================
  describe('Preferences', () => {
    it('should save preferences to localStorage', () => {
      adapter.currentAgeStyle = 'jovenes';
      adapter.currentFocusStyle = 'tecnico';
      adapter.savePreferences();

      const saved = JSON.parse(localStorage.getItem('content_adapter_preferences'));
      expect(saved.age).toBe('jovenes');
      expect(saved.focus).toBe('tecnico');
    });

    it('should load preferences from localStorage', () => {
      localStorage.setItem('content_adapter_preferences', JSON.stringify({
        age: 'mayores',
        focus: 'coloquial'
      }));

      adapter.loadPreferences();

      expect(adapter.currentAgeStyle).toBe('mayores');
      expect(adapter.currentFocusStyle).toBe('coloquial');
    });

    it('should use defaults when no preferences are saved', () => {
      adapter.loadPreferences();

      expect(adapter.currentAgeStyle).toBe('adultos');
      expect(adapter.currentFocusStyle).toBe('original');
    });

    it('should handle corrupted preferences gracefully', () => {
      localStorage.setItem('content_adapter_preferences', 'invalid-json{{{');
      adapter.loadPreferences();

      // Should stay at defaults without throwing
      expect(adapter.currentAgeStyle).toBe('adultos');
      expect(adapter.currentFocusStyle).toBe('original');
    });
  });

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  describe('State Management', () => {
    it('should set context for a chapter', () => {
      adapter.setContext('book1', 'cap5', 'Plain text content', '<p>HTML content</p>');

      expect(adapter.currentBookId).toBe('book1');
      expect(adapter.currentChapterId).toBe('cap5');
      expect(adapter.originalContent).toBe('Plain text content');
      expect(adapter.originalHtmlContent).toBe('<p>HTML content</p>');
      expect(adapter.isAdapted).toBe(false);
    });

    it('should reset state when changing chapters', () => {
      adapter.setContext('book1', 'cap1', 'content', '<p>html</p>');
      adapter.isAdapted = true;
      adapter.currentAgeStyle = 'ninos';
      adapter.currentFocusStyle = 'tecnico';

      adapter.resetState();

      expect(adapter.originalContent).toBeNull();
      expect(adapter.originalHtmlContent).toBeNull();
      expect(adapter.isAdapted).toBe(false);
      expect(adapter.currentBookId).toBeNull();
      expect(adapter.currentChapterId).toBeNull();
      // Preferences should be preserved across chapters
      expect(adapter.currentAgeStyle).toBe('ninos');
      expect(adapter.currentFocusStyle).toBe('tecnico');
    });

    it('should restore original content internally', () => {
      adapter.originalContent = 'original text';
      adapter.isAdapted = true;
      adapter.currentAgeStyle = 'jovenes';
      adapter.currentFocusStyle = 'tecnico';

      const result = adapter.restoreOriginalInternal();

      expect(result.content).toBe('original text');
      expect(result.restored).toBe(true);
      expect(result.fromCache).toBe(false);
      expect(adapter.isAdapted).toBe(false);
      expect(adapter.currentAgeStyle).toBe('adultos');
      expect(adapter.currentFocusStyle).toBe('original');
    });
  });

  // ========================================================================
  // PROMPT BUILDING
  // ========================================================================
  describe('Prompt Building', () => {
    it('should return null for default style combination (adultos + original)', () => {
      const prompt = adapter.buildAdaptationPrompt('content', 'adultos', 'original');
      expect(prompt).toBeNull();
    });

    it('should include age instructions when not adultos', () => {
      const prompt = adapter.buildAdaptationPrompt('test content', 'ninos', 'original');
      expect(prompt).not.toBeNull();
      expect(prompt).toContain('niños de 8-12 años');
    });

    it('should include focus instructions when not original', () => {
      const prompt = adapter.buildAdaptationPrompt('test content', 'adultos', 'tecnico');
      expect(prompt).not.toBeNull();
      expect(prompt).toContain('enfoque técnico-científico');
    });

    it('should include both age and focus instructions when both changed', () => {
      const prompt = adapter.buildAdaptationPrompt('test content', 'jovenes', 'reflexivo');
      expect(prompt).not.toBeNull();
      expect(prompt).toContain('adolescentes de 13-17 años');
      expect(prompt).toContain('enfoque contemplativo');
    });

    it('should include the original content in the prompt', () => {
      const originalText = 'This is the original chapter content to adapt';
      const prompt = adapter.buildAdaptationPrompt(originalText, 'ninos', 'original');
      expect(prompt).toContain(originalText);
    });
  });

  // ========================================================================
  // CONTENT CONVERSION
  // ========================================================================
  describe('Content Conversion', () => {
    it('should convert plain text to HTML paragraphs', () => {
      const text = 'First paragraph.\n\nSecond paragraph.';
      const html = adapter.convertToHtml(text);

      expect(html).toContain('<p');
      expect(html).toContain('First paragraph.');
      expect(html).toContain('Second paragraph.');
    });

    it('should convert markdown headers', () => {
      const text = '## Main Title\n\nSome content here.';
      const html = adapter.convertToHtml(text);

      expect(html).toContain('<h3');
      expect(html).toContain('Main Title');
    });

    it('should convert bullet lists', () => {
      const text = '- First item\n- Second item\n- Third item';
      const html = adapter.convertToHtml(text);

      expect(html).toContain('<ul');
      expect(html).toContain('<li>');
      expect(html).toContain('First item');
    });

    it('should convert numbered lists', () => {
      const text = '1. First step\n2. Second step';
      const html = adapter.convertToHtml(text);

      expect(html).toContain('<ol');
      expect(html).toContain('<li>');
    });

    it('should convert blockquotes', () => {
      const text = '> This is a quoted text';
      const html = adapter.convertToHtml(text);

      expect(html).toContain('<blockquote');
      expect(html).toContain('This is a quoted text');
    });

    it('should handle empty text', () => {
      expect(adapter.convertToHtml('')).toBe('');
      expect(adapter.convertToHtml(null)).toBe('');
    });
  });

  // ========================================================================
  // INLINE MARKDOWN FORMATTING
  // ========================================================================
  describe('Inline Markdown Formatting', () => {
    it('should format bold text', () => {
      const result = adapter.formatInlineMarkdown('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should format italic text', () => {
      const result = adapter.formatInlineMarkdown('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    it('should format inline code', () => {
      const result = adapter.formatInlineMarkdown('Use `console.log` for debugging');
      expect(result).toContain('<code');
      expect(result).toContain('console.log');
    });

    it('should handle empty text', () => {
      expect(adapter.formatInlineMarkdown('')).toBe('');
      expect(adapter.formatInlineMarkdown(null)).toBe('');
    });
  });

  // ========================================================================
  // HTML ESCAPING
  // ========================================================================
  describe('HTML Escaping', () => {
    it('should escape HTML special characters', () => {
      const result = adapter.escapeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;');
    });

    it('should escape ampersands', () => {
      const result = adapter.escapeHtml('A & B');
      expect(result).toContain('&amp;');
    });

    it('should handle empty input', () => {
      expect(adapter.escapeHtml('')).toBe('');
      expect(adapter.escapeHtml(null)).toBe('');
    });
  });

  // ========================================================================
  // ADAPT CONTENT - ERROR HANDLING
  // ========================================================================
  describe('adaptContent - Error Handling', () => {
    it('should return original content for adultos+original', async () => {
      adapter.originalContent = 'original text';
      const result = await adapter.adaptContent('adultos', 'original');

      expect(result.content).toBe('original text');
      expect(result.restored).toBe(true);
    });

    it('should throw when no context is set', async () => {
      await expect(
        adapter.adaptContent('ninos', 'original')
      ).rejects.toThrow('No hay contenido para adaptar');
    });

    it('should throw when AI adapter is unavailable', async () => {
      adapter.setContext('book1', 'cap1', 'some text');
      adapter.aiAdapter = null;
      delete window.aiAdapter;
      delete window.AIAdapter;

      await expect(
        adapter.adaptContent('ninos', 'original')
      ).rejects.toThrow('Sistema de IA no disponible');
    });

    it('should use cached adaptation when available', async () => {
      adapter.setContext('book1', 'cap1', 'original text');
      adapter.cacheAdaptation('book1', 'cap1', 'ninos', 'original', 'cached adapted text');

      const result = await adapter.adaptContent('ninos', 'original');

      expect(result.content).toBe('cached adapted text');
      expect(result.fromCache).toBe(true);
    });
  });

  // ========================================================================
  // UI RENDERING
  // ========================================================================
  describe('UI Rendering', () => {
    it('should render button HTML', () => {
      const buttonHtml = adapter.renderButton();
      expect(buttonHtml).toContain('content-adapter-btn');
      expect(buttonHtml).toContain('Adaptar');
    });

    it('should render button with badge when adapted', () => {
      adapter.isAdapted = true;
      adapter.currentAgeStyle = 'ninos';
      adapter.currentFocusStyle = 'tecnico';

      const buttonHtml = adapter.renderButton();
      expect(buttonHtml).toContain('has-badge');
      expect(buttonHtml).toContain('adapter-badge');
    });

    it('should render selector HTML with options', () => {
      window.aiUtils = null;
      const selectorHtml = adapter.renderSelector();

      expect(selectorHtml).toContain('content-adapter-selector');
      expect(selectorHtml).toContain('adapter-apply-btn');
      expect(selectorHtml).toContain('adapter-restore-btn');
      expect(selectorHtml).toContain('adapter-regenerate-btn');
    });
  });
});
