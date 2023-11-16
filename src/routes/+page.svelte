<script>
	import LeftNavigationLine from '$lib/components/UI/LeftNavigationLine.svelte';
	import Globe from '$lib/components/globe/globe.svelte';
	import ParticleImage from '$lib/components/canvas-animation/ParticleImage.svelte';
	import Tree from '$lib/components/tree/Tree.svelte';

	import { fps } from '@sveu/browser';
	import GlobeMerged from '$lib/components/globe/globe.svelte';

	const _fps = fps();
</script>

<div class="fixed top-2 right-4">{$_fps}</div>

<section class="flex gap-4">
	<LeftNavigationLine />
	<div class="flex flex-col lg:flex-row gap-12 items-center justify-between w-full">
		<div class="flex-center h-104 w-full lg:w-96 xl:w-1/2">
			<ParticleImage />
		</div>
		<div class="h-104 w-full lg:w-96 xl:w-1/2 relative">
			<h1 class="text-[4.5rem] leading-[4.75rem] font-bold opacity-10 absolute inset-0">
				WEB <br /> DEVELOPER
			</h1>
			<div class="mt-6">
				<p class="text-xl">Hi, it's me</p>
				<h2 class="text-[3rem] leading-[3rem] font-bold">Anuar</h2>
				<p class="text-base mt-8">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et aliquam justo, vel
					tincidunt purus. Vivamus elementum tristique libero, nec bibendum justo consectetur vel.
					Vestibulum id sem eget nisi vestibulum finibus. Quisque bibendum euismod eros, eget luctus
					eros hendrerit eu. Curabitur ultrices scelerisque lacus in feugiat. Nunc non lectus mi.
					Integer sit amet velit eget ex hendrerit laoreet.
				</p>
			</div>
		</div>
	</div>
</section>
<section>
	<Tree isEditMode={true} />
</section>
<section class="h-128">
	<Globe />
</section>
