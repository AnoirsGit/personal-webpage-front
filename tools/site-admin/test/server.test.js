import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { sessionValue } from '../lib/auth.js';
import { GEORGIA, TOKEN, request, startAdmin } from './helpers.js';

const cookie = `site_admin=${sessionValue(TOKEN)}`;

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

const getRebuild = async (admin) =>
	(await request(admin.port, { path: '/api/rebuild', headers: { cookie } })).json.rebuild;

/** What site-rebuild.sh writes on the box (the path unit and the service are not here). */
const writeStatus = (admin, fields, log) => {
	mkdirSync(admin.statusDir, { recursive: true });
	writeFileSync(
		join(admin.statusDir, 'status.json'),
		JSON.stringify({ pass: 1, finishedAt: null, exitCode: null, ...fields })
	);
	if (log !== undefined) writeFileSync(join(admin.statusDir, 'rebuild.log'), log);
};

const ALMATY = {
	...GEORGIA,
	countryIso3: 'KAZ',
	countryName: { en: 'Kazakhstan', ru: 'Казахстан' },
	city: { en: 'Almaty', ru: 'Алматы' },
	lat: 43.24,
	lon: 76.95,
	timezone: 'Asia/Almaty'
};

test('state: the repo default until the first save, plus all countries', async (t) => {
	const admin = await startAdmin(t);
	const { status, json } = await request(admin.port, { path: '/api/state', headers: { cookie } });
	assert.equal(status, 200);
	assert.equal(json.source, 'default');
	assert.equal(json.countryCode, json.config.home.countryIso3);
	assert.equal(json.countries.filter((country) => country.onGlobe).length, 177);
	assert.equal(json.countries.length, 252, 'plus the 75 countries the globe lacks');
	assert.deepEqual(Object.keys(json.countries[0]).sort(), [
		'a2',
		'code',
		'en',
		'lat',
		'lon',
		'onGlobe',
		'ru'
	]);
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

test('save writes only the config (atomic, 0644); progress comes from the status files', async (t) => {
	const admin = await startAdmin(t, { rebuild: true });
	assert.deepEqual(
		[(await getRebuild(admin)).configured, (await getRebuild(admin)).status],
		[true, 'idle']
	);

	const saved = await post(admin, '/api/config', { home: GEORGIA });
	assert.equal(saved.status, 200);
	const { configPath } = admin.settings;
	assert.equal(statSync(configPath).mode & 0o777, 0o644);
	assert.deepEqual(JSON.parse(readFileSync(configPath, 'utf8')), { home: GEORGIA });
	assert.equal(existsSync(admin.statusDir), false, 'the admin never writes the status');
	assert.equal(saved.json.rebuild.status, 'idle');
	assert.ok(saved.json.rebuild.pendingSince, 'waits for the path unit to start a run');

	// the service starts: a pass that includes the save
	writeStatus(admin, { status: 'running', startedAt: new Date().toISOString() }, 'building\n');
	let rebuild = await getRebuild(admin);
	assert.deepEqual(
		[rebuild.status, rebuild.queued, rebuild.pendingSince, rebuild.log],
		['running', false, null, 'building\n']
	);

	// a save during the pass: the script will run one more
	await new Promise((resolve) => setTimeout(resolve, 20));
	await post(admin, '/api/config', { home: ALMATY });
	rebuild = await getRebuild(admin);
	assert.deepEqual([rebuild.status, rebuild.queued], ['running', true]);

	await new Promise((resolve) => setTimeout(resolve, 20));
	writeStatus(admin, {
		status: 'ok',
		pass: 2,
		startedAt: new Date().toISOString(),
		finishedAt: new Date().toISOString(),
		exitCode: 0
	});
	rebuild = await getRebuild(admin);
	assert.deepEqual(
		[rebuild.status, rebuild.pass, rebuild.queued, rebuild.pendingSince],
		['ok', 2, false, null]
	);

	const state = await request(admin.port, { path: '/api/state', headers: { cookie } });
	assert.equal(state.json.source, 'saved');
	assert.equal(state.json.countryCode, 'KAZ');
	assert.ok(admin.lines.some((line) => line.startsWith('saved KAZ Almaty')));
});

test('"rebuild again" rewrites the request file, a new file every time', async (t) => {
	const plain = await startAdmin(t);
	assert.equal((await post(plain, '/api/rebuild', {})).status, 409, 'nothing to trigger');

	const admin = await startAdmin(t, { rebuild: true });
	const first = await post(admin, '/api/rebuild', {});
	assert.equal(first.status, 202);
	assert.ok(first.json.rebuild.pendingSince);
	const { rebuildRequestPath } = admin.settings;
	const inode = statSync(rebuildRequestPath).ino;
	assert.equal(statSync(rebuildRequestPath).mode & 0o777, 0o644);
	await post(admin, '/api/rebuild', {});
	assert.notEqual(statSync(rebuildRequestPath).ino, inode, 'the path unit sees a replace');
	assert.equal(existsSync(admin.settings.configPath), false, 'the place itself is untouched');
});

test('a country the globe lacks can be saved', async (t) => {
	const admin = await startAdmin(t);
	const res = await post(admin, '/api/config', {
		home: {
			countryIso3: 'SGP',
			countryName: { en: 'Singapore', ru: 'Сингапур' },
			city: { en: 'Singapore', ru: 'Сингапур' },
			lat: 1.29,
			lon: 103.85,
			timezone: 'Asia/Singapore'
		}
	});
	assert.equal(res.status, 200);
	assert.match(res.json.warnings[0], /нет на карте глобуса/);
	const state = await request(admin.port, { path: '/api/state', headers: { cookie } });
	assert.equal(state.json.countryCode, 'SGP');
});
