-- ============================================================================
-- TRANSPARENCY CONTRIBUTION SOURCES
-- Metadatos para registrar aportes reales desde BTC y evitar duplicados.
-- ============================================================================

ALTER TABLE transparency_contributions
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_reference TEXT;

ALTER TABLE transparency_contributions
  DROP CONSTRAINT IF EXISTS transparency_contributions_source_type_check;

ALTER TABLE transparency_contributions
  ADD CONSTRAINT transparency_contributions_source_type_check
  CHECK (source_type IN ('manual', 'btc', 'paypal', 'stripe', 'entity_donation'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_transparency_contributions_source_reference
  ON transparency_contributions(source_type, source_reference)
  WHERE source_reference IS NOT NULL;
