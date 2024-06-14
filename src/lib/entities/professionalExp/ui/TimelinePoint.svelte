<script>
	import GlowingElement from '$lib/shared/UI/GlowingElement.svelte';
	export let color = '#FFFFFFF';

</script>

<div class="timeline-point" style="background: {color}">
    <GlowingElement size="4" intensity="2" {color} />
</div>