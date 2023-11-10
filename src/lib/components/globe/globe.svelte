<script>
	import * as Three from 'three';
	import { Canvas, T } from '@threlte/core';

	import { arrayOfCoordinatesToPosition } from '$lib/helpers/globePositionHelper';
	import { CITY_COORDINATES } from '$lib/consts/goeLocations';
	import globePoints from '$lib/data/globe-points.json';
	import { GLOBE_RADIUS } from '$lib/consts/globeConsts';

	import MapPoints from './mapPoints.svelte';
	import PlacePointer from './placePointer.svelte';
	import { onMount } from 'svelte';

	let arrayOfMapPositions = arrayOfCoordinatesToPosition(globePoints, GLOBE_RADIUS + 0.05);
	let placePointers = [];
	let globeRotationY = 0;

	const spinGlobe = () => {
		globeRotationY += 0.001;
		requestAnimationFrame(spinGlobe);
	};

	onMount(() => spinGlobe());

	placePointers.push(CITY_COORDINATES.find((city) => city.name === 'Almaty'));
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="w-100% h-192">
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[11, 5, 3]}
			on:create={({ ref }) => ref.lookAt(0, 0, 0)}
		/>

		<T.DirectionalLight castShadow color="white" position={[-2, 8, 5]} intensity={1.3} />

		<T.Group rotation={[0, globeRotationY, 0]}>
			<T.Mesh
				position={[0, 0, 0]}
				geometry={new Three.SphereGeometry(GLOBE_RADIUS, 50, 50)}
				material={new Three.MeshStandardMaterial({ color: '#3366ff' })}
			/>

			{#if arrayOfMapPositions && arrayOfMapPositions.length > 0}
				<MapPoints {arrayOfMapPositions} />
			{/if}
			{#each placePointers as placePointer}
				<PlacePointer {placePointer} />
			{/each}
		</T.Group>
	</Canvas>
</div>
