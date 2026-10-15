/*
 * Where every star of the skill tree goes. The tree is drawn as a star chart: the root
 * («AI-native engineer»), the groups of buildConstellations() as constellations, every
 * skill a star with its name beside it. The page lays out one group at a time (its tabs), so
 * a group gets the whole width; the layout still takes any number of groups. Each group grows from its lead (the group's first
 * skill, the brightest star) in a few limbs — chains of stars, the main tools nearest the
 * lead. A skill the data links to an earlier one (Vue → Nuxt, Python → FastAPI) follows it
 * on the same limb; nothing else about the lines is a claim about the skills.
 *
 * Four layouts, picked by the width of the tree (a container query in SkillTree.svelte):
 *
 *   n  < 600 px    phones: the groups one under another, two limbs each, the root on top
 *   m  600–1000    tablets: the same with three limbs
 *   w  1000–1320   the crown: the groups side by side over the root, up to seven limbs
 *   x  ≥ 1320      the crown with up to nine limbs
 *
 * The stacked layouts hang down from the root (top to bottom is the reading order); the
 * crown grows up from the root at the bottom, over the Earth of the 3D scene: a large star
 * with its name centred under it. A group takes a limb per three or so of its skills, and a
 * crown of few limbs gets wider ones, centred.
 *
 * Positions are a fraction of the tree's width across and CSS px down, so one layout fits any
 * width in its range: the lines are an SVG stretched across (non-scaling strokes), the stars
 * are HTML placed with the same numbers. Heights come from the labels: every name is wrapped
 * at the narrowest width of its layout with Manrope's real glyph widths (measured in
 * Chromium, TABLE below), so a wider screen only ever has more room. Pure and deterministic:
 * the prerender and the browser agree and nothing moves on hydration.
 */

/** Manrope 600 glyph advances per 100 px (Latin and Cyrillic of the skill names). */
const TABLE = [
	[20, ' '],
	[25, '·'],
	[26, 'Iil'],
	[28, 'j'],
	[29, '.'],
	[37, 'f'],
	[39, 'r'],
	[42, '1-/t'],
	[44, '()'],
	[47, 'г'],
	[49, 'J'],
	[52, '7Fkзкт'],
	[53, 'Lz'],
	[54, 'svxГх'],
	[55, 'yву'],
	[56, 'чь'],
	[57, '3acасэя'],
	[58, '5EЕ'],
	[59, '2бийп'],
	[60, '48TeТел'],
	[61, 'bdghnopuнор'],
	[62, '69BВд'],
	[63, 'KPVБКРУ'],
	[64, '0SXц'],
	[65, 'R'],
	[66, '&AА'],
	[67, 'Ч'],
	[69, 'D'],
	[71, 'HNUИНПЭм'],
	[72, 'Gы'],
	[73, 'CСФ'],
	[74, 'OQОжф'],
	[75, 'Д'],
	[79, 'w'],
	[84, 'Ы'],
	[85, 'MМ'],
	[88, 'm'],
	[94, 'Ю'],
	[96, 'W']
];
const ADVANCE = new Map(TABLE.flatMap(([width, chars]) => [...chars].map((ch) => [ch, width])));
/** a glyph the table does not know: a wide one, so the estimate errs towards more room */
const UNKNOWN = 66;
const WEIGHT = { 500: 0.984, 600: 1, 700: 1.018, 800: 1.032 };

/**
 * The type of each kind of label at full size; the stacked layouts take it times their
 * `scale`. The root's name is `root` in the crown (centred under its star) and `rootSide` in
 * the stacked layouts (beside it). SkillTree.svelte's CSS uses the same numbers.
 * @typedef {{ size: number, weight: 500 | 600 | 700 | 800, line: number, caps?: boolean, tracking?: number }} Font
 * @type {Record<'root' | 'rootSide' | 'lead' | 'main' | 'minor' | 'hub', Font>}
 */
export const FONTS = {
	root: { size: 30, weight: 800, line: 36 },
	rootSide: { size: 20, weight: 800, line: 25 },
	lead: { size: 17, weight: 700, line: 21 },
	main: { size: 15.5, weight: 600, line: 20 },
	minor: { size: 14.5, weight: 500, line: 19 },
	hub: { size: 14, weight: 700, line: 18, caps: true, tracking: 0.16 }
};

