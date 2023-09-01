<script>
	import '../../styles/node.css';
	export let itemToEdit;

	let object;
	$: {
		object = itemToEdit?.item;
	}
	function handleSubmit() {
		// Handle form submission logic here, e.g., sending data to a server.
		console.log(object);
	}
</script>

<div class="form-container p-4 text-sm">
	{#if object}
		<form on:submit={handleSubmit}>
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold">Title</label>
				<input type="text" class="input" bind:value={object.title} />
			</div>
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold">Size</label>
				<input type="number" class="input" bind:value={object.size} />
			</div>
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold">Image URL</label>
				<input type="text" class="input" bind:value={object.imageUrl} />
			</div>
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold">Description (Markdown)</label>
				<textarea class="input" bind:value={object.descriptionMD} />
			</div>
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold">Prompts</label>
				<input type="text" class="input" bind:value={object.prompts} />
			</div>

			<div class="mb-4">
				<button type="submit" class="button"> Save </button>
			</div>
		</form>
	{/if}}
</div>

<style>
	/* Add Tailwind CSS classes here for styling */
	.form-container {
		max-width: 32rem;
		margin: 0 auto;
	}
</style>
