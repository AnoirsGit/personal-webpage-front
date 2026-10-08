<!-- The closing call to action and every channel, as plain links (mailto:, tel:, t.me). -->
<script>
	import { t } from '$lib/shared/i18n';
	import { PERSON } from '$lib/seo/site.js';
	import SectionHead from './ui/SectionHead.svelte';
	import Icon from './ui/Icon.svelte';
	import magnetic from './ui/magnetic.js';

	const telegramUrl = `https://t.me/${PERSON.telegram}`;

	$: channels = [
		{
			icon: 'telegram',
			label: $t('contact.telegram'),
			value: `@${PERSON.telegram}`,
			href: telegramUrl,
			external: true
		},
		{
			icon: 'mail',
			label: $t('contact.email'),
			value: PERSON.email,
			href: `mailto:${PERSON.email}`
		},
		{
			icon: 'phone',
			label: $t('contact.phone'),
			value: PERSON.phoneDisplay,
			href: `tel:${PERSON.phone}`
		},
		{
			icon: 'linkedin',
			label: $t('contact.linkedin'),
			value: 'Anoir Beibit',
			href: PERSON.linkedin,
			external: true
		},
		{
			icon: 'github',
			label: $t('contact.github'),
			value: 'AnoirsGit',
			href: PERSON.github,
			external: true
		},
		{
			icon: 'file',
			label: $t('contact.cv'),
			value: $t('contact.cvValue'),
			href: PERSON.cv,
			external: true
		}
	];
</script>

<section id="contact" class="stage contact" aria-labelledby="contact-title">
	<div class="wrap">
		<div class="contact-card">
			<div class="contact-main">
				<SectionHead
					id="contact-title"
					index="06"
					kicker={$t('contact.kicker')}
					titleLead={$t('contact.titleLead')}
					titleAccent={$t('contact.titleAccent')}
					lead={$t('contact.lead')}
				/>
				<div class="contact-ctas">
					<a class="btn btn-primary" href={telegramUrl} target="_blank" rel="noopener" use:magnetic>
						<Icon name="telegram" />
						{$t('contact.telegramCta')}
					</a>
					<a class="btn btn-ghost" href="mailto:{PERSON.email}" use:magnetic>
						<Icon name="mail" />
						{$t('contact.emailCta')}
					</a>
				</div>
			</div>

			<div class="contact-side">
				<div class="person">
					<img
						class="avatar"
						src="/images/anuar-avatar.webp"
						alt={$t('contact.avatarAlt')}
						width="160"
						height="160"
						loading="lazy"
						decoding="async"
					/>
					<p class="where">
						<Icon name="pin" size={18} />
						{$t('contact.where')}
					</p>
				</div>

				<ul class="channels">
					{#each channels as channel (channel.icon)}
						<li>
							<span class="channel-icon"><Icon name={channel.icon} size={18} /></span>
							<span class="channel-label">{channel.label}</span>
							<a
								class="channel-value"
								href={channel.href}
								target={channel.external ? '_blank' : undefined}
								rel={channel.external ? 'noopener' : undefined}
							>
								{channel.value}
								{#if channel.external}<span class="sr-only">({$t('a11y.newTab')})</span>{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>

<style>
	.contact-card {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
		gap: clamp(28px, 5vw, 64px);
		padding: clamp(26px, 5vw, 60px);
		border: 1px solid rgba(232, 199, 126, 0.35);
		border-radius: calc(var(--radius) + 8px);
		background: radial-gradient(600px 320px at 0% 0%, rgba(232, 199, 126, 0.1), transparent 70%),
			var(--panel);
		box-shadow: 0 0 80px -40px var(--accent-glow);
	}

	.contact-main :global(.section-head) {
		margin-bottom: 0;
	}

	.contact-ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 30px;
	}

	.person {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-bottom: 22px;
	}

	.avatar {
		width: 88px;
		height: 88px;
		flex: none;
		border-radius: 50%;
		object-fit: cover;
		background: var(--panel-solid);
		border: 1px solid var(--line-strong);
		box-shadow: 0 0 0 4px rgba(232, 199, 126, 0.1);
	}

	.where {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		color: var(--text-dim);
	}

	.channels {
		list-style: none;
		border-top: 1px solid var(--line);
	}

	.channels li {
		display: grid;
		grid-template-columns: 22px 110px minmax(0, 1fr);
		align-items: center;
		gap: 12px;
		padding: 13px 0;
		border-bottom: 1px solid var(--line);
	}

	.channel-icon {
		display: grid;
		place-items: center;
		color: var(--accent);
	}

	.channel-label {
		font-size: 0.9375rem;
		color: var(--text-faint);
	}

	.channel-value {
		overflow-wrap: anywhere;
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}

	.channel-value:hover {
		color: var(--accent-bright);
		text-decoration: underline;
	}

	@media (max-width: 900px) {
		.contact-card {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		.channels li {
			grid-template-columns: 22px minmax(0, 1fr);
			row-gap: 2px;
		}

		.channel-icon {
			grid-row: 1 / span 2;
		}

		.contact-ctas :global(.btn) {
			flex: 1 1 100%;
		}
	}
</style>
