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
 *
 * The whole-Earth shots (hero, contact) are framed from the viewport: see earthFraming().
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
 * Where each constellation hangs, keyed by the group ids of buildConstellations()
 * (content.skill-tree.js): yaw/pitch of its centre seen from SKY_ANCHOR, angular size, and
 * the reveal window in "skills phase" units (see phases()). Wide screens keep the figures
 * right of the section's text column; phones stack them up the sky the camera climbs.
 */
export const CONSTELLATION_PLACEMENT = {
	wide: {
		agents: { yaw: 10, pitch: 33, size: 10.5, window: [-0.45, 0.1] },
		llm: { yaw: 21.5, pitch: 32, size: 8.5, window: [-0.25, 0.3] },
		frontend: { yaw: -4, pitch: 18, size: 12, window: [-0.02, 0.5] },
		backend: { yaw: 16, pitch: 21.5, size: 10, window: [0.18, 0.7] },
		infra: { yaw: 22, pitch: 11.5, size: 8.5, window: [0.38, 0.9] }
	},
	tall: {
		agents: { yaw: 0, pitch: 20, size: 12, window: [-0.32, 0.0] },
		llm: { yaw: 0, pitch: 33, size: 10, window: [-0.06, 0.24] },
		frontend: { yaw: 0, pitch: 47, size: 13, window: [0.18, 0.5] },
		backend: { yaw: 0, pitch: 61, size: 12, window: [0.44, 0.76] },
		infra: { yaw: 0, pitch: 74, size: 10, window: [0.7, 1.0] }
	}
};

/** The process figure: centre, angular width/height, orientation of the flow. */
export const PROCESS_PLACEMENT = {
	// above the page's own four steps, right of the heading
	wide: { yaw: 50, pitch: 29, width: 20, height: 11, orientation: 'wide' },
	tall: { yaw: 38, pitch: 31, width: 15, height: 30, orientation: 'tall' }
};

/**
 * @typedef {{
 *   pos: Vector3, dir: Vector3, fov: number, shiftX: number, shiftY: number,
 *   spin: number, tilt: number, dim: number, earthFade: number, lean: number
 * }} Shot
 * @typedef {{ width: number, height: number, keepout: { right: number, bottom: number } | null }} View
 */

const shot = (pos, dir, fov, shiftX, shiftY, spin, tilt = 1, dim = 1, earthFade = 1, lean = 0) => ({
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
	earthFade,
	lean
});

const ORIGIN = [0, 0, 0];

const EARTH_RADIUS = 5;
/** Space between the text and the Earth's glow, CSS px. */
const TEXT_GAP = 28;

/**
 * Where the whole Earth sits on screen: centre (cx, cy) and ocean radius r, in CSS px.
 *
 * - wide: right of the hero's text. `keepout.right` is the right edge of the hero headline
 *   and lead as the page lays them out (World measures the text marked
 *   data-scene-keepout); without it, the edge is estimated from the page's own layout. The
 *   Earth is up to 36% of the height, starts just right of the text with its glow, and may
 *   run off the right edge by a quarter of its radius before it shrinks.
 * - tall: as wide as the phone and rising from the bottom: its top sits just under the
 *   hero lead (`keepout.bottom`), between 64% and 74% of the height.
 * @param {View} view
 * @param {'wide' | 'tall'} layout
 */
export const earthFraming = ({ width, height, keepout }, layout) => {
	const w = Math.max(width, 1);
	const h = Math.max(height, 1);
	if (layout === 'tall') {
		const r = w * 0.6;
		const below = keepout ? keepout.bottom + 16 : h * 0.66;
		const top = Math.min(h * 0.74, Math.max(h * 0.64, below));
		return { cx: w / 2, cy: top + r, r };
	}
	const gutter = Math.min(40, Math.max(16, w * 0.04));
	const left = Math.max(gutter, (w - 1200) / 2);
	const estimate = left + Math.max((680 * Math.min(92, w * 0.07)) / 92, 620);
	const start = (keepout && keepout.right > 0 ? keepout.right : estimate) + TEXT_GAP;
	let r = h * 0.36;
	if (start + 1.85 * r > w) r = Math.max((w - start) / 1.85, h * 0.2);
	return { cx: start + 1.1 * r, cy: h * 0.53, r };
};

/**
 * A shot of the whole Earth framed by earthFraming(): the camera backs off until the ocean
 * has the wanted radius and a lens shift puts the centre where it belongs.
 * @param {View} view
 * @param {'wide' | 'tall'} layout
 */
