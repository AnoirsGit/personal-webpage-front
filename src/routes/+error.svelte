<!-- Unknown paths: the 404.html fallback renders this. The language is guessed from the path. -->
<script>
	import { page } from '$app/stores';
	import { translate } from '$lib/shared/i18n';

	$: code = $page.url.pathname.startsWith('/ru') ? 'ru' : 'en';
	$: tr = (key) => translate(code, key);
	$: notFound = $page.status === 404;
</script>

<svelte:head>
	<title>{$page.status} — {notFound ? tr('notFound.title') : $page.error?.message}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="error" lang={code}>
	<p class="status">{$page.status}</p>
	<h1>{notFound ? tr('notFound.title') : $page.error?.message}</h1>
	<p class="text">{tr('notFound.text')}</p>
	<nav class="links">
		<a href="/en/" hreflang="en" lang="en">English</a>
		<a href="/ru/" hreflang="ru" lang="ru">Русский</a>
	</nav>
</main>

<style>
	.error {
		min-height: 100vh;
		display: grid;
		place-content: center;
		gap: 12px;
		padding: 24px;
		text-align: center;
	}

	.status {
		font-size: clamp(4rem, 14vw, 8rem);
		font-weight: 800;
		line-height: 1;
		color: var(--accent);
	}

	h1 {
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		font-weight: 800;
	}

	.text {
		color: var(--text-dim);
	}

	.links {
		display: flex;
		justify-content: center;
		gap: 12px;
		margin-top: 8px;
	}

	.links a {
		padding: 12px 24px;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}

	.links a:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
