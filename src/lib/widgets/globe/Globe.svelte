<script>
	import { Canvas, T } from '@threlte/core';
	import '$lib/app/styles/globe.css';

	import GlobeMesh from '$lib/entities/globe/GlobeMesh.svelte';
	import Atmosphere from '$lib/entities/globe/Atmosphere.svelte';

	let x = -800;
	let isDragging = false;
	let startCoords = { x: 0 };
	let velocity = { x: 0 };

	const handleMouseDown = (event) => {
		isDragging = true;
		startCoords.x = event.clientX;
		velocity.x = 0;
		requestAnimationFrame(updatePosition);
	};

	const handleMouseMove = (event) => {
		if (!isDragging) return;

		const deltaX = event.clientX - startCoords.x;

		x += deltaX;

		velocity.x = deltaX;
		startCoords.x = event.clientX;
	};

	const handleMouseUp = () => {
		isDragging = false;
	};

	const updatePosition = () => {
		if (!isDragging) {
			x += velocity.x * 0.1;
			velocity.x *= 0.95;

			if (Math.abs(velocity.x) < 0.01) return;
		}
		requestAnimationFrame(updatePosition);
	};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="absolute w-screen h-72 lg:h-240 left-1/2 -translate-x-1/2"
	on:mousedown={handleMouseDown}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
>
	<div class="w-100vw h-72 md:h-192 lg:w-240 lg:h-240 xl-globe-margin">
		<Canvas>
			<T.PerspectiveCamera
				makeDefault
				position={[1, 5, 12]}
				on:create={({ ref }) => ref.lookAt(0, 0, 0)}
			/>
			<T.Group rotation.y={x * 0.003}>
				<GlobeMesh />
			</T.Group>
			<Atmosphere />

			<T.DirectionalLight castShadow color="white" position={[-12, 7, 2]} intensity={1} />
			<T.DirectionalLight color="#ff33cc" position={[-10, 6, -5]} intensity={0.6} />
			<T.DirectionalLight color="#ff33cc" position={[-10, 10, -5]} intensity={1.2} />
			<T.DirectionalLight color="#ff33cc" position={[0, 15, 0]} intensity={0.8} />
		</Canvas>
	</div>
</div>