const earthShot = (view, layout, fov, spin, lean = 0) => {
	const { cx, cy, r } = earthFraming(view, layout);
	const w = Math.max(view.width, 1);
	const h = Math.max(view.height, 1);
	const angular = Math.atan((2 * r * Math.tan((fov * DEG) / 2)) / h);
	const distance = EARTH_RADIUS / Math.sin(Math.max(angular, 0.02));
	return shot(
		[0, distance * 0.018, distance],
		ORIGIN,
		fov,
		(2 * cx) / w - 1,
		1 - (2 * cy) / h,
		spin,
		1,
		1,
		1,
		lean
	);
};

/*
 * Shots per section as functions of the in-section progress p (0..1 across the hold) and
 * the view. spin is degrees of Earth rotation relative to "home faces the camera"; tilt
 * scales how far the Earth leans to bring home's latitude to the centre, lean then tips home
 * that many degrees above it; dim softens the scene under dense content and earthFade the
 * Earth alone.
 */
/** @type {Record<'wide' | 'tall', ((p: number, view: View) => Shot)[]>} */
const SHOTS = {
	wide: [
		(p, view) => earthShot(view, 'wide', 36, 0),
		(p) =>
			shot(SKY_ANCHOR.wide.toArray(), lookDir(4 + 4 * p, 25 + 2 * p), 40, 0.3, 0.02, 8 + 6 * p),
		(p) => shot([0.6, 1.8, 20.5], lookDir(47 + 3 * p, 20), 40, 0.34, 0.02, 16 + 6 * p),
		(p) => shot([-2.6, 6.6, 8.4], [5 + 2 * p, 6.5, -24], 42, 0.0, 0.0, 24 + 14 * p, 0.55, 0.75),
		(p) => shot([2.8, 6.4, 8.2], [-6 - 2 * p, 6.3, -24], 42, 0.0, 0.0, 44 + 14 * p, 0.55, 0.75),
		(p, view) => earthShot(view, 'wide', 36, 0)
	],
	tall: [
		(p, view) => earthShot(view, 'tall', 42, 0, 20),
		(p) => shot(SKY_ANCHOR.tall.toArray(), lookDir(0, 18 + 56 * p), 52, 0, 0, 8 + 6 * p, 1, 1, 0.35),
		(p) => shot([0.6, 1.6, 21.5], lookDir(38, 31 + 2 * p), 54, 0, -0.02, 16 + 6 * p, 1, 1, 0.35),
		(p) =>
			shot([-1.8, 6.9, 9.0], [3 + 2 * p, 4.6, -24], 54, 0, 0, 24 + 14 * p, 0.55, 0.75, 0.6),
		(p) =>
			shot([2.0, 6.7, 8.8], [-4 - 2 * p, 4.4, -24], 54, 0, 0, 44 + 14 * p, 0.55, 0.75, 0.6),
		(p, view) => earthShot(view, 'tall', 42, 0, 20)
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
 * @param {View} view viewport in CSS px and the hero text to keep clear of
 */
export const evaluateStory = (T, layout, out, view) => {
	const shots = SHOTS[layout];
	const span = HOLD_END - HOLD_START;
	const handover = 1 - span; // length of the window around each boundary

	for (let k = 1; k < SECTION_COUNT; k++) {
		const from = k - (1 - HOLD_END);
		if (T > from && T < from + handover) {
			const w = smoother((T - from) / handover);
			return blend(shots[k - 1](1, view), shots[k](0, view), w, out);
		}
	}
	const i = Math.min(SECTION_COUNT - 1, Math.max(0, Math.floor(T)));
	const p = Math.min(1, Math.max(0, (T - i - HOLD_START) / span));
	return blend(shots[i](p, view), null, 0, out);
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
			earthFade: a.earthFade,
			lean: a.lean
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
	out.lean = lerp(a.lean, b.lean, w);
	return out;
};

export const createShot = () => shot(ORIGIN, [0, 0, -1], 40, 0, 0, 0);

/**
 * Scroll-driven phases for the reveals (unclamped; the shaders smoothstep their windows).
 * They run while the camera arrives and finish early in the section: a reader who jumps to
 * a section from the menu lands at its top (story time ≈ index + 0.15) and should find the
 * figures mostly drawn, not an empty sky.
 * @param {number} T
 */
export const phases = (T) => ({
	skills: (T - 0.9) / 0.4,
	process: (T - 1.9) / 0.4
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
