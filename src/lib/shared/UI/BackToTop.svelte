<script>
	import { fly } from 'svelte/transition';
	import { t } from '$lib/shared/i18n';
	import Icon from '$lib/sections/ui/Icon.svelte';

	let visible = false;
	let ticking = false;

	const onScroll = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			visible = window.scrollY > 900;
			ticking = false;
		});
	};

	const scrollTop = () => {
		const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
	};
</script>

<svelte:window on:scroll={onScroll} />

{#if visible}
	<button
		type="button"
		transition:fly={{ y: 16, duration: 300 }}
		class="back-to-top"
		on:click={scrollTop}
		aria-label={$t('a11y.backToTop')}
	>
		<Icon name="arrow-up" />
	</button>
{/if}

<style>
	.back-to-top {
		position: fixed;
		right: 18px;
		bottom: 22px;
		z-index: 40;
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border: 1px solid var(--line-strong);
		border-radius: 14px;
		background: rgba(5, 6, 13, 0.8);
		color: var(--text);
		transition: border-color 0.3s var(--ease), color 0.3s var(--ease);
	}

	.back-to-top:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
