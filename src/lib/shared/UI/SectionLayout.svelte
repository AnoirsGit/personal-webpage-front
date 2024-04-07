<script>
	export let title;
	export let name;
</script>

<div class="section" id={name}>
	<div class="flex-center">
		<h1 class="section-header">{title}</h1>
	</div>
	<div class="w-full">
		<slot />
	</div>
</div>
