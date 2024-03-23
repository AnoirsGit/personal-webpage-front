<script>
	import '$lib/app/styles/app.css';
	import '$lib/app/styles/markdown-reader.css';
	import { isCloseLoader } from '$lib/shared/stores/globalStore';

	import Header from '$lib/widgets/Header.svelte';
	import PageLoader from '$lib/widgets/page-loader/PageLoader.svelte';
	import ParticleBackground from '$lib/widgets/canvas-animation/ParticleBackground.svelte';

	let isStart = false;

	const startLoad = () => (isStart = true);
	const closeLoader = () => ($isCloseLoader = true);

	setTimeout(startLoad, 1);
	setTimeout(closeLoader, 2500);
</script>

{#if !$isCloseLoader}
	<PageLoader />
{/if}

<ParticleBackground />

<main class="app">
	<Header />
	<div class="app-content">
		{#if isStart}
			<slot />
			<!-- </Suspense> -->
		{/if}

		<footer>
			<!-- Footer content goes here -->
		</footer>
	</div>
</main>
