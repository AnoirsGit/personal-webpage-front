<script>
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import GlobeMesh from '$lib/entities/globe/GlobeMesh.svelte';
	import Atmosphere from '$lib/entities/globe/Atmosphere.svelte';
</script>

<div class="w-100% h-192">
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[-1, 5, 13]}
			on:create={({ ref }) => ref.lookAt(0, 0, 0)}
		>
			<!-- <OrbitControls enableDamping /> -->
		</T.PerspectiveCamera>

		<GlobeMesh />
		<Atmosphere />

		<T.DirectionalLight castShadow color="white" position={[-12, 7, 2]} intensity={1} />
		<T.DirectionalLight color="#ff33cc" position={[-10, 6, -5]} intensity={0.6} />
		<T.DirectionalLight color="#ff33cc" position={[-10, 10, -5]} intensity={1.2} />
		<T.DirectionalLight color="#ff33cc" position={[0, 15, 0]} intensity={0.8} />
	</Canvas>
</div>
