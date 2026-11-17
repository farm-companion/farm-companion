# County taxonomy: proposal for approval

Status: awaiting approval. No farm data has been changed and no route, slug or
sitemap has been touched. This document plus `src/data/uk-counties.ts`,
`src/data/county-aliases.ts` and `src/data/uk-counties.test.ts` are the whole of
the slice. The migration is a separate slice, after approval.

Ground truth taken from the production database on 2026-11-17.

## 1. What is actually in the database

```
live distinct county values   : 280
active farms with a county    : 3265
active farms with NO county   : 23
```

Every one of the 280 values has at least one active farm, so every one of them
resolves today through `getCountyNameFromSlug` and serves a live, indexable
`/counties/<slug>` page. There are 280 such pages.

The 280 values are not counties. They are at least six different kinds of thing
mixed into one column:

| kind | examples | roughly |
|---|---|---|
| ceremonial counties | Kent, Devon, Norfolk | the large ones |
| English district and borough councils | Babergh, Mole Valley, Three Rivers, Wychavon | ~110 |
| London boroughs as siblings of counties | Ealing, Havering, Southwark, Tower Hamlets | 9 |
| Scottish council areas | Fife, Moray, Orkney Islands | ~27 |
| Welsh principal areas | Powys, Gwynedd, Ceredigion | ~19 |
| Northern Ireland districts | Belfast, Mid Ulster | 10 |
| duplicates and non-places | Bristol / Bristol City, Torfaen / Torfaen Principal Area, "Cymru" | 8 |

The visible consequences: a farm in Bolton sits under a different top-level
"county" than one tagged Greater Manchester; Berkshire sits beside West
Berkshire, Windsor and Maidenhead and Wokingham; and "Cymru", the Welsh name for
the whole of Wales, is listed as a county with one farm in it.

Two distribution facts matter for judging the fold. 63 of the 280 values have
exactly one active farm, which is where the junk concentrates. And Highland has
387 active farms, 12% of the directory in one value; those rows were checked
against their postcodes (IV, PH, Inverness, Portree, Carrbridge) and are genuine
Highland addresses, not a geocoding fallback, so Highland is left alone.

## 2. Proposed taxonomy

| nation | standard | count |
|---|---|---|
| England | ceremonial counties, Lieutenancies Act 1997 Sch. 1, plus the Isles of Scilly | 49 |
| Scotland | council areas, Local Government etc. (Scotland) Act 1994 Sch. 1 | 32 |
| Wales | principal areas, Local Government (Wales) Act 1994 Sch. 1 | 22 |
| Northern Ireland | districts, Local Government (Boundaries) Act (NI) 2008 | 11 |
| | **total canonical** | **114** |

Of those 114, **108 have at least one farm**. The six empty ones (Blaenau Gwent,
City of London, Clackmannanshire, East Renfrewshire, Inverclyde, Neath Port
Talbot) stay in the list so that an incoming farm has somewhere to land, but
they must not appear on `/counties`.

Why this standard: it is the set a UK reader means by "county"; it maps onto a
postal address; and each nation gets one statutory list rather than a mix of
tiers. Ceremonial counties are preferred over England's current unitary
authorities deliberately, because a reader looking for Cumbria does not search
for "Westmorland and Furness". The list is in the repo as
`farm-frontend/src/data/uk-counties.ts` with each source cited in the header.

**280 live values fold to 108 counties in use. 740 of the 3265 placed farms get
a different county label.**

### The twelve largest counties after the fold

