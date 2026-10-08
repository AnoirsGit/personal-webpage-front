<script>
	import Hero from '$lib/sections/Hero.svelte';
	import Skills from '$lib/sections/Skills.svelte';
	import Process from '$lib/sections/Process.svelte';
	import Works from '$lib/sections/Works.svelte';
	import Offer from '$lib/sections/Offer.svelte';
	import Faq from '$lib/sections/Faq.svelte';
	import Contact from '$lib/sections/Contact.svelte';

	export let data;
</script>

<Hero />
<Skills groups={data.groups} />
<Process />
<Works career={data.career} />
<Offer />
<Faq />
<Contact />
