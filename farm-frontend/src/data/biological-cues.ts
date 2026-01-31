/**
 * Biological Cue Library for Produce Photography
 *
 * Each produce item has a specific biological cue clause that describes
 * its unique physical characteristics for realistic image generation.
 * These cues are appended AFTER the geometry-locking packshot spine.
 */

/**
 * Biological cue clauses keyed by produce name (lowercase)
 * These describe the unique physical characteristics of each item
 */
export const BIOLOGICAL_CUES: Record<string, string> = {
  // A
  'apples': 'Natural skin pores and subtle speckling, gentle curvature, visible stem cavity and calyx end, slight surface scuffs.',
  'artichoke': 'Layered bracts with tight overlap, matte green surface, subtle browning on tips, visible cut stem base.',
  'asparagus': 'Distinct spear tips with tight buds, fibrous stalk texture, slight color gradient, clean cut ends.',
  'aubergine': 'Glossy skin with realistic specular highlights, subtle ripples, green calyx at stem, minor scuffs.',

  // B
  'beetroot': 'Earthy matte skin with soil-like patina, subtle rings near root scar, rough crown cut, slight irregularity.',
  'blackberries': 'True blackberry morphology, slightly tapered irregular silhouette, no hollow center, drupelets are non-uniform domes with varied sizes and subtle compression dents, no blueberry-style crown or calyx holes, no repeated blossom-end cavities, natural matte-to-gloss variation with tiny juice sheen, minor bruising and realistic micro-scuffs.',
  'blackcurrants': 'Small translucent skins with subtle bloom, tiny dried blossom ends, natural cluster variation if stemmed.',
  'blueberries': 'Visible wax bloom, subtle crown at blossom end, varied berry sizes, gentle matte highlights.',
  'broad beans': 'Slightly fuzzy pods, gentle curvature, seam line visible, natural size variation.',
  'broccoli': 'Tight florets with granular texture, branching stalk, natural green variation, slight moisture sheen.',
  'brussels sprouts': 'Layered leaf pattern, tight round form but not perfect, trimmed stem base, minor leaf edge blemishes.',
  'butternut squash': 'Matte skin with faint speckling, bulbous base and neck proportions correct, subtle ridges, stem scar.',

  // C
  'carrots': 'Fine longitudinal ridges, slight taper and curvature, root tip irregularity, natural soil marks.',
  'cauliflower': 'Dense curd texture, irregular lobes, leaf wrapper edges, natural creamy color variation.',
  'celery': 'Ribbed stalk channels, fibrous strings, mild translucency at edges, leafy tops if included.',
  'celeriac': 'Rough knobbly surface, root hair scars, earthy color, irregular spherical form.',
  'cherries': 'Smooth glossy skins, visible stem attachment point, subtle translucency, gentle highlight rolloff.',
  'chestnuts': 'Deep brown glossy shell, pale matte patch, subtle seam line, natural shape variation.',
  'chicory': 'Tightly packed leaves, pale yellow-green gradient, crisp edges, subtle moisture sheen.',
  'chillies': 'Smooth waxy skin, tapered tip, slight wrinkling near stem, green calyx.',
  'courgettes': 'Fine speckling, gentle ridges, blossom end scar, mild gloss with natural reflections.',
  'cranberries': 'Small firm berries, subtle translucency, varied red tones, faint blossom end dimples.',
  'cucumber': 'Fine bumps and pores, faint ridges, slight curvature, natural waxy sheen, blossom end scar.',

  // D
  'damsons': 'Oval plum shape, natural wax bloom, subtle color mottling, stem scar.',

  // E
  'elderberries': 'Small dark berries with natural bloom, varied sizes, realistic clustering if stemmed.',
  'elderflowers': 'Umbel clusters with tiny white florets, pale pollen dusting, delicate stems, airy structure.',

  // F
  'fennel': 'Layered bulb with fine striations, pale green-white gradient, feathery fronds optional.',
  'french beans': 'Slim pods with seam line, slight bends, tip and stem ends visible, fine surface sheen.',

  // G
  'garlic': 'Papery skin layers, root disc and dried stem, subtle purple streaking on some varieties.',
  'gooseberries': 'Translucent skins with visible veins, fine hairs, varied green to blush tones, stem and blossom ends.',
  'greengages': 'Round plum form, wax bloom, green-yellow gradient, subtle freckles.',

  // J
  'jerusalem artichokes': 'Knobbly tuber form, thin skin with root scars, irregular lobes, earthy matte texture.',

  // K
  'kale': 'Curled leaf edges, pronounced veins, matte surface, natural tears and minor blemishes.',
  'kohlrabi': 'Bulb with leaf scar points, smooth matte skin, subtle color gradient, trimmed stems.',

  // L
  'leeks': 'White to green gradient, layered sheath texture, root end trimmed, slight soil marks.',
  'lettuce': 'Crisp leaf layering, varied translucency, natural ruffles, slight edge bruising.',
  'loganberries': 'Elongated berry shape, irregular drupelets, matte-gloss mix, natural color variation.',

  // M
  'mangetout': 'Flat pods with visible pea bulges, seam line, slight translucency, stem end intact.',
  'marrow': 'Large courgette form, faint speckling, subtle ridges, correct proportions and blossom scar.',
  'morel mushrooms': 'Honeycomb cap pits, irregular conical shape, matte earthy surface, hollow stem suggestion.',
  'mushrooms': 'Matte cap with subtle speckling, gill edge hint, natural bruising, stem texture.',

  // N
  'new potatoes': 'Thin skin with tiny eyes, slight soil residue, varied shapes, subtle sheen from moisture.',

  // O
  'onions': 'Papery outer skin, root tuft, dried neck, subtle vertical striations.',

  // P
  'parsnips': 'Creamy matte skin, longitudinal ridges, tapered root, crown scar, natural blemishes.',
  'peas': 'Plump pods with bulges, seam line, fresh matte green, stem and tip ends visible.',
  'pears': 'Correct pear silhouette, matte skin with speckling, stem cavity detail, slight surface scuffs.',
  'peppers': 'Glossy skin, lobed form, green stem and calyx, subtle dimpling, realistic thickness.',
  'plums': 'Wax bloom, oval to round form, stem scar, deep color gradient, subtle freckles.',
  'potatoes': 'Natural eye pattern, irregular shapes, matte skin with soil marks, varied skin tones by type.',
  'pumpkin': 'Ribbed lobes, matte skin, realistic stem, natural scuffs and color mottling.',
  'purple sprouting broccoli': 'Tight florets with granular texture, purple-tipped buds, branching stalks, natural green-purple variation.',

  // Q
  'quince': 'Slight fuzz on skin, uneven pear-like form, matte yellow tone, stem scar.',

  // R
  'radishes': 'Smooth skin, sharp color transition, root tail, leafy tops optional, subtle soil marks.',
  'raspberries': 'Hollow cone structure, irregular drupelets, matte highlights, slight bruising.',
  'red cabbage': 'Tight leaf layering, purple veins, matte sheen, natural outer leaf imperfections.',
  'redcurrants': 'Translucent red berries with highlights, small blossom ends, realistic clustering if on stem.',
  'rhubarb': 'Fibrous stalk striations, red-green gradient, leaf base cut, subtle moisture sheen.',
  'rocket': 'Thin jagged leaves, visible veins, slight curl, matte leaf texture.',
  'runner beans': 'Broad pods, seam line, slight curvature, surface texture, stem and tip visible.',

  // S
  'salsify': 'Long tapered root, earthy matte skin, fine root hairs, irregular bends.',
  'samphire': 'Thin succulent stems, clustered sprigs, glossy moisture sheen, vivid green.',
  'savoy cabbage': 'Crinkled leaf texture, layered head form, matte surface, natural leaf edge blemishes.',
  'sorrel': 'Smooth leaf surface, defined midrib, slight gloss, natural leaf curl.',
  'spinach': 'Soft leaf texture, gentle wrinkles, slight translucency at edges, moisture sheen.',
  'spring greens': 'Looser cabbage-like leaves, visible veins, matte texture, natural tears.',
  'spring onions': 'White bulb to green stalk gradient, root tuft, hollow stalk texture, slight bend.',
  'squash': 'Subtle ridges, matte skin, stem scar, natural scuffs.',
  'strawberries': 'Visible achenes, realistic seed distribution, surface sheen, leafy calyx, slight irregularity.',
  'summer squash': 'Bright skin, gentle ridges, blossom scar, matte-gloss balance, correct proportions.',
  'swede': 'Waxy skin, purple-yellow gradient, root scar, natural blemishes, slightly flattened sphere.',
  'sweetcorn': 'Husk texture and silk strands if unshucked, kernel rows if shucked, natural gloss on kernels.',
  'sweetheart cabbage': 'Conical head shape, tight leaf layering, pale green gradient, matte sheen.',
  'swiss chard': 'Prominent ribs and veins, leaf crinkle, vivid stem color where relevant, slight gloss.',

  // T
  'tayberries': 'Elongated berry, drupelets irregular, matte-gloss mix, natural red tone variation.',
  'tomatoes': 'Fine pores, subtle ribbing where relevant, stem scar, realistic specular highlights, slight softness.',
  'turnips': 'Purple-white gradient, root tail, matte skin, natural blemishes, trimmed top scar.',

  // W
  'watercress': 'Small rounded leaves, thin stems, clustered sprigs, fresh gloss from moisture.',
  'white cabbage': 'Tight pale leaf layering, smooth matte surface, outer leaf imperfections, stem base hint.',
  'wild mushrooms': 'Irregular caps, varied textures by type, natural bruising, non-uniform shapes, matte earthy finish.',
  'winter squash': 'Hard matte skin, ridges depending on type, realistic stem, subtle speckling and scuffs.'
}

