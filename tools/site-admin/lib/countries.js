/*
 * Every country the admin offers, in two groups.
 *
 * On the globe (onGlobe: true): one entry per feature of the Natural Earth 1:110m file
 * src/lib/ne_110m_admin_0_countries.geojson, the same file the scene's borders are
 * generated from (scripts/scene-geodata.js). The globe highlights these.
 *
 *   code      what site-config.json stores as home.countryIso3: ISO_A3, or ADM0_A3 where
 *             Natural Earth has "-99" (France, Norway, Kosovo, …), the order the globe
 *             resolves codes in (src/lib/entities/globe/geodata.js)
 *   en        NAME, or NAME_LONG where NAME is abbreviated ("Dem. Rep. Congo")
 *   ru        NAME_RU when the file has it; the release in the repo does not, so the CLDR
 *             name by ISO_A2 (Intl.DisplayNames); two features without any ISO code get a
 *             fixed name
 *   lat, lon  LABEL_Y / LABEL_X when the file has them, else a point inside the largest
 *             polygon (its centroid, or the grid point farthest from the border)
 *
 * Other countries (onGlobe: false): the rest of ISO 3166-1 (./iso3166.js) — Singapore,
 * Malta, Hong Kong… — named by Intl.DisplayNames, with no polygon and no label point. The
 * site resolves no feature for their code, so the globe highlights nothing and the home
 * marker still stands at the saved coordinates, which the owner types in.
 *
 * The polygons stay on the server for the "is the point inside the country" check;
 * toPublic() is what the page gets.
 */
import { readFileSync } from 'node:fs';

import { ISO_3166_1 } from './iso3166.js';

const CODE = /^[A-Z]{3}$/;
const A2 = /^[A-Z]{2}$/;

// Natural Earth has ISO_A2 "-99" for these two, though both have an ISO code
const A2_BY_ADM = { FRA: 'FR', NOR: 'NO' };
// no ISO 3166 code at all, so no CLDR name either
const RU_BY_ADM = { CYN: 'Северный Кипр', SOL: 'Сомалиленд' };

const regionNames = (locale) => {
	try {
		return new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
	} catch {
		return null;
	}
};
const RU_NAMES = regionNames('ru');
const EN_NAMES = regionNames('en');

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const code = (value) => (typeof value === 'string' && CODE.test(value) ? value : null);
const round2 = (value) => Math.round(value * 100) / 100 || 0;

const regionName = (names, a2) => {
	if (!names || !A2.test(a2)) return '';
	try {
		return names.of(a2) || '';
	} catch {
		return '';
	}
};

/** @returns {number[][][][]} polygons → rings → [lon, lat] points */
const polygonsOf = (geometry) => {
	if (!geometry) return [];
	if (geometry.type === 'Polygon') return [geometry.coordinates];
	if (geometry.type === 'MultiPolygon') return geometry.coordinates;
	return [];
};

/** Even-odd test over the given rings (outer rings, holes and islands alike). */
export const pointInRings = (rings, lon, lat) => {
	let inside = false;
	for (const ring of rings) {
		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const [xi, yi] = ring[i];
			const [xj, yj] = ring[j];
			if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
				inside = !inside;
			}
		}
	}
	return inside;
};

const ringCentroid = (ring) => {
	let area = 0;
	let x = 0;
	let y = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [x0, y0] = ring[j];
		const [x1, y1] = ring[i];
		const cross = x0 * y1 - x1 * y0;
		area += cross;
		x += (x0 + x1) * cross;
		y += (y0 + y1) * cross;
	}
	if (!area) return null;
	return { area: Math.abs(area / 2), lon: x / (3 * area), lat: y / (3 * area) };
};

