/*
 * Tiny store-based i18n — no dependency, two locales.
 *
 * `t` is a derived store holding a lookup function, so components read
 * strings as `$t('nav.works')` and re-render automatically on switch.
 * The choice is persisted in localStorage and mirrored onto <html lang>.
 */
import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';

import en from './locales/en.json';
import ru from './locales/ru.json';

const DICTIONARIES = { en, ru };

export const DEFAULT_LOCALE = 'en';
export const STORAGE_KEY = 'locale';

export const LOCALES = [
	{ code: 'en', label: 'EN', name: 'English' },
	{ code: 'ru', label: 'RU', name: 'Русский' }
];

const isSupported = (code) => Boolean(code) && code in DICTIONARIES;

// localStorage wins, then the browser's language list, then English.
const detectLocale = () => {
	if (!browser) return DEFAULT_LOCALE;

	const stored = localStorage.getItem(STORAGE_KEY);
	if (isSupported(stored)) return stored;

	const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
	return preferred.map((tag) => tag?.slice(0, 2).toLowerCase()).find(isSupported) ?? DEFAULT_LOCALE;
};

export const locale = writable(detectLocale());

export const setLocale = (next) => {
	if (isSupported(next)) locale.set(next);
};

const lookup = (dictionary, key) =>
	key.split('.').reduce((branch, part) => (branch == null ? branch : branch[part]), dictionary);

const interpolate = (template, params) =>
	template.replace(/{(\w+)}/g, (match, name) => params[name] ?? match);

export const t = derived(locale, ($locale) => (key, params) => {
	const value = lookup(DICTIONARIES[$locale], key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key);
	if (typeof value !== 'string') return value ?? key;
	return params ? interpolate(value, params) : value;
});

/* Picks the active variant out of a `{ en: …, ru: … }` map — used for
 * whole content files (works, about-me) that live outside the dictionaries. */
export const byLocale = (variants) =>
	derived(locale, ($locale) => variants[$locale] ?? variants[DEFAULT_LOCALE]);

if (browser) {
	locale.subscribe((value) => {
		localStorage.setItem(STORAGE_KEY, value);
		document.documentElement.lang = value;
	});
}
