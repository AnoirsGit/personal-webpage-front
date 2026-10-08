<!-- Work formats: test week, launch (fixed scope and price), support. No prices on the page. -->
<script>
	import { t } from '$lib/shared/i18n';
	import reveal from '$lib/shared/UI/effects/reveal';
	import SectionHead from './ui/SectionHead.svelte';
	import Icon from './ui/Icon.svelte';
	import magnetic from './ui/magnetic.js';

	$: formats = $t('offer.formats');
</script>

<section id="offer" class="stage offer" aria-labelledby="offer-title">
	<div class="wrap">
		<SectionHead
			id="offer-title"
			index="04"
			kicker={$t('offer.kicker')}
			titleLead={$t('offer.titleLead')}
			titleAccent={$t('offer.titleAccent')}
			lead={$t('offer.lead')}
		/>

		<div class="formats">
			{#each formats as format, i (format.id)}
				<article
					class="format"
					class:featured={format.id === 'launch'}
					use:reveal={{ delay: i * 90 }}
				>
					<p class="format-term">{format.term}</p>
					<h3 class="format-name">{format.name}</h3>
					<p class="format-text">{format.text}</p>
					<ul class="format-points">
						{#each format.points as point}
							<li>{point}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>

		<div class="offer-cta">
			<a class="btn btn-primary" href="#contact" use:magnetic>
				{$t('offer.cta')}
				<Icon name="arrow-right" />
			</a>
		</div>
	</div>
</section>

<style>
	.formats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 20px;
		align-items: stretch;
	}

	.format {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: clamp(24px, 2.6vw, 34px);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}

	.format.featured {
		border-color: rgba(232, 199, 126, 0.55);
		background: radial-gradient(420px 200px at 100% 0%, rgba(232, 199, 126, 0.12), transparent 70%),
			var(--panel);
		box-shadow: 0 0 60px -24px var(--accent-glow);
	}

	.format-term {
		align-self: flex-start;
		padding: 5px 12px;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--accent);
	}

	.format-name {
		margin-top: 18px;
		font-size: clamp(1.5rem, 2.4vw, 1.9rem);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.format-text {
		margin-top: 10px;
		color: var(--text-dim);
	}

	.format-points {
		display: grid;
		gap: 12px;
		margin-top: 22px;
		padding-top: 20px;
		border-top: 1px solid var(--line);
		list-style: none;
		font-size: 0.98rem;
	}

	.format-points li {
		position: relative;
		padding-left: 26px;
	}

	.format-points li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.35em;
		width: 14px;
		height: 8px;
		border-left: 2px solid var(--accent);
		border-bottom: 2px solid var(--accent);
		transform: rotate(-45deg);
	}

	.offer-cta {
		margin-top: clamp(32px, 5vw, 48px);
		display: flex;
		justify-content: center;
	}

	@media (max-width: 960px) {
		.formats {
			grid-template-columns: 1fr;
		}
	}
</style>
