<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { Mesh, SphereGeometry } from 'three';

	import { createSkyMaterial } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const material = createSkyMaterial(runtime.uniforms);
	const sky = new Mesh(new SphereGeometry(1, 32, 16), material);
	sky.frustumCulled = false;
	sky.renderOrder = -100;

	/** @param {import('../runtime.js').Runtime} rt */
	const update = (rt) => {
		material.uniforms.uDim.value = 0.75 + 0.25 * rt.shot.dim;
	};
	runtime.updaters.add(update);
	onDestroy(() => runtime.updaters.delete(update));
</script>

<T is={sky} />
