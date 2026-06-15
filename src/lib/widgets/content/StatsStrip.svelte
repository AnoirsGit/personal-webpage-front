<script>
	import { onMount } from 'svelte';
	import reveal from '$lib/shared/UI/effects/reveal';
	import works from '$lib/shared/mocks/works.json';

	const careerStartYear = Math.min(...works.map((work) => parseInt(work.dates[0], 10)));
	const years = new Date().getFullYear() - careerStartYear;
	const companies = works.length;
	const technologies = new Set(works.flatMap((work) => work.skills)).size;
	const projects = works.reduce((total, work) => total + (work.cards?.length ?? 0), 0);

	const stats = [
		{ value: years, suffix: '+', label: 'Years of experience' },
		{ value: projects, suffix: '+', label: 'Projects shipped' },
		{ value: technologies, suffix: '+', label: 'Technologies in production' },
		{ value: companies, suffix: '', label: 'Companies' }
	];

	let strip;
	let display = stats.map((stat) => (typeof stat.value === 'number' ? 0 : stat.value));
	const COUNT_MS = 1400;

	const showFinalValues = () => (display = stats.map((stat) => stat.value));

	onMount(() => {
		if (
			typeof IntersectionObserver === 'undefined' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			showFinalValues();
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();

				const start = performance.now();
				const tick = (now) => {
					const t = Math.min((now - start) / COUNT_MS, 1);
					const eased = 1 - Math.pow(1 - t, 3);
					display = stats.map((stat) =>
						typeof stat.value === 'number' ? Math.round(stat.value * eased) : stat.value
					);
					if (t < 1) requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			},
			{ threshold: 0.4 }
		);
		observer.observe(strip);

		return () => observer.disconnect();
	});
</script>

<div class="stats-strip glass-panel gradient-border" bind:this={strip} use:reveal>
	{#each stats as stat, i}
		<div class="stats-cell">
			<p class="stats-value text-gradient-gold">{display[i]}{stat.suffix}</p>
			<p class="stats-label">{stat.label}</p>
		</div>
	{/each}
</div>
