// ============================================================================
// AUDIOREADER MODULE TESTS
// ============================================================================
// Run this in browser console after page loads to test the modular AudioReader
// Usage: testAudioReader()

window.testAudioReader = async function() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function test(name, fn) {
    try {
      const result = fn();
      if (result === true || result === undefined) {
        results.passed++;
        results.tests.push({ name, status: '✅ PASS' });
        console.log(`✅ ${name}`);
      } else {
        results.failed++;
        results.tests.push({ name, status: '❌ FAIL', error: result });
        console.error(`❌ ${name}: ${result}`);
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: '❌ ERROR', error: error.message });
      console.error(`❌ ${name}: ${error.message}`);
    }
  }

  async function testAsync(name, fn) {
    try {
      const result = await fn();
      if (result === true || result === undefined) {
        results.passed++;
        results.tests.push({ name, status: '✅ PASS' });
        console.log(`✅ ${name}`);
      } else {
        results.failed++;
        results.tests.push({ name, status: '❌ FAIL', error: result });
        console.error(`❌ ${name}: ${result}`);
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: '❌ ERROR', error: error.message });
      console.error(`❌ ${name}: ${error.message}`);
    }
  }

  console.log('🧪 Testing AudioReader Modules...\n');

  // ==========================================================================
  // MODULE LOADING TESTS
  // ==========================================================================
  console.log('\n📦 Module Loading Tests:');

  test('AudioReaderUtils class exists', () => {
    return typeof window.AudioReaderUtils === 'function';
  });

  test('AudioReaderContent class exists', () => {
    return typeof window.AudioReaderContent === 'function';
  });

  test('AudioReaderHighlighter class exists', () => {
    return typeof window.AudioReaderHighlighter === 'function';
  });

  test('AudioReaderTTSEngine class exists', () => {
    return typeof window.AudioReaderTTSEngine === 'function';
  });

  test('AudioReaderPlayback class exists', () => {
    return typeof window.AudioReaderPlayback === 'function';
  });

  test('AudioReaderEvents class exists', () => {
    return typeof window.AudioReaderEvents === 'function';
  });

  test('AudioReaderUI class exists', () => {
    return typeof window.AudioReaderUI === 'function';
  });

  test('AudioReader main class exists', () => {
    return typeof window.AudioReader === 'function';
  });

  // ==========================================================================
  // UTILS MODULE TESTS
  // ==========================================================================
  console.log('\n🔧 Utils Module Tests:');

  test('Utils: can instantiate', () => {
    const utils = new window.AudioReaderUtils();
    return utils !== null && utils !== undefined;
  });

  test('Utils: formatTime works', () => {
    const utils = new window.AudioReaderUtils();
    return utils.formatTime(5) === '5min' &&
           utils.formatTime(65) === '1h 5min' &&
           utils.formatTime(0.5) === '30s';
  });

  test('Utils: setTimeout tracking works', () => {
    const utils = new window.AudioReaderUtils();
    const id = utils.setTimeout(() => {}, 10000);
    const hasTimer = utils.timers.includes(id);
    utils.clearTimeout(id);
    return hasTimer && !utils.timers.includes(id);
  });

  test('Utils: simplifyVoiceName works', () => {
    const utils = new window.AudioReaderUtils();
    const result = utils.simplifyVoiceName('Microsoft Helena - Spanish (Spain)');
    return result.length > 0 && result.length <= 25;
  });

  // ==========================================================================
  // CONTENT MODULE TESTS
  // ==========================================================================
  console.log('\n📝 Content Module Tests:');

  test('Content: can instantiate', () => {
    const mockAudioReader = { bookEngine: { currentBook: 'test-book' } };
    const content = new window.AudioReaderContent(mockAudioReader);
    return content !== null;
  });

  test('Content: sanitizeText works', () => {
    const mockAudioReader = { bookEngine: { currentBook: 'test-book' } };
    const content = new window.AudioReaderContent(mockAudioReader);
    const result = content.sanitizeText('## Header → with **bold** text');
    return !result.includes('##') && !result.includes('→') && !result.includes('**');
  });

  test('Content: prepare works with HTML', () => {
    const mockAudioReader = { bookEngine: { currentBook: 'test-book' } };
    const content = new window.AudioReaderContent(mockAudioReader);
    const count = content.prepare('<p>First paragraph</p><p>Second paragraph</p>');
    return count === 2 && content.getParagraphs().length === 2;
  });

  test('Content: isFooterElement detects footers', () => {
    const mockAudioReader = { bookEngine: { currentBook: 'test-book' } };
    const content = new window.AudioReaderContent(mockAudioReader);
    return content.isFooterElement('© 2024') === true &&
           content.isFooterElement('Normal text') === false;
  });

  // ==========================================================================
  // HIGHLIGHTER MODULE TESTS
  // ==========================================================================
  console.log('\n🖍️ Highlighter Module Tests:');

  test('Highlighter: can instantiate', () => {
    const mockAudioReader = { ui: null };
    const highlighter = new window.AudioReaderHighlighter(mockAudioReader);
    return highlighter !== null;
  });

  test('Highlighter: wordByWord toggle works', () => {
    const mockAudioReader = { ui: null };
    const highlighter = new window.AudioReaderHighlighter(mockAudioReader);
    highlighter.setWordByWordEnabled(true);
    return highlighter.isWordByWordEnabled() === true;
  });

  // ==========================================================================
  // TTS ENGINE MODULE TESTS
  // ==========================================================================
  console.log('\n🔊 TTS Engine Module Tests:');

  test('TTSEngine: can instantiate', () => {
    const mockAudioReader = { bookEngine: null };
    const tts = new window.AudioReaderTTSEngine(mockAudioReader);
    return tts !== null;
  });

  test('TTSEngine: setRate works', () => {
    const mockAudioReader = { bookEngine: null };
    const tts = new window.AudioReaderTTSEngine(mockAudioReader);
    tts.setRate(1.5);
    return tts.getRate() === 1.5;
  });

  test('TTSEngine: setRate clamps values', () => {
    const mockAudioReader = { bookEngine: null };
    const tts = new window.AudioReaderTTSEngine(mockAudioReader);
    tts.setRate(5); // Should be clamped to 2
    const high = tts.getRate() === 2;
    tts.setRate(0.1); // Should be clamped to 0.5
    const low = tts.getRate() === 0.5;
    return high && low;
  });

  test('TTSEngine: getProvider returns valid provider', () => {
    const mockAudioReader = { bookEngine: null };
    const tts = new window.AudioReaderTTSEngine(mockAudioReader);
    const provider = tts.getProvider();
    return ['browser', 'native', 'openai', 'elevenlabs'].includes(provider);
  });

  // ==========================================================================
  // PLAYBACK MODULE TESTS
  // ==========================================================================
  console.log('\n▶️ Playback Module Tests:');

  test('Playback: can instantiate', () => {
    const mockAudioReader = {
      content: { getParagraphs: () => [] },
      tts: null,
      ui: null,
      events: null
    };
    const playback = new window.AudioReaderPlayback(mockAudioReader);
    return playback !== null;
  });

  test('Playback: autoAdvance toggle works', () => {
    const mockAudioReader = {
      content: { getParagraphs: () => [] },
      tts: null,
      ui: null,
      events: null
    };
    const playback = new window.AudioReaderPlayback(mockAudioReader);
    const initial = playback.isAutoAdvanceEnabled();
    playback.toggleAutoAdvance();
    return playback.isAutoAdvanceEnabled() !== initial;
  });

  // ==========================================================================
  // EVENTS MODULE TESTS
  // ==========================================================================
  console.log('\n🎹 Events Module Tests:');

  test('Events: can instantiate', () => {
    const mockAudioReader = { playback: null, ui: null };
    const events = new window.AudioReaderEvents(mockAudioReader);
    return events !== null;
  });

  test('Events: keyboard listeners can be attached/detached', () => {
    const mockAudioReader = {
      playback: null,
      ui: null,
      hide: () => {},
      isPlaying: false,
      isPaused: false
    };
    const events = new window.AudioReaderEvents(mockAudioReader);
    events.attachKeyboardListeners();
    const attached = events.keyboardListenerAttached === true;
    events.detachKeyboardListeners();
    const detached = events.keyboardListenerAttached === false;
    return attached && detached;
  });

  // ==========================================================================
  // UI MODULE TESTS
  // ==========================================================================
  console.log('\n🎨 UI Module Tests:');

  test('UI: can instantiate', () => {
    const mockAudioReader = {
      bookEngine: null,
      content: { getParagraphs: () => [] },
      currentParagraphIndex: 0,
      events: null,
      tts: { getRate: () => 1 },
      playback: { isAutoAdvanceEnabled: () => false },
      utils: { estimateTime: () => 0, formatTime: () => '' }
    };
    const ui = new window.AudioReaderUI(mockAudioReader);
    return ui !== null;
  });

  test('UI: formatPauseTime works', () => {
    const mockAudioReader = {
      bookEngine: null,
      content: { getParagraphs: () => [] },
      currentParagraphIndex: 0,
      events: null,
      tts: { getRate: () => 1 },
      playback: { isAutoAdvanceEnabled: () => false },
      utils: { estimateTime: () => 0, formatTime: () => '' }
    };
    const ui = new window.AudioReaderUI(mockAudioReader);
    return ui.formatPauseTime(65) === '1:05' && ui.formatPauseTime(5) === '0:05';
  });

  // ==========================================================================
  // MAIN AUDIOREADER TESTS
  // ==========================================================================
  console.log('\n🎯 Main AudioReader Integration Tests:');

  test('AudioReader: can instantiate with mock bookEngine', () => {
    const mockBookEngine = {
      currentBook: 'test-book',
      currentChapter: { id: 'ch1', title: 'Test Chapter' },
      getCurrentBookData: () => ({ title: 'Test Book', authors: ['Test Author'] }),
      getNextChapter: () => null
    };
    const ar = new window.AudioReader(mockBookEngine);
    return ar !== null && ar.bookEngine === mockBookEngine;
  });

  test('AudioReader: modules are initialized', () => {
    const mockBookEngine = {
      currentBook: 'test-book',
      currentChapter: { id: 'ch1', title: 'Test Chapter' },
      getCurrentBookData: () => ({ title: 'Test Book' }),
      getNextChapter: () => null
    };
    const ar = new window.AudioReader(mockBookEngine);
    return ar.utils !== null &&
           ar.content !== null &&
           ar.highlighter !== null &&
           ar.tts !== null &&
           ar.playback !== null &&
           ar.events !== null &&
           ar.ui !== null;
  });

  test('AudioReader: isSupported returns boolean', () => {
    const mockBookEngine = {
      currentBook: 'test-book',
      getCurrentBookData: () => ({ title: 'Test Book' }),
      getNextChapter: () => null
    };
    const ar = new window.AudioReader(mockBookEngine);
    return typeof ar.isSupported() === 'boolean';
  });

  test('AudioReader: getStatus returns object', () => {
    const mockBookEngine = {
      currentBook: 'test-book',
      getCurrentBookData: () => ({ title: 'Test Book' }),
      getNextChapter: () => null
    };
    const ar = new window.AudioReader(mockBookEngine);
    const status = ar.getStatus();
    return typeof status === 'object' &&
           'isPlaying' in status &&
           'isPaused' in status &&
           'currentParagraph' in status &&
           'rate' in status;
  });

  test('AudioReader: prepareContent works (backward compat)', () => {
    const mockBookEngine = {
      currentBook: 'test-book',
      getCurrentBookData: () => ({ title: 'Test Book' }),
      getNextChapter: () => null
    };
    const ar = new window.AudioReader(mockBookEngine);
    const count = ar.prepareContent('<p>Test paragraph</p><p>Another one</p>');
    return count === 2 && ar.paragraphs.length === 2;
  });

  test('AudioReader: setRate works', () => {
    const mockBookEngine = {
      currentBook: 'test-book',
      getCurrentBookData: () => ({ title: 'Test Book' }),
      getNextChapter: () => null
    };
    const ar = new window.AudioReader(mockBookEngine);
    ar.setRate(1.5);
    return ar.rate === 1.5;
  });

  test('AudioReader: cleanup works without errors', () => {
    const mockBookEngine = {
      currentBook: 'test-book',
      getCurrentBookData: () => ({ title: 'Test Book' }),
      getNextChapter: () => null
    };
    const ar = new window.AudioReader(mockBookEngine);
    ar.cleanup();
    return true; // If no error thrown, test passes
  });

  // ==========================================================================
  // RESULTS SUMMARY
  // ==========================================================================
  console.log('\n' + '='.repeat(50));
  console.log(`📊 TEST RESULTS: ${results.passed} passed, ${results.failed} failed`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Failed tests:');
    results.tests
      .filter(t => t.status.includes('FAIL') || t.status.includes('ERROR'))
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }

  return results;
};

// Auto-run if in test mode
if (window.location.search.includes('test=audioreader')) {
  window.addEventListener('load', () => {
    setTimeout(testAudioReader, 1000);
  });
}

console.log('🧪 AudioReader test module loaded. Run testAudioReader() to test.');
