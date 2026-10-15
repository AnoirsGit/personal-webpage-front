<!--
	@component
	The skills as a skill tree drawn as a star chart: the root («AI-native engineer») and one
	group of buildConstellations() at a time as a constellation (the tabs above it), every
	skill a star with its name beside it. Each group grows from its lead (the brightest star)
	in limbs — chains of stars, the main tools nearest the lead. Where every star goes is
	decided by ./constellation.js, one chart per group; star size and brightness follow what
	the data holds (the group's lead, its main tools, the rest).

	On wide screens the constellation grows up from the root — a large star with its name
	under it — over the Earth of the 3D scene; on phones and tablets it hangs down from the
	root on top, so the page still reads top to bottom. Without JavaScript every group's chart
	shows, one under another.

	All HTML, CSS and one SVG of lines per layout, no canvas: every name is in the prerendered
	page and reads without WebGL or JavaScript, and the lines stay crisp at any pixel ratio.
	The markup is nested lists (root → groups → skills), which is also what a screen reader
	announces; a container query picks the layout from the tree's own width.

	- Hover (or keyboard focus) shows a small card and lights the path from the root; the
	  tree's own links between skills light up as "connected".
	- Click, Enter or Space pins a panel with the details and links to the cases that use the
	  skill (a sheet at the bottom on phones); Escape, the close button or a click outside
	  closes it.
	- One tab stop for the whole tree; arrow keys move to the nearest star in that direction,
	  Home and End jump to the root and the last skill.
	- Each constellation fades in, its lines just after, when it scrolls into view (not with
	  reduced motion; without JavaScript the chart is simply drawn).
-->
<script>
	import { onDestroy, onMount, tick } from 'svelte';

	import { t } from '$lib/shared/i18n';
	import { LAYOUTS, layoutChart, softHyphens } from './constellation.js';

	/**
	 * @typedef {{
	 *   id: string, title: string, summary: string, tier: 'lead' | 'main' | 'minor',
	 *   related: string[], cases: string[]
	 * }} Star
	 * @typedef {{ id: string, name: string, line: string, stars: Star[] }} Group
	 */

	/** @type {Group[]} */
	export let groups = [];

	/* group accents, all from the site palette: warm for the AI-native core, cool for the rest */
	const GOLD = '#e8c77e';
	const ACCENT = {
		agents: GOLD, // accent gold
		llm: '#f3e3bc', // accent-gold-soft
		frontend: '#8f9bff', // the page's blue glow, rgb(92 108 255), lifted for contrast
		backend: '#c08cff', // light purple
		infra: '#a8b4f0' // the globe's lit ink
	};

	/* a four-point star: the root and the groups' leads */
	const SPARKLE =
		'M0 -1 C0.035 -0.17 0.17 -0.035 1 0 C0.17 0.035 0.035 0.17 0 1 C-0.035 0.17 -0.17 0.035 -1 0 C-0.17 -0.035 -0.035 -0.17 0 -1Z';

	/* plain selectors on purpose: the component's styles are scoped, this sheet is not */
	const NO_SCRIPT =
		'<noscript><style>.t-tabs{display:none!important}' +
		'.frame[hidden]{display:block!important;margin-top:64px}</style></noscript>';

	$: rootName = $t('skills.tree.root');
	/* one chart per group: the open one gets the whole width */
	$: charts = groups.map((group) => ({
		group,
		chart: layoutChart([group], { root: rootName, label: softHyphens })
	}));
	$: totalSkills = groups.reduce((sum, group) => sum + group.stars.length, 0);
	/** @param {ReturnType<typeof layoutChart>} chartValue */
	const heightsOf = (chartValue) =>
		LAYOUTS.map(({ id }) => {
			const layout = chartValue.layouts.find((item) => item.id === id);
			return `--h-${id}:${layout?.height ?? 0}px`;
		}).join(';');

	/** the group on screen; the prerender shows the first */
	let activeGroup = '';
	$: if (!groups.some((group) => group.id === activeGroup)) activeGroup = groups[0]?.id ?? '';

	/** the custom properties that place a node in every layout */
	const placeOf = (chartValue, key) => {
		const node = chartValue.nodes.get(key);
		if (!node) return '';
		return LAYOUTS.map(({ id }) => {
			const place = node.place[id];
			return place ? `--x-${id}:${place.x};--y-${id}:${place.y}px;--r-${id}:${place.room}` : '';
		}).join(';');
	};

	/* every node by key: 'root', 'hub:<group>', '<group>:<skill>' */
	$: index = (() => {
		/** @type {Map<string, { key: string, kind: 'root' | 'hub' | 'skill', group?: Group, star?: Star }>} */
		const map = new Map([['root', { key: 'root', kind: 'root' }]]);
		for (const group of groups) {
			map.set(`hub:${group.id}`, { key: `hub:${group.id}`, kind: 'hub', group });
			for (const star of group.stars) {
				const key = `${group.id}:${star.id}`;
				map.set(key, { key, kind: 'skill', group, star });
			}
		}
		return map;
	})();

	$: caseTitles = new Map(
		/** @type {{ id: string, title: string }[]} */ ($t('works.cases') ?? []).map((item) => [
			item.id,
			item.title
		])
	);
	$: titleOf = (group, id) => group.stars.find((star) => star.id === id)?.title ?? '';
	const descId = (key) => `tree-desc-${key.replace(/[^a-z0-9-]/gi, '-')}`;

	/* ---------------- state ---------------- */

	/** every group's chart; `tree` is the open one */
	/** @type {HTMLElement[]} */
	let chartElements = [];
	/** @type {HTMLElement} */
	let tree;
	$: tree = chartElements[groups.findIndex((group) => group.id === activeGroup)];
	/** @type {HTMLElement} */
	let wrap;
	let focusKey = 'root';
	/** @type {string | null} */
	let hoverKey = null;
	/** @type {string | null} */
	let pinnedKey = null;
	/** the last input was the keyboard: focus shows the card too */
	let keyboard = false;

	$: activeKey = pinnedKey ?? hoverKey ?? (keyboard ? focusKey : null);
	$: active = activeKey ? index.get(activeKey) ?? null : null;
	$: related = new Set(
		active?.kind === 'skill' && active.star && active.group
			? active.star.related.map((id) => `${active.group?.id}:${id}`)
			: []
	);
	/** a caption lights the path to its group's lead */
	$: litKey =
		active?.kind === 'hub' && active.group
			? `${active.group.id}:${active.group.stars[0]?.id}`
			: activeKey;

	/* the card: pinned panel, or the hover / focus card */
	$: card = activeKey ? index.get(activeKey) ?? null : null;
	let place = { left: 0, top: 0, below: false };
	/** @type {HTMLElement} */
	let cardTitle;
	/** @type {HTMLElement} */
	let cardElement;
	/** the sticky header and a little air: a card above a star never slides under it */
	const TOP_CLEARANCE = 80;

	/** @param {string} key */
	const nodeElement = (key) =>
		/** @type {HTMLElement | null} */ (tree?.querySelector(`[data-key="${CSS.escape(key)}"]`));

	const placeCard = async (key) => {
		await tick();
		const node = nodeElement(key);
		if (!node || !wrap) return;
		const anchor = /** @type {HTMLElement} */ (node.querySelector('.t-label') ?? node);
		const box = wrap.getBoundingClientRect();
		const rect = anchor.getBoundingClientRect();
		const width = Math.min(320, box.width - 16);
		const height = cardElement?.offsetHeight ?? 220;
		// above the star unless it would run under the header or over the tabs
		const tabs = wrap.querySelector('.t-tabs')?.getBoundingClientRect().bottom ?? 0;
		const below = rect.top - 12 - height < Math.max(TOP_CLEARANCE, tabs + 8);
		place = {
			left: Math.round(Math.min(Math.max(rect.left - box.left - 12, 8), box.width - width - 8)),
			top: Math.round((below ? rect.bottom + 10 : rect.top - 10) - box.top),
			below
		};
	};
	$: if (activeKey) placeCard(activeKey);

	/* ---------------- pointer ---------------- */

	/*
	 * One listener of each kind on the whole tree instead of four on every node: the node is
	 * the closest [data-key] to the event target (the card has none).
	 */
	/** @param {EventTarget | null} target */
	const keyOf = (target) =>
		/** @type {HTMLElement | null} */ (
			/** @type {Element | null} */ (target)?.closest?.('[data-key]')
		)?.dataset.key ?? null;

	/** @param {PointerEvent} event */
	const onPointerOver = (event) => {
		if (event.pointerType === 'touch') return;
		const key = keyOf(event.target);
		if (!key || key === hoverKey) return;
		keyboard = false;
		hoverKey = key;
	};
	/** @param {PointerEvent} event */
	const onPointerOut = (event) => {
		const key = keyOf(event.target);
		if (key && key === hoverKey && keyOf(event.relatedTarget) !== key) hoverKey = null;
	};
	/** @param {FocusEvent} event */
	const onFocusIn = (event) => {
		const key = keyOf(event.target);
		if (key) focusKey = key;
	};
	/** @param {MouseEvent} event */
	const onClick = (event) => {
		const key = keyOf(event.target);
		if (key) pin(key);
	};

	/** @param {string} key */
	const pin = async (key) => {
		focusKey = key;
		if (pinnedKey === key) {
			pinnedKey = null;
			return;
		}
		pinnedKey = key;
		hoverKey = null;
		await tick();
		cardTitle?.focus({ preventScroll: true });
	};

	const unpin = async ({ restore = true } = {}) => {
		const key = pinnedKey;
		pinnedKey = null;
		if (!restore || !key) return;
		await tick();
		focusKey = key;
		nodeElement(key)?.focus({ preventScroll: true });
	};

	/** @param {PointerEvent} event */
	const onDocumentPointer = (event) => {
		if (!pinnedKey) return;
		const target = /** @type {Element | null} */ (event.target);
		if (target?.closest('.t-card') || target?.closest('[data-key]')) return;
		unpin({ restore: false });
	};

	/* ---------------- keyboard: roving focus, spatial arrows ---------------- */

	const centreOf = (element) => {
		const shape = element.querySelector('.t-star') ?? element.querySelector('.t-label') ?? element;
		const rect = shape.getBoundingClientRect();
		return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
	};

	/** @param {'left' | 'right' | 'up' | 'down'} direction */
	const nearest = (direction) => {
		const from = nodeElement(focusKey);
		if (!from) return null;
		const origin = centreOf(from);
		let best = null;
		let bestScore = Infinity;
		for (const element of tree.querySelectorAll('[data-key]')) {
			if (element === from) continue;
			const point = centreOf(element);
			const dx = point.x - origin.x;
			const dy = point.y - origin.y;
			const along = { right: dx, left: -dx, down: dy, up: -dy }[direction];
			const across = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
			if (along < 4) continue;
			const score = along + across * 2.4;
			if (score < bestScore) {
				bestScore = score;
				best = element;
			}
		}
		return best;
	};

	/** @param {HTMLElement | null} element */
	const focusNode = (element) => {
		if (!element) return;
		keyboard = true;
		hoverKey = null;
		if (pinnedKey) pinnedKey = null;
		focusKey = element.dataset.key ?? focusKey;
		element.focus();
	};

	/** @param {KeyboardEvent} event */
	const onKeydown = (event) => {
		if (event.key === 'Escape') {
			if (pinnedKey) {
				event.preventDefault();
				unpin();
			}
			return;
		}
		const target = /** @type {HTMLElement} */ (event.target);
		if (!target.dataset?.key) return;
		const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
		if (keys[event.key]) {
			event.preventDefault();
			focusNode(nearest(keys[event.key]));
		} else if (event.key === 'Home') {
			event.preventDefault();
			focusNode(nodeElement('root'));
		} else if (event.key === 'End') {
			event.preventDefault();
			const all = tree.querySelectorAll('[data-key]');
			focusNode(/** @type {HTMLElement} */ (all[all.length - 1]));
		}
	};

	/* ---------------- each constellation draws in when it scrolls into view ---------------- */

	/** the groups drawn so far; null = all (prerender, reduced motion) */
	let drawn = /** @type {Set<string> | null} */ (null);
	/** @type {IntersectionObserver | undefined} */
	let observer;

	const listeners = /** @type {[string, (event: any) => void][]} */ ([
		['keydown', onKeydown],
		['pointerover', onPointerOver],
		['pointerout', onPointerOut],
		['focusin', onFocusIn],
		['click', onClick]
	]);

	onMount(() => {
		// on the wrapper, not the chart: the pinned card (and its focus) sits beside the chart
		for (const [type, listener] of listeners) wrap.addEventListener(type, listener);
		document.addEventListener('pointerdown', onDocumentPointer, true);
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

		/*
		 * A chart draws in when its caption or its root comes into view. The observer's first
		 * batch says what is already on screen (or above it): that stays drawn, so nothing
		 * blinks on load; a chart still below waits for the scroll. The closed charts have no
		 * box: they wait for their tab (showGroup).
		 */
		observer = new IntersectionObserver(
			(entries) => {
				const next = new Set(drawn ?? []);
				for (const entry of entries) {
					const reached =
						entry.isIntersecting || entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0);
					if (!reached || !entry.boundingClientRect.height) continue;
					next.add(/** @type {HTMLElement} */ (entry.target).dataset.reveal ?? '');
					observer?.unobserve(entry.target);
				}
				drawn = next;
			},
			{ rootMargin: '0px 0px -8% 0px' }
		);
		wrap.querySelectorAll('[data-reveal]').forEach((element) => observer?.observe(element));
	});

	/**
	 * Opens a group's chart. Whatever was hovered or pinned in the old one lets go, the tree's
	 * tab stop moves to the new caption (or stays on the root), and the new chart draws in:
	 * its marks are observed afresh now that they have a box.
	 * @param {string} id
	 */
	const showGroup = async (id) => {
		if (id === activeGroup) return;
		pinnedKey = null;
		hoverKey = null;
		if (focusKey !== 'root') focusKey = `hub:${id}`;
		activeGroup = id;
		if (!observer) return;
		const next = new Set(drawn ?? []);
		next.delete(id);
		drawn = next;
		await tick();
		tree?.querySelectorAll('[data-reveal]').forEach((element) => {
			observer?.unobserve(element);
			observer?.observe(element);
		});
	};

	onDestroy(() => {
		observer?.disconnect();
		for (const [type, listener] of listeners) wrap?.removeEventListener(type, listener);
		if (typeof document !== 'undefined')
			document.removeEventListener('pointerdown', onDocumentPointer, true);
	});

	/** is a group's chart drawn yet */
	$: isOn = (/** @type {string} */ group) => drawn === null || drawn.has(group);

	/** what a screen reader hears after a skill's name: rank, summary, links, cases */
	$: describe = (group, star) => {
		const parts = [];
		if (star.tier === 'lead') parts.push(`${$t('skills.tree.leadSkill')}.`);
		if (star.tier === 'main') parts.push(`${$t('skills.tree.mainSkill')}.`);
		if (star.summary) parts.push(/[.!?…]$/.test(star.summary) ? star.summary : `${star.summary}.`);
		if (star.related.length) {
			const names = star.related.map((id) => titleOf(group, id)).join(', ');
			parts.push(`${$t('skills.tree.connected')}: ${names}.`);
		}
		const cases = star.cases.map((id) => caseTitles.get(id)).filter(Boolean);
		if (cases.length) parts.push(`${$t('skills.tree.cases')}: ${cases.join('; ')}.`);
		return parts.join(' ');
	};
