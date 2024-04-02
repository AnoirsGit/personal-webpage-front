<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import '$lib/app/styles/sections/Skills.css';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import CustomTab from '$lib/shared/UI/CustomTab/index.svelte';
	import CustomTabItemWrapper from '$lib/shared/UI/CustomTab/CustomTabItemWrapper.svelte';

	const skillCategories = ['BackEnd', 'FrontEnd', 'DevOps'];
	let activeTab = skillCategories[0];
</script>

<SectionLayout title="Skills">
	<CustomTab
		items={skillCategories}
		onTabChange={(tab) => {
			activeTab = tab;
			console.log(tab);
		}}
	/>
	<SkillTree />
	{#if activeTab === skillCategories[0]}
		<CustomTabItemWrapper><div class="w-full h-40 bg-red-400" /></CustomTabItemWrapper>
	{/if}
	{#if activeTab === skillCategories[1]}
		<CustomTabItemWrapper><div class="w-full h-40 bg-blue-400" /></CustomTabItemWrapper>
	{/if}
	{#if activeTab === skillCategories[2]}
		<CustomTabItemWrapper><div class="w-full h-40 bg-green-400" /></CustomTabItemWrapper>
	{/if}
</SectionLayout>
