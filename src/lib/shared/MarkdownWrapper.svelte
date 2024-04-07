<script>
	import SvelteMarkdown from 'svelte-markdown';
	export let source = '';
	export let mdClasses = '';
</script>

<div class="md {mdClasses}">
	<SvelteMarkdown {source} />
</div>
