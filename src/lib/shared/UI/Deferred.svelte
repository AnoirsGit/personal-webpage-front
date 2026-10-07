<!--
	Mounts its content only when scrolled near the viewport.
	Keeps heavy widgets (WebGL canvases, long image lists) out of the
	initial load so the intro stays smooth and the page becomes
	interactive immediately.

	Pass `load` to also keep the widget's *code* out of the entry chunk —
	a plain <slot> still ships in the parent's bundle even though it renders
	late, so anything pulling three.js or bulky JSON should use `load`.
-->
<script context="module">
	import { browser } from '$app/environment';

	/*
	 * An in-page link (header, footer, the hero's scroll cue) aims its smooth
	 * scroll at where the target sits when the link is clicked. Placeholders
	 * passed on the way then swap in sections of another height — the Works
	 * timeline replaces 900px with thousands — so from the top "Contacts" stopped
	 * in the middle of Works, and on a phone "Works" overshot its heading.
	 * Remember when such a jump starts so the sections mounting during it can
	 * re-aim it; any manual scroll input hands control back.
	 */
	const JUMP_WINDOW_MS = 3000;
	let jumpStartedAt = -Infinity;

	if (browser) {
		addEventListener('hashchange', () => (jumpStartedAt = performance.now()));
		for (const type of ['wheel', 'touchstart', 'keydown', 'mousedown']) {
			addEventListener(type, () => (jumpStartedAt = -Infinity), { passive: true });
		}
	}

	const hashTarget = () => {
		try {
			return document.getElementById(decodeURIComponent(location.hash.slice(1)));
		} catch {
			return null;
		}
	};
</script>

<script>
	import { onMount, tick } from 'svelte';

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

	// Runs while the swap is being flushed, before it reaches the DOM: measure the
	// jump target with the placeholder still in place, re-aim if the swap moved it.
	const reaimJump = () => {
		if (!placeholder || performance.now() - jumpStartedAt > JUMP_WINDOW_MS) return;
		const target = hashTarget();
		const position = target && placeholder.compareDocumentPosition(target);
		// only a target further down the page moves when this section mounts
		if (!(position & Node.DOCUMENT_POSITION_FOLLOWING)) return;
		const offsetTop = () => target.getBoundingClientRect().top + scrollY;
		const before = offsetTop();
		tick().then(() => {
			if (Math.abs(offsetTop() - before) > 1) target.scrollIntoView();
		});
	};

	$: if (mounted) reaimJump();

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
