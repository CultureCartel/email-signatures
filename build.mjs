// Builds every signature: dist/<brand>/<person>.html (paste-ready), .txt (plain text), and dist/index.html (preview with copy buttons).
//   node build.mjs
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = p => JSON.parse(readFileSync(p, 'utf8'));
// Layouts: 'card' (logo under the details, no labels) or the default stacked layout.
// Hosted files live in public/ and are served from config.assetBase (GitHub Pages, see .github/workflows/pages.yml).
export const config = read(join(ROOT, 'config.json'));
export const logoUrl = (brand, base = config.assetBase) => brand.logo && (brand.logo.url ?? `${base}/${brand.logo.src}`);

const F = 'Arial,Helvetica,sans-serif';
const contactRows = (brand, p, c, labelWidth) => {
  const phone = p.phone ?? brand.phone, tel = p.phoneTel ?? brand.phoneTel;
  const row = (label, inner) => `<tr><td style="padding:0 10px 3px 0;font:11px/16px ${F};color:${c.brass};letter-spacing:1px;text-transform:uppercase;white-space:nowrap;width:${labelWidth}px" width="${labelWidth}" valign="top">${label}</td><td style="padding:0 0 3px 0;font:13px/16px ${F};color:${c.ink}" valign="top">${inner}</td></tr>`;
  const link = (href, text) => `<a href="${esc(href)}" style="color:${c.link ?? c.green};text-decoration:none">${esc(text)}</a>`;
  return [
    phone && tel ? row(p.phone ? (p.phoneLabel ?? 'Mobile') : 'Tel', link(`tel:${tel}`, phone)) : '',
    p.email ? row('Email', link(`mailto:${p.email}`, p.email)) : '',
    brand.web ? row('Web', link(brand.web, brand.webLabel)) : '',
    brand.instagram ? row('Instagram', link(brand.instagram, brand.instagramLabel)) : '',
    brand.address ? row('Visit', esc(brand.address)) : '',
  ].join('');
};

