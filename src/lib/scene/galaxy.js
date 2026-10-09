/*
 * Where the Milky Way runs across the scene's sky. One great circle through two directions
 * picked from the camera's shots (story.js): low on the left of the skills sky, then up across
 * it diagonally behind the skill tree, to its core high on the right above the process graph,
 * so panning from the skills to the process stage turns towards the bright part. The sky's
 * baked glow (nebula.frag), its star clouds (geometry.js buildStarfield) and the dust all
 * follow these numbers.
 *
 * Directions are seen from the scene's origin: yaw right +, pitch up +, yaw 0 looking down −z.
 * Light module (no three.js).
 */

/** @param {number} yaw degrees @param {number} pitch degrees @returns {[number, number, number]} */
const towards = (yaw, pitch) => {
	const y = (yaw * Math.PI) / 180;
	const p = (pitch * Math.PI) / 180;
	return [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
};

const cross = (a, b) => [
	a[1] * b[2] - a[2] * b[1],
	a[2] * b[0] - a[0] * b[2],
	a[0] * b[1] - a[1] * b[0]
];
const normalize = (v) => {
	const length = Math.hypot(...v) || 1;
	return /** @type {[number, number, number]} */ (v.map((x) => x / length));
};

/** low on the left of the skills sky, where the band comes up from behind the Earth */
const LOW = towards(-34, -6);
/** the galactic core: high on the right, above the process graph */
export const GALAXY_CORE = towards(64, 36);
/** the normal of the band's plane */
export const GALAXY_NORMAL = normalize(cross(LOW, GALAXY_CORE));
