<script>
	import { onMount } from 'svelte';
	import reveal from '$lib/shared/UI/effects/reveal';
	import { t } from '$lib/shared/i18n';
	import { careerStats } from '$lib/shared/i18n/content';

	const values = [
		{ value: careerStats.years, suffix: '+', key: 'stats.years' },
		{ value: careerStats.projects, suffix: '+', key: 'stats.projects' },
		{ value: careerStats.technologies, suffix: '+', key: 'stats.technologies' },
		{ value: careerStats.companies, suffix: '', key: 'stats.companies' }
	];

	$: stats = values.map((stat) => ({ ...stat, label: $t(stat.key) }));

	let strip;
	let display = values.map((stat) => (typeof stat.value === 'number' ? 0 : stat.value));
	const COUNT_MS = 1400;

	const showFinalValues = () => (display = values.map((stat) => stat.value));

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
					const progress = Math.min((now - start) / COUNT_MS, 1);
					const eased = 1 - Math.pow(1 - progress, 3);
					display = values.map((stat) =>
						typeof stat.value === 'number' ? Math.round(stat.value * eased) : stat.value
					);
					if (progress < 1) requestAnimationFrame(tick);
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
