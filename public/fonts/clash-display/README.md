# Clash Display Font Files

This directory should contain the following Clash Display font files:

- ClashDisplay-Regular.woff2 (weight: 400)
- ClashDisplay-Medium.woff2 (weight: 500) 
- ClashDisplay-Semibold.woff2 (weight: 600)
- ClashDisplay-Bold.woff2 (weight: 700)

## Download Instructions

1. Visit [Clash Display on Fontshare](https://www.fontshare.com/fonts/clash-display)
2. Download the font files
3. Convert to .woff2 format if needed
4. Place the files in this directory

## Usage

The fonts are automatically loaded via @font-face declarations in `src/styles/fonts.css`.

## Fallback Behavior

If the font files are not present, the site will gracefully fall back to:
- Inter (primary fallback)
- Manrope (body text)
- IBM Plex Sans Condensed (UI elements)
- System fonts (final fallback)

The site will not break and will render with the fallback fonts until you add the actual Clash Display files.
