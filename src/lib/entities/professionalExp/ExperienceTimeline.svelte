<script>
	import { onMount } from 'svelte';
	import '$lib/app/styles/sections/Works.css';
	import TimelineItem from './ui/TimelineItem.svelte';
	import TimelinePoint from './ui/TimelinePoint.svelte';
	import worksMock from '$lib/shared/mocks/works.json';
	import { deviceWidth } from '$lib/shared/stores/globalStore';

	let experiencesLoaded = 0;
	let experiencesCount = 0;
	export let works = worksMock;
	export let onExperiencesLoaded = () =>
		console.log(`Loaded experiences:  ${experiencesLoaded}/${experiencesCount}`);

	$: isMobile = $deviceWidth < 768;

	works = works.map((work, i) => {
		let colors = ['#FFFFFF', '#000000'];
		if (i < works.length - 1) colors = [work.color, works[i + 1].color];
		else {
			colors = [work.color, work.color];
		}
		return { ...work, colors };
	});

	onMount(() => {
		experiencesCount = works.length;
	});

	const handleExperienceLoad = () => {
		experiencesLoaded++;
		if (experiencesLoaded === experiencesCount) onExperiencesLoaded();
	};
</script>

<div class="flex flex-col relative timeline text-card-grey">
	{#each works as work}
		<TimelineItem onCardsLoaded={handleExperienceLoad} {isMobile} experienceItem={work} />
	{/each}
	<div class="mx-2 my-6 md:m-4">
		<TimelinePoint color={works[works.length - 1].color} />
	</div>
</div>
