# Image licences

Every raster in `farm-frontend/public/` that did not come from our own illustration pipeline, and
where its licence came from. Adobe Stock strips XMP on our optimised copies, so nothing in the files
themselves records this. Without the table the only record is the operator's Adobe licence history,
which is how an afternoon went on proving a licensed photograph was licensed.

A Standard Adobe Stock licence does not ask for a credit. The contributor name is recorded here
anyway, because an EXIF copyright string with nothing to explain it reads like a problem.

| File | Used on | Source | Asset ID | Contributor | Licensed | Credit required |
|---|---|---|---|---|---|---|
| `seasonal-header.jpg` | `SeasonalHero` | Adobe Stock | not yet identified | unknown | on or before 30 Aug 2025 | No |
| `og.jpg` | social cards | ours | n/a | n/a | n/a | n/a |
| `counties.jpg` | **deleted 2026-11-03** | Adobe Stock | [432778337](https://stock.adobe.com/uk/images/paysage-des-monts-du-lyonnais-dans-le-departement-du-rhone-en-france-au-printemps/432778337) | michel (EXIF: Michel PERES) | 25 Aug 2025, Standard | No |
| `main_header.jpg` | **deleted 2026-11-03** | Adobe Stock | never identified | unknown | unknown | No |

`og.jpg` was replaced on 2026-11-01 by `ad4d73e0`, the brand commit that made share cards real
images, so it is our own artwork rather than stock.

The two deleted rows stay in the table. The licence was bought and still holds, Adobe offers a free
re-download of `counties.jpg`, and a row saying where a file went is worth more than a row that
quietly disappears with it.

## How counties.jpg was identified

Its EXIF copyright reads `Michel PERES`. The licence history has one row by a contributor called
`michel`, on 25 August 2025. That asset is "Paysage des Monts du Lyonnais dans le département du
Rhône en France au printemps", 6048x4024, and Adobe marks it Downloaded on this account. Our copy was
1920x1277: 6048/1920 is 3.15, and 4024/3.15 is 1277.5, so the aspect matched a straight downscale.
Three independent signals, not one.

## The France problem, and how it ended

**The photograph was of France.** Monts du Lyonnais, in the Rhône. On `/counties` its alt text read
"Panoramic view of rolling hills and valleys across UK counties", and on `/about` "Rolling green
farmland across the British countryside". A licensing-clean image making a false claim about itself
on a UK farm directory.

Both heroes now carry our own illustration, so the claim went rather than being reworded, and the
file itself went the day after.

## Deleted on 2026-11-03

Nine rasters, 23MB, none referenced anywhere in `src`. `public/` went from 54MB to 31MB.

| File | Size | Why it was there |
|---|---|---|
| `oranges-background.jpg` | 7.2M | unused |
| `add.jpg` | 4.5M | unused |
| `about.jpg` | 4.4M | unused |
| `produce-secondary-image.jpg` | 3.3M | unused |
| `main_header.jpg` | 1.4M | preloaded site-wide, rendered nowhere |
| `counties.jpg` | 822K | `/about` and `/counties` heroes until 2026-11-03 |
| `about-header.jpg` | 586K | unused |
| `feedback.jpg` | 596K | unused |
| `overlay-banner.jpg` | 340K | named in one manual smoke script |

Two stale references went with them. `HeroVideoBackground.tsx` had `main_header.jpg` in a JSDoc
usage example, and `test-map-simple.js` fetched `/overlay-banner.jpg` as its static-asset check.
Both now name `/images/pitti/hero-homepage-dev-seed50920962-v2.webp`, which is the real hero.

`farm-frontend/PERFORMANCE_OPTIMIZATION_SUMMARY.md` still mentions `overlay-banner.jpg`. That
document describes work done in the past and is left as written.
