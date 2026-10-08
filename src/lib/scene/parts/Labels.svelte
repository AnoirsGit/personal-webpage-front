<!--
	HTML captions over the canvas: constellation names, process stages, the home caption and
	the hover card. Svelte renders the text once per locale; World moves them every frame by
	writing transform/opacity only (no layout reads). Decorative — the page carries the
	real copy — so the whole layer is aria-hidden and never takes the pointer.
-->
<script>
	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const { labelDefs, hover, lang } = runtime;

	/** @param {HTMLElement} node @param {string} key */
	const label = (node, key) => {
		let current = key;
		const bind = () => {
			const state = runtime.labels.get(current);
			if (state) {
				state.el = node;
				state.x = state.y = state.o = -1;
			}
		};
		bind();
		return {
			/** @param {string} next */
			update(next) {
				current = next;
				bind();
			},
			destroy() {
				const state = runtime.labels.get(current);
				if (state && state.el === node) state.el = null;
			}
		};
	};

	/** @param {HTMLElement} node */
	const card = (node) => {
		runtime.hoverCard.el = node;
		return {
			destroy() {
				runtime.hoverCard.el = null;
			}
		};
	};
</script>

<div class="scene-labels" aria-hidden="true">
	{#each $labelDefs as def (def.key)}
		<div class="scene-label" use:label={def.key}>
			<span class="scene-label__text scene-label--{def.kind}">{def.text[$lang]}</span>
		</div>
	{/each}
	<div class="scene-card" use:card>
		{#if $hover}
			{#if $hover.sub}<span class="scene-card__sub">{$hover.sub[$lang]}</span>{/if}
			<strong class="scene-card__title">{$hover.title[$lang]}</strong>
			{#if $hover.text}<span class="scene-card__text">{$hover.text[$lang]}</span>{/if}
		{/if}
	</div>
</div>

<style>
	.scene-labels {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		user-select: none;
		-webkit-user-select: none;
		font-family: inherit;
	}

	.scene-label {
		position: absolute;
		left: 0;
		top: 0;
		opacity: 0;
		will-change: transform, opacity;
	}

	.scene-label__text {
		position: absolute;
		left: 0;
		top: 0;
		white-space: nowrap;
		line-height: 1;
		color: rgba(243, 227, 188, 0.86);
		text-shadow: 0 0 10px rgba(7, 5, 26, 0.95), 0 0 2px rgba(7, 5, 26, 0.9);
	}

	.scene-label--constellation {
		transform: translate(-50%, -50%);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.34em;
		text-transform: uppercase;
		color: rgba(243, 227, 188, 0.8);
	}

	.scene-label--stage {
		transform: translate(-50%, 16px);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #f3e3bc;
	}

	.scene-label--agent {
		transform: translate(-50%, calc(-100% - 9px));
		font-size: 11px;
		letter-spacing: 0.06em;
		color: rgba(226, 222, 255, 0.78);
	}

	.scene-label--note {
		transform: translate(-50%, 9px);
		font-size: 11px;
		font-style: italic;
		letter-spacing: 0.04em;
		color: rgba(232, 199, 126, 0.66);
	}

	.scene-label--home {
		transform: translate(14px, -50%);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #f3e3bc;
	}

	.scene-card {
		position: absolute;
		left: 0;
		top: 0;
		opacity: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: max-content;
		max-width: min(280px, 70vw);
		padding: 10px 12px 11px;
		border-radius: 10px;
		background: rgba(10, 8, 30, 0.86);
		border: 1px solid rgba(232, 199, 126, 0.24);
		box-shadow: 0 14px 34px -14px rgba(0, 0, 0, 0.85);
		color: #fff;
		transition: opacity 160ms ease;
		will-change: transform, opacity;
	}

	.scene-card__sub {
		font-size: 10px;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: rgba(232, 199, 126, 0.8);
	}

	.scene-card__title {
		font-size: 14px;
		font-weight: 600;
		line-height: 1.25;
	}

	.scene-card__text {
		font-size: 12px;
		line-height: 1.45;
		color: rgba(226, 222, 255, 0.78);
	}
</style>
