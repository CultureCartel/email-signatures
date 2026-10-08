// Renders the small extras some layouts use: a black still logo, line icons in the brand ink, and a photo banner.
//   node assets/render-extras.mjs sidebar
// Writes to public/<brand>/. Icons are drawn here (no third-party icon files), 2x for a 14px display size.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = process.argv[2] ?? 'sidebar';
const B = JSON.parse(readFileSync(join(ROOT, 'brands', brand, 'brand.json'), 'utf8'));
const PUB = join(ROOT, 'public', brand);
const ink = B.colors.ink;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const page = await browser.newPage();
async function shot(html, w, h, out, transparent = true) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;${transparent ? '' : 'background:#fff'}">${html}</body></html>`);
  await page.waitForLoadState('load');
  await page.screenshot({ path: join(PUB, out), omitBackground: transparent, type: out.endsWith('.jpg') ? 'jpeg' : 'png', ...(out.endsWith('.jpg') ? { quality: 82 } : {}) });
}
// Black still logo for the monochrome layout, on white so it survives dark mode.
const logo = readFileSync(join(ROOT, 'brands', brand, 'logo', `${brand}-logo-black.svg`), 'utf8').replace(/width="\d+" height="\d+"/, 'width="352" height="119"');
await shot(`<div style="display:grid;place-items:center;width:360px;height:124px">${logo}</div>`, 360, 124, `${brand}-logo-email-black.png`, false);

// Line icons, 28px drawn on a 24 grid, stroke in the brand ink.
const ico = d => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  phone: '<path d="M5 3h3.5l1.6 4.2-2.2 1.5a11 11 0 0 0 5.4 5.4l1.5-2.2L19 13.5V17a2 2 0 0 1-2 2A14 14 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  web: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5S9.6 6.1 12 3.5z"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.6" cy="7.4" r=".6" fill="' + ink + '"/>',
};
for (const [n, d] of Object.entries(ICONS)) await shot(ico(d), 28, 28, `icon-${n}.png`);

// Photo banner: 960x300 (shown at 480x150), cropped to the globe lights and the window bar.
const photo = readFileSync(join(ROOT, 'brands', brand, 'photos', 'couple-at-the-window.jpg')).toString('base64');
await shot(`<div style="width:960px;height:300px;background:url(data:image/jpeg;base64,${photo}) 50% 38%/100% auto no-repeat"></div>`, 960, 300, `${brand}-banner-window.jpg`, false);
await browser.close();
console.log(`extras rendered for ${brand} in public/${brand}`);
