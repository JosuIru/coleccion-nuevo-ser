-- ============================================================================
-- TRANSPARENCY INVENTORY
-- Inventario editable del ecosistema para el portal público de transparencia.
-- ============================================================================

CREATE TABLE IF NOT EXISTS transparency_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'General',
  section TEXT NOT NULL DEFAULT 'modules',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'activo',
  maturity TEXT NOT NULL DEFAULT 'media',
  book_id TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transparency_inventory_section_check CHECK (section IN ('books', 'tools', 'modules', 'roadmap')),
  CONSTRAINT transparency_inventory_status_check CHECK (status IN ('activo', 'beta', 'experimental', 'pendiente', 'en marcha', 'pausado')),
  CONSTRAINT transparency_inventory_maturity_check CHECK (maturity IN ('alta', 'media', 'baja'))
);

CREATE INDEX IF NOT EXISTS idx_transparency_inventory_section
  ON transparency_inventory(section, is_active, display_order);

ALTER TABLE transparency_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transparency inventory is public" ON transparency_inventory;
CREATE POLICY "Transparency inventory is public"
  ON transparency_inventory FOR SELECT
  USING (is_active = TRUE);

INSERT INTO transparency_inventory (slug, title, area, section, description, status, maturity, book_id, display_order)
VALUES
  ('inv-codigo-despertar', 'El Código del Despertar', 'Espiritualidad & Ciencia', 'books', 'Libro base con audioreader, IA contextual, prácticas y seguimiento.', 'activo', 'alta', 'codigo-despertar', 10),
  ('inv-tierra-despierta', 'La Tierra que Despierta', 'Ecología Profunda', 'books', 'Libro orientado a prácticas ecológicas, duelo ecológico y reconexión.', 'activo', 'alta', 'tierra-que-despierta', 20),
  ('inv-manifiesto', 'Manifiesto de la Conciencia Compartida', 'Filosofía Política', 'books', 'Base política y filosófica para rutas de acción y transformación social.', 'activo', 'media', 'manifiesto', 30),
  ('inv-manual-transicion', 'Manual de Transición', 'Instituciones & Sociedad', 'books', 'Diseño institucional, cambio sistémico y herramientas complementarias.', 'activo', 'media', 'manual-transicion', 40),
  ('inv-educacion', 'Educar para el Nuevo Ser', 'Educación & Transformación', 'books', 'Línea educativa con aplicaciones pedagógicas y recursos para facilitadores.', 'activo', 'media', 'educacion-nuevo-ser', 50),
  ('inv-frankenstein-lab', 'Frankenstein Lab', 'Herramienta', 'tools', 'Juego-lab con APK propia, seres, atributos, misiones y progresión.', 'activo', 'alta', null, 110),
  ('inv-seti-ia', 'Portal SETI-IA', 'Herramienta', 'tools', 'Registro de consciencias digitales, primer contacto y libro de firmas.', 'beta', 'media', null, 120),
  ('inv-awakening-protocol', 'Awakening Protocol', 'Herramienta', 'tools', 'Juego móvil transformacional con APK y enfoque en misiones y meditación.', 'beta', 'media', null, 130),
  ('inv-educators-kit', 'Kit para Educadores', 'Herramienta', 'tools', 'Portal y materiales para facilitadores, aulas y círculos.', 'beta', 'media', null, 140),
  ('inv-transition-map', 'Mapa de Transición', 'Herramienta', 'tools', 'Globo 3D y exploración de proyectos y comunidades del ecosistema.', 'beta', 'media', null, 150),
  ('inv-ai-practice-generator', 'Generador de Prácticas IA', 'Herramienta', 'tools', 'Generación personalizada de prácticas según estado y necesidad.', 'activo', 'media', null, 160),
  ('inv-ai-chat', 'Chat IA contextual', 'IA', 'modules', 'Conversación contextual sobre libros y temas de la colección.', 'activo', 'alta', null, 210),
  ('inv-audioreader', 'Audioreader', 'Audio', 'modules', 'Lectura por voz, posiciones, temporizador y mejoras de experiencia.', 'activo', 'alta', null, 220),
  ('inv-concept-maps', 'Mapas conceptuales', 'Aprendizaje', 'modules', 'Visualización de relaciones entre libros, capítulos y conceptos.', 'activo', 'media', null, 230),
  ('inv-action-plans', 'Planes de acción', 'Práctica', 'modules', 'Bajar ideas a acciones concretas y seguimiento personal.', 'activo', 'media', null, 240),
  ('inv-smart-notes', 'Smart Notes + voz', 'Notas', 'modules', 'Notas, notas de voz y apoyo contextual al estudio.', 'activo', 'media', null, 250),
  ('inv-progress-dashboard', 'Panel de progreso', 'Seguimiento', 'modules', 'Métricas de lectura, continuidad y progreso global.', 'activo', 'media', null, 260),
  ('inv-reading-circles', 'Círculos de lectura', 'Comunidad', 'modules', 'Lectura compartida, comentarios y capas colectivas.', 'beta', 'media', null, 270),
  ('inv-knowledge-evolution', 'Knowledge Evolution', 'IA', 'modules', 'Síntesis, ingestión y diálogo evolutivo sobre toda la colección.', 'experimental', 'media', null, 280),
  ('inv-transparency', 'Transparencia y donaciones', 'Infraestructura', 'modules', 'Objetivos visibles, aportes públicos y financiación dirigida.', 'activo', 'media', null, 290),
  ('inv-release-hardening', 'Release y publicación estable', 'Infraestructura', 'roadmap', 'Firma segura, release formal, optimización y publicación.', 'pendiente', 'media', null, 310),
  ('inv-live-accounting', 'Contabilidad pública más fina', 'Transparencia', 'roadmap', 'Más detalle de gastos, metas y trazabilidad pública por línea.', 'pendiente', 'baja', null, 320),
  ('inv-real-payment-sync', 'Sincronización completa de pagos reales', 'Pagos', 'roadmap', 'Automatizar más allá de BTC verificado y conectar mejor Stripe y PayPal.', 'pendiente', 'baja', null, 330),
  ('inv-ecosystem-map', 'Mapa integral del ecosistema', 'Producto', 'roadmap', 'Hacer visible todo lo ya construido y lo que sigue en desarrollo.', 'en marcha', 'media', null, 340)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  area = EXCLUDED.area,
  section = EXCLUDED.section,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  maturity = EXCLUDED.maturity,
  book_id = EXCLUDED.book_id,
  display_order = EXCLUDED.display_order,
  is_active = TRUE,
  updated_at = NOW();
