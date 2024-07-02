<script>
	import '$lib/app/styles/sections/Skills.css';
	import { onMount } from 'svelte';
	
	let scale = 1;
	let container;

	const widthInSections = 20;
	const heightInSections = 20;

    onMount(() => {
		if (container.offsetWidth < 768) scale = 0.4;
		else if (container.offsetWidth < 1024) scale = 0.7;
		container.scrollLeft = ((widthInSections * 100)/2) * scale - container.offsetWidth/2
	});
	
</script>

<div bind:this={container}
	class="w-full h-96 overflow-scroll rounded-xl relative"
>
	<div
		class="draggable-content skills-bg-color"
		style="
		width: {widthInSections * 100}px;
		height: {heightInSections * 100}px;
		transform-origin: top left;
		transform: scale({scale});
		overflow: hidden;
		position: absolute;
		"
	>
		{#each Array(widthInSections) as _, i (i)}
			{#each Array(heightInSections) as _, j (j)}
				<div
					class="absolute skills-section-border"
					style={`width: 100px; height: 100px; top:${i * 100}px; left:${j * 100}px`}
				/>
			{/each}
		{/each}
		<slot />
	</div>
</div>
