<script>
	import * as Three from 'three';
	import { Canvas, T } from '@threlte/core';
	import globePoints from '$lib/data/globe-points.json';
	import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
	import { arrayOfCoordinatesToPosition } from '$lib/helpers/globePositionHelper';
	import { GLOBE_RADIUS } from '$lib/consts/globeConsts';
	import { OrbitControls } from '@threlte/extras';

	let arrayOfMapPositions = arrayOfCoordinatesToPosition(globePoints, GLOBE_RADIUS + 0.05);

	const impacts = []; // Array for "boom"

	const uniforms = {
		// For Shader with "boom"
		impacts: { value: impacts },
		maxSize: { value: 0.04 },
		minSize: { value: 0.03 },
		waveHeight: { value: 0.125 },
		scaling: { value: 2 },
		gradInner: { value: new Three.Color('#c7c7c7') },
		gradOuter: { value: new Three.Color('#464646') }
	};

	const kavo = () => {
		const dummyObject = new Three.Object3D(); // object To Apply matrix4
		const posVec3 = new Three.Vector3();
		const spherical = new Three.Spherical();
		const geoms = [];

		arrayOfMapPositions.forEach((pointPosition) => {
			posVec3.fromArray(pointPosition);

			spherical.setFromVector3(posVec3);
			dummyObject.lookAt(posVec3);
			dummyObject.updateMatrix();

			const planeGeometry = new Three.PlaneGeometry(0.5, 0.5);

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
		const material = new Three.PointsMaterial({ color: 0x888888, size: 0.05 });
		return new Three.Points(mergedGeometry, material);
	};

	const dva = kavo();
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

		<T is={dva} />
	</Canvas>
</div>
