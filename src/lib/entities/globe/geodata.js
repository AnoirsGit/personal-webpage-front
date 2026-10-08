/*
 * Decoders for the generated geography (scripts/scene-geodata.js) and the home-country
 * lookup. Plain functions with no three.js or Vite imports, so the Node check script
 * (scripts/check-country-codes.js) exercises exactly the code the globe runs.
 *
 * Coordinates follow the convention of the rest of the globe code:
 *   x = r·cos(lat)·sin(lon), y = r·sin(lat), z = r·cos(lat)·cos(lon)   (lon 0 faces +z)
 */
import { LAND_MASK_HEIGHT, LAND_MASK_RLE, LAND_MASK_STEP, LAND_MASK_WIDTH } from './landMask.js';

const DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VALUE = new Int8Array(128).fill(-1);
for (let i = 0; i < DIGITS.length; i++) VALUE[DIGITS.charCodeAt(i)] = i;

const DEG = Math.PI / 180;

/** @returns {Uint8Array} 1 for land, row-major, row 0 = 90°N, column 0 = 180°W */
export const decodeLandMask = () => {
	const mask = new Uint8Array(LAND_MASK_WIDTH * LAND_MASK_HEIGHT);
	let cell = 0;
	let value = 0;
	let rowEnd = LAND_MASK_WIDTH;
	for (let i = 0; i < LAND_MASK_RLE.length; i += 2) {
		const run = VALUE[LAND_MASK_RLE.charCodeAt(i)] * 64 + VALUE[LAND_MASK_RLE.charCodeAt(i + 1)];
		if (value) mask.fill(1, cell, cell + run);
		cell += run;
		value ^= 1;
		if (cell >= rowEnd) {
			value = 0;
			rowEnd += LAND_MASK_WIDTH;
		}
	}
	return mask;
};

/**
 * @param {Uint8Array} mask from decodeLandMask()
 * @param {number} lat degrees
 * @param {number} lon degrees
 */
export const isLand = (mask, lat, lon) => {
	const row = Math.min(LAND_MASK_HEIGHT - 1, Math.max(0, Math.floor((90 - lat) / LAND_MASK_STEP)));
	const col = Math.min(LAND_MASK_WIDTH - 1, Math.max(0, Math.floor((lon + 180) / LAND_MASK_STEP)));
	return mask[row * LAND_MASK_WIDTH + col] === 1;
};

/**
 * Finds the home country by ISO 3166-1 alpha-3 code. Natural Earth leaves ISO_A3 as "-99"
 * for a few features (France, Norway, Kosovo, …) and uses its own ADM0_A3 for others, so
 * the ISO code is tried first and ADM0_A3 second. Unknown or malformed code → null.
 *
 * @template {{ iso: string | null, adm: string | null }} T
 * @param {T[]} countries COUNTRIES from ./countryBorders.js
 * @param {unknown} code
 * @returns {T | null}
 */
export const resolveCountry = (countries, code) => {
	if (typeof code !== 'string') return null;
	const wanted = code.trim().toUpperCase();
	if (!/^[A-Z]{3}$/.test(wanted)) return null;
	return (
		countries.find((country) => country.iso === wanted) ??
		countries.find((country) => country.adm === wanted) ??
		null
	);
};

/**
 * @param {string} encoded rings joined with "~", varint deltas (see the generator)
 * @param {number} quant units per degree
 * @returns {Float32Array[]} each ring as [lon, lat, lon, lat, …] in degrees, not closed
 */
export const decodeRings = (encoded, quant) =>
	encoded.split('~').map((ring) => {
		const numbers = [];
		let value = 0;
		let shift = 1;
		for (let i = 0; i < ring.length; i++) {
			const digit = VALUE[ring.charCodeAt(i)];
			value += (digit & 31) * shift;
			if (digit & 32) {
				shift *= 32;
				continue;
			}
			numbers.push(value % 2 ? -(value + 1) / 2 : value / 2);
			value = 0;
			shift = 1;
		}
		const out = new Float32Array(numbers.length);
		let lon = 0;
		let lat = 0;
		for (let i = 0; i < numbers.length; i += 2) {
			lon += numbers[i];
			lat += numbers[i + 1];
			out[i] = lon / quant;
			out[i + 1] = lat / quant;
		}
		return out;
	});

/**
 * Even-odd test over all rings of a country (holes and islands included).
 * @param {Float32Array[]} rings from decodeRings()
 * @param {number} lon
 * @param {number} lat
 */
export const pointInRings = (rings, lon, lat) => {
	let inside = false;
	for (const ring of rings) {
		const n = ring.length;
		for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
			const yi = ring[i + 1];
			const yj = ring[j + 1];
			if (yi > lat === yj > lat) continue;
			const x = ring[i] + ((lat - yi) * (ring[j] - ring[i])) / (yj - yi);
			if (lon < x) inside = !inside;
		}
	}
	return inside;
};

/**
 * @param {number} lat degrees
 * @param {number} lon degrees
 * @param {number} radius
 * @param {number[] | Float32Array} [out]
 * @param {number} [offset]
 */
export const latLonToXYZ = (lat, lon, radius, out = [0, 0, 0], offset = 0) => {
	const cosLat = Math.cos(lat * DEG);
	out[offset] = radius * cosLat * Math.sin(lon * DEG);
	out[offset + 1] = radius * Math.sin(lat * DEG);
	out[offset + 2] = radius * cosLat * Math.cos(lon * DEG);
	return out;
};
