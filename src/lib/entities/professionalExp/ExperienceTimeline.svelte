<script>
	import dayjs from 'dayjs';
	import '$lib/app/styles/sections/Works.css';

	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import WorkCard from './ui/WorkCard.svelte';
	import reveal from '$lib/shared/UI/effects/reveal';
	import worksMock from '$lib/shared/mocks/works.json';

	export let works = worksMock;

	const formatDate = (date) => {
		if (!date || date === 'Present') return 'Present';
		return dayjs(date.replace(/T$/, '')).format('MMM YYYY');
	};

	const formatRange = (dates) => dates.map(formatDate).join(' — ');
</script>

<div class="works-timeline">
	{#each works as work, workIndex}
		<article class="work-entry" style="--work-color: {work.color}">
			<div class="work-head" use:reveal>
				<span class="work-node" />
				<p class="work-dates">
					<span class="work-range">{formatRange(work.dates)}</span>
					<span class="work-place">{work.place}</span>
				</p>
				<h3 class="work-title">
					{work.title}
					<span class="work-position">{work.position}</span>
				</h3>
				<div class="work-skills">
					{#each work.skills as skill, i}
						<span class="skill-chip" use:reveal={{ delay: 80 + i * 45, y: 10, duration: 450 }}>
							{skill}
						</span>
					{/each}
				</div>
				<div class="work-description">
					<MarkdownWrapper mdClasses="lg mobile-lg white-code" source={work.baseDescription} />
				</div>
			</div>

			<div class="work-cards">
				{#each work.cards as card, cardIndex}
					<WorkCard {card} flip={(workIndex + cardIndex) % 2 === 1} />
				{/each}
			</div>
		</article>
	{/each}

	<div class="work-end" use:reveal={{ y: 12 }}>
		<span class="work-end-node" />
		<p>…and the journey continues</p>
	</div>
</div>
