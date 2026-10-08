/*
 * The skills sky, built from the skill tree the old interactive editor rendered
 * (src/lib/shared/mocks/tree.json, Russian titles/texts overlaid from tree.ru.json by id).
 *
 * Each constellation is a hand-picked subset of tree nodes; their edges are the tree's own
 * edges between members, and members the subset leaves unconnected are joined to their
 * nearest neighbour (Kruskal over the tree layout), so every figure is one connected shape.
 * Star positions are the tree's hand-made layout, normalised per constellation. Hover text
 * is the defining sentence of the node description ("… is the layer that …").
 */
import tree from '$lib/shared/mocks/tree.json';
import treeRu from '$lib/shared/mocks/tree.ru.json';

/** @typedef {{ tree: string, ids: (string | number)[] }} Part */

const DEFINITIONS = [
	{
		id: 'agents',
		hub: 'mock-928741', // Agent Orchestration
		parts: [
			{
				tree: 'ai-agents',
				ids: [
					'mock-149522', // AI & Agent Interfaces
					'mock-928741',
					'mock-208296', // MCP
					'mock-855763', // Tool Calling
					'mock-851594', // Multi-agent Runs
					'mock-124239', // Sub-agents
					'mock-192837', // Sandboxing
					'mock-900671', // Verification Gates
					'mock-457558' // Agent UI & Streaming
				]
			}
		]
	},
	{
		id: 'llm',
		hub: 'mock-394589', // LLM Application Engineering
		parts: [
			{
				tree: 'ai-agents',
				ids: [
					'mock-394589',
					'mock-613019', // Anthropic API
					'mock-928868', // OpenAI API
					'mock-610080', // LiteLLM Routing
					'mock-539868', // Prompt Design
					'mock-179476' // Token & Cost
				]
			}
		]
	},
	{
		id: 'fullstack',
		hub: 'mock-771204', // TypeScript
		parts: [
			{
				tree: 'front-end',
				ids: [
					'mock-771204',
					'mock-372944', // JavaScript
					'mock-511549', // JS Frameworks
					'mock-224980', // React
					'mock-798128', // Next js
					'mock-899665', // Vue
					'mock-842626', // Svelte
					'mock-461636', // Angular
					'mock-559182' // Playwright
				]
			},
			{
				tree: 'back-end',
				ids: [
					1, // NodeJs
					'mock-316778', // Nest JS
					2, // Ruby on Rails
					'mock-798871', // PostgreSQL
					'mock-726308' // Redis
				]
			}
		],
		bridges: [['front-end:mock-372944', 'back-end:1']] // JavaScript → Node.js
	},
	{
		id: 'infra',
		hub: 4, // Version Control & Deploy
		parts: [
			{
				tree: 'back-end',
				ids: [
					4,
					'mock-656747', // Git
					'mock-968626', // Github
					'mock-257032', // Github Actions
					'mock-830892', // GitLab
					'mock-691833', // GitLab CI/CD
					'mock-801766', // Docker
					'mock-337232', // NGINX
					'mock-976870', // Web Servers and Web
					'mock-323901', // SSH
					'mock-114511', // HTTPS
					'mock-729815' // Proxying
				]
			}
		]
	}
];

const MAX_TEXT = 118;

