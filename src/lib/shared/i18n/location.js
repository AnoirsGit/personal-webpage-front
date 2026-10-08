/*
 * Where the owner is, for copy and meta. The only source is
 * `src/lib/config/site-config.json` (edited later from an admin page), so no
 * template or dictionary names a city or a country: strings say `{city}` and
 * `{country}` and get them from here, in the page's language.
 *
 * Russian copy uses the names only in the nominative («{city}, {country}»,
 * «База — {city}»), because a different city would need a different case ending.
 */
import siteConfig from '$lib/config/site-config.json';

export const home = siteConfig.home;

const pick = (names, code) => names?.[code] ?? names?.en ?? '';

/** `{ city, country }` in the given language. */
export const homeParams = (code) => ({
	city: pick(home.city, code),
	country: pick(home.countryName, code)
});

/**
 * "UTC+N" label for an IANA zone, as of `at`. Computed on the server at build time and
 * handed to the page as data, so a browser with an older time-zone database
 * cannot rewrite it during hydration.
 */
export const utcOffsetLabel = (timeZone = home.timezone, at = new Date()) => {
	try {
		const zone = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
			.formatToParts(at)
			.find((part) => part.type === 'timeZoneName');
		return zone ? zone.value.replace('GMT', 'UTC') : 'UTC';
	} catch {
		return '';
	}
};
