<!--
	The heavy half of the scene (three.js + Threlte), loaded by Scene.svelte with a dynamic
	import after the page has rendered. One opaque canvas. The scene's shaders take raw
	vec3 colours and include neither tone mapping nor colour-space chunks, so the palette's
	sRGB values reach the screen as they are, without touching three's global settings.
-->
<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { Canvas } from '@threlte/core';
	import { NoToneMapping } from 'three';

	import World from './World.svelte';
	import Labels from './parts/Labels.svelte';
	import { createRuntime } from './runtime.js';
	import { sceneLang } from './sceneText.js';

	/** @type {import('./quality.js').SceneQuality} */
	export let quality;
	/** @type {string | undefined} */
	export let lang = undefined;

	const dispatch = createEventDispatcher();
	const runtime = createRuntime(quality);
	$: runtime.lang.set(sceneLang(lang));

	/* reduced motion: section changes are cuts — fade the new still in from the background */
	let cut = false;
	let cutTimer = 0;
	runtime.onCut = () => {
		cut = true;
		clearTimeout(cutTimer);
		cutTimer = window.setTimeout(() => (cut = false), 60);
	};
	onDestroy(() => clearTimeout(cutTimer));

	const rendererParameters = {
		antialias: quality.tier === 'high' && quality.dpr < 1.5,
		alpha: false,
		depth: true,
		stencil: false,
		powerPreference: /** @type {'default'} */ ('default'),
		preserveDrawingBuffer: false
	};
</script>

<div class="scene-canvas" class:cut>
	<Canvas
		dpr={quality.dpr}
		renderMode="manual"
		toneMapping={NoToneMapping}
		shadows={false}
		{rendererParameters}
	>
		<World
			{runtime}
			on:ready={() => dispatch('ready')}
			on:fail={(event) => dispatch('fail', event.detail)}
		/>
	</Canvas>
	<Labels {runtime} />
</div>

<style>
	.scene-canvas {
		position: absolute;
		inset: 0;
		transition: opacity 420ms ease;
	}

	.scene-canvas.cut {
		opacity: 0;
		transition: none;
	}
</style>
