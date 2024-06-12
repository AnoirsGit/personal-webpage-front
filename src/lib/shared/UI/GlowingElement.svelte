<script>
	export let color = '#ffffff';
	export let size = 5;
	export let isWrapper = false;
	export let isInner = false;
	export let intensity = 0.5; // Adjust this value for the intensity of the glow

	const isDot = !(isWrapper || isInner);
</script>

<div
	class="{isDot || isWrapper ? 'abs-center' : ''} {isInner ? 'abs-center w-0 h-0 top-0' : ''} {isInner || isDot
		? 'z-0'
		: 'z-0'}"
	style="box-shadow: 0 0 {size * 10}px {size * intensity}px rgba({parseInt(
		color.slice(1, 3),
		16
	)}, {parseInt(color.slice(3, 5), 16)}, {parseInt(color.slice(5, 7), 16)}, 1)"
>
	<slot />
</div>
