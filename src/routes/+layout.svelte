<script>
	import '$lib/app/styles/app.css';
	import '$lib/app/styles/markdown-reader.css';

	import Header from '$lib/widgets/Header.svelte';
	import PageLoader from '$lib/widgets/page-loader/PageLoader.svelte';

	let isLoaded = false;

	const onLoaded = () => (isLoaded = true);

	setTimeout(onLoaded, 2500);
</script>

{#if !isLoaded}
	<div class="app-loader-wrapper"><PageLoader /></div>
{/if}

<main class="app">
	<Header />
	<div class="app-content">
		<slot />

		<footer>
			<!-- Footer content goes here -->
		</footer>
	</div>
</main>
