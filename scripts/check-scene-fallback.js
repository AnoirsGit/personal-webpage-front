/*
 * Checks that the page outlives its 3D scene: when WebGL is missing or the live scene dies,
 * the shell shows the poster and the rest of the page keeps answering.
 *
 *   pnpm build && pnpm preview &
 *   PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core node scripts/check-scene-fallback.js http://localhost:4173
 *
 * 1. No WebGL on the page while a worker still has it (Chrome's Disable3DAPIs policy and
 *    --disable-webgl leave workers alone), with the tier forced high so the check does not
 *    depend on the machine's GPU: the poster, reason "no-webgl-page". A renderer that threw
 *    while mounting used to freeze every later Svelte update on the page.
 * 2. The live scene loses its WebGL context (SwiftShader, tier forced low): the poster,
 *    data-scene-fail "context-lost".
 * After each, a skill tree tab must still open. Needs playwright-core (PLAYWRIGHT_CORE, as for
 * scene-poster.js) and Chromium (CHROMIUM, default /usr/bin/chromium); no GPU needed.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// localhost, not 127.0.0.1: vite dev/preview listen on ::1 only on some machines (Node 17+)
const origin = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '');

let chromium;
try {
	({ chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core'));
} catch {
	console.error('playwright-core not found: set PLAYWRIGHT_CORE to its install directory');
	process.exit(2);
}

const CASES = [
	{
		name: 'page without WebGL, worker with it',
		args: ['--disable-webgl', '--disable-3d-apis'],
		path: '/en/?scene=high',
		expect: { reason: 'no-webgl-page' }
	},
	{
		name: 'live scene loses its context',
		args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
		path: '/en/?scene=low',
		loseContext: true,
		expect: { fail: 'context-lost' }
	}
];

const sceneState = (page) =>
	page.evaluate(() => {
		const root = document.querySelector('.scene-root');
		return {
			mode: root?.dataset.scene,
			reason: root?.dataset.sceneReason,
			fail: root?.dataset.sceneFail
		};
	});

const waitFor = async (page, modes, ms = 30000) => {
	const start = Date.now();
	while (Date.now() - start < ms) {
		const state = await sceneState(page);
		if (modes.includes(state.mode)) return state;
		await page.waitForTimeout(250);
	}
	return sceneState(page);
};

const run = async (test) => {
	const browser = await chromium.launch({
		executablePath: process.env.CHROMIUM || '/usr/bin/chromium',
		args: test.args
	});
	const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(`${origin}${test.path}`, { waitUntil: 'load' });
	if (test.loseContext) {
		await waitFor(page, ['live', 'poster']);
		// past the staged mount: three r159's compileAsync throws if the renderer is disposed
		// while it still polls a shader (a console error only, see the review notes)
		await page.waitForTimeout(4000);
		await page.evaluate(() => {
			const canvas = document.querySelector('.scene-live canvas');
			const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
			gl?.getExtension('WEBGL_lose_context')?.loseContext();
		});
	}
	const state = await waitFor(page, ['poster']);
	const tab = '.t-tabs button:nth-child(3)';
	await page.click(tab, { timeout: 5000 }).catch(() => {});
	await page.waitForTimeout(300);
	const tabOpens = (await page.getAttribute(tab, 'aria-pressed').catch(() => null)) === 'true';
	const problems = [
		state.mode !== 'poster' && `data-scene is "${state.mode}", not "poster"`,
		...Object.entries(test.expect)
			.filter(([key, value]) => state[key] !== value)
			.map(([key, value]) => `${key} is "${state[key]}", not "${value}"`),
		!tabOpens && 'the skill tree tab does not open: the page stopped answering',
		...errors.map((message) => `page error: ${message}`)
	].filter(Boolean);
	console.log(`${problems.length ? 'FAIL' : 'ok  '} ${test.name}`);
	for (const problem of problems) console.log(`     ${problem}`);
	await browser.close();
	return problems.length === 0;
};

const main = async () => {
	let failed = 0;
	for (const test of CASES) if (!(await run(test))) failed++;
	process.exit(failed ? 1 : 0);
};

main();
