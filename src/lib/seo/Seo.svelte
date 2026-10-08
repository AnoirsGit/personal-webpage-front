<!--
	Everything a crawler or a link preview reads from <head>, per language:
	title and description, canonical, hreflang for both versions plus x-default,
	Open Graph and Twitter cards, and the JSON-LD graph.
-->
<script>
	import { LOCALES, t } from '$lib/shared/i18n';
	import {
		SITE_LOCALES,
		SITE_DEFAULT_LOCALE,
		OG_IMAGE,
		PERSON,
		localeUrl,
		absoluteUrl
	} from './site.js';
	import { buildJsonLd, serializeJsonLd } from './jsonld.js';

	/** @type {'en' | 'ru'} */
	export let lang;
	export let groups = [];
	export let facts = {};

	$: url = localeUrl(lang);
	$: title = $t('meta.title');
	$: description = $t('meta.description');
	$: ogTitle = $t('meta.ogTitle');
	$: ogDescription = $t('meta.ogDescription');
	$: image = absoluteUrl(OG_IMAGE.path(lang));
	$: ogLocale = LOCALES.find(({ code }) => code === lang)?.ogLocale;
	$: ogAlternates = LOCALES.filter(({ code }) => code !== lang).map(({ ogLocale }) => ogLocale);

	// a literal closing tag would end this component's own <script> block
	$: jsonLd =
		'<script type="application/ld+json">' +
		serializeJsonLd(buildJsonLd(lang, { groups, facts })) +
		'</' +
		'script>';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content={PERSON.name} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<link rel="canonical" href={url} />
	{#each SITE_LOCALES as code}
		<link rel="alternate" hreflang={code} href={localeUrl(code)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={localeUrl(SITE_DEFAULT_LOCALE)} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={$t('meta.siteName')} />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:image" content={image} />
	<meta property="og:image:type" content={OG_IMAGE.type} />
	<meta property="og:image:width" content={String(OG_IMAGE.width)} />
	<meta property="og:image:height" content={String(OG_IMAGE.height)} />
	<meta property="og:image:alt" content={$t('meta.ogImageAlt')} />
	<meta property="og:locale" content={ogLocale} />
	{#each ogAlternates as alternate}
		<meta property="og:locale:alternate" content={alternate} />
	{/each}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={$t('meta.ogImageAlt')} />

	<!-- built from our own data and serialized with "<" escaped (serializeJsonLd) -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLd}
</svelte:head>
