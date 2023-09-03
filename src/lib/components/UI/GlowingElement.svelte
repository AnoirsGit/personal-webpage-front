<script>
	export let color = '#48abe0';
	export let size = 5;
	export let isWrapper = false;
	export let isInner = false;

	const isDot = !(isWrapper || isInner);
</script>

<div
	class="{isDot ? 'abs-center' : ''} {isInner ? 'absolute w-full h-full top-0' : ''} {isInner || isDot? 'z-0': ''}"
	style="box-shadow: 0 0 {size * 10}px {size * 4}px {color}"
/>
