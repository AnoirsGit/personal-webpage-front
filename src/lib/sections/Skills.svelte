<!--
	Skills, two ways: a game-style skill tree (the default) or a plain filterable list.

	Both read the same groups — buildConstellations() through the page's server load — and
	both are complete in the prerendered HTML: the tree is HTML and CSS, so it needs neither
	WebGL nor JavaScript to show every name; script adds the hover card, the pinned panel,
	keyboard moves and the draw-in. The visitor's choice is remembered and published to the
	scene as `sceneStore.skillsView`: behind the tree the 3D constellations stay as a dimmed
	backdrop without captions or hover, behind the list they fade to a trace.
-->
<script>
	import { onMount } from 'svelte';

	import { t } from '$lib/shared/i18n';
	import { sceneStore } from '$lib/scene/sceneStore.js';
	import SectionHead from './ui/SectionHead.svelte';
	import Icon from './ui/Icon.svelte';
	import SkillTree from './skill-tree/SkillTree.svelte';

	/**
	 * @type {{
	 *   id: string, name: string, line: string, detailed: boolean,
	 *   stars: { id: string, title: string, summary: string, tier: 'lead' | 'main' | 'minor', related: string[], cases: string[] }[]
	 * }[]}
	 */
	export let groups = [];

	/*
	 * The remembered view. Until 10.2026 the key was 'skills-view' with 'constellations' |
	 * 'list'; a remembered 'constellations' becomes the tree, 'list' stays the list.
	 */
	const VIEW_KEY = 'skills-view-2';
	const LEGACY_VIEW_KEY = 'skills-view';

	/** @returns {import('$lib/scene/sceneStore.js').SkillsView | null} */
	const readView = () => {
		try {
			const saved = localStorage.getItem(VIEW_KEY);
			if (saved === 'tree' || saved === 'list') return saved;
			const legacy = localStorage.getItem(LEGACY_VIEW_KEY);
			if (legacy === null) return null;
			const migrated = legacy === 'list' ? 'list' : 'tree';
			localStorage.setItem(VIEW_KEY, migrated);
			localStorage.removeItem(LEGACY_VIEW_KEY);
			return migrated;
		} catch {
			return null; // storage blocked: the default view
		}
	};

	let mounted = false;
	/** @type {import('$lib/scene/sceneStore.js').SkillsView} */
	let view = 'tree';
	let activeGroup = 'all';
	let query = '';
	let listTop;
	/** @type {HTMLElement} */
	let section;

	const inView = () => {
		const rect = section?.getBoundingClientRect();
		return Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
	};

	onMount(() => {
		// never flip the section under a reader who is already looking at it
		if (readView() === 'list' && !inView()) view = 'list';
		mounted = true;
	});

	/** @param {import('$lib/scene/sceneStore.js').SkillsView} next */
	const setView = (next) => {
		view = next;
		try {
			localStorage.setItem(VIEW_KEY, next);
		} catch {
			// not remembered, still switched
		}
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
	$: list = view === 'list';
</script>

<section id="skills" class="stage skills" aria-labelledby="skills-title" bind:this={section}>
	<div class="wrap skills-inner">
		<SectionHead
			id="skills-title"
			index="01"
			kicker={$t('skills.kicker')}
			titleLead={$t('skills.titleLead')}
			titleAccent={$t('skills.titleAccent')}
			lead={$t('skills.lead')}
		/>

		<div class="skills-bar">
			<div class="view-switch" role="group" aria-label={$t('skills.view')} data-scene-occlude>
				<button type="button" aria-pressed={!list} on:click={() => setView('tree')}>
					<Icon name="tree" size={18} />
					{$t('skills.viewTree')}
				</button>
				<button type="button" aria-pressed={list} on:click={() => setView('list')}>
					<Icon name="list" size={18} />
					{$t('skills.viewList')}
				</button>
			</div>
			{#if !list}
				<p class="tree-hint" data-scene-occlude>
					<span class="hint-pointer">{$t('skills.tree.hintPointer')}</span>
					<span class="hint-touch">{$t('skills.tree.hintTouch')}</span>
				</p>
			{/if}
		</div>

		{#if !list}
			<SkillTree {groups} />
		{:else}
			<div class="skills-list">
				<div class="list-tools" data-scene-occlude>
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

				<div
					class="skill-groups"
					class:single={visible.length === 1}
					bind:this={listTop}
					tabindex="-1"
				>
					{#each visible as group (group.id)}
						<section
							class="skill-group"
							aria-labelledby="skills-group-{group.id}"
							data-scene-occlude
						>
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
						<p class="list-empty" data-scene-occlude>
							{$t('skills.empty', { query: query.trim() })}
							<button type="button" class="link-button" on:click={reset}
								>{$t('skills.reset')}</button
							>
						</p>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.skills-inner {
		display: flex;
		flex-direction: column;
	}

	.skills-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 24px;
		margin-bottom: clamp(24px, 4vw, 40px);
	}

	.view-switch {
		display: inline-flex;
		gap: 4px;
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

	.tree-hint {
		max-width: 46ch;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--text-faint);
	}

	.hint-touch {
		display: none;
	}

	@media (hover: none), (pointer: coarse) {
		.hint-pointer {
			display: none;
		}

		.hint-touch {
			display: inline;
		}
	}

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
</style>
