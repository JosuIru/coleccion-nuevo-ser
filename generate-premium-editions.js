/**
 * Script para generar ediciones Premium (HTML imprimibles) de los libros
 * Genera archivos HTML autónomos con todo el contenido del libro
 */

const fs = require('fs');
const path = require('path');

// Libros a procesar (los que no tienen premium.html)
const booksToGenerate = ['toolkit-transicion', 'guia-acciones'];

// Colores por libro
const bookThemes = {
  'toolkit-transicion': {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    gradient: 'from-emerald-950 to-teal-950',
    title: 'Toolkit de Transición',
    subtitle: '22 ejercicios prácticos para navegar el cambio sistémico'
  },
  'guia-acciones': {
    primary: '#8b5cf6',
    secondary: '#ec4899',
    accent: '#a855f7',
    gradient: 'from-violet-950 to-purple-950',
    title: 'Guía de Acciones Transformadoras',
    subtitle: '54 prácticas para cambiar tu vida y tu mundo'
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatContent(content) {
  if (!content) return '';

  // Convertir markdown básico a HTML
  let html = content
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="exercise-subtitle">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="content-heading">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .split('\n\n')
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<li>')) {
        return `<ul>${p}</ul>`;
      }
      if (p.startsWith('<h')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}

function generatePremiumHTML(bookId) {
  const bookPath = path.join(__dirname, 'www', 'books', bookId, 'book.json');
  const theme = bookThemes[bookId];

  if (!fs.existsSync(bookPath)) {
    console.error(`❌ No se encontró book.json para ${bookId}`);
    return null;
  }

  const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf8'));

  let sectionsHTML = '';
  let tocHTML = '';

  // Generar tabla de contenidos y secciones
  bookData.sections.forEach((section, sectionIndex) => {
    tocHTML += `
      <div class="toc-section">
        <div class="toc-section-title">${escapeHtml(section.title)}</div>
        ${section.subtitle ? `<div class="toc-section-subtitle">${escapeHtml(section.subtitle)}</div>` : ''}
        <ul class="toc-chapters">
          ${section.chapters.map(ch => `<li><a href="#${ch.id}">${escapeHtml(ch.title)}</a></li>`).join('\n')}
        </ul>
      </div>
    `;

    sectionsHTML += `
      <div class="section" id="section-${sectionIndex + 1}">
        <h2 class="section-title">${escapeHtml(section.title)}</h2>
        ${section.subtitle ? `<p class="section-subtitle">${escapeHtml(section.subtitle)}</p>` : ''}

        ${section.chapters.map(chapter => {
          let chapterHTML = `
            <article class="chapter" id="${chapter.id}">
              <h3 class="chapter-title">${escapeHtml(chapter.title)}</h3>
              ${chapter.epigraph ? `
                <blockquote class="epigraph">
                  <p>${escapeHtml(chapter.epigraph.text)}</p>
                  ${chapter.epigraph.author ? `<cite>— ${escapeHtml(chapter.epigraph.author)}</cite>` : ''}
                </blockquote>
              ` : ''}

              <div class="chapter-content">
                ${formatContent(chapter.content)}
              </div>

              ${chapter.exercises && chapter.exercises.length > 0 ? `
                <div class="exercises-container">
                  <h4 class="exercises-header">Ejercicios Prácticos</h4>
                  ${chapter.exercises.map(ex => `
                    <div class="exercise">
                      <h5 class="exercise-title">${escapeHtml(ex.title)}</h5>
                      ${ex.duration ? `<span class="exercise-duration">⏱ ${escapeHtml(ex.duration)}</span>` : ''}
                      ${ex.description ? `<p class="exercise-description">${escapeHtml(ex.description)}</p>` : ''}

                      ${ex.steps && ex.steps.length > 0 ? `
                        <div class="exercise-steps">
                          <strong>Pasos:</strong>
                          <ol>
                            ${ex.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('\n')}
                          </ol>
                        </div>
                      ` : ''}

                      ${ex.reflection ? `
                        <div class="exercise-reflection">
                          <strong>Reflexión:</strong>
                          <p>${escapeHtml(ex.reflection)}</p>
                        </div>
                      ` : ''}

                      ${ex.variations && ex.variations.length > 0 ? `
                        <div class="exercise-variations">
                          <strong>Variaciones:</strong>
                          <ul>
                            ${ex.variations.map(v => `<li>${escapeHtml(v)}</li>`).join('\n')}
                          </ul>
                        </div>
                      ` : ''}
                    </div>
                  `).join('\n')}
                </div>
              ` : ''}

              ${chapter.closingQuestion ? `
                <div class="closing-question">
                  <strong>Pregunta de cierre:</strong>
                  <p>${escapeHtml(chapter.closingQuestion)}</p>
                </div>
              ` : ''}
            </article>
          `;
          return chapterHTML;
        }).join('\n')}
      </div>
    `;
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${theme.title} - Edición Premium</title>

  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="icon-512.png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      line-height: 1.8;
      padding-top: 200px;
      transition: padding-top 0.3s ease;
    }

    body.audio-expanded {
      padding-top: 320px;
    }

    /* Header fijo */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(${hexToRgb(theme.primary)}, 0.2);
      padding: 1rem 2rem;
      z-index: 50;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-title {
      font-size: 1.5rem;
      color: ${theme.primary};
      font-weight: 700;
      margin: auto;
    }

    .header-buttons {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(${hexToRgb(theme.primary)}, 0.4);
    }

    .btn-secondary {
      background: rgba(${hexToRgb(theme.primary)}, 0.1);
      color: ${theme.primary};
      border: 1px solid rgba(${hexToRgb(theme.primary)}, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(${hexToRgb(theme.primary)}, 0.2);
    }

    /* Reproductor de audio */
    .audio-player {
      position: fixed;
      top: 70px;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(${hexToRgb(theme.primary)}, 0.125);
      z-index: 48;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .audio-player.collapsed {
      max-height: 64px;
    }

    .audio-player.expanded {
      max-height: 280px;
    }

    .audio-header {
      padding: 0.75rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .audio-controls {
      padding: 1rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .audio-buttons {
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .audio-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .audio-btn-play {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .audio-btn-pause {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .audio-btn-stop {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .audio-btn:hover {
      transform: scale(1.05);
    }

    .audio-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .speed-control {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: center;
      margin-top: 1rem;
    }

    .speed-btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid rgba(${hexToRgb(theme.primary)}, 0.3);
      background: rgba(${hexToRgb(theme.primary)}, 0.1);
      color: ${theme.primary};
      cursor: pointer;
      transition: all 0.2s;
    }

    .speed-btn:hover {
      background: rgba(${hexToRgb(theme.primary)}, 0.2);
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(${hexToRgb(theme.primary)}, 0.2);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, ${theme.primary} 0%, ${theme.secondary} 100%);
      transition: width 0.3s ease;
    }

    /* Contenedor principal */
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    h1 {
      font-size: 2.5rem;
      color: ${theme.primary};
      text-align: center;
      margin-bottom: 1rem;
      font-weight: 700;
      text-shadow: 0 2px 10px rgba(${hexToRgb(theme.primary)}, 0.3);
    }

    .subtitle {
      text-align: center;
      color: #94a3b8;
      font-size: 1.1rem;
      margin-bottom: 3rem;
      font-style: italic;
    }

    .intro {
      background: linear-gradient(135deg, rgba(${hexToRgb(theme.primary)}, 0.1) 0%, rgba(${hexToRgb(theme.secondary)}, 0.1) 100%);
      border-left: 4px solid ${theme.primary};
      padding: 1.5rem;
      margin-bottom: 3rem;
      border-radius: 10px;
    }

    /* TOC */
    .toc {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(${hexToRgb(theme.primary)}, 0.2);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 3rem;
    }

    .toc-title {
      font-size: 1.5rem;
      color: ${theme.primary};
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .toc-section {
      margin-bottom: 1.5rem;
    }

    .toc-section-title {
      font-weight: bold;
      color: ${theme.secondary};
      margin-bottom: 0.5rem;
    }

    .toc-section-subtitle {
      font-size: 0.9rem;
      color: #94a3b8;
      font-style: italic;
      margin-bottom: 0.5rem;
    }

    .toc-chapters {
      list-style: none;
      padding-left: 1rem;
    }

    .toc-chapters li {
      margin-bottom: 0.3rem;
    }

    .toc-chapters a {
      color: #cbd5e1;
      text-decoration: none;
      transition: color 0.2s;
    }

    .toc-chapters a:hover {
      color: ${theme.primary};
    }

    /* Sections */
    .section {
      margin-bottom: 4rem;
      page-break-before: always;
    }

    .section-title {
      font-size: 1.8rem;
      color: ${theme.primary};
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid rgba(${hexToRgb(theme.primary)}, 0.3);
    }

    .section-subtitle {
      color: #94a3b8;
      font-style: italic;
      margin-bottom: 2rem;
      font-size: 1rem;
    }

    /* Chapters */
    .chapter {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(${hexToRgb(theme.primary)}, 0.1);
    }

    .chapter-title {
      font-size: 1.5rem;
      color: ${theme.secondary};
      margin-bottom: 1rem;
    }

    .chapter-content {
      margin-bottom: 2rem;
    }

    .chapter-content p {
      margin-bottom: 1rem;
    }

    .chapter-content h3 {
      color: ${theme.accent};
      margin: 1.5rem 0 1rem;
    }

    .chapter-content h4 {
      color: ${theme.secondary};
      margin: 1rem 0 0.5rem;
    }

    .chapter-content ul, .chapter-content ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }

    .chapter-content li {
      margin-bottom: 0.5rem;
    }

    /* Epigraph */
    .epigraph {
      background: rgba(${hexToRgb(theme.primary)}, 0.05);
      border-left: 3px solid ${theme.primary};
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      font-style: italic;
      border-radius: 0 8px 8px 0;
    }

    .epigraph cite {
      display: block;
      text-align: right;
      color: #94a3b8;
      margin-top: 0.5rem;
      font-size: 0.9rem;
    }

    /* Exercises */
    .exercises-container {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(${hexToRgb(theme.primary)}, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 2rem;
    }

    .exercises-header {
      color: ${theme.primary};
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .exercise {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(${hexToRgb(theme.primary)}, 0.15);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .exercise:last-child {
      margin-bottom: 0;
    }

    .exercise-title {
      color: ${theme.secondary};
      margin-bottom: 0.5rem;
    }

    .exercise-duration {
      display: inline-block;
      background: rgba(${hexToRgb(theme.primary)}, 0.15);
      color: ${theme.accent};
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      margin-bottom: 0.75rem;
    }

    .exercise-description {
      margin-bottom: 1rem;
      color: #cbd5e1;
    }

    .exercise-steps, .exercise-reflection, .exercise-variations {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(${hexToRgb(theme.primary)}, 0.1);
    }

    .exercise-steps ol, .exercise-variations ul {
      margin-left: 1.5rem;
      margin-top: 0.5rem;
    }

    .exercise-steps li, .exercise-variations li {
      margin-bottom: 0.5rem;
    }

    .exercise-reflection p {
      color: #94a3b8;
      font-style: italic;
      margin-top: 0.5rem;
    }

    /* Closing question */
    .closing-question {
      background: linear-gradient(135deg, rgba(${hexToRgb(theme.primary)}, 0.1) 0%, rgba(${hexToRgb(theme.secondary)}, 0.05) 100%);
      border: 1px solid rgba(${hexToRgb(theme.primary)}, 0.2);
      border-radius: 8px;
      padding: 1rem 1.5rem;
      margin-top: 1.5rem;
    }

    .closing-question p {
      color: ${theme.accent};
      font-style: italic;
      margin-top: 0.5rem;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 2rem;
      margin-top: 3rem;
      border-top: 1px solid rgba(${hexToRgb(theme.primary)}, 0.2);
      color: #64748b;
      font-size: 0.9rem;
    }

    .footer a {
      color: ${theme.primary};
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }

    /* Print styles */
    @media print {
      body {
        background: white;
        color: black;
        padding-top: 0;
      }

      .header, .audio-player {
        display: none;
      }

      .container {
        max-width: 100%;
        box-shadow: none;
        background: white;
      }

      h1, .section-title, .chapter-title {
        color: black;
      }

      .exercise, .epigraph, .closing-question, .toc, .exercises-container {
        border-color: #ccc;
        background: #f9f9f9;
      }

      a {
        color: black;
        text-decoration: none;
      }

      .section {
        page-break-before: always;
      }

      .exercise {
        page-break-inside: avoid;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      body {
        padding-top: 160px;
      }

      .header-title {
        font-size: 1.2rem;
      }

      h1 {
        font-size: 1.8rem;
      }

      .container {
        padding: 1rem;
        margin: 0.5rem;
        border-radius: 12px;
      }

      .section-title {
        font-size: 1.4rem;
      }

      .chapter-title {
        font-size: 1.2rem;
      }
    }
  </style>
</head>
<body>
  <!-- Header fijo -->
  <header class="header">
    <div class="header-content">
      <h1 class="header-title">${theme.title}</h1>
      <div class="header-buttons">
        <button class="btn btn-primary" onclick="window.print()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimir
        </button>
        <a href="../index.html" class="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Volver
        </a>
      </div>
    </div>
  </header>

  <!-- Reproductor de audio -->
  <div class="audio-player collapsed" id="audioPlayer">
    <div class="audio-header" onclick="toggleAudioPlayer()">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${theme.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        <span style="color: #cbd5e1; font-size: 0.9rem;" id="audioStatus">Click para expandir controles de audio</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="audioToggleIcon"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </div>
    <div class="audio-controls" id="audioControls" style="display: none;">
      <div class="audio-buttons">
        <button class="audio-btn audio-btn-play" id="playBtn" onclick="playAudio()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Reproducir
        </button>
        <button class="audio-btn audio-btn-pause" id="pauseBtn" onclick="pauseAudio()" style="display: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          Pausar
        </button>
        <button class="audio-btn audio-btn-stop" id="stopBtn" onclick="stopAudio()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
          Detener
        </button>
      </div>
      <div class="speed-control">
        <span style="color: #94a3b8;">Velocidad:</span>
        <button class="speed-btn" onclick="setSpeed(0.75)">0.75x</button>
        <button class="speed-btn" onclick="setSpeed(1)">1x</button>
        <button class="speed-btn" onclick="setSpeed(1.25)">1.25x</button>
        <button class="speed-btn" onclick="setSpeed(1.5)">1.5x</button>
        <button class="speed-btn" onclick="setSpeed(2)">2x</button>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
      </div>
      <p style="text-align: center; color: #64748b; font-size: 0.8rem; margin-top: 0.5rem;" id="progressText">Listo para reproducir</p>
    </div>
  </div>

  <!-- Contenido principal -->
  <main class="container">
    <h1>${theme.title}</h1>
    <p class="subtitle">${theme.subtitle}</p>

    <div class="intro">
      <p>Esta es la <strong>Edición Premium</strong> para impresión del libro. Incluye todo el contenido completo con un diseño optimizado para lectura offline e impresión.</p>
    </div>

    <!-- Tabla de contenidos -->
    <nav class="toc">
      <h2 class="toc-title">Índice de Contenidos</h2>
      ${tocHTML}
    </nav>

    <!-- Secciones -->
    ${sectionsHTML}

    <!-- Footer -->
    <footer class="footer">
      <p>Colección Nuevo Ser</p>
      <p style="margin-top: 0.5rem;">
        <a href="https://www.paypal.com/paypalme/codigodespierto" target="_blank">❤️ Apoyar el proyecto</a>
      </p>
      <p style="margin-top: 1rem; font-size: 0.8rem;">
        © ${new Date().getFullYear()} J. Irurtzun & Claude - Todos los derechos reservados
      </p>
    </footer>
  </main>

  <script>
    // Audio reader using Web Speech API
    let synth = window.speechSynthesis;
    let utterance = null;
    let isPlaying = false;
    let isPaused = false;
    let currentSpeed = 1;
    let paragraphs = [];
    let currentParagraphIndex = 0;

    function toggleAudioPlayer() {
      const player = document.getElementById('audioPlayer');
      const controls = document.getElementById('audioControls');
      const icon = document.getElementById('audioToggleIcon');

      if (player.classList.contains('collapsed')) {
        player.classList.remove('collapsed');
        player.classList.add('expanded');
        controls.style.display = 'block';
        icon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
        document.body.classList.add('audio-expanded');
      } else {
        player.classList.remove('expanded');
        player.classList.add('collapsed');
        controls.style.display = 'none';
        icon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
        document.body.classList.remove('audio-expanded');
      }
    }

    function collectParagraphs() {
      paragraphs = [];
      const container = document.querySelector('.container');
      const elements = container.querySelectorAll('h1, h2, h3, h4, h5, p, li');
      elements.forEach(el => {
        const text = el.textContent.trim();
        if (text && text.length > 0) {
          paragraphs.push({ element: el, text: text });
        }
      });
    }

    function playAudio() {
      if (paragraphs.length === 0) {
        collectParagraphs();
      }

      if (isPaused && utterance) {
        synth.resume();
        isPaused = false;
        isPlaying = true;
        updateButtons();
        return;
      }

      speakCurrentParagraph();
    }

    function speakCurrentParagraph() {
      if (currentParagraphIndex >= paragraphs.length) {
        stopAudio();
        document.getElementById('audioStatus').textContent = 'Lectura completada';
        return;
      }

      const p = paragraphs[currentParagraphIndex];

      // Highlight current paragraph
      paragraphs.forEach(para => para.element.style.backgroundColor = '');
      p.element.style.backgroundColor = 'rgba(${hexToRgb(theme.primary)}, 0.15)';
      p.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      utterance = new SpeechSynthesisUtterance(p.text);
      utterance.lang = 'es-ES';
      utterance.rate = currentSpeed;

      utterance.onend = () => {
        currentParagraphIndex++;
        updateProgress();
        if (isPlaying) {
          speakCurrentParagraph();
        }
      };

      utterance.onerror = (e) => {
        console.error('Speech error:', e);
        currentParagraphIndex++;
        if (isPlaying) {
          speakCurrentParagraph();
        }
      };

      isPlaying = true;
      isPaused = false;
      updateButtons();
      synth.speak(utterance);
      updateProgress();
    }

    function pauseAudio() {
      if (synth.speaking) {
        synth.pause();
        isPaused = true;
        isPlaying = false;
        updateButtons();
        document.getElementById('audioStatus').textContent = 'Pausado';
      }
    }

    function stopAudio() {
      synth.cancel();
      isPlaying = false;
      isPaused = false;
      currentParagraphIndex = 0;
      paragraphs.forEach(para => para.element.style.backgroundColor = '');
      updateButtons();
      updateProgress();
      document.getElementById('audioStatus').textContent = 'Detenido';
    }

    function setSpeed(speed) {
      currentSpeed = speed;
      document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.style.background = btn.textContent.includes(speed + 'x')
          ? 'rgba(${hexToRgb(theme.primary)}, 0.3)'
          : 'rgba(${hexToRgb(theme.primary)}, 0.1)';
      });

      if (isPlaying && utterance) {
        const currentIndex = currentParagraphIndex;
        synth.cancel();
        currentParagraphIndex = currentIndex;
        speakCurrentParagraph();
      }
    }

    function updateButtons() {
      const playBtn = document.getElementById('playBtn');
      const pauseBtn = document.getElementById('pauseBtn');

      if (isPlaying) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
        document.getElementById('audioStatus').textContent = 'Reproduciendo...';
      } else {
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
      }
    }

    function updateProgress() {
      const progress = paragraphs.length > 0
        ? (currentParagraphIndex / paragraphs.length) * 100
        : 0;
      document.getElementById('progressFill').style.width = progress + '%';
      document.getElementById('progressText').textContent =
        \`Párrafo \${currentParagraphIndex} de \${paragraphs.length}\`;
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      collectParagraphs();
      // Set default speed button
      setSpeed(1);
    });
  </script>
</body>
</html>`;

  return html;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '0, 0, 0';
}

// Main execution
console.log('📚 Generando ediciones Premium para imprimir...\n');

booksToGenerate.forEach(bookId => {
  console.log(`📖 Procesando: ${bookId}`);

  const html = generatePremiumHTML(bookId);

  if (html) {
    const outputPath = path.join(__dirname, 'www', 'downloads', `${bookId}-premium.html`);
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`   ✅ Generado: ${outputPath}`);

    // Get file size
    const stats = fs.statSync(outputPath);
    console.log(`   📄 Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);
  }
});

console.log('\n✨ ¡Proceso completado!');
