# personal-webpage-front

The personal site of Anuar Beibit: a single-page portfolio in English and Russian. It is the public shop window of a front-end / full-stack engineer, so the page itself is the demo: lazy-loaded WebGL scenes with custom GLSL shaders, an interactive skill tree and a career timeline, with no backend.

## What is on the page

One route (`src/routes/+page.svelte`), four sections:

| Section  | What it shows                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------- |
| About    | Hero text, career counters, a 3D typing figure (GLB model), CV download                                 |
| Skills   | Pan/zoom skill tree with three tabs: AI & Agents, Front-end, Back-end                                   |
| Works    | Career timeline with project cards and screenshots                                                      |
| Contacts | Copy-to-clipboard contact list over a 3D globe (custom globe and atmosphere shaders, animated pointers) |

Also: a header with an EN/RU switcher (the choice is kept in `localStorage`, otherwise the browser language decides), a star-field canvas behind the page, and CV files in `static/cv/` (the hero links one of them; the other three are reachable by URL only).

Everything is static content. There are no API calls, no environment variables and no secrets.

## Stack

- SvelteKit 2 + Svelte 4 + Vite 5, plain JavaScript (`svelte-check` runs over `jsconfig.json`)
- Threlte (`@threlte/core` 7.x, `@threlte/extras` 8.x) on three.js 0.159. `@threlte/core` is pinned to the Svelte 4 line; a newer major needs Svelte 5.
- Tailwind 3 plus hand-written CSS in `src/lib/app/styles/`
- A tiny store-based i18n written in-repo (no i18n library): `src/lib/shared/i18n/`
- `svelte-markdown` for card prose, `dayjs` for timeline dates, `@iconify/svelte` for icons
- pnpm 10 (pinned in `package.json`); checked here with Node 24

## Structure

```
src/
  routes/            +layout.svelte (header, footer, loader, star field), +page.svelte (the four sections)
  lib/
    app/styles/      global and per-section CSS
    sections/        the four page sections; heavy parts load through <Deferred load={...}>
    widgets/         composed blocks: Header, Footer, Globe, SkillTree, Typing3D, PageLoader, canvas animation
    features/tree/   skill-tree authoring UI (node form, tooltip, "add node" bar)
    entities/        domain pieces: globe meshes, tree nodes and edges, experience timeline, generated 3D models
    shared/
      i18n/          the store, locale dictionaries (locales/*.json) and lazy content modules
      mocks/         the real content as JSON: about-me, works, skill tree, globe points (EN + RU files)
      shaders/       GLSL for the globe and atmosphere
      UI/            small components and effects (Deferred, reveal, tilt, buttons, tabs)
      helpers/ consts/ stores/
scripts/model-pipeline.js   GLB to Threlte component converter
static/                     images, fonts, CV files, 3D model (served as-is)
```

How the pieces fit:

- **Lazy by design.** Only the hero is in the entry chunk. `Deferred.svelte` mounts a section when it nears the viewport and, with `load`, also keeps its code and JSON out of the entry bundle. It also re-aims in-page jumps (`/#contacts`) so lazy sections mounting above the target do not leave the page short of it.
- **Content lives in JSON.** The folder is called `mocks/` for historical reasons, but it is the actual content. Edit `works.en.json` / `works.ru.json` for the timeline and `about-me.*.json` for the hero. The hero counters (years, projects, technologies) are computed from the timeline data, not typed.
- **Skill tree.** `tree.json` holds geometry and English text; `tree.ru.json` only overlays `title` and `description` by node id, so keep ids stable. The page renders the tree read-only (`isEditMode={false}`). The editor UI in `features/tree/` is a dormant authoring tool and saves nothing.
- **i18n.** Add UI strings to both `locales/en.json` and `locales/ru.json` (a missing RU key falls back to English) and read them as `$t('section.key')`.
- **No WebGL.** `shared/helpers/webgl.js` probes once; without WebGL both 3D widgets render nothing and the rest of the page keeps working.

## Run, build, check

```bash
pnpm install            # lockfile: pnpm-lock.yaml
pnpm dev                # dev server (add -- --open to open a tab)
pnpm build              # production build into .svelte-kit/ (see the adapter note under Production)
pnpm preview            # serve the build
pnpm check              # svelte-kit sync + svelte-check
pnpm lint               # prettier --check + eslint
pnpm format             # prettier --write
```

