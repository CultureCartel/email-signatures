// Builds every signature: dist/<brand>/<person>.html (paste-ready), .txt (plain text), and dist/index.html (preview with copy buttons).
//   node build.mjs
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = p => JSON.parse(readFileSync(p, 'utf8'));
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

// Shared pieces for the named layouts.
const T = (rows, extra = '') => `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:${F}${extra}">${rows}</table>`;
const link = (href, text, color) => `<a href="${esc(href)}" style="color:${color};text-decoration:none">${esc(text)}</a>`;
function parts(brand, p, c) {
  const phone = p.phone ?? brand.phone, tel = p.phoneTel ?? brand.phoneTel;
  const venueBits = color => [brand.address && esc(brand.addressShort ?? brand.address), brand.web && link(brand.web, brand.webLabel, color), brand.instagram && link(brand.instagram, brand.instagramLabel, color)].filter(Boolean);
  return {
    phoneLink: phone && tel ? link(`tel:${tel}`, phone, c.ink) : '',
    emailLink: p.email ? link(`mailto:${p.email}`, p.email, c.ink) : '',
    venue: (color = c.faint, sep = '&nbsp;&nbsp;&middot;&nbsp;&nbsp;') => venueBits(color).join(sep),
  };
}
const logoImg = (brand, base, src, w = brand.logo.width, h = brand.logo.height) =>
  `<a href="${esc(brand.web)}"><img src="${esc(`${base}/${src}`)}" width="${w}" height="${h}" alt="${esc(brand.logo.alt)}" style="display:block;border:0;width:${w}px;height:${h}px"></a>`;

