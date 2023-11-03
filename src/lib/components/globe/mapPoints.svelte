<script>
	import { T } from '@threlte/core';
	import { Instance, InstancedMesh } from '@threlte/extras';
	import * as Three from 'three';

	export let arrayOfMapPositions;

	const coordinateCircleMaterial = new Three.MeshBasicMaterial({
		color: '#bfbfbf',
		side: Three.BackSide
	});
</script>

<InstancedMesh limit={20000} range={20000}>
	<T.CircleGeometry args={[0.02, 7]} />
	<T.MeshBasicMaterial color={'#bfbfbf'} side={Three.BackSide} />
	{#each arrayOfMapPositions as dot}
		<Instance
			position={dot}
			on:create={({ ref }) => {
				ref.lookAt(0, 0, 0);
			}}
		/>
	{/each}
</InstancedMesh>
