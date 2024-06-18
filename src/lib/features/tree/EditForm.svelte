<script>
	import '$lib/app/styles/node.css';
	import ColorPicker from 'svelte-awesome-color-picker';
	import Icon from '@iconify/svelte';

	export let node;
	export let onSaveNode;

	let newTag = '';

	$: if (node) onSaveNode(node);

	const handleAddTag = () => {
		if (newTag.trim() !== '') {
			node = { ...node, tags: [...node.tags, newTag] };
			newTag = '';
		}
	};

	const handleRemoveTag = (index) => {
		node = { ...node, tags: node.tags.filter((_, i) => i !== index) };
	};
</script>

<div class="form-container p-4 text-sm">
	{#if node}
		<div class="mb-4">
			<p class="block text-gray-700 text-sm font-bold">Title</p>
			<input type="text" class="input" bind:value={node.title} />
		</div>
		<div class="mb-4 flex">
			<p class="block text-gray-700 text-sm font-bold mr-2">Is Node</p>
			<input type="checkbox"  bind:checked={node.isNode} />
		  </div>
		<div class="mb-4 flex gap-3 items-center">
			<p class="block text-gray-700 text-sm font-bold">Color:</p>
			<ColorPicker bind:hex={node.color} />
		</div>
		{#if node.isNode}
			<div class="mb-4">
				<p class="block text-gray-700 text-sm font-bold">Image URL</p>
				<input type="text" class="input" bind:value={node.imageUrl} />
			</div>
			<div class="mb-4">
				<p class="block text-gray-700 text-sm font-bold">Description (Markdown)</p>
				<textarea class="input" bind:value={node.description} rows="10" />
			</div>

			{#if node.tags.length > 0}
				<div class="mb-4">
					<div class="flex flex-wrap gap-3">
						{#each node.tags as tag, index}
							<div
								class="flex-center gap-2 px-3 py-1 border border-deep-dark-bg rounded text-slate-700"
							>
								<p>{tag}</p>
								<button type="button" on:click={() => handleRemoveTag(index)}>
									<Icon icon="material-symbols:close" />
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
					<button type="button" class="button w-32" on:click={handleAddTag}>Add Tag</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.form-container {
		max-width: 32rem;
		margin: 0 auto;
	}
</style>
