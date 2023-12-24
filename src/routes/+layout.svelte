<script>
	import '$lib/app/styles/app.css';
	import '$lib/app/styles/markdown-reader.css';

	import Header from '$lib/widgets/Header.svelte';
</script>

<main class="app">
	<Header />
	<div class="app-content">
		<slot />

		<footer>
			<!-- Footer content goes here -->
		</footer>
	</div>
</main>
