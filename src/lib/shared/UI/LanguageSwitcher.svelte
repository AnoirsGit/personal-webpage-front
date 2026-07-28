<script>
	import '$lib/app/styles/UI/language-switcher.css';
	import { LOCALES, locale, setLocale, t } from '$lib/shared/i18n';

	export let size = 'md';

	$: activeIndex = LOCALES.findIndex(({ code }) => code === $locale);
</script>

<div
	class="lang-switch lang-switch-{size}"
	role="group"
	aria-label={$t('language.label')}
	style="--lang-count: {LOCALES.length}; --lang-active: {Math.max(activeIndex, 0)}"
>
	<span class="lang-thumb" aria-hidden="true" />
	{#each LOCALES as { code, label, name }}
		<button
			type="button"
			class="lang-option"
			class:active={$locale === code}
			lang={code}
			aria-pressed={$locale === code}
			title={$t('language.switchTo', { name })}
			on:click={() => setLocale(code)}
		>
			{label}
		</button>
	{/each}
</div>
