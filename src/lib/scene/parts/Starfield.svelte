<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { Points } from 'three';

	import { SCENE_PALETTE } from '../palette.js';
	import { GALAXY_CORE, GALAXY_NORMAL } from '../galaxy.js';
	import { buildStarfield } from '../gl/geometry.js';
	import { createStarsMaterial, rgb } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	// half again as many stars as the plain field, the extra ones crowding into the Milky Way
	const count = runtime.quality.tier === 'high' ? 9000 : 3600;
	const material = createStarsMaterial(runtime.uniforms);
	const stars = new Points(
		buildStarfield(
			count,
			{ star: rgb(SCENE_PALETTE.star), warm: rgb(SCENE_PALETTE.starWarm) },
			{ normal: GALAXY_NORMAL, core: GALAXY_CORE, band: 0.4 }
		),
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
