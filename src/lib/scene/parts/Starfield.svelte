<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { Points } from 'three';

	import { SCENE_PALETTE } from '../palette.js';
	import { buildStarfield } from '../gl/geometry.js';
	import { createStarsMaterial, rgb } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const count = runtime.quality.tier === 'high' ? 6000 : 2600;
	const material = createStarsMaterial(runtime.uniforms);
	const stars = new Points(
		buildStarfield(count, { star: rgb(SCENE_PALETTE.star), warm: rgb(SCENE_PALETTE.starWarm) }),
		material
	);
	stars.renderOrder = -50;

	const update = ({ shot }) => {
		material.uniforms.uDim.value = 0.7 + 0.3 * shot.dim;
	};
	runtime.updaters.add(update);
	onDestroy(() => runtime.updaters.delete(update));
</script>

<T is={stars} />
