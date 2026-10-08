/*
 * Decides how much 3D a visitor gets, before any three.js is downloaded.
 *
 *   high   — laptops and desktops with a real GPU: full density, DPR up to 2
 *   low    — phones, tablets, old/integrated-weak GPUs, low memory: fewer dots and
 *            stars, DPR up to 1.5, no country border line
 *   static — no WebGL, a software rasteriser (SwiftShader, llvmpipe), Save-Data, or a very
 *            weak device: the poster image, and three.js is never fetched
 *
 * prefers-reduced-motion is orthogonal: the live scene renders still frames per section.
 * `?scene=high|low|static|reduced` forces a mode (QA and screenshots).
 *
 * WebGL is probed in a worker (gpuProbe.worker.js): the first context of a page waits for
 * the GPU side to initialise, a long task if done here. The main-thread probe is only the
 * fallback for browsers without WebGL in workers.
 *
 * Light module (no three.js).
 */

const SOFTWARE_GPU =
	/swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen|gdi generic|apple software/i;

/* Integrated or mobile GPUs that struggle with a full-viewport canvas. */
const WEAK_GPU =
	/(intel).*(hd graphics ?(2|3|4|5)\d{2,3}\b|gma|graphics media)|mali-(4|t)|adreno \(tm\) [2-5]\d\d|powervr|sgx|tegra|videocore/i;

/** @param {WebGLContextAttributes} attributes */
const createContext = (attributes) => {
	const canvas = document.createElement('canvas');
	return /** @type {WebGLRenderingContext | WebGL2RenderingContext | null} */ (
		canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes)
	);
};

/** Main-thread probe (fallback). */
const probeWebGL = () => {
	try {
		// A context that only exists without failIfMajorPerformanceCaveat is a software one.
		let gl = createContext({ failIfMajorPerformanceCaveat: true });
		let caveat = false;
		if (!gl) {
			gl = createContext({});
			caveat = Boolean(gl);
		}
		if (!gl) return { ok: false };

		const info = gl.getExtension('WEBGL_debug_renderer_info');
		const renderer = String(
			(info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || ''
		);
		const webgl2 =
			typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
		const maxPointSize = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)?.[1] ?? 64;
		gl.getExtension('WEBGL_lose_context')?.loseContext();
		return {
			ok: true,
			renderer,
			webgl2,
			maxPointSize,
			software: caveat || SOFTWARE_GPU.test(renderer)
		};
	} catch {
		return { ok: false };
	}
};

/**
 * @returns {Promise<{ ok: boolean, renderer?: string, webgl2?: boolean, maxPointSize?: number, software?: boolean, timeout?: boolean } | null>}
 *   null when the worker cannot answer (unsupported, blocked by CSP, no WebGL there)
 */
const probeInWorker = () =>
	new Promise((resolve) => {
		/** @type {Worker | undefined} */
		let worker;
		let timer = 0;
		const done = (value) => {
			clearTimeout(timer);
			worker?.terminate();
			resolve(value);
		};
		// a GPU that needs seconds just to create a context is not one to animate on
		timer = window.setTimeout(() => done({ ok: false, timeout: true }), 5000);
		try {
			worker = new Worker(new URL('./gpuProbe.worker.js', import.meta.url), { type: 'module' });
			worker.onmessage = ({ data }) => {
				if (!data?.supported || !data.ok) return done(null);
				done({
					ok: true,
					renderer: data.renderer,
					webgl2: data.webgl2,
					maxPointSize: data.maxPointSize,
					software: data.caveat || SOFTWARE_GPU.test(data.renderer)
				});
			};
			worker.onerror = () => done(null);
			worker.postMessage(0);
		} catch {
			done(null);
		}
	});

/**
 * @typedef {{
 *   tier: 'high' | 'low' | 'static',
 *   reason: string,
 *   reducedMotion: boolean,
 *   dpr: number,
 *   maxDpr: number,
 *   mobile: boolean,
 *   renderer: string,
 *   maxPointSize: number
 * }} SceneQuality
 */

/** @returns {Promise<SceneQuality>} */
export const detectQuality = async () => {
	const base = {
		tier: /** @type {'high' | 'low' | 'static'} */ ('static'),
		reason: 'ssr',
		reducedMotion: false,
		dpr: 1,
		maxDpr: 1,
		mobile: false,
		renderer: '',
		maxPointSize: 64
	};
	if (typeof window === 'undefined') return base;

	const forced = new URLSearchParams(window.location.search).get('scene');
	const media = (query) => window.matchMedia?.(query).matches ?? false;
	const nav =
		/** @type {Navigator & { deviceMemory?: number, connection?: { saveData?: boolean } }} */ (
			navigator
		);

	const reducedMotion = forced === 'reduced' || media('(prefers-reduced-motion: reduce)');
	const coarse = media('(pointer: coarse)');
	const smallScreen = Math.min(window.screen?.width ?? 1024, window.screen?.height ?? 768) < 600;
	const mobile = /Android|iPhone|iPod|Mobile/i.test(nav.userAgent) || (coarse && smallScreen);
	const memory = nav.deviceMemory ?? 8;
	const cores = nav.hardwareConcurrency ?? 4;
	const deviceDpr = window.devicePixelRatio || 1;

	const result = { ...base, reducedMotion, mobile };
	if (forced === 'static') return { ...result, reason: 'forced' };
	if (nav.connection?.saveData) return { ...result, reason: 'save-data' };

	const gl = (await probeInWorker()) ?? probeWebGL();
	if (!gl.ok) return { ...result, reason: gl.timeout ? 'probe-timeout' : 'no-webgl' };
	result.renderer = gl.renderer ?? '';
	result.maxPointSize = gl.maxPointSize ?? 64;
	if (gl.software && forced !== 'high' && forced !== 'low') {
		return { ...result, reason: 'software-renderer' };
	}
	if (memory <= 1 || (mobile && cores <= 2)) return { ...result, reason: 'weak-device' };

	const weak =
		mobile || coarse || WEAK_GPU.test(result.renderer) || memory <= 4 || cores <= 4 || !gl.webgl2;
	const tier = forced === 'high' ? 'high' : forced === 'low' ? 'low' : weak ? 'low' : 'high';
	const maxDpr = tier === 'high' ? 2 : 1.5;

	return {
		...result,
		tier,
		reason: forced === 'high' || forced === 'low' ? 'forced' : weak ? 'weak-or-mobile' : 'capable',
		maxDpr,
		dpr: Math.min(deviceDpr, maxDpr)
	};
};

/**
 * Runs `callback` when the main thread is idle (or after `timeout` ms at the latest).
 * @param {() => void} callback
 * @param {number} [timeout]
 */
export const whenIdle = (callback, timeout = 1500) => {
	if ('requestIdleCallback' in window) {
		const id = window.requestIdleCallback(callback, { timeout });
		return () => window.cancelIdleCallback(id);
	}
	const id = window.setTimeout(callback, 200);
	return () => window.clearTimeout(id);
};
