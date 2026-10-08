import worksEn from '$lib/shared/mocks/works.en.json';
import { utcOffsetLabel } from '$lib/shared/i18n/location.js';

/* Whole years since the first job in the timeline, so the copy never goes stale. */
const yearsOfExperience = (works, now = new Date()) =>
	now.getFullYear() - Math.min(...works.map((work) => parseInt(work.dates[0], 10)));

/** Facts computed once, at build time, and quoted by the copy as {years} and {utc}. */
export const load = ({ params }) => ({
	lang: params.lang,
	facts: {
		years: yearsOfExperience(worksEn),
		utc: utcOffsetLabel()
	}
});
