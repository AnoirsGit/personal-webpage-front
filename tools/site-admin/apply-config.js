#!/usr/bin/env node
/*
 * Applies the place admin's saved file to a checkout before the build:
 *
 *   node tools/site-admin/apply-config.js <saved site-config.json> <checkout>/src/lib/config/site-config.json
 *
 * Run by ops/box/deploy.sh as root over a file the unprivileged admin wrote, so it trusts
 * nothing: the saved file must be a regular file (a symlink is refused, not followed) of at
 * most 64 KiB, and its `home` must pass the admin's own validation. That `home` replaces
 * `home` in the checkout's config; every other key of the checkout's config stays.
 * Prints one summary line (warnings on stderr); exits 1 with the reason otherwise.
 */
import { closeSync, constants, fstatSync, openSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { loadCountries } from './lib/countries.js';
import { serializeConfig, validateHome, writeFileAtomic } from './lib/config.js';

const MAX_BYTES = 64 * 1024;
const COUNTRIES = fileURLToPath(
	new URL('../../src/lib/ne_110m_admin_0_countries.geojson', import.meta.url)
);

const fail = (message) => {
	console.error(`apply-config: ${message}`);
	process.exit(1);
};

const readSaved = (path) => {
	let fd;
	try {
		fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
	} catch (error) {
		fail(error.code === 'ELOOP' ? `${path} is a symlink, refusing it` : error.message);
	}
	try {
		const stat = fstatSync(fd);
		if (!stat.isFile()) fail(`${path} is not a regular file`);
		if (stat.size > MAX_BYTES) fail(`${path} is larger than ${MAX_BYTES} bytes`);
		return readFileSync(fd, 'utf8');
	} finally {
		closeSync(fd);
	}
};

const [savedPath, targetPath] = process.argv.slice(2);
if (!savedPath || !targetPath) {
	fail('usage: apply-config.js <saved site-config.json> <checkout site-config.json>');
}

let saved;
try {
	saved = JSON.parse(readSaved(savedPath));
} catch (error) {
	fail(`${savedPath} is not valid JSON: ${error.message}`);
}
const result = validateHome(saved && saved.home, { countries: loadCountries(COUNTRIES) });
if (!result.ok) {
	fail(
		`${savedPath} rejected: ${Object.entries(result.errors)
			.map(([field, message]) => `${field}: ${message}`)
			.join('; ')}`
	);
}

let base;
try {
	base = JSON.parse(readFileSync(targetPath, 'utf8'));
} catch (error) {
	fail(`${targetPath} is unreadable: ${error.message}`);
}

const { home } = result;
writeFileAtomic(targetPath, serializeConfig({ ...base, home }), { mode: 0o644 }).then(
	() => {
		for (const warning of result.warnings) console.error(`apply-config: warning: ${warning}`);
		console.log(
			`${home.city.en}, ${home.countryName.en} (${home.countryIso3}) ${home.lat}, ${home.lon} ${home.timezone}`
		);
	},
	(error) => fail(`cannot write ${targetPath}: ${error.message}`)
);