State on `main` (checked 2026-10-08): `pnpm check` reports 0 errors and 0 warnings, `pnpm build` succeeds, `eslint .` is clean. `prettier --check` is not clean (see Next). There is no automated test suite; the browser checks mentioned in commit messages (deep links at phone and desktop widths, a Chromium run with WebGL disabled) were done by hand and are not committed.

The dev server adds `COOP`/`COEP` headers and permissive CORS (`vite.config.js`). Production headers are set by the web server, not by this repo.

## 3D model pipeline

`pnpm model-pipeline:run` runs `scripts/model-pipeline.js`, which turns GLB/GLTF files into Threlte components:

1. It takes every `.glb` / `.gltf` in `static/models/` (skipping `*-transformed.*`).
2. For each one it runs `npx @threlte/gltf@latest <file> --root /models/ --printwidth 120 --precision 2` (needs network, because it fetches the latest CLI).
3. It moves the generated `<name>.svelte` into `src/lib/entities/3d/models/` and deletes it from `static/models/`. The `.glb` stays in `static/models/` because the component loads it from `/models/<name>.glb`.

Options (types, draco, texture transform and simplify, overwrite) are the `configuration` object at the top of the script; all are off by default. Existing components are skipped unless `overwrite` is on.

Caution: `typingPerson.svelte` was generated and then edited by hand (greeting animation queue, `allowGreet`) and renamed. Do not regenerate over it; a rerun would create a separate `typing-person.svelte`.

## Production

The site is live. A cron job on the production box rebuilds it every day at 04:30 UTC with the box's own deploy script, which lives outside this repo. As far as the commit history shows, the script installs dependencies, swaps in `@sveltejs/adapter-static` through a config overlay (with a `fallback` page) and builds; the web server then serves the static output.

What follows from that:

- A change reaches the site on the next 04:30 UTC run; a push triggers nothing.
- The repo's own `svelte.config.js` still says `adapter-auto`. Locally `pnpm build` finishes, but adapter-auto reports "Could not detect a supported production environment", so a local build is for checking only. `@sveltejs/adapter-static` is declared in `devDependencies` at `^3.0.10` (the SvelteKit 2 line) so the box does not resolve the 4.x line that targets Kit 3.
- Anything that changes the adapter, the build output location or the dependency install step must be coordinated with the deploy script. That script is not visible from this repo, so what the production output contains (prerendered pages or only the fallback shell) is not verified here.
- Host names, addresses and paths of the box are deliberately not recorded in this repo.

## Next

Open items, in priority order. "Agent" means an agent can do it alone; "Owner" means it needs a decision or access to the box.

1. **Server-side `<html lang>` for RU.** `src/app.html` hard-codes `lang="en"` and the locale is applied only after JavaScript runs, so crawlers and screen readers see `en` on the Russian version. Owner: decide whether RU gets its own URL (for example `/ru`) or stays client-side. Agent: implement. Done when the served HTML for the RU variant carries `lang="ru"` without running JS.
2. **Prettier formatting debt.** `pnpm exec prettier --check .` flags 57 files (58 before this README was formatted). Agent: one `pnpm format` commit with nothing else mixed in. Done when `pnpm lint` passes and `pnpm check` / `pnpm build` are unchanged.
3. **Dependency cleanup.** `axios` is already removed and `@threlte/gltf` is correctly dev-only (it is a build-time CLI). Still declared but never imported from `src/`: `@dimforge/rapier3d-compat`, `@sveu/browser`, `@theatre/core`, `@theatre/studio`, `@threlte/flex`, `@threlte/rapier`, `@threlte/theatre`, `@threlte/xr`, `rxjs`, `troika-three-text`, `@tweenjs/tween.js`, plus the unused `adapter-cloudflare` and `adapter-netlify`. Also make the pipeline script use the pinned local `@threlte/gltf` instead of `npx ...@latest`. Agent. Done when `pnpm check` and `pnpm build` stay green and the lockfile is updated.
4. **Repo matches production.** Commit the adapter-static configuration (or document it exactly) so the repo builds what the box builds. Agent and owner together, because the deploy script is on the box.
5. **Dead assets.** `src/lib/ne_110m_admin_0_countries.geojson` (about 490 KB, probably the source of `globe-points.json`) and ten images in `static/images/` (`careerist`, `demetra-*`, `html.png`, `neo4j`, `postgre.png`, `side-panel`, `Vegetables`, `workflow`) are referenced nowhere in `src/`. Agent: confirm and delete, or move the geojson to a data folder with a note. Done when the build output is unchanged.