| canonical county | farms | folded in from |
|---|---:|---|
| Highland | 387 | (nothing; already canonical) |
| Somerset | 111 | Bath and North East Somerset, North Somerset |
| Devon | 102 | East Devon, Mid Devon, North Devon, South Hams, Teignbridge, Torbay, Torridge, West Devon |
| Norfolk | 91 | Breckland, Broadland, King's Lynn and West Norfolk, North Norfolk, Norwich City, South Norfolk |
| Kent | 84 | Ashford, Canterbury City, Dover, Folkestone and Hythe, Medway, Sevenoaks, Tunbridge Wells |
| Cornwall | 78 | (nothing; already canonical) |
| North Yorkshire | 73 | Redcar and Cleveland, York |
| Essex | 73 | Brentwood, Chelmsford, Colchester, Epping Forest, Maldon, Rochford, Tendring, Thurrock, Uttlesford |
| Hampshire | 71 | Basingstoke and Deane, East Hampshire, Fareham, Hart, Havant, Winchester City |
| Gloucestershire | 69 | Cotswold, Forest of Dean, South Gloucestershire, Stroud, Tewkesbury |
| Lancashire | 65 | Blackpool, Fylde, Lancaster City, Pendle, Preston, Ribble Valley, West Lancashire, Wyre |
| Powys | 63 | (nothing; already canonical) |

## 3. The mapping

`farm-frontend/src/data/county-aliases.ts` holds 179 entries, one for every live
value that is not already canonical. The remaining 101 values are canonical and
map to themselves. Each fold is a district or borough rising to its ceremonial
county, a London borough to Greater London, a duplicate spelling merging, or a
mistag resolved from its rows' postcodes.

The four values that were not places at the tier they claimed were each resolved
by reading the postcodes of their own rows, not by guessing:

| value | farms | postcode evidence | resolved to |
|---|---:|---|---|
| Cymru | 1 | LL17 0UY, Saint Asaph | Denbighshire |
| Perthshire | 1 | Abernethy | Perth and Kinross |
| Torfaen Principal Area | 1 | NP18 1GD, Ponthir | Torfaen |
| Wrexham Principal Area | 3 | LL13, LL11 | Wrexham |

Duplicate pairs merged: Bristol / Bristol City, Leicester / Leicester City,
Rhondda Cynon Taf / Rhondda Cynon Taff, Torfaen / Torfaen Principal Area,
Wrexham / Wrexham Principal Area, Perth and Kinross / Perthshire.

Nothing was mapped on a guess. Everything either sits in a statutory list or was
resolved from its own rows' postcodes. The nine items in section 5 are the ones
that are genuinely your call rather than mine, and none of them is blocking: the
mapping as it stands is complete and self-consistent, and section 5 only changes
where a few lines point.

## 4. URL consequences, and the redirect plan

This is the part the project's CLAUDE.md is strictest about, and the header of
`src/lib/county-slug.ts` records that this exact area has already cost the site
404s once: the sitemap and the route disagreed on punctuation and five county
pages were lost, 9 found in the crawl of 1 Nov 2026 and 18 in Search Console.

Measured, not asserted:

```
URLs today                    : 280
  survive unchanged           : 101
  need a permanent redirect   : 179
  redirects to a dead slug    : 0
```

So **179 currently indexable URLs stop existing** and each needs a permanent
redirect to its canonical replacement. Seven canonical slugs are new (nothing
currently serves them): `bedfordshire`, `cheshire`, `city-of-edinburgh`,
`cumbria`, `isle-of-anglesey`, `na-h-eileanan-siar`, `northamptonshire`.

Three of the five punctuated names from the earlier 404 incident are in the
folded set, which is a reason for care rather than a new problem:
`comhairle-nan-eilean-siar-western-isles`, `king-s-lynn-and-west-norfolk` and
`bournemouth-christchurch-and-poole`.

### Mechanism

Generate the redirects in `next.config.ts` from `COUNTY_ALIASES`, so one file is
the source of both the data fold and the URL fold and they cannot drift:

```ts
// in next.config.ts redirects()
...Object.entries(COUNTY_ALIASES)
  .map(([from, to]) => [slugifyCounty(from), slugifyCounty(to)])
  .filter(([from, to]) => from !== to)
  .map(([from, to]) => ({
    source: `/counties/${from}`,
    destination: `/counties/${to}`,
    permanent: true,
  })),
```

