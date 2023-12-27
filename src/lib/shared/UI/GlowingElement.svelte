<script>
	export let color = '#48abe0';
	export let size = 5;
	export let isWrapper = false;
	export let isInner = false;
	export let intensity = 0.5; // Adjust this value for the intensity of the glow

	const isDot = !(isWrapper || isInner);
</script>

<div
	class="{isDot ? 'abs-center' : ''} {isInner ? 'absolute w-full h-full top-0' : ''} {isInner ||
	isDot
		? 'z-0'
		: ''}"
	style="box-shadow: 0 0 {size * 10}px {size * intensity}px rgba({parseInt(
		color.slice(1, 3),
		16
	)}, {parseInt(color.slice(3, 5), 16)}, {parseInt(color.slice(5, 7), 16)}, 1)"
/>
