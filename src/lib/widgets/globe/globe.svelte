<script>
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import GlobeMesh from '$lib/entities/globe/GlobeMesh.svelte';
</script>

<div class="w-100% h-192">
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[11, 5, 3]}
			on:create={({ ref }) => ref.lookAt(0, 0, 0)}
		>
			<OrbitControls enableDamping />
		</T.PerspectiveCamera>

		<GlobeMesh />
		<T.DirectionalLight castShadow color="white" position={[-2, 8, 5]} intensity={1.3} />
	</Canvas>
</div>
