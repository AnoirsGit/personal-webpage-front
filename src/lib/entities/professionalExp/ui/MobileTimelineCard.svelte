<script>
	import Icon from '@iconify/svelte';
	import '$lib/app/styles/sections/Works.css';

	import TimelineLine from './TimelineLine.svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';

	export let position = 'center';
	export let color = '#FF0000';
	export let card = {
		text: '`Lorem ipsum` dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
		link: { src: 'asdf', label: 'asdfasdf' },
		variant: 1,
		imageUrls: [
			'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp',
			'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/Vegetables.webp'
		]
	};
</script>

<div class="mobile-card">
	{#if card.variant === 1}
		<div class="timeline-card variant-1">
			<div class="content z-20">
				<MarkdownWrapper isInline mdClasses="xl mh-4 mobile-lg white-code" source={card.text} />
				{#if card.link}
					<CustomButton type="link" size="no" href={card.link.src} color="transparent">
						<div class="flex items-center text-lg gap-1">
							<p>{card.link.label}</p>
							<Icon class="text-2xl" icon="mingcute:right-line" />
						</div>
					</CustomButton>
				{/if}
			</div>
			<div class="image-wrapper">
				<img crossorigin="anonymous" src={card.imageUrls[0]} alt="" />
			</div>
		</div>
		<div class="relative h-16">
			<TimelineLine {color} {position} />
		</div>
	{:else if card.variant === 2}
		<div class="variant-2-wrapper">
			<div class="relative">
				<img
					class="w-full aspect-[9/16]"
					crossorigin="anonymous"
					src={card.imageUrls[1]}
					alt=""
				/>
				<img
					class="absolute -bottom-32 left-12"
					crossorigin="anonymous"
					src={card.imageUrls[0]}
					alt=""
				/>
			</div>
			<div class="content">
				<TimelineLine heghtClass="" {color} {position} />
				<div class="markdown-wrapper">
					<MarkdownWrapper mdClasses="xl mh-4 mobile-lg white-code" source={card.text} />
				</div>
			</div>
		</div>
	{:else}
		<div class="timeline-card variant-3 overflow-hidden">
			<div class="wrapper">
				<div class="content">
					<MarkdownWrapper mdClasses="xl mh-4 mobile-lg white-code" source={card.text} />
					{#if card.link}
						<CustomButton type="link" size="no" href={card.link.src} color="transparent">
							<div class="flex items-center text-lg gap-1">
								<p>{card.link.label}</p>
								<Icon class="text-2xl" icon="mingcute:right-line" />
							</div>
						</CustomButton>
					{/if}
				</div>
				<img crossorigin="anonymous" src={card.imageUrls[0]} alt="" />
			</div>
		</div>
		<div class="relative h-16">
			<TimelineLine {color} {position} />
		</div>
	{/if}
</div>
