-- ============================================================================
-- TRANSPARENCY GOAL TOTALS
-- Sincroniza funded_eur automáticamente desde transparency_contributions
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_transparency_goal_funding(goal_slug_param TEXT)
RETURNS VOID AS $$
BEGIN
  IF goal_slug_param IS NULL THEN
    RETURN;
  END IF;

  UPDATE transparency_goals
  SET
    funded_eur = COALESCE((
      SELECT SUM(amount_eur)
      FROM transparency_contributions
      WHERE goal_slug = goal_slug_param
    ), 0),
    updated_at = NOW()
  WHERE slug = goal_slug_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_transparency_contribution_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_transparency_goal_funding(OLD.goal_slug);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.goal_slug IS DISTINCT FROM NEW.goal_slug THEN
    PERFORM sync_transparency_goal_funding(OLD.goal_slug);
  END IF;

  PERFORM sync_transparency_goal_funding(NEW.goal_slug);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transparency_contributions_sync_goal_totals
  ON transparency_contributions;

CREATE TRIGGER transparency_contributions_sync_goal_totals
AFTER INSERT OR UPDATE OR DELETE ON transparency_contributions
FOR EACH ROW
EXECUTE FUNCTION handle_transparency_contribution_change();

-- Recalcular todos los totales existentes
UPDATE transparency_goals g
SET
  funded_eur = COALESCE((
    SELECT SUM(c.amount_eur)
    FROM transparency_contributions c
    WHERE c.goal_slug = g.slug
  ), 0),
  updated_at = NOW();
