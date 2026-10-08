/*
 * One place for the facts the head, the sitemap and the JSON-LD share.
 * SITE_URL is the canonical origin: no www, https, no trailing slash.
 */
export const SITE_URL = 'https://anoirs-server.top';

export const SITE_LOCALES = ['en', 'ru'];
export const SITE_DEFAULT_LOCALE = 'en';

/* Bump when the page copy changes; the sitemap's <lastmod> reads it. */
export const CONTENT_UPDATED = '2026-10-08';

export const localeUrl = (code) => `${SITE_URL}/${code}/`;
export const absoluteUrl = (path) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const OG_IMAGE = {
	width: 1200,
	height: 630,
	type: 'image/jpeg',
	path: (code) => `/og/og-${code}.jpg` // made by scripts/og-image.js
};

export const PERSON = {
	name: 'Anuar Beibit',
	alternateNames: ['Ануар Бейбит', 'Anoir Beibit'],
	email: 'anoirsmail@gmail.com',
	phone: '+77079116992',
	phoneDisplay: '+7 707 911 69 92',
	telegram: 'NoirBegula',
	github: 'https://github.com/AnoirsGit',
	linkedin: 'https://www.linkedin.com/in/anoir-beibit-73218a215/',
	portrait: '/images/about-me-bg.webp',
	cv: '/cv/Anuar-Beibit-Full-Stack-Engineer-AI.pdf',
	repo: 'https://github.com/AnoirsGit/personal-webpage-front'
};
