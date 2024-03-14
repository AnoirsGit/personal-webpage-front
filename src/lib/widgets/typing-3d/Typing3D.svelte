<script>
	import { Canvas, T } from '@threlte/core';

	import { Suspense } from '@threlte/extras';
	import { onLoaded } from '$lib/shared/stores/globalStore';
	import TypingPerson from '$lib/entities/3d/models/typingPerson.svelte';

	let canGreet = true;
	const animationQueue = [];

	const greet = () => {
		if (canGreet) {
			canGreet = false;
			animationQueue.push('greeting');
		}
	};

	const allowGreet = () => (canGreet = true);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="w-full lg:w-1/2 h-104 lg:h-120" on:mouseenter={greet}>
	<Canvas>
		<T.PerspectiveCamera
			makeDefault
			position={[2, 1, 1.5]}
			on:create={({ ref }) => ref.lookAt(-0.5, 0.5, 0)}
		/>
		<T.DirectionalLight castShadow color="white" position={[2, 4, 4]} intensity={2} />
		<T.DirectionalLight castShadow color="white" position={[10, 1, 4]} intensity={2} />
		<Suspense on:load={onLoaded}>
			<TypingPerson {animationQueue} {allowGreet} />
		</Suspense>
	</Canvas>
</div>
