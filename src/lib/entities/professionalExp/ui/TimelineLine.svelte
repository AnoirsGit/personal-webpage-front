<script>
	import '$lib/app/styles/sections/Works.css';

	export let position = 'start';
	export let color = '#FFFFFFF';
	export let heghtClass = 'h-16';
	let deg = 0;

	if (position === 'end') deg = 180;

	const gradientFade = (color, deg) => {
		if (position === 'center')
			return `background-image: linear-gradient(0deg, ${color}00 0px, ${color}89 40px, ${color}FF 50%, ${color}89 calc(100% - 40px), ${color}00 100%);`;
		else
			return `background-image: linear-gradient(${deg}deg, ${color}00 0px, ${color}89 40px, ${color}FF 100%);`;
	};
</script>

<div class="timeline-line flex-none {heghtClass} w-1 ml-[1.375rem]" style={gradientFade(color, deg)} />
