<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import '$lib/app/styles/sections/Works.css';
	import ImageCard from '$lib/shared/UI/ImageCard.svelte';

	export let professionalExpList = [
		{
			alt: 'NCRM GROUP',
			imageUrl: '',
			description: '',
			tags: ['frontend', 'Angular', 'UI/UX'] // Added UI/UX if relevant to your role
		},
		{
			alt: 'POWR.IO',
			imageUrl: '',
			description: '',
			tags: ['frontend: React', 'backend: Ruby on Rails', 'Node.js'] // Separated frontend/backend and used proper capitalization for Node.js
		},
		{
			alt: 'Careerist Inc',
			imageUrl: '',
			description: '',
			tags: ['fullstack: React, Node.js', 'Moleculer.js'] // Combined frontend/backend with "fullstack" and added period to "Moleculer.js"
		},
		{
			alt: 'DEMETRA SYSTEMS',
			imageUrl: '',
			description: '',
			tags: ['fullstack: Node.js, NestJS', 'Team Lead'] // Combined frontend/backend with "fullstack" and used proper CamelCase for NestJS
		},
		{
			alt: 'MELAMASTA',
			imageUrl: '',
			description: '',
			tags: ['project management'] // Removed unnecessary comma as it's the only tag
		}
	];
</script>

<SectionLayout title="Works" name="works">
	<!-- <CustomTab /> -->
	<h1 class="text-2xl mb-5">Professional Experience</h1>
	<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
		{#each professionalExpList as { alt, imageUrl, description, tags }}
			<div class="w-full h-80"><ImageCard {imageUrl} imageAlt={alt} {description} {tags} /></div>
		{/each}
	</div>
</SectionLayout>
