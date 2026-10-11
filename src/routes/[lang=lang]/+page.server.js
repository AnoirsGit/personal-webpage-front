import worksEn from '$lib/shared/mocks/works.en.json';
import worksRu from '$lib/shared/mocks/works.ru.json';
import { translate } from '$lib/shared/i18n';
import { buildConstellations } from '$lib/shared/i18n/content.skill-tree.js';

/* Both locales are known up front; each becomes static HTML. */
export const entries = () => [{ lang: 'en' }, { lang: 'ru' }];

const WORKS = { en: worksEn, ru: worksRu };

const year = (date) => (/^\d{4}/.test(date) ? date.slice(0, 4) : null);

/*
 * The names a skill or a case's stack entry goes by, so "Nuxt 3" finds Nuxt, "Vue.js" Vue,
 * "MCP" finds "MCP (Model Context Protocol)" and "Feature-Sliced Design" its "(FSD)" form.
 * Exact names only, no fuzzy guessing: a case links a skill only when its stack names it.
 */
const namesOf = (text) => {
	const plain = (value) =>
		value
			.toLowerCase()
			.replace(/ё/g, 'е')
			.replace(/\.js\b/g, '')
			.replace(/\s+\d+(\.\d+)*$/, '')
			.replace(/\s+/g, ' ')
			.trim();
	const names = new Set([plain(text), plain(text.replace(/\([^)]*\)/g, ' '))]);
	const inner = text.match(/\(([^)]+)\)/);
	if (inner) names.add(plain(inner[1]));
	names.delete('');
	return names;
};

/** Ids of the cases whose stack names this skill. */
const casesFor = (title, cases) => {
	const names = namesOf(title);
	return cases
		.filter(({ stack = [] }) => stack.some((tech) => [...namesOf(tech)].some((n) => names.has(n))))
		.map(({ id }) => id);
};

/*
 * Only what the page shows travels to the browser: the skill groups with one short line
 * per skill (the long markdown descriptions and the full tree stay on the server) and a
 * short career line out of works.*.json.
 *
 * Per skill, only what the data already holds: `tier` is 'lead' for the group's first
 * skill, 'main' for its main tools and 'minor' for the rest; `related` are the tree's own
 * links inside the group; `cases` the cases whose stack names the skill.
 */
export const load = ({ params }) => {
	const cases = translate(params.lang, 'works.cases');
	const groups = buildConstellations(params.lang).map(
		({ id, name, line, detailed, stars, links }) => ({
			id,
			name,
			line,
			detailed,
			stars: stars.map((star, index) => ({
				id: star.id,
				title: star.title,
				summary: star.summary,
				tier: index === 0 ? 'lead' : star.main ? 'main' : 'minor',
				related: [
					...new Set(
						links
							.filter(([from, to]) => from === star.id || to === star.id)
							.map(([from, to]) => (from === star.id ? to : from))
					)
				],
				cases: casesFor(star.title, cases)
			}))
		})
	);

	const career = WORKS[params.lang].map(({ title, position, dates }) => ({
		title,
		position,
		start: year(dates[0]),
		end: year(dates[1])
	}));

	return { groups, career };
};
