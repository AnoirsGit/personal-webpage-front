<!--
	The sky dome: deep space, a dim galactic band and the nebulae.

	The nebulae are expensive noise (domain-warped fbm), so they are computed once: right
	after the scene starts, nebula.frag renders their densities into a small equirectangular
	map (2048×1024 on the high tier, 1024×512 on the low one, a few milliseconds of GPU, the
	shader compiled off the main thread first), and the sky only samples that map per pixel.
	They fade in when the bake is done (at once with reduced motion), drift very slowly while
	motion is allowed and shift a little with the camera's travel.
-->
<script>
	import { onDestroy } from 'svelte';
	import { T, useThrelte } from '@threlte/core';
	import {
		ClampToEdgeWrapping,
		LinearFilter,
		Mesh,
		OrthographicCamera,
		PlaneGeometry,
		RepeatWrapping,
		Scene,
		SphereGeometry,
		WebGLRenderTarget
	} from 'three';

	import { createNebulaBakeMaterial, createSkyMaterial } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const { renderer } = useThrelte();
	const material = createSkyMaterial(runtime.uniforms);
	const sky = new Mesh(new SphereGeometry(1, 32, 16), material);
	sky.frustumCulled = false;
	sky.renderOrder = -100;

	/* ---- the one-off nebula bake ---- */
	const high = runtime.quality.tier === 'high';
	const target = new WebGLRenderTarget(high ? 2048 : 1024, high ? 1024 : 512, {
		depthBuffer: false,
		stencilBuffer: false,
		generateMipmaps: false,
		minFilter: LinearFilter,
		magFilter: LinearFilter,
		wrapS: RepeatWrapping,
		wrapT: ClampToEdgeWrapping
	});
	let destroyed = false;
	let baked = -1;

	(async () => {
		const bakeMaterial = createNebulaBakeMaterial();
		const quad = new Mesh(new PlaneGeometry(2, 2), bakeMaterial);
		quad.frustumCulled = false;
		const scene = new Scene();
		scene.add(quad);
		const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
		try {
			await renderer.compileAsync(scene, camera);
		} catch {
			// a compile error surfaces on render; the sky simply stays without nebulae
		}
		if (!destroyed) {
			const previous = renderer.getRenderTarget();
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			renderer.setRenderTarget(previous);
			material.uniforms.uNebula.value = target.texture;
			baked = performance.now();
			runtime.requestRender();
		}
		quad.geometry.dispose();
		bakeMaterial.dispose();
	})();

	/** @param {import('../runtime.js').Runtime} rt */
	const update = (rt) => {
		material.uniforms.uDim.value = 0.75 + 0.25 * rt.shot.dim;
		if (rt.camera) material.uniforms.uCamera.value.copy(rt.camera.position);
		if (baked >= 0) {
			const mix = rt.motion ? Math.min(1, (performance.now() - baked) / 2200) : 1;
			material.uniforms.uNebulaMix.value = mix * mix * (3 - 2 * mix);
		}
	};
	runtime.updaters.add(update);
	onDestroy(() => {
		destroyed = true;
		runtime.updaters.delete(update);
		target.dispose();
	});
</script>

<T is={sky} />
