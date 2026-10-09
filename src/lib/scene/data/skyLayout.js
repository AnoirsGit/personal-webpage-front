/*
 * Turns one skill group into a constellation figure. Pure functions with no imports, so a
 * Node script can preview the shapes without Vite or three.js.
 *
 * Input: the group's stars in the skill tree's own layout (pixels of the old 2D diagram,
 * y grows down) and its links (tree edges inside the group). Output: positions in a unit
 * box centred on 0 (y up), the lines of the figure and the order in which stars light up.
 *
 * - Shape: the tree layout, centred on its median and squashed with tanh so one far leaf
 *   cannot shrink the rest of the figure, then a short deterministic relaxation (pairwise
 *   repulsion, springs along the lines, a weak pull back home) spreads it the way a
 *   constellation reads.
 * - Lines: the links, then every part still unconnected joins its nearest neighbour
 *   (Kruskal over the layout), so each figure is one connected shape.
 * - Reveal: breadth-first from the first star (the group's lead); every line points from
 *   the star that lights up first to the one that follows, so lines draw outward.
 */

/** Tiny deterministic hash → [0, 1), so the sky looks the same on every visit. */
export const hash01 = (value) => {
	let h = 2166136261;
	for (const char of String(value)) {
		h ^= char.charCodeAt(0);
		h = Math.imul(h, 16777619);
	}
	return ((h >>> 0) % 100000) / 100000;
};

const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = sorted.length >> 1;
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * @param {{ key: string, x: number, y: number }[]} input stars in tree-layout pixels
 * @param {[number, number][]} links index pairs
 * @returns {{
 *   points: { x: number, y: number, depth: number, order: number }[],
 *   edges: [number, number][]
 * }}
 */
export const layoutFigure = (input, links) => {
	const n = input.length;
	if (!n) return { points: [], edges: [] };

	/* robust normalisation: median centre, spread from the median absolute deviation */
	const cx = median(input.map((s) => s.x));
	const cy = median(input.map((s) => s.y));
	const spread =
		Math.max(
			median(input.map((s) => Math.abs(s.x - cx))),
			median(input.map((s) => Math.abs(s.y - cy))),
			1
		) * 2.4;
	const points = input.map((star) => {
		const jitter = (hash01(star.key) - 0.5) * 0.08;
		return {
			x: Math.tanh((star.x - cx) / spread) * 0.6 + jitter,
			y: -Math.tanh((star.y - cy) / spread) * 0.6 + jitter * 0.7,
			depth: 0,
			order: 0
		};
	});

	/* lines: the links, then nearest-neighbour joins until the figure is connected */
	/** @type {[number, number][]} */
	const edges = [];
	const has = new Set();
	const addEdge = (a, b) => {
		if (a === b || a < 0 || b < 0 || a >= n || b >= n) return;
		const id = a < b ? `${a}-${b}` : `${b}-${a}`;
		if (has.has(id)) return;
		has.add(id);
		edges.push([a, b]);
	};
	for (const [a, b] of links) addEdge(a, b);

	const root = points.map((_, i) => i);
	const find = (i) => (root[i] === i ? i : (root[i] = find(root[i])));
	for (const [a, b] of edges) root[find(a)] = find(b);
	const pairs = [];
	for (let a = 0; a < n; a++) {
		for (let b = a + 1; b < n; b++) {
			pairs.push([Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y), a, b]);
		}
	}
	pairs.sort((p, q) => p[0] - q[0]);
	for (const [, a, b] of pairs) {
		if (find(a) !== find(b)) {
			root[find(a)] = find(b);
			addEdge(a, b);
		}
	}

	/* reveal order: breadth-first from the lead */
	const seen = new Set([0]);
	const queue = [0];
	let order = 0;
	points[0].order = order++;
	while (queue.length) {
		const current = /** @type {number} */ (queue.shift());
		for (const [a, b] of edges) {
			const next = a === current ? b : b === current ? a : -1;
			if (next < 0 || seen.has(next)) continue;
			seen.add(next);
			points[next].depth = points[current].depth + 1;
			points[next].order = order++;
			queue.push(next);
		}
	}

	relax(points, edges);

	return {
		points,
		edges: edges.map(([a, b]) => (points[a].order < points[b].order ? [a, b] : [b, a]))
	};
};

/**
 * Spreads a figure: stars closer than MIN_GAP push apart, lines pull towards LINK, every
 * star drifts a little back to its tree position. Then centres and fits the unit box.
 * @param {{ x: number, y: number }[]} points
 * @param {[number, number][]} edges
 */
const relax = (points, edges) => {
	const home = points.map(({ x, y }) => ({ x, y }));
	const count = points.length;
	const MIN_GAP = Math.min(0.24, 0.95 / Math.sqrt(count));
	const LINK = MIN_GAP * 1.25;
	for (let step = 0; step < 260; step++) {
		for (let a = 0; a < count; a++) {
			for (let b = a + 1; b < count; b++) {
				const dx = points[a].x - points[b].x;
				const dy = points[a].y - points[b].y;
				const distance = Math.hypot(dx, dy) || 1e-4;
				if (distance >= MIN_GAP) continue;
				const push = ((MIN_GAP - distance) / distance) * 0.25;
				points[a].x += dx * push;
				points[a].y += dy * push;
				points[b].x -= dx * push;
				points[b].y -= dy * push;
			}
		}
		for (const [a, b] of edges) {
			const dx = points[b].x - points[a].x;
			const dy = points[b].y - points[a].y;
			const distance = Math.hypot(dx, dy) || 1e-4;
			const pull = ((distance - LINK) / distance) * 0.06;
			points[a].x += dx * pull;
			points[a].y += dy * pull;
			points[b].x -= dx * pull;
			points[b].y -= dy * pull;
		}
		points.forEach((point, i) => {
			point.x += (home[i].x - point.x) * 0.02;
			point.y += (home[i].y - point.y) * 0.02;
		});
	}

	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
	const my = (Math.min(...ys) + Math.max(...ys)) / 2;
	const extent = Math.max(
		Math.max(...xs) - Math.min(...xs),
		Math.max(...ys) - Math.min(...ys),
		1e-3
	);
	for (const point of points) {
		point.x = (point.x - mx) / extent;
		point.y = (point.y - my) / extent;
	}
};
