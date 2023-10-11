<script>
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls, Text } from '@threlte/extras';
	import * as Three from 'three';
	import * as Utils from 'three/src/math/MathUtils';

	import HiddenCanvas from './hidden-canvas.svelte';
	import {
		mapArrayOfCoordinatesToPosition,
		getPositionOnGlobeFromCoordinates
	} from '$lib/helpers/globePositionHelper';
	import { CITY_COORDINATES } from '$lib/consts/goeLocations';

	let coordinatesFromPixels = [];
	let coordinationCircleMaterial;

	const placePointer = CITY_COORDINATES.find((city) => city.name === 'Almaty');
	const globeRadius = 5;

	const handleArrayOfPixelsLoad = (arrayOfPixels) => {
		coordinatesFromPixels = mapArrayOfCoordinatesToPosition(arrayOfPixels, globeRadius + 0.05);

		coordinationCircleMaterial = new Three.MeshBasicMaterial({
			color: '#fff',
			side: Three.BackSide
		});
	};
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

		<T.Mesh
			position={[0, 0, 0]}
			geometry={new Three.SphereGeometry(globeRadius, 50, 50)}
			material={new Three.MeshStandardMaterial({ color: '#3366ff' })}
		/>

		{#each coordinatesFromPixels as dot}
			<T.Mesh
				position={dot}
				geometry={new Three.PlaneGeometry(0.03, 0.03)}
				material={coordinationCircleMaterial}
				on:create={({ ref }) => {
					ref.lookAt(0, 0, 0);
				}}
			/>
		{/each}
		<T.GridHelper args={[10, 10]} />
		<T.AxesHelper args={[8]} />
		{#if placePointer}
			<T.Group>
				<T.Mesh
					position={getPositionOnGlobeFromCoordinates(
						globeRadius + 0.25,
						placePointer.latitude,
						placePointer.longitude
					)}
					material={new Three.MeshBasicMaterial({ color: 'white' })}
					geometry={new Three.CylinderGeometry(0.01, 0.01, 0.5, 8)}
					on:create={({ ref }) => {
						ref.translateY(0.25);
					}}
				/>
				<T.Mesh
					position={getPositionOnGlobeFromCoordinates(
						globeRadius + 0.25,
						placePointer.latitude,
						placePointer.longitude
					)}
					geometry={new Three.CircleGeometry(0.1, 30)}
					material={new Three.MeshBasicMaterial({ color: 'white', side: Three.DoubleSide })}
					on:create={({ ref }) => {
						ref.lookAt(0, 0, 0);
					}}
				/>
			</T.Group>
		{/if}
		<Text
			position={getPositionOnGlobeFromCoordinates(
				globeRadius + 0.5,
				placePointer.latitude,
				placePointer.longitude
			)}
			text="ameno"
			color="white"
			fontSize={0.3}
			anchorX="50%"
			anchorY="100%"
			on:create={({ ref }) => {
				ref.lookAt(0, 0, 0);
				ref.rotateY(Math.PI);
				ref.translateY(0.2);
			}}
		/>
		<Text
			position={getPositionOnGlobeFromCoordinates(
				globeRadius + 0.5,
				placePointer.latitude,
				placePointer.longitude
			)}
			text="ANIME"
			color="white"
			fontSize={0.2}
			anchorX="50%"
			anchorY="100%"
			on:create={({ ref }) => {
				ref.lookAt(0, 0, 0);
				ref.rotateY(Math.PI);
			}}
		/>
	</Canvas>

	<HiddenCanvas onGlobeImageDataLoad={handleArrayOfPixelsLoad} />
</div>