**One thing to decide, because it is not what the brief assumed.** Next.js
`permanent: true` emits **308**, not 301. Google documents 301 and 308 as
equivalent permanent redirects and consolidates signals the same way, so 308 is
safe here and needs no extra code. If you want a literal 301 in the response,
that needs `middleware.ts` setting the status explicitly. My recommendation is
308 via `next.config.ts`: no runtime cost, cacheable at the edge, one source of
truth. Say the word if you want literal 301 instead.

### Sitemap

No new sitemap work is needed, and this is worth stating precisely because it is
where the last bug lived. Both sitemap paths derive their county list from the
farms table, so when the data folds they emit the 108 canonical slugs and agree
with the routes automatically.

One latent divergence should be closed in the same slice anyway:
`src/lib/sitemap-generator.ts:132` still defines its own local `slugify`, which
maps `&` to " and " where `slugifyCounty` maps it to a dash. No current county
name contains `&`, so nothing is broken today, but it is the same bug class that
cost the site five pages, sitting in the file that was its victim. One-line fix:
import `slugifyCounty`.

### Ordering, so nothing 404s

1. Ship the redirects and the data files first, with the data untouched. While
   the old values are still in the database the folded pages become unreachable
   rather than broken, which is harmless: no URL 404s at any point.
2. Then run the data migration.
3. Then let the sitemap regenerate, and resubmit it.

Doing it the other way round leaves 179 URLs returning 404 for as long as it
takes to deploy. This ordering never does.

### Reversibility

The migration adds a `county_original` column, writes the pre-fold value into it
for every row it touches, and only then rewrites `county`. One `UPDATE farms SET
county = county_original WHERE county_original IS NOT NULL` undoes the whole
fold. Alias keys are then kept forever: deleting one turns a 308 back into a 404.

## 5. Decisions for you, Abu Aaliyah

None of these blocks the plan. Each one moves a small number of farms, and my
recommendation is given so you can simply say "all as recommended" if you agree.

| # | question | farms | my recommendation |
|---|---|---:|---|
| 1 | **Cumbria.** Cumberland and Westmorland and Furness are the real councils since 2023; Cumbria is the ceremonial county people still write. | 51 | Fold both into Cumbria. |
| 2 | **County Durham vs Durham.** The ceremonial county is "Durham"; almost everyone writes "County Durham". | 34 | Keep "County Durham" as the label, a deliberate deviation from the statute. Already done in the list. |
| 3 | **Isles of Scilly.** Not a ceremonial county; shares Cornwall's Lord Lieutenant but has its own postal identity and TR21-25. | 5 | Keep separate from Cornwall. Already done. |
| 4 | **Berkshire.** Ceremonial county with no council. Folding puts West Berkshire, Windsor and Maidenhead and Wokingham under it. | 36 | Fold. "Berkshire" is what a reader searches. |
| 5 | **Milton Keynes.** Buckinghamshire ceremonially, but a strong standalone identity. | 6 | Fold into Buckinghamshire for consistency. Reasonable to overrule. |
| 6 | **Teesside.** Redcar and Cleveland is North Yorkshire ceremonially; Stockton-on-Tees straddles Durham and North Yorkshire. | 6 | Redcar and Cleveland to North Yorkshire, Stockton-on-Tees to County Durham. The weakest two lines in the map. |
| 7 | **Bristol.** Label it "Bristol" or "City of Bristol"? | 7 | "Bristol". Shorter, and the slug stays `bristol`, which already exists and is indexed. |
| 8 | **23 active farms have no county at all.** They appear on no county page and are unreachable by county browse. | 23 | Out of this slice. Worth its own slice to backfill from postcode; flagging it, not guessing. |
| 9 | **Dumfries and Galloway** holds 275 rows but only 59 are active, so 216 inactive rows sit in one value. | 216 | Not a taxonomy problem. Noting it because the ratio is unlike anywhere else and may indicate a bad import. |

## 6. What `countyCount` should mean

Recommendation: **the number of canonical counties with at least one active
farm** — currently 108. Not the size of the canonical list (114), which would
advertise six counties with nothing in them, and not a count of raw column
values, which is what produced 280.

