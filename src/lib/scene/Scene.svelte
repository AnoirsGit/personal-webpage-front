<!--
	@component
	The fixed 3D background of the site: one canvas behind the content, driven by
	`sceneStore` ({ section, progress }). Put it once in the layout:

		<Scene />

	This shell is light — it imports no three.js. After the page has loaded and the main
	thread is idle it decides the quality tier and either dynamic-imports the 3D half
	(SceneCanvas.svelte, three.js + Threlte) or, without WebGL / on a software renderer /
	with Save-Data, draws the static poster of the same scene. It never takes the pointer,
	so scrolling, links and text selection work as if it were not there.

	Props: `lang` ('en' | 'ru'; defaults to <html lang>, followed live) and `poster`.
	`data-scene` on the root reports 'pending' | 'loading' | 'live' | 'poster'.

	The poster (static/scene/poster-*.webp, made by scripts/scene-poster.js) is
	country-neutral: no home highlight, marker or arcs. The home marker is drawn here as
	HTML, placed from the home in src/lib/config/site-config.json through the projection
	saved next to the poster (./poster.json), and left out when home is on the far side.
	The poster dims where the page's text column runs (left on wide screens, top on tall
	ones), since a still image cannot dim behind each block the way the live scene does.
-->
<script>
	import { onDestroy, onMount } from 'svelte';

	import { detectQuality, whenIdle } from './quality.js';
	import { HOME } from './data/places.js';
	import { sceneStatus } from './sceneStore.js';

	/** @type {string | undefined} */
	export let lang = undefined;
	/** Poster images (wide for landscape, tall for portrait screens). */
	export let poster = { wide: '/scene/poster-wide.webp', tall: '/scene/poster-tall.webp' };

	/** @type {'pending' | 'loading' | 'live' | 'poster'} */
	let mode = 'pending';
	/** @type {import('./quality.js').SceneQuality | null} */
	let quality = null;
	/** @type {any} */
	let Live = null;
	let visible = false;
	let documentLang = 'en';

	/** @type {HTMLCanvasElement} */
	let posterCanvas;
	let posterShown = false;
	/** @type {HTMLImageElement | null} */
	let posterImage = null;
	let posterKind = '';
	/** @type {Record<string, { w: number, h: number, m: number[], eye: number[], r: number }> | null} */
	let posterMeta = null;
	/** the home marker over the poster, CSS px, or null when home is out of sight */
	let marker = /** @type {{ x: number, y: number } | null} */ (null);
	let posterTall = false;

	const DEG = Math.PI / 180;
	/**
	 * Home on the poster image, in image pixels, or null when it faces away.
	 * @param {{ w: number, h: number, m: number[], eye: number[], r: number }} meta
	 */
	const homeOnPoster = (meta) => {
		const radius = meta.r * 1.01;
		const cosLat = Math.cos(HOME.lat * DEG);
		const p = [
			radius * cosLat * Math.sin(HOME.lon * DEG),
			radius * Math.sin(HOME.lat * DEG),
			radius * cosLat * Math.cos(HOME.lon * DEG)
		];
		const toEye = [meta.eye[0] - p[0], meta.eye[1] - p[1], meta.eye[2] - p[2]];
		const facing =
			(toEye[0] * p[0] + toEye[1] * p[1] + toEye[2] * p[2]) /
			(Math.hypot(...toEye) * Math.hypot(...p));
		if (!(facing > 0.2)) return null;
		const m = meta.m; // column-major, Earth coordinates → clip space
		const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
		const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
		const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
		if (!(w > 0)) return null;
		return { x: (x / w / 2 + 0.5) * meta.w, y: (0.5 - y / w / 2) * meta.h };
	};

	const cleanups = /** @type {(() => void)[]} */ ([]);
	let destroyed = false;

	// tell the page what the background turned out to be (sceneStore.js: sceneStatus)
	$: sceneStatus.set({ mode, reducedMotion: Boolean(quality?.reducedMotion) });

	const drawPoster = async () => {
		if (!posterCanvas) return;
		const tall = window.innerWidth / Math.max(window.innerHeight, 1) < 0.9;
		const kind = tall ? 'tall' : 'wide';
		if (posterKind !== kind || !posterImage) {
			const image = new Image();
			image.decoding = 'async';
			image.src = poster[kind];
			try {
				await image.decode();
			} catch {
				return;
			}
			posterImage = image;
			posterKind = kind;
		}
		const ratio = Math.min(window.devicePixelRatio || 1, 2);
		const w = Math.round(window.innerWidth * ratio);
		const h = Math.round(window.innerHeight * ratio);
		posterCanvas.width = w;
		posterCanvas.height = h;
		const context = posterCanvas.getContext('2d');
		if (!context || !posterImage) return;
		// cover, centred: the poster was framed like the live hero (the Earth clear of the
		// text column, which is centred on the page too), so a centred crop keeps that gap
		const scale = Math.max(w / posterImage.width, h / posterImage.height);
		const sw = w / scale;
		const sh = h / scale;
		const sx = (posterImage.width - sw) / 2;
		const sy = (posterImage.height - sh) / 2;
		context.drawImage(posterImage, sx, sy, sw, sh, 0, 0, w, h);
		posterTall = tall;
		posterShown = true;

		const meta = posterMeta?.[kind];
		const home = meta ? homeOnPoster(meta) : null;
		// image pixels → CSS px of the page (the poster may be stored at another scale)
		const k = meta ? posterImage.width / meta.w : 1;
		marker = home
			? { x: ((home.x * k - sx) * scale) / ratio, y: ((home.y * k - sy) * scale) / ratio }
			: null;
	};

	const showPoster = () => {
		if (mode === 'poster' || destroyed) return;
		mode = 'poster';
		Live = null;
		visible = false;
		// the canvas mounts on the next tick; the marker waits for the poster's projection
		import('./poster.json')
			.then((module) => (posterMeta = module.default))
			.catch(() => (posterMeta = null))
			.finally(() => !destroyed && drawPoster());
		let timer = 0;
		const onResize = () => {
			clearTimeout(timer);
			timer = window.setTimeout(drawPoster, 160);
		};
		window.addEventListener('resize', onResize, { passive: true });
		cleanups.push(() => {
			clearTimeout(timer);
			window.removeEventListener('resize', onResize);
		});
	};

	onMount(() => {
		documentLang = document.documentElement.lang || 'en';
		const observer = new MutationObserver(() => {
			documentLang = document.documentElement.lang || 'en';
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
		cleanups.push(() => observer.disconnect());

		const begin = () => {
			cleanups.push(
				whenIdle(async () => {
					const detected = await detectQuality();
					if (destroyed) return;
					quality = detected;
					if (detected.tier === 'static') {
						showPoster();
						return;
					}
					mode = 'loading';
					import('./SceneCanvas.svelte')
						.then((module) => {
							if (!destroyed) Live = module.default;
						})
						.catch(showPoster);
				}, 2500)
			);
		};

		if (document.readyState === 'complete') {
			begin();
		} else {
			window.addEventListener('load', begin, { once: true });
			cleanups.push(() => window.removeEventListener('load', begin));
		}
	});

	onDestroy(() => {
		destroyed = true;
		cleanups.forEach((cleanup) => cleanup());
	});
</script>

<div
	class="scene-root"
	data-scene={mode}
	data-scene-tier={quality?.tier ?? ''}
	data-scene-reason={quality?.reason ?? ''}
	aria-hidden="true"
>
	{#if mode === 'poster'}
		<canvas
			class="scene-poster"
			class:shown={posterShown}
			class:tall={posterTall}
			bind:this={posterCanvas}
		/>
		{#if marker && posterShown}
			<span class="scene-home" style:transform="translate({marker.x}px, {marker.y}px)" />
		{/if}
	{/if}
	{#if Live && quality}
		<div class="scene-live" class:visible>
			<svelte:component
				this={Live}
				{quality}
				lang={lang ?? documentLang}
				on:ready={() => {
					mode = 'live';
					visible = true;
				}}
				on:fail={showPoster}
			/>
		</div>
	{/if}
</div>

<style>
	/*
	 * z-index 0, not -1: a negative layer paints under the body's own background (the static
	 * night sky in app.css) and the canvas would never be seen. The page content sits above it
	 * at z-index 1 (src/routes/[lang=lang]/+layout.svelte).
	 */
	.scene-root {
		position: fixed;
		inset: 0 0 auto 0;
		height: 100vh;
		height: 100lvh;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		contain: strict;
	}

	.scene-live,
	.scene-poster {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.scene-live.visible,
	.scene-poster.shown {
		opacity: 1;
	}

	/* a still image cannot dim behind each text block: dim where the text column runs */
	.scene-poster {
		-webkit-mask-image: linear-gradient(90deg, rgb(0 0 0 / 0.2) 0 44%, #000 66%);
		mask-image: linear-gradient(90deg, rgb(0 0 0 / 0.2) 0 44%, #000 66%);
	}

	.scene-poster.tall {
		-webkit-mask-image: linear-gradient(180deg, rgb(0 0 0 / 0.2) 0 52%, #000 70%);
		mask-image: linear-gradient(180deg, rgb(0 0 0 / 0.2) 0 52%, #000 70%);
	}

	/* home over the poster: the live scene's marker, as a dot with a slow ring */
	.scene-home {
		position: absolute;
		left: -5px;
		top: -5px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #fff3d6;
		box-shadow: 0 0 6px 2px rgba(232, 199, 126, 0.9), 0 0 22px 8px rgba(232, 199, 126, 0.35);
	}

	.scene-home::after {
		content: '';
		position: absolute;
		inset: -9px;
		border: 1px solid rgba(232, 199, 126, 0.7);
		border-radius: 50%;
		animation: scene-home-ring 4.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
	}

	@keyframes scene-home-ring {
		from {
			transform: scale(0.4);
			opacity: 1;
		}
		to {
			transform: scale(2.6);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scene-live,
		.scene-poster {
			transition-duration: 0.4s;
		}

		.scene-home::after {
			animation: none;
			opacity: 0.5;
		}
	}
</style>