/** A font at a layout's scale. */
export const fontAt = (/** @type {Font} */ font, /** @type {number} */ scale) =>
	scale === 1 ? font : { ...font, size: font.size * scale, line: font.line * scale };

/** Width of the star's box, CSS px: the label starts right after it, 4 px in. */
export const STAR_BOX = { root: 44, lead: 34, main: 24, minor: 18 };
/** The root's star in the crown, CSS px, and the gap to its name under it. */
export const ROOT_BOX = 120;
export const ROOT_GAP = 12;
/** label padding: 4 px before the text, 4 px after it */
const LABEL_PAD = 8;

/**
 * from: the tree's width where the layout starts; width: the narrowest tree it must fit (the
 * labels are wrapped for it); span: limbs across; zig: how far every other star of a limb
 * steps right, px; dir: which way the groups grow from the root; scale: of the type and the
 * vertical rhythm (phones and tablets a little smaller).
 * @typedef {{ id: 'n' | 'm' | 'w' | 'x', from: number, width: number, span: number, zig: number, dir: 'down' | 'up', scale: number }} Layout
 * @type {Layout[]}
 */
export const LAYOUTS = [
	{ id: 'n', from: 0, width: 288, span: 2, zig: 12, dir: 'down', scale: 0.84 },
	{ id: 'm', from: 600, width: 600, span: 3, zig: 16, dir: 'down', scale: 0.94 },
	{ id: 'w', from: 1000, width: 1000, span: 7, zig: 18, dir: 'up', scale: 1 },
	{ id: 'x', from: 1320, width: 1320, span: 9, zig: 18, dir: 'up', scale: 1 }
];

/* ---------------------------------------------------------------- text ---------- */

/** Width of a text in CSS px. */
export const textWidth = (text, font) => {
	let units = 0;
	let count = 0;
	for (const raw of text) {
		if (raw === '­') continue;
		const ch = font.caps ? raw.toUpperCase() : raw;
		units += ADVANCE.get(ch) ?? UNKNOWN;
		count++;
	}
	return (
		((units * font.size) / 100) * WEIGHT[font.weight] + (font.tracking ?? 0) * font.size * count
	);
};

/**
 * How a label wraps at `room` px the way a browser does it: breaks after a space, after a
 * hyphen and at a soft hyphen (which then shows as '-'). A word longer than the room stays
 * whole and sticks out (`width` then exceeds `room`; the check reports it).
 * @returns {{ lines: number, width: number }}
 */
export const wrapText = (text, font, room) => {
	/** @type {{ word: string, sep: string }[]} */
	const tokens = [];
	let word = '';
	for (const ch of text) {
		if (ch === ' ' || ch === '­') {
			tokens.push({ word, sep: ch });
			word = '';
		} else if (ch === '-') {
			tokens.push({ word: word + ch, sep: '' });
			word = '';
		} else {
			word += ch;
		}
	}
	tokens.push({ word, sep: '' });

	let lines = 1;
	let widest = 0;
	let line = '';
	let pending = '';
	for (const { word: piece, sep } of tokens) {
		const joined = line + (pending === ' ' ? ' ' : '') + piece;
		if (!line || textWidth(joined, font) <= room) {
			line = joined;
		} else {
			// the line breaks before this piece; at a soft hyphen it ends with '-'
			widest = Math.max(widest, textWidth(line + (pending === '\u00ad' ? '-' : ''), font));
			lines++;
			line = piece;
		}
		pending = sep;
	}
	widest = Math.max(widest, textWidth(line, font));
	return { lines, width: widest };
};

/* --------------------------------------------------------------- shape ---------- */

/** Tiny deterministic hash → [0, 1), so the chart is the same on every visit. */
const hash01 = (value) => {
	let h = 2166136261;
	for (const char of String(value)) {
		h ^= char.charCodeAt(0);
		h = Math.imul(h, 16777619);
	}
	return ((h >>> 0) % 10007) / 10007;
};

/**
 * A group's skills as blocks: a skill the data links to an earlier, non-lead skill joins
 * that skill's block, so Nuxt, Pinia and Vuex follow Vue. Blocks keep the group's order.
 * @param {{ id: string, related: string[] }[]} stars the group's stars, lead first
 */
