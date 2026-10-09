<!--
	The sky dome: deep space and the Milky Way.

	The band is expensive noise (folded fbm: star clouds, dust lanes, the core), so it is
	computed once: right after the scene starts, galaxy.frag renders its densities into an
	equirectangular map (2048×1024 on the high tier, 1024×512 on the low one, a few
	milliseconds of GPU, the shader compiled off the main thread first), and the sky only
	samples that map per pixel. It fades in when the bake is done (at once with reduced
	motion), drifts very slowly while motion is allowed and shifts a little with the camera's
	travel. Where it runs is set in ../galaxy.js.
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

	import { createGalaxyBakeMaterial, createSkyMaterial } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const { renderer } = useThrelte();
	const material = createSkyMaterial(runtime.uniforms, { low: runtime.quality.tier !== 'high' });
	const sky = new Mesh(new SphereGeometry(1, 32, 16), material);
	sky.frustumCulled = false;
	// after the opaque Earth: the depth test then skips every sky pixel the planet covers
	sky.renderOrder = 10;

	/* ---- the one-off Milky Way bake ---- */
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
		const bakeMaterial = createGalaxyBakeMaterial();
		const quad = new Mesh(new PlaneGeometry(2, 2), bakeMaterial);
		quad.frustumCulled = false;
		const scene = new Scene();
		scene.add(quad);
		const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
		try {
			await renderer.compileAsync(scene, camera);
		} catch {
			// a compile error surfaces on render; the sky simply stays without the band
		}
		if (!destroyed) {
			const previous = renderer.getRenderTarget();
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			renderer.setRenderTarget(previous);
			material.uniforms.uGalaxy.value = target.texture;
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
			material.uniforms.uGalaxyMix.value = mix * mix * (3 - 2 * mix);
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
