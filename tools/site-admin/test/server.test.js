import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';

import { sessionValue } from '../lib/auth.js';
import { FAKE_REBUILD, GEORGIA, TOKEN, request, startAdmin } from './helpers.js';

const cookie = `site_admin=${sessionValue(TOKEN)}`;
const fakeRebuild = `"${process.execPath}" "${FAKE_REBUILD}"`;

const post = (admin, path, body, headers = {}) =>
	request(admin.port, {
		method: 'POST',
		path,
		headers: {
			cookie,
			origin: admin.origin,
			'content-type': 'application/json',
			...headers
		},
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});

test('state: the repo default until the first save, plus all countries', async (t) => {
	const admin = await startAdmin(t);
	const { status, json } = await request(admin.port, { path: '/api/state', headers: { cookie } });
	assert.equal(status, 200);
	assert.equal(json.source, 'default');
	assert.equal(json.countryCode, json.config.home.countryIso3);
	assert.equal(json.countries.length, 177);
	assert.deepEqual(Object.keys(json.countries[0]).sort(), ['a2', 'code', 'en', 'lat', 'lon', 'ru']);
	assert.equal(json.rebuild.configured, false);
});

test('writes need the cookie, a same-origin Origin and a small JSON body', async (t) => {
	const admin = await startAdmin(t);
	const body = { home: GEORGIA };
	assert.equal((await post(admin, '/api/config', body, { cookie: '' })).status, 401);
	assert.equal((await post(admin, '/api/config', body, { origin: '' })).status, 403);
	assert.equal(
		(await post(admin, '/api/config', body, { origin: 'http://evil.example' })).status,
		403
	);
	assert.equal(
		(await post(admin, '/api/config', body, { 'sec-fetch-site': 'cross-site' })).status,
		403
	);
	assert.equal(
		(await post(admin, '/api/config', body, { 'content-type': 'text/plain' })).status,
		415
	);
	assert.equal((await post(admin, '/api/config', '{ nope')).status, 400);
	const big = { home: { ...GEORGIA, city: { en: 'x'.repeat(20000), ru: 'y' } } };
	assert.equal((await post(admin, '/api/config', big)).status, 413);
	assert.equal(existsSync(admin.settings.configPath), false, 'nothing was written');
});

test('preview validates and normalizes without writing', async (t) => {
	const admin = await startAdmin(t);
	const good = await post(admin, '/api/preview', {
		home: { ...GEORGIA, timezone: 'asia/tbilisi' }
	});
	assert.equal(good.status, 200);
	assert.deepEqual(good.json, { ok: true, config: { home: GEORGIA }, warnings: [] });
	const bad = await post(admin, '/api/preview', { home: { ...GEORGIA, lat: 'north' } });
	assert.equal(bad.json.ok, false);
	assert.ok(bad.json.errors.lat);
	assert.equal(existsSync(admin.settings.configPath), false);
});

test('an invalid save is refused with field errors and writes nothing', async (t) => {
	const admin = await startAdmin(t);
	const res = await post(admin, '/api/config', { home: { ...GEORGIA, timezone: 'Nowhere/Land' } });
	assert.equal(res.status, 422);
	assert.ok(res.json.errors.timezone);
	assert.equal(existsSync(admin.settings.configPath), false);
});

test('save: atomic 0644 file, one rebuild; saves during the run queue exactly one more', async (t) => {
	const admin = await startAdmin(t, { SITE_REBUILD_CMD: fakeRebuild });

	const first = await post(admin, '/api/config', { home: GEORGIA });
	assert.equal(first.status, 200);
	assert.equal(first.json.rebuild.status, 'running');
	assert.equal(first.json.rebuild.queued, false);

	const almaty = {
		...GEORGIA,
		countryIso3: 'KAZ',
		countryName: { en: 'Kazakhstan', ru: 'Казахстан' },
		city: { en: 'Almaty', ru: 'Алматы' },
		lat: 43.24,
		lon: 76.95,
		timezone: 'Asia/Almaty'
	};
	const second = await post(admin, '/api/config', { home: almaty });
	const third = await post(admin, '/api/config', { home: almaty });
	assert.equal(second.json.rebuild.queued, true);
	assert.equal(third.json.rebuild.queued, true);

	const done = await admin.rebuilder.idle();
	assert.equal(done.status, 'ok');
	assert.equal(done.runs, 2);
	assert.match(done.log, /site config applied: Almaty, Kazakhstan \(KAZ\)/, 'built the last save');

	const { configPath } = admin.settings;
	assert.equal(statSync(configPath).mode & 0o777, 0o644);
	assert.deepEqual(JSON.parse(readFileSync(configPath, 'utf8')), { home: almaty });

	const state = await request(admin.port, { path: '/api/state', headers: { cookie } });
	assert.equal(state.json.source, 'saved');
	assert.equal(state.json.countryCode, 'KAZ');
	const rebuild = await request(admin.port, { path: '/api/rebuild', headers: { cookie } });
	assert.equal(rebuild.json.rebuild.status, 'ok');
	assert.ok(admin.lines.some((line) => line.startsWith('saved KAZ Almaty')));
});

test('a manual rebuild needs a configured command', async (t) => {
	const plain = await startAdmin(t);
	assert.equal((await post(plain, '/api/rebuild', {})).status, 409);

	const admin = await startAdmin(t, { SITE_REBUILD_CMD: fakeRebuild });
	const res = await post(admin, '/api/rebuild', {});
	assert.equal(res.status, 202);
	assert.equal(res.json.rebuild.status, 'running');
	assert.equal((await admin.rebuilder.idle()).status, 'ok');
});
