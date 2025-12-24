const fs = require('fs');
const path = require('path');

const BOOKS = [
  {
    id: 'filosofia-nuevo-ser',
    title: 'Filosofia del Nuevo Ser',
    file: path.join(__dirname, '..', 'www', 'books', 'filosofia-nuevo-ser', 'book.json')
  },
  {
    id: 'codigo-despertar',
    title: 'Codigo del Despertar',
    file: path.join(__dirname, '..', 'www', 'books', 'codigo-despertar', 'book.json')
  },
  {
    id: 'tierra-que-despierta',
    title: 'La Tierra que Despierta',
    file: path.join(__dirname, '..', 'www', 'books', 'tierra-que-despierta', 'book.json')
  }
];

const MAX_CHARS = 200;
const MAX_PER_BOOK = 6;

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r/g, '')
    .replace(/\n+/g, '\n')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitParagraphs = (text) => {
  if (!text) return [];
  return text
    .split('\n')
    .map(p => cleanText(p))
    .filter(p => p && p.length > 40);
};

const collectParagraphs = (bookJson) => {
  const paragraphs = [];
  const sections = bookJson.sections || [];

  if (bookJson.prologo && bookJson.prologo.sections) {
    for (const block of bookJson.prologo.sections) {
      const items = splitParagraphs(block.content || '');
      items.forEach(text => paragraphs.push({
        text,
        chapterId: 'prologo',
        chapterTitle: 'Prologo'
      }));
    }
  }

  for (const section of sections) {
    const chapters = section.chapters || [];
    for (const chapter of chapters) {
      const items = splitParagraphs(chapter.content || '');
      items.forEach(text => paragraphs.push({
        text,
        chapterId: chapter.id || 'capitulo',
        chapterTitle: chapter.title || 'Capitulo'
      }));
    }
  }

  return paragraphs;
};

const pickExcerpts = (paragraphs) => {
  const seen = new Set();
  const excerpts = [];

  for (const entry of paragraphs) {
    if (excerpts.length >= MAX_PER_BOOK) break;
    if (!entry.text || entry.text.length < 60) continue;
    if (seen.has(entry.text)) continue;
    seen.add(entry.text);
    excerpts.push(entry);
  }

  return excerpts;
};

const excerpts = BOOKS.flatMap((book) => {
  const raw = fs.readFileSync(book.file, 'utf8');
  const json = JSON.parse(raw);
  const paragraphs = collectParagraphs(json);
  const picked = pickExcerpts(paragraphs);

  return picked.map((entry, index) => ({
    id: `${book.id}_excerpt_${String(index + 1).padStart(2, '0')}`,
    bookId: book.id,
    source: book.title,
    chapterId: entry.chapterId,
    chapterTitle: entry.chapterTitle,
    text: entry.text.slice(0, MAX_CHARS),
    fullText: entry.text
  }));
});

const outputPath = path.join(
  __dirname,
  '..',
  'mobile-game',
  'mobile-app',
  'src',
  'trascendencia',
  'data',
  'bookExcerpts.generated.json'
);

fs.writeFileSync(outputPath, JSON.stringify(excerpts, null, 2));

console.log(`Generated ${excerpts.length} excerpts -> ${outputPath}`);
