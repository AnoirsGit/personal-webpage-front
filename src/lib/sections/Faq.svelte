<!--
	FAQ as native <details>: works without JavaScript, every answer is in the HTML,
	and the same items feed the FAQPage JSON-LD (src/lib/seo/jsonld.js).
-->
<script>
	import { t } from '$lib/shared/i18n';
	import SectionHead from './ui/SectionHead.svelte';

	$: items = $t('faq.items');
</script>

<section id="faq" class="stage faq" aria-labelledby="faq-title">
	<div class="wrap faq-inner">
		<SectionHead
			id="faq-title"
			index="05"
			kicker={$t('faq.kicker')}
			titleLead={$t('faq.titleLead')}
			titleAccent={$t('faq.titleAccent')}
		/>

		<div class="faq-list">
			{#each items as item, i}
				<details class="faq-item" open={i === 0} data-scene-occlude>
					<summary>
						<h3 class="faq-q">{item.q}</h3>
						<span class="faq-mark" aria-hidden="true" />
					</summary>
					<p class="faq-a">{item.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<style>
	.faq-inner {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
		gap: clamp(24px, 5vw, 72px);
		align-items: start;
	}

	.faq-list {
		border-top: 1px solid var(--line);
	}

	.faq-item {
		border-bottom: 1px solid var(--line);
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 22px 0;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	.faq-q {
		font-size: clamp(1.0625rem, 1.6vw, 1.25rem);
		font-weight: 700;
		line-height: 1.4;
		transition: color 0.25s var(--ease);
	}

	summary:hover .faq-q {
		color: var(--accent-bright);
	}

	.faq-mark {
		position: relative;
		flex: none;
		width: 32px;
		height: 32px;
		border: 1px solid var(--line-strong);
		border-radius: 50%;
	}

	.faq-mark::before,
	.faq-mark::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 12px;
		height: 2px;
		margin: -1px 0 0 -6px;
		border-radius: 2px;
		background: var(--accent);
		transition: transform 0.3s var(--ease);
	}

	.faq-mark::after {
		transform: rotate(90deg);
	}

	details[open] .faq-mark::after {
		transform: rotate(0deg);
	}

	.faq-a {
		padding: 0 52px 24px 0;
		color: var(--text-dim);
		text-wrap: pretty;
	}

	@media (max-width: 860px) {
		.faq-inner {
			grid-template-columns: 1fr;
		}

		.faq-a {
			padding-right: 0;
		}
	}
</style>
