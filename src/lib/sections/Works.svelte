<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import '$lib/app/styles/sections/Works.css';
	// import ImageCard from '$lib/shared/UI/ImageCard.svelte';
	import ProfessionalExpTimelineItem from '$lib/entities/professionalExp/ExperienceTimelineItem.svelte';

	import '$lib/app/styles/sections/Works.css';

	// TODO make it like time-map

	// 	export let professionalExpList = [
	// 		{
	// 			alt: 'NCRM GROUP',
	// 			link: 'ncrm.kz',
	// 			imageUrl: 'ncrm.kz',
	// 			description: `#### **NCRM.KZ - The First Kazakhstani CRM System**
	// A company focused on increasing sales, automation and marketing management.`,
	// 			tags: ['frontend', 'Angular', 'UI/UX'] // Added UI/UX if relevant to your role
	// 		},
	// 		{
	// 			alt: 'POWR.IO',
	// 			link: 'powr.io/about',
	// 			imageUrl: 'https://pub-7d59f46641c04ed49f0b1dca351dc6b9.r2.dev/powr-logo.webp',
	// 			description: `#### **POWR.IO - No-Code Apps and Plugins library for Websites**
	// has become the web’s leading plugin library and has helped over 8 million small businesses grow.`,
	// 			tags: ['frontend: React', 'backend: Ruby on Rails', 'Node.js'] // Separated frontend/backend and used proper capitalization for Node.js
	// 		},
	// 		{
	// 			alt: 'Careerist Inc',
	// 			link: 'www.careerist.com',
	// 			imageUrl: '',
	// 			description: `#### **Careerist.com - LMS career accelerator**
	// Careerist.com is a website for a US-based company offering online courses aimed at helping people land jobs in the tech industry`,
	// 			tags: ['fullstack: React, Node.js', 'Moleculer.js'] // Combined frontend/backend with "fullstack" and added period to "Moleculer.js"
	// 		},
	// 		{
	// 			alt: 'DEMETRA SYSTEMS',
	// 			imageUrl: '',
	// 			link: 'https://demetra.systems/',
	// 			description: `#### **DEMETRA.SYSTEMS - E-Commerce accelerator**
	// High-load platform that focuses on providing solutions for environmental monitoring and management.`,
	// 			tags: ['fullstack: Node.js, NestJS', 'Team Lead'] // Combined frontend/backend with "fullstack" and used proper CamelCase for NestJS
	// 		}
	// 	];
</script>

<SectionLayout title="Works" name="works">
	<!-- <CustomTab /> -->
	<h1 class="text-2xl mb-5">Professional Experience</h1>
	<!-- <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
		{#each professionalExpList as { alt, link, imageUrl, description, tags }}
			<div class="w-full h-80">
				<ImageCard {imageUrl} imageAlt={alt} {link} {description} {tags} />
			</div>
		{/each}
	</div> -->
	<div class="">
		<ProfessionalExpTimelineItem />
	</div>
</SectionLayout>
