<script>
	import * as Three from 'three';
	import { T } from '@threlte/core';

	import fragmentShader from '$lib/shared/shaders/atmosphereFragment.glsl?raw';
	import vertexShader from '$lib/shared/shaders/atmosphereVertex.glsl?raw';
</script>

<T.Mesh rotation={[-0.25, 0.1, 0]}>
	<T.SphereGeometry args={[5.3, 50, 50]} position={[0.1, 0.1, 0]} />
	<T.ShaderMaterial
		{vertexShader}
		{fragmentShader}
		blending={Three.AdditiveBlending}
		side={Three.BackSide}
	/>
</T.Mesh>
