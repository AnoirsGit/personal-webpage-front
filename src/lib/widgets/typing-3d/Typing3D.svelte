<script>
	import { Canvas, T } from '@threlte/core';

	import TypingPerson from '$lib/entities/3d/models/typing-person.svelte';

	let canGreet = true;
	const animationQueue = [];

	const greet = () => {
		if (canGreet) {
			canGreet = false;
			animationQueue.push('greet');
		}
	};

    const allowGreet = () => canGreet = true;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="w-full h-104 lg:h-120" on:mouseenter={greet}>
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[2, 1, 2]}
			on:create={({ ref }) => ref.lookAt(-0.5, 0.5, 0)}
		/>
		<T.DirectionalLight castShadow color="white" position={[4, 4, 4]} intensity={1} />

		<TypingPerson {animationQueue} {allowGreet} />
	</Canvas>
</div>
