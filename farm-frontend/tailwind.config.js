// Not loaded. Kept as a signpost, not a config.
//
// This file was 467 lines of Tailwind v3 configuration: an 8px spacing grid,
// a semantic type scale, and the colour palette. The project runs Tailwind
// v4, which takes its theme from CSS and reads a JS config only when given an
// explicit `@config` directive. There has never been one, so none of it was
// ever in effect.
//
// The cost of leaving it here was not zero. Four semantic font-size names were
// written 523 times across the codebase and set nothing, `font-clash` 34 times
// and set no font, and `h-12` read as 48px to every developer while rendering
// 42. A phone number on the page that takes 87% of the site's search traffic
// shipped at 10.5px.
//
// The tokens now live in an @theme block in src/app/globals.css, which is
// where Tailwind v4 looks. The spacing grid was deliberately not carried over:
// it remapped the numeric scale so `6` meant 48px and `12` meant 96px, which
// is what made the numbers lie. Tailwind's own scale stands.
//
// `npx tsx src/scripts/audit/class-rules.ts --list 30` reports any class the
// source writes that produces no CSS. Its test holds the line in CI.
//
// The original content is in git history: `git log --follow -- tailwind.config.js`.
export default {}
