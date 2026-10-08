<!--
	Skills, two ways: as constellations in the 3D sky or as a plain list.

	The groups come from the skill tree through `buildConstellations` (the same
	groups the scene draws), handed in by the page's server load. The list is in the
	prerendered HTML in both modes — visually hidden while the sky is shown — and it
	is the only view without WebGL, with reduced motion or without JavaScript.
	The visitor's choice is remembered, and published to the scene as
	`sceneStore.skillsView` so the sky can dim its constellations under the list.
-->
<script>
	import { onMount, tick } from 'svelte';

	import { t } from '$lib/shared/i18n';
	import { hasWebGL } from '$lib/shared/helpers/webgl.js';
	import { sceneStore } from '$lib/scene/sceneStore.js';
	import SectionHead from './ui/SectionHead.svelte';
	import Icon from './ui/Icon.svelte';

	/** @type {{ id: string, name: string, line: string, detailed: boolean, stars: { id: string, title: string, summary: string }[] }[]} */
	export let groups = [];

	const VIEW_KEY = 'skills-view';

	let mounted = false;
	let canSky = false;
	let view = 'list';
	let activeGroup = 'all';
	let query = '';
	let listTop;

	onMount(() => {
		canSky = hasWebGL() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let saved = null;
		try {
			saved = localStorage.getItem(VIEW_KEY);
		} catch {
			// storage blocked: fall back to the default view
		}
		view = canSky && saved !== 'list' ? 'constellations' : 'list';
		mounted = true;
	});

	const setView = (next) => {
		view = next;
		try {
			localStorage.setItem(VIEW_KEY, next);
		} catch {
			// not remembered, still switched
		}
	};

	const openGroup = async (id) => {
		activeGroup = id;
		query = '';
		setView('list');
		await tick();
		listTop?.scrollIntoView({ block: 'start' });
		listTop?.focus({ preventScroll: true });
	};

	const reset = () => {
		activeGroup = 'all';
		query = '';
	};

	$: if (mounted) sceneStore.update((state) => ({ ...state, skillsView: view }));

	const normalize = (text) => text.toLowerCase().replace(/ё/g, 'е');
	$: needle = normalize(query.trim());
	$: matches = (star) =>
		!needle || normalize(star.title).includes(needle) || normalize(star.summary).includes(needle);

	$: total = groups.reduce((sum, group) => sum + group.stars.length, 0);
	$: visible = groups
		.filter((group) => activeGroup === 'all' || group.id === activeGroup)
		.map((group) => ({ ...group, shown: group.stars.filter(matches) }))
		.filter((group) => group.shown.length);
	$: shownCount = visible.reduce((sum, group) => sum + group.shown.length, 0);
	$: sky = mounted && view === 'constellations';
</script>

