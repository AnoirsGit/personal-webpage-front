<!--
	@component
	The skills as a game-style skill tree: the root («AI-native engineer») on top, the five
	groups of buildConstellations() as branches, every skill a node along its branch with the
	most important nearest the root (layout.js). Node size and brightness follow what the data
	holds — the group's lead, its main tools, the rest — and nothing else.

	All HTML and CSS, no canvas: every name is in the prerendered page and the lines stay crisp
	at any pixel ratio. The markup is nested lists (root → branches → skills), which is also
	what a screen reader announces; wide screens place the items on a grid crown, narrow ones
	let the same lists flow as vertical branches.

	- Hover (or keyboard focus) shows a small card and lights the path from the root to the
	  node; the tree's own links between skills light up as "connected".
	- Click, Enter or Space pins a panel with the details and links to the cases that use the
	  skill; Escape, the close button or a click outside closes it.
	- One tab stop for the whole tree; arrow keys move to the nearest node in that direction,
	  Home and End jump to the root and the last skill.
	- The lines draw in row by row as the tree scrolls into view (not with reduced motion,
	  and without JavaScript the tree is simply drawn).
	- Only the labels are marked `data-scene-occlude`: the scene dims behind the names, and as
	  each label paints its own pill the occlusion pass reads a single box for it.
