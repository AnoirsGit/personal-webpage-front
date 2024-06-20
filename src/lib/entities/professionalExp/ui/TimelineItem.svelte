<script>
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import { mixColors } from '$lib/shared/helpers/color-helper';
	import TimelineLine from './TimelineLine.svelte';
	import TimelineDatePoint from './TimelineDatePoint.svelte';
	import TimelineCard from './TimelineCard.svelte';

	export let experienceItem;

	const giveCorrectColor = (colors, index) => {
		if( index < experienceItem.cards.length -1) {
			const percent = ((index + 1) / (experienceItem.cards.length + 1)) * 100;
			return mixColors(...colors, percent)
		}
		return colors[1]
	} 

</script>

<TimelineDatePoint color={experienceItem.colors[0]} dates={experienceItem.dates} place={experienceItem.place} />
<div class="flex gap-8">
	<TimelineLine heghtClass='' color={experienceItem.colors[0]}  />
	<div class="md-wrapper">
		<div class="flex items-center gap-5 mb-3">
			<div class="mb-2 text-2xl md:text-3xl text-white">{experienceItem.title}</div>
			<div class="mb-2 text-base md:text-2xl text-main-purple m-0">{experienceItem.position}</div>
		</div>
		<MarkdownWrapper mdClasses="xl mh-4 mobile-lg white-code" source={experienceItem.baseDescription} />
	</div>
	<!-- <MarkdownWrapper mdClasses="lg" source={experienceItem.baseDescription} /> -->
</div>
{#each experienceItem.cards as card, index}
	<TimelineCard
		{card}
		color={giveCorrectColor(experienceItem.colors, index )}
		position={index === experienceItem.cards.length - 1 ? 'end' : 'center'}
	/>
{/each}
