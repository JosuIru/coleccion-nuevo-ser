-- ============================================================================
-- TRANSPARENCY PANEL TABLES
-- Objetivos públicos y aportes visibles para la Colección Nuevo Ser
-- ============================================================================

CREATE TABLE IF NOT EXISTS transparency_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'abierto',
  book_id TEXT,
  target_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
  funded_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transparency_goals_priority_check CHECK (priority IN ('alta', 'media', 'baja')),
  CONSTRAINT transparency_goals_target_check CHECK (target_eur >= 0),
  CONSTRAINT transparency_goals_funded_check CHECK (funded_eur >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transparency_goals_active
  ON transparency_goals(is_active, display_order);

CREATE TABLE IF NOT EXISTS transparency_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_slug TEXT REFERENCES transparency_goals(slug) ON DELETE SET NULL,
  label TEXT NOT NULL,
  amount_eur DECIMAL(10,2) NOT NULL,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visibility TEXT NOT NULL DEFAULT 'publico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transparency_contributions_amount_check CHECK (amount_eur >= 0),
  CONSTRAINT transparency_contributions_visibility_check CHECK (visibility IN ('publico', 'anonimo', 'privado'))
);

CREATE INDEX IF NOT EXISTS idx_transparency_contributions_date
  ON transparency_contributions(contribution_date DESC, created_at DESC);

ALTER TABLE transparency_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transparency goals are public"
  ON transparency_goals FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Transparency contributions are public"
  ON transparency_contributions FOR SELECT
  USING (visibility IN ('publico', 'anonimo'));

INSERT INTO transparency_goals (
  slug, title, area, description, priority, status, book_id, target_eur, funded_eur, display_order
) VALUES
  ('infraestructura-release', 'Infraestructura y release estable', 'Infraestructura', 'Pulido de compilación, firma segura, optimización de build y preparación de publicación.', 'alta', 'en marcha', 'manual-transicion', 1200, 420, 10),
  ('codigo-audio-ia', 'Audioreader + IA contextual en Código del Despertar', 'Experiencia', 'Mejorar narración, continuidad de lectura y respuestas IA más finas para el libro base.', 'alta', 'en marcha', 'codigo-despertar', 900, 315, 20),
  ('tierra-practicas', 'Prácticas y recursos vivos en La Tierra que Despierta', 'Contenido', 'Ampliar prácticas, recursos de duelo ecológico y herramientas de reconexión.', 'media', 'abierto', 'tierra-que-despierta', 850, 160, 30),
  ('manifiesto-acciones', 'Índice de acciones y transparencia política del Manifiesto', 'Contenido', 'Hacer más accionable el libro con rutas, mapas y seguimiento visible de propuestas.', 'alta', 'en marcha', 'manifiesto', 1000, 540, 40),
  ('panel-transparencia', 'Panel público de transparencia y donaciones dirigidas', 'Transparencia', 'Visualizar objetivos, avances, aportes y prioridades de mejora para toda la comunidad.', 'alta', 'abierto', 'ahora-instituciones', 700, 190, 50),
  ('ecosistema-educadores', 'Kit educativo y adaptación pedagógica', 'Educación', 'Transformar contenidos complejos en materiales usables para aulas, círculos y facilitadores.', 'media', 'abierto', 'educacion-nuevo-ser', 950, 110, 60)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  area = EXCLUDED.area,
  description = EXCLUDED.description,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  book_id = EXCLUDED.book_id,
  target_eur = EXCLUDED.target_eur,
  funded_eur = EXCLUDED.funded_eur,
  display_order = EXCLUDED.display_order,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO transparency_contributions (
  goal_slug, label, amount_eur, contribution_date, visibility
) VALUES
  ('codigo-audio-ia', 'Apoyo al audioreader y accesibilidad', 60, DATE '2026-03-10', 'publico'),
  ('tierra-practicas', 'Donación para prácticas ecológicas', 35, DATE '2026-03-08', 'publico'),
  ('infraestructura-release', 'Aporte a estabilidad APK y release', 120, DATE '2026-03-05', 'publico'),
  ('panel-transparencia', 'Impulso al panel de transparencia', 45, DATE '2026-03-01', 'publico')
ON CONFLICT DO NOTHING;
