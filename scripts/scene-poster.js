/*
 * Renders the static posters of the 3D background from the live scene. They are shown
 * instead of the canvas when a visitor has no WebGL, only a software renderer, or Save-Data.
 *
 *   pnpm build && pnpm preview --port 4391 &
 *   PLAYWRIGHT_CORE=… node scripts/scene-poster.js http://127.0.0.1:4391/en/
 *
 * Any page that renders <Scene /> works; everything but the scene is hidden for the shot
 * and the hero (top of the page) is captured. Re-run after changing the home country in
 * src/lib/config/site-config.json — the poster shows it.
 *
 * Needs playwright-core (not a project dependency: point PLAYWRIGHT_CORE at an install,
 * e.g. from `npx playwright-core --version`) and a Chromium with GPU access (CHROMIUM,
 * default /usr/bin/chromium). Writes static/scene/poster-wide.webp and poster-tall.webp.
 */
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
	for (const variant of VARIANTS) {
		const page = await browser.newPage({
			viewport: { width: variant.width, height: variant.height },
			deviceScaleFactor: variant.scale
		});
		const target = new URL(url);
		target.searchParams.set('scene', 'high');
		await page.goto(target.href, { waitUntil: 'load' });
		await page.addStyleTag({ content: HIDE_PAGE });
		await page.waitForFunction(
			() => document.querySelector('.scene-root')?.getAttribute('data-scene') === 'live',
			null,
			{ timeout: 30000 }
		);
		await page.waitForTimeout(5000); // intro, arcs drawn, pulses mid-flight
		const png = await page.screenshot({ type: 'png' });
		const webp = await page.evaluate(
			async ({ data, quality }) => {
				const image = new Image();
				image.src = `data:image/png;base64,${data}`;
				await image.decode();
				const canvas = document.createElement('canvas');
				canvas.width = image.width;
				canvas.height = image.height;
				canvas.getContext('2d').drawImage(image, 0, 0);
				return canvas.toDataURL('image/webp', quality).split(',')[1];
			},
			{ data: png.toString('base64'), quality: variant.quality }
		);
		const file = resolve(root, `static/scene/poster-${variant.name}.webp`);
		writeFileSync(file, Buffer.from(webp, 'base64'));
		console.log(
			`${file.replace(root + '/', '')}: ${Math.round(Buffer.from(webp, 'base64').length / 1024)} kB`
		);
		await page.close();
	}
	await browser.close();
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
