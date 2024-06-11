<script>
	import * as dayjs from 'dayjs';

	import GlowingElement from '$lib/shared/UI/GlowingElement.svelte';
	import '$lib/app/styles/sections/Works.css';

	export let dates = [new Date(), new Date()];
	export let color = '#FFFFFFF';

	const datesToString = () => {
		const datesTemp = [];
		for (const date of dates) datesTemp.push(dayjs(date).format('MMMM YYYY'));
		return datesTemp.join(' - ');
	};
</script>

<div class="flex items-center gap-6 ml-4">
	<div class="timeline-point" style="background: {color}">
		<GlowingElement size="4" intensity="2" {color} />
	</div>
	<div class="text-xl font-semibold">{datesToString()}</div>
</div>
