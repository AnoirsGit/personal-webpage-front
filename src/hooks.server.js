/*
 * The first HTML must already say which language it is in — crawlers and screen
 * readers do not wait for JavaScript. The locale is the first path segment
 * (/en/…, /ru/…); `/`, the 404 fallback and anything else are English.
 */
const RU_PATH = /^\/ru(\/|$)/;

/** @type {import('@sveltejs/kit').Handle} */
export const handle = ({ event, resolve }) => {
	const lang = RU_PATH.test(event.url.pathname) ? 'ru' : 'en';

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