const blocksOf = (stars) => {
	const index = new Map(stars.map((star, i) => [star.id, i]));
	/** @type {Map<string, string>} */
	const parent = new Map();
	stars.forEach((star, i) => {
		if (i === 0) return;
		const earlier = star.related
			.map((id) => index.get(id))
			.filter((at) => at !== undefined && at > 0 && at < i)
			.sort((a, b) => a - b);
		if (earlier.length) parent.set(star.id, stars[earlier[0]].id);
	});
	const headOf = (id) => {
		let current = id;
		while (parent.has(current)) current = /** @type {string} */ (parent.get(current));
		return current;
	};
	/** @type {Map<string, typeof stars>} */
	const blocks = new Map();
	for (const star of stars.slice(1)) {
		const head = headOf(star.id);
		if (!blocks.has(head)) blocks.set(head, []);
		blocks.get(head)?.push(star);
	}
	return [...blocks.values()];
};

/**
 * Deals the blocks onto `count` limbs, the next block always to the shortest limb so the
 * most important skills sit nearest the lead on every limb. A block longer than a fair share
 * is split, its rest dealt like a new block.
 * @template T
 * @param {T[][]} blocks
 * @param {number} count
 * @param {number[]} preference limb indices in the order ties are broken
 * @returns {T[][]}
 */
const deal = (blocks, count, preference) => {
	const total = blocks.reduce((sum, block) => sum + block.length, 0);
	const share = Math.ceil(total / count) + 1;
	/** @type {T[][]} */
	const limbs = Array.from({ length: count }, () => []);
	const queue = blocks.map((block) => [...block]);
	while (queue.length) {
		const block = /** @type {T[]} */ (queue.shift());
		let pick = preference[0];
		for (const limb of preference) if (limbs[limb].length < limbs[pick].length) pick = limb;
		const room = Math.max(1, share - limbs[pick].length);
		limbs[pick].push(...block.slice(0, room));
		if (block.length > room) queue.unshift(block.slice(room));
	}
	return limbs;
};

/** Limb order from the middle out (left first): ties go to the limbs nearest the lead. */
const middleOut = (count) =>
	Array.from({ length: count }, (_, i) => i).sort(
		(a, b) => Math.abs(a - (count - 1) / 2) - Math.abs(b - (count - 1) / 2) || a - b
	);

/* ------------------------------------------------------------- layout ---------- */

/** limb geometry, CSS px at the layout's narrowest width (they scale with the tree) */
const LIMB_IN = 8; // the first star's offset from the limb's left edge
const SWAY = 56; // how far a limb sways right and back as it grows, px at most
/** vertical rhythm, CSS px at full scale */
const MIN_STEP = 50;
const STEP_GAP = 12;
const STEM = 30; // lead → the point where its limbs fan out
const FIRST = 92; // lead → the first star of every limb
/** the crown: stars a limb carries before its group gets another, and how wide a limb of a
 * crown with few may grow (in limbs of the full crown) */
const PER_LIMB = 4;
const WIDE_LIMB = 1.5;
/** how far a crown limb's first star may sit further out than its neighbours', and the jitter
 * of every step (times the layout's scale), CSS px: the limbs never line up into rows */
const STAGGER = 34;
const JITTER = 16;

/**
 * @typedef {'root' | 'lead' | 'main' | 'minor'} Tier
 * @typedef {{ x: number, y: number, room: number, lines: number, width: number }} Place
 *   x: fraction of the tree's width; y: CSS px from the top; room: from the star to the
 *   right end of its label's room, a fraction of the tree's width; lines/width: the label
 *   as wrapped at the layout's narrowest width (for the checks)
 * @typedef {{
 *   key: string, kind: 'root' | 'hub' | 'skill', tier: Tier | 'hub', group: string | null,
 *   depth: number, place: Record<string, Place>
 * }} ChartNode
 * @typedef {{
 *   d: string, kind: 'trunk' | 'bough' | 'stem' | 'limb', group: string | null, minor: boolean,
 *   leadsTo: Set<string>
 * }} ChartEdge
 *   leadsTo: every node the line is on the way to from the root (the path lights up on hover)
 * @typedef {{ id: string, from: number, height: number, edges: ChartEdge[] }} ChartLayout
 */

