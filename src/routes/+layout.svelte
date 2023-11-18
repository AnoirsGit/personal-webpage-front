<script>
	import '$lib/styles/app.css';
	import Header from '$lib/widgets/Header.svelte';
</script>

<main class="app">
	<div class="app-content">
		<Header />

		<slot />

		<footer>
			<!-- Footer content goes here -->
		</footer>
	</div>
</main>
