<script>
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as Three from 'three';
	import * as Utils from 'three/src/math/MathUtils';
</script>

<Canvas>
	<T.PerspectiveCamera
		makeDefault
		position={[10, 0, 0]}
		on:create={({ ref }) => {
			ref.lookAt(0, 1, 0);
		}}
	/>
	<T.DirectionalLight castShadow color="white" position={[10, 6, -6]} intensity={1.3} />
	<T.Mesh
		position={[0, 0, 1]}
		geometry={new Three.SphereGeometry(3, 64, 64)}
		material={new Three.MeshStandardMaterial({ color: '#3366ff' })}
	/>
</Canvas>
