/*
 * The camera script. Story time T = section index + progress (hero 0..1 … contact 5..6).
 * Each section holds one shot through the middle of its progress and hands over to the
 * next shot across the section boundary, so scrolling is the only thing that moves it:
 *
 *   hero     the Earth, home facing the viewer, data arcs leaving home
 *   skills   the camera lifts to the sky above the horizon; constellations draw
 *   process  pans right to the process constellation
 *   works    drops to a low orbit: the limb of the Earth under a quiet sky
 *   offer    drifts along the orbit
 *   contact  back to the whole Earth, home in the centre
 *
 * Two layouts: 'wide' (landscape, content on the left, the scene's focus on the right) and
 * 'tall' (phones: the Earth rises from the bottom, constellations stack up the sky).
 */
import { Vector3 } from 'three';

export const SECTION_COUNT = 6;
/** Fraction of each section's progress where its shot is held; the rest is handover. */
export const HOLD_START = 0.15;
export const HOLD_END = 0.8;

const DEG = Math.PI / 180;

/** Unit look direction from yaw (right +) and pitch (up +), yaw 0 looking down −z. */
export const lookDir = (yaw, pitch, out = new Vector3()) =>
	out.set(
		Math.sin(yaw * DEG) * Math.cos(pitch * DEG),
		Math.sin(pitch * DEG),
		-Math.cos(yaw * DEG) * Math.cos(pitch * DEG)
	);

/** @param {'wide' | 'tall'} layout */
export const layoutFor = (width, height) => (width / Math.max(height, 1) < 0.9 ? 'tall' : 'wide');

/** Camera position the sky figures are laid out around. */
export const SKY_ANCHOR = {
	wide: new Vector3(0, 1.6, 20.5),
	tall: new Vector3(0, 1.4, 21.5)
};

/*
 * Where each constellation hangs: yaw/pitch of its centre seen from SKY_ANCHOR, angular
 * size, and the reveal window in "skills phase" units (see phases()).
 */
export const CONSTELLATION_PLACEMENT = {
	wide: {
		agents: { yaw: -7, pitch: 33, size: 15, window: [-0.45, 0.12] },
		llm: { yaw: 12, pitch: 35.5, size: 11, window: [-0.18, 0.38] },
		fullstack: { yaw: -6, pitch: 17, size: 16, window: [0.06, 0.62] },
		infra: { yaw: 14, pitch: 17.5, size: 13, window: [0.3, 0.86] }
	},
	tall: {
		agents: { yaw: 0, pitch: 18, size: 12.5, window: [-0.32, 0.02] },
		llm: { yaw: 0, pitch: 34, size: 10, window: [0.02, 0.36] },
		fullstack: { yaw: 0, pitch: 50, size: 13, window: [0.34, 0.68] },
		infra: { yaw: 0, pitch: 66, size: 12, window: [0.66, 1.0] }
	}
};

/** The process figure: centre, angular width/height, orientation of the flow. */
export const PROCESS_PLACEMENT = {
	wide: { yaw: 49, pitch: 21, width: 24, height: 13, orientation: 'wide' },
	tall: { yaw: 38, pitch: 31, width: 15, height: 30, orientation: 'tall' }
};

/**
 * @typedef {{
 *   pos: Vector3, dir: Vector3, fov: number, shiftX: number, shiftY: number,
 *   spin: number, tilt: number, dim: number, earthFade: number
 * }} Shot
 */

const shot = (pos, dir, fov, shiftX, shiftY, spin, tilt = 1, dim = 1, earthFade = 1) => ({
	pos: new Vector3(...pos),
	dir:
		dir instanceof Vector3
			? dir.clone().normalize()
			: new Vector3(...dir).sub(new Vector3(...pos)).normalize(),
	fov,
	shiftX,
	shiftY,
	spin,
	tilt,
	dim,
	earthFade
});

const ORIGIN = [0, 0, 0];

/*
 * Shots per section as functions of the in-section progress p (0..1 across the hold).
 * spin is degrees of Earth rotation relative to "home faces the camera"; tilt scales how
 * far the Earth leans to bring home's latitude to the centre; dim softens the scene under
 * dense content.
 */
const SHOTS = {
	wide: [
		() => shot([0, 0.4, 22], ORIGIN, 36, 0.38, -0.02, 0),
		(p) =>
			shot(SKY_ANCHOR.wide.toArray(), lookDir(2 + 4 * p, 25 + 2 * p), 40, 0.3, 0.02, 8 + 6 * p),
		(p) => shot([0.6, 1.8, 20.5], lookDir(47 + 3 * p, 20), 40, 0.34, 0.02, 16 + 6 * p),
		(p) => shot([-2.6, 6.6, 8.4], [5 + 2 * p, 6.5, -24], 42, 0.0, 0.0, 24 + 14 * p, 0.55, 0.75),
		(p) => shot([2.8, 6.4, 8.2], [-6 - 2 * p, 6.3, -24], 42, 0.0, 0.0, 44 + 14 * p, 0.55, 0.75),
		() => shot([0, 0.4, 20.5], ORIGIN, 36, 0.36, 0.0, 0)
	],
	tall: [
		() => shot([0, 0.3, 23], ORIGIN, 50, 0, -0.5, 0),
		(p) => shot(SKY_ANCHOR.tall.toArray(), lookDir(0, 18 + 48 * p), 52, 0, 0, 8 + 6 * p),
		(p) => shot([0.6, 1.6, 21.5], lookDir(38, 31 + 2 * p), 54, 0, -0.02, 16 + 6 * p),
		(p) => shot([-1.8, 6.9, 9.0], [3 + 2 * p, 4.6, -24], 54, 0, 0, 24 + 14 * p, 0.55, 0.75),
		(p) => shot([2.0, 6.7, 8.8], [-4 - 2 * p, 4.4, -24], 54, 0, 0, 44 + 14 * p, 0.55, 0.75),
		() => shot([0, 0.3, 22], ORIGIN, 50, 0, -0.38, 0)
	]
};

