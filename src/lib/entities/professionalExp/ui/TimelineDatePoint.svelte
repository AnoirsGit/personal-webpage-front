<script>
	import dayjs from 'dayjs';

	import '$lib/app/styles/sections/Works.css';
	import TimelinePoint from './TimelinePoint.svelte';

	export let dates = [new Date(), new Date()];
	export let color = '#FFFFFFF';
	export let place = "Almaty, Kazakhstan";

	const datesToString = () => {
		const datesTemp = [];
		for (const date of dates) {
			const tempDate = date === '' || date === 'Present'? new Date() : date;
			datesTemp.push(dayjs(tempDate).format('MMMM YYYY'));
		}
		return datesTemp.join(' - ');
	};
</script>

<div class="flex items-center gap-4 md:gap-6 ml-2 my-2 md:ml-4 md:my-4">
	<TimelinePoint {color} />
	<div class="flex flex-col md:flex-row md:gap-6">
		<div class="text-base md:text-xl font-semibold">{datesToString()}</div>
		<div class="text-lg text-main-purple">{place}</div>
	</div>
</div>