<section id="skills" class="stage skills" class:sky aria-labelledby="skills-title">
	<div class="wrap skills-inner">
		<SectionHead
			id="skills-title"
			index="01"
			kicker={$t('skills.kicker')}
			titleLead={$t('skills.titleLead')}
			titleAccent={$t('skills.titleAccent')}
			lead={$t('skills.lead')}
		/>

		{#if mounted && canSky}
			<div class="view-switch" role="group" aria-label={$t('skills.view')}>
				<button
					type="button"
					aria-pressed={view === 'constellations'}
					on:click={() => setView('constellations')}
				>
					<Icon name="stars" size={18} />
					{$t('skills.viewSky')}
				</button>
				<button type="button" aria-pressed={view === 'list'} on:click={() => setView('list')}>
					<Icon name="list" size={18} />
					{$t('skills.viewList')}
				</button>
			</div>
		{/if}

		{#if sky}
			<div class="sky-legend">
				<p class="sky-hint">{$t('skills.skyHint')}</p>
				<ul class="legend">
					{#each groups as group (group.id)}
						<li>
							<button type="button" class="legend-item" on:click={() => openGroup(group.id)}>
								<span class="legend-name">{group.name}</span>
								<span class="legend-count">{group.stars.length}</span>
								<span class="sr-only">— {$t('skills.openList')}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="skills-list" class:sr-only={sky}>
			{#if mounted && !sky}
				<div class="list-tools">
					<div class="group-filter" role="group" aria-label={$t('skills.groupsLabel')}>
						<button
							type="button"
							aria-pressed={activeGroup === 'all'}
							on:click={() => (activeGroup = 'all')}
						>
							{$t('skills.all')} <span class="count">{total}</span>
						</button>
						{#each groups as group (group.id)}
							<button
								type="button"
								aria-pressed={activeGroup === group.id}
								on:click={() => (activeGroup = group.id)}
							>
								{group.name} <span class="count">{group.stars.length}</span>
							</button>
						{/each}
					</div>
					<div class="search">
						<label class="sr-only" for="skills-search">{$t('skills.searchLabel')}</label>
						<Icon name="search" size={18} />
						<input
							id="skills-search"
							type="search"
							bind:value={query}
							placeholder={$t('skills.searchPlaceholder')}
							autocomplete="off"
							spellcheck="false"
						/>
					</div>
					<p class="list-status" aria-live="polite">
						{$t('skills.shown', { shown: shownCount, total })}
					</p>
				</div>
			{/if}

			<div
				class="skill-groups"
				class:single={visible.length === 1}
				bind:this={listTop}
				tabindex="-1"
			>
				{#each visible as group (group.id)}
					<section class="skill-group" aria-labelledby="skills-group-{group.id}">
						<div class="group-head">
							<h3 class="group-name" id="skills-group-{group.id}">{group.name}</h3>
							<span class="group-count" aria-hidden="true">{group.shown.length}</span>
						</div>
						<p class="group-line">{group.line}</p>
						{#if group.detailed}
							<ul class="skill-rows">
								{#each group.shown as star (star.id)}
									<li>
										<span class="skill-name">{star.title}</span>
										{#if star.summary}<span class="skill-summary">{star.summary}</span>{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<ul class="skill-chips">
								{#each group.shown as star (star.id)}
									<li>{star.title}</li>
								{/each}
							</ul>
						{/if}
					</section>
				{:else}
					<p class="list-empty">
						{$t('skills.empty', { query: query.trim() })}
						<button type="button" class="link-button" on:click={reset}>{$t('skills.reset')}</button>
					</p>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.skills-inner {
		display: flex;
		flex-direction: column;
	}

	/* the sky view leaves the middle of the section to the 3D constellations */
	.skills.sky .skills-inner {
		min-height: calc(100svh - 2 * clamp(64px, 9vw, 112px));
	}

	.skills.sky .sky-legend {
		margin-top: auto;
	}

	.view-switch {
		display: inline-flex;
		align-self: flex-start;
		gap: 4px;
		margin-bottom: 28px;
		padding: 4px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: rgba(5, 6, 13, 0.6);
	}

	.view-switch button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 18px;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--text-dim);
		transition: background-color 0.3s var(--ease), color 0.3s var(--ease);
	}

	.view-switch button:hover {
		color: var(--text);
	}

	.view-switch button[aria-pressed='true'] {
		background: var(--accent);
		color: var(--accent-ink);
	}

	.sky-hint {
		margin-bottom: 14px;
		color: var(--text-dim);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		list-style: none;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-height: 46px;
		padding: 0 16px;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		background: rgba(5, 6, 13, 0.62);
		font-weight: 700;
		color: var(--text);
		transition: border-color 0.3s var(--ease), background-color 0.3s var(--ease);
	}

	.legend-item:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.legend-count,
	.count,
	.group-count {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}

	.list-tools {
		display: grid;
		grid-template-columns: 1fr minmax(240px, 340px);
		align-items: center;
		gap: 14px 20px;
		margin-bottom: 28px;
	}

	.group-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.group-filter button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 16px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: rgba(5, 6, 13, 0.6);
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--text-dim);
		transition: border-color 0.3s var(--ease), color 0.3s var(--ease),
			background-color 0.3s var(--ease);
	}

	.group-filter button:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}

	.group-filter button[aria-pressed='true'] {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--text);
	}

	.group-filter button[aria-pressed='true'] .count {
		color: var(--accent);
	}

	.search {
		position: relative;
		display: flex;
		align-items: center;
		color: var(--text-faint);
	}

	.search :global(.icon) {
		position: absolute;
		left: 16px;
		pointer-events: none;
	}

	.search input {
		width: 100%;
		min-height: 48px;
		padding: 0 16px 0 44px;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		background: rgba(5, 6, 13, 0.7);
		color: var(--text);
		font: inherit;
		font-size: 1rem;
	}

	.search input::placeholder {
		color: var(--text-faint);
	}

	.search input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	.list-status {
		grid-column: 1 / -1;
		font-size: 0.9375rem;
		color: var(--text-faint);
	}

	.skill-groups {
		columns: 3 300px;
		column-gap: 20px;
	}

	.skill-groups:focus {
		outline: none;
	}

	.skill-groups.single {
		columns: 1;
	}

	.skill-group {
		break-inside: avoid;
		margin-bottom: 20px;
		padding: 22px 22px 18px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}

	.group-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.group-name {
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: -0.01em;
	}

	.group-line {
		margin: 4px 0 16px;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--text-faint);
	}

	.skill-rows {
		display: grid;
		gap: 2px;
		list-style: none;
	}

	.skill-groups.single .skill-rows {
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2px 24px;
	}

	.skill-rows li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 0;
		border-top: 1px solid var(--line);
	}

	.skill-name {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text);
	}

	.skill-summary {
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--text-dim);
	}

	.skill-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		list-style: none;
	}

	.skill-chips li {
		padding: 7px 13px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.03);
		font-size: 0.9375rem;
		font-weight: 600;
		line-height: 1.3;
		color: var(--text);
	}

	.list-empty {
		color: var(--text-dim);
	}

	.link-button {
		margin-left: 6px;
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	@media (max-width: 760px) {
		.list-tools {
			grid-template-columns: 1fr;
		}

		.group-filter {
			flex-wrap: nowrap;
			overflow-x: auto;
			margin-inline: calc(-1 * var(--gutter));
			padding-inline: var(--gutter);
			scrollbar-width: none;
			/* the row scrolls sideways: fade the edge so the cut-off button reads as "more" */
			-webkit-mask-image: linear-gradient(90deg, #000 85%, transparent);
			mask-image: linear-gradient(90deg, #000 85%, transparent);
		}

		.group-filter button {
			flex: none;
		}

		.skill-group {
			padding: 18px 16px 14px;
		}
	}

	/* fine pointers can reach the stars through the empty sky */
	@media (hover: hover) and (pointer: fine) {
		.skills.sky {
			pointer-events: none;
		}

		.skills.sky :global(.section-head),
		.skills.sky .view-switch,
		.skills.sky .sky-legend {
			pointer-events: auto;
		}
	}
</style>
