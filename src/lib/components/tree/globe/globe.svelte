<script>
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls, Text } from '@threlte/extras';
	import * as Three from 'three';
	import * as Utils from 'three/src/math/MathUtils';
	import { PLACE_POINTER_DATA } from './consts';
	import HiddenCanvas from './hidden-canvas.svelte';

	const globe = { size: 3 };

	let placePointer = [];
	let text = 'KAVO';

	const addPlacePointer = (position) => {
		let pointer = { size: PLACE_POINTER_DATA.size, position };
		let pointerBottom = {
			size: PLACE_POINTER_DATA.bottomSize,
			position
		};

		placePointer = [...placePointer, { pointer, pointerBottom, color: PLACE_POINTER_DATA.color }];
	};

	const handleArrayOfPixelsLoad = (arrayOfPixels) => {};

	addPlacePointer({});
</script>

<div class="border-2 border-white w-100% h-192">
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[8, 9, 3]}
			on:create={({ ref }) => {
				ref.lookAt(0, 0, 0);
			}}
		>
			<!-- <OrbitControls /> -->
		</T.PerspectiveCamera>
		<T.DirectionalLight castShadow color="white" position={[-2, 6, 5]} intensity={1.3} />
		<T.DirectionalLight castShadow color="white" position={[10, -8, -10]} intensity={0.2} />

		<T.Mesh
			position={[0, 0, 0]}
			geometry={new Three.SphereGeometry(5, 64, 64)}
			material={new Three.MeshStandardMaterial({ color: '#3366ff' })}
		/>
		<T.GridHelper args={[10, 10]} />
		<T.AxesHelper args={[8]} />
		{#each placePointer as pointer}
			<T.Mesh
				position={[3.5, 2, 0]}
				material={new Three.MeshBasicMaterial({ color: pointer.color })}
				geometry={new Three.CylinderGeometry(
					pointer.pointer.size[0],
					pointer.pointer.size[1],
					pointer.pointer.size[2],
					pointer.pointer.size[3]
				)}
				on:create={({ ref }) => {
					ref.lookAt(0, 0, 0);
					ref.rotateX(Math.PI / 2);
					ref.translateY(-pointer.pointer.size[2] / 2);
				}}
			/>
			<T.Mesh
				position={[3.5, 2, 0]}
				geometry={new Three.CircleGeometry(0.1, 30)}
				material={new Three.MeshBasicMaterial({ color: pointer.color, side: Three.DoubleSide })}
				on:create={({ ref }) => {
					ref.lookAt(0, 0, 0);
				}}
			/>
		{/each}
		<Text
			position={[3.5, 2.3, 0]}
			{text}
			color="white"
			fontSize={0.1}
			anchorX="50%"
			anchorY="100%"
			on:create={({ ref }) => {
				ref.lookAt(0, 0, 0);
				ref.rotateY(Math.PI);
			}}
		/>
		<Text
			position={[3.5, 2, 0]}
			text="ANIME"
			color="white"
			fontSize={0.1}
			anchorX="50%"
			anchorY="100%"
			on:create={({ ref }) => {
				ref.lookAt(0, 0, 0);
				ref.rotateY(Math.PI);
			}}
		/>
		<T.Mesh material={new Three.MeshBasicMaterial({ opacity: 0, transparent: true })} />
	</Canvas>

	<HiddenCanvas onGlobeImageDataLoad={handleArrayOfPixelsLoad} />
</div>