const VIEW = 1000; // SVG units across

/**
 * @param {{ id: string, name: string, stars: { id: string, title: string, tier: 'lead' | 'main' | 'minor', related: string[] }[] }[]} groups
 * @param {{ root: string, label?: (title: string) => string }} text the root's name; `label`
 *   turns a skill's name into its displayed text (soft hyphens)
 */
export const layoutChart = (groups, text) => {
	const label = text.label ?? ((title) => title);
	/** @type {Map<string, ChartNode>} */
	const nodes = new Map();
	const add = (key, kind, tier, group, depth) => {
		const node = { key, kind, tier, group, depth, place: {} };
		nodes.set(key, node);
		return node;
	};
	add('root', 'root', 'root', null, 0);

	/* each group's blocks, with the keys and labels of its stars */
	const shaped = groups.map((group) => {
		const lead = group.stars[0];
		add(`hub:${group.id}`, 'hub', 'hub', group.id, 1);
		add(`${group.id}:${lead.id}`, 'skill', 'lead', group.id, 1);
		const blocks = blocksOf(group.stars).map((block) =>
			block.map((star) => ({
				key: `${group.id}:${star.id}`,
				tier: /** @type {Tier} */ (star.tier === 'lead' ? 'main' : star.tier),
				text: label(star.title)
			}))
		);
		return {
			group,
			leadKey: `${group.id}:${lead.id}`,
			leadText: label(lead.title),
			hubText: `${group.name} · ${group.stars.length}`,
			blocks,
			count: group.stars.length - 1
		};
	});
	for (const g of shaped) {
		for (const block of g.blocks) {
			block.forEach((star) => add(star.key, 'skill', star.tier, g.group.id, 2));
		}
	}

	/** @type {ChartLayout[]} */
	const layouts = LAYOUTS.map((layout) => {
		const W = layout.width;
		const k = layout.scale;
		/** @param {Tier | 'hub'} tier */
		const fontOf = (tier) =>
			fontAt(
				tier === 'root' ? (layout.dir === 'up' ? FONTS.root : FONTS.rootSide) : FONTS[tier],
				k
			);
		/** @type {ChartEdge[]} */
		const edges = [];
		const X = (fraction) => Math.round(fraction * VIEW * 100) / 100;
		const Y = (px) => Math.round(px * 10) / 10;
		const line = (a, b) => `M${X(a.x)} ${Y(a.y)}L${X(b.x)} ${Y(b.y)}`;
		/** a curve leaving `a` towards a + (ax, ay) and arriving at `b` from b − (bx, by), px */
		const curve = (a, b, [ax, ay], [bx, by]) =>
			`M${X(a.x)} ${Y(a.y)}C${X(a.x + ax / W)} ${Y(a.y + ay)} ${X(b.x - bx / W)} ${Y(b.y - by)} ${X(
				b.x
			)} ${Y(b.y)}`;

		/** a label wrapped for the room right of its star up to `right` (a fraction) */
		const wrapFor = (tier, value, x, right) =>
			wrapText(value, fontOf(tier), (right - x) * W - STAR_BOX[tier] / 2 - LABEL_PAD);

		const setPlace = (key, tier, value, x, y, right) => {
			const wrapped = wrapFor(tier, value, x, right);
			const node = nodes.get(key);
			if (node)
				node.place[layout.id] = {
					x: Math.round(x * 1e5) / 1e5,
					y: Math.round(y * 10) / 10,
					room: Math.round(Math.max(0, right - x) * 1e5) / 1e5,
					lines: wrapped.lines,
					width: Math.round(wrapped.width)
				};
			return wrapped.lines * fontOf(tier).line;
		};

		/** a group's caption: centred on x (kept inside the tree), or starting at x */
		const setHub = (g, x, y, align) => {
			const width = textWidth(g.hubText, fontOf('hub'));
			const half = width / 2 / W;
			const at = align === 'center' ? Math.min(1 - half - 4 / W, Math.max(half + 4 / W, x)) : x;
			const node = nodes.get(`hub:${g.group.id}`);
			if (node)
				node.place[layout.id] = {
					x: Math.round(at * 1e5) / 1e5,
					y: Math.round(y * 10) / 10,
					room: align === 'center' ? 0 : Math.round((1 - at) * 1e5) / 1e5,
					lines: 1,
					width: Math.round(width)
				};
		};

		/**
		 * One limb, a chain of stars from `start` outwards (y grows away from the lead; the
		 * crown flips it afterwards). Returns the stars and the far edge of the last label.
		 */
		const growLimb = (stars, left, width, start, limbIndex, stagger = 0) => {
			/** @type {{ key: string, x: number, y: number, height: number }[]} */
			const placed = [];
			const phase = hash01(`${layout.id}:${limbIndex}:${stars[0]?.key}`) * Math.PI * 2;
			let y = start + Math.round(hash01(`${layout.id}^${limbIndex}:${stars[0]?.key}`) * stagger);
			stars.forEach((star, i) => {
				const font = fontOf(star.tier);
				const near = STAR_BOX[star.tier] / 2 + 4; // star centre → first letter
				// the label as it wraps with the most room; whatever is left over lets the
				// star wander right without changing how its name breaks
				const roomPx = width * W - LIMB_IN - STAR_BOX[star.tier] / 2 - LABEL_PAD;
				const wrapped = wrapText(star.text, font, roomPx);
				const height = wrapped.lines * font.line;
				const slack = Math.max(0, roomPx - wrapped.width - 1);
				// a slow sway along the limb plus the zig of every other star
				const sway = 0.5 + 0.5 * Math.sin(phase + i * 0.95);
				const zig = (i + limbIndex) % 2 ? layout.zig : 0;
				let offset = Math.min(slack, SWAY * sway + zig);
				if (i > 0) {
					const before = placed[i - 1];
					let step =
						Math.max(MIN_STEP * k, (before.height + height) / 2 + STEP_GAP * k) +
						Math.round(hash01(`${star.key}~`) * JITTER * k);
					// the line between two stars must pass left of both names: leaning right it
					// would cut the lower star's name, leaning left the upper one's
					const previous = (before.x - left) * W - LIMB_IN;
					const nearBefore = STAR_BOX[nodes.get(before.key)?.tier ?? 'main'] / 2 + 4;
					const lean = (dx) =>
						dx > 0
							? (dx * before.height) / 2 / (0.75 * nearBefore)
							: (-dx * height) / 2 / (0.75 * near);
					// keep the sway within what the usual step allows, then lengthen the step for
					// whatever lean a long name still forces
					const right = (0.75 * nearBefore * step) / (before.height / 2);
					const leftward = (0.75 * near * step) / (height / 2);
					offset = Math.min(Math.max(offset, previous - leftward), previous + right);
					offset = Math.max(0, Math.min(slack, offset));
					step = Math.max(step, Math.ceil(lean(offset - previous)));
					y += step;
				}
				const x = left + (LIMB_IN + offset) / W;
				setPlace(star.key, star.tier, star.text, x, y, left + width);
				placed.push({ key: star.key, x, y, height });
			});
			const last = placed[placed.length - 1];
			return { placed, end: last ? last.y + last.height / 2 : start };
		};

		/**
		 * The stem, the fan and the chains of one group. `sign` is +1 when the group hangs
		 * down the page, −1 when it grows up. Each line knows the stars it leads to (the
		 * path from the root lights up on hover).
		 */
		const drawGroup = (group, lead, limbs, sign) => {
			const all = new Set(limbs.flat().map((star) => star.key));
			const fan = { x: lead.x, y: lead.y + sign * STEM * k };
			edges.push({ d: line(lead, fan), kind: 'stem', group, minor: false, leadsTo: all });
			for (const limb of limbs) {
				limb.forEach((star, i) => {
					const rest = new Set(limb.slice(i).map((s) => s.key));
					const minor = nodes.get(star.key)?.tier === 'minor';
					// to a limb's first star: out of the fan along the stem, into the star along the
					// limb, so the line never cuts across the first stars' labels. In the crown a
					// group spreads over many limbs: the line runs out low, under the first stars of
					// the nearer limbs, and turns up into its own only at the end
					const d =
						i > 0
							? line(limb[i - 1], star)
							: sign < 0
							? curve(
									fan,
									star,
									[(star.x - fan.x) * W * 0.75, 0],
									[0, sign * 0.6 * Math.abs(fan.y - star.y)]
							  )
							: curve(fan, star, [0, sign * 22], [0, sign * 30]);
					edges.push({ d, kind: 'limb', group, minor, leadsTo: rest });
				});
			}
		};

		const groupKeys = (g) =>
			new Set([`hub:${g.group.id}`, g.leadKey, ...g.blocks.flat().map((star) => star.key)]);

		let height = 0;

		if (layout.dir === 'down') {
			/* ---- stacked: the root on top, a trunk down the left, the groups hanging off it ---- */
			const TRUNK = (STAR_BOX.root / 2 + 2) / W;
			const START = 40 / W; // the limbs share the width from here to the right edge
			const limbWidth = (1 - START) / layout.span;
			const rootY = STAR_BOX.root / 2 + 8;
			setPlace('root', 'root', text.root, TRUNK, rootY, 1);
			let cursor = rootY + 50 * k;
			let from = { x: TRUNK, y: rootY };
			const below = new Set([...nodes.keys()].filter((key) => key !== 'root'));

			for (const g of shaped) {
				const lead = { x: START + LIMB_IN / W, y: cursor + 50 * k };
				setHub(g, lead.x, cursor + 9 * k, 'left');
				setPlace(g.leadKey, 'lead', g.leadText, lead.x, lead.y, 1);

				const branch = { x: TRUNK, y: lead.y - 36 * k };
				edges.push({
					d: line(from, branch),
					kind: 'trunk',
					group: null,
					minor: false,
					leadsTo: new Set(below)
				});
				edges.push({
					d: curve(branch, lead, [0, 20], [16, 0]),
					kind: 'bough',
					group: g.group.id,
					minor: false,
					leadsTo: groupKeys(g)
				});
				for (const key of groupKeys(g)) below.delete(key);
				from = branch;

				const dealt = deal(
					g.blocks,
					layout.span,
					Array.from({ length: layout.span }, (_, i) => i)
				);
				let bottom = lead.y + 12;
				const limbs = dealt
					.map((stars, j) => {
						const grown = growLimb(stars, START + j * limbWidth, limbWidth, lead.y + FIRST * k, j);
						bottom = Math.max(bottom, grown.end);
						return grown.placed;
					})
					.filter((limb) => limb.length);
				drawGroup(g.group.id, lead, limbs, 1);
				cursor = bottom + 50 * k;
			}
			height = cursor - 18;
		} else {
			/* ---- the crown: the root at the bottom, the groups side by side above it ---- */
			// limbs per group: one each, the spare ones to whichever group stands tallest, but no
			// more than a limb per PER_LIMB skills: a limb of one star is a fan, not a constellation
			const counts = shaped.map(() => 1);
			const estimate = (g, limbs) => Math.ceil(g.count / limbs);
			const most = (g) => Math.max(1, Math.ceil(g.count / PER_LIMB));
			for (let spare = layout.span - shaped.length; spare > 0; spare--) {
				let pick = -1;
				shaped.forEach((g, i) => {
					if (counts[i] >= most(g)) return;
					if (pick < 0 || estimate(g, counts[i]) > estimate(shaped[pick], counts[pick])) pick = i;
				});
				if (pick < 0) break;
				counts[pick]++;
			}
			const used = counts.reduce((sum, value) => sum + value, 0);
			// a crown of few limbs gets wider ones (more room for the names), and stays centred
			const limbWidth = Math.min(1 / used, WIDE_LIMB / layout.span);

			// heights in "up" px above the bottom, turned into y once the height is known; the
			// leads form a dome — the middle groups stand highest, the outer ones spread low —
			// so the boughs to the outer groups pass under the inner ones
			// the root's star sits high enough for its name under it
			const ROOT_U = ROOT_BOX / 2 + ROOT_GAP + fontOf('root').line + 16;
			const FORK_U = ROOT_U + ROOT_BOX / 2 + 46;
			const LEAD_LOW = FORK_U + 76;
			const DOME = 70;
			let top = 0;
			let start = (1 - used * limbWidth) / 2;

			const drawings = shaped.map((g, gi) => {
				const left = start;
				const span = counts[gi] * limbWidth;
				start += span;
				const centre = left + span / 2;
				const leadX = counts[gi] === 1 ? left + LIMB_IN / W : centre - limbWidth * 0.2;
				const leadU = LEAD_LOW + DOME * (1 - Math.min(1, Math.abs(centre - 0.5) / 0.42) ** 2);
				const dealt = deal(g.blocks, counts[gi], middleOut(counts[gi]));
				let groupTop = leadU + 12;
				const limbs = dealt
					.map((stars, j) => {
						// the crown's lines run in low (drawGroup), so its limbs may start at odd heights
						const grown = growLimb(
							stars,
							left + j * limbWidth,
							limbWidth,
							leadU + FIRST,
							j,
							STAGGER
						);
						groupTop = Math.max(groupTop, grown.end);
						return grown.placed;
					})
					.filter((limb) => limb.length);
				const hubU = groupTop + 32;
				top = Math.max(top, hubU + fontOf('hub').line / 2 + 10);
				return { g, left, span, centre, leadX, leadU, limbs, hubU };
			});
			height = top + 6;
			const flip = (u) => height - u;

			const root = { x: 0.5, y: flip(ROOT_U) };
			// the root's name is centred under its star, on one line if the tree allows
			const rootName = wrapText(text.root, fontOf('root'), W - 16);
			const rootNode = nodes.get('root');
			if (rootNode)
				rootNode.place[layout.id] = {
					x: root.x,
					y: Math.round(root.y * 10) / 10,
					room: 1,
					lines: rootName.lines,
					width: Math.round(rootName.width)
				};
			const fork = { x: 0.5, y: flip(FORK_U) };
			edges.push({
				d: line(root, fork),
				kind: 'trunk',
				group: null,
				minor: false,
				leadsTo: new Set([...nodes.keys()].filter((key) => key !== 'root'))
			});

			for (const { g, left, span, centre, leadX, leadU, limbs, hubU } of drawings) {
				const lead = { x: leadX, y: flip(leadU) };
				setPlace(g.leadKey, 'lead', g.leadText, lead.x, lead.y, left + span);
				setHub(g, centre, flip(hubU), 'center');
				edges.push({
					d: curve(fork, lead, [0, -64], [0, -56]),
					kind: 'bough',
					group: g.group.id,
					minor: false,
					leadsTo: groupKeys(g)
				});
				// the limbs grew upwards from the bottom: turn their heights into y
				const turned = limbs.map((limb) =>
					limb.map((star) => {
						const place = nodes.get(star.key)?.place[layout.id];
						if (place) place.y = Math.round(flip(place.y) * 10) / 10;
						return { ...star, y: flip(star.y) };
					})
				);
				drawGroup(g.group.id, lead, turned, -1);
			}
		}

		return { id: layout.id, from: layout.from, height: Math.ceil(height), edges };
	});

	return { nodes, layouts };
};

