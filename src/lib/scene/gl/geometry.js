/*
 * Geometry builders. Everything is written into typed arrays in one pass — no per-dot or
 * per-segment three.js objects — so building the whole scene stays well under a frame.
 */
import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';

/** Seeded PRNG (mulberry32) so the sky is the same on every visit. */
export const random = (seed = 1) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const withBounds = (geometry, radius) => {
	geometry.boundingSphere = new Sphere(new Vector3(), radius);
	return geometry;
};

/**
 * @typedef {{
 *   points: ArrayLike<number>,  // xyz triples, at least two points
 *   reveal?: [number, number],  // window in the material's uPhase units
 *   speed?: number,             // pulse laps per second, negative runs backwards
 *   pulses?: number,            // 0..3
 *   seed?: number,
 *   width?: number,             // CSS px
 *   base?: number               // resting brightness 0..1
 * }} FlowLine
 */

/** @param {FlowLine[]} lines */
export const buildFlowLines = (lines) => {
	let segments = 0;
	for (const line of lines) segments += line.points.length / 3 - 1;

	const vertices = segments * 4;
	const aA = new Float32Array(vertices * 3);
	const aB = new Float32Array(vertices * 3);
	const aSide = new Float32Array(vertices);
	const aEnd = new Float32Array(vertices);
	const aT = new Float32Array(vertices * 2);
	const aLine = new Float32Array(vertices * 4);
	const aStyle = new Float32Array(vertices * 4);
	const index = new Uint32Array(segments * 6);
	const position = new Float32Array(vertices * 3);

	let v = 0;
	let s = 0;
	let radius = 1;
	for (const line of lines) {
		const p = line.points;
		const count = p.length / 3;
		// cumulative length for an even 0..1 parameter along the polyline
		const lengths = new Float32Array(count);
		for (let i = 1; i < count; i++) {
			lengths[i] =
				lengths[i - 1] +
				Math.hypot(
					p[i * 3] - p[i * 3 - 3],
					p[i * 3 + 1] - p[i * 3 - 2],
					p[i * 3 + 2] - p[i * 3 - 1]
				);
		}
		const total = lengths[count - 1] || 1;
		const [revealStart, revealEnd] = line.reveal ?? [0, 0.0001];

		for (let i = 0; i < count - 1; i++) {
			const t0 = lengths[i] / total;
			const t1 = lengths[i + 1] / total;
			for (let corner = 0; corner < 4; corner++) {
				const end = corner >> 1;
				const side = corner & 1 ? 1 : -1;
				const src = (i + end) * 3;
				aA.set([p[i * 3], p[i * 3 + 1], p[i * 3 + 2]], v * 3);
				aB.set([p[i * 3 + 3], p[i * 3 + 4], p[i * 3 + 5]], v * 3);
				position.set([p[src], p[src + 1], p[src + 2]], v * 3);
				radius = Math.max(radius, Math.hypot(p[src], p[src + 1], p[src + 2]));
				aSide[v] = side;
				aEnd[v] = end;
				aT[v * 2] = t0;
				aT[v * 2 + 1] = t1;
				aLine.set([revealStart, revealEnd, line.speed ?? 0, line.seed ?? 0], v * 4);
				aStyle.set([line.width ?? 1.2, line.base ?? 0.4, line.pulses ?? 0, 0], v * 4);
				v++;
			}
			// counter-clockwise on screen for any direction (the shader offsets along the
			// left-hand normal), so the default front-face culling keeps them
			const first = v - 4;
			index.set([first, first + 2, first + 1, first + 1, first + 2, first + 3], s * 6);
			s++;
		}
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(position, 3));
	geometry.setAttribute('aA', new BufferAttribute(aA, 3));
	geometry.setAttribute('aB', new BufferAttribute(aB, 3));
	geometry.setAttribute('aSide', new BufferAttribute(aSide, 1));
	geometry.setAttribute('aEnd', new BufferAttribute(aEnd, 1));
	geometry.setAttribute('aT', new BufferAttribute(aT, 2));
	geometry.setAttribute('aLine', new BufferAttribute(aLine, 4));
	geometry.setAttribute('aStyle', new BufferAttribute(aStyle, 4));
	geometry.setIndex(new BufferAttribute(index, 1));
	return withBounds(geometry, radius);
};

/**
 * @typedef {{
 *   position: ArrayLike<number>, size: number, window?: [number, number],
 *   seed?: number, kind?: number
 * }} GlowPoint
 */

