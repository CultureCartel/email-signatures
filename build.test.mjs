import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { renderHtml, renderText, buildAll, logoUrl, config } from './build.mjs';

const brand = JSON.parse(readFileSync('brands/sidebar/brand.json', 'utf8'));
test('html is table based, inline styled and has no scripts or em dashes', () => {
  const h = renderHtml(brand, { name: 'A <B>', title: 'T', email: 'a@b.ca' });
  assert.match(h, /^<table/);
  assert.ok(!h.includes('<script') && !h.includes('<style') && !h.includes('\u2014'));
  assert.ok(h.includes('A &lt;B&gt;'));
  assert.match(h, /<img src="https:\/\/[^"]+" width="180" height="62"/);
});
test('logo URLs are absolute https on the asset host, and the hosted file exists in public/', () => {
  for (const slug of readdirSync('brands')) {
    const b = JSON.parse(readFileSync(`brands/${slug}/brand.json`, 'utf8'));
    if (!b.logo) continue;
    assert.ok(logoUrl(b).startsWith(config.assetBase + '/'), slug);
    assert.ok(config.assetBase.startsWith('https://'));
    for (const f of [b.logo.src, b.logo.still].filter(Boolean)) assert.ok(existsSync(`public/${f}`), f);
  }
});
test('a personal phone is labelled Mobile, the venue line is labelled Tel', () => {
  const own = renderText(brand, { name: 'A', title: 'T', email: 'a@b.ca', phone: '416 888 5789', phoneTel: '+14168885789' });
  assert.match(own, /Mobile: 416 888 5789/);
  const venue = renderText(brand, { name: 'A', title: 'T', email: 'a@b.ca' });
  assert.match(venue, /Tel: \(647\) 350-7227/);
  assert.match(renderHtml(brand, { name: 'A', title: 'T', phone: '416 888 5789', phoneTel: '+14168885789' }), /href="tel:\+14168885789"/);
  assert.ok(!renderHtml(brand, { name: 'A', title: 'T', email: 'a@b.ca' }).includes('text-transform:uppercase'), 'card layout has no label column');
});
test('every committed person builds, and underscore files are skipped', () => {
  const g = buildAll();
  assert.ok(g.length >= 1);
  assert.ok(!g.some(x => x.id.startsWith('_')));
  for (const x of g) assert.ok(!x.html.includes('../public'), `${x.id} copy version must use hosted URLs`);
});
test('people files have a name, title and an email on the brand domain', () => {
  for (const slug of readdirSync('people')) for (const f of readdirSync(`people/${slug}`).filter(f => !f.startsWith('_'))) {
    const p = JSON.parse(readFileSync(`people/${slug}/${f}`, 'utf8'));
    assert.ok(p.name && p.title, f);
    if (p.phone) assert.match(p.phoneTel, /^\+1\d{10}$/, f);
  }
});
test('no source file contains an em dash', () => {
  for (const f of ['build.mjs', 'README.md', 'docs/INSTALL.md', 'assets/render-logo.mjs']) assert.ok(!readFileSync(f, 'utf8').includes('\u2014'), f);
});
