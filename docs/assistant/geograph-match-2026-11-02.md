# Geograph rows: measured, not guessed

Follow-up to `image-estate-audit-2026-11-02.md`, which recommended deleting all
11,727 pending Geograph rows. That recommendation was right about the rows and
wrong about the source. This document replaces Decision 1 with a measurement.

## What was actually wrong

`src/scripts/pipeline/sources/geograph.ts` asks Geograph's keyless syndicator
feed for photos near a farm coordinate, keeps everything within 0.5km, ranks by
**metres** and takes the top five. Its own comment is honest that photos are
"near the coordinate, not guaranteed to be OF the farm".

The response carries a `title` written by the photographer and a `tags`
taxonomy that includes a literal "Farm shop" category. `SyndicatorItem`
declares `title?: string`. `parseGeograph` reads neither. The discriminating
signal arrived in every response and was discarded, and then candidates were
sorted by the one field that cannot say what a photo is of.

The cost is visible in single cases:

| Farm | What we stored | What was in the same response |
|---|---|---|
| Friday Street Farm Shop | "Retro emporium" | "Friday Street Farm Shop", "Entrance to farm shop, Friday Street" |
| Eastington Farm Shop | the opening-hours sign | "Eastington Farm Shop", "Entrance to Eastington Farm Shop" |

Distance says where the camera stood. It says nothing about the subject.

## The gold set

200 farms that hold Geograph rows, sampled deterministically by `md5(id)`, in
two halves of 100. All 4,000 candidate titles and tags are committed at
`src/scripts/pipeline/fixtures/geograph-gold.json`. Labels come from looking at
the full-size photographs on contact sheets, not from the titles alone.

19 of the 200 farms have a Geograph photograph that genuinely depicts the
business. That is **9.5%**.

## What the measurement actually showed

| Stage | Match rate | Precision |
|---|---|---|
| Naive token overlap | 40% of farms | about 40%: it attached a police station to a chip shop, a wood to a venison farm, and a different named business to three others |
| Matcher v1, on the half it was written from | 8% | 100% |
| **Matcher v1, on the held-out half** | **14%** | **71%** (10 of 14) |
| Matcher v2, both halves | 9.5% | 100% |

The 71% is the only honest number in that table at the time it was taken, and
it is the reason the held-out half exists. The four failures it exposed all had
the same shape: the title named the business but the **subject** was an
appurtenance. A car park at Ben's Farmshop. An unused picnic shelter at
Allington Farm Shop. A roadside sign for High Royd. An empty paddock at Ancre
Hill Vineyard, because "vineyard" names a field.

Two fixes followed, both earned from those failures rather than invented:

1. Retail words must match on whole words. Substring matching had let "shop"
   match inside "Shopping", so "Trentham Shopping Village", a retail park,
   passed as Trentham Farm Shop.
2. An appurtenance anywhere in the title disqualifies it. Deliberately
   conservative: it costs the occasional genuine photo that mentions a gate,
   and buys precision, which is the asymmetry that matters when a false
   positive publishes someone else's premises under a farm's name.

One label was also corrected. Allington Farm Shop was marked negative because
the candidate I had checked was the picnic shelter; the matcher found a
different candidate titled "Allington farm shop", and the photograph is plainly
the shop, with its barrel roof, signage and car park. The label was wrong, not
the matcher, and it was changed on the evidence of the photograph.

**Both halves have now been tuned against, so the 100% is not an unbiased
estimate.** A third sample was therefore run, below.

A second limit worth stating: farms whose candidates carried no title signal
were labelled negative without viewing the images. A photograph that depicts a
shop without naming it would be missed, and the measurement cannot see it.

## Sample three: the unbiased number

100 further farms, sampled at offset 200 by the same `md5(id)` ordering, with
zero overlap against the first two. The matcher was frozen before the sample
was drawn and **has not been changed since**, which is the only thing that
makes the result worth anything.

- **4 hits in 100 farms.** Samples one and two gave 8 and 14.
- **3 of the 4 are genuine**, verified by viewing the photographs: Cassie's
  Bakes (shopfront with signage), Chadbury Farm Shop (the building), Lower
  Clopton Farm Shop (the building and its courtyard).
- **Precision 75%.** With four hits the confidence interval is very wide;
  treat this as "somewhere well short of perfect", not as 75% exactly.

The failure is instructive and is mine. "Nursery - Vine House Farm" is a field
of young trees, a growing nursery rather than a retail one. When the held-out
sample showed "vineyard" naming a field I removed that one word instead of
recognising the class, and "nursery" has exactly the same ambiguity.

### Recall

23 farms had every distinctive name token present in some candidate and were
still rejected. Most are correct: roads, gatehouses, a water tower, a
plantation. Two look like real recall losses:

- **Usk Boarding Kennels and Cattery** matched "Usk Boarding Kennels &
  Cattery, Lla..." exactly and was rejected because "kennels" and "cattery"
  are not in the retail list.
- **Carmichael Farm Shop** matched "Carmichael Visitor Centre", which may well
  be the premises.

So the retail list is too short at one end and too loose at the other.

### What this does to the estimate

Across all 300 farms the match rate is 7.7%, not 9.5%, and it varies a lot by
sample (4%, 8%, 14%). Against 2,367 farms holding Geograph rows that is about
**180 candidates, of which roughly 135 would be genuine** at the measured
precision. Lower than the 225 estimated from the first two samples.

That is still worth having. It reduces 2,367 farms to 180 rows a human can
clear in well under an hour, and it would give the site its first real
photographs. But the matcher needs at least one more iteration, and the rule
that matters is that **every iteration costs a fresh sample**. Tuning on
sample three and then quoting sample three is how the 100% above happened.

