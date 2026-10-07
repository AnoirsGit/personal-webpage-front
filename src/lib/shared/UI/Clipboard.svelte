<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let text;

	let textarea;

	async function copy() {
		// select() moves focus into the hidden buffer — hand it back afterwards
		const trigger = document.activeElement;
		textarea.select();
		document.execCommand('copy');
		trigger?.focus();
		dispatch('copy');
	}
</script>

<slot {copy} />
<!-- copy buffer only: invisible, so keep it out of the tab order and screen readers -->
<textarea bind:this={textarea} value={text} tabindex="-1" aria-hidden="true" />

<style>
	textarea {
		left: 0;
		bottom: 0;
		margin: 0;
		padding: 0;
		opacity: 0;
		width: 1px;
		height: 1px;
		border: none;
		display: block;
		position: absolute;
	}
</style>