`getFarmStats()` in `src/lib/farm-data.ts` keeps building
`new Set(farms.map(f => f.location?.county))`. After the fold that set returns
108 on its own, so the function needs no change to become correct. It should
still gain a one-line comment saying the number is only meaningful because the
column is canonical, so nobody reintroduces free-text counties.

Should `/counties` say "N counties" at all? Yes, once it is true. "3,265 farm
shops across 108 counties" is accurate and is a better claim than the current
one. Note the total: 3,265 farms are placed in a county and 23 are not, so
"3,288 farm shops across 108 counties" would be the next small falsehood.

Three live surfaces render the false number today and are being relabelled from
"counties" to "areas" by another session as a stop-gap, so this slice does not
touch them: `src/app/shop/page.tsx`, `src/components/ShopPageClient.tsx`,
`src/app/counties/page.tsx`. Once the fold lands they should go back to saying
"counties" with the real number. Also raised by that session and worth your
attention for the same reason: `ShopPageClient.tsx` has a third stat tile
hardcoded to "100%" labelled "Verified Farms", which is an unverifiable claim
sitting beside the numbers being corrected.

`src/components/DynamicSeasonalHeadline.tsx` also references a county count but
is rendered nowhere; left alone deliberately.

## 7. Verification run for this slice

```
$ npx tsx --test src/data/uk-counties.test.ts
✔ canonical list has no duplicate names
✔ every canonical county has a distinct slug
✔ every alias resolves to a canonical county
✔ no alias key is itself canonical
✔ the fold is idempotent
✔ no alias slug collides with a different canonical slug
✔ canonicalCounty passes through canonical names unchanged
✔ nation counts match the statutory lists
ℹ pass 8   ℹ fail 0
```

And the data files checked against the production database, which is the claim
that matters:

```
live distinct county values   : 280
values not resolving to canon : 0 []
alias keys absent from DB     : 0 []
canonical counties in use     : 108 of 114 in the list
URLs today                    : 280
  survive unchanged           : 101
  need a permanent redirect   : 179
  redirects to a dead slug    : 0
farms whose label changes     : 740
```

## Appendix: all 179 redirects

