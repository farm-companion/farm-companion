// County URL slugs, in one place and with no data-layer imports, so a client
// component can use the same rule the route and the sitemap use.
//
// Five county names carry punctuation (two commas, one parenthesis pair, one
// apostrophe). Several call sites had grown their own slug rule that replaced
// only whitespace, so the sitemap declared /counties/newry%2C-mourne-and-down
// while the route serves /counties/newry-mourne-and-down. Those counties 404'd.

/** Lowercase, every run of non-alphanumerics to one dash, no leading or trailing dash. */
export function slugifyCounty(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Deslugify a county slug back to a display name. */
export function deslugifyCounty(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
