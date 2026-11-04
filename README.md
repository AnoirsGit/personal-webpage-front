# personal-webpage-front

The personal site of Anuar Beibit, who sells himself as an AI-native engineer: one landing page, prerendered in English (`/en/`) and Russian (`/ru/`), with a fixed 3D scene (Threlte) behind the text. Every word is in the static HTML, so the page reads fine without WebGL or JavaScript. No backend; the only server-side piece is a small place admin on the box.

Live at https://anoirs-server.top, built from `main` (the box rebuilds daily at 04:30 UTC).

## Status, 2026-11-04

| What                                                                                                                                                                        | State                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The page: seven sections, EN/RU, 3D scene with no-WebGL posters, star-chart skill tree, SEO                                                                                 | on `main`, served by the box (checked 2026-10-22: `/`, `/en/`, `/ru/`, `/sitemap.xml` answer 200, unknown paths 404)                                                                                  |
| Place admin + rebuild on save (`tools/site-admin/`, `ops/box/`)                                                                                                             | on `main`, installed on the box (not checked from here); 39 tests: 39/39 passed on Linux on 2026-10-21, on macOS 5 of `site-rebuild.test.js` fail (no `flock`, GNU `date`/`stat`), checked 2026-11-04 |
| `agent/polish-site`: a11y fixes, unused packages and dead files removed, `/` without app JS, shader `pow()` fixes, no header blur on touch screens                          | on `main`; built and checked here (build, `check`, `lint`, skill chart clean)                                                                                                                         |
| Review 2026-10-22 (`agent/review-site`): no frozen page when only a worker has WebGL, `data-scene-fail`, the 404's language, an open skill card follows a resize, dead code | on `main`; built and checked here (build, `check`, `lint`, skill chart clean, browser scenarios by hand)                                                                                              |
| Automated tests for the page itself                                                                                                                                         | four scripts, run by hand, none in CI: `check-build.js`, `check-country-codes.js`, `check-skill-chart.js`, `check-scene-fallback.js` (see [Checks](#checks)); the rest is checked by hand             |
| `agent/site-constellation-tree` (Milky Way sky, phone savings)                                                                                                              | pending, the owner's call; the branch is in neither this clone nor `origin` on 2026-11-04 (see [Next](#next))                                                                                         |
| Night 2026-11-04 (`agent/night-2026-11-05`, not on `main`): the model pipeline pinned to `@threlte/gltf@2.0.3`, `scripts/check-build.js`, these docs                        | build, `check`, `lint`, `check-build.js` pass here; not merged, the owner's call                                                                                                                      |
| Search Console                                                                                                                                                              | not done (owner)                                                                                                                                                                                      |

## What is on the page

`src/routes/[lang=lang]/+page.svelte`, seven sections (`src/lib/sections/`):

| Section (id)           | What it shows                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Hero (`hero`)          | The one H1, a lead, two calls to action, four trust numbers                                                        |
| Skills (`skills`)      | The skill tree as a star chart over the Earth, one constellation per tab, or a filterable list («Дерево / Список») |
| How I work (`process`) | Orchestrator → agents → checks & evals → production, and three working rules                                       |
| Cases (`works`)        | Six cases with their numbers and a career line from `works.*.json`                                                 |
| Formats (`offer`)      | Test week, launch, support (no prices)                                                                             |
| FAQ (`faq`)            | Native `<details>`; the same items feed the FAQPage JSON-LD                                                        |
| Contact (`contact`)    | Telegram, email, phone, LinkedIn, GitHub, the CV PDF                                                               |

`/` only picks a language (a remembered choice, then the browser's languages, then English) with an inline script and ships no app JavaScript; it keeps old in-page links working (`/#contacts` → `/en/#contact`). The CVs live in `static/cv/`.

Every fact in the copy comes from the public CV, the previous site or the owner's positioning notes; there are no invented numbers, clients or reviews.

## Quick start

Node 20+ (checked with Node 24) and pnpm 10 (pinned in `package.json`).

```bash
pnpm install            # lockfile: pnpm-lock.yaml
pnpm dev                # http://localhost:5173 (add -- --open to open a tab)
pnpm build              # static site into build/ (index.html, en/, ru/, 404.html, sitemap.xml)
pnpm preview            # serve the build on http://localhost:4173
```

## Checks

```bash
pnpm check              # svelte-kit sync + svelte-check (0 errors, 0 warnings on 2026-11-04)
pnpm lint               # prettier --check + eslint
pnpm format             # prettier --write
node scripts/check-skill-chart.js http://localhost:5173   # the skill chart: overlaps, both languages, all layouts (needs pnpm dev or preview)
node scripts/check-build.js                               # the static build in build/: languages, SEO tags, JSON-LD, sitemap, `/` without app JS (needs pnpm build, fails on a build older than the sources; no server)
node scripts/check-country-codes.js                       # the globe's country lookup and the configured home
PLAYWRIGHT_CORE=… node scripts/check-scene-fallback.js http://localhost:4173   # poster, not a frozen page, without WebGL or after a lost context (needs pnpm preview)
node --test --test-concurrency=2 'tools/site-admin/test/*.test.js'   # the place admin
```

There is no browser test suite for the page: of the four checks above only `check-scene-fallback.js` drives a browser (two scenarios), and the other browser checks in commit messages were done by hand and are not committed. On macOS 5 of the place admin's tests fail for want of `flock` and GNU `date`/`stat` (see [docs/site-admin.md](docs/site-admin.md#locally)).

Regenerating assets (commit the output):

```bash
node scripts/og-image.js       # static/og/og-<lang>.jpg, needs Chromium; after changing the name, hero line or job title
PLAYWRIGHT_CORE=… node scripts/scene-poster.js http://localhost:4173/en/   # no-WebGL posters, needs pnpm preview and a GPU Chromium; after changing the hero's look
node scripts/scene-geodata.js  # the globe's land raster and borders from the Natural Earth geojson
pnpm model-pipeline:run        # GLB → Threlte component (@threlte/gltf 2.0.3); needs @threlte/extras with the first model, see Next and docs/architecture.md
```

## Configuration

The site has no `.env` and reads no environment at build or run time. What there is to set:

| Where                                                                                                            | What                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/config/site-config.json`                                                                                | The home: country (ISO3 + names), city in EN/RU, lat/lon, IANA time zone. On the box the place admin's saved copy replaces it for each build |
| `src/lib/seo/site.js`                                                                                            | `SITE_URL` (the canonical origin), contacts                                                                                                  |
| `src/lib/shared/i18n/locales/{en,ru}.json`                                                                       | All copy                                                                                                                                     |
| `src/lib/shared/mocks/`, `src/lib/shared/i18n/content.skill-tree.js`                                             | Skills (`tree.json`, `tree.ru.json`, `CONSTELLATIONS`) and cases (`works.{en,ru}.json`)                                                      |
| `CHROMIUM` (env)                                                                                                 | Chromium for `og-image.js`, `scene-poster.js` and `check-scene-fallback.js`, default `/usr/bin/chromium`                                     |
| `PLAYWRIGHT_CORE` (env)                                                                                          | A `playwright-core` install for `scene-poster.js` and `check-scene-fallback.js` (not a project dependency)                                   |
| `DEPLOY_ROOT`, `DEPLOY_BRANCH`, `DEPLOY_LOCK`, `DEPLOY_BUILD_LOG`, `DEPLOY_HEALTH_URL`, `SITE_CONFIG_PATH` (env) | Override `ops/box/deploy.sh`'s box defaults for a trial run elsewhere                                                                        |
| `SITE_ADMIN_*`, `SITE_CONFIG_PATH`, `SITE_REBUILD_*` (env)                                                       | The place admin, see [docs/site-admin.md](docs/site-admin.md#settings)                                                                       |

## Stack

- SvelteKit 2 + Svelte 4 + Vite 5, plain JavaScript (`svelte-check` runs over `jsconfig.json`), `@sveltejs/adapter-static`
- Threlte (`@threlte/core` 7.x) on three.js 0.159 (types: `@types/three` 0.165). `@threlte/core` is pinned to the Svelte 4 line; a newer major needs Svelte 5.
- Tailwind 3 (base layer) plus hand-written CSS: tokens and shared styles in `src/lib/app/styles/app.css`, section styles inside the components
- Self-hosted Manrope and Playfair Display italic (Latin + Cyrillic subsets, SIL OFL, `static/fonts/`); icons are inline SVG
- A tiny store-based i18n written in-repo (no i18n library): `src/lib/shared/i18n/`

## Structure

```
src/
  app.html, hooks.server.js   <html lang="%lang%">, filled per URL on the server
  params/lang.js              only `en` and `ru` are routes
  routes/
    +layout.js                prerender everything, trailing slash
    +page.svelte, +page.js    `/`: the language redirect, no app JS (csr = false)
    +error.svelte             404 (rendered by build/404.html)
    [lang=lang]/              the page: header, footer, <Scene /> behind the content
    sitemap.xml/+server.js    prerendered sitemap with hreflang alternates
  lib/
    config/site-config.json   site-wide facts, today the home location
    scene/                    the 3D background: Scene.svelte (shell, poster), World.svelte (frame loop),
                              story.js (camera), quality.js (tiers), sceneStore.js, parts/, gl/
    sections/                 the seven sections, sceneProgress.js, skill-tree/ (the chart and its layout),
                              ui/ (Icon, SectionHead, magnetic)
    seo/                      site.js (origin, contacts), Seo.svelte (head tags), jsonld.js
    widgets/                  Header and Footer
    entities/globe/           the globe and its geodata (generated landMask.js, countryBorders.js)
    shared/                   i18n, content JSON (mocks/), shaders, helpers
scripts/                      checks (check-build, check-skill-chart, check-country-codes, check-scene-fallback) and generators
                              (og-image, scene-poster, scene-geodata, model-pipeline)
static/                       fonts, images, CV files, OG images, scene posters, robots.txt (served as is)
tools/site-admin/             the place admin: server, page, tests; no dependencies
ops/box/                      the production box: deploy.sh, Caddyfile, the admin's and the rebuild's units, install.sh
docs/                         architecture.md (how the pieces work), site-admin.md
```

How the language, the location, the skills, the scene, SEO and the no-WebGL fallback work: [docs/architecture.md](docs/architecture.md).

## Deploy

The box side lives in `ops/box/` and is installed with `ops/box/install.sh` (as root, from a checkout of main; `--dry-run` shows what it would change). [`ops/box/README.md`](ops/box/README.md) maps every installed path.

- Root's cron runs `deploy.sh` every day at 04:30 UTC. It rebuilds when `origin/main` or the place saved in the admin changed: `pnpm install --frozen-lockfile && pnpm build`, `build/` into a new release, an atomic swap, a health check of `/ /en/ /ru/ /sitemap.xml`, a rollback on failure.
- So a push to `main` goes live on the next 04:30 UTC run, at once with `deploy.sh --force` on the box, or with a save in the place admin. The push itself triggers nothing.
- Caddy serves the release as is: unknown paths get `404.html` with status 404 (no SPA fallback), `/_app/immutable/*` is cached for a year, the rest for 5 minutes, `www.` redirects to the bare domain.
- The box's addresses, tailnet names and secrets are deliberately not recorded in this repo.

The place admin (pick the country, the site rebuilds by itself): [docs/site-admin.md](docs/site-admin.md).

## Troubleshooting

- **`fetch failed` from `check-skill-chart.js`, or `127.0.0.1:5173` refuses.** Vite may listen on `[::1]` only (Node 17+ resolves `localhost` to IPv6 first). Use `http://localhost:<port>`.
- **`pnpm install` warns "Ignored build scripts: esbuild, svelte-preprocess".** Harmless: `pnpm dev`, `pnpm build` and `pnpm check` work without those scripts; do not run `pnpm approve-builds` just for this.
- **`pnpm build` prints six `"untrack"` / `"fork"` / `"settled"` is not exported by `svelte` lines and "Some chunks are larger than 500 kB".** Both harmless: `@sveltejs/kit` 2.65 looks for Svelte 5 APIs and falls back on Svelte 4, and the big chunk is three.js, fetched only after the page is up (never without WebGL).
- **`pnpm install` complains about the lockfile.** Use pnpm 10 (`corepack enable` picks the pinned one). The box installs with `--frozen-lockfile`, so commit `pnpm-lock.yaml` with every dependency change.
- **A newer Threlte major** needs Svelte 5; stay on the `@threlte/core` 7.x line.
- **The site did not change after a push.** Nothing happens before 04:30 UTC. On the box: `/var/log/personal-webpage-deploy.log`; a failed build keeps the previous release (last build output in `/tmp/personal-webpage-build.log`).
- **Caddy does not start after a `caddy validate` as root:** `chown -R caddy:caddy /var/log/caddy` (see `ops/box/README.md`).

## Next

Open items, in priority order. "Agent" means an agent can do it alone; "Owner" means it needs a decision or access to the box.

1. **Search Console.** Owner: verify the domain, submit `https://anoirs-server.top/sitemap.xml`, check both URLs with URL Inspection.
2. **The Milky Way branch.** Owner: `agent/site-constellation-tree` (unmerged, never pushed; on 2026-11-04 it is neither a local branch nor on `origin`, so it may exist only in another clone, or be lost, in which case drop this item) has a Milky Way sky instead of the nebulae and more phone savings (30 fps while the camera rests, the sky skipped behind the Earth, one content-mask tap on the low tier). Its skill-chart half is superseded by the star chart on main, so it cannot be merged as is: the scene half would have to be ported onto main's nebula bake. Its shader `pow()` fixes and the no-blur header on touch screens are already ported.
3. **The model pipeline.** Agent: the script is pinned to `@threlte/gltf@2.0.3` (3.x is the Svelte 5 line); `@threlte/extras` is not installed, add it at an exact `7.5.4` (tried with core 7.3.2: a test model loads in the live scene) together with the next model (details in [docs/architecture.md](docs/architecture.md#3d-model-pipeline)).
4. **Frame-rate caps read as a slow GPU.** Agent, with an iPhone at hand to confirm: iOS Low Power Mode and Chrome's Energy Saver run `requestAnimationFrame` at 30 Hz, and `adapt()` in `src/lib/scene/World.svelte` counts every frame over 24 ms as slow, so it steps the pixel ratio down to its minimum while the GPU idles (in emulation: DPR 2 → 1 in about 20 s, 0.4 ms of work and 0.1 ms of GPU per frame). Measure the bare rAF interval before the scene mounts and scale both thresholds (24 and 40 ms) by it; stepping back up when a step does not help fails on vsync quantisation.
