# personal-webpage-front

The personal site of Anuar Beibit, who sells himself as an AI-native engineer: one landing page, prerendered in English (`/en/`) and Russian (`/ru/`), with a fixed 3D scene (Threlte) behind the text. Every word is in the static HTML, so the page reads fine without WebGL or JavaScript. No backend.

## What is on the page

`src/routes/[lang=lang]/+page.svelte`, seven sections (`src/lib/sections/`):

| Section (id)           | What it shows                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| Hero (`hero`)          | The one H1, a lead, two calls to action, four trust numbers                                      |
| Skills (`skills`)      | The skill tree as constellations in the 3D sky or as a filterable list («Созвездиями / Списком») |
| How I work (`process`) | Orchestrator → agents → checks & evals → production, and three working rules                     |
| Cases (`works`)        | Six cases with their numbers and a career line from `works.*.json`                               |
| Formats (`offer`)      | Test week, launch, support (no prices)                                                           |
| FAQ (`faq`)            | Native `<details>`; the same items feed the FAQPage JSON-LD                                      |
| Contact (`contact`)    | Telegram, email, phone, LinkedIn, GitHub, the CV PDF                                             |

`/` only picks a language (a remembered choice, then the browser's languages, then English) and keeps old in-page links working (`/#contacts` → `/en/#contact`). The CVs live in `static/cv/`.

Every fact in the copy comes from the public CV, the previous site or the owner's positioning notes; there are no invented numbers, clients or reviews.

## Stack

- SvelteKit 2 + Svelte 4 + Vite 5, plain JavaScript (`svelte-check` runs over `jsconfig.json`), `@sveltejs/adapter-static`
- Threlte (`@threlte/core` 7.x, `@threlte/extras` 8.x) on three.js 0.159. `@threlte/core` is pinned to the Svelte 4 line; a newer major needs Svelte 5.
- Tailwind 3 (base layer) plus hand-written CSS: tokens and shared styles in `src/lib/app/styles/app.css`, section styles inside the components
- Self-hosted Manrope and Playfair Display italic (Latin + Cyrillic subsets, SIL OFL, `static/fonts/`); icons are inline SVG
- A tiny store-based i18n written in-repo (no i18n library): `src/lib/shared/i18n/`
- pnpm 10 (pinned in `package.json`); checked here with Node 24

## Structure

```
src/
  app.html, hooks.server.js   <html lang="%lang%">, filled per URL on the server
  params/lang.js              only `en` and `ru` are routes
  routes/
    +layout.js                prerender everything, trailing slash
    +page.svelte              `/`: language redirect
    +error.svelte             404 (rendered by build/404.html)
    [lang=lang]/              the page: header, footer, <Scene /> behind the content
    sitemap.xml/+server.js    prerendered sitemap with hreflang alternates
  lib/
    config/site-config.json   site-wide facts, today the home location (owner edits it)
    scene/                    the 3D background: Scene.svelte and sceneStore.js
    sections/                 the seven sections, sceneProgress.js, ui/ (Icon, SectionHead, magnetic)
    seo/                      site.js (origin, contacts), Seo.svelte (head tags), jsonld.js
    widgets/                  Header, Footer, and the older 3D widgets (globe, typing figure, star field)
    entities/ shared/         globe meshes, 3D model, shaders, helpers, i18n, content JSON
scripts/og-image.js           renders static/og/og-<lang>.jpg with headless Chromium
scripts/model-pipeline.js     GLB to Threlte component converter
static/                       fonts, images, CV files, OG images, robots.txt, 3D model (served as-is)
tools/site-admin/             the place admin (see «Админка места»): server, page, tests; no dependencies
ops/box/                      the production box: deploy.sh, Caddyfile, the admin's service, install.sh
```

How the pieces fit:

- **The URL decides the language.** `[lang]/+layout.svelte` sets the `locale` store from the route before anything renders, so the prerendered `/ru/` is Russian; the header's EN/RU are plain links and remember the choice for `/`. Strings live in `src/lib/shared/i18n/locales/{en,ru}.json` and are read as `$t('section.key')`; lists (cases, FAQ…) come back as arrays.
- **Location comes from the config.** Copy says `{city}`, `{country}` and `{utc}`; they are filled from `src/lib/config/site-config.json` at build time (the UTC offset from its IANA time zone), in the page language, and the JSON-LD address uses the same file. Russian copy uses the names only in the nominative, so another city needs no grammar changes. `{years}` is computed from `works.en.json`.
- **Skills have one source.** `tree.json` (with `tree.ru.json` overlaying titles and descriptions by id) holds the skills; `CONSTELLATIONS` in `content.skill-tree.js` groups them (Agents, LLM & evals, Front-end, Back-end, Infrastructure) and `buildConstellations(lang)` returns the groups for both the 3D sky and the list. The page gets only the built list from its server load, not the whole tree.
- **Scene contract.** `sceneStore` is a writable `{ section, progress }` (`hero | skills | process | works | offer | contact`, progress 0..1); `sceneProgress.js` writes it on scroll (the FAQ shares the `contact` stage) and mirrors the stage on `<html data-scene>`. The Skills section adds `skillsView: 'constellations' | 'list'` so the sky can dim its constellations under the list.
- **SEO.** Each language has its own title, description, canonical, hreflang (en, ru, x-default → `/en/`), Open Graph/Twitter image and one JSON-LD graph (Person, WebSite, WebPage, Service per format, FAQPage). `robots.txt` points to `sitemap.xml`. The canonical origin is `SITE_URL` in `src/lib/seo/site.js`.
- **No WebGL, reduced motion, no JS.** All text is in the HTML; the skills list is the only view then. `shared/helpers/webgl.js` probes WebGL once.

## Run, build, check

```bash
pnpm install            # lockfile: pnpm-lock.yaml
pnpm dev                # dev server (add -- --open to open a tab)
pnpm build              # static site into build/ (index.html, en/, ru/, 404.html, sitemap.xml)
pnpm preview            # serve the build
pnpm check              # svelte-kit sync + svelte-check
pnpm lint               # prettier --check + eslint
pnpm format             # prettier --write
node scripts/og-image.js   # regenerate the OG images (needs Chromium)
```

The site has no automated test suite; the browser checks in commit messages were done by hand and are not committed. The place admin has one: `node --test --test-concurrency=2 'tools/site-admin/test/*.test.js'`.

The dev server adds `COOP`/`COEP` headers and permissive CORS (`vite.config.js`). Production headers are set by the web server, not by this repo.

## 3D model pipeline

`pnpm model-pipeline:run` runs `scripts/model-pipeline.js`, which turns GLB/GLTF files into Threlte components:

1. It takes every `.glb` / `.gltf` in `static/models/` (skipping `*-transformed.*`).
2. For each one it runs `npx @threlte/gltf@latest <file> --root /models/ --printwidth 120 --precision 2` (needs network, because it fetches the latest CLI).
3. It moves the generated `<name>.svelte` into `src/lib/entities/3d/models/` and deletes it from `static/models/`. The `.glb` stays in `static/models/` because the component loads it from `/models/<name>.glb`.

Options (types, draco, texture transform and simplify, overwrite) are the `configuration` object at the top of the script; all are off by default. Existing components are skipped unless `overwrite` is on.

Caution: `typingPerson.svelte` was generated and then edited by hand (greeting animation queue, `allowGreet`) and renamed. Do not regenerate over it; a rerun would create a separate `typing-person.svelte`.

## Production

The site is live at https://anoirs-server.top. The box side lives in `ops/box/` and is installed with `ops/box/install.sh` (as root, from a checkout of main; `--dry-run` shows what it would change). `ops/box/README.md` maps every installed path.

- `deploy.sh`: root's cron runs it every day at 04:30 UTC, and it rebuilds when `origin/main` or the place saved in the admin changed. It runs `pnpm install --frozen-lockfile && pnpm build`, copies `build/` into a new release, swaps it in atomically and rolls back if the health check fails; there is no adapter overlay (one with `fallback: 'index.html'` would replace the prerendered `/`).
- A change reaches the site on the next 04:30 UTC run, at once with `deploy.sh --force` on the box, or with a save in the place admin; a push triggers nothing.
- Caddy serves the release as is: unknown paths get `404.html` with status 404 (not `index.html`), `/_app/immutable/*` is cached for a year (`immutable`), the rest for 5 minutes, and `www.` redirects to the bare domain.
- The box's addresses, tailnet names and secrets are deliberately not recorded in this repo.

## Админка места

The place admin (`tools/site-admin/`) is where the owner says which country he is in: a searchable list of the 177 countries the globe knows (Russian and English names, codes), the city in English and Russian, coordinates prefilled with a point inside the country (editable, rounded to 0.01° — a city, not an address) and an IANA time zone. It shows the JSON it will write, saves it and rebuilds the site, with the build log live on the page.

- **Open it.** On the box it is `site-admin.service` on `127.0.0.1:8792`: `ssh -L 8792:127.0.0.1:8792 root@<box>`, then open `http://127.0.0.1:8792/?token=<SITE_ADMIN_TOKEN>` once (the token is in `/etc/site-admin/env`); the browser then keeps an HttpOnly, SameSite=Strict session cookie for 30 days. After `install.sh --tailnet` it is also at `http://<box>:8792/` from the owner's tailnet. Only listed Host names are answered and every write needs a same-origin `Origin`.
- **What a save changes.** Everything that reads `src/lib/config/site-config.json` at build time, in both languages: the globe's highlighted country, home marker and arcs, `{city}`, `{country}` and the UTC offset in the copy and meta tags, and the JSON-LD address and coordinates. A failed build leaves the previous release online. Not covered: the OG images (`static/og/`) and the no-WebGL posters (`static/scene/`) are rendered offline and keep the old view until `scripts/og-image.js` and `scripts/scene-poster.js` are rerun and committed.
- **Where the config lives.** The admin writes `/var/lib/site-admin/site-config.json` on the box (`SITE_CONFIG_PATH`; outside git and the build). Before each build `deploy.sh` checks it with `tools/site-admin/apply-config.js` and puts its `home` over `src/lib/config/site-config.json`. The file in git stays the default for local builds, and the admin shows it until the first save.

Locally, with a stand-in for the deploy:

```bash
SITE_ADMIN_TOKEN=local-token-0123456789 SITE_CONFIG_PATH=/tmp/site-admin/site-config.json \
  SITE_REBUILD_CMD='node tools/site-admin/test/fixtures/fake-rebuild.js' node tools/site-admin/server.js
# then open http://127.0.0.1:8792/?token=local-token-0123456789
```

## Next

Open items, in priority order. "Agent" means an agent can do it alone; "Owner" means it needs a decision or access to the box.

1. **Install `ops/box` on the box.** Box access: `ops/box/install.sh`, then `/opt/personal-webpage/deploy.sh --force`, then `install.sh` again (it switches Caddy only once a static build is live). Done when `curl -I https://anoirs-server.top/ru/` returns the prerendered Russian page, `/robots.txt` returns text, not HTML, and a missing page returns 404.
2. **Search Console.** Owner: verify the domain, submit `https://anoirs-server.top/sitemap.xml`, check both URLs with URL Inspection.
3. **Prettier formatting debt.** `pnpm exec prettier --check .` still flags older files. Agent: one `pnpm format` commit with nothing else mixed in.
4. **Dependency cleanup.** Never imported from `src/`: `@dimforge/rapier3d-compat`, `@sveu/browser`, `@theatre/core`, `@theatre/studio`, `@threlte/flex`, `@threlte/rapier`, `@threlte/theatre`, `@threlte/xr`, `rxjs`, `troika-three-text`, `@tweenjs/tween.js`, `dayjs`, `svelte-awesome-color-picker`, `adapter-auto`, `adapter-cloudflare`, `adapter-netlify`; `@iconify/svelte` and `svelte-markdown` are used only by unused components. Agent. Done when `pnpm check` and `pnpm build` stay green and the lockfile is updated.
5. **Dead code and assets.** No route uses `widgets/globe`, `widgets/typing-3d`, `widgets/canvas-animation`, `shared/UI/{Deferred,ImageCard,CustomButton,MovableGlow}`, `widgets/content/SectionTextContent`, `shared/stores/globalStore` (keep what the 3D scene reuses); the Poppins fonts and ten images in `static/images/` are referenced nowhere (keep `src/lib/ne_110m_admin_0_countries.geojson`: the place admin and `scripts/scene-geodata.js` read it). Agent.
