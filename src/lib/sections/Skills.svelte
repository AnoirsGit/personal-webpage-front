<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skills.css';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import CustomTab from '$lib/shared/UI/CustomTab.svelte';
	import Deferred from '$lib/shared/UI/Deferred.svelte';
	import tree from '$lib/shared/mocks/tree.json'

	const skillCategories = [
		{ key: 'back-end', label: 'BackEnd' },
		{ key: 'front-end', label: 'FrontEnd' },
		// { key: 'dev-ops', label: 'DevOps' }
	];
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
	<Deferred minHeight="600px">
		<SkillTree isEditMode={false} nodes={tree[activeTab].nodes} edges={tree[activeTab].edges} />
	</Deferred>
</SectionLayout>
