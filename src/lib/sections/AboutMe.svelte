<script>
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	import '$lib/app/styles/sections/AboutMe.css';
	import Typing3D from '$lib/widgets/typing-3d/Typing3D.svelte';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import Deferred from '$lib/shared/UI/Deferred.svelte';
	import StatsStrip from '$lib/widgets/content/StatsStrip.svelte';
	import reveal from '$lib/shared/UI/effects/reveal';
	import { onLoaded, isCloseLoader } from '$lib/shared/stores/globalStore';
	import { aboutMe } from '$lib/shared/mocks/about-me.json';

	export let firstSection = aboutMe.firstBlock;
	export let secondSection = aboutMe.secondBlock;

	let imageEl;

	const handleImageLoad = () => onLoaded('aboutMe');

	// A cached image can finish before hydration attaches on:load — check manually.
	onMount(() => {
		if (imageEl?.complete) handleImageLoad();
	});
</script>

<section class="about-me" class:hero-in={$isCloseLoader}>
	<div class="left-block">
		<h1 class="header-1 text-gradient-heading">Hi, <br /> I'm <span class="text-gradient-gold">Anuar</span></h1>
		<p>FullStack developer</p>
		<CustomButton type="link" href="https://t.me/NoirBegula" size="no">
			<div class="lets-chat-btn">
				<p>Let's chat</p>
				<div class="icon-wrapper">
					<Icon icon="icon-park-outline:telegram" />
				</div>
			</div>
		</CustomButton>
	</div>
	<div class="picture-wrapper">
		<img
			bind:this={imageEl}
			on:load|once={handleImageLoad}
			class="picture"
			crossorigin="anonymous"
			src="images/about-me-bg.webp"
			fetchpriority="high"
			decoding="async"
			alt="Anuar — full-stack developer"
		/>
	</div>
	<div class="right-block">
		<MarkdownWrapper
			mdClasses="lg mh-4 mobile-lg white-code text-card-gray description"
			source={firstSection}
		/>

		<CustomButton
			type="link"
			href="https://docs.google.com/document/d/1AlX-mhyNl8OYVJvX5fUnEdkYC3HJmZEtf0ScIYJ6z4A/edit?usp=drive_link"
			color="transparent"
		>
			<div class="download-btn">
				<p>Download</p>
				<div class="text-2xl">
					<Icon icon="octicon:download-16" />
				</div>
			</div>
		</CustomButton>
	</div>
	<a class="scroll-indicator" href="#skills" aria-label="Scroll down to skills">
		<span class="scroll-mouse"><span class="scroll-wheel" /></span>
		<span class="scroll-hint">scroll</span>
	</a>
</section>

<StatsStrip />

<div class="about-me-2">
	<div class="content-block">
		<div class="about-copy" use:reveal>
			<div class="description-block">
				<MarkdownWrapper
					mdClasses="lg mh-4 mobile-lg white-code text-card-grey description"
					source={secondSection}
				/>
			</div>
			<div class="about-cta">
				<CustomButton
					additionalClasses="flex gap-3 items-center"
					type="link"
					href="https://github.com/AnoirsGit/personal-webpage-front"
					><Icon class="text-3xl" icon="mdi:github" /> Repository</CustomButton
				>
			</div>
		</div>
		<div class="model-stage" use:reveal={{ x: 40, y: 0 }}>
			<span class="model-glow" />
			<span class="model-floor" />
			<Deferred minHeight="26rem">
				<Typing3D />
			</Deferred>
			<span class="model-caption">hover to say hi 👋</span>
		</div>
	</div>
</div>
