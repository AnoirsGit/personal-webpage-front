<script>
	import '$lib/app/styles/app.css';
	import '$lib/app/styles/markdown-reader.css';
	import { isLoaded } from '$lib/shared/stores/globalStore';

	import Header from '$lib/widgets/Header.svelte';
	import PageLoader from '$lib/widgets/page-loader/PageLoader.svelte';

	let isStart = false;

	const startLoad = () => (isStart = true);
	const onLoaded = () => ($isLoaded = true);

	setTimeout(startLoad, 1);
	setTimeout(onLoaded, 2500);
</script>

{#if !$isLoaded}
	<PageLoader />
{/if}

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
