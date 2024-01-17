<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skill.css';
</script>

<div class="skills">
	<div class="flex-center">
		<h1 class="section-header">Skills</h1>
	</div>
	<div class="flex-center skills-tab-wrapper">
		<div class="tabs">
			<div class="tab-item active">Back End</div>
			<div class="tab-item">Front End</div>
			<div class="tab-item">Dev Ops</div>
		</div>
	</div>

	<SkillTree />
</div>
