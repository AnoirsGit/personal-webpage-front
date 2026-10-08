<script>
	import { t } from '$lib/shared/i18n';
	import { PERSON } from '$lib/seo/site.js';

	const year = new Date().getFullYear();
	const LINKS = ['skills', 'process', 'works', 'offer', 'faq', 'contact'];
</script>

<footer class="site-footer">
	<div class="wrap inner">
		<p class="rights">{$t('footer.rights', { year })}</p>
		<nav aria-label={$t('a11y.sections')}>
			<ul>
				{#each LINKS as id}
					<li><a href="#{id}">{$t(`nav.${id}`)}</a></li>
				{/each}
			</ul>
		</nav>
		<p class="made">
			<a href={PERSON.repo} target="_blank" rel="noopener">{$t('footer.code')}</a>
			<span aria-hidden="true">·</span>
			{$t('footer.builtWith')}
		</p>
	</div>
</footer>

<style>
	.site-footer {
		position: relative;
		border-top: 1px solid var(--line);
		background: rgba(2, 3, 9, 0.82);
	}

	.inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px 32px;
		padding-block: 28px;
		font-size: 0.9375rem;
		color: var(--text-faint);
	}

	nav ul {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
		list-style: none;
	}

	nav a,
	.made a {
		color: var(--text-dim);
		text-decoration: none;
	}

	nav a:hover,
	.made a:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	.made {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
