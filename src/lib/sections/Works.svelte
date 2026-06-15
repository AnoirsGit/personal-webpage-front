<script>
	import '$lib/app/styles/sections/Works.css';

	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Deferred from '$lib/shared/UI/Deferred.svelte';
	import ExperienceTimeline from '$lib/entities/professionalExp/ExperienceTimeline.svelte';
</script>

<SectionLayout title="Works" name="works">
	<h1 class="text-2xl mb-5">Professional Experience</h1>
	<div class="font-medium">
		<Deferred minHeight="900px">
			<ExperienceTimeline />
		</Deferred>
	</div>
</SectionLayout>
