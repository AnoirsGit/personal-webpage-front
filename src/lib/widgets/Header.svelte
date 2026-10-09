<!--
	Fixed header: brand, section links with the current one highlighted, the
	language switch (real links to /en/ and /ru/, so crawlers follow them too),
	the call to action and a reading-progress hairline. Phones get a menu panel.
-->
<script>
	import { onMount } from 'svelte';

	import { LOCALES, locale, rememberLocale, t } from '$lib/shared/i18n';
	import Icon from '$lib/sections/ui/Icon.svelte';

	const LINKS = ['skills', 'process', 'works', 'offer', 'faq', 'contact'];

	let open = false;
	let active = '';
	let progress = 0;
	let frame = 0;

	const close = () => (open = false);

	const onScroll = () => {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
		});
	};

	const onKey = (event) => {
		if (event.key === 'Escape') close();
	};

	// the other language opens at the same section
	$: localeHref = (code) => `/${code}/${active ? `#${active}` : ''}`;

	onMount(() => {
		onScroll();
		const sections = ['hero', ...LINKS].map((id) => document.getElementById(id)).filter(Boolean);
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) active = entry.target.id === 'hero' ? '' : entry.target.id;
				}
			},
			{ rootMargin: '-40% 0px -55% 0px' }
		);
		sections.forEach((section) => observer.observe(section));
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<svelte:window on:scroll={onScroll} on:keydown={onKey} />

<header class="site-header" class:open data-scene-occlude>
	<div class="wrap bar">
		<a class="brand" href="#hero" on:click={close}>
			<img src="/images/logo.svg" alt="" width="32" height="32" />
			<span>{$t('meta.siteName')}</span>
		</a>

		<nav class="nav" aria-label={$t('a11y.sections')}>
			<ul>
				{#each LINKS as id}
					<li>
						<a
							href="#{id}"
							class:active={active === id}
							aria-current={active === id ? 'true' : undefined}
						>
							{$t(`nav.${id}`)}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="tools">
			<div class="lang" role="group" aria-label={$t('a11y.language')}>
				{#each LOCALES as { code, label, name }}
					<a
						href={localeHref(code)}
						hreflang={code}
						lang={code}
						class:current={$locale === code}
						aria-current={$locale === code ? 'page' : undefined}
						title={$t('a11y.switchTo', { name })}
						on:click={() => rememberLocale(code)}>{label}</a
					>
				{/each}
			</div>
			<a class="btn btn-primary cta" href="#contact">{$t('nav.cta')}</a>
			<button
				type="button"
				class="menu-button"
				aria-expanded={open}
				aria-controls="mobile-menu"
				aria-label={open ? $t('a11y.closeMenu') : $t('a11y.menu')}
				on:click={() => (open = !open)}
			>
				<Icon name={open ? 'close' : 'menu'} size={22} />
			</button>
		</div>
	</div>

	<div id="mobile-menu" class="mobile-menu" hidden={!open}>
		<ul class="wrap">
			{#each LINKS as id}
				<li><a href="#{id}" on:click={close}>{$t(`nav.${id}`)}</a></li>
			{/each}
		</ul>
	</div>

	<div class="progress" style:transform="scaleX({progress})" aria-hidden="true" />
</header>

<style>
	.site-header {
		position: fixed;
		inset: 0 0 auto;
		z-index: 50;
		background: rgba(5, 6, 13, 0.72);
		border-bottom: 1px solid var(--line);
		backdrop-filter: blur(14px) saturate(140%);
		-webkit-backdrop-filter: blur(14px) saturate(140%);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		height: var(--header-h);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-weight: 800;
		font-size: 1.0625rem;
		letter-spacing: -0.01em;
		color: var(--text);
		text-decoration: none;
	}

	.brand:hover {
		color: var(--text);
	}

	.brand img {
		width: 32px;
		height: 32px;
	}

	.nav ul {
		display: flex;
		gap: clamp(14px, 2vw, 28px);
		list-style: none;
	}

	.nav a {
		position: relative;
		padding: 6px 0;
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-dim);
		text-decoration: none;
	}

	.nav a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -2px;
		height: 2px;
		border-radius: 2px;
		background: var(--accent);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.35s var(--ease);
	}

	.nav a:hover,
	.nav a.active {
		color: var(--text);
	}

	.nav a:hover::after,
	.nav a.active::after {
		transform: scaleX(1);
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.lang {
		display: inline-flex;
		padding: 3px;
		border: 1px solid var(--line);
		border-radius: 999px;
	}

	.lang a {
		display: grid;
		place-items: center;
		min-width: 40px;
		min-height: 34px;
		padding: 0 10px;
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-dim);
		text-decoration: none;
	}

	.lang a:hover {
		color: var(--text);
	}

	.lang a.current {
		background: var(--accent);
		color: var(--accent-ink);
	}

	.cta {
		min-height: 42px;
		padding: 0 18px;
		font-size: 0.9375rem;
	}

	.menu-button {
		display: none;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid var(--line);
		border-radius: 12px;
		color: var(--text);
	}

	.mobile-menu ul {
		display: grid;
		gap: 4px;
		padding-block: 8px 18px;
		list-style: none;
	}

	.mobile-menu a {
		display: block;
		padding: 12px 0;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
		border-bottom: 1px solid var(--line);
	}

	.progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 2px;
		transform-origin: left;
		background: var(--accent);
		box-shadow: 0 0 10px var(--accent-glow);
		pointer-events: none;
	}

	@media (max-width: 1080px) {
		.nav,
		.cta {
			display: none;
		}

		.menu-button {
			display: grid;
		}
	}

	@media (min-width: 1081px) {
		.mobile-menu {
			display: none;
		}
	}
</style>
