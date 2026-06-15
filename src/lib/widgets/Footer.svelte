<script>
	import Icon from '@iconify/svelte';
	import '$lib/app/styles/footer.css';

	const year = new Date().getFullYear();

	const navLinks = [
		{ label: 'About me', link: '#about-me' },
		{ label: 'Skills', link: '#skills' },
		{ label: 'Works', link: '#works' },
		{ label: 'Contacts', link: '#contacts' }
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
				<p class="footer-tagline">
					Full-stack developer crafting scalable backends and playful, interactive frontends.
				</p>
			</div>
			<nav class="footer-nav" aria-label="Footer">
				<span class="footer-heading">Navigation</span>
				{#each navLinks as { label, link }}
					<a href={link}>{label}</a>
				{/each}
			</nav>
			<div class="footer-nav">
				<span class="footer-heading">Let's connect</span>
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
			<p>© {year} Anuar Beibit. All rights reserved.</p>
			<p>Built with SvelteKit & Three.js</p>
		</div>
	</div>
</footer>
