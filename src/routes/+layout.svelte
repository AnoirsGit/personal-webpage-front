<script>
	import '$lib/app/styles/app.css';
	import '$lib/app/styles/markdown-reader.css';
	import { deviceWidth, isCloseLoader } from '$lib/shared/stores/globalStore';

	import Header from '$lib/widgets/Header.svelte';
	import PageLoader from '$lib/widgets/page-loader/PageLoader.svelte';
	import ParticleBackground from '$lib/widgets/canvas-animation/ParticleBackground.svelte';
	import Messages from '$lib/shared/Messages.svelte';

	let isStart = false;
	$: isMobile = $deviceWidth < 768;

	const startLoad = () => (isStart = true);
	const closeLoader = () => ($isCloseLoader = true);

	setTimeout(startLoad, 1);
	setTimeout(closeLoader, 2500);
</script>

<svelte:window bind:innerWidth={$deviceWidth} ></svelte:window>

{#if !$isCloseLoader}
	<PageLoader />
{/if}

<main>
	<Messages />
	<Header />
	{#if !isMobile}
		<ParticleBackground />
	{/if}
	<main b class="app-content pb-10">
		{#if isStart}
			<slot />
			<!-- </Suspense> -->
		{/if}

		<footer>
			<!-- Footer content goes here -->
		</footer>
	</main>
</main>
