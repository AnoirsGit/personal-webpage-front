/*
 * Checks the home-country lookup used by the globe.
 *
 *   node scripts/check-country-codes.js
 *
 * - every ISO_A3 (and every ADM0_A3) in the Natural Earth geojson resolves to its own feature
 * - "-99" ISO codes fall back to ADM0_A3; unknown or malformed codes resolve to nothing
 * - decoded borders match the geojson within the quantisation step
 * - the configured home country resolves and contains the configured home point
 *
 * Exits non-zero on the first broken invariant class; prints one line per check.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { BORDER_QUANT, COUNTRIES } from '../src/lib/entities/globe/countryBorders.js';
import { decodeRings, pointInRings, resolveCountry } from '../src/lib/entities/globe/geodata.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const geojson = JSON.parse(
	readFileSync(resolve(root, 'src/lib/ne_110m_admin_0_countries.geojson'), 'utf8')
);
const config = JSON.parse(readFileSync(resolve(root, 'src/lib/config/site-config.json'), 'utf8'));

let failed = 0;
const check = (label, problems) => {
	if (problems.length) {
		failed++;
		console.log(`FAIL ${label}`);
		for (const problem of problems.slice(0, 10)) console.log(`     ${problem}`);
	} else {
		console.log(`ok   ${label}`);
	}
};

const isCode = (value) => typeof value === 'string' && /^[A-Z]{3}$/.test(value);
const features = geojson.features.map(({ properties }) => properties);

check(
	`generated borders cover all ${features.length} geojson features`,
	COUNTRIES.length === features.length
		? []
		: [`${COUNTRIES.length} entries for ${features.length} features — rerun scene-geodata.js`]
);

const isoCodes = features.filter((p) => isCode(p.ISO_A3));
check(
	`every ISO_A3 resolves to its feature (${isoCodes.length} codes)`,
	isoCodes
		.filter((p) => resolveCountry(COUNTRIES, p.ISO_A3)?.name !== p.NAME)
		.map((p) => `${p.ISO_A3} -> ${resolveCountry(COUNTRIES, p.ISO_A3)?.name ?? 'nothing'}`)
);

const quirks = features.filter((p) => !isCode(p.ISO_A3));
check(
	`ISO_A3 "-99" features resolve by ADM0_A3 (${quirks.map((p) => p.ADM0_A3).join(', ')})`,
	quirks
		.filter((p) => resolveCountry(COUNTRIES, p.ADM0_A3)?.name !== p.NAME)
		.map((p) => `${p.NAME}: ${p.ADM0_A3} -> ${resolveCountry(COUNTRIES, p.ADM0_A3)?.name}`)
);

check(
	'every ADM0_A3 resolves to its feature',
	features
		.filter((p) => resolveCountry(COUNTRIES, p.ADM0_A3)?.name !== p.NAME)
		.map((p) => `${p.ADM0_A3} -> ${resolveCountry(COUNTRIES, p.ADM0_A3)?.name ?? 'nothing'}`)
);

check(
	'unknown and malformed codes resolve to nothing',
	['XXX', 'ZZZ', '-99', '', 'KA', 'KAZZ', null, undefined, 42]
		.filter((code) => resolveCountry(COUNTRIES, code) !== null)
		.map((code) => `${JSON.stringify(code)} resolved`)
);

check(
	'lookup is case- and whitespace-tolerant',
	[' kaz ', 'deu', 'Fra']
		.filter((code) => !resolveCountry(COUNTRIES, code))
		.map((code) => `${JSON.stringify(code)} did not resolve`)
);

const tolerance = 0.5 / BORDER_QUANT + 1e-4;
const roundTrip = [];
geojson.features.forEach((feature, index) => {
	const polygons =
		feature.geometry.type === 'Polygon'
			? [feature.geometry.coordinates]
			: feature.geometry.coordinates;
	const source = polygons.flat();
	const decoded = decodeRings(COUNTRIES[index].rings, BORDER_QUANT);
	if (decoded.length !== source.length) {
		roundTrip.push(
			`${feature.properties.NAME}: ${decoded.length} rings, expected ${source.length}`
		);
		return;
	}
	source.forEach((ring, r) => {
		ring.slice(0, -1).forEach(([lon, lat], v) => {
			const error = Math.max(
				Math.abs(decoded[r][v * 2] - lon),
				Math.abs(decoded[r][v * 2 + 1] - lat)
			);
			if (error > tolerance)
				roundTrip.push(`${feature.properties.NAME} ring ${r} vertex ${v}: ${error}`);
		});
	});
});
check(`decoded borders match the geojson within ${tolerance.toFixed(3)}°`, roundTrip);

const { home } = config;
const homeCountry = resolveCountry(COUNTRIES, home?.countryIso3);
check(
	`site-config home country ${JSON.stringify(home?.countryIso3)} resolves`,
	homeCountry ? [] : ['no feature for the configured code — the globe will skip the highlight']
);
if (homeCountry) {
	const rings = decodeRings(homeCountry.rings, BORDER_QUANT);
	check(
		`home point ${home.lat}, ${home.lon} lies inside ${homeCountry.name}`,
		pointInRings(rings, home.lon, home.lat) ? [] : ['the marker will sit outside the highlight']
	);
}

process.exit(failed ? 1 : 0);
