<script>
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	import '$lib/app/styles/sections/AboutMe.css';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import Deferred from '$lib/shared/UI/Deferred.svelte';
	import StatsStrip from '$lib/widgets/content/StatsStrip.svelte';
	import reveal from '$lib/shared/UI/effects/reveal';
	import { onLoaded, isCloseLoader } from '$lib/shared/stores/globalStore';
	import { t } from '$lib/shared/i18n';
	import { aboutMe } from '$lib/shared/i18n/content';

	$: firstSection = $aboutMe.firstBlock;
	$: secondSection = $aboutMe.secondBlock;

	let imageEl;

	const handleImageLoad = () => onLoaded('aboutMe');

	// A cached image can finish before hydration attaches on:load — check manually.
	onMount(() => {
		if (imageEl?.complete) handleImageLoad();
	});
</script>

<section class="about-me" class:hero-in={$isCloseLoader}>
	<div class="left-block">
		<h1 class="header-1 text-gradient-heading">
			{$t('hero.greeting')} <br />
			{$t('hero.intro')}
			<span class="text-gradient-gold">{$t('hero.name')}</span>
		</h1>
		<p>{$t('hero.role')}</p>
		<CustomButton type="link" href="https://t.me/NoirBegula" size="no">
			<div class="lets-chat-btn">
				<p>{$t('hero.chat')}</p>
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
			alt={$t('hero.portraitAlt')}
		/>
	</div>
	<div class="right-block">
		<MarkdownWrapper
			mdClasses="lg mh-4 mobile-lg white-code text-card-gray description"
			source={firstSection}
		/>

		<CustomButton
			type="link"
			href="/cv/Anuar-Beibit-Full-Stack-Engineer-AI.docx"
			download="Anuar-Beibit-Full-Stack-Engineer-AI.docx"
			color="transparent"
		>
			<div class="download-btn">
				<p>{$t('hero.download')}</p>
				<div class="text-2xl">
					<Icon icon="octicon:download-16" />
				</div>
			</div>
		</CustomButton>
	</div>
	<a class="scroll-indicator" href="#skills" aria-label={$t('hero.scrollAria')}>
		<span class="scroll-mouse"><span class="scroll-wheel" /></span>
		<span class="scroll-hint">{$t('hero.scroll')}</span>
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
					><Icon class="text-3xl" icon="mdi:github" /> {$t('about.repository')}</CustomButton
				>
			</div>
		</div>
		<div class="model-stage" use:reveal={{ x: 40, y: 0 }}>
			<span class="model-glow" />
			<span class="model-floor" />
			<Deferred minHeight="26rem" load={() => import('$lib/widgets/typing-3d/Typing3D.svelte')} />
			<span class="model-caption">{$t('about.modelHint')}</span>
		</div>
	</div>
</div>
