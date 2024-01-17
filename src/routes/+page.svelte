<script>
	import AboutMe from '$lib/sections/AboutMe.svelte';
	import Globe from '$lib/widgets/globe/globe.svelte';
	import FaGlobe from 'svelte-icons/fa/FaGlobe.svelte';
	import ParticleImage from '$lib/widgets/canvas-animation/ParticleImage.svelte';
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';

	import { fps } from '@sveu/browser';
	import SectionTextContent from '$lib/widgets/content/sectionTextContent.svelte';
	import Skills from '$lib/sections/Skills.svelte';

	const _fps = fps();
</script>

<section class="mt-24">
	<AboutMe />
</section>

<section>
	<Skills />
</section>
<!-- 
<section class="flex gap-4">
	<div class="flex flex-col lg:flex-row gap-12 items-center justify-between w-full">
		<div class="flex-center h-104 w-full lg:w-96 xl:w-1/2">
			<ParticleImage />
		</div>
	</div>
</section>
<section>
	<SkillTree isEditMode={true} />
</section> -->
