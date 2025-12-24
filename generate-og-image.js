#!/usr/bin/env node

/**
 * Generador de Imagen Open Graph para Colección Nuevo Ser
 * Genera una imagen de 1200x630px optimizada para redes sociales
 *
 * Uso: node generate-og-image.js
 * Requiere: npm install canvas
 */

const fs = require('fs');
const path = require('path');

// Intentar cargar canvas
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.error('❌ Error: Módulo "canvas" no encontrado.');
  console.log('\n📦 Instala con: npm install canvas\n');
  console.log('💡 Alternativa: Abre generate-og-image.html en tu navegador');
  process.exit(1);
}

const { createCanvas } = Canvas;

// Crear canvas de 1200x630px (tamaño estándar OG)
const canvas = createCanvas(1200, 630);
const ctx = canvas.getContext('2d');

// Fondo degradado oscuro cósmico
const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
gradient.addColorStop(0, '#0f172a');
gradient.addColorStop(0.5, '#1e293b');
gradient.addColorStop(1, '#334155');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1200, 630);

// Efecto de estrellas
ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
for (let i = 0; i < 100; i++) {
  const x = Math.random() * 1200;
  const y = Math.random() * 630;
  const size = Math.random() * 2;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

// Círculos decorativos (efecto cosmos)
ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
ctx.beginPath();
ctx.arc(200, 150, 300, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
ctx.beginPath();
ctx.arc(1000, 500, 250, 0, Math.PI * 2);
ctx.fill();

// Borde decorativo
ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
ctx.lineWidth = 4;
ctx.strokeRect(20, 20, 1160, 590);

// Título principal con degradado
const titleGradient = ctx.createLinearGradient(300, 150, 900, 150);
titleGradient.addColorStop(0, '#06b6d4');
titleGradient.addColorStop(0.5, '#ffffff');
titleGradient.addColorStop(1, '#a855f7');
ctx.fillStyle = titleGradient;
ctx.font = 'bold 72px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Colección Nuevo Ser', 600, 180);

// Subtítulo
ctx.fillStyle = '#cbd5e1';
ctx.font = '36px sans-serif';
ctx.fillText('Biblioteca Interactiva de Filosofía', 600, 250);

// Línea decorativa
const lineGradient = ctx.createLinearGradient(350, 290, 850, 290);
lineGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
lineGradient.addColorStop(0.5, 'rgba(6, 182, 212, 1)');
lineGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
ctx.strokeStyle = lineGradient;
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(350, 290);
ctx.lineTo(850, 290);
ctx.stroke();

// Características principales (3 columnas)
const features = [
  { icon: '📚', text: '9 Libros' },
  { icon: '🧘', text: 'Prácticas Interactivas' },
  { icon: '🤖', text: 'Co-creado con IA' }
];

const startX = 200;
const spacing = 300;

features.forEach((feature, i) => {
  const x = startX + (i * spacing);
  const y = 380;

  // Fondo de la característica
  ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
  ctx.fillRect(x - 80, y - 20, 200, 100);

  // Borde
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 80, y - 20, 200, 100);

  // Icono
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(feature.icon, x + 20, y + 20);

  // Texto
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(feature.text, x + 20, y + 55);
});

// Temas principales
ctx.fillStyle = '#94a3b8';
ctx.font = '24px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Conciencia · Meditación · Activismo · Transformación Social', 600, 540);

// Footer con URL
ctx.fillStyle = '#64748b';
ctx.font = 'bold 22px sans-serif';
ctx.fillText('coleccion-nuevo-ser.com', 600, 590);

// Guardar la imagen
const outputDir = path.join(__dirname, 'www', 'assets', 'icons');
const outputPath = path.join(outputDir, 'og-image.png');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Guardar imagen
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log('✅ Imagen OG generada exitosamente!');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('📏 Dimensiones: 1200x630px');
console.log('🎨 Formato: PNG');
console.log('\n✨ La imagen está lista para usar en redes sociales');
