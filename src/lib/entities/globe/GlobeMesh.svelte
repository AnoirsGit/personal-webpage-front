<script>
	import { onMount } from 'svelte';

	import * as Three from 'three';
	import { T } from '@threlte/core';
	import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

	import {
		arrayOfCoordinatesToPosition,
		coordinatesToVector
	} from '$lib/shared/helpers/tree/globePositionHelper';
	import globePoints from '$lib/shared/mocks/globe-points.json';
	import { GLOBE_RADIUS } from '$lib/shared/consts/globeConsts';
	import { CITY_COORDINATES } from '$lib/shared/consts/goeLocations';
	import { requestAnimationTween } from '$lib/shared/helpers/tween';

	import fragmentShader from '$lib/shared/shaders/globeFragment.glsl?raw';
	import vertexShader from '$lib/shared/shaders/globeVertex.glsl?raw';
	import PlacePointer from '$lib/entities/globe/PlacePointer.svelte';

	let globeMesh;
	export let placePointers = [];
	export let arrayOfMapPositions = arrayOfCoordinatesToPosition(globePoints, GLOBE_RADIUS + 0.05);
	export let impacts = [{ lat: 43.2557, lon: 76.945 }]; // Array for "boom"

	placePointers.push(CITY_COORDINATES.find((city) => city.name === 'Almaty'));

	let initializedImpacts = impacts.map((impact) => {
		const { lat, lon } = impact;
		const impactRatio = 0;
		const boomSpeed = impact.boomSpeed || 2000;
		const boomePeriods = impact.boomePeriods || 5000;
		const impactMaxRadius = impact.impactMaxRadius || 2;
		const animationFrame = requestAnimationTween(0, 1, boomSpeed, boomePeriods);
		const impactPosition = coordinatesToVector(GLOBE_RADIUS, lat, lon);

		return { impactPosition, impactRatio, impactMaxRadius, animationFrame };
	});

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

			const planeGeometry = new Three.PlaneGeometry(0.05, 0.05);

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

	const initGlobe = () => {
		const uniforms = {
			// For Shader with "boom"
			impacts: { value: initializedImpacts },
			minSize: { value: 0.03 },
			waveHeight: { value: 0.125 },
			scaling: { value: 2 }
		};

		const geometry = createGeometry();
		const material = new Three.ShaderMaterial({ uniforms, vertexShader, fragmentShader });

		material.defines = { USE_UV: '' };
		return new Three.Mesh(geometry, material);
	};

	const animate = () => {
		initializedImpacts.forEach((impact) => (impact.impactRatio = impact.animationFrame.update()));
		requestAnimationFrame(animate);
	};

	onMount(() => {
		globeMesh = initGlobe();
		animate();
	});
</script>

{#if globeMesh}
	<T.Group>
		<T is={globeMesh} />
		<T.Mesh
			position={[0, 0, 0]}
			geometry={new Three.SphereGeometry(GLOBE_RADIUS, 50, 50)}
			material={new Three.MeshStandardMaterial({ color: '#3366ff' })}
		/>

		{#each placePointers as placePointer}
			<PlacePointer {placePointer} />
		{/each}
	</T.Group>
{/if}
