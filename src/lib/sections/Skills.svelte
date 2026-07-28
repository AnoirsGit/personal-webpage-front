<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skills.css';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import CustomTab from '$lib/shared/UI/CustomTab.svelte';
	import Deferred from '$lib/shared/UI/Deferred.svelte';
	import { t } from '$lib/shared/i18n';
	import { skillTree } from '$lib/shared/i18n/content';

	$: skillCategories = [
		{ key: 'ai-agents', label: $t('skills.ai') },
		{ key: 'front-end', label: $t('skills.frontend') },
		{ key: 'back-end', label: $t('skills.backend') }
		// { key: 'dev-ops', label: 'DevOps' }
	];
	let activeTab = 'ai-agents';
</script>

<SectionLayout title={$t('skills.title')} name="skills">
	<CustomTab
		items={skillCategories}
		valueKey="key"
		labelKey="label"
		onTabChange={(tab) => {
			activeTab = tab;
		}}
	/>
	<Deferred minHeight="600px">
		<SkillTree
			isEditMode={false}
			nodes={$skillTree[activeTab].nodes}
			edges={$skillTree[activeTab].edges}
		/>
	</Deferred>
</SectionLayout>
