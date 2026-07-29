<!--
	Read-only skill tree for the public page.

	Exists as its own module so `Skills.svelte` can pull it (and with it the
	~150 kB of tree geometry) through a dynamic import once the section is
	actually approached.
-->
<script>
	import SkillTree from '$lib/widgets/skill-tree/SkillTree.svelte';
	import { skillTree } from '$lib/shared/i18n/content.skill-tree';

	export let activeTab;

	$: branch = $skillTree[activeTab];
</script>

<SkillTree isEditMode={false} nodes={branch.nodes} edges={branch.edges} />
