<script>
	import '$lib/app/styles/UI/tabs.css';

	export let items = ['one', 'two', 'three'];
	export let activeIndex = 0;
	export let onTabChange = () => console.log(items[activeIndex]);

	const handleTabClick = (index) => {
		activeIndex = index;
		onTabChange(items[activeIndex]);
	};
</script>

<div class="w-full h-max overflow-x-hidden">
	<div class="custom-tab">
		<div class="flex-center custom-tab-wrapper">
			<div class="tabs">
				{#each items as item, i}
					<button
						on:click={() => handleTabClick(i)}
						class="tab-item {activeIndex === i ? 'active' : ''}">{item}</button
					>
				{/each}
			</div>
		</div>
	</div>
	<slot />
</div>
