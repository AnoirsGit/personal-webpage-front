<script>
	import * as Three from 'three';
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

	import {
		arrayOfCoordinatesToPosition,
		coordinatesToVector
	} from '$lib/helpers/globePositionHelper';
	import globePoints from '$lib/data/globe-points.json';
	import { GLOBE_RADIUS } from '$lib/consts/globeConsts';
	import { onMount } from 'svelte';
	import { requestAnimationTween } from '$lib/helpers/animation';

	import fragmentShader from './globeFragment.glsl?raw';
	import vertexShader from './globeVertex.glsl?raw';

	export let arrayOfMapPositions = arrayOfCoordinatesToPosition(globePoints, GLOBE_RADIUS + 0.05);
	export let impacts = [{ lat: 43.2557, lon: 76.945 }]; // Array for "boom"

	let globeMesh;

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

	const initGlobe = () => {
		const uniforms = {
			// For Shader with "boom"
			impacts: { value: initializedImpacts },
			minSize: { value: 0.03 },
			waveHeight: { value: 0.125 },
			scaling: { value: 2 }
		};
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

		const mergedGeometry = mergeBufferGeometries(geoms);

		const material = new Three.ShaderMaterial({ uniforms, vertexShader, fragmentShader });

		material.defines = { USE_UV: '' };
		return new Three.Mesh(mergedGeometry, material);
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

<div class="w-100% h-192">
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[11, 5, 3]}
			on:create={({ ref }) => ref.lookAt(0, 0, 0)}
		>
			<OrbitControls enableDamping />
		</T.PerspectiveCamera>
		<T.DirectionalLight castShadow color="white" position={[-2, 8, 5]} intensity={1.3} />

		{#if globeMesh}
			<T is={globeMesh} />
		{/if}

		<!-- <T.Mesh
			geometry={new Three.SphereGeometry(0.5, 10, 10)}
			material={new Three.MeshBasicMaterial({ color: 0xff0000 })}
			position={[3.5473942662280216, 3.426277240118635, 0.8225680481137038]}
		/> -->
	</Canvas>
</div>