/** @param {GlowPoint[]} points */
export const buildGlowPoints = (points) => {
	const n = points.length;
	const position = new Float32Array(n * 3);
	const aSize = new Float32Array(n);
	const aWindow = new Float32Array(n * 2);
	const aSeed = new Float32Array(n);
	const aKind = new Float32Array(n);
	const aIndex = new Float32Array(n);
	let radius = 1;
	points.forEach((point, i) => {
		position.set([point.position[0], point.position[1], point.position[2]], i * 3);
		radius = Math.max(radius, Math.hypot(point.position[0], point.position[1], point.position[2]));
		aSize[i] = point.size;
		aWindow.set(point.window ?? [-1, -0.5], i * 2);
		aSeed[i] = point.seed ?? (i * 0.618034) % 1;
		aKind[i] = point.kind ?? 0;
		aIndex[i] = i;
	});
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(position, 3));
	geometry.setAttribute('aSize', new BufferAttribute(aSize, 1));
	geometry.setAttribute('aWindow', new BufferAttribute(aWindow, 2));
	geometry.setAttribute('aSeed', new BufferAttribute(aSeed, 1));
	geometry.setAttribute('aKind', new BufferAttribute(aKind, 1));
	geometry.setAttribute('aIndex', new BufferAttribute(aIndex, 1));
	return withBounds(geometry, radius + 1);
};

/**
 * A shell of distant stars around the origin. Nearer ones drift more as the camera moves,
 * which is all the parallax the sky needs.
 * @param {number} count
 * @param {{ star: Vector3, warm: Vector3 }} colors
 */
export const buildStarfield = (count, colors) => {
	const rand = random(7);
	const position = new Float32Array(count * 3);
	const aSize = new Float32Array(count);
	const aColor = new Float32Array(count * 3);
	const aTwinkle = new Float32Array(count * 2);
	for (let i = 0; i < count; i++) {
		// uniform direction, radius biased toward the far shell
		const u = rand() * 2 - 1;
		const phi = rand() * Math.PI * 2;
		const ring = Math.sqrt(1 - u * u);
		const r = 140 + 300 * Math.sqrt(rand());
		position[i * 3] = r * ring * Math.cos(phi);
		position[i * 3 + 1] = r * u;
		position[i * 3 + 2] = r * ring * Math.sin(phi);
		// mostly faint, a few bright
		const m = rand();
		aSize[i] = 0.7 + 2.1 * Math.pow(m, 5) + (rand() < 0.012 ? 1.2 : 0);
		const warm = rand() < 0.22 ? 1 : 0;
		const c = warm ? colors.warm : colors.star;
		const brightness = 0.45 + 0.55 * Math.pow(rand(), 0.6);
		aColor[i * 3] = c.x * brightness;
		aColor[i * 3 + 1] = c.y * brightness;
		aColor[i * 3 + 2] = c.z * brightness;
		aTwinkle[i * 2] = 0.4 + rand() * 1.8;
		aTwinkle[i * 2 + 1] = rand() * Math.PI * 2;
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(position, 3));
	geometry.setAttribute('aSize', new BufferAttribute(aSize, 1));
	geometry.setAttribute('aColor', new BufferAttribute(aColor, 3));
	geometry.setAttribute('aTwinkle', new BufferAttribute(aTwinkle, 2));
	return withBounds(geometry, 450);
};

/**
 * Samples a quadratic bow between two points (in a plane spanned by `a`, `b` and `up`).
 * @param {Vector3} a
 * @param {Vector3} b
 * @param {number} bend bow height as a fraction of the distance (signed)
 * @param {Vector3} normal plane normal used to pick the bow direction
 * @param {number} [steps]
 */
export const bow = (a, b, bend, normal, steps = 24) => {
	const out = new Float32Array((steps + 1) * 3);
	const mid = a.clone().add(b).multiplyScalar(0.5);
	const offset = b
		.clone()
		.sub(a)
		.cross(normal)
		.normalize()
		.multiplyScalar(a.distanceTo(b) * bend);
	const control = mid.add(offset);
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const k0 = (1 - t) * (1 - t);
		const k1 = 2 * (1 - t) * t;
		const k2 = t * t;
		out[i * 3] = a.x * k0 + control.x * k1 + b.x * k2;
		out[i * 3 + 1] = a.y * k0 + control.y * k1 + b.y * k2;
		out[i * 3 + 2] = a.z * k0 + control.z * k1 + b.z * k2;
	}
	return out;
};
