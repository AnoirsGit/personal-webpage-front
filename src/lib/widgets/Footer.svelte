<script>
	import Icon from '@iconify/svelte';
	import '$lib/app/styles/footer.css';
	import { t } from '$lib/shared/i18n';

	const year = new Date().getFullYear();

	const navLinks = [
		{ key: 'about', link: '#about-me' },
		{ key: 'skills', link: '#skills' },
		{ key: 'works', link: '#works' },
		{ key: 'contacts', link: '#contacts' }
	];

	const socials = [
		{ icon: 'mdi:github', href: 'https://github.com/AnoirsGit', label: 'GitHub' },
		{
			icon: 'mdi:linkedin',
			href: 'https://www.linkedin.com/in/anoir-beibit-73218a215/',
			label: 'LinkedIn'
		},
		{ icon: 'basil:telegram-solid', href: 'https://t.me/NoirBegula', label: 'Telegram' },
		{ icon: 'ic:baseline-email', href: 'mailto:anoirsmail@gmail.com', label: 'Email' }
	];
</script>

<footer class="app-footer">
	<div class="footer-inner">
		<div class="footer-top">
			<div class="footer-brand">
				<div class="brand-row">
					<img src="images/logo.svg" alt="" />
					<span class="text-xl font-bold tracking-tight text-gradient-heading">Anuar</span>
				</div>
				<p class="footer-tagline">{$t('footer.tagline')}</p>
			</div>
			<nav class="footer-nav" aria-label={$t('footer.aria')}>
				<span class="footer-heading">{$t('footer.navigation')}</span>
				{#each navLinks as { key, link }}
					<a href={link}>{$t(`nav.${key}`)}</a>
				{/each}
			</nav>
			<div class="footer-nav">
				<span class="footer-heading">{$t('footer.connect')}</span>
				<div class="footer-socials">
					{#each socials as { icon, href, label }}
						<a class="footer-social-link" {href} target="_blank" rel="noreferrer" aria-label={label}>
							<Icon {icon} />
						</a>
					{/each}
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<p>{$t('footer.rights', { year })}</p>
			<p>{$t('footer.builtWith')}</p>
		</div>
	</div>
</footer>
