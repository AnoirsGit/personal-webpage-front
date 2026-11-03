/*
 * Checks the static build in build/ (run `pnpm build` first). No server, no browser.
 *
 *   node scripts/check-build.js [build-dir]
 *
 * - the files the box's health check and Caddy rely on exist (/, /en/, /ru/, 404.html, sitemap.xml, robots.txt)
 * - <html lang> is filled per page: ru only under /ru/, English for /, the 404 shell and /en/
 * - `/` ships no app JavaScript (only the inline language gate)
 * - each language page has one H1, seven sections, a canonical, hreflang alternates, a JSON-LD graph
 *   (Person, WebSite, WebPage, Service, FAQPage) and no unfilled {city}/{country}/{utc}/{years}
 * - hooks.server.js picks `ru` only for /ru and /ru/…, never for /rules/ or /en/ru/; +error.svelte uses the same test
 *   (the 404 shell is one file for every path)
 * - the sitemap lists both pages with their alternates; the 404 shell loads the app that renders the error page
 *
 * Exits non-zero if any invariant class is broken; prints one line per check.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { handle } from '../src/hooks.server.js';
import { SITE_URL } from '../src/lib/seo/site.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const build = resolve(process.argv[2] ?? resolve(root, 'build'));
const ORIGIN = SITE_URL;
const SECTIONS = ['hero', 'skills', 'process', 'works', 'offer', 'faq', 'contact'];
const GRAPH_TYPES = ['Person', 'WebSite', 'WebPage', 'Service', 'FAQPage'];

let failed = 0;
const check = (label, problems) => {
	if (problems.length) {
		failed++;
		console.log(`FAIL ${label}`);
		for (const problem of problems.slice(0, 10)) console.log(`     ${problem}`);
	} else {
		console.log(`ok   ${label}`);
	}
};

const files = [
	'index.html',
	'en/index.html',
	'ru/index.html',
	'404.html',
	'sitemap.xml',
	'robots.txt'
];
check(
	'the files the deploy health check and Caddy serve exist',
	files.filter((file) => !existsSync(resolve(build, file))).map((file) => `missing ${file}`)
);
if (files.some((file) => !existsSync(resolve(build, file)))) process.exit(1);

const read = (file) => readFileSync(resolve(build, file), 'utf8');
const pages = Object.fromEntries(files.map((file) => [file, read(file)]));
const langOf = (html) => /<html[^>]*\blang="([^"]*)"/.exec(html)?.[1];

check(
	'<html lang> per page',
	Object.entries({
		'index.html': 'en',
		'en/index.html': 'en',
		'ru/index.html': 'ru',
		'404.html': 'en'
	})
		.filter(([file, lang]) => langOf(pages[file]) !== lang)
		.map(([file, lang]) => `${file}: lang="${langOf(pages[file])}", expected "${lang}"`)
);

const root_ = pages['index.html'];
check(
	'/ ships no app JavaScript, only the inline language gate',
	[
		/modulepreload/.test(root_) && 'modulepreload link',
		/<script[^>]*\bsrc=/.test(root_) && 'script with src',
		/<script[^>]*type="module"/.test(root_) && 'module script',
		/\bimport\(/.test(root_) && 'dynamic import',
		!/<script>(?:(?!<\/script>)[\s\S])*?(localStorage|navigator\.languages?)/.test(root_) &&
			'no inline language gate'
	].filter(Boolean)
);

const jsonLd = (html) => {
	const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
	return blocks.map(([, body]) => JSON.parse(body));
};
const typesIn = (node, found = new Set()) => {
	if (Array.isArray(node)) node.forEach((item) => typesIn(item, found));
	else if (node && typeof node === 'object') {
		for (const type of [].concat(node['@type'] ?? [])) found.add(type);
		Object.values(node).forEach((value) => typesIn(value, found));
	}
	return found;
};

for (const lang of ['en', 'ru']) {
	const file = `${lang}/index.html`;
	const html = pages[file];
	const problems = [];
	const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
	if (h1 !== 1) problems.push(`${h1} <h1>, expected 1`);
	for (const id of SECTIONS)
		if (!new RegExp(`\\bid="${id}"`).test(html)) problems.push(`no #${id}`);
	if (!html.includes(`<link rel="canonical" href="${ORIGIN}/${lang}/">`))
		problems.push('canonical');
	for (const [hreflang, path] of [
		['en', 'en/'],
		['ru', 'ru/'],
		['x-default', 'en/']
	]) {
		if (!html.includes(`<link rel="alternate" hreflang="${hreflang}" href="${ORIGIN}/${path}">`))
			problems.push(`hreflang ${hreflang}`);
	}
	if (/noindex/.test(/<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? ''))
		problems.push('robots says noindex');
	try {
		const types = typesIn(jsonLd(html));
		for (const type of GRAPH_TYPES) if (!types.has(type)) problems.push(`JSON-LD has no ${type}`);
	} catch (error) {
		problems.push(`JSON-LD does not parse: ${error.message}`);
	}
	const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
	for (const left of text.match(/\{(city|country|utc|years)\}|\bundefined\b|\[object /g) ?? [])
		problems.push(`unfilled "${left}" in the copy`);
	const cyrillic = /[А-Яа-яЁё]/.test(/<h1[\s\S]*?<\/h1>/.exec(html)?.[0] ?? '');
	if (cyrillic !== (lang === 'ru'))
		problems.push(`the H1 is ${cyrillic ? 'Russian' : 'not Russian'}`);
	check(`${file}: sections, SEO tags, JSON-LD, filled copy`, problems);
}

{
	const sitemap = pages['sitemap.xml'];
	const problems = [];
	for (const lang of ['en', 'ru']) {
		if (!sitemap.includes(`<loc>${ORIGIN}/${lang}/</loc>`)) problems.push(`no ${lang} <loc>`);
	}
	const urls = sitemap.match(/<url>/g)?.length ?? 0;
	const alternates = sitemap.match(/<xhtml:link rel="alternate"/g)?.length ?? 0;
	if (urls !== 2) problems.push(`${urls} <url>, expected 2`);
	if (alternates !== urls * 3) problems.push(`${alternates} alternates, expected ${urls * 3}`);
	if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap)) problems.push('no lastmod');
	if (!pages['robots.txt'].includes(`Sitemap: ${ORIGIN}/sitemap.xml`))
		problems.push('robots.txt does not point to the sitemap');
	check('sitemap.xml and robots.txt', problems);
}

{
	// +error.svelte repeats the same test in the browser: /rules/ is no Russian page
	const langFor = (pathname) => {
		const html = handle({
			event: { url: new URL(pathname, ORIGIN) },
			resolve: (_event, { transformPageChunk }) =>
				transformPageChunk({ html: '<html lang="%lang%">' })
		});
		if (typeof html !== 'string')
			throw new Error('hooks.server.js handle() is no longer synchronous');
		return /lang="([^"]*)"/.exec(html)?.[1];
	};
	const expected = {
		'/': 'en',
		'/en/': 'en',
		'/ru': 'ru',
		'/ru/': 'ru',
		'/ru/nope/': 'ru',
		'/rules/': 'en',
		'/russia/': 'en',
		'/en/ru/': 'en'
	};
	const problems = [];
	for (const [pathname, lang] of Object.entries(expected)) {
		const got = langFor(pathname);
		if (got !== lang) problems.push(`${pathname}: ${got}, expected ${lang}`);
	}
	const errorPage = readFileSync(resolve(root, 'src/routes/+error.svelte'), 'utf8');
	if (!errorPage.includes('/^\\/ru(\\/|$)/.test($page.url.pathname)'))
		problems.push('+error.svelte does not use the /^\\/ru(\\/|$)/ test of hooks.server.js');
	check('hooks.server.js and +error.svelte: <html lang> from the path', problems);
}

{
	// 404.html is the client-rendered fallback shell (+error.svelte): without the app it shows nothing
	const problems = [];
	if (!/\/_app\/immutable\/entry\/start\.[^"]+\.js/.test(pages['404.html']))
		problems.push('does not load the app');
	check('404.html loads the app that renders the error page', problems);
}

if (failed) {
	console.log(`${failed} check(s) failed`);
	process.exit(1);
}
