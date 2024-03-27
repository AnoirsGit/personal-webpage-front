<script>
	import { messageQueue } from './stores/messageStore';
</script>

<div class="fixed right-5 top-5 z-10">
	{#each messageQueue as message}
		<div class="">{message.charAt(0).toUpperCase() + message.slice(1)}</div>
	{/each}
</div>
