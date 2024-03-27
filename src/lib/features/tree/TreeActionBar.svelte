<script>
	import Icon from '@iconify/svelte';

	export let onNodeAdd = () => {};
</script>

<div class="absolute top-2 left-2 w-max h-max py-1 px-2 lg:p-2 bg-white rounded-lg shadow-md z-60">
	<div class="w-max h-max flex text-slate-800 text-xxs lg:text-xs">
		<button class="flex gap-1 text-sm items-center hover:text-blue-500" on:click={onNodeAdd}>
			<Icon class="text-lg rotate-45" icon="la:neuter" />
			Add Node
		</button>
	</div>
</div>
