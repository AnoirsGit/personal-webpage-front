<script>
	import '$lib/app/styles/sections/Works.css';

	import { onLoaded } from '$lib/shared/stores/globalStore';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import ExperienceTimeline from '$lib/entities/professionalExp/ExperienceTimeline.svelte';

	const handleWorksLoad = () => onLoaded('works');
</script>

<SectionLayout title="Works" name="works">
	<h1 class="text-2xl mb-5">Professional Experience</h1>
	<div class="font-medium">
		<ExperienceTimeline onExperiencesLoaded={handleWorksLoad} />
	</div>
</SectionLayout>
