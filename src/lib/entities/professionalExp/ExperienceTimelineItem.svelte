<script>
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';

	import '$lib/app/styles/sections/Works.css';
	import TimelineLine from './ui/TimelineLine.svelte';
	import TimelineDatePoint from './ui/TimelineDatePoint.svelte';
	import TimelineCard from './ui/TimelineCard.svelte';

	import { work1 } from '$lib/shared/mocks/works';

	export let professionalExperienceObject = work1;

	const colors = professionalExperienceObject.colors;
</script>

<div class="flex flex-col relative">
	<TimelineDatePoint color={colors[0]} dates={professionalExperienceObject.dates} />
	<div class="relative mt-3">
		<TimelineLine color={colors[0]} />
		<div class="ml-14 mb-4">
			<MarkdownWrapper mdClasses="lg" source={professionalExperienceObject?.description} />
		</div>
	</div>
	{#each professionalExperienceObject.cards as card, index}
		<TimelineCard {card} />
		<div class="relative h-16">
			<TimelineLine
				color={colors[1]}
				position={index === professionalExperienceObject.cards.length - 1 ? 'end' : 'center'}
			/>
		</div>
	{/each}
</div>
