/*
 * Builds the Open Graph / Twitter images, static/og/og-<lang>.jpg (1200×630):
 * the hero line over a dotted Earth in the night sky. The land dots come from the same
 * land raster the 3D globe uses (src/lib/entities/globe/landMask.js, generated from
 * Natural Earth by scripts/scene-geodata.js).
 *
 *   node scripts/og-image.js          # needs Chromium; CHROMIUM=/path/to/chrome to override
 *
 * Location-neutral on purpose: no city or country in the text, no home marker, arcs or
 * country highlight, and the Earth turned to a fixed view (the Old World, as the scene's
 * poster). The owner can move his location in the admin and the box rebuilds the site
 * without a browser, so nothing here may depend on src/lib/config/site-config.json.
 *
 * The text comes from the locale dictionaries (name, hero line, job title): re-run after
 * changing those. No npm dependencies: the page is rendered by headless Chromium.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeLandMask, isLand } from '../src/lib/entities/globe/geodata.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path));
const json = (path) => JSON.parse(read(path).toString('utf8'));

const CHROMIUM = process.env.CHROMIUM || '/usr/bin/chromium';
const WIDTH = 1200;
const HEIGHT = 630;
const HOST = 'anoirs-server.top';

// ~14k land dots spread evenly over the sphere: a golden-angle spiral, kept where it hits land
const SPIRAL = 50000;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const mask = decodeLandMask();
const points = [];
for (let i = 0; i < SPIRAL; i++) {
	const lat = (Math.asin(1 - (2 * (i + 0.5)) / SPIRAL) * 180) / Math.PI;
	const lon = (((((i * GOLDEN * 180) / Math.PI) % 360) + 360) % 360) - 180;
	if (isLand(mask, lat, lon)) points.push([+lat.toFixed(2), +lon.toFixed(2)]);
}
// the fixed view: centred between Europe, Africa and Asia (POSTER_VIEW in OrbitGlobe.svelte)
const VIEW = { lat: 28, lon: 58 };
const font = (file) => `data:font/woff2;base64,${read(`static/fonts/${file}`).toString('base64')}`;

// "AI-агенты" must not break at its hyphen
const keepHyphenated = (text) => text.replace(/(\S*-\S*)/g, '<span class="nb">$1</span>');

const page = (copy) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: Manrope; src: url(${font(
	'manrope-latin.woff2'
)}) format('woff2'); font-weight: 200 800; unicode-range: U+0000-00FF, U+2000-206F; }
@font-face { font-family: Manrope; src: url(${font(
	'manrope-cyrillic.woff2'
)}) format('woff2'); font-weight: 200 800; unicode-range: U+0400-045F; }
@font-face { font-family: Playfair; src: url(${font(
	'playfair-display-italic-500-latin.woff2'
)}) format('woff2'); font-style: italic; unicode-range: U+0000-00FF, U+2000-206F; }
@font-face { font-family: Playfair; src: url(${font(
	'playfair-display-italic-500-cyrillic.woff2'
)}) format('woff2'); font-style: italic; unicode-range: U+0400-045F; }
html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #05060d; }
canvas { position: absolute; inset: 0; }
.copy { position: absolute; left: 72px; top: 76px; width: 640px; font-family: Manrope, sans-serif; color: #eef0f8; }
.name { display: flex; align-items: center; gap: 12px; font-size: 26px; font-weight: 700; color: #b3b8cc; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #e8c77e; box-shadow: 0 0 18px 4px rgba(232,199,126,.6); }
h1 { margin: 34px 0 0; font-size: 66px; line-height: 1.02; font-weight: 800; letter-spacing: -0.045em; }
h1 em { display: block; margin-top: 8px; font-family: Playfair, serif; font-style: italic; font-weight: 500; font-size: 70px; letter-spacing: -0.01em; color: #e8c77e; text-shadow: 0 0 40px rgba(232,199,126,.35); }
.foot { position: absolute; left: 72px; bottom: 64px; font-family: Manrope, sans-serif; font-size: 24px; font-weight: 600; color: #b3b8cc; }
.foot b { color: #e8c77e; font-weight: 700; }
.nb { white-space: nowrap; }
</style></head><body>
<canvas id="sky" width="${WIDTH}" height="${HEIGHT}"></canvas>
<div class="copy"><div class="name"><span class="dot"></span>${copy.name}</div><h1>${keepHyphenated(
	copy.lead
)}<em>${copy.accent}</em></h1></div>
<div class="foot">${copy.role} · <b>${HOST}</b></div>
<script>
const points = ${JSON.stringify(points)};
const ctx = document.getElementById('sky').getContext('2d');
let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const sky = ctx.createRadialGradient(930, 300, 60, 930, 300, 900);
sky.addColorStop(0, '#0d1230'); sky.addColorStop(0.55, '#070915'); sky.addColorStop(1, '#04050b');
ctx.fillStyle = sky; ctx.fillRect(0, 0, ${WIDTH}, ${HEIGHT});
for (let i = 0; i < 260; i++) {
  const r = rand() * 1.3 + 0.2; ctx.globalAlpha = 0.25 + rand() * 0.6;
  ctx.fillStyle = rand() > 0.85 ? '#f6dfa8' : '#cfd6ff';
  ctx.beginPath(); ctx.arc(rand() * ${WIDTH}, rand() * ${HEIGHT}, r, 0, Math.PI * 2); ctx.fill();
}
ctx.globalAlpha = 1;
const cx = 960, cy = 350, R = 300, rad = Math.PI / 180;
const lat0 = ${VIEW.lat} * rad * 0.6, lon0 = (${VIEW.lon} - 18) * rad;
const project = (lat, lon) => {
  const p = lat * rad, l = lon * rad - lon0;
  const x = Math.cos(p) * Math.sin(l);
  const y = Math.cos(lat0) * Math.sin(p) - Math.sin(lat0) * Math.cos(p) * Math.cos(l);
  const z = Math.sin(lat0) * Math.sin(p) + Math.cos(lat0) * Math.cos(p) * Math.cos(l);
  return [cx + x * R, cy - y * R, z];
};
const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.28);
glow.addColorStop(0, 'rgba(232,199,126,0.32)'); glow.addColorStop(0.35, 'rgba(232,199,126,0.10)'); glow.addColorStop(1, 'rgba(232,199,126,0)');
ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2); ctx.fill();
const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
body.addColorStop(0, '#141a3a'); body.addColorStop(1, '#070916');
ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
for (const [lat, lon] of points) {
  const [x, y, z] = project(lat, lon); if (z <= 0) continue;
  ctx.globalAlpha = 0.25 + z * 0.75; ctx.fillStyle = z > 0.55 ? '#e9ecff' : '#9aa6e0';
  ctx.beginPath(); ctx.arc(x, y, 0.9 + z * 0.9, 0, Math.PI * 2); ctx.fill();
}
ctx.globalAlpha = 1;
const shade = ctx.createLinearGradient(0, 0, 760, 0);
shade.addColorStop(0, 'rgba(5,6,13,0.92)'); shade.addColorStop(0.75, 'rgba(5,6,13,0.55)'); shade.addColorStop(1, 'rgba(5,6,13,0)');
ctx.fillStyle = shade; ctx.fillRect(0, 0, 760, ${HEIGHT});
document.fonts.ready.then(() => document.body.setAttribute('data-ready', '1'));
</script></body></html>`;

const work = mkdtempSync(join(tmpdir(), 'og-'));
mkdirSync(join(root, 'static/og'), { recursive: true });

for (const code of ['en', 'ru']) {
	const dict = json(`src/lib/shared/i18n/locales/${code}.json`);
	const html = join(work, `og-${code}.html`);
	writeFileSync(
		html,
		page({
			name: dict.meta.siteName,
			lead: dict.hero.titleLead,
			accent: dict.hero.titleAccent,
			role: dict.meta.jobTitle
		})
	);
	const out = join(root, `static/og/og-${code}.jpg`);
	execFileSync(CHROMIUM, [
		'--headless=new',
		'--disable-gpu',
		'--hide-scrollbars',
		'--force-device-scale-factor=1',
		`--window-size=${WIDTH},${HEIGHT}`,
		'--virtual-time-budget=3000',
		`--screenshot=${out}`,
		`file://${html}`
	]);
	console.log(`wrote static/og/og-${code}.jpg`);
}

rmSync(work, { recursive: true, force: true });
