<script>
	import { slide } from 'svelte/transition';

	import '$lib/app/styles/header.css';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
	import MobileHamburgerButton from '$lib/shared/UI/MobileHamburgerButton.svelte';
	import { addMessage } from '$lib/shared/stores/messageStore';

	let isActive = false;
	export let navLinks = [
		{ label: 'About me', link: '' },
		{ label: 'Skills', link: '' },
		{ label: 'Works', link: '' },
		{ label: 'Contacts', link: '' },
		{ label: 'Entertainment', link: '' }
	];

	const toggle = () => (isActive = !isActive);
</script>

<header>
	<div class="header-wrapper">
		<div class="app-content header-item">
			<h1 class="text-2xl h-max">Anuar</h1>
			<div class="h-full hidden lg:flex gap-10">
				{#each navLinks as { label, link }}
					<div class="nav-item flex-center"><a href={link}> {label}</a></div>
				{/each}
			</div>
			<div class="hidden lg:block">
				<CustomButton color="dark">Hire me</CustomButton>
			</div>
			<div class="lg:hidden">
				<MobileHamburgerButton onClick={toggle} {isActive} />
			</div>
		</div>
		{#if isActive}
			<div class="py-12 px-8 flex flex-col gap-5 items-center" transition:slide={{ duration: 400 }}>
				{#each navLinks as { label, link }}
					<div class="font-regular text-text-1 hover:text-white"><a href={link}> {label}</a></div>
				{/each}
				<CustomButton color="dark" length="full">Hire me</CustomButton>
			</div>
		{/if}
	</div>
	<!-- Header content goes here -->
</header>
