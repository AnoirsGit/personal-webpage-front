<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skills.css';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import CustomTab from '$lib/shared/UI/CustomTab.svelte';

	const skillCategories = ['BackEnd', 'FrontEnd', 'DevOps'];
</script>

<SectionLayout title="Skills">
	<CustomTab items={skillCategories} />
	<SkillTree />
</SectionLayout>
