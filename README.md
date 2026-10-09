# Email signatures

The single home for every email signature Culture Cartel designs for people and clients. One repo, one history, nothing lives only in someone's mail settings.

```
config.json                  assetBase: where public/ is hosted (GitHub Pages)
brands/<brand>/brand.json    colours, address, links, layout, logo path under public/
brands/<brand>/logo/         vector masters, PNGs, animation sources
people/<brand>/<person>.json one file per person (name, title, email, phone)
public/<brand>/              hosted files the signatures load (logo GIF and PNG). Published by .github/workflows/pages.yml
assets/render-logo.mjs       renders a brand's SVGs to PNG, email GIF and MP4 (npm install, then npm run logo -- <brand>)
build.mjs                    turns the above into paste-ready HTML and plain text
dist/                        build output (not committed). dist/index.html is the preview with Copy buttons
docs/INSTALL.md              how to install a signature in each mail app
```

## Signature Studio (what staff use)

`studio.json` lists, per brand, the people order, the logo animations, the layouts on offer and the install steps. `node studio.mjs <brand>` writes the studio to `dist/studio/<brand>/` and also to `dist/<brand>/index.html`, so GitHub Pages serves it at `/signatures/<brand>/`. `node studio.mjs <brand> --deploy` publishes it to its own Cloudflare Pages project (Sidebar: `sidebar-signatures`, at https://sig.danforthsidebar.com). Staff pick their name, the logo (light up or still) and one of the layouts, then copy. Every combination is pre-rendered by `build.mjs`, so what they copy is exactly what the build makes.

## Stage options for a client to choose from

`stage.json` lists, per brand, the people and the layouts to offer. `node stage.mjs <brand>` writes a private choosing page to `dist/stage/<brand>/` (tabs per person, their own details, noindex). `node stage.mjs <brand> --deploy` publishes it to a Cloudflare Pages preview branch of the client's site project (needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`). A preview branch never touches the production site.

## Use
```bash
node build.mjs     # writes dist/
node --test        # checks the output
```
Open `dist/index.html`, press Copy signature, paste into the mail app (see `docs/INSTALL.md`).

## Add a person
Copy `people/<brand>/_example.json` to `first-last.json`, fill it in, build, commit. History shows who changed what and when.

## Add a client
Copy a folder under `brands/` and `people/`, edit `brand.json`, put the logo SVGs in `brands/<brand>/logo/` named `<brand>-logo.svg` (plus `-black`, `-white`, `-animated`), run `npm run logo -- <brand>`, set `logo.src` to the file under `public/`. Email apps cannot show SVG, so signatures always load the GIF or PNG from `public/`, served at `config.assetBase`. `layout` picks one of the named layouts in `build.mjs` (card, bar, band, wordmark, letter). Set `optionsFor` to a person file name and the build writes `dist/<brand>/options.html` showing that person in every layout. Leave `layout` out for the stacked layout.

## Rules
No em dashes. System fonts only inside signatures (Georgia for the name, Arial for the rest), because mail apps ignore web fonts. Culture Cartel colours: ink #17181b, cream #f2e9d6, emerald #1a5e43, brass #b9894a (darkened to #8a5a1c for text on white so it stays readable).

## Status
- Sidebar mailboxes are live on Purelymail (2026-10-08): info, bookings, events, marketing, admin, jack, sava, sean. Every one has a signature here. reservations@ was dropped because it does not exist; table and event requests go to bookings@.
- Sidebar co-owner signatures (Sava Miljanovic, Jack Doering, Sean Seymour) are built: layout `bar`, light-up logo. Layout picked by Claude on 2026-10-08 when Jarryd asked to keep moving; change `layout` in brands/sidebar/brand.json to switch (card, bar, band, wordmark, letter).
- Copy page for Sidebar staff (Sidebar only): https://culturecartel.github.io/email-signatures/signatures/sidebar/ . Every brand gets its own page at signatures/<brand>/; signatures/ shows all brands. Logos load from GitHub Pages (Settings, Pages, Source: GitHub Actions).
- Culture Cartel uses a text wordmark until a hosted logo PNG exists.
Sidebar colours: logo navy #052e42 for the name and direct lines, grey #6b6f73 for the title, #8d9195 for the venue line.
