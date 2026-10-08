/*
 * The skill tree is the single source of skills. `tree.json` holds every node
 * (title, markdown description, edges) in English; `tree.ru.json` overlays the
 * translatable `title` / `description` by node id, so keep ids stable.
 *
 * CONSTELLATIONS is the one place that groups those nodes into the named groups
 * the site shows: the 3D sky draws each group as a constellation and the Skills
 * section lists the same groups. Only membership and the group names live here;
 * every skill's name and text come from the tree. Use `buildConstellations(code)`
 * (plain data, also fine on the server) or the `constellations` store.
 *
 * The full tree is ~150 kB, so the page itself receives only the built list from
 * its server load; import this module from the client only in lazily loaded code.
 */
import { derived } from 'svelte/store';

import { locale, DEFAULT_LOCALE } from './index.js';

import tree from '$lib/shared/mocks/tree.json';
import treeRu from '$lib/shared/mocks/tree.ru.json';

const TREE_OVERLAYS = { ru: treeRu };

const applyOverlay = (branch, overlay) => {
	if (!overlay) return branch;

	return {
		...branch,
		nodes: branch.nodes.map((node) => {
			const translation = overlay[String(node.id)];
			return translation ? { ...node, ...translation } : node;
		})
	};
};

/** The tree in one language: `{ [branch]: { nodes, edges } }`. */
export const localizedTree = (code) => {
	const overlay = TREE_OVERLAYS[code];
	if (!overlay || code === DEFAULT_LOCALE) return tree;

	return Object.fromEntries(
		Object.entries(tree).map(([key, branch]) => [key, applyOverlay(branch, overlay[key])])
	);
};

export const skillTree = derived(locale, ($locale) => localizedTree($locale));

/* ---------------------------------------------------------------------------------- */

const LLM_ROOT = 'mock-394589'; // "LLM Application Engineering"

/* Category labels of the old 2D tree ("Basics", "Build Tools"…): structure, not skills. */
const STRUCTURAL = new Set([
	'4', // Version Control & Deploy
	'5', // Programming Language
	'6', // Databases & Caching
	'mock-976870', // Web Servers and Web
	'mock-833011', // Architectures Development Principles
	'mock-262855', // Database scaling and optimization (its children are the skills)
	'mock-658400', // Basics
	'mock-511549', // JS Frameworks
	'mock-505573', // Build Tools
	'mock-102782', // Testing
	'mock-864844', // Rendering Strategies
	'mock-146709', // Animations and Visual Effects
	'mock-342728', // Frontend Architectures
	'mock-547485' // Contributing UI projects
]);

/* The same skill sits in both the front-end and the back-end branch: list it once. */
const DUPLICATES = new Set([
	'mock-310399', // JavaScript (back-end copy)
	'mock-945235', // DDD (front-end copy)
	'mock-316457' // Clean Architecture (front-end copy)
]);

/* Back-end nodes that are about running things rather than writing them. */
const INFRA = new Set([
	'mock-801766', // Docker
	'7', // Docker Hub
	'mock-656747', // Git
	'mock-968626', // GitHub
	'mock-257032', // GitHub Actions
	'mock-830892', // GitLab
	'mock-691833', // GitLab CI/CD
	'mock-927811', // Webhooks
	'mock-337232', // NGINX
	'mock-114511', // HTTPS
	'mock-323901', // SSH
	'mock-358585', // Netplan
	'mock-729815' // Proxying
]);

/** Ids of `rootId` and everything below it; an edge points from child to parent. */
const subtreeOf = (branch, rootId) => {
	const found = new Set([rootId]);
	let grew = true;
	while (grew) {
		grew = false;
		for (const { sourceNodeId, targetNodeId } of branch.edges) {
			const child = String(sourceNodeId);
			if (found.has(String(targetNodeId)) && !found.has(child)) {
				found.add(child);
				grew = true;
			}
		}
	}
	return found;
};

const LLM_IDS = subtreeOf(tree['ai-agents'], LLM_ROOT);

const isSkill = (id) => !STRUCTURAL.has(id) && !DUPLICATES.has(id);

/**
 * Groups in display order — the AI-native core first. `detailed` groups show each
 * skill's one-line summary in the list; the others list names only. `lead` puts
 * the main tools of a group first; everything else keeps the tree's order.
 */