// Named layouts. A brand picks one with "layout" in brand.json; dist/<brand>/options.html shows them all side by side.
export const LAYOUTS = {
  // Card: name, title, direct lines, logo, one small venue line. No labels, no rules.
  card: ({ c, p, img, phoneLink, emailLink, venue }) => T(`
<tr><td style="font:bold 14px/20px ${F};color:${c.ink};letter-spacing:.2px">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 10px 0;font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
${phoneLink ? `<tr><td style="font:13px/20px ${F}">${phoneLink}</td></tr>` : ''}${emailLink ? `<tr><td style="font:13px/20px ${F}">${emailLink}</td></tr>` : ''}
<tr><td style="padding:18px 0 10px 0">${img}</td></tr>
<tr><td style="font:11px/16px ${F};color:${c.faint}">${venue()}</td></tr>`),

  // Sidebar: a literal side bar. A solid navy rule runs down the left of everything.
  bar: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`<tr>
<td width="3" style="width:3px;background:${c.ink}" bgcolor="${c.ink}">&nbsp;</td>
<td style="padding:2px 0 2px 16px">${T(`
<tr><td style="font:bold 15px/20px ${F};color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 12px 0;font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
<tr><td style="font:13px/20px ${F}">${[phoneLink, emailLink].filter(Boolean).join('<br>')}</td></tr>
<tr><td style="padding:16px 0 8px 0">${logoImg(brand, base, brand.logo.src, 140, 48)}</td></tr>
<tr><td style="font:11px/16px ${F};color:${c.faint}">${venue()}</td></tr>`)}</td></tr>`),

  // Band: plain text up top, then a navy band carrying the white animated logo and the venue line.
  band: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`
<tr><td style="padding:0 0 2px 0;font:bold 14px/20px ${F};color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 10px 0;font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
<tr><td style="padding:0 0 14px 0;font:13px/20px ${F}">${[phoneLink, emailLink].filter(Boolean).join('&nbsp;&nbsp;&nbsp;')}</td></tr>
<tr><td bgcolor="${c.ink}" style="background:${c.ink};padding:16px 20px">${T(`<tr>
<td valign="middle" style="padding:0 20px 0 0">${logoImg(brand, base, brand.logo.srcNavy, 150, 52)}</td>
<td valign="middle" style="font:11px/17px ${F};color:#c9d3d9">${venue('#c9d3d9', '<br>')}</td></tr>`)}</td></tr>`, ';width:420px'),

  // Wordmark: the logo leads, a short rule, then the person. Contact on one line.
  wordmark: ({ c, p, img, phoneLink, emailLink, venue }) => T(`
<tr><td style="padding:0 0 14px 0">${img}</td></tr>
<tr><td style="padding:0 0 12px 0"><table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td width="32" height="2" bgcolor="${c.ink}" style="width:32px;height:2px;background:${c.ink};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
<tr><td style="font:bold 14px/20px ${F};color:${c.ink}">${esc(p.name)}<span style="font-weight:normal;color:${c.muted}">&nbsp;&nbsp;${esc(p.title)}</span></td></tr>
<tr><td style="padding:4px 0 6px 0;font:13px/20px ${F}">${[phoneLink, emailLink].filter(Boolean).join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;')}</td></tr>
<tr><td style="font:11px/16px ${F};color:${c.faint}">${venue()}</td></tr>`),

  // Letter: a serif name like a handwritten sign-off, the rest small and quiet, logo to the right.
  letter: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`<tr>
<td valign="top" style="padding:0 28px 0 0">${T(`
<tr><td style="font:19px/24px Georgia,'Times New Roman',serif;color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="padding:2px 0 12px 0;font:italic 13px/18px Georgia,'Times New Roman',serif;color:${c.muted}">${esc(p.title)}</td></tr>
<tr><td style="font:12px/19px ${F}">${[phoneLink, emailLink].filter(Boolean).join('<br>')}</td></tr>
<tr><td style="padding:8px 0 0 0;font:11px/16px ${F};color:${c.faint}">${venue(c.faint, '<br>')}</td></tr>`)}</td>
<td valign="top" style="padding:4px 0 0 28px;border-left:1px solid #e3e1dc">${logoImg(brand, base, brand.logo.src, 150, 52)}</td></tr>`),

  // Inline: logo left, three lines beside it. Compact, no rules.
  inline: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`<tr>
<td valign="middle" style="padding:0 22px 0 0">${logoImg(brand, base, brand.logo.src, 130, 45)}</td>
<td valign="middle">${T(`
<tr><td style="font:bold 14px/20px ${F};color:${c.ink}">${esc(p.name)}<span style="font-weight:normal;color:${c.muted}">&nbsp;&nbsp;${esc(p.title)}</span></td></tr>
<tr><td style="font:13px/20px ${F}">${[phoneLink, emailLink].filter(Boolean).join(`<span style="color:${c.faint}">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`)}</td></tr>
<tr><td style="font:11px/18px ${F};color:${c.faint}">${venue()}</td></tr>`)}</td></tr>`),

  // Business card: a printed card in a fine border. Logo top left, the person at the bottom.
  businesscard: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`<tr><td style="border:1px solid #d6dadd;padding:22px 26px 20px 26px">${T(`
