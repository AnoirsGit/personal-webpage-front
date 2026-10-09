<!--
	How I work with AI: orchestrator → agents → checks & evals → production, drawn
	as a small constellation (stars on a line with a pulse running along it), then
	the rules behind it. Everything is text; the line is decoration.
-->
<script>
	import { t } from '$lib/shared/i18n';
	import reveal from '$lib/shared/UI/effects/reveal';
	import SectionHead from './ui/SectionHead.svelte';

	$: steps = $t('process.steps');
	$: principles = $t('process.principles');
</script>

<section id="process" class="stage process" aria-labelledby="process-title">
	<div class="wrap">
		<SectionHead
			id="process-title"
			index="02"
			kicker={$t('process.kicker')}
			titleLead={$t('process.titleLead')}
			titleAccent={$t('process.titleAccent')}
			lead={$t('process.lead')}
		/>

		<ol class="pipeline">
			{#each steps as step, i (step.id)}
				<li class="step" use:reveal={{ delay: i * 90 }} data-scene-occlude>
					<span class="step-star" aria-hidden="true" />
					<p class="step-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>
					<h3 class="step-name">{step.name}</h3>
					<p class="step-text">{step.text}</p>
				</li>
			{/each}
		</ol>

		<div class="principles" use:reveal data-scene-occlude>
			<h3 class="principles-title">{$t('process.principlesTitle')}</h3>
			<ul class="principles-list">
				{#each principles as principle}
					<li>
						<strong>{principle.name}</strong>
						<span>{principle.text}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	.pipeline {
		--star: 14px;
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 20px;
		list-style: none;
	}

	/* the line through the stars, and a pulse travelling along it */
	.pipeline::before,
	.pipeline::after {
		content: '';
		position: absolute;
		top: calc(var(--star) / 2 - 1px);
		left: calc(var(--star) / 2);
		right: calc(12.5% - var(--star) / 2);
		height: 2px;
		pointer-events: none;
	}

	.pipeline::before {
		background: linear-gradient(90deg, var(--accent), rgba(232, 199, 126, 0.15));
		opacity: 0.6;
	}

	.pipeline::after {
		width: 90px;
		background: linear-gradient(90deg, transparent, var(--accent-bright), transparent);
		filter: drop-shadow(0 0 6px var(--accent));
		animation: pulse-run 4.2s var(--ease) infinite;
	}

	@keyframes pulse-run {
		from {
			transform: translateX(-90px);
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		85% {
			opacity: 1;
		}
		to {
			transform: translateX(calc(min(100vw, 1200px) * 0.8));
			opacity: 0;
		}
	}

	.step {
		position: relative;
		padding-top: calc(var(--star) + 22px);
	}

	.step-star {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--star);
		height: var(--star);
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 5px rgba(232, 199, 126, 0.12), 0 0 22px 4px var(--accent-glow);
	}

	.step-index {
		margin-bottom: 8px;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}

	.step-name {
		margin-bottom: 10px;
		font-size: clamp(1.25rem, 2vw, 1.5rem);
		font-weight: 800;
		letter-spacing: -0.015em;
	}

	.step-text {
		color: var(--text-dim);
		text-wrap: pretty;
	}

	.principles {
		margin-top: clamp(48px, 7vw, 80px);
		padding: clamp(22px, 3vw, 32px);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}

	.principles-title {
		margin-bottom: 18px;
		font-size: 1.125rem;
		font-weight: 800;
	}

	.principles-list {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 22px;
		list-style: none;
	}

	.principles-list li {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-left: 16px;
		border-left: 2px solid var(--accent);
	}

	.principles-list strong {
		font-weight: 800;
	}

	.principles-list span {
		color: var(--text-dim);
	}

	@media (max-width: 900px) {
		.pipeline {
			grid-template-columns: 1fr;
			gap: 28px;
			padding-left: calc(var(--star) + 20px);
		}

		.pipeline::before,
		.pipeline::after {
			top: calc(var(--star) / 2);
			bottom: 40px;
			left: calc(var(--star) / 2 - 1px);
			right: auto;
			width: 2px;
			height: auto;
		}

		.pipeline::before {
			background: linear-gradient(180deg, var(--accent), rgba(232, 199, 126, 0.15));
		}

		.pipeline::after {
			display: none;
		}

		.step {
			padding-top: 0;
		}

		.step-star {
			left: calc(-1 * (var(--star) + 20px));
			top: 4px;
		}

		.principles-list {
			grid-template-columns: 1fr;
		}
	}
</style>
