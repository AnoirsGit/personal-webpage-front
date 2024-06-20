<script>
	import dayjs from 'dayjs';

	import '$lib/app/styles/sections/Works.css';
	import TimelinePoint from './TimelinePoint.svelte';

	export let dates = [new Date(), new Date()];
	export let color = '#FFFFFFF';
	export let place = "Almaty, Kazakhstan";

	const datesToString = () => {
		const datesTemp = [];
		for (const date of dates) datesTemp.push(dayjs(date).format('MMMM YYYY'));
		return datesTemp.join(' - ');
	};
</script>

<div class="flex items-center gap-6 ml-4 my-4">
	<TimelinePoint {color} />
	<div class="flex flex-col md:flex-row gap-6">
		<div class="text-lg md:text-xl font-semibold">{datesToString()}</div>
		<div class="text-xl text-main-purple">{place}</div>
	</div>
</div>
