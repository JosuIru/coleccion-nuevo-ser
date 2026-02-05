/**
 * Book Engine Tests
 *
 * Tests for the BookEngine class which manages catalog loading,
 * chapter navigation, reading progress, bookmarks, and notes.
 */

// Load the source file which assigns BookEngine to window
require('../js/core/book-engine.js');

const BookEngine = window.BookEngine;

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------
const mockCatalog = {
  books: [
    {
      id: 'test-book',
      title: 'Test Book',
      icon: 'T',
      chapters: 4,
      theme: 'cosmic'
    },
    {
      id: 'second-book',
      title: 'Second Book',
      icon: 'S',
      chapters: 2,
      theme: 'nature'
    }
  ],
  crossReferences: [
    {
      from: { book: 'test-book', chapter: 'cap1' },
      to: { book: 'second-book', chapter: 'cap1' },
      note: 'Related content',
      bidirectional: true
    }
  ]
};

const mockBookData = {
  title: 'Test Book Title',
  prologo: {
    id: 'prologo',
    title: 'Prologue',
    content: 'Prologue content'
  },
  sections: [
    {
      id: 'seccion1',
      title: 'Section One',
      chapters: [
        {
          id: 'cap1',
          title: 'Chapter 1',
          content: 'Chapter 1 content',
          epigraph: { text: 'A wise quote', author: 'Author' },
          closingQuestion: 'What did you learn?',
          exercises: [
            {
              id: 'ex1',
              title: 'Exercise 1',
              duration: '15 min',
              description: 'A test exercise',
              steps: ['Step 1', 'Step 2'],
              reflection: 'Reflect on this'
            }
          ]
        },
        {
          id: 'cap2',
          title: 'Chapter 2',
          content: 'Chapter 2 content'
        }
      ]
    },
    {
      id: 'seccion2',
      title: 'Section Two',
      chapters: [
        {
          id: 'cap3',
          title: 'Chapter 3',
          content: 'Chapter 3 content'
        }
      ]
    }
  ],
  epilogo: {
    id: 'epilogo',
    title: 'Epilogue',
    content: 'Epilogue content'
  }
};

const mockBookConfig = {
  theme: {
    name: 'test-theme',
    primary: '#ff0000',
    secondary: '#00ff00',
    accent: '#0000ff',
    background: '#000000',
    backgroundSecondary: '#111111',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#333333'
  }
};

