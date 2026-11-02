# How the directory was built, and what it would take to rebuild it

**Date:** 2026-11-02. **Question asked:** "I think the way I made this directory may have been
wrong." **Answer:** it was, and the fault is in the admission rule, not the data.

Nothing in this document was run against a paid API. Every number below comes from the live
database, from artefacts recovered out of git history, or from a published source.

---

## 1. Three front doors, none of which asked "is this a farm?"

| source | live rows | the rule that admitted them |
|---|---:|---|
| Google Places | 1,322 raw | `keyword="farm shop"`, `type="food"`, `radius=50000`, around 57 hand-picked points |
| FSA register | 1,537 | self-declared `BusinessTypeID 7838` ("Farmers/growers") |
| OpenStreetMap | 860 | OSM tags |
| unrecorded | 1,107 | no `dataSource` stored |

3,504 active rows after overlap.

The Google rule is in `farm-pipeline/src/google_places_fetch.py` at commit `71d40af7^`:

```python
params = {
    "location": f"{lat},{lng}",
    "radius": radius,          # 50000
    "keyword": "farm shop",
    "type": "food",
}
```

`type="food"` is Google's category for restaurants, cafés, bakeries, grocers and convenience
shops. `keyword` is a relevance hint, not a filter. London's 50 km circle reaches Acton.

**APNA Local was not a data error. It was the specification.** The same file's
`GOOGLE_TYPE_TO_OFFERINGS` map has entries for `bakery`, `cafe`, `restaurant`,
`grocery_or_supermarket`, `florist`, `pet_store` and `liquor_store`, so non-farms were expected
and given offerings rather than rejected.

Coverage is lumpy for the same reason: 57 points with overlapping 50 km circles do not tile the
UK, which is why mid-Wales and the Highlands are thin and 519 rows carry no county.

### The FSA door is worse, because its evidence is wrong rather than weak

APNA Local, `fsaId=1466696`, live from the FSA API today:

```json
{"BusinessName":"APNA Local","BusinessType":"Farmers/growers","BusinessTypeID":7838,
 "AddressLine2":"177 Gunnersbury Lane","AddressLine3":"Acton","PostCode":"W3 8LJ"}
```

A convenience shop on a London high street is registered with the FSA under the exact category
previously treated as the farm signal. **FSA business type cannot distinguish a farm from a
corner shop.**

### crawl4ai did not build the list

It was vendored and pinned, and wired into `shops_pipeline.py` and `advanced_farm_crawl.py` (the
latter with `LLMExtractionStrategy` against a farm-shop schema). But `seeds/uk.yml` was written
once as `https://example.org/your-allowed-list` and **never changed** before deletion, and
`shops_crawl.py`'s own docstring says "Minimal boot test ... Next step will implement real
crawling". The crawl path was scaffolded and never pointed at a real source.

crawl4ai's cousin did produce the descriptions: `scrape_farm_descriptions.py` (httpx +
BeautifulSoup) wrote `farm_descriptions.csv`, with `scraped_content` holding real page text and
`generated_description` holding prose like "**Barleylands Farm Shop: Where Fresh, Local Food
Meets Everyday Luxury**". That is the origin of the LLM-marketing descriptions.

**Correction.** An earlier draft of this document said that file holds 15,906 rows. That was its
*line* count; `scraped_content` contains embedded newlines. It holds **1,994 records**, of which
1,713 scraped successfully and **971 carry text usable for classification, 28% of the 3,504**.

---

## 2. Nothing has ever been verified

`venueType` is null on **all 3,504** rows. `venueVerifiedAt` is null on all 3,504. The claim gate
therefore denies every page, which is why every farm page currently reads "We have not confirmed
whether it is open to visitors".

`docs/verification/cornwall.csv` has 63 rows with `venue_type` filled on 53, but `verified`,
`verified_by`, `basis` and `notes` are **empty on all 63**. Those are machine proposals from the
enrichment step. No human signed anything off, which is why the import that would set
`venueVerifiedAt` was never run.

---

## 3. What is recoverable for free

Out of git history at `71d40af7^`, now in `.analysis/` (gitignored):

- `farms.uk.json`, 1,322 Google Places records, **every one carrying its `types` array**.
- `farm_descriptions.csv`, 15,906 rows, scraped text kept separate from generated prose.
- `google_places_fetch.py`, the rule itself.

**1,307 of the 3,504 live rows match back** to those records (1,296 by `place_id`, 11 by
normalised name). So types are recoverable for 37% of the directory at zero cost.
**2,197 rows have no recoverable types.**

Type counts across the 1,322 raw records: 316 `cafe`, 148 `restaurant`, 92
`grocery_or_supermarket`, 40 `bakery`, 31 `pet_store`, 28 `lodging`, 26 `tourist_attraction`, 22
`general_contractor`, 18 `convenience_store`, 15 `florist`.

---

## 4. Gate A: what we are permitted to use

