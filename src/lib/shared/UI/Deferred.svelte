<!--
	Mounts its content only when scrolled near the viewport.
	Keeps heavy widgets (WebGL canvases, long image lists) out of the
	initial load so the intro stays smooth and the page becomes
	interactive immediately.

	Pass `load` to also keep the widget's *code* out of the entry chunk —
	a plain <slot> still ships in the parent's bundle even though it renders
	late, so anything pulling three.js or bulky JSON should use `load`.
-->
<script>
	import { onMount } from 'svelte';

	export let rootMargin = '400px';
	export let minHeight = '0px';
	/** Optional `() => import('...')`, resolved once the placeholder nears the viewport. */
	export let load = null;

	let visible = false;
	let placeholder;
	let Component = null;

	$: if (visible && load && !Component) {
		// a rejected import would otherwise leave a silent blank placeholder
		load()
			.then((module) => (Component = module.default))
			.catch((error) => console.error('Deferred: failed to load section', error));
	}

	// keep the placeholder (and its min-height) until there is something to swap in
	$: mounted = visible && (!load || Component);

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

{#if mounted}
	{#if Component}
		<svelte:component this={Component} {...$$restProps} />
	{:else}
		<slot />
	{/if}
{:else}
	<div bind:this={placeholder} style:min-height={minHeight} />
{/if}
