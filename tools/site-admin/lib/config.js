/*
 * The place block of site-config.json (`home`) — validation shared by the admin and by
 * apply-config.js (the deploy), and the atomic write of the admin's file.
 *
 * Contract (src/lib/config/site-config.json; read by src/lib/shared/i18n/location.js,
 * src/lib/scene/data/places.js and src/lib/seo/jsonld.js at build time):
 *
 *   home.countryIso3   a code the globe resolves (ISO_A3, else ADM0_A3) — see countries.js
 *   home.countryName   { en, ru }  shown as {country} in the copy and on the globe label
 *   home.city          { en, ru }  shown as {city}; JSON-LD addressLocality
 *   home.lat, home.lon degrees; the home marker, arcs and JSON-LD geo. Rounded to 0.01°
 *                      (about 1 km): the site shows a city, not an address
 *   home.timezone      IANA zone; the copy shows its UTC offset at build time
 *
 * Error messages are Russian: the admin page shows them next to the fields.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, promises as fs } from 'node:fs';
import { basename, dirname, join, parse, resolve } from 'node:path';

import { pointInCountry, resolveCountry } from './countries.js';

export const NAME_MAX = 80;
// control characters and angle brackets: never needed in a place name
// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[\u0000-\u001f\u007f-\u009f<>]/;
const ZONE_SHAPE = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){0,2}$/;

let zoneList = null;
const supportedZones = () => {
	if (!zoneList) {
		try {
			zoneList = Intl.supportedValuesOf('timeZone');
		} catch {
			zoneList = [];
		}
	}
	return zoneList;
};

/**
 * An IANA time zone name that Intl accepts, in its canonical spelling ("asia/almaty" →
 * "Asia/Almaty"); null for anything else, including offsets like "+05:00".
 */
export const normalizeTimeZone = (value) => {
	if (typeof value !== 'string') return null;
	const zone = value.trim();
	if (zone.length > 64 || !ZONE_SHAPE.test(zone)) return null;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: zone });
	} catch {
		return null;
	}
	const lower = zone.toLowerCase();
	return supportedZones().find((known) => known.toLowerCase() === lower) || zone;
};

const round2 = (value) => Math.round(value * 100) / 100 || 0; // `|| 0`: no -0

const parseCoordinate = (value, limit) => {
	let number = NaN;
	if (typeof value === 'number') number = value;
	else if (typeof value === 'string' && value.trim()) {
		// "43,24" from a Russian keyboard, "−12.5" with a typographic minus
		number = Number(value.trim().replace(',', '.').replace('−', '-'));
	}
	return Number.isFinite(number) && Math.abs(number) <= limit ? round2(number) : null;
};

const cleanName = (value) =>
	typeof value === 'string' ? value.normalize('NFC').replace(/\s+/g, ' ').trim() : '';

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const FIELD_LABELS = {
	'countryName.en': 'название страны по-английски',
	'countryName.ru': 'название страны по-русски',
	'city.en': 'город по-английски',
	'city.ru': 'город по-русски'
};

/**
 * @param {unknown} input the `home` object from the page or the saved file
 * @param {{ countries: ReturnType<typeof import('./countries.js').countriesFromGeoJson> }} options
 * @returns {{ ok: true, home: object, warnings: string[] } | { ok: false, errors: Record<string, string>, warnings: string[] }}
 */
export const validateHome = (input, { countries }) => {
	const errors = {};
	const warnings = [];
	if (!isObject(input)) {
		return { ok: false, errors: { home: 'Нет данных о месте (home)' }, warnings };
	}

	const country = resolveCountry(countries, input.countryIso3);
	if (!country) {
		const given = typeof input.countryIso3 === 'string' ? input.countryIso3.trim() : '';
		errors.countryIso3 = given
			? `Такой страны нет на глобусе: ${given.slice(0, 12)}`
			: 'Выберите страну из списка';
	}

	const names = {};
	for (const group of ['countryName', 'city']) {
		names[group] = {};
		for (const lang of ['en', 'ru']) {
			const key = `${group}.${lang}`;
			const value = cleanName(isObject(input[group]) ? input[group][lang] : '');
			if (!value) errors[key] = `Укажите ${FIELD_LABELS[key]}`;
			else if (value.length > NAME_MAX) errors[key] = `Не длиннее ${NAME_MAX} символов`;
			else if (FORBIDDEN.test(value)) errors[key] = 'Без символов < > и управляющих символов';
			names[group][lang] = value;
		}
	}

	const lat = parseCoordinate(input.lat, 90);
	if (lat === null) errors.lat = 'Широта — число от −90 до 90';
	const lon = parseCoordinate(input.lon, 180);
	if (lon === null) errors.lon = 'Долгота — число от −180 до 180';

	const timezone = normalizeTimeZone(input.timezone);
	if (!timezone) errors.timezone = 'Нужен часовой пояс IANA, например Asia/Almaty';

	if (Object.keys(errors).length) return { ok: false, errors, warnings };

	if (!pointInCountry(country, lat, lon)) {
		warnings.push(
			`Точка ${lat}, ${lon} лежит вне границ страны на карте глобуса — метка встанет вне подсветки.`
		);
	}
	return {
		ok: true,
		home: {
			countryIso3: country.code,
			countryName: names.countryName,
			city: names.city,
			lat,
			lon,
			timezone
		},
		warnings
	};
};

/** The whole file the admin writes: `{ home }`. */
export const validateConfig = (body, options) => {
	if (!isObject(body)) {
		return { ok: false, errors: { home: 'Нет данных о месте (home)' }, warnings: [] };
	}
	const result = validateHome(body.home, options);
	return result.ok
		? { ok: true, config: { home: result.home }, warnings: result.warnings }
		: result;
};

export const serializeConfig = (config) => `${JSON.stringify(config, null, '\t')}\n`;

/**
 * Writes `data` to `target` so that a reader sees either the old file or the complete new
 * one: a private (0600) temp file in the same directory, fsync, chmod to `mode`, rename
 * over the target, fsync the directory. A symlink at `target` is replaced, not followed.
 * `onTempWritten(tempPath)` runs after the data is synced, before the chmod (tests).
 */
export const writeFileAtomic = async (target, data, { mode = 0o644, onTempWritten } = {}) => {
	const directory = dirname(target);
	const temp = join(
		directory,
		`.${basename(target)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`
	);
	let handle = null;
	try {
		handle = await fs.open(temp, 'wx', 0o600);
		await handle.writeFile(data);
		await handle.sync();
		if (onTempWritten) await onTempWritten(temp);
		await handle.chmod(mode);
		await handle.close();
		handle = null;
		await fs.rename(temp, target);
	} catch (error) {
		if (handle) await handle.close().catch(() => {});
		await fs.rm(temp, { force: true }).catch(() => {});
		throw error;
	}
	try {
		const dir = await fs.open(directory, 'r');
		try {
			await dir.sync();
		} finally {
			await dir.close();
		}
	} catch {
		// some filesystems refuse fsync on a directory; the rename itself is still atomic
	}
};

/** Parsed JSON, or null when the file does not exist. */
export const readJsonFile = async (path) => {
	let raw;
	try {
		raw = await fs.readFile(path, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') return null;
		throw error;
	}
	return JSON.parse(raw);
};

/** True when `path` sits inside a git work tree (some parent directory holds `.git`). */
export const isInsideGitWorkTree = (path) => {
	let directory = dirname(resolve(path));
	const { root } = parse(directory);
	for (;;) {
		if (existsSync(join(directory, '.git'))) return true;
		if (directory === root) return false;
		directory = dirname(directory);
	}
};
