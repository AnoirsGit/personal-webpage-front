<script>
	import map from '$lib/images/map.png';
	import { Vector3 } from 'three';
	import { onMount } from 'svelte';
	import { CountriesAndCities } from './consts';

	export let onGlobeImageDataLoad = () => {};
	let canvas;
	let image;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		canvas.width = 360;
		canvas.height = 180;
		const centerImageX = (canvas.width - image.width) / 2;
		const centerImageY = (canvas.height - image.height) / 2;
		ctx.drawImage(image, centerImageX, centerImageY);
		const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height);
		// const impacts = [];
		// for (let i = 0; i < CountriesAndCities.length; i++) {
		// 	impacts.push({
		// 		impactPosition: new Vector3(
		// 			CountriesAndCities[i].position[0],
		// 			CountriesAndCities[i].position[3],
		// 			CountriesAndCities[i].position[2]
		// 		),
		// 		impactMaxRadius: THREE.Math.randFloat(0.0001, 0.002),
		// 		impactRatio: 0.01
		// 	});
		// }

		// uniforms 301 row
		const arrOfPoints = [];

		for (let y = 0; y < canvas.width; y++) {
			for (let x = 0; x < canvas.width; x++) {
				const alpha = pixels[(canvas.width * y + x) * 4 + 3];
				// console.log(alpha);
				if (alpha > 200) arrOfPoints.push([x - canvas.width, y - canvas.width / 6.2]); // 6.2 is an indentation from south
			}
		}
		console.log(arrOfPoints);
		onGlobeImageDataLoad(arrOfPoints);
	});
</script>

<div class="relative">
	<canvas class="absolute hidden" bind:this={canvas} />
	<img bind:this={image} class="absolute hidden" src={map} alt="globe" crossorigin="anonymous" />
</div>
