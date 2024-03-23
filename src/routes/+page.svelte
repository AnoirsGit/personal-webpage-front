<script>
	import AboutMe from '$lib/sections/AboutMe.svelte';

	import { fps } from '@sveu/browser';
	import Skills from '$lib/sections/Skills.svelte';
	import Works from '$lib/sections/Works.svelte';
	import Contacts from '$lib/sections/Contacts.svelte';

	const _fps = fps();
</script>

<div class="fixed top-24 right-4 text-lg text-white">{$_fps}</div>

<section class="mt-24">
	<AboutMe />
</section>

<section>
	<Skills />
</section>

<section>
	<Works />
</section>

<section>
	<Contacts />
</section>

<section>
	<!-- <ParticleImage/> -->
</section>
