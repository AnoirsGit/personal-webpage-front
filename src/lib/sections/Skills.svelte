<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skill.css';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
</script>

<SectionLayout title="Skills">
	<div class="skills-tab">
		<div class="flex-center skills-tab-wrapper">
			<div class="tabs">
				<div class="tab-item">Back End</div>
				<div class="tab-item">Front End</div>
				<div class="tab-item">Dev Ops</div>
			</div>
		</div>
	</div>

	<SkillTree />
</SectionLayout>
