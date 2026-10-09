#!/usr/bin/env node
/*
 * Stand-in for ops/box/deploy.sh in tests and local demos: prints deploy-like lines over
 * FAKE_REBUILD_MS (default 1200), then exits with FAKE_REBUILD_EXIT (default 0).
 * FAKE_REBUILD_JOURNAL, if set, gets "start <ms>" and "end <ms>" lines appended, so a test
 * can count runs and check that they never overlapped.
 */
import { appendFileSync, readFileSync } from 'node:fs';

const total = Number(process.env.FAKE_REBUILD_MS || 1200);
const exitCode = Number(process.env.FAKE_REBUILD_EXIT || 0);
const journal = process.env.FAKE_REBUILD_JOURNAL;
const mark = (what) => journal && appendFileSync(journal, `${what} ${Date.now()}\n`);

let place = 'the repo default';
try {
	const { home } = JSON.parse(readFileSync(process.env.SITE_CONFIG_PATH, 'utf8'));
	place = `${home.city.en}, ${home.countryName.en} (${home.countryIso3})`;
} catch {
	// no saved config yet
}

const stamp = () => `[${new Date().toISOString().slice(0, 19)}+00:00]`;
const lines = [
	`${stamp()} deploying 821527e1 -> 821527e1`,
	`${stamp()} site config applied: ${place}`,
	`${stamp()} installing dependencies (pnpm install --frozen-lockfile)`,
	'Lockfile is up to date, resolution step is skipped',
	'Already up to date',
	`${stamp()} building (pnpm build)`,
	'vite v5.4.21 building SSR bundle for production...',
	'\u001b[32m✓\u001b[39m 412 modules transformed.',
	'> Using @sveltejs/adapter-static',
	'  Wrote site to "build"',
	`${stamp()} current -> 20261008-224500-821527e`,
	`${stamp()} health check: / /en/ /ru/ /sitemap.xml ok`
];

mark('start');
let index = 0;
const tick = () => {
	if (index < lines.length) {
		console.log(lines[index++]);
		setTimeout(tick, total / lines.length);
		return;
	}
	if (exitCode) console.error(`${stamp()} ERROR: build failed (fake, exit ${exitCode})`);
	else console.log(`${stamp()} deployed 20261008-224500-821527e OK`);
	mark('end');
	process.exit(exitCode);
};
tick();