/* ------------------------------------------------------------- checks ---------- */

/**
 * Collisions in a laid-out chart at each layout's narrowest width: labels that overlap each
 * other, a line through a label, a label sticking out of the tree. For the dev check script
 * and the tests; the page never runs it.
 * @param {ReturnType<typeof layoutChart>} chart
 * @param {Record<string, string>} labels the displayed text of every node by key
 */
export const checkChart = (chart, labels) => {
	const problems = [];
	for (const layout of LAYOUTS) {
		const W = layout.width;
		const boxes = [];
		for (const node of chart.nodes.values()) {
			const place = node.place[layout.id];
			if (!place) {
				problems.push(`${layout.id}: ${node.key} has no place`);
				continue;
			}
			const crownRoot = node.tier === 'root' && layout.dir === 'up';
			const base =
				node.tier === 'root' ? (crownRoot ? FONTS.root : FONTS.rootSide) : FONTS[node.tier];
			const h = place.lines * fontAt(base, layout.scale).line;
			const x = place.x * W;
			let left;
			let top = place.y - h / 2;
			if (node.tier === 'hub') {
				left = layout.dir === 'up' ? x - place.width / 2 : x - STAR_BOX.lead / 2 + 4;
			} else if (crownRoot) {
				// the name centred under the star, which no other name may touch either
				left = x - place.width / 2;
				top = place.y + ROOT_BOX / 2 + ROOT_GAP;
				const r = ROOT_BOX / 2;
				boxes.push({
					key: node.key,
					l: x - r,
					r: x + r,
					t: place.y - r,
					b: place.y + r,
					star: true
				});
			} else {
				left = x + STAR_BOX[node.tier] / 2 + 4;
			}
			const box = {
				key: node.key,
				l: left,
				r: left + place.width,
				t: top,
				b: top + h,
				star: false
			};
			boxes.push(box);
			if (box.l < -1 || box.r > W + 1)
				problems.push(
					`${layout.id}: ${node.key} «${labels[node.key]}» out of the tree (${Math.round(
						box.l
					)}–${Math.round(box.r)} of ${W})`
				);
			if (
				node.tier !== 'hub' &&
				!crownRoot &&
				place.width > place.room * W - STAR_BOX[node.tier] / 2 - LABEL_PAD + 1
			)
				problems.push(`${layout.id}: ${node.key} «${labels[node.key]}» wider than its room`);
		}
		for (let i = 0; i < boxes.length; i++) {
			for (let j = i + 1; j < boxes.length; j++) {
				const a = boxes[i];
				const b = boxes[j];
				if (a.key === b.key) continue; // the root's star and its own name
				if (a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b)
					problems.push(`${layout.id}: «${labels[a.key]}» overlaps «${labels[b.key]}»`);
			}
		}
		// lines: sample every segment / curve and test the points against the label boxes
		const drawn = chart.layouts.find((item) => item.id === layout.id);
		for (const edge of drawn?.edges ?? []) {
			for (const [px, py] of samplePath(edge.d, W / VIEW)) {
				for (const box of boxes) {
					if (box.star) continue; // lines start at the root's star
					if (px > box.l + 1 && px < box.r - 1 && py > box.t + 1 && py < box.b - 1) {
						problems.push(`${layout.id}: a ${edge.kind} line crosses «${labels[box.key]}»`);
						break;
					}
				}
			}
		}
	}
	return [...new Set(problems)];
};