// Email safe: tables, inline styles, system fonts, absolute https image URLs, explicit sizes.
export function renderHtml(brand, p, base = config.assetBase) {
  const c = brand.colors;
  const img = brand.logo && `<a href="${esc(brand.web)}"><img src="${esc(logoUrl(brand, base))}" width="${brand.logo.width}" height="${brand.logo.height}" alt="${esc(brand.logo.alt)}" style="display:block;border:0;width:${brand.logo.width}px;height:${brand.logo.height}px"></a>`;
  if (brand.layout === 'card') {
    // Quiet card: name, title, direct lines, then the wordmark and one small venue line. No labels, no rules.
    const link = (href, text, color) => `<a href="${esc(href)}" style="color:${color};text-decoration:none">${esc(text)}</a>`;
    const phone = p.phone ?? brand.phone, tel = p.phoneTel ?? brand.phoneTel;
    const line = inner => `<tr><td style="padding:0;font:13px/20px ${F};color:${c.ink}">${inner}</td></tr>`;
    const venue = [brand.address && esc(brand.addressShort ?? brand.address), brand.web && link(brand.web, brand.webLabel, c.faint), brand.instagram && link(brand.instagram, brand.instagramLabel, c.faint)]
      .filter(Boolean).join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;');
    return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:${F};color:${c.ink}">
<tr><td style="padding:0;font:bold 14px/20px ${F};color:${c.ink};letter-spacing:.2px">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 10px 0;font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
${phone && tel ? line(link(`tel:${tel}`, phone, c.ink)) : ''}${p.email ? line(link(`mailto:${p.email}`, p.email, c.ink)) : ''}
${img ? `<tr><td style="padding:18px 0 10px 0">${img}</td></tr>` : ''}
${venue ? `<tr><td style="padding:0;font:11px/16px ${F};color:${c.faint}">${venue}</td></tr>` : ''}
</table>`;
  }
  const logo = img
    ? `<tr><td style="padding:0 0 12px 0">${img}</td></tr>`
    : `<tr><td style="padding:0 0 10px 0;font:20px/22px Georgia,'Times New Roman',serif;color:${c.ink}">${esc(brand.name)}</td></tr>`;
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:${F};color:${c.ink}">
${logo}<tr><td style="padding:0 0 2px 0;font:bold 16px/20px Georgia,'Times New Roman',serif;color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 ${p.badge ? 2 : 10}px 0;font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
${p.badge ? `<tr><td style="padding:0 0 10px 0;font:12px/16px ${F};color:${c.muted}">${esc(p.badge)}</td></tr>` : ''}
<tr><td style="border-top:2px solid ${c.brass};padding:10px 0 0 0"><table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse">${contactRows(brand, p, c, 72)}</table></td></tr>
</table>`;
}

export function renderText(brand, p) {
  const phone = p.phone ?? brand.phone;
  const label = p.phone ? (p.phoneLabel ?? 'Mobile') : 'Tel';
  return [p.name, p.title, p.badge, '', phone && `${label}: ${phone}`, p.email && `Email: ${p.email}`, brand.web && `Web: ${brand.webLabel}`, brand.address && brand.address]
    .filter(x => x !== null && x !== undefined && x !== false).join('\n') + '\n';
}

export function buildAll() {
  rmSync(DIST, { recursive: true, force: true });
  const gallery = [];
  for (const slug of readdirSync(join(ROOT, 'brands'))) {
    const brand = read(join(ROOT, 'brands', slug, 'brand.json'));
    const dir = join(ROOT, 'people', slug);
    if (!existsSync(dir)) continue;
    mkdirSync(join(DIST, slug), { recursive: true });
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'))) {
      const p = read(join(dir, f)), id = f.replace('.json', '');
      const html = renderHtml(brand, p), text = renderText(brand, p);
      writeFileSync(join(DIST, slug, `${id}.html`), html);
      writeFileSync(join(DIST, slug, `${id}.txt`), text);
      // The preview shows images from the local public/ folder so it works before hosting is live; Copy uses the hosted URLs.
      gallery.push({ brand: brand.name, slug, id, name: p.name, html, preview: renderHtml(brand, p, '../public'), text });
    }
  }
  const cards = gallery.map((g, i) => `<section><h2>${esc(g.name)} <small>${esc(g.brand)}</small></h2><div class="sig">${g.preview}</div><template id="sig${i}">${g.html}</template><p><button data-i="${i}">Copy signature</button> <a href="${g.slug}/${g.id}.html">HTML</a> <a href="${g.slug}/${g.id}.txt">Plain text</a></p></section>`).join('\n');
  writeFileSync(join(DIST, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email signatures</title>
<style>body{font:16px/1.5 system-ui;max-width:760px;margin:0 auto;padding:24px 16px;background:#f2e9d6;color:#17181b}section{background:#fff;padding:20px;margin:0 0 20px;border-radius:2px;overflow-x:auto}h2{font:400 22px Georgia,serif;margin:0 0 14px}small{font:12px system-ui;color:#5b5a55;margin-left:8px}button{font:500 13px system-ui;padding:10px 16px;background:#1a5e43;color:#fff;border:0;cursor:pointer;border-radius:2px}p>a{color:#1a5e43;margin-left:12px}#copybox{position:fixed;left:-9999px}</style>
<h1 style="font:400 32px Georgia,serif">Email signatures</h1><p>Click Copy, then paste into your mail app's signature box. See docs/INSTALL.md.</p>
${cards}
<div id="copybox"></div>
<script>document.querySelectorAll('button[data-i]').forEach(b=>b.addEventListener('click',async()=>{const html=document.getElementById('sig'+b.dataset.i).innerHTML;const box=document.getElementById('copybox');box.innerHTML=html;try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([box.innerText],{type:'text/plain'})})]);b.textContent='Copied'}catch{const r=document.createRange();r.selectNodeContents(box);const s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('copy');b.textContent='Copied'}setTimeout(()=>b.textContent='Copy signature',2000)}))</script>`);
  return gallery;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(`built ${buildAll().length} signatures into dist/`);
