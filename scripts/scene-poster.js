/*
 * Renders the static posters of the 3D background from the live scene.
 *
 * What the poster is for. Scene.svelte shows it instead of the WebGL canvas when a visitor
 * has no WebGL, only a software renderer (SwiftShader, llvmpipe), Save-Data on, a very weak
 * device, or frames too slow even at the lowest pixel ratio. It is the hero shot of the
 * scene as a still image: the dotted Earth in its atmosphere under the star field.
 *
 * Country-neutral on purpose. The page loads with `?scene=poster` (see quality.js), which
 * renders a still, high-tier frame with no home country highlight, no home marker, no work
 * places and no arcs, and turns the Earth to a fixed view (POSTER_VIEW in OrbitGlobe.svelte)
 * instead of home. So the poster never goes stale: changing the home in
 * src/lib/config/site-config.json needs no new poster. Scene.svelte draws the home marker
 * over the poster as HTML, from the configured lat/lon and the projection this script
 * saves; when home lies on the far side of the poster's Earth the marker is left out.
 *
 * When to re-run: after changing how the hero looks (story.js framing, globe materials,
 * palette, star field) — not after changing the home or the copy.
 *
 *   pnpm build && pnpm preview --port 4391 &
 *   PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core node scripts/scene-poster.js http://127.0.0.1:4391/en/
 *
 * Needs playwright-core (not a project dependency: point PLAYWRIGHT_CORE at an install, e.g.
 * the one `npx playwright-core --version` leaves in ~/.npm/_npx) and a Chromium with GPU
 * access (CHROMIUM, default /usr/bin/chromium; the flags below keep it off SwiftShader).
 * Any page that renders <Scene /> works; everything but the canvas is hidden for the shot.
 *
 * Writes:
 *   static/scene/poster-wide.webp   1600×900, for landscape screens
 *   static/scene/poster-tall.webp   414×896 at 1.5×, for portrait screens
 *   src/lib/scene/poster.json       per poster: image size, the Earth-to-clip matrix
 *                                   (column-major) and the camera in Earth coordinates
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const url = process.argv[2];
if (!url) {
	console.error('usage: node scripts/scene-poster.js <url of a page that renders <Scene />>');
	process.exit(2);
}

let chromium;
try {
	({ chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core'));
} catch {
	console.error('playwright-core not found: set PLAYWRIGHT_CORE to its install directory');
	process.exit(2);
}

const VARIANTS = [
	{ name: 'wide', width: 1600, height: 900, scale: 1, quality: 0.8 },
	{ name: 'tall', width: 414, height: 896, scale: 1.5, quality: 0.8 }
];

// hide the page but keep its layout: the scene frames the Earth around the hero text
const HIDE_PAGE = `
	body * { visibility: hidden !important; }
	.scene-root, .scene-root * { visibility: visible !important; }
	.scene-labels { display: none !important; }
`;

const main = async () => {
	const browser = await chromium.launch({
		executablePath: process.env.CHROMIUM || '/usr/bin/chromium',
		headless: true,
		args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=gl']
	});

	mkdirSync(resolve(root, 'static/scene'), { recursive: true });
	const meta = {};
	for (const variant of VARIANTS) {
		const page = await browser.newPage({
			viewport: { width: variant.width, height: variant.height },
			deviceScaleFactor: variant.scale,
			reducedMotion: 'reduce'
		});
		const target = new URL(url);
		target.searchParams.set('scene', 'poster');
		await page.goto(target.href, { waitUntil: 'load' });
		await page.addStyleTag({ content: HIDE_PAGE });
		await page.waitForFunction(
			() =>
				document.querySelector('.scene-root')?.getAttribute('data-scene') === 'live' &&
				// @ts-ignore
				Boolean(window.__scenePoster),
			null,
			{ timeout: 30000 }
		);
		await page.waitForTimeout(2500); // every stage mounted, the canvas faded in
		const png = await page.screenshot({ type: 'png' });
		// @ts-ignore — published by OrbitGlobe.svelte in neutral mode
		const projection = await page.evaluate(() => window.__scenePoster);
		const webp = await page.evaluate(
			async ({ data, quality }) => {
				const image = new Image();
				image.src = `data:image/png;base64,${data}`;
				await image.decode();
				const canvas = document.createElement('canvas');
				canvas.width = image.width;
				canvas.height = image.height;
				canvas.getContext('2d').drawImage(image, 0, 0);
				return {
					data: canvas.toDataURL('image/webp', quality).split(',')[1],
					width: image.width,
					height: image.height
				};
			},
			{ data: png.toString('base64'), quality: variant.quality }
		);
		const file = resolve(root, `static/scene/poster-${variant.name}.webp`);
		const bytes = Buffer.from(webp.data, 'base64');
		writeFileSync(file, bytes);
		meta[variant.name] = { w: webp.width, h: webp.height, ...projection };
		console.log(
			`${file.replace(root + '/', '')}: ${webp.width}×${webp.height}, ${Math.round(
				bytes.length / 1024
			)} kB`
		);
		await page.close();
	}
	await browser.close();

	const json = resolve(root, 'src/lib/scene/poster.json');
	writeFileSync(json, JSON.stringify(meta, null, '\t') + '\n');
	try {
		// keep the file in the repo's style (prettier is a dev dependency)
		execFileSync(resolve(root, 'node_modules/.bin/prettier'), ['--write', json], {
			stdio: 'ignore'
		});
	} catch {
		// unformatted is fine too
	}
	console.log(`${json.replace(root + '/', '')}: projection for the home marker`);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
