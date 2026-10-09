// Signature Studio: one page where each person picks their name, the logo animation and the layout, then copies a ready signature.
//   node studio.mjs sidebar             writes dist/studio/<brand>/index.html (also copied to dist/<brand>/index.html for GitHub Pages)
//   node studio.mjs sidebar --deploy    also deploys it to its own Cloudflare Pages project (studio.json), for example sig.danforthsidebar.com
// Images always load from config.assetBase (GitHub Pages), so the signatures keep working wherever the studio page is hosted.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHtml, renderText, config } from './build.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2] ?? 'sidebar';
const cfg = JSON.parse(readFileSync(join(ROOT, 'studio.json'), 'utf8'))[slug];
const brand = JSON.parse(readFileSync(join(ROOT, 'brands', slug, 'brand.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dir = join(ROOT, 'people', slug);
const files = readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
const people = files.map(f => ({ id: f.replace('.json', ''), ...JSON.parse(readFileSync(join(dir, f), 'utf8')) }))
  .sort((a, b) => (cfg.order.indexOf(a.id) + 1 || 99) - (cfg.order.indexOf(b.id) + 1 || 99));

// Every combination is rendered here, so the page needs no server and copies exactly what the build makes.
const data = {};
for (const p of people) for (const a of cfg.animations) for (const l of cfg.layouts) {
  const b = { ...brand, logo: { ...brand.logo, src: a.src } };
  data[`${p.id}|${a.id}|${l.id}`] = renderHtml(b, p, config.assetBase, l.layout);
}
const text = Object.fromEntries(people.map(p => [p.id, renderText(brand, p)]));
const logo = `${config.assetBase}/${brand.logo.src}`;

const personCards = people.map((p, i) => `<button type="button" class="pick person" data-person="${p.id}" aria-pressed="${i === 0}"><b>${esc(p.name)}</b><span>${esc(p.title ?? '')}</span><small>${esc(p.email)}</small></button>`).join('');
const animCards = cfg.animations.map((a, i) => `<button type="button" class="pick anim" data-anim="${a.id}" aria-pressed="${i === 0}"><span class="thumb"><img src="${config.assetBase}/${a.src}" alt="" width="150" height="52"></span><b>${esc(a.name)}</b><span>${esc(a.note)}</span></button>`).join('');
const layoutCards = cfg.layouts.map((l, i) => `<button type="button" class="pick layout" data-layout="${l.id}" aria-pressed="${i === 0}"><b>${esc(l.name)}</b><span>${esc(l.note)}</span></button>`).join('');
const installTabs = cfg.install.map((t, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-tab="${i}">${esc(t.name)}</button>`).join('');
const installPanels = cfg.install.map((t, i) => `<div role="tabpanel" data-panel="${i}"${i ? ' hidden' : ''}><ol>${t.steps.map(s => `<li>${s}</li>`).join('')}</ol>${t.note ? `<p class="note">${t.note}</p>` : ''}</div>`).join('');

const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(cfg.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&display=swap">
<style>
:root{--navy:#052e42;--navy-2:#0a3d55;--cream:#f2e9d6;--cream-2:#ebe0c8;--paper:#fffdf8;--gold:#c8913a;--muted:#5d6a70;--line:#d9cfba;--display:'Jost','Futura','Century Gothic',Arial,sans-serif;--body:system-ui,-apple-system,'Segoe UI',Arial,sans-serif}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--cream);color:var(--navy);font:15px/1.55 var(--body);-webkit-font-smoothing:antialiased}
[hidden]{display:none!important}
.in{max-width:1080px;margin:0 auto;padding-inline:20px}
.top{background:var(--navy);color:var(--cream);font:500 12px var(--display);letter-spacing:.18em;text-transform:uppercase}
.top .in{display:flex;justify-content:space-between;gap:12px;padding-block:10px}
.hero{padding:56px 0 40px;border-bottom:1px solid var(--line)}
.hero .in{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.hero h1{font:500 clamp(34px,6vw,58px)/1.02 var(--display);letter-spacing:.02em;margin:10px 0 14px}
.hero p{max-width:46ch;color:var(--muted);margin:0 0 22px;font-size:16px}
.eyebrow{font:500 12px var(--display);letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.stage{background:#fff;border:1px solid var(--line);padding:38px 30px;display:grid;place-items:center;min-height:220px}
.stage img{width:100%;max-width:340px;height:auto}
.btn{display:inline-flex;align-items:center;gap:8px;font:600 14px var(--body);padding:13px 20px;border:1.5px solid var(--navy);background:var(--navy);color:var(--cream);cursor:pointer;text-decoration:none;border-radius:0}
.btn.ghost{background:transparent;color:var(--navy)}
.btn:focus-visible,.pick:focus-visible,[role=tab]:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
section.step{padding:46px 0;border-bottom:1px solid var(--line)}
.step h2{font:500 26px/1.15 var(--display);letter-spacing:.02em;margin:6px 0 6px}
.step .lede{color:var(--muted);margin:0 0 22px;max-width:62ch}
.grid{display:grid;gap:12px}
.people{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.anims{grid-template-columns:repeat(auto-fill,minmax(260px,320px))}
.layouts{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.pick{display:grid;gap:3px;text-align:left;background:var(--paper);border:1.5px solid var(--line);padding:16px 16px 15px;cursor:pointer;color:var(--navy);font:14px/1.4 var(--body);border-radius:0;transition:border-color .15s,box-shadow .15s}
.pick b{font:500 16px/1.25 var(--display);letter-spacing:.02em}
.pick span{color:var(--muted);font-size:13px}.pick small{color:var(--muted);font:12px ui-monospace,Menlo,monospace}
.pick:hover{border-color:var(--navy-2)}
.pick[aria-pressed=true]{border-color:var(--navy);box-shadow:inset 0 0 0 1.5px var(--navy);background:#fff}
.pick[aria-pressed=true] b::after{content:"  \\2713";color:var(--gold)}
.thumb{display:grid;place-items:center;background:#fff;border:1px solid var(--cream-2);height:76px;margin-bottom:8px}
.thumb img{width:150px;height:auto}
.preview{background:#fff;border:1px solid var(--line);padding:30px;overflow-x:auto;min-height:150px}
.bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0 0}
.status{font:500 13px var(--body);color:var(--gold);min-height:1em}
.who{font:500 13px var(--display);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
[role=tablist]{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}
[role=tab]{font:600 13px var(--body);padding:9px 14px;border:1.5px solid var(--navy);background:transparent;color:var(--navy);cursor:pointer;border-radius:0}
[role=tab][aria-selected=true]{background:var(--navy);color:var(--cream)}
[role=tabpanel]{background:var(--paper);border:1px solid var(--line);padding:20px 26px}
[role=tabpanel] ol{margin:0;padding-left:20px}[role=tabpanel] li{margin:5px 0}
.note{margin:12px 0 0;color:var(--muted);font-size:14px}
.good{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:18px}
.good div{border-top:2px solid var(--navy);padding-top:10px;font-size:14px;color:var(--muted)}.good b{display:block;color:var(--navy);font:500 15px var(--display);margin-bottom:2px}
footer{padding:34px 0 56px;color:var(--muted);font-size:13px}
#copybox{position:fixed;left:-9999px;top:0}
@media (max-width:760px){.hero .in{grid-template-columns:1fr}.hero{padding-top:36px}.preview{padding:18px}}
</style></head><body>
<div class="top"><div class="in"><span>Danforth Sidebar</span><span>Signature Studio</span></div></div>
<header class="hero"><div class="in"><div>
<span class="eyebrow">For the Sidebar team</span>
<h1>Your signature, lit&nbsp;up.</h1>
<p>Pick your name, how the logo lights up and the layout you like. Then copy it straight into your email. It takes about a minute.</p>
<a class="btn" href="#step-1">Get my signature</a></div>
<div class="stage"><img id="heroLogo" src="${logo}" alt="Danforth Sidebar Toronto logo lighting up" width="340" height="117"></div></div></header>
<main>
<section class="step" id="step-1"><div class="in"><span class="eyebrow">Step 1</span><h2>Choose your name</h2>
<p class="lede">Your details are already filled in. Shared inboxes have their own signature too. Something wrong or missing? Email Culture Cartel at jarryd@culturecartel.ca.</p>
<div class="grid people">${personCards}</div></div></section>
<section class="step" id="step-2"><div class="in"><span class="eyebrow">Step 2</span><h2>Choose the logo</h2>
<p class="lede">The logo lights up once when your email opens, then rests on the finished wordmark. Its first frame is always the finished logo, so Outlook for Windows, which only shows the first frame, still looks right.</p>
<div class="grid anims">${animCards}</div></div></section>
<section class="step" id="step-3"><div class="in"><span class="eyebrow">Step 3</span><h2>Choose the layout and copy</h2>
<p class="lede">The preview uses your details and the logo you picked. Copy signature puts the finished, formatted signature on your clipboard.</p>
<div class="grid layouts">${layoutCards}</div>
<p class="who" id="who" style="margin-top:26px"></p>
<div class="preview" id="preview" aria-live="polite"></div>
<div class="bar"><button class="btn" type="button" id="copy">Copy signature</button><button class="btn ghost" type="button" id="copyText">Copy plain text</button><button class="btn ghost" type="button" id="copyHtml">Copy HTML</button><button class="btn ghost" type="button" id="replay">Replay the logo</button><span class="status" id="status" role="status"></span></div>
</div></section>
<section class="step" id="step-4"><div class="in"><span class="eyebrow">Step 4</span><h2>Install it</h2>
<p class="lede">Open this page on the device you are setting up, copy your signature in Step 3, then follow the steps for your mail app.</p>
<div role="tablist" aria-label="Mail app">${installTabs}</div>${installPanels}
<div class="good"><div><b>Send a test</b>Email yourself after saving. If the logo does not show, your mail app is blocking images until you allow them.</div><div><b>Long threads</b>Use a short reply signature, or turn the signature off for replies, so threads stay tidy.</div><div><b>Outlook for Windows</b>Shows the finished logo without the motion. Everywhere else lights up.</div></div>
</div></section>
</main>
<footer><div class="in">Danforth Sidebar, 161 Danforth Ave, Toronto. Signature artwork is hosted permanently, so signatures keep working after you paste them. Built by Culture Cartel.</div></footer>
<div id="copybox"></div>
<script>
const DATA=${JSON.stringify(data)};
const TEXT=${JSON.stringify(text)};
const NAMES=${JSON.stringify(Object.fromEntries(people.map(p => [p.id, p.name])))};
const LNAMES=${JSON.stringify(Object.fromEntries(cfg.layouts.map(l => [l.id, l.name])))};
const st={person:${JSON.stringify(people[0].id)},anim:${JSON.stringify(cfg.animations[0].id)},layout:${JSON.stringify(cfg.layouts[0].id)}};
try{const s=JSON.parse(localStorage.getItem('sig-${slug}')||'{}');for(const k in st)if(s[k])st[k]=s[k]}catch(e){}
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
let n=0;
function key(){return st.person+'|'+st.anim+'|'+st.layout}
function render(){
  const html=DATA[key()];if(!html)return;
  $('#preview').innerHTML=html;
  $('#who').textContent=NAMES[st.person]+'  ·  '+LNAMES[st.layout];
  [['person','person'],['anim','anim'],['layout','layout']].forEach(([cls,k])=>$$('.'+cls).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[k]===st[k]))));
  try{localStorage.setItem('sig-${slug}',JSON.stringify(st))}catch(e){}
}
function replay(){n++;$$('#preview img[src*=".gif"],#heroLogo').forEach(i=>{i.src=i.src.split('?')[0]+'?r='+n})}
$$('.person').forEach(b=>b.addEventListener('click',()=>{st.person=b.dataset.person;render()}));
$$('.anim').forEach(b=>b.addEventListener('click',()=>{st.anim=b.dataset.anim;render();replay()}));
$$('.layout').forEach(b=>b.addEventListener('click',()=>{st.layout=b.dataset.layout;render();replay()}));
function say(t){$('#status').textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>$('#status').textContent='',3000)}
async function copyRich(){
  const html=DATA[key()],box=$('#copybox');box.innerHTML=html;
  try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([box.innerText],{type:'text/plain'})})]);say('Copied. Now paste it into your mail app.')}
  catch(e){const r=document.createRange();r.selectNodeContents(box);const s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');say('Copied. Now paste it into your mail app.')}catch(_){say('Press and hold, then Copy.')}}
}
async function copyPlain(t,msg){try{await navigator.clipboard.writeText(t);say(msg)}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();say(msg)}}
$('#copy').addEventListener('click',copyRich);
$('#copyText').addEventListener('click',()=>copyPlain(TEXT[st.person],'Plain text copied. Use this on Android.'));
$('#copyHtml').addEventListener('click',()=>copyPlain(DATA[key()],'HTML copied, for tools that ask for code.'));
$('#replay').addEventListener('click',replay);
$$('[role=tab]').forEach(t=>t.addEventListener('click',()=>{$$('[role=tab]').forEach(o=>o.setAttribute('aria-selected',String(o===t)));$$('[role=tabpanel]').forEach(p=>p.hidden=p.dataset.panel!==t.dataset.tab)}));
const ua=navigator.userAgent;const pre=/iPhone|iPad/.test(ua)?'iPhone':/Android/.test(ua)?'Android':/Mac/.test(ua)?'Apple Mail':/Windows/.test(ua)?'Outlook':null;
if(pre)$$('[role=tab]').forEach(t=>{if(t.textContent.startsWith(pre))t.click()});
render();
</script></body></html>`;

const out = join(ROOT, 'dist', 'studio', slug);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-cache\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
// GitHub Pages copy: the brand's signature page becomes the studio.
if (existsSync(join(ROOT, 'dist', slug))) writeFileSync(join(ROOT, 'dist', slug, 'index.html'), html);
console.log(`studio for ${slug}: ${people.length} people, ${cfg.animations.length} animations, ${cfg.layouts.length} layouts, ${Object.keys(data).length} signatures`);

if (process.argv.includes('--deploy')) {
  for (const k of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) if (!process.env[k]) { console.error(`Set ${k} first.`); process.exit(1); }
  try { execFileSync('npx', ['--yes', 'wrangler@3.112.0', 'pages', 'project', 'create', cfg.cloudflare.project, '--production-branch', 'main'], { stdio: 'pipe' }); } catch { /* exists */ }
  execFileSync('npx', ['--yes', 'wrangler@3.112.0', 'pages', 'deploy', out, '--project-name', cfg.cloudflare.project, '--branch', 'main', '--commit-dirty=true'], { stdio: 'inherit' });
}
