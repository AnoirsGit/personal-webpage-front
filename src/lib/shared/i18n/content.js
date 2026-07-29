/*
 * Locale-aware content for the hero.
 *
 * Only above-the-fold copy lives here — it is part of the entry chunk by
 * necessity. The bulky sections keep their prose in sibling modules
 * (`content.works.js`, `content.skill-tree.js`) reached exclusively through a
 * dynamic import, so their JSON never lands in the initial bundle.
 */
import { byLocale } from './index.js';

import aboutMeEn from '$lib/shared/mocks/about-me.en.json';
import aboutMeRu from '$lib/shared/mocks/about-me.ru.json';
import worksEn from '$lib/shared/mocks/works.en.json';

export const aboutMe = byLocale({ en: aboutMeEn.aboutMe, ru: aboutMeRu.aboutMe });

/*
 * Hero counters, derived from the timeline data so they never drift from it.
 * Every input (dates, company count, skill count, card count) is the same in
 * every locale, so the English file alone is enough and the translations stay
 * behind the lazy `content.works` import.
 */
export const careerStats = {
	years: new Date().getFullYear() - Math.min(...worksEn.map((work) => parseInt(work.dates[0], 10))),
	projects: worksEn.reduce((total, work) => total + (work.cards?.length ?? 0), 0),
	technologies: new Set(worksEn.flatMap((work) => work.skills)).size,
	companies: worksEn.length
};