<tr><td style="padding:0 0 30px 0">${logoImg(brand, base, brand.logo.src, 116, 40)}</td></tr>
<tr><td style="font:bold 14px/19px ${F};color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 12px 0;font:12px/17px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
<tr><td style="font:12px/19px ${F}">${[phoneLink, emailLink].filter(Boolean).join('<br>')}</td></tr>
<tr><td style="padding:12px 0 0 0;font:10px/15px ${F};color:${c.faint}">${venue(c.faint, '<br>')}</td></tr>`)}</td></tr>`, ';width:360px'),

  // Type: name and title in spaced capitals, the same tracking as the wordmark. Small logo underneath.
  type: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`
<tr><td style="font:bold 12px/18px ${F};color:${c.ink};letter-spacing:3px;text-transform:uppercase">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 12px 0;font:10px/16px ${F};color:${c.muted};letter-spacing:2px;text-transform:uppercase">${esc(p.title.replace(' | ', ', '))}</td></tr>
<tr><td style="font:12px/19px ${F}">${[phoneLink, emailLink].filter(Boolean).join('<br>')}</td></tr>
<tr><td style="padding:16px 0 8px 0">${logoImg(brand, base, brand.logo.src, 110, 38)}</td></tr>
<tr><td style="font:9px/14px ${F};color:${c.faint};letter-spacing:1.5px;text-transform:uppercase">${venue(c.faint, '&nbsp;&nbsp;&middot;&nbsp;&nbsp;')}</td></tr>`),

  // Tagline: the person, then the logo with the venue's own line beside it in an italic serif.
  tagline: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`
<tr><td style="font:bold 14px/20px ${F};color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 10px 0;font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
<tr><td style="font:13px/20px ${F}">${[phoneLink, emailLink].filter(Boolean).join('<br>')}</td></tr>
<tr><td style="padding:16px 0 0 0">${T(`<tr>
<td valign="middle" style="padding:0 16px 0 0">${logoImg(brand, base, brand.logo.src, 120, 41)}</td>
<td valign="middle" style="font:italic 13px/18px Georgia,'Times New Roman',serif;color:${c.ink}">${esc(brand.tagline ?? '')}<br><span style="font:11px/18px ${F};font-style:normal;color:${c.faint}">${venue()}</span></td></tr>`)}</td></tr>`),

  // Navy card: the whole signature on the brand navy, white type, the logo lighting up in white.
  navycard: ({ c, p, brand, base }) => {
    const phone = p.phone ?? brand.phone, tel = p.phoneTel ?? brand.phoneTel;
    const w = (href, text) => link(href, text, '#ffffff');
    return T(`<tr><td bgcolor="${c.ink}" style="background:${c.ink};padding:20px 24px">${T(`<tr>
<td valign="middle" style="padding:0 24px 0 0">${logoImg(brand, base, brand.logo.srcNavy, 130, 45)}</td>
<td valign="middle" style="border-left:1px solid #2c4d5f;padding:0 0 0 24px">${T(`
<tr><td style="font:bold 14px/20px ${F};color:#ffffff">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 8px 0;font:12px/17px ${F};color:#a9bcc7">${esc(p.title)}</td></tr>
<tr><td style="font:12px/19px ${F};color:#ffffff">${[phone && tel && w(`tel:${tel}`, phone), p.email && w(`mailto:${p.email}`, p.email)].filter(Boolean).join('<br>')}</td></tr>`)}</td></tr>`)}</td></tr>
<tr><td style="padding:8px 0 0 0;font:11px/16px ${F};color:${c.faint}">${[brand.addressShort && esc(brand.addressShort), brand.web && link(brand.web, brand.webLabel, c.faint), brand.instagram && link(brand.instagram, brand.instagramLabel, c.faint)].filter(Boolean).join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;')}</td></tr>`, ';width:440px');
  },

  // Columns: name and title on the left, phone and email on the right, logo and venue underneath.
  columns: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`
<tr><td>${T(`<tr>
<td valign="top" style="padding:0 32px 0 0">${T(`
<tr><td style="font:bold 14px/20px ${F};color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>`)}</td>
<td valign="top" style="font:13px/19px ${F}">${[phoneLink, emailLink].filter(Boolean).join('<br>')}</td></tr>`)}</td></tr>
<tr><td style="padding:16px 0 0 0">${T(`<tr>
<td valign="bottom" style="padding:0 18px 0 0">${logoImg(brand, base, brand.logo.src, 110, 38)}</td>
<td valign="bottom" style="font:11px/16px ${F};color:${c.faint};padding:0 0 2px 0">${venue()}</td></tr>`)}</td></tr>`),

  // Logo right: the person on the left, the logo on the right, nothing between them but space.
  logoright: ({ c, p, brand, base, phoneLink, emailLink, venue }) => T(`<tr>
<td valign="middle" style="padding:0 40px 0 0">${T(`
<tr><td style="font:bold 14px/20px ${F};color:${c.ink}">${esc(p.name)}</td></tr>
<tr><td style="padding:0 0 10px 0;font:13px/18px ${F};color:${c.muted}">${esc(p.title)}</td></tr>
<tr><td style="font:13px/20px ${F}">${[phoneLink, emailLink].filter(Boolean).join('<br>')}</td></tr>
<tr><td style="padding:10px 0 0 0;font:11px/16px ${F};color:${c.faint}">${venue()}</td></tr>`)}</td>
<td valign="middle">${logoImg(brand, base, brand.logo.src, 150, 52)}</td></tr>`),
};

