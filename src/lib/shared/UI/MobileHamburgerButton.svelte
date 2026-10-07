<script>
	import { fade } from 'svelte/transition';
	import { t } from '$lib/shared/i18n';
	export let isActive = true;
	export let onClick;

	$: activeTopLine = `duration-300 ease-in-out w-full h-0.75 bg-white rounded ${
		isActive ? ' translate-y-1 -rotate-45 scale-x-145' : ''
	}`;
	$: activeBotLine = `duration-300 ease-in-out w-full h-0.75 bg-white rounded ${
		isActive ? ' -translate-y-1.5 rotate-45 scale-x-145' : ''
	}`;
</script>

<!-- icon-only: the name comes from the existing "Navigation" string -->
<button
	on:click={onClick}
	class="w-6 h-6 flex flex-col justify-around"
	aria-label={$t('footer.navigation')}
	aria-expanded={isActive}
>
	<div class={activeTopLine} />
	{#if !isActive}
		<div transition:fade={{ duration: 200 }} class="w-full h-0.75 bg-white rounded" />
	{/if}
	<div class={activeBotLine} />
</button>