| source | robots.txt | verdict |
|---|---|---|
| `farmretail.co.uk` (FARMA / Farm Retail Association) | `User-agent: *` → `Allow: /`, but **`ClaudeBot`, `anthropic-ai` and `Claude-Web` → `Disallow: /`**; `Content-Signal: search=yes, ai-train=no, use=reference` | **Do not crawl.** The disallow names this agent class. Spoofing a browser fingerprint to get round it would be circumvention. Route is to ask them: `hello@farmretail.co.uk`. |
| `farmsunday.org` (LEAF, Open Farm Sunday) | `User-agent: *`, only `/account/` and `/visit-a-farm/event/` disallowed | Listing pages permitted; individual event pages are not. |
| `soilassociation.org` | no robots.txt (404) | No declared restriction, but silence is not permission. Terms govern; check before use. |

The most authoritative source is the one we may not crawl. That is not a blocker, it is an
operator action: FARMA has roughly **300 to 325 members** nationally and an enquiries address.

---

## 5. Duplicates are not the problem

Clustering on normalised name plus postcode district across all 3,504 rows finds **2 clusters,
4 rows** (`my-apple-juice-ltd`/`my-apple-juice`, `the-egg-hut`/`egg-hut`). Entity resolution was
scoped as real work and is not. The "Argyll and Bute" versus "Argyll and Bute Council" problem is
a **county-name** duplicate, which is a separate and much smaller fix.

---

## 6. How many would survive

Each rule reported separately, because none of them is "is this a farm" and pretending otherwise
is how we got here.

| rule | survivors | what it actually measures |
|---|---:|---|
| A: name contains "farm" | 1,736 | naming convention. Misses dairies and orchards; keeps "Farm Shop" cafés |
| B: Google types, no hospitality/retail | 796 of 1,307 typed (61%) | Google's categorisation, available for 37% of rows |
| C: has postcode and county | 2,970 | data completeness, not identity |
| **published FARMA membership** | **~300–325** | an authority that knows what a farm shop is |

Rule B is **not safe to apply as-is**. It flags `P E Mead & Sons Farmshop` as
`general_contractor`, `Luff's Farm Shop` and `Bradshaws Farm Shop` as `pet_store`, and
`Cranbrook Farm Shop & Nursery` as `florist`. Those are real farm shops that also sell feed or
run a nursery. As a rule it has a high false-positive rate; as a triage hint it is useful.

**Honest range.** The truth sits between FARMA's ~300 members (an opt-in association, so a floor)
and roughly 1,500 (rule B's 61% extrapolated across all 3,504, which over-counts because it only
removes obvious hospitality). **The homepage's "3504+" is not supportable on any rule tested.**

---

## 6a. Measured: which signals actually separate a farm from a corner shop

Three signals were tested against four known controls. `APNA Local` is the known-bad control (a
convenience shop at 177 Gunnersbury Lane, Acton). `Luff's Farm Shop`, `Bradshaws Farm Shop`,
`P E Mead & Sons Farmshop` and `Barleylands Farm Shop` are known-good: all real farm shops, the
first two typed `pet_store` by Google and the third `general_contractor`.

| control | truth | first-party prose | Companies House SIC | OSM farmland ≤250m |
|---|---|---:|---|---:|
| Luff's Farm Shop | farm | 1 (too weak) | no match | **10** |
| Bradshaws Farm Shop | farm | 1 (too weak) | no match | **10** |
| P E Mead & Sons | farm | 3 | **wrong company** | **8** |
| Barleylands Farm Shop | farm | **−1 (wrong)** | no match | **3** |
| APNA Local | **not a farm** | absent | no match | **0** |

**Signal 1, first-party prose, fails.** Only 971 of the 1,994 recovered records carry usable text
(28% of the directory). Worse, genuine farm shops with thin or delivery-led websites score at or
below the threshold: Barleylands, a real Essex farm, scores −1 because its site reads like a
grocery delivery service. Any cut-off that excludes a corner shop also excludes real farms.

**Signal 2, Companies House, fails.** Of 3,144 rows with a postcode, only **204 (5.8%)** match a
live company by exact name and postcode, because farms are overwhelmingly sole traders and
partnerships rather than limited companies. Of those 204, only 57 carry agriculture SIC codes;
the remaining 147 include `Forest Farm Shop` (47210;47760), `Thorncliffe Farm Shop`
(47210;47220) and `Model Farm Shop Ltd.` (47220). Those are real farm shops whose companies
correctly registered *retail* codes, because a shop is retail. **Agriculture SIC is a weak
positive signal; non-agriculture SIC is not a negative signal at all.**

A note on method, because it nearly produced false data: a first pass fell back to "the only
company registered at this postcode" when no name matched. That attached `WILL'S BAKERY LTD` to
`P E Mead & Sons Farmshop` and `SHORETECH GROUP UK LIMITED` to `Fluffetts Farm Ltd`. Those 536
fallback matches were discarded. Only exact name matches are used above.

**Signal 3, OSM farmland proximity, works.** It is correct on all five controls, including both
rows the prose signal wrongly rejected and the one Google typed as a pet shop. Coverage is 100%,
because every one of the 3,504 rows has coordinates, including the 519 with no county.

