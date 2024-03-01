<script>
	import SvelteMarkdown from 'svelte-markdown';

	export let bgTitle = ``;
	export let bgTitleClass = '-translate-y-1/4';

	export let preTitle = ``;
	export let title = '';
	export let content = ``;

	const bgTitleArray = bgTitle.toUpperCase().split('\n');
</script>

<div class="w-full relative">
	<div class={`absolute inset-0 h-max ${bgTitleClass}`}>
		<h1 class="text-[4.5rem] leading-[4.75rem] font-bold opacity-10">
			{#each bgTitleArray as textPart}
				{textPart}
				<br />
			{/each}
		</h1>
	</div>
	<div>
		<p class="text-xl">{preTitle}</p>
		<h2 class="text-[3rem] leading-[3rem] font-bold">{title}</h2>
		<div class="markdown-reader mt-8">
			<SvelteMarkdown source={content} />
		</div>
	</div>
</div>