| farms | from `/counties/<slug>` | to `/counties/<slug>` |
|---:|---|---|
| 30 | `cheshire-east` | `cheshire` |
| 28 | `westmorland-and-furness` | `cumbria` |
| 27 | `west-northamptonshire` | `northamptonshire` |
| 23 | `cumberland` | `cumbria` |
| 20 | `bath-and-north-east-somerset` | `somerset` |
| 20 | `central-bedfordshire` | `bedfordshire` |
| 17 | `anglesey` | `isle-of-anglesey` |
| 17 | `chichester` | `west-sussex` |
| 17 | `pendle` | `lancashire` |
| 15 | `south-gloucestershire` | `gloucestershire` |
| 12 | `west-berkshire` | `berkshire` |
| 11 | `east-devon` | `devon` |
| 11 | `leeds` | `west-yorkshire` |
| 11 | `north-somerset` | `somerset` |
| 10 | `canterbury-city` | `kent` |
| 10 | `cheshire-west-and-chester` | `cheshire` |
| 10 | `north-northamptonshire` | `northamptonshire` |
| 10 | `south-norfolk` | `norfolk` |
| 9 | `rushcliffe` | `nottinghamshire` |
| 9 | `warrington` | `cheshire` |
| 8 | `bedford` | `bedfordshire` |
| 7 | `brighton-and-hove` | `east-sussex` |
| 7 | `epping-forest` | `essex` |
| 7 | `lewes` | `east-sussex` |
| 7 | `sheffield` | `south-yorkshire` |
| 7 | `swindon` | `wiltshire` |
| 7 | `tendring` | `essex` |
| 7 | `warwick` | `warwickshire` |
| 7 | `west-oxfordshire` | `oxfordshire` |
| 7 | `wokingham` | `berkshire` |
| 6 | `horsham` | `west-sussex` |
| 6 | `kirklees` | `west-yorkshire` |
| 6 | `milton-keynes` | `buckinghamshire` |
| 6 | `tandridge` | `surrey` |
| 6 | `wealden` | `east-sussex` |
| 6 | `windsor-and-maidenhead` | `berkshire` |
| 5 | `barnsley` | `south-yorkshire` |
| 5 | `breckland` | `norfolk` |
| 5 | `darlington` | `county-durham` |
| 5 | `huntingdonshire` | `cambridgeshire` |
| 5 | `medway` | `kent` |
| 5 | `north-lincolnshire` | `lincolnshire` |
| 5 | `rhondda-cynon-taff` | `rhondda-cynon-taf` |
| 5 | `rother` | `east-sussex` |
| 5 | `rotherham` | `south-yorkshire` |
| 5 | `south-oxfordshire` | `oxfordshire` |
| 5 | `stroud` | `gloucestershire` |
| 5 | `teignbridge` | `devon` |
| 5 | `tewkesbury` | `gloucestershire` |
| 4 | `ashford` | `kent` |
| 4 | `calderdale` | `west-yorkshire` |
| 4 | `cambridge-city` | `cambridgeshire` |
| 4 | `colchester` | `essex` |
| 4 | `comhairle-nan-eilean-siar-western-isles` | `na-h-eileanan-siar` |
| 4 | `east-suffolk` | `suffolk` |
| 4 | `maldon` | `essex` |
| 4 | `sefton` | `merseyside` |
| 4 | `south-hams` | `devon` |
| 4 | `stockton-on-tees` | `county-durham` |
| 4 | `trafford` | `greater-manchester` |
| 4 | `wakefield` | `west-yorkshire` |
| 4 | `west-lancashire` | `lancashire` |
| 3 | `bolton` | `greater-manchester` |
| 3 | `bournemouth-christchurch-and-poole` | `dorset` |
| 3 | `bristol-city` | `bristol` |
| 3 | `chelmsford` | `essex` |
| 3 | `derbyshire-dales` | `derbyshire` |
| 3 | `doncaster` | `south-yorkshire` |
| 3 | `east-cambridgeshire` | `cambridgeshire` |
| 3 | `edinburgh` | `city-of-edinburgh` |
| 3 | `enfield` | `greater-london` |
| 3 | `fenland` | `cambridgeshire` |
| 3 | `gateshead` | `tyne-and-wear` |
| 3 | `hounslow` | `greater-london` |
| 3 | `mid-suffolk` | `suffolk` |
| 3 | `oldham` | `greater-manchester` |
| 3 | `preston` | `lancashire` |
| 3 | `staffordshire-moorlands` | `staffordshire` |
| 3 | `stratford-on-avon` | `warwickshire` |
| 3 | `telford-and-wrekin` | `shropshire` |
| 3 | `torbay` | `devon` |
| 3 | `tower-hamlets` | `greater-london` |
| 3 | `uttlesford` | `essex` |
| 3 | `west-lindsey` | `lincolnshire` |
| 3 | `wrexham-principal-area` | `wrexham` |
| 2 | `bromsgrove` | `worcestershire` |
| 2 | `derby-city` | `derbyshire` |
| 2 | `east-hampshire` | `hampshire` |
| 2 | `east-hertfordshire` | `hertfordshire` |
| 2 | `forest-of-dean` | `gloucestershire` |
| 2 | `halton` | `cheshire` |
| 2 | `hart` | `hampshire` |
| 2 | `havering` | `greater-london` |
| 2 | `king-s-lynn-and-west-norfolk` | `norfolk` |
| 2 | `lancaster-city` | `lancashire` |
| 2 | `lichfield` | `staffordshire` |
| 2 | `mid-devon` | `devon` |
| 2 | `mole-valley` | `surrey` |
| 2 | `north-east-lincolnshire` | `lincolnshire` |
| 2 | `north-norfolk` | `norfolk` |
| 2 | `norwich-city` | `norfolk` |
| 2 | `nottingham-city` | `nottinghamshire` |
| 2 | `peterborough-city` | `cambridgeshire` |
| 2 | `redbridge` | `greater-london` |
| 2 | `redcar-and-cleveland` | `north-yorkshire` |
| 2 | `ribble-valley` | `lancashire` |
| 2 | `rochford` | `essex` |
| 2 | `sevenoaks` | `kent` |
| 2 | `south-kesteven` | `lincolnshire` |
| 2 | `southwark` | `greater-london` |
| 2 | `stafford` | `staffordshire` |
| 2 | `three-rivers` | `hertfordshire` |
| 2 | `wandsworth` | `greater-london` |
| 2 | `waverley` | `surrey` |
| 2 | `west-devon` | `devon` |
| 2 | `west-suffolk` | `suffolk` |
| 2 | `winchester-city` | `hampshire` |
| 2 | `wirral` | `merseyside` |
| 2 | `wychavon` | `worcestershire` |
| 2 | `wyre` | `lancashire` |
| 2 | `york` | `north-yorkshire` |
| 1 | `babergh` | `suffolk` |
| 1 | `basingstoke-and-deane` | `hampshire` |
| 1 | `bassetlaw` | `nottinghamshire` |
| 1 | `blackpool` | `lancashire` |
| 1 | `bolsover` | `derbyshire` |
| 1 | `bradford` | `west-yorkshire` |
| 1 | `brentwood` | `essex` |
| 1 | `broadland` | `norfolk` |
| 1 | `broxtowe` | `nottinghamshire` |
| 1 | `charnwood` | `leicestershire` |
| 1 | `cherwell` | `oxfordshire` |
| 1 | `cotswold` | `gloucestershire` |
| 1 | `coventry` | `west-midlands` |
| 1 | `cymru` | `denbighshire` |
| 1 | `dacorum` | `hertfordshire` |
| 1 | `dover` | `kent` |
| 1 | `dudley` | `west-midlands` |
| 1 | `ealing` | `greater-london` |
| 1 | `east-staffordshire` | `staffordshire` |
| 1 | `fareham` | `hampshire` |
| 1 | `folkestone-and-hythe` | `kent` |
| 1 | `fylde` | `lancashire` |
| 1 | `gedling` | `nottinghamshire` |
| 1 | `guildford` | `surrey` |
| 1 | `harborough` | `leicestershire` |
| 1 | `havant` | `hampshire` |
| 1 | `hertsmere` | `hertfordshire` |
| 1 | `high-peak` | `derbyshire` |
| 1 | `hillingdon` | `greater-london` |
| 1 | `hinckley-and-bosworth` | `leicestershire` |
| 1 | `leicester` | `leicestershire` |
| 1 | `leicester-city` | `leicestershire` |
| 1 | `lincoln-city` | `lincolnshire` |
| 1 | `malvern-hills` | `worcestershire` |
| 1 | `manchester` | `greater-manchester` |
| 1 | `melton` | `leicestershire` |
| 1 | `newcastle-upon-tyne` | `tyne-and-wear` |
| 1 | `newcastle-under-lyme` | `staffordshire` |
| 1 | `north-devon` | `devon` |
| 1 | `north-east-derbyshire` | `derbyshire` |
| 1 | `nuneaton-and-bedworth` | `warwickshire` |
| 1 | `oxford-city` | `oxfordshire` |
| 1 | `perthshire` | `perth-and-kinross` |
| 1 | `rugby` | `warwickshire` |
| 1 | `runnymede` | `surrey` |
| 1 | `south-cambridgeshire` | `cambridgeshire` |
| 1 | `south-tyneside` | `tyne-and-wear` |
| 1 | `stockport` | `greater-manchester` |
| 1 | `stoke-on-trent` | `staffordshire` |
| 1 | `thurrock` | `essex` |
| 1 | `torfaen-principal-area` | `torfaen` |
| 1 | `torridge` | `devon` |
| 1 | `tunbridge-wells` | `kent` |
| 1 | `vale-of-white-horse` | `oxfordshire` |
| 1 | `watford` | `hertfordshire` |
| 1 | `welwyn-hatfield` | `hertfordshire` |
| 1 | `woking` | `surrey` |
| 1 | `worthing` | `west-sussex` |
