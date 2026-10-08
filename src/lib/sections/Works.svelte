<!--
	Cases with numbers (copy from the dictionaries, every figure from the public CV
	or the old site) and a compact career line built from works.*.json.
-->
<script>
	import { t } from '$lib/shared/i18n';
	import reveal from '$lib/shared/UI/effects/reveal';
	import SectionHead from './ui/SectionHead.svelte';
	import Icon from './ui/Icon.svelte';

	/** @type {{ title: string, position: string, start: string, end: string | null }[]} */
	export let career = [];

	$: cases = $t('works.cases');
	$: span = (job) => `${job.start} — ${job.end ?? $t('works.present')}`;
</script>

<section id="works" class="stage works" aria-labelledby="works-title">
	<div class="wrap">
		<SectionHead
			id="works-title"
			index="03"
			kicker={$t('works.kicker')}
			titleLead={$t('works.titleLead')}
			titleAccent={$t('works.titleAccent')}
			lead={$t('works.lead')}
		/>

		<div class="cases">
			{#each cases as item, i (item.id)}
				<article class="case" use:reveal={{ delay: (i % 3) * 80 }}>
					<p class="case-kicker">{item.kicker}</p>
					<h3 class="case-title">{item.title}</h3>
					<p class="case-metric">
						<span class="metric-value">{item.metric}</span>
						<span class="metric-label">{item.metricLabel}</span>
					</p>
					<ul class="case-points">
						{#each item.points as point}
							<li>{point}</li>
						{/each}
					</ul>
					<ul class="case-stack" aria-label={$t('a11y.stack')}>
						{#each item.stack as tech}
							<li>{tech}</li>
						{/each}
					</ul>
					{#if item.link}
						<a class="case-link" href={item.link.href} target="_blank" rel="noopener">
							{item.link.label}
							<Icon name="arrow-up-right" size={16} />
							<span class="sr-only">({$t('a11y.newTab')})</span>
						</a>
					{/if}
				</article>
			{/each}
		</div>

		{#if career.length}
			<div class="career" use:reveal>
				<h3 class="career-title">{$t('works.careerTitle')}</h3>
				<ol class="career-list">
					{#each career as job}
						<li>
							<span class="career-span">{span(job)}</span>
							<span class="career-company">{job.title}</span>
							<span class="career-role">{job.position}</span>
						</li>
					{/each}
				</ol>
			</div>
		{/if}
	</div>
</section>

<style>
	.cases {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 20px;
	}

	.case {
		display: flex;
		flex-direction: column;
		padding: clamp(22px, 2.4vw, 30px);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
		transition: border-color 0.35s var(--ease), background-color 0.35s var(--ease),
			transform 0.35s var(--ease);
	}

	.case:hover {
		border-color: rgba(232, 199, 126, 0.45);
		background: var(--panel-hover);
		transform: translateY(-3px);
	}

	.case-kicker {
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text-faint);
	}

	.case-title {
		margin-top: 8px;
		font-size: clamp(1.25rem, 1.8vw, 1.45rem);
		font-weight: 800;
		line-height: 1.25;
		letter-spacing: -0.015em;
		text-wrap: balance;
	}

	.case-metric {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 20px 0 18px;
		padding: 16px 0;
		border-block: 1px solid var(--line);
	}

	.metric-value {
		font-size: clamp(2.4rem, 4vw, 3.25rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.04em;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.metric-label {
		font-size: 0.9375rem;
		line-height: 1.45;
		color: var(--text-dim);
	}

	.case-points {
		display: grid;
		gap: 10px;
		list-style: none;
		color: var(--text-dim);
		font-size: 0.98rem;
		line-height: 1.55;
	}

	.case-points li {
		position: relative;
		padding-left: 18px;
	}

	.case-points li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.62em;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		opacity: 0.8;
	}

	.case-stack {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 20px;
		list-style: none;
	}

	.case-stack li {
		padding: 4px 10px;
		border: 1px solid var(--line);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-dim);
	}

	.case-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		align-self: flex-start;
		margin-top: auto;
		padding-top: 18px;
		font-weight: 700;
		text-decoration: none;
	}

	.case-link:hover {
		text-decoration: underline;
	}

	.career {
		margin-top: clamp(40px, 6vw, 64px);
	}

	.career-title {
		margin-bottom: 14px;
		font-size: 1.125rem;
		font-weight: 800;
	}

	.career-list {
		list-style: none;
		border-top: 1px solid var(--line);
	}

	.career-list li {
		display: grid;
		grid-template-columns: 150px minmax(0, 1fr) minmax(0, 1.2fr);
		gap: 6px 20px;
		padding: 14px 0;
		border-bottom: 1px solid var(--line);
	}

	.career-span {
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}

	.career-company {
		font-weight: 700;
	}

	.career-role {
		color: var(--text-dim);
	}

	@media (max-width: 1080px) {
		.cases {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 680px) {
		.cases {
			grid-template-columns: 1fr;
		}

		.career-list li {
			grid-template-columns: 1fr;
			gap: 2px;
		}
	}
</style>
