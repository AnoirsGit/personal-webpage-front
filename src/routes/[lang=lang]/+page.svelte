<script>
	import { onMount } from 'svelte';

	import Seo from '$lib/seo/Seo.svelte';
	import Hero from '$lib/sections/Hero.svelte';
	import Skills from '$lib/sections/Skills.svelte';
	import Process from '$lib/sections/Process.svelte';
	import Works from '$lib/sections/Works.svelte';
	import Offer from '$lib/sections/Offer.svelte';
	import Faq from '$lib/sections/Faq.svelte';
	import Contact from '$lib/sections/Contact.svelte';
	import { trackSceneProgress } from '$lib/sections/sceneProgress.js';

	export let data;

	// tells the 3D scene which stage the reader is in (sceneStore: { section, progress })
	onMount(() => trackSceneProgress());
</script>

<Seo lang={data.lang} groups={data.groups} facts={data.facts} />

<Hero />
<Skills groups={data.groups} />
<Process />
<Works career={data.career} />
<Offer />
<Faq />
<Contact />