/** First sentence of a node description, after "X ***is*** …" / "X ***—*** …". */
const definitionOf = (markdown) => {
	if (typeof markdown !== 'string' || !markdown.trim()) return '';
	const head = markdown.replace(/\r/g, '').split(/\n\s*-\s/)[0];
	const match = head.match(/\*\*\*\s*(?:is|are|—)\s*\*\*\*([\s\S]*)/i);
	let text = (match ? match[1] : head.replace(/^\s*#+\s*/, ''))
		.replace(/[*`#_]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^это\s+/i, '');
	if (!text) return '';
	text = text[0].toUpperCase() + text.slice(1);
	if (text.length > MAX_TEXT) {
		const cut = text.slice(0, MAX_TEXT);
		text = cut.slice(0, Math.max(cut.lastIndexOf(' '), 60)).replace(/[,;:—-]+$/, '') + '…';
	}
	return text;
};

/* Tiny deterministic hash → [0, 1), so the sky looks the same on every visit. */
const hash01 = (value) => {
	let h = 2166136261;
	for (const char of String(value)) {
		h ^= char.charCodeAt(0);
		h = Math.imul(h, 16777619);
	}
	return ((h >>> 0) % 100000) / 100000;
};

const keyOf = (treeName, id) => `${treeName}:${id}`;

/**
 * @typedef {{
 *   key: string, x: number, y: number, depth: number, order: number, mag: number,
 *   title: { en: string, ru: string }, text: { en: string, ru: string }
 * }} Star
 * @typedef {{ id: string, stars: Star[], edges: [number, number][] }} Constellation
 */

/** @returns {Constellation[]} */
export const buildConstellations = () =>
	DEFINITIONS.map((definition) => {
		/** @type {Star[]} */
		const stars = [];
		const index = new Map();
		const parts = definition.parts.length;

		definition.parts.forEach((part, partIndex) => {
			const branch = tree[part.tree];
			const overlay = treeRu[part.tree] ?? {};
			const nodes = part.ids
				.map((id) => branch.nodes.find((node) => String(node.id) === String(id)))
				.filter(Boolean);

			// Normalise this part's layout into a unit box (y flipped: the tree grows down).
			const xs = nodes.map((n) => n.position.x);
			const ys = nodes.map((n) => n.position.y);
			const [minX, maxX, minY, maxY] = [
				Math.min(...xs),
				Math.max(...xs),
				Math.min(...ys),
				Math.max(...ys)
			];
			const scale = 1 / Math.max(maxX - minX, maxY - minY, 1);
			const offsetX = parts > 1 ? (partIndex / (parts - 1) - 0.5) * 1.15 : 0;
			const partScale = parts > 1 ? 0.55 : 1;

			for (const node of nodes) {
				const key = keyOf(part.tree, node.id);
				const ru = overlay[String(node.id)] ?? {};
				const jitter = (hash01(key) - 0.5) * 0.05;
				index.set(key, stars.length);
				stars.push({
					key,
					x: offsetX + ((node.position.x - (minX + maxX) / 2) * scale + jitter) * partScale,
					y: (-(node.position.y - (minY + maxY) / 2) * scale + jitter * 0.7) * partScale,
					depth: 0,
					order: 0,
					mag: String(node.id) === String(definition.hub) ? 1 : node.isNode ? 0.72 : 0.6,
					title: { en: node.title.trim(), ru: (ru.title ?? node.title).trim() },
					text: {
						en: definitionOf(node.description),
						ru: definitionOf(ru.description) || definitionOf(node.description)
					}
				});
			}
		});

		// Edges: the tree's own, between members, plus explicit bridges between parts.
		/** @type {[number, number][]} */
		const edges = [];
		const has = new Set();
		const addEdge = (a, b) => {
			if (a === undefined || b === undefined || a === b) return false;
			const id = a < b ? `${a}-${b}` : `${b}-${a}`;
			if (has.has(id)) return false;
			has.add(id);
			edges.push([a, b]);
			return true;
		};
		for (const part of definition.parts) {
			for (const edge of tree[part.tree].edges) {
				addEdge(
					index.get(keyOf(part.tree, edge.sourceNodeId)),
					index.get(keyOf(part.tree, edge.targetNodeId))
				);
			}
		}
		for (const [a, b] of definition.bridges ?? []) addEdge(index.get(a), index.get(b));

		// Join whatever is still disconnected to its nearest neighbour.
		const root = stars.map((_, i) => i);
		const find = (i) => (root[i] === i ? i : (root[i] = find(root[i])));
		for (const [a, b] of edges) root[find(a)] = find(b);
		const pairs = [];
		for (let a = 0; a < stars.length; a++) {
			for (let b = a + 1; b < stars.length; b++) {
				pairs.push([Math.hypot(stars[a].x - stars[b].x, stars[a].y - stars[b].y), a, b]);
			}
		}
		pairs.sort((p, q) => p[0] - q[0]);
		for (const [, a, b] of pairs) {
			if (find(a) !== find(b)) {
				root[find(a)] = find(b);
				addEdge(a, b);
			}
		}

		// Reveal order: breadth-first from the hub; every edge then points from the star
		// that lights up first to the one that follows, so lines draw outward.
		const hubIndex = stars.findIndex((star) => star.mag === 1);
		const start = hubIndex >= 0 ? hubIndex : 0;
		const seen = new Set([start]);
		const queue = [start];
		let order = 0;
		stars[start].order = order++;
		while (queue.length) {
			const current = queue.shift();
			for (const [a, b] of edges) {
				const next = a === current ? b : b === current ? a : -1;
				if (next < 0 || seen.has(next)) continue;
				seen.add(next);
				stars[next].depth = stars[current].depth + 1;
				stars[next].order = order++;
				queue.push(next);
			}
		}
		/** @type {[number, number][]} */
		const directed = edges.map(([a, b]) => (stars[a].order < stars[b].order ? [a, b] : [b, a]));

		relax(stars, edges);
		return { id: definition.id, stars, edges: directed };
	});

/*
 * The tree layout was made for a pan-and-zoom diagram: some nodes bunch up, a far leaf can
 * squash the rest. A short deterministic relaxation (pairwise repulsion, springs along the
 * edges, a weak pull back to the tree position) spreads each figure the way a constellation
 * reads, then the result is centred and scaled to fit a unit box.
 */
const relax = (stars, edges) => {
	const home = stars.map(({ x, y }) => ({ x, y }));
	const MIN_GAP = 0.2;
	const LINK = 0.26;
	for (let step = 0; step < 240; step++) {
		for (let a = 0; a < stars.length; a++) {
			for (let b = a + 1; b < stars.length; b++) {
				const dx = stars[a].x - stars[b].x;
				const dy = stars[a].y - stars[b].y;
				const distance = Math.hypot(dx, dy) || 1e-4;
				if (distance >= MIN_GAP) continue;
				const push = ((MIN_GAP - distance) / distance) * 0.25;
				stars[a].x += dx * push;
				stars[a].y += dy * push;
				stars[b].x -= dx * push;
				stars[b].y -= dy * push;
			}
		}
		for (const [a, b] of edges) {
			const dx = stars[b].x - stars[a].x;
			const dy = stars[b].y - stars[a].y;
			const distance = Math.hypot(dx, dy) || 1e-4;
			const pull = ((distance - LINK) / distance) * 0.06;
			stars[a].x += dx * pull;
			stars[a].y += dy * pull;
			stars[b].x -= dx * pull;
			stars[b].y -= dy * pull;
		}
		stars.forEach((star, i) => {
			star.x += (home[i].x - star.x) * 0.02;
			star.y += (home[i].y - star.y) * 0.02;
		});
	}

	const xs = stars.map((s) => s.x);
	const ys = stars.map((s) => s.y);
	const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
	const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
	const extent = Math.max(
		Math.max(...xs) - Math.min(...xs),
		Math.max(...ys) - Math.min(...ys),
		1e-3
	);
	for (const star of stars) {
		star.x = (star.x - cx) / extent;
		star.y = (star.y - cy) / extent;
	}
};
