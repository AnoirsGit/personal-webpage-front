<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import '$lib/app/styles/sections/Works.css';
	import ImageCard from '$lib/shared/UI/ImageCard.svelte';
	import CustomTab from '$lib/shared/UI/CustomTab/index.svelte';
</script>

<SectionLayout title="Works">
	<CustomTab />
	<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
		<div class="w-full h-80"><ImageCard imageAlt="powr" imageUrl="" /></div>
		<div class="w-full h-80"><ImageCard imageAlt="powr" imageUrl="" /></div>
		<div class="w-full h-80"><ImageCard imageAlt="powr" imageUrl="" /></div>
		<div class="w-full h-80"><ImageCard imageAlt="powr" imageUrl="" /></div>
		<div class="w-full h-80"><ImageCard imageAlt="powr" imageUrl="" /></div>
	</div>
</SectionLayout>
