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
	import { locale, t } from '$lib/shared/i18n';

	onMount(startLoader);
</script>

<svelte:window bind:innerWidth={$deviceWidth} />

<svelte:head>
	<title>{$t('meta.title')}</title>
	<meta name="description" content={$t('meta.description')} />
	<meta property="og:title" content={$t('meta.title')} />
	<meta property="og:description" content={$t('meta.description')} />
	<meta property="og:locale" content={$locale === 'ru' ? 'ru_RU' : 'en_US'} />
</svelte:head>

{#if !$isCloseLoader}
	<PageLoader />
{/if}

<Messages />
<Header />
<BackToTop />

<div class="app-shell">
	<!-- star field runs on mobile too: particle count scales with viewport area -->
	<ParticleBackground />
	<main class="app-content pb-10">
		<slot />
	</main>
	<Footer />
</div>
