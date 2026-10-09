import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
	hostAllowed,
	isAuthenticated,
	originAllowed,
	parseAllowedHosts,
	parseCookies,
	safeEqual,
	sessionCookie,
	sessionValue
} from '../lib/auth.js';
import { SettingsError, loadSettings } from '../lib/settings.js';
import { TOKEN, request, startAdmin, tempDir } from './helpers.js';

const allowed = new Set(['127.0.0.1:8792', 'admin.example:8792']);

test('safeEqual compares strings of any length in constant time', () => {
	assert.equal(safeEqual('same-value-1234567', 'same-value-1234567'), true);
	assert.equal(safeEqual('same-value-1234567', 'same-value-1234568'), false);
	assert.equal(safeEqual('short', 'a much longer value'), false);
	assert.equal(safeEqual('', ''), true);
	assert.equal(safeEqual(undefined, 'x'), false);
	assert.equal(safeEqual(null, null), false);
});

test('the session value is a keyed hash of the token, never the token', () => {
	const value = sessionValue(TOKEN);
	assert.equal(value, sessionValue(TOKEN), 'deterministic');
	assert.notEqual(value, sessionValue(`${TOKEN}x`), 'depends on the token');
	assert.ok(!value.includes(TOKEN));
	assert.match(value, /^[A-Za-z0-9_-]{43}$/, 'base64url SHA-256');
	assert.equal(isAuthenticated({ cookie: `other=1; site_admin=${value}` }, value), true);
	assert.equal(isAuthenticated({ cookie: `site_admin=${TOKEN}` }, value), false);
	assert.equal(isAuthenticated({}, value), false);
});

test('cookies parse and the session cookie is HttpOnly and SameSite=Strict', () => {
	assert.deepEqual(parseCookies('a=1; b = two ;c=x=y'), { a: '1', b: 'two', c: 'x=y' });
	assert.deepEqual(parseCookies(undefined), {});
	const cookie = sessionCookie('abc');
	assert.match(cookie, /^site_admin=abc; Path=\/; Max-Age=\d+; HttpOnly; SameSite=Strict$/);
	assert.match(sessionCookie('abc', { secure: true }), /; Secure$/);
});

test('the Host allowlist is exact: name and port, case aside', () => {
	assert.equal(hostAllowed({ host: '127.0.0.1:8792' }, allowed), true);
	assert.equal(hostAllowed({ host: 'ADMIN.example:8792' }, allowed), true);
	assert.equal(hostAllowed({ host: '127.0.0.1' }, allowed), false);
	assert.equal(hostAllowed({ host: '127.0.0.1:8793' }, allowed), false);
	assert.equal(hostAllowed({ host: 'evil.example:8792' }, allowed), false);
	assert.equal(hostAllowed({}, allowed), false);
	assert.deepEqual(
		[...parseAllowedHosts('', 8792)],
		['127.0.0.1:8792', 'localhost:8792'],
		'loopback by default'
	);
	assert.deepEqual([...parseAllowedHosts(' A:1 , ,b:2', 9)], ['a:1', 'b:2']);
});

test('writes need an Origin of the same allowed host', () => {
	const ok = { host: '127.0.0.1:8792', origin: 'http://127.0.0.1:8792' };
	assert.equal(originAllowed(ok, allowed), true);
	assert.equal(originAllowed({ ...ok, origin: 'https://127.0.0.1:8792' }, allowed), true);
	assert.equal(originAllowed({ ...ok, 'sec-fetch-site': 'same-origin' }, allowed), true);
	assert.equal(originAllowed({ host: ok.host }, allowed), false, 'no Origin');
	assert.equal(originAllowed({ ...ok, origin: 'null' }, allowed), false);
	assert.equal(originAllowed({ ...ok, origin: 'http://evil.example' }, allowed), false);
	assert.equal(originAllowed({ ...ok, origin: 'http://admin.example:8792' }, allowed), false);
	assert.equal(originAllowed({ ...ok, origin: 'ftp://127.0.0.1:8792' }, allowed), false);
	assert.equal(originAllowed({ ...ok, 'sec-fetch-site': 'cross-site' }, allowed), false);
	assert.equal(originAllowed({ ...ok, 'sec-fetch-site': 'same-site' }, allowed), false);
	assert.equal(
		originAllowed({ host: 'evil.example:8792', origin: 'http://evil.example:8792' }, allowed),
		false
	);
});