describe('BookEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new BookEngine();
    engine.catalog = mockCatalog;
    engine.currentBookData = mockBookData;
    engine.currentBookConfig = mockBookConfig;
    engine.currentBook = 'test-book';
  });

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  describe('Initialization', () => {
    it('should create an instance with default values', () => {
      const freshEngine = new BookEngine();
      expect(freshEngine.catalog).toBeNull();
      expect(freshEngine.currentBook).toBeNull();
      expect(freshEngine.currentBookData).toBeNull();
      expect(freshEngine.currentChapter).toBeNull();
      expect(freshEngine.readProgress).toEqual({});
      expect(freshEngine.bookmarks).toEqual([]);
      expect(freshEngine.notes).toEqual({});
    });

    it('should load catalog from fetch', async () => {
      const freshEngine = new BookEngine();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCatalog)
      });

      const result = await freshEngine.loadCatalog();
      expect(result).toEqual(mockCatalog);
      expect(freshEngine.catalog).toEqual(mockCatalog);
    });

    it('should throw on catalog load failure', async () => {
      const freshEngine = new BookEngine();
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(freshEngine.loadCatalog()).rejects.toThrow('Network error');
    });
  });

  // ========================================================================
  // BOOK MANAGEMENT
  // ========================================================================
  describe('Book Management', () => {
    it('should get book info by ID', () => {
      const bookInfo = engine.getBookInfo('test-book');
      expect(bookInfo).toBeDefined();
      expect(bookInfo.title).toBe('Test Book');
    });

    it('should return undefined for unknown book ID', () => {
      const bookInfo = engine.getBookInfo('nonexistent-book');
      expect(bookInfo).toBeUndefined();
    });

    it('should return all books from catalog', () => {
      const allBooks = engine.getAllBooks();
      expect(allBooks).toHaveLength(2);
    });

    it('should return current book ID', () => {
      expect(engine.getCurrentBook()).toBe('test-book');
    });

    it('should return current book data', () => {
      expect(engine.getCurrentBookData()).toBe(mockBookData);
    });

    it('should return current book config', () => {
      expect(engine.getCurrentBookConfig()).toBe(mockBookConfig);
    });
  });

  // ========================================================================
  // CHAPTER NAVIGATION
  // ========================================================================
  describe('Chapter Navigation', () => {
    it('should get all chapters in order (prologo + sections + epilogo)', () => {
      const chapters = engine.getAllChapters();
      expect(chapters).toHaveLength(5);
      expect(chapters[0].id).toBe('prologo');
      expect(chapters[0].type).toBe('prologo');
      expect(chapters[1].id).toBe('cap1');
      expect(chapters[1].type).toBe('chapter');
      expect(chapters[2].id).toBe('cap2');
      expect(chapters[3].id).toBe('cap3');
      expect(chapters[4].id).toBe('epilogo');
      expect(chapters[4].type).toBe('epilogo');
    });

    it('should get first chapter', () => {
      const firstChapter = engine.getFirstChapter();
      expect(firstChapter).toBeDefined();
      expect(firstChapter.id).toBe('prologo');
    });

    it('should get chapter by ID', () => {
      const chapter = engine.getChapter('cap1');
      expect(chapter).toBeDefined();
      expect(chapter.title).toBe('Chapter 1');
      expect(chapter.sectionId).toBe('seccion1');
      expect(chapter.sectionTitle).toBe('Section One');
    });

    it('should get prologue by ID', () => {
      const prologue = engine.getChapter('prologo');
      expect(prologue).toBeDefined();
      expect(prologue.title).toBe('Prologue');
    });

    it('should get epilogue by ID', () => {
      const epilogue = engine.getChapter('epilogo');
      expect(epilogue).toBeDefined();
      expect(epilogue.title).toBe('Epilogue');
    });

    it('should return null for unknown chapter ID', () => {
      const chapter = engine.getChapter('nonexistent');
      expect(chapter).toBeNull();
    });

    it('should throw when no book is loaded', () => {
      engine.currentBookData = null;
      expect(() => engine.getChapter('cap1')).toThrow('No book loaded');
    });

    it('should navigate to a chapter and update currentChapter', () => {
      const chapter = engine.navigateToChapter('cap1');
      expect(chapter).toBeDefined();
      expect(engine.currentChapter).toBe('cap1');
    });

    it('should return null when navigating to nonexistent chapter', () => {
      const result = engine.navigateToChapter('nonexistent');
      expect(result).toBeNull();
    });

    it('should get next chapter', () => {
      const nextChapter = engine.getNextChapter('cap1');
      expect(nextChapter).toBeDefined();
      expect(nextChapter.id).toBe('cap2');
    });

    it('should return null for next chapter at end of book', () => {
      const nextChapter = engine.getNextChapter('epilogo');
      expect(nextChapter).toBeNull();
    });

    it('should get previous chapter', () => {
      const previousChapter = engine.getPreviousChapter('cap2');
      expect(previousChapter).toBeDefined();
      expect(previousChapter.id).toBe('cap1');
    });

    it('should return null for previous chapter at start of book', () => {
      const previousChapter = engine.getPreviousChapter('prologo');
      expect(previousChapter).toBeNull();
    });

    it('should return empty array when no book data is loaded', () => {
      engine.currentBookData = null;
      expect(engine.getAllChapters()).toEqual([]);
    });
  });

  // ========================================================================
  // URL HASH
  // ========================================================================
  describe('URL Hash', () => {
    it('should parse URL hash for book and chapter', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#test-book/cap1', pathname: '/', search: '' },
        writable: true,
        configurable: true
      });

      const parsed = engine.parseUrlHash();
      expect(parsed).toEqual({ bookId: 'test-book', chapterId: 'cap1' });
    });

    it('should parse URL hash with only book ID', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#test-book', pathname: '/', search: '' },
        writable: true,
        configurable: true
      });

      const parsed = engine.parseUrlHash();
      expect(parsed).toEqual({ bookId: 'test-book', chapterId: null });
    });

    it('should return null when no hash is present', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '', pathname: '/', search: '' },
        writable: true,
        configurable: true
      });

      const parsed = engine.parseUrlHash();
      expect(parsed).toBeNull();
    });
  });

  // ========================================================================
  // READING PROGRESS
  // ========================================================================
  describe('Reading Progress', () => {
    it('should mark a chapter as read', () => {
      engine.markChapterAsRead('cap1');

      expect(engine.isChapterRead('cap1')).toBe(true);
      expect(engine.isChapterRead('cap2')).toBe(false);
    });

    it('should not duplicate chapter reads', () => {
      engine.markChapterAsRead('cap1');
      engine.markChapterAsRead('cap1');

      const progress = engine.readProgress['test-book'];
      expect(progress.chaptersRead.filter((id) => id === 'cap1')).toHaveLength(1);
    });

    it('should unmark a chapter as read', () => {
      engine.markChapterAsRead('cap1');
      expect(engine.isChapterRead('cap1')).toBe(true);

      engine.unmarkChapterAsRead('cap1');
      expect(engine.isChapterRead('cap1')).toBe(false);
    });

    it('should toggle chapter read status', () => {
      expect(engine.isChapterRead('cap1')).toBe(false);

      const firstToggle = engine.toggleChapterRead('cap1');
      expect(firstToggle).toBe(true);
      expect(engine.isChapterRead('cap1')).toBe(true);

      const secondToggle = engine.toggleChapterRead('cap1');
      expect(secondToggle).toBe(false);
      expect(engine.isChapterRead('cap1')).toBe(false);
    });

    it('should return false for isChapterRead when no book is current', () => {
      engine.currentBook = null;
      expect(engine.isChapterRead('cap1')).toBe(false);
    });

    it('should calculate progress percentage', () => {
      engine.markChapterAsRead('cap1');
      engine.markChapterAsRead('cap2');

      const progress = engine.getProgress('test-book');
      // 2 out of 4 chapters read = 50%
      expect(progress.chaptersRead).toBe(2);
      expect(progress.totalChapters).toBe(4);
      expect(progress.percentage).toBe(50);
    });

    it('should return zero progress for unknown book', () => {
      const progress = engine.getProgress('unknown-book');
      expect(progress.percentage).toBe(0);
      expect(progress.chaptersRead).toBe(0);
      expect(progress.totalChapters).toBe(0);
    });

    it('should calculate global progress across all books', () => {
      engine.markChapterAsRead('cap1');

      const globalProgress = engine.getGlobalProgress();
      expect(globalProgress.totalBooks).toBe(2);
      expect(globalProgress.booksStarted).toBe(1);
      expect(globalProgress.totalRead).toBe(1);
    });

    it('should get book progress as object', () => {
      engine.markChapterAsRead('cap1');
      engine.markChapterAsRead('cap3');

      const bookProgress = engine.getBookProgress('test-book');
      expect(bookProgress).toEqual({ cap1: true, cap3: true });
    });

    it('should return empty object for book with no progress', () => {
      const bookProgress = engine.getBookProgress('unknown-book');
      expect(bookProgress).toEqual({});
    });

    it('should update last visited chapter', () => {
      engine.updateLastVisited('cap2');

      expect(engine.readProgress['test-book'].lastChapter).toBe('cap2');
      expect(engine.readProgress['test-book'].lastReadAt).toBeDefined();
    });

    it('should not mark as read by default on navigation', () => {
      engine.navigateToChapter('cap1');
      expect(engine.isChapterRead('cap1')).toBe(false);
    });

    it('should mark as read on navigation when autoMarkRead is true', () => {
      engine.navigateToChapter('cap1', true);
      expect(engine.isChapterRead('cap1')).toBe(true);
    });
  });

  // ========================================================================
  // BOOKMARKS
  // ========================================================================
  describe('Bookmarks', () => {
    it('should add a bookmark', () => {
      engine.addBookmark('cap1');

      expect(engine.isBookmarked('cap1')).toBe(true);
      expect(engine.bookmarks).toHaveLength(1);
      expect(engine.bookmarks[0].book).toBe('test-book');
      expect(engine.bookmarks[0].chapter).toBe('cap1');
    });

    it('should not add duplicate bookmarks', () => {
      engine.addBookmark('cap1');
      engine.addBookmark('cap1');

      expect(engine.bookmarks).toHaveLength(1);
    });

    it('should remove a bookmark', () => {
      engine.addBookmark('cap1');
      expect(engine.isBookmarked('cap1')).toBe(true);

      engine.removeBookmark('cap1');
      expect(engine.isBookmarked('cap1')).toBe(false);
      expect(engine.bookmarks).toHaveLength(0);
    });

    it('should return false for isBookmarked when no book is current', () => {
      engine.currentBook = null;
      expect(engine.isBookmarked('cap1')).toBe(false);
    });

    it('should handle addBookmark when no current book', () => {
      engine.currentBook = null;
      engine.addBookmark('cap1');
      expect(engine.bookmarks).toHaveLength(0);
    });
  });

  // ========================================================================
  // NOTES
  // ========================================================================
  describe('Notes', () => {
    it('should add a note to a chapter', () => {
      engine.addNote('cap1', 'This is a test note');

      const notes = engine.getNotes('cap1');
      expect(notes).toHaveLength(1);
      expect(notes[0].text).toBe('This is a test note');
      expect(notes[0].createdAt).toBeDefined();
    });

    it('should add multiple notes to the same chapter', () => {
      engine.addNote('cap1', 'First note');
      engine.addNote('cap1', 'Second note');

      const notes = engine.getNotes('cap1');
      expect(notes).toHaveLength(2);
    });

    it('should return empty array for chapters with no notes', () => {
      const notes = engine.getNotes('cap99');
      expect(notes).toEqual([]);
    });

    it('should not add notes when no current book', () => {
      engine.currentBook = null;
      engine.addNote('cap1', 'test');
      expect(Object.keys(engine.notes)).toHaveLength(0);
    });
  });

  // ========================================================================
  // USER DATA PERSISTENCE
  // ========================================================================
  describe('User Data Persistence', () => {
    it('should save user data to localStorage', () => {
      engine.markChapterAsRead('cap1');
      engine.addBookmark('cap2');
      engine.addNote('cap1', 'A note');

      engine.saveUserData();

      const saved = JSON.parse(localStorage.getItem('coleccion-nuevo-ser-data'));
      expect(saved.readProgress).toBeDefined();
      expect(saved.bookmarks).toBeDefined();
      expect(saved.notes).toBeDefined();
      expect(saved.lastUpdate).toBeDefined();
    });

    it('should load user data from localStorage', () => {
      const savedData = {
        readProgress: { 'test-book': { chaptersRead: ['cap1'], lastChapter: 'cap1' } },
        bookmarks: [{ book: 'test-book', chapter: 'cap2' }],
        notes: { 'test-book:cap1': [{ id: 1, text: 'Saved note' }] }
      };
      localStorage.setItem('coleccion-nuevo-ser-data', JSON.stringify(savedData));

      engine.loadUserData();

      expect(engine.readProgress).toEqual(savedData.readProgress);
      expect(engine.bookmarks).toEqual(savedData.bookmarks);
      expect(engine.notes).toEqual(savedData.notes);
    });

    it('should handle missing localStorage data gracefully', () => {
      engine.loadUserData();
      // Should not throw and keep defaults
      expect(engine.readProgress).toEqual({});
    });
  });

  // ========================================================================
  // CONTENT RENDERING
  // ========================================================================
  describe('Content Rendering', () => {
    it('should render epigraph with text and author', () => {
      const html = engine.renderEpigraph({ text: 'A quote', author: 'Author' });
      expect(html).toContain('A quote');
      expect(html).toContain('Author');
      expect(html).toContain('epigraph');
    });

    it('should render epigraph from plain string', () => {
      const html = engine.renderEpigraph('Simple quote');
      expect(html).toContain('Simple quote');
    });

    it('should return empty string for null epigraph', () => {
      expect(engine.renderEpigraph(null)).toBe('');
    });

    it('should render closing question', () => {
      const html = engine.renderClosingQuestion('What is consciousness?');
      expect(html).toContain('What is consciousness?');
      expect(html).toContain('closing-question');
    });

    it('should return empty string for null closing question', () => {
      expect(engine.renderClosingQuestion(null)).toBe('');
    });

    it('should render content with empty input', () => {
      expect(engine.renderContent('')).toBe('');
      expect(engine.renderContent(null)).toBe('');
    });

    it('should render basic markdown content', () => {
      const content = '## Title\n\nSome **bold** text and *italic* text.';
      const html = engine.renderContent(content);
      expect(html).toContain('Title');
      expect(html).toContain('<strong');
      expect(html).toContain('<em');
    });
  });

  // ========================================================================
  // CROSS REFERENCES
  // ========================================================================
  describe('Cross References', () => {
    it('should get cross references for a chapter', () => {
      const refs = engine.getCrossReferences('cap1');
      expect(refs).toHaveLength(1);
      expect(refs[0].note).toBe('Related content');
    });

    it('should return empty array for chapters with no references', () => {
      const refs = engine.getCrossReferences('cap99');
      expect(refs).toHaveLength(0);
    });

    it('should get radical practices for a chapter', () => {
      const practices = engine.getRadicalPracticesForChapter('cap2');
      expect(practices.length).toBeGreaterThan(0);
      expect(practices[0].title).toBeDefined();
    });

    it('should return empty array for unknown chapter practices', () => {
      const practices = engine.getRadicalPracticesForChapter('unknown');
      expect(practices).toEqual([]);
    });

    it('should get manual practico exercises for a chapter', () => {
      const exercises = engine.getManualPracticoForChapter('cap1');
      expect(exercises.length).toBeGreaterThan(0);
      expect(exercises[0].duration).toBeDefined();
    });

    it('should get cross references for chapters in the mapping', () => {
      const crossRefs = engine.getCrossReferencesForChapter('cap12');
      expect(crossRefs.length).toBeGreaterThan(0);
      expect(crossRefs[0].book).toBe('manifiesto');
    });
  });

  // ========================================================================
  // CHAPTER SEARCH
  // ========================================================================
  describe('Chapter Search', () => {
    it('should find chapter by exercise ID', () => {
      // Set up book data with exercises
      engine.currentBookData = {
        sections: [
          {
            id: 'sec1',
            title: 'Section',
            chapters: [
              {
                id: 'practice-1',
                title: 'Practice 1',
                exercises: [{ id: 'ex-inner', title: 'Inner exercise' }]
              }
            ]
          }
        ]
      };

      const chapterId = engine.findChapterByExerciseId('practice-1');
      expect(chapterId).toBe('practice-1');
    });

    it('should return null when exercise ID is not found', () => {
      const chapterId = engine.findChapterByExerciseId('nonexistent');
      expect(chapterId).toBeNull();
    });

    it('should find chapter by exercise title', () => {
      const chapterId = engine.findChapterByExerciseTitle('Chapter 1');
      expect(chapterId).toBe('cap1');
    });

    it('should return null when exercise title is not found', () => {
      const chapterId = engine.findChapterByExerciseTitle('Nonexistent Exercise');
      expect(chapterId).toBeNull();
    });
  });
});
