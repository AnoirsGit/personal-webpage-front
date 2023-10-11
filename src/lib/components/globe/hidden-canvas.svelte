<script>
	import map from '$lib/images/map.png';
	import { onMount } from 'svelte';
	import { pixelsArrayToCoordinates } from '$lib/helpers/globePositionHelper';

	export let onGlobeImageDataLoad = () => {};
	let canvas;
	let image;

	onMount(() => {
		// Get the canvas context
		const ctx = canvas.getContext('2d');

		// Set the canvas dimensions
		canvas.width = 360;
		canvas.height = 180;

		// Calculate the center position for the image on the canvas
		const centerImageX = (canvas.width - image.width) / 2;
		const centerImageY = (canvas.height - image.height) / 2;

		ctx.drawImage(image, centerImageX, centerImageY); // Draw the image on the canvas

		const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height); // Get pixel data from the canvas

		onGlobeImageDataLoad(pixelsArrayToCoordinates(canvas.width, canvas.height, pixels)); // Call the onGlobeImageDataLoad function with the pixel data array as an argument
	});
</script>

<div class="relative">
	<canvas class="absolute hidden" bind:this={canvas} />
	<img bind:this={image} class="absolute hidden" src={map} alt="globe" crossorigin="anonymous" />
</div>
