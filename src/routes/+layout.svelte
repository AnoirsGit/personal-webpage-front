<script>
	import { linear } from 'svelte/easing';
	import { fly, slide } from 'svelte/transition';

	import '$lib/app/styles/app.css';
	import '$lib/app/styles/markdown-reader.css';

	import Header from '$lib/widgets/Header.svelte';
	import PageLoader from '$lib/widgets/page-loader/PageLoader.svelte';

	let isLoaded = false;

	const onLoaded = () => (isLoaded = true);

	setTimeout(onLoaded, 2500);
</script>

{#if !isLoaded}
	<div transition:slide={{ duration: 500, axis: 'x' }} class="app-loader-wrapper">
		<PageLoader />
	</div>

	<div
		out:fly={{ delay: 1100, duration: 500, opacity: 1, x: '100vw' }}
		class="app-loader-second-wrapper"
	/>
	<div
		out:fly={{ delay: 1300, duration: 450, opacity: 1, x: '100vw' }}
		class="app-loader-third-wrapper"
	/>
	<div
		out:fly={{ delay: 1450, duration: 400, opacity: 1, x: '100vw' }}
		class="app-loader-fourth-wrapper"
	/>
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
