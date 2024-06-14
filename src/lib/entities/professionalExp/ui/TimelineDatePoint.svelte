<script>
	import * as dayjs from 'dayjs';

	import '$lib/app/styles/sections/Works.css';
	import TimelinePoint from './TimelinePoint.svelte';

	export let dates = [new Date(), new Date()];
	export let color = '#FFFFFFF';

	const datesToString = () => {
		const datesTemp = [];
		for (const date of dates) datesTemp.push(dayjs(date).format('MMMM YYYY'));
		return datesTemp.join(' - ');
	};
</script>

<div class="flex items-center gap-6 ml-4 my-4">
	<TimelinePoint {color} />
	<div class="text-xl font-semibold">{datesToString()}</div>
</div>