/** Points along an M/L/C path (absolute commands only), x scaled to px. */
const samplePath = (d, scaleX) => {
	const points = [];
	const tokens = d.match(/[MLC]|-?\d+(\.\d+)?/g) ?? [];
	let i = 0;
	let x = 0;
	let y = 0;
	while (i < tokens.length) {
		const command = tokens[i++];
		const read = () => Number(tokens[i++]);
		if (command === 'M') {
			x = read() * scaleX;
			y = read();
		} else if (command === 'L') {
			const nx = read() * scaleX;
			const ny = read();
			for (let t = 0.06; t <= 0.94; t += 0.04) points.push([x + (nx - x) * t, y + (ny - y) * t]);
			x = nx;
			y = ny;
		} else if (command === 'C') {
			const c1 = [read() * scaleX, read()];
			const c2 = [read() * scaleX, read()];
			const end = [read() * scaleX, read()];
			for (let t = 0.04; t <= 0.96; t += 0.03) {
				const s = 1 - t;
				points.push([
					s * s * s * x + 3 * s * s * t * c1[0] + 3 * s * t * t * c2[0] + t * t * t * end[0],
					s * s * s * y + 3 * s * s * t * c1[1] + 3 * s * t * t * c2[1] + t * t * t * end[1]
				]);
			}
			[x, y] = end;
		}
	}
	return points;
};

const VOWEL = /[аеёиоуыэюя]/i;
const CONSONANT = /[бвгджзклмнпрстфхцчшщ]/i;

/**
 * A soft hyphen (U+00AD) in every Cyrillic word of 13+ letters, at the syllable boundary
 * (after a vowel, before a consonant, five letters or more on each side) nearest its middle.
 * Labels are narrow and Russian words long; browsers without a Russian hyphenation
 * dictionary would otherwise push such a word out of its room. Display only: the hyphen
 * shows when the line breaks there, screen readers skip it, the data keeps the plain name.
 * @param {string} text
 */
export const softHyphens = (text) =>
	text.replace(/[а-яё]{13,}/gi, (word) => {
		let best = -1;
		for (let i = 5; i <= word.length - 5; i++) {
			if (!VOWEL.test(word[i - 1]) || !CONSONANT.test(word[i])) continue;
			if (best < 0 || Math.abs(i - word.length / 2) < Math.abs(best - word.length / 2)) best = i;
		}
		return best < 0 ? word : `${word.slice(0, best)}­${word.slice(best)}`;
	});
