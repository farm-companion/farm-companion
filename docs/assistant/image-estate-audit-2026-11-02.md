# Image estate audit, 2026-11-02

Measured state of every image row, what was fixed, and two decisions left open
for the operator. All figures come from the live database and from HTTP probes
run on the day, not from the schema or from prior documents.

## Where the estate stood

3,504 farms. 12,831 image rows. 1,104 farms had an approved image, so 69 per
cent of the directory had no picture at all, and 2,183 farms had a candidate
sitting in the moderation queue that nobody could usefully approve.

| Population | Rows | Host | State |
|---|---|---|---|
| `ai_apothecary`, approved | 1,018 | our own object store | healthy, all 200 |
| `admin`, approved | 86 | `im.runware.ai` | every one a 404 |
| `cc`, pending | 11,727 | `geograph.org.uk` | 120x120 thumbnails |

Zero rows pointed at `*.public.blob.vercel-storage.com`, so the Vercel Blob
backfill that `blob-adapter.ts` raises `LegacyBlobUrlError` for has in fact
already been completed in the data. That worry can be closed.

## Fixed: 86 farm pages served 404 heroes

`scripts/generate-farm-images-direct.ts` generated 86 farm images through the
Runware API on 2026-02-01, wrote them with `uploadedBy: 'admin'`, and kept the
generator's own CDN URL as the permanent `url`. The bytes were never
downloaded. One mistake, two defects:

1. `'admin'` is a real-photograph label, so `selectFarmHeroImage` promoted
   every one of them to the `/shop/[slug]` hero as `style: 'photo'`. That is
   the page asserting "this is what this farm looks like" about an AI
   illustration, which is exactly what the imagery law in
   `src/lib/farm-hero-image.ts` exists to forbid.
2. Runware evicted the files. All 86 heroes returned 404, verified live on
   `/shop/cw-shenton-farm-shop` and `/shop/honeydale-farm-tea-rooms`.

The fix was data, not code. `scripts/backfill-runware-uploaded-by.ts` relabels
them `ai_generator` (the documented label for legacy mixed-style AI rows,
suppressed site-wide since Slice 1.1.3c) and sets `status: 'rejected'`, because
the files are gone. The existing imagery law then returns null and the page
renders its typographic hero. No application code changed.

Rows are matched on the generator's CDN host rather than on `uploadedBy`, so a
re-run cannot touch a genuine admin photograph.

**Before:** 1,104 approved, 1,018 ok, 86 dead.
**After:** 1,018 approved, 1,018 ok, zero hot-linked.

## Decision 1: delete the 11,727 Geograph rows

**Recommendation: delete them. They are not an asset.**

They are CC-BY-SA-2.0 photographs hot-linked to geograph.org.uk at
`_120x120.jpg`, which is a 120 pixel thumbnail. Full size is reachable by
dropping the suffix, and yields 640px on the long edge, so an ingest is
technically possible. The problem is not resolution, it is subject.

