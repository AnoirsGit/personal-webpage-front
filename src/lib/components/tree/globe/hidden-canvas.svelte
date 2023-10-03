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

		// Географические координаты углов карты (примерные значения)
		const topLeftLongitude = -180; // Долгота левого верхнего угла карты
		const topLeftLatitude = 90; // Широта левого верхнего угла карты
		const bottomRightLongitude = 180; // Долгота правого нижнего угла карты
		const bottomRightLatitude = -90; // Широта правого нижнего угла карты

		const pixelDataArray = [];

		// Преобразование пикселей в координаты и проверка альфа-значения
		for (let y = 0; y < canvas.height; y++) {
			for (let x = 0; x < canvas.width; x++) {
				// Получение индекса пикселя
				const pixelIndex = (y * canvas.width + x) * 4;

				// Получение значения альфа-канала пикселя
				const alpha = pixels[pixelIndex + 3];

				// Проверка альфа-значения
				if (alpha > 200) {
					// Преобразование цвета пикселя в долготу и широту
					const longitude =
						topLeftLongitude + (x / canvas.width) * (bottomRightLongitude - topLeftLongitude);
					const latitude =
						topLeftLatitude - (y / canvas.height) * (topLeftLatitude - bottomRightLatitude);

					// Добавление координаты в массив
					pixelDataArray.push({ latitude, longitude });
				}
			}
		}
		console.log(pixelDataArray);

		onGlobeImageDataLoad(pixelDataArray);
	});
</script>

<div class="relative">
	<canvas class="absolute hidden" bind:this={canvas} />
	<img bind:this={image} class="absolute hidden" src={map} alt="globe" crossorigin="anonymous" />
</div>