-->
<script>
	import { onDestroy, onMount, tick } from 'svelte';

	import { t } from '$lib/shared/i18n';
	import { layoutTree, softHyphens } from './layout.js';

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
	const ACCENT = {
		agents: '#e8c77e', // accent gold
		llm: '#f3e3bc', // accent-gold-soft
		frontend: '#8f9bff', // the page's blue glow, rgb(92 108 255), lifted for contrast
		backend: '#b57bff', // light purple
		infra: '#a8a4e4' // the globe's lit ink
	};

	/* 24×24 line icons of the branch hubs */
	const ICON = {
		agents:
			'M12 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM10.8 7.2l-4.6 9.1M13.2 7.2l4.6 9.1M7.5 19h9',
		llm: 'M12 3.5l1.8 5.1 5.2 1.9-5.2 1.9L12 17.5l-1.8-5.1L5 10.5l5.2-1.9zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
		frontend: 'M3.5 5h17v14h-17zM3.5 9h17M6.5 7h.01M9 7h.01M8 13l-2 2 2 2M16 13l2 2-2 2',
		backend:
			'M4.5 6c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3zM4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3',
		infra: 'M4 4h16v6H4zM4 14h16v6H4zM7.5 7h.01M7.5 17h.01M11 7h5.5M11 17h5.5'
	};
	const HEX = '0,-1 0.866,-0.5 0.866,0.5 0,1 -0.866,0.5 -0.866,-0.5';

	$: layout = layoutTree(groups);
	$: branches = groups.map((group, g) => ({ group, ...layout.branches[g] }));
	$: tracks = layout.branches.map((branch) => `${branch.columns}fr`).join(' ');
	$: busLeft = ((layout.branches[0]?.columns ?? 0) / 2 / layout.total) * 100;
	$: busRight = ((layout.branches.at(-1)?.columns ?? 0) / 2 / layout.total) * 100;
	$: totalSkills = groups.reduce((sum, group) => sum + group.stars.length, 0);

	/* every node by key: 'root', 'hub:<group>', '<group>:<skill>' */
	$: index = (() => {
		/** @type {Map<string, { key: string, kind: 'root' | 'hub' | 'skill', group?: Group, star?: Star, row: number, branch: number }>} */
		const map = new Map([['root', { key: 'root', kind: 'root', row: -2, branch: -1 }]]);
		branches.forEach(({ group, slots }, b) => {
			map.set(`hub:${group.id}`, {
				key: `hub:${group.id}`,
				kind: 'hub',
				group,
				row: -1,
				branch: b
			});
			group.stars.forEach((star, i) => {
				const key = `${group.id}:${star.id}`;
				map.set(key, { key, kind: 'skill', group, star, row: slots[i].row, branch: b });
			});
		});
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

	/** @type {HTMLElement} */
	let tree;
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
		active?.kind === 'skill' ? active.star.related.map((id) => `${active.group.id}:${id}`) : []
	);
	$: litBranch = active && active.kind !== 'root' ? active.branch : -1;
	$: litRow = active?.kind === 'skill' ? active.row : active?.kind === 'hub' ? -1 : -2;

	/* the card: pinned panel, or the hover / focus card */
	$: cardKey = pinnedKey ?? hoverKey ?? (keyboard ? focusKey : null);
	$: card = cardKey ? index.get(cardKey) ?? null : null;
	let place = { left: 0, top: 0, below: false };
	/** @type {HTMLElement} */
	let cardTitle;
	/** @type {HTMLElement} */
	let cardElement;
	/** the sticky header and a little air: a card above a node never slides under it */
	const TOP_CLEARANCE = 80;

	/** @param {string} key */
	const nodeElement = (key) =>
		/** @type {HTMLElement | null} */ (tree?.querySelector(`[data-key="${CSS.escape(key)}"]`));

	const placeCard = async (key) => {
		await tick();
		const node = nodeElement(key);
		if (!node || !tree) return;
		const shape = /** @type {HTMLElement} */ (node.querySelector('.t-shape') ?? node);
		const box = tree.getBoundingClientRect();
		const rect = shape.getBoundingClientRect();
		const width = Math.min(320, box.width - 16);
		const centre = rect.left + rect.width / 2 - box.left;
		const height = cardElement?.offsetHeight ?? 220;
		const below = rect.top - 12 - height < TOP_CLEARANCE;
		place = {
			left: Math.round(Math.min(Math.max(centre - width / 2, 8), box.width - width - 8)),
			top: Math.round((below ? rect.bottom + 12 : rect.top - 12) - box.top),
			below
		};
	};
	$: if (cardKey) placeCard(cardKey);

	/* ---------------- pointer ---------------- */

	/*
	 * One listener of each kind on the whole tree instead of four on every node: the node is
	 * the closest [data-key] to the event target (the card inside the tree has none).
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
		const shape = element.querySelector('.t-shape') ?? element;
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

	/* ---------------- draw-in, row by row ---------------- */

	/** rows drawn per branch; null = all (the prerender, reduced motion, no JS) */
	let drawn = /** @type {number[] | null} */ (null);
	let drawnTop = 1;
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
		for (const [type, listener] of listeners) tree.addEventListener(type, listener);
		document.addEventListener('pointerdown', onDocumentPointer, true);
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

		/*
		 * Everything above the fold line is drawn, the rest waits for the scroll. The
		 * observer's own entries say where each row is (no layout read of ours during
		 * hydration); the first batch sets the start, so rows already on screen never blink.
		 */
		observer = new IntersectionObserver(
			(entries) => {
				const next = drawn ? [...drawn] : branches.map(() => 0);
				for (const entry of entries) {
					const reached =
						entry.isIntersecting || entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) + 1;
					const element = /** @type {HTMLElement} */ (entry.target);
					if (element === tree) {
						if (reached) drawnTop = 1;
						else if (drawn === null) drawnTop = 0;
						continue;
					}
					if (!reached) continue;
					const b = Number(element.dataset.branch);
					next[b] = Math.max(next[b], Number(element.dataset.row) + 1);
					observer?.unobserve(element);
				}
				drawn = next;
			},
			{ rootMargin: '0px 0px -10% 0px' }
		);
		observer.observe(tree);
		tree.querySelectorAll('[data-trunk-row]').forEach((cell) => observer?.observe(cell));
	});

	onDestroy(() => {
		observer?.disconnect();
		for (const [type, listener] of listeners) tree?.removeEventListener(type, listener);
		if (typeof document !== 'undefined')
			document.removeEventListener('pointerdown', onDocumentPointer, true);
	});

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

