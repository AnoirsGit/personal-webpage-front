<script>
	import '$lib/app/styles/node.css';
	import Icon from '@iconify/svelte';

	export let node;
	export let onSaveNode;

	let newTag = '';

	const handleSubmit = (event) => {
		event.preventDefault();
		onSaveNode(node);
	};

	const handleAddTag = () => {
		if (newTag.trim() !== '') {
			node.tags = [...node.tags, newTag];
			newTag = '';
		}
	};

	const handleRemoveTag = (index) => {
		node.tags = node.tags.filter((_, i) => i !== index);
	};
</script>

<div class="form-container p-4 text-sm">
	{#if node}
		<form on:submit={handleSubmit}>
			<div class="mb-4">
				<p class="block text-gray-700 text-sm font-bold">Title</p>
				<input type="text" class="input" bind:value={node.title} />
			</div>
			<div class="mb-4">
				<p class="block text-gray-700 text-sm font-bold">Size</p>
				<input type="number" class="input" bind:value={node.size} />
			</div>
			<div class="mb-4">
				<p class="block text-gray-700 text-sm font-bold">Image URL</p>
				<input type="text" class="input" bind:value={node.imageUrl} />
			</div>
			<div class="mb-4">
				<p class="block text-gray-700 text-sm font-bold">Description (Markdown)</p>
				<textarea class="input" bind:value={node.description} rows="5" />
			</div>

			{#if node.tags.length > 0}
				<div class="mb-4">
					<div class="flex flex-wrap gap-3">
						{#each node.tags as tag, index}
							<div
								class="flex-center gap-2 px-3 py-1 border border-deep-dark-bg rounded text-slate-700"
							>
								<p>{tag}</p>
								<button class="w-4 h-4" on:click={() => handleRemoveTag(index)}>
									<Icon icon="material-symbols:edit" /><button />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div class="mb-4">
				<p class="block text-gray-700 text-sm font-bold">Tags</p>
				<div class="flex gap-3">
					<input type="text" class="input" bind:value={newTag} />
					<button class="button w-32" on:click={handleAddTag}>Add Tag</button>
				</div>
			</div>

			<div class="mb-4">
				<button type="submit" class="button"> Save </button>
			</div>
		</form>
	{/if}
</div>

<style>
	.form-container {
		max-width: 32rem;
		margin: 0 auto;
	}
</style>
