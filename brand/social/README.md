# Social profile kit

Rotocalco Press profile assets for the four platforms worth drawing for.

These are **uploads a person makes**, not files the site serves. Do not redraw them by hand:
they are rendered from `farm-frontend/src/app/og/social/route.tsx`, which shares its palette,
type and registration offset with the share cards, so the two can never drift apart.

Regenerate after any brand change:

```bash
farm-frontend/scripts/export-social-kit.sh
```

Pass a deployed URL as the first argument to export from production instead of the dev server.

## What is here

| File | Size | Used for |
| --- | --- | --- |
| `avatar.png` | 400x400 | Profile picture on **all four** platforms. Every one of them circle-crops it. |
| `x-header.png` | 1500x500 | X profile header. |
| `fb-cover.png` | 820x312 | Facebook page cover. |

One avatar covers every platform deliberately. X, Instagram, Facebook and Pinterest all crop a
circle and all display it at roughly 32px in a feed, so a per-platform variant would be four
files that differ in nothing.

## Safe areas, and why each is the way it is

**Avatar.** The mark sits at 62% of the canvas so its corners stay inside the circle. Checked at
32px, the size it actually renders at in a timeline, which is the only size that matters for
recognition.

**X header.** X lays the profile picture over the lower left, so the type sits from x=180 and
stays above y=380. An earlier version put the type right of centre to clear the avatar and left
half the banner dead; moving it left and keeping it high solves both.

**Facebook cover.** Facebook shows 820x312 on desktop but crops to roughly the central 640 on a
phone, so everything sits in that middle band. The cover carries no plate motif: a mirrored pair
of sunrises read as decoration and both got sliced by the phone crop, and at this size the type
carries it alone.

## Not in this kit yet

Post formats (Pinterest 2:3, Instagram 4:5 feed and 9:16 story) and Pinterest board covers.
Those are templates the posting daemon fills per post rather than static files, so they belong
with the daemon work, not here. Instagram has no banner, so there is nothing to draw for it
beyond the avatar.

## Operator steps

One at a time, and nothing here is reversible by me — these are live profiles.

1. **X** (`@farmcompanion`): Profile → Edit profile → upload `avatar.png` as the picture and
   `x-header.png` as the header. Check on a phone that the avatar does not cover the wordmark.
2. **Facebook** page: Edit cover photo → upload `fb-cover.png`; profile picture → `avatar.png`.
   Check the phone view, which crops the sides.
3. **Instagram**: profile picture → `avatar.png`. There is no banner.
4. **Pinterest**: profile picture → `avatar.png`. Also claim the domain and confirm Rich Pins
   resolve, which is a prerequisite for any pin to attribute back to the site.
