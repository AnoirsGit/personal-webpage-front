import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	lstatSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	statSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { pointInCountry, resolveCountry } from '../lib/countries.js';
import {
	normalizeTimeZone,
	serializeConfig,
	validateConfig,
	validateHome,
	writeFileAtomic
} from '../lib/config.js';
import { APPLY_CONFIG, GEORGIA, getCountries, tempDir } from './helpers.js';

const validate = (home) => validateHome(home, { countries: getCountries() });
const mode = (path) => statSync(path).mode & 0o777;

test('the country list covers the globe data with names and inside label points', () => {
	const countries = getCountries();
	assert.equal(countries.length, 177);
	assert.equal(new Set(countries.map((country) => country.code)).size, 177, 'codes are unique');
	for (const country of countries) {
		assert.ok(country.en && country.ru, `${country.code} has both names`);
		assert.ok(pointInCountry(country, country.lat, country.lon), `${country.code} label inside`);
	}
	const kaz = resolveCountry(countries, ' kaz ');
	assert.deepEqual([kaz.code, kaz.en, kaz.ru], ['KAZ', 'Kazakhstan', 'Казахстан']);
	// Natural Earth has ISO_A3 "-99" for France: the code falls back to ADM0_A3
	assert.equal(resolveCountry(countries, 'FRA').ru, 'Франция');
	assert.equal(resolveCountry(countries, 'XXX'), null);
	assert.equal(resolveCountry(countries, 'KA'), null);
});

test('a valid place is normalized', () => {
	const result = validate({
		countryIso3: ' geo ',
		countryName: { en: ' Georgia ', ru: 'Грузия' },
		city: { en: 'Tbilisi', ru: '  Тбилиси  ' },
		lat: '41,7151',
		lon: 44.8271,
		timezone: 'asia/tbilisi',
		extra: 'dropped'
	});
	assert.equal(result.ok, true, JSON.stringify(result.errors));
	assert.deepEqual(result.home, GEORGIA);
	assert.deepEqual(Object.keys(result.home), [
		'countryIso3',
		'countryName',
		'city',
		'lat',
		'lon',
		'timezone'
	]);
	assert.deepEqual(result.warnings, []);
});

test('a France code resolves through ADM0_A3', () => {
	const result = validate({
		...GEORGIA,
		countryIso3: 'fra',
		countryName: { en: 'France', ru: 'Франция' },
		city: { en: 'Paris', ru: 'Париж' },
		lat: 48.86,
		lon: 2.35,
		timezone: 'Europe/Paris'
	});
	assert.equal(result.ok, true);
	assert.equal(result.home.countryIso3, 'FRA');
});

test('bad fields are reported by name, in Russian', () => {
	const result = validate({
		countryIso3: 'XXX',
		countryName: { en: '', ru: 'x'.repeat(81) },
		city: { en: 'Tbi<script>', ru: 'Тби\u0007лиси' },
		lat: 91,
		lon: 'east',
		timezone: 'Mars/Olympus_Mons'
	});
	assert.equal(result.ok, false);
	assert.deepEqual(Object.keys(result.errors).sort(), [
		'city.en',
		'city.ru',
		'countryIso3',
		'countryName.en',
		'countryName.ru',
		'lat',
		'lon',
		'timezone'
	]);
	assert.match(result.errors.countryIso3, /нет на глобусе/);
	assert.match(result.errors.lat, /−90 до 90/);
	assert.equal(validate(null).ok, false);
	assert.equal(
		validate({ ...GEORGIA, countryIso3: '' }).errors.countryIso3,
		'Выберите страну из списка'
	);
	assert.equal(validate({ ...GEORGIA, lon: -180.01 }).ok, false);
	assert.equal(validate({ ...GEORGIA, lon: '' }).ok, false);
	assert.equal(validate({ ...GEORGIA, lat: -0.001 }).home.lat, 0, 'no negative zero');
	assert.equal(validateConfig('nope', { countries: getCountries() }).ok, false);
	assert.equal(validateConfig({}, { countries: getCountries() }).ok, false);
});

test('time zones: IANA names only, canonical spelling', () => {
	assert.equal(normalizeTimeZone('Asia/Almaty'), 'Asia/Almaty');
	assert.equal(normalizeTimeZone(' europe/berlin '), 'Europe/Berlin');
	assert.equal(
		normalizeTimeZone('America/Argentina/Buenos_Aires'),
		'America/Argentina/Buenos_Aires'
	);
	assert.equal(normalizeTimeZone('UTC'), 'UTC');
	assert.equal(
		normalizeTimeZone('Asia/Almaty\n'),
		'Asia/Almaty',
		'surrounding whitespace is trimmed'
	);
	for (const bad of ['', 'Mars/Phobos', '+05:00', 'GMT+5:00', 'Asia/Al maty', 'a'.repeat(70), 5]) {
		assert.equal(normalizeTimeZone(bad), null, JSON.stringify(bad));
	}
});

