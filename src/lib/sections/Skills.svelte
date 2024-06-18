<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skills.css';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import CustomTab from '$lib/shared/UI/CustomTab.svelte';

	const skillCategories = [
		{ key: 'back-end', label: 'BackEnd' },
		{ key: 'front-end', label: 'FrontEnd' },
		{ key: 'dev-ops', label: 'DevOps' }
	];
	const nodes = [];
	let activeTab = skillCategories[0].key;
</script>

<SectionLayout title="Skills" name="skills">

	<CustomTab
		items={skillCategories}
		valueKey="key"
		labelKey="label"
		onTabChange={(tab) => {
			activeTab = tab;
		}}
	/>
	<SkillTree isEditMode={true} nodes={activeTab === 'back-end' ? undefined : nodes} />
</SectionLayout>