// Email safe: tables, inline styles, system fonts, absolute https image URLs, explicit sizes.
export function renderHtml(brand, p, base = config.assetBase, layout) {
  const c = brand.colors;
  const img = brand.logo && `<a href="${esc(brand.web)}"><img src="${esc(logoUrl(brand, base))}" width="${brand.logo.width}" height="${brand.logo.height}" alt="${esc(brand.logo.alt)}" style="display:block;border:0;width:${brand.logo.width}px;height:${brand.logo.height}px"></a>`;
  const L = LAYOUTS[layout ?? brand.layout];
  if (L) return L({ brand, p, c, base, F, img, ...parts(brand, p, c) });
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

function optionsPage(brand, p) {
  const blocks = Object.keys(LAYOUTS).map((k, i) => `<section><h2>${String.fromCharCode(65 + i)}. ${k}</h2><div class="sig">${renderHtml(brand, p, '../../public', k)}</div></section>`).join('\n');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(brand.name)} signature options</title>
<style>body{font:15px/1.5 system-ui;max-width:760px;margin:0 auto;padding:24px 16px;background:#eceae5;color:#17181b}section{background:#fff;padding:28px;margin:0 0 18px;overflow-x:auto}h2{font:600 12px system-ui;letter-spacing:1px;text-transform:uppercase;color:#777;margin:0 0 18px}</style>
<h1 style="font:400 28px Georgia,serif">${esc(brand.name)}: signature options</h1>${blocks}`;
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
      if (brand.optionsFor === id) writeFileSync(join(DIST, slug, 'options.html'), optionsPage(brand, p));
      gallery.push({ brand: brand.name, slug, id, name: p.name, html, preview: renderHtml(brand, p, process.env.PREVIEW_BASE ?? '../public'), text });
    }
  }
  let lastBrand = '';
  const cards = gallery.map((g, i) => `${g.brand !== lastBrand ? `<h2 class="brand">${esc((lastBrand = g.brand))}</h2>` : ''}<section aria-label="${esc(g.name)}"><div class="sig">${g.preview}</div><template id="sig${i}">${g.html}</template><p><button data-i="${i}">Copy signature</button> <a href="${g.slug}/${g.id}.html">HTML</a> <a href="${g.slug}/${g.id}.txt">Plain text</a></p></section>`).join('\n');
  writeFileSync(join(DIST, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email signatures</title>
<style>body{font:16px/1.5 system-ui;max-width:760px;margin:0 auto;padding:24px 16px;background:#f2e9d6;color:#17181b}section{background:#fff;padding:20px;margin:0 0 20px;border-radius:2px;overflow-x:auto}h2.brand{font:600 12px system-ui;letter-spacing:1px;text-transform:uppercase;color:#5b5a55;margin:28px 0 10px}button{font:500 13px system-ui;padding:10px 16px;background:#1a5e43;color:#fff;border:0;cursor:pointer;border-radius:2px}p>a{color:#1a5e43;margin-left:12px}#copybox{position:fixed;left:-9999px}</style>
<h1 style="font:400 32px Georgia,serif">Email signatures</h1><p>Click Copy, then paste into your mail app's signature box. See docs/INSTALL.md.</p>
${cards}
<div id="copybox"></div>
<script>document.querySelectorAll('button[data-i]').forEach(b=>b.addEventListener('click',async()=>{const html=document.getElementById('sig'+b.dataset.i).innerHTML;const box=document.getElementById('copybox');box.innerHTML=html;try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([box.innerText],{type:'text/plain'})})]);b.textContent='Copied'}catch{const r=document.createRange();r.selectNodeContents(box);const s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('copy');b.textContent='Copied'}setTimeout(()=>b.textContent='Copy signature',2000)}))</script>`);
  return gallery;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(`built ${buildAll().length} signatures into dist/`);