const smoother = (x) => {
	const t = Math.min(1, Math.max(0, x));
	return t * t * t * (t * (t * 6 - 15) + 10);
};

const lerp = (a, b, t) => a + (b - a) * t;
const tmp = new Vector3();

/**
 * Camera state at story time T.
 * @param {number} T
 * @param {'wide' | 'tall'} layout
 * @param {Shot} out reused between frames
 */
export const evaluateStory = (T, layout, out) => {
	const shots = SHOTS[layout];
	const span = HOLD_END - HOLD_START;
	const handover = 1 - span; // length of the window around each boundary

	for (let k = 1; k < SECTION_COUNT; k++) {
		const from = k - (1 - HOLD_END);
		if (T > from && T < from + handover) {
			const w = smoother((T - from) / handover);
			return blend(shots[k - 1](1), shots[k](0), w, out);
		}
	}
	const i = Math.min(SECTION_COUNT - 1, Math.max(0, Math.floor(T)));
	const p = Math.min(1, Math.max(0, (T - i - HOLD_START) / span));
	return blend(shots[i](p), null, 0, out);
};

/** @param {Shot} a @param {Shot | null} b @param {number} w @param {Shot} out */
const blend = (a, b, w, out) => {
	if (!b || w <= 0) {
		out.pos.copy(a.pos);
		out.dir.copy(a.dir);
		Object.assign(out, {
			fov: a.fov,
			shiftX: a.shiftX,
			shiftY: a.shiftY,
			spin: a.spin,
			tilt: a.tilt,
			dim: a.dim,
			earthFade: a.earthFade
		});
		return out;
	}
	out.pos.lerpVectors(a.pos, b.pos, w);
	// keep the camera outside the atmosphere on the way between two near-Earth shots
	const minRadius = Math.min(a.pos.length(), b.pos.length(), 1e9);
	if (out.pos.length() < minRadius) out.pos.setLength(minRadius);
	// slerp the look direction
	const angle = Math.acos(Math.min(1, Math.max(-1, a.dir.dot(b.dir))));
	if (angle < 1e-4) {
		out.dir.copy(b.dir);
	} else {
		const s = Math.sin(angle);
		out.dir
			.copy(a.dir)
			.multiplyScalar(Math.sin((1 - w) * angle) / s)
			.add(tmp.copy(b.dir).multiplyScalar(Math.sin(w * angle) / s))
			.normalize();
	}
	out.fov = lerp(a.fov, b.fov, w);
	out.shiftX = lerp(a.shiftX, b.shiftX, w);
	out.shiftY = lerp(a.shiftY, b.shiftY, w);
	out.spin = lerp(a.spin, b.spin, w);
	out.tilt = lerp(a.tilt, b.tilt, w);
	out.dim = lerp(a.dim, b.dim, w);
	out.earthFade = lerp(a.earthFade, b.earthFade, w);
	return out;
};

export const createShot = () => shot(ORIGIN, [0, 0, -1], 40, 0, 0, 0);

/**
 * Scroll-driven phases for the reveals (unclamped; the shaders smoothstep their windows).
 * @param {number} T
 */
export const phases = (T) => ({
	skills: (T - (1 + HOLD_START)) / (HOLD_END - HOLD_START),
	process: (T - (2 + HOLD_START)) / (HOLD_END - HOLD_START)
});

const WORLD_UP = new Vector3(0, 1, 0);
const centre = new Vector3();
const right = new Vector3();
const up = new Vector3();

/**
 * World position of a point on a sky figure: the figure lies on a plane facing the anchor,
 * so it keeps its proportions at any pitch.
 * @param {Vector3} anchor camera position the figure is designed for
 * @param {number} yaw centre yaw (deg)
 * @param {number} pitch centre pitch (deg)
 * @param {number} distance from the anchor
 * @param {number} width angular width covered by local x ∈ [−0.5, 0.5] (deg)
 * @param {number} height angular height covered by local y ∈ [−0.5, 0.5] (deg)
 * @param {number} x
 * @param {number} y
 * @param {Vector3} out
 */
export const skyPoint = (anchor, yaw, pitch, distance, width, height, x, y, out) => {
	lookDir(yaw, pitch, centre);
	right.crossVectors(centre, WORLD_UP).normalize();
	up.crossVectors(right, centre);
	const w = 2 * distance * Math.tan((width * DEG) / 2);
	const h = 2 * distance * Math.tan((height * DEG) / 2);
	return out
		.copy(anchor)
		.addScaledVector(centre, distance)
		.addScaledVector(right, x * w)
		.addScaledVector(up, y * h);
};
