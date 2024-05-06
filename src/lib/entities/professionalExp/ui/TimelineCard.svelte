<script>
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import Icon from '@iconify/svelte';

	import CustomButton from '$lib/shared/UI/CustomButton.svelte';

	import '$lib/app/styles/sections/Works.css';

	export let card = {
		text: `Hello`,
		link: { src: 'asdf', label: 'asdfasdf' },
		variant: 1,
		imageUrls: [
			'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp',
			'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp'
		]
	};
</script>

<div class="timeline-card {card.variant !== 3 ? 'overflow-hidden' : ''}">
	{#if card.variant === 1}
		<div class="flex flex-col gap-12 w-2/5">
			<MarkdownWrapper mdClasses="xl mh-3" source={card.text} />
			<CustomButton type="link" size="no" href={card.link.src} color="transparent">
				<div class="flex items-center text-lg gap-1">
					<p>{card.link.label}</p>
					<Icon class="text-2xl" icon="mingcute:right-line" />
				</div>
			</CustomButton>
		</div>
		<img
			crossorigin="anonymous"
			class="absolute left-1/2 top-12 w-3/5 h-auto"
			src={card.imageUrls[0]}
			alt=""
		/>
	{:else if card.variant === 2}
		<MarkdownWrapper mdClasses="xl" source={card.text} />
	{:else}
		<MarkdownWrapper mdClasses="xl" source={card.text} />
	{/if}
</div>