test('a point outside the chosen country is saved with a warning', () => {
	const result = validate({ ...GEORGIA, lat: 48.86, lon: 2.35 });
	assert.equal(result.ok, true);
	assert.equal(result.warnings.length, 1);
	assert.match(result.warnings[0], /вне границ/);
});

test('atomic write: private temp file, final mode 0644, nothing left behind', async (t) => {
	const dir = tempDir(t);
	const target = join(dir, 'site-config.json');
	writeFileSync(target, 'old', { mode: 0o600 });
	let tempMode = null;
	let targetDuringWrite = null;
	await writeFileAtomic(target, serializeConfig({ home: GEORGIA }), {
		onTempWritten: (temp) => {
			tempMode = mode(temp);
			targetDuringWrite = readFileSync(target, 'utf8');
		}
	});
	assert.equal(tempMode, 0o600, 'the temp file is private while written');
	assert.equal(targetDuringWrite, 'old', 'readers see the old file until the rename');
	assert.equal(mode(target), 0o644);
	assert.deepEqual(JSON.parse(readFileSync(target, 'utf8')), { home: GEORGIA });
	assert.deepEqual(readdirSync(dir), ['site-config.json']);
});

test('atomic write: a failure keeps the old file and removes the temp file', async (t) => {
	const dir = tempDir(t);
	const target = join(dir, 'site-config.json');
	writeFileSync(target, 'old');
	await assert.rejects(
		writeFileAtomic(target, 'new', {
			onTempWritten: () => {
				throw new Error('disk full');
			}
		}),
		/disk full/
	);
	assert.equal(readFileSync(target, 'utf8'), 'old');
	assert.deepEqual(readdirSync(dir), ['site-config.json']);

	// the rename itself failing (the target is a non-empty directory) cleans up too
	const blocked = join(dir, 'blocked');
	mkdirSync(blocked);
	writeFileSync(join(blocked, 'keep'), 'x');
	await assert.rejects(writeFileAtomic(blocked, 'new'));
	assert.deepEqual(readdirSync(dir).sort(), ['blocked', 'site-config.json']);
});

test('atomic write: a symlink at the target is replaced, not written through', async (t) => {
	const dir = tempDir(t);
	const outside = join(dir, 'outside.txt');
	const target = join(dir, 'site-config.json');
	writeFileSync(outside, 'outside');
	symlinkSync(outside, target);
	await writeFileAtomic(target, 'new');
	assert.equal(lstatSync(target).isSymbolicLink(), false);
	assert.equal(readFileSync(target, 'utf8'), 'new');
	assert.equal(readFileSync(outside, 'utf8'), 'outside');
});

test('atomic write: concurrent writes leave one complete version', async (t) => {
	const dir = tempDir(t);
	const target = join(dir, 'site-config.json');
	const versions = Array.from({ length: 20 }, (_, i) =>
		serializeConfig({ home: { ...GEORGIA, lat: i, padding: 'x'.repeat(5000 + i) } })
	);
	await Promise.all(versions.map((data) => writeFileAtomic(target, data)));
	assert.ok(versions.includes(readFileSync(target, 'utf8')));
	assert.deepEqual(readdirSync(dir), ['site-config.json']);
});

const applyConfig = (saved, target) =>
	spawnSync(process.execPath, [APPLY_CONFIG, saved, target], { encoding: 'utf8' });

test('apply-config (deploy): replaces home, keeps the rest, refuses what it cannot trust', (t) => {
	const dir = tempDir(t);
	const saved = join(dir, 'saved.json');
	const target = join(dir, 'site-config.json');
	const original = serializeConfig({ home: { countryIso3: 'KAZ' }, other: { keep: true } });
	writeFileSync(target, original);

	writeFileSync(saved, JSON.stringify({ home: { ...GEORGIA, lat: '41,7151' } }));
	const ok = applyConfig(saved, target);
	assert.equal(ok.status, 0, ok.stderr);
	assert.equal(ok.stdout.trim(), 'Tbilisi, Georgia (GEO) 41.72, 44.83 Asia/Tbilisi');
	assert.deepEqual(JSON.parse(readFileSync(target, 'utf8')), {
		home: GEORGIA,
		other: { keep: true }
	});

	writeFileSync(target, original);
	const link = join(dir, 'link.json');
	symlinkSync(saved, link);
	const symlinked = applyConfig(link, target);
	assert.equal(symlinked.status, 1);
	assert.match(symlinked.stderr, /symlink/);

	writeFileSync(saved, JSON.stringify({ home: { ...GEORGIA, lat: 123 } }));
	const invalid = applyConfig(saved, target);
	assert.equal(invalid.status, 1);
	assert.match(invalid.stderr, /lat:/);

	writeFileSync(saved, JSON.stringify({ home: GEORGIA, pad: 'x'.repeat(70 * 1024) }));
	const big = applyConfig(saved, target);
	assert.equal(big.status, 1);
	assert.match(big.stderr, /larger than/);

	writeFileSync(saved, '{ not json');
	assert.equal(applyConfig(saved, target).status, 1);

	assert.equal(readFileSync(target, 'utf8'), original, 'refusals leave the checkout alone');
});
