<script>
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import { mixColors } from '$lib/shared/helpers/helper';
	import TimelineLine from './TimelineLine.svelte';
	import TimelineDatePoint from './TimelineDatePoint.svelte';
	import TimelineCard from './TimelineCard.svelte';

	export let experienceItem = {
		colors: ['#FF0000', '#0000FF'],
		dates: [new Date(), new Date()],
		baseDescription:
			'My full-stack expertise bridges the front-end and back-end, guaranteeing exceptional web applications, intuitive and user-friendly for clients, and streamlined for efficient B2B interactions.',
		cards: [
			{
				text: '`GitHub Copilot` empowers developers to complete tasks 55% faster with contextualized AI coding assistance across workflows.',
				link: { src: 'asdf', label: 'asdfasdf' },
				variant: 1,
				imageUrls: [
					'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp',
					'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/Vegetables.webp'
				]
			},
			{
				text: '`GitHub Copilot` empowers developers to complete tasks 55% faster with contextualized AI coding assistance across workflows.',
				link: { src: 'asdf', label: 'asdfasdf' },
				variant: 2,
				imageUrls: [
					'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp',
					'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/Vegetables.webp'
				]
			},
			{
				text: '`GitHub Copilot` empowers developers to complete tasks 55% faster with contextualized AI coding assistance across workflows.',
				link: { src: 'asdf', label: 'asdfasdf' },
				variant: 3,
				imageUrls: [
					'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp',
					'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/Vegetables.webp'
				]
			},
		]
	};

	const giveCorrectColor = (colors, index) => {
		if( index < experienceItem.cards.length -1) return mixColors(...colors)
		return colors[1]
	} 

</script>

<TimelineDatePoint color={experienceItem.colors[0]} dates={experienceItem.dates} />
<div class="relative mt-3 flex gap-8">
	<TimelineLine color={experienceItem.colors[0]} />
	<MarkdownWrapper mdClasses="lg" source={experienceItem.baseDescription} />
</div>
{#each experienceItem.cards as card, index}
	<TimelineCard
		{card}
		color={giveCorrectColor(experienceItem.colors, index )}
		position={index === experienceItem.cards.length - 1 ? 'end' : 'center'}
	/>
{/each}
