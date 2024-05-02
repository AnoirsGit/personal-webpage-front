<script>
	import GlowingElement from '$lib/shared/UI/GlowingElement.svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import * as dayjs from 'dayjs';

	export let professionalExperienceObject = {
		colors: ['#3fff7f', '#3fa2ff'],
		dates: [new Date(), new Date()],
		link: 'https://demetra.systems/',
		description: `#### **DEMETRA.SYSTEMS**
	High-load platform that focuses on providing solutions for environmental monitoring and management.`,
		tags: ['fullstack: Node.js, NestJS', 'Team Lead'] // Combined frontend/backend with "fullstack" and used proper CamelCase for NestJS
	};

	const datesToString = () => {
		const dates = [];
		for (const date of professionalExperienceObject.dates)
			dates.push(dayjs(date).format('MMMM YYYY'));
		return dates.join(' - ');
	};

	const colors = professionalExperienceObject.colors;
</script>

<div class="flex flex-col relative">
	<div class="flex items-center gap-6">
		<div
			class="w-4 h-4 relative rounded-full"
			style="background: {professionalExperienceObject.colors[0]}"
		>
			<GlowingElement size="4" intensity="2" />
		</div>
		<div class="text-lg">{datesToString()}</div>
	</div>
	<div class="relative mt-3">
		<div
			class="absolute left-1.5 rounded-full w-1 h-full"
			style="background-image: linear-gradient(0deg, {colors[0]}00 0px, {colors[0]}40 40px, {colors[0]}FF 100%);"
		/>
		<div class="ml-10 mb-8">
			<MarkdownWrapper source={professionalExperienceObject?.description} mdClasses="lg" />
		</div>
	</div>
	<div class="timeline-item-shadow z-100 rounded-lg border-slate-600 border w-full h-80 bg-dark" />
	<div class="relative mb-3 h-16">
		<div
			class="absolute left-1.5 rounded-full w-1 h-full"
			style="background-image: linear-gradient(180deg, {colors[1]}00 0px, {colors[1]}40 40px, {colors[1]}FF 100%);"
		/>
	</div>
</div>
