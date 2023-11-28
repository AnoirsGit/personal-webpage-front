<script>
	import { onMount } from 'svelte';

	import * as Three from 'three';
	import { T } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

	import { GLOBE_RADIUS, MAX_IMPACTS_COUNT } from '$lib/shared/consts/globeConsts';
	import { CITY_COORDINATES } from '$lib/shared/consts/goeLocations';

	import globePoints from '$lib/shared/mocks/globe-points.json';
	import { arrayOfCoordinatesToPosition } from '$lib/shared/helpers/tree/globePositionHelper';
	import {
		addImpact,
		updateImpacts,
		createEmptyImpacts,
		createImpactGenerator,
		calcNewPositionFromRotation
	} from '$lib/shared/helpers/globe/impact';

	import fragmentShader from '$lib/shared/shaders/globeFragment.glsl?raw';
	import vertexShader from '$lib/shared/shaders/globeVertex.glsl?raw';
	import PlacePointer from '$lib/entities/globe/PlacePointer.svelte';

	export let placePointers = [];
	export let rotationY = 0;
	export let arrayOfMapPositions = arrayOfCoordinatesToPosition(globePoints, GLOBE_RADIUS + 0.05);

	let globeRotation = { x: 0, y: 0, z: 0 };
	let geometry;
	const stackImpactEvents = [];
	const impacts = createEmptyImpacts(MAX_IMPACTS_COUNT);

	placePointers.push(CITY_COORDINATES.find((city) => city.name === 'Almaty'));

	const createImpactFromPosition = createImpactGenerator(false);
	const createImpactFromCoordinates = createImpactGenerator(true);

	interactivity();

	const createGeometry = () => {
		const dummyObject = new Three.Object3D(); // object To Apply matrix4
		const posVec3 = new Three.Vector3();
		const spherical = new Three.Spherical();
		const geoms = [];

		arrayOfMapPositions.forEach((pointPosition) => {
			posVec3.fromArray(pointPosition);

			spherical.setFromVector3(posVec3);
			dummyObject.lookAt(posVec3);
			dummyObject.updateMatrix();

			const planeGeometry = new Three.PlaneGeometry(0.03, 0.03);

			planeGeometry.applyMatrix4(dummyObject.matrix);
			planeGeometry.translate(posVec3.x, posVec3.y, posVec3.z);

			// prettier-ignore
			const centers = [
				posVec3.x, posVec3.y, posVec3.z,
                posVec3.x, posVec3.y, posVec3.z,
                posVec3.x, posVec3.y, posVec3.z,
                posVec3.x, posVec3.y, posVec3.z
			];

			const uv = new Three.Vector2(
				(spherical.theta + Math.PI) / (Math.PI * 2),
				1 - spherical.phi / Math.PI
			);
			// prettier-ignore
			const uvs = [
                uv.x, uv.y,
                uv.x, uv.y,
                uv.x, uv.y,
                uv.x, uv.y
            ];
			planeGeometry.setAttribute('center', new Three.Float32BufferAttribute(centers, 3));
			planeGeometry.setAttribute('bUv', new Three.Float32BufferAttribute(uvs, 2));
			geoms.push(planeGeometry);
		});

		return mergeBufferGeometries(geoms);
	};

	const initializeImpacts = () => {
		for (const { latitude: lat, longitude: lon } of placePointers) {
			const impact = createImpactFromCoordinates({ lat, lon });
			addImpact(impacts, impact);
		}
	};

	const animate = () => {
		updateImpacts(impacts, stackImpactEvents);
		globeRotation.y += 0.002;

		requestAnimationFrame(animate);
	};

	onMount(() => {
		initializeImpacts();
		geometry = createGeometry();

		animate();
	});
</script>

{#if geometry}
	<T.Group rotation={[globeRotation.x, globeRotation.y, globeRotation.z]}>
		<T.Mesh {geometry}>
			<T.ShaderMaterial
				{vertexShader}
				{fragmentShader}
				uniforms={{
					// For Shader with "boom"
					impacts: { value: impacts },
					minSize: { value: 0.03 },
					waveHeight: { value: 0.125 },
					scaling: { value: 2 }
				}}
				defines={{ USE_UV: '' }}
			/>
		</T.Mesh>

		<T.Mesh
			on:click={({ point }) => {
				const newRotation = {
					x: globeRotation.x,
					y: rotationY + globeRotation.y,
					z: globeRotation.z
				};
				const { x, y, z } = calcNewPositionFromRotation(point, newRotation);
				const impact = createImpactFromPosition({ x, y, z, shouldRepeat: false });
				stackImpactEvents.push(impact);
			}}
			position={[0, 0, 0]}
			geometry={new Three.SphereGeometry(GLOBE_RADIUS, 50, 50)}
			material={new Three.MeshStandardMaterial({ color: '#6666ff' })}
		/>

		{#each placePointers as placePointer}
			<PlacePointer {placePointer} />
		{/each}
	</T.Group>
{/if}
