<script>
	import '$lib/app/styles/sections/Works.css';
	import TimelineItem from './ui/TimelineItem.svelte';
	import TimelinePoint from './ui/TimelinePoint.svelte';

	export let works = [
		{
			color: '#FF0000',
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
				}
			]
		},
		{
			color: '#00FF00',
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
				}
			]
		},
		{
			color: '#0000FF',
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
				}
			]
		}
	];

	works = works.map((work, i) => {
		
		let colors = ['#FFFFFF', '#000000'];
		if (i < works.length - 1) colors = [work.color, works[i + 1].color];
		else {
			console.log(i, works.length)
			colors = [work.color, work.color];
		}
		return { ...work, colors };
	});
</script>

<div class="flex flex-col relative timeline">
	{#each works as work}
		<TimelineItem experienceItem={work} />
	{/each}
	<div class="ml-4 my-4">
		<TimelinePoint color={works[length - 1].color} />
	</div>
</div>
