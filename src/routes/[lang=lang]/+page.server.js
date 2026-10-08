import worksEn from '$lib/shared/mocks/works.en.json';
import worksRu from '$lib/shared/mocks/works.ru.json';
import { buildConstellations } from '$lib/shared/i18n/content.skill-tree.js';

/* Both locales are known up front; each becomes static HTML. */
export const entries = () => [{ lang: 'en' }, { lang: 'ru' }];

const WORKS = { en: worksEn, ru: worksRu };

const year = (date) => (/^\d{4}/.test(date) ? date.slice(0, 4) : null);

/*
 * Only what the page shows travels to the browser: the skill groups without the
 * long markdown descriptions (the full tree stays out of the client bundle) and a
 * short career line out of works.*.json.
 */
export const load = ({ params }) => {
	const groups = buildConstellations(params.lang).map(({ id, name, line, detailed, stars }) => ({
		id,
		name,
		line,
		detailed,
		stars: stars.map(({ id: starId, title, summary }) => ({
			id: starId,
			title,
			summary: detailed ? summary : ''
		}))
	}));

	const career = WORKS[params.lang].map(({ title, position, dates }) => ({
		title,
		position,
		start: year(dates[0]),
		end: year(dates[1])
	}));

	return { groups, career };
};
