-- Merge county names that denote the same place.
--
-- The directory held 285 distinct `farms.county` strings for the UK. Five of
-- those were one place recorded twice, because the council's corporate name
-- and the county name were both treated as counties:
--
--   Argyll and Bute (2)  +  Argyll and Bute Council (3)        -> 5
--   Bridgend (4)         +  Bridgend County Borough (1)        -> 5
--   Caerphilly (5)       +  Caerphilly County Borough (1)      -> 6
--   County Durham (21)   +  Durham (1)                         -> 22
--   East Ayrshire (4)    +  East Ayrshire Council (5)          -> 9
--
-- Each pair split one county across two /counties/<slug> pages, so both pages
-- undercounted and neither listed all the farms.
--
-- Three more names carried an administrative suffix with no twin to merge
-- with. They are renamed for the same reason: a council is not a county.
--
--   East Dunbartonshire Council (1)   -> East Dunbartonshire
--   Merthyr Tydfil County Borough (1) -> Merthyr Tydfil
--   North Ayrshire Council (4)        -> North Ayrshire
--
-- Canonical form is the county's own name, so "County Durham" wins over
-- "Durham" (21 farms against 1, and it is the correct name), while the
-- council suffix is dropped everywhere else.
--
-- Retired slugs are 301'd in next.config.ts; see countyMergeRedirects there.
-- Run inside a transaction and check the counts before COMMIT.

BEGIN;

UPDATE farms SET county = 'Argyll and Bute'     WHERE county = 'Argyll and Bute Council';
UPDATE farms SET county = 'Bridgend'            WHERE county = 'Bridgend County Borough';
UPDATE farms SET county = 'Caerphilly'          WHERE county = 'Caerphilly County Borough';
UPDATE farms SET county = 'County Durham'       WHERE county = 'Durham';
UPDATE farms SET county = 'East Ayrshire'       WHERE county = 'East Ayrshire Council';
UPDATE farms SET county = 'East Dunbartonshire' WHERE county = 'East Dunbartonshire Council';
UPDATE farms SET county = 'Merthyr Tydfil'      WHERE county = 'Merthyr Tydfil County Borough';
UPDATE farms SET county = 'North Ayrshire'      WHERE county = 'North Ayrshire Council';

-- One London borough was recorded as a county of its own while 15 other London
-- farms sat under "Greater London". backfill-farm-counties.sql rolls incoming
-- boroughs up to Greater London, so leaving this row would reintroduce exactly
-- the split this file exists to close.
UPDATE farms SET county = 'Greater London'       WHERE county = 'Richmond-Upon-Thames';

-- Expect 279 (was 285), and no row left ending in a council suffix.
SELECT count(DISTINCT county) AS distinct_counties FROM farms
  WHERE status = 'active' AND btrim(coalesce(county, '')) <> '';
SELECT county, count(*) FROM farms
  WHERE county ~ '(Council|County Borough)$' GROUP BY county;

COMMIT;
