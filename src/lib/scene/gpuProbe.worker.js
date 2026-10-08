/*
 * Probes WebGL off the main thread. Creating the first WebGL context of a page waits for
 * the GPU side to initialise (≈150–200 ms measured in Chromium), which on the main thread
 * is one long task. Done here, the wait blocks only this worker — and it warms the GPU
 * channel, so the scene's own context is cheap to create afterwards.
 *
 * Replies { supported: false } when this browser has no WebGL in workers; the caller then
 * probes on the main thread instead.
 */
self.onmessage = () => {
	if (typeof OffscreenCanvas === 'undefined') {
		self.postMessage({ supported: false });
		return;
	}
	try {
		/** @param {WebGLContextAttributes} attributes */
		const create = (attributes) => {
			const canvas = new OffscreenCanvas(1, 1);
			return /** @type {WebGL2RenderingContext | WebGLRenderingContext | null} */ (
				canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes)
			);
		};
		let gl = create({ failIfMajorPerformanceCaveat: true });
		let caveat = false;
		if (!gl) {
			gl = create({});
			caveat = Boolean(gl);
		}
		if (!gl) {
			self.postMessage({ supported: true, ok: false });
			return;
		}
		const info = gl.getExtension('WEBGL_debug_renderer_info');
		const renderer = String(
			(info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || ''
		);
		const webgl2 =
			typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
		const maxPointSize = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)?.[1] ?? 64;
		gl.getExtension('WEBGL_lose_context')?.loseContext();
		self.postMessage({ supported: true, ok: true, renderer, webgl2, maxPointSize, caveat });
	} catch {
		self.postMessage({ supported: false });
	}
};
