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

<div class="skills-stage rounded-xl">
	<div bind:this={container}
		class="w-full h-96 overflow-scroll rounded-xl relative"
	>
		<div
			class="draggable-content skills-bg-color skills-grid"
			style="
			width: {widthInSections * 100}px;
			height: {heightInSections * 100}px;
			transform-origin: top left;
			transform: scale({scale});
			overflow: hidden;
			position: absolute;
			"
		>
			<slot />
		</div>
	</div>
	<span class="skills-vignette" />
</div>
