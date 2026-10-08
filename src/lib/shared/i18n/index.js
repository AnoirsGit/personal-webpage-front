/*
 * Tiny store-based i18n — no dependency, two locales.
 *
 * Every locale has its own prerendered URL (/en/, /ru/), so the URL decides the
 * language: `src/routes/[lang]/+layout.svelte` sets `locale` from the route
 * before anything renders, on the server and in the browser alike. `t` is a
 * derived store holding a lookup function, so components read strings as
 * `$t('nav.works')` (a non-string value, e.g. a list of cases, comes back as is).
 *
 * localStorage only remembers an explicit switch, for the language-picking
 * redirect on `/`.
 */
import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';

import en from './locales/en.json';
import ru from './locales/ru.json';
import { homeParams } from './location.js';

const DICTIONARIES = { en, ru };

export const DEFAULT_LOCALE = 'en';
export const STORAGE_KEY = 'locale';

export const LOCALES = [
	{ code: 'en', label: 'EN', name: 'English', ogLocale: 'en_US' },
	{ code: 'ru', label: 'RU', name: 'Русский', ogLocale: 'ru_RU' }
];

export const isSupported = (code) => Boolean(code) && code in DICTIONARIES;

// in the browser start from what the server rendered, so hydration never flips the language
const initialLocale = () =>
	browser && isSupported(document.documentElement.lang)
		? document.documentElement.lang
		: DEFAULT_LOCALE;

export const locale = writable(initialLocale());

export const setLocale = (next) => {
	if (isSupported(next)) locale.set(next);
};

/* Called when the reader picks a language by hand; `/` honours it next time. */
export const rememberLocale = (code) => {
	if (!browser || !isSupported(code)) return;
	try {
		localStorage.setItem(STORAGE_KEY, code);
	} catch {
		// private mode or blocked storage: the redirect falls back to the browser language
	}
};

/*
 * Build-time facts every string may quote — `{years}` of experience, `{utc}` —
 * computed on the server and set by the [lang] layout from its data, so the
 * prerendered HTML and the hydrated page agree. `{city}` and `{country}` come
 * from the site config (./location.js) and need no setting.
 */
export const facts = writable({});

const lookup = (dictionary, key) =>
	key.split('.').reduce((branch, part) => (branch == null ? branch : branch[part]), dictionary);

export const interpolate = (template, params) =>
	template.replace(/{(\w+)}/g, (match, name) => params[name] ?? match);

// lists of cases or questions carry placeholders too, so walk the whole value
const interpolateDeep = (value, params) => {
	if (typeof value === 'string') return interpolate(value, params);
	if (Array.isArray(value)) return value.map((item) => interpolateDeep(item, params));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([name, item]) => [name, interpolateDeep(item, params)])
		);
	}
	return value;
};

export const translate = (code, key, params = {}) => {
	const value =
		lookup(DICTIONARIES[code] ?? DICTIONARIES[DEFAULT_LOCALE], key) ??
		lookup(DICTIONARIES[DEFAULT_LOCALE], key);
	if (value == null) return key;
	return interpolateDeep(value, { ...homeParams(code), ...params });
};

export const t = derived(
	[locale, facts],
	([$locale, $facts]) =>
		(key, params) =>
			translate($locale, key, { ...$facts, ...params })
);

/* Picks the active variant out of a `{ en: …, ru: … }` map — used for
 * whole content files that live outside the dictionaries. */
export const byLocale = (variants) =>
	derived(locale, ($locale) => variants[$locale] ?? variants[DEFAULT_LOCALE]);

// a client-side switch between /en/ and /ru/ keeps the document, so mirror the
// language onto <html lang> (the first HTML already carries it from the server)
if (browser) {
	locale.subscribe((value) => {
		document.documentElement.lang = value;
	});
}