/**
 * Get biological cue for a produce item
 * Falls back to a generic description if not found
 */
export function getBiologicalCue(produceName: string): string {
  const key = produceName.toLowerCase().trim()

  // Try exact match first
  if (BIOLOGICAL_CUES[key]) {
    return BIOLOGICAL_CUES[key]
  }

  // Try with/without 's' suffix
  const singular = key.endsWith('s') ? key.slice(0, -1) : key
  const plural = key.endsWith('s') ? key : key + 's'

  if (BIOLOGICAL_CUES[singular]) {
    return BIOLOGICAL_CUES[singular]
  }
  if (BIOLOGICAL_CUES[plural]) {
    return BIOLOGICAL_CUES[plural]
  }

  // Try replacing hyphens with spaces
  const spaced = key.replace(/-/g, ' ')
  if (BIOLOGICAL_CUES[spaced]) {
    return BIOLOGICAL_CUES[spaced]
  }

  // Generic fallback
  return 'Natural organic texture, realistic surface detail, authentic produce appearance, slight natural imperfections.'
}

/**
 * Check if a produce item has a specific biological cue
 */
export function hasBiologicalCue(produceName: string): boolean {
  const key = produceName.toLowerCase().trim()
  return key in BIOLOGICAL_CUES ||
    (key.endsWith('s') ? key.slice(0, -1) : key + 's') in BIOLOGICAL_CUES ||
    key.replace(/-/g, ' ') in BIOLOGICAL_CUES
}
