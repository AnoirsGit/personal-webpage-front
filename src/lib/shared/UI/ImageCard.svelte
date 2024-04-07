<script>
	import '$lib/app/styles/imageCard.css';
	import Icon from '@iconify/svelte';
	import CustomButton from './CustomButton.svelte';
	import MarkdownWrapper from '../MarkdownWrapper.svelte';
	export let imageUrl;
	export let imageAlt;
	export let tags = ['dorime', 'ameno'];
	export let description = ``;
</script>

<div class="image-card group">
	<img src={imageUrl} alt={imageAlt} class="w-full h-full" />
	<div class="card-hover-content group-hover:translate-y-0">
		<div class="flex flex-col gap-3">
			<div class="flex gap-3 flex-wrap">
				{#each tags as tag}
					<div class="w-max bg-main-purple py-1 px-2 rounded-lg text-white text-sm">
						{tag}
					</div>
				{/each}
			</div>
			<MarkdownWrapper source={description} />
			<CustomButton color="transparent" size="no" type="link">
				<div class="flex gap-1 px-4 py-1 border-b-2 border-main-purple">
					<p>Open</p>
					<div class="text-xl rotate-90">
						<Icon icon="lucide:arrow-up" />
					</div>
				</div>
			</CustomButton>
		</div>
	</div>
</div>