Measured on a reproducible 150-row sample (0 query failures):

| | sample | projected over 3,504 |
|---|---:|---:|
| on or beside farmland | 107/150 (71.3%) | **2,500** (95% CI 2,246–2,753) |
| **no farmland within 250m** | 43/150 (28.7%) | **~1,004** |
| stricter: 3+ farmland features | 68/150 (45.3%) | 1,588 (CI 1,309–1,868) |

Tested for the obvious weakness, that zeros might be OSM mapping gaps rather than non-farms. The
zero rate by region is South England 24%, Midlands and Wales 31%, North England 32%, northern
Scotland 38%, southern Scotland 14%. A mild northward tilt but no cliff, and southern Scotland is
the lowest of all, so the result is not simply a coverage artefact. Northern Ireland shows 50% on
4 rows, too few to read.

**What the number means.** This is a *removal* rule, not an admission rule. It identifies roughly
1,000 rows with no mapped agriculture nearby. It does not certify the remaining 2,500: sitting
beside a field is consistent with being a farm, not proof of one, and none of those 2,500 is
verified as open to visitors.

### 6b. The farmland rule was then tested properly, and it does not hold

Cross-referencing the removal candidates against Search Console before acting on them found that
22 of the 224 rows probed would be cut. Only 7 clicks were at stake, but the names were the
problem:

```
foxes-croft              acheilidh-heritage-croft      no-4-croft-strathnaver
elrig-eggs-ltd           stockhill-honey               home-pastured-meats
inchnacardoch-deer-larder                              josh-horse-pet-supplies
```

**Three are crofts.** A croft is a Scottish smallholding and is a farm by definition. Also an egg
producer, a beekeeper, a pastured-meat producer and a deer larder. One row, a horse and pet
supplies shop, is a correct removal.

The error was in the control set, not the query. All five controls used in 6a were conventional
farm shops in lowland England, so "5 out of 5" measured the sampling, not the rule. The regional
breakdown had already shown northern Scotland with the highest zero rate at 38% and that was read
as a mild tilt rather than as the signal failing on crofts.

Widening the tags (`grass`, `grassland`, `pasture`, `heath`, `moor`, `scrub`, `place=farm`, farm
buildings) and the radius was then tested against both kinds of control:

| control | truth | narrow 250m | wide 250m | wide 1000m |
|---|---|---:|---:|---:|
| foxes-croft | farm | query failed | 1 | **16** |
| acheilidh-heritage-croft | farm | 0 | 0 | **8** |
| no-4-croft-strathnaver | farm | query failed | 1 | 1 |
| Barleylands | farm | 3 | — | 19 |
| **APNA Local (Acton)** | **not a farm** | **0** | — | **11** |

At 250m the rule rejects real crofts. At 1km it accepts a convenience shop in west London,
because a kilometre around anywhere in Acton contains parks, grassland and allotments.

**Conclusion: no fixed radius separates a farm from a shop.** The signal fails in both directions
depending on where the threshold is set, so it cannot be used as an absolute test. A usable
version would have to be *relative* — agricultural density around the point compared with the
local baseline — or combined with a second independent signal. Neither is built.

**Nothing was removed.** The cut was not run.

Total cost of all three signals: **£0**. Companies House bulk data (`BasicCompanyData`, 5.7m
companies) and Overpass are both free, and `farmretail.co.uk`, the one source that required
permission, turned out to be the one we did not need.

## 7. The structural fix

The reason APNA Local is public is that **ingestion and publication are the same act**. A row
arrives from an import and is live, with a default "Farm Shops" category attached. 2,397 of 3,504
carry that default.

The fix is not a filter. It is a boundary:

```prisma
model Evidence {
  id         String   @id @default(cuid())
  farmId     String
  kind       String   @db.VarChar(32)   // 'membership' | 'site-read' | 'phone' | 'osm-landuse' | 'fsa'
  source     String   @db.VarChar(200)  // the body or URL that said so
  observedAt DateTime
  observedBy String   @db.VarChar(64)   // person or script
  detail     Json?
  farm       Farm     @relation(fields: [farmId], references: [id], onDelete: Cascade)
  @@index([farmId, kind])
}
```

Gate B is then one assertion: **a row may not be published without at least one Evidence row.**
That test fails against today's data on all 3,504, which is the point of writing it.

`Farm.status` already exists, so candidate and listing do not need separate tables. No migration
has been applied; `prisma migrate dev` stays off the table on the live database.

---

## 8. What only the operator can decide

1. **Email FARMA** (`hello@farmretail.co.uk`) and ask whether their ~300 members may be used as
   an admission source. This single answer decides whether the rebuild is a weekend or a month.
2. **Confirm the honest headline.** "3504+" has to go. The replacement is whatever survives
   Gate B on the day it ships, and it will start small.
3. **Decide what happens to unevidenced rows** while evidence is gathered: left published with
   the current honest "not confirmed" sentence, or unpublished until they earn a listing.

No rows have been changed, no API has been called that costs money, and nothing has been
deleted.
