import { SITE_LOCALES, SITE_DEFAULT_LOCALE, CONTENT_UPDATED, localeUrl } from '$lib/seo/site.js';

export const prerender = true;
export const trailingSlash = 'never';

const alternates = [
	...SITE_LOCALES.map(
		(code) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${localeUrl(code)}"/>`
	),
	`    <xhtml:link rel="alternate" hreflang="x-default" href="${localeUrl(SITE_DEFAULT_LOCALE)}"/>`
].join('\n');

/** Both language versions, each listing the other through hreflang. */
export const GET = () => {
	const urls = SITE_LOCALES.map(
		(code) =>
			`  <url>\n    <loc>${localeUrl(
				code
			)}</loc>\n    <lastmod>${CONTENT_UPDATED}</lastmod>\n${alternates}\n  </url>`
	).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
};