export const CONSTELLATIONS = [
	{
		id: 'agents',
		branch: 'ai-agents',
		detailed: true,
		name: { en: 'Agents', ru: 'Агенты' },
		line: {
			en: 'Teams of agents that plan, code, test and review — each in its own sandbox.',
			ru: 'Команды агентов, которые планируют, пишут, тестируют и ревьюят — каждый в своей песочнице.'
		},
		includes: (id) => !LLM_IDS.has(id)
	},
	{
		id: 'llm',
		branch: 'ai-agents',
		detailed: true,
		name: { en: 'LLM & evals', ru: 'LLM и evals' },
		line: {
			en: 'Models, context and measurement: quality and cost are measured, not guessed.',
			ru: 'Модели, контекст и замеры: качество и стоимость меряются, а не угадываются.'
		},
		includes: (id) => LLM_IDS.has(id)
	},
	{
		id: 'frontend',
		branch: 'front-end',
		detailed: false,
		name: { en: 'Front-end', ru: 'Фронтенд' },
		line: {
			en: 'Interfaces people use every day, from SSR storefronts to real-time agent UIs.',
			ru: 'Интерфейсы, которыми пользуются каждый день: от SSR-витрин до UI агентов в реальном времени.'
		},
		includes: isSkill,
		// TypeScript, React, Next.js, Vue, Nuxt, Pinia, Vite, Tailwind CSS, FSD, SSR
		lead: [
			'mock-771204',
			'mock-224980',
			'mock-798128',
			'mock-899665',
			'mock-418331',
			'mock-418377',
			'mock-383641',
			'mock-886210',
			'mock-546691',
			'mock-119159'
		]
	},
	{
		id: 'backend',
		branch: 'back-end',
		detailed: false,
		name: { en: 'Back-end', ru: 'Бэкенд' },
		line: {
			en: 'Services, data and the architecture behind the product.',
			ru: 'Сервисы, данные и архитектура за продуктом.'
		},
		includes: (id) => isSkill(id) && !INFRA.has(id),
		// Node.js, NestJS, Python, FastAPI, PostgreSQL, Redis, SQL
		lead: [
			'1',
			'mock-316778',
			'mock-605112',
			'mock-605148',
			'mock-798871',
			'mock-726308',
			'mock-152172'
		]
	},
	{
		id: 'infra',
		branch: 'back-end',
		detailed: false,
		name: { en: 'Infrastructure', ru: 'Инфраструктура' },
		line: {
			en: 'What keeps it running: containers, CI/CD, servers and networking.',
			ru: 'То, на чём всё держится: контейнеры, CI/CD, серверы и сеть.'
		},
		includes: (id) => INFRA.has(id),
		lead: [...INFRA]
	}
];

/**
 * One line about a skill, from its markdown description ('' if there is none).
 * Descriptions open with "#### <Skill> ***is*** a <what it is> **that** …"; the
 * name is already shown, so keep what follows the verb ("A model API that …",
 * «Слой, который …») and stop at the end of the first sentence.
 */
export const summaryOf = (markdown = '') => {
	const head = markdown.split(/\n\s*-\s/)[0];
	const [, ...afterVerb] = head.split(/\*\*\*[^*]+\*\*\*/);
	const plain = (afterVerb.length ? afterVerb.join(' ') : head)
		.replace(/[#*_`]/g, '')
		.replace(/\s+/g, ' ')
		.replace(/\(\s+/g, '(')
		.replace(/\s+\)/g, ')')
		.trim()
		.replace(/^это\s+/i, '');
	const end = plain.search(/[.!?](\s|$)/);
	const sentence = end === -1 ? plain : plain.slice(0, end + 1);
	return sentence.charAt(0).toUpperCase() + sentence.slice(1);
};

/* Ids listed in `lead` go first, in that order; the rest keep the tree's order. */
const leadFirst = (stars, lead = []) => {
	const rank = (star) => {
		const at = lead.indexOf(star.id);
		return at === -1 ? lead.length : at;
	};
	return stars
		.map((star, index) => ({ star, index }))
		.sort((a, b) => rank(a.star) - rank(b.star) || a.index - b.index)
		.map(({ star }) => star);
};

const pick = (names, code) => names[code] ?? names[DEFAULT_LOCALE];

/**
 * The groups in one language, as plain data:
 * `[{ id, name, line, detailed, stars: [{ id, title, summary, description, image }], links: [[from, to]] }]`.
 * `links` are tree edges with both ends inside the group — the lines of the constellation.
 */
export const buildConstellations = (code) => {
	const localized = localizedTree(code);

	return CONSTELLATIONS.map(({ id, branch, detailed, name, line, includes, lead }) => {
		const { nodes, edges } = localized[branch];
		const stars = leadFirst(
			nodes
				.filter((node) => includes(String(node.id)))
				.map((node) => ({
					id: String(node.id),
					title: node.title.trim(),
					summary: summaryOf(node.description),
					description: node.description ?? '',
					image: node.imageUrl || ''
				})),
			lead
		);
		const inside = new Set(stars.map((star) => star.id));
		const links = edges
			.map(({ sourceNodeId, targetNodeId }) => [String(sourceNodeId), String(targetNodeId)])
			.filter(([from, to]) => inside.has(from) && inside.has(to));

		return { id, name: pick(name, code), line: pick(line, code), detailed, stars, links };
	});
};

export const constellations = derived(locale, ($locale) => buildConstellations($locale));
