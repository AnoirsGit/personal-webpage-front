/*
 * three.js throws while mounting a <Canvas> when WebGL is unavailable (old GPU,
 * hardware acceleration off, blocked by policy), and a throw during a Svelte 4
 * flush stops every later update on the page — the timeline and skill tree
 * never mounted and the language switch went dead. Probe once and let the 3D
 * widgets render nothing instead.
 */
let supported;

export const hasWebGL = () => {
	if (supported === undefined) {
		try {
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
			supported = Boolean(gl);
			gl?.getExtension('WEBGL_lose_context')?.loseContext();
		} catch {
			supported = false;
		}
	}
	return supported;
};