A random sample of 40 was downloaded at full size and checked against
Geograph's own titles. One of the forty depicts the business it is attached to
(`eastington-farm-shop`, and that is a photograph of the opening-hours sign).
One more is arguable (`windmill-hill-fruits-ltd`, "Entrance to Windmill Hill
berry farm"). The rest are empty fields, roads, hedgerows, a stone finial, a
snow-covered track, a red phone box and a Countryside Stewardship notice.

The misses are worse than a blank space, because several depict a different,
named business:

| Our farm | Geograph title |
|---|---|
| `cnoc-deer-larder` | Torvaig House Hotel |
| `eden-food-hall-and-butchers` | Houghton Hall Garden Centre |
| `ronald-collis-farm-shop` | Car dealer by A44 south-east of Evesham |
| `the-cauldron` | Pendle House Farm |
| `yare-valley-farm-shop` | Teles Patisserie at Grange Farm |

Publishing "Torvaig House Hotel" as the picture of Cnoc Deer Larder
misrepresents two businesses at once. These rows were matched by grid square,
not by subject, and proximity is not evidence of depiction.

Filtering by title would keep roughly 2 rows in 40, so about 300 to 600 rows of
sign photographs and gateways at 640px. That does not justify an ingest
pipeline, and every row kept is a chance to publish someone else's premises
under a farm shop's name.

Worth noting alongside the admission-by-evidence work on `feat/farm-evidence`:
a Geograph photograph in the same grid square is precisely the kind of weak
proximity signal that should not admit anything.

Not executed. Deleting 11,727 production rows is the operator's call.

## Decision 2: delete the `farm-photos` Vercel project — DONE 2026-11-02

**Recommendation was: delete it.** It could not be fixed, only removed. The operator
approved and the project was deleted the same day. See the closing note below
for what it did and did not retire.

- No source exists. The GitHub org holds six repositories and none is
  `farm-photos`. Both local copies, `farm-photos/` and
  `FC1/farm-companion/farm-photos/`, are empty directories.
- It is still publicly serving. Root returns 200 and `/api/photos` returns
  400, from a build that is 431 days old.
- That build has the leaked credentials compiled into it, and no environment
  variable change reaches it.
- Two redeploy attempts on 2026-11-02 both errored. Vercel blocks it for a
  vulnerable Next.js, and there is no source to upgrade.

Nothing in the live frontend references it: the photo feature moved to the
Prisma `Image` model and `blob-adapter.ts`. Deleting the project is the only
action that actually retires those credentials.

### What it actually retired

Its six variables were read off and fingerprinted before deletion. Most were
duplicates, so the deletion retires less than it appears to:

| Variable | Fingerprint | Also held by | Retired? |
|---|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | `dfd35736` | farm-frontend | no, and this is the *new* rotated token |
| `DEEPSEEK_API_KEY` | `d9b6d16f` | farm-frontend | no, identical key, still needs rotating |
| `REDIS_URL` | `b2fc41f0` | farm-frontend | no, and the Redis Cloud DB was deleted in June 2026 |
| `RESEND_API_KEY` | `29ba5078` | nowhere else | one copy gone, but the key still works until it is deleted in Resend |
| `FARM_PHOTOS_API_URL`, `NEXT_PUBLIC_SITE_URL` | n/a | n/a | not credentials |

So the deletion removes a publicly reachable 431-day-old service and one stored
copy of the old Resend key. It does **not** retire any credential on its own:
the DeepSeek key still lives in farm-frontend, and the old Resend key is still
live in Resend until it is removed there.

The `farm-photos-kv` Redis marketplace resource is linked to **farm-frontend**,
not to this project, so it survived the deletion and remains a separate cleanup.

The project had no custom domain, no alias and no integration resources of its
own. Lost: the 431-day-old deployment and its build logs, which nothing
depended on.

## Still open, not addressed here

- No public photo submission route exists, and `sendPhotoSubmissionReceipt` in
  `src/lib/email.ts` has no callers. The `pending` / `approved` / `rejected`
  workflow in the schema has no way for anyone outside the admin to put a
  photograph into it. This is the same shape as the contact form that had
  never sent an email: a surface that looks finished and is not wired up.
- The 86 generated rows carried factually wrong alt text, for example
  "Honeydale Farm Tea Rooms - British farm shop in Greater London" for a farm
  in Oxfordshire. They are rejected now, so nothing renders it, but any future
  generation run should not template alt text from an unverified county.
- The object store returned two transient 504s in a 1,018-row sweep. Both
  objects were intact on retry. The sweep now retries 5xx and socket errors
  three times before calling a row dead, so the gate does not cry wolf.

## The instrument

`scripts/audit-image-liveness.ts` probes every row and reports verdicts by host
and by status. It exits 1 when any approved row fails, so it can gate a deploy.

```bash
npx tsx scripts/audit-image-liveness.ts                  # approved rows
npx tsx scripts/audit-image-liveness.ts --dimensions     # also decode sizes
npx tsx scripts/audit-image-liveness.ts --json=/tmp/x.json
```

Scopes other than `approved` sweep geograph.org.uk, a free community service,
so they require `--i-mean-it` and are rate limited. Prefer `--sample`.

The host rule it enforces lives in `src/lib/image-host.ts` and is unit tested,
including against lookalike domains. An approved row whose bytes sit on a host
we do not control is the condition that let the 86 rot unnoticed for nine
months, and it is now a check that can fail.