## Recommendation: option (b), delete and re-run

2,367 farms hold Geograph rows. At the measured 9.5%, re-running the pipeline
with relevance ranking should find a genuine photograph for roughly **225
farms**.

For scale: 1,018 farms currently have an approved image and every one of them
is an AI illustration. The site has no real photography at all. 225 farms is
about 6% of the directory and would raise the proportion with any image by
roughly a fifth, but more to the point it would be the first time a farm page
showed the actual place.

Reviewer cost is the part that makes this feasible. Roughly 225 candidates,
each carrying its own reason string ("title names cwmcerrig and a farm shop"),
so a reviewer accepts or rejects from the row rather than opening two tabs.
At ten to fifteen seconds each that is under an hour of review for the whole
directory. The reason that the current 11,727 have never been reviewed is that
reviewing them was never under an hour, and never worth it.

Steps, in order:

1. Fix the two faults sample three exposed: generalise the "names a field,
   not a shop" class beyond vineyard and nursery, and extend the retail list
   to cover kennels, cattery, visitor centre and similar. Then validate on a
   fourth sample. Do not quote a number from a sample you tuned on.
2. Delete the 11,727 existing rows. They are 120x120 thumbnails chosen by
   proximity and none of them should survive.
3. Re-run with `bestMatch` deciding admission, storing the Geograph title in
   `caption` and as `altText`, which the rows currently lack entirely.
4. Ingest the bytes rather than hot-linking, per the host rule in
   `src/lib/image-host.ts`. Full size is reachable by dropping the `_120x120`
   suffix and gives 640px on the long edge.
5. Keep them out of the `/shop/[slug]` hero until someone decides whether
   640px is enough. The imagery law admits them as real photographs, so they
   would hero immediately, and that is a design decision rather than a
   consequence.

## Licence

Geograph's own licensing page states that all photos are CC BY-SA 2.0 Generic
unless noted otherwise. Our rows already carry `attribution`, `sourceUrl` and
`license` populated for all 11,727, which is better than the approved AI rows
manage, where all three are null.

Two obligations need a decision rather than an assumption:

- **Attribution** must name the photographer and the licence and link to both.
  We store the author and the source URL, so this is a rendering task.
- **ShareAlike** is the one to think about. Resizing and converting to webp
  plausibly creates an Adaptation under CC BY-SA 2.0, which must then be
  offered under the same licence. That means those images on our site would
  carry a share-alike obligation onward. Fine for a directory, but it should
  be a decision someone makes, not something that happens quietly.

This section reports what the licence says. It is not legal advice, and the
share-alike question in particular deserves a human answer.

## Not done here

No row was deleted, approved or written. The matcher is a pure function with
tests and is not yet wired into `parseGeograph`.

## v3 and sample four

Two faults from sample three were fixed, and fixing them taught more than the
fixes were worth.

**The attempt that failed.** Geograph's `tags` carry a controlled vocabulary,
and 18 of the 19 labelled positives are classified `top:Business, Retail,
Services` or a retail `subject:`. Using those tags as positive evidence looked
obviously right and **dropped precision from 100% to 82%**. A tag saying a shop
is in the frame does not say it is *this farm's* shop, so combined with a token
that is really a village name it admitted a pub called the Royal Oak for
Bishopstone Stores, a Frankie & Benny's for Trentham Farm Shop, and a garage
for Smallford Farm Shop.

**What worked instead.** The same tags used only to rule a candidate *out*.
`subject:` names what the photograph is primarily of, so if the photographer
says it is a field of saplings then it is not a shop, whoever owns it. Used
negatively the tag cannot admit the wrong business, only reject. That single
asymmetry separates "Gates Nurseries" (`subject:garden centre`, a real shop)
from "Nursery - Vine House Farm" (`subject:nursery (plants)`, a field), which
no amount of word-list tuning could distinguish. The retail list also gained
kennels, cattery, bakery and butchery, which closed the Usk recall gap.

**Sample four**, 100 farms at offset 300, zero overlap, matcher frozen first:

- **5 hits in 100. 4 genuine. Precision 80%**, up from 75%.
- The miss is "Paved access to Broom Mill", an access road. "access to" is the
  same distancing class already handled; the phrase is simply not in the list.
- Re-running sample three under v3 improves it from 3 good of 4 to 4 of 5: it
  now finds "Farm Shop - Vine House Farm" rather than the nursery field.

### The estimate keeps falling, and that is the finding

| | Match rate | Precision |
|---|---|---|
| Samples one and two, tuned against | 8%, 14% | 100% |
| Sample three, unseen | 4% | 75% |
| Sample four, unseen | 5% | 80% |

The tuned samples overstated the match rate by roughly a factor of three,
because the matcher was built from exactly the cases they contained. On fresh
data it fires on about **4.5%** of farms.

Against 2,367 farms that is roughly **105 candidates and about 85 genuine
photographs**, not the 225 estimated from two samples, nor the 135 from three.
Each unbiased sample has cut it.

**So the honest recommendation is weaker than it was.** 85 real photographs
across a 3,504-farm directory is 2.4% coverage, in exchange for deleting 11,727
rows and re-running the pipeline. Review is cheap, well under half an hour for
a hundred-odd candidates with reasons attached, and these would be the site's
first real photographs. But this is now a marginal call rather than an obvious
win, and it is the operator's to make.

What is not marginal: the current 11,727 rows are worth nothing and the ranking
bug that produced them is real either way.
