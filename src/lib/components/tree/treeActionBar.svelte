<script>
	import FaNeuter from 'svelte-icons/fa/FaNeuter.svelte';
	export let onNodeAdd = () => {};
</script>

<div class="absolute top-2 left-2 w-max h-max p-2 bg-white rounded-lg shadow-md z-60">
	<div class="w-max h-max flex text-slate-800 text-xs">
		<button class="flex gap-1 items-center hover:text-blue-500" on:click={onNodeAdd}>
			<div class="w-3 h-3 rotate-45"><FaNeuter /></div>
			Add Node
		</button>
	</div>
</div>
