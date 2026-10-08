// Renders a brand's logo SVGs to PNG, an email GIF and an MP4 with headless Chromium and ffmpeg.
//   npm install && node assets/render-logo.mjs sidebar
// Reads  brands/<brand>/logo/<brand>-logo{,-black,-white,-animated}.svg
// Writes public/<brand>/ (the hosted files) and brands/<brand>/logo/ (PNG masters and MP4).
// Outlook for Windows shows only the first frame of a GIF, so frame one is the finished logo,
// held for 40ms before the build starts. The GIF plays once and rests on the full logo.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = process.argv[2] ?? 'sidebar';
const SRC = join(ROOT, 'brands', brand, 'logo');
const PUB = join(ROOT, 'public', brand);
mkdirSync(PUB, { recursive: true });
const svg = n => readFileSync(join(SRC, `${brand}-logo${n}.svg`), 'utf8');
const ratio = (() => { const [, , w, h] = svg('').match(/viewBox="([^"]+)"/)[1].split(' ').map(Number); return h / w; })();

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function shot(markup, w, h, bg, out) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:${bg};display:grid;place-items:center;width:${w}px;height:${h}px">${markup}</body></html>`);
  await page.screenshot({ path: out, omitBackground: bg === 'transparent' });
}
const sized = (s, w) => s.replace(/width="\d+" height="\d+"/, `width="${w}" height="${Math.round(w * ratio)}"`);

// Static PNGs, transparent, 2000px wide.
for (const [n, out] of [['', `${brand}-logo.png`], ['-black', `${brand}-logo-black.png`], ['-white', `${brand}-logo-white.png`]]) {
  await shot(sized(svg(n), 2000), 2000, Math.round(2000 * ratio), 'transparent', join(SRC, out));
}
// Email still: on white (dark-mode safe), 2x for a 200px display width.
// Email logo is drawn at 2x the display width set in brand.json; even height so the 1x size is a whole number.
const brandJson = JSON.parse(readFileSync(join(ROOT, 'brands', brand, 'brand.json'), 'utf8'));
const EW = (brandJson.logo?.width ?? 200) * 2, EH = Math.round(EW * ratio / 2) * 2 + 2;
await shot(sized(svg(''), EW - 8), EW, EH, '#ffffff', join(PUB, `${brand}-logo-email.png`));

// Frames of the animation, stepped with the Web Animations API so timing is exact.
async function frames(w, h, bg, logoW, fps, seconds, dir, variant = '-animated') {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:${bg};display:grid;place-items:center;width:${w}px;height:${h}px">${sized(svg(variant), logoW)}</body></html>`);
  const n = Math.round(fps * seconds);
  for (let i = 0; i <= n; i++) {
    await page.evaluate(t => document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; }), (i / fps) * 1000);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(4, '0')}.png`) });
  }
  return n;
}
const tmp = mkdtempSync(join(tmpdir(), 'logo-'));
const DUR = 2.7;


// Builds a GIF from rendered frames: frame one is the finished logo (Outlook shows only that), plays once, rests on the end.
async function gif(bg, variant, out) {
  const tmp = mkdtempSync(join(tmpdir(), 'logo-'));
  const n = await frames(EW, EH, bg, EW - 8, 30, DUR, tmp, variant);
  const f = i => `file 'f${String(i).padStart(4, '0')}.png'`;
  const list = [f(n), 'duration 0.04'];
  for (let i = 0; i <= n; i++) list.push(f(i), `duration ${i === n ? 4 : 0.033}`);
  list.push(f(n));
  writeFileSync(join(tmp, 'list.txt'), list.join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'),
    '-vf', 'split[a][b];[a]palettegen=max_colors=64:reserve_transparent=0:stats_mode=full[p];[b][p]paletteuse=dither=none',
    '-loop', '-1', join(PUB, out)]);
  rmSync(tmp, { recursive: true, force: true });
}
await gif('#ffffff', '-animated', `${brand}-logo-animated.gif`);
// White logo on the brand navy, for layouts with a dark band.
const navy = brandJson.colors?.ink ?? '#052e42';
await gif(navy, '-animated-white', `${brand}-logo-animated-navy.gif`);
await shot(sized(svg('-white'), EW - 8), EW, EH, navy, join(PUB, `${brand}-logo-email-navy.png`));

// MP4 for social and screens: 1920x1080, logo at 1400px, 30fps, then a hold.
const tmp2 = mkdtempSync(join(tmpdir(), 'logo-'));
await frames(1920, 1080, '#ffffff', 1400, 30, DUR, tmp2);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', join(tmp2, 'f%04d.png'),
  '-vf', 'tpad=stop_mode=clone:stop_duration=2,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart',
  join(SRC, `${brand}-logo-animated.mp4`)]);
rmSync(tmp2, { recursive: true, force: true });

await browser.close();
console.log(`rendered ${brand}: PNG masters and MP4 in brands/${brand}/logo, email GIF and PNG in public/${brand}`);
