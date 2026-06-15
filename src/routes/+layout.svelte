<script>
	import '$lib/app/styles/app.css';
	import '$lib/app/styles/markdown-reader.css';
	import { onMount } from 'svelte';
	import { deviceWidth, isCloseLoader, startLoader } from '$lib/shared/stores/globalStore';

	import Header from '$lib/widgets/Header.svelte';
	import Footer from '$lib/widgets/Footer.svelte';
	import PageLoader from '$lib/widgets/page-loader/PageLoader.svelte';
	import ParticleBackground from '$lib/widgets/canvas-animation/ParticleBackground.svelte';
	import Messages from '$lib/shared/Messages.svelte';
	import BackToTop from '$lib/shared/UI/BackToTop.svelte';

	$: isMobile = $deviceWidth < 768;

	onMount(startLoader);
</script>

<svelte:window bind:innerWidth={$deviceWidth} />

{#if !$isCloseLoader}
	<PageLoader />
{/if}

<Messages />
<Header />
<BackToTop />

<div class="app-shell">
	{#if !isMobile}
		<ParticleBackground />
	{/if}
	<main class="app-content pb-10">
		<slot />
	</main>
	<Footer />
</div>
