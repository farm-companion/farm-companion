# Image licences

Every raster in `farm-frontend/public/` that did not come from our own illustration pipeline, and
where its licence came from. Adobe Stock strips XMP on our optimised copies, so nothing in the files
themselves records this. Without the table the only record is the operator's Adobe licence history,
which is how an afternoon went on proving a licensed photograph was licensed.

A Standard Adobe Stock licence does not ask for a credit. The contributor name is recorded here
anyway, because an EXIF copyright string with nothing to explain it reads like a problem.

| File | Used on | Source | Asset ID | Contributor | Licensed | Credit required |
|---|---|---|---|---|---|---|
| `counties.jpg` | `/about`, `/counties` heroes | Adobe Stock | [432778337](https://stock.adobe.com/uk/images/paysage-des-monts-du-lyonnais-dans-le-departement-du-rhone-en-france-au-printemps/432778337) | michel (EXIF: Michel PERES) | 25 Aug 2025, Standard | No |
| `seasonal-header.jpg` | `SeasonalHero` | Adobe Stock | not yet identified | unknown | on or before 30 Aug 2025 | No |
| `main_header.jpg` | nothing (see below) | Adobe Stock | not yet identified | unknown | unknown | No |
| `og.jpg` | social cards | ours | n/a | n/a | n/a | n/a |

`og.jpg` was replaced on 2026-11-01 by `ad4d73e0`, the brand commit that made share cards real
images, so it is our own artwork rather than stock.

## How counties.jpg was identified

Its EXIF copyright reads `Michel PERES`. The licence history has one row by a contributor called
`michel`, on 25 August 2025. That asset is "Paysage des Monts du Lyonnais dans le département du
Rhône en France au printemps", 6048x4024, and Adobe marks it Downloaded on this account. Our copy is
1920x1277: 6048/1920 is 3.15, and 4024/3.15 is 1277.5, so the aspect matches a straight downscale.
Three independent signals, not one.

**The photograph is of France.** Monts du Lyonnais, in the Rhône. On `/counties` its alt text reads
"Panoramic view of rolling hills and valleys across UK counties" and on `/about` "Rolling green
farmland across the British countryside". That is a licensing-clean image making a false claim about
itself on a UK farm directory. Not a legal problem; a truthfulness one, and the operator's call.

## Unused files

Seven rasters in `public/` are referenced nowhere in `src`, roughly 21MB: `about.jpg` (4.4M),
`add.jpg` (4.5M), `oranges-background.jpg` (7.2M), `produce-secondary-image.jpg` (3.3M),
`about-header.jpg`, `overlay-banner.jpg`, `feedback.jpg`. Deleting them removes the licence question
for all seven. They are listed here so the deletion is not mistaken for losing something.

`main_header.jpg` is nearly in the same position: nothing renders it, and its only reference is a
`fetchPriority="high"` preload at `layout.tsx:171` that pulls a 4096x1376 JPEG on every route for
nothing. The homepage hero is `/images/pitti/hero-homepage-dev-seed50920962-v2.webp`.
