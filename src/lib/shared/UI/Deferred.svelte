<!--
	Mounts its content only when scrolled near the viewport.
	Keeps heavy widgets (WebGL canvases, long image lists) out of the
	initial load so the intro stays smooth and the page becomes
	interactive immediately.
-->
<script>
	import { onMount } from 'svelte';

	export let rootMargin = '400px';
	export let minHeight = '0px';

	let visible = false;
	let placeholder;

	onMount(() => {
		if (typeof IntersectionObserver === 'undefined') {
			visible = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					visible = true;
					observer.disconnect();
				}
			},
			{ rootMargin }
		);
		observer.observe(placeholder);

		return () => observer.disconnect();
	});
</script>

{#if visible}
	<slot />
{:else}
	<div bind:this={placeholder} style:min-height={minHeight} />
{/if}