const segmentDistance = (px, py, [ax, ay], [bx, by]) => {
	const dx = bx - ax;
	const dy = by - ay;
	const length = dx * dx + dy * dy;
	const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
	return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const borderDistance = (rings, lon, lat) => {
	let best = Infinity;
	for (const ring of rings) {
		for (let i = 1; i < ring.length; i++) {
			best = Math.min(best, segmentDistance(lon, lat, ring[i - 1], ring[i]));
		}
	}
	return best;
};

/** The grid point inside the polygon that is farthest from its border. */
const deepestPoint = (polygon, steps = 40) => {
	const [outer] = polygon;
	const lons = outer.map(([lon]) => lon);
	const lats = outer.map(([, lat]) => lat);
	const west = Math.min(...lons);
	const east = Math.max(...lons);
	const south = Math.min(...lats);
	const north = Math.max(...lats);
	let best = null;
	for (let row = 0; row < steps; row++) {
		for (let col = 0; col < steps; col++) {
			const lon = west + ((col + 0.5) / steps) * (east - west);
			const lat = south + ((row + 0.5) / steps) * (north - south);
			if (!pointInRings(polygon, lon, lat)) continue;
			const depth = borderDistance(polygon, lon, lat);
			if (!best || depth > best.depth) best = { lon, lat, depth };
		}
	}
	return best || { lon: outer[0][0], lat: outer[0][1] };
};

const labelPoint = (properties, polygons) => {
	if (Number.isFinite(properties.LABEL_Y) && Number.isFinite(properties.LABEL_X)) {
		return { lat: properties.LABEL_Y, lon: properties.LABEL_X };
	}
	let largest = null;
	for (const polygon of polygons) {
		const centroid = polygon[0] && ringCentroid(polygon[0]);
		if (centroid && (!largest || centroid.area > largest.centroid.area)) {
			largest = { polygon, centroid };
		}
	}
	if (!largest) return { lat: 0, lon: 0 };
	const { polygon, centroid } = largest;
	return pointInRings(polygon, centroid.lon, centroid.lat) ? centroid : deepestPoint(polygon);
};

const featureToCountry = ({ properties = {}, geometry }) => {
	const iso3 = code(properties.ISO_A3);
	const adm3 = code(properties.ADM0_A3);
	const countryCode = iso3 || adm3;
	if (!countryCode) return null;
	const a2 = A2.test(properties.ISO_A2) ? properties.ISO_A2 : A2_BY_ADM[adm3] || '';
	const name = text(properties.NAME);
	const en = name.includes('.') && text(properties.NAME_LONG) ? text(properties.NAME_LONG) : name;
	const ru = text(properties.NAME_RU) || regionName(RU_NAMES, a2) || RU_BY_ADM[adm3] || '';
	const polygons = polygonsOf(geometry);
	const { lat, lon } = labelPoint(properties, polygons);
	return {
		code: countryCode,
		iso3,
		adm3,
		a2,
		en: en || countryCode,
		ru,
		lat: round2(lat),
		lon: round2(lon),
		rings: polygons.flat(),
		onGlobe: true
	};
};

const byRussianName = (a, b) => (a.ru || a.en).localeCompare(b.ru || b.en, 'ru');

/** ISO 3166-1 countries the globe data does not have, named by Intl.DisplayNames. */
export const otherCountries = (globe) => {
	const known = new Set();
	for (const country of globe) {
		for (const value of [country.iso3, country.adm3, country.a2]) if (value) known.add(value);
	}
	return ISO_3166_1.filter(([a2, a3]) => !known.has(a3) && !known.has(a2))
		.map(([a2, a3]) => ({
			code: a3,
			iso3: a3,
			adm3: null,
			a2,
			en: regionName(EN_NAMES, a2) || a3,
			ru: regionName(RU_NAMES, a2),
			lat: null,
			lon: null,
			rings: null,
			onGlobe: false
		}))
		.sort(byRussianName);
};

/** The globe's countries (sorted by their Russian name), then the other ISO countries. */
export const countriesFromGeoJson = (geojson) => {
	const globe = (geojson.features || []).map(featureToCountry).filter(Boolean).sort(byRussianName);
	return globe.concat(otherCountries(globe));
};

export const loadCountries = (path) => countriesFromGeoJson(JSON.parse(readFileSync(path, 'utf8')));

/**
 * Same lookup as the globe: ISO_A3 first, ADM0_A3 second; case and surrounding spaces do
 * not matter; anything that is not three letters resolves to nothing. The other countries
 * resolve here by their ISO code too (onGlobe: false); the globe itself will not find them.
 */
export const resolveCountry = (countries, value) => {
	if (typeof value !== 'string') return null;
	const wanted = value.trim().toUpperCase();
	if (!CODE.test(wanted)) return null;
	return (
		countries.find((country) => country.iso3 === wanted) ||
		countries.find((country) => country.adm3 === wanted) ||
		null
	);
};

export const pointInCountry = (country, lat, lon) =>
	Boolean(country.rings) && pointInRings(country.rings, lon, lat);

/** What the page needs about a country (no polygons). */
export const toPublic = ({ code: countryCode, a2, en, ru, lat, lon, onGlobe }) => ({
	code: countryCode,
	a2,
	en,
	ru,
	lat,
	lon,
	onGlobe
});
