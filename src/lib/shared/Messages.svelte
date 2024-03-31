<script>
	import { slide, fade } from 'svelte/transition';

	import Icon from '@iconify/svelte';

	import '$lib/app/styles/UI/message.css';
	import { messageQueue } from './stores/messageStore';
</script>

<div class="messages-wrapper text-lg text-white">
	<div class="flex flex-col gap-3">
		{#each $messageQueue as message}
			<div class="message" in:slide={{ duration: 400, axis: 'y' }} out:fade={{ duration: 400 }}>
				<Icon class="text-2xl mr-1" icon={message.icon || 'mdi:check-bold'} />
				{message.text.charAt(0).toUpperCase() + message.text.slice(1)}
			</div>
		{/each}
	</div>
</div>
