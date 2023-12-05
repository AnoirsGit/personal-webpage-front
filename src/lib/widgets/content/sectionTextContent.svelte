<script>
	import SvelteMarkdown from 'svelte-markdown';

	export let bgTitle = `web\ndeveloper`;
	export let bgTitleClass = '-translate-y-1/4';

	export let preTitle = `Hi, it's me`;
	export let title = 'Anuar';
	export let content = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et aliquam justo, vel
                tincidunt purus. Vivamus elementum tristique libero, nec bibendum justo consectetur vel.
                Vestibulum id sem eget nisi vestibulum finibus. Quisque bibendum euismod eros, eget luctus
                eros hendrerit eu. Curabitur ultrices scelerisque lacus in feugiat. Nunc non lectus mi.
                Integer sit amet velit eget ex hendrerit laoreet.`;

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
