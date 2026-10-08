<script>
	import Scene from '$lib/scene/Scene.svelte';
	import Header from '$lib/widgets/Header.svelte';
	import Footer from '$lib/widgets/Footer.svelte';
	import BackToTop from '$lib/shared/UI/BackToTop.svelte';
	import { facts, locale, t } from '$lib/shared/i18n';

	export let data;

	// runs before anything below renders: this is what makes the prerendered /ru/ Russian
	$: locale.set(data.lang);
	$: facts.set(data.facts);
</script>

<svelte:head>
	<link
		rel="preload"
		href="/fonts/manrope-latin.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	{#if data.lang === 'ru'}
		<link
			rel="preload"
			href="/fonts/manrope-cyrillic.woff2"
			as="font"
			type="font/woff2"
			crossorigin="anonymous"
		/>
	{/if}
</svelte:head>

<Scene />

<a class="skip-link" href="#main">{$t('a11y.skip')}</a>
<Header />
<main id="main" class="site-main">
	<slot />
</main>
<Footer />
<BackToTop />

<style>
	/* above the fixed scene canvas, below the header */
	.site-main,
	:global(.site-footer) {
		position: relative;
		z-index: 1;
	}
</style>