</script>

<div class="skilltree" bind:this={wrap}>
	<!-- without JavaScript the tabs cannot switch: every chart shows, one under another -->
	<!-- a fixed string from this file, no outside input -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html NO_SCRIPT}

	<div class="t-tabs" role="group" aria-label={$t('skills.tree.tabsLabel')} data-scene-occlude>
		{#each groups as group (group.id)}
			<button
				type="button"
				aria-pressed={activeGroup === group.id}
				style:--c={ACCENT[group.id] ?? GOLD}
				on:click={() => showGroup(group.id)}
			>
				{group.name} <span class="t-tab-count">{group.stars.length}</span>
			</button>
		{/each}
	</div>

	<p id="tree-help" class="sr-only">{$t('skills.tree.help')}</p>

	{#each charts as { group, chart }, c (group.id)}
		{@const hubKey = `hub:${group.id}`}
		<div class="frame" hidden={group.id !== activeGroup}>
			<div
				class="chart"
				class:armed={drawn !== null}
				class:has-active={active !== null && group.id === activeGroup}
				role="group"
				aria-label="{$t('skills.tree.label')}: {group.name}"
				aria-describedby="tree-help"
				style={heightsOf(chart)}
				style:--c={ACCENT[group.id] ?? GOLD}
				bind:this={chartElements[c]}
			>
				{#each chart.layouts as layout (layout.id)}
					<svg
						class="lines lines--{layout.id}"
						viewBox="0 0 1000 {layout.height}"
						preserveAspectRatio="none"
						aria-hidden="true"
						focusable="false"
					>
						{#each layout.edges as edge}
							<path
								d={edge.d}
								class="e e--{edge.kind}"
								class:minor={edge.minor}
								class:on={isOn(group.id)}
								class:lit={litKey !== null && edge.leadsTo.has(litKey)}
								style:--c={edge.group ? ACCENT[edge.group] : GOLD}
								vector-effect="non-scaling-stroke"
							/>
						{/each}
					</svg>
				{/each}

				<ul class="t-tree" role="list">
					<li>
						<button
							type="button"
							class="t-node t-root"
							class:on={isOn(group.id)}
							class:is-active={activeKey === 'root' && group.id === activeGroup}
							data-key="root"
							data-reveal={group.id}
							style={placeOf(chart, 'root')}
							style:--c={GOLD}
							tabindex={focusKey === 'root' && group.id === activeGroup ? 0 : -1}
							aria-haspopup="dialog"
							aria-expanded={pinnedKey === 'root' && group.id === activeGroup}
							aria-describedby="tree-desc-root-{group.id}"
						>
							<span class="t-star" aria-hidden="true">
								<span class="t-halo" />
								<svg class="t-orbit" viewBox="-1 -1 2 2" focusable="false">
									<circle r="1.12" />
								</svg>
								<svg viewBox="-1 -1 2 2" focusable="false">
									<path class="t-flare" d={SPARKLE} transform="rotate(45) scale(0.58)" />
									<path d={SPARKLE} />
								</svg>
							</span>
							<span class="t-label">{rootName}</span>
						</button>
						<span id="tree-desc-root-{group.id}" hidden
							>{$t('skills.tree.rootText', { count: totalSkills })}</span
						>

						<ul class="t-groups" role="list">
							<li class="t-group t-group--{group.id}" class:on={isOn(group.id)}>
								<button
									type="button"
									class="t-node t-hub"
									class:is-active={activeKey === hubKey}
									data-key={hubKey}
									data-reveal={group.id}
									style={placeOf(chart, hubKey)}
									tabindex={focusKey === hubKey ? 0 : -1}
									aria-haspopup="dialog"
									aria-expanded={pinnedKey === hubKey}
									aria-describedby={descId(hubKey)}
								>
									<span class="t-label">
										{group.name}
										<span class="t-count" aria-hidden="true">· {group.stars.length}</span>
										<span class="sr-only"
											>{$t('skills.tree.count', { count: group.stars.length })}</span
										>
									</span>
								</button>
								<span id={descId(hubKey)} hidden>{group.line}</span>

								<ul class="t-skills" role="list">
									{#each group.stars as star (star.id)}
										{@const key = `${group.id}:${star.id}`}
										<li>
											<button
												type="button"
												class="t-node t-skill t-{star.tier}"
												class:is-active={activeKey === key}
												class:is-related={related.has(key)}
												data-key={key}
												style={placeOf(chart, key)}
												tabindex={focusKey === key ? 0 : -1}
												aria-haspopup="dialog"
												aria-expanded={pinnedKey === key}
												aria-describedby={descId(key)}
											>
												<span class="t-star" aria-hidden="true">
													{#if star.tier === 'lead'}
														<svg viewBox="-1 -1 2 2" focusable="false"><path d={SPARKLE} /></svg>
													{/if}
												</span>
												<span class="t-label">{softHyphens(star.title)}</span>
											</button>
											<span id={descId(key)} hidden>{describe(group, star)}</span>
										</li>
									{/each}
								</ul>
							</li>
						</ul>
					</li>
				</ul>
			</div>
		</div>
	{/each}

	{#if card}
		<div
			class="t-card"
			class:pinned={pinnedKey !== null}
			class:below={place.below}
			style:left="{place.left}px"
			style:top="{place.top}px"
			style:--c={card.group ? ACCENT[card.group.id] : GOLD}
			role={pinnedKey ? 'dialog' : undefined}
			aria-labelledby={pinnedKey ? 'tree-card-title' : undefined}
			aria-hidden={pinnedKey ? undefined : 'true'}
			data-scene-occlude
			bind:this={cardElement}
		>
			<p class="t-card-kicker">
				{#if card.kind === 'skill'}
					{card.group?.name}
				{:else if card.kind === 'hub'}
					{$t('skills.tree.branch')}
				{:else}
					{$t('meta.siteName')}
				{/if}
			</p>
			<h3 class="t-card-title" id="tree-card-title" tabindex="-1" bind:this={cardTitle}>
				{#if card.kind === 'skill'}
					{card.star?.title}
				{:else if card.kind === 'hub'}
					{card.group?.name}
				{:else}
					{rootName}
				{/if}
			</h3>
			{#if card.kind === 'skill' && card.star && card.group}
				{#if card.star.tier !== 'minor'}
					<p class="t-card-tier">
						{card.star.tier === 'lead' ? $t('skills.tree.leadSkill') : $t('skills.tree.mainSkill')}
					</p>
				{/if}
				{#if card.star.summary}<p class="t-card-text">{card.star.summary}</p>{/if}
				{#if card.star.related.length}
					<p class="t-card-meta">
						<span>{$t('skills.tree.connected')}</span>
						{card.star.related.map((id) => titleOf(card.group, id)).join(', ')}
					</p>
				{/if}
				{#if card.star.cases.length}
					<div class="t-card-meta">
						<span>{$t('skills.tree.cases')}</span>
						<ul class="t-card-cases">
							{#each card.star.cases as id}
								{#if caseTitles.get(id)}
									<li>
										{#if pinnedKey}
											<a href="#case-{id}" on:click={() => unpin({ restore: false })}
												>{caseTitles.get(id)}</a
											>
										{:else}
											{caseTitles.get(id)}
										{/if}
									</li>
								{/if}
							{/each}
						</ul>
					</div>
				{/if}
			{:else if card.kind === 'hub'}
				<p class="t-card-text">{card.group?.line}</p>
				<p class="t-card-meta">
					{$t('skills.tree.countLine', { count: card.group?.stars.length })}
				</p>
			{:else}
				<p class="t-card-text">{$t('skills.tree.rootText', { count: totalSkills })}</p>
			{/if}
			{#if pinnedKey}
				<button
					type="button"
					class="t-card-close"
					aria-label={$t('skills.tree.close')}
					on:click={() => unpin()}
				>
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"
						><path d="M6 6l12 12M18 6 6 18" /></svg
					>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* ======================= the chart ======================= */

	.skilltree {
		position: relative;
	}

	/* the tree picks its layout from its own width (constellation.js LAYOUTS) */
	.frame {
		container: chart / inline-size;
	}

	/* --k: the layout's scale of the type (constellation.js LAYOUTS) */
	.chart {
		--k: 0.84;
		position: relative;
		height: var(--h-n);
	}

	.lines {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.lines--m,
	.lines--w,
	.lines--x {
		display: none;
	}

	.t-tree,
	.t-groups,
	.t-skills {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* ---- lines: thin starlight between the stars; the path from the root lights up ---- */

	.e {
		fill: none;
		stroke: var(--c);
		stroke-width: 1px;
		stroke-opacity: 0.42;
		stroke-linecap: round;
		transition: opacity 1.1s var(--ease) 0.15s, stroke-opacity 0.25s var(--ease),
			stroke-width 0.25s var(--ease);
	}

	.e.minor {
		stroke-opacity: 0.26;
	}

	.e--trunk,
	.e--bough {
		stroke-width: 1.4px;
		stroke-opacity: 0.5;
	}

	.e--stem {
		stroke-opacity: 0.55;
	}

	.has-active .e {
		stroke-opacity: 0.18;
	}

	.has-active .e.lit {
		stroke-width: 1.8px;
		stroke-opacity: 0.95;
	}

	/* ---- stars and their names ---- */

	.t-node {
		--box: 24px;
		position: absolute;
		left: calc(var(--x-n) * 100%);
		top: var(--y-n);
		z-index: 1;
		display: flex;
		align-items: center;
		padding: 5px 0;
		color: var(--text);
		text-align: left;
		transform: translate(calc(var(--box) / -2), -50%);
		-webkit-tap-highlight-color: transparent;
	}

	.t-root {
		--box: 44px;
	}

	.t-lead {
		--box: 34px;
	}

	.t-minor {
		--box: 18px;
	}

	.t-node:focus-visible {
		outline: none;
	}

	.t-node:focus-visible .t-label {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
		border-radius: 4px;
	}

	.t-label {
		display: block;
		max-width: calc(var(--r-n) * 100cqw - var(--box) / 2);
		padding: 0 4px;
		font-size: calc(15.5px * var(--k));
		font-weight: 600;
		line-height: calc(20px * var(--k));
		/* names break between words or after a hyphen (soft hyphens are in the text) */
		overflow-wrap: normal;
		hyphens: manual;
		color: #dfe3f2;
		text-shadow: 0 0 6px rgba(2, 3, 9, 0.95), 0 0 2px rgba(2, 3, 9, 0.9);
		transition: color 0.2s var(--ease);
	}

	.t-root .t-label {
		font-size: calc(20px * var(--k));
		font-weight: 800;
		line-height: calc(25px * var(--k));
		color: #fff;
	}

	.t-lead .t-label {
		font-size: calc(17px * var(--k));
		font-weight: 700;
		line-height: calc(21px * var(--k));
		color: #fff;
	}

	.t-minor .t-label {
		font-size: calc(14.5px * var(--k));
		font-weight: 500;
		line-height: calc(19px * var(--k));
		color: #aab0c8;
	}

	/* the group's caption, in the spaced capitals of a star chart */
	.t-hub {
		transform: translate(-17px, -50%);
	}

	.t-hub .t-label {
		white-space: nowrap;
		font-size: calc(14px * var(--k));
		font-weight: 700;
		line-height: calc(18px * var(--k));
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--c);
	}

	.t-count {
		color: var(--text-faint);
	}

	/*
	 * A star, drawn by the browser so it stays sharp at any pixel ratio: a white-hot core with
	 * a tight glow in the group's colour (::after) and, on the main tools, two hairline rays
	 * that fade towards their tips (::before). The other skills are bare points; the root and
	 * the leads are a slim four-point star (SVG) under the same core. No centring transforms:
	 * the parts sit at whole-pixel margins, so nothing is resampled between pixels.
	 */
	.t-star {
		position: relative;
		flex: none;
		width: var(--box);
		height: var(--box);
		transition: transform 0.25s var(--ease);
	}

	.t-star::before,
	.t-star::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
	}

	.t-star::before {
		--ray: color-mix(in srgb, var(--c, #e8c77e) 45%, #fff);
		width: 30px;
		height: 30px;
		margin: -15px 0 0 -15px;
		background: linear-gradient(90deg, transparent, var(--ray) 50%, transparent) 0 14.5px / 100% 1px
				no-repeat,
			linear-gradient(180deg, transparent, var(--ray) 50%, transparent) 14.5px 0 / 1px 100%
				no-repeat;
		opacity: 0.8;
	}

	.t-star::after {
		width: 6px;
		height: 6px;
		margin: -3px 0 0 -3px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--c, #e8c77e) 50%, transparent),
			0 0 5px 1px color-mix(in srgb, var(--c, #e8c77e) 75%, transparent),
			0 0 12px 2px color-mix(in srgb, var(--c, #e8c77e) 22%, transparent);
	}

	.t-minor .t-star::before,
	.t-lead .t-star::before,
	.t-root .t-star::before {
		display: none;
	}

	.t-minor .t-star::after {
		width: 3px;
		height: 3px;
		margin: -1.5px 0 0 -1.5px;
		background: color-mix(in srgb, var(--c, #e8c77e) 20%, #fff);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--c, #e8c77e) 35%, transparent),
			0 0 4px 1px color-mix(in srgb, var(--c, #e8c77e) 45%, transparent);
	}

	.t-lead .t-star::after,
	.t-root .t-star::after {
		width: 8px;
		height: 8px;
		margin: -4px 0 0 -4px;
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--c, #e8c77e) 60%, transparent),
			0 0 10px 3px color-mix(in srgb, var(--c, #e8c77e) 80%, transparent),
			0 0 28px 7px color-mix(in srgb, var(--c, #e8c77e) 24%, transparent);
	}

	.t-star svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.t-star path {
		fill: color-mix(in srgb, var(--c, #e8c77e) 55%, #fff);
	}

	.t-root .t-star path {
		fill: #f6dfa8;
	}

	/*
	 * The root, the brightest thing in the sky: a slow golden halo that breathes, a second,
	 * smaller four-point flare across the star's own, and a dotted orbit turning once a
	 * minute. All of it decoration of the star's box: nothing here moves the layout.
	 */
	.t-root .t-star {
		filter: drop-shadow(0 0 10px rgba(246, 223, 168, 0.55));
	}

	.t-halo {
		position: absolute;
		inset: -70%;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(246, 223, 168, 0.3) 0,
			rgba(232, 199, 126, 0.12) 32%,
			rgba(232, 199, 126, 0.04) 52%,
			transparent 70%
		);
		pointer-events: none;
		animation: halo 6s ease-in-out infinite;
	}

	@keyframes halo {
		50% {
			opacity: 0.6;
			transform: scale(0.9);
		}
	}

	.t-root .t-star svg.t-orbit {
		animation: orbit 60s linear infinite;
	}

	.t-orbit circle {
		fill: none;
		stroke: rgba(246, 223, 168, 0.45);
		stroke-width: 1px;
		stroke-dasharray: 1 5;
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
	}

	@keyframes orbit {
		to {
			transform: rotate(360deg);
		}
	}

	.t-root .t-star path.t-flare {
		fill: rgba(246, 223, 168, 0.7);
	}

	.t-node.t-root:hover .t-star,
	.t-node.t-root.is-active .t-star {
		transform: scale(1.12);
	}

	/* hover, focus, pinned: the star swells, its name brightens; the linked skills answer */
	.t-node.is-active .t-star,
	.t-node:hover .t-star {
		transform: scale(1.4);
	}

	.t-node.is-active .t-label,
	.t-node:hover .t-label {
		color: #fff;
	}

	.has-active .t-skill:not(.is-active):not(.is-related) .t-label {
		color: #8a90a6;
	}

	.t-node.is-related .t-star {
		transform: scale(1.25);
	}

	.t-node.is-related .t-label {
		color: var(--c);
	}

	/* ---- drawing in: a constellation's stars fade up, then its lines ---- */

	.t-group,
	.t-root {
		transition: opacity 0.9s var(--ease);
	}

	.armed .t-group:not(.on),
	.armed .t-root:not(.on),
	.armed .e:not(.on) {
		opacity: 0;
	}

	/* ======================= the layouts ======================= */

	@container chart (min-width: 600px) {
		.chart {
			--k: 0.94;
			height: var(--h-m);
		}

		.lines--n {
			display: none;
		}

		.lines--m {
			display: block;
		}

		.t-node {
			left: calc(var(--x-m) * 100%);
			top: var(--y-m);
		}

		.t-label {
			max-width: calc(var(--r-m) * 100cqw - var(--box) / 2);
		}
	}

	@container chart (min-width: 1000px) {
		.chart {
			--k: 1;
			height: var(--h-w);
		}

		.lines--m {
			display: none;
		}

		.lines--w {
			display: block;
		}

		.t-node {
			left: calc(var(--x-w) * 100%);
			top: var(--y-w);
		}

		.t-label {
			max-width: calc(var(--r-w) * 100cqw - var(--box) / 2);
		}

		/* the crown: captions centred over their constellations */
		.t-hub {
			transform: translate(-50%, -50%);
		}

		/* the root: a large star, its name centred under it (ROOT_BOX, ROOT_GAP, FONTS.root) */
		.t-root {
			--box: 120px;
			flex-direction: column;
			padding: 0;
			transform: translate(-50%, calc(var(--box) / -2));
		}

		.t-root .t-label {
			max-width: none;
			margin-top: 12px;
			padding: 0 8px;
			white-space: nowrap;
			font-size: 30px;
			line-height: 36px;
			letter-spacing: -0.02em;
			text-align: center;
			background: linear-gradient(90deg, #f6dfa8, #fff 46%, #fff 64%, #f3e3bc);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
			text-shadow: none;
			filter: drop-shadow(0 0 16px rgba(232, 199, 126, 0.35)) drop-shadow(0 0 3px #05060d);
		}

		.t-root .t-star::after {
			width: 14px;
			height: 14px;
			margin: -7px 0 0 -7px;
			box-shadow: 0 0 0 2px rgba(246, 223, 168, 0.7), 0 0 18px 6px rgba(246, 223, 168, 0.75),
				0 0 54px 14px rgba(232, 199, 126, 0.3);
		}
	}

	@container chart (min-width: 1320px) {
		.chart {
			height: var(--h-x);
		}

		.lines--w {
			display: none;
		}

		.lines--x {
			display: block;
		}

		.t-node {
			left: calc(var(--x-x) * 100%);
			top: var(--y-x);
		}

		.t-label {
			max-width: calc(var(--r-x) * 100cqw - var(--box) / 2);
		}
	}

	/* captions never wrap (their room is checked in constellation.js) */
	.t-hub .t-label {
		max-width: none;
	}

	/* ======================= the tabs ======================= */

	.t-tabs {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-bottom: 32px;
	}

	.t-tabs button {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 18px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: rgba(5, 6, 13, 0.6);
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--text-dim);
		transition: border-color 0.3s var(--ease), color 0.3s var(--ease),
			background-color 0.3s var(--ease), box-shadow 0.3s var(--ease);
	}

	.t-tabs button:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}

	.t-tabs button[aria-pressed='true'] {
		border-color: var(--c);
		background: color-mix(in srgb, var(--c) 14%, rgba(5, 6, 13, 0.88));
		box-shadow: 0 0 24px -10px var(--c);
		color: #fff;
	}

	.t-tab-count {
		font-weight: 600;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}

	.t-tabs button[aria-pressed='true'] .t-tab-count {
		color: var(--c);
	}

	/* phones: one row that scrolls sideways, out to the screen's edges */
	@media (max-width: 719.98px) {
		.t-tabs {
			flex-wrap: nowrap;
			justify-content: flex-start;
			margin-inline: -16px;
			padding-inline: 16px;
			overflow-x: auto;
			scrollbar-width: none;
		}

		.t-tabs::-webkit-scrollbar {
			display: none;
		}
	}

	/* ======================= the card ======================= */

	.t-card {
		position: absolute;
		z-index: 5;
		width: min(320px, calc(100% - 16px));
		padding: 14px 16px 15px;
		border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
		border-radius: var(--radius-sm);
		background: #080916;
		box-shadow: 0 22px 48px -18px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
		transform: translateY(-100%);
		pointer-events: none;
		text-align: left;
		animation: card-in 0.18s var(--ease);
	}

	.t-card.below {
		transform: none;
	}

	.t-card.pinned {
		pointer-events: auto;
		padding-right: 44px;
	}

	@keyframes card-in {
		from {
			opacity: 0;
		}
	}

	.t-card-kicker {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--c);
	}

	.t-card-title {
		margin-top: 4px;
		font-size: 1.0625rem;
		font-weight: 800;
		line-height: 1.25;
		color: #fff;
	}

	.t-card-title:focus {
		outline: none;
	}

	.t-card-tier {
		margin-top: 2px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-faint);
	}

	.t-card-text {
		margin-top: 8px;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--text-dim);
	}

	.t-card-meta {
		margin-top: 10px;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--text);
	}

	.t-card-meta > span {
		display: block;
		margin-bottom: 2px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.t-card-cases {
		display: grid;
		gap: 2px;
		list-style: none;
	}

	.t-card-cases a {
		font-weight: 600;
	}

	.t-card-close {
		position: absolute;
		top: 6px;
		right: 6px;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		color: var(--text-dim);
	}

	.t-card-close:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.06);
	}

	.t-card-close path {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
	}

	/*
	 * Touch screens and narrow windows: no hover card; a tap pins the details as a sheet at the
	 * bottom of the screen. It stops above the back-to-top button: both are fixed, and the
	 * page's stacking keeps that button on top.
	 */
	@media (max-width: 999.98px), (hover: none) {
		.t-card {
			display: none;
		}

		.t-card.pinned {
			display: block;
			position: fixed;
			top: auto !important;
			left: 12px !important;
			right: 12px;
			bottom: calc(max(12px, env(safe-area-inset-bottom)) + 62px);
			z-index: 60;
			width: auto;
			max-height: min(70vh, calc(100vh - 170px));
			overflow-y: auto;
			transform: none;
			animation: sheet-in 0.24s var(--ease);
		}

		@keyframes sheet-in {
			from {
				transform: translateY(16px);
				opacity: 0;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.t-card,
		.t-card.pinned,
		.t-halo,
		.t-root .t-star svg.t-orbit {
			animation: none;
		}

		.t-group,
		.t-root,
		.e,
		.t-star {
			transition: none;
		}
	}
</style>
