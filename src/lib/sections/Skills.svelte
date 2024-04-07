<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skills.css';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import CustomTab from '$lib/shared/UI/CustomTab.svelte';

	const skillCategories = ['BackEnd', 'FrontEnd', 'DevOps'];
	let activeTab = skillCategories[0];
</script>

<SectionLayout title="Skills" name="skills">
	<CustomTab
		items={skillCategories}
		onTabChange={(tab) => {
			activeTab = tab;
		}}
	/>
	<SkillTree isEditMode={false} section={activeTab} />
</SectionLayout>