<div
	class="tree"
	class:armed={drawn !== null}
	class:has-active={active !== null}
	role="group"
	aria-label={$t('skills.tree.label')}
	aria-describedby="tree-help"
	style:--tracks={tracks}
	style:--bus-l="{busLeft}%"
	style:--bus-r="{busRight}%"
	style:--drawn-top={drawnTop}
	bind:this={tree}
>
	<p id="tree-help" class="sr-only">{$t('skills.tree.help')}</p>

	<ul class="t-tree" role="list">
		<li class="t-root-item">
			<button
				type="button"
				class="t-node t-root"
				class:is-active={activeKey === 'root'}
				data-key="root"
				tabindex={focusKey === 'root' ? 0 : -1}
				aria-haspopup="dialog"
				aria-expanded={pinnedKey === 'root'}
				aria-describedby="tree-desc-root"
			>
				<span class="t-shape" aria-hidden="true">
					<svg viewBox="-1.15 -1.15 2.3 2.3" focusable="false">
						<polygon class="t-ring t-ring--outer" points={HEX} transform="scale(1.06)" />
						<polygon class="t-ring" points={HEX} transform="scale(0.86)" />
						<path
							class="t-emblem"
							d="M0 -0.52 L0.12 -0.12 L0.52 0 L0.12 0.12 L0 0.52 L-0.12 0.12 L-0.52 0 L-0.12 -0.12 Z"
						/>
					</svg>
				</span>
				<span class="t-label" data-scene-occlude>{$t('skills.tree.root')}</span>
			</button>
			<span id="tree-desc-root" hidden>{$t('skills.tree.rootText', { count: totalSkills })}</span>

			<ul class="t-branches" role="list" class:lit={litBranch >= 0} style:--root-x="{50}%">
				{#each branches as { group, slots, rows, columns, root }, b (group.id)}
					{@const hubKey = `hub:${group.id}`}
					<li
						class="t-branch t-branch--{group.id}"
						class:first={b === 0}
						class:last={b === branches.length - 1}
						class:lit={litBranch === b}
						style:--c={ACCENT[group.id] ?? '#e8c77e'}
						style:--root={root}
					>
						<span class="t-bus-lit" aria-hidden="true" />
						<button
							type="button"
							class="t-node t-hub"
							class:is-active={activeKey === hubKey}
							data-key={hubKey}
							tabindex={focusKey === hubKey ? 0 : -1}
							aria-haspopup="dialog"
							aria-expanded={pinnedKey === hubKey}
							aria-describedby={descId(hubKey)}
						>
							<span class="t-shape" aria-hidden="true">
								<svg viewBox="-1.15 -1.15 2.3 2.3" focusable="false">
									<polygon class="t-ring" points={HEX} />
								</svg>
								<svg class="t-icon" viewBox="0 0 24 24" focusable="false">
									<path d={ICON[group.id] ?? ICON.agents} />
								</svg>
							</span>
							<span class="t-label" data-scene-occlude>
								{group.name}
								<span class="t-count" aria-hidden="true">{group.stars.length}</span>
								<span class="sr-only">{$t('skills.tree.count', { count: group.stars.length })}</span
								>
							</span>
						</button>
						<span id={descId(hubKey)} hidden>{group.line}</span>

						<ul
							class="t-skills"
							role="list"
							class:lit={litBranch === b && litRow >= 0}
							style:--half={columns * 2}
							style:--rows={rows}
							style:--drawn={drawn ? drawn[b] ?? 0 : null}
						>
							{#each group.stars as star, i (star.id)}
								{@const key = `${group.id}:${star.id}`}
								{@const slot = slots[i]}
								<li
									class="t-cell t-cell--{star.tier}"
									class:left={slot.side < 0}
									class:right={slot.side > 0}
									class:trunk-row={slot.trunkRow}
									class:last-row={slot.lastRow}
									class:lit-up={litBranch === b && slot.row <= litRow}
									class:lit-down={litBranch === b && slot.row < litRow}
									class:lit-rib={activeKey === key}
									data-trunk-row={slot.trunkRow ? '' : null}
									data-branch={b}
									data-row={slot.row}
									style:--gc={slot.column + 1}
									style:--gr={slot.row + 1}
									style:--trunk={slot.trunk}
									style:--rib-l={slot.rib?.[0] ?? 0}
									style:--rib-w={slot.rib?.[1] ?? 0}
									style:--i={i}
								>
									<button
										type="button"
										class="t-node t-skill"
										class:is-active={activeKey === key}
										class:is-related={related.has(key)}
										data-key={key}
										tabindex={focusKey === key ? 0 : -1}
										aria-haspopup="dialog"
										aria-expanded={pinnedKey === key}
										aria-describedby={descId(key)}
									>
										<span class="t-shape" aria-hidden="true" />
										<span class="t-label" data-scene-occlude>{softHyphens(star.title)}</span>
									</button>
									<span id={descId(key)} hidden>{describe(group, star)}</span>
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		</li>
	</ul>

	{#if card}
		<div
			class="t-card"
			class:pinned={pinnedKey !== null}
			class:below={place.below}
			style:left="{place.left}px"
			style:top="{place.top}px"
			style:--c={card.group ? ACCENT[card.group.id] : '#e8c77e'}
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
					{$t('skills.tree.root')}
				{/if}
			</h3>
			{#if card.kind === 'skill'}
				{#if card.star?.tier !== 'minor'}
					<p class="t-card-tier">
						{card.star?.tier === 'lead' ? $t('skills.tree.leadSkill') : $t('skills.tree.mainSkill')}
					</p>
				{/if}
				{#if card.star?.summary}<p class="t-card-text">{card.star.summary}</p>{/if}
				{#if card.star?.related.length}
					<p class="t-card-meta">
						<span>{$t('skills.tree.connected')}</span>
						{card.star.related.map((id) => titleOf(card.group, id)).join(', ')}
					</p>
				{/if}
				{#if card.star?.cases.length}
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
	/* ======================= shared ======================= */

	.tree {
		--line-w: 2px;
		--line-dim: rgba(214, 222, 255, 0.16);
		--gold: #e8c77e;
		position: relative;
		padding-bottom: 8px;
	}

	.t-tree,
	.t-branches,
	.t-skills {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.t-node {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--text);
		text-align: center;
		-webkit-tap-highlight-color: transparent;
	}

	.t-node:focus-visible {
		outline: none;
	}

	.t-node:focus-visible .t-label {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.t-shape {
		position: relative;
		display: grid;
		place-items: center;
		flex: none;
	}

	.t-shape svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	/* root and hubs: SVG rings */
	.t-ring {
		fill: rgba(9, 11, 24, 0.92);
		stroke: var(--c, var(--gold));
		stroke-width: 1.5;
		vector-effect: non-scaling-stroke;
		transition: stroke-width 0.25s var(--ease), fill 0.25s var(--ease);
	}

	/*
	 * Skills: the shape is drawn by the span's two pseudo-elements, no SVG per node — a ring
	 * in the branch colour (::before) and the dark face with its glowing core (::after).
	 * Main tools and the lead are hexagons, the rest circles.
	 */
	.t-skill .t-shape {
		--ring: 1.5px;
		--core: color-mix(in srgb, var(--c) var(--core-mix, 55%), transparent);
		--face: rgba(9, 11, 24, 0.94);
		--w: calc(var(--size) * 0.866);
		--h: var(--size);
	}

	.t-skill .t-shape::before,
	.t-skill .t-shape::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--w);
		height: var(--h);
		transform: translate(-50%, -50%);
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
		transition: width 0.25s var(--ease), height 0.25s var(--ease), background 0.25s var(--ease);
	}

	.t-skill .t-shape::before {
		background: var(--c);
	}

	.t-skill .t-shape::after {
		width: calc(var(--w) - 2 * var(--ring));
		height: calc(var(--h) - 2.3 * var(--ring));
		background: radial-gradient(circle, var(--core) 0 21%, transparent calc(21% + 0.5px)),
			var(--face);
	}

	.t-cell--minor .t-skill .t-shape {
		--w: var(--size);
		--core-mix: 40%;
	}

	.t-cell--minor .t-skill .t-shape::before,
	.t-cell--minor .t-skill .t-shape::after {
		clip-path: none;
		border-radius: 50%;
	}

	.t-cell--minor .t-skill .t-shape::before {
		background: color-mix(in srgb, var(--c) 60%, rgba(214, 222, 255, 0.3));
	}

	.t-cell--minor .t-skill .t-shape::after {
		height: calc(var(--h) - 2 * var(--ring));
		background: radial-gradient(circle, var(--core) 0 30%, transparent calc(30% + 0.5px)),
			var(--face);
	}

	/* names break only between words or after a hyphen, never inside a word */
	.t-label {
		display: block;
		padding: 2px 7px;
		border-radius: 7px;
		background: rgba(5, 6, 13, 0.78);
		font-weight: 600;
		line-height: 1.25;
		color: var(--text);
		overflow-wrap: break-word;
		transition: color 0.25s var(--ease), background-color 0.25s var(--ease);
	}

	.t-count {
		margin-left: 4px;
		font-weight: 600;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}

	/* the root */
	.t-root .t-ring {
		stroke: var(--gold);
		stroke-width: 1.6;
	}

	.t-root .t-ring--outer {
		fill: none;
		stroke: rgba(232, 199, 126, 0.42);
		stroke-width: 1;
	}

	.t-emblem {
		fill: var(--gold);
		filter: drop-shadow(0 0 0.12px #fff3d6);
	}

	.t-root .t-shape {
		filter: drop-shadow(0 0 14px rgba(232, 199, 126, 0.45));
	}

	.t-root .t-label {
		font-weight: 800;
		letter-spacing: -0.01em;
	}

	/* hubs */
	.t-hub .t-ring {
		stroke-width: 1.8;
	}

	.t-shape svg.t-icon {
		position: absolute;
		inset: 26%;
		width: 48%;
		height: 48%;
		fill: none;
		stroke: var(--c);
		stroke-width: 1.7;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.t-hub .t-shape {
		filter: drop-shadow(0 0 10px color-mix(in srgb, var(--c) 40%, transparent));
	}

	.t-hub .t-label {
		font-weight: 800;
	}

	/* skills by importance: the lead glows, main tools are bright, the rest are quieter */
	.t-cell--lead .t-shape {
		--core-mix: 95%;
		filter: drop-shadow(0 0 9px color-mix(in srgb, var(--c) 55%, transparent));
	}

	.t-cell--lead .t-label {
		font-weight: 800;
	}

	.t-cell--main .t-shape {
		--core-mix: 70%;
	}

	.t-cell--minor .t-label {
		font-weight: 500;
		color: var(--text-dim);
	}

	/* hover / focus / pinned: the node lights up; connected skills answer */
	.t-node.is-active .t-ring,
	.t-node:hover .t-ring {
		stroke-width: 2.4;
		fill: color-mix(in srgb, var(--c, var(--gold)) 16%, #090b18);
	}

	.t-skill.is-active .t-shape,
	.t-skill:hover .t-shape {
		--ring: 2.4px;
		--core-mix: 100%;
		--face: color-mix(in srgb, var(--c) 16%, #090b18);
	}

	.t-node.is-active .t-label,
	.t-node:hover .t-label {
		color: #fff;
		background: color-mix(in srgb, var(--c, var(--gold)) 22%, rgba(5, 6, 13, 0.9));
	}

	.t-skill.is-related .t-shape {
		--ring: 2.2px;
		filter: drop-shadow(0 0 5px var(--c));
	}

	.t-node.is-related .t-label {
		color: #fff;
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 60%, transparent);
	}

	.t-bus-lit {
		position: absolute;
		pointer-events: none;
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

	/* ======================= wide screens: the crown ======================= */

	@media (min-width: 1200px) {
		/* the crown may use more than the text column: it is centred, so it still lines up */
		.tree {
			--tree-w: min(1320px, calc(100vw - 48px));
			container-type: inline-size;
			width: var(--tree-w);
			margin-left: calc((100% - var(--tree-w)) / 2);
		}

		.t-root-item {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		.t-root .t-shape {
			width: 92px;
			height: 92px;
		}

		.t-root .t-label {
			margin-top: 10px;
			font-size: 1.0625rem;
		}

		/* the bus: root drop, a rail across the branches, a drop into every hub */
		.t-branches {
			position: relative;
			display: grid;
			grid-template-columns: var(--tracks);
			width: 100%;
			padding-top: 68px;
		}

		.t-branches::before,
		.t-branches::after {
			content: '';
			position: absolute;
			pointer-events: none;
			transition: clip-path 0.7s var(--ease) 0.25s, transform 0.4s var(--ease);
		}

		/* rail with the two outer drops as its rounded ends */
		.t-branches::before {
			top: 30px;
			left: var(--bus-l);
			right: var(--bus-r);
			height: 38px;
			border: var(--line-w) solid var(--line-dim);
			border-bottom: 0;
			border-radius: 18px 18px 0 0;
			clip-path: inset(0 calc(50% * (1 - var(--drawn-top))) 0 calc(50% * (1 - var(--drawn-top))));
		}

		/* the root's drop onto the rail */
		.t-branches::after {
			top: 0;
			left: 50%;
			width: var(--line-w);
			height: 31px;
			margin-left: calc(var(--line-w) / -2);
			background: linear-gradient(var(--gold), rgba(232, 199, 126, 0.35));
			transform-origin: top;
			transform: scaleY(var(--drawn-top));
		}

		.t-branches.lit::after {
			background: var(--gold);
			box-shadow: 0 0 8px rgba(232, 199, 126, 0.7);
		}

		.t-branch {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			min-width: 0;
		}

		/* drops into the inner hubs (the outer ones are the rail's ends) */
		.t-branch:not(.first):not(.last)::before {
			content: '';
			position: absolute;
			top: -38px;
			left: 50%;
			width: var(--line-w);
			height: 38px;
			margin-left: calc(var(--line-w) / -2);
			background: var(--line-dim);
			transform-origin: top;
			transform: scaleY(var(--drawn-top));
			transition: transform 0.4s var(--ease) 0.6s;
		}

		/* the lit part of the rail: from this hub's drop to the root's */
		.t-bus-lit {
			top: -38px;
			height: 38px;
			left: calc(min(var(--root), 0.5) * 100%);
			width: calc(max(var(--root) - 0.5, 0.5 - var(--root)) * 100%);
			border-top: var(--line-w) solid var(--c);
			opacity: 0;
			transition: opacity 0.25s var(--ease);
		}

		.t-branch.first .t-bus-lit,
		.t-branch.last .t-bus-lit {
			border-radius: 18px 18px 0 0;
		}

		.t-branch.first .t-bus-lit {
			border-left: var(--line-w) solid var(--c);
			margin-left: calc(var(--line-w) / -2);
		}

		.t-branch.last .t-bus-lit {
			border-right: var(--line-w) solid var(--c);
			margin-right: calc(var(--line-w) / -2);
		}

		.t-branch.lit .t-bus-lit {
			opacity: 1;
			filter: drop-shadow(0 0 4px var(--c));
		}

		.t-branch.lit:not(.first):not(.last)::before {
			background: var(--c);
			box-shadow: 0 0 8px var(--c);
		}

		.t-hub .t-shape {
			width: 62px;
			height: 62px;
		}

		.t-hub .t-label {
			margin-top: 8px;
			font-size: 0.9375rem;
		}

		/* a branch: the crown grid, the trunk from the hub into it */
		.t-skills {
			position: relative;
			display: grid;
			grid-template-columns: repeat(var(--half), minmax(0, 1fr));
			align-items: stretch;
			width: 100%;
			padding-top: 26px;
		}

		.t-skills::before {
			content: '';
			position: absolute;
			top: 0;
			left: 50%;
			width: var(--line-w);
			height: 26px;
			margin-left: calc(var(--line-w) / -2);
			background: color-mix(in srgb, var(--c) 55%, transparent);
			transform-origin: top;
			transform: scaleY(clamp(0, var(--drawn, 99), 1));
			transition: transform 0.35s var(--ease);
		}

		.t-skills.lit::before {
			background: var(--c);
			box-shadow: 0 0 8px var(--c);
		}

		.t-cell {
			--box: 46px;
			--drawn-me: clamp(0, calc(var(--drawn, 99) - var(--gr) + 1), 1);
			position: relative;
			grid-column: var(--gc) / span 2;
			grid-row: var(--gr);
			display: flex;
			flex-direction: column;
			align-items: center;
			min-width: 0;
			padding-bottom: 18px;
		}

		/* the button spans its whole cell, so the rib can be measured in cell widths */
		.t-cell .t-node {
			width: 100%;
		}

		.t-cell .t-shape {
			width: var(--box);
			height: var(--box);
		}

		.t-cell--lead {
			--size: 46px;
		}

		.t-cell--main {
			--size: 34px;
		}

		.t-cell--minor {
			--size: 24px;
		}

		/* a name wraps inside its own cell; only a single word longer than the cell may run
		   past it (the neighbours' names are centred a cell away), never break inside */
		.t-cell .t-label {
			width: max-content;
			max-width: calc(100% - 8px);
			min-width: min-content;
			margin-top: 5px;
			padding: 2px 5px;
			overflow-wrap: normal;
			hyphens: auto;
			font-size: clamp(0.6875rem, 0.95cqw, 0.78rem);
		}

		.t-cell--lead .t-label {
			font-size: clamp(0.75rem, 1.02cqw, 0.84rem);
		}

		.t-cell--minor .t-label {
			font-size: clamp(0.6875rem, 0.9cqw, 0.75rem);
		}

		/*
		 * The lines, all pseudo-elements behind the nodes: one cell per row draws its row's
		 * piece of the trunk (::before above the node centre, ::after below it), every node
		 * off the trunk its rib (the button's ::before), in cell widths from the layout.
		 */
		.t-cell.trunk-row::before,
		.t-cell.trunk-row:not(.last-row)::after,
		.t-cell.left .t-skill::before,
		.t-cell.right .t-skill::before {
			content: '';
			position: absolute;
			z-index: -1;
			pointer-events: none;
			background: color-mix(in srgb, var(--c) 50%, transparent);
			transition: transform 0.35s var(--ease), background-color 0.25s var(--ease),
				box-shadow 0.25s var(--ease);
		}

		.t-cell.trunk-row::before,
		.t-cell.trunk-row:not(.last-row)::after {
			left: calc(var(--trunk) * 100%);
			width: var(--line-w);
			margin-left: calc(var(--line-w) / -2);
			transform-origin: top;
			transform: scaleY(var(--drawn-me));
		}

		.t-cell.trunk-row::before {
			top: 0;
			height: calc(var(--box) / 2);
		}

		.t-cell.trunk-row:not(.last-row)::after {
			top: calc(var(--box) / 2);
			bottom: 0;
			transition-delay: 0.3s;
		}

		.t-cell.left .t-skill::before,
		.t-cell.right .t-skill::before {
			top: calc(var(--box) / 2 - var(--line-w) / 2);
			left: calc(var(--rib-l) * 100%);
			width: calc(var(--rib-w) * 100%);
			height: var(--line-w);
			transform: scaleX(var(--drawn-me));
			transition-delay: 0.18s;
		}

		.t-cell.left .t-skill::before {
			transform-origin: right;
		}

		.t-cell.right .t-skill::before {
			transform-origin: left;
		}

		.t-cell.lit-up.trunk-row::before,
		.t-cell.lit-down.trunk-row::after,
		.t-cell.lit-rib .t-skill::before {
			background: var(--c);
			box-shadow: 0 0 8px var(--c);
			transition-delay: 0s;
		}

		/* nodes wake up as their row is reached */
		.armed .t-cell .t-shape {
			opacity: calc(0.35 + 0.65 * var(--drawn-me));
			transform: scale(calc(0.82 + 0.18 * var(--drawn-me)));
			transition: opacity 0.45s var(--ease) 0.25s, transform 0.45s var(--ease) 0.25s;
		}

		.armed .t-hub .t-shape,
		.armed .t-root .t-shape {
			opacity: calc(0.35 + 0.65 * var(--drawn-top));
			transition: opacity 0.6s var(--ease);
		}
	}

	/* ======================= narrow screens: vertical branches ======================= */

	@media (max-width: 1199.98px) {
		.tree {
			--x: 27px; /* the trunk */
		}

		.t-root-item {
			position: relative;
		}

		.t-node {
			flex-direction: row;
			align-items: center;
			gap: 12px;
			text-align: left;
		}

		.t-root {
			min-height: 64px;
		}

		.t-root .t-shape {
			width: 56px;
			height: 56px;
		}

		.t-root .t-label {
			font-size: 1.0625rem;
		}

		/* one trunk from the root down past the hubs */
		.t-branches {
			position: relative;
			display: grid;
			gap: 26px;
			margin-top: 14px;
		}

		.t-branches::before {
			content: '';
			position: absolute;
			top: -14px;
			bottom: 30px;
			left: var(--x);
			width: var(--line-w);
			margin-left: calc(var(--line-w) / -2);
			background: linear-gradient(var(--gold), var(--line-dim) 18%, var(--line-dim));
			transform-origin: top;
			transform: scaleY(var(--drawn-top));
			transition: transform 1.2s var(--ease);
		}

		.t-branch {
			position: relative;
		}

		.t-hub {
			min-height: 52px;
			padding-left: calc(var(--x) - 24px);
		}

		.t-hub .t-shape {
			width: 48px;
			height: 48px;
		}

		.t-hub .t-label {
			font-size: 1rem;
		}

		.t-skills {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-top: 10px;
			padding-left: calc(var(--x) + 22px);
		}

		.t-cell {
			--drawn-me: clamp(0, calc(var(--drawn, 99) - var(--gr) + 1), 1);
			display: flex;
			max-width: 100%;
		}

		.t-bus-lit {
			display: none;
		}

		.t-skill {
			gap: 7px;
			min-height: 44px;
			max-width: 100%;
			padding: 4px 13px 4px 9px;
			border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
			border-radius: 999px;
			background: rgba(8, 10, 24, 0.82);
		}

		.t-skill .t-shape {
			--size: 17px;
			width: 18px;
			height: 18px;
		}

		.t-skill .t-label {
			padding: 0;
			background: none;
			font-size: 0.875rem;
		}

		.t-cell--lead .t-skill {
			border-color: color-mix(in srgb, var(--c) 70%, transparent);
			box-shadow: 0 0 18px -8px var(--c);
		}

		.t-cell--lead .t-skill .t-shape {
			--size: 21px;
			width: 22px;
			height: 22px;
		}

		.t-cell--minor .t-skill {
			border-color: rgba(214, 222, 255, 0.12);
		}

		.t-node.is-active .t-label,
		.t-node:hover .t-label {
			background: none;
		}

		.t-skill.is-active,
		.t-skill.is-related {
			border-color: var(--c);
		}

		/* chips settle in as their branch is reached; the names stay fully opaque throughout */
		.armed .t-cell {
			transform: translateY(calc(10px * (1 - var(--drawn-me))));
			transition: transform 0.5s var(--ease) calc(var(--i) * 16ms);
		}

		.armed .t-cell .t-shape {
			opacity: calc(0.25 + 0.75 * var(--drawn-me));
			transition: opacity 0.5s var(--ease) calc(var(--i) * 16ms);
		}

		/* connected skills show by their chip's border; the label keeps no ring of its own */
		.t-node.is-related .t-label {
			box-shadow: none;
		}

		/*
		 * The details as a sheet at the bottom of the screen. It stops above the back-to-top
		 * button: both are fixed, and the page's stacking keeps that button on top.
		 */
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
		.t-card.pinned {
			animation: none;
		}
	}
</style>
