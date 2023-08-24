<script>
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { createEffect, animate } from './helpers/effect';
	let image;
	let canvas;
	let effect;
	let image64;

	const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/b/be/Vrp-400x400.jpg';
	// Function to convert Uint8Array to base64
	function arrayBufferToBase64(arrayBuffer) {
		let binary = '';
		const bytes = new Uint8Array(arrayBuffer);
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}
	// Fetch the image data

	onMount(() => {
		axios
			.get(imageUrl, { responseType: 'arraybuffer' })
			.then((response) => {
				const base64String = btoa(
					new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
				);
				image64 = base64String;
				const ctx = canvas.getContext('2d');
				canvas.width = 400;
				canvas.height = 400;

				effect = createEffect(ctx, canvas, image);
				effect.init();

				animate({ ctx, canvas, effect });
			})
			.catch((error) => {
				console.error('Error fetching the image:', error);
			});
	});

	const mouseMoveHandler = (event) => {
		effect?.mouseMoveHandler(event.offsetX, event.offsetY);
	};

	const mouseLeaveHandler = () => {
		effect?.mouseLeaveHandler();
	};
</script>

<div class="relative">
	<canvas
		class="bg-transparent"
		on:mousemove={mouseMoveHandler}
		on:mouseleave={mouseLeaveHandler}
		bind:this={canvas}
	/>
	<img
		bind:this={image}
		alt="image"
		crossorigin="anonymous"
		class="absolute hidden"
		src={imageUrl}
	/>
</div>
