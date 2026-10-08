// Builds a private choosing page for a client's people: every staged layout, with their own details.
//   node stage.mjs sidebar            writes dist/stage/<brand>/
//   node stage.mjs sidebar --deploy   also deploys it to a Cloudflare Pages preview branch (needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
// A preview branch never touches the production site. The page is noindex and the branch name is random (stage.json).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHtml } from './build.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2] ?? 'sidebar';
const cfg = JSON.parse(readFileSync(join(ROOT, 'stage.json'), 'utf8'))[slug];
const brand = JSON.parse(readFileSync(join(ROOT, 'brands', slug, 'brand.json'), 'utf8'));
const people = cfg.people.map(id => ({ id, ...JSON.parse(readFileSync(join(ROOT, 'people', slug, `${id}.json`), 'utf8')) }));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tabs = people.map((p, i) => `<button type="button" role="tab" id="tab-${p.id}" aria-controls="panel-${p.id}" aria-selected="${i === 0}">${esc(p.name.split(' ')[0])}</button>`).join('');
const panels = people.map((p, i) => `<div role="tabpanel" id="panel-${p.id}" aria-labelledby="tab-${p.id}"${i ? ' hidden' : ''}>
${cfg.options.map((o, n) => `<section class="opt"><header><span class="num">${n + 1}</span><div><h2>${esc(o.name)}</h2><p>${esc(o.note)}</p></div></header>
<div class="paper">${renderHtml(brand, p, undefined, o.layout)}</div></section>`).join('\n')}
</div>`).join('\n');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(cfg.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&display=swap">
<style>
:root{--ground:#e8eaeb;--ink:#052e42;--muted:#55636b;--line:#cfd5d8;--paper:#fff;--display:'Jost','Futura','Century Gothic',Arial,sans-serif;--body:system-ui,-apple-system,'Segoe UI',Arial,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.5 var(--body)}
.wrap{max-width:780px;margin:0 auto;padding:32px 16px 72px;display:grid;gap:22px}
h1{font:500 28px/1.2 var(--display);letter-spacing:.05em;text-transform:uppercase;margin:6px 0 0}
.lede{color:var(--muted);margin:6px 0 0;max-width:60ch}
.bar{position:sticky;top:0;z-index:2;background:var(--ground);display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--line)}
[role=tablist]{display:flex;gap:6px}
button{font:500 14px var(--body);padding:9px 16px;border-radius:2px;border:1px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer}
[role=tab][aria-selected=true],#replay{background:var(--ink);color:#fff}
button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.opt{display:grid;gap:12px;margin:0 0 26px}
.opt header{display:flex;gap:14px;align-items:flex-start}
.num{font:500 14px var(--display);width:30px;height:30px;display:grid;place-items:center;border:1px solid var(--ink);flex:none}
h2{font:500 18px/30px var(--display);letter-spacing:.04em;margin:0}.opt p{margin:0;color:var(--muted);font-size:14px}
.paper{background:var(--paper);border:1px solid var(--line);padding:28px;overflow-x:auto}
.how{background:var(--paper);border:1px solid var(--line);padding:20px 24px}
.how h2{line-height:1.3;margin:0 0 6px}
</style></head><body><div class="wrap">
<div><h1>${esc(cfg.title)}</h1>
<p class="lede">Six options, shown with your own details. The logo lights up the way it will when someone opens your email. Pick the number you like and tell Jarryd. This page is private: it is not linked from the site and search engines are told to skip it.</p></div>
<div class="bar"><div role="tablist" aria-label="Whose signature">${tabs}</div><button id="replay" type="button">Replay the logo</button></div>
${panels}
<div class="how"><h2>Once you have picked</h2><p>Jarryd sets your choice up, then you copy it into your mail app in one click. Works in Gmail, Outlook and Apple Mail. On Outlook for Windows the logo shows without the motion.</p></div>
</div>
<script>
document.querySelectorAll('[role=tab]').forEach(function(t){t.addEventListener('click',function(){
  document.querySelectorAll('[role=tab]').forEach(function(o){o.setAttribute('aria-selected',o===t?'true':'false');document.getElementById(o.getAttribute('aria-controls')).hidden=o!==t;});
  replay();});});
var n=0;function replay(){n++;document.querySelectorAll('[role=tabpanel]:not([hidden]) img[src$=".gif"],[role=tabpanel]:not([hidden]) img[src*=".gif?"]').forEach(function(i){i.src=i.src.split('?')[0]+'?r='+n;});}
document.getElementById('replay').addEventListener('click',replay);
</script></body></html>`;
const out = join(ROOT, 'dist', 'stage', slug);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-cache\n');
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`staged ${cfg.options.length} options for ${people.length} people in dist/stage/${slug}/`);

if (process.argv.includes('--deploy')) {
  for (const k of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) if (!process.env[k]) { console.error(`Set ${k} first.`); process.exit(1); }
  const { project, branch } = cfg.cloudflare;
  execFileSync('npx', ['--yes', 'wrangler@3.112.0', 'pages', 'deploy', out, '--project-name', project, '--branch', branch, '--commit-dirty=true'], { stdio: 'inherit' });
  console.log(`\nPrivate link: https://${branch}.${project}.pages.dev`);
}
