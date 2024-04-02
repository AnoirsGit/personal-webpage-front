<script>
	import { fly } from 'svelte/transition';
</script>

<div
	in:fly={{ duration: 400, opacity: 0, x: '-100%' }}
	out:fly={{ duration: 400, opacity: 0, x: '100%' }}
>
	<slot />
</div>
