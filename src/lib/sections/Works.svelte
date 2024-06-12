<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import '$lib/app/styles/sections/Works.css';
	import ProfessionalExpTimeline from '$lib/entities/professionalExp/ExperienceTimeline.svelte';

	import '$lib/app/styles/sections/Works.css';
</script>

<SectionLayout title="Works" name="works">
	<h1 class="text-2xl mb-5">Professional Experience</h1>
	<div class="font-medium">
		<ProfessionalExpTimeline />
	</div>
</SectionLayout>
