<!--
	`/` has no content of its own: it sends the reader to /en/ or /ru/ before the
	page paints — a language picked here before (localStorage) wins, then the
	browser's languages, then English. Old in-page links (/#contacts) keep working.
	Without JavaScript the meta refresh goes to English, and the two links stay
	visible either way. Search engines get the canonical /en/ and find /ru/ through
	hreflang.
-->
<script>
	import { SITE_DEFAULT_LOCALE, localeUrl } from '$lib/seo/site.js';
	import { STORAGE_KEY } from '$lib/shared/i18n';

	const redirect = `(function () {
		var supported = { en: 1, ru: 1 };
		var legacy = { 'about-me': 'hero', contacts: 'contact' };
		var lang = '';
		try { lang = localStorage.getItem('${STORAGE_KEY}') || ''; } catch (e) {}
		if (!supported[lang]) {
			lang = '${SITE_DEFAULT_LOCALE}';
			var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
			for (var i = 0; i < prefs.length; i++) {
				var code = String(prefs[i] || '').slice(0, 2).toLowerCase();
				if (code === 'ru' || code === 'kk' || code === 'ky' || code === 'be') { lang = 'ru'; break; }
				if (code === 'en') break;
			}
		}
		var hash = location.hash.slice(1);
		hash = legacy[hash] || hash;
		location.replace('/' + lang + '/' + location.search + (hash ? '#' + hash : ''));
	})();`;

	// a literal closing tag would end this component's own <script> block
	const redirectTag = '<script>' + redirect + '</' + 'script>';
	const noscriptTag = `<noscript><meta http-equiv="refresh" content="0; url=/${SITE_DEFAULT_LOCALE}/" /></noscript>`;
</script>

<svelte:head>
	<title>Anuar Beibit — AI-native engineer · Ануар Бейбит — AI-разработчик</title>
	<meta
		name="description"
		content="Anuar Beibit, AI-native full-stack engineer: AI agents, LLM features, React and Node.js. English and Russian versions."
	/>
	<link rel="canonical" href={localeUrl(SITE_DEFAULT_LOCALE)} />
	<!-- both tags are fixed strings from this file, no outside input -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html noscriptTag}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html redirectTag}
</svelte:head>

<main class="gate">
	<p class="gate-name">Anuar Beibit · Ануар Бейбит</p>
	<p class="gate-role">AI-native engineer · AI-native разработчик</p>
	<nav class="gate-links" aria-label="Language / Язык">
		<a href="/en/" hreflang="en" lang="en">English</a>
		<a href="/ru/" hreflang="ru" lang="ru">Русский</a>
	</nav>
</main>

<style>
	.gate {
		min-height: 100vh;
		display: grid;
		place-content: center;
		gap: 12px;
		padding: 24px;
		text-align: center;
	}

	.gate-name {
		font-size: clamp(1.75rem, 5vw, 2.75rem);
		font-weight: 800;
		letter-spacing: -0.03em;
	}

	.gate-role {
		color: var(--text-dim);
	}

	.gate-links {
		display: flex;
		justify-content: center;
		gap: 12px;
		margin-top: 12px;
	}

	.gate-links a {
		padding: 12px 24px;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}

	.gate-links a:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
