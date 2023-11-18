<script>
	import * as Three from 'three';
	import { T } from '@threlte/core';
	import { Text } from '@threlte/extras';

	import { GLOBE_RADIUS } from '$lib/shared/consts/globeConsts';
	import { getPositionOnFromCoordinates } from '$lib/shared/helpers/globePositionHelper';

	export let placePointer;

	const pointerPositionRadius = GLOBE_RADIUS + 0.2;

	const pointerPosition = getPositionOnFromCoordinates(
		pointerPositionRadius,
		placePointer.latitude,
		placePointer.longitude
	);
	const textPosition = getPositionOnFromCoordinates(
		pointerPositionRadius,
		placePointer.latitude,
		placePointer.longitude
	);
</script>

{#if placePointer}
	<T.Group>
		<T.Mesh position={pointerPosition} on:create={({ ref }) => ref.translateY(0.25)}>
			<T.CylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
			<T.MeshBasicMaterial color={'#bfbfbf'} />
		</T.Mesh>
		<T.Mesh position={pointerPosition} on:create={({ ref }) => ref.lookAt(0, 0, 0)}>
			<T.CircleGeometry args={[0.1, 30]} />
			<T.MeshBasicMaterial color={'#bfbfbf'} side={Three.DoubleSide} />
		</T.Mesh>

		<Text
			position={textPosition}
			text={placePointer.countryName}
			characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
			fontSize={0.25}
			anchorY="200%"
			on:create={({ ref }) => {
				const theta = Math.atan2(textPosition[0], textPosition[2]);
				ref.rotateY(theta);
				ref.translateX(0.075);
			}}
		>
			<T.MeshBasicMaterial color={'#ffffff'} />
		</Text>
		<Text
			position={textPosition}
			text={placePointer.name}
			characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
			material={new Three.MeshBasicMaterial({ color: 'white' })}
			fontSize={0.2}
			anchorY="100%"
			on:create={({ ref }) => {
				const theta = Math.atan2(textPosition[0], textPosition[2]);
				ref.rotateY(theta);
				ref.translateX(0.075);
			}}
		/>
	</T.Group>
{/if}
