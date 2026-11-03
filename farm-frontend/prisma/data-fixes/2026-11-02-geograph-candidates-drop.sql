-- Drop the 11,727 Geograph candidate rows.
--
-- Why: sources/geograph.ts ranks the syndicator's results by distance alone, so
-- the nearest photograph to a farm's coordinates was stored whatever it showed.
-- Measured on four held-out samples of 50 farms, around 4.5 per cent of farms
-- have a photograph that actually depicts the business. The other rows are a
-- field, a lane or a neighbouring building, and none of them has ever been
-- approved or shown: all 11,727 sat at status 'pending' with isHero false.
--
-- Scope: uploadedBy = 'cc' is exactly this population. Before the delete the
-- table held 11,727 'cc' rows, every one of them a geograph.org.uk URL, and no
-- geograph URL carried any other uploadedBy. 1,018 approved photographs on our
-- own object storage and 86 rejected AI rows are untouched.
--
-- Reversal: these rows are not backed up and do not need to be. They are
-- reconstructible by re-running pipeline stages 05 and 07, which call the
-- syndicator again. Do not re-run before the matcher in
-- src/scripts/pipeline/sources/geograph-match.ts is wired into
-- sources/geograph.ts, or the same distance-ranked rows come straight back.

BEGIN;

DO $$
DECLARE
  removed  integer;
  leftover integer;
BEGIN
  DELETE FROM images
  WHERE "uploadedBy" = 'cc'
    AND status = 'pending'
    AND "isHero" = false
    AND url LIKE 'https://s%.geograph.org.uk/%';

  GET DIAGNOSTICS removed = ROW_COUNT;

  -- The whole population goes, or none of it. A different count means the
  -- table is not in the state this fix was measured against.
  IF removed <> 11727 THEN
    RAISE EXCEPTION 'expected to remove 11727 rows, removed %', removed;
  END IF;

  SELECT count(*) INTO leftover FROM images WHERE url LIKE '%geograph%';
  IF leftover <> 0 THEN
    RAISE EXCEPTION '% geograph rows survived the delete', leftover;
  END IF;
END $$;

COMMIT;
