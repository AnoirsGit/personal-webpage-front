<script>
	import Icon from '@iconify/svelte';
	import '$lib/app/styles/sections/Works.css';

	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import reveal from '$lib/shared/UI/effects/reveal';
	import tilt from '$lib/shared/UI/effects/tilt';
	import { t } from '$lib/shared/i18n';

	export let card;
	export let flip = false;

	/*
	 * A card whose screenshot is missing (or 404s) drops the browser frame
	 * entirely and reflows to a single column — better an intentional text
	 * card than a broken image placeholder.
	 */
	let brokenImages = new Set();

	const markBroken = (src) => (brokenImages = new Set(brokenImages).add(src));

	$: hasLink = card.link?.src?.startsWith('http');
	$: [mainImage, secondaryImage] = card.imageUrls ?? [];
	$: showMain = Boolean(mainImage) && !brokenImages.has(mainImage);
	$: showSecondary = Boolean(secondaryImage) && !brokenImages.has(secondaryImage);
	$: domain = hasLink
		? card.link.src.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
		: $t('works.preview');
</script>

<div
	class="work-card"
	class:flip
	class:no-media={!showMain}
	use:reveal={{ x: flip ? 56 : -56, y: 0, duration: 800 }}
>
	{#if showMain}
		<div class="work-card-media">
			<div class="browser-frame" use:tilt={{ max: 4, scale: 1.01, reverse: true }}>
				<div class="browser-bar">
					<span class="browser-dots"><i /><i /><i /></span>
					<span class="browser-url">
						<Icon icon="mingcute:lock-line" />
						<span>{domain}</span>
					</span>
				</div>
				<div class="browser-screen">
					<img
						class="media-main"
						loading="lazy"
						decoding="async"
						src={mainImage}
						alt=""
						on:error={() => markBroken(mainImage)}
					/>
					<span class="screen-tone" />
				</div>
				{#if showSecondary}
					<img
						class="media-secondary"
						loading="lazy"
						decoding="async"
						src={secondaryImage}
						alt=""
						on:error={() => markBroken(secondaryImage)}
					/>
				{/if}
			</div>
		</div>
	{/if}
	<div class="work-card-body">
		{#if card.role}
			<p class="card-role">{card.role}</p>
		{/if}
		<MarkdownWrapper mdClasses="lg mh-3 mobile-lg white-code" source={card.text} />
		{#if card.metrics?.length}
			<div class="card-metrics">
				{#each card.metrics as metric}
					<span class="metric-chip">
						<strong>{metric.value}</strong>
						<span>{metric.label}</span>
					</span>
				{/each}
			</div>
		{/if}
		{#if card.stack?.length}
			<div class="card-stack">
				{#each card.stack as item}
					<span class="stack-pill">{item}</span>
				{/each}
			</div>
		{/if}
		{#if hasLink}
			<a class="work-card-link" href={card.link.src} target="_blank" rel="noreferrer">
				<span>{card.link.label}</span>
				<Icon icon="mingcute:arrow-right-up-line" />
			</a>
		{/if}
	</div>
</div>