test('settings refuse a short or spaced token and a config path inside git', (t) => {
	const dir = tempDir(t);
	const base = { SITE_ADMIN_TOKEN: TOKEN, SITE_CONFIG_PATH: join(dir, 'site-config.json') };
	const problems = (env) => {
		try {
			loadSettings(env);
			return [];
		} catch (error) {
			assert.ok(error instanceof SettingsError);
			return error.problems;
		}
	};
	assert.deepEqual(problems(base), []);
	assert.match(problems({ ...base, SITE_ADMIN_TOKEN: '' }).join(), /at least 16/);
	assert.match(problems({ ...base, SITE_ADMIN_TOKEN: 'fifteen-chars-x' }).join(), /at least 16/);
	assert.match(problems({ ...base, SITE_ADMIN_TOKEN: 'sixteen chars ok' }).join(), /whitespace/);
	assert.match(problems({ ...base, SITE_CONFIG_PATH: '' }).join(), /required/);
	assert.match(problems({ ...base, SITE_CONFIG_PATH: 'state/x.json' }).join(), /absolute/);
	const inRepo = fileURLToPath(
		new URL('../../../src/lib/config/site-config.json', import.meta.url)
	);
	assert.match(problems({ ...base, SITE_CONFIG_PATH: inRepo }).join(), /outside any git/);
	assert.match(problems({ ...base, SITE_ADMIN_PORT: 'http' }).join(), /port/);

	const settings = loadSettings({ ...base, SITE_REBUILD_CMD: '  ' });
	assert.equal(settings.bind, '127.0.0.1');
	assert.equal(settings.port, 8792);
	assert.deepEqual([...settings.allowedHosts], ['127.0.0.1:8792', 'localhost:8792']);
	assert.equal(settings.rebuildCommand, null);
});

test('HTTP: a foreign Host is refused before anything else', async (t) => {
	const admin = await startAdmin(t);
	for (const path of ['/', `/?token=${TOKEN}`, '/api/state']) {
		const res = await request(admin.port, {
			path,
			headers: { host: `evil.example:${admin.port}` }
		});
		assert.equal(res.status, 403, path);
		assert.equal(res.headers['set-cookie'], undefined);
	}
});

test('HTTP: ?token= once sets the hashed cookie; a wrong token sets nothing', async (t) => {
	const admin = await startAdmin(t);
	const wrong = await request(admin.port, { path: '/?token=not-the-token-at-all' });
	assert.equal(wrong.status, 401);
	assert.equal(wrong.headers['set-cookie'], undefined);

	const login = await request(admin.port, { path: `/?token=${encodeURIComponent(TOKEN)}` });
	assert.equal(login.status, 200);
	const [cookie] = login.headers['set-cookie'];
	assert.match(cookie, /HttpOnly/);
	assert.match(cookie, /SameSite=Strict/);
	assert.ok(!cookie.includes(TOKEN), 'the token itself never goes into the cookie');
	assert.equal(cookie.split(';')[0], `site_admin=${sessionValue(TOKEN)}`);
	assert.match(
		login.text,
		/location\.replace\('\/'\)/,
		'moves on to / so the token leaves the URL'
	);
	assert.equal(login.headers['referrer-policy'], 'no-referrer');

	const anonymous = await request(admin.port, { path: '/' });
	assert.equal(anonymous.status, 401);
	assert.equal((await request(admin.port, { path: '/api/state' })).status, 401);

	const headers = { cookie: cookie.split(';')[0] };
	const page = await request(admin.port, { path: '/', headers });
	assert.equal(page.status, 200);
	const nonce = /script-src 'nonce-([^']+)'/.exec(page.headers['content-security-policy'])[1];
	assert.ok(page.text.includes(`<script nonce="${nonce}">`), 'inline script carries the CSP nonce');
	assert.ok(!page.text.includes('__NONCE__'));
	assert.equal((await request(admin.port, { path: '/api/state', headers })).status, 200);

	const forged = await request(admin.port, {
		path: '/api/state',
		headers: { cookie: 'site_admin=x' }
	});
	assert.equal(forged.status, 401);
});
