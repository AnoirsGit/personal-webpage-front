<script>
	import Globe from '$lib/widgets/globe/globe.svelte';
	import ParticleImage from '$lib/widgets/canvas-animation/ParticleImage.svelte';
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';

	import { fps } from '@sveu/browser';
	import SectionTextContent from '$lib/widgets/content/sectionTextContent.svelte';

	const _fps = fps();
</script>

<div class="fixed top-2 right-4">{$_fps}</div>

<section class="flex gap-4">
	<div class="flex flex-col lg:flex-row gap-12 items-center justify-between w-full">
		<div class="flex-center h-104 w-full lg:w-96 xl:w-1/2">
			<ParticleImage />
		</div>
		<div class="w-full lg:w-96 xl:w-1/2">
			<SectionTextContent />
		</div>
	</div>
</section>
<section>
	<SkillTree isEditMode={false} />
</section>
<section class="h-192">
	<div class="h-full">
		<Globe />
	</div>
</section>
