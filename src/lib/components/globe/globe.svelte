<script>
	import * as Three from 'three';
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';

	import { arrayOfCoordinatesToPosition } from '$lib/helpers/globePositionHelper';
	import { CITY_COORDINATES } from '$lib/consts/goeLocations';
	import globePoints from '$lib/data/globe-points.json';
	import { GLOBE_RADIUS } from '$lib/consts/globeConsts';

	import MapPoints from './mapPoints.svelte';
	import PlacePointer from './placePointer.svelte';

	let arrayOfMapPositions = arrayOfCoordinatesToPosition(globePoints, GLOBE_RADIUS + 0.05);

	const placePointer = CITY_COORDINATES.find((city) => city.name === 'Almaty');
</script>

<div class="border-2 border-white w-100% h-192">
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[11, 5, 3]}
			on:create={({ ref }) => {
				ref.lookAt(0, 0, 0);
			}}
		>
			<OrbitControls />
		</T.PerspectiveCamera>

		<T.DirectionalLight castShadow color="white" position={[-2, 6, 5]} intensity={1.3} />
		<T.DirectionalLight castShadow color="white" position={[10, -8, -10]} intensity={0.2} />

		<T.GridHelper args={[10, 10]} />
		<T.AxesHelper args={[8]} />

		<T.Group>
			<T.Mesh
				position={[0, 0, 0]}
				geometry={new Three.SphereGeometry(GLOBE_RADIUS, 50, 50)}
				material={new Three.MeshStandardMaterial({ color: '#3366ff' })}
			/>

			{#if arrayOfMapPositions && arrayOfMapPositions.length > 0}
				<MapPoints {arrayOfMapPositions} />
			{/if}
			<PlacePointer {placePointer} />
		</T.Group>
	</Canvas>
</div>
