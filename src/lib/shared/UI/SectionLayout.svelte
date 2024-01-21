<script>
	export let title;
</script>

<div class="section">
	<div class="flex-center">
		<h1 class="section-header">{title}</h1>
	</div>
	<div class="w-full">
		<slot />
	</div>
</div>
