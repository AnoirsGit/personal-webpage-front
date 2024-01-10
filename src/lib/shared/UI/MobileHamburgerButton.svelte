<script>
	import { fade } from 'svelte/transition';
	export let isActive = true;
	export let onClick;

	$: activeTopLine = `duration-300 ease-in-out w-full h-0.75 bg-white rounded ${
		isActive ? ' translate-y-1 -rotate-45 scale-x-145' : ''
	}`;
	$: activeBotLine = `duration-300 ease-in-out w-full h-0.75 bg-white rounded ${
		isActive ? ' -translate-y-1.5 rotate-45 scale-x-145' : ''
	}`;
</script>

<button on:click={onClick} class="w-6 h-6 flex flex-col justify-around">
	<div class={activeTopLine} />
	{#if !isActive}
		<div transition:fade={{ duration: 200 }} class="w-full h-0.75 bg-white rounded" />
	{/if}
	<div class={activeBotLine} />
</button>
