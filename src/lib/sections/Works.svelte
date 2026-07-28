<script>
	import '$lib/app/styles/sections/Works.css';

	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Deferred from '$lib/shared/UI/Deferred.svelte';
	import ExperienceTimeline from '$lib/entities/professionalExp/ExperienceTimeline.svelte';
	import { t } from '$lib/shared/i18n';
</script>

<SectionLayout title={$t('works.title')} name="works">
	<h1 class="text-2xl mb-5">{$t('works.subtitle')}</h1>
	<div class="font-medium">
		<Deferred minHeight="900px">
			<ExperienceTimeline />
		</Deferred>
	</div>
</SectionLayout>
