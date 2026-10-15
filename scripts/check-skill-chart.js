/*
 * Checks the skill tree's star chart (src/lib/sections/skill-tree/constellation.js) in both
 * languages and all four layouts, one chart per group as the page draws them (one tab each):
 * labels that overlap, a line through a label, a label that runs out of the tree or past its
 * room. Prints nothing but the summary when all is well and
 * exits 1 otherwise.
 *
 * The skills come from a running dev server or preview (the page's own data, so this checks
 * exactly what the page lays out):
 *
 *   pnpm dev &            # or: pnpm build && pnpm preview &
 *   node scripts/check-skill-chart.js http://127.0.0.1:5173
 *
 * Run it after changing the skills (tree.json, tree.ru.json, CONSTELLATIONS), the label
 * fonts or the layout constants.
 */
import {
	checkChart,
	layoutChart,
	softHyphens
} from '../src/lib/sections/skill-tree/constellation.js';

const origin = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const ROOT = { en: 'AI-native engineer', ru: 'AI-native разработчик' };

/** The page's server data, decoded from SvelteKit's devalue-flattened __data.json. */
const pageData = async (lang) => {
	const response = await fetch(`${origin}/${lang}/__data.json?x-sveltekit-invalidated=001`);
	if (!response.ok) throw new Error(`${lang}: HTTP ${response.status}`);
	const { nodes } = await response.json();
	for (const node of nodes) {
		if (node?.type !== 'data') continue;
		const flat = node.data;
		const read = (i) => {
			const value = flat[i];
			if (Array.isArray(value)) return value.map(read);
			if (value && typeof value === 'object')
				return Object.fromEntries(Object.entries(value).map(([key, at]) => [key, read(at)]));
			return value;
		};
		const data = read(0);
		if (data?.groups) return data;
	}
	throw new Error(`${lang}: no skill groups in the page data`);
};

const main = async () => {
	let failed = false;
	for (const lang of ['en', 'ru']) {
		const { groups } = await pageData(lang);
		for (const group of groups) {
			const chart = layoutChart([group], { root: ROOT[lang], label: softHyphens });
			const labels = {
				root: ROOT[lang],
				[`hub:${group.id}`]: `${group.name} · ${group.stars.length}`
			};
			for (const star of group.stars) labels[`${group.id}:${star.id}`] = star.title;
			const problems = checkChart(chart, labels);
			const heights = chart.layouts.map((layout) => `${layout.id} ${layout.height}px`).join(', ');
			console.log(
				`${lang} ${group.id}: ${
					problems.length ? `${problems.length} problems` : 'clean'
				} (${heights})`
			);
			for (const problem of problems) console.log(`  ${problem}`);
			if (problems.length) failed = true;
		}
	}
	process.exit(failed ? 1 : 0);
};

main().catch((error) => {
	console.error(error.message);
	process.exit(2);
});
