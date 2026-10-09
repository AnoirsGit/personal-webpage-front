/* Shared bits for the site-admin tests (node:test). */
import { mkdtempSync, rmSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAdmin } from '../lib/app.js';
import { loadCountries } from '../lib/countries.js';
import { loadSettings } from '../lib/settings.js';

export const TOKEN = 'test-token-0123456789abcdef';
export const FAKE_REBUILD = fileURLToPath(new URL('./fixtures/fake-rebuild.js', import.meta.url));
export const APPLY_CONFIG = fileURLToPath(new URL('../apply-config.js', import.meta.url));
export const REPO_COUNTRIES = fileURLToPath(
	new URL('../../../src/lib/ne_110m_admin_0_countries.geojson', import.meta.url)
);

let countries = null;
export const getCountries = () => {
	if (!countries) countries = loadCountries(REPO_COUNTRIES);
	return countries;
};

export const GEORGIA = {
	countryIso3: 'GEO',
	countryName: { en: 'Georgia', ru: 'Грузия' },
	city: { en: 'Tbilisi', ru: 'Тбилиси' },
	lat: 41.72,
	lon: 44.83,
	timezone: 'Asia/Tbilisi'
};

/** A fresh directory under the OS temp dir, removed after the test. */
export const tempDir = (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'site-admin-test-'));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	return dir;
};

/** Starts the admin on an ephemeral loopback port; stopped after the test. */
export const startAdmin = async (t, env = {}) => {
	const dir = tempDir(t);
	const settings = loadSettings({
		SITE_ADMIN_TOKEN: TOKEN,
		SITE_CONFIG_PATH: join(dir, 'state', 'site-config.json'),
		SITE_ADMIN_PORT: '0',
		...env
	});
	const lines = [];
	const admin = createAdmin(settings, {
		log: (line) => lines.push(line),
		env: { ...process.env, SITE_ADMIN_TOKEN: TOKEN, FAKE_REBUILD_MS: '250' }
	});
	await new Promise((resolve) => admin.server.listen(0, '127.0.0.1', resolve));
	const { port } = admin.server.address();
	settings.allowedHosts = new Set([`127.0.0.1:${port}`]);
	t.after(async () => {
		if (admin.rebuilder) await admin.rebuilder.idle();
		admin.server.closeAllConnections();
		await new Promise((resolve) => admin.server.close(resolve));
	});
	return { ...admin, settings, port, dir, lines, origin: `http://127.0.0.1:${port}` };
};

/** Plain HTTP request with full control over Host, Origin and the body. */
export const request = (port, { method = 'GET', path = '/', headers = {}, body } = {}) =>
	new Promise((resolve, reject) => {
		const req = httpRequest(
			{ host: '127.0.0.1', port, method, path, headers, agent: false },
			(res) => {
				const chunks = [];
				res.on('data', (chunk) => chunks.push(chunk));
				res.on('end', () => {
					const text = Buffer.concat(chunks).toString('utf8');
					let json;
					try {
						json = JSON.parse(text);
					} catch {
						json = undefined;
					}
					resolve({ status: res.statusCode, headers: res.headers, text, json });
				});
			}
		);
		req.on('error', reject);
		if (body !== undefined) req.write(body);
		req.end();
	});
