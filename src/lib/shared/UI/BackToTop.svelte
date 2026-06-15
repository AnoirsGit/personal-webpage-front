<script>
	import Icon from '@iconify/svelte';
	import { fly } from 'svelte/transition';

	let visible = false;
	let ticking = false;

	const onScroll = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			visible = window.scrollY > 600;
			ticking = false;
		});
	};

	const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
</script>

<svelte:window on:scroll={onScroll} />

{#if visible}
	<button
		transition:fly={{ y: 16, duration: 300 }}
		class="back-to-top"
		on:click={scrollTop}
		aria-label="Back to top"
	>
		<Icon icon="ph:arrow-up-bold" />
	</button>
{/if}
