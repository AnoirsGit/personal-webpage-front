<script>
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import '$lib/app/styles/header.css';
	import MobileHamburgerButton from '$lib/shared/UI/MobileHamburgerButton.svelte';
	import LanguageSwitcher from '$lib/shared/UI/LanguageSwitcher.svelte';
	import { t } from '$lib/shared/i18n';

	let isActive = false;
	export let navLinks = [
		{ key: 'about', link: '#about-me' },
		{ key: 'skills', link: '#skills' },
		{ key: 'works', link: '#works' },
		{ key: 'contacts', link: '#contacts' }
	];

	let activeSection = navLinks[0].link;
	let progress = 0;
	let ticking = false;

	const toggle = () => (isActive = !isActive);
	const closeMenu = () => (isActive = false);

	const onScroll = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			const max = document.documentElement.scrollHeight - window.innerHeight;
			progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
			ticking = false;
		});
	};

	onMount(() => {
		onScroll();

		const sections = navLinks.map(({ link }) => document.querySelector(link)).filter(Boolean);
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeSection = `#${entry.target.id}`;
				}
			},
			{ rootMargin: '-35% 0px -55% 0px' }
		);
		sections.forEach((section) => observer.observe(section));

		return () => observer.disconnect();
	});
</script>

<svelte:window on:scroll={onScroll} />

<header class="header-wrapper">
	<div class="app-content header-item">
		<a class="brand" href="#about-me">
			<img src="images/logo.svg" alt="" />
			<span class="text-2xl h-max font-bold tracking-tight text-gradient-heading">Anuar</span>
		</a>
		<div class="h-full hidden lg:flex gap-10">
			{#each navLinks as { key, link }}
				<div class="nav-item flex-center" class:active={activeSection === link}>
					<a
						class="no-underline text-card-grey hover:text-white transition-colors duration-300"
						href={link}>{$t(`nav.${key}`)}</a
					>
				</div>
			{/each}
		</div>
		<div class="hidden lg:block">
			<LanguageSwitcher />
		</div>
		<div class="lg:hidden">
			<MobileHamburgerButton onClick={toggle} {isActive} />
		</div>
	</div>
	{#if isActive}
		<div class="py-12 px-8 flex flex-col gap-5 items-center" transition:slide={{ duration: 400 }}>
			{#each navLinks as { key, link }}
				<a
					class="no-underline font-regular text-lg text-card-grey hover:text-white transition-colors duration-300"
					href={link}
					on:click={closeMenu}>{$t(`nav.${key}`)}</a
				>
			{/each}
			<LanguageSwitcher size="lg" />
		</div>
	{/if}
	<div class="scroll-progress" style="transform: scaleX({progress})" />
</header>
