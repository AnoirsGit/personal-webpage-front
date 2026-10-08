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
-->
<script>
	import { onDestroy, onMount } from 'svelte';

	import { detectQuality, whenIdle } from './quality.js';

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

	const cleanups = /** @type {(() => void)[]} */ ([]);
	let destroyed = false;

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
		// cover, keeping the focus (the globe) in view: right of centre on wide, bottom on tall
		const scale = Math.max(w / posterImage.width, h / posterImage.height);
		const sw = w / scale;
		const sh = h / scale;
		const focusX = tall ? 0.5 : 0.62;
		const focusY = tall ? 0.7 : 0.5;
		const sx = Math.min(posterImage.width - sw, Math.max(0, posterImage.width * focusX - sw / 2));
		const sy = Math.min(posterImage.height - sh, Math.max(0, posterImage.height * focusY - sh / 2));
		context.drawImage(posterImage, sx, sy, sw, sh, 0, 0, w, h);
		posterShown = true;
	};

	const showPoster = () => {
		if (mode === 'poster' || destroyed) return;
		mode = 'poster';
		Live = null;
		visible = false;
		// the canvas mounts on the next tick
		setTimeout(drawPoster, 0);
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
		<canvas class="scene-poster" class:shown={posterShown} bind:this={posterCanvas} />
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
	.scene-root {
		position: fixed;
		inset: 0 0 auto 0;
		height: 100vh;
		height: 100lvh;
		z-index: -1;
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

	@media (prefers-reduced-motion: reduce) {
		.scene-live,
		.scene-poster {
			transition-duration: 0.4s;
		}
	}
</style>
