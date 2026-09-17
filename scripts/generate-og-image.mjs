// One-off generator for public/og-default.png — the site-wide fallback Open Graph /
// Twitter Card image used whenever a page doesn't supply its own `ogImage` prop
// (see src/layouts/BaseLayout.astro). Re-run with `npm run generate:og` if the
// brand colors in src/styles/global.css change.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

// Mirrors the :root custom properties in src/styles/global.css.
const COLOR_BG = '#f3f5ef';
const COLOR_INK = '#1c2b22';
const COLOR_INK_SOFT = '#4b5a4f';
const COLOR_ACCENT = '#a9702c';
const COLOR_ACCENT_INK = '#ffffff';
const COLOR_LINE = '#d6ddcb';

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLOR_BG}" />
  <rect x="0" y="${HEIGHT - 14}" width="${WIDTH}" height="14" fill="${COLOR_ACCENT}" />
  <rect x="90" y="90" width="96" height="96" rx="22" fill="${COLOR_ACCENT}" />
  <text x="138" y="160" font-family="Georgia, 'Source Serif 4', serif" font-size="62" font-weight="700"
        fill="${COLOR_ACCENT_INK}" text-anchor="middle">F</text>
  <text x="90" y="320" font-family="Georgia, 'Source Serif 4', serif" font-size="88" font-weight="700"
        fill="${COLOR_INK}">Fiskalis</text>
  <text x="90" y="400" font-family="Arial, 'Public Sans', sans-serif" font-size="38" font-weight="500"
        fill="${COLOR_INK_SOFT}">Steuerberater, Finanzberater &amp; Buchhalter finden</text>
  <line x1="90" y1="460" x2="1110" y2="460" stroke="${COLOR_LINE}" stroke-width="2" />
  <text x="90" y="520" font-family="Arial, 'Public Sans', sans-serif" font-size="30" fill="${COLOR_INK_SOFT}">
    Das unabhängige Verzeichnis mit echten Mandanten-Bewertungen
  </text>
</svg>
`;

const outPath = fileURLToPath(new URL('../public/og-default.png', import.meta.url));

await writeFile(outPath, await sharp(Buffer.from(svg)).png().toBuffer());

console.log(`Wrote ${outPath}`);
