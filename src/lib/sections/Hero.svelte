<!--
	Hero: the promise in one line (the page's only H1), the lead, two calls to
	action and the trust numbers. Text-only on purpose — it is the LCP element and
	must paint from the prerendered HTML; the Earth behind it is the scene's job.
-->
<script>
	import { t } from '$lib/shared/i18n';
	import Icon from './ui/Icon.svelte';
	import magnetic from './ui/magnetic.js';

	$: trust = $t('trust');
	// "AI-агенты" must not break at its hyphen, so hyphenated words stay in one piece
	$: leadWords = $t('hero.titleLead').split(' ');
</script>

<section id="hero" class="hero" aria-labelledby="hero-title">
	<div class="wrap hero-inner">
		<div class="hero-copy">
			<p class="hero-eyebrow" data-scene-occlude>
				<span class="hero-dot" aria-hidden="true" />
				{$t('hero.eyebrow')}
			</p>
			<h1 id="hero-title" class="hero-title" data-scene-occlude data-scene-keepout>
				<span class="hero-title-lead"
					>{#each leadWords as word, i}{#if i}{' '}{/if}<span class:nobr={word.includes('-')}
							>{word}</span
						>{/each}</span
				>
				<span class="accent">{$t('hero.titleAccent')}</span>
			</h1>
			<p class="hero-lead" data-scene-occlude data-scene-keepout>{$t('hero.lead')}</p>
			<div class="hero-ctas" data-scene-occlude>
				<a class="btn btn-primary" href="#contact" use:magnetic>
					{$t('hero.ctaPrimary')}
					<Icon name="arrow-right" />
				</a>
				<a class="btn btn-ghost" href="#works" use:magnetic>{$t('hero.ctaSecondary')}</a>
			</div>
		</div>

		<ul class="trust" aria-label={$t('a11y.trust')} data-scene-occlude>
			{#each trust as item}
				<li class="trust-item">
					<span class="trust-value">{item.value}</span>
					<span class="trust-label">{item.label}</span>
				</li>
			{/each}
		</ul>
	</div>

	<a class="scroll-cue" href="#skills" aria-label={$t('hero.scroll')}>
		<Icon name="arrow-down" size={18} />
	</a>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
		display: flex;
		padding-top: calc(var(--header-h) + clamp(24px, 6vh, 72px));
		padding-bottom: clamp(56px, 9vh, 96px);
	}

	.hero-inner {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: clamp(40px, 8vh, 88px);
	}

	.hero-copy {
		max-width: 760px;
	}

	.hero-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-bottom: clamp(18px, 3vh, 28px);
		padding: 7px 14px 7px 12px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: rgba(5, 6, 13, 0.55);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-dim);
	}

	.hero-dot {
		width: 8px;
		height: 8px;
		flex: none;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 0 var(--accent-glow);
		animation: beacon 2.6s var(--ease) infinite;
	}

	@keyframes beacon {
		0% {
			box-shadow: 0 0 0 0 rgba(232, 199, 126, 0.55);
		}
		70%,
		100% {
			box-shadow: 0 0 0 10px rgba(232, 199, 126, 0);
		}
	}

	.hero-title {
		font-size: clamp(2.6rem, 7vw, 5.75rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.045em;
		text-wrap: balance;
	}

	.hero-title > span {
		display: block;
	}

	.nobr {
		white-space: nowrap;
	}

	.hero-title .accent {
		margin-top: 0.08em;
		font-size: 1.04em;
		letter-spacing: -0.02em;
		text-shadow: 0 0 42px rgba(232, 199, 126, 0.35);
	}

	.hero-lead {
		margin-top: clamp(20px, 3vh, 30px);
		max-width: 620px;
		font-size: clamp(1.0625rem, 1.5vw, 1.25rem);
		line-height: 1.65;
		color: var(--text-dim);
		text-wrap: pretty;
	}

	.hero-ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: clamp(26px, 4vh, 40px);
	}

	.trust {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1px;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--line);
		list-style: none;
	}

	.trust-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: clamp(16px, 2.2vw, 26px);
		background: rgba(6, 8, 18, 0.82);
	}

	.trust-value {
		font-size: clamp(1.9rem, 3.4vw, 2.75rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.trust-label {
		font-size: 0.9375rem;
		line-height: 1.45;
		color: var(--text-dim);
	}

	.scroll-cue {
		position: absolute;
		left: 50%;
		bottom: 18px;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		margin-left: -20px;
		border: 1px solid var(--line);
		border-radius: 50%;
		color: var(--text-dim);
		background: rgba(5, 6, 13, 0.5);
		animation: drift 2.4s ease-in-out infinite;
	}

	.scroll-cue:hover {
		color: var(--accent);
		border-color: var(--accent);
	}

	@keyframes drift {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(5px);
		}
	}

	@media (max-width: 900px) {
		.trust {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.hero-ctas :global(.btn) {
			flex: 1 1 100%;
		}

		.scroll-cue {
			display: none;
		}
	}
</style>
