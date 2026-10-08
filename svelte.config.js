import adapter from '@sveltejs/adapter-static';

/*
 * The site is fully static: every page is prerendered (see src/routes/+layout.js)
 * and `build/` is what the web server serves as is — the same output locally and
 * on the box. `404.html` is the client-rendered fallback for unknown paths;
 * point the web server's 404 handler at it.
 */
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			strict: true
		}),
		// the page's CSS is small: inline it so first paint waits for no stylesheet request
		inlineStyleThreshold: 32 * 1024,
		prerender: {
			// `/` links to both locales, but list them so a change there can't drop a page
			entries: ['*', '/en/', '/ru/', '/sitemap.xml']
		}
	}
};

export default config;
