<script>
	import AboutMe from '$lib/sections/AboutMe.svelte';

	import Skills from '$lib/sections/Skills.svelte';
	import Works from '$lib/sections/Works.svelte';
	import Contacts from '$lib/sections/Contacts.svelte';

	import { fps } from '@sveu/browser';
	const _fps = fps();
</script>


<div class="fixed top-24 right-4 text-lg text-white">{$_fps}</div>
<section class="pt-24" id="about-me">
	<AboutMe />
</section>

<Skills />

<Works />

<Contacts />
