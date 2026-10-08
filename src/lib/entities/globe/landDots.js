/*
 * Dot-matrix land for the scene globe: rows of evenly spaced dots (staggered every other
 * row), kept where the land raster says land. The home country — whichever one
 * site-config.json names — gets its own grid, 1.3× denser, marked with aHome = 1 so the
 * shader can warm it towards the accent.
 */
import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';

import { decodeLandMask, isLand, latLonToXYZ, pointInRings } from './geodata.js';

const DEG = Math.PI / 180;

/**
 * @param {{
 *   spacing: number,  // degrees between neighbouring dots
 *   radius: number,
 *   home: { bbox: number[], rings: Float32Array[] } | null
 * }} options
 */
export const buildLandDots = ({ spacing, radius, home }) => {
	const mask = decodeLandMask();
	const positions = [];
	const randoms = [];
	const homes = [];
	let seed = 0x9e3779b9;
	const random = () => {
		seed ^= seed << 13;
		seed ^= seed >>> 17;
		seed ^= seed << 5;
		return (seed >>> 0) / 4294967296;
	};

	const inHome = (lat, lon) =>
		home !== null &&
		lon >= home.bbox[0] &&
		lon <= home.bbox[2] &&
		lat >= home.bbox[1] &&
		lat <= home.bbox[3] &&
		pointInRings(home.rings, lon, lat);

	const xyz = [0, 0, 0];
	const push = (lat, lon, isHome) => {
		latLonToXYZ(lat, lon, radius, xyz);
		positions.push(xyz[0], xyz[1], xyz[2]);
		randoms.push(random());
		homes.push(isHome);
	};

	const rows = Math.round(180 / spacing);
	for (let row = 0; row < rows; row++) {
		const lat = 90 - ((row + 0.5) * 180) / rows;
		const count = Math.max(1, Math.round((360 / spacing) * Math.cos(lat * DEG)));
		const stagger = (row % 2) * 0.5;
		for (let col = 0; col < count; col++) {
			const lon = -180 + ((col + stagger) * 360) / count;
			if (!isLand(mask, lat, lon) || inHome(lat, lon)) continue;
			push(lat, lon, 0);
		}
	}

	if (home) {
		const fine = spacing / 1.3;
		const [west, south, east, north] = home.bbox;
		let row = 0;
		for (let lat = south + fine / 2; lat < north; lat += fine, row++) {
			const step = fine / Math.max(Math.cos(lat * DEG), 0.15);
			for (let lon = west + step * (0.25 + (row % 2) * 0.5); lon < east; lon += step) {
				if (pointInRings(home.rings, lon, lat)) push(lat, lon, 1);
			}
		}
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
	geometry.setAttribute('aRand', new BufferAttribute(new Float32Array(randoms), 1));
	geometry.setAttribute('aHome', new BufferAttribute(new Float32Array(homes), 1));
	geometry.boundingSphere = new Sphere(new Vector3(), radius * 1.05);
	return geometry;
};

/**
 * Samples a great-circle arc lifted above the surface. Long hops get a lower lift and a
 * slight sideways bow, so an arc seen edge-on (home → its antipode region) still reads
 * as a curve instead of a straight beam.
 * @param {{ lat: number, lon: number }} from
 * @param {{ lat: number, lon: number }} to
 * @param {number} radius
 */
export const arcPoints = (from, to, radius) => {
	const a = new Vector3(...latLonToXYZ(from.lat, from.lon, 1));
	const b = new Vector3(...latLonToXYZ(to.lat, to.lon, 1));
	const angle = a.angleTo(b);
	const steps = Math.max(24, Math.round(angle / DEG));
	const share = angle / Math.PI;
	const lift = 0.035 + 0.12 * share;
	const bow = 0.5 * share * share;
	// bow eastward of the start, so long arcs sweep across the face of the globe
	const side = new Vector3().crossVectors(a, b).normalize();
	const east = new Vector3(Math.cos(from.lon * DEG), 0, -Math.sin(from.lon * DEG));
	if (side.dot(east) < 0) side.negate();
	const out = new Float32Array((steps + 1) * 3);
	const sin = Math.sin(angle) || 1;
	const p = new Vector3();
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const hump = Math.sin(Math.PI * t);
		p.copy(a)
			.multiplyScalar(Math.sin((1 - t) * angle) / sin)
			.addScaledVector(b, Math.sin(t * angle) / sin)
			.addScaledVector(side, bow * hump)
			.normalize()
			.multiplyScalar(radius * (1.008 + lift * hump));
		out[i * 3] = p.x;
		out[i * 3 + 1] = p.y;
		out[i * 3 + 2] = p.z;
	}
	return out;
};

/**
 * A country border as closed polylines just above the surface, densified to follow the
 * curvature (≤ 1° per segment).
 * @param {Float32Array[]} rings [lon, lat, …] per ring
 * @param {number} radius
 */
export const borderLines = (rings, radius) =>
	rings.map((ring) => {
		const out = [];
		const xyz = [0, 0, 0];
		const n = ring.length / 2;
		for (let i = 0; i <= n; i++) {
			const lon0 = ring[(i % n) * 2];
			const lat0 = ring[(i % n) * 2 + 1];
			if (i > 0) {
				const lon1 = ring[((i - 1) % n) * 2];
				const lat1 = ring[((i - 1) % n) * 2 + 1];
				const steps = Math.ceil(Math.max(Math.abs(lon0 - lon1), Math.abs(lat0 - lat1)));
				for (let s = 1; s < steps; s++) {
					const t = s / steps;
					latLonToXYZ(lat1 + (lat0 - lat1) * t, lon1 + (lon0 - lon1) * t, radius, xyz);
					out.push(xyz[0], xyz[1], xyz[2]);
				}
			}
			latLonToXYZ(lat0, lon0, radius, xyz);
			out.push(xyz[0], xyz[1], xyz[2]);
		}
		return new Float32Array(out);
	});
