<script>
	import reveal from '$lib/shared/UI/effects/reveal';

	export let title;
	export let name;
</script>

<section class="section" id={name}>
	<div class="flex-center" use:reveal>
		<h1 class="section-header">{title}</h1>
	</div>
	<div class="w-full" use:reveal={{ delay: 120 }}>
		<slot />
	</div>
</section>
