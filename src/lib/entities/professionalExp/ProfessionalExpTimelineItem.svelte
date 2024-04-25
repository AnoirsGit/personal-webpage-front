<script>
	import GlowingElement from '$lib/shared/UI/GlowingElement.svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import * as dayjs from 'dayjs';

	export let professionalExperienceObject = {
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
</script>

<div class="flex flex-col pl-12 gap-3 my-3">
	<div class="flex items-center gap-6">
		<div class="w-4 h-4 relative rounded-full bg-blue-400">
			<GlowingElement size="4" intensity="2" />
		</div>
		<div class="text-lg">{datesToString()}</div>
	</div>
	<div class="relative">
		<div class="absolute left-1.5 rounded-full w-1 h-full bg-white" />
		<div class="ml-10">
			<MarkdownWrapper source={professionalExperienceObject?.description} mdClasses="lg" />
		</div>
		<img
			style=""
			crossorigin="anonymous"
			class="timeline-item-shadow h-full w-full -ml-12 my-12 z-100 relative"
			src="https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp"
			alt=""
		/>
	</div>
</div>
